// Quest Database for Grade 9 (ม.3) Python Quest Game (4 Quests Edition)
// Simple, clean, short instructions matched directly with classroom worksheet

const QUESTS = [
    {
        id: 1,
        title: "ข้อที่ 1 (3 คะแนน)",
        instruction: "กำหนดตัวแปรชื่อและชื่อเล่น แล้วแสดงข้อความแนะนำตัว เช่น \"สวัสดี ฉันชื่อ สมหญิง ชื่อเล่น หญิง\"",
        sampleOutput: "สวัสดี ฉันชื่อ สมหญิง ชื่อเล่น หญิง",
        starterCode: ""
    },
    {
        id: 2,
        title: "ข้อที่ 2 (3 คะแนน)",
        instruction: "กำหนดตัวแปรความกว้างและความยาว แล้วแสดงพื้นที่สี่เหลี่ยมผืนผ้า",
        sampleOutput: "พื้นที่สี่เหลี่ยมผืนผ้า: 50",
        starterCode: ""
    },
    {
        id: 3,
        title: "ข้อที่ 3 (ข้อเสริม - 3 คะแนน)",
        instruction: "กำหนดตัวแปรอายุเป็นปี แล้วแสดงอายุเป็นเดือน และแสดงอายุเมื่อผ่านไปอีก 10 ปี",
        sampleOutput: "อายุเป็นเดือน: 180\nอายุเมื่อผ่านไปอีก 10 ปี: 25",
        starterCode: ""
    },
    {
        id: 4,
        title: "ข้อที่ 4 (4 คะแนน)",
        instruction: "กำหนดตัวแปรคะแนนสอบ 3 วิชา แล้วแสดงคะแนนเฉลี่ย",
        sampleOutput: "คะแนนเฉลี่ย: 80.0",
        starterCode: ""
    }
];

if (typeof window !== 'undefined') {
    window.QUESTS = QUESTS;
}
