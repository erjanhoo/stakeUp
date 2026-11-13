import { useI18n } from '../lib/i18n';
import { PersonalProgress } from '../components/community';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CircleCheck, Check, Sprout, ShieldCheck } from 'lucide-react';
import type { Dashboard, Activity } from '@stakeup/contracts';
import { useAuth } from '../lib/auth';
import { api, ApiError, message } from '../lib/api';
import { ErrorMessage } from '../components/common';
import { Button } from '../components/ui/button';

export function useDashboard() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const { refresh } = useAuth();
  useEffect(() => {
    const controller = new AbortController();
    void api<Dashboard>('/dashboard', { signal: controller.signal })
      .then(setData)
      .catch((error) => {
        if (!controller.signal.aborted) {
          if (error instanceof ApiError && error.status === 401)
            void refresh().catch((error) => setError(message(error)));
          else setError(message(error));
        }
      });
    return () => controller.abort();
  }, [revision, refresh]);
  return {
    data,
    error,
    retry: () => {
      setError('');
      setRevision((v) => v + 1);
    },
  };
}
const activityLabels: Record<Activity['kind'], { title: string; detail: string }> = {
  account_created: {
    title: 'Your day one. Officially.',
    detail: 'You joined StakeUp. Good things start small.',
  },
  onboarding_completed: {
    title: 'You made yourself at home.',
    detail: 'Profile ready. Your next chapter is waiting.',
  },
  profile_updated: {
    title: 'A little profile refresh.',
    detail: 'Your personal details are up to date.',
  },
};
export function ActivityList({ activities }: { activities: Activity[] }) {
  const { t, language } = useI18n();

  const { profile } = useAuth();
  return (
    <div className="activity-list">
      {activities.length ? (
        activities.map((event) => (
          <div className="activity-row" key={event.id}>
            <span className={`activity-icon ${event.kind === 'account_created' ? 'orange' : ''}`}>
              {event.kind === 'account_created' ? <Sprout size={18} /> : <Check size={18} />}
            </span>
            <div>
              <strong>{t(activityLabels[event.kind]?.title ?? 'Account activity')}</strong>
              <p>{t(activityLabels[event.kind]?.detail ?? '')}</p>
            </div>
            <time dateTime={event.createdAt}>
              {new Intl.DateTimeFormat(language, {
                month: 'short',
                day: 'numeric',
                timeZone: profile?.timezone ?? 'UTC',
              }).format(new Date(event.createdAt))}
            </time>
          </div>
        ))
      ) : (
        <p className="muted">{t('Your first small win will appear here.')}</p>
      )}
    </div>
  );
}
export { Overview as DashboardPage } from './overview';
export function ActivityPage() {
  const { t, language } = useI18n(),
    { profile } = useAuth(),
    { data, error, retry } = useDashboard();
  const [filter, setFilter] = useState('all'),
    [query, setQuery] = useState('');
  const events =
    data?.activities.filter(
      (e) =>
        (filter === 'all' ||
          (filter === 'profile' ? e.kind === 'profile_updated' : e.kind !== 'profile_updated')) &&
        t(activityLabels[e.kind]?.title ?? 'Account activity')
          .toLocaleLowerCase(language)
          .includes(query.toLocaleLowerCase(language)),
    ) ?? [];
  return (
    <div className="st-activity-page">
      <header className="st-page-header">
        <div>
          <span className="st-eyebrow">{t('YOUR ACCOUNT HISTORY')}</span>
          <h1>{t('Personal activity')}</h1>
          <p>{t('Real account activity. The beginning of your story.')}</p>
        </div>
        <span className="st-status st-status-safe">{t('Private by default.')}</span>
      </header>
      <div className="st-activity-controls">
        <div className="st-view-tabs">
          {[
            ['all', 'All activity'],
            ['account', 'Account'],
            ['profile', 'Profile updates'],
          ].map(([v, label]) => (
            <button key={v} aria-pressed={filter === v} onClick={() => setFilter(v)}>
              {t(label)}
            </button>
          ))}
        </div>
        <label className="st-search">
          <span>{t('Search activity')}</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('Search activity')}
          />
        </label>
      </div>
      <div className="st-activity-layout">
        <section className="st-timeline">
          {error ? (
            <>
              <ErrorMessage message={error} />
              <Button onClick={retry}>{t('Try again')}</Button>
            </>
          ) : !data ? (
            <div
              className="activity-skeleton skeleton"
              role="status"
              aria-label={t('Loading activity')}
            />
          ) : events.length ? (
            events.map((e) => (
              <article key={e.id} className="st-timeline-entry">
                <div className="st-timeline-event">
                  <span className="st-event-icon">
                    {e.kind === 'account_created' ? <Sprout size={22} /> : <Check size={22} />}
                  </span>
                  <div>
                    <h2>{t(activityLabels[e.kind]?.title ?? 'Account activity')}</h2>
                    <time dateTime={e.createdAt}>
                      {new Intl.DateTimeFormat(language, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                        timeZone: profile?.timezone ?? 'UTC',
                      }).format(new Date(e.createdAt))}
                    </time>
                  </div>
                  <span className="st-status st-status-quiet">
                    {t(e.kind === 'profile_updated' ? 'Profile' : 'Account')}
                  </span>
                </div>
                <div className="st-event-detail">
                  <p>{t(activityLabels[e.kind]?.detail ?? '')}</p>
                  <span>
                    {profile?.displayName} · @{profile?.username}
                  </span>
                </div>
              </article>
            ))
          ) : (
            <div className="st-module">
              <p>{t('No activity matches this filter.')}</p>
            </div>
          )}
        </section>
        <aside className="st-activity-rail">
          <PersonalProgress />
          <section className="st-module">
            <div className="st-module-heading">
              <ShieldCheck size={22} />
              <h2>{t('Your private history')}</h2>
            </div>
            <p>
              {t(
                'This page records account and profile activity. Circle events stay in their own private workspaces.',
              )}
            </p>
            <Link className="st-text-link" to="/app/circles">
              {t('Explore your circles')}
              <ArrowRight size={16} />
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
