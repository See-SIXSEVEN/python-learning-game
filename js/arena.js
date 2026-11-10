// Quest Arena Page Controller (quest.html)

class ArenaController {
    constructor() {
        this.currentQuestId = 1;
        this.editor = null;
        this.fontSize = 15;
    }

    init() {
        // Guard: check if student profile exists
        if (!window.storageManager.hasRegistered()) {
            window.location.href = 'index.html';
            return;
        }

        this.initCodeEditor();
        this.bindEvents();
        this.loadState();
    }

    initCodeEditor() {
        const textarea = document.getElementById('python-code-editor');
        if (!textarea) return;

        this.editor = CodeMirror.fromTextArea(textarea, {
            mode: { name: 'python', version: 3, singleLineStringErrors: false },
            theme: 'dracula',
            lineNumbers: true,
            indentUnit: 4,
            tabSize: 4,
            indentWithTabs: false,
            lineWrapping: true,
            matchBrackets: true,
            autoCloseBrackets: true,
            extraKeys: {
                "Tab": function(cm) {
                    cm.replaceSelection("    ", "end");
                },
                "Ctrl-Enter": () => {
                    this.handleSubmitCode();
                },
                "Cmd-Enter": () => {
                    this.handleSubmitCode();
                }
            }
        });

        this.editor.on('change', () => {
            const code = this.editor.getValue();
            window.storageManager.saveQuestCode(this.currentQuestId, code);
        });
    }

    loadState() {
        // CRT setting
        const crtSetting = localStorage.getItem('pyquest_crt');
        if (crtSetting === 'off') {
            document.body.classList.add('crt-off');
        }

        // Sound state icon
        this.updateSoundIcon();

        // Load progress & header
        const progress = window.storageManager.getProgress();
        this.currentQuestId = progress.currentQuestId || 1;

        this.renderHeader();
        this.renderQuestRibbon();
        this.loadQuest(this.currentQuestId);
    }

    renderHeader() {
        const student = window.storageManager.getStudent();
        if (!student) return;

        document.getElementById('header-student-avatar').textContent = student.avatar || '⚡';
        document.getElementById('header-student-name').textContent = student.name;
        document.getElementById('header-student-sub').textContent = `${student.grade} • เลขที่ ${student.no}`;

        this.updateXPBar();
    }

    updateXPBar() {
        const progress = window.storageManager.getProgress();
        const xp = progress.totalXP || 0;
        const rank = window.storageManager.getRankInfo(xp);

        const xpFill = document.getElementById('header-xp-fill');
        const xpText = document.getElementById('header-xp-text');
        const rankTitle = document.getElementById('header-rank-title');

        if (xpFill) xpFill.style.width = `${Math.min(xp, 100)}%`;
        if (xpText) xpText.textContent = `${xp} / 100 XP`;
        if (rankTitle) {
            rankTitle.textContent = `${rank.badgeIcon} ${rank.title}`;
            rankTitle.style.color = rank.color;
        }
    }

    renderQuestRibbon() {
        const ribbon = document.getElementById('quest-selector-ribbon');
        if (!ribbon) return;

        const progress = window.storageManager.getProgress();
        ribbon.innerHTML = '';

        window.QUESTS.forEach(q => {
            const isPassed = progress.completedQuests.includes(q.id);
            const isActive = q.id === this.currentQuestId;

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `quest-tab-btn ${isActive ? 'active' : ''} ${isPassed ? 'passed' : ''}`;
            btn.title = `${q.title} (${q.difficulty})`;

            let icon = isPassed ? '✔' : (isActive ? '★' : '•');
            btn.innerHTML = `<span class="tab-status-icon">${icon}</span> ภารกิจ ${q.id}`;

            btn.addEventListener('click', () => {
                window.soundFX.playClick();
                this.loadQuest(q.id);
            });

            ribbon.appendChild(btn);
        });
    }

