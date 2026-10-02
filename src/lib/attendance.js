import { pushRecord } from './api';
import {
  getAttendance,
  getDefaultShift,
  getRecord,
  getSettings,
  getShiftById,
  saveRecord,
} from './storage';
import {
  combineDateAndTime,
  getDaysInMonth,
  getWeekRange,
  hoursBetween,
  isWeekend,
  pad,
  toDateKey,
  todayKey,
} from './utils';

export function inferStatus(record, dateKey, payableHours = 8) {
  if (isWeekend(dateKey)) return 'Weekend';
  if (record.checkIn && !record.checkOut) return 'Checked In';
  if (record.checkIn && record.checkOut) {
    const hours = record.totalHours || hoursBetween(record.checkIn, record.checkOut);
    if (hours < payableHours / 2) return 'Half Day';
    return 'Present';
  }
  return 'Absent';
}

export function calcPayableHours(record, settings) {
  const status = record.status;
  if (status === 'Weekend' || status === 'Absent' || status === 'Leave' || status === 'Holiday') return 0;
  if (settings.payableHoursRule === 'manual' && record.manualPayable && record.payableHours != null) {
    return Number(record.payableHours) || 0;
  }
  if (settings.payableHoursRule === 'actual') {
    return Math.min(record.totalHours || 0, settings.defaultPayableHours);
  }
  if (status === 'Half Day') return settings.defaultPayableHours / 2;
  if (status === 'Present' || status === 'Work from Home' || status === 'Checked In') {
    return settings.defaultPayableHours;
  }
  return 0;
}

export function buildRecord(dateKey, partial = {}) {
  const settings = getSettings();
  const shift = getShiftById(partial.shiftId || settings.defaultShiftId) || getDefaultShift();
  const existing = getRecord(dateKey) || {};

  const record = {
    employeeId: settings.employeeId || '',
    employeeName: settings.employeeName || '',
    date: dateKey,
    checkIn: partial.checkIn ?? existing.checkIn ?? null,
    checkOut: partial.checkOut ?? existing.checkOut ?? null,
    totalHours: 0,
    payableHours: 0,
    status: '',
    shift: partial.shift ?? shift?.label ?? '',
    shiftId: partial.shiftId ?? existing.shiftId ?? shift?.id ?? '',
    comments: partial.comments ?? existing.comments ?? '',
    manualPayable: partial.manualPayable ?? existing.manualPayable ?? false,
  };

  record.totalHours = hoursBetween(record.checkIn, record.checkOut);
  record.status = partial.status ?? inferStatus(record, dateKey, settings.defaultPayableHours);
  record.payableHours = calcPayableHours(record, settings);
  return record;
}

function persist(dateKey, record) {
  saveRecord(dateKey, record);
  pushRecord(record);
  return record;
}

export function checkIn(dateKey = todayKey()) {
  if (isWeekend(dateKey)) throw new Error('Weekends are closed for check-in');
  const existing = getRecord(dateKey);
  if (existing?.status === 'Holiday' && !existing?.checkIn) {
    throw new Error('This day is marked as a holiday');
  }
  if (existing?.checkIn && !existing?.checkOut) throw new Error('You are already checked in');
  if (existing?.checkOut) throw new Error('Today is already complete');

  return persist(dateKey, buildRecord(dateKey, {
    checkIn: new Date().toISOString(),
    status: 'Checked In',
  }));
}

export function checkOut(dateKey = todayKey()) {
  const existing = getRecord(dateKey);
  if (!existing?.checkIn) throw new Error('Check in before checking out');
  if (existing.checkOut) throw new Error('You are already checked out');

  return persist(dateKey, buildRecord(dateKey, {
    checkOut: new Date().toISOString(),
  }));
}

export function updateRecord(dateKey, updates) {
  const existing = getRecord(dateKey) || {};
  let checkIn = existing.checkIn ?? null;
  let checkOut = existing.checkOut ?? null;

  if (updates.checkInTime !== undefined) {
    checkIn = updates.checkInTime
      ? combineDateAndTime(dateKey, updates.checkInTime)?.toISOString() ?? null
      : null;
  }
  if (updates.checkOutTime !== undefined) {
    checkOut = updates.checkOutTime
      ? combineDateAndTime(dateKey, updates.checkOutTime)?.toISOString() ?? null
      : null;
  }

  if (checkIn && checkOut && new Date(checkOut) <= new Date(checkIn)) {
    throw new Error('Check-out has to be after check-in');
  }

  const partial = {
    checkIn,
    checkOut,
    status: updates.status,
    shiftId: updates.shiftId,
    shift: updates.shiftId ? getShiftById(updates.shiftId)?.label : undefined,
    comments: updates.comments,
  };

  const record = buildRecord(dateKey, partial);
  if (updates.payableHours != null && !Number.isNaN(Number(updates.payableHours))) {
    record.payableHours = Number(updates.payableHours);
    record.manualPayable = true;
  }

  return persist(dateKey, record);
}

