import { expect, test } from '@playwright/test';

test.use({ serviceWorkers: 'allow' });

test('the installed app keeps working offline', async ({ page, context }) => {
  await page.goto('/?p=half-adder');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // The first visit installs the worker; the second is served through it, which fills the cache.
  await page.reload();
  await expect(page.getByLabel('Circuit name')).toHaveValue('Half Adder');
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByLabel('Circuit name')).toHaveValue('Half Adder');
  await expect(page.locator('.glyph').first()).toBeVisible();
  await context.setOffline(false);
});
