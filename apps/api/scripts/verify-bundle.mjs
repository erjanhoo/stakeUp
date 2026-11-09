import { createServer } from 'node:http';
import assert from 'node:assert/strict';

// Exercise the exact production artifact without reaching any external service.
Object.assign(process.env, {
  NODE_ENV: 'production',
  AUTH_MODE: 'supabase',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'test-public-key-not-used-without-a-token',
  APP_ORIGIN: 'https://stakeup.example',
});
const { default: handler } = await import('../api/index.mjs');
const server = createServer(handler);
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
try {
  const health = await fetch(`${origin}/api/health`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: 'ok' });
  const config = await fetch(`${origin}/api/config`);
  assert.deepEqual(await config.json(), { authMode: 'supabase' });
  assert.equal((await fetch(`${origin}/api/me`)).status, 401);
  assert.equal(
    (
      await fetch(`${origin}/api/auth/recovery`, {
        method: 'POST',
        headers: { Origin: 'https://stakeup.example' },
      })
    ).status,
    404,
  );
  console.log(
    'Production bundle verified: health, configuration, authorization, and disabled local recovery.',
  );
} finally {
  await new Promise((resolve) => server.close(resolve));
}
