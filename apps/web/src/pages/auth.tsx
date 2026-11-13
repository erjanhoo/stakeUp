import { useI18n } from '../lib/i18n';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Eye, EyeOff, ArrowLeft, ShieldCheck } from 'lucide-react';
import {
  loginSchema,
  registerSchema,
  resetRequestSchema,
  passwordSchema,
} from '@stakeup/contracts';
import { Brand, ErrorMessage, Loading } from '../components/common';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { api, message, supabase } from '../lib/api';
import { useAuth } from '../lib/auth';
import { afterSignIn } from '../lib/social';

export function AuthPage({ variant }: { variant: 'login' | 'register' | 'forgot' | 'reset' }) {
  const { t } = useI18n();

  const auth = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryUrl, setRecoveryUrl] = useState<string | null>(null);
  if (auth.loading) return <Loading full />;
  if (auth.profile && (variant === 'login' || variant === 'register'))
    return (
      <Navigate to={auth.profile.onboardingCompleted ? afterSignIn() : '/onboarding'} replace />
    );
  const titles = {
    login: 'Welcome back',
    register: 'Create your private account.',
    forgot: 'Reset your password',
    reset: 'Create new password',
  };
  const descriptions = {
    login: 'Your goals. Your people. Your next small win.',
    register: 'A little commitment can change a lot. Make yours.',
    forgot: 'Enter your email to receive a password recovery link.',
    reset: 'Choose a strong, unique password for your account.',
  };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (variant === 'forgot') {
        const input = resetRequestSchema.parse(values);
        if (auth.mode === 'supabase') {
          const result = await supabase!.auth.resetPasswordForEmail(input.email, {
            redirectTo: `${location.origin}/reset-password`,
          });
          if (result.error) throw result.error;
        } else {
          const result = await api<{ recoveryUrl: string | null }>('/auth/recovery', {
            method: 'POST',
            body: JSON.stringify(input),
          });
          setRecoveryUrl(result.recoveryUrl);
        }
        setNotice('If an account exists for this email, a recovery link has been created.');
        return;
      }
      if (variant === 'reset') {
        const password = passwordSchema.parse(values.password);
        if (auth.mode === 'supabase') {
          const { data } = await supabase!.auth.getSession();
          if (!data.session) throw new Error('Open the recovery link from your email first.');
          const result = await supabase!.auth.updateUser({ password });
          if (result.error) throw result.error;
          await supabase!.auth.signOut();
          await auth.refresh();
        } else {
          const token = new URLSearchParams(location.hash.slice(1)).get('token');
          if (!token) throw new Error('Open a valid recovery link first.');
          await api('/auth/reset', { method: 'POST', body: JSON.stringify({ password, token }) });
          await auth.refresh();
        }
        history.replaceState(null, '', '/reset-password');
        setNotice('Password updated. You can now sign in.');
        return;
      }
      const input =
        variant === 'register' ? registerSchema.parse(values) : loginSchema.parse(values);
      if (auth.mode === 'supabase') {
        if (variant === 'register') {
          const result = await supabase!.auth.signUp({
            email: input.email,
            password: input.password,
            options: {
              data: { username: 'username' in input ? input.username : '' },
              emailRedirectTo: `${location.origin}/onboarding`,
            },
          });
          if (result.error) throw result.error;
          if (!result.data.session) {
            setNotice('Check your email to confirm your account, then sign in.');
            return;
          }
        } else {
          const result = await supabase!.auth.signInWithPassword(input);
          if (result.error) throw result.error;
        }
      } else await api(`/auth/${variant}`, { method: 'POST', body: JSON.stringify(input) });
      const current = await auth.refresh();
      navigate(current?.onboardingCompleted ? afterSignIn() : '/onboarding');
    } catch (error) {
      if (error && typeof error === 'object' && 'issues' in error)
        setError((error.issues as { message: string }[])[0].message);
      else setError(message(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={`auth-layout st-auth-layout st-auth-${variant}`}>
      <header className="st-auth-header">
        <Brand />
        <nav>
          <Link to="/join">{t('Join circle')}</Link>
          <Link to="/login">{t('Log in')}</Link>
          <Link className="st-btn st-btn-small" to="/register">
            {t('Create account')}
          </Link>
        </nav>
      </header>
      <aside className="auth-story">
        <div className="st-auth-intro">
          <span className="eyebrow">{t('PRIVATE ACCOUNTABILITY')}</span>
          <h1>{t('Your people. Your progress.')}</h1>
          <p>{t('Make a commitment, show up, and grow with friends who get it.')}</p>
        </div>
        <section className="st-auth-context">
          <div className="st-module-heading">
            <ShieldCheck size={24} />
            <h3>{t('Your daily rhythm')}</h3>
          </div>
          <div className="st-auth-rhythm">
            {[
              ['01', 'Accept the same rules', 'Choose the days, upload window and daily stake.'],
              ['02', 'Show the effort', 'One private photo. Your own context.'],
              ['03', 'Review fairly', 'Independent peers make the decision.'],
            ].map(([n, title, detail]) => (
              <article key={n}>
                <span>{n}</span>
                <div>
                  <strong>{t(title)}</strong>
                  <p>{t(detail)}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="st-auth-context">
          <div className="st-module-heading">
            <ShieldCheck size={24} />
            <h3>{t('Private by default.')}</h3>
          </div>
          <p>
            {t(
              'Your details aren’t public. Your circles share your display name, username and challenge participation with members. Your email stays private.',
            )}
          </p>
          <div className="st-auth-points">
            <span>
              <ShieldCheck size={16} />
              {t('Your people. Your promise.')}
            </span>
            <span>
              <ArrowUpRight size={16} />
              {t('One shared version of the rules.')}
            </span>
          </div>
          <img
            className="st-auth-editorial"
            src="/images/stitch-athletes.jpg"
            alt=""
            width={800}
            height={260}
          />
        </section>
      </aside>
      <main className="auth-main">
        <Link className="back-link" to="/">
          <ArrowLeft size={17} /> {t('Back to StakeUp')}{' '}
        </Link>
        <div className="auth-form-wrap">
          <span className="eyebrow">
            {t(variant === 'register' ? 'WELCOME TO THE CIRCLE' : 'MAKE ROOM FOR PROGRESS')}
          </span>
          <h2>{t(titles[variant])}</h2>
          <p>{t(descriptions[variant])}</p>
          {auth.mode === 'local' ? (
            <div className="local-badge">
              <span className="status-dot" />{' '}
              {t('Local development · data stays on this computer')}{' '}
            </div>
          ) : null}
          {auth.error ? <ErrorMessage message={auth.error} /> : null}
          <form onSubmit={submit} className="form-stack">
            {variant === 'register' ? (
              <label>
                <span id="username-label">{t('Username')}</span>
                <Input
                  name="username"
                  aria-labelledby="username-label"
                  aria-describedby="username-hint"
                  autoComplete="username"
                  placeholder={t('your_next_chapter')}
                  required
                  minLength={3}
                  maxLength={24}
                  pattern="[a-zA-Z][a-zA-Z0-9_]*"
                />
                <span id="username-hint" className="field-hint">
                  {t('3–24 letters, numbers or underscores.')}{' '}
                </span>
              </label>
            ) : null}
            {variant !== 'reset' ? (
              <label>
                {t('Email address')}{' '}
                <Input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder={t('you@example.com')}
                  required
                  maxLength={254}
                />
              </label>
            ) : null}
            {variant !== 'forgot' ? (
              <div className="form-field">
                <span className="label-line">
                  <label htmlFor="password">{t('Password')}</label>
                  {variant === 'login' ? (
                    <Link to="/forgot-password">{t('Forgot password?')}</Link>
                  ) : null}
                </span>
                <span className="password-field">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={variant === 'login' ? 'current-password' : 'new-password'}
                    placeholder={
                      variant === 'login' ? t('Your password') : t('At least 8 characters')
                    }
                    required
                    minLength={variant === 'login' ? 1 : 8}
                    maxLength={128}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    aria-label={showPassword ? t('Hide password') : t('Show password')}
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
              </div>
            ) : null}
            {error ? <ErrorMessage message={error} /> : null}
            {notice ? (
              <div className="success-message" role="status">
                {t(notice)}
              </div>
            ) : null}
            {recoveryUrl ? (
              <a className="recovery-link" href={recoveryUrl}>
                {t('Open local recovery mailbox link ↗')}{' '}
              </a>
            ) : null}
            <Button disabled={busy || !!auth.error} type="submit">
              {busy
                ? t('One moment…')
                : t(
                    {
                      login: 'Let’s get back to it',
                      register: 'Create your account',
                      forgot: 'Send recovery link',
                      reset: 'Update password',
                    }[variant],
                  )}
              <ArrowUpRight size={18} />
            </Button>
          </form>
          <p className="auth-switch">
            {variant === 'login' ? (
              <>
                {t('New around here?')} <Link to="/register">{t('Make a fresh start')}</Link>
              </>
            ) : variant === 'register' ? (
              <>
                {t('Already part of the circle?')} <Link to="/login">{t('Log in')}</Link>
              </>
            ) : (
              <Link to="/login">{t('Back to login')}</Link>
            )}
          </p>
          <p className="auth-privacy">
            {t('Small commitments. Shared progress.')} <br />
            {t('Just you, your people, and a promise to show up.')}{' '}
          </p>
        </div>
      </main>
    </div>
  );
}
