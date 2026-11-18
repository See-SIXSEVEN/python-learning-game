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
        if (this.currentQuestId < 1 || this.currentQuestId > 4) {
            this.currentQuestId = 1;
            progress.currentQuestId = 1;
            window.storageManager.saveProgress(progress);
        }

        this.renderHeader();
        this.renderQuestRibbon();
        this.loadQuest(this.currentQuestId);

        // Auto-sync previous work to Firebase Cloud if any
        const student = window.storageManager.getStudent();
        if (student && progress && (progress.completedQuests.length > 0 || Object.keys(progress.questCodes || {}).length > 0)) {
            setTimeout(() => {
                if (window.firebaseService) {
                    window.firebaseService.saveSubmission(student, progress);
                    console.log("Auto-synced existing work to Firebase Cloud ☁️⚡");
                }
            }, 1000);
        }
    }

    renderHeader() {
        const student = window.storageManager.getStudent();
        if (!student) return;

        document.getElementById('header-student-avatar').textContent = student.avatar || '⚡';
        // Show pair names in header
        const partnerInfo = student.partner ? ` & ${student.partner.name}` : '';
        document.getElementById('header-student-name').textContent = student.name + partnerInfo;
        const partnerNo = student.partner ? ` & เลขที่ ${student.partner.no}` : '';
        document.getElementById('header-student-sub').textContent = `${student.grade} • เลขที่ ${student.no}${partnerNo}`;

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
            btn.title = q.title;

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
        let quest = window.QUESTS.find(q => q.id === questId);
        if (!quest) {
            quest = window.QUESTS[0];
            questId = 1;
        }

        this.currentQuestId = questId;

        // Save active quest
        const progress = window.storageManager.getProgress();
        progress.currentQuestId = questId;
        window.storageManager.saveProgress(progress);

        // Update Quest Info (Clean & Simple)
        const numBadge = document.getElementById('quest-card-num');
        if (numBadge) numBadge.textContent = `ข้อที่ ${quest.id} / 4`;

        const titleEl = document.getElementById('quest-card-title');
        if (titleEl) titleEl.textContent = quest.title;

        const instructionEl = document.getElementById('quest-card-instruction');
        if (instructionEl) instructionEl.innerHTML = quest.instruction;

        const outputEl = document.getElementById('quest-expected-output');
        if (outputEl) outputEl.textContent = quest.sampleOutput;

        // Load Code into Editor
        const savedCode = window.storageManager.getQuestCode(questId);
        if (this.editor) {
            this.editor.setValue(savedCode);
            setTimeout(() => this.editor.refresh(), 50);
        }

        // Reset Terminal & Banner
        this.hideValidationBanner();
        const terminal = document.getElementById('terminal-output-area');
        terminal.innerHTML = `<span class="terminal-prompt">&gt; ${quest.title}</span>\n<span class="terminal-prompt">&gt; เขียนโค้ดในหน้าต่างด้านบน แล้วกด [▶ รันโค้ด] เพื่อทดสอบ หรือ [🚀 ส่งคำตอบ]</span>\n<span class="terminal-cursor"></span>`;

        this.renderQuestRibbon();

        const btnPrev = document.getElementById('btn-prev-quest');
        const btnNext = document.getElementById('btn-next-quest');
        if (btnPrev) btnPrev.disabled = questId === 1;
        if (btnNext) {
            btnNext.innerHTML = questId === 4 ? '<span>ดูสรุปผล 🏆</span>' : '<span>ข้อถัดไป ▶</span>';
        }
    }

    async handleRunCode() {
        if (!this.editor) return;
        const code = this.editor.getValue();
        window.soundFX.playRun();

        const terminal = document.getElementById('terminal-output-area');
        terminal.innerHTML = `<span class="terminal-prompt">&gt; python3 main.py ... รันโค้ด</span>\n`;

        const result = await window.questValidator.runCode(code);

        if (!result.success) {
            terminal.innerHTML += `<span class="terminal-error">${this.escapeHtml(result.error)}</span>\n`;
        } else {
            terminal.innerHTML += `<span style="color: #38bdf8;">${this.escapeHtml(result.output || '(ไม่มีผลลัพธ์การแสดงผล - อย่าลืมใช้คำสั่ง print)')}</span>\n`;
        }
        terminal.innerHTML += `<span class="terminal-cursor"></span>`;
        terminal.scrollTop = terminal.scrollHeight;
    }

    async handleSubmitCode() {
        if (!this.editor) return;
        const code = this.editor.getValue();

        if (!code || !code.trim()) {
            alert("⚠️ ยังไม่ได้เขียนโค้ดในข้อนี้ กรุณาเขียนโค้ดก่อนกดส่งนะ");
            return;
        }

        // Test run in background to see if there's error to inform the student
        const result = await window.questValidator.runCode(code);
        let confirmMsg = `คุณต้องการบันทึกและส่งโค้ดข้อที่ ${this.currentQuestId} ให้คุณครูตรวจใช่หรือไม่?`;
        if (!result.success) {
            confirmMsg = `⚠️ โค้ดข้อนี้ยังรันแล้วมี Error อยู่:\n"${result.error.split('\n')[0]}"\n\nคุณยังคงต้องการยืนยันที่จะส่งโค้ดนี้ให้คุณครูตรวจใช่หรือไม่?`;
        }

        this.openConfirmModal(
            `🚀 ยืนยันส่งคำตอบ ข้อที่ ${this.currentQuestId}`,
            confirmMsg,
            () => {
                this.executeSubmit(code);
            }
        );
    }

    executeSubmit(code) {
        window.soundFX.playSuccess();
        this.triggerConfetti();

        const updatedProgress = window.storageManager.markQuestPassed(this.currentQuestId, code, 25);
        window.storageManager.recordSubmission(window.storageManager.getStudent(), updatedProgress);
        this.updateXPBar();
        this.renderQuestRibbon();

        this.showToast(`✅ บันทึกส่งคำตอบข้อที่ ${this.currentQuestId} เรียบร้อยแล้ว!`);
        this.showValidationBanner(true, `ส่งคำตอบข้อที่ ${this.currentQuestId} เรียบร้อยแล้ว! ครูจะทำการตรวจประเมิน`, true);

        const terminal = document.getElementById('terminal-output-area');
        if (terminal) {
            terminal.innerHTML += `\n<span style="color: #4ade80;">&gt; [ระบบ]: ส่งโค้ดข้อที่ ${this.currentQuestId} ถึงคุณครูเรียบร้อยแล้ว</span>\n`;
            terminal.scrollTop = terminal.scrollHeight;
        }
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
            nextBtn.querySelector('span').textContent = this.currentQuestId === 4 ? 'ดูสรุปผลภารกิจ 🏆' : 'ลุยข้อต่อไป ▶';
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
            if (this.currentQuestId < 4) {
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
            if (this.currentQuestId < 4) {
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

    openConfirmModal(title, desc, onConfirm) {
        const modal = document.getElementById('modal-confirm');
        document.getElementById('modal-confirm-title').textContent = title;
        document.getElementById('modal-confirm-desc').textContent = desc;

        const closeModal = () => {
            modal.classList.remove('active');
            window.soundFX.playClick();
        };

        const btnClose = document.getElementById('btn-close-modal');
        const btnCancel = document.getElementById('btn-modal-cancel');
        const btnOk = document.getElementById('btn-modal-ok');

        // Rebind Close button
        const newBtnClose = btnClose.cloneNode(true);
        btnClose.parentNode.replaceChild(newBtnClose, btnClose);
        newBtnClose.addEventListener('click', closeModal);

        // Rebind Cancel button
        const newBtnCancel = btnCancel.cloneNode(true);
        btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);
        newBtnCancel.addEventListener('click', closeModal);

        // Rebind OK button
        const newBtnOk = btnOk.cloneNode(true);
        btnOk.parentNode.replaceChild(newBtnOk, btnOk);
        newBtnOk.addEventListener('click', () => {
            modal.classList.remove('active');
            if (typeof onConfirm === 'function') onConfirm();
        });

        // Click outside backdrop to close
        modal.onclick = (e) => {
            if (e.target === modal) {
                closeModal();
            }
        };

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

