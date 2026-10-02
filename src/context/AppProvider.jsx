import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiEnabled, pushSettings, syncNow } from '../lib/api';
import {
  checkIn as checkInRecord,
  checkOut as checkOutRecord,
  updateRecord as updateAttendanceRecord,
} from '../lib/attendance';
import {
  getAttendance,
  getSettings,
  getShiftById,
  getShifts,
  saveSettings,
  saveShifts,
} from '../lib/storage';
import { applyTheme } from '../lib/theme';
import { formatClockLabel } from '../lib/utils';

const AppContext = createContext(null);

const SYNC_LABEL = {
  local: 'Local',
  syncing: 'Syncing',
  sheets: 'Google Sheets',
  offline: 'Offline',
  error: 'Sync issue',
};

function syncState(mode) {
  return { mode, label: SYNC_LABEL[mode] || 'Local' };
}

export function AppProvider({ children }) {
  const [settings, setSettings] = useState(getSettings);
  const [shifts, setShifts] = useState(getShifts);
  const [attendance, setAttendance] = useState(getAttendance);
  const [sync, setSync] = useState(() => syncState(apiEnabled() ? 'syncing' : 'local'));
  const [toasts, setToasts] = useState([]);

  const reload = useCallback(() => {
    const nextSettings = getSettings();
    setSettings(nextSettings);
    setShifts(getShifts());
    setAttendance(getAttendance());
    applyTheme(nextSettings.theme);
  }, []);

  const toast = useCallback((message, type = 'info') => {
    const id = crypto.randomUUID();
    setToasts((list) => [...list, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((list) => list.filter((item) => item.id !== id));
    }, 3200);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((list) => list.filter((item) => item.id !== id));
  }, []);

  const runSync = useCallback(async () => {
    if (!apiEnabled()) {
      setSync(syncState('local'));
      return;
    }
    if (!navigator.onLine) {
      setSync(syncState('offline'));
      return;
    }
    setSync(syncState('syncing'));
    try {
      const mode = await syncNow();
      reload();
      setSync(syncState(mode));
    } catch (error) {
      console.warn('Sync failed:', error);
      setSync(syncState('error'));
    }
  }, [reload]);

  useEffect(() => {
    applyTheme(settings.theme || 'system');
  }, [settings.theme]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (getSettings().theme === 'system') applyTheme('system');
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    runSync();
    const onOnline = () => runSync();
    const onOffline = () => {
      if (apiEnabled()) setSync(syncState('offline'));
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [runSync]);

  const updateSettings = useCallback((partial, { announce } = {}) => {
    const next = { ...getSettings(), ...partial };
    saveSettings(next);
    setSettings(next);
    if (partial.theme) applyTheme(partial.theme);
    pushSettings(next, getShifts());
    if (announce) toast(announce, 'success');
    return next;
  }, [toast]);

  const value = useMemo(() => ({
    settings,
    shifts,
    attendance,
    sync,
    toasts,
    toast,
    dismissToast,
    apiEnabled: apiEnabled(),
    reload,
    runSync,
    checkIn(dateKey) {
      const record = checkInRecord(dateKey);
      reload();
      return record;
    },
    checkOut(dateKey) {
      const record = checkOutRecord(dateKey);
      reload();
      return record;
    },
    updateRecord(dateKey, updates) {
      const record = updateAttendanceRecord(dateKey, updates);
      reload();
      return record;
    },
    updateSettings,
    setDefaultShift(id) {
      const nextShifts = getShifts().map((shift) => ({ ...shift, isDefault: shift.id === id }));
      saveShifts(nextShifts);
      const nextSettings = { ...getSettings(), defaultShiftId: id };
      saveSettings(nextSettings);
      setShifts(nextShifts);
      setSettings(nextSettings);
      pushSettings(nextSettings, nextShifts);
      toast('Default shift updated', 'success');
    },
    deleteShift(id) {
      const nextShifts = getShifts().filter((shift) => shift.id !== id);
      if (!nextShifts.length) {
        toast('Keep at least one shift', 'error');
        return;
      }
      if (!nextShifts.some((shift) => shift.isDefault)) nextShifts[0].isDefault = true;
      saveShifts(nextShifts);
      const defaultShift = nextShifts.find((shift) => shift.isDefault) || nextShifts[0];
      const nextSettings = { ...getSettings(), defaultShiftId: defaultShift.id };
      saveSettings(nextSettings);
      setShifts(nextShifts);
      setSettings(nextSettings);
      pushSettings(nextSettings, nextShifts);
      toast('Shift removed', 'success');
    },
    saveShift({ id, name, start, end }) {
      const label = `${name} (${formatClockLabel(start)} - ${formatClockLabel(end)})`;
      let nextShifts = getShifts();
      if (id) {
        nextShifts = nextShifts.map((shift) => (
          shift.id === id ? { ...shift, label, start, end } : shift
        ));
      } else {
        nextShifts = [
          ...nextShifts,
          { id: `shift_${Date.now()}`, label, start, end, isDefault: nextShifts.length === 0 },
        ];
      }
      saveShifts(nextShifts);
      setShifts(nextShifts);
      pushSettings(getSettings(), nextShifts);
      toast(id ? 'Shift updated' : 'Shift added', 'success');
    },
    getShift: getShiftById,
  }), [attendance, dismissToast, reload, runSync, settings, shifts, sync, toast, updateSettings]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}
