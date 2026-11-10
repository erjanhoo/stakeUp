import { test, expect } from '@playwright/test';
import { readdir, readFile, writeFile } from 'node:fs/promises';
test('circle enrollment visibility, explicit window and exact virtual settlement', async ({
  page,
}, info) => {
  test.setTimeout(60000);
  const origin = 'http://localhost:5173',
    suffix = Date.now() + info.project.name,
    profiles = [];
  for (let n = 0; n < 3; n++) {
    const email = `finance_${n}_${suffix}@example.test`;
    const r = await page.request.post('/api/auth/register', {
      headers: { origin },
      data: { username: `f_${n}_${Date.now()}`, email, password: 'eightPwd' },
    });
    expect(r.ok()).toBe(true);
    profiles.push({ ...(await r.json()), email });
  }
  await page.request.post('/api/auth/login', {
    headers: { origin },
    data: { email: profiles[0].email, password: 'eightPwd' },
  });
  await page.request.patch('/api/me', {
    headers: { origin },
    data: {
      username: profiles[0].username,
      displayName: 'Ada',
      timezone: 'UTC',
      bio: '',
      onboardingCompleted: true,
    },
  });
  let file = '';
  for (const n of await readdir('.local'))
    if (/^e2e-.*\.json$/.test(n)) {
      const f = `.local/${n}`;
      if ((await readFile(f, 'utf8')).includes(profiles[0].id)) {
        file = f;
        break;
      }
    }
  const s = JSON.parse(await readFile(file, 'utf8')),
    cid = crypto.randomUUID(),
    hid = crypto.randomUUID(),
    proposal = crypto.randomUUID(),
    today = new Date(),
    date = (offset: number) =>
      new Date(today.getTime() + offset * 86400000).toISOString().slice(0, 10);
  s.circles.push({
    id: cid,
    creatorId: profiles[0].id,
    name: 'The exact crew',
    description: 'Every virtual unit accounted for',
    icon: 'book',
    archived: false,
  });
  const rules = {
    title: 'Five days of effort',
    description: 'A finished accountability cycle',
    startDate: date(-10),
    endDate: date(-6),
    timezone: 'UTC',
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    opening: '08:00',
    cutoff: '09:00',
    evidenceRequirements: 'Share your daily reading notes.',
    capturePolicy: 'camera_or_upload',
    penaltyMinor: 251,
    maxPenaltyMinor: 501,
    graceDays: 0,
    rewardPolicy: 'discipline_v1',
  };
  s.challenges.push(
    {
      id: hid,
      circleId: cid,
      createdBy: profiles[0].id,
      status: 'active',
      rulesHash: 'hash',
      rules,
    },
    {
      id: proposal,
      circleId: cid,
      createdBy: profiles[0].id,
      status: 'proposed',
      rulesHash: 'hash2',
      rules: { ...rules, title: 'Tomorrow’s window', startDate: date(1), endDate: date(2) },
    },
  );
  s.enrollments.push({
    challengeId: proposal,
    userId: profiles[0].id,
    status: 'accepted',
    rulesHash: 'hash2',
    acceptedAt: today.toISOString(),
  });
  for (let p = 0; p < 3; p++) {
    s.members.push({
      circleId: cid,
      userId: profiles[p].id,
      joinedAt: today.toISOString(),
      leftAt: null,
    });
    s.enrollments.push({
      challengeId: hid,
      userId: profiles[p].id,
      status: 'accepted',
      rulesHash: 'hash',
      acceptedAt: date(-11) + 'T12:00Z',
    });
    for (let d = 0; d < 5; d++) {
      const oid = crypto.randomUUID(),
        localDate = date(-10 + d);
      s.obligations.push({
        id: oid,
        challengeId: hid,
        userId: profiles[p].id,
        localDate,
        deadlineAt: localDate + 'T09:00Z',
        opensAt: localDate + 'T08:00Z',
        status: 'pending',
        title: rules.title,
        circleName: 'The exact crew',
        timezone: 'UTC',
      });
      if (d < [5, 4, 2][p]) {
        s.proofs ??= [];
        s.proofs.push({
          id: crypto.randomUUID(),
          obligationId: oid,
          challengeId: hid,
          userId: profiles[p].id,
          name: profiles[p].displayName,
          localDate,
          deadlineAt: localDate + 'T09:00Z',
          receivedAt: localDate + 'T08:30Z',
          status: 'accepted',
          source: 'camera',
          note: '',
          path: '',
          review: null,
          votes: [],
          events: [],
          round: 0,
        });
      }
    }
  }
  await writeFile(file, JSON.stringify(s));
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`/app/circles/${cid}`);
  const proposalCard = page.locator('.challenge-card').filter({ hasText: 'Tomorrow’s window' });
  await expect(proposalCard.getByText('Not accepted', { exact: true })).toHaveCount(2);
  await expect(proposalCard.getByText('✓ Rules accepted', { exact: true })).toHaveCount(1);
  await page.getByRole('link', { name: 'New challenge', exact: true }).click();
  await expect(page.getByLabel('Upload window opens')).toHaveValue('00:00');
  await page.getByLabel('Upload window opens').fill('08:00');
  await page.getByLabel('Upload window closes').fill('09:00');
  await page.goto(`/app/challenges/${hid}`);
  await expect(page.getByText('08:00–09:00 · UTC', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Standings & virtual pool', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Finalize virtual results' })).toBeVisible();
  await expect(page.locator('.competition-pool')).toContainText('7.52 VC');
  await page.getByRole('button', { name: 'Finalize virtual results' }).click();
  await expect(page.getByRole('heading', { name: 'The final tally.' })).toBeVisible();
  await expect(page.locator('.competition-pool')).toContainText('Remaining pool: 0.00 VC');
  await expect(page.locator('.leaderboard tbody')).toContainText('4.18 VC');
  await expect(page.locator('.leaderboard tbody')).toContainText('3.34 VC');
  await expect(page.locator('.ledger-row')).toHaveCount(5);
  await page.reload();
  await expect(page.locator('.ledger-row')).toHaveCount(5);
  await page.screenshot({ path: info.outputPath('settled-results.png'), fullPage: true });
  await page.goto(`/app/challenges/${hid}`);
  await expect(page.getByText('COMPLETED · RESULTS FINAL', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Final results', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
