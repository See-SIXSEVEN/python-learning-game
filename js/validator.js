// Code Execution & Quest Verification Engine using Skulpt

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
            // Translate common Python errors into friendly Thai guidance for M.3 students
            let friendlyTip = "";
            if (errorMsg.includes("SyntaxError")) {
                if (code.includes("Print(")) {
                    friendlyTip = "\n💡 แนะนำ: ภาษา Python ตัวพิมพ์เล็ก-ใหญ่มีความหมายต่างกัน ตรวจสอบว่าใช้ print() เป็นตัวพิมพ์เล็กหรือไม่";
                } else if (!code.includes(",") && (code.includes('"') || code.includes("'"))) {
                    friendlyTip = "\n💡 แนะนำ: ตรวจสอบเครื่องหมายจุลภาค (,) ระหว่างข้อความกับตัวแปร";
                } else {
                    friendlyTip = "\n💡 แนะนำ: ไวยากรณ์ไม่ถูกต้อง ตรวจสอบเครื่องหมายคำพูด วงเล็บปิด หรือการสะกดคำสั่ง";
                }
            } else if (errorMsg.includes("NameError")) {
                friendlyTip = "\n💡 แนะนำ: มีการเรียกใช้ชื่อตัวแปรหรือคำสั่งที่ระบบไม่รู้จัก ตรวจสอบตัวสะกดหรือสร้างตัวแปรก่อนเรียกใช้";
            } else if (errorMsg.includes("TypeError")) {
                friendlyTip = "\n💡 แนะนำ: ชนิดข้อมูลไม่ตรงกัน เช่น นำข้อความ (str) มาคำนวณกับตัวเลข (int) โดยตรง";
            }

            return {
                success: false,
                output: outputCollector.text,
                error: errorMsg + friendlyTip
            };
        }
    }

    // Validate a specific Quest's requirements
    async validateQuest(questId, code) {
        const quest = window.QUESTS.find(q => q.id === questId);
        if (!quest) {
            return { success: false, error: "ไม่พบภารกิจที่ระบุ", checklistResults: [] };
        }

        // 1. Run the code
        const runResult = await this.runCode(code);
        const rawOutput = runResult.output;
        const cleanOutput = rawOutput.trim();
        const lines = cleanOutput.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        const checklistResults = [];
        let allPassed = false;
        let feedback = "";

        // Normalize code for structural checks
        const cleanCode = code.replace(/\r\n/g, '\n');
        const codeLines = cleanCode.split('\n');

        switch (questId) {
            case 1: { // print("Hello, Python!")
                const c1 = /print\s*\(/.test(code) && !/Print\s*\(/.test(code);
                const c2 = /["'].*?Hello,\s*Python!.*?["']/.test(code);
                const c3 = cleanOutput === "Hello, Python!";

                checklistResults.push({ id: "c1", passed: c1, message: c1 ? "ใช้ฟังก์ชัน print() ถูกต้อง" : "ต้องใช้คำสั่ง print() (ตัวพิมพ์เล็กทั้งหมด)" });
                checklistResults.push({ id: "c2", passed: c2, message: c2 ? "ครอบข้อความด้วยเครื่องหมายคำพูดถูกต้อง" : "ใส่เครื่องหมายคำพูดครอบ \"Hello, Python!\"" });
                checklistResults.push({ id: "c3", passed: c3, message: c3 ? "ผลลัพธ์แสดง Hello, Python! ถูกต้อง" : `ผลลัพธ์ยังไม่ตรง (ได้: '${cleanOutput || 'ไม่มีผลลัพธ์'}')` });
                allPassed = c1 && c2 && c3 && runResult.success;
                break;
            }

            case 2: { // # นินจาไพทอน + print("พร้อมลุย!")
                const hasComment = codeLines.some(line => /#.*นินจาไพทอน/.test(line));
                const hasPrint = /print\s*\(\s*["']พร้อมลุย!["']\s*\)/.test(code);
                const outputMatches = cleanOutput === "พร้อมลุย!";

                checklistResults.push({ id: "c1", passed: hasComment, message: hasComment ? "มีคอมเมนต์ # นินจาไพทอน" : "ต้องมีบรรทัดคอมเมนต์ขึ้นต้นด้วย # นินจาไพทอน" });
                checklistResults.push({ id: "c2", passed: hasPrint, message: hasPrint ? "ใช้คำสั่ง print() แสดง 'พร้อมลุย!'" : "ใช้ print(\"พร้อมลุย!\")" });
                checklistResults.push({ id: "c3", passed: outputMatches, message: outputMatches ? "ผลลัพธ์แสดงเฉพาะ 'พร้อมลุย!' สำเร็จ" : "ผลลัพธ์ต้องเป็น 'พร้อมลุย!'" });
                allPassed = hasComment && hasPrint && outputMatches && runResult.success;
                break;
            }

            case 3: { // print(10 + 20) and print(5 * 4)
                const usesMathOps = code.includes('+') && code.includes('*');
                const noHardcodedStrings = !/print\s*\(\s*["']30["']\s*\)/.test(code) && !/print\s*\(\s*["']20["']\s*\)/.test(code);
                const firstIs30 = lines.length >= 1 && lines[0] === "30";
                const secondIs20 = lines.length >= 2 && lines[1] === "20";
                const outputMatches = firstIs30 && secondIs20;

                checklistResults.push({ id: "c1", passed: usesMathOps && lines.length >= 2, message: usesMathOps ? "ใช้ตัวดำเนินการ + และ * ในการคำนวณ" : "อย่าลืมใช้เครื่องหมาย + และ *" });
                checklistResults.push({ id: "c2", passed: noHardcodedStrings, message: noHardcodedStrings ? "ไม่ได้ใส่เครื่องหมายคำพูดครอบสูตรเลข" : "ห้ามใส่เครื่องหมายคำพูดครอบตัวเลข เพื่อให้ไพทอนคำนวณจริง" });
                checklistResults.push({ id: "c3", passed: outputMatches, message: outputMatches ? "ผลลัพธ์แสดง 30 และ 20 ครบ 2 บรรทัด" : "ผลลัพธ์ต้องเป็น 30 ในบรรทัดแรก และ 20 ในบรรทัดที่สอง" });
                allPassed = usesMathOps && noHardcodedStrings && outputMatches && runResult.success;
                break;
            }

            case 4: { // print("คะแนนสอบของฉันคือ", 95, "คะแนน")
                const hasComma = /print\s*\([^)]*,[^)]*\)/.test(code);
                const has95 = /95/.test(code);
                const outputMatches = cleanOutput === "คะแนนสอบของฉันคือ 95 คะแนน";

                checklistResults.push({ id: "c1", passed: hasComma, message: hasComma ? "มีเครื่องหมายจุลภาค (,) คั่นข้อมูลใน print()" : "ใช้เครื่องหมายจุลภาค (,) คั่นระหว่างข้อความกับตัวเลข" });
                checklistResults.push({ id: "c2", passed: has95, message: has95 ? "มีค่า 95 และข้อความครบถ้วน" : "ระบุค่า 95 และข้อความให้ครบ" });
                checklistResults.push({ id: "c3", passed: outputMatches, message: outputMatches ? "ผลลัพธ์แสดง 'คะแนนสอบของฉันคือ 95 คะแนน'" : "ผลลัพธ์ต้องเป็น 'คะแนนสอบของฉันคือ 95 คะแนน'" });
                allPassed = hasComma && has95 && outputMatches && runResult.success;
                break;
            }

            case 5: { // name = "กอน" ; power = 100 ; print(name, power)
                const hasNameVar = /name\s*=\s*["']กอน["']/.test(code);
                const hasPowerVar = /power\s*=\s*100\b/.test(code);
                const outputMatches = cleanOutput.includes("กอน") && cleanOutput.includes("100");

                checklistResults.push({ id: "c1", passed: hasNameVar, message: hasNameVar ? "สร้างตัวแปร name = \"กอน\" ถูกต้อง" : "สร้างตัวแปร name = \"กอน\"" });
                checklistResults.push({ id: "c2", passed: hasPowerVar, message: hasPowerVar ? "สร้างตัวแปร power = 100 ถูกต้อง" : "สร้างตัวแปร power = 100" });
                checklistResults.push({ id: "c3", passed: outputMatches, message: outputMatches ? "พิมพ์ค่าตัวแปรทั้งสองสำเร็จ" : "ใช้ print(name, power) เพื่อแสดงผล" });
                allPassed = hasNameVar && hasPowerVar && outputMatches && runResult.success;
                break;
            }

            case 6: { // num1 = 15; num2 = 5; total = num1 + num2; print(total)
                const hasNums = /num1\s*=\s*15/.test(code) && /num2\s*=\s*5/.test(code);
                const hasTotalCalc = /total\s*=\s*num1\s*\+\s*num2/.test(code) || /total\s*=\s*num2\s*\+\s*num1/.test(code);
                const printsTotal = /print\s*\(\s*total\s*\)/.test(code) || cleanOutput === "20";
                const outputIs20 = cleanOutput === "20";

                checklistResults.push({ id: "c1", passed: hasNums, message: hasNums ? "กำหนดตัวแปร num1 = 15 และ num2 = 5" : "กำหนด num1 = 15 และ num2 = 5" });
                checklistResults.push({ id: "c2", passed: hasTotalCalc, message: hasTotalCalc ? "คำนวณ total = num1 + num2 ถูกต้อง" : "สร้าง total = num1 + num2" });
                checklistResults.push({ id: "c3", passed: printsTotal && outputIs20, message: outputIs20 ? "พิมพ์ค่า total ได้ผลลัพธ์เป็น 20" : "ผลลัพธ์ต้องเป็น 20" });
                allPassed = hasNums && hasTotalCalc && outputIs20 && runResult.success;
                break;
            }

            case 7: { // # บัตรตัวละคร; hero = "สายฟ้า"; level = 50; print("ฮีโร่:", hero, "เลเวล:", level)
                const hasComment = codeLines.some(l => /#.*บัตรตัวละคร/.test(l));
                const hasVars = /hero\s*=\s*["']สายฟ้า["']/.test(code) && /level\s*=\s*50\b/.test(code);
                const outputMatches = cleanOutput === "ฮีโร่: สายฟ้า เลเวล: 50";

                checklistResults.push({ id: "c1", passed: hasComment, message: hasComment ? "มีคอมเมนต์ # บัตรตัวละคร" : "ใส่คอมเมนต์ # บัตรตัวละคร" });
                checklistResults.push({ id: "c2", passed: hasVars, message: hasVars ? "สร้างตัวแปร hero = \"สายฟ้า\" และ level = 50" : "สร้างตัวแปร hero = \"สายฟ้า\" และ level = 50" });
                checklistResults.push({ id: "c3", passed: outputMatches, message: outputMatches ? "ผลลัพธ์แสดง 'ฮีโร่: สายฟ้า เลเวล: 50'" : "ผลลัพธ์ต้องเป็น 'ฮีโร่: สายฟ้า เลเวล: 50'" });
                allPassed = hasComment && hasVars && outputMatches && runResult.success;
                break;
            }

            case 8: { // ticket = 160; qty = 3; discount = 50; total = (ticket * qty) - discount; print(total) -> 430
                const hasVars = /ticket\s*=\s*160/.test(code) && /qty\s*=\s*3/.test(code) && /discount\s*=\s*50/.test(code);
                const hasFormula = /total\s*=\s*\(?\s*ticket\s*\*\s*qty\s*\)?\s*-\s*discount/.test(code);
                const outputIs430 = cleanOutput === "430";

                checklistResults.push({ id: "c1", passed: hasVars, message: hasVars ? "กำหนดตัวแปร ticket, qty, discount ครบถ้วน" : "กำหนด ticket = 160, qty = 3, discount = 50" });
                checklistResults.push({ id: "c2", passed: hasFormula, message: hasFormula ? "คำนวณ total = (ticket * qty) - discount ถูกต้อง" : "คำนวณ total = (ticket * qty) - discount" });
                checklistResults.push({ id: "c3", passed: outputIs430, message: outputIs430 ? "ผลลัพธ์คือ 430 ถูกต้อง" : "ผลลัพธ์ต้องได้ 430" });
                allPassed = hasVars && hasFormula && outputIs430 && runResult.success;
                break;
            }

            case 9: { // Fix Syntax Error: Print("คะแนนของคุณคือ" score)
                const noUppercasePrint = !/Print\s*\(/.test(code);
                const hasCommaInPrint = /print\s*\([^,)]+,\s*score\s*\)/.test(code);
                const outputMatches = cleanOutput === "คะแนนของคุณคือ 100";

                checklistResults.push({ id: "c1", passed: noUppercasePrint, message: noUppercasePrint ? "แก้ไข Print เป็น print สำเร็จ" : "แก้ Print ให้เป็นตัวพิมพ์เล็ก print" });
                checklistResults.push({ id: "c2", passed: hasCommaInPrint, message: hasCommaInPrint ? "ใส่เครื่องหมายจุลภาค (,) คั่นตัวแปร score" : "ใส่เครื่องหมายจุลภาค (,) ระหว่างข้อความกับ score" });
                checklistResults.push({ id: "c3", passed: outputMatches && runResult.success, message: outputMatches ? "รันผ่านและได้ผลลัพธ์ 'คะแนนของคุณคือ 100'" : "ผลลัพธ์ต้องเป็น 'คะแนนของคุณคือ 100'" });
                allPassed = noUppercasePrint && hasCommaInPrint && outputMatches && runResult.success;
                break;
            }

            case 10: { // Fix Semantic Error: avg_price = (price1 + price2) / 2
                const hasParentheses = /avg_price\s*=\s*\(\s*price1\s*\+\s*price2\s*\)\s*\/\s*2/.test(code);
                const contains50 = cleanOutput.includes("50.0") || cleanOutput.includes("50");
                const outputMatches = cleanOutput === "ราคาเฉลี่ยคือ: 50.0";

                checklistResults.push({ id: "c1", passed: hasParentheses, message: hasParentheses ? "ใส่วงเล็บ (price1 + price2) ถูกต้อง" : "ใส่วงเล็บรอบ (price1 + price2) ก่อนหาร 2" });
                checklistResults.push({ id: "c2", passed: contains50, message: contains50 ? "คำนวณได้ค่าเฉลี่ย 50.0 ถูกต้องตามคณิตศาสตร์" : "ผลลัพธ์การคำนวณต้องได้ 50.0 ไม่ใช่ 90.0" });
                checklistResults.push({ id: "c3", passed: outputMatches, message: outputMatches ? "แสดงผล 'ราคาเฉลี่ยคือ: 50.0' สมบูรณ์" : "ผลลัพธ์ต้องแสดง 'ราคาเฉลี่ยคือ: 50.0'" });
                allPassed = hasParentheses && contains50 && outputMatches && runResult.success;
                break;
            }

            default:
                break;
        }

        if (allPassed) {
            feedback = `🎉 ยอดเยี่ยมมาก! คุณผ่านภารกิจที่ ${questId} สำเร็จ ได้รับ +${quest.xp} XP!`;
        } else if (runResult.error) {
            feedback = `⚠️ พบข้อผิดพลาดในการรันโค้ด ลองตรวจสอบคำแนะนำด้านล่างนี้ดูนะ`;
        } else {
            feedback = `🔍 ผลการรันยังไม่ตรงตามเงื่อนไข ลองตรวจเช็กรายการ Checklist ด้านบนอีกครั้งนะ`;
        }

        return {
            success: allPassed,
            output: cleanOutput,
            error: runResult.error,
            checklistResults: checklistResults,
            feedback: feedback,
            xpGained: allPassed ? quest.xp : 0
        };
    }
}

window.questValidator = new QuestValidator();

