import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Config } from './config.js';
import type { LocalStore } from './local-store.js';
import { AppError } from './errors.js';
import { MockVerificationProvider, normalizePhoto } from './domain/evidence.js';
export function evidenceRoutes(
  app: FastifyInstance,
  config: Config,
  local: LocalStore | null,
  authenticate: (request: {
    cookies: Record<string, string | undefined>;
    headers: { authorization?: string };
  }) => Promise<{ profile: { id: string }; db?: SupabaseClient }>,
) {
  const verifier = new MockVerificationProvider();
  app.get('/api/reviews', async (req) => {
    const { profile, db } = await authenticate(req);
    const q = z
      .object({
        filter: z.enum(['all', 'pending', 'disputed']).default('all'),
        limit: z.coerce.number().int().min(1).max(20).default(20),
        afterId: z.uuid().optional(),
        afterTime: z.iso.datetime({ offset: true }).optional(),
      })
      .refine((p) => !!p.afterId === !!p.afterTime, 'Both cursor fields are required.')
      .parse(req.query);
    if (local)
      return local.reviews(profile.id, {
        filter: q.filter,
        limit: q.limit,
        after: q.afterId && q.afterTime ? { id: q.afterId, receivedAt: q.afterTime } : undefined,
      });
    const r = await db!.rpc('stakeup_review_inbox', { p_payload: q });
    if (r.error)
      throw new AppError(r.error.code === '42501' ? 403 : 503, 'Unable to load your review inbox.');
    return r.data;
  });
  const action = async (
    uid: string,
    db: SupabaseClient | undefined,
    name: string,
    p: Record<string, unknown>,
  ) => {
    if (local) return local.evidence(uid, name, p);
    const r = await db!.rpc('stakeup_evidence', { p_action: name, p_payload: p });
    if (r.error)
      throw new AppError(
        r.error.code === '42501' ? 403 : 409,
        ['P0001', '42501'].includes(r.error.code) ? r.error.message : 'Unable to process evidence.',
      );
    return r.data;
  };
  app.get<{ Params: { id: string } }>('/api/challenges/:id/evidence', async (req) => {
    const { profile, db } = await authenticate(req);
    return action(profile.id, db, 'list', { challengeId: z.uuid().parse(req.params.id) });
  });
  app.post<{ Params: { id: string } }>(
    '/api/challenges/:id/evidence',
    { bodyLimit: 3_500_000, config: { rateLimit: { max: 12, timeWindow: '1 minute' } } },
    async (req) => {
      const { profile, db } = await authenticate(req);
      const p = z
        .object({
          obligationId: z.uuid(),
          note: z.string().trim().max(500),
          source: z.enum(['camera', 'upload']),
          photo: z
            .string()
            .min(1)
            .max(3_340_000)
            .regex(/^[A-Za-z0-9+/]+={0,2}$/),
        })
        .parse(req.body);
      const image = await normalizePhoto(Buffer.from(p.photo, 'base64'));
      const challengeId = z.uuid().parse(req.params.id);
      const s = await action(profile.id, db, 'reserve', { ...p, photo: undefined, challengeId });
      if (local) {
        const dir = join(dirname(config.dataFile), 'evidence');
        await mkdir(dir, { recursive: true });
        await writeFile(join(dir, `${s.id}.jpg`), image, { flag: 'wx', mode: 0o600 }).catch((e) => {
          if (e.code !== 'EEXIST') throw e;
        });
      } else {
        const upload = await db!.storage
          .from('evidence')
          .upload(s.path, image, { contentType: 'image/jpeg', upsert: false });
        // Retry a reserved immutable object after a transient finish failure.
        if (upload.error && !/already exists|duplicate/i.test(upload.error.message))
          throw new AppError(503, 'Upload failed. Please retry before the deadline.');
      }
      return action(profile.id, db, 'finish', {
        challengeId,
        proofId: s.id,
        review: await verifier.review(image, 'Human review required'),
      });
    },
  );
  app.get<{ Params: { id: string; proofId: string } }>(
    '/api/challenges/:id/evidence/:proofId/photo',
    async (req, reply) => {
      const { profile, db } = await authenticate(req);
      const challengeId = z.uuid().parse(req.params.id),
        proofId = z.uuid().parse(req.params.proofId);
      const s = await action(profile.id, db, 'photo', { challengeId, proofId });
      let bytes: Buffer;
      if (local)
        bytes = await readFile(join(dirname(config.dataFile), 'evidence', `${s.id}.jpg`)).catch(
          () => {
            throw new AppError(404, 'Photo is not available.');
          },
        );
      else {
        const r = await db!.storage.from('evidence').download(s.path);
        if (r.error) throw new AppError(404, 'Photo is not available.');
        bytes = Buffer.from(await r.data.arrayBuffer());
      }
      // Revalidate even objects uploaded directly through the Storage API. Never serve arbitrary bytes.
      return reply
        .type('image/jpeg')
        .header('X-Content-Type-Options', 'nosniff')
        .send(await normalizePhoto(bytes));
    },
  );
  for (const name of ['vote', 'dispute'])
    app.post<{ Params: { id: string; proofId: string } }>(
      `/api/challenges/:id/evidence/:proofId/${name}`,
      async (req) => {
        const { profile, db } = await authenticate(req);
        const p = (
          name === 'vote'
            ? z.object({
                decision: z.enum(['accept', 'reject']),
                reason: z.string().trim().min(5).max(500),
              })
            : z.object({ reason: z.string().trim().min(10).max(500) })
        ).parse(req.body);
        return action(profile.id, db, name, {
          ...p,
          challengeId: z.uuid().parse(req.params.id),
          proofId: z.uuid().parse(req.params.proofId),
        });
      },
    );
}
