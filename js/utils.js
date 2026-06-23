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
    const d = this.parseDateKey(dateKey);
    const epoch = new Date(1899, 11, 30);
    return (d - epoch) / 86400000;
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
