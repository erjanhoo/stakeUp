import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
export interface Config {
  mode: 'local' | 'supabase';
  production: boolean;
  origin: string;
  dataFile: string;
  supabaseUrl?: string;
  supabaseKey?: string;
}
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const production = env.NODE_ENV === 'production' || !!env.VERCEL;
  const mode = env.AUTH_MODE ?? (production ? 'supabase' : 'local');
  if (mode !== 'local' && mode !== 'supabase')
    throw new Error('AUTH_MODE must be local or supabase.');
  if (mode === 'local' && production)
    throw new Error('Local authentication is forbidden in production.');
  if (mode === 'supabase' && (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY))
    throw new Error('Supabase URL and publishable key are required.');
  const origin = env.APP_ORIGIN ?? 'http://localhost:5173';
  if (new URL(origin).origin !== origin)
    throw new Error('APP_ORIGIN must be an origin without a path.');
  if (
    mode === 'local' &&
    (!['localhost', '127.0.0.1'].includes(new URL(origin).hostname) ||
      !origin.startsWith('http://'))
  )
    throw new Error('Local authentication requires an HTTP loopback APP_ORIGIN.');
  if (production && !origin.startsWith('https://'))
    throw new Error('Production APP_ORIGIN requires HTTPS.');
  return {
    mode,
    production,
    origin,
    dataFile: resolve(
      fileURLToPath(new URL('../../../', import.meta.url)),
      env.LOCAL_DATA_FILE ?? '.local/stakeup.json',
    ),
    supabaseUrl: env.SUPABASE_URL,
    supabaseKey: env.SUPABASE_PUBLISHABLE_KEY,
  };
}
