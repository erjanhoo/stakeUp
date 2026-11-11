import { Download, ArrowUpRight, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePwa } from '../lib/pwa';
import { useI18n } from '../lib/i18n';
export function InstallCard() {
  const { installed } = usePwa(),
    { t } = useI18n();
  return (
    <section className="st-module install-card">
      <Download size={24} />
      <h2>{t(installed ? 'StakeUp app mode' : 'Take StakeUp with you')}</h2>
      <p>
        {t(
          installed
            ? 'You are using the installed app experience.'
            : 'Add StakeUp to your phone or Windows apps. Open your circles with one tap.',
        )}
      </p>
      <Link className="st-text-link" to="/install">
        {t(installed ? 'Installation & app info' : 'Install StakeUp')}
        <ArrowUpRight size={16} />
      </Link>
    </section>
  );
}
export function NetworkNotice() {
  const { online } = usePwa(),
    { t } = useI18n();
  return online ? null : (
    <div className="pwa-offline-notice" role="status">
      <WifiOff size={20} />
      <span>
        {t(
          'You are offline. Photos and votes need a connection and are not queued. Submission deadlines still apply.',
        )}
      </span>
    </div>
  );
}
