// Registration Page Controller (index.html) — PAIR MODE (2 students per device)

document.addEventListener('DOMContentLoaded', () => {
    let selectedAvatar = '⚡';

    // Check if pair already registered previously
    const student = window.storageManager.getStudent();
    const progress = window.storageManager.getProgress();
    const existingBox = document.getElementById('existing-user-box');

    if (student) {
        if (existingBox) {
            existingBox.style.display = 'block';
            // Show pair info if exists
            const pairName = student.partner ? ` & ${student.partner.name}` : '';
            document.getElementById('existing-name').textContent = student.name + pairName;
            const pairSub = student.partner
                ? `(${student.grade} เลขที่ ${student.no} & เลขที่ ${student.partner.no})`
                : `(${student.grade} เลขที่ ${student.no})`;
            document.getElementById('existing-sub').textContent = pairSub;
            document.getElementById('existing-xp').textContent = `${progress.totalXP || 0} / 2.0 คะแนน`;

            document.getElementById('btn-continue-quest').addEventListener('click', () => {
                window.soundFX.playClick();
                window.location.href = 'quest.html';
            });

            document.getElementById('btn-new-register').addEventListener('click', () => {
                window.soundFX.playClick();
                existingBox.style.display = 'none';
                document.getElementById('reg-fullname').value = '';
                document.getElementById('reg-number').value = '';
                document.getElementById('reg-fullname2').value = '';
                document.getElementById('reg-number2').value = '';
                document.getElementById('reg-fullname').focus();
            });
        }
    }

    // Avatar selector logic
    document.querySelectorAll('.avatar-option').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            selectedAvatar = opt.getAttribute('data-avatar');
            window.soundFX.playClick();
        });
    });

    // Form submission
    const form = document.getElementById('registration-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const fullname  = document.getElementById('reg-fullname').value.trim();
            const grade     = document.getElementById('reg-grade').value;
            const number    = document.getElementById('reg-number').value.trim();

            const fullname2 = document.getElementById('reg-fullname2').value.trim();
            const grade2    = document.getElementById('reg-grade2').value;
            const number2   = document.getElementById('reg-number2').value.trim();

            if (!fullname || !number || !fullname2 || !number2) {
                alert("กรุณากรอกข้อมูลให้ครบทั้ง 2 คนครับ");
                return;
            }

            // Build combined display name and store partner info
            const studentData = {
                name: fullname,
                grade: grade,
                no: number,
                avatar: selectedAvatar,
                partner: {
                    name: fullname2,
                    grade: grade2,
                    no: number2
                },
                registeredAt: new Date().toISOString()
            };

            window.storageManager.saveStudent(studentData);
            window.soundFX.playCoin();

            // Smooth transition to Quest Arena page
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span>🚀 กำลังเข้าสู่สมรภูมิโค้ด...</span>';
            }

            setTimeout(() => {
                window.location.href = 'quest.html';
            }, 350);
        });
    }
});
