import { pad } from '../lib/utils';

const HOURS = Array.from({ length: 24 }, (_, hour) => {
  const suffix = hour < 12 ? 'AM' : 'PM';
  const label = hour % 12 || 12;
  return { value: pad(hour), label: `${label} ${suffix}` };
});

const MINUTES = Array.from({ length: 60 }, (_, minute) => pad(minute));

export function TimeSelect({ id, value = '', onChange, allowEmpty = false }) {
  const [hour = '', minute = ''] = String(value || '').split(':');

  function emit(nextHour, nextMinute) {
    if (!nextHour || !nextMinute) onChange('');
    else onChange(`${nextHour}:${nextMinute}`);
  }

  return (
    <div className="time-select">
      <select
        id={`${id}-hour`}
        aria-label="Hour"
        value={hour}
        onChange={(event) => {
          const nextHour = event.target.value;
          if (!nextHour) onChange('');
          else emit(nextHour, minute || '00');
        }}
      >
        {allowEmpty && <option value="">—</option>}
        {HOURS.map((item) => (
          <option key={item.value} value={item.value}>{item.label}</option>
        ))}
      </select>
      <span className="time-sep" aria-hidden="true">:</span>
      <select
        id={`${id}-minute`}
        aria-label="Minute"
        value={minute}
        onChange={(event) => emit(hour, event.target.value)}
      >
        {allowEmpty && <option value="">—</option>}
        {MINUTES.map((item) => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>
    </div>
  );
}
