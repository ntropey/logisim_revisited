import { expect, test } from '@playwright/test';

test('on a phone the circuit stays visible above the open drawer', async ({ page }) => {
  await page.goto('/?daily=1');
  const drawer = page.locator('aside.drawer');
  await expect(drawer).toHaveClass(/open/);
  const drawerTop = (await drawer.boundingBox())!.y;
  const glyphs = page.locator('.glyph');
  const n = await glyphs.count();
  expect(n).toBeGreaterThan(0);
  for (let i = 0; i < n; i++) {
    const box = (await glyphs.nth(i).boundingBox())!;
    expect(box.y + box.height).toBeLessThanOrEqual(drawerTop);
    expect(box.y).toBeGreaterThanOrEqual(0);
  }
});

test('the parts panel slides in, and picking a part closes it', async ({ page }) => {
  await page.goto('/');
  const parts = page.locator('aside.parts');
  await expect(parts).not.toHaveClass(/open/);
  await page.getByRole('toolbar', { name: 'Tools' }).getByTitle('Parts').tap();
  await expect(parts).toHaveClass(/open/);
  await parts.getByRole('button', { name: 'AND', exact: true }).tap();
  await expect(parts).not.toHaveClass(/open/);
  await expect(page.locator('.hint')).toContainText('Click to place AND');
});

test('nothing on the page scrolls sideways', async ({ page }) => {
  await page.goto('/?p=full-adder');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
