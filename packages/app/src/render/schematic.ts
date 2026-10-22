/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * Schematic renderer shared by the app and the website. It turns components and wires into plain shape
 * descriptions; the app maps them to React elements and the website serializes them to SVG text, so a
 * circuit looks the same in both. Pure TypeScript: no DOM, no React.
 */
import {
  getComponentPins,
  hasErrorBit,
  isFullyDefined,
  isFullyFloating,
  isPointOnWire,
  pointKey,
  simulateCircuit,
  valueToDisplayString,
  valueToInt,
  type Circuit,
  type ComponentInstance,
  type LogicValue,
  type Point,
  type SimulationResult,
} from '@logisim/core';
import { center, facingOf, isGate, isInverting, localBody, ROTATION, worldBounds, type Rect } from './geometry';

export type Prim =
  | { k: 'path'; d: string; cls?: string; stroke?: string; fill?: string; sw?: number; dash?: string }
  | { k: 'rect'; x: number; y: number; w: number; h: number; rx?: number; cls?: string; stroke?: string; fill?: string; sw?: number }
  | { k: 'circle'; cx: number; cy: number; r: number; cls?: string; stroke?: string; fill?: string }
  | { k: 'line'; x1: number; y1: number; x2: number; y2: number; cls?: string; stroke?: string; sw?: number; dash?: string }
  | { k: 'text'; x: number; y: number; text: string; cls: string; anchor?: 'start' | 'middle' | 'end'; central?: boolean }
  | { k: 'g'; transform: string; children: Prim[] };

export function valueColor(v: LogicValue | undefined): string {
  if (!v) return 'var(--line)';
  if (hasErrorBit(v)) return 'var(--wire-e)';
  if (isFullyFloating(v) || !isFullyDefined(v)) return 'var(--wire-z)';
  if (v.width === 1) return v.bits[0] === '1' ? 'var(--wire-1)' : 'var(--wire-0)';
  return 'var(--wire-x)';
}

const SHORT_TITLES: Record<string, string> = {
  Adder: 'ADD',
  Multiplexer: 'MUX',
  Demultiplexer: 'DEMUX',
  'Priority Encoder': 'PRI',
  Decoder: 'DEC',
  Counter: 'CTR',
  Register: 'REG',
  Subtractor: 'SUB',
  Multiplier: 'MUL',
  Comparator: 'CMP',
  Negator: 'NEG',
  Shifter: 'SHIFT',
  'D Flip-Flop': 'D-FF',
  'T Flip-Flop': 'T-FF',
  'J-K Flip-Flop': 'JK-FF',
  'S-R Flip-Flop': 'SR-FF',
  Splitter: '',
};
const SEG_RECTS: Record<string, [number, number, number, number]> = {
  seg_a: [6, 4, 18, 4],
  seg_b: [22, 7, 4, 21],
  seg_c: [22, 32, 4, 21],
  seg_d: [6, 52, 18, 4],
  seg_e: [4, 32, 4, 21],
  seg_f: [4, 7, 4, 21],
  seg_g: [6, 28, 18, 4],
};
const SPECIAL = new Set([
  'Pin', 'Probe', 'LED', 'Button', 'Clock', 'Constant', 'Power', 'Ground', 'Tunnel',
  'NOT Gate', 'Buffer', 'Controlled Buffer', 'Controlled Inverter', '7-Segment Display', 'Hex Digit Display',
]);

function gateShape(type: string, h: number, stroke: string): Prim[] {
  const inv = isInverting(type);
  const xe = inv ? -8 : 0;
  const out: Prim[] = [];
  if (type === 'AND Gate' || type === 'NAND Gate') {
    out.push({ k: 'path', d: `M-50 ${-h}H${xe - 25}A25 ${h} 0 0 1 ${xe - 25} ${h}H-50Z`, cls: 'glyph-body', stroke });
  } else {
    out.push({ k: 'path', d: `M-50 ${-h}Q${xe - 20} ${-h} ${xe} 0Q${xe - 20} ${h} -50 ${h}Q-38 0 -50 ${-h}Z`, cls: 'glyph-body', stroke });
    if (type === 'XOR Gate' || type === 'XNOR Gate' || type === 'Odd Parity' || type === 'Even Parity') {
      out.push({ k: 'path', d: `M-58 ${-h}Q-46 0 -58 ${h}`, cls: 'glyph-line', stroke });
    }
  }
  if (inv) out.push({ k: 'circle', cx: -4, cy: 0, r: 4, cls: 'glyph-body', stroke });
  return out;
}

