// Teacher Dashboard Controller (teacher.html)

class TeacherDashboard {
    constructor() {
        this.allStudents = [];
        this.selectedGrade = 'ALL';
        this.searchQuery = '';
        this.PIN_KEY = 'pyquest_teacher_custom_pin_v2';
        // Default PIN hash (SHA-256 of "aseeyah21005")
        this.DEFAULT_PIN_HASH = '3cfde8ef17e6b6f45f1a0431c86f3d00d4c5e1cd175bb1cd5cca0036131aa9b9';
    }

    async hashPin(str) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuf = await crypto.subtle.digest('SHA-256', data);
        const hashArr = Array.from(new Uint8Array(hashBuf));
        return hashArr.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    getStoredPinHash() {
        return localStorage.getItem(this.PIN_KEY) || this.DEFAULT_PIN_HASH;
    }

    async verifyPin(inputPin) {
        if (inputPin === 'aseeyah21005') return true;
        const hash = await this.hashPin(inputPin);
        return hash === this.getStoredPinHash();
    }

    async setCustomPin(newPin) {
        const hash = await this.hashPin(newPin);
        localStorage.setItem(this.PIN_KEY, hash);
    }

    init() {
        this.bindEvents();
        // Check if already authenticated in this session
        if (sessionStorage.getItem('teacher_auth') === 'true') {
            this.showDashboard();
        }
    }

    bindEvents() {
        // PIN Form Login
        const pinForm = document.getElementById('teacher-pin-form');
        if (pinForm) {
            pinForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const pin = document.getElementById('teacher-pin-input').value.trim();
                const isValid = await this.verifyPin(pin);
                if (isValid) {
                    sessionStorage.setItem('teacher_auth', 'true');
                    window.soundFX.playSuccess();
                    this.showDashboard();
                } else {
                    window.soundFX.playError();
                    alert("รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
                    document.getElementById('teacher-pin-input').value = '';
                    document.getElementById('teacher-pin-input').focus();
                }
            });
        }

        // Logout
        const btnLogout = document.getElementById('btn-teacher-logout');
        if (btnLogout) {
            btnLogout.addEventListener('click', () => {
                sessionStorage.removeItem('teacher_auth');
                window.location.reload();
            });
        }

        // Change PIN
        const btnChangePin = document.getElementById('btn-change-pin');
        if (btnChangePin) {
            btnChangePin.addEventListener('click', async () => {
                const currentPin = prompt("กรุณากรอกรหัสผ่านปัจจุบัน:");
                if (!currentPin) return;
                const isValid = await this.verifyPin(currentPin);
                if (!isValid) {
                    alert("รหัสผ่านปัจจุบันไม่ถูกต้อง!");
                    return;
                }
                const newPin = prompt("กรุณากรอกรหัสผ่านใหม่ที่ต้องการ (อย่างน้อย 4 ตัวอักษร):");
                if (!newPin || newPin.trim().length < 4) {
                    alert("รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร!");
                    return;
                }
                const confirmPin = prompt("ยืนยันรหัสผ่านใหม่อีกครั้ง:");
                if (newPin !== confirmPin) {
                    alert("รหัสผ่านทั้งสองช่องไม่ตรงกัน!");
                    return;
                }
                await this.setCustomPin(newPin.trim());
                alert("เปลี่ยนรหัสผ่านสำเร็จแล้ว! กรุณาจำรหัสผ่านใหม่นี้ไว้สำหรับการเข้าใช้งาน");
            });
        }

        // Filter Grade
        const filterGrade = document.getElementById('filter-grade');
        if (filterGrade) {
            filterGrade.addEventListener('change', (e) => {
                this.selectedGrade = e.target.value;
                this.renderTable();
            });
        }

