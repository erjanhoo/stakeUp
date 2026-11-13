let ru = navigator.language.startsWith('ru');
try {
  ru = localStorage.getItem('stakeup.language.v1') === 'ru';
  const appearance = JSON.parse(localStorage.getItem('stakeup.appearance.v1') || 'null');
  document.documentElement.dataset.mode = appearance?.mode === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.accent = ['orange', 'lime', 'blue', 'violet'].includes(
    appearance?.accent,
  )
    ? appearance.accent
    : 'orange';
} catch {}
if (ru) {
  document.documentElement.lang = 'ru';
  document.title = 'StakeUp — Нет соединения';
  for (const [id, text] of Object.entries({
    title: 'Вернёмся на связь.',
    description:
      'Подключитесь к интернету, чтобы открыть аккаунт, отправить фото или проверить задания команды.',
    deadline:
      'Фото и голоса не отправляются в фоне без сети. Срок отправки определяется временем получения фото сервером.',
    retry: 'Попробовать снова',
  }))
    document.getElementById(id).textContent = text;
}
document.getElementById('retry').addEventListener('click', () => location.reload());
const update = () => {
  document.getElementById('status').textContent = navigator.onLine
    ? ru
      ? 'Соединение появилось. Попробуйте открыть страницу снова.'
      : 'A connection is available. Try opening the page again.'
    : '';
};
window.addEventListener('online', update);
window.addEventListener('offline', update);
update();
