// Main Application Controller for Python Quest (ม.3)

class AppController {
    constructor() {
        this.currentScreen = 'registration';
        this.currentQuestId = 1;
        this.editor = null;
        this.fontSize = 15;
        this.selectedAvatar = '⚡';
    }

    init() {
        this.initCodeEditor();
        this.bindEvents();
        this.loadInitialState();
    }

    // Initialize CodeMirror Editor
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

    // Load initial state from storage
    loadInitialState() {
        // Sound FX initial icon
        this.updateSoundIcon();

        // CRT Mode
        const crtSetting = localStorage.getItem('pyquest_crt');
        if (crtSetting === 'off') {
            document.body.classList.add('crt-off');
        }

        // Check registration
        const student = window.storageManager.getStudent();
        if (student) {
            const progress = window.storageManager.getProgress();
            this.currentQuestId = progress.currentQuestId || 1;
            this.showScreen('arena');
            this.renderHeader();
            this.renderQuestRibbon();
            this.loadQuest(this.currentQuestId);
        } else {
            this.showScreen('registration');
        }
    }

    // Switch active screen view
    showScreen(screenId) {
        this.currentScreen = screenId;
        document.querySelectorAll('.screen-view').forEach(s => s.classList.remove('active'));
        
        const target = document.getElementById(`screen-${screenId}`);
        if (target) {
            target.classList.add('active');
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (screenId === 'arena' && this.editor) {
            setTimeout(() => {
                this.editor.refresh();
                this.editor.focus();
            }, 100);
        }

        if (screenId === 'summary') {
            this.renderSummary();
        }
    }

    // Bind UI Event Listeners
    bindEvents() {
        // Registration Form
        const regForm = document.getElementById('registration-form');
        if (regForm) {
            regForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegistration();
            });
        }

        // Avatar selector
        document.querySelectorAll('.avatar-option').forEach(opt => {
            opt.addEventListener('click', () => {
                document.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                this.selectedAvatar = opt.getAttribute('data-avatar');
                window.soundFX.playClick();
            });
        });

        // Sound Toggle
        const btnSound = document.getElementById('btn-toggle-sound');
        if (btnSound) {
            btnSound.addEventListener('click', () => {
                window.soundFX.toggleMute();
                this.updateSoundIcon();
            });
        }

        // CRT Toggle
        const btnCrt = document.getElementById('btn-toggle-crt');
        if (btnCrt) {
            btnCrt.addEventListener('click', () => {
                document.body.classList.toggle('crt-off');
                const isOff = document.body.classList.contains('crt-off');
                localStorage.setItem('pyquest_crt', isOff ? 'off' : 'on');
                this.showToast(isOff ? 'ปิดเอฟเฟกต์ CRT แล้ว' : 'เปิดเอฟเฟกต์ CRT แล้ว');
                window.soundFX.playClick();
            });
        }

        // Navigation in Arena Header
        const btnSummary = document.getElementById('btn-goto-summary');
        if (btnSummary) {
            btnSummary.addEventListener('click', () => {
                window.soundFX.playClick();
                this.showScreen('summary');
            });
        }

        const btnSwitchUser = document.getElementById('btn-switch-user');
        if (btnSwitchUser) {
            btnSwitchUser.addEventListener('click', () => {
                this.openConfirmModal(
                    "เปลี่ยนผู้ใช้งาน",
                    "คุณต้องการเปลี่ยนชื่อผู้ใช้งานหรือไม่? (ข้อมูลคะแนนของผู้ใช้ปัจจุบันยังคงถูกบันทึกไว้)",
                    () => {
                        this.showScreen('registration');
                    }
                );
            });
        }

        // Hint Toggle
        const hintToggle = document.getElementById('hint-toggle-btn');
        if (hintToggle) {
            hintToggle.addEventListener('click', () => {
                const hintBody = document.getElementById('hint-body-content');
                const arrow = document.getElementById('hint-arrow');
                const isOpen = hintBody.classList.toggle('open');
                arrow.textContent = isOpen ? '▲' : '▼';
                window.soundFX.playClick();
            });
        }

        // Code Editor Toolbar Buttons
        const btnResetCode = document.getElementById('btn-reset-code');
        if (btnResetCode) {
            btnResetCode.addEventListener('click', () => {
                const quest = window.QUESTS.find(q => q.id === this.currentQuestId);
                if (quest && this.editor) {
                    this.editor.setValue(quest.starterCode);
                    window.storageManager.saveQuestCode(this.currentQuestId, quest.starterCode);
                    this.showToast("รีเซ็ตโค้ดเรียบร้อยแล้ว");
                    window.soundFX.playClick();
                }
            });
        }

        const btnZoomIn = document.getElementById('btn-zoom-in');
        if (btnZoomIn) {
            btnZoomIn.addEventListener('click', () => {
                if (this.fontSize < 24) {
                    this.fontSize += 2;
                    this.updateEditorFontSize();
                }
            });
        }

