// LocalStorage and Session Management for Python Quest Game

class StorageManager {
    constructor() {
        this.STUDENT_KEY = 'pyquest_student_profile';
        this.PROGRESS_KEY = 'pyquest_student_progress';
        this.LEADERBOARD_KEY = 'pyquest_class_leaderboard';
        this.initDefaultLeaderboard();
    }

    // Default class peers for realistic M.3 classroom leaderboard
    getDefaultPeers() {
        return [
            { name: "ด.ช. ภัทรดนัย วงศ์วิริยะ", grade: "ม.3/1", no: "5", xp: 100, badge: "👑 Grandmaster", avatar: "⚡", time: "12 นาที" },
            { name: "ด.ญ. พิชญาภา สิทธิโชค", grade: "ม.3/1", no: "18", xp: 100, badge: "👑 Grandmaster", avatar: "🧙", time: "14 นาที" },
            { name: "ด.ช. กิตติภพ รัตนสุวรรณ", grade: "ม.3/1", no: "2", xp: 90, badge: "⚡ Ninja Master", avatar: "🤖", time: "18 นาที" },
            { name: "ด.ญ. ชนัญชิดา สุขเกษม", grade: "ม.3/1", no: "24", xp: 80, badge: "⚡ Ninja Master", avatar: "🐱", time: "21 นาที" },
            { name: "ด.ช. นวพล ทิพยวารี", grade: "ม.3/1", no: "9", xp: 70, badge: "🛡️ Cyber Knight", avatar: "👾", time: "25 นาที" },
            { name: "ด.ญ. ศศิธร เจริญพร", grade: "ม.3/1", no: "31", xp: 60, badge: "🛡️ Cyber Knight", avatar: "🎮", time: "29 นาที" },
            { name: "ด.ช. ธนกร พลอยแสงงาม", grade: "ม.3/1", no: "11", xp: 50, badge: "🏹 Adventurer", avatar: "🦊", time: "32 นาที" }
        ];
    }

    initDefaultLeaderboard() {
        if (!localStorage.getItem(this.LEADERBOARD_KEY)) {
            localStorage.setItem(this.LEADERBOARD_KEY, JSON.stringify(this.getDefaultPeers()));
        }
    }

    // Student Profile
    getStudent() {
        const raw = localStorage.getItem(this.STUDENT_KEY);
        return raw ? JSON.parse(raw) : null;
    }

    saveStudent(studentData) {
        localStorage.setItem(this.STUDENT_KEY, JSON.stringify(studentData));
    }

    hasRegistered() {
        return this.getStudent() !== null;
    }

    // Student Progress
    getProgress() {
        const raw = localStorage.getItem(this.PROGRESS_KEY);
        if (raw) {
            return JSON.parse(raw);
        }
        return {
            completedQuests: [],
            questScores: {},
            questCodes: {},
            questCompletedAt: {},
            currentQuestId: 1,
            totalXP: 0,
            startTime: new Date().toISOString(),
            finishTime: null
        };
    }

    saveProgress(progress) {
        // Calculate total XP
        let total = 0;
        for (const qid in progress.questScores) {
            total += (progress.questScores[qid] || 0);
        }
        progress.totalXP = total;
        if (progress.completedQuests.length === 10 && !progress.finishTime) {
            progress.finishTime = new Date().toISOString();
        }
        localStorage.setItem(this.PROGRESS_KEY, JSON.stringify(progress));
    }

    saveQuestCode(questId, code) {
        const progress = this.getProgress();
        progress.questCodes[questId] = code;
        this.saveProgress(progress);
    }

    getQuestCode(questId) {
        const progress = this.getProgress();
        if (progress.questCodes && progress.questCodes[questId] !== undefined) {
            return progress.questCodes[questId];
        }
        // Return starter code from quest
        const q = window.QUESTS.find(item => item.id === questId);
        return q ? q.starterCode : "";
    }

