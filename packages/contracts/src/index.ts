import { z } from 'zod';

export const timezoneSchema = z.string().refine((value) => {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}, 'Choose a valid IANA timezone.');
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(24)
  .regex(
    /^[a-z][a-z0-9_]*$/,
    'Use lowercase letters, numbers and underscores; start with a letter.',
  );
export const passwordSchema = z.string().min(8, 'Use at least 8 characters.').max(128);
export const appearanceSchema = z.object({
  mode: z.enum(['dark', 'light']),
  accent: z.enum(['orange', 'lime', 'blue', 'violet']),
});
export type Appearance = z.infer<typeof appearanceSchema>;
export const loginSchema = z.object({
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  password: z.string().min(1).max(128),
});
export const registerSchema = loginSchema.extend({
  password: passwordSchema,
  username: usernameSchema,
});
export const profileSchema = z.object({
  username: usernameSchema,
  displayName: z.string().trim().min(1).max(60),
  timezone: timezoneSchema,
  bio: z.string().trim().max(240),
  onboardingCompleted: z.boolean(),
});
export const resetRequestSchema = z.object({
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
});
export const resetPasswordSchema = z.object({
  token: z.string().min(32).max(256),
  password: passwordSchema,
});
export type ProfileInput = z.infer<typeof profileSchema>;
export const currencySchema = z.enum(['USD', 'KGS', 'EUR', 'RUB', 'GBP', 'KZT']);
export type Currency = z.infer<typeof currencySchema>;
export const topUpSchema = z.object({
  amountMinor: z.number().int().min(100).max(10_000_000),
  requestId: z.uuid(),
});
export interface WalletEntry {
  id: string;
  kind: 'top_up' | 'penalty' | 'reward' | 'refund';
  amountMinor: number;
  createdAt: string;
  reason: string;
}
export interface Wallet {
  balanceMinor: number;
  pendingPenaltyMinor: number;
  entries: WalletEntry[];
}
export interface Profile extends ProfileInput {
  currency?: Currency;
  appearance: Appearance;
  language?: 'en' | 'ru';
  id: string;
  email: string;
  createdAt: string;
}
export interface Activity {
  id: string;
  kind: 'account_created' | 'profile_updated' | 'onboarding_completed';
  createdAt: string;
}
export interface Dashboard {
  activeChallenges: number;
  circleCount: number;
  acceptedDays: number;
  virtualPoolMinor: number;
  activities: Activity[];
  commitments?: Obligation[];
}
export interface RuntimeConfig {
  authMode: 'local' | 'supabase';
}

export const circleSchema = z.object({
  name: z.string().trim().min(3).max(60),
  description: z.string().trim().max(300),
  icon: z
    .enum([
      'flame',
      'sun',
      'book',
      'dumbbell',
      'sprout',
      'rocket',
      'mountain',
      'heart',
      'coffee',
      'brain',
      'bike',
      'music',
      'target',
    ])
    .default('flame'),
});
export const invitationSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/, 'Paste a valid invitation code or link.'),
});
export const challengeSchema = z
  .object({
    title: z.string().trim().min(3).max(80),
    description: z.string().trim().max(1000),
    startDate: z.iso.date(),
    endDate: z.iso.date(),
    timezone: timezoneSchema,
    weekdays: z
      .array(z.number().int().min(0).max(6))
      .min(1)
      .max(7)
      .refine((v) => new Set(v).size === v.length, 'Choose each weekday only once.'),
    opening: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .default('00:00'),
    cutoff: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use a valid 24-hour deadline.'),
    evidenceRequirements: z.string().trim().min(10).max(500),
    capturePolicy: z.enum(['camera_only', 'camera_or_upload']),
    penaltyMinor: z.number().int().min(0).max(100_000),
    maxPenaltyMinor: z.number().int().min(0).max(1_000_000),
    graceDays: z.number().int().min(0).max(7),
    rewardPolicy: z.enum(['discipline_v1', 'discipline_v2']).default('discipline_v2'),
    gracePolicy: z.enum(['automatic_v1', 'chosen_v1']).optional(),
  })
  .refine((v) => v.opening < v.cutoff, 'Opening time must be before the deadline on the same day.')
  .transform((v) => ({
    ...v,
    gracePolicy:
      v.gracePolicy ??
      (v.rewardPolicy === 'discipline_v1' ? ('automatic_v1' as const) : ('chosen_v1' as const)),
  }))
  .refine(
    (v) => (v.rewardPolicy === 'discipline_v1') === (v.gracePolicy === 'automatic_v1'),
    'Reward and grace policies must match.',
  )
  .refine((v) => v.endDate >= v.startDate, 'End date must be on or after the start date.')
  .refine(
    (v) => v.maxPenaltyMinor >= v.penaltyMinor,
    'The cap must cover at least one daily penalty.',
  );
export type CircleInput = z.infer<typeof circleSchema>;
export type ChallengeRules = z.infer<typeof challengeSchema>;
export type SocialAction =
  | 'list'
  | 'create_circle'
  | 'circle'
  | 'update_circle'
  | 'invite'
  | 'join'
  | 'leave'
  | 'archive'
  | 'create_challenge'
  | 'challenge'
  | 'accept'
  | 'withdraw'
  | 'activate'
  | 'cancel'
  | 'dashboard';
