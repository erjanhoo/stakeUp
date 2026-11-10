import { useI18n } from '../lib/i18n';
import { ArrowUpRight, Zap, LoaderCircle, CircleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
export function Brand() {
  const { t } = useI18n();

  return (
    <Link className="brand" to="/" aria-label={t('StakeUp home')}>
      <span className="brand-icon">
        <Zap size={23} strokeWidth={2.7} />
      </span>
      Stake<span className="brand-up">Up</span>
    </Link>
  );
}
export function Loading({ full = false }: { full?: boolean }) {
  const { t } = useI18n();

  return (
    <div className={full ? 'loading full' : 'loading'} role="status">
      <LoaderCircle className="spin" size={24} />
      <span>{t('Getting things ready…')}</span>
    </div>
  );
}
export function ErrorMessage({ message }: { message: string }) {
  const { t } = useI18n();

  return (
    <div className="error-message" role="alert">
      <CircleAlert size={18} />
      <span>{t(message)}</span>
    </div>
  );
}
export function PhaseNote({ title, text }: { title: string; text: string }) {
  const { t } = useI18n();

  return (
    <div className="phase-note">
      <span className="eyebrow">{t('UP NEXT · MILESTONE 02')}</span>
      <h3>{t(title)}</h3>
      <p>{t(text)}</p>
      <Button asChild variant="ghost">
        <Link to="/app/roadmap">
          {t('See what’s coming')} <ArrowUpRight size={16} />
        </Link>
      </Button>
    </div>
  );
}
export function Avatar({ name, large = false }: { name: string; large?: boolean }) {
  return (
    <span className={`avatar ${large ? 'avatar-large' : ''}`} aria-hidden="true">
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}
