const Components = {
  icon(name) {
    const icons = {
      home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
      calendar: '<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>',
      chart: '<line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/>',
      settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
      clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
      check: '<polyline points="20 6 9 17 4 12"/>',
      download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
      edit: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
      plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
      star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
      trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
      cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
    };
    return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icons[name] || ''}</svg>`;
  },

  renderShell(activePage) {
    const pages = [
      { id: 'home', href: 'index.html', label: 'Home', icon: 'home' },
      { id: 'calendar', href: 'calendar.html', label: 'Calendar', icon: 'calendar' },
      { id: 'reports', href: 'reports.html', label: 'Reports', icon: 'chart' },
      { id: 'settings', href: 'settings.html', label: 'Settings', icon: 'settings' },
    ];

    const sidebarLinks = pages
      .map(
        (p) =>
          `<a href="${p.href}" class="nav-link${activePage === p.id ? ' active' : ''}">${this.icon(p.icon)} ${p.label}</a>`
      )
      .join('');

    const bottomLinks = pages
      .map(
        (p) =>
          `<a href="${p.href}" class="${activePage === p.id ? 'active' : ''}">${this.icon(p.icon)}<span>${p.label}</span></a>`
      )
      .join('');

    return `
      <aside class="sidebar">
        <a href="index.html" class="brand">
          <div class="brand-icon">${this.icon('clock')}</div>
          <span class="brand-text">${CONFIG.APP_NAME}</span>
        </a>
        <nav class="sidebar-nav">${sidebarLinks}</nav>
        <div class="sidebar-footer">
          <div class="sync-badge local" aria-live="polite">
            <span class="sync-dot"></span><span>Local</span>
          </div>
        </div>
      </aside>
      <nav class="bottom-nav">${bottomLinks}</nav>
    `;
  },

  mountShell(activePage) {
    document.getElementById('app-shell')?.insertAdjacentHTML('afterbegin', this.renderShell(activePage));
    this.bindSync();
    this.updateSyncBadge();
  },

  bindSync() {
    if (this._syncBound) return;
    this._syncBound = true;
    window.addEventListener('timetrack-sync', () => this.updateSyncBadge());
    window.addEventListener('online', () => this.updateSyncBadge());
    window.addEventListener('offline', () => this.updateSyncBadge());
  },

  updateSyncBadge() {
    const online = navigator.onLine;
    const hasApi = typeof API !== 'undefined' && API.enabled();
    const syncing = hasApi && API._syncing;

    let mode = 'local';
    let label = 'Local';
    if (!online && hasApi) {
      mode = 'offline';
      label = 'Offline';
    } else if (syncing) {
      mode = 'syncing';
      label = 'Syncing…';
    } else if (hasApi) {
      mode = 'sheets';
      label = 'Google Sheets';
    }

    document.querySelectorAll('.sync-badge').forEach((el) => {
      const mobile = el.classList.contains('sync-badge--mobile');
      el.className = `sync-badge ${mode}${mobile ? ' sync-badge--mobile' : ''}`;
      el.innerHTML = `<span class="sync-dot"></span><span>${label}</span>`;
    });
  },

  badge(status) {
    return `<span class="badge ${Utils.statusClass(status)}">${status}</span>`;
  },

  toast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const el = document.createElement('div');
    el.className = 'toast';
    const icon = type === 'success' ? this.icon('check') : this.icon('clock');
    el.innerHTML = `${icon} ${message}`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  },

  openModal(title, bodyHtml, onSave) {
    let backdrop = document.getElementById('app-modal');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'app-modal';
      backdrop.className = 'modal-backdrop';
      backdrop.innerHTML = `
        <div class="modal">
          <div class="modal-handle"></div>
          <h2 class="modal-title"></h2>
          <div class="modal-body"></div>
          <div class="modal-footer">
            <button class="btn btn-secondary" type="button" id="modal-cancel">Cancel</button>
            <button class="btn btn-primary" type="button" id="modal-save">Save</button>
          </div>
        </div>`;
      document.body.appendChild(backdrop);
    }

    backdrop.querySelector('.modal-title').textContent = title;
    backdrop.querySelector('.modal-body').innerHTML = bodyHtml;

    const close = () => backdrop.classList.remove('open');
    backdrop.querySelector('#modal-cancel').onclick = close;
    backdrop.onclick = (e) => {
      if (e.target === backdrop) close();
    };

    backdrop.querySelector('#modal-save').onclick = () => {
      if (onSave) onSave(close);
    };

    requestAnimationFrame(() => backdrop.classList.add('open'));
  },

  editFormHtml(dateKey, record) {
    const shifts = Storage.getShifts();
    const settings = Storage.getSettings();
    const rec = record || {};
    const statuses = ['Present', 'Work from Home', 'Absent', 'Half Day', 'Leave', 'Weekend', 'Checked In'];

    const shiftOptions = shifts
      .map(
        (s) =>
          `<option value="${s.id}" ${rec.shiftId === s.id || (!rec.shiftId && s.isDefault) ? 'selected' : ''}>${s.label}</option>`
      )
      .join('');

    const statusOptions = statuses
      .map((s) => `<option value="${s}" ${rec.status === s ? 'selected' : ''}>${s}</option>`)
      .join('');

    const showPayable = settings.payableHoursRule === 'manual';

    return `
      <p style="color:var(--text-secondary);font-size:0.875rem;margin-bottom:16px">
        ${Utils.formatDate(dateKey, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
      <div class="form-group">
        <label class="form-label">Check-In</label>
        <input type="time" class="form-input" id="edit-checkin" value="${rec.checkIn ? Utils.timeToInput(rec.checkIn) : ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Check-Out</label>
        <input type="time" class="form-input" id="edit-checkout" value="${rec.checkOut ? Utils.timeToInput(rec.checkOut) : ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-select" id="edit-status">${statusOptions}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Shift</label>
        <select class="form-select" id="edit-shift">${shiftOptions}</select>
      </div>
      ${showPayable ? `
      <div class="form-group">
        <label class="form-label">Payable Hours</label>
        <input type="number" class="form-input" id="edit-payable" step="0.5" min="0" max="24" value="${rec.payableHours ?? settings.defaultPayableHours}">
      </div>` : ''}
      <div class="form-group">
        <label class="form-label">Comments</label>
        <textarea class="form-textarea" id="edit-comments" rows="2">${rec.comments || ''}</textarea>
      </div>
    `;
  },

  openEditModal(dateKey, onSaved) {
    const record = Storage.getRecord(dateKey);
    this.openModal('Edit Attendance', this.editFormHtml(dateKey, record), (close) => {
      try {
        const updates = {
          checkInTime: document.getElementById('edit-checkin').value || null,
          checkOutTime: document.getElementById('edit-checkout').value || null,
          status: document.getElementById('edit-status').value,
          shiftId: document.getElementById('edit-shift').value,
          comments: document.getElementById('edit-comments').value,
        };
        const payableEl = document.getElementById('edit-payable');
        if (payableEl) updates.payableHours = parseFloat(payableEl.value);

        const saved = Attendance.updateRecord(dateKey, updates);
        close();
        Components.toast('Attendance updated', 'success');
        if (onSaved) onSaved(saved);
      } catch (err) {
        Components.toast(err.message, 'error');
      }
    });
  },
};
