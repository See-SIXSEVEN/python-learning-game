// Summary & Leaderboard Page Controller (summary.html)

document.addEventListener('DOMContentLoaded', () => {
    // Guard: check if student registered
    if (!window.storageManager.hasRegistered()) {
        window.location.href = 'index.html';
        return;
    }

    const student = window.storageManager.getStudent();
    const progress = window.storageManager.getProgress();
    const totalXP = progress.totalXP || 0;
    const rank = window.storageManager.getRankInfo(totalXP);

    // Trigger celebration sound & confetti
    setTimeout(() => {
        if (totalXP >= 80) {
            window.soundFX.playLevelUp();
        } else {
            window.soundFX.playSuccess();
        }

        if (typeof confetti === 'function') {
            confetti({
                particleCount: 100,
                spread: 80,
                origin: { y: 0.55 }
            });
        }
    }, 200);

    // Render Hero Stamp & Scores
    document.getElementById('summary-stamp-title').textContent = `${rank.badgeIcon} ${rank.title.toUpperCase()}`;
    document.getElementById('summary-stamp-thai').textContent = rank.thaiTitle;
    document.getElementById('summary-score-xp').textContent = `${totalXP} / 100`;
    document.getElementById('summary-score-quests').textContent = `${progress.completedQuests.length} / 5`;

    // Render Leaderboard
    const leaderboard = window.storageManager.getCombinedLeaderboard();
    const tbody = document.getElementById('leaderboard-tbody');
    tbody.innerHTML = '';

    let myRankNumber = 1;
    leaderboard.forEach((entry, idx) => {
        const rankNum = idx + 1;
        if (entry.isCurrentStudent) {
            myRankNumber = rankNum;
        }

        const tr = document.createElement('tr');
        tr.className = `leaderboard-row ${entry.isCurrentStudent ? 'current-user' : ''}`;

        let medal = `#${rankNum}`;
        if (rankNum === 1) medal = `<span class="rank-badge rank-1">🥇 #1</span>`;
        else if (rankNum === 2) medal = `<span class="rank-badge rank-2">🥈 #2</span>`;
        else if (rankNum === 3) medal = `<span class="rank-badge rank-3">🥉 #3</span>`;

        tr.innerHTML = `
            <td>${medal}</td>
            <td><span style="font-size: 1.2rem; margin-right: 6px;">${entry.avatar || '⚡'}</span> ${entry.name}</td>
            <td>${entry.grade}</td>
            <td>${entry.no}</td>
            <td><span style="color: var(--text-yellow); font-family: var(--font-pixel); font-size: 0.75rem;">${entry.badge}</span></td>
            <td><span style="color: var(--text-muted); font-size: 0.85rem;">${entry.time}</span></td>
            <td style="text-align: right; font-family: var(--font-pixel); color: var(--text-cyan);">${entry.xp} XP</td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('summary-score-rank').textContent = `#${myRankNumber}`;

    // Render 5 Quests Rubric Review
    const reviewTbody = document.getElementById('quests-review-tbody');
    reviewTbody.innerHTML = '';

    window.QUESTS.forEach(q => {
        const isPassed = progress.completedQuests.includes(q.id);
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td style="font-family: var(--font-pixel); text-align: center;">${q.id}</td>
            <td><strong>${q.category}</strong> ${q.title}</td>
            <td><span class="tag-difficulty ${q.difficultyClass}">${q.difficulty}</span></td>
            <td>20 XP</td>
            <td style="font-family: var(--font-pixel); color: ${isPassed ? 'var(--text-green)' : 'var(--text-muted)'};">${isPassed ? '20' : '0'} XP</td>
            <td style="text-align: center;">
                ${isPassed ? '<span style="color: var(--text-green); font-weight: bold;">✅ ผ่านแล้ว</span>' : '<span style="color: var(--text-muted);">⬜ ยังไม่สำเร็จ</span>'}
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
            <td class="center">20</td>
            <td class="center"><strong>${isPassed ? '20' : '0'}</strong></td>
            <td class="center ${isPassed ? 'cert-status-pass' : ''}">${isPassed ? '✔ ผ่าน' : '—'}</td>
        `;
        printTbody.appendChild(tr);
    });

    window.soundFX.playClick();
    window.print();
}

