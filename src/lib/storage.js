import { CONFIG } from '../config';
import { normalizeClock } from './utils';

const DEFAULT_SETTINGS = {
  employeeName: '',
  employeeId: '',
  defaultPayableHours: 8,
  payableHoursRule: 'fixed',
  weeklyHoursGoal: 40,
  defaultShiftId: 'shift_1',
  theme: 'system',
};

const DEFAULT_SHIFTS = [
  {
    id: 'shift_1',
    label: 'General (09:00 AM - 06:00 PM)',
    start: '09:00',
    end: '18:00',
    isDefault: true,
  },
];

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null || raw === '') return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getSettings() {
  const stored = read(CONFIG.STORAGE_KEYS.settings, {});
  return { ...DEFAULT_SETTINGS, ...(stored && typeof stored === 'object' ? stored : {}) };
}

export function saveSettings(settings) {
  write(CONFIG.STORAGE_KEYS.settings, { ...DEFAULT_SETTINGS, ...settings });
}

function normalizeShift(shift) {
  return {
    ...shift,
    start: normalizeClock(shift.start) || '09:00',
    end: normalizeClock(shift.end) || '18:00',
  };
}

export function getShifts() {
  const shifts = read(CONFIG.STORAGE_KEYS.shifts, null);
  const source = Array.isArray(shifts) && shifts.length ? shifts : DEFAULT_SHIFTS;
  return source.map((shift) => normalizeShift(shift));
}

export function saveShifts(shifts) {
  write(CONFIG.STORAGE_KEYS.shifts, shifts.map((shift) => normalizeShift(shift)));
}

export function getDefaultShift() {
  const shifts = getShifts();
  return shifts.find((shift) => shift.isDefault) || shifts[0];
}

export function getShiftById(id) {
  return getShifts().find((shift) => shift.id === id) || null;
}

export function getAttendance() {
  const data = read(CONFIG.STORAGE_KEYS.attendance, {});
  return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
}

export function saveAttendance(data) {
  write(CONFIG.STORAGE_KEYS.attendance, data);
}

export function getRecord(dateKey) {
  return getAttendance()[dateKey] || null;
}

export function saveRecord(dateKey, record) {
  const all = getAttendance();
  all[dateKey] = record;
  saveAttendance(all);
  return record;
}

export function getSyncQueue() {
  const queue = read(CONFIG.STORAGE_KEYS.syncQueue, []);
  return Array.isArray(queue) ? queue : [];
}

export function setSyncQueue(queue) {
  write(CONFIG.STORAGE_KEYS.syncQueue, queue);
}

export function enqueueSync(action) {
  const queue = getSyncQueue();
  queue.push({ ...action, ts: Date.now() });
  setSyncQueue(queue);
}

export function setLastSync(timestamp) {
  write(CONFIG.STORAGE_KEYS.lastSync, timestamp);
}
