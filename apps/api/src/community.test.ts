import { expect, it } from 'vitest';
import { challengeSchema } from '@stakeup/contracts';
import {
  communityCommand,
  emitCommunityNotifications,
  type CommunityState,
} from './local-community.js';
import { competitionCommand } from './local-competition.js';
import { evidenceCommand } from './local-evidence.js';

const now = new Date('2026-11-10T08:30Z');
const id = (n: number) => `70000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
function fixture(): CommunityState {
  return {
    accounts: [1, 2, 3, 4].map((n) => ({
      profile: { id: id(n), displayName: `Person ${n}`, timezone: 'Asia/Bishkek' } as any,
    })),
    circles: [
      {
        id: id(10),
        creatorId: id(1),
        name: 'Crew',
        description: '',
        icon: 'book',
        archived: false,
      },
    ],
    members: [1, 2, 3].map((n) => ({
      circleId: id(10),
      userId: id(n),
      joinedAt: '2026-11-01T00:00Z',
      leftAt: null,
    })),
    challenges: [
      {
        id: id(11),
        circleId: id(10),
        createdBy: id(1),
        status: 'active',
        rulesHash: 'hash',
        rules: challengeSchema.parse({
          title: 'Read together',
          description: '',
          capturePolicy: 'camera_or_upload',
          startDate: '2026-11-10',
          endDate: '2026-11-12',
          timezone: 'UTC',
          weekdays: [0, 1, 2, 3, 4, 5, 6],
          opening: '08:00',
          cutoff: '09:00',
          evidenceRequirements: 'Share notes',
          penaltyMinor: 100,
          maxPenaltyMinor: 300,
          graceDays: 1,
        }),
      },
    ],
    enrollments: [1, 2, 3].map((n) => ({
      userId: id(n),
      challengeId: id(11),
      status: 'accepted',
      acceptedAt: '2026-11-01T00:00Z',
      rulesHash: 'hash',
    })),
    obligations: [1, 2, 3].flatMap((n) =>
      [10, 11, 12].map((day) => ({
        id: id(n * 100 + day),
        userId: id(n),
        challengeId: id(11),
        localDate: `2026-11-${day}`,
        deadlineAt: `2026-11-${day}T09:00Z`,
        opensAt: `2026-11-${day}T08:00Z`,
        status: 'pending' as const,
        title: 'Read together',
        circleName: 'Crew',
        timezone: 'UTC',
      })),
    ),
    invitations: [],
    socialEvents: [],
    proofs: [],
  };
}
const grace = (s: CommunityState, action: string, oid = id(110), uid = id(1), time = now) =>
  communityCommand(s, uid, action, { challengeId: id(11), obligationId: oid }, time);
it('chooses only owned days before the deadline, enforces allowance, permits cancellation, and blocks uploads', () => {
  const s = fixture();
  expect(s.challenges[0].rules).toMatchObject({
    gracePolicy: 'chosen_v1',
    rewardPolicy: 'discipline_v2',
  });
  grace(s, 'grace_choose');
  grace(s, 'grace_choose');
  expect(grace(s, 'grace_list')).toHaveLength(1);
  expect(() => grace(s, 'grace_choose', id(111))).toThrow(/allowance/);
  expect(() => grace(s, 'grace_choose', id(210))).toThrow(/own grace/);
  expect(() => grace(s, 'grace_cancel', id(110), id(1), new Date('2026-11-10T09:01Z'))).toThrow(
    /deadline/,
  );
  expect(() =>
    evidenceCommand(
      s,
      id(1),
      'reserve',
      { challengeId: id(11), obligationId: id(110), source: 'upload', note: 'Notes' },
      now,
    ),
  ).toThrow(/excused/);
  grace(s, 'grace_cancel');
  expect(grace(s, 'grace_list')).toEqual([]);
  expect(() =>
    evidenceCommand(
      s,
      id(1),
      'reserve',
      { challengeId: id(11), obligationId: id(110), source: 'upload', note: 'Notes' },
      now,
    ),
  ).not.toThrow();
  grace(s, 'grace_choose');
  expect(() =>
    evidenceCommand(s, id(1), 'finish', { challengeId: id(11), proofId: s.proofs![0].id }, now),
  ).toThrow(/excused/);
});
it('preserves legacy rules and never silently assigns unused chosen grace; balanced settlement excludes selected days', () => {
  const s = fixture();
  s.challenges[0].rules = {
    ...s.challenges[0].rules,
    rewardPolicy: 'discipline_v1',
    gracePolicy: 'automatic_v1',
  };
  expect(() => grace(s, 'grace_choose')).toThrow(/original automatic/);
  s.challenges[0].rules = {
    ...s.challenges[0].rules,
    rewardPolicy: 'discipline_v2',
    gracePolicy: 'chosen_v1',
  };
  grace(s, 'grace_choose');
  const final = competitionCommand(s, id(1), id(11), true, new Date('2026-11-14T12:00Z'));
  expect(final.poolMinor).toBe(800);
  expect(final.rows.find((r) => r.userId === id(1))).toMatchObject({
    grace: 1,
    missed: 2,
    penaltyMinor: 200,
    scheduled: 3,
  });
  expect(final.rows.find((r) => r.userId === id(2))).toMatchObject({
    grace: 0,
    missed: 3,
    penaltyMinor: 300,
  });
  expect(
    final.ledger.reduce(
      (sum, e) => sum + (e.kind === 'penalty' ? e.amountMinor : -e.amountMinor),
      0,
    ),
  ).toBe(0);
});
function submitted(s: CommunityState) {
  s.proofs = [
    {
      id: id(30),
      challengeId: id(11),
      obligationId: id(110),
      userId: id(1),
      name: 'Person 1',
      localDate: '2026-11-10',
      deadlineAt: '2026-11-10T09:00Z',
      receivedAt: '2026-11-10T08:15Z',
      path: 'private.jpg',
      source: 'camera',
      status: 'ai_reviewed',
      note: '',
      review: null,
      votes: [],
      round: 0,
      events: [
        {
          kind: 'ai_reviewed',
          actorId: id(1),
          createdAt: now.toISOString(),
          reason: 'Needs review',
        },
      ],
    },
  ];
  return { challengeId: id(11), proofId: id(30) };
}
it('keeps comments private, enforces ownership and treats reactions as encouragement only', () => {
  const s = fixture(),
    p = submitted(s);
  const social = (uid: string, action: string, extra = {}) =>
    communityCommand(s, uid, action, { ...p, ...extra }, now);
  expect(() => social(id(4), 'social')).toThrow(/not found/);
  social(id(2), 'comment', { body: '<script>plain text only</script>' });
  social(id(2), 'react', { emoji: 'clap' });
  expect(s.proofs![0]).toMatchObject({ status: 'ai_reviewed', votes: [] });
  expect(social(id(1), 'social').reactions[0]).toMatchObject({ count: 1, own: false });
  expect(() => social(id(1), 'delete_comment', { id: s.comments![0].id })).toThrow(/own comments/);
  social(id(2), 'delete_comment', { id: s.comments![0].id });
  expect(s.comments![0]).toMatchObject({ body: '', deleted: true });
  social(id(2), 'react', { emoji: 'clap' });
  expect(social(id(2), 'social').reactions[0].count).toBe(0);
  expect(() => grace(s, 'grace_choose')).toThrow(/already submitted/);
});
it('deduplicates notifications, isolates read state and produces timezone-aware monthly recaps', () => {
  const s = fixture();
  submitted(s);
  s.proofs![0].receivedAt = '2026-10-31T17:00Z'; // October in Bishkek (23:00).
  emitCommunityNotifications(s, now);
  emitCommunityNotifications(s, now);
  const own = communityCommand(s, id(1), 'notifications', {}, now);
  expect(own.filter((n: any) => n.kind === 'recap')).toHaveLength(1);
  expect(own.find((n: any) => n.kind === 'recap').payload).toMatchObject({
    month: '2026-10',
    submitted: 1,
  });
  const peer = communityCommand(s, id(2), 'notifications', {}, now);
  expect(peer.filter((n: any) => n.kind === 'review')).toHaveLength(1);
  communityCommand(s, id(1), 'read', { id: peer[0].id }, now);
  expect(communityCommand(s, id(2), 'notifications', {}, now)[0].readAt).toBeNull();
  communityCommand(s, id(2), 'read', {}, now);
  expect(communityCommand(s, id(2), 'notifications', {}, now).every((n: any) => n.readAt)).toBe(
    true,
  );
  expect(communityCommand(s, id(4), 'notifications', {}, now)).toEqual([]);
});

it('consumes a pass once for a missed day, removes its provisional penalty and locks past cancellation/final results', () => {
  const s = fixture(),
    late = new Date('2026-11-10T10:00Z');
  expect(
    competitionCommand(s, id(1), id(11), false, late).rows.find((r) => r.userId === id(1))
      ?.penaltyMinor,
  ).toBe(100);
  grace(s, 'grace_choose', id(110), id(1), late);
  grace(s, 'grace_choose', id(110), id(1), late);
  expect(grace(s, 'grace_list')).toHaveLength(1);
  expect(
    competitionCommand(s, id(1), id(11), false, late).rows.find((r) => r.userId === id(1))
      ?.penaltyMinor,
  ).toBe(0);
  expect(() => grace(s, 'grace_choose', id(111), id(1), late)).toThrow(/allowance/);
  expect(() => grace(s, 'grace_cancel', id(110), id(1), late)).toThrow(/deadline/);
  s.challenges[0].status = 'completed';
  expect(() => grace(s, 'grace_choose', id(112), id(1), late)).toThrow(/own grace/);
});
