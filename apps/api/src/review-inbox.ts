import type { ReviewCursor, ReviewFilter, ReviewInbox, ReviewTask } from '@stakeup/contracts';
import type { EvidenceState } from './local-evidence.js';

export interface InboxInput {
  filter: ReviewFilter;
  limit: number;
  after?: ReviewCursor;
}
export function reviewInbox(state: EvidenceState, uid: string, input: InboxInput): ReviewInbox {
  const items: ReviewTask[] = [];
  for (const proof of state.proofs ?? []) {
    if (
      !proof.receivedAt ||
      proof.userId === uid ||
      !['ai_reviewed', 'disputed'].includes(proof.status)
    )
      continue;
    const challenge = state.challenges.find((c) => c.id === proof.challengeId);
    if (
      !challenge ||
      challenge.status !== 'active' ||
      !state.members.some(
        (m) => m.circleId === challenge.circleId && m.userId === uid && !m.leftAt,
      ) ||
      !state.enrollments.some(
        (e) => e.challengeId === challenge.id && e.userId === uid && e.status === 'accepted',
      ) ||
      proof.votes.some((v) => v.userId === uid && v.round === proof.round)
    )
      continue;
    const circle = state.circles.find((c) => c.id === challenge.circleId)!;
    items.push({
      proof,
      circleId: circle.id,
      circleName: circle.name,
      challengeTitle: challenge.rules.title,
      timezone: challenge.rules.timezone,
    });
  }
  items.sort(
    (a, b) =>
      Date.parse(a.proof.receivedAt!) - Date.parse(b.proof.receivedAt!) ||
      (a.proof.id < b.proof.id ? -1 : a.proof.id > b.proof.id ? 1 : 0),
  );
  const counts = {
    pending: items.filter((i) => i.proof.status === 'ai_reviewed').length,
    disputed: items.filter((i) => i.proof.status === 'disputed').length,
  };
  const filtered = items.filter(
    ({ proof: p }) =>
      (input.filter === 'all' ||
        p.status === (input.filter === 'pending' ? 'ai_reviewed' : 'disputed')) &&
      (!input.after ||
        Date.parse(p.receivedAt!) > Date.parse(input.after.receivedAt) ||
        (Date.parse(p.receivedAt!) === Date.parse(input.after.receivedAt) &&
          p.id > input.after.id)),
  );
  const page = filtered.slice(0, input.limit),
    last = page.at(-1)?.proof;
  return {
    items: page,
    counts,
    nextCursor:
      filtered.length > page.length && last ? { receivedAt: last.receivedAt!, id: last.id } : null,
  };
}
