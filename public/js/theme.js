// Переключатель светлой/тёмной темы.
// 1) Ставит атрибут data-theme на <html> как можно раньше (до отрисовки), чтобы не было "вспышки".
// 2) Хранит выбор в localStorage — если пользователь ни разу не переключал, следует системной теме.
// 3) Добавляет на страницу плавающую кнопку-переключатель.
(function () {
  const STORAGE_KEY = 'biolink_theme';
  const root = document.documentElement;

  function systemPrefersLight() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  }

  function getStoredTheme() {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  }

  function setStoredTheme(theme) {
    try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* приватный режим и т.п. — не критично */ }
  }

  function currentTheme() {
    return getStoredTheme() || (systemPrefersLight() ? 'light' : 'dark');
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    const btn = document.getElementById('themeToggleBtn');
    if (btn) btn.textContent = theme === 'light' ? '🌙' : '☀️';
  }

  // Применяем тему немедленно (скрипт подключается в <head> синхронно, до рендера тела).
  applyTheme(currentTheme());

  window.toggleBiolinkTheme = function () {
    const next = currentTheme() === 'light' ? 'dark' : 'light';
    setStoredTheme(next);
    applyTheme(next);
  };

  function mountToggleButton() {
    if (document.getElementById('themeToggleBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'themeToggleBtn';
    btn.type = 'button';
    btn.className = 'theme-toggle';
    btn.setAttribute('aria-label', 'Сменить тему');
    btn.textContent = currentTheme() === 'light' ? '🌙' : '☀️';
    btn.addEventListener('click', window.toggleBiolinkTheme);
    document.body.appendChild(btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountToggleButton);
  } else {
    mountToggleButton();
  }
})();