    loadQuest(questId) {
        const quest = window.QUESTS.find(q => q.id === questId);
        if (!quest) return;

        this.currentQuestId = questId;

        // Save active quest
        const progress = window.storageManager.getProgress();
        progress.currentQuestId = questId;
        window.storageManager.saveProgress(progress);

        // Update Quest Info
        document.getElementById('quest-card-num').textContent = `ภารกิจที่ ${quest.id} / 10 • ${quest.category}`;
        const diffBadge = document.getElementById('quest-card-difficulty');
        diffBadge.textContent = quest.difficulty;
        diffBadge.className = `tag-difficulty ${quest.difficultyClass}`;

        document.getElementById('quest-card-xp').textContent = `+${quest.xp} XP`;
        document.getElementById('quest-card-title').textContent = quest.title;
        document.getElementById('quest-card-lore').textContent = `"${quest.lore}"`;
        document.getElementById('quest-card-instruction').innerHTML = quest.instruction;
        document.getElementById('quest-expected-output').textContent = quest.sampleOutput;

        // Render Checklist
        const checkContainer = document.getElementById('quest-checklist-container');
        checkContainer.innerHTML = '';
        quest.checklist.forEach(item => {
            const row = document.createElement('div');
            row.className = 'checklist-item';
            row.id = `check-${item.id}`;
            row.innerHTML = `
                <span class="checklist-icon">⬜</span>
                <span>${item.text}</span>
            `;
            checkContainer.appendChild(row);
        });

        // Render Hints
        const hintBody = document.getElementById('hint-body-content');
        let hintHtml = '<ul>';
        quest.hints.forEach(h => {
            hintHtml += `<li>${h}</li>`;
        });
        hintHtml += '</ul>';
        hintBody.innerHTML = hintHtml;
        hintBody.classList.remove('open');
        document.getElementById('hint-arrow').textContent = '▼';

        // Load Code into Editor
        const savedCode = window.storageManager.getQuestCode(questId);
        if (this.editor) {
            this.editor.setValue(savedCode);
            setTimeout(() => this.editor.refresh(), 50);
        }

        // Reset Terminal & Banner
        this.hideValidationBanner();
        const terminal = document.getElementById('terminal-output-area');
        terminal.innerHTML = `<span class="terminal-prompt">&gt; เข้าสู่ภารกิจที่ ${quest.id}: ${quest.title}</span>\n<span class="terminal-prompt">&gt; แก้ไขโค้ดใน main.py แล้วกด [รันโค้ด] หรือ [ส่งคำตอบ]</span>\n<span class="terminal-cursor"></span>`;

        this.renderQuestRibbon();

        const btnPrev = document.getElementById('btn-prev-quest');
        const btnNext = document.getElementById('btn-next-quest');
        if (btnPrev) btnPrev.disabled = questId === 1;
        if (btnNext) {
            btnNext.innerHTML = questId === 10 ? '<span>สรุปผลภารกิจ 🏆</span>' : '<span>ภารกิจถัดไป ▶</span>';
        }
    }

    async handleRunCode() {
        if (!this.editor) return;
        const code = this.editor.getValue();
        window.soundFX.playRun();

        const terminal = document.getElementById('terminal-output-area');
        terminal.innerHTML = `<span class="terminal-prompt">&gt; python3 main.py ... กำลังรันโค้ด</span>\n`;

        const result = await window.questValidator.validateQuest(this.currentQuestId, code);

        if (result.error) {
            terminal.innerHTML += `<span class="terminal-error">${this.escapeHtml(result.error)}</span>\n`;
            this.showValidationBanner(false, "เกิดข้อผิดพลาดในการรันโค้ด ตรวจสอบรายละเอียดใน Terminal ด้านล่าง");
        } else {
            terminal.innerHTML += `<span style="color: #38bdf8;">${this.escapeHtml(result.output || '(ไม่มีผลลัพธ์การแสดงผล)')}</span>\n`;
            this.updateChecklistUI(result.checklistResults);

            if (result.success) {
                this.showValidationBanner(true, "โค้ดทำงานถูกต้องตามเงื่อนไข! กด [ส่งคำตอบ] เพื่อรับคะแนน XP");
            } else {
                this.showValidationBanner(false, "ผลการรันยังไม่ตรงตามเงื่อนไขทั้งหมด ตรวจดูรายการ Checklist ด้านซ้ายนะ");
            }
        }
        terminal.innerHTML += `<span class="terminal-cursor"></span>`;
        terminal.scrollTop = terminal.scrollHeight;
    }

