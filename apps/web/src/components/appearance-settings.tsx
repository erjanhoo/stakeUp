import { useState } from 'react';
import { Moon, Sun, Check, Palette } from 'lucide-react';
import { useAppearance } from '../lib/appearance';
import { ErrorMessage } from './common';
import { message } from '../lib/api';
export function AppearanceSettings() {
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
        <h2>Your kind of energy</h2>
        <Palette size={20} />
      </div>
      <p>Choose your appearance and accent. Saved to your account.</p>
      <div role="group" aria-label="Appearance" className="appearance-options">
        {(['dark', 'light'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            aria-pressed={appearance.mode === mode}
            disabled={busy}
            onClick={() => void choose({ ...appearance, mode })}
          >
            {mode === 'dark' ? <Moon size={19} /> : <Sun size={19} />}
            <span>{mode === 'dark' ? 'Dark' : 'Light'}</span>
            {appearance.mode === mode ? <Check size={16} /> : null}
          </button>
        ))}
      </div>
      <div role="group" aria-label="Accent color" className="appearance-options">
        {(['orange', 'lime'] as const).map((accent) => (
          <button
            key={accent}
            type="button"
            aria-pressed={appearance.accent === accent}
            disabled={busy}
            onClick={() => void choose({ ...appearance, accent })}
          >
            <i className={`accent-swatch swatch-${accent}`} />
            <span>{accent === 'orange' ? 'Warm orange' : 'Electric lime'}</span>
            {appearance.accent === accent ? <Check size={16} /> : null}
          </button>
        ))}
      </div>
      {error ? <ErrorMessage message={error} /> : null}
    </section>
  );
}
