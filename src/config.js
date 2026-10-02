export const CONFIG = {
  // Override in .env.local with VITE_API_URL= if you rotate the Apps Script deployment.
  API_URL: import.meta.env.VITE_API_URL || 'https://script.google.com/macros/s/AKfycbwRfogz9sGH3c3rBL58hOoXzB_fXnVmXk1kX_J1Jie1UJH_7WTcHSUdM--dAjmMQW7ORw/exec',
  APP_NAME: 'TimeTrack',
  VERSION: '2.0.0',
  STORAGE_KEYS: {
    settings: 'timetrack_settings',
    attendance: 'timetrack_attendance',
    shifts: 'timetrack_shifts',
    syncQueue: 'timetrack_sync_queue',
    lastSync: 'timetrack_last_sync',
  },
};
