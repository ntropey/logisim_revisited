import { expect, test } from '@playwright/test';
import { pickTool, trackErrors, valueOf } from './helpers';

test('an example opens from the URL and simulates', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/?p=half-adder');
  await expect(page.getByLabel('Circuit name')).toHaveValue('Half Adder');
  // A = B = 1: Sum = 0, Carry = 1
  await expect(valueOf(page, 'in_a')).toHaveText('1');
  await expect(valueOf(page, 'in_b')).toHaveText('1');
  await expect(valueOf(page, 'out_sum')).toHaveText('0');
  await expect(valueOf(page, 'out_carry')).toHaveText('1');
  await expect(page.getByRole('status').filter({ hasText: 'Stable' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('poking an input re-simulates, and undo and redo restore it', async ({ page }) => {
  await page.goto('/?p=half-adder');
  await pickTool(page, 'Poke');
  await page.locator('[data-comp="in_a"] rect').first().click();
  await expect(valueOf(page, 'in_a')).toHaveText('0');
  await expect(valueOf(page, 'out_sum')).toHaveText('1');
  await expect(valueOf(page, 'out_carry')).toHaveText('0');

  await page.getByLabel('Undo').click();
  await expect(valueOf(page, 'out_sum')).toHaveText('0');
  await page.getByLabel('Redo').click();
  await expect(valueOf(page, 'out_sum')).toHaveText('1');

  await page.keyboard.press('Control+z');
  await expect(valueOf(page, 'out_sum')).toHaveText('0');
});

test('the circuit is saved and comes back after a reload', async ({ page }) => {
  await page.goto('/?p=half-adder');
  await pickTool(page, 'Poke');
  await page.locator('[data-comp="in_b"] rect').first().click();
  await expect(valueOf(page, 'in_b')).toHaveText('0');
  await page.goto('/');
  await expect(page.getByLabel('Circuit name')).toHaveValue('Half Adder');
  await expect(valueOf(page, 'in_b')).toHaveText('0');
  await expect(valueOf(page, 'out_sum')).toHaveText('1');
});

test('flip-flop presets open from URL and Tick clocks them', async ({ page }) => {
  await page.goto('/?p=jk-flip-flop');
  await expect(page.getByLabel('Circuit name')).toHaveValue('J-K Flip-Flop');
  await expect(valueOf(page, 'out_q')).toHaveText('0');
  const tick = page.getByTitle('Toggle every clock');
  await tick.click(); // rising edge with J = K = 1: toggle
  await expect(valueOf(page, 'out_q')).toHaveText('1');
  await expect(valueOf(page, 'out_qn')).toHaveText('0');
  await tick.click(); // falling edge: hold
  await expect(valueOf(page, 'out_q')).toHaveText('1');
  await tick.click(); // rising edge: toggle back
  await expect(valueOf(page, 'out_q')).toHaveText('0');

  await page.goto('/?p=sr-latch');
  await expect(page.getByLabel('Circuit name')).toHaveValue('S-R Flip-Flop');
  await expect(valueOf(page, 'out_q')).toHaveText('0');
  await tick.click(); // rising edge with S = 1, R = 0: set Q = 1
  await expect(valueOf(page, 'out_q')).toHaveText('1');
});
