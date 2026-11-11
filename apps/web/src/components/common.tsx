import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/api';
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
export function Avatar({
  name,
  large = false,
  userId,
  linked = true,
}: {
  name: string;
  large?: boolean;
  userId?: string;
  linked?: boolean;
}) {
  const { profile } = useAuth(),
    { t } = useI18n(),
    [url, setUrl] = useState(''),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    const update = () => setRevision((v) => v + 1);
    window.addEventListener('stakeup:avatar', update);
    return () => window.removeEventListener('stakeup:avatar', update);
  }, []);
  useEffect(() => {
    setUrl('');
    if (!userId || !profile) return;
    const controller = new AbortController();
    let object = '';
    void (async () => {
      const token = supabase ? (await supabase.auth.getSession()).data.session?.access_token : null;
      const r = await fetch(`/api/members/${userId}/avatar`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: controller.signal,
      });
      if (!r.ok) return;
      const blob = await r.blob();
      if (controller.signal.aborted) return;
      object = URL.createObjectURL(blob);
      setUrl(object);
    })().catch(() => {});
    return () => {
      controller.abort();
      if (object) URL.revokeObjectURL(object);
    };
  }, [userId, profile?.id, revision]);
  const face = (
    <span className={`avatar ${large ? 'avatar-large' : ''}`} aria-hidden="true">
      {url ? (
        <img src={url} alt="" />
      ) : (
        name
          .split(/\s+/)
          .slice(0, 2)
          .map((w) => w[0])
          .join('')
          .toUpperCase()
      )}
    </span>
  );
  return userId && linked ? (
    <Link
      className="avatar-profile-link"
      to={`/app/members/${userId}`}
      aria-label={`${t('View profile')}: ${name}`}
    >
      {face}
    </Link>
  ) : (
    face
  );
}
