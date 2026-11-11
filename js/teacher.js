// Teacher Dashboard Controller (teacher.html)

class TeacherDashboard {
    constructor() {
        this.allStudents = [];
        this.selectedGrade = 'ALL';
        this.searchQuery = '';
        this.PIN_KEY = 'pyquest_teacher_custom_pin';
        // Default PIN hash (SHA-256 of "krupython")
        this.DEFAULT_PIN_HASH = '89c774f4fda687fcca2963a5b1c21eb844a644b5838531a1e706088d27f17eef';
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
            const isFullScore = student.xp >= 100;

            tr.innerHTML = `
                <td style="font-family: var(--font-pixel); font-size: 0.8rem;">${medal}</td>
                <td>
                    <span style="font-size: 1.2rem; margin-right: 6px;">${student.avatar || '⚡'}</span>
                    <strong>${student.name}</strong>
                </td>
                <td><span class="tag-difficulty easy">${student.grade}</span></td>
                <td style="font-weight: 600;">${student.no}</td>
                <td style="text-align: center;">
                    <span style="font-family: var(--font-pixel); color: ${isFullScore ? 'var(--text-yellow)' : 'var(--text-cyan)'}; font-size: 0.95rem;">
                        ${student.xp} / 100 XP
                    </span>
                </td>
                <td style="text-align: center;">
                    <span style="color: ${completedCount === 5 ? 'var(--text-green)' : 'var(--text-muted)'}; font-weight: 600;">
                        ${completedCount} / 5 ข้อ
                    </span>
                </td>
                <td><span style="color: var(--text-yellow); font-family: var(--font-pixel); font-size: 0.72rem;">${student.badge || '-'}</span></td>
                <td style="color: var(--text-muted); font-size: 0.8rem;">${student.updatedAt || '-'}</td>
                <td style="text-align: center;">
                    <button type="button" class="tool-btn inspect-btn" data-id="${student.id}" style="color: var(--text-cyan); border-color: var(--border-neon); padding: 4px 8px;" title="คลิกเพื่อดูโค้ดของนักเรียนคนนี้">
                        🔍 ดูโค้ด
                    </button>
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
        document.getElementById('inspect-modal-title').textContent = `🔍 ตรวจโค้ดของ: ${student.name}`;
        document.getElementById('inspect-modal-sub').textContent = `ห้อง ${student.grade} เลขที่ ${student.no} • ได้คะแนน ${student.xp} XP (${student.badge})`;

        const container = document.getElementById('inspect-quests-container');
        container.innerHTML = '';

        const codes = student.questCodes || {};

        window.QUESTS.forEach(q => {
            const isPassed = (student.completedQuests || []).includes(q.id);
            const studentCode = codes[q.id] || '(ยังไม่ได้เขียนโค้ดในข้อนี้)';

            const card = document.createElement('div');
            card.style.background = '#0b1120';
            card.style.border = `1px solid ${isPassed ? 'var(--border-green)' : '#334155'}`;
            card.style.borderRadius = '6px';
            card.style.padding = '12px';

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <strong style="color: var(--text-cyan); font-size: 0.9rem;">ภารกิจที่ ${q.id}: ${q.title} (${q.category})</strong>
                    <span style="font-size: 0.8rem; font-weight: bold; color: ${isPassed ? 'var(--text-green)' : 'var(--text-muted)'};">
                        ${isPassed ? '✅ ผ่าน (20 XP)' : '⬜ ยังไม่ผ่าน (0 XP)'}
                    </span>
                </div>
                <pre style="background: #050811; color: #a5f3fc; padding: 10px; border-radius: 4px; font-family: var(--font-code); font-size: 0.85rem; overflow-x: auto; white-space: pre-wrap;">${this.escapeHtml(studentCode)}</pre>
            `;

            container.appendChild(card);
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
            if (b.xp !== a.xp) return b.xp - a.xp;
            return parseInt(a.no || 99) - parseInt(b.no || 99);
        });

        let csv = "\uFEFFลำดับ,ชื่อ-นามสกุล,ห้อง,เลขที่,คะแนน XP,ข้อที่ผ่าน,ฉายา,เวลาที่บันทึก\n";
        filtered.forEach((s, idx) => {
            const passedCount = (s.completedQuests || []).length;
            csv += `${idx + 1},"${s.name}","${s.grade}","${s.no}",${s.xp},"${passedCount}/10","${s.badge}","${s.updatedAt}"\n`;
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

