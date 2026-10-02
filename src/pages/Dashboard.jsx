import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EditAttendanceModal } from '../components/EditAttendanceModal';
import { StatusBadge } from '../components/StatusBadge';
import { useApp } from '../context/AppProvider';
import { useNow } from '../hooks/useNow';
import {
  getMonthStats,
  getRecentActivity,
  getWeekStats,
  getWeekStrip,
} from '../lib/attendance';
import {
  firstName,
  formatDate,
  formatDuration,
  formatHours,
  formatTime,
  greeting,
  isWeekend,
  secondsSinceMidnight,
  statusTone,
  todayKey,
} from '../lib/utils';

export function Dashboard() {
  const now = useNow();
  const { settings, attendance, shifts, checkIn, checkOut, toast } = useApp();
  const [editDate, setEditDate] = useState(null);
  const today = todayKey();
  const record = attendance[today];
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const stats = getMonthStats(attendance, year, month, now);
  const week = getWeekStats(attendance, now);
  const weekGoal = settings.weeklyHoursGoal || 40;
  const weekProgress = weekGoal > 0 ? Math.min(100, (week.totalHours / weekGoal) * 100) : 0;
  const strip = getWeekStrip(attendance, now);
  const recent = getRecentActivity(attendance, 5);
  const name = firstName(settings.employeeName);
  const shift = shifts.find((item) => item.id === (record?.shiftId || settings.defaultShiftId)) || shifts[0];

  let status = '';
  if (isWeekend(today) && !record?.checkIn) status = 'Weekend';
  else if (record?.checkIn && !record?.checkOut) status = 'Checked In';
  else if (record?.checkOut) status = record.status || 'Present';
  else if (record?.status) status = record.status;

  const isHoliday = record?.status === 'Holiday' && !record?.checkIn;
  const canCheckIn = !isWeekend(today) && !isHoliday && !record?.checkIn;
  const canCheckOut = Boolean(record?.checkIn && !record?.checkOut);
  const actionLabel = canCheckOut ? 'Check out' : canCheckIn ? 'Check in' : isHoliday ? 'Holiday' : isWeekend(today) ? 'Weekend' : 'Completed';
  const actionDisabled = !canCheckIn && !canCheckOut;

  let workedSeconds = 0;
  if (record?.checkIn && !record?.checkOut) workedSeconds = (now - new Date(record.checkIn)) / 1000;
  else if (record?.checkIn && record?.checkOut) {
    workedSeconds = (new Date(record.checkOut) - new Date(record.checkIn)) / 1000;
  }

  function handleAction() {
    try {
      if (canCheckIn) {
        checkIn(today);
        toast('Checked in', 'success');
      } else if (canCheckOut) {
        checkOut(today);
        toast('Checked out', 'success');
      }
    } catch (error) {
      toast(error.message, 'error');
    }
  }

  return (
    <section className="page">
      <header className="page-head page-head-row">
        <div>
          <h1>{greeting(now)}{name ? `, ${name}` : ''}</h1>
          <p className="lede">{formatDate(now, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <time className="wall-clock" dateTime={now.toISOString()}>{formatDuration(secondsSinceMidnight(now))}</time>
      </header>

      <div className="home-layout">
        <article className="today-card">
          <div className="today-main">
            <div>
              <div className="today-kicker">
                <span>Hours worked</span>
                {status && <StatusBadge status={status} live={status === 'Checked In'} />}
              </div>
              <p className={`timer${canCheckOut ? ' is-live' : ''}`}>{formatDuration(workedSeconds)}</p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAction}
              disabled={actionDisabled}
            >
              {actionLabel}
            </button>
          </div>
          <div className="time-grid">
            <button type="button" className="time-block" onClick={() => setEditDate(today)}>
              <span>Check in</span>
              <strong>{record?.checkIn ? formatTime(record.checkIn) : '—'}</strong>
            </button>
            <button type="button" className="time-block" onClick={() => setEditDate(today)}>
              <span>Check out</span>
              <strong>{record?.checkOut ? formatTime(record.checkOut) : '—'}</strong>
            </button>
          </div>
          <div className="today-foot">
            <p>{shift?.label || 'No shift selected'}</p>
            <button type="button" className="text-btn" onClick={() => setEditDate(today)}>Edit times</button>
          </div>
        </article>

        <div className="home-side">
          <article className="goal-card">
            <div className="goal-top">
              <div>
                <h2>This week</h2>
                <p>Monday–Sunday · goal {formatHours(weekGoal)}</p>
              </div>
              <strong>{formatHours(week.totalHours)}</strong>
            </div>
            <div
              className="progress"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(weekProgress)}
              aria-valuetext={`${formatHours(week.totalHours)} of ${formatHours(weekGoal)}`}
            >
              <span style={{ width: `${weekProgress}%` }} />
            </div>
          </article>
          <div className="stats">
            <Stat label="Present" value={String(Math.round(stats.present))} />
            <Stat label="Hours" value={formatHours(stats.totalHours)} />
            <Stat label="Absent" value={String(stats.absent + stats.leave)} />
            <Stat label="Rate" value={`${stats.rate}%`} />
          </div>
        </div>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>Last 7 days</h2>
          <Link to="/calendar">Open calendar</Link>
        </div>
        <div className="week-strip">
          {strip.map((day) => (
            <button
              key={day.key}
              type="button"
              className={`week-day${day.isToday ? ' is-today' : ''}`}
              onClick={() => setEditDate(day.key)}
            >
              <span>{day.label}</span>
              <i data-tone={statusTone(day.status)} />
              <strong>{day.day}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Recent activity</h2>
        </div>
        {recent.length === 0 ? (
          <div className="empty">
            <p>No attendance yet.</p>
            {!settings.employeeName && <Link className="btn btn-ghost" to="/settings">Add your name</Link>}
          </div>
        ) : (
          <ul className="activity">
            {recent.map((item) => {
              const times = item.checkIn && item.checkOut
                ? `${formatTime(item.checkIn)} – ${formatTime(item.checkOut)}`
                : item.checkIn
                  ? `In at ${formatTime(item.checkIn)}`
                  : item.status;
              return (
                <li key={item.date}>
                  <button type="button" className="activity-row" onClick={() => setEditDate(item.date)}>
                    <span className="activity-mark" data-tone={statusTone(item.status)} />
                    <span className="activity-copy">
                      <strong>{formatDate(item.date, { weekday: 'short', day: 'numeric', month: 'short' })}</strong>
                      <small>
                        {times}
                        {item.totalHours ? ` · ${formatHours(item.totalHours)}` : ''}
                      </small>
                    </span>
                    <StatusBadge status={item.status} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {editDate && <EditAttendanceModal dateKey={editDate} onClose={() => setEditDate(null)} />}
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <article className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
