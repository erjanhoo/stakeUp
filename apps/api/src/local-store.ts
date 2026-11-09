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
import type { Profile, ProfileInput, Activity } from '@stakeup/contracts';

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
interface State {
  version: 1;
  accounts: Account[];
  sessions: Session[];
  resets: Reset[];
  activities: (Activity & { userId: string })[];
}
export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export class LocalStore {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private file: string) {}
  private transact<T>(fn: (state: State) => T | Promise<T>): Promise<T> {
    const work = this.queue.then(async () => {
      let state: State;
      try {
        state = JSON.parse(await readFile(this.file, 'utf8')) as State;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
        state = { version: 1, accounts: [], sessions: [], resets: [], activities: [] };
      }
      state.sessions = state.sessions.filter((s) => s.expires > Date.now());
      state.resets = state.resets.filter((s) => s.expires > Date.now());
      const result = await fn(state);
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
