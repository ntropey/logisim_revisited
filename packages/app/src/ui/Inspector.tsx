/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * Inspector: what is selected, why a signal has its value (the prover), step-by-step Coach hints, and properties.
 */
import { useEffect, useMemo, useState } from 'react';
import { getComponentPins, traceSignal, valueToDisplayString, type Circuit, type ComponentAttrs, type ComponentInstance, type Facing, type SignalTrace, type SimulationResult } from '@logisim/core';
import type { InspectTarget } from '../canvas/Canvas';
import { valueColor } from '../canvas/Glyph';
import { Icon } from './icons';

interface Props {
  circuit: Circuit;
  sim: SimulationResult;
  target: InspectTarget | null;
  selectedComp: ComponentInstance | null;
  commit(c: Circuit): void;
  /** Reports which components/nets the revealed hint talks about, so the canvas can highlight them. */
  onHighlight(h: { components: string[]; nets: string[] }): void;
}

const NO_WIDTH = new Set(['LED', 'Clock', 'Button', 'D Flip-Flop', 'T Flip-Flop', 'J-K Flip-Flop', 'S-R Flip-Flop', '7-Segment Display', 'Hex Digit Display']);
const GATE_TYPES = new Set(['AND Gate', 'OR Gate', 'NAND Gate', 'NOR Gate', 'XOR Gate', 'XNOR Gate', 'Odd Parity', 'Even Parity']);

export function Inspector({ circuit, sim, target, selectedComp, commit, onHighlight }: Props) {
  const [revealed, setRevealed] = useState(0);

  const trace: SignalTrace | null = useMemo(() => {
    if (!target) return null;
    try {
      return traceSignal(circuit, sim, target);
    } catch {
      return null;
    }
  }, [circuit, sim, target]);

  useEffect(() => setRevealed(0), [target?.compId, target?.netId]);

  const stages = trace?.stages ?? [];
  const shown = stages.slice(0, revealed);
  useEffect(() => {
    const last = shown[shown.length - 1];
    onHighlight(last ? { components: last.highlightComponents, nets: last.highlightNets } : { components: [], nets: [] });
  }, [revealed, trace]); // eslint-disable-line react-hooks/exhaustive-deps

  const setAttrs = (patch: Partial<ComponentAttrs>) => {
    if (!selectedComp) return;
    commit({ ...circuit, components: circuit.components.map((c) => (c.id === selectedComp.id ? { ...c, attrs: { ...c.attrs, ...patch } } : c)) });
  };

  return (
    <div className="inspector">
      {!trace && !selectedComp && (
        <div className="empty">
          <Icon name="info" size={28} />
          <p>
            Select a wire, pin or part to see its value. Then ask <strong>why</strong> it is 0, 1, E or Z, or let the Coach walk you through it one hint at a time.
          </p>
        </div>
      )}

      {trace && (
        <section className="card">
          <div className="card-head">
            <span className="value-chip" style={{ background: valueColor(trace.value) }}>
              {valueToDisplayString(trace.value)}
            </span>
            <div>
              <div className="card-title">{trace.targetLabel}</div>
              <div className="muted small">{trace.headline}</div>
            </div>
          </div>
          <div className="row">
            <button className="btn small" onClick={() => setRevealed((r) => Math.min(stages.length, r + 1))} disabled={revealed >= stages.length}>
              <Icon name="bulb" size={16} /> {revealed === 0 ? 'Coach me' : revealed >= stages.length ? 'No more hints' : `Next hint (${revealed}/${stages.length})`}
            </button>
            <button className="btn small alt" onClick={() => setRevealed(revealed >= stages.length ? 0 : stages.length)}>
              {revealed >= stages.length ? 'Hide' : `Why is this ${valueToDisplayString(trace.value)}?`}
            </button>
          </div>
          <ol className="stages">
            {shown.map((s, i) => (
              <li key={i} className={i === shown.length - 1 ? 'current' : ''}>
                <strong>{s.label}</strong>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {selectedComp && (
        <section className="card">
          <div className="card-title">{selectedComp.type}</div>
          <PinTable comp={selectedComp} sim={sim} />
          <Properties comp={selectedComp} setAttrs={setAttrs} />
          {sim.explanations[selectedComp.id] && <p className="muted small">{sim.explanations[selectedComp.id]}</p>}
        </section>
      )}
    </div>
  );
}

function PinTable({ comp, sim }: { comp: ComponentInstance; sim: SimulationResult }) {
  const pv = sim.pinValues[comp.id] ?? {};
  return (
    <table className="pins">
      <tbody>
        {getComponentPins(comp).map((p) => (
          <tr key={p.id}>
            <td>{p.label}</td>
            <td className="muted">{p.dir}</td>
            <td>
              <span className="mini-chip" style={{ background: valueColor(pv[p.id]) }}>
                {pv[p.id] ? valueToDisplayString(pv[p.id]) : '–'}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Properties({ comp, setAttrs }: { comp: ComponentInstance; setAttrs(p: Partial<ComponentAttrs>): void }) {
  const t = comp.type;
  const hasWidth = !NO_WIDTH.has(t);
  return (
    <div className="props">
      <label>
        <span className="label">Label</span>
        <input className="input" value={comp.attrs.label ?? ''} maxLength={12} onChange={(e) => setAttrs({ label: e.target.value })} />
      </label>
      {hasWidth && (
        <label>
          <span className="label">Bits</span>
          <select className="select" value={comp.attrs.width ?? 1} onChange={(e) => setAttrs({ width: Number(e.target.value) })}>
            {[1, 2, 3, 4, 8, 16, 32].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
      )}
      {GATE_TYPES.has(t) && (
        <label>
          <span className="label">Inputs</span>
          <select className="select" value={comp.attrs.inputs ?? 2} onChange={(e) => setAttrs({ inputs: Number(e.target.value) })}>
            {[2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
      )}
      {['Multiplexer', 'Demultiplexer', 'Decoder', 'Priority Encoder'].includes(t) && (
        <label>
          <span className="label">Select bits</span>
          <select className="select" value={comp.attrs.selectBits ?? 1} onChange={(e) => setAttrs({ selectBits: Number(e.target.value) })}>
            {[1, 2, 3, 4].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
      )}
      {t === 'Constant' && (
        <label>
          <span className="label">Value (binary)</span>
          <input className="input" value={comp.attrs.value ?? '1'} onChange={(e) => setAttrs({ value: e.target.value.replace(/[^01]/g, '') || '0' })} />
        </label>
      )}
      <label>
        <span className="label">Facing</span>
        <select className="select" value={comp.attrs.facing ?? 'east'} onChange={(e) => setAttrs({ facing: e.target.value as Facing })}>
          {['east', 'south', 'west', 'north'].map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
