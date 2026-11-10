import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Trophy, RefreshCw } from 'lucide-react';
import type { Competition } from '@stakeup/contracts';
import { useResource, credits } from '../lib/social';
import { api, message } from '../lib/api';
import { Button } from '../components/ui/button';
import { ErrorMessage, Loading } from '../components/common';
import './competition.css';
export function CompetitionPage() {
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
        Back to challenge
      </Link>
      <div className="page-heading">
        <span className="eyebrow">DISCIPLINE HAS A PAPER TRAIL</span>
        <h1>
          {data?.status === 'settled' ? 'The final tally' : 'Your shared momentum'}
          <span>.</span>
        </h1>
        <p>Virtual credits only. No deposits, charges or withdrawals.</p>
      </div>
      {error || actionError ? <ErrorMessage message={error || actionError} /> : null}
      {loading && !data ? <Loading /> : null}
      {data ? (
        <>
          <section className="competition-pool">
            <div>
              <span className="eyebrow">
                {data.status === 'settled' ? 'SETTLED POOL' : 'PROVISIONAL POOL'}
              </span>
              <strong>{credits(data.poolMinor)}</strong>
              <p>
                {data.status === 'settled'
                  ? `${credits(data.distributedMinor)} distributed. Remaining pool: 0.00 VC.`
                  : 'Projected from resolved days. Grace days and caps applied. Review decisions can change these amounts.'}
              </p>
            </div>
            <div>
              <Trophy size={36} />
              <span className="pill">
                {data.status === 'blocked' ? 'Awaiting deadlines / reviews' : data.status}
              </span>
              <p>
                {data.status === 'settled' ? 'Settled at:' : 'Earliest settlement:'}{' '}
                {data.appealClosesAt
                  ? new Date(data.appealClosesAt).toLocaleString()
                  : 'After activation'}
              </p>
              <Button variant="outline" onClick={() => void reload()}>
                <RefreshCw size={16} />
                Refresh standings
              </Button>
              {data.status === 'ready' ? (
                <Button disabled={busy} onClick={() => void settle()}>
                  Finalize virtual results <ArrowUpRight size={16} />
                </Button>
              ) : null}
            </div>
          </section>
          <div className="leaderboard-scroll">
            <table className="leaderboard">
              <caption>
                Standings · ties share rank · eligibility requires 80% completion after grace
              </caption>
              <thead>
                <tr>
                  <th>Rank / participant</th>
                  <th>Completion</th>
                  <th>Streak</th>
                  <th>Missed / grace</th>
                  <th>Virtual penalty</th>
                  <th>
                    {data.status === 'settled' ? 'Reward / refund' : 'Projected reward / refund'}
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
                        {r.pending} unresolved or future days ·{' '}
                        {r.eligible ? 'Eligible' : 'Below threshold'}
                      </small>
                    </th>
                    <td>
                      {r.successful} / {r.scheduled - r.grace}
                      <small>
                        {r.scheduled - r.grace
                          ? Math.round((100 * r.successful) / (r.scheduled - r.grace))
                          : 0}
                        %
                      </small>
                    </td>
                    <td>{r.streak} days</td>
                    <td>
                      {r.missed} / {r.grace}
                    </td>
                    <td>{credits(r.penaltyMinor)}</td>
                    <td>{credits(r.rewardMinor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <section className="settlement-rules">
            <h2>The rules behind the numbers.</h2>
            <p>
              Earliest missed days use grace first. Remaining misses incur the daily penalty up to
              the accepted cap. Only accepted proof counts as success. Pending reviews and disputes
              block final settlement.
            </p>
            <p>
              Eligible participants split the pool in proportion to exact discipline scores.
              Fractions are rounded down, then remaining minor units follow largest fractional
              remainder, with participant UUID as the tie-break. If nobody qualifies, contributions
              are refunded. A zero pool pays zero.
            </p>
            <p>
              Finalization waits for all deadlines, resolved reviews and at least 24 hours since the
              latest review event or final deadline. Scheduled processing checks every five minutes
              when available. Final settlement locks further reviews and releases active
              participation restrictions.
            </p>
          </section>
          <section className="ledger-history">
            <h2>Virtual ledger</h2>
            {data.ledger.length ? (
              data.ledger.map((e) => (
                <div className="ledger-row" key={e.id}>
                  <div>
                    <strong>
                      {data.rows.find((r) => r.userId === e.userId)?.name} · {e.kind}
                    </strong>
                    <p>{e.reason}</p>
                    <small>Transaction {e.id}</small>
                  </div>
                  <span>
                    {e.kind === 'penalty' ? '−' : '+'}
                    {credits(e.amountMinor)}
                  </span>
                </div>
              ))
            ) : (
              <p>
                Amounts remain provisional. Final transactions appear here only when settlement
                completes.
              </p>
            )}
          </section>
        </>
      ) : null}
    </>
  );
}
