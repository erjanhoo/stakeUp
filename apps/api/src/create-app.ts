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
  resetRequestSchema,
  resetPasswordSchema,
  type Profile,
  type Dashboard,
} from '@stakeup/contracts';
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
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });
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
  const authOptions = { config: { rateLimit: { max: 12, timeWindow: '1 minute' } } };
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
    // No challenge/circle entities exist in phase 1. New accounts truthfully have zero.
    return dashboard;
  });
  return app;
}
