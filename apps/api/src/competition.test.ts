import { it, expect } from 'vitest';
import type { CompetitionRow, ChallengeRules, Proof } from '@stakeup/contracts';
import { allocate } from './domain/rewards.js';
import { competitionCommand, type FinanceState } from './local-competition.js';
import { evidenceCommand } from './local-evidence.js';
import { socialCommand } from './local-social.js';
import { schedule } from './domain/challenges.js';
const id = (n: number) => `50000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const rules: ChallengeRules = {
  title: 'Daily reading',
  description: '',
  startDate: '2026-11-01',
  endDate: '2026-11-05',
  timezone: 'UTC',
  weekdays: [0, 1, 2, 3, 4, 5, 6],
  opening: '08:00',
  cutoff: '09:00',
  capturePolicy: 'camera_or_upload',
  evidenceRequirements: 'Share reading notes',
  penaltyMinor: 251,
  maxPenaltyMinor: 501,
  graceDays: 0,
  rewardPolicy: 'discipline_v1',
};
function fixture() {
  const s: FinanceState = {
    accounts: [1, 2, 3, 4].map((n) => ({
      profile: { id: id(n), displayName: `Reader ${n}` } as any,
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
        rules,
        rulesHash: 'hash',
      },
    ],
    enrollments: [1, 2, 3].map((n) => ({
      userId: id(n),
      challengeId: id(11),
      status: 'accepted',
      acceptedAt: '2026-10-30T00:00Z',
      rulesHash: 'hash',
    })),
    invitations: [],
    obligations: [],
    socialEvents: [],
    proofs: [],
  };
  for (let person = 1; person <= 3; person++)
    for (let day = 1; day <= 5; day++) {
      const oid = id(person * 100 + day),
        date = `2026-11-0${day}`;
      s.obligations.push({
        id: oid,
        userId: id(person),
        challengeId: id(11),
        localDate: date,
        deadlineAt: date + 'T09:00Z',
        opensAt: date + 'T08:00Z',
        status: 'pending',
        title: 'Daily reading',
        circleName: 'Crew',
        timezone: 'UTC',
      });
      if (day <= [5, 4, 2][person - 1])
        s.proofs!.push({
          id: id(person * 1000 + day),
          obligationId: oid,
          challengeId: id(11),
          userId: id(person),
          name: `Reader ${person}`,
          localDate: date,
          deadlineAt: date + 'T09:00Z',
          receivedAt: date + 'T08:30Z',
          status: 'accepted',
          source: 'camera',
          note: '',
          path: '',
          review: null,
          votes: [],
          events: [],
          round: 0,
        });
    }
  return s;
}
const now = new Date('2026-11-10T12:00Z');
it('enforces exact opening/closing instants, including daylight-saving shifts', () => {
  const dates = schedule({
    ...rules,
    startDate: '2027-03-14',
    endDate: '2027-03-14',
    timezone: 'America/New_York',
    opening: '01:30',
    cutoff: '03:30',
  });
  expect(dates[0].opensAt).toBe('2027-03-14T06:30:00Z');
  expect(dates[0].deadlineAt).toBe('2027-03-14T07:30:00Z');
  expect(() =>
    schedule({
      ...rules,
      startDate: '2027-03-14',
      endDate: '2027-03-14',
      timezone: 'America/New_York',
      opening: '02:30',
      cutoff: '03:30',
    }),
  ).toThrow(/collapses/);
  const s = fixture();
  s.proofs = [];
  expect(() =>
    evidenceCommand(
      s,
      id(1),
      'reserve',
      { challengeId: id(11), obligationId: id(101), source: 'camera', note: '' },
      new Date('2026-11-01T07:59Z'),
    ),
  ).toThrow(/window/);
  expect(
    evidenceCommand(
      s,
      id(1),
      'reserve',
      { challengeId: id(11), obligationId: id(101), source: 'camera', note: '' },
      new Date('2026-11-01T08:00Z'),
    ),
  ).toBeTruthy();
});
it('conserves integer credits, caps penalties, settles once and releases participation locks', () => {
  const s = fixture();
  const preview = competitionCommand(s, id(1), id(11), false, now);
  expect(preview.status).toBe('ready');
  expect(preview.poolMinor).toBe(752);
  expect(preview.rows.map((r) => r.rewardMinor)).toEqual([418, 334, 0]);
  const settled = competitionCommand(s, id(1), id(11), true, now);
  expect(settled.rows.reduce((n, r) => n + r.rewardMinor, 0)).toBe(752);
  expect(
    settled.ledger.reduce((n, e) => n + (e.kind === 'penalty' ? e.amountMinor : -e.amountMinor), 0),
  ).toBe(0);
  expect(competitionCommand(s, id(2), id(11), true, now).settlementId).toBe(settled.settlementId);
  expect(s.settlements).toHaveLength(1);
  expect(s.challenges[0].status).toBe('completed');
  expect(socialCommand(s, id(2), 'leave', { circleId: id(10) })).toEqual({ ok: true });
  expect(() =>
    evidenceCommand(
      s,
      id(1),
      'dispute',
      { challengeId: id(11), proofId: id(1001), reason: 'Late dispute after results' },
      now,
    ),
  ).toThrow(/completed/);
  expect(() => competitionCommand(s, id(4), id(11), false, now)).toThrow(/not found/);
});
it('blocks pending reviews, disputes and premature settlement', () => {
  for (const status of ['ai_reviewed', 'disputed'] as const) {
    const s = fixture();
    s.proofs![0].status = status;
    expect(() => competitionCommand(s, id(1), id(11), true, now)).toThrow(/Settlement waits/);
    expect(s.settlements).toBeUndefined();
  }
  expect(() =>
    competitionCommand(fixture(), id(1), id(11), true, new Date('2026-11-06T08:59Z')),
  ).toThrow(/24-hour/);
});
it('allocates earliest grace days, refunds nobody-eligible pools and handles zero pools', () => {
  const s = fixture();
  s.challenges[0].rules = { ...rules, graceDays: 1 };
  const r = competitionCommand(s, id(1), id(11), true, now);
  expect(r.poolMinor).toBe(501);
  expect(r.rows.find((r) => r.userId === id(2))!.penaltyMinor).toBe(0);
  expect(r.rows.find((r) => r.userId === id(3))!.grace).toBe(1);
  const none = fixture();
  none.proofs = [];
  const refund = competitionCommand(none, id(1), id(11), true, now);
  expect(refund.rows.every((r) => r.penaltyMinor === r.rewardMinor)).toBe(true);
  expect(refund.ledger.filter((e) => e.kind !== 'penalty').every((e) => e.kind === 'refund')).toBe(
    true,
  );
  const zero = fixture();
  zero.challenges[0].rules = { ...rules, penaltyMinor: 0 };
  expect(competitionCommand(zero, id(1), id(11), true, now).ledger).toEqual([]);
});
it('largest remainders conserve every unit over different exact score denominators', () => {
  for (let pool = 0; pool < 200; pool++) {
    const rows: CompetitionRow[] = [7, 11, 13].map((n, i) => ({
      userId: id(i + 1),
      name: '',
      successful: n - 1,
      scheduled: n,
      grace: 0,
      pending: 0,
      missed: 1,
      streak: 0,
      penaltyMinor: 0,
      rewardMinor: 0,
      eligible: true,
      rank: 0,
    }));
    allocate(pool, rows);
    expect(rows.reduce((n, r) => n + r.rewardMinor, 0)).toBe(pool);
  }
  const tied = [1, 2, 3].map((n) => ({
    userId: id(n),
    name: '',
    successful: 1,
    scheduled: 1,
    grace: 0,
    pending: 0,
    missed: 0,
    streak: 1,
    penaltyMinor: 0,
    rewardMinor: 0,
    eligible: true,
    rank: 0,
  }));
  allocate(2, tied);
  expect(tied.map((r) => r.rewardMinor)).toEqual([1, 1, 0]);
});
