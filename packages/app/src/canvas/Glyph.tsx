/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * Draws one component: gate shapes, I/O widgets and a generic labeled box for everything else.
 */
import {
  getComponentPins,
  hasErrorBit,
  isFullyFloating,
  isFullyDefined,
  valueToDisplayString,
  valueToInt,
  type ComponentInstance,
  type LogicValue,
  type SimulationResult,
} from '@logisim/core';
import { center, facingOf, isGate, isInverting, localBody, ROTATION, worldBounds, type Rect } from './geometry';

export function valueColor(v: LogicValue | undefined): string {
  if (!v) return 'var(--line)';
  if (hasErrorBit(v)) return 'var(--wire-e)';
  if (isFullyFloating(v)) return 'var(--wire-z)';
  if (!isFullyDefined(v)) return 'var(--wire-z)';
  if (v.width === 1) return v.bits[0] === '1' ? 'var(--wire-1)' : 'var(--wire-0)';
  return 'var(--wire-x)';
}

interface Props {
  comp: ComponentInstance;
  sim: SimulationResult;
  selected: boolean;
  highlighted: boolean;
  showValues: boolean;
}

const SHORT_TITLES: Record<string, string> = {
  Multiplexer: 'MUX',
  Demultiplexer: 'DEMUX',
  'Priority Encoder': 'PRI ENC',
  Subtractor: 'SUB',
  Multiplier: 'MUL',
  Comparator: 'CMP',
  Negator: 'NEG',
  Shifter: 'SHIFT',
  'D Flip-Flop': 'D-FF',
  'T Flip-Flop': 'T-FF',
  'J-K Flip-Flop': 'JK-FF',
  'S-R Flip-Flop': 'SR-FF',
  Splitter: 'SPLIT',
  'Odd Parity': 'ODD',
  'Even Parity': 'EVEN',
  'Controlled Buffer': 'BUF',
  'Controlled Inverter': 'NOT',
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

function gateShape(type: string, h: number, stroke: string) {
  const inv = isInverting(type);
  const xe = inv ? -8 : 0;
  let d: string;
  let extra: string | null = null;
  if (type === 'AND Gate' || type === 'NAND Gate') {
    d = `M-50 ${-h}H${xe - 25}A25 ${h} 0 0 1 ${xe - 25} ${h}H-50Z`;
  } else {
    d = `M-50 ${-h}Q${xe - 20} ${-h} ${xe} 0Q${xe - 20} ${h} -50 ${h}Q-38 0 -50 ${-h}Z`;
    if (type === 'XOR Gate' || type === 'XNOR Gate' || type === 'Odd Parity' || type === 'Even Parity') extra = `M-58 ${-h}Q-46 0 -58 ${h}`;
  }
  return (
    <>
      <path d={d} className="glyph-body" stroke={stroke} />
      {extra && <path d={extra} className="glyph-line" stroke={stroke} />}
      {inv && <circle cx={-4} cy={0} r={4} className="glyph-body" stroke={stroke} />}
    </>
  );
}

export function Glyph({ comp, sim, selected, highlighted, showValues }: Props) {
  const t = comp.type;
  const pins = getComponentPins(comp);
  const pv = sim.pinValues[comp.id] ?? {};
  const body = localBody(comp);
  const wb = worldBounds(comp);
  const c = center(wb);
  const stroke = selected ? 'var(--accent)' : 'var(--fg)';
  const first = pins[0] ? pv[pins[0].id] : undefined;
  const firstText = first ? valueToDisplayString(first) : '';
  const rot = `translate(${comp.loc.x} ${comp.loc.y}) rotate(${ROTATION[facingOf(comp)]})`;
  const label = comp.attrs.label;

  let shape: React.ReactNode;
  let centerText: string | null = null;

  if (isGate(t) || t === 'NOT Gate' || t === 'Buffer' || t === 'Controlled Buffer' || t === 'Controlled Inverter') {
    if (isGate(t)) {
      const h = body.y1;
      shape = gateShape(t, h, stroke);
      if (t === 'Odd Parity' || t === 'Even Parity') centerText = t === 'Odd Parity' ? '2k+1' : '2k';
    } else {
      const inv = isInverting(t);
      const xe = inv ? -8 : 0;
      shape = (
        <>
          <path d={`M-30 -10L${xe} 0L-30 10Z`} className="glyph-body" stroke={stroke} />
          {inv && <circle cx={-4} cy={0} r={4} className="glyph-body" stroke={stroke} />}
          {t.startsWith('Controlled') && <path d="M-10 5V10" className="glyph-line" stroke={stroke} />}
        </>
      );
    }
  } else if (t === 'Pin') {
    const isOut = Boolean(comp.attrs.output);
    shape = <rect x={-20} y={-10} width={20} height={20} rx={isOut ? 10 : 3} className="glyph-body" stroke={selected ? stroke : valueColor(first)} strokeWidth={2.5} />;
    centerText = firstText;
  } else if (t === 'Probe') {
    shape = <rect x={-20} y={-10} width={20} height={20} rx={10} className="glyph-body" stroke={selected ? stroke : valueColor(first)} strokeWidth={2.5} />;
    centerText = firstText;
  } else if (t === 'LED') {
    const on = first?.bits[0] === '1';
    shape = <circle cx={-10} cy={0} r={9} className="glyph-body" stroke={stroke} fill={on ? 'var(--led)' : 'var(--card)'} />;
  } else if (t === 'Button') {
    const on = comp.attrs.value === '1';
    shape = (
      <>
        <rect x={-20} y={-10} width={20} height={20} rx={3} className="glyph-body" stroke={stroke} />
        <circle cx={-10} cy={0} r={5} fill={on ? 'var(--wire-1)' : 'var(--surface-2)'} stroke={stroke} />
      </>
    );
  } else if (t === 'Clock') {
    shape = (
      <>
        <rect x={-20} y={-10} width={20} height={20} rx={3} className="glyph-body" stroke={stroke} />
        <path d="M-16 4H-12V-4H-8V4H-4" className="glyph-line" stroke={comp.attrs.value === '1' ? 'var(--wire-1)' : 'var(--wire-0)'} />
      </>
    );
  } else if (t === 'Constant') {
    shape = <rect x={-20} y={-10} width={20} height={20} rx={3} className="glyph-body" stroke={stroke} />;
    centerText = firstText;
  } else if (t === 'Power' || t === 'Ground') {
    shape = (
      <>
        <rect x={-20} y={-10} width={20} height={20} rx={3} className="glyph-body" stroke={stroke} />
      </>
    );
    centerText = t === 'Power' ? '1' : '0';
  } else if (t === 'Tunnel') {
    shape = <path d="M0 0L-8 -8H-20V8H-8Z" className="glyph-body" stroke={stroke} />;
  } else if (t === '7-Segment Display') {
    shape = (
      <>
        <rect x={0} y={0} width={30} height={60} rx={3} className="glyph-body" stroke={stroke} />
        {Object.entries(SEG_RECTS).map(([id, [x, y, w, h]]) => (
          <rect key={id} x={x} y={y} width={w} height={h} rx={1.5} fill={pv[id]?.bits[0] === '1' ? 'var(--wire-1)' : 'var(--surface-2)'} />
        ))}
        <circle cx={27} cy={56} r={2} fill={pv['seg_dp']?.bits[0] === '1' ? 'var(--wire-1)' : 'var(--surface-2)'} />
      </>
    );
  } else if (t === 'Hex Digit Display') {
    const n = pv['in0'] ? valueToInt(pv['in0']) : null;
    shape = <rect x={0} y={0} width={30} height={60} rx={3} className="glyph-body" stroke={stroke} />;
    centerText = n === null ? '–' : n.toString(16).toUpperCase();
  } else {
    shape = <rect x={body.x0} y={body.y0} width={body.x1 - body.x0} height={body.y1 - body.y0} rx={4} className="glyph-body" stroke={stroke} />;
  }

  const generic = !isGate(t) && !['Pin', 'Probe', 'LED', 'Button', 'Clock', 'Constant', 'Power', 'Ground', 'Tunnel', 'NOT Gate', 'Buffer', 'Controlled Buffer', 'Controlled Inverter', '7-Segment Display', 'Hex Digit Display'].includes(t);
  const bigText = t === 'Hex Digit Display';
  const title = generic ? (SHORT_TITLES[t] ?? t) : null;
  const labelY = wb.y0 - 5;

  return (
    <g className={`glyph${selected ? ' selected' : ''}`} data-comp={comp.id}>
      {highlighted && <HaloRect r={wb} />}
      <g transform={rot}>{shape}</g>
      {selected && <rect x={wb.x0 - 4} y={wb.y0 - 4} width={wb.x1 - wb.x0 + 8} height={wb.y1 - wb.y0 + 8} rx={5} className="sel-box" />}
      {title && (
        <text x={c.x} y={c.y} className="glyph-title" textAnchor="middle" dominantBaseline="central">
          {title}
        </text>
      )}
      {centerText !== null && showValues && (
        <text x={c.x - (t === 'Hex Digit Display' ? 0 : 10 * Math.sign(c.x - comp.loc.x) * 0)} y={c.y} className={bigText ? 'glyph-big' : 'glyph-value'} textAnchor="middle" dominantBaseline="central">
          {centerText}
        </text>
      )}
      {t === 'Tunnel' && (
        <text x={c.x} y={c.y} className="glyph-value" textAnchor="middle" dominantBaseline="central">
          {comp.attrs.label ?? ''}
        </text>
      )}
      {label && t !== 'Tunnel' && (
        <text x={c.x} y={labelY} className="glyph-label" textAnchor="middle">
          {label}
        </text>
      )}
      {generic &&
        pins.map((p) => {
          const dx = Math.sign(c.x - p.x) || 0;
          const dy = Math.abs(c.x - p.x) < Math.abs(c.y - p.y) ? Math.sign(c.y - p.y) : 0;
          const horizontal = dy === 0;
          return (
            <text
              key={p.id}
              x={p.x + (horizontal ? dx * 5 : 0)}
              y={p.y + (horizontal ? 0 : dy * 8)}
              className="glyph-pin"
              textAnchor={horizontal ? (dx > 0 ? 'start' : 'end') : 'middle'}
              dominantBaseline="central"
            >
              {p.label}
            </text>
          );
        })}
      {pins.map((p) => (
        <circle key={p.id} cx={p.x} cy={p.y} r={3.5} className="pin-dot" fill={valueColor(pv[p.id])} data-pin={`${comp.id}:${p.id}`} />
      ))}
    </g>
  );
}

function HaloRect({ r }: { r: Rect }) {
  return <rect x={r.x0 - 8} y={r.y0 - 8} width={r.x1 - r.x0 + 16} height={r.y1 - r.y0 + 16} rx={8} className="halo" />;
}