    markQuestPassed(questId, code, xp) {
        const progress = this.getProgress();
        if (!progress.completedQuests.includes(questId)) {
            progress.completedQuests.push(questId);
        }
        progress.questScores[questId] = xp;
        progress.questCodes[questId] = code;
        progress.questCompletedAt[questId] = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

        this.saveProgress(progress);
        return progress;
    }

    // Calculate Rank and Title Badge
    getRankInfo(totalXP) {
        if (totalXP >= 100) {
            return {
                title: "Python Grandmaster",
                thaiTitle: "ปรมาจารย์ไพทอนแห่ง ม.3",
                badgeIcon: "👑",
                tier: "master",
                color: "#f59e0b",
                description: "บรรลุศาสตร์การเขียนโค้ดภาษาไพทอนระดับสูงสุด ไร้ข้อผิดพลาด!"
            };
        } else if (totalXP >= 80) {
            return {
                title: "Code Ninja Master",
                thaiTitle: "ยอดนินจาโค้ดระดับสูง",
                badgeIcon: "⚡",
                tier: "ninja",
                color: "#38bdf8",
                description: "ฝีมือเฉียบคม แก้บั๊กได้อย่างคล่องแคล่วว่องไว!"
            };
        } else if (totalXP >= 60) {
            return {
                title: "Cyber Knight",
                thaiTitle: "อัศวินไซเบอร์ผู้เชี่ยวชาญ",
                badgeIcon: "🛡️",
                tier: "knight",
                color: "#a855f7",
                description: "เข้าใจหลักการตัวแปรและการคำนวณอย่างแข็งแกร่ง!"
            };
        } else if (totalXP >= 40) {
            return {
                title: "Code Adventurer",
                thaiTitle: "นักผจญภัยโลกโค้ด",
                badgeIcon: "🏹",
                tier: "adventurer",
                color: "#10b981",
                description: "ผ่านการทดสอบเบื้องต้น พร้อมลุยด่านต่อๆ ไป!"
            };
        } else if (totalXP >= 10) {
            return {
                title: "Python Apprentice",
                thaiTitle: "ผู้ฝึกตนแห่งอาณาจักรไพทอน",
                badgeIcon: "🐣",
                tier: "apprentice",
                color: "#94a3b8",
                description: "เริ่มต้นก้าวแรกอย่างมั่นใจสู่โลกโปรแกรมมิ่ง!"
            };
        } else {
            return {
                title: "Novice Recruit",
                thaiTitle: "ผู้เริ่มภารกิจ",
                badgeIcon: "🥚",
                tier: "novice",
                color: "#64748b",
                description: "พร้อมเริ่มต้นเรียนรู้การเขียนโค้ดแล้ว!"
            };
        }
    }

    // Generate Combined Leaderboard including Current Student
    getCombinedLeaderboard() {
        const student = this.getStudent();
        const progress = this.getProgress();
        const peers = JSON.parse(localStorage.getItem(this.LEADERBOARD_KEY)) || this.getDefaultPeers();

        let list = [...peers];

        if (student) {
            const rank = this.getRankInfo(progress.totalXP);
            const myEntry = {
                name: student.name + " (คุณ)",
                grade: student.grade,
                no: student.no,
                xp: progress.totalXP,
                badge: `${rank.badgeIcon} ${rank.title.split(' ')[0]}`,
                avatar: student.avatar || "👾",
                time: progress.finishTime ? "เสร็จสิ้นภารกิจ" : "กำลังทำภารกิจ",
                isCurrentStudent: true
            };
            list.push(myEntry);
        }

        // Sort descending by XP, then by student number
        list.sort((a, b) => {
            if (b.xp !== a.xp) return b.xp - a.xp;
            return parseInt(a.no || 99) - parseInt(b.no || 99);
        });

        return list;
    }

    resetAllData() {
        localStorage.removeItem(this.STUDENT_KEY);
        localStorage.removeItem(this.PROGRESS_KEY);
        localStorage.removeItem(this.LEADERBOARD_KEY);
        this.initDefaultLeaderboard();
    }
}

window.storageManager = new StorageManager();