export function recordsForMonth(attendance, year, month) {
  const prefix = `${year}-${pad(month)}`;
  return Object.values(attendance)
    .filter((record) => record?.date?.startsWith(prefix))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getMonthStats(attendance, year, month, now = new Date()) {
  const daysInMonth = getDaysInMonth(year, month);
  const records = recordsForMonth(attendance, year, month);
  const recordMap = Object.fromEntries(records.map((record) => [record.date, record]));
  const today = toDateKey(now);

  let present = 0;
  let absent = 0;
  let leave = 0;
  let weekends = 0;
  let totalHours = 0;
  let payableHours = 0;
  let workdays = 0;

  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = `${year}-${pad(month)}-${pad(day)}`;
    const record = recordMap[key];
    const future = key > today;
    if (isWeekend(key)) {
      weekends += 1;
      continue;
    }
    if (record?.status === 'Holiday') continue;
    if (future) continue;
    workdays += 1;

    if (!record) {
      absent += 1;
      continue;
    }

    if (record.checkIn && !record.checkOut && key === today) {
      totalHours += hoursBetween(record.checkIn, now.toISOString());
    } else {
      totalHours += record.totalHours || 0;
    }
    payableHours += record.payableHours || 0;

    if (record.status === 'Present' || record.status === 'Work from Home' || record.status === 'Checked In') {
      present += 1;
    } else if (record.status === 'Half Day') {
      present += 0.5;
    } else if (record.status === 'Leave') {
      leave += 1;
    } else if (record.status === 'Absent' || !record.checkIn) {
      absent += 1;
    } else {
      present += 1;
    }
  }

  const rate = workdays > 0 ? Math.round(((workdays - absent) / workdays) * 100) : 0;
  return { present, absent, leave, weekends, totalHours, payableHours, workdays, rate };
}

export function getWeekStats(attendance, date = new Date()) {
  const { start, end } = getWeekRange(date);
  const today = toDateKey(date);
  let totalHours = 0;
  const cursor = new Date(start);

  while (cursor <= end) {
    const key = toDateKey(cursor);
    const record = attendance[key];
    if (record?.checkIn) {
      if (!record.checkOut && key === today) {
        totalHours += hoursBetween(record.checkIn, date.toISOString());
      } else {
        totalHours += record.totalHours || hoursBetween(record.checkIn, record.checkOut);
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return { totalHours, start: toDateKey(start), end: toDateKey(end) };
}

export function getWeekStrip(attendance, date = new Date()) {
  const today = toDateKey(date);
  const days = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(date);
    day.setDate(date.getDate() - offset);
    const key = toDateKey(day);
    const record = attendance[key];
    let status = record?.status;
    if (!status) {
      if (record?.checkIn && !record?.checkOut) status = 'Checked In';
      else if (record?.checkIn) status = 'Present';
      else status = isWeekend(key) ? 'Weekend' : 'Absent';
    }
    days.push({
      key,
      label: day.toLocaleDateString('en-IN', { weekday: 'narrow' }),
      day: day.getDate(),
      isToday: key === today,
      status,
      record,
    });
  }

  return days;
}

export function getRecentActivity(attendance, limit = 5) {
  return Object.values(attendance)
    .filter((record) => record?.checkIn || record?.status === 'Leave' || record?.status === 'Holiday')
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

export function getFullMonthGrid(attendance, year, month) {
  const settings = getSettings();
  const defaultShift = getDefaultShift();
  const recordMap = Object.fromEntries(
    recordsForMonth(attendance, year, month).map((record) => [record.date, record])
  );
  const rows = [];

  for (let day = 1; day <= getDaysInMonth(year, month); day += 1) {
    const key = `${year}-${pad(month)}-${pad(day)}`;
    const record = recordMap[key];
    if (record) {
      rows.push({ ...record });
      continue;
    }

    rows.push({
      employeeId: settings.employeeId,
      employeeName: settings.employeeName,
      date: key,
      checkIn: null,
      checkOut: null,
      totalHours: 0,
      payableHours: 0,
      status: isWeekend(key) ? 'Weekend' : 'Absent',
      shift: defaultShift?.label || '',
      comments: '',
    });
  }

  return rows;
}

export function statusForDate(attendance, dateKey) {
  const record = attendance[dateKey];
  if (record?.status) return record.status;
  if (record?.checkIn && !record?.checkOut) return 'Checked In';
  if (record?.checkIn) return 'Present';
  if (isWeekend(dateKey)) return 'Weekend';
  return '';
}