        const btnZoomOut = document.getElementById('btn-zoom-out');
        if (btnZoomOut) {
            btnZoomOut.addEventListener('click', () => {
                if (this.fontSize > 12) {
                    this.fontSize -= 2;
                    this.updateEditorFontSize();
                }
            });
        }

        // Terminal Clear
        const btnClearTerminal = document.getElementById('btn-clear-terminal');
        if (btnClearTerminal) {
            btnClearTerminal.addEventListener('click', () => {
                const terminal = document.getElementById('terminal-output-area');
                terminal.innerHTML = '<span class="terminal-prompt">&gt; จอภาพถูกเคลียร์แล้ว</span><span class="terminal-cursor"></span>';
                window.soundFX.playClick();
            });
        }

        // Run Code Button (Compile and run without submission)
        const btnRun = document.getElementById('btn-run-code');
        if (btnRun) {
            btnRun.addEventListener('click', () => {
                this.handleRunCode();
            });
        }

        // Submit Answer Button (Validate against checklist criteria)
        const btnSubmit = document.getElementById('btn-submit-answer');
        if (btnSubmit) {
            btnSubmit.addEventListener('click', () => {
                this.handleSubmitCode();
            });
        }

        // Banner Next Button
        const btnBannerNext = document.getElementById('btn-banner-next');
        if (btnBannerNext) {
            btnBannerNext.addEventListener('click', () => {
                if (this.currentQuestId < 10) {
                    this.loadQuest(this.currentQuestId + 1);
                } else {
                    this.showScreen('summary');
                }
            });
        }

        // Prev/Next Quest in Footer
        const btnPrev = document.getElementById('btn-prev-quest');
        if (btnPrev) {
            btnPrev.addEventListener('click', () => {
                if (this.currentQuestId > 1) {
                    this.loadQuest(this.currentQuestId - 1);
                }
            });
        }

        const btnNext = document.getElementById('btn-next-quest');
        if (btnNext) {
            btnNext.addEventListener('click', () => {
                if (this.currentQuestId < 10) {
                    this.loadQuest(this.currentQuestId + 1);
                } else {
                    this.showScreen('summary');
                }
            });
        }

        // Summary Screen Buttons
        const btnPrint = document.getElementById('btn-print-report');
        if (btnPrint) {
            btnPrint.addEventListener('click', () => {
                this.handlePrintReport();
            });
        }

        const btnBackToArena = document.getElementById('btn-back-to-arena');
        if (btnBackToArena) {
            btnBackToArena.addEventListener('click', () => {
                this.showScreen('arena');
            });
        }

        const btnResetAll = document.getElementById('btn-reset-all');
        if (btnResetAll) {
            btnResetAll.addEventListener('click', () => {
                this.openConfirmModal(
                    "ล้างข้อมูลทั้งหมด",
                    "คำเตือน: ข้อมูลคะแนน ความคืบหน้า และโค้ดที่ทำไว้ทั้งหมดจะถูกลบเพื่อเริ่มใหม่ ต้องการดำเนินการต่อหรือไม่?",
                    () => {
                        window.storageManager.resetAllData();
                        window.location.reload();
                    }
                );
            });
        }

        // Modal Controls
        const btnCloseModal = document.getElementById('btn-close-modal');
        const btnModalCancel = document.getElementById('btn-modal-cancel');
        const modal = document.getElementById('modal-confirm');
        [btnCloseModal, btnModalCancel].forEach(b => {
            if (b) {
                b.addEventListener('click', () => {
                    modal.classList.remove('active');
                });
            }
        });
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

    // Handle Registration Submit
    handleRegistration() {
        const fullname = document.getElementById('reg-fullname').value.trim();
        const grade = document.getElementById('reg-grade').value;
        const number = document.getElementById('reg-number').value.trim();

        if (!fullname || !number) {
            this.showToast("กรุณากรอกข้อมูลให้ครบถ้วน");
            return;
        }

        const studentData = {
            name: fullname,
            grade: grade,
            no: number,
            avatar: this.selectedAvatar,
            registeredAt: new Date().toISOString()
        };

        window.storageManager.saveStudent(studentData);
        window.soundFX.playCoin();

        this.showToast(`ยินดีต้อนรับ ${fullname} เข้าสู่ภารกิจ!`);
        this.showScreen('arena');
        this.renderHeader();
        this.renderQuestRibbon();
        this.loadQuest(1);
    }

    // Render Sticky Header Info
    renderHeader() {
        const student = window.storageManager.getStudent();
        if (!student) return;

        document.getElementById('header-student-avatar').textContent = student.avatar || '⚡';
        document.getElementById('header-student-name').textContent = student.name;
        document.getElementById('header-student-sub').textContent = `${student.grade} • เลขที่ ${student.no}`;

        this.updateXPBar();
    }

    // Update XP Bar & Rank Title
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

    // Render Quest Selector Ribbon (1 to 10)
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

