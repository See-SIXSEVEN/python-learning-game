// Python Mini-IDE Execution Engine using Skulpt (Open Sandbox Mode)
// Enhanced to support Thai variable names, Smart Quotes, and safe input()

class QuestValidator {
    constructor() {
        this.isSkulptReady = typeof Sk !== 'undefined';
    }

    // Configure Skulpt environment
    setupSkulpt(outputCollector) {
        if (typeof Sk === 'undefined') {
            throw new Error("Skulpt runtime is not loaded");
        }

        Sk.configure({
            output: (text) => {
                outputCollector.text += text;
            },
            read: (filename) => {
                if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][filename] === undefined) {
                    throw "File not found: '" + filename + "'";
                }
                return Sk.builtinFiles["files"][filename];
            },
            inputfun: (prompt) => {
                return (typeof window !== 'undefined' && window.prompt ? window.prompt(prompt || "กรุณากรอกข้อมูล (input):") : "") || "";
            },
            inputfunTakesPrompt: true,
            __future__: Sk.python3
        });
    }

    // Preprocess Python code:
    // 1. Normalize smart quotes (“ ” ‘ ’) to standard (" ')
    // 2. Auto-normalize beginner mistakes like print = (...) or print = ... to print(...)
    // 3. Map valid Thai identifiers to safe ASCII tokens so Skulpt can parse them
    preprocessPythonCode(source) {
        if (!source) return { code: source, reverseMap: new Map() };

        // Normalize smart quotes
        let code = source.replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB]/g, '"')
                         .replace(/[\u2018\u2019\u201A\u201B]/g, "'");

        // Normalize print = (...) or print = value to print(...)
        code = code.replace(/^(\s*)print\s*=\s*\(([\s\S]+?)\)\s*$/gm, '$1print($2)')
                   .replace(/^(\s*)print\s*=\s*([^=;\n]+?)\s*$/gm, '$1print($2)');

        const thaiVarMap = new Map();
        const reverseMap = new Map();
        let varCounter = 0;

        function getSafeName(thaiName) {
            if (!thaiVarMap.has(thaiName)) {
                const safeName = `_th_v${++varCounter}_`;
                thaiVarMap.set(thaiName, safeName);
                reverseMap.set(safeName, thaiName);
            }
            return thaiVarMap.get(thaiName);
        }

        // Token regex separating comments, strings (regular and f-strings), number-leading tokens, and identifiers
        const tokenRegex = /(#[^\n]*)|((?:[furbFURB]{1,2})?(?:"""[\s\S]*?"""|'''[\s\S]*?'''))|((?:[furbFURB]{1,2})?(?:"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'))|([0-9]+[a-zA-Z_\u0E00-\u0E7F][a-zA-Z0-9_\u0E00-\u0E7F]*)|([a-zA-Z_\u0E00-\u0E7F][a-zA-Z0-9_\u0E00-\u0E7F]*)|([\s\S])/g;

        let result = '';
        let match;

        while ((match = tokenRegex.exec(code)) !== null) {
            const [full, comment, tripleStr, singleStr, numLeadingWord, identifier, other] = match;

            if (comment) {
                result += comment;
            } else if (tripleStr || singleStr) {
                const strVal = tripleStr || singleStr;
                const isFString = /^[fF]/.test(strVal);
                if (isFString) {
                    // Inside f-strings, expressions within { ... } may contain Thai variables
                    const fstringTransformed = strVal.replace(/\{([^{}]+)\}/g, (fmatch, expr) => {
                        const exprTransformed = expr.replace(/[a-zA-Z_\u0E00-\u0E7F][a-zA-Z0-9_\u0E00-\u0E7F]*/g, (id) => {
                            if (/[\u0E00-\u0E7F]/.test(id)) {
                                return getSafeName(id);
                            }
                            return id;
                        });
                        return '{' + exprTransformed + '}';
                    });
                    result += fstringTransformed;
                } else {
                    result += strVal;
                }
            } else if (numLeadingWord) {
                // Starts with a number (e.g. 1กว้าง, 2x) -> Leave as-is so Python SyntaxError fires correctly
                result += numLeadingWord;
            } else if (identifier) {
                if (/[\u0E00-\u0E7F]/.test(identifier)) {
                    result += getSafeName(identifier);
                } else {
                    result += identifier;
                }
            } else {
                result += other;
            }
        }

        return { code: result, reverseMap };
    }

    // Restore original Thai variable names in error messages
    restoreErrorMsg(errorMsg, reverseMap) {
        if (!errorMsg || !reverseMap) return errorMsg;
        let restored = errorMsg;
        reverseMap.forEach((thaiName, safeName) => {
            restored = restored.split(safeName).join(thaiName);
        });
        return restored;
    }

    // Execute Python code in Skulpt asynchronously
    async runCode(code) {
        if (!code || !code.trim()) {
            return {
                success: false,
                output: "",
                error: "⚠️ ยังไม่มีโค้ดในหน้าต่าง Code Editor กรุณาเขียนโค้ดก่อนกดรัน"
            };
        }

        const { code: processedCode, reverseMap } = this.preprocessPythonCode(code);
        const outputCollector = { text: "" };
        this.setupSkulpt(outputCollector);

        try {
            await Sk.misceval.asyncToPromise(() => {
                return Sk.importMainWithBody("<stdin>", false, processedCode, true);
            });

            return {
                success: true,
                output: outputCollector.text,
                error: null
            };
        } catch (err) {
            let errorMsg = this.restoreErrorMsg(err.toString(), reverseMap);
            errorMsg = errorMsg.replace(/bad token T_OP/g, "invalid syntax");
            let friendlyTip = "";

            if (errorMsg.includes("SyntaxError")) {
                if (code.includes("Print(")) {
                    friendlyTip = "\n💡 แนะนำ: ภาษา Python ตัวพิมพ์เล็ก-ใหญ่มีผล (Case-sensitive) ตรวจสอบว่าใช้ print() เป็นตัวพิมพ์เล็กทั้งหมดหรือไม่";
                } else if (/(\b|[_\s=+\-*/(])[0-9]+[a-zA-Z_\u0E00-\u0E7F]/.test(code)) {
                    friendlyTip = "\n💡 แนะนำ: ห้ามตั้งชื่อตัวแปรขึ้นต้นด้วยตัวเลข (เช่น 1x, 2ราคา หรือ 1กว้าง เป็นไวยากรณ์ที่ผิด)";
                } else if (/print\s*=/.test(code)) {
                    friendlyTip = "\n💡 แนะนำ: คำสั่ง print ต้องใช้วงเล็บ เช่น print(...) ไม่ใช้เครื่องหมายเท่ากับ print = (...)";
                } else {
                    friendlyTip = "\n💡 แนะนำ: ตรวจสอบไวยากรณ์ เช่น ลืมปิดวงเล็บ ), ลืมปิดเครื่องหมายคำพูด \" หรือการสะกดคำสั่ง";
                }
            } else if (errorMsg.includes("NameError")) {
                friendlyTip = "\n💡 แนะนำ: มีการเรียกใช้ชื่อตัวแปรที่ยังไม่ได้กำหนดค่า หรือสะกดชื่อตัวแปรผิด";
            } else if (errorMsg.includes("TypeError")) {
                friendlyTip = "\n💡 แนะนำ: ชนิดข้อมูลไม่ตรงกัน เช่น นำข้อความ (str) มาบวกลบคูณหารกับตัวเลขโดยตรง";
            } else if (errorMsg.includes("ZeroDivisionError")) {
                friendlyTip = "\n💡 แนะนำ: ในทางคณิตศาสตร์ ตัวหารต้องไม่เป็นศูนย์ (0)";
            }

            return {
                success: false,
                output: outputCollector.text,
                error: errorMsg + friendlyTip
            };
        }
    }

    // Validate Quest for Submission
    // Open-ended: If code runs without error and produces output, it's considered ready to submit
    async validateQuest(questId, code) {
        const result = await this.runCode(code);

        if (!result.success) {
            return {
                success: false,
                error: result.error,
                output: result.output,
                feedback: "⚠️ โค้ดยังมี Error กรุณาแก้ไขตามข้อความแจ้งเตือนด้านล่างก่อนส่งงาน"
            };
        }

        return {
            success: true,
            error: null,
            output: result.output,
            feedback: "🎉 โค้ดทำงานสำเร็จ! บันทึกคำตอบส่งให้คุณครูเรียบร้อยแล้ว"
        };
    }
}

if (typeof window !== 'undefined') {
    window.questValidator = new QuestValidator();
}
