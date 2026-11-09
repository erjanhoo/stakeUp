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
  accent: z.enum(['orange', 'lime']),
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
export interface Profile extends ProfileInput {
  appearance: Appearance;
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
  icon: z.enum(['flame', 'sun', 'book', 'dumbbell', 'sprout']).default('flame'),
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
    cutoff: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use a valid 24-hour deadline.'),
    evidenceRequirements: z.string().trim().min(10).max(500),
    capturePolicy: z.enum(['camera_only', 'camera_or_upload']),
    penaltyMinor: z.number().int().min(0).max(100_000),
    maxPenaltyMinor: z.number().int().min(0).max(1_000_000),
    graceDays: z.number().int().min(0).max(7),
    rewardPolicy: z.literal('discipline_v1').default('discipline_v1'),
  })
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
  status: 'proposed' | 'active' | 'cancelled';
  acceptedCount: number;
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
