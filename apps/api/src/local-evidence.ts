import { randomUUID } from 'node:crypto';
import type { Proof, ProofVote, EvidencePage } from '@stakeup/contracts';
import type { SocialState } from './local-social.js';
import { AppError } from './errors.js';
export interface EvidenceState extends SocialState {
  proofs?: Proof[];
}
export function evidenceCommand(
  state: EvidenceState,
  uid: string,
  action: string,
  p: Record<string, any>,
  now = new Date(),
) {
  const all = (state.proofs ??= []);
  if (['reserve', 'finish'].includes(action)) {
    const oid =
      action === 'reserve' ? p.obligationId : all.find((s) => s.id === p.proofId)?.obligationId;
    if (
      (state as import('./local-competition.js').FinanceState).graceChoices?.some(
        (g) => g.obligationId === oid,
      )
    )
      throw new AppError(409, 'This day is excused. Cancel the grace day before submitting proof.');
  }
  const h = state.challenges.find((h) => h.id === p.challengeId);
  if (!h || !state.members.some((m) => m.circleId === h.circleId && m.userId === uid && !m.leftAt))
    throw new AppError(404, 'Challenge not found.');
  const participants = state.enrollments.filter(
    (e) => e.challengeId === h.id && e.status === 'accepted',
  );
  const eligible = participants.filter((e) => e.userId !== uid).length;
  const person = (id: string) =>
    state.accounts.find((a) => a.profile.id === id)!.profile.displayName;
  const event = (s: Proof, kind: string, reason = '') =>
    s.events.push({ kind, reason, actorId: uid, createdAt: now.toISOString() });
  if (action === 'list')
    return {
      proofs: all
        .filter((s) => s.challengeId === h.id)
        .map((s) => ({
          ...s,
          status: s.status === 'pending' && now > new Date(s.deadlineAt) ? 'expired' : s.status,
        })),
      eligibleReviewers: eligible,
    } satisfies EvidencePage;
  if (action === 'reserve') {
    const o = state.obligations.find(
      (o) => o.id === p.obligationId && o.challengeId === h.id && o.userId === uid,
    );
    if (!o || h.status !== 'active')
      throw new AppError(403, 'Only enrolled participants can submit their own proof.');
    if (
      now > new Date(o.deadlineAt) ||
      (o.opensAt && now < new Date(o.opensAt)) ||
      new Intl.DateTimeFormat('en-CA', {
        timeZone: h.rules.timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(now) !== o.localDate
    )
      throw new AppError(409, 'This submission window is closed or has not opened.');
    if (h.rules.capturePolicy === 'camera_only' && p.source !== 'camera')
      throw new AppError(400, 'This challenge requests camera capture.');
    const existing = all.find((s) => s.obligationId === o.id);
    if (existing) {
      if (existing.status !== 'pending')
        throw new AppError(409, 'Proof has already been submitted.');
      return existing;
    }
    const id = randomUUID();
    const s: Proof = {
      id,
      obligationId: o.id,
      challengeId: h.id,
      userId: uid,
      name: person(uid),
      localDate: o.localDate,
      deadlineAt: o.deadlineAt,
      receivedAt: null,
      status: 'pending',
      note: p.note,
      source: p.source,
      path: `${uid}/${id}.jpg`,
      review: null,
      votes: [],
      events: [],
      round: 0,
    };
    all.push(s);
    event(s, 'upload_reserved');
    return s;
  }
  const s = all.find((s) => s.id === p.proofId && s.challengeId === h.id);
  if (!s) throw new AppError(404, 'Proof not found.');
  if (action === 'photo') return s;
  if (action === 'finish') {
    if (s.userId !== uid) throw new AppError(403, 'Only the owner can submit this proof.');
    if (s.status !== 'pending') return s;
    if (now > new Date(s.deadlineAt)) throw new AppError(409, 'The deadline has passed.');
    s.receivedAt = now.toISOString();
    s.status = 'ai_reviewed';
    s.review = p.review;
    event(s, 'ai_reviewed', 'Development mock: human review required.');
    return s;
  }
  if (!participants.some((e) => e.userId === uid))
    throw new AppError(403, 'Only enrolled participants can review.');
  if (h.status !== 'active')
    throw new AppError(409, 'This challenge is completed; review is closed.');
  if (action === 'dispute') {
    if (!['accepted', 'rejected'].includes(s.status))
      throw new AppError(409, 'Only a decided proof can be disputed.');
    if (s.events.some((e) => e.kind === 'disputed'))
      throw new AppError(409, 'This proof has already had its dispute round.');
    if (s.userId === uid && s.status !== 'rejected')
      throw new AppError(403, 'You can appeal only your rejected proof.');
    s.status = 'disputed';
    s.round = 1;
    event(s, 'disputed', p.reason);
    return s;
  }
  if (action === 'vote') {
    if (s.userId === uid) throw new AppError(403, 'You cannot review your own proof.');
    if (!['ai_reviewed', 'disputed'].includes(s.status))
      throw new AppError(409, 'This proof is not open for review.');
    if (s.votes.some((v) => v.userId === uid && v.round === s.round))
      throw new AppError(409, 'Your vote is already recorded.');
    s.votes.push({
      userId: uid,
      name: person(uid),
      decision: p.decision,
      reason: p.reason,
      round: s.round,
      createdAt: now.toISOString(),
    });
    event(s, 'peer_vote', `${p.decision}: ${p.reason}`);
    const votes = s.votes.filter((v) => v.round === s.round),
      count = participants.filter((e) => e.userId !== s.userId).length;
    const yes = votes.filter((v) => v.decision === 'accept').length,
      no = votes.length - yes;
    if (yes > count / 2 && yes >= (s.round ? 2 : 1)) s.status = 'accepted';
    if (no > count / 2 && no >= 2) s.status = 'rejected';
    if (['accepted', 'rejected'].includes(s.status)) event(s, s.status, 'Peer quorum reached.');
    return s;
  }
  throw new AppError(400, 'Unknown evidence action.');
}
