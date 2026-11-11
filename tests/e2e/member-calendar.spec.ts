import { test, expect } from '@playwright/test';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
test('calendar pass clears a missed day once; teammate profiles and private avatars work', async ({
  page,
  browser,
}, info) => {
  test.setTimeout(120000);
  const origin = 'http://localhost:5173',
    suffix = Date.now() + info.project.name,
    errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const users = [];
  for (let i = 0; i < 2; i++) {
    const r = await page.request.post('/api/auth/register', {
      headers: { origin },
      data: {
        email: `growth${i}${suffix}@example.test`,
        username: `g${i}${suffix}`.slice(0, 24),
        password: 'eightPwd',
      },
    });
    expect(r.ok()).toBe(true);
    const u = await r.json();
    users.push(u);
    await page.request.patch('/api/me', {
      headers: { origin },
      data: {
        username: u.username,
        displayName: i ? 'Teammate' : 'Calendar owner',
        timezone: 'UTC',
        bio: 'Keep showing up.',
        onboardingCompleted: true,
      },
    });
  }
  await page.request.post('/api/auth/login', {
    headers: { origin },
    data: { email: users[0].email, password: 'eightPwd' },
  });
  let file = '';
  for (const name of await readdir('.local'))
    if (
      /^e2e-.*[.]json$/.test(name) &&
      (await readFile(`.local/${name}`, 'utf8')).includes(users[0].id)
    ) {
      file = `.local/${name}`;
      break;
    }
  expect(file).toBeTruthy();
  const state = JSON.parse(await readFile(file, 'utf8')),
    cid = crypto.randomUUID(),
    hid = crypto.randomUUID(),
    oid = crypto.randomUUID(),
    past = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  state.circles.push({
    id: cid,
    creatorId: users[0].id,
    name: 'Calendar crew',
    description: 'Our shared goals',
    icon: 'sun',
    archived: false,
  });
  for (const u of users) {
    state.members.push({
      circleId: cid,
      userId: u.id,
      joinedAt: new Date().toISOString(),
      leftAt: null,
    });
    state.enrollments.push({
      challengeId: hid,
      userId: u.id,
      status: 'accepted',
      rulesHash: 'hash',
      acceptedAt: new Date().toISOString(),
    });
  }
  state.challenges.push({
    id: hid,
    circleId: cid,
    createdBy: users[0].id,
    status: 'active',
    rulesHash: 'hash',
    rules: {
      title: 'Daily effort',
      description: 'Every day',
      startDate: past,
      endDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      weekdays: [0, 1, 2, 3, 4, 5, 6],
      timezone: 'UTC',
      opening: '00:00',
      cutoff: '23:59',
      graceDays: 1,
      capturePolicy: 'camera_or_upload',
      evidenceRequirements: 'Share your effort honestly.',
      penaltyMinor: 100,
      maxPenaltyMinor: 1000,
      rewardPolicy: 'discipline_v2',
      gracePolicy: 'chosen_v1',
    },
  });
  state.obligations.push({
    id: oid,
    challengeId: hid,
    userId: users[0].id,
    title: 'Daily effort',
    circleName: 'Calendar crew',
    timezone: 'UTC',
    localDate: past,
    status: 'pending',
    opensAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    deadlineAt: new Date(Date.now() - 3600000).toISOString(),
  });
  await writeFile(file, JSON.stringify(state));
  await page.goto(`/app/circles/${cid}`);
  await expect(page.getByRole('heading', { name: 'Commitment calendar' })).toBeVisible();
  await page.getByRole('button', { name: 'Calendar and grace passes' }).click();
  await expect(page.getByRole('dialog', { name: 'Calendar and grace passes' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  if (past.slice(0, 7) !== new Date().toISOString().slice(0, 7))
    await page.getByRole('button', { name: 'Previous month' }).click();
  const day = page.locator(`.calendar-day[href$="/day/${past}"]`);
  await expect(day).toHaveClass(/missed/);
  await day.click();
  await page.getByRole('button', { name: 'Use grace pass', exact: true }).click();
  await expect(page.getByText('Excused with a grace pass. No photo required.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancel grace day' })).toBeDisabled();
  await page.goto(`/app/circles/${cid}`);
  if (past.slice(0, 7) !== new Date().toISOString().slice(0, 7))
    await page.getByRole('button', { name: 'Previous month' }).click();
  await expect(page.locator(`.calendar-day[href$="/day/${past}"]`)).toHaveClass(/good/);
  await page.goto('/app/settings');
  const buffer = await sharp({
    create: { width: 80, height: 60, channels: 3, background: '#c3f400' },
  })
    .png()
    .toBuffer();
  await page
    .getByLabel('Profile photo', { exact: true })
    .setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer });
  await page.getByRole('button', { name: 'Save profile photo', exact: true }).click();
  await expect(page.getByText('Profile photo saved.')).toBeVisible();
  await page.goto(`/app/members/${users[0].id}`);
  await expect(page.locator('.member-hero .avatar img')).toHaveJSProperty('naturalWidth', 256);
  await expect(page.getByRole('heading', { name: 'Achievements' })).toBeVisible();
  await expect(page.locator('.member-badge.earned')).toHaveCount(0);
  await page.goto(`/app/circles/${cid}`);
  await page.getByRole('link', { name: 'View profile: Teammate', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Teammate', exact: true })).toBeVisible();
  await expect(page.getByText(users[1].email, { exact: true })).toHaveCount(0);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize(info.project.use.viewport!);
  await page.screenshot({ path: info.outputPath('teammate-profile.png'), fullPage: true });
});
