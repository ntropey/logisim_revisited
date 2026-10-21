/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * Interactive SVG schematic: pan/zoom (wheel and pinch), place, wire, move and poke, with live 4-state colors.
 */
import { forwardRef, useCallback, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { getComponentPins, isPointOnWire, pokeComponent, pointKey, type Circuit, type ComponentInstance, type Point, type SimulationResult, type Wire } from '@logisim/core';
import { Glyph, valueColor } from './Glyph';
import { distToSegment, hitComponent, hitPin, snap, worldBounds } from './geometry';
import { makeComponent, uid, type Tool } from './tools';

export interface Selection {
  comps: ReadonlySet<string>;
  wires: ReadonlySet<string>;
}
export const NO_SELECTION: Selection = { comps: new Set(), wires: new Set() };

export interface Highlight {
  components: ReadonlySet<string>;
  nets: ReadonlySet<string>;
}

export interface InspectTarget {
  compId?: string;
  netId?: string;
}

export interface CanvasHandle {
  fit(): void;
  zoomBy(factor: number): void;
}

interface Props {
  circuit: Circuit;
  sim: SimulationResult;
  tool: Tool;
  selection: Selection;
  highlight: Highlight;
  showGrid: boolean;
  showValues: boolean;
  commit(c: Circuit): void;
  replace(c: Circuit): void;
  checkpoint(): void;
  onSelect(s: Selection): void;
  onInspect(t: InspectTarget | null): void;
}

interface View {
  x: number;
  y: number;
  k: number;
}

const MIN_K = 0.3;
const MAX_K = 3;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

type Gesture =
  | { kind: 'pan'; sx: number; sy: number; vx: number; vy: number }
  | { kind: 'move'; start: Point; origin: Circuit; moved: boolean }
  | { kind: 'wire'; moved: boolean };

/** Increment a multi-bit input pin like a counter; single-bit pins and clocks toggle through the core. */
function poke(circuit: Circuit, comp: ComponentInstance): Circuit {
  const w = comp.attrs.width ?? 1;
  if (comp.type === 'Pin' && !comp.attrs.output && w > 1) {
    const cur = parseInt((comp.attrs.value ?? '0').replace(/[^01]/g, '') || '0', 2);
    const next = ((cur + 1) % 2 ** w).toString(2).padStart(w, '0');
    return { ...circuit, components: circuit.components.map((c) => (c.id === comp.id ? { ...c, attrs: { ...c.attrs, value: next } } : c)) };
  }
  return pokeComponent(circuit, comp.id);
}

const isInteractive = (c: ComponentInstance) => (c.type === 'Pin' && !c.attrs.output) || c.type === 'Clock' || c.type === 'Button';

function elbow(a: Point, b: Point): Wire[] {
  if (a.x === b.x && a.y === b.y) return [];
  const pts = a.x === b.x || a.y === b.y ? [a, b] : [a, { x: b.x, y: a.y }, b];
  return pts.slice(1).map((p, i) => ({ id: uid('w'), from: pts[i], to: p }));
}

export const Canvas = forwardRef<CanvasHandle, Props>(function Canvas(props, ref) {
  const { circuit, sim, tool, selection, highlight, showGrid, showValues, commit, replace, checkpoint, onSelect, onInspect } = props;
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState<View>({ x: 40, y: 40, k: 1 });
  const [cursor, setCursor] = useState<Point | null>(null);
  const [wireStart, setWireStart] = useState<Point | null>(null);
  const gesture = useRef<Gesture | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; mid: Point } | null>(null);

  const toWorld = useCallback(
    (clientX: number, clientY: number): Point => {
      const r = svgRef.current!.getBoundingClientRect();
      return { x: (clientX - r.left - view.x) / view.k, y: (clientY - r.top - view.y) / view.k };
    },
    [view],
  );

  const zoomAt = useCallback((factor: number, cx: number, cy: number) => {
    setView((v) => {
      const k = clamp(v.k * factor, MIN_K, MAX_K);
      const f = k / v.k;
      return { k, x: cx - (cx - v.x) * f, y: cy - (cy - v.y) * f };
    });
  }, []);

  const fit = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const { width, height } = svg.getBoundingClientRect();
    const xs: number[] = [];
    const ys: number[] = [];
    for (const c of circuit.components) {
      const b = worldBounds(c);
      xs.push(b.x0 - 20, b.x1 + 20);
      ys.push(b.y0 - 20, b.y1 + 20);
    }
    for (const w of circuit.wires) {
      xs.push(w.from.x, w.to.x);
      ys.push(w.from.y, w.to.y);
    }
    if (!xs.length) return setView({ x: 40, y: 40, k: 1 });
    const x0 = Math.min(...xs);
    const x1 = Math.max(...xs);
    const y0 = Math.min(...ys);
    const y1 = Math.max(...ys);
    const k = clamp(Math.min(width / (x1 - x0 + 80), height / (y1 - y0 + 80)), MIN_K, 1.6);
    setView({ k, x: (width - (x1 - x0) * k) / 2 - x0 * k, y: (height - (y1 - y0) * k) / 2 - y0 * k });
  }, [circuit]);

  useImperativeHandle(ref, () => ({
    fit,
    zoomBy: (f) => {
      const r = svgRef.current!.getBoundingClientRect();
      zoomAt(f, r.width / 2, r.height / 2);
    },
  }));

  // Wheel needs a non-passive listener to prevent page scroll.
  useLayoutEffect(() => {
    const svg = svgRef.current!;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = svg.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), e.clientX - r.left, e.clientY - r.top);
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  const netAt = (p: Point) => sim.pointToNet[pointKey(p)] ?? null;

  const hitWire = (p: Point): Wire | null => {
    for (let i = circuit.wires.length - 1; i >= 0; i--) {
      const w = circuit.wires[i];
      if (distToSegment(p, w.from, w.to) <= 5) return w;
    }
    return null;
  };

  const finishWire = () => setWireStart(null);

  const endsOnConnection = (p: Point) => Boolean(hitPin(circuit.components, p, 2) || circuit.wires.some((w) => isPointOnWire(p, w)));

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    svg.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      // Second finger: switch to pinch and abandon any one-finger gesture.
      gesture.current = null;
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
      return;
    }
    if (e.button === 2) {
      finishWire();
      return;
    }
    const p = toWorld(e.clientX, e.clientY);
    const sp = { x: snap(p.x), y: snap(p.y) };
    setCursor(sp);

    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      gesture.current = { kind: 'pan', sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y };
      return;
    }

    switch (tool.kind) {
      case 'place': {
        commit({ ...circuit, components: [...circuit.components, makeComponent(tool.item, sp, circuit)] });
        return;
      }
      case 'wire': {
        if (!wireStart) {
          setWireStart(sp);
          gesture.current = { kind: 'wire', moved: false };
        } else {
          const segs = elbow(wireStart, sp);
          if (segs.length) commit({ ...circuit, wires: [...circuit.wires, ...segs] });
          setWireStart(segs.length && !endsOnConnection(sp) ? sp : null);
        }
        return;
      }
      case 'poke': {
        const comp = hitComponent(circuit.components, p);
        if (comp && isInteractive(comp)) {
          commit(poke(circuit, comp));
          return;
        }
        const w = hitWire(p);
        const pin = hitPin(circuit.components, p, 6);
        const netId = pin ? netAt({ x: pin.pin.x, y: pin.pin.y }) : w ? sim.wireToNet[w.id] : null;
        onInspect(netId ? { netId } : comp ? { compId: comp.id } : null);
        return;
      }
      case 'select': {
        const comp = hitComponent(circuit.components, p);
        if (comp) {
          const comps = new Set(e.shiftKey ? selection.comps : []);
          if (e.shiftKey && comps.has(comp.id)) comps.delete(comp.id);
          else comps.add(comp.id);
          const nextSel = { comps, wires: e.shiftKey ? selection.wires : new Set<string>() };
          onSelect(nextSel);
          onInspect(comps.size === 1 ? { compId: comp.id } : null);
          if (comps.has(comp.id)) gesture.current = { kind: 'move', start: sp, origin: circuit, moved: false };
          return;
        }
        const w = hitWire(p);
        if (w) {
          const wires = new Set(e.shiftKey ? selection.wires : []);
          wires.add(w.id);
          onSelect({ comps: e.shiftKey ? selection.comps : new Set(), wires });
          onInspect({ netId: sim.wireToNet[w.id] });
          return;
        }
        if (!e.shiftKey) {
          onSelect(NO_SELECTION);
          onInspect(null);
        }
        gesture.current = { kind: 'pan', sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y };
      }
    }
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const r = svgRef.current!.getBoundingClientRect();
      const prev = pinch.current;
      zoomAt(dist / prev.dist, mid.x - r.left, mid.y - r.top);
      setView((v) => ({ ...v, x: v.x + mid.x - prev.mid.x, y: v.y + mid.y - prev.mid.y }));
      pinch.current = { dist, mid };
      return;
    }

    const p = toWorld(e.clientX, e.clientY);
    const sp = { x: snap(p.x), y: snap(p.y) };
    setCursor((c) => (c && c.x === sp.x && c.y === sp.y ? c : sp));

    const g = gesture.current;
    if (!g) return;
    if (g.kind === 'pan') {
      setView((v) => ({ ...v, x: g.vx + e.clientX - g.sx, y: g.vy + e.clientY - g.sy }));
    } else if (g.kind === 'move') {
      const dx = sp.x - g.start.x;
      const dy = sp.y - g.start.y;
      if (dx === 0 && dy === 0) return;
      if (!g.moved) {
        g.moved = true;
        checkpoint();
      }
      const moving = g.origin.components.filter((c) => selection.comps.has(c.id));
      // Wire ends that sat on a moved component's pin follow it, so connections survive the move.
      const pinKeys = new Set(moving.flatMap((c) => getComponentPins(c).map((pn) => pointKey(pn))));
      const shift = (pt: Point): Point => (pinKeys.has(pointKey(pt)) ? { x: pt.x + dx, y: pt.y + dy } : pt);
      replace({
        ...g.origin,
        components: g.origin.components.map((c) => (selection.comps.has(c.id) ? { ...c, loc: { x: c.loc.x + dx, y: c.loc.y + dy } } : c)),
        wires: g.origin.wires.map((w) => ({ ...w, from: shift(w.from), to: shift(w.to) })),
      });
    } else if (g.kind === 'wire' && wireStart && (sp.x !== wireStart.x || sp.y !== wireStart.y)) {
      g.moved = true;
    }
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    const g = gesture.current;
    gesture.current = null;
    // Dragging out a wire: release completes it, so a drag is one gesture and click-click also works.
    if (g?.kind === 'wire' && g.moved && wireStart) {
      const p = toWorld(e.clientX, e.clientY);
      const end = { x: snap(p.x), y: snap(p.y) };
      const segs = elbow(wireStart, end);
      if (segs.length) commit({ ...circuit, wires: [...circuit.wires, ...segs] });
      setWireStart(null);
    }
  };

  const wireColor = (w: Wire) => valueColor(sim.netValues[sim.wireToNet[w.id]]);
  const preview = wireStart && cursor ? elbow(wireStart, cursor) : [];
  const ghost = tool.kind === 'place' && cursor ? makeComponent(tool.item, cursor, circuit) : null;
  const gridK = view.k >= 0.8 ? 10 : 50;

  // Junction dots where three or more wire ends meet, or an end meets the middle of another wire.
  const junctions = new Map<string, Point>();
  for (const w of circuit.wires) {
    for (const p of [w.from, w.to]) {
      const others = circuit.wires.filter((o) => o !== w && isPointOnWire(p, o));
      const interior = others.some((o) => !((o.from.x === p.x && o.from.y === p.y) || (o.to.x === p.x && o.to.y === p.y)));
      if (others.length >= 2 || interior) junctions.set(pointKey(p), p);
    }
  }

  return (
    <svg
      ref={svgRef}
      className="canvas"
      data-tool={tool.kind}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={() => setCursor(null)}
      onDoubleClick={finishWire}
      onContextMenu={(e) => {
        e.preventDefault();
        finishWire();
      }}
      role="application"
      aria-label="Circuit schematic"
    >
      {showGrid && (
        <>
          <defs>
            <pattern id="grid" width={gridK * view.k} height={gridK * view.k} patternUnits="userSpaceOnUse" x={view.x} y={view.y}>
              <circle cx={0.5} cy={0.5} r={1} className="grid-dot" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" pointerEvents="none" />
        </>
      )}
      <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
        {circuit.wires.map((w) => {
          const net = sim.wireToNet[w.id];
          const wide = (sim.netValues[net]?.width ?? 1) > 1;
          return (
            <g key={w.id}>
              {highlight.nets.has(net) && <line x1={w.from.x} y1={w.from.y} x2={w.to.x} y2={w.to.y} className="wire-halo" />}
              {selection.wires.has(w.id) && <line x1={w.from.x} y1={w.from.y} x2={w.to.x} y2={w.to.y} className="wire-selected" />}
              <line
                x1={w.from.x}
                y1={w.from.y}
                x2={w.to.x}
                y2={w.to.y}
                className={`wire${sim.oscillatingNets.includes(net) ? ' oscillating' : ''}`}
                stroke={wireColor(w)}
                strokeWidth={wide ? 4.5 : 2.5}
                strokeDasharray={sim.netValues[net]?.bits.includes('E') ? '6 3' : undefined}
              />
            </g>
          );
        })}
        {[...junctions.values()].map((p) => (
          <circle key={pointKey(p)} cx={p.x} cy={p.y} r={4} fill={valueColor(sim.netValues[netAt(p) ?? ''])} />
        ))}
        {circuit.components.map((c) => (
          <Glyph key={c.id} comp={c} sim={sim} selected={selection.comps.has(c.id)} highlighted={highlight.components.has(c.id)} showValues={showValues} />
        ))}
        {preview.map((w) => (
          <line key={w.id} x1={w.from.x} y1={w.from.y} x2={w.to.x} y2={w.to.y} className="wire-preview" />
        ))}
        {wireStart && <circle cx={wireStart.x} cy={wireStart.y} r={5} className="wire-anchor" />}
        {ghost && (
          <g opacity={0.5} pointerEvents="none">
            <Glyph comp={ghost} sim={{ ...sim, pinValues: {} }} selected={false} highlighted={false} showValues={false} />
          </g>
        )}
      </g>
    </svg>
  );
});
