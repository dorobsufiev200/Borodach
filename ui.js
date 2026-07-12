/* ==========================================================================
   BORODACH — ui.js
   Generic UI primitives: toast notifications, the success modal, FAQ accordion.
   ========================================================================== */

const BorodachUI = (() => {
  let toastTimer = null;

  function showToast(message, duration = 3200) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
  }

  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  function initModals() {
    const successModal = document.getElementById('successModal');
    const closeBtn = document.getElementById('successCloseBtn');

    closeBtn?.addEventListener('click', () => closeModal('successModal'));
    successModal?.addEventListener('click', (e) => {
      if (e.target === successModal) closeModal('successModal');
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal('successModal');
    });
  }

  function initFAQ() {
    document.querySelectorAll('.faq-item').forEach((item) => {
      const question = item.querySelector('.faq-question');
      question?.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item.open').forEach((openItem) => {
          if (openItem !== item) openItem.classList.remove('open');
        });
        item.classList.toggle('open', !isOpen);
      });
    });
  }

  function init() {
    initModals();
    initFAQ();
  }

  return { init, showToast, openModal, closeModal };
})();
