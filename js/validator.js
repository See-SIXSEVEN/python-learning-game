// Python Mini-IDE Execution Engine using Skulpt (Open Sandbox Mode)
// No hardcoded judging - Allows students to write any valid Python code

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
            __future__: Sk.python3
        });
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

        const outputCollector = { text: "" };
        this.setupSkulpt(outputCollector);

        try {
            await Sk.misceval.asyncToPromise(() => {
                return Sk.importMainWithBody("<stdin>", false, code, true);
            });

            return {
                success: true,
                output: outputCollector.text,
                error: null
            };
        } catch (err) {
            let errorMsg = err.toString();
            let friendlyTip = "";

            if (errorMsg.includes("SyntaxError")) {
                if (code.includes("Print(")) {
                    friendlyTip = "\n💡 แนะนำ: ภาษา Python ตัวพิมพ์เล็ก-ใหญ่มีผล (Case-sensitive) ตรวจสอบว่าใช้ print() เป็นตัวพิมพ์เล็กทั้งหมดหรือไม่";
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
                feedback: "⚠️ โค้ดยังมี Error กรุณาแก้ไขตามข้อความแจ้งเตือนด้านล่างก่อนส่งงาน",
                checklistResults: [
                    { id: "c1", passed: false },
                    { id: "c2", passed: false },
                    { id: "c3", passed: false }
                ]
            };
        }

        const trimmedOutput = (result.output || "").trim();
        const hasOutput = trimmedOutput.length > 0;

        return {
            success: true,
            error: null,
            output: result.output,
            feedback: "🎉 โค้ดทำงานสำเร็จ! บันทึกคำตอบส่งให้คุณครูเรียบร้อยแล้ว",
            checklistResults: [
                { id: "c1", passed: code.trim().length > 0 },
                { id: "c2", passed: hasOutput },
                { id: "c3", passed: result.success }
            ]
        };
    }
}

if (typeof window !== 'undefined') {
    window.questValidator = new QuestValidator();
}