    async handleSubmitCode() {
        if (!this.editor) return;
        const code = this.editor.getValue();
        window.soundFX.playRun();

        const terminal = document.getElementById('terminal-output-area');
        terminal.innerHTML = `<span class="terminal-prompt">&gt; กำลังตรวจสอบความถูกต้องของภารกิจที่ ${this.currentQuestId} ...</span>\n`;

        const result = await window.questValidator.validateQuest(this.currentQuestId, code);

        if (result.error) {
            window.soundFX.playError();
            terminal.innerHTML += `<span class="terminal-error">${this.escapeHtml(result.error)}</span>\n`;
            this.showValidationBanner(false, "ยังไม่ผ่าน: โค้ดมี Error กรุณาแก้ไขตามคำแนะนำ");
            this.updateChecklistUI(result.checklistResults);
        } else {
            terminal.innerHTML += `<span style="color: #38bdf8;">${this.escapeHtml(result.output)}</span>\n`;
            this.updateChecklistUI(result.checklistResults);

            if (result.success) {
                window.soundFX.playSuccess();
                this.triggerConfetti();

                const updatedProgress = window.storageManager.markQuestPassed(this.currentQuestId, code, 10);
                window.storageManager.recordSubmission(window.storageManager.getStudent(), updatedProgress);
                this.updateXPBar();
                this.renderQuestRibbon();

                if (updatedProgress.totalXP >= 100) {
                    window.soundFX.playLevelUp();
                    this.showToast("👑 ยินดีด้วย! คุณได้รับฉายา PYTHON GRANDMASTER คะแนนเต็ม 100 XP!");
                } else {
                    this.showToast(`🎉 ผ่านภารกิจที่ ${this.currentQuestId} สำเร็จ! ได้รับ +10 XP`);
                }

                this.showValidationBanner(true, result.feedback, true);
            } else {
                window.soundFX.playError();
                this.showValidationBanner(false, result.feedback);
            }
        }

        terminal.innerHTML += `<span class="terminal-cursor"></span>`;
        terminal.scrollTop = terminal.scrollHeight;
    }

    updateChecklistUI(checklistResults) {
        if (!checklistResults) return;
        checklistResults.forEach(item => {
            const el = document.getElementById(`check-${item.id}`);
            if (el) {
                if (item.passed) {
                    el.classList.add('passed');
                    el.querySelector('.checklist-icon').textContent = '✅';
                } else {
                    el.classList.remove('passed');
                    el.querySelector('.checklist-icon').textContent = '⬜';
                }
            }
        });
    }

    showValidationBanner(isSuccess, message, showNextBtn = false) {
        const banner = document.getElementById('validation-banner');
        const icon = document.getElementById('validation-icon');
        const text = document.getElementById('validation-text');
        const nextBtn = document.getElementById('btn-banner-next');

        banner.className = `validation-banner show ${isSuccess ? 'success' : 'error'}`;
        icon.textContent = isSuccess ? '🎉' : '⚠️';
        text.textContent = message;

        if (showNextBtn) {
            nextBtn.style.display = 'inline-flex';
            nextBtn.querySelector('span').textContent = this.currentQuestId === 10 ? 'ดูสรุปผลภารกิจ 🏆' : 'ลุยข้อต่อไป ▶';
        } else {
            nextBtn.style.display = 'none';
        }
    }

    hideValidationBanner() {
        const banner = document.getElementById('validation-banner');
        banner.className = 'validation-banner';
    }

    triggerConfetti() {
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    }

