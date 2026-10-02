const SettingsPage = {
  init() {
    this.render();
    this.bindEvents();
  },

  render() {
    const settings = Storage.getSettings();
    const shifts = Storage.getShifts();

    document.getElementById('avatar').textContent = Utils.initials(settings.employeeName);
    document.getElementById('employee-name').value = settings.employeeName || '';
    document.getElementById('employee-id').value = settings.employeeId || '';
    document.getElementById('payable-hours').textContent = settings.defaultPayableHours;
    document.getElementById('weekly-hours-goal').textContent = settings.weeklyHoursGoal ?? 40;
    document.getElementById('app-version').textContent = CONFIG.VERSION;
    document.getElementById('data-source').textContent =
      typeof API !== 'undefined' && API.enabled() ? 'Google Sheets' : 'Local storage';

    this.setSegmentedActive('rule-segmented', settings.payableHoursRule);
    this.setSegmentedActive('theme-segmented', settings.theme);

    const shiftsEl = document.getElementById('shifts-list');
    shiftsEl.innerHTML = shifts
      .map(
        (s) => `
      <div class="shift-item${s.isDefault ? ' is-default' : ''}" data-id="${s.id}">
        <div>
          <div class="shift-item-name">${s.label}</div>
          <div class="shift-item-time">${s.start} – ${s.end}</div>
        </div>
        <div class="shift-item-actions">
          ${s.isDefault ? `<span title="Default" style="color:var(--primary);display:flex">${Components.icon('star')}</span>` : `<button class="icon-btn set-default" type="button" title="Set default">${Components.icon('star')}</button>`}
          <button class="icon-btn edit-shift" type="button" title="Edit">${Components.icon('edit')}</button>
          ${shifts.length > 1 ? `<button class="icon-btn delete-shift" type="button" title="Delete">${Components.icon('trash')}</button>` : ''}
        </div>
      </div>`
      )
      .join('');

    shiftsEl.querySelectorAll('.set-default').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.closest('.shift-item').dataset.id;
        this.setDefaultShift(id);
      });
    });

    shiftsEl.querySelectorAll('.edit-shift').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.closest('.shift-item').dataset.id;
        this.openShiftModal(Storage.getShiftById(id));
      });
    });

    shiftsEl.querySelectorAll('.delete-shift').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.closest('.shift-item').dataset.id;
        this.deleteShift(id);
      });
    });
  },

  setSegmentedActive(containerId, value) {
    document.querySelectorAll(`#${containerId} button`).forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.value === value);
    });
  },

  bindEvents() {
    document.getElementById('employee-name').addEventListener(
      'input',
      Utils.debounce(() => this.saveProfile(), 400)
    );
    document.getElementById('employee-id').addEventListener(
      'input',
      Utils.debounce(() => this.saveProfile(), 400)
    );

    document.getElementById('payable-minus').addEventListener('click', () => {
      const settings = Storage.getSettings();
      if (settings.defaultPayableHours > 1) {
        settings.defaultPayableHours -= 0.5;
        Storage.saveSettings(settings);
        document.getElementById('payable-hours').textContent = settings.defaultPayableHours;
        if (typeof API !== 'undefined') API.pushSettings();
      }
    });

    document.getElementById('payable-plus').addEventListener('click', () => {
      const settings = Storage.getSettings();
      if (settings.defaultPayableHours < 24) {
        settings.defaultPayableHours += 0.5;
        Storage.saveSettings(settings);
        document.getElementById('payable-hours').textContent = settings.defaultPayableHours;
        if (typeof API !== 'undefined') API.pushSettings();
      }
    });

    document.getElementById('weekly-goal-minus').addEventListener('click', () => {
      const settings = Storage.getSettings();
      const goal = settings.weeklyHoursGoal ?? 40;
      if (goal > 1) {
        settings.weeklyHoursGoal = goal - 1;
        Storage.saveSettings(settings);
        document.getElementById('weekly-hours-goal').textContent = settings.weeklyHoursGoal;
        if (typeof API !== 'undefined') API.pushSettings();
      }
    });

    document.getElementById('weekly-goal-plus').addEventListener('click', () => {
      const settings = Storage.getSettings();
      const goal = settings.weeklyHoursGoal ?? 40;
      if (goal < 168) {
        settings.weeklyHoursGoal = goal + 1;
        Storage.saveSettings(settings);
        document.getElementById('weekly-hours-goal').textContent = settings.weeklyHoursGoal;
        if (typeof API !== 'undefined') API.pushSettings();
      }
    });

    document.querySelectorAll('#rule-segmented button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const settings = Storage.getSettings();
        settings.payableHoursRule = btn.dataset.value;
        Storage.saveSettings(settings);
        this.setSegmentedActive('rule-segmented', btn.dataset.value);
        Components.toast('Payable hours rule updated', 'success');
        if (typeof API !== 'undefined') API.pushSettings();
      });
    });

    document.querySelectorAll('#theme-segmented button').forEach((btn) => {
      btn.addEventListener('click', () => {
        Theme.set(btn.dataset.value);
        this.setSegmentedActive('theme-segmented', btn.dataset.value);
      });
    });

    document.getElementById('add-shift-btn').addEventListener('click', () => {
      this.openShiftModal(null);
    });
  },

  saveProfile() {
    const settings = Storage.getSettings();
    settings.employeeName = document.getElementById('employee-name').value.trim();
    settings.employeeId = document.getElementById('employee-id').value.trim();
    Storage.saveSettings(settings);
    document.getElementById('avatar').textContent = Utils.initials(settings.employeeName);
    if (typeof API !== 'undefined') API.pushSettings();
  },

  setDefaultShift(id) {
    const shifts = Storage.getShifts().map((s) => ({
      ...s,
      isDefault: s.id === id,
    }));
    Storage.saveShifts(shifts);
    const settings = Storage.getSettings();
    settings.defaultShiftId = id;
    Storage.saveSettings(settings);
    this.render();
    Components.toast('Default shift updated', 'success');
    if (typeof API !== 'undefined') API.pushSettings();
  },

  deleteShift(id) {
    const shifts = Storage.getShifts().filter((s) => s.id !== id);
    if (!shifts.some((s) => s.isDefault)) shifts[0].isDefault = true;
    Storage.saveShifts(shifts);
    this.render();
    Components.toast('Shift removed', 'success');
    if (typeof API !== 'undefined') API.pushSettings();
  },

  openShiftModal(shift) {
    const isEdit = !!shift;
    const body = `
      <div class="form-group">
        <label class="form-label">Shift Name</label>
        <input type="text" class="form-input" id="shift-name" value="${shift?.label?.split(' (')[0] || ''}" placeholder="General">
      </div>
      <div class="form-group">
        <label class="form-label">Start Time</label>
        ${Utils.timeSelectHtml('shift-start', shift?.start || '09:00')}
      </div>
      <div class="form-group">
        <label class="form-label">End Time</label>
        ${Utils.timeSelectHtml('shift-end', shift?.end || '18:00')}
      </div>
    `;

    Components.openModal(isEdit ? 'Edit Shift' : 'Add Shift', body, (close) => {
      const name = document.getElementById('shift-name').value.trim() || 'General';
      const start = Utils.readTimeSelect('shift-start') || '09:00';
      const end = Utils.readTimeSelect('shift-end') || '18:00';

      const format12 = (t) => {
        const [h, m] = t.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
      };

      const label = `${name} (${format12(start)} - ${format12(end)})`;
      let shifts = Storage.getShifts();

      if (isEdit) {
        shifts = shifts.map((s) =>
          s.id === shift.id ? { ...s, label, start, end } : s
        );
      } else {
        const id = `shift_${Date.now()}`;
        shifts.push({ id, label, start, end, isDefault: shifts.length === 0 });
      }

      Storage.saveShifts(shifts);
      close();
      this.render();
      Components.toast(isEdit ? 'Shift updated' : 'Shift added', 'success');
      if (typeof API !== 'undefined') API.pushSettings();
    });
  },
};

document.addEventListener('DOMContentLoaded', async () => {
  Theme.init();
  Components.mountShell('settings');
  if (typeof API !== 'undefined' && API.enabled()) await API.init();
  Components.updateSyncBadge();
  SettingsPage.init();
});
