import { expect, test, type Page } from '@playwright/test';
import { drag, emptyCanvasPoint, pickPart, pickTool, trackErrors } from './helpers';

const byLabel = (page: Page, label: string) => page.locator('.glyph').filter({ has: page.locator('.glyph-label', { hasText: new RegExp(`^${label}$`) }) });

/** Input pin A at (100,100) -> NOT gate at (250,100) -> output pin Y at (350,100), wired by dragging. */
async function buildInverter(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Start a circuit' })).toBeVisible();
  const at = (x: number, y: number) => emptyCanvasPoint(page, x, y);

  await pickPart(page, 'Input Pin');
  await page.mouse.click(...xy(await at(100, 100)));
  await pickPart(page, 'NOT');
  await page.mouse.click(...xy(await at(250, 100)));
  await pickPart(page, 'Output Pin');
  await page.mouse.click(...xy(await at(350, 100)));
  await page.keyboard.press('Escape');
  await expect(page.locator('.glyph')).toHaveCount(3);

  await pickTool(page, 'Wire');
  await drag(page, await at(100, 100), await at(220, 100)); // A -> NOT input
  await drag(page, await at(250, 100), await at(350, 100)); // NOT output -> Y
  await page.keyboard.press('Escape');
  await expect(page.locator('line.wire')).toHaveCount(2);
}

const xy = (p: { x: number; y: number }): [number, number] => [p.x, p.y];

test('build an inverter by hand: place, wire, poke', async ({ page }) => {
  const errors = trackErrors(page);
  await buildInverter(page);
  await expect(byLabel(page, 'A').locator('.glyph-value')).toHaveText('0');
  await expect(byLabel(page, 'Y').locator('.glyph-value')).toHaveText('1');

  await pickTool(page, 'Poke');
  await byLabel(page, 'A').locator('rect').first().click();
  await expect(byLabel(page, 'A').locator('.glyph-value')).toHaveText('1');
  await expect(byLabel(page, 'Y').locator('.glyph-value')).toHaveText('0');
  expect(errors).toEqual([]);
});

test('moving a part drags its wires along, so the circuit still works', async ({ page }) => {
  await buildInverter(page);
  const at = (x: number, y: number) => emptyCanvasPoint(page, x, y);
  await pickTool(page, 'Select');
  await drag(page, await at(238, 100), await at(238, 160));
  await expect(page.getByRole('status').filter({ hasText: 'Stable' })).toBeVisible();

  await pickTool(page, 'Poke');
  await byLabel(page, 'A').locator('rect').first().click();
  await expect(byLabel(page, 'Y').locator('.glyph-value')).toHaveText('0');
  await byLabel(page, 'A').locator('rect').first().click();
  await expect(byLabel(page, 'Y').locator('.glyph-value')).toHaveText('1');
});

test('rotate, delete and undo from the keyboard', async ({ page }) => {
  await buildInverter(page);
  await pickTool(page, 'Select');
  await page.mouse.click(...xy(await emptyCanvasPoint(page, 238, 100)));
  await expect(page.locator('.inspector .card-title').filter({ hasText: /^NOT Gate$/ })).toBeVisible();
  await expect(page.getByLabel('Facing')).toHaveValue('east');

  await page.keyboard.press('r');
  await expect(page.getByLabel('Facing')).toHaveValue('south');

  await page.keyboard.press('Delete');
  await expect(page.locator('.glyph')).toHaveCount(2);
  await page.keyboard.press('Control+z');
  await expect(page.locator('.glyph')).toHaveCount(3);
});

test('editing a property in the inspector updates the circuit', async ({ page }) => {
  await buildInverter(page);
  await pickTool(page, 'Select');
  await byLabel(page, 'A').locator('rect').first().click();
  await page.getByLabel('Label').fill('IN');
  await expect(byLabel(page, 'IN')).toHaveCount(1);
});
