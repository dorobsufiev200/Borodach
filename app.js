/* ==========================================================================
   BORODACH — app.js
   Bootstraps the page: header state on scroll, mobile nav, scroll-reveal
   animations, the "cut" progress line, master-card → booking shortcuts,
   and all the "Записаться" entry points.
   ========================================================================== */

(function () {
  'use strict';

  function initHeaderScroll() {
    const header = document.getElementById('siteHeader');
    if (!header) return;
    const onScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function initCutProgress() {
    const bar = document.getElementById('cutProgress');
    if (!bar) return;
    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
      bar.style.transform = `scaleX(${Math.min(1, Math.max(0, ratio))})`;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  }

  function initMobileMenu() {
    const burger = document.getElementById('burgerBtn');
    const menu = document.getElementById('mobileMenu');
    if (!burger || !menu) return;

    burger.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      burger.classList.toggle('open', open);
    });

    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        menu.classList.remove('open');
        burger.classList.remove('open');
      });
    });
  }

  function initScrollReveal() {
    const targets = document.querySelectorAll('.reveal-up');
    if (!targets.length) return;

    targets.forEach((el) => {
      const delay = el.dataset.delay;
      if (delay) el.style.setProperty('--reveal-delay', delay);
    });

    if (!('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('in-view'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );

    targets.forEach((el) => observer.observe(el));

    // Hero content should reveal immediately on load, not on scroll.
    document.querySelectorAll('.hero .reveal-up').forEach((el) => {
      requestAnimationFrame(() => el.classList.add('in-view'));
    });
  }

  function initBookingEntryPoints() {
    const bookingButtons = [
      'navBookBtn', 'mobileBookBtn', 'heroBookBtn',
      'contactsBookBtn', 'fabBookBtn',
    ];
    bookingButtons.forEach((id) => {
      document.getElementById(id)?.addEventListener('click', () => {
        document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    // Clicking a master card scrolls to booking and preselects them.
    document.querySelectorAll('.master-card').forEach((card) => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        const masterName = card.dataset.master;
        BorodachBooking.jumpToBookingWithMaster(masterName);
      });
    });
  }

  function initPhoneMask() {
    const phoneInput = document.getElementById('clientPhone');
    if (!phoneInput) return;
    phoneInput.addEventListener('input', () => {
      let digits = phoneInput.value.replace(/\D/g, '').replace(/^7|^8/, '');
      digits = digits.slice(0, 10);
      let formatted = '+7';
      if (digits.length > 0) formatted += ` (${digits.slice(0, 3)}`;
      if (digits.length >= 3) formatted += `) ${digits.slice(3, 6)}`;
      if (digits.length >= 6) formatted += `-${digits.slice(6, 8)}`;
      if (digits.length >= 8) formatted += `-${digits.slice(8, 10)}`;
      phoneInput.value = formatted;
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initHeaderScroll();
    initCutProgress();
    initMobileMenu();
    initScrollReveal();
    initBookingEntryPoints();
    initPhoneMask();

    BorodachUI.init();
    BorodachBooking.init();
  });
})();
