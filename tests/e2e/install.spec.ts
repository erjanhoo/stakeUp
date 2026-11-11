import { test, expect } from '@playwright/test';
import sharp from 'sharp';
test('installation guidance, prompt choices and private offline fallback', async ({
  page,
  context,
}, info) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/install');
  await expect(page.getByRole('heading', { name: 'A place on your home screen.' })).toBeVisible();
  const manifest = await (await page.request.get('/manifest.webmanifest')).json();
  expect(manifest.display).toBe('standalone');
  expect(manifest.start_url).toBe('/app?source=pwa');
  expect(manifest.shortcuts[0].url).toBe('/app/reviews');
  for (const icon of manifest.icons) {
    const response = await page.request.get(icon.src);
    expect(response.ok()).toBe(true);
    const metadata = await sharp(await response.body()).metadata();
    expect(`${metadata.width}x${metadata.height}`).toBe(icon.sizes);
  }
  expect(await page.locator('link[rel="apple-touch-icon"]').getAttribute('href')).toBe(
    '/icons/apple-touch-icon.png',
  );
  for (const platform of ['iPhone / iPad', 'Android', 'Windows']) {
    await page.getByRole('button', { name: platform, exact: true }).click();
    await expect(page.getByRole('button', { name: platform, exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.locator('.install-guide li')).toHaveCount(3);
  }
  // Browser prompt choices are simulated; native OS install dialogs need a real device.
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true });
    Object.assign(event, {
      prompt: async () => {},
      userChoice: Promise.resolve({ outcome: 'dismissed' }),
    });
    window.dispatchEvent(event);
  });
  await page.getByRole('button', { name: 'Install StakeUp', exact: true }).click();
  await expect(
    page.getByText('Installation dismissed. You can try again from your browser menu.'),
  ).toBeVisible();
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true });
    Object.assign(event, {
      prompt: async () => {},
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    });
    window.dispatchEvent(event);
  });
  await page.getByRole('button', { name: 'Install StakeUp', exact: true }).click();
  await expect(
    page.getByText('Installation accepted. Your device will finish adding StakeUp.'),
  ).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
  await expect(page.getByRole('heading', { name: 'StakeUp is in app mode.' })).toBeVisible();
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller)
      await new Promise<void>((r) =>
        navigator.serviceWorker.addEventListener('controllerchange', () => r(), { once: true }),
      );
  });
  const cached = await page.evaluate(async () =>
    (
      await Promise.all(
        (await caches.keys()).map(async (name) =>
          (await (await caches.open(name)).keys()).map((r) => new URL(r.url).pathname),
        ),
      )
    ).flat(),
  );
  expect(cached.sort()).toEqual(
    ['/icons/icon-192.png', '/offline.css', '/offline.html', '/offline.js'].sort(),
  );
  await page.evaluate(() => localStorage.setItem('stakeup.language.v1', 'ru'));
  await context.setOffline(true);
  expect(
    await page.evaluate(async () => {
      try {
        await fetch('/api/reviews');
        return false;
      } catch {
        return true;
      }
    }),
  ).toBe(true);
  await page.goto('/app/reviews');
  await expect(page.getByRole('heading', { name: 'Вернёмся на связь.' })).toBeVisible();
  await page.screenshot({ path: info.outputPath('offline-ru.png'), fullPage: true });
  await context.setOffline(false);
  await page.getByRole('button', { name: 'Попробовать снова' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/install');
  await expect(
    page.getByRole('heading', { name: 'Ваша команда на главном экране.' }),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath('install-ru.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
