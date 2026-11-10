import { useI18n } from '../lib/i18n';
import { PersonalProgress, PoolMark } from '../components/community';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  ArrowRight,
  Flame,
  UsersRound,
  CircleCheck,
  Coins,
  PiggyBank,
  Check,
  Sprout,
  Flag,
  ShieldCheck,
  Clock3,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { Dashboard, Activity } from '@stakeup/contracts';
import { useAuth } from '../lib/auth';
import { api, ApiError, message } from '../lib/api';
import { ErrorMessage, PhaseNote } from '../components/common';
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
export function DashboardPage() {
  const { t, language } = useI18n();

  const { profile } = useAuth();
  const { data, error, retry } = useDashboard();
  const date = new Intl.DateTimeFormat(language, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: profile?.timezone ?? 'UTC',
  }).format(new Date());
  return (
    <>
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">{date.toUpperCase()}</span>
          <h1>
            {t('Hey,')} {profile?.displayName.split(' ')[0]}
            <span className="orange-text">.</span> {t('Let’s show up.')}{' '}
          </h1>
          <p>{t('A little better every day. Even better together.')}</p>
        </div>
        <span className="day-one-badge">
          <span className="status-dot" /> {t('YOUR NEXT CHAPTER')}{' '}
        </span>
      </div>
      <motion.section
        className="momentum-banner"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="banner-copy">
          <span className="eyebrow">{t('YOUR CIRCLE. YOUR NEXT STEP.')}</span>
          <h2>{t(data?.circleCount ? 'Keep the momentum' : 'Find your people')}</h2>
          <p>
            {t(
              data?.circleCount
                ? 'Your people are here. Pick the next promise you’ll keep together.'
                : 'Your profile is ready. Bring a circle of friends who make showing up feel good.',
            )}
          </p>
          <div className="heading-actions">
            <Button asChild>
              <Link to="/app/circles/new">
                {t('Create circle')}
                <ArrowUpRight size={16} />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/join">{t('Join circle')}</Link>
            </Button>
          </div>
        </div>
      </motion.section>
      {error ? (
        <div className="retry-error">
          <ErrorMessage message={error} />
          <Button variant="outline" onClick={retry}>
            {t('Try again')}{' '}
          </Button>
        </div>
      ) : null}
      <section className="stats-grid" aria-label={t('Your statistics')}>
        {[
          {
            icon: Flag,
            label: 'Active challenges',
            value: data?.activeChallenges,
            foot: 'A promise worth keeping',
          },
          {
            icon: UsersRound,
            label: 'Your circles',
            value: data?.circleCount,
            foot: 'Your people, your pace',
          },
          {
            icon: Flame,
            label: 'Successful days',
            value: data?.acceptedDays,
            foot: 'Small wins add up',
          },
          {
            icon: PiggyBank,
            label: 'Virtual prize pool',
            value: data
              ? (data.virtualPoolMinor / 100).toLocaleString(language, { minimumFractionDigits: 2 })
              : undefined,
            foot: 'Virtual credits · no cash value',
          },
        ].map((stat, i) => (
          <article className="stat-card" key={t(stat.label)}>
            <div>
              <span>{t(stat.label)}</span>
              <stat.icon size={17} />
            </div>
            {stat.value === undefined ? (
              <span className="skeleton stat-skeleton" aria-label={t('Loading statistic')} />
            ) : (
              <strong>
                {stat.value}
                {i === 3 ? <small> {t('VC')}</small> : null}
              </strong>
            )}
            <p>{t(stat.foot)}</p>
          </article>
        ))}
      </section>
      <div className="dashboard-grid">
        <section className="commitments-panel panel">
          <div className="panel-heading">
            <h2>
              {t('Today’s commitments')}{' '}
              <span className="count-pill">{data?.commitments?.length ?? '—'}</span>
            </h2>
            <span className="subtle-label">{t('ONE DAY AT A TIME')}</span>
          </div>
          {data?.commitments?.length ? (
            <div>
              {data.commitments.map((o) => (
                <Link
                  key={o.id}
                  className="today-commitment"
                  to={`/app/challenges/${o.challengeId}/evidence`}
                >
                  <div>
                    <strong>{o.title}</strong>
                    <p>
                      {o.circleName} {t('· deadline')}{' '}
                      {new Intl.DateTimeFormat(language, {
                        timeZone: o.timezone,
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZoneName: 'short',
                      }).format(new Date(o.deadlineAt))}
                    </p>
                  </div>
                  <ArrowUpRight size={18} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="commitments-empty">
              <div className="empty-orbit">
                <span>
                  <Flag size={27} />
                </span>
                <i />
                <i />
              </div>
              <h3>{t('A little space for a big goal.')}</h3>
              <p>
                {data?.activeChallenges
                  ? t('No commitments scheduled today.')
                  : t('Your daily commitments will live here.')}
                <br />
                {data?.circleCount
                  ? t('Explore your circle’s next shared promise.')
                  : t('First, find the people you want to grow with.')}
              </p>
              <Button variant="outline" asChild>
                <Link to="/app/circles">
                  {t('Explore your circles')} <ArrowRight size={16} />
                </Link>
              </Button>
              <span className="phase-caption">
                {t('Submit photos and review evidence inside an active challenge.')}{' '}
              </span>
            </div>
          )}
          <div className="commitments-foot">
            <ShieldCheck size={15} />
            <span>{t('Clear rules. Friendly stakes. No real money.')}</span>
          </div>
        </section>
        <aside className="first-steps panel">
          <div className="panel-heading">
            <h2>{t('Find your footing')}</h2>
            <Sprout size={19} />
          </div>
          <span className="steps-progress">
            <span
              style={{ width: data?.activeChallenges ? '100%' : data?.circleCount ? '66%' : '33%' }}
            />
          </span>
          <div className="step-row completed">
            <span className="step-indicator">
              <Check size={14} />
            </span>
            <div>
              <strong>{t('Make yourself at home')}</strong>
              <p>{t('Your profile is good to go.')}</p>
            </div>
          </div>
          <div className={`step-row ${data?.circleCount ? 'completed' : ''}`}>
            <span className="step-indicator">{data?.circleCount ? <Check size={14} /> : 2}</span>
            <div>
              <strong>{t('Bring your people')}</strong>
              <p>
                {data?.circleCount
                  ? t('Your circle is ready to grow.')
                  : t('Build your first private circle.')}
              </p>
              <Link className="text-link" to="/app/circles">
                {t('Your circles')} <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>
          <div className={`step-row ${data?.activeChallenges ? 'completed' : ''}`}>
            <span className="step-indicator">
              {data?.activeChallenges ? <Check size={14} /> : 3}
            </span>
            <div>
              <strong>{t('Make a shared promise')}</strong>
              <p>{t('Pick a goal. Agree on the rules.')}</p>
            </div>
          </div>
          <div className="first-steps-bottom">
            <Sparkles size={16} /> {t('Every great streak starts with one.')}{' '}
          </div>
        </aside>
      </div>
      <section className="panel recent-activity">
        <div className="panel-heading">
          <h2>{t('A little momentum')}</h2>
          <Link to="/app/activity" className="text-link">
            {t('All activity')} <ArrowUpRight size={15} />
          </Link>
        </div>
        {data ? (
          <ActivityList activities={data.activities.slice(0, 3)} />
        ) : (
          <div
            className="activity-skeleton skeleton"
            role="status"
            aria-label={t('Loading activity')}
          />
        )}
      </section>
      <PersonalProgress />
      <div className="dashboard-bottom-note">
        <span>✳</span> {t('You don’t have to be perfect. You just have to show up.')}{' '}
      </div>
    </>
  );
}
export function ActivityPage() {
  const { t } = useI18n();

  const { data, error, retry } = useDashboard();
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">{t('SMALL STEPS, RECORDED')}</span>
        <h1>
          {t('Your momentum')}
          <span>.</span>
        </h1>
        <p>{t('Real account activity. The beginning of your story.')}</p>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <h2>{t('Recent activity')}</h2>
          <Clock3 size={19} />
        </div>
        {error ? (
          <>
            <ErrorMessage message={error} />
            <Button onClick={retry} variant="outline">
              {t('Try again')}{' '}
            </Button>
          </>
        ) : data ? (
          <ActivityList activities={data.activities} />
        ) : (
          <div
            className="activity-skeleton skeleton"
            role="status"
            aria-label={t('Loading activity')}
          />
        )}
      </section>
    </>
  );
}
export function Roadmap() {
  const { t } = useI18n();

  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">{t('BUILT ONE GOOD STEP AT A TIME')}</span>
        <h1>
          {t('The road ahead')}
          <span>.</span>
        </h1>
        <p>{t('Social challenges are here. Here’s what works now, and what’s next.')}</p>
      </div>
      <div className="roadmap-list">
        {[
          [
            '01',
            'A place to start',
            'Account registration, sign-in, recovery, onboarding, profiles and a real account dashboard.',
            true,
          ],
          [
            '02',
            'Your people, your promise',
            'Private circles, invitations, challenge rules, enrollment and timezone-aware deadlines.',
            true,
          ],
          [
            '03',
            'Show your effort',
            'Private photo evidence, honest mock review, peer review and fair disputes.',
            true,
          ],
          [
            '04',
            'Make consistency count',
            'Provisional virtual penalties, balanced ledgers, standings and exact final rewards.',
            true,
          ],
          [
            '05',
            'Keep the momentum',
            'In-app notifications, reactions, comments, recaps and final launch testing.',
            true,
          ],
        ].map(([number, title, description, complete]) => (
          <article
            className={`panel roadmap-row ${complete ? 'complete' : ''}`}
            key={String(number)}
          >
            <span className="roadmap-number">{number}</span>
            <div>
              <span className="eyebrow">{complete ? 'WORKING NOW' : 'PLANNED'}</span>
              <h2>{t(String(title))}</h2>
              <p>{t(String(description))}</p>
            </div>
            {complete ? <CircleCheck size={22} /> : <span className="roadmap-marker" />}
          </article>
        ))}
      </div>
    </>
  );
}
