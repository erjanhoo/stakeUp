import { it, expect } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildApp } from './create-app.js';

it('persists account currency, themes and top-ups; retries are idempotent and balances stay private', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'stakeup-wallet-'));
  const origin = 'http://localhost:5173';
  const app = await buildApp({
    mode: 'local',
    production: false,
    origin,
    dataFile: join(directory, 'wallet.json'),
  });
  try {
    const register = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { origin },
      payload: { email: 'wallet@example.test', username: 'wallet', password: 'eightPwd' },
    });
    const cookie = { stakeup_session: register.cookies[0].value };
    expect((await app.inject({ url: '/api/me/wallet' })).statusCode).toBe(401);
    for (const currency of ['KGS', 'EUR'])
      expect(
        (
          await app.inject({
            method: 'PATCH',
            url: '/api/me/currency',
            cookies: cookie,
            headers: { origin },
            payload: { currency },
          })
        ).json().currency,
      ).toBe(currency);
    for (const accent of ['blue', 'violet'])
      expect(
        (
          await app.inject({
            method: 'PATCH',
            url: '/api/me/appearance',
            cookies: cookie,
            headers: { origin },
            payload: { mode: 'dark', accent },
          })
        ).json().appearance.accent,
      ).toBe(accent);
    const payload = { amountMinor: 12550, requestId: crypto.randomUUID() };
    const topup = () =>
      app.inject({
        method: 'POST',
        url: '/api/me/wallet/top-up',
        cookies: cookie,
        headers: { origin },
        payload,
      });
    const attempts = await Promise.all([topup(), topup()]);
    for (const result of attempts)
      expect(result.json()).toMatchObject({
        balanceMinor: 12550,
        pendingPenaltyMinor: 0,
        entries: [{ kind: 'top_up', amountMinor: 12550 }],
      });
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/me/wallet/top-up',
          cookies: cookie,
          headers: { origin },
          payload: { ...payload, amountMinor: 20000 },
        })
      ).statusCode,
    ).toBe(409);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/me/wallet/top-up',
          cookies: cookie,
          headers: { origin },
          payload: { amountMinor: -1, requestId: crypto.randomUUID() },
        })
      ).statusCode,
    ).toBe(400);
    const other = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { origin },
      payload: {
        email: 'other-wallet@example.test',
        username: 'other_wallet',
        password: 'eightPwd',
      },
    });
    expect(
      (
        await app.inject({
          url: '/api/me/wallet',
          cookies: { stakeup_session: other.cookies[0].value },
        })
      ).json(),
    ).toMatchObject({ balanceMinor: 0, entries: [] });
    expect((await app.inject({ url: '/api/me', cookies: cookie })).json()).toMatchObject({
      currency: 'EUR',
      appearance: { mode: 'dark', accent: 'violet' },
    });
  } finally {
    await app.close();
  }
});
