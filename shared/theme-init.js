(() => {
  const SETTINGS_STORAGE_KEY = "fgh-settings";
  const DEFAULT_THEME = "light";

  const getSavedTheme = () => {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) return DEFAULT_THEME;
      const parsed = JSON.parse(raw);
      return parsed?.theme === "dark" ? "dark" : DEFAULT_THEME;
    } catch (error) {
      return DEFAULT_THEME;
    }
  };

  const applyTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
    if (document.body) {
      document.body.dataset.theme = theme;
    }
  };

  applyTheme(getSavedTheme());
})();
