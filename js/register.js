// Registration Page Controller (index.html)

document.addEventListener('DOMContentLoaded', () => {
    let selectedAvatar = '⚡';

    // Check if user already registered previously
    const student = window.storageManager.getStudent();
    const progress = window.storageManager.getProgress();
    const existingBox = document.getElementById('existing-user-box');

    if (student) {
        if (existingBox) {
            existingBox.style.display = 'block';
            document.getElementById('existing-name').textContent = student.name;
            document.getElementById('existing-sub').textContent = `(${student.grade} เลขที่ ${student.no})`;
            document.getElementById('existing-xp').textContent = `${progress.totalXP || 0} / 100 XP`;

            document.getElementById('btn-continue-quest').addEventListener('click', () => {
                window.soundFX.playClick();
                window.location.href = 'quest.html';
            });

            document.getElementById('btn-new-register').addEventListener('click', () => {
                window.soundFX.playClick();
                existingBox.style.display = 'none';
                document.getElementById('reg-fullname').value = '';
                document.getElementById('reg-number').value = '';
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

            const fullname = document.getElementById('reg-fullname').value.trim();
            const grade = document.getElementById('reg-grade').value;
            const number = document.getElementById('reg-number').value.trim();

            if (!fullname || !number) {
                alert("กรุณากรอกข้อมูลให้ครบถ้วน");
                return;
            }

            const studentData = {
                name: fullname,
                grade: grade,
                no: number,
                avatar: selectedAvatar,
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

