import { afterEach, expect, it, vi } from 'vitest';
import { api, ApiError } from './api';

afterEach(() => vi.unstubAllGlobals());

it('rejects a successful HTML response instead of treating an SPA fallback as a user profile', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(new Response('<!doctype html><title>StakeUp</title>', { status: 200 })),
  );
  await expect(api('/me')).rejects.toMatchObject({
    status: 502,
    message: expect.stringContaining('API routing'),
  });
});

it('preserves API authentication failure status for session-expiry handling', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        Response.json({ message: 'Please sign in to continue.' }, { status: 401 }),
      ),
  );
  const request = api('/me');
  await expect(request).rejects.toBeInstanceOf(ApiError);
  await expect(request).rejects.toMatchObject({ status: 401 });
});
