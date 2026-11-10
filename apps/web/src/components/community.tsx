import { useI18n } from '../lib/i18n';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  PartyPopper,
  Heart,
  Flame,
  Hand,
  Trash2,
  CalendarHeart,
  PiggyBank,
} from 'lucide-react';
import { motion } from 'motion/react';
import type {
  AppNotification,
  ProofSocial,
  ChallengeDetail,
  GraceChoice,
  PersonalRecap,
} from '@stakeup/contracts';
import { useResource } from '../lib/social';
import { api, message } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Button } from './ui/button';
import { ErrorMessage, Loading } from './common';
import './community.css';
export function PoolMark({ size = 30 }: { size?: number }) {
  return (
    <span className="pool-mark" aria-hidden="true">
      <PiggyBank size={size} strokeWidth={1.6} />
    </span>
  );
}
export function NotificationBell() {
  const { t } = useI18n();

  const { data, reload } = useResource<AppNotification[]>('/notifications');
  useEffect(() => {
    const timer = setInterval(() => void reload(), 60000);
    const refresh = () => void reload();
    window.addEventListener('stakeup:notifications-read', refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener('stakeup:notifications-read', refresh);
    };
  }, [reload]);
  const unread = data?.filter((n) => !n.readAt).length ?? 0;
  return (
    <Link className="notification-bell" to="/app/notifications" aria-label={t('Notifications')}>
      <Bell size={20} />
      {unread ? <span>{unread > 99 ? '99+' : unread}</span> : null}
    </Link>
  );
}
export function ProofConversation({
  challengeId,
  proofId,
}: {
  challengeId: string;
  proofId: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <details className="proof-conversation" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary>{t('Encouragement & conversation')}</summary>
      {open ? <Conversation challengeId={challengeId} proofId={proofId} /> : null}
    </details>
  );
}
function Conversation({ challengeId, proofId }: { challengeId: string; proofId: string }) {
  const { t, language } = useI18n();

  const { profile } = useAuth(),
    { data, error, reload } = useResource<ProofSocial>(
      `/challenges/${challengeId}/evidence/${proofId}/social`,
    );
  const [body, setBody] = useState(''),
    [busy, setBusy] = useState(false),
    [actionError, setError] = useState('');
  async function action(kind: string, p: Record<string, string>) {
    setBusy(true);
    setError('');
    try {
      await api(`/challenges/${challengeId}/evidence/${proofId}/${kind}`, {
        method: 'POST',
        body: JSON.stringify(p),
      });
      if (kind === 'comment') setBody('');
      await reload();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="proof-conversation">
      <div className="proof-reactions">
        {(['clap', 'fire', 'heart'] as const).map((emoji) => {
          const r = data?.reactions.find((r) => r.emoji === emoji),
            Icon = { clap: Hand, fire: Flame, heart: Heart }[emoji];
          return (
            <button
              key={emoji}
              type="button"
              disabled={busy}
              aria-label={
                emoji === 'clap' ? t('Encourage') : emoji === 'fire' ? t('Celebrate') : t('Support')
              }
              aria-pressed={r?.own ?? false}
              onClick={() => void action('react', { emoji })}
            >
              <Icon size={17} />
              {r?.count ?? 0}
            </button>
          );
        })}
        <span>{t('Encouragement never counts as a review vote.')}</span>
      </div>
      <details>
        <summary>
          {t('Circle conversation ·')} {data?.comments.length ?? 0}
        </summary>
        {data?.comments.map((c) => (
          <div className="comment-row" key={c.id}>
            <strong>{c.name}</strong>
            <time>{new Date(c.createdAt).toLocaleString(language)}</time>
            <p>{c.deleted ? t('Comment removed') : c.body}</p>
            {c.userId === profile?.id && !c.deleted ? (
              <button
                className="text-link"
                disabled={busy}
                onClick={() => void action('delete_comment', { id: c.id })}
              >
                <Trash2 size={13} />
                {t('Remove my comment')}{' '}
              </button>
            ) : null}
          </div>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void action('comment', { body });
          }}
          className="form-stack"
        >
          <label>
            {t('Add encouragement')}{' '}
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={1000}
              required
              rows={2}
            />
          </label>
          <Button disabled={busy || !body.trim()} type="submit">
            {t('Post comment')}{' '}
          </Button>
        </form>
      </details>
      {error || actionError ? <ErrorMessage message={error || actionError} /> : null}
    </section>
  );
}
export function GracePlanner({
  challenge: c,
  choices,
  reload,
}: {
  challenge: ChallengeDetail;
  choices: GraceChoice[];
  reload: () => Promise<void>;
}) {
  const { t } = useI18n();

  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function choose(id: string, cancel: boolean) {
    setBusy(true);
    setError('');
    try {
      await api(`/challenges/${c.id}/grace/${cancel ? 'cancel' : 'choose'}`, {
        method: 'POST',
        body: JSON.stringify({ obligationId: id }),
      });
      await reload();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="grace-planner">
      <h2>
        <CalendarHeart size={23} />
        {t('Make room for a rest day.')}{' '}
      </h2>
      {(c.rules.gracePolicy ?? 'automatic_v1') === 'automatic_v1' ? (
        <p>
          {t(
            'This challenge keeps its accepted automatic grace policy. Choose grace dates in a new challenge.',
          )}{' '}
        </p>
      ) : (
        <>
          <p>
            {t(
              'Choose a scheduled day before its upload deadline. Chosen days are excused and excluded from your score denominator. Unused grace days are not assigned automatically.',
            )}{' '}
          </p>
          <strong>
            {c.rules.graceDays - choices.length} / {c.rules.graceDays}{' '}
            {t('grace days remaining')}{' '}
          </strong>
          <details>
            <summary>{t('Choose or change a grace day')}</summary>
            {c.obligations.map((o) => {
              const selected = choices.some((g) => g.obligationId === o.id),
                closed = c.status !== 'active' || Date.parse(o.deadlineAt) < Date.now();
              return (
                <div className="grace-choice" key={o.id}>
                  <span>{o.localDate}</span>
                  <Button
                    variant="outline"
                    disabled={busy || closed || (!selected && choices.length >= c.rules.graceDays)}
                    onClick={() => void choose(o.id, selected)}
                  >
                    {selected ? t('Cancel grace day') : t('Use grace day')}
                  </Button>
                  {selected ? <span className="pill">{t('Excused')}</span> : null}
                </div>
              );
            })}
          </details>
        </>
      )}
      {error ? <ErrorMessage message={error} /> : null}
    </section>
  );
}
export function PersonalProgress() {
  const { t } = useI18n();

  const { data, error } = useResource<PersonalRecap>('/me/recap');
  const names: Record<string, string> = {
    first_proof: 'First proof accepted',
    seven_proofs: 'Seven small wins',
    thirty_proofs: 'Thirty times showing up',
    first_finish: 'First challenge completed',
  };
  return (
    <section className="personal-progress">
      <span className="eyebrow">{t('YOUR EFFORT ADDS UP')}</span>
      <h2>{t('A record of showing up.')}</h2>
      {data ? (
        <>
          <p>
            {data.accepted} {t('accepted proofs ·')} {data.submitted} {t('submissions ·')}{' '}
            {data.completed} {t('completed challenges')}{' '}
          </p>
          <div className="achievement-strip">
            {data.achievements.map((a) => (
              <span key={a}>
                <PartyPopper size={18} />
                {t(names[a])}
              </span>
            ))}
          </div>
          {!data.achievements.length ? (
            <p>{t('Your first accepted proof starts your achievement history.')}</p>
          ) : null}
        </>
      ) : null}
      {error ? <ErrorMessage message={error} /> : null}
    </section>
  );
}
export function CompletionCelebration() {
  const { t } = useI18n();

  return (
    <motion.div
      className="completion-celebration"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <PartyPopper size={30} />
      <div>
        <strong>{t('You showed up. Together.')}</strong>
        <p>{t('Your challenge is complete. Every virtual credit is accounted for.')}</p>
      </div>
    </motion.div>
  );
}
