import { useEffect, useState } from 'react';
import { Icon } from '../components/Icons';
import { Modal } from '../components/Modal';
import { TimeSelect } from '../components/TimeSelect';
import { CONFIG } from '../config';
import { useApp } from '../context/AppProvider';
import { initials } from '../lib/utils';

const RULES = [
  ['fixed', 'Fixed'],
  ['actual', 'Actual'],
  ['manual', 'Manual'],
];

const THEMES = [
  ['light', 'Light'],
  ['dark', 'Dark'],
  ['system', 'System'],
];

export function SettingsPage() {
  const {
    settings,
    shifts,
    updateSettings,
    setDefaultShift,
    deleteShift,
    saveShift,
    apiEnabled,
  } = useApp();
  const [name, setName] = useState(settings.employeeName || '');
  const [employeeId, setEmployeeId] = useState(settings.employeeId || '');
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    setName(settings.employeeName || '');
    setEmployeeId(settings.employeeId || '');
  }, [settings.employeeName, settings.employeeId]);

  useEffect(() => {
    const savedName = settings.employeeName || '';
    const savedId = settings.employeeId || '';
    if (name === savedName && employeeId === savedId) return undefined;
    const timer = window.setTimeout(() => {
      updateSettings({
        employeeName: name.trim(),
        employeeId: employeeId.trim(),
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [employeeId, name, settings.employeeId, settings.employeeName, updateSettings]);

  function step(key, delta, min, max) {
    const current = Number(settings[key] ?? 0);
    const next = Math.min(max, Math.max(min, Math.round((current + delta) * 100) / 100));
    updateSettings({ [key]: next });
  }

  function saveDraft() {
    const label = draft.name.trim() || 'General';
    saveShift({
      id: draft.id,
      name: label,
      start: draft.start || '09:00',
      end: draft.end || '18:00',
    });
    setDraft(null);
  }

  return (
    <section className="page">
      <header className="page-head">
        <h1>Settings</h1>
        <p className="lede">Profile, payable hours, shifts, and appearance.</p>
      </header>

      <article className="card">
        <h2>Profile</h2>
        <div className="avatar" aria-hidden="true">{initials(name)}</div>
        <label className="field">
          <span>Employee name</span>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" autoComplete="name" />
        </label>
        <label className="field">
          <span>Employee ID</span>
          <input value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} placeholder="Optional" />
          <small>Printed on the Excel timesheet when it is filled in.</small>
        </label>
      </article>

      <article className="card">
        <h2>Weekly goal</h2>
        <div className="field">
          <span>Target hours per week</span>
          <Stepper
            value={settings.weeklyHoursGoal ?? 40}
            onDecrease={() => step('weeklyHoursGoal', -1, 1, 168)}
            onIncrease={() => step('weeklyHoursGoal', 1, 1, 168)}
            label="weekly hour goal"
          />
          <small>Shown on the home page against Monday–Sunday hours.</small>
        </div>
      </article>

      <article className="card">
        <h2>Payroll</h2>
        <div className="field">
          <span>Default payable hours</span>
          <Stepper
            value={settings.defaultPayableHours}
            onDecrease={() => step('defaultPayableHours', -0.5, 1, 24)}
            onIncrease={() => step('defaultPayableHours', 0.5, 1, 24)}
            label="payable hours"
          />
        </div>
        <div className="field">
          <span>Payable hours rule</span>
          <div className="segmented" role="radiogroup" aria-label="Payable hours rule">
            {RULES.map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={settings.payableHoursRule === value}
                className={settings.payableHoursRule === value ? 'active' : ''}
                onClick={() => updateSettings(
                  { payableHoursRule: value },
                  { announce: 'Payable hours rule updated' }
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <small>Fixed uses the default on present days. Actual caps hours at that default. Manual asks on each edit.</small>
        </div>
      </article>

      <article className="card">
        <div className="panel-head">
          <h2>Shifts</h2>
          <button
            type="button"
            className="text-btn"
            onClick={() => setDraft({ id: null, name: '', start: '09:00', end: '18:00' })}
          >
            Add shift
          </button>
        </div>
        <ul className="shifts">
          {shifts.map((shift) => (
            <li key={shift.id} className={shift.isDefault ? 'is-default' : ''}>
              <div>
                <strong>{shift.label}</strong>
                <small>{shift.start} – {shift.end}</small>
              </div>
              <div className="shift-actions">
                {shift.isDefault ? (
                  <span className="default-mark" title="Default shift"><Icon name="star" size={16} /></span>
                ) : (
                  <button type="button" className="icon-btn" aria-label="Set as default" onClick={() => setDefaultShift(shift.id)}>
                    <Icon name="star" size={16} />
                  </button>
                )}
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Edit shift"
                  onClick={() => setDraft({
                    id: shift.id,
                    name: shift.label.split(' (')[0],
                    start: shift.start,
                    end: shift.end,
                  })}
                >
                  <Icon name="edit" size={16} />
                </button>
                {shifts.length > 1 && (
                  <button type="button" className="icon-btn" aria-label="Delete shift" onClick={() => deleteShift(shift.id)}>
                    <Icon name="trash" size={16} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </article>

      <article className="card">
        <h2>Appearance</h2>
        <div className="segmented" role="radiogroup" aria-label="Theme">
          {THEMES.map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={settings.theme === value}
              className={settings.theme === value ? 'active' : ''}
              onClick={() => updateSettings({ theme: value })}
            >
              {label}
            </button>
          ))}
        </div>
      </article>

      <article className="card about">
        <h2>About</h2>
        <p>Version {CONFIG.VERSION}</p>
        <p>Data source: {apiEnabled ? 'Google Sheets' : 'This browser'}</p>
      </article>

      {draft && (
        <Modal
          title={draft.id ? 'Edit shift' : 'Add shift'}
          onClose={() => setDraft(null)}
          onSave={saveDraft}
        >
          <label className="field">
            <span>Shift name</span>
            <input
              value={draft.name}
              placeholder="General"
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Start</span>
            <TimeSelect id="shift-start" value={draft.start} onChange={(start) => setDraft({ ...draft, start })} />
          </label>
          <label className="field">
            <span>End</span>
            <TimeSelect id="shift-end" value={draft.end} onChange={(end) => setDraft({ ...draft, end })} />
          </label>
        </Modal>
      )}
    </section>
  );
}

function Stepper({ value, onDecrease, onIncrease, label }) {
  return (
    <div className="stepper">
      <button type="button" onClick={onDecrease} aria-label={`Decrease ${label}`}>−</button>
      <strong>{value}</strong>
      <button type="button" onClick={onIncrease} aria-label={`Increase ${label}`}>+</button>
    </div>
  );
}
