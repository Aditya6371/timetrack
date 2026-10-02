import { useApp } from '../context/AppProvider';
import { Icon } from './Icons';

export function Toasts() {
  const { toasts, dismissToast } = useApp();
  if (!toasts.length) return null;

  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`toast is-${item.type}`}
          onClick={() => dismissToast(item.id)}
        >
          <Icon name={item.type === 'error' ? 'alert' : 'check'} size={16} />
          <span>{item.message}</span>
        </button>
      ))}
    </div>
  );
}
