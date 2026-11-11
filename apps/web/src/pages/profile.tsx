import { AvatarUpload } from './member';
import { AchievementLink } from '../components/achievement-link';
import { InstallCard } from '../components/install-card';
import { useI18n } from '../lib/i18n';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Check, Globe2, ShieldCheck, UserRound } from 'lucide-react';
import { profileSchema } from '@stakeup/contracts';
import { useAuth } from '../lib/auth';
import { message } from '../lib/api';
import { Avatar, Brand, ErrorMessage } from '../components/common';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { LanguageSettings } from '../components/language-settings';
import { AppearanceSettings } from '../components/appearance-settings';
import { afterSignIn } from '../lib/social';

const timezones = Intl.supportedValuesOf('timeZone');
export function ProfileForm({ onboarding = false }: { onboarding?: boolean }) {
  const { t } = useI18n();

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
      <div className={`profile-identity ${onboarding ? '' : 'st-profile-form-identity'}`}>
        <Avatar userId={profile.id} name={profile.displayName} large />
        <div>
          <strong>{t('Your corner of StakeUp')}</strong>
          <span>{t('Your photo and achievements are visible to teammates.')}</span>
        </div>
      </div>
      <div className="form-row">
        <label>
          {t('Display name')}{' '}
          <Input
            name="displayName"
            defaultValue={profile.displayName}
            autoComplete="name"
            required
            maxLength={60}
          />
        </label>
        <label>
          {t('Username')}{' '}
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
        <span id="timezone-label">{t('Timezone')}</span>
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
          {t(
            'Future deadlines will show in your preferred timezone. Each challenge keeps its own agreed timezone.',
          )}{' '}
        </span>
      </label>
      <label>
        {t('A little about you')} <span className="muted optional">{t('optional')}</span>
        <textarea
          name="bio"
          defaultValue={profile.bio}
          placeholder={t('What are you working toward?')}
          maxLength={240}
          rows={3}
        />
      </label>
      {error ? <ErrorMessage message={error} /> : null}
      {saved ? (
        <div className="success-message" role="status">
          <Check size={17} /> {t('Your changes are saved.')}{' '}
        </div>
      ) : null}
      <Button disabled={busy} type="submit">
        {busy ? t('Saving…') : onboarding ? t('Make yourself at home') : t('Save changes')}
        <ArrowUpRight size={18} />
      </Button>
    </form>
  );
}
export function Onboarding() {
  const { t } = useI18n();

  const { profile } = useAuth();
  return (
    <div className="onboarding st-onboarding">
      <header>
        <Brand />
        <span className="eyebrow">{t('YOUR FIRST SMALL STEP')}</span>
      </header>
      <main className="st-onboarding-layout">
        <aside className="st-onboarding-identity">
          <span className="st-eyebrow">{t('YOUR PRIVATE IDENTITY')}</span>
          <h2>{t('Your circle starts with you.')}</h2>
          <p>{t('This is how your friends will recognize you in Circles and reviews.')}</p>
          <section className="st-module st-onboarding-monogram">
            <Avatar userId={profile?.id} name={profile?.displayName ?? ''} large />
            <strong>{profile?.displayName}</strong>
            <span>@{profile?.username}</span>
            <small>{t('Your photo and achievements are visible to teammates.')}</small>
          </section>
          <section className="st-module">
            <h3>{t('A few shared principles')}</h3>
            <ul className="st-guardrails">
              <li>
                <ShieldCheck size={18} />
                {t('Private by default. No public directory.')}
              </li>
              <li>
                <Check size={18} />
                {t('All stakes are virtual. Always.')}
              </li>
              <li>
                <UserRound size={18} />
                {t('You choose which challenges to accept.')}
              </li>
            </ul>
          </section>
        </aside>
        <section className="st-module st-onboarding-form">
          <span className="st-status st-status-safe">{t('YOUR PROFILE')}</span>
          <h1>{t('Set up your profile')}</h1>
          <p>{t('What should your circle call you? Set up your profile and find your footing.')}</p>
          <ProfileForm onboarding />
          <p className="secure-caption">
            <ShieldCheck size={16} />
            {t('Your profile stays within the circles you join.')}
          </p>
        </section>
      </main>
    </div>
  );
}

export function Settings() {
  const { t } = useI18n();

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
    <div className="st-settings-page">
      <header className="st-page-header">
        <div>
          <span className="st-eyebrow">{t('YOUR ACCOUNT. YOUR PREFERENCES.')}</span>
          <h1>{t('Settings & preferences')}</h1>
          <p>{t('Manage your profile, appearance and language.')}</p>
        </div>
      </header>
      <div className="st-settings-layout">
        <div className="st-settings-left">
          <AchievementLink />
          <section className="st-profile-summary">
            <Avatar userId={profile?.id} name={profile?.displayName ?? ''} large />
            <div>
              <h2>{profile?.displayName}</h2>
              <span>@{profile?.username}</span>
              <p>{t('Private by default.')}</p>
            </div>
            <ShieldCheck size={24} />
          </section>
          <section className="st-module st-profile-edit">
            <div className="st-module-heading">
              <h2>{t('Personal details')}</h2>
              <UserRound size={20} />
            </div>
            <ProfileForm />
            <AvatarUpload />
          </section>
          <section className="st-module st-account-security">
            <div className="st-module-heading">
              <h2>{t('Your account')}</h2>
              <ShieldCheck size={20} />
            </div>
            <small className="st-eyebrow">{t('EMAIL ADDRESS')}</small>
            <p className="break-anywhere">{profile?.email}</p>
            <span className="st-status st-status-quiet">
              {t(mode === 'local' ? 'Local development account' : 'Supabase authenticated')}
            </span>
            <div className="account-actions">
              <Button asChild variant="outline">
                <Link to="/forgot-password">
                  {t('Reset your password')}
                  <ArrowUpRight size={15} />
                </Link>
              </Button>
              <Button disabled={busy} variant="outline" onClick={logout}>
                {t(busy ? 'Signing out…' : 'Log out of this account')}
              </Button>
            </div>
            {error ? <ErrorMessage message={error} /> : null}
          </section>
        </div>
        <aside className="st-settings-right">
          <InstallCard />
          <AppearanceSettings />
          <section className="st-module st-language-panel">
            <LanguageSettings />
            <p className="st-muted">{t('Your interface language is saved to your account.')}</p>
          </section>
          <section className="st-trust-note">
            <ShieldCheck size={24} />
            <h3>{t('Made for your circle.')}</h3>
            <p>
              {t(
                'Your details aren’t public. Your circles share your display name, username and challenge participation with members. Your email stays private.',
              )}
            </p>
            <p>{t('All stakes are virtual. There are no payment details to add.')}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
