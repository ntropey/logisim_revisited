import { expect, test } from '@playwright/test';

test('an expression becomes a truth table, a K-map and a working circuit', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: /Analyze/ }).click();
  await page.getByRole('group', { name: 'Number of variables' }).getByRole('button', { name: '2' }).click();
  await page.getByLabel('Boolean expression').fill('A ^ B');
  await page.getByRole('button', { name: 'Apply' }).click();

  const outputs = page.locator('table.ttable tbody td.kcell');
  await expect(outputs).toHaveText(['0', '1', '1', '0']);
  await expect(page.locator('table.kmap')).toBeVisible();
  await expect(page.locator('dl.result')).toContainText('Minimal SOP');

  await page.getByRole('button', { name: 'Build this circuit' }).click();
  await expect(page.getByRole('tab', { name: /Inspect/ })).toHaveAttribute('aria-selected', 'true');
  expect(await page.locator('.glyph').count()).toBeGreaterThan(3);
  await expect(page.getByRole('status').filter({ hasText: 'Stable' })).toBeVisible();
});

test('clicking a truth table cell cycles 0, 1 and don\'t care', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: /Analyze/ }).click();
  const first = page.locator('table.ttable tbody td.kcell').first();
  const start = await first.textContent();
  const order = ['0', '1', 'X'];
  const next = (v: string | null) => order[(order.indexOf(v ?? '0') + 1) % 3];
  await first.click();
  await expect(first).toHaveText(next(start));
  await first.click();
  await expect(first).toHaveText(next(next(start)));
});
