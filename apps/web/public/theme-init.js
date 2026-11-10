try {
  document.documentElement.lang =
    localStorage.getItem('stakeup.language.v1') === 'ru' ? 'ru' : 'en';
  const preference = JSON.parse(localStorage.getItem('stakeup.appearance.v1') || 'null');
  document.documentElement.dataset.mode = preference?.mode === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.accent = preference?.accent === 'lime' ? 'lime' : 'orange';
} catch {
  document.documentElement.dataset.mode = 'dark';
  document.documentElement.dataset.accent = 'orange';
}