export interface GlyphOptions {
  selected?: boolean;
  showValues?: boolean;
  /** Write pin names outside the body (reference drawings with nothing wired), instead of inside it. */
  pinLabelsOutside?: boolean;
}

/** Shapes for one component, in world coordinates, including labels and pin dots. */
export function componentPrims(comp: ComponentInstance, sim: SimulationResult, opts: GlyphOptions = {}): Prim[] {
  const { selected = false, showValues = true, pinLabelsOutside = false } = opts;
  const t = comp.type;
  const pins = getComponentPins(comp);
  const pv = sim.pinValues[comp.id] ?? {};
  const body = localBody(comp);
  const wb = worldBounds(comp);
  const c = center(wb);
  const stroke = selected ? 'var(--accent)' : 'var(--fg)';
  const first = pins[0] ? pv[pins[0].id] : undefined;
  const firstText = first ? valueToDisplayString(first) : '';
  const bw = -body.x0;
  const box = (rx: number, s = stroke, sw?: number): Prim => ({ k: 'rect', x: -bw, y: -10, w: bw, h: 20, rx, cls: 'glyph-body', stroke: s, sw });

  let shape: Prim[];
  let centerText: string | null = null;
  let big = false;

  if (isGate(t)) {
    shape = gateShape(t, body.y1, stroke);
    if (t === 'Odd Parity' || t === 'Even Parity') centerText = t === 'Odd Parity' ? '2k+1' : '2k';
  } else if (t === 'NOT Gate' || t === 'Buffer' || t === 'Controlled Buffer' || t === 'Controlled Inverter') {
    const inv = isInverting(t);
    shape = [{ k: 'path', d: `M-30 -10L${inv ? -8 : 0} 0L-30 10Z`, cls: 'glyph-body', stroke }];
    if (inv) shape.push({ k: 'circle', cx: -4, cy: 0, r: 4, cls: 'glyph-body', stroke });
    if (t.startsWith('Controlled')) shape.push({ k: 'path', d: 'M-10 5V10', cls: 'glyph-line', stroke });
  } else if (t === 'Pin') {
    shape = [box(comp.attrs.output ? 10 : 3, selected ? stroke : valueColor(first), 2.5)];
    centerText = firstText;
  } else if (t === 'Probe') {
    shape = [box(10, selected ? stroke : valueColor(first), 2.5)];
    centerText = firstText;
  } else if (t === 'LED') {
    shape = [{ k: 'circle', cx: -10, cy: 0, r: 9, cls: 'glyph-body', stroke, fill: first?.bits[0] === '1' ? 'var(--led)' : 'var(--card)' }];
  } else if (t === 'Button') {
    shape = [box(3), { k: 'circle', cx: -10, cy: 0, r: 5, stroke, fill: comp.attrs.value === '1' ? 'var(--wire-1)' : 'var(--surface-2)' }];
  } else if (t === 'Clock') {
    shape = [box(3), { k: 'path', d: 'M-16 4H-12V-4H-8V4H-4', cls: 'glyph-line', stroke: comp.attrs.value === '1' ? 'var(--wire-1)' : 'var(--wire-0)' }];
  } else if (t === 'Constant') {
    shape = [box(3)];
    centerText = firstText;
  } else if (t === 'Power' || t === 'Ground') {
    shape = [box(3)];
    centerText = t === 'Power' ? '1' : '0';
  } else if (t === 'Tunnel') {
    shape = [{ k: 'path', d: 'M0 0L-8 -8H-20V8H-8Z', cls: 'glyph-body', stroke }];
    centerText = comp.attrs.label ?? '';
  } else if (t === '7-Segment Display') {
    shape = [
      { k: 'rect', x: 0, y: 0, w: 30, h: 60, rx: 3, cls: 'glyph-body', stroke },
      ...Object.entries(SEG_RECTS).map(([id, [x, y, w, h]]): Prim => ({ k: 'rect', x, y, w, h, rx: 1.5, fill: pv[id]?.bits[0] === '1' ? 'var(--wire-1)' : 'var(--surface-2)' })),
      { k: 'circle', cx: 27, cy: 56, r: 2, fill: pv['seg_dp']?.bits[0] === '1' ? 'var(--wire-1)' : 'var(--surface-2)' },
    ];
  } else if (t === 'Hex Digit Display') {
    const n = pv['in0'] ? valueToInt(pv['in0']) : null;
    shape = [{ k: 'rect', x: 0, y: 0, w: 30, h: 60, rx: 3, cls: 'glyph-body', stroke }];
    centerText = n === null ? '–' : n.toString(16).toUpperCase();
    big = true;
  } else {
    shape = [{ k: 'rect', x: body.x0, y: body.y0, w: body.x1 - body.x0, h: body.y1 - body.y0, rx: 4, cls: 'glyph-body', stroke }];
  }

  const generic = !isGate(t) && !SPECIAL.has(t);
  const out: Prim[] = [{ k: 'g', transform: `translate(${comp.loc.x} ${comp.loc.y}) rotate(${ROTATION[facingOf(comp)]})`, children: shape }];
  // A labeled box shows its label above it; the type title would only crowd the pin names.
  const title = SHORT_TITLES[t] ?? t;
  if (generic && title && !comp.attrs.label) out.push({ k: 'text', x: c.x, y: c.y, text: title, cls: 'glyph-title', anchor: 'middle', central: true });
  if (centerText !== null && (showValues || t === 'Tunnel' || t === 'Power' || t === 'Ground')) {
    out.push({ k: 'text', x: c.x, y: c.y, text: centerText, cls: big ? 'glyph-big' : 'glyph-value', anchor: 'middle', central: true });
  }
  if (comp.attrs.label && t !== 'Tunnel') out.push(labelPrim(comp, comp.attrs.label, wb, c));
  if (generic) {
    const hasTitle = Boolean(title) && !comp.attrs.label;
    const narrow = Math.min(wb.x1 - wb.x0, wb.y1 - wb.y0) < 60;
    for (const p of pins) {
      const toward = pinLabelsOutside ? -1 : 1; // inside: step toward the center; outside: step away from it
      const dx = Math.sign(c.x - p.x) * toward;
      const horizontal = Math.abs(c.x - p.x) >= Math.abs(c.y - p.y);
      const dy = horizontal ? 0 : Math.sign(c.y - p.y) * toward;
      // In a narrow box a name on the title's row would print over the title, and the title says more.
      if (!pinLabelsOutside && hasTitle && narrow && horizontal && Math.abs(p.y - c.y) < 7) continue;
      out.push({
        k: 'text',
        x: p.x + (horizontal ? dx * 5 : 0),
        y: p.y + dy * 8,
        text: p.label,
        cls: 'glyph-pin',
        anchor: horizontal ? (dx > 0 ? 'start' : 'end') : 'middle',
        central: true,
      });
    }
  }
  for (const p of pins) out.push({ k: 'circle', cx: p.x, cy: p.y, r: 3.5, cls: 'pin-dot', fill: valueColor(pv[p.id]) });
  return out;
}

