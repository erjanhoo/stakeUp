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
export const passwordSchema = z.string().min(12, 'Use at least 12 characters.').max(128);
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
}
export interface RuntimeConfig {
  authMode: 'local' | 'supabase';
}
