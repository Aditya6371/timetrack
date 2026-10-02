import { statusTone } from '../lib/utils';

export function StatusBadge({ status, live = false }) {
  if (!status) return null;
  return (
    <span className="badge" data-tone={statusTone(status)}>
      <span className={`badge-dot${live ? ' is-live' : ''}`} />
      {status}
    </span>
  );
}
