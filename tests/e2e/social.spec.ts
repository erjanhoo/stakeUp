import { expect, test, type Page } from '@playwright/test';
async function signup(page: Page, username: string, name: string) {
  await page.goto('/register');
  await page.getByLabel('Username', { exact: true }).fill(username);
  await page.getByLabel('Email address').fill(`${username}@example.test`);
  await page.getByLabel('Password', { exact: true }).fill('eightPwd');
  await page.getByRole('button', { name: 'Create your account' }).click();
  await page.getByLabel('Display name').fill(name);
  await page.getByLabel('Timezone', { exact: true }).selectOption('Asia/Bishkek');
  await page.getByRole('button', { name: 'Make yourself at home' }).click();
  await expect(page.getByRole('heading', { name: new RegExp(`Hey, ${name}`) })).toBeVisible();
}
test('two friends create a private circle, accept immutable rules and activate a frozen schedule', async ({
  page,
  browser,
}, info) => {
  test.setTimeout(60000);
  const suffix = `${Date.now()}${info.project.name[0]}`;
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await signup(page, `a_${suffix}`, 'Avery');
  await page.goto('/app/circles');
  await page.getByRole('link', { name: 'Create a circle', exact: true }).click();
  await page.getByLabel('Circle name').fill('The reading crew');
  await page.getByLabel('Description', { exact: true }).fill('A chapter at a time. Together.');
  await page.getByRole('combobox', { name: /^Circle icon/ }).selectOption('book');
  await page.getByRole('button', { name: 'Create circle', exact: true }).click();
  await expect(page).toHaveURL(/\/app\/circles\/[0-9a-f-]+$/);
  await expect(page.getByRole('heading', { name: 'The reading crew', exact: true })).toBeVisible();
  const circleUrl = page.url();
  await page.getByRole('button', { name: 'Invite friends' }).click();
  const invite = await page.getByLabel('Invitation link').inputValue();
  await page.getByRole('link', { name: 'New challenge' }).click();
  await page.getByLabel('Challenge title').fill('Show up for reading');
  await page.getByLabel('Description', { exact: true }).fill('Make space for a daily chapter.');
  const start = new Date(Date.now() + 2 * 86400_000).toISOString().slice(0, 10),
    end = new Date(Date.now() + 8 * 86400_000).toISOString().slice(0, 10);
  await page.getByLabel('Start date').fill(start);
  await page.getByLabel('End date').fill(end);
  await page
    .getByLabel('Evidence requirements')
    .fill('Share a photo of your reading notes. A photo cannot prove pages read.');
  await page.getByLabel('Daily stake per missed day').fill('2.50');
  await page.getByLabel('Maximum total penalty').fill('15.00');
  await page.getByRole('button', { name: 'Publish proposal' }).click();
  await expect(page.getByRole('heading', { name: 'Show up for reading.' })).toBeVisible();
  const challengeUrl = page.url();
  await page.getByRole('checkbox', { name: /I accept these dates/ }).check();
  await page.getByRole('button', { name: 'Accept rules & join' }).click();
  await expect(page.getByText('You accepted these rules')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Activate & lock roster' })).toBeDisabled();
  const friendContext = await browser.newContext(info.project.use);
  const friend = await friendContext.newPage();
  try {
    // The invite survives registration and onboarding, without appearing in server request URLs.
    await friend.goto(invite);
    await friend.getByRole('link', { name: 'Create account', exact: true }).click();
    await friend.getByLabel('Username', { exact: true }).fill(`b_${suffix}`);
    await friend.getByLabel('Email address').fill(`b_${suffix}@example.test`);
    await friend.getByLabel('Password', { exact: true }).fill('eightPwd');
    await friend.getByRole('button', { name: 'Create your account' }).click();
    await friend.getByLabel('Display name').fill('Sam');
    await friend.getByRole('button', { name: 'Make yourself at home' }).click();
    await friend
      .locator('.join-popover')
      .getByRole('button', { name: 'Join circle', exact: true })
      .click();
    await expect(
      friend.getByRole('heading', { name: 'The reading crew', exact: true }),
    ).toBeVisible();
    await friend.goto(challengeUrl);
    await friend.getByRole('checkbox', { name: /I accept these dates/ }).check();
    await friend.getByRole('button', { name: 'Accept rules & join' }).click();
    await expect(friend.getByText('You accepted these rules')).toBeVisible();
    await page.reload();
    await page.getByRole('button', { name: 'Activate & lock roster' }).click();
    await expect(page.getByRole('heading', { name: 'Your frozen schedule' })).toBeVisible();
    await expect(page.locator('.schedule-row')).toHaveCount(7);
    await expect(page.getByText('ACTIVE · RULES AND ROSTER LOCKED', { exact: true })).toBeVisible();
    await page.screenshot({ path: info.outputPath('active-challenge.png'), fullPage: true });
    await friend.goto(circleUrl);
    await friend.getByRole('button', { name: 'Leave circle', exact: true }).click();
    await expect(friend.getByRole('alert')).toContainText('Active participants cannot leave');
    await page.goto('/app/settings');
    for (const mode of ['Light', 'Dark'] as const)
      for (const accent of ['Electric lime', 'Warm orange'] as const) {
        await page.getByRole('button', { name: mode, exact: true }).click();
        await page.getByRole('button', { name: accent, exact: true }).click();
        await expect(page.locator('html')).toHaveAttribute('data-mode', mode.toLowerCase());
        await expect(page.locator('html')).toHaveAttribute(
          'data-accent',
          accent === 'Electric lime' ? 'lime' : 'orange',
        );
        await expect(
          page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        ).resolves.toBe(true);
        await page.screenshot({ path: info.outputPath(`${mode}-${accent}.png`), fullPage: true });
      }
    await page.getByRole('button', { name: 'Light', exact: true }).click();
    await page.getByRole('button', { name: 'Electric lime', exact: true }).click();
    // Selection is committed after the account save, not when the click is dispatched.
    await expect(page.getByRole('button', { name: 'Electric lime', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.reload();
    await expect(page.getByRole('button', { name: 'Light', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByRole('button', { name: 'Electric lime', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(errors).toEqual([]);
  } finally {
    await friendContext.close();
  }
});
