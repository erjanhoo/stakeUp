import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  ArrowRight,
  Flame,
  UsersRound,
  CircleCheck,
  Coins,
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
              <strong>{activityLabels[event.kind]?.title ?? 'Account activity'}</strong>
              <p>{activityLabels[event.kind]?.detail}</p>
            </div>
            <time dateTime={event.createdAt}>
              {new Intl.DateTimeFormat('en', {
                month: 'short',
                day: 'numeric',
                timeZone: profile?.timezone ?? 'UTC',
              }).format(new Date(event.createdAt))}
            </time>
          </div>
        ))
      ) : (
        <p className="muted">Your first small win will appear here.</p>
      )}
    </div>
  );
}
export function DashboardPage() {
  const { profile } = useAuth();
  const { data, error, retry } = useDashboard();
  const date = new Intl.DateTimeFormat('en', {
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
            Hey, {profile?.displayName.split(' ')[0]}
            <span className="orange-text">.</span> Let’s show up.
          </h1>
          <p>A little better every day. Even better together.</p>
        </div>
        <span className="day-one-badge">
          <span className="status-dot" /> YOUR NEXT CHAPTER
        </span>
      </div>
      <motion.section
        className="momentum-banner"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="banner-copy">
          <div className="banner-kicker">
            <span /> THIS IS YOUR STARTING LINE
          </div>
          <h2>
            Big things start
            <br />
            with a small promise.
          </h2>
          <p>
            Your profile is ready. Next up: a circle of friends
            <br className="desktop-break" /> who make showing up feel good.
          </p>
          <Button variant="secondary" asChild>
            <Link to="/app/circles">
              Find your people <ArrowUpRight size={17} />
            </Link>
          </Button>
        </div>
        <div className="banner-art" aria-hidden="true">
          <div className="banner-orbit" />
          <div className="banner-orbit second" />
          <span className="banner-asterisk">✳</span>
          <span className="banner-art-label">
            GOOD THINGS
            <br />
            TAKE TOGETHER.
          </span>
          <span className="banner-plus">+</span>
        </div>
        <span className="banner-number">01 — THE BEGINNING</span>
      </motion.section>
      {error ? (
        <div className="retry-error">
          <ErrorMessage message={error} />
          <Button variant="outline" onClick={retry}>
            Try again
          </Button>
        </div>
      ) : null}
      <section className="stats-grid" aria-label="Your statistics">
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
            icon: Coins,
            label: 'Virtual prize pool',
            value: data
              ? (data.virtualPoolMinor / 100).toLocaleString('en', { minimumFractionDigits: 2 })
              : undefined,
            foot: 'Virtual credits · no cash value',
          },
        ].map((stat, i) => (
          <article className="stat-card" key={stat.label}>
            <div>
              <span>{stat.label}</span>
              <stat.icon size={17} />
            </div>
            {stat.value === undefined ? (
              <span className="skeleton stat-skeleton" aria-label="Loading statistic" />
            ) : (
              <strong>
                {stat.value}
                {i === 3 ? <small> VC</small> : null}
              </strong>
            )}
            <p>{stat.foot}</p>
          </article>
        ))}
      </section>
      <div className="dashboard-grid">
        <section className="commitments-panel panel">
          <div className="panel-heading">
            <h2>
              Today’s commitments{' '}
              <span className="count-pill">{data?.activeChallenges ?? '—'}</span>
            </h2>
            <span className="subtle-label">ONE DAY AT A TIME</span>
          </div>
          <div className="commitments-empty">
            <div className="empty-orbit">
              <span>
                <Flag size={27} />
              </span>
              <i />
              <i />
            </div>
            <h3>A little space for a big goal.</h3>
            <p>
              Your daily commitments will live here.
              <br />
              First, find the people you want to grow with.
            </p>
            <Button variant="outline" asChild>
              <Link to="/app/circles">
                Explore your circles <ArrowRight size={16} />
              </Link>
            </Button>
            <span className="phase-caption">Circle creation arrives in milestone 02.</span>
          </div>
          <div className="commitments-foot">
            <ShieldCheck size={15} />
            <span>Clear rules. Friendly stakes. No real money.</span>
          </div>
        </section>
        <aside className="first-steps panel">
          <div className="panel-heading">
            <h2>Find your footing</h2>
            <Sprout size={19} />
          </div>
          <span className="steps-progress">
            <span />
          </span>
          <div className="step-row completed">
            <span className="step-indicator">
              <Check size={14} />
            </span>
            <div>
              <strong>Make yourself at home</strong>
              <p>Your profile is good to go.</p>
            </div>
          </div>
          <div className="step-row">
            <span className="step-indicator">2</span>
            <div>
              <strong>Bring your people</strong>
              <p>Build your first private circle.</p>
              <span className="pill">Coming in milestone 02</span>
            </div>
          </div>
          <div className="step-row">
            <span className="step-indicator">3</span>
            <div>
              <strong>Make a shared promise</strong>
              <p>Pick a goal. Agree on the rules.</p>
            </div>
          </div>
          <div className="first-steps-bottom">
            <Sparkles size={16} /> Every great streak starts with one.
          </div>
        </aside>
      </div>
      <section className="panel recent-activity">
        <div className="panel-heading">
          <h2>A little momentum</h2>
          <Link to="/app/activity" className="text-link">
            All activity <ArrowUpRight size={15} />
          </Link>
        </div>
        {data ? (
          <ActivityList activities={data.activities.slice(0, 3)} />
        ) : (
          <div className="activity-skeleton skeleton" role="status" aria-label="Loading activity" />
        )}
      </section>
      <div className="dashboard-bottom-note">
        <span>✳</span> You don’t have to be perfect. You just have to show up.
      </div>
    </>
  );
}
export function CirclesPage() {
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">GOOD COMPANY. SHARED AMBITION.</span>
        <h1>
          Your people. Your circles<span>.</span>
        </h1>
        <p>Private spaces for friends who bring out your better.</p>
      </div>
      <section className="panel feature-empty">
        <div className="empty-orbit">
          <span>
            <UsersRound size={28} />
          </span>
        </div>
        <span className="eyebrow">ROOM FOR YOUR PEOPLE</span>
        <h2>Everything’s better with a circle.</h2>
        <p>
          This is where your private groups will live. Circle creation, invitations, and member
          roles are the next working milestone.
        </p>
        <Button disabled>Create a circle · coming next</Button>
        <Button asChild variant="ghost">
          <Link to="/app/roadmap">
            See the development roadmap <ArrowUpRight size={16} />
          </Link>
        </Button>
      </section>
      <PhaseNote
        title="Small circles. Strong commitments."
        text="Invite friends with a private link, agree on the rules together, and build a habit that sticks."
      />
    </>
  );
}
export function ActivityPage() {
  const { data, error, retry } = useDashboard();
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">SMALL STEPS, RECORDED</span>
        <h1>
          Your momentum<span>.</span>
        </h1>
        <p>Real account activity. The beginning of your story.</p>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <h2>Recent activity</h2>
          <Clock3 size={19} />
        </div>
        {error ? (
          <>
            <ErrorMessage message={error} />
            <Button onClick={retry} variant="outline">
              Try again
            </Button>
          </>
        ) : data ? (
          <ActivityList activities={data.activities} />
        ) : (
          <div className="activity-skeleton skeleton" role="status" aria-label="Loading activity" />
        )}
      </section>
    </>
  );
}
export function NotificationsPage() {
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">IN THE LOOP</span>
        <h1>
          A quieter kind of inbox<span>.</span>
        </h1>
        <p>The right nudge, when you need it.</p>
      </div>
      <section className="panel feature-empty">
        <span className="page-icon">
          <CircleCheck size={28} />
        </span>
        <h2>You’re all caught up.</h2>
        <p>
          Deadline reminders, circle invitations, and review updates will arrive here when
          notifications launch in milestone 05.
        </p>
        <Button asChild variant="outline">
          <Link to="/app">
            Back to your space <ArrowUpRight size={17} />
          </Link>
        </Button>
      </section>
    </>
  );
}
export function Roadmap() {
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">BUILT ONE GOOD STEP AT A TIME</span>
        <h1>
          The road ahead<span>.</span>
        </h1>
        <p>You’re using the foundation milestone. Here’s what works now, and what’s next.</p>
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
            false,
          ],
          [
            '03',
            'Show your effort',
            'Private photo evidence, cautious AI-assisted review, human review and fair disputes.',
            false,
          ],
          [
            '04',
            'Make consistency count',
            'Virtual penalties, transparent ledgers, leaderboards and deterministic rewards.',
            false,
          ],
          [
            '05',
            'Keep the momentum',
            'In-app notifications, reactions, comments, recaps and final launch testing.',
            false,
          ],
        ].map(([number, title, description, complete]) => (
          <article
            className={`panel roadmap-row ${complete ? 'complete' : ''}`}
            key={String(number)}
          >
            <span className="roadmap-number">{number}</span>
            <div>
              <span className="eyebrow">{complete ? 'WORKING NOW' : 'PLANNED'}</span>
              <h2>{title}</h2>
              <p>{description}</p>
            </div>
            {complete ? <CircleCheck size={22} /> : <span className="roadmap-marker" />}
          </article>
        ))}
      </div>
    </>
  );
}
