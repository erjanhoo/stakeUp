import { randomUUID, randomBytes, createHash } from 'node:crypto';
import type {
  Profile,
  CircleInput,
  ChallengeRules,
  CircleSummary,
  CircleDetail,
  ChallengeSummary,
  ChallengeDetail,
  Obligation,
  SocialAction,
  SocialEvent,
  Participant,
} from '@stakeup/contracts';
import { AppError } from './errors.js';
import { schedule, requireFutureStart, rulesHash, localToday } from './domain/challenges.js';
const hash = (token: string) => createHash('sha256').update(token).digest('hex');
interface Circle extends CircleInput {
  id: string;
  creatorId: string;
  archived: boolean;
}
interface Member {
  circleId: string;
  userId: string;
  joinedAt: string;
  leftAt: string | null;
}
interface Invite {
  circleId: string;
  hash: string;
  expiresAt: string;
  uses: number;
  maxUses: number;
}
interface Challenge {
  id: string;
  circleId: string;
  createdBy: string;
  rules: ChallengeRules;
  rulesHash: string;
  status: ChallengeSummary['status'];
}
interface Enrollment {
  challengeId: string;
  userId: string;
  status: Participant['status'];
  acceptedAt: string;
  rulesHash: string;
}
interface Daily extends Obligation {
  userId: string;
}
interface Event extends SocialEvent {
  circleId: string;
}
export interface SocialState {
  accounts: { profile: Profile }[];
  circles: Circle[];
  members: Member[];
  invitations: Invite[];
  challenges: Challenge[];
  enrollments: Enrollment[];
  obligations: Daily[];
  socialEvents: Event[];
}
export function initializeSocial(state: Partial<SocialState>) {
  state.circles ??= [];
  state.members ??= [];
  state.invitations ??= [];
  state.challenges ??= [];
  state.enrollments ??= [];
  state.obligations ??= [];
  state.socialEvents ??= [];
}
export function socialCommand(
  state: SocialState,
  userId: string,
  action: SocialAction,
  payload: Record<string, unknown>,
) {
  const now = new Date().toISOString();
  const user = state.accounts.find((a) => a.profile.id === userId)!.profile;
  const person = (id: string) => state.accounts.find((a) => a.profile.id === id)!.profile;
  const circleFor = (id: string, owner = false, mutable = false) => {
    const circle = state.circles.find((c) => c.id === id);
    if (
      !circle ||
      !state.members.some((m) => m.circleId === id && m.userId === userId && !m.leftAt)
    )
      throw new AppError(404, 'Circle not found.');
    if (owner && circle.creatorId !== userId)
      throw new AppError(403, 'Only the circle owner can do this.');
    if (mutable && circle.archived) throw new AppError(409, 'This circle is archived.');
    return circle;
  };
  const summary = (circle: Circle): CircleSummary => ({
    ...circle,
    role: circle.creatorId === userId ? 'owner' : 'member',
    memberCount: state.members.filter((m) => m.circleId === circle.id && !m.leftAt).length,
    challengeCount: state.challenges.filter(
      (c) => c.circleId === circle.id && c.status !== 'cancelled',
    ).length,
  });
  const challengeSummary = (c: Challenge): ChallengeSummary => ({
    ...c,
    acceptances: state.members
      .filter((m) => m.circleId === c.circleId && !m.leftAt)
      .map((m) => ({
        userId: m.userId,
        displayName: person(m.userId).displayName,
        status:
          state.enrollments.find((e) => e.challengeId === c.id && e.userId === m.userId)?.status ??
          'not_accepted',
      })),
    circleName: state.circles.find((g) => g.id === c.circleId)!.name,
    acceptedCount: state.enrollments.filter(
      (e) => e.challengeId === c.id && e.status === 'accepted',
    ).length,
    ownStatus:
      state.enrollments.find((e) => e.challengeId === c.id && e.userId === userId)?.status ?? null,
  });
  const event = (circleId: string, kind: string, title: string) =>
    state.socialEvents.push({
      id: randomUUID(),
      circleId,
      kind,
      title,
      actorName: user.displayName,
      createdAt: now,
    });
  const detail = (circle: Circle): CircleDetail => ({
    ...summary(circle),
    members: state.members
      .filter((m) => m.circleId === circle.id && !m.leftAt)
      .map((m) => ({
        userId: m.userId,
        username: person(m.userId).username,
        displayName: person(m.userId).displayName,
        role: circle.creatorId === m.userId ? 'owner' : 'member',
        joinedAt: m.joinedAt,
      })),
    challenges: state.challenges
      .filter((c) => c.circleId === circle.id)
      .map(challengeSummary)
      .reverse(),
    events: state.socialEvents
      .filter((e) => e.circleId === circle.id)
      .slice(-30)
      .reverse()
      .map(({ circleId: _id, ...e }) => e),
  });
  if (action === 'list')
    return state.circles
      .filter((c) =>
        state.members.some((m) => m.circleId === c.id && m.userId === userId && !m.leftAt),
      )
      .map(summary);
  if (action === 'create_circle') {
    if (state.members.filter((m) => m.userId === userId && !m.leftAt).length >= 20)
      throw new AppError(409, 'You can join up to 20 circles.');
    const circle: Circle = {
      ...(payload as unknown as CircleInput),
      id: randomUUID(),
      creatorId: userId,
      archived: false,
    };
    state.circles.push(circle);
    state.members.push({ circleId: circle.id, userId, joinedAt: now, leftAt: null });
    event(circle.id, 'circle_created', 'Created the circle');
    return detail(circle);
  }
  if (action === 'join') {
    const invite = state.invitations.find((i) => i.hash === hash(String(payload.token)));
    const circle = invite && state.circles.find((c) => c.id === invite.circleId && !c.archived);
    if (!invite || !circle || invite.expiresAt <= now || invite.uses >= invite.maxUses)
      throw new AppError(404, 'This invitation is invalid, expired, or full.');
    const existing = state.members.find((m) => m.circleId === circle.id && m.userId === userId);
    if (existing && !existing.leftAt) return { circleId: circle.id };
    if (
      state.members.filter((m) => m.userId === userId && !m.leftAt).length >= 20 ||
      state.members.filter((m) => m.circleId === circle.id && !m.leftAt).length >= 50
    )
      throw new AppError(409, 'The circle or membership limit has been reached.');
    if (existing) {
      existing.leftAt = null;
      existing.joinedAt = now;
    } else state.members.push({ circleId: circle.id, userId, joinedAt: now, leftAt: null });
    invite.uses++;
    event(circle.id, 'member_joined', 'Joined the circle');
    return { circleId: circle.id };
  }
  if (action === 'dashboard') {
    const ids = state.members
      .filter((m) => m.userId === userId && !m.leftAt)
      .map((m) => m.circleId);
    const active = state.challenges.filter(
      (c) =>
        ids.includes(c.circleId) &&
        c.status === 'active' &&
        state.enrollments.some(
          (e) => e.challengeId === c.id && e.userId === userId && e.status === 'accepted',
        ),
    );
    return {
      circleCount: state.circles.filter((c) => ids.includes(c.id) && !c.archived).length,
      activeChallenges: active.length,
      commitments: state.obligations
        .filter(
          (o) =>
            o.userId === userId &&
            o.localDate === localToday(o.timezone) &&
            active.some((c) => c.id === o.challengeId),
        )
        .map(({ userId: _id, ...o }) => o),
    };
  }
  if (
    ['circle', 'update_circle', 'invite', 'leave', 'archive', 'create_challenge'].includes(action)
  ) {
    const circle = circleFor(
      String(payload.circleId),
      ['update_circle', 'invite', 'archive'].includes(action),
      action !== 'circle',
    );
    if (action === 'circle') return detail(circle);
    if (action === 'update_circle') {
      Object.assign(circle, payload.input);
      event(circle.id, 'circle_updated', 'Updated the circle');
      return detail(circle);
    }
    if (action === 'invite') {
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 86400_000).toISOString();
      state.invitations.push({
        circleId: circle.id,
        hash: hash(token),
        expiresAt,
        uses: 0,
        maxUses: 25,
      });
      return { token, expiresAt, maxUses: 25 };
    }
    if (action === 'archive') {
      if (state.challenges.some((c) => c.circleId === circle.id && c.status === 'active'))
        throw new AppError(409, 'Resolve active challenges before archiving.');
      circle.archived = true;
      state.challenges
        .filter((c) => c.circleId === circle.id && c.status === 'proposed')
        .forEach((c) => (c.status = 'cancelled'));
      event(circle.id, 'circle_archived', 'Archived the circle');
      return detail(circle);
    }
    if (action === 'leave') {
      if (circle.creatorId === userId)
        throw new AppError(
          409,
          'The owner must stay with the circle. You can archive it when no challenges are active.',
        );
      if (
        state.enrollments.some(
          (e) =>
            e.userId === userId &&
            e.status === 'accepted' &&
            state.challenges.some(
              (c) =>
                c.id === e.challengeId &&
                c.circleId === circle.id &&
                ['active', 'proposed'].includes(c.status),
            ),
        )
      )
        throw new AppError(
          409,
          'Withdraw from proposed challenges first. Active participants cannot leave.',
        );
      state.members.find(
        (m) => m.circleId === circle.id && m.userId === userId && !m.leftAt,
      )!.leftAt = now;
      event(circle.id, 'member_left', 'Left the circle');
      return { ok: true };
    }
    const rules = payload.rules as ChallengeRules;
    schedule(rules);
    requireFutureStart(rules);
    if (
      state.challenges.filter((c) => c.circleId === circle.id && c.status !== 'cancelled').length >=
      25
    )
      throw new AppError(409, 'A circle can have up to 25 open challenges.');
    const c: Challenge = {
      id: randomUUID(),
      circleId: circle.id,
      createdBy: userId,
      rules,
      rulesHash: rulesHash(rules),
      status: 'proposed',
    };
    state.challenges.push(c);
    event(circle.id, 'challenge_created', `Proposed ${rules.title}`);
    return challengeSummary(c);
  }
  const challenge = state.challenges.find((c) => c.id === payload.challengeId);
  if (!challenge) throw new AppError(404, 'Challenge not found.');
  const circle = circleFor(challenge.circleId, false, action !== 'challenge');
  if (action === 'challenge')
    return {
      ...challengeSummary(challenge),
      canManage: challenge.createdBy === userId || circle.creatorId === userId,
      participants: state.enrollments
        .filter((e) => e.challengeId === challenge.id)
        .map((e) => ({
          userId: e.userId,
          displayName: person(e.userId).displayName,
          username: person(e.userId).username,
          status: e.status,
          acceptedAt: e.acceptedAt,
        })),
      obligations: state.obligations
        .filter((o) => o.challengeId === challenge.id && o.userId === userId)
        .map(({ userId: _id, ...o }) => o),
    } satisfies ChallengeDetail;
  if (challenge.status !== 'proposed')
    throw new AppError(409, 'The challenge rules and roster are locked.');
  requireFutureStart(challenge.rules);
  if (action === 'accept') {
    if (payload.rulesHash !== challenge.rulesHash)
      throw new AppError(409, 'The rules version has changed. Review it again.');
    const existing = state.enrollments.find(
      (e) => e.challengeId === challenge.id && e.userId === userId,
    );
    if (existing?.status === 'accepted') return { ok: true };
    if (existing) {
      existing.status = 'accepted';
      existing.acceptedAt = now;
    } else
      state.enrollments.push({
        challengeId: challenge.id,
        userId,
        status: 'accepted',
        acceptedAt: now,
        rulesHash: challenge.rulesHash,
      });
    event(circle.id, 'rules_accepted', `Accepted the rules for ${challenge.rules.title}`);
    return { ok: true };
  }
  if (action === 'withdraw') {
    const e = state.enrollments.find((e) => e.challengeId === challenge.id && e.userId === userId);
    if (e) e.status = 'withdrawn';
    event(circle.id, 'enrollment_withdrawn', `Withdrew from ${challenge.rules.title}`);
    return { ok: true };
  }
  if (challenge.createdBy !== userId && circle.creatorId !== userId)
    throw new AppError(403, 'Only the proposer or circle owner can manage this challenge.');
  if (action === 'cancel') {
    challenge.status = 'cancelled';
    event(circle.id, 'challenge_cancelled', `Cancelled ${challenge.rules.title}`);
    return { ok: true };
  }
  if (action === 'activate') {
    const participants = state.enrollments.filter(
      (e) => e.challengeId === challenge.id && e.status === 'accepted',
    );
    if (participants.length < 2)
      throw new AppError(409, 'At least two members must accept before activation.');
    for (const p of participants)
      for (const day of schedule(challenge.rules))
        state.obligations.push({
          id: randomUUID(),
          challengeId: challenge.id,
          userId: p.userId,
          title: challenge.rules.title,
          circleName: circle.name,
          timezone: challenge.rules.timezone,
          status: 'pending',
          ...day,
        });
    challenge.status = 'active';
    event(circle.id, 'challenge_activated', `Activated ${challenge.rules.title}`);
    return { ok: true };
  }
  throw new AppError(400, 'Unknown action.');
}
