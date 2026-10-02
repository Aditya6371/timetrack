const Utils = {
  pad(n) {
    return String(n).padStart(2, '0');
  },

  toDateKey(date) {
    const d = date instanceof Date ? date : new Date(date);
    return `${d.getFullYear()}-${this.pad(d.getMonth() + 1)}-${this.pad(d.getDate())}`;
  },

  parseDateKey(key) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  },

  todayKey() {
    return this.toDateKey(new Date());
  },

  formatDate(date, opts = {}) {
    const d = date instanceof Date ? date : this.parseDateKey(date);
    return d.toLocaleDateString('en-IN', {
      weekday: opts.weekday,
      day: 'numeric',
      month: opts.month || 'short',
      year: opts.year,
      ...opts,
    });
  },

  formatTime(date) {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  },

  timeToInput(date) {
    const d = date instanceof Date ? date : new Date(date);
    return `${this.pad(d.getHours())}:${this.pad(d.getMinutes())}`;
  },

  /** Mobile-friendly hour+minute selects (native type=time is flaky in modals on iOS). */
  timeSelectHtml(id, valueHHMM = '', { allowEmpty = false } = {}) {
    const [hh = '', mm = ''] = String(valueHHMM || '').split(':');
    const emptyHour = allowEmpty
      ? `<option value="" ${hh === '' ? 'selected' : ''}>—</option>`
      : '';
    const emptyMin = allowEmpty
      ? `<option value="" ${mm === '' ? 'selected' : ''}>—</option>`
      : '';
    const hourOpts = Array.from({ length: 24 }, (_, i) => {
      const v = this.pad(i);
      const h12 = i % 12 || 12;
      const ampm = i < 12 ? 'AM' : 'PM';
      return `<option value="${v}" ${hh === v ? 'selected' : ''}>${h12} ${ampm}</option>`;
    }).join('');
    const minOpts = Array.from({ length: 60 }, (_, i) => {
      const v = this.pad(i);
      return `<option value="${v}" ${mm === v ? 'selected' : ''}>${v}</option>`;
    }).join('');
    return `
      <div class="time-select" data-time-id="${id}">
        <select class="form-select time-select-hour" id="${id}-hour" aria-label="Hour">${emptyHour}${hourOpts}</select>
        <span class="time-select-sep" aria-hidden="true">:</span>
        <select class="form-select time-select-minute" id="${id}-minute" aria-label="Minute">${emptyMin}${minOpts}</select>
      </div>`;
  },

  readTimeSelect(id) {
    const hour = document.getElementById(`${id}-hour`)?.value;
    const minute = document.getElementById(`${id}-minute`)?.value;
    if (hour === undefined || hour === '' || minute === undefined || minute === '') return null;
    return `${hour}:${minute}`;
  },

  inputToTimeToday(input) {
    const [h, m] = input.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  },

  combineDateAndTime(dateKey, timeInput) {
    const base = this.parseDateKey(dateKey);
    const [h, m] = timeInput.split(':').map(Number);
    base.setHours(h, m, 0, 0);
    return base;
  },

  hoursBetween(start, end) {
    if (!start || !end) return 0;
    const ms = new Date(end) - new Date(start);
    return Math.max(0, ms / 3600000);
  },

  formatHours(h) {
    if (!h) return '0h';
    const hrs = Math.floor(h);
    const mins = Math.round((h - hrs) * 60);
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  },

  formatDuration(totalSeconds) {
    const secs = Math.max(0, Math.floor(totalSeconds));
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${this.pad(h)}:${this.pad(m)}:${this.pad(s)}`;
  },

  getWeekRange(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { start: monday, end: sunday };
  },

  greeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  },

  isWeekend(date) {
    const d = date instanceof Date ? date : this.parseDateKey(date);
    const day = d.getDay();
    return day === 0 || day === 6;
  },

  getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  },

  getMonthName(month) {
    return new Date(2000, month - 1, 1).toLocaleDateString('en-IN', { month: 'long' });
  },

  initials(name) {
    if (!name) return '?';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  },

  statusClass(status) {
    const map = {
      Present: 'badge-present',
      'Work from Home': 'badge-wfh',
      Absent: 'badge-absent',
      'Half Day': 'badge-half',
      Leave: 'badge-leave',
      Weekend: 'badge-weekend',
      'Checked In': 'badge-checkedin',
    };
    return map[status] || 'badge-weekend';
  },

  calStatusClass(status) {
    const map = {
      Present: 'cal-status-present',
      'Work from Home': 'cal-status-wfh',
      Absent: 'cal-status-absent',
      'Half Day': 'cal-status-half',
      Leave: 'cal-status-leave',
      Weekend: 'cal-status-weekend',
      'Checked In': 'cal-status-checkedin',
    };
    return map[status] || '';
  },

  statusColor(status) {
    const map = {
      Present: 'var(--status-present)',
      'Work from Home': 'var(--status-wfh)',
      Absent: 'var(--status-absent)',
      'Half Day': 'var(--status-half)',
      Leave: 'var(--status-leave)',
      Weekend: 'var(--status-weekend)',
      'Checked In': 'var(--status-checkedin)',
    };
    return map[status] || 'var(--border-strong)';
  },

  debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  },

  excelDateFraction(dateKey) {
    // Use UTC for both sides so local/historical TZ offsets (e.g. Asia/Kolkata)
    // don't produce a fractional serial that Excel floors to the previous day.
    const [y, m, d] = dateKey.split('-').map(Number);
    return (Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000;
  },

  excelTimeFraction(date) {
    if (!date) return null;
    const d = new Date(date);
    return (d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()) / 86400;
  },

  excelHoursFraction(hours) {
    return hours / 24;
  },
};
