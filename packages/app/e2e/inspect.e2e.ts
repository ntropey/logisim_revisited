import { expect, test } from '@playwright/test';

test('selecting a gate shows its pins and values', async ({ page }) => {
  await page.goto('/?p=half-adder');
  await page.locator('[data-comp="xor1"] path').first().click({ force: true });
  const inspector = page.locator('.inspector');
  await expect(inspector.locator('.card-title').filter({ hasText: /^XOR Gate$/ })).toBeVisible();
  await expect(inspector.locator('table.pins tr')).toHaveCount(3);
  await expect(inspector.locator('table.pins')).toContainText('out');
});

test('the Coach reveals hints one at a time and highlights what they mention', async ({ page }) => {
  await page.goto('/?p=half-adder');
  await page.locator('[data-comp="out_sum"] rect').first().click({ force: true });
  const inspector = page.locator('.inspector');
  await expect(inspector).toContainText('Why Pin "Sum" is 0');

  await inspector.getByRole('button', { name: 'Coach me' }).click();
  await expect(inspector.locator('.stages li')).toHaveCount(1);
  // Highlights are drawn shapes; a straight wire highlight has no height, so count rather than check visibility.
  await expect.poll(() => page.locator('.halo, .wire-halo').count()).toBeGreaterThan(0);

  await inspector.getByRole('button', { name: /Next hint/ }).click();
  await expect(inspector.locator('.stages li')).toHaveCount(2);

  await inspector.getByRole('button', { name: 'Hide' }).or(inspector.getByRole('button', { name: /Why is this/ })).first().click();
  const shown = await inspector.locator('.stages li').count();
  expect(shown).toBeGreaterThanOrEqual(2);
});

test('the prover explains a bus conflict', async ({ page }) => {
  await page.goto('/?p=short-circuit-demo');
  await expect(page.getByRole('status').filter({ hasText: 'Error signal (E)' })).toBeVisible();
  await page.locator('svg.canvas line.wire[stroke-dasharray]').first().click({ force: true });
  const inspector = page.locator('.inspector');
  await expect(inspector.locator('.value-chip')).toHaveText('E');
  await inspector.getByRole('button', { name: 'Why is this E?' }).click();
  await expect(inspector.locator('.stages li').first()).toBeVisible();
});
