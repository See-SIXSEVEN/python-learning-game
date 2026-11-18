// Summary & Leaderboard Page Controller (summary.html)

document.addEventListener('DOMContentLoaded', () => {
    // Guard: check if student registered
    if (!window.storageManager.hasRegistered()) {
        window.location.href = 'index.html';
        return;
    }

    const student = window.storageManager.getStudent();
    const progress = window.storageManager.getProgress();

    // Build pair key (must match recordSubmission key)
    const partnerSuffix = student.partner ? `_${student.partner.no}` : '';
    const studentKey = `${student.name}_${student.grade}_${student.no}${partnerSuffix}`;

    // Find student submission with teacher grading from LocalStorage initially
    const allSubs = window.storageManager.getAllSubmissions();
    const mySub = allSubs.find(s => s.id === studentKey || (s.name === student.name && s.grade === student.grade && s.no === student.no)) || {};
    let currentGrading = mySub.grading || null;

    // Trigger celebration sound & confetti
    setTimeout(() => {
        window.soundFX.playSuccess();
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 100,
                spread: 80,
                origin: { y: 0.55 }
            });
        }
    }, 200);

    // DOM Elements
    const stampTitle = document.getElementById('summary-stamp-title');
    const stampThai = document.getElementById('summary-stamp-thai');
    const statusEl = document.getElementById('summary-grading-status');
    const scoreXpEl = document.getElementById('summary-score-xp');
    const feedbackBox = document.getElementById('summary-teacher-feedback-box');
    const scoreQuestsEl = document.getElementById('summary-score-quests');

    if (stampThai) {
        // Show both names if pair
        const partnerInfo = student.partner
            ? ` & ${student.partner.name} (เลขที่ ${student.partner.no})`
            : '';
        stampThai.textContent = `${student.name} (${student.grade} เลขที่ ${student.no})${partnerInfo}`;
    }

    const completedCount = (progress.completedQuests || []).length;
    if (scoreQuestsEl) {
        scoreQuestsEl.textContent = `${completedCount} / 4 ข้อ`;
    }

    // Function to render quests review table
    function renderReviewTable(prog, grd) {
        const reviewTbody = document.getElementById('quests-review-tbody');
        if (!reviewTbody) return;
        reviewTbody.innerHTML = '';

        const isGrd = grd && grd.isGraded;

        window.QUESTS.forEach(q => {
            const isPassed = (prog.completedQuests || []).includes(q.id);
            let questScore = '<span style="color: #64748b;">-</span>';
            if (isGrd && grd.scores && grd.scores[q.id] !== undefined) {
                questScore = `<span style="color: #4ade80; font-weight: bold; font-size: 1rem;">${grd.scores[q.id]} / 25</span>`;
            } else if (isPassed) {
                questScore = '<span style="color: #facc15;">รอตรวจ</span>';
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-family: var(--font-pixel); text-align: center;">${q.id}</td>
                <td><strong>${q.title}</strong>: ${escapeHtml(q.instruction)}</td>
                <td style="text-align: center;">
                    ${isPassed ? '<span style="color: var(--text-green); font-weight: bold;">✅ ส่งแล้ว</span>' : '<span style="color: var(--text-muted);">⬜ ยังไม่ส่ง</span>'}
                </td>
                <td style="text-align: center; font-weight: 600; font-family: var(--font-pixel); font-size: 0.95rem;">
                    ${questScore}
                </td>
            `;
            reviewTbody.appendChild(tr);
        });
    }

    // Function to apply grading data to UI
    function applyGrading(grd) {
        if (!grd || !grd.isGraded) return;
        currentGrading = grd;

        if (stampTitle) {
            stampTitle.textContent = `👑 คะแนนที่ได้: ${grd.totalScore} / 100`;
        }

        if (statusEl) {
            statusEl.textContent = '✅ ตรวจแล้ว';
            statusEl.style.color = '#4ade80';
        }

        if (scoreXpEl) {
            scoreXpEl.textContent = `${grd.totalScore}`;
            scoreXpEl.style.color = '#4ade80';
        }

        if (feedbackBox) {
            if (grd.feedback && grd.feedback.trim()) {
                feedbackBox.innerHTML = `
                    <div style="font-weight: 600; color: #facc15; margin-bottom: 6px;">📢 คำแนะนำจากคุณครู:</div>
                    <div style="font-size: 1.05rem; color: #f8fafc; white-space: pre-wrap;">"${escapeHtml(grd.feedback)}"</div>
                    <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 8px;">ตรวจเมื่อ: ${grd.gradedAt || '-'}</div>
                `;
            } else {
                feedbackBox.innerHTML = `
                    <span style="color: #4ade80;">✔ คุณครูตรวจประเมินเรียบร้อยแล้ว ได้คะแนนรวม <strong>${grd.totalScore}</strong> / 100 คะแนน</span>
                `;
            }
        }

        // Re-render table with graded scores
        renderReviewTable(progress, grd);

        // Cache into local storage
        try {
            window.storageManager.saveGrading(studentKey, grd.scores, grd.feedback);
        } catch (e) {
            console.warn("Storage sync:", e);
        }
    }

    // Initial render
    if (currentGrading && currentGrading.isGraded) {
        applyGrading(currentGrading);
    } else {
        if (stampTitle) stampTitle.textContent = '📝 ส่งคำตอบเรียบร้อยแล้ว';
        if (statusEl) {
            statusEl.textContent = '⏳ รอครูตรวจ';
            statusEl.style.color = '#facc15';
        }
        if (scoreXpEl) {
            scoreXpEl.textContent = 'รอตรวจ';
            scoreXpEl.style.color = '#facc15';
        }
        if (feedbackBox) {
            feedbackBox.innerHTML = `
                <span style="color: #94a3b8;">⏳ คุณครูยังไม่ได้ตรวจประเมินผลงานของคุณ เมื่อคุณครูตรวจแล้ว คะแนนรายข้อและคำแนะนำจะแสดงที่นี่</span>
            `;
        }
        renderReviewTable(progress, null);
    }

    // Listen to Realtime Grading updates from Firebase Cloud
    if (window.firebaseService && window.firebaseService.isReady) {
        const partnerSuffix = student.partner ? `_${student.partner.no}` : '';
        const safeK = window.firebaseService.safeKey(`${student.grade}_${student.no}${partnerSuffix}_${student.name}`);
        
        // Immediate fetch from Firebase
        window.firebaseService.db.ref(`submissions/${safeK}`).once('value').then(snap => {
            const data = snap.val();
            if (data && data.grading && data.grading.isGraded) {
                applyGrading(data.grading);
            }
        }).catch(err => console.warn("Firebase fetch grading error:", err));

        // Realtime sync listener
        window.firebaseService.db.ref(`submissions/${safeK}`).on('value', (snapshot) => {
            const data = snapshot.val();
            if (data && data.grading && data.grading.isGraded) {
                applyGrading(data.grading);
            }
        });
    }

    // Top Navigation Buttons
    document.getElementById('btn-top-back-arena').addEventListener('click', () => {
        window.location.href = 'quest.html';
    });
    document.getElementById('btn-top-new-user').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    document.getElementById('btn-back-to-arena').addEventListener('click', () => {
        window.location.href = 'quest.html';
    });

    // Reset All Data Button
    document.getElementById('btn-reset-all').addEventListener('click', () => {
        if (confirm("คำเตือน: ข้อมูลคะแนนและโค้ดทั้งหมดจะถูกลบเพื่อเริ่มใหม่ ต้องการดำเนินการต่อหรือไม่?")) {
            window.storageManager.resetAllData();
            window.location.href = 'index.html';
        }
    });

    // Print Report Button
    document.getElementById('btn-print-report').addEventListener('click', () => {
        const rank = window.storageManager.getRankInfo(currentGrading && currentGrading.isGraded ? currentGrading.totalScore : (progress.totalXP || 0));
        prepareAndPrintReport(student, progress, currentGrading, rank);
    });

    // Export CSV Button
    document.getElementById('btn-export-csv').addEventListener('click', () => {
        const score = currentGrading && currentGrading.isGraded ? currentGrading.totalScore : progress.totalXP;
        const status = currentGrading && currentGrading.isGraded ? 'ตรวจแล้ว' : 'รอครูตรวจ';
        let csv = "\uFEFFชื่อ-นามสกุล,ห้อง,เลขที่,คะแนนที่ได้ (100),สถานะ,ข้อเสนอแนะจากครู\n";
        csv += `"${student.name}","${student.grade}","${student.no}",${score},"${status}","${(currentGrading && currentGrading.feedback) || '-'}"\n`;

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `python_score_${student.grade.replace('/', '_')}_${student.no}_${student.name}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    });
});

