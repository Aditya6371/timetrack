import { CONFIG } from '../config';
import {
  enqueueSync,
  getAttendance,
  getRecord,
  getSettings,
  getShifts,
  getSyncQueue,
  saveAttendance,
  saveSettings,
  saveShifts,
  setLastSync,
  setSyncQueue,
} from './storage';
import { applyTheme } from './theme';

export function apiEnabled() {
  return Boolean(CONFIG.API_URL && String(CONFIG.API_URL).trim());
}

async function parseResponse(response) {
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Google Sheets returned a page instead of JSON. Redeploy the web app and confirm the URL ends with /exec.');
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function request(action, payload = {}, method = 'GET') {
  if (!apiEnabled()) return null;

  if (method === 'GET') {
    const url = new URL(CONFIG.API_URL);
    url.searchParams.set('action', action);
    Object.entries(payload).forEach(([key, value]) => {
      if (value != null && value !== '') url.searchParams.set(key, value);
    });
    const response = await fetch(url.toString());
    return parseResponse(response);
  }

  const response = await fetch(CONFIG.API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...payload }),
    redirect: 'follow',
  });
  return parseResponse(response);
}

export async function pushRecord(record) {
  if (!apiEnabled() || !record) return;
  try {
    await request('save_record', { record }, 'POST');
    setLastSync(Date.now());
  } catch (error) {
    console.warn('Push record failed:', error);
    enqueueSync({ type: 'save_record', record });
  }
}

export async function pushSettings(settings = getSettings(), shifts = getShifts()) {
  if (!apiEnabled()) return;
  try {
    await request('save_settings', { settings, shifts }, 'POST');
    setLastSync(Date.now());
  } catch (error) {
    console.warn('Push settings failed:', error);
  }
}

export async function flushQueue() {
  if (!apiEnabled() || !navigator.onLine) return;
  const queue = getSyncQueue();
  if (!queue.length) return;

  const remaining = [];
  for (const item of queue) {
    try {
      if (item.record) {
        await request('save_record', { record: item.record }, 'POST');
      } else if (item.dateKey) {
        const record = getRecord(item.dateKey);
        if (record) await request('save_record', { record }, 'POST');
      }
    } catch (error) {
      console.warn('Queued sync failed:', error);
      remaining.push(item);
    }
  }
  setSyncQueue(remaining);
}

function applyRemoteSettings(settingsData) {
  if (settingsData?.settings) {
    const remote = settingsData.settings;
    saveSettings({
      employeeName: remote.employeeName || '',
      employeeId: remote.employeeId || '',
      defaultPayableHours: Number(remote.defaultPayableHours) || 8,
      payableHoursRule: remote.payableHoursRule || 'fixed',
      weeklyHoursGoal: Number(remote.weeklyHoursGoal) || 40,
      defaultShiftId: remote.defaultShiftId || 'shift_1',
      theme: remote.theme || 'system',
    });
    applyTheme(getSettings().theme || 'system');
  }
  if (settingsData?.shifts?.length) saveShifts(settingsData.shifts);
}

/**
 * Flush pending edits, pull the sheet, then keep any day that exists only on this device.
 * Pending edits that failed to upload are written back so the screen does not lose them.
 */
export async function syncNow() {
  if (!apiEnabled()) return 'local';
  if (!navigator.onLine) return 'offline';

  await flushQueue();
  const [settingsData, attendanceData] = await Promise.all([
    request('settings'),
    request('attendance_all'),
  ]);

  applyRemoteSettings(settingsData);

  const remoteMap = {};
  (attendanceData?.records || []).forEach((record) => {
    if (record?.date) remoteMap[record.date] = record;
  });

  const local = getAttendance();
  const merged = { ...local, ...remoteMap };
  getSyncQueue().forEach((item) => {
    if (item.record?.date) merged[item.record.date] = item.record;
  });
  saveAttendance(merged);

  const pendingDates = new Set(getSyncQueue().map((item) => item.record?.date).filter(Boolean));
  const onlyLocal = Object.keys(local).filter((key) => !remoteMap[key] && !pendingDates.has(key));
  for (const key of onlyLocal) {
    if (local[key]) await pushRecord(local[key]);
  }

  setLastSync(Date.now());
  return 'sheets';
}
