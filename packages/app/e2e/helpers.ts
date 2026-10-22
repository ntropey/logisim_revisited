/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * Shared helpers for the end-to-end tests.
 */
import { expect, type Locator, type Page } from '@playwright/test';

/** The value shown inside a pin, probe or constant. */
export const valueOf = (page: Page, compId: string): Locator => page.locator(`[data-comp="${compId}"] .glyph-value`);

/** Screen position of a pin dot, e.g. pinAt(page, 'xor1:out0'). */
export async function pinAt(page: Page, pin: string): Promise<{ x: number; y: number }> {
  const box = await page.locator(`[data-pin="${pin}"]`).boundingBox();
  if (!box) throw new Error(`pin ${pin} is not on screen`);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/**
 * Screen position of a world coordinate on a fresh, empty canvas. An empty circuit opens at the default
 * view (offset 40, 40 at 100%), so this is only valid before anything has been fitted or zoomed.
 */
export async function emptyCanvasPoint(page: Page, wx: number, wy: number): Promise<{ x: number; y: number }> {
  const box = await page.locator('svg.canvas').boundingBox();
  if (!box) throw new Error('canvas not visible');
  return { x: box.x + 40 + wx, y: box.y + 40 + wy };
}

export async function pickTool(page: Page, name: 'Select' | 'Poke' | 'Wire'): Promise<void> {
  await page.getByTitle(name, { exact: true }).click();
  await expect(page.getByTitle(name, { exact: true })).toHaveAttribute('aria-pressed', 'true');
}

export async function pickPart(page: Page, name: string): Promise<void> {
  await page.locator('.parts').getByRole('button', { name, exact: true }).click();
}

/** Drag between two screen points with intermediate moves, as a person would. */
export async function drag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }): Promise<void> {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move((from.x + to.x) / 2, (from.y + to.y) / 2, { steps: 3 });
  await page.mouse.move(to.x, to.y, { steps: 3 });
  await page.mouse.up();
}

/** Collect uncaught page errors so each test can assert there were none. */
export function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  return errors;
}
