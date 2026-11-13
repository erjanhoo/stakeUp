import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronDown, KeyRound } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { api, message } from '../lib/api';
import { invitationToken, PENDING_INVITE } from '../lib/social';
import { ErrorMessage, Loading } from './common';
import { Button } from './ui/button';
import { Input } from './ui/input';

export function JoinForm({ initial = '', onJoin }: { initial?: string; onJoin?: () => void }) {
  const { t } = useI18n(),
    { profile } = useAuth(),
    navigate = useNavigate();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const token = invitationToken(String(new FormData(event.currentTarget).get('invite')));
      if (!profile) {
        sessionStorage.setItem(PENDING_INVITE, token);
        navigate('/login');
        return;
      }
      const result = await api<{ circleId: string }>('/invitations/join', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
      sessionStorage.removeItem(PENDING_INVITE);
      onJoin?.();
      navigate(`/app/circles/${result.circleId}`);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="form-stack" onSubmit={submit}>
      <label>
        {t('Invitation link or code')}
        <Input
          name="invite"
          defaultValue={initial}
          placeholder={t('Paste the link your friend sent')}
          required
          autoComplete="off"
        />
      </label>
      {error && <ErrorMessage message={error} />}
      <Button type="submit" disabled={busy}>
        {t(busy ? 'Joining…' : profile ? 'Join circle' : 'Continue to sign in')}
        <ArrowRight size={17} />
      </Button>
    </form>
  );
}

export function JoinCircleButton({
  label = 'Join circle',
  initialOpen = false,
}: {
  label?: string;
  initialOpen?: boolean;
}) {
  const { t } = useI18n(),
    id = useId(),
    root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(initialOpen);
  useEffect(() => {
    if (!open) return;
    root.current?.querySelector('input')?.focus();
    const outside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        root.current?.querySelector('button')?.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);
  return (
    <div className="join-dropdown" ref={root}>
      <button
        type="button"
        className="st-btn st-btn-secondary"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        <KeyRound size={16} />
        {t(label)}
        <ChevronDown size={15} />
      </button>
      {open && (
        <section id={id} className="join-popover" aria-label={t('Join circle with invitation')}>
          <h3>{t('Your people are waiting.')}</h3>
          <p>{t('Paste your invitation to join their circle.')}</p>
          <JoinForm
            initial={sessionStorage.getItem(PENDING_INVITE) ?? ''}
            onJoin={() => setOpen(false)}
          />
        </section>
      )}
    </div>
  );
}

// Keep shared invitation URLs working, without a separate joining page.
export function InvitationRedirect() {
  const { profile, loading } = useAuth();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const token = new URLSearchParams(location.hash.slice(1)).get('token');
    if (token) sessionStorage.setItem(PENDING_INVITE, token);
    setReady(true);
  }, []);
  if (loading || !ready) return <Loading full />;
  return (
    <Navigate
      replace
      to={
        !profile ? '/login' : !profile.onboardingCompleted ? '/onboarding' : '/app/circles?join=1'
      }
    />
  );
}
