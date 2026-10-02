import { useState } from 'react';
import { EditAttendanceModal } from '../components/EditAttendanceModal';
import { Icon } from '../components/Icons';
import { StatusBadge } from '../components/StatusBadge';
import { useApp } from '../context/AppProvider';
import { getFullMonthGrid, getMonthStats } from '../lib/attendance';
import { downloadTimesheet } from '../lib/export';
import { formatDate, formatHours, formatTime, getMonthName } from '../lib/utils';

export function ReportsPage() {
  const now = new Date();
  const { attendance, toast } = useApp();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [editDate, setEditDate] = useState(null);
  const [exporting, setExporting] = useState(false);

  const rows = getFullMonthGrid(attendance, year, month);
  const stats = getMonthStats(attendance, year, month);
  const years = [];
  for (let value = now.getFullYear() - 2; value <= now.getFullYear() + 1; value += 1) years.push(value);

  async function exportSheet() {
    setExporting(true);
    try {
      await downloadTimesheet(attendance, year, month);
      toast('Timesheet downloaded', 'success');
    } catch (error) {
      console.error(error);
      toast('Could not build the Excel file', 'error');
    } finally {
      setExporting(false);
    }
  }

  return (
    <section className="page">
      <header className="page-head">
        <h1>Reports</h1>
        <p className="lede">Review the month, then download the Excel file.</p>
      </header>

      <div className="filter-row">
        <label>
          <span className="sr-only">Month</span>
          <select value={month} onChange={(event) => setMonth(Number(event.target.value))}>
            {Array.from({ length: 12 }, (_, index) => (
              <option key={index + 1} value={index + 1}>{getMonthName(index + 1)}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Year</span>
          <select value={year} onChange={(event) => setYear(Number(event.target.value))}>
            {years.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
        <button type="button" className="btn btn-primary" onClick={exportSheet} disabled={exporting}>
          <Icon name="download" size={18} />
          {exporting ? 'Preparing…' : 'Download Excel'}
        </button>
      </div>

      <div className="chips">
        <span><strong>{Math.round(stats.present)}</strong> present</span>
        <span><strong>{formatHours(stats.payableHours)}</strong> payable</span>
        <span><strong>{stats.weekends}</strong> weekends</span>
        <span><strong>{stats.rate}%</strong> rate</span>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Date</th>
              <th>In</th>
              <th>Out</th>
              <th>Hours</th>
              <th>Payable</th>
              <th>Status</th>
              <th>Shift</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.date} onClick={() => setEditDate(row.date)}>
                <td>{row.employeeId || '—'}</td>
                <td>{row.employeeName || '—'}</td>
                <td>{formatDate(row.date, { day: 'numeric', month: 'short' })}</td>
                <td>{row.checkIn ? formatTime(row.checkIn) : '—'}</td>
                <td>{row.checkOut ? formatTime(row.checkOut) : '—'}</td>
                <td>{formatHours(row.totalHours)}</td>
                <td>{formatHours(row.payableHours)}</td>
                <td><StatusBadge status={row.status} /></td>
                <td>{row.shift || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editDate && <EditAttendanceModal dateKey={editDate} onClose={() => setEditDate(null)} />}
    </section>
  );
}
