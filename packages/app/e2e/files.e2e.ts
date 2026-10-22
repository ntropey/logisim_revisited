import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { valueOf } from './helpers';

test('export a .circ file and import it again', async ({ page }) => {
  await page.goto('/?p=half-adder');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByLabel('Export .circ').click()]);
  expect(download.suggestedFilename()).toBe('Half_Adder.circ');
  const file = await download.path();
  const xml = await readFile(file, 'utf8');
  expect(xml).toContain('<circuit');

  await page.goto('/?p=multiplexer');
  await expect(page.getByLabel('Circuit name')).not.toHaveValue('Half Adder');
  await page.locator('input[type=file]').setInputFiles(file);
  await expect(page.getByRole('status').filter({ hasText: 'Opened' })).toBeVisible();
  await expect(page.locator('.glyph-label', { hasText: 'Sum' })).toBeVisible();
  await expect(page.locator('.glyph-label', { hasText: 'Carry' })).toBeVisible();
});

test('a share link reopens the same circuit', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'clipboard permissions are Chromium-specific');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/?p=half-adder');
  await page.getByLabel('Circuit name').fill('Shared adder');
  await page.getByLabel('Copy share link').click();
  await expect(page.getByRole('status').filter({ hasText: 'Link copied' })).toBeVisible();
  const url = await page.evaluate(() => navigator.clipboard.readText());
  expect(url).toMatch(/#c=[A-Za-z0-9_-]+$/);

  const other = await context.newPage();
  await other.goto(url);
  await expect(other.getByLabel('Circuit name')).toHaveValue('Shared adder');
  await expect(valueOf(other, 'out_carry')).toHaveText('1');
});
