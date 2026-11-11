import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildApp } from './create-app.js';
import { loadConfig } from './config.js';

describe('foundation HTTP boundary', () => {
  let dir: string;
  let app: Awaited<ReturnType<typeof buildApp>>;
  const origin = 'http://localhost:5173';
  const account = {
    email: 'person@example.test',
    password: 'a strong password 123',
    username: 'person',
  };
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'stakeup-'));
    app = await buildApp({
      mode: 'local',
      production: false,
      origin,
      dataFile: join(dir, 'data.json'),
    });
  });
  afterEach(async () => {
    await app.close();
    await rm(dir, { recursive: true, force: true });
  });
  async function register(input = account) {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { origin },
      payload: input,
    });
    expect(response.statusCode).toBe(201);
    return { profile: response.json(), cookie: response.cookies[0].value };
  }
  it('keeps teammate profiles private and excludes email from visible profiles', async () => {
    const a = await register(),
      b = await register({ ...account, email: 'other@example.test', username: 'other' });
    expect((await app.inject(`/api/members/${a.profile.id}`)).statusCode).toBe(401);
    expect(
      (
        await app.inject({
          url: `/api/members/${a.profile.id}`,
          cookies: { stakeup_session: b.cookie },
        })
      ).statusCode,
    ).toBe(404);
    const own = await app.inject({
      url: `/api/members/${a.profile.id}`,
      cookies: { stakeup_session: a.cookie },
    });
    expect(own.statusCode).toBe(200);
    expect(own.json()).not.toHaveProperty('email');
    expect(own.json()).toMatchObject({ accepted: 0, completed: 0 });
  });
  it('requires authentication and rejects cross-origin mutations', async () => {
    expect((await app.inject('/api/me')).statusCode).toBe(401);
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { origin: 'https://attacker.test' },
      payload: account,
    });
    expect(response.statusCode).toBe(403);
    expect(
      (await app.inject({ method: 'POST', url: '/api/auth/register', payload: account }))
        .statusCode,
    ).toBe(403);
  });
  it('saves language per account and protects community endpoints', async () => {
    const { cookie } = await register();
    const change = await app.inject({
      method: 'PATCH',
      url: '/api/me/language',
      headers: { origin },
      cookies: { stakeup_session: cookie },
      payload: { language: 'ru' },
    });
    expect(change.statusCode).toBe(200);
    expect(change.json().language).toBe('ru');
    expect(
      (await app.inject({ url: '/api/me', cookies: { stakeup_session: cookie } })).json().language,
    ).toBe('ru');
    expect(
      (
        await app.inject({
          method: 'PATCH',
          url: '/api/me/language',
          headers: { origin },
          cookies: { stakeup_session: cookie },
          payload: { language: 'invalid' },
        })
      ).statusCode,
    ).toBe(400);
    for (const url of [
      '/api/notifications',
      '/api/me/recap',
      '/api/challenges/70000000-0000-4000-8000-000000000011/grace',
    ])
      expect((await app.inject(url)).statusCode).toBe(401);
    expect(
      (
        await app.inject({ url: '/api/notifications', cookies: { stakeup_session: cookie } })
      ).json(),
    ).toEqual([]);
  });
  it('persists private accounts, hashes credentials, and returns honest zero statistics', async () => {
    const a = await register();
    const b = await register({ ...account, email: 'other@example.test', username: 'other' });
    const me = await app.inject({ url: '/api/me', cookies: { stakeup_session: a.cookie } });
    expect(me.json().id).toBe(a.profile.id);
    expect(me.json().id).not.toBe(b.profile.id);
    const dashboard = (
      await app.inject({ url: '/api/dashboard', cookies: { stakeup_session: a.cookie } })
    ).json();
    expect(dashboard).toMatchObject({
      activeChallenges: 0,
      circleCount: 0,
      acceptedDays: 0,
      virtualPoolMinor: 0,
    });
    expect(dashboard.activities).toHaveLength(1);
    expect(dashboard.activities[0].kind).toBe('account_created');
    const disk = await readFile(join(dir, 'data.json'), 'utf8');
    expect(disk).not.toContain(account.password);
    expect(disk).not.toContain(a.cookie);
    await app.close();
    app = await buildApp({
      mode: 'local',
      production: false,
      origin,
      dataFile: join(dir, 'data.json'),
    });
    expect(
      (await app.inject({ url: '/api/me', cookies: { stakeup_session: a.cookie } })).json().id,
    ).toBe(a.profile.id);
  });
  it('enforces unique identities under concurrent registration', async () => {
    const responses = await Promise.all(
      [1, 2].map(() =>
        app.inject({
          method: 'POST',
          url: '/api/auth/register',
          headers: { origin },
          payload: account,
        }),
      ),
    );
    expect(responses.map((r) => r.statusCode).sort()).toEqual([201, 409]);
  });
  it('validates profile, prevents changing another identity, and records onboarding', async () => {
    const a = await register();
    const input = {
      username: 'person',
      displayName: 'Test Person',
      timezone: 'Asia/Bishkek',
      bio: 'Read daily',
      onboardingCompleted: true,
      id: 'other-user-id',
      virtualPoolMinor: 99999,
    };
    const result = await app.inject({
      method: 'PATCH',
      url: '/api/me',
      headers: { origin },
      cookies: { stakeup_session: a.cookie },
      payload: input,
    });
    expect(result.statusCode).toBe(200);
    expect(result.json()).toMatchObject({
      id: a.profile.id,
      displayName: 'Test Person',
      timezone: 'Asia/Bishkek',
    });
    expect(result.json()).not.toHaveProperty('virtualPoolMinor');
    const bad = await app.inject({
      method: 'PATCH',
      url: '/api/me',
      headers: { origin },
      cookies: { stakeup_session: a.cookie },
      payload: { ...input, timezone: 'Fake/Nowhere' },
    });
    expect(bad.statusCode).toBe(400);
    expect(
      (await app.inject({ url: '/api/dashboard', cookies: { stakeup_session: a.cookie } })).json()
        .activities[0].kind,
    ).toBe('onboarding_completed');
  });
  it('revokes sessions on logout and rejects incorrect credentials', async () => {
    const a = await register();
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/auth/login',
          headers: { origin },
          payload: { email: account.email, password: 'wrong' },
        })
      ).statusCode,
    ).toBe(401);
    await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      headers: { origin },
      cookies: { stakeup_session: a.cookie },
    });
    expect(
      (await app.inject({ url: '/api/me', cookies: { stakeup_session: a.cookie } })).statusCode,
    ).toBe(401);
    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { origin },
      payload: account,
    });
    expect(login.statusCode).toBe(200);
    expect(String(login.headers['set-cookie'])).toContain('HttpOnly');
    expect(String(login.headers['set-cookie'])).toContain('SameSite=Strict');
  });
  it('uses one-time recovery tokens and invalidates existing sessions', async () => {
    const a = await register();
    const recovery = await app.inject({
      method: 'POST',
      url: '/api/auth/recovery',
      headers: { origin },
      payload: { email: account.email },
    });
    const token = new URLSearchParams(new URL(recovery.json().recoveryUrl).hash.slice(1)).get(
      'token',
    );
    const payload = { token, password: 'replacement password 123' };
    expect(
      (await app.inject({ method: 'POST', url: '/api/auth/reset', headers: { origin }, payload }))
        .statusCode,
    ).toBe(200);
    expect(
      (await app.inject({ method: 'POST', url: '/api/auth/reset', headers: { origin }, payload }))
        .statusCode,
    ).toBe(400);
    expect(
      (await app.inject({ url: '/api/me', cookies: { stakeup_session: a.cookie } })).statusCode,
    ).toBe(401);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/auth/login',
          headers: { origin },
          payload: { email: account.email, password: payload.password },
        })
      ).statusCode,
    ).toBe(200);
  });
  it('does not expose local auth in Supabase mode', async () => {
    const connected = await buildApp({
      mode: 'supabase',
      production: true,
      origin,
      dataFile: '',
      supabaseUrl: 'https://example.supabase.co',
      supabaseKey: 'test-publishable',
    });
    try {
      expect(
        (
          await connected.inject({
            method: 'POST',
            url: '/api/auth/recovery',
            headers: { origin },
            payload: { email: account.email },
          })
        ).statusCode,
      ).toBe(404);
      expect((await connected.inject('/api/me')).statusCode).toBe(401);
    } finally {
      await connected.close();
    }
  });
});
describe('configuration fails closed', () => {
  it('forbids local auth in production and Vercel', () => {
    expect(() => loadConfig({ NODE_ENV: 'production', AUTH_MODE: 'local' })).toThrow(/forbidden/);
    expect(() => loadConfig({ VERCEL: '1', AUTH_MODE: 'local' })).toThrow(/forbidden/);
  });
  it('requires complete Supabase configuration and HTTPS production origin', () => {
    expect(() => loadConfig({ AUTH_MODE: 'supabase' })).toThrow(/required/);
    expect(() =>
      loadConfig({
        AUTH_MODE: 'supabase',
        NODE_ENV: 'production',
        SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_PUBLISHABLE_KEY: 'key',
      }),
    ).toThrow(/HTTPS/);
  });
});
