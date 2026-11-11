import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import type { ChallengeSummary, ChallengeDetail, Proof, GraceChoice } from '@stakeup/contracts';
import { api, message } from '../lib/api';
import { useResource } from '../lib/social';
import { useI18n } from '../lib/i18n';
import { ErrorMessage, Loading } from './common';
import { HelpTip } from './help-tip';
import { Review } from '../pages/evidence';
import { Button } from './ui/button';
type DayData = { challenge: ChallengeDetail; proofs: Proof[]; grace: GraceChoice[] };
async function loadChallenge(id: string, signal?: AbortSignal): Promise<DayData> {
  const [c, p, g] = await Promise.all([
    api<ChallengeDetail>(`/challenges/${id}`, { signal }),
    api<{ proofs: Proof[] }>(`/challenges/${id}/evidence`, { signal }),
    api<GraceChoice[]>(`/challenges/${id}/grace`, { signal }),
  ]);
  return { challenge: c, proofs: p.proofs, grace: g };
}
export function CircleCalendar({
  circleId,
  challenges,
}: {
  circleId: string;
  challenges: ChallengeSummary[];
}) {
  const { t, language } = useI18n(),
    [month, setMonth] = useState(
      () => `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    ),
    [rows, setRows] = useState<DayData[] | null>(null),
    [error, setError] = useState('');
  const ids = challenges
    .filter((c) => c.status !== 'cancelled')
    .map((c) => c.id)
    .join(',');
  useEffect(() => {
    const controller = new AbortController();
    setRows(null);
    setError('');
    void Promise.all(ids ? ids.split(',').map((id) => loadChallenge(id, controller.signal)) : [])
      .then(setRows)
      .catch((e) => {
        if (!controller.signal.aborted) setError(message(e));
      });
    return () => controller.abort();
  }, [ids]);
  const [y, m] = month.split('-').map(Number),
    date = new Date(y, m - 1, 1),
    days = new Date(y, m, 0).getDate(),
    offset = (date.getDay() + 6) % 7;
  function move(n: number) {
    const d = new Date(y, m - 1 + n, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return (
    <section className="st-module circle-calendar">
      <div className="st-module-heading">
        <CalendarDays />
        <h2>
          {t('Commitment calendar')}
          <HelpTip title="Calendar and grace passes">
            Green means a photo was submitted or a grace pass was used. Red means missed or
            rejected. A pass clears a missed day without a photo. Open a date for all photos,
            reviews and conversation.
          </HelpTip>
        </h2>
      </div>
      <div className="calendar-toolbar">
        <Button variant="ghost" aria-label={t('Previous month')} onClick={() => move(-1)}>
          <ChevronLeft size={18} />
        </Button>
        <strong>
          {new Intl.DateTimeFormat(language, { month: 'long', year: 'numeric' }).format(date)}
        </strong>
        <Button variant="ghost" aria-label={t('Next month')} onClick={() => move(1)}>
          <ChevronRight size={18} />
        </Button>
      </div>
      <div className="calendar-legend">
        <span className="good">{t('Submitted / excused')}</span>
        <span className="missed">{t('Missed / rejected')}</span>
        <span>{t('Dates follow each challenge timezone.')}</span>
        <span>{t('Colors show your days. Photo counts include the whole team.')}</span>
      </div>
      {error ? (
        <ErrorMessage message={error} />
      ) : !rows ? (
        <Loading />
      ) : (
        <div className="calendar-grid">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <small key={d}>{t(d)}</small>
          ))}
          {Array.from({ length: offset }, (_, i) => (
            <span key={`blank${i}`} />
          ))}
          {Array.from({ length: days }, (_, i) => {
            const key = `${month}-${String(i + 1).padStart(2, '0')}`,
              own = rows.flatMap((r) =>
                r.challenge.obligations.filter((o) => o.localDate === key).map((o) => ({ o, r })),
              ),
              proofs = rows.flatMap((r) =>
                r.proofs.filter((p) => p.localDate === key && p.receivedAt),
              );
            let state = '';
            if (
              own.some(
                ({ o, r }) =>
                  !r.grace.some((g) => g.obligationId === o.id) &&
                  ((!r.proofs.some((p) => p.obligationId === o.id && p.receivedAt) &&
                    Date.parse(o.deadlineAt) < Date.now()) ||
                    r.proofs.some((p) => p.obligationId === o.id && p.status === 'rejected')),
              )
            )
              state = 'missed';
            else if (
              own.some(
                ({ o, r }) =>
                  r.grace.some((g) => g.obligationId === o.id) ||
                  r.proofs.some((p) => p.obligationId === o.id && p.receivedAt),
              )
            )
              state = 'good';
            return (
              <Link
                key={key}
                className={`calendar-day ${state}`}
                to={`/app/circles/${circleId}/day/${key}`}
                aria-label={`${key}: ${t(state === 'missed' ? 'Missed / rejected' : state === 'good' ? 'Submitted / excused' : 'View day')}`}
              >
                <strong>{i + 1}</strong>
                {proofs.length ? (
                  <small>
                    {proofs.length} {t('photos')}
                  </small>
                ) : null}
                {own.some(({ o, r }) => r.grace.some((g) => g.obligationId === o.id)) ? (
                  <small>{t('Grace pass')}</small>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
function DayChallenge({ id, date }: { id: string; date: string }) {
  const { t } = useI18n(),
    [data, setData] = useState<DayData | null>(null),
    [error, setError] = useState(''),
    [actionError, setActionError] = useState(''),
    [busy, setBusy] = useState(false);
  async function reload() {
    setData(await loadChallenge(id));
  }
  useEffect(() => {
    let live = true;
    void loadChallenge(id)
      .then((d) => {
        if (live) setData(d);
      })
      .catch((e) => {
        if (live) setError(message(e));
      });
    return () => {
      live = false;
    };
  }, [id]);
  if (error) return <ErrorMessage message={error} />;
  if (!data) return <Loading />;
  const c = data.challenge,
    obligations = c.obligations.filter((o) => o.localDate === date),
    proofs = data.proofs.filter((p) => p.localDate === date && p.receivedAt);
  return (
    <section className="day-challenge">
      <header>
        <h2>{c.rules.title}</h2>
        <span>
          {c.rules.timezone} · {c.rules.opening}–{c.rules.cutoff}
        </span>
        <Link className="st-text-link" to={`/app/challenges/${id}/evidence`}>
          {t('Open proof workspace')}
        </Link>
      </header>
      {(c.rules.gracePolicy ?? 'automatic_v1') === 'automatic_v1' ? (
        <p>
          {t(
            'This challenge keeps its accepted automatic grace policy. Choose grace dates in a new challenge.',
          )}
        </p>
      ) : null}
      {obligations.map((o) => {
        const chosen = data.grace.some((g) => g.obligationId === o.id),
          submitted = data.proofs.some((p) => p.obligationId === o.id && p.receivedAt);
        return (
          <div className="calendar-grace" key={o.id}>
            <p>
              {t(
                chosen
                  ? 'Excused with a grace pass. No photo required.'
                  : 'Use an available grace pass to complete this day without a photo.',
              )}
            </p>
            <Button
              disabled={
                busy ||
                c.status !== 'active' ||
                (c.rules.gracePolicy ?? 'automatic_v1') === 'automatic_v1' ||
                submitted ||
                (!chosen && data.grace.length >= c.rules.graceDays) ||
                (chosen && Date.parse(o.deadlineAt) < Date.now())
              }
              onClick={async () => {
                setBusy(true);
                setActionError('');
                try {
                  await api(`/challenges/${id}/grace/${chosen ? 'cancel' : 'choose'}`, {
                    method: 'POST',
                    body: JSON.stringify({ obligationId: o.id }),
                  });
                  await reload();
                } catch (e) {
                  setActionError(message(e));
                } finally {
                  setBusy(false);
                }
              }}
            >
              {t(chosen ? 'Cancel grace day' : 'Use grace pass')}
            </Button>
            <small>
              {Math.max(0, c.rules.graceDays - data.grace.length)} {t('passes remaining')}
            </small>
          </div>
        );
      })}
      {actionError ? <ErrorMessage message={actionError} /> : null}
      {proofs.length ? (
        proofs.map((p) => (
          <Review
            key={p.id}
            proof={p}
            challengeId={id}
            reload={reload}
            closed={c.status === 'completed'}
          />
        ))
      ) : (
        <p>{t('No photos were submitted for this challenge on this date.')}</p>
      )}
    </section>
  );
}
export function CircleDay() {
  const { id, date = '' } = useParams(),
    { t } = useI18n(),
    { data, error } = useResource<{ name: string; challenges: ChallengeSummary[] }>(
      `/circles/${id}`,
    );
  if (error) return <ErrorMessage message={error} />;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return <ErrorMessage message="Invalid date." />;
  return (
    <div className="circle-day">
      <Link className="back-link" to={`/app/circles/${id}`}>
        {data?.name ?? t('Your circles')}
      </Link>
      <header className="st-page-header">
        <div>
          <h1>{date}</h1>
          <p>{t('Photos, reviews and conversation for this day.')}</p>
        </div>
      </header>
      {!data ? (
        <Loading />
      ) : !data.challenges.some(
          (c) => c.rules.startDate <= date && c.rules.endDate >= date && c.status !== 'cancelled',
        ) ? (
        <p>{t('No challenges are scheduled for this date.')}</p>
      ) : (
        data.challenges
          .filter(
            (c) => c.rules.startDate <= date && c.rules.endDate >= date && c.status !== 'cancelled',
          )
          .map((c) => <DayChallenge key={c.id} id={c.id} date={date} />)
      )}
    </div>
  );
}
