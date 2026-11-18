// Quest Database for Grade 9 (ม.3) Python Quest Game (4 Quests Edition)
// Simple, clean, short instructions matched directly with classroom worksheet
// Ultra-easy beginner friendly level: Variables & Print, no input() required

const QUESTS = [
    {
        id: 1,
        title: "ข้อที่ 1",
        instruction: "กำหนดตัวแปรชื่อและชื่อเล่น แล้วแสดงข้อความแนะนำตัว เช่น \"สวัสดี ฉันชื่อ สมหญิง ชื่อเล่น หญิง\"",
        sampleOutput: "สวัสดี ฉันชื่อ สมหญิง ชื่อเล่น หญิง",
        starterCode: ""
    },
    {
        id: 2,
        title: "ข้อที่ 2",
        instruction: "กำหนดตัวแปรความกว้างและความยาว แล้วแสดงพื้นที่สี่เหลี่ยมผืนผ้า",
        sampleOutput: "พื้นที่สี่เหลี่ยมผืนผ้า: 50",
        starterCode: ""
    },
    {
        id: 3,
        title: "ข้อที่ 3",
        instruction: "กำหนดตัวแปรราคาสินค้า 2 ชิ้น แล้วคำนวณราคารวมและแสดงผลลัพธ์",
        sampleOutput: "ราคารวม: 50",
        starterCode: ""
    },
    {
        id: 4,
        title: "ข้อที่ 4",
        instruction: "กำหนดตัวแปรราคาขนมและจำนวนชิ้น แล้วคำนวณราคารวมทั้งหมดและแสดงผลลัพธ์",
        sampleOutput: "ราคารวมทั้งหมด: 100",
        starterCode: ""
    }
];

if (typeof window !== 'undefined') {
    window.QUESTS = QUESTS;
}
