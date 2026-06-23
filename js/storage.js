const Storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },

  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  getSettings() {
    return this.get(CONFIG.STORAGE_KEYS.settings, {
      employeeName: '',
      employeeId: '',
      defaultPayableHours: 8,
      payableHoursRule: 'fixed',
      defaultShiftId: 'shift_1',
      theme: 'system',
    });
  },

  saveSettings(settings) {
    this.set(CONFIG.STORAGE_KEYS.settings, settings);
  },

  getShifts() {
    return this.get(CONFIG.STORAGE_KEYS.shifts, [
      {
        id: 'shift_1',
        label: 'General (09:00 AM - 06:00 PM)',
        start: '09:00',
        end: '18:00',
        isDefault: true,
      },
    ]);
  },

  saveShifts(shifts) {
    this.set(CONFIG.STORAGE_KEYS.shifts, shifts);
  },

  getAttendance() {
    return this.get(CONFIG.STORAGE_KEYS.attendance, {});
  },

  saveAttendance(data) {
    this.set(CONFIG.STORAGE_KEYS.attendance, data);
  },

  getRecord(dateKey) {
    const all = this.getAttendance();
    return all[dateKey] || null;
  },

  saveRecord(dateKey, record) {
    const all = this.getAttendance();
    all[dateKey] = record;
    this.saveAttendance(all);
  },

  getDefaultShift() {
    const shifts = this.getShifts();
    return shifts.find((s) => s.isDefault) || shifts[0];
  },

  getShiftById(id) {
    return this.getShifts().find((s) => s.id === id);
  },

  addToSyncQueue(action) {
    const queue = this.get(CONFIG.STORAGE_KEYS.syncQueue, []);
    queue.push({ ...action, ts: Date.now() });
    this.set(CONFIG.STORAGE_KEYS.syncQueue, queue);
  },

  getSyncQueue() {
    return this.get(CONFIG.STORAGE_KEYS.syncQueue, []);
  },

  clearSyncQueue() {
    this.set(CONFIG.STORAGE_KEYS.syncQueue, []);
  },
};
