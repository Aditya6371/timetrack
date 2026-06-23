const Dashboard = {
  clockInterval: null,

  init() {
    this.render();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);
    document.getElementById('action-btn')?.addEventListener('click', () => this.handleAction());
    document.getElementById('time-fields')?.addEventListener('click', () => {
      Components.openEditModal(Utils.todayKey(), () => this.render());
    });
  },

  updateClock() {
    const el = document.getElementById('live-clock');
    if (!el) return;
    const now = new Date();
    el.textContent = `${Utils.pad(now.getHours())}:${Utils.pad(now.getMinutes())}:${Utils.pad(now.getSeconds())}`;
  },

  handleAction() {
    const today = Utils.todayKey();
    const record = Storage.getRecord(today);
    try {
      if (!record?.checkIn) {
        Attendance.checkIn(today);
        Components.toast('Checked in successfully', 'success');
      } else if (!record?.checkOut) {
        Attendance.checkOut(today);
        Components.toast('Checked out successfully', 'success');
      }
      this.render();
    } catch (err) {
      Components.toast(err.message, 'error');
    }
  },

  statusBadgeClass(status) {
    const map = {
      Present: 'present',
      Absent: 'absent',
      'Half Day': 'half',
      Leave: 'leave',
      Weekend: 'weekend',
      'Checked In': 'checkedin',
    };
    return map[status] || 'weekend';
  },

  render() {
    const settings = Storage.getSettings();
    const today = Utils.todayKey();
    const record = Storage.getRecord(today);
    const now = new Date();
    const stats = Attendance.getMonthStats(now.getFullYear(), now.getMonth() + 1);
    const week = Attendance.getWeekStrip();
    const recent = Attendance.getRecentActivity(5);
    const name = settings.employeeName || 'there';
    const shift = Storage.getShiftById(record?.shiftId || settings.defaultShiftId) || Storage.getDefaultShift();

    let status = '';
    let statusLabel = '';
    if (Utils.isWeekend(today) && !record?.checkIn) {
      status = 'Weekend';
      statusLabel = 'Weekend';
    } else if (record?.checkIn && !record?.checkOut) {
      status = 'Checked In';
      statusLabel = 'Checked in';
    } else if (record?.checkOut) {
      status = record.status || 'Present';
      statusLabel = status;
    } else if (record?.status) {
      status = record.status;
      statusLabel = status;
    }

    const canCheckIn = !Utils.isWeekend(today) && !record?.checkIn;
    const canCheckOut = record?.checkIn && !record?.checkOut;
    const actionLabel = canCheckOut
      ? 'Check out'
      : canCheckIn
        ? 'Check in'
        : Utils.isWeekend(today)
          ? 'Weekend'
          : 'Completed';
    const actionDisabled = Utils.isWeekend(today) || (!canCheckIn && !canCheckOut);

    document.getElementById('greeting').textContent = `${Utils.greeting()}, ${name}`;
    document.getElementById('date-line').textContent = Utils.formatDate(today, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const statusEl = document.getElementById('status-badge');
    if (status) {
      const live = status === 'Checked In' ? '<span class="dot live"></span>' : '<span class="dot"></span>';
      statusEl.innerHTML = `${live}${statusLabel}`;
      statusEl.className = `status-badge ${this.statusBadgeClass(status)}`;
      statusEl.style.display = 'inline-flex';
    } else {
      statusEl.style.display = 'none';
    }

    document.getElementById('checkin-time').textContent = record?.checkIn ? Utils.formatTime(record.checkIn) : '—';
    document.getElementById('checkout-time').textContent = record?.checkOut ? Utils.formatTime(record.checkOut) : '—';
    document.getElementById('shift-line').textContent = shift ? shift.label : '';

    const btn = document.getElementById('action-btn');
    btn.textContent = actionLabel;
    btn.disabled = actionDisabled;

    document.getElementById('stat-present').textContent = Math.round(stats.present);
    document.getElementById('stat-hours').textContent = Utils.formatHours(stats.totalHours);
    document.getElementById('stat-leave').textContent = stats.absent + stats.leave;
    document.getElementById('stat-rate').textContent = `${stats.rate}%`;

    document.getElementById('week-strip').innerHTML = week
      .map((d) => {
        const dayNum = Utils.parseDateKey(d.key).getDate();
        return `
        <div class="week-cell${d.isToday ? ' today' : ''}">
          <div class="week-cell-day">${d.label}</div>
          <div class="week-cell-bar" style="background:${Utils.statusColor(d.status)}"></div>
          <div class="week-cell-date">${dayNum}</div>
        </div>`;
      })
      .join('');

    const activityEl = document.getElementById('activity-list');
    if (!recent.length) {
      activityEl.innerHTML = `
        <div class="empty-state">
          <p>No attendance records yet.</p>
          ${!settings.employeeName ? '<a href="settings.html" class="btn btn-secondary">Set up profile</a>' : ''}
        </div>`;
    } else {
      activityEl.innerHTML = recent
        .map((r) => {
          const times =
            r.checkIn && r.checkOut
              ? `${Utils.formatTime(r.checkIn)} – ${Utils.formatTime(r.checkOut)}`
              : r.checkIn
                ? `Checked in at ${Utils.formatTime(r.checkIn)}`
                : r.status;
          return `
          <div class="activity-row" data-date="${r.date}">
            <div class="activity-row-left">
              <div class="activity-indicator" style="background:${Utils.statusColor(r.status)}"></div>
              <div>
                <div class="activity-date">${Utils.formatDate(r.date, { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                <div class="activity-meta">${times}${r.totalHours ? ` · ${Utils.formatHours(r.totalHours)}` : ''}</div>
              </div>
            </div>
            ${Components.badge(r.status)}
          </div>`;
        })
        .join('');

      activityEl.querySelectorAll('.activity-row').forEach((el) => {
        el.addEventListener('click', () => {
          Components.openEditModal(el.dataset.date, () => this.render());
        });
      });
    }
  },
};

document.addEventListener('DOMContentLoaded', async () => {
  Theme.init();
  Components.mountShell('home');
  if (typeof API !== 'undefined' && API.enabled()) await API.init();
  Components.updateSyncBadge();
  Dashboard.init();
  window.addEventListener('timetrack-sync', () => Dashboard.render());
});
