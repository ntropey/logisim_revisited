import { expect, test } from '@playwright/test';
import { pickPart, pinAt } from './helpers';

test('repair the broken half adder and solve the challenge', async ({ page }) => {
  await page.goto('/?challenge=challenge-half-adder');
  const panel = page.locator('.challenges');
  await expect(panel).toContainText('Fix the Broken Half Adder');

  await panel.getByRole('button', { name: 'Check my circuit' }).click();
  await expect(panel.locator('.verdict.fail')).toContainText('3/4 rows correct');

  await panel.getByRole('button', { name: 'Coach me' }).click();
  await expect(panel.locator('.stages li')).toHaveCount(1);

  // Swap the wrong OR gate for an XOR in the same place: both gates have the same pins.
  const spot = await pinAt(page, 'xor1:out0');
  await page.locator('[data-comp="xor1"] path').first().click({ force: true });
  await expect(page.getByRole('tab', { name: /Challenges/ })).toHaveAttribute('aria-selected', 'true'); // selecting must not steal the tab
  await page.keyboard.press('Delete');
  await expect(page.locator('[data-comp="xor1"]')).toHaveCount(0);
  await pickPart(page, 'XOR');
  await page.mouse.click(spot.x, spot.y);
  await page.keyboard.press('Escape');

  await panel.getByRole('button', { name: 'Check my circuit' }).click();
  await expect(panel.locator('.verdict.pass')).toContainText('Solved!');
});

test('the daily challenge starts from the Challenges tab', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: /Challenges/ }).click();
  await page.getByRole('button', { name: 'Start daily challenge' }).click();
  await expect(page.getByRole('button', { name: 'Check my circuit' })).toBeVisible();
  expect(await page.locator('.glyph').count()).toBeGreaterThan(0);
});
