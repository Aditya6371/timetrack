const CalendarPage = {
  calendar: null,
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth() + 1,

  init() {
    this.renderCalendar();
  },

  getStatusForDate(dateKey) {
    const record = Storage.getRecord(dateKey);
    if (record?.status) return record.status;
    if (record?.checkIn && !record?.checkOut) return 'Checked In';
    if (record?.checkIn) return record.status || 'Present';
    if (Utils.isWeekend(dateKey)) return 'Weekend';
    return null;
  },

  renderCalendar() {
    const el = document.getElementById('calendar');
    if (!el || typeof FullCalendar === 'undefined') return;

    if (this.calendar) this.calendar.destroy();

    this.calendar = new FullCalendar.Calendar(el, {
      initialView: 'dayGridMonth',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: '',
      },
      height: 'auto',
      fixedWeekCount: false,
      dayMaxEvents: false,
      dateClick: (info) => {
        Components.openEditModal(info.dateStr, () => {
          this.calendar.refetchEvents();
          this.applyDayStyles();
        });
      },
      datesSet: (info) => {
        const d = info.view.currentStart;
        this.currentYear = d.getFullYear();
        this.currentMonth = d.getMonth() + 1;
        setTimeout(() => this.applyDayStyles(), 50);
      },
      events: (info, success) => {
        const events = [];
        const start = new Date(info.start);
        const end = new Date(info.end);
        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
          const key = Utils.toDateKey(d);
          const status = this.getStatusForDate(key);
          if (status) {
            events.push({
              start: key,
              display: 'background',
              classNames: [Utils.calStatusClass(status)],
              extendedProps: { status },
            });
          }
        }
        success(events);
      },
    });

    this.calendar.render();
  },

  applyDayStyles() {
    document.querySelectorAll('.fc-daygrid-day').forEach((cell) => {
      const date = cell.dataset.date;
      if (!date) return;
      const status = this.getStatusForDate(date);
      cell.classList.remove(
        'cal-status-present', 'cal-status-wfh', 'cal-status-absent', 'cal-status-half',
        'cal-status-leave', 'cal-status-weekend', 'cal-status-checkedin'
      );
      if (status) cell.classList.add(Utils.calStatusClass(status));
    });
  },
};

document.addEventListener('DOMContentLoaded', async () => {
  Theme.init();
  Components.mountShell('calendar');
  if (typeof API !== 'undefined' && API.enabled()) await API.init();
  Components.updateSyncBadge();
  CalendarPage.init();
});
