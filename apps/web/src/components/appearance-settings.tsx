import { useI18n } from '../lib/i18n';
import { useState } from 'react';
import { Moon, Sun, Check, Palette, ShieldCheck } from 'lucide-react';
import { useAppearance } from '../lib/appearance';
import { ErrorMessage } from './common';
import { message } from '../lib/api';
export function AppearanceSettings() {
  const names = {
    orange: 'Warm orange',
    lime: 'Electric lime',
    blue: 'Ocean blue',
    violet: 'Soft violet',
  };
  const { t } = useI18n();

  const { appearance, save, busy } = useAppearance();
  const [error, setError] = useState('');
  async function choose(value: typeof appearance) {
    setError('');
    try {
      await save(value);
    } catch (e) {
      setError(message(e));
    }
  }
  return (
    <section className="panel appearance-panel">
      <div className="panel-heading">
        <h2>{t('Appearance & themes')}</h2>
        <Palette size={20} />
      </div>
      <p>{t('Choose your appearance and accent. Saved to your account.')}</p>
      <div role="group" aria-label={t('Appearance')} className="appearance-options">
        {(['dark', 'light'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            aria-pressed={appearance.mode === mode}
            disabled={busy}
            onClick={() => void choose({ ...appearance, mode })}
          >
            {mode === 'dark' ? <Moon size={19} /> : <Sun size={19} />}
            <span>{mode === 'dark' ? t('Dark') : t('Light')}</span>
            {appearance.mode === mode ? <Check size={16} /> : null}
          </button>
        ))}
      </div>
      <div role="group" aria-label={t('Accent color')} className="appearance-options">
        {(['orange', 'lime', 'blue', 'violet'] as const).map((accent) => (
          <button
            key={accent}
            type="button"
            aria-pressed={appearance.accent === accent}
            disabled={busy}
            onClick={() => void choose({ ...appearance, accent })}
          >
            <i className={`accent-swatch swatch-${accent}`} />
            <span>{t(names[accent])}</span>
            {appearance.accent === accent ? <Check size={16} /> : null}
          </button>
        ))}
      </div>

      <div className="st-appearance-preview">
        <span className="st-eyebrow">{t('Live theme preview')}</span>
        <div>
          <ShieldCheck size={23} />
          <strong>{t('Your next small win.')}</strong>
          <p>{t('Your people, your promise')}</p>
          <span className="st-status st-status-safe">
            {t(appearance.mode === 'dark' ? 'Dark' : 'Light')} / {t(names[appearance.accent])}
          </span>
        </div>
      </div>
      {error ? <ErrorMessage message={error} /> : null}
    </section>
  );
}
