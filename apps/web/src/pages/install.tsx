import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Check, Smartphone, Monitor, ArrowLeft, ShieldCheck } from 'lucide-react';
import { usePwa } from '../lib/pwa';
import { useI18n } from '../lib/i18n';
import { Brand, ErrorMessage } from '../components/common';
import { Button } from '../components/ui/button';
import { NetworkNotice } from '../components/install-card';
function initialPlatform() {
  if (
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
  )
    return 'ios';
  return /Android/.test(navigator.userAgent) ? 'android' : 'windows';
}
export function InstallPage() {
  const { t } = useI18n(),
    { installed, canInstall, install, workerError } = usePwa(),
    [platform, setPlatform] = useState(initialPlatform),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  const guides: Record<string, string[]> = {
    ios: [
      'Open stakeup-olive.vercel.app in Safari. If you opened a link inside another app, open it in Safari first.',
      'Tap Share, then Add to Home Screen. The Share menu may be inside the browser menu.',
      'If offered, keep Open as Web App enabled, then tap Add. Launch StakeUp from its new icon.',
    ],
    android: [
      'Open StakeUp in Chrome. Use the Install StakeUp button here when it is available.',
      'Otherwise open the browser menu and choose Install app or Add to Home screen, then confirm.',
      'Launch StakeUp from its app icon. Sign in if this installed app asks you to.',
    ],
    windows: [
      'Open StakeUp in Microsoft Edge or Google Chrome.',
      'Use Install StakeUp here when available, or the install icon in the address bar. Edge also offers Apps → Install this site as an app.',
      'Confirm installation. StakeUp opens in its own window and can be found in your Windows apps.',
    ],
  };
  return (
    <div className="install-page">
      <header>
        <Brand />
        <Link className="st-text-link" to="/app">
          <ArrowLeft size={16} />
          {t('Open your space')}
        </Link>
      </header>
      <main>
        <NetworkNotice />
        <section className="install-hero">
          <img src="/icons/icon-192.png" width="96" height="96" alt="StakeUp" />
          <span className="st-eyebrow">{t('YOUR CIRCLES. ONE TAP AWAY.')}</span>
          <h1>{t(installed ? 'StakeUp is in app mode.' : 'A place on your home screen.')}</h1>
          <p>{t('The same private circles, reviews and progress, in a window of their own.')}</p>
          {installed ? (
            <p className="success-message">
              <Check size={20} />
              {t('You are using the installed app experience.')}
            </p>
          ) : canInstall ? (
            <Button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError('');
                setNotice('');
                try {
                  const result = await install();
                  setNotice(
                    result === 'accepted'
                      ? 'Installation accepted. Your device will finish adding StakeUp.'
                      : 'Installation dismissed. You can try again from your browser menu.',
                  );
                } catch {
                  setError('Unable to open the install prompt. Follow the browser steps below.');
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Download size={18} />
              {t(busy ? 'Opening installer…' : 'Install StakeUp')}
            </Button>
          ) : (
            <p className="install-hint">
              {t(
                'Choose your device below for installation steps. Your browser decides when an install prompt is available.',
              )}
            </p>
          )}
          {notice ? <p role="status">{t(notice)}</p> : null}
          {error ? <ErrorMessage message={error} /> : null}
        </section>
        <section className="st-module install-guide">
          <h2>{t('Install on your device')}</h2>
          <div className="install-device-tabs" role="group" aria-label={t('Choose your device')}>
            {[
              ['ios', 'iPhone / iPad'],
              ['android', 'Android'],
              ['windows', 'Windows'],
            ].map(([id, label]) => (
              <button
                type="button"
                key={id}
                aria-pressed={platform === id}
                onClick={() => setPlatform(id)}
              >
                {id === 'windows' ? <Monitor size={19} /> : <Smartphone size={19} />}
                {label}
              </button>
            ))}
          </div>
          <ol>
            {guides[platform].map((step) => (
              <li key={step}>{t(step)}</li>
            ))}
          </ol>
          <p className="st-muted">
            {t(
              'Already installed? Open StakeUp from its app icon. Installation menus vary by browser and device.',
            )}
          </p>
        </section>
        <section className="install-notes">
          <ShieldCheck size={25} />
          <div>
            <h2>{t('Your account stays yours.')}</h2>
            <p>
              {t(
                'Installation does not create another account. Use your existing login; some devices ask you to sign in again.',
              )}
            </p>
            <p>
              {t(
                'An internet connection is required for account data, photos and reviews. Private photos and votes are not saved for offline use.',
              )}
            </p>
            <p>
              {t(
                'The website and installed app use the same releases. Reopen or refresh to load the latest version.',
              )}
            </p>
            {workerError ? (
              <ErrorMessage message="Offline setup is unavailable in this browser. StakeUp can still be used online." />
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
