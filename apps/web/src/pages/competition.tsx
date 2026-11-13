import { About } from '../components/about';
import { useMoney } from '../lib/money';
import { useI18n } from '../lib/i18n';
import { PoolMark, CompletionCelebration } from '../components/community';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Trophy, RefreshCw, Clock3, ShieldCheck } from 'lucide-react';
import type { Competition } from '@stakeup/contracts';
import { useResource } from '../lib/social';
import { api, message } from '../lib/api';
import { Button } from '../components/ui/button';
import { ErrorMessage, Loading } from '../components/common';
import './competition.css';
export function CompetitionPage() {
  const money = useMoney();
  const { t, language } = useI18n();

  const { id } = useParams(),
    { data, error, loading, reload } = useResource<Competition>(`/challenges/${id}/competition`);
  const [busy, setBusy] = useState(false),
    [actionError, setActionError] = useState('');
  async function settle() {
    setBusy(true);
    setActionError('');
    try {
      await api(`/challenges/${id}/competition`, { method: 'POST' });
      await reload();
    } catch (e) {
      setActionError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Link className="back-link" to={`/app/challenges/${id}`}>
        <ArrowLeft size={16} />
        {t('Back to challenge')}{' '}
      </Link>
      <div className="page-heading">
        <span className="eyebrow">{t('DISCIPLINE HAS A PAPER TRAIL')}</span>
        <h1>
          {data?.status === 'settled' ? t('The final tally') : t('Your shared momentum')}
          <span>.</span>
        </h1>
        <p>{t('Every commitment counts. See how your circle is doing.')}</p>
      </div>
      <nav className="kinetic-tabs" aria-label={t('Competition sections')}>
        <a href="#standings">{t('Standings')}</a>
        <a href="#virtual-pool">{t('Shared pool')}</a>
        <a href="#virtual-ledger">{t('Pool activity')}</a>
        <a href="#reward-rules">{t('Rules')}</a>
      </nav>
      {error || actionError ? <ErrorMessage message={error || actionError} /> : null}
      {loading && !data ? <Loading /> : null}
      {data ? (
        <div className="st-competition-layout">
          {data.status === 'settled' ? <CompletionCelebration /> : null}
          <section className="competition-pool" id="virtual-pool">
            <div>
              <span className="eyebrow">
                {data.status === 'settled' ? t('SETTLED POOL') : t('PROVISIONAL POOL')}
              </span>
              <strong>{money(data.poolMinor)}</strong>
              <p>
                {data.status === 'settled'
                  ? `${money(data.distributedMinor)} ${t('distributed. Remaining pool:')} ${money(0)}`
                  : t(
                      'Misses contribute after grace and caps. Submitted proof awaits a review decision before contributing. Amounts update as decisions change.',
                    )}
              </p>
            </div>
            <div>
              <PoolMark size={38} />
              <span className="pill">
                {data.status === 'blocked' ? t('Awaiting deadlines / reviews') : t(data.status)}
              </span>
              <p>
                {data.status === 'settled' ? t('Settled at:') : t('Earliest settlement:')}{' '}
                {data.appealClosesAt
                  ? new Date(data.appealClosesAt).toLocaleString(language)
                  : t('After activation')}
              </p>
              <Button variant="outline" onClick={() => void reload()}>
                <RefreshCw size={16} />
                {t('Refresh standings')}{' '}
              </Button>
              {data.status === 'ready' ? (
                <Button disabled={busy} onClick={() => void settle()}>
                  {t('Finalize results')} <ArrowUpRight size={16} />
                </Button>
              ) : null}
            </div>
          </section>
          <aside className="st-settlement-engine">
            <span className="st-eyebrow">{t('Settlement lifecycle')}</span>
            <h2>{t('Before final results')}</h2>
            <div className="st-settlement-states">
              {['blocked', 'ready', 'settled'].map((state) => (
                <span key={state} className={data.status === state ? 'current' : ''}>
                  {t(state)}
                </span>
              ))}
            </div>
            <ul>
              <li>
                <Clock3 size={18} />
                <span>{t('All scheduled deadlines must pass.')}</span>
              </li>
              <li>
                <ShieldCheck size={18} />
                <span>{t('All reviews and disputes must be resolved.')}</span>
              </li>
              <li>
                <Clock3 size={18} />
                <span>{t('The 24-hour appeal period must finish.')}</span>
              </li>
            </ul>
            <p>{t('The server determines when finalization is ready.')}</p>
          </aside>
          <div className="leaderboard-scroll" id="standings">
            <table className="leaderboard">
              <caption>
                {t(
                  'Standings · ties share rank · eligibility requires 80% completion after grace',
                )}{' '}
              </caption>
              <thead>
                <tr>
                  <th>{t('Rank / participant')}</th>
                  <th>{t('Completion')}</th>
                  <th>{t('Streak')}</th>
                  <th>{t('Missed / grace')}</th>
                  <th>{t('Stake')}</th>
                  <th>
                    {data.status === 'settled'
                      ? t('Reward / refund')
                      : t('Projected reward / refund')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.userId}>
                    <th>
                      <span className="rank">{r.rank}</span>
                      {r.name}
                      <small>
                        {r.pending} {t('unresolved or future days ·')}{' '}
                        {r.eligible ? t('Eligible') : t('Below threshold')}
                      </small>
                    </th>
                    <td data-label={t('Completion')}>
                      {r.successful} / {r.scheduled - r.grace}
                      <small>
                        {r.scheduled - r.grace
                          ? Math.round((100 * r.successful) / (r.scheduled - r.grace))
                          : 0}
                        %
                      </small>
                    </td>
                    <td data-label={t('Streak')}>
                      {r.streak} {t('days')}
                    </td>
                    <td data-label={t('Missed / grace')}>
                      {r.missed} / {r.grace}
                    </td>
                    <td data-label={t('Stake')}>{money(r.penaltyMinor)}</td>
                    <td data-label={t('Reward / refund')}>{money(r.rewardMinor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <section className="settlement-rules" id="reward-rules">
            <About title="About the pool and rewards">
              <h2>{t('The rules behind the numbers.')}</h2>
              <p>
                {t(
                  'Grace follows your accepted challenge rules: choose your dates, or let older challenges excuse the earliest misses automatically. Remaining misses incur penalties up to the cap. Only accepted proof counts as success. Pending reviews and disputes block final settlement.',
                )}{' '}
              </p>
              <p>
                {t(
                  'Eligible participants split the pool in proportion to exact discipline scores. Fractions are rounded down, then remaining minor units follow largest fractional remainder, with participant UUID as the tie-break. If nobody qualifies, contributions are refunded. A zero pool pays zero.',
                )}{' '}
              </p>
              <p>
                {t(
                  'Finalization waits for all deadlines, resolved reviews and at least 24 hours since the latest review event or final deadline. Scheduled processing checks every five minutes when available. Final settlement locks further reviews and releases active participation restrictions.',
                )}{' '}
              </p>
            </About>
          </section>
          <section className="ledger-history" id="virtual-ledger">
            <h2>{t('Pool activity')}</h2>
            {data.status !== 'settled' && (
              <p className="st-muted">
                {t(
                  'These are pending contributions. Final transactions are recorded at settlement.',
                )}
              </p>
            )}
            {data.ledger.length ? (
              data.ledger.map((e) => (
                <div className="ledger-row" key={e.id}>
                  <div>
                    <strong>
                      {data.rows.find((r) => r.userId === e.userId)?.name} · {t(e.kind)}
                    </strong>
                    <p>{t(e.reason)}</p>
                    <small>
                      {t('Transaction')} {e.id}
                    </small>
                  </div>
                  <span>
                    {e.kind === 'penalty' ? '−' : '+'}
                    {money(e.amountMinor)}
                  </span>
                </div>
              ))
            ) : (
              <p>
                {t(
                  'No stakes have been added yet. Grace days are excused, and submitted photos awaiting review are kept separate.',
                )}{' '}
              </p>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
