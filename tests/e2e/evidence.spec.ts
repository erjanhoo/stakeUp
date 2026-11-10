import { test, expect } from '@playwright/test';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
test('private photo → peer rejection → owner appeal → two-peer resolution', async ({
  page,
  browser,
}, info) => {
  test.setTimeout(90000);
  const origin = 'http://localhost:5173',
    suffix = Date.now() + info.project.name;
  const contexts = [
    page.context(),
    await browser.newContext(info.project.use),
    await browser.newContext(info.project.use),
  ];
  try {
    const profiles = [];
    for (let i = 0; i < 3; i++) {
      const request = contexts[i].request;
      const r = await request.post('/api/auth/register', {
        headers: { origin },
        data: {
          username: `e_${i}_${suffix}`.slice(0, 24),
          email: `${i}_${suffix}@example.test`,
          password: 'eightPwd',
        },
      });
      expect(r.ok()).toBe(true);
      const p = await r.json();
      profiles.push(p);
      await request.patch('/api/me', {
        headers: { origin },
        data: {
          username: p.username,
          displayName: `Reader ${i + 1}`,
          timezone: 'UTC',
          bio: '',
          onboardingCompleted: true,
        },
      });
    }
    let file = '';
    for (const name of await readdir('.local')) {
      if (!/^e2e-.*\.json$/.test(name)) continue;
      const candidate = `.local/${name}`;
      if ((await readFile(candidate, 'utf8')).includes(profiles[0].id)) {
        file = candidate;
        break;
      }
    }
    expect(file).toBeTruthy();
    const state = JSON.parse(await readFile(file, 'utf8'));
    const cid = crypto.randomUUID(),
      hid = crypto.randomUUID(),
      oid = crypto.randomUUID(),
      now = new Date(),
      day = now.toISOString().slice(0, 10);
    state.circles.push({
      id: cid,
      creatorId: profiles[0].id,
      name: 'The proof crew',
      description: 'Reading together',
      icon: 'book',
      archived: false,
    });
    for (const p of profiles) {
      state.members.push({
        circleId: cid,
        userId: p.id,
        joinedAt: now.toISOString(),
        leftAt: null,
      });
      state.enrollments.push({
        challengeId: hid,
        userId: p.id,
        status: 'accepted',
        acceptedAt: now.toISOString(),
        rulesHash: 'a'.repeat(64),
      });
    }
    state.challenges.push({
      id: hid,
      circleId: cid,
      createdBy: profiles[0].id,
      status: 'active',
      rulesHash: 'a'.repeat(64),
      rules: {
        title: 'Read with context',
        description: 'Daily notes',
        startDate: day,
        endDate: day,
        weekdays: [0, 1, 2, 3, 4, 5, 6],
        cutoff: '23:59',
        timezone: 'UTC',
        evidenceRequirements: 'Share a photo of your reading notes.',
        capturePolicy: 'camera_or_upload',
        penaltyMinor: 0,
        maxPenaltyMinor: 0,
        graceDays: 0,
        rewardPolicy: 'discipline_v1',
      },
    });
    state.obligations.push({
      id: oid,
      challengeId: hid,
      userId: profiles[0].id,
      localDate: day,
      deadlineAt: new Date(now.getTime() + 3600000).toISOString(),
      status: 'pending',
      title: 'Read with context',
      circleName: 'The proof crew',
      timezone: 'UTC',
    });
    await writeFile(file, JSON.stringify(state));
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`/app/challenges/${hid}/evidence`);
    const image = await sharp({
      create: { width: 80, height: 60, channels: 3, background: '#c6f34c' },
    })
      .png()
      .toBuffer();
    await page
      .getByLabel('Choose photo', { exact: true })
      .setInputFiles({ name: 'reading.png', mimeType: 'image/png', buffer: image });
    await page.getByLabel('Context for your circle').fill('My notes from today’s chapter.');
    await page.getByRole('button', { name: 'Submit private proof' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Photo received' })).toContainText(
      'Photo received',
    );
    await expect(page.getByRole('heading', { name: 'ai reviewed', exact: true })).toBeVisible();
    await expect(page.locator('.evidence-photo')).toBeVisible();
    await expect(page.locator('.evidence-photo')).toHaveJSProperty('naturalWidth', 80);
    await expect(page.getByRole('button', { name: 'Endorse proof' })).toHaveCount(0);
    const friend = await contexts[1].newPage(),
      third = await contexts[2].newPage();
    for (const reviewer of [friend, third]) {
      await reviewer.goto(`/app/challenges/${hid}/evidence`);
      await reviewer
        .getByLabel('Your review')
        .fill('This image does not show the requested notes.');
      await reviewer.getByRole('button', { name: 'Flag as invalid' }).click();
    }
    await page.reload();
    await expect(page.getByRole('heading', { name: 'rejected', exact: true })).toBeVisible();
    await page.getByText('Appeal this rejection', { exact: true }).click();
    await page
      .getByLabel('Explain the dispute')
      .fill('Please review the notes alongside my explanation.');
    await page.getByRole('button', { name: 'Open dispute' }).click();
    await expect(page.getByRole('heading', { name: 'disputed', exact: true })).toBeVisible();
    for (const reviewer of [friend, third]) {
      await reviewer.reload();
      await reviewer.getByLabel('Your review').fill('Context clarifies the submitted effort.');
      await reviewer.getByRole('button', { name: 'Endorse proof' }).click();
    }
    await page.reload();
    await expect(page.getByRole('heading', { name: 'accepted', exact: true })).toBeVisible();
    await friend.reload();
    await friend.getByText('Encouragement & conversation', { exact: true }).click();
    await friend.getByRole('button', { name: 'Encourage', exact: true }).click();
    await expect(friend.getByRole('button', { name: 'Encourage', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await friend.getByText('Circle conversation ·', { exact: false }).click();
    await friend.getByLabel('Add encouragement').fill('Small steps count. Great effort!');
    await friend.getByRole('button', { name: 'Post comment' }).click();
    await expect(
      friend.getByText('Small steps count. Great effort!', { exact: true }),
    ).toBeVisible();
    await page.reload();
    await page.getByText('Encouragement & conversation', { exact: true }).click();
    await page.getByText('Circle conversation ·', { exact: false }).click();
    await expect(page.getByText('Small steps count. Great effort!', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Remove my comment' })).toHaveCount(0);
    await friend.getByRole('button', { name: 'Remove my comment' }).click();
    await expect(friend.getByText('Comment removed', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({ path: info.outputPath('proof-reviewed.png'), fullPage: true });
    expect(errors).toEqual([]);
    await page.goto('/');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const scene of await page.locator('.trail-scene').all()) {
      await scene.scrollIntoViewIfNeeded();
      await expect(scene).toHaveCSS('opacity', '1');
    }
    await page.locator('#how-it-works').scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath('commitment-trail.png'), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  } finally {
    for (const c of contexts.slice(1)) await c.close();
  }
});
