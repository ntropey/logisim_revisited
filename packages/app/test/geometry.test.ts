import { describe, expect, it } from 'vitest';
import { getComponentPins, type ComponentInstance } from '@logisim/core';
import { hitComponent, hitPin, rotate, snap, worldBounds } from '../src/canvas/geometry';

const and = (facing: ComponentInstance['attrs']['facing'] = 'east'): ComponentInstance => ({
  id: 'g',
  type: 'AND Gate',
  loc: { x: 100, y: 100 },
  attrs: { facing, inputs: 2 },
});

describe('canvas geometry', () => {
  it('snaps to the 10px grid', () => {
    expect([snap(4), snap(5), snap(14), snap(-6)]).toEqual([0, 10, 10, -10]);
  });

  it('keeps every pin inside or on the edge of the body for every facing', () => {
    for (const facing of ['east', 'south', 'west', 'north'] as const) {
      const g = and(facing);
      const b = worldBounds(g);
      for (const p of getComponentPins(g)) {
        expect(p.x).toBeGreaterThanOrEqual(b.x0 - 1);
        expect(p.x).toBeLessThanOrEqual(b.x1 + 1);
        expect(p.y).toBeGreaterThanOrEqual(b.y0 - 1);
        expect(p.y).toBeLessThanOrEqual(b.y1 + 1);
      }
    }
  });

  it('rotates offsets the same way the core places pins', () => {
    const east = { x: -50, y: 10 };
    for (const facing of ['east', 'south', 'west', 'north'] as const) {
      const pin = getComponentPins(and(facing)).find((p) => p.id === 'in1')!;
      const r = rotate(east, facing);
      expect({ x: pin.x - 100, y: pin.y - 100 }).toEqual(r);
    }
  });

  it('hit-tests components and pins', () => {
    const g = and();
    expect(hitComponent([g], { x: 75, y: 100 })).toBe(g);
    expect(hitComponent([g], { x: 300, y: 300 })).toBeNull();
    expect(hitPin([g], { x: 100, y: 101 })?.pin.id).toBe('out0');
  });
});
