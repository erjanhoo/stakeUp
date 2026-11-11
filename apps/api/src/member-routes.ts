import type { FastifyInstance } from 'fastify';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import type { Config } from './config.js';
import type { LocalStore } from './local-store.js';
import { AppError } from './errors.js';
import { normalizePhoto } from './domain/evidence.js';
export function memberRoutes(
  app: FastifyInstance,
  config: Config,
  local: LocalStore | null,
  authenticate: (r: {
    cookies: Record<string, string | undefined>;
    headers: { authorization?: string };
  }) => Promise<{ profile: { id: string }; db?: SupabaseClient }>,
) {
  async function profile(viewer: string, target: string, db?: SupabaseClient) {
    if (local) return local.memberProfile(viewer, target);
    const r = await db!.rpc('stakeup_member_profile', { p_user: target });
    if (r.error) throw new AppError(404, 'Profile not found.');
    return r.data;
  }
  app.get<{ Params: { id: string } }>('/api/members/:id', async (req) => {
    const a = await authenticate(req);
    return profile(a.profile.id, z.uuid().parse(req.params.id), a.db);
  });
  app.get<{ Params: { id: string } }>('/api/members/:id/avatar', async (req, reply) => {
    const a = await authenticate(req),
      id = z.uuid().parse(req.params.id);
    await profile(a.profile.id, id, a.db);
    let bytes: Buffer;
    if (local) {
      try {
        bytes = await readFile(join(dirname(config.dataFile), 'avatars', id + '.jpg'));
      } catch {
        throw new AppError(404, 'Avatar not found.');
      }
    } else {
      const r = await a.db!.storage.from('avatars').download(id + '/profile.jpg');
      if (r.error) throw new AppError(404, 'Avatar not found.');
      bytes = Buffer.from(await r.data.arrayBuffer());
    }
    return reply
      .type('image/jpeg')
      .header('X-Content-Type-Options', 'nosniff')
      .send(await normalizePhoto(bytes));
  });
  app.post(
    '/api/me/avatar',
    { bodyLimit: 3500000, config: { rateLimit: { max: 8, timeWindow: '1 minute' } } },
    async (req) => {
      const a = await authenticate(req),
        p = z
          .object({
            photo: z
              .string()
              .min(1)
              .max(3340000)
              .regex(/^[A-Za-z0-9+/]+={0,2}$/),
          })
          .parse(req.body);
      const bytes = await sharp(await normalizePhoto(Buffer.from(p.photo, 'base64')))
        .resize(256, 256, { fit: 'cover' })
        .jpeg({ quality: 85 })
        .toBuffer();
      if (local) {
        const dir = join(dirname(config.dataFile), 'avatars');
        await mkdir(dir, { recursive: true });
        await writeFile(join(dir, a.profile.id + '.jpg'), bytes, { mode: 0o600 });
      } else {
        const r = await a.db!.storage.from('avatars').upload(a.profile.id + '/profile.jpg', bytes, {
          contentType: 'image/jpeg',
          upsert: true,
        });
        if (r.error) throw new AppError(503, 'Unable to save profile photo.');
      }
      return { ok: true };
    },
  );
}
