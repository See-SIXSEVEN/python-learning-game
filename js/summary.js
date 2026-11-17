// Summary & Leaderboard Page Controller (summary.html)

document.addEventListener('DOMContentLoaded', () => {
    // Guard: check if student registered
    if (!window.storageManager.hasRegistered()) {
        window.location.href = 'index.html';
        return;
    }

    const student = window.storageManager.getStudent();
    const progress = window.storageManager.getProgress();
    const studentKey = `${student.name}_${student.grade}_${student.no}`;

    // Find student submission with teacher grading
    const allSubs = window.storageManager.getAllSubmissions();
    const mySub = allSubs.find(s => s.id === studentKey || (s.name === student.name && s.grade === student.grade && s.no === student.no)) || {};
    const grading = mySub.grading || null;
    const isGraded = grading && grading.isGraded;

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

    // Render Hero Stamp & Header Info
    const rank = window.storageManager.getRankInfo(isGraded ? grading.totalScore : (progress.totalXP || 0));
    document.getElementById('summary-stamp-title').textContent = isGraded ? `👑 คะแนนที่ได้: ${grading.totalScore} / 100` : `📝 ส่งคำตอบเรียบร้อยแล้ว`;
    document.getElementById('summary-stamp-thai').textContent = `${student.name} (${student.grade} เลขที่ ${student.no})`;

    // Score Grid
    const completedCount = (progress.completedQuests || []).length;
    document.getElementById('summary-score-quests').textContent = `${completedCount} / 4 ข้อ`;

    const statusEl = document.getElementById('summary-grading-status');
    const scoreXpEl = document.getElementById('summary-score-xp');
    const feedbackBox = document.getElementById('summary-teacher-feedback-box');

    if (isGraded) {
        statusEl.textContent = '✅ ตรวจแล้ว';
        statusEl.style.color = '#4ade80';
        scoreXpEl.textContent = `${grading.totalScore}`;

        if (grading.feedback && grading.feedback.trim()) {
            feedbackBox.innerHTML = `
                <div style="font-weight: 600; color: #facc15; margin-bottom: 6px;">📢 คำแนะนำจากคุณครู:</div>
                <div style="font-size: 1.05rem; color: #f8fafc; white-space: pre-wrap;">"${escapeHtml(grading.feedback)}"</div>
                <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 8px;">ตรวจเมื่อ: ${grading.gradedAt || '-'}</div>
            `;
        } else {
            feedbackBox.innerHTML = `
                <span style="color: #4ade80;">✔ คุณครูตรวจประเมินเรียบร้อยแล้ว ได้คะแนนรวม <strong>${grading.totalScore}</strong> / 100 คะแนน</span>
            `;
        }
    } else {
        statusEl.textContent = '⏳ รอครูตรวจ';
        statusEl.style.color = '#facc15';
        scoreXpEl.textContent = 'รอตรวจ';

        feedbackBox.innerHTML = `
            <span style="color: #94a3b8;">⏳ คุณครูยังไม่ได้ตรวจประเมินผลงานของคุณ เมื่อคุณครูตรวจแล้ว คะแนนรายข้อและคำแนะนำจะแสดงที่นี่</span>
        `;
    }

    // Render 4 Quests Review Table
    const reviewTbody = document.getElementById('quests-review-tbody');
    reviewTbody.innerHTML = '';

    window.QUESTS.forEach(q => {
        const isPassed = (progress.completedQuests || []).includes(q.id);
        const questScore = (isGraded && grading.scores && grading.scores[q.id] !== undefined)
            ? `${grading.scores[q.id]} / 25`
            : (isPassed ? '<span style="color: #facc15;">รอตรวจ</span>' : '<span style="color: #64748b;">-</span>');

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-family: var(--font-pixel); text-align: center;">${q.id}</td>
            <td><strong>${q.title}</strong>: ${escapeHtml(q.instruction)}</td>
            <td style="text-align: center;">
                ${isPassed ? '<span style="color: var(--text-green); font-weight: bold;">✅ ส่งแล้ว</span>' : '<span style="color: var(--text-muted);">⬜ ยังไม่ส่ง</span>'}
            </td>
            <td style="text-align: center; font-weight: 600; font-family: var(--font-pixel); font-size: 0.85rem;">
                ${questScore}
            </td>
        `;
        reviewTbody.appendChild(tr);
    });

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
        prepareAndPrintReport(student, progress, totalXP, rank);
    });

    // Export CSV Button
    document.getElementById('btn-export-csv').addEventListener('click', () => {
        let csv = "\uFEFFลำดับ,ชื่อ-นามสกุล,ห้อง,เลขที่,คะแนน XP,ฉายา,สถานะ\n";
        leaderboard.forEach((entry, idx) => {
            csv += `${idx + 1},"${entry.name}","${entry.grade}","${entry.no}",${entry.xp},"${entry.badge}","${entry.time}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `python_quest_scores_${student.grade.replace('/', '_')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    });
});

function prepareAndPrintReport(student, progress, totalXP, rank) {
    document.getElementById('print-student-name').textContent = student.name;
    document.getElementById('print-student-grade').textContent = student.grade;
    document.getElementById('print-student-no').textContent = student.no;
    document.getElementById('print-total-xp').textContent = `${totalXP} / 100 XP`;

    let gradeLevel = "ผ่านเกณฑ์ระดับดีเยี่ยม (100%)";
    if (totalXP >= 80) gradeLevel = "ผ่านเกณฑ์ระดับดีมาก (80-90%)";
    else if (totalXP >= 60) gradeLevel = "ผ่านเกณฑ์ระดับดี (60-70%)";
    else if (totalXP >= 50) gradeLevel = "ผ่านเกณฑ์ขั้นพื้นฐาน (50%)";
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
        const isPassed = progress.completedQuests.includes(q.id);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="center">${q.id}</td>
            <td><strong>${q.category}</strong>: ${q.title} (${q.instruction.replace(/<[^>]+>/g, '').substring(0, 50)}...)</td>
            <td class="center">${q.difficulty}</td>
            <td class="center">25</td>
            <td class="center"><strong>${isPassed ? '25' : '0'}</strong></td>
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

