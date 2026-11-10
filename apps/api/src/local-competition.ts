import { randomUUID } from 'node:crypto';
import type { Competition, CompetitionRow, VirtualEntry, GraceChoice } from '@stakeup/contracts';
import type { EvidenceState } from './local-evidence.js';
import { AppError } from './errors.js';
import { allocate } from './domain/rewards.js';
export interface FinanceState extends EvidenceState {
  graceChoices?: GraceChoice[];
  settlements?: {
    id: string;
    challengeId: string;
    createdAt: string;
    ledger: VirtualEntry[];
    rows: CompetitionRow[];
    poolMinor: number;
  }[];
}
export function competitionCommand(
  state: FinanceState,
  uid: string,
  challengeId: string,
  settle = false,
  now = new Date(),
): Competition {
  const h = state.challenges.find((c) => c.id === challengeId);
  if (!h || !state.members.some((m) => m.circleId === h.circleId && m.userId === uid && !m.leftAt))
    throw new AppError(404, 'Challenge not found.');
  const saved = state.settlements?.find((s) => s.challengeId === challengeId);
  if (saved)
    return {
      status: 'settled',
      rows: saved.rows,
      poolMinor: saved.poolMinor,
      distributedMinor: saved.poolMinor,
      ledger: saved.ledger,
      settlementId: saved.id,
      appealClosesAt: saved.createdAt,
    };
  const participants = state.enrollments.filter(
    (e) => e.challengeId === challengeId && e.status === 'accepted',
  );
  const all = state.obligations.filter((o) => o.challengeId === challengeId);
  const proofs = state.proofs ?? [];
  let closes = Math.max(0, ...all.map((o) => Date.parse(o.deadlineAt)));
  for (const s of proofs.filter((s) => s.challengeId === challengeId))
    for (const e of s.events) closes = Math.max(closes, Date.parse(e.createdAt));
  closes += 86400000;
  const ledger: VirtualEntry[] = [];
  const rows = participants.map((p) => {
    const r: CompetitionRow = {
      userId: p.userId,
      name: state.accounts.find((a) => a.profile.id === p.userId)!.profile.displayName,
      successful: 0,
      missed: 0,
      pending: 0,
      grace: 0,
      scheduled: 0,
      streak: 0,
      penaltyMinor: 0,
      rewardMinor: 0,
      eligible: false,
      rank: 0,
    };
    for (const o of all
      .filter((o) => o.userId === p.userId)
      .sort((a, b) => a.localDate.localeCompare(b.localDate))) {
      r.scheduled++;
      if (state.graceChoices?.some((g) => g.obligationId === o.id)) {
        r.grace++;
        continue;
      }
      const s = proofs.find((s) => s.obligationId === o.id);
      if (s?.status === 'accepted') {
        r.successful++;
        r.streak++;
        continue;
      }
      if (
        new Date(o.deadlineAt) > now ||
        (s?.receivedAt && !['accepted', 'rejected'].includes(s.status))
      ) {
        r.pending++;
        if (new Date(o.deadlineAt) <= now) r.streak = 0;
        continue;
      }

      r.missed++;
      r.streak = 0;
      if (
        (h.rules.gracePolicy ?? 'automatic_v1') === 'automatic_v1' &&
        r.grace < h.rules.graceDays
      ) {
        r.grace++;
        continue;
      }
      const amount = Math.min(h.rules.penaltyMinor, h.rules.maxPenaltyMinor - r.penaltyMinor);
      r.penaltyMinor += amount;
      if (amount)
        ledger.push({
          id: randomUUID(),
          userId: p.userId,
          kind: 'penalty',
          amountMinor: amount,
          obligationId: o.id,
          reason: `Missed ${o.localDate}`,
          createdAt: now.toISOString(),
        });
    }
    r.eligible = r.scheduled - r.grace > 0 && r.successful * 100 >= (r.scheduled - r.grace) * 80;
    return r;
  });
  const pool = rows.reduce((n, r) => n + r.penaltyMinor, 0);
  allocate(pool, rows);
  rows.sort(
    (a, b) =>
      b.successful * (a.scheduled - a.grace) - a.successful * (b.scheduled - b.grace) ||
      a.userId.localeCompare(b.userId),
  );
  rows.forEach(
    (r, i) =>
      (r.rank =
        i &&
        r.successful * (rows[i - 1].scheduled - rows[i - 1].grace) ===
          rows[i - 1].successful * (r.scheduled - r.grace)
          ? rows[i - 1].rank
          : i + 1),
  );
  const blocked = rows.some((r) => r.pending > 0),
    ready = h.status === 'active' && !blocked && all.length > 0 && now.getTime() >= closes;
  if (settle) {
    if (!ready)
      throw new AppError(
        409,
        'Settlement waits for every deadline, resolved reviews and the 24-hour appeal period.',
      );
    const refund = !rows.some((r) => r.eligible);
    for (const r of rows)
      if (r.rewardMinor)
        ledger.push({
          id: randomUUID(),
          userId: r.userId,
          kind: refund ? 'refund' : 'reward',
          amountMinor: r.rewardMinor,
          reason: refund ? 'No eligible participant: contribution refund' : 'Discipline reward v1',
          createdAt: now.toISOString(),
        });
    const id = randomUUID();
    (state.settlements ??= []).push({
      id,
      challengeId,
      createdAt: now.toISOString(),
      ledger,
      rows,
      poolMinor: pool,
    });
    h.status = 'completed';
    return {
      status: 'settled',
      rows,
      poolMinor: pool,
      distributedMinor: pool,
      ledger,
      settlementId: id,
      appealClosesAt: new Date(closes).toISOString(),
    };
  }
  return {
    status: blocked ? 'blocked' : ready ? 'ready' : 'provisional',
    rows,
    poolMinor: pool,
    distributedMinor: 0,
    ledger: [],
    settlementId: null,
    appealClosesAt: new Date(closes).toISOString(),
  };
}
