/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * One component on the canvas: the shared schematic shapes plus the editor-only selection and hint overlays.
 */
import type { ComponentInstance, SimulationResult } from '@logisim/core';
import { worldBounds } from '../render/geometry';
import { componentPrims, type Prim } from '../render/schematic';

export { valueColor } from '../render/schematic';

interface Props {
  comp: ComponentInstance;
  sim: SimulationResult;
  selected: boolean;
  highlighted: boolean;
  showValues: boolean;
}

/** Map a shared shape description to an SVG element. */
export function PrimEl({ p }: { p: Prim }) {
  switch (p.k) {
    case 'path':
      return <path d={p.d} className={p.cls} stroke={p.stroke} fill={p.fill} strokeWidth={p.sw} strokeDasharray={p.dash} />;
    case 'rect':
      return <rect x={p.x} y={p.y} width={p.w} height={p.h} rx={p.rx} className={p.cls} stroke={p.stroke} fill={p.fill} strokeWidth={p.sw} />;
    case 'circle':
      return <circle cx={p.cx} cy={p.cy} r={p.r} className={p.cls} stroke={p.stroke} fill={p.fill} />;
    case 'line':
      return <line x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} className={p.cls} stroke={p.stroke} strokeWidth={p.sw} strokeDasharray={p.dash} />;
    case 'text':
      return (
        <text x={p.x} y={p.y} className={p.cls} textAnchor={p.anchor} dominantBaseline={p.central ? 'central' : undefined}>
          {p.text}
        </text>
      );
    case 'g':
      return (
        <g transform={p.transform}>
          {p.children.map((c, i) => (
            <PrimEl key={i} p={c} />
          ))}
        </g>
      );
  }
}

export function Glyph({ comp, sim, selected, highlighted, showValues }: Props) {
  const wb = worldBounds(comp);
  return (
    <g className={`glyph${selected ? ' selected' : ''}`} data-comp={comp.id}>
      {highlighted && <rect x={wb.x0 - 8} y={wb.y0 - 8} width={wb.x1 - wb.x0 + 16} height={wb.y1 - wb.y0 + 16} rx={8} className="halo" />}
      {componentPrims(comp, sim, { selected, showValues }).map((p, i) => (
        <PrimEl key={i} p={p} />
      ))}
      {selected && <rect x={wb.x0 - 4} y={wb.y0 - 4} width={wb.x1 - wb.x0 + 8} height={wb.y1 - wb.y0 + 8} rx={5} className="sel-box" />}
    </g>
  );
}