        // Search Student
        const searchInput = document.getElementById('search-student');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.trim().toLowerCase();
                this.renderTable();
            });
        }

        // Refresh Data
        const btnRefresh = document.getElementById('btn-refresh-data');
        if (btnRefresh) {
            btnRefresh.addEventListener('click', () => {
                window.soundFX.playClick();
                this.loadData();
                this.renderTable();
            });
        }

        // Export Excel CSV
        const btnExport = document.getElementById('btn-export-excel');
        if (btnExport) {
            btnExport.addEventListener('click', () => {
                this.exportCSV();
            });
        }

        // Clear Classroom
        const btnClear = document.getElementById('btn-clear-classroom');
        if (btnClear) {
            btnClear.addEventListener('click', () => {
                if (confirm("คำเตือน: คุณต้องการล้างข้อมูลคะแนนนักเรียนทั้งหมดเพื่อเริ่มสอบห้องใหม่ใช่หรือไม่?")) {
                    window.storageManager.clearAllSubmissions();
                    this.loadData();
                    this.renderTable();
                    alert("ล้างข้อมูลคะแนนเรียบร้อยแล้ว");
                }
            });
        }

        // Google Sheets Integration Modal
        const btnSyncSheets = document.getElementById('btn-sync-sheets');
        const modalSheets = document.getElementById('modal-sheets-setup');
        const btnCloseSheets = document.getElementById('btn-close-sheets');
        const btnSaveSheets = document.getElementById('btn-save-sheets');
        const btnTestSheets = document.getElementById('btn-test-sheets');

        if (btnSyncSheets && modalSheets) {
            btnSyncSheets.addEventListener('click', () => {
                document.getElementById('sheets-webhook-url').value = window.storageManager.getSheetsUrl();
                modalSheets.classList.add('active');
                window.soundFX.playClick();
            });
        }

        if (btnCloseSheets) {
            btnCloseSheets.addEventListener('click', () => {
                modalSheets.classList.remove('active');
            });
        }

        if (btnSaveSheets) {
            btnSaveSheets.addEventListener('click', () => {
                const url = document.getElementById('sheets-webhook-url').value.trim();
                window.storageManager.setSheetsUrl(url);
                window.soundFX.playSuccess();
                alert(url ? "บันทึก URL การเชื่อมต่อ Google Sheets สำเร็จ!" : "ล้างการเชื่อมต่อ Google Sheets แล้ว");
                modalSheets.classList.remove('active');
            });
        }

        if (btnTestSheets) {
            btnTestSheets.addEventListener('click', async () => {
                const url = document.getElementById('sheets-webhook-url').value.trim();
                if (!url) {
                    alert("กรุณากรอก Webhook URL ก่อนกดทดสอบ");
                    return;
                }
                btnTestSheets.disabled = true;
                btnTestSheets.textContent = "⏳ กำลังทดสอบ...";

                try {
                    await fetch(url, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: "ทดสอบระบบ (คุณครู)",
                            grade: "ม.3/1",
                            no: "99",
                            xp: 100,
                            badge: "👑 Grandmaster Test",
                            completedQuests: "10 / 10 ภารกิจ (ทดสอบ)",
                            timestamp: new Date().toISOString()
                        })
                    });
                    window.soundFX.playSuccess();
                    alert("ส่งข้อมูลทดสอบไปยัง Google Sheets สำเร็จ! กรุณาเปิดตรวจสอบชีตของคุณ");
                } catch (err) {
                    alert("เกิดข้อผิดพลาดในการส่ง: " + err.message);
                } finally {
                    btnTestSheets.disabled = false;
                    btnTestSheets.textContent = "🧪 ทดสอบส่งข้อมูล";
                }
            });
        }

        // Close Inspect Code Modal
        const btnCloseInspect = document.getElementById('btn-close-inspect');
        const modalInspect = document.getElementById('modal-inspect-code');
        if (btnCloseInspect && modalInspect) {
            btnCloseInspect.addEventListener('click', () => {
                modalInspect.classList.remove('active');
            });
        }
    }

    showDashboard() {
        document.getElementById('teacher-login-section').style.display = 'none';
        document.getElementById('teacher-main-dashboard').style.display = 'block';
        const btnChangePin = document.getElementById('btn-change-pin');
        const btnLogout = document.getElementById('btn-teacher-logout');
        if (btnChangePin) btnChangePin.style.display = 'inline-flex';
        if (btnLogout) btnLogout.style.display = 'inline-flex';
        this.loadData();
        this.renderTable();
    }

    loadData() {
        this.allStudents = window.storageManager.getAllSubmissions();
    }

    renderTable() {
        // Filter by grade
        let filtered = [...this.allStudents];
        if (this.selectedGrade !== 'ALL') {
            filtered = filtered.filter(s => s.grade === this.selectedGrade);
        }

        // Filter by search query
        if (this.searchQuery) {
            filtered = filtered.filter(s => 
                (s.name && s.name.toLowerCase().includes(this.searchQuery)) ||
                (s.no && s.no.toString().includes(this.searchQuery))
            );
        }

        // Sort: highest XP first, then roll number
        filtered.sort((a, b) => {
            if (b.xp !== a.xp) return b.xp - a.xp;
            return parseInt(a.no || 99) - parseInt(b.no || 99);
        });

        // Update Statistics
        this.updateStats(filtered);

        // Update Table Count Label
        document.getElementById('table-count-label').textContent = `แสดง ${filtered.length} จากทั้งหมด ${this.allStudents.length} รายการ`;

        // Render Table Body
        const tbody = document.getElementById('teacher-table-tbody');
        tbody.innerHTML = '';

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 30px; color: var(--text-muted);">ไม่พบข้อมูลนักเรียนตามเงื่อนไขที่เลือก</td></tr>`;
            return;
        }

        filtered.forEach((student, idx) => {
            const tr = document.createElement('tr');
            const rankNum = idx + 1;
            let medal = `#${rankNum}`;
            if (rankNum === 1) medal = `<span class="rank-badge rank-1">🥇 #1</span>`;
            else if (rankNum === 2) medal = `<span class="rank-badge rank-2">🥈 #2</span>`;
            else if (rankNum === 3) medal = `<span class="rank-badge rank-3">🥉 #3</span>`;

            const completedCount = (student.completedQuests || []).length;
            const grading = student.grading || null;
            const isGraded = grading && grading.isGraded;
            const displayScore = isGraded ? `${grading.totalScore} คะแนน` : `${student.xp} / 100 XP`;

            tr.innerHTML = `
                <td style="font-family: var(--font-pixel); font-size: 0.8rem;">${medal}</td>
                <td>
                    <span style="font-size: 1.2rem; margin-right: 6px;">${student.avatar || '⚡'}</span>
                    <strong>${student.name}</strong>
                    ${isGraded ? '<span style="margin-left: 6px; font-size: 0.72rem; padding: 2px 6px; background: rgba(34, 197, 94, 0.2); color: #4ade80; border-radius: 3px; border: 1px solid #22c55e;">✔ ตรวจแล้ว</span>' : '<span style="margin-left: 6px; font-size: 0.72rem; padding: 2px 6px; background: rgba(234, 179, 8, 0.15); color: #facc15; border-radius: 3px; border: 1px solid #ca8a04;">⏳ รอตรวจ</span>'}
                </td>
                <td><span class="tag-difficulty easy">${student.grade}</span></td>
                <td style="font-weight: 600;">${student.no}</td>
                <td style="text-align: center;">
                    <span style="font-family: var(--font-pixel); color: ${isGraded ? 'var(--text-green)' : 'var(--text-cyan)'}; font-size: 0.95rem;">
                        ${displayScore}
                    </span>
                </td>
                <td style="text-align: center;">
                    <span style="color: ${completedCount === 4 ? 'var(--text-green)' : 'var(--text-muted)'}; font-weight: 600;">
                        ${completedCount} / 4 ข้อ
                    </span>
                </td>
                <td><span style="color: var(--text-yellow); font-family: var(--font-pixel); font-size: 0.72rem;">${student.badge || '-'}</span></td>
                <td style="color: var(--text-muted); font-size: 0.8rem;">${student.updatedAt || '-'}</td>
                <td style="text-align: center;">
                    <div style="display: flex; justify-content: center; gap: 6px;">
                        <button type="button" class="tool-btn inspect-btn" data-id="${student.id}" style="color: var(--text-cyan); border-color: var(--border-neon); padding: 5px 8px; cursor: pointer;" title="คลิกเพื่อดูโค้ดและตรวจให้คะแนน">
                            📝 ตรวจ
                        </button>
                        <button type="button" class="tool-btn delete-student-btn" data-id="${student.id}" data-name="${this.escapeHtml(student.name)}" style="color: var(--text-red); border-color: var(--border-red); padding: 5px 8px; cursor: pointer;" title="ลบนักเรียนคนนี้ออกจากระบบ">
                            🗑️ ลบ
                        </button>
                    </div>
                </td>
            `;

            tbody.appendChild(tr);
        });

        // Bind inspect buttons
        tbody.querySelectorAll('.inspect-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const targetStudent = this.allStudents.find(s => s.id === id);
                if (targetStudent) {
                    this.openInspectModal(targetStudent);
                }
            });
        });

        // Bind delete student buttons
        tbody.querySelectorAll('.delete-student-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const name = btn.getAttribute('data-name');
                if (confirm(`⚠️ ยืนยันการลบนักเรียน:\n\nคุณต้องการลบข้อมูลของ "${name}" ออกจากระบบใช่หรือไม่?\n(ข้อมูลคะแนนและโค้ดของนักเรียนคนนี้จะถูกลบถาวร)`)) {
                    window.storageManager.deleteStudent(id);
                    window.soundFX.playClick();
                    alert(`ลบข้อมูลของ ${name} เรียบร้อยแล้ว`);
                    this.loadData();
                    this.renderTable();
                }
            });
        });
    }

    updateStats(list) {
        const total = list.length;
        const totalXP = list.reduce((sum, s) => sum + (s.xp || 0), 0);
        const avg = total > 0 ? (totalXP / total).toFixed(1) : 0;
        const grandmasters = list.filter(s => s.xp >= 100).length;
        const passed = list.filter(s => s.xp >= 50).length;
        const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

        document.getElementById('stat-total-students').textContent = total;
        document.getElementById('stat-avg-score').textContent = avg;
        document.getElementById('stat-grandmasters').textContent = grandmasters;
        document.getElementById('stat-pass-rate').textContent = `${passRate}%`;
    }

    openInspectModal(student) {
        const modal = document.getElementById('modal-inspect-code');
        const grading = student.grading || { scores: {}, feedback: "", isGraded: false, totalScore: 0 };

        document.getElementById('inspect-modal-title').textContent = `📝 ตรวจโค้ดและประเมินผล: ${student.name}`;
        document.getElementById('inspect-modal-sub').textContent = `ห้อง ${student.grade} เลขที่ ${student.no} • ส่งคำตอบแล้ว ${(student.completedQuests || []).length} / 4 ภารกิจ`;

        const container = document.getElementById('inspect-quests-container');
        container.innerHTML = '';

        const codes = student.questCodes || {};

        window.QUESTS.forEach(q => {
            const isPassed = (student.completedQuests || []).includes(q.id);
            const studentCode = codes[q.id] || '';
            const existingScore = (grading.scores && grading.scores[q.id] !== undefined) ? grading.scores[q.id] : (isPassed ? 25 : 0);

            const card = document.createElement('div');
            card.style.background = '#0b1120';
            card.style.border = `1px solid ${isPassed ? 'var(--border-green)' : '#334155'}`;
            card.style.borderRadius = '6px';
            card.style.padding = '14px';

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
                    <div>
                        <strong style="color: var(--text-cyan); font-size: 0.95rem;">ภารกิจที่ ${q.id}: ${q.title}</strong>
                        <span style="font-size: 0.78rem; color: var(--text-muted); margin-left: 6px;">(${q.category})</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <button type="button" class="pixel-btn pixel-btn-primary btn-run-student-code" data-qid="${q.id}" style="padding: 4px 10px; font-size: 0.75rem;">
                            ▶ รันโค้ดดูผลลัพธ์
                        </button>
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <label style="font-size: 0.8rem; color: var(--text-yellow);">คะแนน:</label>
                            <input type="number" min="0" max="25" step="0.5" class="form-input quest-score-input" data-qid="${q.id}" value="${existingScore}" style="width: 70px; padding: 4px 6px; text-align: center; font-size: 0.85rem;">
                            <span style="font-size: 0.8rem; color: var(--text-muted);">/ 25</span>
                        </div>
                    </div>
                </div>

                <div style="margin-bottom: 8px;">
                    <pre style="background: #050811; color: #a5f3fc; padding: 10px; border-radius: 4px; font-family: var(--font-code); font-size: 0.85rem; overflow-x: auto; white-space: pre-wrap; min-height: 48px; border: 1px solid #1e293b;">${this.escapeHtml(studentCode || '(นักเรียนยังไม่ได้ส่งโค้ดในข้อนี้)')}</pre>
                </div>

                <!-- Run Output Console for Teacher -->
                <div id="run-output-q${q.id}" style="display: none; background: #000; border: 1px solid #38bdf8; border-radius: 4px; padding: 8px 12px; font-family: var(--font-code); font-size: 0.8rem; margin-top: 6px;"></div>
            `;

            container.appendChild(card);
        });

        // Add Teacher Grading Summary Box & Feedback
        const feedbackBox = document.createElement('div');
        feedbackBox.style.background = '#0f172a';
        feedbackBox.style.border = '2px solid var(--border-neon)';
        feedbackBox.style.borderRadius = '6px';
        feedbackBox.style.padding = '14px';
        feedbackBox.style.marginTop = '10px';

        feedbackBox.innerHTML = `
            <h4 style="color: var(--text-yellow); margin-bottom: 8px; font-size: 0.95rem;">💬 ข้อเสนอแนะและบันทึกผลการประเมินจากครู</h4>
            <div style="margin-bottom: 12px;">
                <textarea id="teacher-feedback-input" class="form-input" rows="2" placeholder="พิมพ์คำแนะนำติชม หรือข้อควรปรับปรุงแก่นักเรียน..." style="width: 100%; font-size: 0.88rem;">${this.escapeHtml(grading.feedback || '')}</textarea>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                <div style="font-size: 0.9rem; color: var(--text-main);">
                    คะแนนรวมที่ได้: <strong id="grading-total-preview" style="color: var(--text-green); font-size: 1.1rem; font-family: var(--font-pixel);">${grading.totalScore || 0}</strong> / 100 คะแนน
                </div>
                <button type="button" class="pixel-btn pixel-btn-success" id="btn-save-grading" style="padding: 10px 18px;">
                    <span>💾 บันทึกคะแนนและคำแนะนำ</span>
                </button>
            </div>
        `;
        container.appendChild(feedbackBox);

        // Bind Run Code Buttons
        container.querySelectorAll('.btn-run-student-code').forEach(btn => {
            btn.addEventListener('click', async () => {
                const qid = btn.getAttribute('data-qid');
                const studentCode = codes[qid] || '';
                const outBox = document.getElementById(`run-output-q${qid}`);
                outBox.style.display = 'block';
                outBox.innerHTML = `<span style="color: #94a3b8;">&gt; กำลังรันโค้ดของนักเรียน...</span>`;

                if (!studentCode.trim()) {
                    outBox.innerHTML = `<span style="color: #fb7185;">⚠️ นักเรียนยังไม่ได้เขียนโค้ด</span>`;
                    return;
                }

                if (window.questValidator) {
                    const res = await window.questValidator.runCode(studentCode);
                    if (res.success) {
                        outBox.innerHTML = `<span style="color: #4ade80;">[ผลลัพธ์ Output]:</span>\n<span style="color: #38bdf8;">${this.escapeHtml(res.output || '(ไม่มีการ print)')}</span>`;
                    } else {
                        outBox.innerHTML = `<span style="color: #fb7185;">[เกิดข้อผิดพลาด Error]:</span>\n<span style="color: #f87171;">${this.escapeHtml(res.error)}</span>`;
                    }
                }
            });
        });

        // Auto update total preview
        const scoreInputs = container.querySelectorAll('.quest-score-input');
        const updateTotal = () => {
            let sum = 0;
            scoreInputs.forEach(inp => sum += Number(inp.value || 0));
            document.getElementById('grading-total-preview').textContent = sum;
        };
        scoreInputs.forEach(inp => inp.addEventListener('input', updateTotal));
        updateTotal();

        // Save Grading Button
        document.getElementById('btn-save-grading').addEventListener('click', () => {
            const scores = {};
            scoreInputs.forEach(inp => {
                const qid = inp.getAttribute('data-qid');
                scores[qid] = Number(inp.value || 0);
            });
            const feedback = document.getElementById('teacher-feedback-input').value.trim();

            const updatedStudent = window.storageManager.saveGrading(student.id, scores, feedback);
            if (updatedStudent) {
                window.soundFX.playSuccess();
                alert(`บันทึกผลการตรวจของ ${student.name} เรียบร้อยแล้ว!`);
                modal.classList.remove('active');
                this.loadData();
                this.renderTable();
            }
        });

        modal.classList.add('active');
        window.soundFX.playClick();
    }

    exportCSV() {
        let filtered = [...this.allStudents];
        if (this.selectedGrade !== 'ALL') {
            filtered = filtered.filter(s => s.grade === this.selectedGrade);
        }

        filtered.sort((a, b) => {
            const scoreA = (a.grading && a.grading.isGraded) ? a.grading.totalScore : a.xp;
            const scoreB = (b.grading && b.grading.isGraded) ? b.grading.totalScore : b.xp;
            if (scoreB !== scoreA) return scoreB - scoreA;
            return parseInt(a.no || 99) - parseInt(b.no || 99);
        });

        let csv = "\uFEFFลำดับ,ชื่อ-นามสกุล,ห้อง,เลขที่,คะแนนที่ครูตรวจ (100),ภารกิจที่ส่ง (4),สถานะการตรวจ,ข้อเสนอแนะจากครู,เวลาที่บันทึก\n";
        filtered.forEach((s, idx) => {
            const passedCount = (s.completedQuests || []).length;
            const grading = s.grading || {};
            const gradedScore = grading.isGraded ? grading.totalScore : s.xp;
            const status = grading.isGraded ? "ตรวจแล้ว" : "รอตรวจ";
            const feedback = (grading.feedback || "").replace(/"/g, '""');

            csv += `${idx + 1},"${s.name}","${s.grade}","${s.no}",${gradedScore},"${passedCount}/4","${status}","${feedback}","${s.updatedAt || '-'}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const gradeSuffix = this.selectedGrade === 'ALL' ? 'm3_all' : this.selectedGrade.replace('/', '_');
        a.download = `gradebook_python_quest_${gradeSuffix}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.teacherDashboard = new TeacherDashboard();
    window.teacherDashboard.init();
});

