import { useMemo, useState } from 'react';
import { EditAttendanceModal } from '../components/EditAttendanceModal';
import { useApp } from '../context/AppProvider';
import { statusForDate } from '../lib/attendance';
import { calendarCells, formatDate, getMonthName, statusTone, todayKey } from '../lib/utils';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const LEGEND = [
  ['present', 'Present'],
  ['wfh', 'Work from home'],
  ['absent', 'Absent'],
  ['half', 'Half day'],
  ['leave', 'Leave'],
  ['holiday', 'Holiday'],
  ['live', 'Checked in'],
  ['weekend', 'Weekend'],
];

export function CalendarPage() {
  const today = new Date();
  const { attendance } = useApp();
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() + 1 });
  const [editDate, setEditDate] = useState(null);
  const cells = useMemo(
    () => calendarCells(cursor.year, cursor.month),
    [cursor.year, cursor.month]
  );
  const todayDate = todayKey();

  function shiftMonth(delta) {
    const next = new Date(cursor.year, cursor.month - 1 + delta, 1);
    setCursor({ year: next.getFullYear(), month: next.getMonth() + 1 });
  }

  return (
    <section className="page">
      <header className="page-head">
        <h1>Calendar</h1>
        <p className="lede">Select a day to add or correct attendance.</p>
      </header>

      <div className="cal-toolbar">
        <div className="cal-nav">
          <button type="button" className="icon-btn" onClick={() => shiftMonth(-1)} aria-label="Previous month">‹</button>
          <h2>{getMonthName(cursor.month)} {cursor.year}</h2>
          <button type="button" className="icon-btn" onClick={() => shiftMonth(1)} aria-label="Next month">›</button>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setCursor({ year: today.getFullYear(), month: today.getMonth() + 1 })}
        >
          Today
        </button>
      </div>

      <div className="cal-grid" role="grid" aria-label={`${getMonthName(cursor.month)} ${cursor.year}`}>
        {WEEKDAYS.map((day) => (
          <div key={day} className="cal-dow" role="columnheader">{day}</div>
        ))}
        {cells.map((cell, index) => {
          if (!cell) return <div key={`empty-${index}`} className="cal-cell is-empty" />;
          const status = statusForDate(attendance, cell.key);
          return (
            <button
              key={cell.key}
              type="button"
              className={`cal-cell${cell.key === todayDate ? ' is-today' : ''}`}
              data-tone={status ? statusTone(status) : undefined}
              onClick={() => setEditDate(cell.key)}
              aria-label={formatDate(cell.key, { weekday: 'long', day: 'numeric', month: 'long' })}
            >
              <span>{cell.day}</span>
            </button>
          );
        })}
      </div>

      <ul className="legend">
        {LEGEND.map(([tone, label]) => (
          <li key={tone}>
            <i data-tone={tone} />
            {label}
          </li>
        ))}
      </ul>

      {editDate && <EditAttendanceModal dateKey={editDate} onClose={() => setEditDate(null)} />}
    </section>
  );
}
