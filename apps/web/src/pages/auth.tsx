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
    login: 'Good to have you back.',
    register: 'Your day one starts here.',
    forgot: 'Let’s get you back in.',
    reset: 'A fresh start.',
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
    <div className="auth-layout">
      <aside className="auth-story">
        <Brand />
        <div>
          <span className="eyebrow">THE FIRST STEP IS YOURS.</span>
          <h1>
            Good habits.
            <br />
            Great company.
            <br />
            <em>Let’s go.</em>
          </h1>
          <p>You’re one small commitment away from something good.</p>
        </div>
        <span className="auth-footnote">
          <ShieldCheck size={17} /> All stakes are virtual. Your circle stays private.
        </span>
        <span className="auth-star" aria-hidden="true">
          ✳
        </span>
      </aside>
      <main className="auth-main">
        <Link className="back-link" to="/">
          <ArrowLeft size={17} /> Back to StakeUp
        </Link>
        <div className="auth-form-wrap">
          <span className="eyebrow">
            {variant === 'register' ? 'WELCOME TO THE CIRCLE' : 'MAKE ROOM FOR PROGRESS'}
          </span>
          <h2>{titles[variant]}</h2>
          <p>{descriptions[variant]}</p>
          {auth.mode === 'local' ? (
            <div className="local-badge">
              <span className="status-dot" /> Local development · data stays on this computer
            </div>
          ) : null}
          {auth.error ? <ErrorMessage message={auth.error} /> : null}
          <form onSubmit={submit} className="form-stack">
            {variant === 'register' ? (
              <label>
                <span id="username-label">Username</span>
                <Input
                  name="username"
                  aria-labelledby="username-label"
                  aria-describedby="username-hint"
                  autoComplete="username"
                  placeholder="your_next_chapter"
                  required
                  minLength={3}
                  maxLength={24}
                  pattern="[a-zA-Z][a-zA-Z0-9_]*"
                />
                <span id="username-hint" className="field-hint">
                  3–24 letters, numbers or underscores.
                </span>
              </label>
            ) : null}
            {variant !== 'reset' ? (
              <label>
                Email address
                <Input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  maxLength={254}
                />
              </label>
            ) : null}
            {variant !== 'forgot' ? (
              <div className="form-field">
                <span className="label-line">
                  <label htmlFor="password">Password</label>
                  {variant === 'login' ? <Link to="/forgot-password">Forgot password?</Link> : null}
                </span>
                <span className="password-field">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={variant === 'login' ? 'current-password' : 'new-password'}
                    placeholder={variant === 'login' ? 'Your password' : 'At least 8 characters'}
                    required
                    minLength={variant === 'login' ? 1 : 8}
                    maxLength={128}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                {notice}
              </div>
            ) : null}
            {recoveryUrl ? (
              <a className="recovery-link" href={recoveryUrl}>
                Open local recovery mailbox link ↗
              </a>
            ) : null}
            <Button disabled={busy || !!auth.error} type="submit">
              {busy
                ? 'One moment…'
                : {
                    login: 'Let’s get back to it',
                    register: 'Create your account',
                    forgot: 'Send recovery link',
                    reset: 'Update password',
                  }[variant]}
              <ArrowUpRight size={18} />
            </Button>
          </form>
          <p className="auth-switch">
            {variant === 'login' ? (
              <>
                New around here? <Link to="/register">Make a fresh start</Link>
              </>
            ) : variant === 'register' ? (
              <>
                Already part of the circle? <Link to="/login">Log in</Link>
              </>
            ) : (
              <Link to="/login">Back to login</Link>
            )}
          </p>
          <p className="auth-privacy">
            No real-money stakes. No public shaming.
            <br />
            Just you, your people, and a promise to show up.
          </p>
        </div>
      </main>
    </div>
  );
}
