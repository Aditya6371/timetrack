const Theme = {
  init() {
    const settings = Storage.getSettings();
    this.apply(settings.theme || 'system');
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      const s = Storage.getSettings();
      if (s.theme === 'system') this.apply('system');
    });
  },

  apply(mode) {
    let resolved = mode;
    if (mode === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', resolved);
  },

  set(mode) {
    const settings = Storage.getSettings();
    settings.theme = mode;
    Storage.saveSettings(settings);
    this.apply(mode);
  },
};
