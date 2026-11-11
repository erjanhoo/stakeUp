import { HelpTip } from '../components/help-tip';
import { AchievementLink } from '../components/achievement-link';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Plus,
  KeyRound,
  Clock,
  PiggyBank,
  ShieldCheck,
  Check,
  Flag,
  ArrowUpRight,
  ClipboardCheck,
} from 'lucide-react';
import type { Obligation, Proof, GraceChoice, PersonalRecap } from '@stakeup/contracts';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { useResource, credits } from '../lib/social';
import { useDashboard, ActivityList } from './dashboard';
import { ErrorMessage, Loading } from '../components/common';
function Commitment({ o, clock }: { o: Obligation; clock: number }) {
  const { t, language } = useI18n(),
    { profile } = useAuth();
  const evidence = useResource<{ proofs: Proof[] }>(`/challenges/${o.challengeId}/evidence`),
    grace = useResource<GraceChoice[]>(`/challenges/${o.challengeId}/grace`);
  const proof = evidence.data?.proofs.find(
      (p) => p.obligationId === o.id && p.userId === profile?.id && p.receivedAt,
    ),
    rest = grace.data?.some((g) => g.obligationId === o.id);
  const future = o.opensAt && Date.parse(o.opensAt) > clock,
    expired = Date.parse(o.deadlineAt) < clock;
  const state = rest
    ? 'Grace day reserved'
    : proof
      ? proof.status === 'accepted'
        ? 'Accepted'
        : proof.status === 'rejected'
          ? 'Rejected'
          : 'Awaiting peer review'
      : future
        ? 'Upcoming window'
        : expired
          ? 'Window closed'
          : 'Open window';
  const time = (v: string) =>
    new Intl.DateTimeFormat(language, {
      timeZone: o.timezone,
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(new Date(v));
  const minutes = Math.max(
    0,
    Math.ceil((Date.parse(future ? o.opensAt! : o.deadlineAt) - clock) / 60000),
  );
  return (
    <article
      className={`st-obligation ${!future && !expired && !proof && !rest ? 'st-obligation-open' : ''}`}
    >
      <div className="st-obligation-top">
        <span
          className={`st-status ${proof || rest ? 'st-status-safe' : future || expired ? 'st-status-quiet' : 'st-status-urgent'}`}
        >
          <i />
          {t(state)}
        </span>
        <span className="st-mono st-countdown">
          {!proof && !rest && !expired
            ? `${Math.floor(minutes / 60)}h ${minutes % 60}m`
            : o.localDate}
        </span>
      </div>
      <h3>
        {o.circleName} — {o.title}
      </h3>
      <p className="st-muted">
        {t(rest ? 'No proof obligation today.' : 'Your daily commitment, reviewed by your Circle.')}
      </p>
      <div className="st-window">
        <Clock size={20} />
        <div>
          <small>{t('Daily upload window')}</small>
          <strong>
            {o.opensAt ? time(o.opensAt) : '00:00'} — {time(o.deadlineAt)}
          </strong>
        </div>
        <span className="st-mono">{o.timezone}</span>
      </div>
      <div className="st-card-actions">
        <Link to={`/app/challenges/${o.challengeId}`} className="st-text-link">
          {t('View challenge rules')}
          <ArrowUpRight size={14} />
        </Link>
        <Link
          className={proof || rest || future || expired ? 'st-btn st-btn-secondary' : 'st-btn'}
          to={`/app/challenges/${o.challengeId}/evidence`}
        >
          {t(
            proof
              ? 'Review & history'
              : rest
                ? 'Manage grace days'
                : future || expired
                  ? 'View schedule'
                  : 'Submit proof',
          )}
          <ArrowRight size={18} />
        </Link>
      </div>
    </article>
  );
}
function Milestones() {
  const { t } = useI18n(),
    { data, error } = useResource<PersonalRecap>('/me/recap');
  return (
    <section className="st-module">
      <div className="st-module-heading">
        <Flag size={18} />
        <h2>{t('Verifiable milestones')}</h2>
      </div>
      {error ? <ErrorMessage message={error} /> : !data ? <Loading /> : null}
      {data
        ? [
            [1, 'First proof accepted'],
            [7, 'Seven small wins'],
            [30, 'Thirty times showing up'],
            [1, 'First challenge completed'],
          ].map(([goal, title], i) => {
            const value = i === 3 ? (data?.completed ?? 0) : (data?.accepted ?? 0),
              achieved = value >= Number(goal);
            return (
              <div className="st-milestone" key={title}>
                <span className={achieved ? 'st-achieved' : ''}>
                  {achieved ? <Check size={18} /> : <Flag size={18} />}
                </span>
                <div>
                  <strong>{t(String(title))}</strong>
                  <small>{achieved ? t('Accepted') : `${value} / ${goal}`}</small>
                  <div className="st-progress">
                    <span style={{ width: `${Math.min(100, (value / Number(goal)) * 100)}%` }} />
                  </div>
                </div>
              </div>
            );
          })
        : null}
    </section>
  );
}
export function Overview() {
  const { t, language } = useI18n(),
    { profile } = useAuth(),
    { data, error, retry } = useDashboard();
  const [clock, setClock] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="stitch-overview">
      <header className="st-page-header">
        <div>
          <span className="st-eyebrow">{t('PRIVATE ACCOUNTABILITY')}</span>
          <h1>
            {t('Hey,')} {profile?.displayName.split(' ')[0]}.
          </h1>
          <p>{t('Your commitments. Your people. Your next move.')}</p>
        </div>
        <div className="st-header-actions">
          <Link className="st-btn st-btn-secondary" to="/join">
            <KeyRound size={16} />
            {t('Join circle')}
          </Link>
          <Link className="st-btn" to="/app/circles/new">
            <Plus size={17} />
            {t('Create circle')}
          </Link>
        </div>
      </header>
      <div className="st-home-entries">
        <AchievementLink />
        <Link to="/app/reviews" className="st-achievement-entry st-review-entry">
          <ClipboardCheck size={26} />
          <span>
            <strong>{t('Review inbox')}</strong>
            <small>{t('Help your teammates. Review photos and open disputes in one place.')}</small>
          </span>
          <ArrowRight size={20} />
        </Link>
      </div>
      {error ? (
        <div className="st-module">
          <ErrorMessage message={error} />
          <button className="st-btn" onClick={retry}>
            {t('Try again')}
          </button>
        </div>
      ) : null}
      <div className="st-dashboard-layout">
        <div className="st-dashboard-main">
          <section>
            <div className="st-section-label">
              <h2>
                <span />
                {t('Today’s obligations & active windows')}
              </h2>
              <small className="st-mono">{t('Schedule order')}</small>
            </div>
            {!data && !error ? <Loading /> : null}
            {data?.commitments?.length ? (
              <div className="st-stack">
                {[...data.commitments]
                  .sort((a, b) => a.deadlineAt.localeCompare(b.deadlineAt))
                  .map((o) => (
                    <Commitment key={o.id} o={o} clock={clock} />
                  ))}
              </div>
            ) : data ? (
              <div className="st-empty-workspace">
                <div className="st-empty-symbol">
                  <Flag size={34} />
                </div>
                <span className="st-eyebrow">{t('YOUR NEXT CHAPTER')}</span>
                <h2>
                  {t(
                    data.activeChallenges
                      ? 'No commitments scheduled today.'
                      : 'Your first commitment starts here.',
                  )}
                </h2>
                <p>
                  {t(
                    data.circleCount
                      ? 'Explore your circle’s next shared promise.'
                      : 'Create a private Circle or join your friends with an invitation.',
                  )}
                </p>
                <div className="st-header-actions">
                  <Link className="st-btn" to="/app/circles/new">
                    <Plus size={16} />
                    {t('Create circle')}
                  </Link>
                  <Link className="st-btn st-btn-secondary" to="/app/circles">
                    {t('Explore your circles')}
                    <ArrowRight size={16} />
                  </Link>
                </div>
                <div className="st-empty-steps">
                  {['Create a circle', 'Accept the same rules', 'Show the effort'].map((s, i) => (
                    <div key={s}>
                      <span>0{i + 1}</span>
                      <strong>{t(s)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
          <section className="st-module st-account-timeline">
            <div className="st-module-heading">
              <h2>{t('Recent activity')}</h2>
              <Link className="st-text-link" to="/app/activity">
                {t('All activity')}
                <ArrowRight size={14} />
              </Link>
            </div>
            {data ? <ActivityList activities={data.activities.slice(0, 4)} /> : null}
          </section>
        </div>
        <aside className="st-dashboard-rail">
          <section className="st-pool-module">
            <div className="st-module-heading">
              <h2>
                <PiggyBank size={18} />
                {t('Active virtual pool')}
                <HelpTip title="About the pool">
                  Virtual credits come from missed commitments. They have no cash value. Final
                  rewards depend on the accepted challenge rules.
                </HelpTip>
              </h2>
              <span className="st-live-dot" />
            </div>
            <small className="st-mono st-muted">{t('Combined challenge pools')}</small>
            <strong className="st-pool-amount">
              {data ? credits(data.virtualPoolMinor, language) : '—'}
            </strong>
            <p>
              {t(
                'Virtual credits in active challenges. Not a personal wallet or spendable balance.',
              )}
            </p>
            <div className="st-mini-metrics">
              {[
                [data?.activeChallenges, 'Active challenges'],
                [data?.circleCount, 'Your circles'],
                [data?.acceptedDays, 'Successful days'],
                [data?.commitments?.length ?? 0, 'Today’s commitments'],
              ].map(([value, label]) => (
                <div key={label}>
                  <span>{t(String(label))}</span>
                  <strong>{value ?? '—'}</strong>
                </div>
              ))}
            </div>
            <footer>
              <ShieldCheck size={13} />
              {t('Virtual credits · no cash value')}
            </footer>
          </section>
          <Milestones />
          <section className="st-trust-note">
            <ShieldCheck size={24} />
            <h3>{t('Private by default.')}</h3>
            <p>{t('All stakes are virtual. Your circle stays private.')}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
