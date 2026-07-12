/* ==========================================================================
   BORODACH — calendar.js
   Small self-contained month calendar for the booking widget.
   Weeks start on Monday. Today is highlighted. Past dates are disabled.
   Fires `onSelect(dateObj)` (set by booking.js) when a valid date is picked.
   ========================================================================== */

const BorodachCalendar = (() => {
  const MONTH_NAMES = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
  ];

  let currentView = new Date();
  currentView.setDate(1);

  let selectedDate = null;
  let onSelectCallback = null;

  const gridEl = () => document.getElementById('calendarGrid');
  const labelEl = () => document.getElementById('calMonthLabel');

  function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
  }

  function isPast(date, today) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return d < t;
  }

  // Convert JS getDay() (0=Sun..6=Sat) to Monday-first index (0=Mon..6=Sun)
  function mondayFirstIndex(jsDay) {
    return (jsDay + 6) % 7;
  }

  function render() {
    const grid = gridEl();
    const label = labelEl();
    if (!grid || !label) return;

    const today = new Date();
    const year = currentView.getFullYear();
    const month = currentView.getMonth();

    label.textContent = `${MONTH_NAMES[month]} ${year}`;

    const firstOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leadingBlanks = mondayFirstIndex(firstOfMonth.getDay());

    grid.innerHTML = '';

    for (let i = 0; i < leadingBlanks; i++) {
      const blank = document.createElement('span');
      blank.className = 'calendar-day calendar-day--blank';
      grid.appendChild(blank);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'calendar-day';
      btn.textContent = String(day);

      const past = isPast(date, today);
      const isToday = isSameDay(date, today);
      const isSelected = selectedDate && isSameDay(date, selectedDate);

      if (past) {
        btn.classList.add('calendar-day--disabled');
        btn.disabled = true;
      } else {
        btn.addEventListener('click', () => selectDate(date));
      }
      if (isToday) btn.classList.add('calendar-day--today');
      if (isSelected) btn.classList.add('calendar-day--selected');

      grid.appendChild(btn);
    }
  }

  function selectDate(date) {
    selectedDate = date;
    render();
    if (typeof onSelectCallback === 'function') onSelectCallback(date);
  }

  function prevMonth() {
    const today = new Date();
    const prev = new Date(currentView.getFullYear(), currentView.getMonth() - 1, 1);
    // Don't navigate before the current real month
    if (prev.getFullYear() < today.getFullYear() ||
        (prev.getFullYear() === today.getFullYear() && prev.getMonth() < today.getMonth())) {
      return;
    }
    currentView = prev;
    render();
  }

  function nextMonth() {
    currentView = new Date(currentView.getFullYear(), currentView.getMonth() + 1, 1);
    render();
  }

  function init(onSelect) {
    onSelectCallback = onSelect;
    document.getElementById('calPrev')?.addEventListener('click', prevMonth);
    document.getElementById('calNext')?.addEventListener('click', nextMonth);
    render();
  }

  function getSelectedDate() {
    return selectedDate;
  }

  return { init, getSelectedDate, render };
})();

/* Minimal inline styles for calendar cells, appended once so calendar.js
   stays self-contained without depending on style.css load order. */
(function injectCalendarCellStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
    .calendar-day {
      aspect-ratio: 1;
      border: none;
      background: var(--charcoal-2, #1F1B15);
      color: var(--bone, #F3EEE3);
      border-radius: 8px;
      font-family: 'IBM Plex Mono', monospace;
      font-size: 13px;
      cursor: pointer;
      transition: all .2s ease;
    }
    .calendar-day:hover:not(:disabled) { background: rgba(176,141,87,0.25); }
    .calendar-day--blank { background: transparent; cursor: default; }
    .calendar-day--disabled { opacity: 0.2; cursor: not-allowed; text-decoration: line-through; }
    .calendar-day--today { box-shadow: inset 0 0 0 1.5px var(--brass, #B08D57); font-weight: 600; }
    .calendar-day--selected { background: var(--brass, #B08D57); color: #17140F; font-weight: 700; }
    .calendar-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .calendar-month { font-family: 'Fraunces', serif; font-size: 17px; color: var(--bone, #F3EEE3); }
    .calendar-nav {
      width: 32px; height: 32px; border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.15);
      background: transparent; color: var(--bone, #F3EEE3);
      cursor: pointer; font-size: 16px; line-height: 1;
    }
    .calendar-nav:hover { border-color: var(--brass, #B08D57); }
    .calendar-weekdays {
      display: grid; grid-template-columns: repeat(7, 1fr);
      margin-bottom: 8px; font-size: 11.5px; text-align: center;
      color: rgba(255,255,255,0.45); font-family: 'IBM Plex Mono', monospace;
    }
  `;
  document.head.appendChild(style);
})();