export interface CircleSummary extends CircleInput {
  id: string;
  creatorId: string;
  role: 'owner' | 'member';
  memberCount: number;
  challengeCount: number;
  archived: boolean;
}
export interface CircleMember {
  userId: string;
  displayName: string;
  username: string;
  role: 'owner' | 'member';
  joinedAt: string;
}
export interface SocialEvent {
  id: string;
  kind: string;
  actorName: string;
  title: string;
  createdAt: string;
}
export interface CircleDetail extends CircleSummary {
  members: CircleMember[];
  challenges: ChallengeSummary[];
  events: SocialEvent[];
}
export interface ChallengeSummary {
  id: string;
  circleId: string;
  circleName: string;
  createdBy: string;
  rules: ChallengeRules;
  rulesHash: string;
  status: 'proposed' | 'active' | 'cancelled' | 'completed';
  acceptedCount: number;
  acceptances?: {
    userId: string;
    displayName: string;
    status: 'accepted' | 'withdrawn' | 'not_accepted';
  }[];
  ownStatus: 'accepted' | 'withdrawn' | null;
}
export interface Participant {
  userId: string;
  displayName: string;
  username: string;
  status: 'accepted' | 'withdrawn';
  acceptedAt: string;
}
export interface Obligation {
  id: string;
  challengeId: string;
  title: string;
  circleName: string;
  localDate: string;
  deadlineAt: string;
  opensAt?: string;
  timezone: string;
  status: 'pending';
}
export interface ChallengeDetail extends ChallengeSummary {
  participants: Participant[];
  obligations: Obligation[];
  canManage: boolean;
}
export interface Invitation {
  token: string;
  expiresAt: string;
  maxUses: number;
}

export function creditsToMinor(value: string): number {
  if (!/^\d{1,5}(\.\d{1,2})?$/.test(value))
    throw new Error('Use a positive credit amount with at most two decimal places.');
  const [whole, fraction = ''] = value.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}
export type ProofStatus =
  'pending' | 'ai_reviewed' | 'accepted' | 'rejected' | 'disputed' | 'expired';
export interface EvidenceReview {
  provider: string;
  observations: string[];
  unverified: string[];
  recommendation: 'peer_review';
}
export interface ProofVote {
  userId: string;
  name: string;
  decision: 'accept' | 'reject';
  reason: string;
  round: number;
  createdAt: string;
}
export interface ProofEvent {
  kind: string;
  actorId: string;
  reason: string;
  createdAt: string;
}
export interface Proof {
  id: string;
  obligationId: string;
  challengeId: string;
  userId: string;
  name: string;
  localDate: string;
  deadlineAt: string;
  receivedAt: string | null;
  status: ProofStatus;
  note: string;
  source: 'camera' | 'upload';
  path: string;
  review: EvidenceReview | null;
  votes: ProofVote[];
  events: ProofEvent[];
  round: number;
}
export interface EvidencePage {
  proofs: Proof[];
  eligibleReviewers: number;
}
export type ReviewFilter = 'all' | 'pending' | 'disputed';
export interface ReviewCursor {
  receivedAt: string;
  id: string;
}
export interface ReviewTask {
  proof: Proof;
  circleId: string;
  circleName: string;
  challengeTitle: string;
  timezone: string;
}
export interface ReviewInbox {
  items: ReviewTask[];
  counts: { pending: number; disputed: number };
  nextCursor: ReviewCursor | null;
}
export interface CompetitionRow {
  userId: string;
  name: string;
  successful: number;
  missed: number;
  pending: number;
  grace: number;
  scheduled: number;
  streak: number;
  penaltyMinor: number;
  rewardMinor: number;
  eligible: boolean;
  rank: number;
}
export interface VirtualEntry {
  id: string;
  userId: string;
  kind: 'penalty' | 'reward' | 'refund';
  amountMinor: number;
  reason: string;
  obligationId?: string;
  createdAt: string;
}
export interface Competition {
  status: 'provisional' | 'blocked' | 'ready' | 'settled';
  rows: CompetitionRow[];
  poolMinor: number;
  distributedMinor: number;
  ledger: VirtualEntry[];
  settlementId: string | null;
  appealClosesAt: string;
}
export interface GraceChoice {
  obligationId: string;
  challengeId: string;
  userId: string;
  chosenAt: string;
}
export interface AppNotification {
  id: string;
  kind: string;
  challengeId: string | null;
  circleId: string | null;
  createdAt: string;
  readAt: string | null;
  payload: Record<string, string | number>;
}
export interface ProofComment {
  id: string;
  userId: string;
  name: string;
  body: string;
  createdAt: string;
  deleted: boolean;
}
export interface ProofSocial {
  comments: ProofComment[];
  reactions: { emoji: 'clap' | 'fire' | 'heart'; count: number; own: boolean }[];
}
export interface PersonalRecap {
  accepted: number;
  submitted: number;
  completed: number;
  achievements: string[];
}
