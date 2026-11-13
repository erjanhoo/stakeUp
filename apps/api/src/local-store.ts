import {
  communityCommand,
  emitCommunityNotifications,
  type CommunityState,
} from './local-community.js';
import { competitionCommand } from './local-competition.js';
import { walletCommand, type WalletState } from './local-wallet.js';
import { evidenceCommand, type EvidenceState } from './local-evidence.js';
import { reviewInbox, type InboxInput } from './review-inbox.js';
import {
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHash,
} from 'node:crypto';
import { promisify } from 'node:util';
import { readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import { dirname } from 'node:path';
import type {
  Profile,
  ProfileInput,
  Activity,
  Appearance,
  SocialAction,
  Currency,
} from '@stakeup/contracts';
import { initializeSocial, socialCommand, type SocialState } from './local-social.js';
import { AppError } from './errors.js';
export { AppError } from './errors.js';

const scrypt = promisify(scryptCallback);
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
interface Account {
  profile: Profile;
  password: string;
  salt: string;
}
interface Session {
  hash: string;
  userId: string;
  expires: number;
}
interface Reset {
  hash: string;
  userId: string;
  expires: number;
}
interface State extends SocialState {
  version: 1;
  accounts: Account[];
  sessions: Session[];
  resets: Reset[];
  activities: (Activity & { userId: string })[];
}

export class LocalStore {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private file: string) {}
  reviews(uid: string, input: InboxInput) {
    return this.transact((state) => reviewInbox(state as EvidenceState, uid, input));
  }
  private transact<T>(fn: (state: State) => T | Promise<T>): Promise<T> {
    const work = this.queue.then(async () => {
      let state: State;
      try {
        state = JSON.parse(await readFile(this.file, 'utf8')) as State;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
        state = {
          version: 1,
          accounts: [],
          sessions: [],
          resets: [],
          activities: [],
          circles: [],
          members: [],
          invitations: [],
          challenges: [],
          enrollments: [],
          obligations: [],
          socialEvents: [],
        };
      }
      initializeSocial(state);
      for (const account of state.accounts)
        account.profile.appearance ??= { mode: 'dark', accent: 'orange' };
      state.sessions = state.sessions.filter((s) => s.expires > Date.now());
      state.resets = state.resets.filter((s) => s.expires > Date.now());
      const result = await fn(state);
      emitCommunityNotifications(state);
      await mkdir(dirname(this.file), { recursive: true });
      await writeFile(`${this.file}.tmp`, JSON.stringify(state), { mode: 0o600 });
      await rename(`${this.file}.tmp`, this.file);
      return result;
    });
    this.queue = work.catch(() => undefined);
    return work;
  }
  private event(state: State, userId: string, kind: Activity['kind']) {
    state.activities.push({ id: randomUUID(), userId, kind, createdAt: new Date().toISOString() });
  }
  private session(state: State, userId: string) {
    const token = randomBytes(32).toString('hex');
    state.sessions.push({ hash: digest(token), userId, expires: Date.now() + 7 * 86400_000 });
    return token;
  }
  register(email: string, password: string, username: string) {
    return this.transact(async (state) => {
      if (state.accounts.some((a) => a.profile.email === email || a.profile.username === username))
        throw new AppError(409, 'An account with this email or username already exists.');
      const salt = randomBytes(16).toString('hex');
      const profile: Profile = {
        id: randomUUID(),
        email,
        username,
        displayName: username,
        timezone: 'UTC',
        bio: '',
        onboardingCompleted: false,
        appearance: { mode: 'dark', accent: 'orange' },
        createdAt: new Date().toISOString(),
      };
      state.accounts.push({
        profile,
        salt,
        password: ((await scrypt(password, salt, 64)) as Buffer).toString('hex'),
      });
      this.event(state, profile.id, 'account_created');
      return { profile, token: this.session(state, profile.id) };
    });
  }
  login(email: string, password: string) {
    return this.transact(async (state) => {
      const account = state.accounts.find((a) => a.profile.email === email);
      const attempt = (await scrypt(
        password,
        account?.salt ?? 'unknown-account-dummy-salt',
        64,
      )) as Buffer;
      if (!account || !timingSafeEqual(attempt, Buffer.from(account.password, 'hex')))
        throw new AppError(401, 'Email or password is incorrect.');
      return { profile: account.profile, token: this.session(state, account.profile.id) };
    });
  }
  me(token?: string) {
    return this.transact((state) => {
      const session = token && state.sessions.find((s) => s.hash === digest(token));
      const account = session && state.accounts.find((a) => a.profile.id === session.userId);
      if (!account) throw new AppError(401, 'Please sign in to continue.');
      return account.profile;
    });
  }
  logout(token?: string) {
    return this.transact((state) => {
      state.sessions = state.sessions.filter((s) => s.hash !== digest(token ?? ''));
    });
  }
  update(id: string, input: ProfileInput) {
    return this.transact((state) => {
      if (state.accounts.some((a) => a.profile.id !== id && a.profile.username === input.username))
        throw new AppError(409, 'That username is already taken.');
      const account = state.accounts.find((a) => a.profile.id === id)!;
      const firstOnboard = !account.profile.onboardingCompleted && input.onboardingCompleted;
      account.profile = {
        ...account.profile,
        ...input,
        onboardingCompleted: account.profile.onboardingCompleted || input.onboardingCompleted,
      };
      this.event(state, id, firstOnboard ? 'onboarding_completed' : 'profile_updated');
      return account.profile;
    });
  }
  activities(id: string) {
    return this.transact((state) =>
      state.activities
        .filter((a) => a.userId === id)
        .slice(-10)
        .reverse()
        .map(({ userId: _id, ...event }) => event),
    );
  }
  appearance(id: string, appearance: Appearance) {
    return this.transact((state) => {
      const profile = state.accounts.find((a) => a.profile.id === id)!.profile;
      profile.appearance = appearance;
      return profile;
    });
  }
  currency(id: string, currency: Currency) {
    return this.transact((state) => {
      const profile = state.accounts.find((a) => a.profile.id === id)!.profile;
      profile.currency = currency;
      return profile;
    });
  }
  wallet(id: string, topUp?: { amountMinor: number; requestId: string }) {
    return this.transact((state) => walletCommand(state as WalletState, id, topUp));
  }
  social(userId: string, action: SocialAction, payload: Record<string, unknown> = {}) {
    return this.transact((state) => socialCommand(state, userId, action, payload));
  }
  community(uid: string, action: string, p: Record<string, unknown> = {}) {
    return this.transact((state) => communityCommand(state, uid, action, p));
  }
  memberProfile(viewer: string, target: string) {
    return this.transact((state) => {
      const shared = state.circles
        .filter(
          (c) =>
            state.members.some((m) => m.circleId === c.id && m.userId === viewer && !m.leftAt) &&
            state.members.some((m) => m.circleId === c.id && m.userId === target && !m.leftAt),
        )
        .map((c) => c.id);
      const p = state.accounts.find((a) => a.profile.id === target)?.profile;
      if (!p || (viewer !== target && !shared.length))
        throw new AppError(404, 'Profile not found.');
      const ids = state.challenges
        .filter((c) => viewer === target || shared.includes(c.circleId))
        .map((c) => c.id);
      const accepted = ((state as EvidenceState).proofs ?? []).filter(
        (p) => p.userId === target && p.status === 'accepted' && ids.includes(p.challengeId),
      ).length;
      const completed = state.enrollments.filter(
        (e) =>
          e.userId === target &&
          e.status === 'accepted' &&
          ids.includes(e.challengeId) &&
          state.challenges.some((c) => c.id === e.challengeId && c.status === 'completed'),
      ).length;
      return {
        id: p.id,
        displayName: p.displayName,
        username: p.username,
        bio: p.bio,
        createdAt: p.createdAt,
        accepted,
        completed,
      };
    });
  }
  language(uid: string, language: 'en' | 'ru') {
    return this.transact((state) => {
      const profile = state.accounts.find((a) => a.profile.id === uid)!.profile;
      profile.language = language;
      return profile;
    });
  }
  projectedPools(uid: string) {
    return this.transact((state) =>
      state.challenges
        .filter(
          (c) =>
            c.status === 'active' &&
            state.enrollments.some(
              (e) => e.challengeId === c.id && e.userId === uid && e.status === 'accepted',
            ),
        )
        .reduce((sum, c) => sum + competitionCommand(state, uid, c.id).poolMinor, 0),
    );
  }
  competition(uid: string, id: string, settle = false) {
    return this.transact((state) => competitionCommand(state, uid, id, settle));
  }
  acceptedProofDays(userId: string) {
    return this.transact(
      (state) =>
        ((state as EvidenceState).proofs ?? []).filter(
          (p) => p.userId === userId && p.status === 'accepted',
        ).length,
    );
  }
  evidence(userId: string, action: string, payload: Record<string, unknown>) {
    return this.transact((state) => evidenceCommand(state, userId, action, payload));
  }
  requestReset(email: string) {
    return this.transact((state) => {
      const account = state.accounts.find((a) => a.profile.email === email);
      if (!account) return null;
      const token = randomBytes(32).toString('hex');
      state.resets = state.resets.filter((r) => r.userId !== account.profile.id);
      state.resets.push({
        hash: digest(token),
        userId: account.profile.id,
        expires: Date.now() + 15 * 60_000,
      });
      return token;
    });
  }
  reset(token: string, password: string) {
    return this.transact(async (state) => {
      const reset = state.resets.find((r) => r.hash === digest(token));
      if (!reset) throw new AppError(400, 'This recovery link is invalid or expired.');
      const account = state.accounts.find((a) => a.profile.id === reset.userId)!;
      account.salt = randomBytes(16).toString('hex');
      account.password = ((await scrypt(password, account.salt, 64)) as Buffer).toString('hex');
      state.resets = state.resets.filter((r) => r.userId !== reset.userId);
      state.sessions = state.sessions.filter((s) => s.userId !== reset.userId);
    });
  }
}
