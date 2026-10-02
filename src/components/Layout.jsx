import { NavLink } from 'react-router-dom';
import { CONFIG } from '../config';
import { useApp } from '../context/AppProvider';
import { Icon } from './Icons';

const NAV = [
  { to: '/', label: 'Home', icon: 'home', end: true },
  { to: '/calendar', label: 'Calendar', icon: 'calendar' },
  { to: '/reports', label: 'Reports', icon: 'chart' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
];

function SyncPill({ sync }) {
  return (
    <div className={`sync-pill is-${sync.mode}`} aria-live="polite">
      <span className="sync-dot" />
      <span>{sync.label}</span>
    </div>
  );
}

export function Layout({ children }) {
  const { sync } = useApp();

  return (
    <div className="app">
      <aside className="sidebar">
        <NavLink to="/" className="brand">
          <span className="brand-mark">
            <Icon name="clock" size={18} />
          </span>
          <span className="brand-copy">
            <strong>{CONFIG.APP_NAME}</strong>
            <small>v{CONFIG.VERSION}</small>
          </span>
        </NavLink>
        <nav className="side-nav" aria-label="Primary">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <SyncPill sync={sync} />
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <NavLink to="/" className="brand brand-compact">
            <span className="brand-mark">
              <Icon name="clock" size={16} />
            </span>
            <span className="brand-copy">
              <strong>{CONFIG.APP_NAME}</strong>
              <small>v{CONFIG.VERSION}</small>
            </span>
          </NavLink>
          <SyncPill sync={sync} />
        </header>
        <div className="content">{children}</div>
      </div>

      <nav className="bottom-nav" aria-label="Primary">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `bottom-link${isActive ? ' active' : ''}`}
          >
            <Icon name={item.icon} size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
