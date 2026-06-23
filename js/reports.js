const ReportsPage = {
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,

  init() {
    this.populatePickers();
    document.getElementById('month-select').addEventListener('change', () => this.onPickerChange());
    document.getElementById('year-select').addEventListener('change', () => this.onPickerChange());
    document.getElementById('export-btn').addEventListener('click', () => {
      Export.download(this.year, this.month);
    });
    this.render();
  },

  populatePickers() {
    const monthSel = document.getElementById('month-select');
    const yearSel = document.getElementById('year-select');

    for (let m = 1; m <= 12; m++) {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = Utils.getMonthName(m);
      if (m === this.month) opt.selected = true;
      monthSel.appendChild(opt);
    }

    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 2; y <= currentYear + 1; y++) {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      if (y === this.year) opt.selected = true;
      yearSel.appendChild(opt);
    }
  },

  onPickerChange() {
    this.month = parseInt(document.getElementById('month-select').value, 10);
    this.year = parseInt(document.getElementById('year-select').value, 10);
    this.render();
  },

  render() {
    const rows = Attendance.getFullMonthGrid(this.year, this.month);
    const stats = Attendance.getMonthStats(this.year, this.month);

    document.getElementById('summary-row').innerHTML = `
      <span class="chip"><strong>${Math.round(stats.present)}</strong> present</span>
      <span class="chip"><strong>${Utils.formatHours(stats.payableHours)}</strong> payable</span>
      <span class="chip"><strong>${stats.weekends}</strong> weekends</span>
      <span class="chip"><strong>${stats.rate}%</strong> rate</span>
    `;

    const tbody = document.getElementById('report-body');
    tbody.innerHTML = rows
      .map(
        (r) => `
      <tr data-date="${r.date}">
        <td>${r.employeeId || '—'}</td>
        <td>${r.employeeName || '—'}</td>
        <td>${Utils.formatDate(r.date, { day: 'numeric', month: 'short' })}</td>
        <td>${r.checkIn ? Utils.formatTime(r.checkIn) : '—'}</td>
        <td>${r.checkOut ? Utils.formatTime(r.checkOut) : '—'}</td>
        <td>${Utils.formatHours(r.totalHours)}</td>
        <td>${Utils.formatHours(r.payableHours)}</td>
        <td>${Components.badge(r.status)}</td>
        <td>${r.shift || '—'}</td>
      </tr>`
      )
      .join('');

    tbody.querySelectorAll('tr').forEach((row) => {
      row.addEventListener('click', () => {
        Components.openEditModal(row.dataset.date, () => this.render());
      });
    });
  },
};

document.addEventListener('DOMContentLoaded', async () => {
  Theme.init();
  Components.mountShell('reports');
  if (typeof API !== 'undefined' && API.enabled()) await API.init();
  Components.updateSyncBadge();
  ReportsPage.init();
});
