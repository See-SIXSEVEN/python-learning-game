// Code Execution & Quest Verification Engine using Skulpt (5 Quests Edition)

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

            case 2: { // hero = "สายฟ้า"; level = 15; print("ฮีโร่:", hero, "เลเวล:", level)
                const hasVars = /hero\s*=\s*["']สายฟ้า["']/.test(code) && /level\s*=\s*15\b/.test(code);
                const hasCommaInPrint = /print\s*\([^)]*,[^)]*\)/.test(code);
                const outputMatches = cleanOutput === "ฮีโร่: สายฟ้า เลเวล: 15";

                checklistResults.push({ id: "c1", passed: hasVars, message: hasVars ? "สร้างตัวแปร hero = \"สายฟ้า\" และ level = 15 ถูกต้อง" : "สร้าง hero = \"สายฟ้า\" และ level = 15" });
                checklistResults.push({ id: "c2", passed: hasCommaInPrint, message: hasCommaInPrint ? "ใช้เครื่องหมายจุลภาค (,) คั่นข้อมูลใน print()" : "ใช้จุลภาค (,) คั่นระหว่างข้อความกับตัวแปร" });
                checklistResults.push({ id: "c3", passed: outputMatches, message: outputMatches ? "ผลลัพธ์แสดง 'ฮีโร่: สายฟ้า เลเวล: 15' ถูกต้อง" : "ผลลัพธ์ต้องเป็น 'ฮีโร่: สายฟ้า เลเวล: 15'" });
                allPassed = hasVars && hasCommaInPrint && outputMatches && runResult.success;
                break;
            }

            case 3: { // price = 250; qty = 4; discount = 100; total = (price * qty) - discount; print(total) -> 900
                const hasVars = /price\s*=\s*250/.test(code) && /qty\s*=\s*4/.test(code) && /discount\s*=\s*100/.test(code);
                const hasFormula = /total\s*=\s*\(?\s*price\s*\*\s*qty\s*\)?\s*-\s*discount/.test(code);
                const outputIs900 = cleanOutput === "900";

                checklistResults.push({ id: "c1", passed: hasVars, message: hasVars ? "กำหนดตัวแปร price = 250, qty = 4, discount = 100 ครบถ้วน" : "กำหนด price = 250, qty = 4, discount = 100" });
                checklistResults.push({ id: "c2", passed: hasFormula, message: hasFormula ? "คำนวณ total = (price * qty) - discount ถูกต้อง" : "คำนวณ total = (price * qty) - discount" });
                checklistResults.push({ id: "c3", passed: outputIs900, message: outputIs900 ? "ผลลัพธ์คือ 900 ถูกต้อง" : "ผลลัพธ์ต้องได้ 900" });
                allPassed = hasVars && hasFormula && outputIs900 && runResult.success;
                break;
            }

            case 4: { // Fix Semantic Error: avg = (score1 + score2) / 2 -> 70.0
                const hasParentheses = /avg\s*=\s*\(\s*score1\s*\+\s*score2\s*\)\s*\/\s*2/.test(code);
                const contains70 = cleanOutput.includes("70.0") || cleanOutput.includes("70");
                const outputMatches = cleanOutput === "คะแนนเฉลี่ยคือ: 70.0";

                checklistResults.push({ id: "c1", passed: hasParentheses, message: hasParentheses ? "ใส่วงเล็บ (score1 + score2) ถูกต้อง" : "ใส่วงเล็บรอบ (score1 + score2) ก่อนหาร 2" });
                checklistResults.push({ id: "c2", passed: contains70, message: contains70 ? "คำนวณได้ค่าเฉลี่ย 70.0 ถูกต้องตามคณิตศาสตร์" : "ผลลัพธ์ต้องได้ 70.0 ไม่ใช่ 110.0" });
                checklistResults.push({ id: "c3", passed: outputMatches, message: outputMatches ? "แสดงผล 'คะแนนเฉลี่ยคือ: 70.0' สมบูรณ์" : "ผลลัพธ์ต้องแสดง 'คะแนนเฉลี่ยคือ: 70.0'" });
                allPassed = hasParentheses && contains70 && outputMatches && runResult.success;
                break;
            }

            case 5: { // Boss Stage: Nightmare RPG Shop Checkout System
                // 1. Comment # ระบบคิดเงินกิลด์
                const hasComment = codeLines.some(l => /#.*ระบบคิดเงินกิลด์/.test(l));
                const hasVars = /item_price\s*=\s*500/.test(code) && /qty\s*=\s*3/.test(code) && /discount\s*=\s*100/.test(code);
                const hasSubtotal = /subtotal\s*=\s*\(?\s*item_price\s*\*\s*qty\s*\)?\s*-\s*discount/.test(code);
                const hasTax = /tax\s*=.*subtotal.*(\*|x)\s*(0\.07|7\s*\/\s*100)/.test(code);
                const hasTotal = /total\s*=.*subtotal\s*\+\s*tax/.test(code) || /total\s*=.*tax\s*\+\s*subtotal/.test(code);

                // Output lines check
                const line1Matches = lines.length >= 1 && lines[0].includes("ยอดก่อนภาษี:") && lines[0].includes("1400");
                const line2Matches = lines.length >= 2 && lines[1].includes("ยอดชำระสุทธิ:") && (lines[1].includes("1498.0") || lines[1].includes("1498"));

                const c1 = hasComment && hasVars;
                const c2 = hasSubtotal && hasTax && hasTotal;
                const c3 = line1Matches && line2Matches && runResult.success;

                checklistResults.push({ id: "c1", passed: c1, message: c1 ? "เขียน Comment และกำหนดตัวแปรไอเทมครบถ้วน" : "ใส่คอมเมนต์ # ระบบคิดเงินกิลด์ และกำหนดตัวแปร item_price, qty, discount" });
                checklistResults.push({ id: "c2", passed: c2, message: c2 ? "คำนวณ subtotal, tax 7% และ total ยอดสุทธิถูกต้อง" : "คำนวณ subtotal, tax = subtotal * 0.07 และ total = subtotal + tax" });
                checklistResults.push({ id: "c3", passed: c3, message: c3 ? "ผลลัพธ์แสดง 2 บรรทัดถูกต้องสมบูรณ์ (1400 และ 1498.0)" : "ผลลัพธ์ต้องแสดง 'ยอดก่อนภาษี: 1400' และ 'ยอดชำระสุทธิ: 1498.0'" });

                allPassed = c1 && c2 && c3 && runResult.success;
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