function prepareAndPrintReport(student, progress, grading, rank) {
    const isGraded = grading && grading.isGraded;
    const finalScore = isGraded ? grading.totalScore : (progress.totalXP || 0);

    document.getElementById('print-student-name').textContent = student.name;
    document.getElementById('print-student-grade').textContent = student.grade;
    document.getElementById('print-student-no').textContent = student.no;
    document.getElementById('print-total-xp').textContent = `${finalScore} / 100 คะแนน`;

    let gradeLevel = "ผ่านเกณฑ์ระดับดีเยี่ยม (100%)";
    if (finalScore >= 80) gradeLevel = "ผ่านเกณฑ์ระดับดีมาก (80-90%)";
    else if (finalScore >= 60) gradeLevel = "ผ่านเกณฑ์ระดับดี (60-70%)";
    else if (finalScore >= 50) gradeLevel = "ผ่านเกณฑ์ขั้นพื้นฐาน (50%)";
    else gradeLevel = "ต้องพัฒนาเพิ่มเติม (ต่ำกว่า 50%)";

    document.getElementById('print-percentage').textContent = `ระดับผลการประเมิน: ${gradeLevel}`;
    document.getElementById('print-rank-title').textContent = `${rank.badgeIcon} ${rank.title}`;
    document.getElementById('print-rank-thai').textContent = rank.thaiTitle;

    const now = new Date();
    const thMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    const dateStr = `วันที่ ${now.getDate()} เดือน ${thMonths[now.getMonth()]} พ.ศ. ${now.getFullYear() + 543}`;
    document.getElementById('print-date-student').textContent = dateStr;

    const printTbody = document.getElementById('print-table-tbody');
    printTbody.innerHTML = '';

    window.QUESTS.forEach(q => {
        const isPassed = (progress.completedQuests || []).includes(q.id);
        const score = (isGraded && grading.scores && grading.scores[q.id] !== undefined)
            ? grading.scores[q.id]
            : (isPassed ? 25 : 0);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="center">${q.id}</td>
            <td><strong>${q.title}</strong>: ${escapeHtml(q.instruction)}</td>
            <td class="center">พื้นฐาน</td>
            <td class="center">25</td>
            <td class="center"><strong>${score}</strong></td>
            <td class="center ${isPassed ? 'cert-status-pass' : ''}">${isPassed ? '✔ ส่งแล้ว' : '—'}</td>
        `;
        printTbody.appendChild(tr);
    });

    window.soundFX.playClick();
    window.print();
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
