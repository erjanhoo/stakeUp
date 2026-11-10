import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import type { AppNotification } from '@stakeup/contracts';
import { useI18n } from '../lib/i18n';
import { useResource } from '../lib/social';
import { api, message } from '../lib/api';
import { Button } from '../components/ui/button';
import { ErrorMessage, Loading } from '../components/common';
const notificationTitles: Record<string, string> = {
  deadline: 'Your upload window closes soon',
  missed: 'A submission deadline has passed',
  review: 'Your circle needs a review',
  accepted: 'Your proof was accepted',
  rejected: 'Your proof was rejected',
  disputed: 'A proof decision was disputed',
  activated: 'Your challenge is active',
  completed: 'Your challenge is complete',
  proposal: 'A new challenge is ready to join',
  comment: 'Someone commented on your proof',
  grace: 'Your grace day is reserved',
  recap: 'Your monthly recap',
};
export function Notifications() {
  const { t, language } = useI18n();

  const { data, error, loading, reload } = useResource<AppNotification[]>('/notifications');
  const [filter, setFilter] = useState('all');
  const [actionError, setError] = useState('');
  async function read(id?: string) {
    try {
      await api('/notifications/read', { method: 'POST', body: JSON.stringify({ id }) });
      await reload();
      window.dispatchEvent(new Event('stakeup:notifications-read'));
    } catch (e) {
      setError(message(e));
    }
  }
  return (
    <div className="st-notifications-page">
      <div className="st-page-header">
        <div>
          <span className="eyebrow">{t('YOUR CIRCLE, IN THE LOOP')}</span>
          <h1>
            {t('Notification center')}
            <span>.</span>
          </h1>
          <p>{t('Deadlines, decisions and the moments worth noticing.')}</p>
        </div>
        <Button variant="outline" onClick={() => void read()}>
          <CheckCheck size={17} />
          {t('Mark all as read')}{' '}
        </Button>
      </div>
      {error || actionError ? <ErrorMessage message={error || actionError} /> : null}
      {loading && !data ? <Loading /> : null}
      {data?.length === 0 ? (
        <div className="proof-empty">
          <Bell size={36} />
          <h2>{t('You’re all caught up.')}</h2>
          <p>{t('Reminders and circle updates will appear here.')}</p>
        </div>
      ) : null}
      <div className="st-notification-layout">
        <div>
          <div className="st-view-tabs">
            {[
              ['all', 'All'],
              ['unread', 'Unread'],
              ['review', 'Reviews'],
              ['recap', 'Recaps'],
            ].map(([key, label]) => (
              <button key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>
                {t(label)}
                <span>
                  {data?.filter(
                    (n) => key === 'all' || (key === 'unread' && !n.readAt) || key === n.kind,
                  ).length ?? 0}
                </span>
              </button>
            ))}
          </div>
          <div className="notification-stream">
            {data
              ?.filter(
                (n) => filter === 'all' || (filter === 'unread' && !n.readAt) || filter === n.kind,
              )
              .map((n) => (
                <article key={n.id} className={`notification-item ${n.readAt ? '' : 'unread'}`}>
                  <span className="notification-signal" />
                  <div>
                    <h2>{t(notificationTitles[n.kind] ?? 'Circle update')}</h2>
                    {n.payload.title ? <p>{n.payload.title}</p> : null}
                    {n.payload.date ? <p>{n.payload.date}</p> : null}
                    {n.kind === 'recap' ? (
                      <p>
                        {n.payload.month} · {n.payload.accepted} {t('accepted /')}{' '}
                        {n.payload.submitted} {t('submitted')}{' '}
                      </p>
                    ) : null}
                    <time>{new Date(n.createdAt).toLocaleString(language)}</time>
                    <div className="heading-actions">
                      {n.challengeId ? (
                        <Link
                          className="text-link"
                          to={`/app/challenges/${n.challengeId}${['accepted', 'rejected', 'disputed', 'review', 'comment', 'deadline', 'missed'].includes(n.kind) ? '/evidence' : n.kind === 'completed' ? '/competition' : ''}`}
                          onClick={() => void read(n.id)}
                        >
                          {t('Open update →')}{' '}
                        </Link>
                      ) : null}
                      {!n.readAt ? (
                        <button className="text-link" onClick={() => void read(n.id)}>
                          {t('Mark as read')}{' '}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
          </div>
        </div>
        <aside className="st-notification-policy">
          <section className="st-module">
            <h2>{t('Your private inbox')}</h2>
            <p>{t('In-app updates from your Circles. Only you can read your notifications.')}</p>
            <div className="st-inbox-policy-row">
              <Bell size={20} />
              <div>
                <strong>{t('In-app notifications')}</strong>
                <p>{t('Reminders and circle updates will appear here.')}</p>
              </div>
            </div>
            <div className="st-inbox-policy-row">
              <CheckCheck size={20} />
              <div>
                <strong>{t('Mark all as read')}</strong>
                <p>{t('Read states are personal. Your Circles do not see them.')}</p>
              </div>
            </div>
            <small className="st-mono st-muted">{t('Latest 100 updates')}</small>
          </section>
          <Link className="st-btn st-btn-secondary" to="/app/circles">
            {t('Your circles')}
          </Link>
        </aside>
      </div>
    </div>
  );
}
