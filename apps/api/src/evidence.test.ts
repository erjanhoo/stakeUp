import { expect, it } from 'vitest';
import sharp from 'sharp';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildApp } from './create-app.js';
import { evidenceCommand, type EvidenceState } from './local-evidence.js';
import { normalizePhoto, MockVerificationProvider } from './domain/evidence.js';
const uid = (n: number) => `30000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const now = new Date('2026-11-10T10:00:00Z');
function fixture(): EvidenceState {
  return {
    accounts: [1, 2, 3, 4].map((n) => ({
      profile: { id: uid(n), displayName: `Friend ${n}` } as any,
    })),
    circles: [
      {
        id: uid(10),
        creatorId: uid(1),
        name: 'Crew',
        description: '',
        icon: 'book',
        archived: false,
      },
    ],
    members: [1, 2, 3].map((n) => ({
      circleId: uid(10),
      userId: uid(n),
      joinedAt: now.toISOString(),
      leftAt: null,
    })),
    invitations: [],
    challenges: [
      {
        id: uid(11),
        circleId: uid(10),
        createdBy: uid(1),
        status: 'active',
        rulesHash: 'a'.repeat(64),
        rules: { title: 'Reading', timezone: 'UTC', capturePolicy: 'camera_or_upload' } as any,
      },
    ],
    enrollments: [1, 2, 3].map((n) => ({
      challengeId: uid(11),
      userId: uid(n),
      status: 'accepted',
      acceptedAt: now.toISOString(),
      rulesHash: 'a'.repeat(64),
    })),
    obligations: [
      {
        id: uid(12),
        challengeId: uid(11),
        userId: uid(1),
        localDate: '2026-11-10',
        deadlineAt: '2026-11-10T12:00:00Z',
        status: 'pending',
        title: 'Reading',
        circleName: 'Crew',
        timezone: 'UTC',
      },
    ],
    socialEvents: [],
  };
}
it('requires ownership, an open window and real peers; rejection/disputes need two independent votes', async () => {
  const state = fixture(),
    p = { challengeId: uid(11), obligationId: uid(12), source: 'camera', note: 'Reading notes' };
  const run = (actor: number, action: string, payload: Record<string, unknown>) =>
    evidenceCommand(state, uid(actor), action, { challengeId: uid(11), ...payload }, now) as any;
  expect(() => run(4, 'list', {})).toThrow(/not found/);
  expect(() => run(2, 'reserve', p)).toThrow(/own proof/);
  const s = run(1, 'reserve', p);
  expect(run(1, 'reserve', p).id).toBe(s.id);
  const key = { proofId: s.id };
  run(1, 'finish', {
    ...key,
    review: await new MockVerificationProvider().review(Buffer.alloc(0), 'read'),
  });
  expect(() => run(1, 'vote', { ...key, decision: 'accept', reason: 'My own work' })).toThrow(
    /own proof/,
  );
  run(2, 'vote', { ...key, decision: 'reject', reason: 'Not relevant' });
  expect(s.status).toBe('ai_reviewed');
  expect(() => run(2, 'vote', { ...key, decision: 'reject', reason: 'Again' })).toThrow(
    /already recorded/,
  );
  run(3, 'vote', { ...key, decision: 'reject', reason: 'Wrong evidence' });
  expect(s.status).toBe('rejected');
  run(1, 'dispute', { ...key, reason: 'Please review my notes again' });
  expect(s.status).toBe('disputed');
  run(2, 'vote', { ...key, decision: 'accept', reason: 'Context explains it' });
  expect(s.status).toBe('disputed');
  run(3, 'vote', { ...key, decision: 'accept', reason: 'Agreed after review' });
  expect(s.status).toBe('accepted');
  expect(() => run(2, 'dispute', { ...key, reason: 'Try to dispute it again' })).toThrow(
    /already had/,
  );
  expect(s.votes).toHaveLength(4);
  expect(s.events.some((e: any) => e.kind === 'disputed')).toBe(true);
});
it('never accepts future/late submissions and uses server time', () => {
  for (const date of ['2026-11-09T10:00Z', '2026-11-10T12:01Z'])
    expect(() =>
      evidenceCommand(
        fixture(),
        uid(1),
        'reserve',
        { challengeId: uid(11), obligationId: uid(12), source: 'camera', note: '' },
        new Date(date),
      ),
    ).toThrow(/window/);
});
it('validates image bytes and removes metadata; mock never claims visual analysis', async () => {
  await expect(normalizePhoto(Buffer.from('<svg/>'))).rejects.toThrow(/valid/);
  const original = await sharp({
    create: { width: 15, height: 10, channels: 3, background: '#ff814f' },
  })
    .png()
    .withMetadata()
    .toBuffer();
  const normalized = await normalizePhoto(original),
    meta = await sharp(normalized).metadata();
  expect(meta.format).toBe('jpeg');
  expect(meta.exif).toBeUndefined();
  const review = await new MockVerificationProvider().review(normalized, 'Read 20 pages');
  expect(review.recommendation).toBe('peer_review');
  expect(review.observations.join()).toContain('does not analyze');
});
it('serves authenticated private photos through HTTP and rejects forged bytes, outsider reads and resubmission', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'stakeup-proof-')),
    file = join(dir, 'state.json'),
    origin = 'http://localhost:5173';
  const app = await buildApp({ mode: 'local', production: false, origin, dataFile: file });
  try {
    const sessions: string[] = [];
    const ids: string[] = [];
    for (let n = 0; n < 4; n++) {
      const r = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        headers: { origin },
        payload: { username: `proof_${n}`, email: `proof${n}@example.test`, password: 'eightPwd' },
      });
      sessions.push(r.cookies[0].value);
      ids.push(r.json().id);
    }
    const base = JSON.parse(await readFile(file, 'utf8')),
      f = fixture();
    const map = (value: any): any =>
      typeof value === 'string'
        ? (ids[[uid(1), uid(2), uid(3), uid(4)].indexOf(value)] ?? value)
        : Array.isArray(value)
          ? value.map(map)
          : value && typeof value === 'object'
            ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, map(v)]))
            : value;
    const seeded = map(f);
    delete seeded.accounts;
    const date = new Date();
    seeded.obligations[0].localDate = date.toISOString().slice(0, 10);
    seeded.obligations[0].deadlineAt = new Date(date.getTime() + 3600000).toISOString();
    await writeFile(file, JSON.stringify({ ...base, ...seeded }));
    const request = (n: number, method: 'GET' | 'POST', path: string, payload?: any) =>
      app.inject({
        method,
        url: `/api/challenges/${uid(11)}/evidence${path}`,
        headers: { origin },
        cookies: { stakeup_session: sessions[n] },
        payload,
      });
    const photo = (
      await sharp({ create: { width: 12, height: 12, channels: 3, background: 'orange' } })
        .jpeg()
        .toBuffer()
    ).toString('base64');
    const body = { photo, obligationId: uid(12), source: 'camera', note: 'My notes' };
    expect(
      (
        await request(0, 'POST', '', {
          ...body,
          photo: Buffer.from('not a photo').toString('base64'),
        })
      ).statusCode,
    ).toBe(400);
    const r = await request(0, 'POST', '', body);
    expect(r.statusCode).toBe(200);
    const proof = r.json();
    expect(proof.status).toBe('ai_reviewed');
    expect(proof.receivedAt).toBeTruthy();
    expect((await request(1, 'GET', `/${proof.id}/photo`)).headers['content-type']).toContain(
      'image/jpeg',
    );
    expect((await request(3, 'GET', `/${proof.id}/photo`)).statusCode).toBe(404);
    expect(
      (await request(0, 'POST', `/${proof.id}/vote`, { decision: 'accept', reason: 'Looks good' }))
        .statusCode,
    ).toBe(403);
    expect((await request(0, 'POST', '', body)).statusCode).toBe(409);
  } finally {
    await app.close();
    await rm(dir, { recursive: true, force: true });
  }
});
