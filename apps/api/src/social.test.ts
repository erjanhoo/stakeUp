import { beforeEach, afterEach, expect, it, describe } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildApp } from './create-app.js';
import { schedule } from './domain/challenges.js';

const origin = 'http://localhost:5173';
const rules = {
  title: 'Read together',
  description: 'A shared daily habit',
  startDate: '2027-03-14',
  endDate: '2027-03-20',
  timezone: 'America/New_York',
  weekdays: [0, 1, 2, 3, 4, 5, 6],
  opening: '00:00',
  cutoff: '02:30',
  evidenceRequirements:
    'Share a photo of your reading notes. A photo alone cannot prove pages read.',
  capturePolicy: 'camera_or_upload' as const,
  penaltyMinor: 500,
  maxPenaltyMinor: 3500,
  graceDays: 1,
  gracePolicy: 'automatic_v1' as const,
  rewardPolicy: 'discipline_v1' as const,
};
describe('social challenge HTTP flow', () => {
  let app: Awaited<ReturnType<typeof buildApp>>, dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'stakeup-social-'));
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
  async function account(username: string) {
    const r = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { origin },
      payload: { username, email: `${username}@example.test`, password: '12345678' },
    });
    expect(r.statusCode).toBe(201);
    return r.cookies[0].value;
  }
  async function request(
    cookie: string,
    method: 'GET' | 'POST' | 'PATCH',
    url: string,
    payload?: unknown,
  ) {
    return app.inject({
      method,
      url,
      headers: { origin },
      cookies: { stakeup_session: cookie },
      payload: payload as never,
    });
  }
  it('joins with a private invitation, records both acceptances and locks a UTC schedule', async () => {
    const a = await account('owner'),
      b = await account('friend'),
      outsider = await account('outsider');
    const created = await request(a, 'POST', '/api/circles', {
      name: 'Morning crew',
      description: 'Friends who show up',
      icon: 'sun',
    });
    expect(created.statusCode).toBe(201);
    const circle = created.json();
    expect((await request(outsider, 'GET', `/api/circles/${circle.id}`)).statusCode).toBe(404);
    expect((await request(b, 'POST', `/api/circles/${circle.id}/invite`)).statusCode).toBe(404);
    const invite = (await request(a, 'POST', `/api/circles/${circle.id}/invite`)).json();
    expect(invite.token).toMatch(/^[a-f0-9]{64}$/);
    await request(b, 'POST', '/api/invitations/join', { token: invite.token });
    await request(b, 'POST', '/api/invitations/join', { token: invite.token });
    const detail = (await request(b, 'GET', `/api/circles/${circle.id}`)).json();
    expect(detail.memberCount).toBe(2);
    expect(detail.members).toHaveLength(2);
    expect(detail.members[0]).not.toHaveProperty('email');
    const c = (await request(a, 'POST', `/api/circles/${circle.id}/challenges`, rules)).json();
    expect((await request(a, 'POST', `/api/challenges/${c.id}/activate`)).statusCode).toBe(409);
    expect(
      (await request(a, 'POST', `/api/challenges/${c.id}/accept`, { rulesHash: '0'.repeat(64) }))
        .statusCode,
    ).toBe(409);
    for (const cookie of [a, b])
      expect(
        (
          await request(cookie, 'POST', `/api/challenges/${c.id}/accept`, {
            rulesHash: c.rulesHash,
          })
        ).statusCode,
      ).toBe(200);
    expect((await request(b, 'POST', `/api/circles/${circle.id}/leave`)).statusCode).toBe(409);
    expect((await request(b, 'POST', `/api/challenges/${c.id}/activate`)).statusCode).toBe(403);
    expect((await request(a, 'POST', `/api/challenges/${c.id}/activate`)).statusCode).toBe(200);
    expect((await request(a, 'POST', `/api/challenges/${c.id}/activate`)).statusCode).toBe(409);
    expect((await request(b, 'POST', `/api/challenges/${c.id}/withdraw`)).statusCode).toBe(409);
    const challenge = (await request(b, 'GET', `/api/challenges/${c.id}`)).json();
    expect(challenge.status).toBe('active');
    expect(challenge.acceptedCount).toBe(2);
    expect(challenge.obligations).toHaveLength(7);
    expect(challenge.obligations[0].deadlineAt).toBe('2027-03-14T07:30:00Z');
    expect((await request(outsider, 'GET', `/api/challenges/${c.id}`)).statusCode).toBe(404);
    const dashboard = (await request(b, 'GET', '/api/dashboard')).json();
    expect(dashboard.activeChallenges).toBe(1);
    expect(dashboard.circleCount).toBe(1);
  });
  it('saves appearance per account and keeps members from changing a circle', async () => {
    const a = await account('owner'),
      b = await account('friend');
    const circle = (
      await request(a, 'POST', '/api/circles', {
        name: 'Our circle',
        description: '',
        icon: 'book',
      })
    ).json();
    const invite = (await request(a, 'POST', `/api/circles/${circle.id}/invite`)).json();
    await request(b, 'POST', '/api/invitations/join', { token: invite.token });
    expect(
      (
        await request(b, 'PATCH', `/api/circles/${circle.id}`, {
          name: 'Changed',
          description: '',
          icon: 'book',
        })
      ).statusCode,
    ).toBe(403);
    expect(
      (await request(a, 'PATCH', '/api/me/appearance', { mode: 'light', accent: 'lime' }))
        .statusCode,
    ).toBe(200);
    expect((await request(a, 'GET', '/api/me')).json().appearance).toEqual({
      mode: 'light',
      accent: 'lime',
    });
    expect((await request(b, 'GET', '/api/me')).json().appearance).toEqual({
      mode: 'dark',
      accent: 'orange',
    });
    expect(
      (await request(a, 'PATCH', '/api/me/appearance', { mode: 'injected', accent: 'lime' }))
        .statusCode,
    ).toBe(400);
  });
});
it('freezes later instants for DST overlap/gap and respects selected weekdays', () => {
  expect(
    schedule({
      ...rules,
      startDate: '2027-11-07',
      endDate: '2027-11-07',
      cutoff: '01:30',
      graceDays: 0,
    })[0].deadlineAt,
  ).toBe('2027-11-07T06:30:00Z');
  expect(schedule({ ...rules, weekdays: [1, 3, 5], graceDays: 0 }).map((d) => d.localDate)).toEqual(
    ['2027-03-15', '2027-03-17', '2027-03-19'],
  );
  expect(() => schedule({ ...rules, endDate: '2027-08-01' })).toThrow(/90 days/);
});
