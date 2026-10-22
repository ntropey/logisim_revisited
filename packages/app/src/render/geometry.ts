/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * Component geometry. Bodies are described for an east-facing component whose loc is the origin; the world
 * frame is obtained by rotating with the component's facing, exactly like the pin offsets in @logisim/core.
 */
import { getComponentPins, type ComponentInstance, type Facing, type PinDef, type Point } from '@logisim/core';

export const GRID = 10;
export const snap = (n: number) => Math.round(n / GRID) * GRID;

export interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export const ROTATION: Record<Facing, number> = { east: 0, south: 90, west: 180, north: 270 };
export const facingOf = (c: ComponentInstance): Facing => c.attrs.facing ?? 'east';

const SINGLE_PIN: ReadonlySet<string> = new Set(['Pin', 'Probe', 'LED', 'Tunnel', 'Clock', 'Constant', 'Power', 'Ground', 'Button']);
const GATES: ReadonlySet<string> = new Set(['AND Gate', 'OR Gate', 'NAND Gate', 'NOR Gate', 'XOR Gate', 'XNOR Gate', 'Odd Parity', 'Even Parity']);
const INVERTING: ReadonlySet<string> = new Set(['NAND Gate', 'NOR Gate', 'XNOR Gate', 'NOT Gate', 'Controlled Inverter']);

export const isGate = (t: string) => GATES.has(t);
export const isInverting = (t: string) => INVERTING.has(t);
export const isSinglePin = (t: string) => SINGLE_PIN.has(t);

/** Pins of `comp` as if it were east-facing at the origin. */
export function localPins(comp: ComponentInstance): PinDef[] {
  return getComponentPins({ ...comp, loc: { x: 0, y: 0 }, attrs: { ...comp.attrs, facing: 'east' } });
}

/** Body rectangle in the east-facing local frame. */
/** Width of the value box for pins, probes and constants: wide enough for a bus value such as 0xFF. */
export function valueBoxWidth(comp: ComponentInstance): number {
  const w = comp.attrs.width ?? 1;
  if (w <= 1 || !['Pin', 'Probe', 'Constant'].includes(comp.type)) return 20;
  const chars = 2 + Math.ceil(w / 4); // '0x' and one hex digit per nibble
  return Math.ceil((chars * 7 + 8) / 10) * 10;
}

export function localBody(comp: ComponentInstance): Rect {
  const t = comp.type;
  if (SINGLE_PIN.has(t)) return { x0: -valueBoxWidth(comp), y0: -10, x1: 0, y1: 10 };
  if (GATES.has(t)) {
    const n = Math.max(2, comp.attrs.inputs ?? 2);
    const h = Math.max(20, Math.ceil(n / 2) * 10 + 10);
    return { x0: -50, y0: -h, x1: 0, y1: h };
  }
  if (t === 'NOT Gate' || t === 'Buffer') return { x0: -30, y0: -10, x1: 0, y1: 10 };
  if (t === 'Controlled Buffer' || t === 'Controlled Inverter') return { x0: -30, y0: -10, x1: 0, y1: 10 };
  if (t === '7-Segment Display' || t === 'Hex Digit Display') return { x0: 0, y0: 0, x1: 30, y1: 60 };
  const pins = localPins(comp);
  const xs = pins.map((p) => p.x);
  const ys = pins.map((p) => p.y);
  const x1 = Math.max(...xs, 0);
  const x0 = Math.min(Math.min(...xs), x1 - 40);
  return { x0, y0: Math.min(...ys) - 10, x1, y1: Math.max(...ys) + 10 };
}

export function rotate(p: Point, facing: Facing): Point {
  switch (facing) {
    case 'east':
      return { x: p.x, y: p.y };
    case 'west':
      return { x: -p.x, y: -p.y };
    case 'south':
      return { x: -p.y, y: p.x };
    case 'north':
      return { x: p.y, y: -p.x };
  }
}

/** Axis-aligned world bounds of the component body. */
export function worldBounds(comp: ComponentInstance): Rect {
  const r = localBody(comp);
  const f = facingOf(comp);
  const a = rotate({ x: r.x0, y: r.y0 }, f);
  const b = rotate({ x: r.x1, y: r.y1 }, f);
  return {
    x0: comp.loc.x + Math.min(a.x, b.x),
    y0: comp.loc.y + Math.min(a.y, b.y),
    x1: comp.loc.x + Math.max(a.x, b.x),
    y1: comp.loc.y + Math.max(a.y, b.y),
  };
}

export const center = (r: Rect): Point => ({ x: (r.x0 + r.x1) / 2, y: (r.y0 + r.y1) / 2 });

export function hitComponent(comps: readonly ComponentInstance[], p: Point, pad = 4): ComponentInstance | null {
  for (let i = comps.length - 1; i >= 0; i--) {
    const b = worldBounds(comps[i]);
    if (p.x >= b.x0 - pad && p.x <= b.x1 + pad && p.y >= b.y0 - pad && p.y <= b.y1 + pad) return comps[i];
  }
  return null;
}

export function hitPin(comps: readonly ComponentInstance[], p: Point, radius = 8): { comp: ComponentInstance; pin: PinDef } | null {
  let best: { comp: ComponentInstance; pin: PinDef; d: number } | null = null;
  for (const comp of comps) {
    for (const pin of getComponentPins(comp)) {
      const d = Math.hypot(pin.x - p.x, pin.y - p.y);
      if (d <= radius && (!best || d < best.d)) best = { comp, pin, d };
    }
  }
  return best;
}

/** Distance from point to an axis-aligned (or any) segment. */
export function distToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}