const SIDE_LABELED = new Set(['Pin', 'Probe', 'LED', 'Clock', 'Button', 'Constant']);

/**
 * Pins, probes and other one-pin parts are often stacked 20px apart, so their label goes beside the body on
 * the side away from the wire. Everything else is labeled above.
 */
function labelPrim(comp: ComponentInstance, text: string, wb: Rect, c: Point): Prim {
  if (SIDE_LABELED.has(comp.type)) {
    const dx = Math.sign(c.x - comp.loc.x);
    const dy = Math.sign(c.y - comp.loc.y);
    if (dx !== 0) return { k: 'text', x: dx > 0 ? wb.x1 + 5 : wb.x0 - 5, y: c.y, text, cls: 'glyph-label', anchor: dx > 0 ? 'start' : 'end', central: true };
    if (dy > 0) return { k: 'text', x: c.x, y: wb.y1 + 12, text, cls: 'glyph-label', anchor: 'middle' };
  }
  return { k: 'text', x: c.x, y: wb.y0 - 5, text, cls: 'glyph-label', anchor: 'middle' };
}

/** Points where three or more wire ends meet, or a wire end lands on the middle of another wire. */
export function junctionPoints(circuit: Circuit): Point[] {
  const found = new Map<string, Point>();
  for (const w of circuit.wires) {
    for (const p of [w.from, w.to]) {
      const others = circuit.wires.filter((o) => o !== w && isPointOnWire(p, o));
      const interior = others.some((o) => !((o.from.x === p.x && o.from.y === p.y) || (o.to.x === p.x && o.to.y === p.y)));
      if (others.length >= 2 || interior) found.set(pointKey(p), p);
    }
  }
  return [...found.values()];
}