    // Load a Specific Quest into Arena
    loadQuest(questId) {
        const quest = window.QUESTS.find(q => q.id === questId);
        if (!quest) return;

        this.currentQuestId = questId;

        // Update Progress Tracker
        const progress = window.storageManager.getProgress();
        progress.currentQuestId = questId;
        window.storageManager.saveProgress(progress);

        // Update Quest Header & Badges
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

        // Hide validation banner & reset terminal
        this.hideValidationBanner();
        const terminal = document.getElementById('terminal-output-area');
        terminal.innerHTML = `<span class="terminal-prompt">&gt; เข้าสู่ภารกิจที่ ${quest.id}: ${quest.title}</span>\n<span class="terminal-prompt">&gt; แก้ไขโค้ดใน main.py แล้วกด [รันโค้ด] หรือ [ส่งคำตอบ]</span>\n<span class="terminal-cursor"></span>`;

        // Update Tabs & Nav Buttons
        this.renderQuestRibbon();
        const btnPrev = document.getElementById('btn-prev-quest');
        const btnNext = document.getElementById('btn-next-quest');
        if (btnPrev) btnPrev.disabled = questId === 1;
        if (btnNext) {
            btnNext.innerHTML = questId === 10 ? '<span>สรุปผลภารกิจ 🏆</span>' : '<span>ภารกิจถัดไป ▶</span>';
        }
    }

    // Run Code Only (Preview execution in terminal)
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

    // Submit Code & Award XP
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
                // Pass!
                window.soundFX.playSuccess();
                this.triggerConfetti();

                const updatedProgress = window.storageManager.markQuestPassed(this.currentQuestId, code, 10);
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

    // Update Checklist visual items
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

    // Show/Hide Validation Banner
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

    // Confetti Explosion
    triggerConfetti() {
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    }

    // Render Summary & Leaderboard Screen
    renderSummary() {
        const student = window.storageManager.getStudent();
        const progress = window.storageManager.getProgress();
        const totalXP = progress.totalXP || 0;
        const rank = window.storageManager.getRankInfo(totalXP);

        // Stamp
        document.getElementById('summary-stamp-title').textContent = `${rank.badgeIcon} ${rank.title.toUpperCase()}`;
        document.getElementById('summary-stamp-thai').textContent = rank.thaiTitle;

        // Scores
        document.getElementById('summary-score-xp').textContent = `${totalXP} / 100`;
        document.getElementById('summary-score-quests').textContent = `${progress.completedQuests.length} / 10`;

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

        // Render Quests Rubric Review Table
        const reviewTbody = document.getElementById('quests-review-tbody');
        reviewTbody.innerHTML = '';

        window.QUESTS.forEach(q => {
            const isPassed = progress.completedQuests.includes(q.id);
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td style="font-family: var(--font-pixel); text-align: center;">${q.id}</td>
                <td><strong>${q.category}</strong> ${q.title}</td>
                <td><span class="tag-difficulty ${q.difficultyClass}">${q.difficulty}</span></td>
                <td>10 XP</td>
                <td style="font-family: var(--font-pixel); color: ${isPassed ? 'var(--text-green)' : 'var(--text-muted)'};">${isPassed ? '10' : '0'} XP</td>
                <td style="text-align: center;">
                    ${isPassed ? '<span style="color: var(--text-green); font-weight: bold;">✅ ผ่านแล้ว</span>' : '<span style="color: var(--text-muted);">⬜ ยังไม่สำเร็จ</span>'}
                </td>
            `;
            reviewTbody.appendChild(tr);
        });
    }

    // Populate and trigger Print Report
    handlePrintReport() {
        const student = window.storageManager.getStudent();
        const progress = window.storageManager.getProgress();
        const totalXP = progress.totalXP || 0;
        const rank = window.storageManager.getRankInfo(totalXP);

        if (!student) {
            this.showToast("กรุณากรอกข้อมูลนักเรียนก่อนพิมพ์ใบรายงานผล");
            return;
        }

        // Fill Print Certificate Fields
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

        // Current Date in Thai format
        const now = new Date();
        const thMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
        const dateStr = `วันที่ ${now.getDate()} เดือน ${thMonths[now.getMonth()]} พ.ศ. ${now.getFullYear() + 543}`;
        document.getElementById('print-date-student').textContent = dateStr;

        // Fill Print Table
        const printTbody = document.getElementById('print-table-tbody');
        printTbody.innerHTML = '';

        window.QUESTS.forEach(q => {
            const isPassed = progress.completedQuests.includes(q.id);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="center">${q.id}</td>
                <td><strong>${q.category}</strong>: ${q.title} (${q.instruction.replace(/<[^>]+>/g, '').substring(0, 50)}...)</td>
                <td class="center">${q.difficulty}</td>
                <td class="center">10</td>
                <td class="center"><strong>${isPassed ? '10' : '0'}</strong></td>
                <td class="center ${isPassed ? 'cert-status-pass' : ''}">${isPassed ? '✔ ผ่าน' : '—'}</td>
            `;
            printTbody.appendChild(tr);
        });

        // Trigger native print dialog
        window.soundFX.playClick();
        window.print();
    }

    // Modal Confirmation Dialog
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

    // Toast Alert
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

// Instantiate and start app on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AppController();
    window.app.init();
});

