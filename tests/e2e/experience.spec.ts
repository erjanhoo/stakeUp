import { test, expect } from '@playwright/test';

test('restores the homepage session, tops up in the selected currency, and opens circles and invitation fields in place', async ({
  page,
  browser,
}, info) => {
  test.setTimeout(90000);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const origin = 'http://localhost:5173',
    suffix = `${Date.now()}${info.project.name[0]}`;
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const r = await page.request.post('/api/auth/register', {
    headers: { origin },
    data: { email: `xp_${suffix}@example.test`, username: `xp_${suffix}`, password: 'eightPwd' },
  });
  expect(r.ok()).toBe(true);
  const profile = await r.json();
  await page.request.patch('/api/me', {
    headers: { origin },
    data: {
      username: profile.username,
      displayName: 'Maya',
      timezone: 'Asia/Bishkek',
      bio: '',
      onboardingCompleted: true,
    },
  });
  const circle = await (
    await page.request.post('/api/circles', {
      headers: { origin },
      data: { name: 'Orbit crew', description: 'A little better every day.', icon: 'rocket' },
    })
  ).json();
  await page.goto('/');
  await expect(page).toHaveURL(origin + '/app');
  await expect(page.getByRole('heading', { name: 'Hey, Maya.' })).toBeVisible();
  await page.goto('/app/settings');
  await page.getByLabel('Display currency').selectOption('KGS');
  await expect(page.getByLabel('Display currency')).toBeEnabled();
  await page.getByLabel('Top-up amount').fill('125.50');
  await page.getByRole('button', { name: 'Add to balance', exact: true }).click();
  await expect(page.getByText('Balance updated.', { exact: true })).toBeVisible();
  await expect(page.locator('.wallet-amount')).toContainText('125.50');
  await expect(page.locator('.wallet-amount')).toContainText('KGS');
  for (const [name, accent] of [
    ['Ocean blue', 'blue'],
    ['Soft violet', 'violet'],
    ['Electric lime', 'lime'],
  ]) {
    await page.getByRole('button', { name, exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-accent', accent);
    await expect(page.getByRole('button', { name, exact: true })).toBeEnabled();
  }
  await page.reload();
  await expect(page.getByLabel('Display currency')).toHaveValue('KGS');
  await expect(page.locator('.wallet-amount')).toContainText('125.50');
  await page.locator('#wallet').scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('wallet-viewport.png') });
  await page.screenshot({ path: info.outputPath('settings-wallet.png'), fullPage: true });
  await page.goto('/app/circles');
  const card = page.locator('.st-circle-card').filter({ hasText: 'Orbit crew' });
  await card.getByRole('link', { name: 'Orbit crew', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/app/circles/${circle.id}$`));
  await page.goto('/app/circles');
  await page.locator('.st-circle-card-metrics').click();
  await expect(page).toHaveURL(new RegExp(`/app/circles/${circle.id}$`));
  await page.goto('/app/circles');
  await page
    .locator('.st-header-actions')
    .getByRole('button', { name: 'Join circle', exact: true })
    .click();
  await page.getByLabel('Invitation link or code').fill('invalid');
  await page.evaluate(() => window.scrollBy(0, 160));
  const joinSubmit = page
    .locator('.join-popover')
    .getByRole('button', { name: 'Join circle', exact: true });
  await expect(joinSubmit).toBeInViewport();
  await expect
    .poll(() =>
      joinSubmit.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return (
          document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest('button') === el
        );
      }),
    )
    .toBe(true);
  await page
    .locator('.join-popover')
    .getByRole('button', { name: 'Join circle', exact: true })
    .click();
  await expect(page.locator('.join-popover').getByRole('alert')).toBeVisible();
  await expect(page).toHaveURL(origin + '/app/circles');
  await page.keyboard.press('Escape');
  await expect(page.locator('.join-popover')).toHaveCount(0);
  await expect(page.locator('.st-header-actions .join-dropdown > button')).toBeFocused();
  for (const width of [1440, 1024, 820, 390, 320]) {
    await page.setViewportSize({ width, height: 950 });
    await expect(page.locator('.st-header-actions .join-dropdown > button')).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      `circles at ${width}`,
    ).toBe(true);
  }
  await page.setViewportSize(info.project.use.viewport!);
  await page.screenshot({ path: info.outputPath('circles.png'), fullPage: true });
  await page.goto(`/app/members/${profile.id}`);
  await expect(page.getByRole('progressbar', { name: 'Achievement progress' })).toHaveAttribute(
    'aria-valuenow',
    '0',
  );
  await page.screenshot({ path: info.outputPath('achievements.png'), fullPage: true });
  const guest = await browser.newContext(info.project.use);
  try {
    const p = await guest.newPage();
    await p.goto('/');
    await p.getByRole('button', { name: 'I have an invitation', exact: true }).click();
    await expect(p.getByLabel('Invitation link or code')).toBeVisible();
    await expect(p).toHaveURL(origin + '/');
    await p.screenshot({ path: info.outputPath('guest-invitation.png'), fullPage: true });
  } finally {
    await guest.close();
  }
  expect(errors).toEqual([]);
});
