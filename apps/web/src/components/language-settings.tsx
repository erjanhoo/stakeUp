import { useState } from 'react';
import { useI18n } from '../lib/i18n';
import { ErrorMessage } from './common';
import { message } from '../lib/api';
export function LanguageSettings() {
  const { language, save, t } = useI18n(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function change(next: 'en' | 'ru') {
    setBusy(true);
    setError('');
    try {
      await save(next);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="language-settings">
      <h3>{t('Language')}</h3>
      <div className="appearance-options" role="group" aria-label={t('Language')}>
        {(['en', 'ru'] as const).map((l) => (
          <button
            key={l}
            type="button"
            lang={l}
            disabled={busy}
            aria-pressed={language === l}
            onClick={() => void change(l)}
          >
            {l === 'en' ? 'English' : 'Русский'}{' '}
            <span aria-hidden="true">{l === language ? '✓' : ''}</span>
          </button>
        ))}
      </div>
      {error ? <ErrorMessage message={error} /> : null}
    </div>
  );
}
