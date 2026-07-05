const API = {
  _syncing: false,
  _lastSync: null,

  enabled() {
    return !!(CONFIG.API_URL && CONFIG.API_URL.trim());
  },

  async request(action, payload = {}, method = 'GET') {
    if (!this.enabled()) return null;

    const url = new URL(CONFIG.API_URL);

    if (method === 'GET') {
      url.searchParams.set('action', action);
      Object.entries(payload).forEach(([k, v]) => {
        if (v != null) url.searchParams.set(k, v);
      });
      const res = await fetch(url.toString(), { method: 'GET' });
      return this._parse(res);
    }

    const res = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...payload }),
      redirect: 'follow',
    });
    return this._parse(res);
  },

  async _parse(res) {
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      if (data.error) throw new Error(data.error);
      return data;
    } catch (err) {
      if (err.message && err.message !== 'Unexpected end of JSON input') throw err;
      throw new Error('Invalid response from Google Sheets API');
    }
  },

  async ping() {
    return this.request('ping');
  },

  async pullAll() {
    if (!this.enabled()) return false;
    this._syncing = true;
    this._emitStatus('syncing');

    try {
      const [settingsData, attendanceData] = await Promise.all([
        this.request('settings'),
        this.request('attendance_all'),
      ]);

      if (settingsData?.settings) {
        const s = settingsData.settings;
        Storage.saveSettings({
          employeeName: s.employeeName || '',
          employeeId: s.employeeId || '',
          defaultPayableHours: Number(s.defaultPayableHours) || 8,
          payableHoursRule: s.payableHoursRule || 'fixed',
          weeklyHoursGoal: Number(s.weeklyHoursGoal) || 40,
          defaultShiftId: s.defaultShiftId || 'shift_1',
          theme: s.theme || 'system',
        });
        Theme.apply(Storage.getSettings().theme || 'system');
      }

      if (settingsData?.shifts?.length) {
        Storage.saveShifts(settingsData.shifts);
      }

      if (attendanceData?.records) {
        const map = {};
        attendanceData.records.forEach((r) => {
          if (r.date) map[r.date] = r;
        });
        Storage.saveAttendance(map);
      }

      this._lastSync = Date.now();
      Storage.set('timetrack_last_sync', this._lastSync);
      this._emitStatus('synced');
      return true;
    } catch (err) {
      console.warn('Sync pull failed:', err);
      this._emitStatus('error');
      return false;
    } finally {
      this._syncing = false;
    }
  },

  async pushRecord(record) {
    if (!this.enabled() || !record) return;
    try {
      await this.request('save_record', { record }, 'POST');
      this._lastSync = Date.now();
      Storage.set('timetrack_last_sync', this._lastSync);
    } catch (err) {
      console.warn('Push record failed:', err);
      Storage.addToSyncQueue({ type: 'save_record', record });
    }
  },

  async pushSettings() {
    if (!this.enabled()) return;
    try {
      await this.request(
        'save_settings',
        { settings: Storage.getSettings(), shifts: Storage.getShifts() },
        'POST'
      );
      this._lastSync = Date.now();
      Storage.set('timetrack_last_sync', this._lastSync);
    } catch (err) {
      console.warn('Push settings failed:', err);
    }
  },

  async flushQueue() {
    if (!this.enabled() || !navigator.onLine) return;
    const queue = Storage.getSyncQueue();
    if (!queue.length) return;

    const remaining = [];
      for (const item of queue) {
      try {
        if (item.record) {
          await this.request('save_record', { record: item.record }, 'POST');
        } else if (item.dateKey) {
          const rec = Storage.getRecord(item.dateKey);
          if (rec) await this.request('save_record', { record: rec }, 'POST');
        }
      } catch {
        remaining.push(item);
      }
    }
    Storage.set(CONFIG.STORAGE_KEYS.syncQueue, remaining);
  },

  _emitStatus(status) {
    window.dispatchEvent(new CustomEvent('timetrack-sync', { detail: { status } }));
  },

  async init() {
    if (!this.enabled()) return;
    await this.pullAll();
    await this.flushQueue();

    window.addEventListener('online', () => {
      this.flushQueue().then(() => this.pullAll());
    });
  },
};
