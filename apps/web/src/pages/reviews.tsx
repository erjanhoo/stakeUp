import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, RefreshCw, ChevronRight, Check, MessageSquare } from 'lucide-react';
import type { ReviewInbox, ReviewFilter, ReviewCursor } from '@stakeup/contracts';
import { useResource } from '../lib/social';
import { useI18n } from '../lib/i18n';
import { Loading, ErrorMessage, Avatar } from '../components/common';
import { HelpTip } from '../components/help-tip';
import { Button } from '../components/ui/button';
import { Review } from './evidence';
export function ReviewsPage() {
  const { t, language } = useI18n(),
    [filter, setFilter] = useState<ReviewFilter>('all'),
    [cursor, setCursor] = useState<ReviewCursor | null>(null),
    [previous, setPrevious] = useState<(ReviewCursor | null)[]>([]),
    [selected, setSelected] = useState(''),
    [notice, setNotice] = useState('');
  const query = new URLSearchParams({ filter });
  if (cursor) {
    query.set('afterId', cursor.id);
    query.set('afterTime', cursor.receivedAt);
  }
  const { data, error, loading, reload } = useResource<ReviewInbox>(`/reviews?${query}`);
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') void reload();
    };
    document.addEventListener('visibilitychange', refresh);
    return () => document.removeEventListener('visibilitychange', refresh);
  }, [reload]);
  function firstPage() {
    setCursor(null);
    setPrevious([]);
    setSelected('');
  }
  async function reviewed() {
    setNotice('Review saved. The existing peer quorum determines the outcome.');
    if (cursor) firstPage();
    else await reload();
    setSelected('');
  }
  return (
    <div className="review-inbox-page">
      <header className="st-page-header">
        <div>
          <span className="st-eyebrow">{t('A FAIR SECOND LOOK')}</span>
          <div className="inbox-title">
            <h1>{t('Review inbox')}</h1>
            <HelpTip title="How your review inbox works">
              Only other participants’ received photos in active challenges you accepted appear
              here. A vote removes a photo from your queue for that round. Disputes need a fresh
              vote; existing quorum rules still apply.
            </HelpTip>
          </div>
          <p>{t('Photos and disputes where your independent review can help.')}</p>
        </div>
      </header>
      <div className="review-inbox-toolbar">
        <div role="group" aria-label={t('Filter reviews')}>
          {(
            [
              ['all', 'All reviews'],
              ['pending', 'Awaiting review'],
              ['disputed', 'Disputes'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={filter === id}
              onClick={() => {
                setFilter(id);
                firstPage();
                setNotice('');
              }}
            >
              {id === 'disputed' ? <MessageSquare size={16} /> : <ClipboardCheck size={16} />}
              {t(label)}{' '}
              {data ? (
                <span>
                  {id === 'all'
                    ? data.counts.pending + data.counts.disputed
                    : id === 'pending'
                      ? data.counts.pending
                      : data.counts.disputed}
                </span>
              ) : null}
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          disabled={loading}
          onClick={() => {
            if (cursor) firstPage();
            else void reload();
          }}
        >
          <RefreshCw size={16} />
          {t('Refresh inbox')}
        </Button>
      </div>
      {notice ? (
        <p className="success-message" role="status">
          <Check size={18} />
          {t(notice)}
        </p>
      ) : null}
      {error ? <ErrorMessage message={error} /> : null}
      {loading && !data ? <Loading /> : null}
      {data && !loading && !data.items.length ? (
        <section className="st-module review-inbox-empty">
          <ClipboardCheck size={40} />
          <h2>{t('You are caught up.')}</h2>
          <p>
            {t(
              'No photos need your vote in this filter. Your own photos, completed challenges and rounds you already reviewed are excluded.',
            )}
          </p>
          <Link className="st-text-link" to="/app/circles">
            {t('Your circles')}
            <ChevronRight size={16} />
          </Link>
        </section>
      ) : null}
      {data?.items.map((item) => (
        <article className="st-module inbox-task" key={item.proof.id}>
          <header>
            <div className="inbox-task-person">
              <Avatar userId={item.proof.userId} name={item.proof.name} />
              <div>
                <strong>{item.proof.name}</strong>
                <small>
                  {item.proof.localDate} · {item.timezone}
                </small>
              </div>
            </div>
            <span
              className={`st-status ${item.proof.status === 'disputed' ? 'st-status-urgent' : 'st-status-quiet'}`}
            >
              {t(item.proof.status === 'disputed' ? 'Disputed' : 'Awaiting review')}
            </span>
          </header>
          <h2>{item.challengeTitle}</h2>
          <p>
            <Link to={`/app/circles/${item.circleId}`}>{item.circleName}</Link> · {t('Received')}{' '}
            {new Date(item.proof.receivedAt!).toLocaleString(language)}
          </p>
          <div className="inbox-task-actions">
            <Button
              variant={selected === item.proof.id ? 'outline' : 'default'}
              aria-expanded={selected === item.proof.id}
              aria-controls={`review-${item.proof.id}`}
              onClick={() => setSelected(selected === item.proof.id ? '' : item.proof.id)}
            >
              {t(selected === item.proof.id ? 'Close review' : 'Review photo')}
              <ChevronRight size={16} />
            </Button>
            <Link
              className="st-text-link"
              to={`/app/challenges/${item.proof.challengeId}/evidence`}
            >
              {t('Open proof workspace')}
            </Link>
          </div>
          {selected === item.proof.id ? (
            <div id={`review-${item.proof.id}`}>
              <Review
                proof={item.proof}
                challengeId={item.proof.challengeId}
                reload={reviewed}
                closed={false}
              />
            </div>
          ) : null}
        </article>
      ))}
      {data && !loading ? (
        <div className="inbox-pagination">
          <Button
            variant="outline"
            disabled={loading || !previous.length}
            onClick={() => {
              setCursor(previous.at(-1) ?? null);
              setPrevious((p) => p.slice(0, -1));
              setSelected('');
            }}
          >
            {t('Previous page')}
          </Button>
          <Button
            variant="outline"
            disabled={loading || !data.nextCursor}
            onClick={() => {
              setPrevious((p) => [...p, cursor]);
              setCursor(data.nextCursor);
              setSelected('');
            }}
          >
            {t('Next page')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
