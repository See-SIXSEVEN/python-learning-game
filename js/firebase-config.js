// Firebase Realtime Database Integration for Python Quest
// Project: seepython-learning

const firebaseConfig = {
    apiKey: "AIzaSyCAFq7GKOFzXY2NTaKxMW_4jjWrbUuZt3A",
    authDomain: "seepython-learning.firebaseapp.com",
    projectId: "seepython-learning",
    storageBucket: "seepython-learning.firebasestorage.app",
    messagingSenderId: "1094991934646",
    appId: "1:1094991934646:web:37b1bf0e11ac9dc485e217",
    measurementId: "G-8M0EM33XHW",
    databaseURL: "https://seepython-learning-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

class FirebaseService {
    constructor() {
        this.db = null;
        this.isReady = false;
        this.init();
    }

    init() {
        try {
            if (typeof firebase !== 'undefined' && firebase.database) {
                this.db = firebase.database();
                this.isReady = true;
                console.log("Firebase Realtime Database initialized successfully ✅");
            }
        } catch (e) {
            console.warn("Firebase init error (fallback to local):", e);
        }
    }

    // Sanitize key for Firebase (disallow ., $, #, [, ], /)
    safeKey(key) {
        return String(key).replace(/[.#$\[\]\/]/g, '_');
    }

    // Save student submission to Firebase
    async saveSubmission(student, progress, grading) {
        if (!this.isReady || !student) return;

        // Key uses grade + no of student1 (and no of partner if exists)
        const partnerSuffix = student.partner ? `_${student.partner.no}` : '';
        const studentKey = this.safeKey(`${student.grade}_${student.no}${partnerSuffix}_${student.name}`);
        const rank = window.storageManager ? window.storageManager.getRankInfo(progress.totalXP || 0) : { title: "Novice" };

        // Build display name showing both students
        const displayName = student.partner
            ? `${student.name} & ${student.partner.name}`
            : student.name;
        const displayNo = student.partner
            ? `${student.no} & ${student.partner.no}`
            : student.no;

        const payload = {
            id: studentKey,
            name: displayName,
            grade: student.grade,
            no: displayNo,
            avatar: student.avatar || '⚡',
            xp: progress.totalXP || 0,
            badge: rank.title,
            completedQuests: progress.completedQuests || [],
            questScores: progress.questScores || {},
            questCodes: progress.questCodes || {},
            updatedAt: new Date().toLocaleString('th-TH'),
            timestamp: Date.now(),
            // Store raw partner data for reference
            student1: { name: student.name, grade: student.grade, no: student.no },
            student2: student.partner || null
        };

        if (grading) {
            payload.grading = grading;
        }

        try {
            await this.db.ref(`submissions/${studentKey}`).update(payload);
            console.log("Synced to Firebase Realtime Cloud ☁️✅");
        } catch (err) {
            console.error("Failed to sync to Firebase:", err);
        }
    }

    // Save teacher grading to Firebase
    async saveGrading(studentKey, gradingData) {
        if (!this.isReady) return;
        const safeK = this.safeKey(studentKey);
        try {
            await this.db.ref(`submissions/${safeK}/grading`).set(gradingData);
            console.log("Grading saved to Firebase Cloud ☁️✅");
        } catch (err) {
            console.error("Failed to save grading to Firebase:", err);
        }
    }

    // Delete student from Firebase
    async deleteStudent(studentKey) {
        if (!this.isReady) return;
        const safeK = this.safeKey(studentKey);
        try {
            await this.db.ref(`submissions/${safeK}`).remove();
            console.log("Student removed from Firebase Cloud 🗑️✅");
        } catch (err) {
            console.error("Failed to delete student from Firebase:", err);
        }
    }

    // Teacher Dashboard: Listen for real-time updates of all students
    listenToAllSubmissions(callback) {
        if (!this.isReady) {
            // Retry after delay if firebase script is still loading
            setTimeout(() => this.listenToAllSubmissions(callback), 500);
            return;
        }

        this.db.ref('submissions').on('value', (snapshot) => {
            const data = snapshot.val();
            const list = [];
            if (data) {
                Object.keys(data).forEach(key => {
                    list.push(data[key]);
                });
            }
            callback(list);
        }, (error) => {
            console.warn("Realtime listener error:", error);
        });
    }
}

if (typeof window !== 'undefined') {
    window.firebaseService = new FirebaseService();
}

