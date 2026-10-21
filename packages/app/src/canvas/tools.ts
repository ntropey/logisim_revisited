/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * Editor tools and the component palette (built from the core catalog).
 */
import { COMPONENT_CATALOG, type Circuit, type ComponentAttrs, type ComponentCategory, type ComponentInstance, type ComponentType, type Point } from '@logisim/core';

export interface PaletteItem {
  key: string;
  type: ComponentType;
  name: string;
  category: ComponentCategory;
  description: string;
  attrs: ComponentAttrs;
}

export type Tool = { kind: 'select' } | { kind: 'poke' } | { kind: 'wire' } | { kind: 'place'; item: PaletteItem };

export const SELECT: Tool = { kind: 'select' };

export const PALETTE: readonly PaletteItem[] = COMPONENT_CATALOG.flatMap((c) => {
  const base: PaletteItem = { key: c.type, type: c.type, name: c.shortName, category: c.category, description: c.description, attrs: c.defaultAttrs };
  if (c.type !== 'Pin') return [base];
  return [
    base,
    {
      key: 'Output Pin',
      type: 'Pin' as const,
      name: 'Output Pin',
      category: c.category,
      description: 'Shows the value of the wire it is attached to.',
      attrs: { ...c.defaultAttrs, output: true, facing: 'west', label: 'Y' },
    },
  ];
});

export const CATEGORIES: readonly ComponentCategory[] = ['Wiring', 'Gates', 'Plexers', 'Arithmetic', 'Memory', 'I/O'];

export function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function nextLabel(circuit: Circuit, output: boolean): string {
  const used = new Set(circuit.components.filter((c) => c.type === 'Pin' && Boolean(c.attrs.output) === output).map((c) => c.attrs.label));
  if (output) {
    for (let i = 0; ; i++) {
      const l = i === 0 ? 'Y' : `Y${i}`;
      if (!used.has(l)) return l;
    }
  }
  for (const l of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') if (!used.has(l)) return l;
  return `In${used.size + 1}`;
}

export function makeComponent(item: PaletteItem, loc: Point, circuit: Circuit): ComponentInstance {
  const attrs: ComponentAttrs = { ...item.attrs };
  if (item.type === 'Pin') attrs.label = nextLabel(circuit, Boolean(attrs.output));
  return { id: uid('c'), type: item.type, loc, attrs };
}
