const Attendance = {
  buildRecord(dateKey, partial = {}) {
    const settings = Storage.getSettings();
    const shift = Storage.getShiftById(partial.shiftId || settings.defaultShiftId) || Storage.getDefaultShift();
    const existing = Storage.getRecord(dateKey) || {};

    const record = {
      employeeId: settings.employeeId || '',
      employeeName: settings.employeeName || '',
      date: dateKey,
      checkIn: partial.checkIn ?? existing.checkIn ?? null,
      checkOut: partial.checkOut ?? existing.checkOut ?? null,
      totalHours: 0,
      payableHours: 0,
      status: partial.status ?? existing.status ?? '',
      shift: partial.shift ?? shift?.label ?? '',
      shiftId: partial.shiftId ?? existing.shiftId ?? shift?.id ?? '',
      comments: partial.comments ?? existing.comments ?? '',
    };

    record.totalHours = Utils.hoursBetween(record.checkIn, record.checkOut);
    record.payableHours = this.calcPayableHours(record, settings);
    record.status = partial.status ?? this.inferStatus(record, dateKey);

    return record;
  },

  calcPayableHours(record, settings) {
    if (record.status === 'Weekend' || record.status === 'Absent') return 0;
    if (record.status === 'Leave') return 0;
    if (settings.payableHoursRule === 'manual' && record.payableHours != null && record.manualPayable) {
      return record.payableHours;
    }
    if (settings.payableHoursRule === 'actual') {
      return Math.min(record.totalHours || 0, settings.defaultPayableHours);
    }
    if (record.status === 'Present' || record.status === 'Half Day' || record.status === 'Checked In') {
      if (record.status === 'Half Day') return settings.defaultPayableHours / 2;
      return settings.defaultPayableHours;
    }
    return 0;
  },

  inferStatus(record, dateKey) {
    if (Utils.isWeekend(dateKey)) return 'Weekend';
    if (record.checkIn && !record.checkOut) return 'Checked In';
    if (record.checkIn && record.checkOut) {
      const h = record.totalHours || Utils.hoursBetween(record.checkIn, record.checkOut);
      const settings = Storage.getSettings();
      if (h < settings.defaultPayableHours / 2) return 'Half Day';
      return 'Present';
    }
    return 'Absent';
  },

  checkIn(dateKey = Utils.todayKey()) {
    if (Utils.isWeekend(dateKey)) {
      throw new Error('Cannot check in on a weekend');
    }
    const existing = Storage.getRecord(dateKey);
    if (existing?.checkIn && !existing?.checkOut) {
      throw new Error('Already checked in today');
    }
    if (existing?.checkOut) {
      throw new Error('Already completed attendance for today');
    }

    const now = new Date().toISOString();
    const record = this.buildRecord(dateKey, { checkIn: now, status: 'Checked In' });
    Storage.saveRecord(dateKey, record);
    if (typeof API !== 'undefined') API.pushRecord(record);
    return record;
  },

  checkOut(dateKey = Utils.todayKey()) {
    const existing = Storage.getRecord(dateKey);
    if (!existing?.checkIn) {
      throw new Error('Check in first before checking out');
    }
    if (existing.checkOut) {
      throw new Error('Already checked out today');
    }

    const now = new Date().toISOString();
    const record = this.buildRecord(dateKey, { checkOut: now });
    Storage.saveRecord(dateKey, record);
    if (typeof API !== 'undefined') API.pushRecord(record);
    return record;
  },

  updateRecord(dateKey, updates) {
    const existing = Storage.getRecord(dateKey) || {};
    let checkIn = existing.checkIn;
    let checkOut = existing.checkOut;

    if (updates.checkInTime !== undefined) {
      checkIn = updates.checkInTime
        ? Utils.combineDateAndTime(dateKey, updates.checkInTime).toISOString()
        : null;
    }
    if (updates.checkOutTime !== undefined) {
      checkOut = updates.checkOutTime
        ? Utils.combineDateAndTime(dateKey, updates.checkOutTime).toISOString()
        : null;
    }

    if (checkIn && checkOut && new Date(checkOut) <= new Date(checkIn)) {
      throw new Error('Check-out must be after check-in');
    }

    const partial = {
      checkIn,
      checkOut,
      status: updates.status,
      shiftId: updates.shiftId,
      shift: updates.shiftId ? Storage.getShiftById(updates.shiftId)?.label : undefined,
      comments: updates.comments,
    };

    if (updates.payableHours != null) {
      partial.payableHours = updates.payableHours;
      partial.manualPayable = true;
    }

    const record = this.buildRecord(dateKey, partial);
    if (updates.payableHours != null) {
      record.payableHours = updates.payableHours;
      record.manualPayable = true;
    }

    Storage.saveRecord(dateKey, record);
    if (typeof API !== 'undefined') API.pushRecord(record);
    return record;
  },

  getMonthRecords(year, month) {
    const all = Storage.getAttendance();
    const prefix = `${year}-${Utils.pad(month)}`;
    return Object.entries(all)
      .filter(([key]) => key.startsWith(prefix))
      .map(([, record]) => record)
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  getMonthStats(year, month) {
    const daysInMonth = Utils.getDaysInMonth(year, month);
    const records = this.getMonthRecords(year, month);
    const recordMap = Object.fromEntries(records.map((r) => [r.date, r]));

    let present = 0;
    let absent = 0;
    let leave = 0;
    let weekends = 0;
    let totalHours = 0;
    let payableHours = 0;
    let workdays = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${Utils.pad(month)}-${Utils.pad(d)}`;
      const rec = recordMap[key];
      const weekend = Utils.isWeekend(key);

      if (weekend) {
        weekends++;
        continue;
      }
      workdays++;

      if (rec) {
        totalHours += rec.totalHours || 0;
        payableHours += rec.payableHours || 0;
        if (rec.status === 'Present' || rec.status === 'Checked In') present++;
        else if (rec.status === 'Half Day') present += 0.5;
        else if (rec.status === 'Leave') leave++;
        else if (rec.status === 'Absent') absent++;
        else if (!rec.checkIn) absent++;
        else present++;
      } else {
        absent++;
      }
    }

    const rate = workdays > 0 ? Math.round(((workdays - absent) / workdays) * 100) : 0;

    return { present, absent, leave, weekends, totalHours, payableHours, workdays, rate };
  },

  getWeekStrip() {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = Utils.toDateKey(d);
      let record = Storage.getRecord(key);
      let status = record?.status;

      if (!status) {
        status = Utils.isWeekend(key) ? 'Weekend' : 'Absent';
        if (record?.checkIn && !record?.checkOut) status = 'Checked In';
        else if (record?.checkIn) status = record.status || 'Present';
      }

      days.push({
        key,
        label: d.toLocaleDateString('en-IN', { weekday: 'narrow' }),
        isToday: key === Utils.todayKey(),
        status,
        record,
      });
    }
    return days;
  },

  getRecentActivity(limit = 5) {
    const all = Storage.getAttendance();
    return Object.values(all)
      .filter((r) => r.checkIn || r.status === 'Leave')
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, limit);
  },

  getFullMonthGrid(year, month) {
    const daysInMonth = Utils.getDaysInMonth(year, month);
    const settings = Storage.getSettings();
    const defaultShift = Storage.getDefaultShift();
    const records = this.getMonthRecords(year, month);
    const recordMap = Object.fromEntries(records.map((r) => [r.date, r]));
    const rows = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${Utils.pad(month)}-${Utils.pad(d)}`;
      const weekend = Utils.isWeekend(key);
      const rec = recordMap[key];

      if (rec) {
        rows.push({ ...rec });
      } else if (weekend) {
        rows.push({
          employeeId: settings.employeeId,
          employeeName: settings.employeeName,
          date: key,
          checkIn: null,
          checkOut: null,
          totalHours: 0,
          payableHours: 0,
          status: 'Weekend',
          shift: defaultShift?.label || '',
          comments: '',
        });
      } else {
        rows.push({
          employeeId: settings.employeeId,
          employeeName: settings.employeeName,
          date: key,
          checkIn: null,
          checkOut: null,
          totalHours: 0,
          payableHours: 0,
          status: 'Absent',
          shift: defaultShift?.label || '',
          comments: '',
        });
      }
    }
    return rows;
  },
};
