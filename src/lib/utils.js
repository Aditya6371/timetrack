export const STATUSES = ['Present', 'Work from Home', 'Absent', 'Half Day', 'Leave', 'Holiday', 'Weekend', 'Checked In'];

const STATUS_TONE = {
  Present: 'present',
  'Work from Home': 'wfh',
  Absent: 'absent',
  'Half Day': 'half',
  Leave: 'leave',
  Holiday: 'holiday',
  Weekend: 'weekend',
  'Checked In': 'live',
};

export function pad(n) {
  return String(n).padStart(2, '0');
}

export function toDateKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDateKey(key) {
  const [y, m, d] = String(key).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function todayKey() {
  return toDateKey(new Date());
}

export function formatDate(date, options = {}) {
  const d = date instanceof Date ? date : parseDateKey(date);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    ...options,
  });
}

export function formatTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function timeToInput(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Sheet time-only cells arrive as 1899-12-30 timestamps. Format them in India time. */
export function normalizeClock(value) {
  if (value == null || value === '') return '';
  const text = String(value).trim();
  const simple = text.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (simple) return `${pad(Number(simple[1]))}:${simple[2]}`;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Asia/Kolkata',
  }).formatToParts(date);
  const hour = parts.find((part) => part.type === 'hour')?.value ?? '00';
  const minute = parts.find((part) => part.type === 'minute')?.value ?? '00';
  return `${hour}:${minute}`;
}

export function formatClockLabel(hhmm) {
  const [h = 0, m = 0] = String(hhmm || '00:00').split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${pad(hour)}:${pad(m)} ${suffix}`;
}

export function combineDateAndTime(dateKey, timeInput) {
  if (!timeInput) return null;
  const [h, m] = timeInput.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  const base = parseDateKey(dateKey);
  base.setHours(h, m, 0, 0);
  return base;
}

export function hoursBetween(start, end) {
  if (!start || !end) return 0;
  const ms = new Date(end) - new Date(start);
  if (!Number.isFinite(ms)) return 0;
  return Math.max(0, ms / 3_600_000);
}

export function formatHours(hours) {
  const value = Number(hours);
  if (!value) return '0h';
  const whole = Math.floor(value);
  const mins = Math.round((value - whole) * 60);
  if (mins === 60) return `${whole + 1}h`;
  if (mins === 0) return `${whole}h`;
  return `${whole}h ${mins}m`;
}

export function formatDuration(totalSeconds) {
  const secs = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function secondsSinceMidnight(date) {
  return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
}

export function getWeekRange(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setDate(d.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function firstName(name) {
  const part = String(name || '').trim().split(/\s+/)[0];
  return part || '';
}

export function isWeekend(date) {
  const d = date instanceof Date ? date : parseDateKey(date);
  const day = d.getDay();
  return day === 0 || day === 6;
}

export function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

export function getMonthName(month) {
  return new Date(2000, month - 1, 1).toLocaleDateString('en-IN', { month: 'long' });
}

export function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return parts.map((word) => word[0]).join('').toUpperCase().slice(0, 2);
}

export function statusTone(status) {
  return STATUS_TONE[status] || 'weekend';
}

export function calendarCells(year, month) {
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const count = getDaysInMonth(year, month);
  const cells = Array.from({ length: firstWeekday }, () => null);
  for (let day = 1; day <= count; day += 1) {
    cells.push({
      day,
      key: `${year}-${pad(month)}-${pad(day)}`,
    });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/** Excel serial date. UTC on both sides so IST does not slip to the previous day. */
export function excelDateFraction(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return (Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86_400_000;
}

export function excelTimeFraction(date) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return (d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()) / 86_400;
}

export function excelHoursFraction(hours) {
  return (Number(hours) || 0) / 24;
}