    bindEvents() {
        // Run & Submit
        document.getElementById('btn-run-code').addEventListener('click', () => this.handleRunCode());
        document.getElementById('btn-submit-answer').addEventListener('click', () => this.handleSubmitCode());

        // Banner Next Button
        document.getElementById('btn-banner-next').addEventListener('click', () => {
            if (this.currentQuestId < 10) {
                this.loadQuest(this.currentQuestId + 1);
            } else {
                window.location.href = 'summary.html';
            }
        });

        // Prev & Next Quest Footer
        document.getElementById('btn-prev-quest').addEventListener('click', () => {
            if (this.currentQuestId > 1) {
                this.loadQuest(this.currentQuestId - 1);
            }
        });
        document.getElementById('btn-next-quest').addEventListener('click', () => {
            if (this.currentQuestId < 10) {
                this.loadQuest(this.currentQuestId + 1);
            } else {
                window.location.href = 'summary.html';
            }
        });

        // Reset Code
        document.getElementById('btn-reset-code').addEventListener('click', () => {
            const quest = window.QUESTS.find(q => q.id === this.currentQuestId);
            if (quest && this.editor) {
                this.editor.setValue(quest.starterCode);
                window.storageManager.saveQuestCode(this.currentQuestId, quest.starterCode);
                this.showToast("รีเซ็ตโค้ดเรียบร้อยแล้ว");
                window.soundFX.playClick();
            }
        });

        // Zoom In & Out
        document.getElementById('btn-zoom-in').addEventListener('click', () => {
            if (this.fontSize < 24) {
                this.fontSize += 2;
                this.updateEditorFontSize();
            }
        });
        document.getElementById('btn-zoom-out').addEventListener('click', () => {
            if (this.fontSize > 12) {
                this.fontSize -= 2;
                this.updateEditorFontSize();
            }
        });

        // Clear Terminal
        document.getElementById('btn-clear-terminal').addEventListener('click', () => {
            const terminal = document.getElementById('terminal-output-area');
            terminal.innerHTML = '<span class="terminal-prompt">&gt; จอภาพถูกเคลียร์แล้ว</span><span class="terminal-cursor"></span>';
            window.soundFX.playClick();
        });

        // Hint Toggle
        document.getElementById('hint-toggle-btn').addEventListener('click', () => {
            const hintBody = document.getElementById('hint-body-content');
            const arrow = document.getElementById('hint-arrow');
            const isOpen = hintBody.classList.toggle('open');
            arrow.textContent = isOpen ? '▲' : '▼';
            window.soundFX.playClick();
        });

        // Sound Toggle
        document.getElementById('btn-toggle-sound').addEventListener('click', () => {
            window.soundFX.toggleMute();
            this.updateSoundIcon();
        });

        // CRT Toggle
        document.getElementById('btn-toggle-crt').addEventListener('click', () => {
            document.body.classList.toggle('crt-off');
            const isOff = document.body.classList.contains('crt-off');
            localStorage.setItem('pyquest_crt', isOff ? 'off' : 'on');
            this.showToast(isOff ? 'ปิดเอฟเฟกต์ CRT แล้ว' : 'เปิดเอฟเฟกต์ CRT แล้ว');
            window.soundFX.playClick();
        });

        // Cheat Sheet Modal
        const modalCheat = document.getElementById('modal-cheatsheet');
        document.getElementById('btn-cheatsheet').addEventListener('click', () => {
            modalCheat.classList.add('active');
            window.soundFX.playClick();
        });
        document.getElementById('btn-close-cheatsheet').addEventListener('click', () => {
            modalCheat.classList.remove('active');
        });
        document.getElementById('btn-close-cheatsheet-bottom').addEventListener('click', () => {
            modalCheat.classList.remove('active');
        });

        // Teacher Panel Modal
        const modalTeacher = document.getElementById('modal-teacher');
        document.getElementById('btn-teacher-mode').addEventListener('click', () => {
            modalTeacher.classList.add('active');
            window.soundFX.playClick();
        });
        document.getElementById('btn-close-teacher').addEventListener('click', () => {
            modalTeacher.classList.remove('active');
        });

        document.getElementById('btn-teacher-login').addEventListener('click', () => {
            const pin = document.getElementById('teacher-passcode').value.trim();
            if (pin === 'teacher' || pin === '1234') {
                document.getElementById('teacher-auth-section').style.display = 'none';
                document.getElementById('teacher-dashboard-section').style.display = 'block';
                this.renderTeacherSolutions();
                window.soundFX.playSuccess();
            } else {
                alert("รหัสผ่านไม่ถูกต้อง (รหัสเริ่มต้น: teacher หรือ 1234)");
            }
        });

        document.getElementById('btn-teacher-unlock-all').addEventListener('click', () => {
            const progress = window.storageManager.getProgress();
            window.QUESTS.forEach(q => {
                window.storageManager.markQuestPassed(q.id, q.solutionCode, 10);
            });
            this.updateXPBar();
            this.renderQuestRibbon();
            this.showToast("🔓 ปลดล็อก 100 XP ครบทุกข้อแล้ว!");
            modalTeacher.classList.remove('active');
        });

        document.getElementById('btn-teacher-export-csv').addEventListener('click', () => {
            this.exportCSV();
        });

        // Navigation to Summary Page
        document.getElementById('btn-goto-summary').addEventListener('click', () => {
            window.soundFX.playClick();
            window.location.href = 'summary.html';
        });

        // Switch User -> Back to Registration Page
        document.getElementById('btn-switch-user').addEventListener('click', () => {
            this.openConfirmModal(
                "เปลี่ยนผู้ใช้งาน",
                "คุณต้องการกลับไปยังหน้าลงทะเบียนเพื่อเปลี่ยนผู้ใช้งานหรือไม่?",
                () => {
                    window.location.href = 'index.html';
                }
            );
        });

        // Modal Confirmation Close Handlers
        const modalConfirm = document.getElementById('modal-confirm');
        document.getElementById('btn-close-modal').addEventListener('click', () => modalConfirm.classList.remove('active'));
        document.getElementById('btn-modal-cancel').addEventListener('click', () => modalConfirm.classList.remove('active'));
    }

