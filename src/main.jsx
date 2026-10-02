import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { getSettings } from './lib/storage';
import { applyTheme } from './lib/theme';
import './index.css';

applyTheme(getSettings().theme || 'system');

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then((registrations) => registrations.forEach((registration) => registration.unregister()))
    .catch(() => {});
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
