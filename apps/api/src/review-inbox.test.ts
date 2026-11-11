import { expect, it } from 'vitest';
import type { Proof } from '@stakeup/contracts';
import type { EvidenceState } from './local-evidence.js';
import { reviewInbox } from './review-inbox.js';
const id = (n: number) => `91000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
function fixture(): EvidenceState {
  return {
    accounts: [],
    circles: [{ id: id(10), name: 'Crew' }],
    challenges: [
      { id: id(20), circleId: id(10), status: 'active', rules: { title: 'Read', timezone: 'UTC' } },
    ],
    members: [1, 2, 3].map((n) => ({ circleId: id(10), userId: id(n), leftAt: null })),
    enrollments: [1, 2].map((n) => ({ challengeId: id(20), userId: id(n), status: 'accepted' })),
    obligations: [],
    invitations: [],
    socialEvents: [],
    proofs: [100, 101, 102].map((n) => ({
      id: id(n),
      challengeId: id(20),
      userId: id(1),
      receivedAt: '2026-11-11T08:00:00Z',
      status: 'ai_reviewed',
      round: 0,
      votes: [],
      events: [],
    })),
  } as unknown as EvidenceState;
}
it('shows only active, enrolled, private, other-user rounds still needing this vote', () => {
  const s = fixture();
  s.proofs![1].status = 'disputed';
  s.proofs![1].round = 1;
  s.proofs![1].votes = [{ userId: id(2), round: 0 } as Proof['votes'][number]];
  s.proofs![2].votes = [{ userId: id(2), round: 0 } as Proof['votes'][number]];
  const result = reviewInbox(s, id(2), { filter: 'all', limit: 20 });
  expect(result.items.map((i) => i.proof.id)).toEqual([id(100), id(101)]);
  expect(result.counts).toEqual({ pending: 1, disputed: 1 });
  expect(reviewInbox(s, id(1), { filter: 'all', limit: 20 }).items).toHaveLength(0);
  expect(reviewInbox(s, id(3), { filter: 'all', limit: 20 }).items).toHaveLength(0);
  expect(reviewInbox(s, id(4), { filter: 'all', limit: 20 }).items).toHaveLength(0);
  s.members.find((m) => m.userId === id(2))!.leftAt = '2026-11-11T09:00:00Z';
  expect(reviewInbox(s, id(2), { filter: 'all', limit: 20 }).items).toHaveLength(0);
  s.members.find((m) => m.userId === id(2))!.leftAt = null;
  s.challenges[0].status = 'completed';
  expect(reviewInbox(s, id(2), { filter: 'all', limit: 20 }).items).toHaveLength(0);
});
it('paginates timestamp ties deterministically and keeps counts independent of the filter/page', () => {
  const s = fixture();
  s.proofs![2].status = 'disputed';
  s.proofs![2].round = 1;
  const first = reviewInbox(s, id(2), { filter: 'all', limit: 1 });
  expect(first.nextCursor?.id).toBe(id(100));
  const next = reviewInbox(s, id(2), { filter: 'all', limit: 2, after: first.nextCursor! });
  expect(next.items.map((i) => i.proof.id)).toEqual([id(101), id(102)]);
  expect(next.nextCursor).toBeNull();
  expect(next.counts).toEqual({ pending: 2, disputed: 1 });
  expect(
    reviewInbox(s, id(2), { filter: 'disputed', limit: 20 }).items.map((i) => i.proof.id),
  ).toEqual([id(102)]);
  s.proofs![0].status = 'accepted';
  s.proofs![1].receivedAt = null;
  expect(reviewInbox(s, id(2), { filter: 'pending', limit: 20 }).items).toHaveLength(0);
});
