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
  await expect(page.getByRole('heading', { name: /Big goals/ })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('landing.png'), fullPage: true });
  await expect(
    page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).resolves.toBe(true);
  await page.getByRole('link', { name: 'Find your momentum' }).click();
  await page.getByLabel('Username', { exact: true }).fill(`qa_${suffix}`);
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Create your account' }).click();
  await expect(page.getByRole('heading', { name: 'Let’s make this yours.' })).toBeVisible();
  await page.getByLabel('Display name').fill('Maya');
  await page.getByLabel('Timezone', { exact: true }).selectOption('Asia/Bishkek');
  await page.getByRole('button', { name: 'Make yourself at home' }).click();
  await expect(page.getByRole('heading', { name: /Hey, Maya/ })).toBeVisible();
  await expect(page.locator('.momentum-banner')).toHaveCSS('opacity', '1');
  await expect(page.getByText('Your day one. Officially.')).toBeVisible();
  await expect(page.getByText('You made yourself at home.')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: /Hey, Maya/ })).toBeVisible();
  await expect(page.locator('.momentum-banner')).toHaveCSS('opacity', '1');
  await expect(
    page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).resolves.toBe(true);
  await page.screenshot({ path: testInfo.outputPath('dashboard.png'), fullPage: true });
  // Navigate directly to prove protected deep links render and session restoration works.
  await page.goto('/app/settings');
  await page.getByLabel('Display name').fill('Maya Chen');
  await page.getByLabel('A little about you').fill('One chapter, one morning, one small win.');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Your changes are saved.')).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Display name')).toHaveValue('Maya Chen');
  await expect(page.getByLabel('Timezone', { exact: true })).toHaveValue('Asia/Bishkek');
  await page.goto('/app/circles');
  await expect(page.getByRole('button', { name: /Create a circle/ })).toBeDisabled();
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
