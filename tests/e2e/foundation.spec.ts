import { expect, test } from '@playwright/test';

test('landing → register → onboarding → dashboard → saved settings → logout → login', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const suffix = `${Date.now()}${testInfo.project.name[0]}`;
  const email = `qa-${suffix}@example.test`;
  const password = 'stakeup test password 123';
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Private accountability/ })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('landing.png'), fullPage: true });
  await expect(
    page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).resolves.toBe(true);
  await page.locator('.kl-actions').getByRole('link', { name: 'Start a circle' }).click();
  await page.getByLabel('Username', { exact: true }).fill(`qa_${suffix}`);
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Create your account' }).click();
  await expect(page.getByRole('heading', { name: 'Set up your profile' })).toBeVisible();
  await page.getByLabel('Display name').fill('Maya');
  await page.getByLabel('Timezone', { exact: true }).selectOption('Asia/Bishkek');
  await page.getByRole('button', { name: 'Make yourself at home' }).click();
  await expect(page.getByRole('heading', { name: /Hey, Maya/ })).toBeVisible();
  await expect(page.locator('.stitch-overview')).toHaveCSS('opacity', '1');
  await expect(page.getByText('Your day one. Officially.')).toBeVisible();
  await expect(page.getByText('You made yourself at home.')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: /Hey, Maya/ })).toBeVisible();
  await expect(page.locator('.stitch-overview')).toHaveCSS('opacity', '1');
  await expect(
    page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).resolves.toBe(true);
  await page.screenshot({ path: testInfo.outputPath('dashboard.png'), fullPage: true });
  await page.getByRole('link', { name: 'View badges and points', exact: true }).click();
  await expect(page).toHaveURL(/\/app\/members\/[0-9a-f-]+$/);
  await expect(page.getByRole('heading', { name: 'Achievements', exact: true })).toBeVisible();
  await expect(page.locator('.member-badge')).toHaveCount(4);
  await expect(page.locator('.member-hero')).toContainText('0 progress points');
  // The join entry works without an invitation already stored in the URL/session.
  await page.goto('/join');
  await expect(page.getByLabel('Invitation link or code')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  // Navigate directly to prove protected deep links render and session restoration works.
  await page.goto('/app/settings');
  await expect(
    page.getByRole('link', { name: 'View badges and points', exact: true }),
  ).toBeVisible();
  await page.getByLabel('Display name').fill('Maya Chen');
  await page.getByLabel('A little about you').fill('One chapter, one morning, one small win.');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Your changes are saved.')).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Display name')).toHaveValue('Maya Chen');
  await expect(page.getByLabel('Timezone', { exact: true })).toHaveValue('Asia/Bishkek');
  await page.goto('/app/circles');
  await expect(page.getByRole('link', { name: 'Create a circle', exact: true })).toBeVisible();
  await page.goto('/app/settings');
  await page.getByRole('button', { name: 'Log out of this account' }).click();
  await page.goto('/app');
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Let’s get back to it' }).click();
  await expect(page.getByRole('heading', { name: /Hey, Maya/ })).toBeVisible();
  expect(errors).toEqual([]);
});

test('forgot password local mailbox resets password and allows sign-in', async ({
  page,
}, testInfo) => {
  const suffix = `${Date.now()}${testInfo.project.name[0]}`;
  const email = `recovery-${suffix}@example.test`;
  await page.request.post('/api/auth/register', {
    headers: { Origin: 'http://localhost:5173' },
    data: { email, password: 'initial password 123', username: `r_${suffix}` },
  });
  await page.request.post('/api/auth/logout', { headers: { Origin: 'http://localhost:5173' } });
  await page.goto('/forgot-password');
  await page.getByLabel('Email address').fill(email);
  await page.getByRole('button', { name: 'Send recovery link' }).click();
  await page.getByRole('link', { name: /Open local recovery mailbox/ }).click();
  await page.getByLabel('Password', { exact: true }).fill('new stronger password 123');
  await page.getByRole('button', { name: 'Update password' }).click();
  await expect(page.getByText('Password updated. You can now sign in.')).toBeVisible();
  await page.getByRole('link', { name: 'Back to login' }).click();
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('new stronger password 123');
  await page.getByRole('button', { name: 'Let’s get back to it' }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
});
