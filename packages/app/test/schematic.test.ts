import { describe, expect, it } from 'vitest';
import { PRESET_CIRCUITS, simulateCircuit, type ComponentInstance } from '@logisim/core';
import { valueBoxWidth } from '../src/render/geometry';
import { componentPrims, schematicSvg } from '../src/render/schematic';

describe('shared schematic renderer', () => {
  it('renders every preset as a self-sized SVG without template leaks', () => {
    for (const p of PRESET_CIRCUITS) {
      const svg = schematicSvg(p.circuit, { label: p.name });
      expect(svg).toMatch(/^<svg class="schematic" viewBox="-?[\d.]+ -?[\d.]+ [\d.]+ [\d.]+"/);
      expect(svg).not.toMatch(/NaN|undefined|null/);
      expect(svg.match(/class="pin-dot"/g)?.length).toBeGreaterThan(0);
    }
  });

  it('colors wires by their simulated value', () => {
    const half = PRESET_CIRCUITS.find((p) => p.slug === 'half-adder')!; // A = B = 1
    const svg = schematicSvg(half.circuit, { label: 'half adder' });
    expect(svg).toContain('stroke="var(--wire-1)"');
    expect(svg).toContain('stroke="var(--wire-0)"'); // Sum = 0
  });

  it('widens value boxes for buses so 0xFF fits', () => {
    const pin = (width: number): ComponentInstance => ({ id: 'p', type: 'Pin', loc: { x: 0, y: 0 }, attrs: { width } });
    expect(valueBoxWidth(pin(1))).toBe(20);
    expect(valueBoxWidth(pin(4))).toBe(30);
    expect(valueBoxWidth(pin(8))).toBeGreaterThan(valueBoxWidth(pin(4)));
  });

  it('labels input pins on the far side from their wire', () => {
    const c: ComponentInstance = { id: 'a', type: 'Pin', loc: { x: 100, y: 50 }, attrs: { label: 'A', value: '1' } };
    const sim = simulateCircuit({ name: 't', components: [c], wires: [] });
    const label = componentPrims(c, sim).find((p) => p.k === 'text' && p.text === 'A');
    expect(label).toMatchObject({ anchor: 'end' });
    expect(label && label.k === 'text' && label.x).toBeLessThan(80);
  });
});
