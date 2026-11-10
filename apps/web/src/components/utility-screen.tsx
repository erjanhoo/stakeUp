import { Link } from 'react-router-dom';
import { Compass, WifiOff, ArrowRight, ShieldCheck } from 'lucide-react';
import { Brand } from './common';
import { useI18n } from '../lib/i18n';
export function UtilityScreen({
  kind = '404',
  retry,
}: {
  kind?: '404' | 'connection' | 'error';
  retry?: () => void;
}) {
  const { t } = useI18n();
  const offline = kind === 'connection',
    missing = kind === '404';
  const title = missing
    ? 'This page hasn’t found its circle.'
    : offline
      ? 'We couldn’t connect.'
      : 'Let’s take a quick breather.';
  return (
    <div className="st-utility-screen">
      <header>
        <Brand />
        <span className="st-eyebrow">{t('PRIVATE ACCOUNTABILITY')}</span>
      </header>
      <main>
        <section className="st-utility-card">
          <div className="st-utility-status">
            <span>{missing ? '404' : t('CONNECTION INTERRUPTED')}</span>
            <span className="st-live-dot" />
          </div>
          <div className="st-utility-icon">
            {offline ? <WifiOff size={46} /> : <Compass size={46} />}
          </div>
          <h1>{t(title)}</h1>
          <p>
            {t(
              missing
                ? 'The link may be incorrect or the page may have moved. You can return to your workspace.'
                : 'We couldn’t load this page. Reload to try again.',
            )}
          </p>
          <div className="st-utility-recovery">
            <ShieldCheck size={22} />
            <div>
              <strong>{t('Your Circle stays private.')}</strong>
              <span>{t('Only authorized members can access Circle data.')}</span>
            </div>
          </div>
          <div className="st-utility-actions">
            {retry ? (
              <button className="st-btn" onClick={retry}>
                {t('Try again')}
                <ArrowRight size={17} />
              </button>
            ) : (
              <Link className="st-btn" to="/app">
                {t('Back to overview')}
                <ArrowRight size={17} />
              </Link>
            )}
            <Link className="st-btn st-btn-secondary" to="/app/circles">
              {t('Your circles')}
            </Link>
          </div>
        </section>
      </main>
      <footer>{t('All stakes are virtual. Always.')}</footer>
    </div>
  );
}
