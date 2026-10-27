/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * Schematics and simulated truth tables for the site, drawn by the app's own renderer from the core's preset
 * circuits, so a guide shows exactly what the app opens. Needs the register-ts.mjs preload (see package.json).
 */
import { COMPONENT_CATALOG, PRESET_CIRCUITS, simulateCircuit, valueToDisplayString } from '@logisim/core';
import { schematicSvg } from '../../app/src/render/schematic.ts';

const SEQUENTIAL = new Set(['Clock', 'Button', 'D Flip-Flop', 'T Flip-Flop', 'J-K Flip-Flop', 'S-R Flip-Flop', 'Register', 'Counter']);
const MAX_TABLE_INPUTS = 4;

export function preset(slug) {
  const p = PRESET_CIRCUITS.find((x) => x.slug === slug);
  if (!p) throw new Error(`no preset circuit named ${slug}`);
  return p;
}

/** The preset circuit as it opens in the app (its saved input values), simulated. */
export function circuitSchematic(slug) {
  const p = preset(slug);
  return schematicSvg(p.circuit, { label: `Schematic of the ${p.name} circuit` });
}

const isInput = (c) => c.type === 'Pin' && !c.attrs.output;
const isOutput = (c) => c.type === 'Pin' && c.attrs.output;

/**
 * Every input combination run through the simulator, for combinational circuits with at most four 1-bit
 * inputs. Returns null for anything else (sequential parts, buses, too many inputs).
 */
export function simulatedTruthTable(slug) {
  const { name, circuit } = preset(slug);
  if (circuit.components.some((c) => SEQUENTIAL.has(c.type))) return null;
  const inputs = circuit.components.filter(isInput);
  const outputs = circuit.components.filter(isOutput);
  if (!inputs.length || !outputs.length || inputs.length > MAX_TABLE_INPUTS || inputs.some((c) => (c.attrs.width ?? 1) !== 1)) return null;
  const initialBits = inputs.map((c) => (c.attrs.value === '1' ? 1 : 0));
  let initialRow = 0;
  const rows = [];
  for (let n = 0; n < 1 << inputs.length; n++) {
    const bits = inputs.map((_, i) => (n >> (inputs.length - 1 - i)) & 1);
    if (bits.every((b, i) => b === initialBits[i])) initialRow = n;
    const set = new Map(inputs.map((c, i) => [c.id, String(bits[i])]));
    const rowCircuit = {
      ...circuit,
      components: circuit.components.map((c) => (set.has(c.id) ? { ...c, attrs: { ...c.attrs, value: set.get(c.id) } } : c)),
    };
    const sim = simulateCircuit(rowCircuit);
    const svg = schematicSvg(rowCircuit, { label: `Schematic of the ${name} circuit`, sim });
    rows.push({ inputs: bits, outputs: outputs.map((c) => valueToDisplayString(sim.pinValues[c.id].in0)), svg });
  }
  return { inputs: inputs.map((c) => c.attrs.label ?? c.id), outputs: outputs.map((c) => c.attrs.label ?? c.id), initialRow, rows };
}

/** One component with its default settings and unconnected pins. */
export function componentSchematic(type) {
  const item = COMPONENT_CATALOG.find((c) => c.type === type);
  if (!item) throw new Error(`no component type ${type}`);
  const circuit = { name: type, components: [{ id: 'c', type, loc: { x: 0, y: 0 }, attrs: { ...item.defaultAttrs } }], wires: [] };
  // No values: pins are drawn neutral, since nothing drives them.
  const sim = { ...simulateCircuit(circuit), pinValues: {} };
  return schematicSvg(circuit, { label: `The ${item.shortName} component`, sim, pad: 28, glyph: { pinLabelsOutside: true } });
}
