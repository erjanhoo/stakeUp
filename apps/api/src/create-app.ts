import { memberRoutes } from './member-routes.js';
import { evidenceRoutes } from './evidence-routes.js';
import Fastify, {
  type FastifyReply,
  type FastifyInstance,
  type FastifyServerOptions,
} from 'fastify';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ZodError } from 'zod';
import {
  loginSchema,
  registerSchema,
  profileSchema,
  appearanceSchema,
  currencySchema,
  topUpSchema,
  circleSchema,
  challengeSchema,
  invitationSchema,
  resetRequestSchema,
  resetPasswordSchema,
  type Profile,
  type Dashboard,
  type SocialAction,
} from '@stakeup/contracts';
import { z } from 'zod';
import { schedule, requireFutureStart } from './domain/challenges.js';
import { AppError, LocalStore } from './local-store.js';
import type { Config } from './config.js';

export function serverOptions(): FastifyServerOptions {
  return {
    logger: {
      level: process.env.NODE_ENV === 'test' ? 'silent' : 'info',
      redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
    },
    bodyLimit: 16_384,
    trustProxy: false,
  };
}

export async function buildApp(config: Config) {
  return configureApp(Fastify(serverOptions()), config);
}

export async function configureApp(app: FastifyInstance, config: Config) {
  await app.register(cookie);
  await app.register(helmet);
  const e2e = config.mode === 'local' && process.env.STAKEUP_E2E === '1';
  await app.register(rateLimit, { max: e2e ? 1000 : 100, timeWindow: '1 minute' });
  const local = config.mode === 'local' ? new LocalStore(config.dataFile) : null;
  app.addHook('onRequest', async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    if (
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) &&
      request.headers.origin !== config.origin
    ) {
      throw new AppError(403, 'This request origin is not allowed.');
    }
  });
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError)
      return reply
        .code(400)
        .send({ message: error.issues[0]?.message ?? 'Invalid input.', requestId: request.id });
    const status =
      error instanceof AppError
        ? error.status
        : ((error as { statusCode?: number }).statusCode ?? 500);
    if (status >= 500) request.log.error({ err: error, requestId: request.id }, 'Request failed');
    return reply.code(status).send({
      message: status >= 500 ? 'Something went wrong. Please try again.' : (error as Error).message,
      requestId: request.id,
    });
  });
  function client(token: string) {
    return createClient(config.supabaseUrl!, config.supabaseKey!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  function dbError(error: { code?: string; message: string }) {
    if (error.code === '23505') throw new AppError(409, 'That username is already taken.');
    throw new Error(`Database operation failed (${error.code ?? 'unknown'}).`);
  }
  function mapProfile(row: Record<string, unknown>, email: string): Profile {
    return {
      id: String(row.id),
      email,
      username: String(row.username),
      displayName: String(row.display_name),
      timezone: String(row.timezone),
      bio: String(row.bio),
      onboardingCompleted: !!row.onboarding_completed_at,
      appearance: {
        mode: row.theme_mode === 'light' ? 'light' : 'dark',
        accent: appearanceSchema.shape.accent.catch('orange').parse(row.theme_accent),
      },
      language: row.language === 'ru' ? 'ru' : 'en',
      currency: currencySchema.catch('USD').parse(row.currency),
      createdAt: String(row.created_at),
    };
  }
  async function authenticate(request: {
    cookies: Record<string, string | undefined>;
    headers: { authorization?: string };
  }): Promise<{ profile: Profile; db?: SupabaseClient }> {
    if (local) return { profile: await local.me(request.cookies.stakeup_session) };
    const token = request.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    if (!token) throw new AppError(401, 'Please sign in to continue.');
    const db = client(token);
    const { data, error } = await db.auth.getUser(token);
    if (error || !data.user)
      throw new AppError(401, 'Your session has expired. Please sign in again.');
    const result = await db.from('profiles').select('*').eq('id', data.user.id).single();
    if (result.error) dbError(result.error);
    return { profile: mapProfile(result.data!, data.user.email ?? ''), db };
  }
  const authOptions = { config: { rateLimit: { max: e2e ? 120 : 12, timeWindow: '1 minute' } } };
  const setSession = (reply: FastifyReply, token: string) =>
    reply.setCookie('stakeup_session', token, {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 86400,
      secure: false,
    });
  app.get('/api/health', async () => ({ status: 'ok' }));
  app.get('/api/config', async () => ({ authMode: config.mode }));
  app.post('/api/auth/register', authOptions, async (request, reply) => {
    if (!local) throw new AppError(404, 'Use Supabase Authentication.');
    const input = registerSchema.parse(request.body);
    const { profile, token } = await local.register(input.email, input.password, input.username);
    setSession(reply, token);
    return reply.code(201).send(profile);
  });
  app.post('/api/auth/login', authOptions, async (request, reply) => {
    if (!local) throw new AppError(404, 'Use Supabase Authentication.');
    const input = loginSchema.parse(request.body);
    const { profile, token } = await local.login(input.email, input.password);
    setSession(reply, token);
    return profile;
  });
  app.post('/api/auth/logout', async (request, reply) => {
    if (!local) throw new AppError(404, 'Use Supabase Authentication.');
    await local.logout(request.cookies.stakeup_session);
    reply.clearCookie('stakeup_session', { path: '/' });
    return { ok: true };
  });
  app.post('/api/auth/recovery', authOptions, async (request) => {
    if (!local) throw new AppError(404, 'Use Supabase Authentication.');
    const { email } = resetRequestSchema.parse(request.body);
    const token = await local.requestReset(email);
    // A deliberately visible LOCAL recovery mailbox. This route cannot run in production.
    return {
      message: 'If this local account exists, a recovery link is shown below.',
      recoveryUrl: token ? `${config.origin}/reset-password#token=${token}` : null,
    };
  });
  app.post('/api/auth/reset', authOptions, async (request) => {
    if (!local) throw new AppError(404, 'Use Supabase Authentication.');
    const input = resetPasswordSchema.parse(request.body);
    await local.reset(input.token, input.password);
    return { ok: true };
  });
  app.get('/api/me', async (request) => (await authenticate(request)).profile);
  app.patch('/api/me/language', async (req) => {
    const { language } = z.object({ language: z.enum(['en', 'ru']) }).parse(req.body);
    const { profile, db } = await authenticate(req);
    if (local) return local.language(profile.id, language);
    const r = await db!
      .from('profiles')
      .update({ language })
      .eq('id', profile.id)
      .select('*')
      .single();
    if (r.error) dbError(r.error);
    return mapProfile(r.data!, profile.email);
  });
  async function community(
    req: Parameters<typeof authenticate>[0],
    action: string,
    p: Record<string, unknown> = {},
  ) {
    const { profile, db } = await authenticate(req);
    if (local) return local.community(profile.id, action, p);
    const r = await db!.rpc('stakeup_community', { p_action: action, p_payload: p });
    if (r.error)
      throw new AppError(
        r.error.code === '42501' ? 403 : 409,
        ['P0001', '42501'].includes(r.error.code) ? r.error.message : 'Unable to update this item.',
      );
    return r.data;
  }
  app.get('/api/notifications', (req) => community(req, 'notifications'));
  app.post('/api/notifications/read', (req) =>
    community(req, 'read', z.object({ id: z.uuid().optional() }).parse(req.body)),
  );
  app.get('/api/me/recap', (req) => community(req, 'recap'));
  app.patch('/api/me/currency', async (req) => {
    const { currency } = z.object({ currency: currencySchema }).parse(req.body);
    const { profile, db } = await authenticate(req);
    if (local) return local.currency(profile.id, currency);
    const result = await db!
      .from('profiles')
      .update({ currency })
      .eq('id', profile.id)
      .select('*')
      .single();
    if (result.error) dbError(result.error);
    return mapProfile(result.data!, profile.email);
  });
  for (const method of ['GET', 'POST'] as const)
    app.route({
      method,
      url: method === 'GET' ? '/api/me/wallet' : '/api/me/wallet/top-up',
      handler: async (req) => {
        const { profile, db } = await authenticate(req);
        const topUp = method === 'POST' ? topUpSchema.parse(req.body) : undefined;
        if (local) return local.wallet(profile.id, topUp);
        const result = await db!.rpc('stakeup_wallet', {
          p_amount: topUp?.amountMinor ?? null,
          p_request: topUp?.requestId ?? null,
        });
        if (result.error)
          throw new AppError(
            result.error.code === '42501' ? 403 : 409,
            result.error.code === 'P0001' ? result.error.message : 'Unable to load your balance.',
          );
        return result.data;
      },
    });
  app.get<{ Params: { id: string } }>('/api/challenges/:id/grace', (req) =>
    community(req, 'grace_list', { challengeId: z.uuid().parse(req.params.id) }),
  );
  for (const name of ['choose', 'cancel'])
    app.post<{ Params: { id: string } }>(`/api/challenges/:id/grace/${name}`, (req) =>
      community(req, 'grace_' + name, {
        ...z.object({ obligationId: z.uuid() }).parse(req.body),
        challengeId: z.uuid().parse(req.params.id),
      }),
    );
  app.get<{ Params: { id: string; proofId: string } }>(
    '/api/challenges/:id/evidence/:proofId/social',
    (req) =>
      community(req, 'social', {
        challengeId: z.uuid().parse(req.params.id),
        proofId: z.uuid().parse(req.params.proofId),
      }),
  );
  for (const action of ['comment', 'react', 'delete_comment'])
    app.post<{ Params: { id: string; proofId: string } }>(
      `/api/challenges/:id/evidence/:proofId/${action}`,
      (req) =>
        community(req, action, {
          ...(action === 'comment'
            ? z.object({ body: z.string().trim().min(1).max(1000) })
            : action === 'react'
              ? z.object({ emoji: z.enum(['clap', 'fire', 'heart']) })
              : z.object({ id: z.uuid() })
          ).parse(req.body),
          challengeId: z.uuid().parse(req.params.id),
          proofId: z.uuid().parse(req.params.proofId),
        }),
    );
  app.patch('/api/me/appearance', async (request) => {
    const appearance = appearanceSchema.parse(request.body);
    const { profile, db } = await authenticate(request);
    if (local) return local.appearance(profile.id, appearance);
    const result = await db!
      .from('profiles')
      .update({ theme_mode: appearance.mode, theme_accent: appearance.accent })
      .eq('id', profile.id)
      .select('*')
      .single();
    if (result.error) dbError(result.error);
    return mapProfile(result.data!, profile.email);
  });
  app.patch('/api/me', async (request) => {
    const input = profileSchema.parse(request.body);
    const { profile, db } = await authenticate(request);
    if (local) return local.update(profile.id, input);
    const result = await db!
      .from('profiles')
      .update({
        username: input.username,
        display_name: input.displayName,
        timezone: input.timezone,
        bio: input.bio,
        onboarding_completed_at:
          profile.onboardingCompleted || input.onboardingCompleted
            ? new Date().toISOString()
            : null,
      })
      .eq('id', profile.id)
      .select('*')
      .single();
    if (result.error) dbError(result.error);
    return mapProfile(result.data!, profile.email);
  });
  app.get('/api/dashboard', async (request) => {
    const { profile, db } = await authenticate(request);
    const dashboard: Dashboard = {
      activeChallenges: 0,
      circleCount: 0,
      acceptedDays: 0,
      virtualPoolMinor: 0,
      activities: [],
    };
    if (local) dashboard.activities = await local.activities(profile.id);
    else {
      const { data, error } = await db!
        .from('audit_events')
        .select('id,kind,created_at')
        .eq('actor_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) dbError(error);
      dashboard.activities = (data ?? []).map((row) => ({
        id: row.id,
        kind: row.kind,
        createdAt: row.created_at,
      }));
    }
    const social = (await socialData(profile.id, db, 'dashboard')) as {
      circleCount: number;
      activeChallenges: number;
      commitments: Dashboard['commitments'];
    };
    Object.assign(dashboard, social);
    if (local) {
      dashboard.acceptedDays = await local.acceptedProofDays(profile.id);
      dashboard.virtualPoolMinor = await local.projectedPools(profile.id);
    } else {
      const accepted = await db!
        .from('evidence_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('status', 'accepted');
      if (accepted.error) dbError(accepted.error);
      dashboard.acceptedDays = accepted.count ?? 0;
      const totals = await db!.rpc('stakeup_competition_totals');
      if (totals.error) dbError(totals.error);
      dashboard.virtualPoolMinor = Number(totals.data ?? 0);
    }
    return dashboard;
  });
  async function socialData(
    userId: string,
    db: SupabaseClient | undefined,
    action: SocialAction,
    payload: Record<string, unknown> = {},
  ): Promise<unknown> {
    if (local) return local.social(userId, action, payload);
    const { data, error } = await db!.rpc('stakeup_social', {
      p_action: action,
      p_payload: payload,
    });
    if (error) {
      if (['P0001', '22023', '23514', '22P02'].includes(error.code))
        throw new AppError(409, error.message);
      if (error.code === '42501') throw new AppError(403, 'You don’t have permission to do this.');
      throw new Error(`Social database operation failed (${error.code}).`);
    }
    return data;
  }
  const idSchema = z.uuid();
  app.get('/api/circles', async (request) => {
    const { profile, db } = await authenticate(request);
    return socialData(profile.id, db, 'list');
  });
  app.post('/api/circles', async (request, reply) => {
    const input = circleSchema.parse(request.body);
    const { profile, db } = await authenticate(request);
    return reply.code(201).send(await socialData(profile.id, db, 'create_circle', input));
  });
  app.post('/api/invitations/join', async (request) => {
    const input = invitationSchema.parse(request.body);
    const { profile, db } = await authenticate(request);
    return socialData(profile.id, db, 'join', input);
  });
  app.get<{ Params: { id: string } }>('/api/circles/:id', async (request) => {
    const circleId = idSchema.parse(request.params.id);
    const { profile, db } = await authenticate(request);
    return socialData(profile.id, db, 'circle', { circleId });
  });
  app.patch<{ Params: { id: string } }>('/api/circles/:id', async (request) => {
    const circleId = idSchema.parse(request.params.id);
    const input = circleSchema.parse(request.body);
    const { profile, db } = await authenticate(request);
    return socialData(profile.id, db, 'update_circle', { circleId, input });
  });
  for (const action of ['invite', 'leave', 'archive'] as const)
    app.post<{ Params: { id: string } }>(`/api/circles/:id/${action}`, async (request) => {
      const circleId = idSchema.parse(request.params.id);
      const { profile, db } = await authenticate(request);
      return socialData(profile.id, db, action, { circleId });
    });
  app.post<{ Params: { id: string } }>('/api/circles/:id/challenges', async (request, reply) => {
    const circleId = idSchema.parse(request.params.id);
    const rules = challengeSchema.parse(request.body);
    schedule(rules);
    requireFutureStart(rules);
    const { profile, db } = await authenticate(request);
    return reply
      .code(201)
      .send(await socialData(profile.id, db, 'create_challenge', { circleId, rules }));
  });
  app.get<{ Params: { id: string } }>('/api/challenges/:id', async (request) => {
    const challengeId = idSchema.parse(request.params.id);
    const { profile, db } = await authenticate(request);
    return socialData(profile.id, db, 'challenge', { challengeId });
  });
  for (const action of ['accept', 'withdraw', 'activate', 'cancel'] as const)
    app.post<{ Params: { id: string } }>(`/api/challenges/:id/${action}`, async (request) => {
      const challengeId = idSchema.parse(request.params.id);
      const input =
        action === 'accept'
          ? z.object({ rulesHash: z.string().regex(/^[a-f0-9]{64}$/) }).parse(request.body)
          : {};
      const { profile, db } = await authenticate(request);
      return socialData(profile.id, db, action, { challengeId, ...input });
    });
  for (const method of ['GET', 'POST'] as const)
    app.route<{ Params: { id: string } }>({
      method,
      url: '/api/challenges/:id/competition',
      handler: async (req) => {
        const { profile, db } = await authenticate(req);
        const id = z.uuid().parse(req.params.id);
        if (local) return local.competition(profile.id, id, method === 'POST');
        const r = await db!.rpc('stakeup_competition', {
          p_challenge: id,
          p_settle: method === 'POST',
        });
        if (r.error) throw new AppError(r.error.code === '42501' ? 403 : 409, r.error.message);
        return r.data;
      },
    });
  evidenceRoutes(app, config, local, authenticate);
  memberRoutes(app, config, local, authenticate);
  return app;
}
