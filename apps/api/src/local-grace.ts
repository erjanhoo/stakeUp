import type { GraceChoice } from '@stakeup/contracts';
import type { FinanceState } from './local-competition.js';

// Materialize the legacy automatic allowance for the calendar and pool from the
// same source. Explicit choices reserve allowance before automatic allocation.
export function effectiveGrace(
  state: FinanceState,
  challengeId: string,
  uid: string,
  now = new Date(),
): GraceChoice[] {
  const h = state.challenges.find((c) => c.id === challengeId);
  const chosen = (state.graceChoices ?? []).filter(
    (g) => g.challengeId === challengeId && g.userId === uid,
  );
  if (!h || (h.rules.gracePolicy ?? 'automatic_v1') !== 'automatic_v1') return chosen;
  const missed = state.obligations
    .filter(
      (o) =>
        o.challengeId === challengeId &&
        o.userId === uid &&
        new Date(o.deadlineAt) <= now &&
        !chosen.some((g) => g.obligationId === o.id) &&
        !(state.proofs ?? []).some(
          (p) => p.obligationId === o.id && p.receivedAt && p.status !== 'rejected',
        ),
    )
    .sort((a, b) => a.localDate.localeCompare(b.localDate));
  return [
    ...chosen,
    ...missed
      .slice(0, Math.max(0, h.rules.graceDays - chosen.length))
      .map((o) => ({ obligationId: o.id, challengeId, userId: uid, chosenAt: o.deadlineAt })),
  ];
}