    renderTeacherSolutions() {
        const list = document.getElementById('teacher-solutions-list');
        list.innerHTML = '';
        window.QUESTS.forEach(q => {
            const div = document.createElement('div');
            div.style.marginBottom = '12px';
            div.innerHTML = `
                <div style="color: var(--text-yellow); font-weight: bold; margin-bottom: 4px;">ภารกิจที่ ${q.id}: ${q.title} (${q.category})</div>
                <pre style="background: #1e293b; color: #a5f3fc; padding: 6px; border-radius: 4px; overflow-x: auto;">${this.escapeHtml(q.solutionCode)}</pre>
            `;
            list.appendChild(div);
        });
    }

    exportCSV() {
        const student = window.storageManager.getStudent();
        const progress = window.storageManager.getProgress();
        const leaderboard = window.storageManager.getCombinedLeaderboard();

        let csv = "\uFEFFลำดับ,ชื่อ-นามสกุล,ห้อง,เลขที่,คะแนน XP,ฉายา,สถานะ\n";
        leaderboard.forEach((entry, idx) => {
            csv += `${idx + 1},"${entry.name}","${entry.grade}","${entry.no}",${entry.xp},"${entry.badge}","${entry.time}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `python_quest_scores_${student ? student.grade.replace('/', '_') : 'm3'}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    openConfirmModal(title, desc, onConfirm) {
        const modal = document.getElementById('modal-confirm');
        document.getElementById('modal-confirm-title').textContent = title;
        document.getElementById('modal-confirm-desc').textContent = desc;

        const btnOk = document.getElementById('btn-modal-ok');
        const newBtnOk = btnOk.cloneNode(true);
        btnOk.parentNode.replaceChild(newBtnOk, btnOk);

        newBtnOk.addEventListener('click', () => {
            modal.classList.remove('active');
            if (typeof onConfirm === 'function') onConfirm();
        });

        modal.classList.add('active');
        window.soundFX.playClick();
    }

    updateSoundIcon() {
        const soundIcon = document.getElementById('sound-icon');
        if (soundIcon) {
            soundIcon.textContent = window.soundFX.isMuted() ? '🔇' : '🔊';
        }
    }

    updateEditorFontSize() {
        const cmEl = document.querySelector('.CodeMirror');
        if (cmEl) {
            cmEl.style.fontSize = `${this.fontSize}px`;
            this.editor.refresh();
        }
    }

    showToast(message) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<span>💬</span> <span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3200);
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
    window.arenaApp = new ArenaController();
    window.arenaApp.init();
});