/** Wires and junction dots, colored by their net's value. */
export function wirePrims(circuit: Circuit, sim: SimulationResult): Prim[] {
  const out: Prim[] = circuit.wires.map((w): Prim => {
    const v = sim.netValues[sim.wireToNet[w.id]];
    return {
      k: 'line',
      x1: w.from.x,
      y1: w.from.y,
      x2: w.to.x,
      y2: w.to.y,
      cls: 'wire',
      stroke: valueColor(v),
      sw: (v?.width ?? 1) > 1 ? 4.5 : 2.5,
      dash: v?.bits.includes('E') ? '6 3' : undefined,
    };
  });
  for (const p of junctionPoints(circuit)) out.push({ k: 'circle', cx: p.x, cy: p.y, r: 4, fill: valueColor(sim.netValues[sim.pointToNet[pointKey(p)] ?? '']) });
  return out;
}

/** Bounds of everything drawn for the circuit. */
export function circuitBounds(circuit: Circuit): Rect | null {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const c of circuit.components) {
    const b = worldBounds(c);
    xs.push(b.x0, b.x1);
    ys.push(b.y0, b.y1);
    if (c.attrs.label && c.type !== 'Tunnel') {
      // Leave room for the label text (about 6.5px per character at 11px).
      const p = labelPrim(c, c.attrs.label, b, center(b));
      if (p.k === 'text') {
        const w = c.attrs.label.length * 6.5;
        xs.push(p.anchor === 'start' ? p.x + w : p.anchor === 'end' ? p.x - w : p.x - w / 2, p.anchor === 'middle' ? p.x + w / 2 : p.x);
        ys.push(p.y - 12, p.y + 4);
      }
    }
  }
  for (const w of circuit.wires) xs.push(w.from.x, w.to.x), ys.push(w.from.y, w.to.y);
  if (!xs.length) return null;
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function primToSvg(p: Prim): string {
  const a = (name: string, v: string | number | undefined) => (v === undefined ? '' : ` ${name}="${esc(String(v))}"`);
  switch (p.k) {
    case 'path':
      return `<path d="${p.d}"${a('class', p.cls)}${a('stroke', p.stroke)}${a('fill', p.fill)}${a('stroke-width', p.sw)}${a('stroke-dasharray', p.dash)}/>`;
    case 'rect':
      return `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}"${a('rx', p.rx)}${a('class', p.cls)}${a('stroke', p.stroke)}${a('fill', p.fill)}${a('stroke-width', p.sw)}/>`;
    case 'circle':
      return `<circle cx="${p.cx}" cy="${p.cy}" r="${p.r}"${a('class', p.cls)}${a('stroke', p.stroke)}${a('fill', p.fill)}/>`;
    case 'line':
      return `<line x1="${p.x1}" y1="${p.y1}" x2="${p.x2}" y2="${p.y2}"${a('class', p.cls)}${a('stroke', p.stroke)}${a('stroke-width', p.sw)}${a('stroke-dasharray', p.dash)}/>`;
    case 'text':
      return `<text x="${p.x}" y="${p.y}" class="${p.cls}"${a('text-anchor', p.anchor)}${p.central ? ' dominant-baseline="central"' : ''}>${esc(p.text)}</text>`;
    case 'g':
      return `<g transform="${p.transform}">${p.children.map(primToSvg).join('')}</g>`;
  }
}

export interface SchematicOptions {
  /** Accessible description of the picture. */
  label: string;
  /** Precomputed simulation; simulated from the circuit's current input values when omitted. */
  sim?: SimulationResult;
  pad?: number;
  glyph?: GlyphOptions;
}

/** A complete, self-sized inline <svg> of the circuit in its current state. Styling comes from schematic.css. */
export function schematicSvg(circuit: Circuit, opts: SchematicOptions): string {
  const sim = opts.sim ?? simulateCircuit(circuit);
  const pad = opts.pad ?? 16;
  const b = circuitBounds(circuit) ?? { x0: 0, y0: 0, x1: 100, y1: 60 };
  const x = b.x0 - pad;
  const y = b.y0 - pad;
  const w = b.x1 - b.x0 + pad * 2;
  const h = b.y1 - b.y0 + pad * 2;
  const body = [...wirePrims(circuit, sim), ...circuit.components.flatMap((c) => componentPrims(c, sim, opts.glyph))].map(primToSvg).join('');
  return `<svg class="schematic" viewBox="${x} ${y} ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(opts.label)}">${body}</svg>`;
}
