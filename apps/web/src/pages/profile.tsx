import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Check, Globe2, ShieldCheck, UserRound } from 'lucide-react';
import { profileSchema } from '@stakeup/contracts';
import { useAuth } from '../lib/auth';
import { message } from '../lib/api';
import { Avatar, Brand, ErrorMessage } from '../components/common';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { AppearanceSettings } from '../components/appearance-settings';
import { afterSignIn } from '../lib/social';

const timezones = Intl.supportedValuesOf('timeZone');
export function ProfileForm({ onboarding = false }: { onboarding?: boolean }) {
  const { profile, update } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  if (!profile) return null;
  const initialTimezone = onboarding
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : profile.timezone;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      const input = profileSchema.parse({
        ...Object.fromEntries(new FormData(event.currentTarget)),
        onboardingCompleted: true,
      });
      await update(input);
      setSaved(true);
      if (onboarding) navigate(afterSignIn(), { replace: true });
    } catch (error) {
      setError(
        error && typeof error === 'object' && 'issues' in error
          ? (error.issues as { message: string }[])[0].message
          : message(error),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="form-stack profile-form">
      <div className="profile-identity">
        <Avatar name={profile.displayName} large />
        <div>
          <strong>Your corner of StakeUp</strong>
          <span>Initials for now. Photo uploads arrive with evidence.</span>
        </div>
      </div>
      <div className="form-row">
        <label>
          Display name
          <Input
            name="displayName"
            defaultValue={profile.displayName}
            autoComplete="name"
            required
            maxLength={60}
          />
        </label>
        <label>
          Username
          <Input
            name="username"
            defaultValue={profile.username}
            autoComplete="username"
            required
            minLength={3}
            maxLength={24}
          />
        </label>
      </div>
      <label>
        <span id="timezone-label">Timezone</span>
        <span className="select-wrap">
          <Globe2 size={18} />
          <select
            name="timezone"
            aria-labelledby="timezone-label"
            aria-describedby="timezone-hint"
            defaultValue={initialTimezone}
          >
            {['UTC', ...timezones]
              .filter((tz, i, all) => all.indexOf(tz) === i)
              .map((tz) => (
                <option key={tz}>{tz}</option>
              ))}
          </select>
        </span>
        <span id="timezone-hint" className="field-hint">
          Future deadlines will show in your preferred timezone. Each challenge keeps its own agreed
          timezone.
        </span>
      </label>
      <label>
        A little about you <span className="muted optional">optional</span>
        <textarea
          name="bio"
          defaultValue={profile.bio}
          placeholder="What are you working toward?"
          maxLength={240}
          rows={3}
        />
      </label>
      {error ? <ErrorMessage message={error} /> : null}
      {saved ? (
        <div className="success-message" role="status">
          <Check size={17} /> Your changes are saved.
        </div>
      ) : null}
      <Button disabled={busy} type="submit">
        {busy ? 'Saving…' : onboarding ? 'Make yourself at home' : 'Save changes'}
        <ArrowUpRight size={18} />
      </Button>
    </form>
  );
}
export function Onboarding() {
  return (
    <div className="onboarding">
      <header>
        <Brand />
        <span className="eyebrow">YOUR FIRST SMALL STEP</span>
      </header>
      <main>
        <div className="onboarding-heading">
          <span className="page-icon">
            <UserRound />
          </span>
          <h1>Let’s make this yours.</h1>
          <p>What should your circle call you? Set up your profile and find your footing.</p>
        </div>
        <div className="panel">
          <ProfileForm onboarding />
        </div>
        <p className="secure-caption">
          <ShieldCheck size={16} /> Your profile stays within the circles you join.
        </p>
      </main>
    </div>
  );
}
export function Settings() {
  const { profile, mode, signOut } = useAuth();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  async function logout() {
    setBusy(true);
    setError('');
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      setError(message(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">A LITTLE MORE YOU</span>
        <h1>
          Your profile & settings<span>.</span>
        </h1>
        <p>A familiar face. A fresh ambition. Make yourself at home.</p>
      </div>
      <div className="settings-grid">
        <section className="panel">
          <h2>Personal details</h2>
          <ProfileForm />
        </section>
        <aside className="settings-aside">
          <AppearanceSettings />
          <div className="panel">
            <ShieldCheck className="accent" size={25} />
            <h3>Your account</h3>
            <span className="eyebrow">EMAIL ADDRESS</span>
            <p className="break-anywhere">{profile?.email}</p>
            <span className="pill">
              {mode === 'local' ? 'Local development account' : 'Supabase authenticated'}
            </span>
            <div className="account-actions">
              <Button asChild variant="ghost">
                <Link to="/forgot-password">
                  Reset your password <ArrowUpRight size={15} />
                </Link>
              </Button>
              <Button variant="outline" disabled={busy} onClick={logout}>
                {busy ? 'Signing out…' : 'Log out of this account'}
              </Button>
              {error ? <ErrorMessage message={error} /> : null}
            </div>
          </div>
          <div className="quiet-note">
            <h3>Made for your circle.</h3>
            <p>
              Your details aren’t public. Your circles share your display name, username and
              challenge participation with members. Your email stays private.
            </p>
            <p>All stakes are virtual. There are no payment details to add.</p>
          </div>
        </aside>
      </div>
    </>
  );
}
