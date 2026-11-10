// Quest Database for Grade 9 (ม.3) Python Quest Game (5 Quests Edition)
// Styled after Codédex retro pixel arcade

const QUESTS = [
    {
        id: 1,
        category: "[print()]",
        title: "ก้าวแรกสู่วิถีไพทอน",
        difficulty: "ง่ายมาก",
        difficultyClass: "easy",
        xp: 20,
        lore: "ยินดีต้อนรับสู่อาณาจักรไพทอน! ก่อนที่จะออกเดินทางผจญภัยในโลกแห่งโค้ด นินจาฝึกหัดทุกคนจะต้องเปล่งเสียงทักทายเครื่องเซิร์ฟเวอร์โบราณด้วยคำสั่งวิเศษ print()",
        instruction: "เขียนคำสั่ง `print()` เพื่อพิมพ์ข้อความ `\"Hello, Python!\"` ออกทางหน้าจอ Terminal",
        checklist: [
            { id: "c1", text: "ใช้ฟังก์ชัน print() เป็นตัวพิมพ์เล็กทั้งหมด" },
            { id: "c2", text: "ครอบข้อความด้วยเครื่องหมายคำพูด (Double quotes หรือ Single quotes)" },
            { id: "c3", text: "ผลลัพธ์ที่ได้คือ 'Hello, Python!' เป๊ะทุกตัวอักษร" }
        ],
        starterCode: `# ภารกิจที่ 1: พิมพ์ข้อความทักทายภาษาไพทอน
# เขียนโค้ดของคุณด้านล่างนี้ 👇

`,
        expectedOutput: "Hello, Python!",
        sampleOutput: "Hello, Python!",
        solutionCode: `print("Hello, Python!")`,
        hints: [
            "ภาษา Python ตัวพิมพ์เล็ก-ใหญ่มีผล (Case-sensitive)! ต้องพิมพ์ print() เป็นตัวพิมพ์เล็กทั้งหมด ห้ามใช้ Print()",
            "ข้อความตัวอักษรต้องอยู่ภายใต้เครื่องหมายคำพูด เช่น \"Hello, Python!\" หรือ 'Hello, Python!'",
            "อย่าลืมเครื่องหมายตกใจ (!) หลังคำว่า Python ด้วยนะ"
        ]
    },
    {
        id: 2,
        category: "[Variables & Comma]",
        title: "สร้างบัตรประจำตัวฮีโร่",
        difficulty: "ง่าย",
        difficultyClass: "easy",
        xp: 20,
        lore: "กิลด์นักผจญภัยต้องการให้คุณบันทึกข้อมูลตัวละครลงใน 'กล่องตัวแปร' แล้วนำมาแสดงผลเป็นบัตรประจำตัวโดยคั่นด้วยเครื่องหมายจุลภาค (Comma `,`)",
        instruction: "สร้างตัวแปร `hero = \"สายฟ้า\"` และ `level = 15` จากนั้นใช้ `print()` บรรทัดเดียวพิมพ์: `\"ฮีโร่:\", hero, \"เลเวล:\", level` (ผลลัพธ์: `ฮีโร่: สายฟ้า เลเวล: 15`)",
        checklist: [
            { id: "c1", text: "สร้างตัวแปร hero = \"สายฟ้า\" และ level = 15" },
            { id: "c2", text: "ใช้ print() ที่มีเครื่องหมายจุลภาค (,) คั่นข้อมูลหลายค่า" },
            { id: "c3", text: "ผลลัพธ์ใน Terminal แสดง 'ฮีโร่: สายฟ้า เลเวล: 15'" }
        ],
        starterCode: `# 1. สร้างตัวแปร hero และ level


# 2. ใช้ print() แสดงผลข้อความและตัวแปรคั่นด้วยจุลภาค (,)

`,
        expectedOutput: "ฮีโร่: สายฟ้า เลเวล: 15",
        sampleOutput: "ฮีโร่: สายฟ้า เลเวล: 15",
        solutionCode: `hero = "สายฟ้า"
level = 15
print("ฮีโร่:", hero, "เลเวล:", level)`,
        hints: [
            "สร้างตัวแปรข้อความ: hero = \"สายฟ้า\"",
            "สร้างตัวแปรตัวเลข: level = 15 (ไม่ต้องใส่เครื่องหมายคำพูด)",
            "เวลาพิมพ์ใน print(\"ฮีโร่:\", hero, \"เลเวล:\", level) ห้ามใส่เครื่องหมายคำพูดครอบชื่อตัวแปร"
        ]
    },
    {
        id: 3,
        category: "[Math & Variables]",
        title: "เครื่องคำนวณยอดซื้อพร้อมส่วนลด",
        difficulty: "ปานกลาง",
        difficultyClass: "medium",
        xp: 20,
        lore: "ร้านค้าไอเทมเวทมนตร์ต้องการระบบคำนวณยอดเงินสุทธิ โดยนำราคาไอเทมคูณจำนวนชิ้น แล้วนำไปลบด้วยส่วนลดคูปองพิเศษ!",
        instruction: "กำหนดตัวแปร `price = 250`, `qty = 4`, `discount = 100` จากนั้นคำนวณ `total = (price * qty) - discount` แล้วใช้ `print(total)` พิมพ์ผลลัพธ์ออกมา (ผลลัพธ์คือ 900)",
        checklist: [
            { id: "c1", text: "กำหนดตัวแปร price = 250, qty = 4, discount = 100 ครบถ้วน" },
            { id: "c2", text: "คำนวณยอดเงิน total = (price * qty) - discount" },
            { id: "c3", text: "พิมพ์ค่า total และได้ผลลัพธ์คือ 900" }
        ],
        starterCode: `# กำหนดราคาสินค้า จำนวน และส่วนลด
price = 250
qty = 4
discount = 100

# คำนวณราคาสุทธิเก็บในตัวแปร total


# พิมพ์ค่าตัวแปร total ออกทางหน้าจอ

`,
        expectedOutput: "900",
        sampleOutput: "900",
        solutionCode: `price = 250
qty = 4
discount = 100
total = (price * qty) - discount
print(total)`,
        hints: [
            "ในคอมพิวเตอร์ เครื่องหมายคูณใช้เครื่องหมายดอกจัน (*) เช่น price * qty",
            "สูตรการคำนวณ: total = (price * qty) - discount",
            "เมื่อคำนวณเสร็จ ให้ใช้คำสั่ง print(total) เพื่อแสดงผลลัพธ์ 900"
        ]
    },
    {
        id: 4,
        category: "[Fix Semantic Error]",
        title: "ปราบปีศาจลำดับการคำนวณผิด (PEMDAS)",
        difficulty: "ท้าทาย",
        difficultyClass: "hard",
        xp: 20,
        lore: "คำสาปบั๊กโจมตีระบบตัดเกรด! โค้ดด้านล่างนี้รันผ่านไม่แจ้ง Error แต่ผลลัพธ์คะแนนเฉลี่ยออกมาเป็น 110.0 ซึ่งผิดความจริง (Semantic Error) เพราะคอมพิวเตอร์ทำเครื่องหมายหาร (/) ก่อนบวก (+)! จงใส่วงเล็บเพื่อจัดลำดับให้ถูกต้อง",
        instruction: "แก้ไขบรรทัด `avg = score1 + score2 / 2` โดยใส่วงเล็บ `(score1 + score2)` เพื่อให้บวกคะแนนทั้งสองก่อนแล้วค่อยหาร 2 ให้ได้คะแนนเฉลี่ย `70.0`",
        checklist: [
            { id: "c1", text: "ใส่วงเล็บ (score1 + score2) ในสูตร avg" },
            { id: "c2", text: "คำนวณได้ค่าเฉลี่ย 70.0 ถูกต้องตามคณิตศาสตร์" },
            { id: "c3", text: "แสดงผล 'คะแนนเฉลี่ยคือ: 70.0' ครบถ้วนสมบูรณ์" }
        ],
        starterCode: `# โค้ดเดิมคำนวณผิดลำดับ (ได้ 110.0 แทนที่จะเป็น 70.0)
# จงใส่วงเล็บให้สูตรคำนวณ avg ถูกต้อง
score1 = 80
score2 = 60

avg = score1 + score2 / 2
print("คะแนนเฉลี่ยคือ:", avg)
`,
        expectedOutput: "คะแนนเฉลี่ยคือ: 70.0",
        sampleOutput: "คะแนนเฉลี่ยคือ: 70.0",
        solutionCode: `score1 = 80
score2 = 60

avg = (score1 + score2) / 2
print("คะแนนเฉลี่ยคือ:", avg)`,
        hints: [
            "ตามลำดับทางคณิตศาสตร์ คอมพิวเตอร์จะนำ score2 / 2 (ได้ 30.0) ก่อน แล้วไปบวก 80 จึงได้ 110.0",
            "วิธีแก้ไข: ใส่วงเล็บครอบการบวก เพื่อบังคับให้บวกกันก่อน -> avg = (score1 + score2) / 2"
        ]
    },
    {
        id: 5,
        category: "[Nightmare Boss]",
        title: "บอสใหญ่: ระบบคิดเงินร้านค้ากิลด์แฟนตาซี (ข้อยากสุดๆ)",
        difficulty: "ยากสุดๆ",
        difficultyClass: "hard",
        xp: 20,
        lore: "บอสใหญ่แห่งมิติไพทอนปรากฏตัว! นี่คือบททดสอบขั้นสุดยอดที่รวบรวมทุกศาสตร์ของ ม.3 เข้าด้วยกัน: การเขียนคอมเมนต์, การประกาศตัวแปรหลายตัว, การคำนวณหลายขั้นตอน, การคิดภาษี 7% และการจัดฟอร์แมตแสดงผลหลายบรรทัด!",
        instruction: `เขียนโปรแกรมคิดเงินร้านค้ากิลด์แฟนตาซีตามเงื่อนไขต่อไปนี้:
1. บรรทัดแรกเขียน Comment: <code># ระบบคิดเงินกิลด์</code>
2. สร้างตัวแปรไอเทม: <code>item_price = 500</code>, จำนวน <code>qty = 3</code>, ส่วนลด <code>discount = 100</code>
3. คำนวณยอดเงินก่อนภาษี: <code>subtotal = (item_price * qty) - discount</code> (ได้ 1400)
4. คำนวณภาษี 7%: <code>tax = subtotal * 0.07</code> (ได้ 98.0)
5. คำนวณยอดชำระสุทธิ: <code>total = subtotal + tax</code> (ได้ 1498.0)
6. สั่ง <code>print()</code> แสดงผล 2 บรรทัด:
   - บรรทัดที่ 1: <code>print("ยอดก่อนภาษี:", subtotal)</code>
   - บรรทัดที่ 2: <code>print("ยอดชำระสุทธิ:", total)</code>`,
        checklist: [
            { id: "c1", text: "มีคอมเมนต์ # ระบบคิดเงินกิลด์ และกำหนดตัวแปร item_price, qty, discount ครบ" },
            { id: "c2", text: "คำนวณ subtotal, tax (7%) และ total ยอดชำระสุทธิถูกต้อง" },
            { id: "c3", text: "ผลลัพธ์แสดง 2 บรรทัด: 'ยอดก่อนภาษี: 1400' และ 'ยอดชำระสุทธิ: 1498.0'" }
        ],
        starterCode: `# บอสข้อ 5: ระบบคิดเงินร้านค้ากิลด์แฟนตาซี (ข้อยากสุดๆ)
# 1. เขียน Comment # ระบบคิดเงินกิลด์


# 2. กำหนดตัวแปร item_price = 500, qty = 3, discount = 100


# 3. คำนวณ subtotal = (item_price * qty) - discount


# 4. คำนวณภาษี 7% -> tax = subtotal * 0.07


# 5. คำนวณยอดสุทธิ -> total = subtotal + tax


# 6. แสดงผล 2 บรรทัด: "ยอดก่อนภาษี:", subtotal และ "ยอดชำระสุทธิ:", total

`,
        expectedOutput: "ยอดก่อนภาษี: 1400\nยอดชำระสุทธิ: 1498.0",
        sampleOutput: "ยอดก่อนภาษี: 1400\nยอดชำระสุทธิ: 1498.0",
        solutionCode: `# ระบบคิดเงินกิลด์
item_price = 500
qty = 3
discount = 100

subtotal = (item_price * qty) - discount
tax = subtotal * 0.07
total = subtotal + tax

print("ยอดก่อนภาษี:", subtotal)
print("ยอดชำระสุทธิ:", total)`,
        hints: [
            "อย่าลืมคอมเมนต์บรรทัดแรก: # ระบบคิดเงินกิลด์",
            "ภาษี 7% คำนวณโดยใช้ subtotal * 0.07",
            "ยอดสุทธิ: total = subtotal + tax",
            "บรรทัดแรก: print(\"ยอดก่อนภาษี:\", subtotal)",
            "บรรทัดสอง: print(\"ยอดชำระสุทธิ:\", total)"
        ]
    }
];

window.QUESTS = QUESTS;
