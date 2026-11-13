import type { Wallet, WalletEntry } from '@stakeup/contracts';
import { competitionCommand, type FinanceState } from './local-competition.js';
import { AppError } from './errors.js';

export interface WalletState extends FinanceState {
  topUps?: (WalletEntry & { userId: string; requestId: string })[];
}
export function walletCommand(
  state: WalletState,
  uid: string,
  topUp?: { amountMinor: number; requestId: string },
): Wallet {
  if (topUp) {
    const list = (state.topUps ??= []);
    const previous = list.find((e) => e.userId === uid && e.requestId === topUp.requestId);
    if (previous && previous.amountMinor !== topUp.amountMinor)
      throw new AppError(409, 'This top-up request was already used for a different amount.');
    if (!previous)
      list.push({
        id: topUp.requestId,
        userId: uid,
        requestId: topUp.requestId,
        amountMinor: topUp.amountMinor,
        kind: 'top_up',
        createdAt: new Date().toISOString(),
        reason: 'Balance top-up',
      });
  }
  const entries: WalletEntry[] = [
    ...(state.topUps ?? [])
      .filter((e) => e.userId === uid)
      .map(({ userId, requestId, ...entry }) => entry),
    ...(state.settlements ?? []).flatMap((s) => s.ledger.filter((e) => e.userId === uid)),
  ];
  let pendingPenaltyMinor = 0;
  for (const h of state.challenges.filter(
    (h) =>
      h.status === 'active' &&
      state.members.some((m) => m.circleId === h.circleId && m.userId === uid && !m.leftAt) &&
      state.enrollments.some(
        (e) => e.challengeId === h.id && e.userId === uid && e.status === 'accepted',
      ),
  )) {
    pendingPenaltyMinor +=
      competitionCommand(state, uid, h.id).rows.find((r) => r.userId === uid)?.penaltyMinor ?? 0;
  }
  const balanceMinor = entries.reduce(
    (sum, e) => sum + (e.kind === 'penalty' ? -e.amountMinor : e.amountMinor),
    0,
  );
  return {
    balanceMinor,
    pendingPenaltyMinor,
    entries: entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 30),
  };
}
