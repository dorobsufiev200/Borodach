/* ==========================================================================
   BORODACH — booking.js
   Drives the 5-step booking widget and the standalone services price bar.
   ========================================================================== */

const BorodachBooking = (() => {
  const TIME_SLOTS = [
    '09:00', '09:40', '10:20', '11:00', '11:40', '12:20',
    '13:00', '13:40', '14:20', '15:00', '15:40', '16:20',
    '17:00', '17:40', '18:20', '19:00', '19:40', '20:20',
  ];

  const state = {
    step: 1,
    master: null,
    services: [], // { name, price, duration }
    date: null,   // Date
    time: null,   // 'HH:MM'
  };

  // Booked-out slots per weekday, purely illustrative so the demo calendar
  // feels alive (a real deployment would fetch this from the backend).
  const MOCK_TAKEN_SLOTS = ['10:20', '14:20', '17:00'];

  function collectServiceDefinitions() {
    return Array.from(document.querySelectorAll('.service-check')).map((input) => ({
      name: input.dataset.name,
      price: Number(input.dataset.price),
      duration: Number(input.dataset.duration),
      el: input,
    }));
  }

  /* ---------------- Services price bar (independent of the booking widget) ---------------- */

  function initServicesBar() {
    const checks = document.querySelectorAll('.service-check');
    checks.forEach((input) => input.addEventListener('change', updateServicesBar));
    updateServicesBar();

    document.getElementById('servicesToBookingBtn')?.addEventListener('click', () => {
      syncServicesIntoBookingState();
      document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      goToStep(state.master ? 2 : 1);
    });
  }

  function updateServicesBar() {
    const selected = collectServiceDefinitions().filter((s) => s.el.checked);
    const countEl = document.getElementById('servicesTotalCount');
    const timeEl = document.getElementById('servicesTotalTime');
    const priceEl = document.getElementById('servicesTotalPrice');

    if (selected.length === 0) {
      countEl.textContent = 'Услуги не выбраны';
      timeEl.textContent = '';
      priceEl.textContent = '0 ₽';
      return;
    }

    const totalPrice = selected.reduce((sum, s) => sum + s.price, 0);
    const totalDuration = selected.reduce((sum, s) => sum + s.duration, 0);

    countEl.textContent = `${selected.length} ${pluralizeServices(selected.length)} выбрано`;
    timeEl.textContent = `≈ ${totalDuration} мин`;
    priceEl.textContent = `${formatMoney(totalPrice)} ₽`;
  }

  function pluralizeServices(n) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return 'услуга';
    if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'услуги';
    return 'услуг';
  }

  function syncServicesIntoBookingState() {
    const selected = collectServiceDefinitions().filter((s) => s.el.checked);
    if (selected.length) {
      state.services = selected.map(({ name, price, duration }) => ({ name, price, duration }));
      renderBookingServices();
    }
  }

  /* ---------------- Step navigation ---------------- */

  function goToStep(step) {
    state.step = step;

    document.querySelectorAll('.booking-panel').forEach((panel) => {
      panel.classList.toggle('active', Number(panel.dataset.panel) === step);
    });

    document.querySelectorAll('.booking-step').forEach((el) => {
      const n = Number(el.dataset.step);
      el.classList.toggle('active', n === step);
      el.classList.toggle('done', n < step);
    });

    const backBtn = document.getElementById('bookingBackBtn');
    const nextBtn = document.getElementById('bookingNextBtn');
    backBtn.disabled = step === 1;
    nextBtn.textContent = step === 5 ? 'Отправить заявку' : 'Далее';

    if (step === 4) renderTimeGrid();
    if (step === 5) renderSummary();
  }

  function canAdvance(step) {
    switch (step) {
      case 1: return !!state.master;
      case 2: return state.services.length > 0;
      case 3: return !!state.date;
      case 4: return !!state.time;
      case 5: return validateContactForm();
      default: return true;
    }
  }

  function validateContactForm() {
    const name = document.getElementById('clientName');
    const phone = document.getElementById('clientPhone');
    const nameOk = name.value.trim().length >= 2;
    const phoneOk = phone.value.replace(/\D/g, '').length >= 10;
    name.style.borderColor = nameOk ? '' : '#B85C5C';
    phone.style.borderColor = phoneOk ? '' : '#B85C5C';
    return nameOk && phoneOk;
  }

  function initStepNav() {
    document.getElementById('bookingNextBtn')?.addEventListener('click', async () => {
      if (!canAdvance(state.step)) {
        BorodachUI.showToast(messageForIncompleteStep(state.step));
        return;
      }
      if (state.step < 5) {
        goToStep(state.step + 1);
      } else {
        await submitBooking();
      }
    });

    document.getElementById('bookingBackBtn')?.addEventListener('click', () => {
      if (state.step > 1) goToStep(state.step - 1);
    });
  }

  function messageForIncompleteStep(step) {
    switch (step) {
      case 1: return 'Выберите мастера, чтобы продолжить';
      case 2: return 'Выберите хотя бы одну услугу';
      case 3: return 'Выберите дату визита';
      case 4: return 'Выберите удобное время';
      case 5: return 'Заполните имя и телефон';
      default: return 'Заполните шаг, чтобы продолжить';
    }
  }

  /* ---------------- Step 1: master ---------------- */

  function initMasterPicks() {
    document.querySelectorAll('.booking-master-pick').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.booking-master-pick').forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
        state.master = btn.dataset.master;
      });
    });
  }

  /* ---------------- Step 2: services ---------------- */

  function renderBookingServices() {
    const container = document.getElementById('bookingServices');
    if (!container) return;
    const definitions = collectServiceDefinitions();

    container.innerHTML = '';
    definitions.forEach((def) => {
      const row = document.createElement('div');
      row.className = 'booking-service-row';
      const isSelected = state.services.some((s) => s.name === def.name);
      row.classList.toggle('selected', isSelected);

      row.innerHTML = `
        <div class="booking-service-row-left">
          <span class="booking-service-check">✓</span>
          <div>
            <div class="booking-service-name">${def.name}</div>
            <div class="booking-service-time">⏱ ${def.duration} мин</div>
          </div>
        </div>
        <span class="booking-service-price">${formatMoney(def.price)} ₽</span>
      `;

      row.addEventListener('click', () => {
        const idx = state.services.findIndex((s) => s.name === def.name);
        if (idx >= 0) {
          state.services.splice(idx, 1);
          def.el.checked = false;
        } else {
          state.services.push({ name: def.name, price: def.price, duration: def.duration });
          def.el.checked = true;
        }
        row.classList.toggle('selected');
        updateServicesBar();
      });

      container.appendChild(row);
    });
  }

  /* ---------------- Step 3: date ---------------- */

  function initCalendarStep() {
    BorodachCalendar.init((date) => {
      state.date = date;
    });
  }

  /* ---------------- Step 4: time ---------------- */

  function renderTimeGrid() {
    const grid = document.getElementById('timeGrid');
    const dateLabel = document.getElementById('bookingSelectedDate');
    if (!grid) return;

    if (state.date) {
      dateLabel.textContent = formatDateHuman(state.date);
    }

    const today = new Date();
    const isToday = state.date && isSameDay(state.date, today);

    grid.innerHTML = '';
    TIME_SLOTS.forEach((slot) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'time-slot';
      btn.textContent = slot;

      const takenToday = MOCK_TAKEN_SLOTS.includes(slot);
      const pastToday = isToday && isSlotInPast(slot, today);
      const disabled = takenToday || pastToday;

      if (disabled) {
        btn.classList.add('disabled');
        btn.disabled = true;
      } else {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.time-slot').forEach((s) => s.classList.remove('selected'));
          btn.classList.add('selected');
          state.time = slot;
        });
      }

      if (state.time === slot) btn.classList.add('selected');

      grid.appendChild(btn);
    });
  }

  function isSlotInPast(slot, now) {
    const [h, m] = slot.split(':').map(Number);
    const slotDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
    return slotDate.getTime() < now.getTime();
  }

  /* ---------------- Step 5: summary + submit ---------------- */

  function renderSummary() {
    const summaryEl = document.getElementById('bookingSummary');
    if (!summaryEl) return;

    const total = state.services.reduce((sum, s) => sum + s.price, 0);
    const duration = state.services.reduce((sum, s) => sum + s.duration, 0);
    const serviceNames = state.services.map((s) => s.name).join(', ');

    summaryEl.innerHTML = `
      <div><strong>Мастер:</strong> ${state.master}</div>
      <div><strong>Услуги:</strong> ${serviceNames} (${duration} мин)</div>
      <div><strong>Дата:</strong> ${state.date ? formatDateHuman(state.date) : ''}</div>
      <div><strong>Время:</strong> ${state.time}</div>
      <div><strong>Итого:</strong> ${formatMoney(total)} ₽</div>
    `;
  }

  async function submitBooking() {
    const nextBtn = document.getElementById('bookingNextBtn');
    nextBtn.disabled = true;
    nextBtn.textContent = 'Отправляем…';

    const payload = {
      name: document.getElementById('clientName').value.trim(),
      phone: document.getElementById('clientPhone').value.trim(),
      master: state.master,
      services: state.services.map((s) => s.name),
      date: formatDateISO(state.date),
      time: state.time,
      total: state.services.reduce((sum, s) => sum + s.price, 0),
    };

    try {
      const result = await BorodachAPI.createBooking(payload);
      if (result.ok) {
        showSuccess(payload);
        resetBookingFlow();
      } else {
        BorodachUI.showToast('Не удалось отправить заявку. Попробуйте ещё раз.');
      }
    } catch (err) {
      BorodachUI.showToast('Не удалось отправить заявку. Попробуйте ещё раз.');
    } finally {
      nextBtn.disabled = false;
      nextBtn.textContent = 'Отправить заявку';
    }
  }

  function showSuccess(payload) {
    const detailsEl = document.getElementById('successDetails');
    detailsEl.innerHTML = `
      <div><b>Мастер:</b> ${payload.master}</div>
      <div><b>Дата:</b> ${formatDateHuman(new Date(payload.date))}</div>
      <div><b>Время:</b> ${payload.time}</div>
      <div><b>Стоимость:</b> ${formatMoney(payload.total)} ₽</div>
    `;
    BorodachUI.openModal('successModal');
  }

  function resetBookingFlow() {
    state.master = null;
    state.services = [];
    state.date = null;
    state.time = null;
    document.querySelectorAll('.booking-master-pick').forEach((b) => b.classList.remove('selected'));
    document.querySelectorAll('.service-check').forEach((c) => (c.checked = false));
    document.getElementById('bookingForm')?.reset();
    updateServicesBar();
    renderBookingServices();
    goToStep(1);
  }

  /* ---------------- Utils ---------------- */

  function formatMoney(n) {
    return n.toLocaleString('ru-RU');
  }

  function formatDateISO(date) {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function formatDateHuman(date) {
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' });
  }

  function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
  }

  /* ---------------- Public entry ---------------- */

  function jumpToBookingWithMaster(masterName) {
    goToStep(1);
    if (masterName) {
      const btn = document.querySelector(`.booking-master-pick[data-master="${masterName}"]`);
      btn?.click();
    }
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function init() {
    initServicesBar();
    initMasterPicks();
    renderBookingServices();
    initCalendarStep();
    initStepNav();
    goToStep(1);
  }

  return { init, jumpToBookingWithMaster };
})();
