import { test, expect } from '@playwright/test';
import { readdir, readFile, writeFile } from 'node:fs/promises';

test('Russian account preferences, visible accents, chosen grace dates and private inbox', async ({
  page,
}, info) => {
  test.setTimeout(90000);
  const origin = 'http://localhost:5173',
    suffix = `${Date.now()}${info.project.name[0]}`;
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const r = await page.request.post('/api/auth/register', {
    headers: { origin },
    data: { username: `ru_${suffix}`, email: `ru_${suffix}@example.test`, password: 'eightPwd' },
  });
  expect(r.ok()).toBe(true);
  const profile = await r.json();
  await page.request.patch('/api/me', {
    headers: { origin },
    data: {
      username: profile.username,
      displayName: 'Александр',
      timezone: 'Asia/Bishkek',
      bio: '',
      onboardingCompleted: true,
    },
  });
  await page.goto('/app/settings');
  await page.getByRole('button', { name: 'Русский', exact: true }).click();
  await page.getByLabel('Часовой пояс', { exact: true }).click();
  await page.screenshot({ path: info.outputPath('russian-picker.png') });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Оформление и темы' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await page.getByRole('button', { name: 'Электрический лайм' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-accent', 'lime');
  await page.getByRole('button', { name: 'Светлая', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'light');
  await page.reload();
  await expect(page.getByLabel('Имя', { exact: true })).toHaveValue('Александр');
  await expect(page.getByRole('button', { name: 'Русский', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.locator('.panel').first()).toHaveCSS('border-top-color', /.+/);
  await expect(
    page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).resolves.toBe(true);
  await page.screenshot({
    path: info.outputPath('russian-settings-light-lime.png'),
    fullPage: true,
  });
  // Seed only dates/obligations; all grace actions go through the authenticated API and UI.
  let file = '';
  for (const n of await readdir('.local'))
    if (/^e2e-.*\.json$/.test(n) && (await readFile(`.local/${n}`, 'utf8')).includes(profile.id)) {
      file = `.local/${n}`;
      break;
    }
  expect(file).toBeTruthy();
  const state = JSON.parse(await readFile(file, 'utf8')),
    cid = crypto.randomUUID(),
    hid = crypto.randomUUID(),
    today = new Date().toISOString().slice(0, 10),
    oid = crypto.randomUUID();
  state.circles.push({
    id: cid,
    creatorId: profile.id,
    name: 'Друзья',
    description: '',
    icon: 'book',
    archived: false,
  });
  state.members.push({
    circleId: cid,
    userId: profile.id,
    joinedAt: new Date().toISOString(),
    leftAt: null,
  });
  state.challenges.push({
    id: hid,
    circleId: cid,
    createdBy: profile.id,
    status: 'active',
    rulesHash: 'hash',
    rules: {
      title: 'Читаем вместе',
      description: '',
      startDate: today,
      endDate: today,
      weekdays: [0, 1, 2, 3, 4, 5, 6],
      timezone: 'UTC',
      opening: '00:00',
      cutoff: '23:59',
      graceDays: 1,
      capturePolicy: 'camera_or_upload',
      evidenceRequirements: 'Заметки о книге',
      penaltyMinor: 100,
      maxPenaltyMinor: 300,
      rewardPolicy: 'discipline_v2',
      gracePolicy: 'chosen_v1',
    },
  });
  state.enrollments.push({
    challengeId: hid,
    userId: profile.id,
    status: 'accepted',
    rulesHash: 'hash',
    acceptedAt: new Date().toISOString(),
  });
  state.obligations.push({
    id: oid,
    challengeId: hid,
    userId: profile.id,
    title: 'Читаем вместе',
    circleName: 'Друзья',
    timezone: 'UTC',
    localDate: today,
    status: 'pending',
    opensAt: new Date(Date.now() - 3600000).toISOString(),
    deadlineAt: new Date(Date.now() + 3600000).toISOString(),
  });
  await writeFile(file, JSON.stringify(state));
  await page.goto(`/app/challenges/${hid}/evidence`);
  await page.getByRole('tab', { name: /Дни отдыха/ }).click();
  await page.getByText('Выбрать или изменить день отдыха', { exact: true }).click();
  await page.getByRole('button', { name: 'Выбрать для отдыха', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Отменить отдых' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Отправить фото' })).toHaveCount(0);
  await page.reload();
  await page.getByRole('tab', { name: /Дни отдыха/ }).click();
  await page.getByText('Выбрать или изменить день отдыха', { exact: true }).click();
  await expect(page.getByRole('button', { name: 'Отменить отдых' })).toBeVisible();
  await page.getByRole('button', { name: 'Отменить отдых' }).click();
  await page.getByRole('tab', { name: /Отправка/ }).click();
  await expect(page.getByLabel('Выбрать фото', { exact: true })).toBeAttached();
  await page.goto(`/app/challenges/${hid}/competition`);
  await expect(page.locator('.pool-mark svg')).toBeVisible();
  await page.screenshot({ path: info.outputPath('russian-pool.png'), fullPage: true });
  await page.goto('/app/notifications');
  await expect(page.getByRole('heading', { name: 'День отдыха забронирован' })).toBeVisible();
  await page.getByRole('button', { name: 'Прочитать всё' }).click();
  await expect(page.locator('.notification-item.unread')).toHaveCount(0);
  await page.goto('/app/settings');
  await page.getByRole('button', { name: 'Тёмная', exact: true }).click();
  await page.getByRole('button', { name: 'Тёплый оранжевый', exact: true }).click();
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Appearance & themes' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.getByRole('button', { name: 'Русский', exact: true }).click();
  await page.goto('/unknown-page');
  await expect(page.getByRole('heading', { name: 'Страница не найдена.' })).toBeVisible();
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Держите слово/ })).toBeVisible();
  expect(errors).toEqual([]);
});
