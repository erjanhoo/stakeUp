import { randomUUID } from 'node:crypto';
import type { AppNotification, ProofComment, ProofSocial, PersonalRecap } from '@stakeup/contracts';
import type { FinanceState } from './local-competition.js';
import { AppError } from './errors.js';
export interface CommunityState extends FinanceState {
  notifications?: (AppNotification & { userId: string; key: string })[];
  comments?: (ProofComment & { proofId: string })[];
  reactions?: { proofId: string; userId: string; emoji: 'clap' | 'fire' | 'heart' }[];
}
export function notify(
  state: CommunityState,
  userId: string,
  key: string,
  kind: string,
  challengeId: string | null,
  circleId: string | null,
  payload: Record<string, string | number> = {},
  now = new Date(),
) {
  const list = (state.notifications ??= []);
  if (!list.some((n) => n.userId === userId && n.key === key))
    list.push({
      id: randomUUID(),
      userId,
      key,
      kind,
      challengeId,
      circleId,
      payload,
      createdAt: now.toISOString(),
      readAt: null,
    });
}
export function emitCommunityNotifications(state: CommunityState, now = new Date()) {
  for (const o of state.obligations) {
    const h = state.challenges.find((h) => h.id === o.challengeId);
    if (h?.status !== 'active' || state.graceChoices?.some((g) => g.obligationId === o.id))
      continue;
    const p = state.proofs?.find((p) => p.obligationId === o.id);
    if (!p?.receivedAt) {
      const delta = Date.parse(o.deadlineAt) - now.getTime();
      if (delta > 0 && delta <= 3600000)
        notify(
          state,
          o.userId,
          `deadline:${o.id}`,
          'deadline',
          h.id,
          h.circleId,
          { title: h.rules.title, date: o.localDate },
          now,
        );
      if (delta <= 0)
        notify(
          state,
          o.userId,
          `missed:${o.id}`,
          'missed',
          h.id,
          h.circleId,
          { title: h.rules.title, date: o.localDate },
          now,
        );
    }
  }
  for (const p of state.proofs ?? []) {
    const h = state.challenges.find((h) => h.id === p.challengeId)!;
    for (const [eventIndex, event] of p.events.entries()) {
      if (['ai_reviewed', 'disputed'].includes(event.kind))
        for (const e of state.enrollments.filter(
          (e) => e.challengeId === h.id && e.status === 'accepted' && e.userId !== p.userId,
        ))
          notify(
            state,
            e.userId,
            `${p.id}:${eventIndex}:${event.kind}`,
            'review',
            h.id,
            h.circleId,
            { title: h.rules.title },
            new Date(event.createdAt),
          );
      if (['accepted', 'rejected', 'disputed'].includes(event.kind))
        notify(
          state,
          p.userId,
          `${p.id}:${eventIndex}:${event.kind}`,
          event.kind,
          h.id,
          h.circleId,
          { title: h.rules.title, reason: event.reason },
          new Date(event.createdAt),
        );
    }
  }
  for (const e of state.enrollments) {
    const h = state.challenges.find((h) => h.id === e.challengeId)!;
    if (h.status === 'active' && e.status === 'accepted')
      notify(
        state,
        e.userId,
        `active:${h.id}`,
        'activated',
        h.id,
        h.circleId,
        { title: h.rules.title },
        now,
      );
  }
  for (const result of state.settlements ?? [])
    for (const row of result.rows) {
      const h = state.challenges.find((h) => h.id === result.challengeId)!;
      notify(
        state,
        row.userId,
        `settled:${h.id}`,
        'completed',
        h.id,
        h.circleId,
        { title: h.rules.title, reward: row.rewardMinor },
        new Date(result.createdAt),
      );
    }
  for (const h of state.challenges) {
    if (h.status !== 'proposed') continue;
    const event = state.socialEvents.find(
      (e) =>
        e.circleId === h.circleId &&
        e.kind === 'challenge_created' &&
        e.title === `Proposed ${h.rules.title}`,
    );
    if (!event) continue;
    for (const m of state.members.filter(
      (m) => m.circleId === h.circleId && !m.leftAt && m.joinedAt <= event.createdAt,
    ))
      notify(
        state,
        m.userId,
        `proposal:${h.id}`,
        'proposal',
        h.id,
        h.circleId,
        { title: h.rules.title },
        new Date(event.createdAt),
      );
  }
  for (const { profile } of state.accounts) {
    const date = new Intl.DateTimeFormat('en-CA', {
      timeZone: profile.timezone,
      year: 'numeric',
      month: '2-digit',
    }).formatToParts(now);
    const year = Number(date.find((p) => p.type === 'year')!.value),
      month = Number(date.find((p) => p.type === 'month')!.value);
    const previous = new Date(Date.UTC(year, month - 2, 1)).toISOString().slice(0, 7);
    const monthOf = (instant: string) => {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: profile.timezone,
        year: 'numeric',
        month: '2-digit',
      }).formatToParts(new Date(instant));
      return `${parts.find((p) => p.type === 'year')!.value}-${parts.find((p) => p.type === 'month')!.value}`;
    };
    const own = (state.proofs ?? []).filter(
      (p) => p.userId === profile.id && p.receivedAt && monthOf(p.receivedAt) === previous,
    );
    if (own.length)
      notify(
        state,
        profile.id,
        `recap:${previous}`,
        'recap',
        null,
        null,
        {
          month: previous,
          submitted: own.length,
          accepted: own.filter((p) => p.status === 'accepted').length,
        },
        now,
      );
  }
}
export function communityCommand(
  state: CommunityState,
  uid: string,
  action: string,
  p: Record<string, any>,
  now = new Date(),
): any {
  emitCommunityNotifications(state, now);
  if (action === 'notifications')
    return (state.notifications ?? [])
      .filter((n) => n.userId === uid)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 100)
      .map(({ userId, key, ...n }) => n);
  if (action === 'read') {
    for (const n of state.notifications ?? [])
      if (n.userId === uid && (!p.id || n.id === p.id)) n.readAt ??= now.toISOString();
    return { ok: true };
  }
  if (action === 'recap') {
    const own = (state.proofs ?? []).filter((s) => s.userId === uid && s.receivedAt),
      accepted = own.filter((s) => s.status === 'accepted').length,
      completed = (state.settlements ?? []).filter((s) =>
        s.rows.some((r) => r.userId === uid),
      ).length;
    return {
      accepted,
      submitted: own.length,
      completed,
      achievements: [
        ...(accepted >= 1 ? ['first_proof'] : []),
        ...(accepted >= 7 ? ['seven_proofs'] : []),
        ...(accepted >= 30 ? ['thirty_proofs'] : []),
        ...(completed ? ['first_finish'] : []),
      ],
    } satisfies PersonalRecap;
  }
  const h = state.challenges.find((c) => c.id === p.challengeId);
  if (!h || !state.members.some((m) => m.circleId === h.circleId && m.userId === uid && !m.leftAt))
    throw new AppError(404, 'Challenge not found.');
  if (action.startsWith('grace')) {
    if (action === 'grace_list')
      return (state.graceChoices ?? []).filter((g) => g.challengeId === h.id && g.userId === uid);
    const o = state.obligations.find(
      (o) => o.id === p.obligationId && o.challengeId === h.id && o.userId === uid,
    );
    if (
      !o ||
      h.status !== 'active' ||
      !state.enrollments.some(
        (e) => e.challengeId === h.id && e.userId === uid && e.status === 'accepted',
      )
    )
      throw new AppError(403, 'Only enrolled participants can choose their own grace days.');
    if ((h.rules.gracePolicy ?? 'automatic_v1') !== 'chosen_v1')
      throw new AppError(409, 'This challenge uses its original automatic grace policy.');
    if (action === 'grace_cancel' && now > new Date(o.deadlineAt))
      throw new AppError(409, 'Choose or cancel a grace day before its upload deadline.');
    const choices = (state.graceChoices ??= []);
    if (action === 'grace_cancel') {
      state.graceChoices = choices.filter((g) => g.obligationId !== o.id);
      return { ok: true };
    }
    if (choices.some((g) => g.obligationId === o.id)) return { ok: true };
    if ((state.proofs ?? []).some((s) => s.obligationId === o.id && s.receivedAt))
      throw new AppError(409, 'Proof is already submitted for this day.');
    if (
      choices.filter((g) => g.challengeId === h.id && g.userId === uid).length >= h.rules.graceDays
    )
      throw new AppError(409, 'Your grace-day allowance is used up.');
    choices.push({
      obligationId: o.id,
      challengeId: h.id,
      userId: uid,
      chosenAt: now.toISOString(),
    });
    notify(state, uid, `grace:${o.id}`, 'grace', h.id, h.circleId, { date: o.localDate }, now);
    return { ok: true };
  }
  const proof = (state.proofs ?? []).find((s) => s.id === p.proofId && s.challengeId === h.id);
  if (!proof?.receivedAt) throw new AppError(404, 'Submitted proof not found.');
  if (action === 'comment') {
    (state.comments ??= []).push({
      id: randomUUID(),
      proofId: proof.id,
      userId: uid,
      name: state.accounts.find((a) => a.profile.id === uid)!.profile.displayName,
      body: p.body,
      createdAt: now.toISOString(),
      deleted: false,
    });
    if (proof.userId !== uid)
      notify(
        state,
        proof.userId,
        randomUUID(),
        'comment',
        h.id,
        h.circleId,
        { title: h.rules.title },
        now,
      );
  }
  if (action === 'delete_comment') {
    const c = state.comments?.find(
      (c) => c.id === p.id && c.proofId === proof.id && c.userId === uid,
    );
    if (!c) throw new AppError(403, 'Only your own comments can be removed.');
    c.deleted = true;
    c.body = '';
  }
  if (action === 'react') {
    const list = (state.reactions ??= []),
      index = list.findIndex(
        (r) => r.proofId === proof.id && r.userId === uid && r.emoji === p.emoji,
      );
    if (index >= 0) list.splice(index, 1);
    else list.push({ proofId: proof.id, userId: uid, emoji: p.emoji });
  }
  return {
    comments: (state.comments ?? [])
      .filter((c) => c.proofId === proof.id)
      .map(({ proofId, ...c }) => c),
    reactions: (['clap', 'fire', 'heart'] as const).map((emoji) => ({
      emoji,
      count: (state.reactions ?? []).filter((r) => r.proofId === proof.id && r.emoji === emoji)
        .length,
      own: (state.reactions ?? []).some(
        (r) => r.proofId === proof.id && r.emoji === emoji && r.userId === uid,
      ),
    })),
  } satisfies ProofSocial;
}
