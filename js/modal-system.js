// Modal System
document.addEventListener('DOMContentLoaded', () => {
    const modalOverlay = document.getElementById('modalOverlay');
    const modalClose = document.getElementById('modalClose');
    const modalContent = document.getElementById('modalContent');
    const navLinks = document.querySelectorAll('.nav-link');

    // 모달 열기
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const modalType = link.getAttribute('data-modal');
            const templateContent = document.getElementById(`modal-${modalType}`);
            
            if (templateContent && modalContent) {
                modalContent.innerHTML = templateContent.innerHTML;
                modalOverlay.classList.remove('hidden');
            }
        });
    });

    // 모달 닫기
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            modalOverlay.classList.add('hidden');
        });
    }

    // 오버레이 클릭시 닫기
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.classList.add('hidden');
            }
        });
    }
});
