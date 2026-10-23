/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * Combinational analysis: expression or truth table in, Gray-code K-map with loops, minimal SOP/POS and a circuit out.
 */
import { useMemo, useState, type KeyboardEvent } from 'react';
import { analyzeTruthTable, synthesizeCircuitFromTruthTable, truthTableFromExpr, type Circuit, type KMapAnalysis, type TruthTable, type TruthValue } from '@logisim/core';

interface Props {
  onBuild(c: Circuit): void;
}

const NAMES = ['A', 'B', 'C', 'D'];
const NEXT: Record<TruthValue, TruthValue> = { '0': '1', '1': 'X', X: '0' };

export function AnalysisPanel({ onBuild }: Props) {
  const [n, setN] = useState(3);
  const [expr, setExpr] = useState('A·B + B·C + A·C');
  const [rows, setRows] = useState<TruthValue[]>(() => [...truthTableFromExpr('A·B + B·C + A·C', NAMES.slice(0, 3)).rows]);
  const [error, setError] = useState<string | null>(null);

  const vars = NAMES.slice(0, n);
  const table: TruthTable = useMemo(() => ({ vars, outName: 'Y', rows }), [vars.join(), rows]); // eslint-disable-line react-hooks/exhaustive-deps
  const analysis: KMapAnalysis | null = useMemo(() => {
    try {
      return analyzeTruthTable(table);
    } catch {
      return null;
    }
  }, [table]);

  const applyExpr = () => {
    try {
      setRows([...truthTableFromExpr(expr, vars).rows]);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that expression');
    }
  };

  const changeVars = (next: number) => {
    setN(next);
    setRows(new Array(1 << next).fill('0'));
    setError(null);
  };

  const cycle = (minterm: number) => setRows((r) => r.map((x, i) => (i === minterm ? NEXT[x] : x)));
  const keyCycle = (minterm: number) => (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    cycle(minterm);
  };
  const cellLabel = (v: TruthValue, minterm: number) => `Row ${minterm}: ${v === 'X' ? "don't care" : v}. Press Enter to change.`;

  const cell = (v: TruthValue, minterm: number) => {
    const loops = analysis?.loops.filter((l) => l.implicant.minterms.includes(minterm)) ?? [];
    return (
      <td
        key={minterm}
        className={`kcell v${v}`}
        style={{ boxShadow: loops.map((l, i) => `inset 0 0 0 ${2 + i * 3}px var(--loop-${l.colorIndex % 6})`).join(',') || undefined }}
        role="button"
        tabIndex={0}
        aria-label={cellLabel(v, minterm)}
        onClick={() => cycle(minterm)}
        onKeyDown={keyCycle(minterm)}
      >
        {v}
      </td>
    );
  };

  return (
    <div className="analysis">
      <div className="field">
        <span className="label">Variables</span>
        <div className="seg" role="group" aria-label="Number of variables">
          {[2, 3, 4].map((k) => (
            <button key={k} className={k === n ? 'on' : ''} onClick={() => changeVars(k)}>
              {k}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label className="label" htmlFor="expr">
          Boolean expression
        </label>
        <div className="row">
          <input id="expr" className="input grow mono" value={expr} onChange={(e) => setExpr(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyExpr()} placeholder="A·B + ~C" spellCheck={false} />
          <button className="btn small" onClick={applyExpr}>
            Apply
          </button>
        </div>
        {error && <p className="error small">{error}</p>}
        <p className="muted small">Use ~ or ' for NOT, · or * for AND, + for OR, ^ for XOR.</p>
      </div>

      <div className="label">Truth table (click a row to cycle 0 / 1 / don't care)</div>
      <table className="ttable">
        <thead>
          <tr>
            {vars.map((v) => (
              <th key={v}>{v}</th>
            ))}
            <th>Y</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((v, i) => (
            <tr key={i}>
              {vars.map((_, b) => (
                <td key={b} className="muted">{(i >> (n - 1 - b)) & 1}</td>
              ))}
              <td className={`kcell v${v}`} role="button" tabIndex={0} aria-label={cellLabel(v, i)} onClick={() => cycle(i)} onKeyDown={keyCycle(i)}>
                {v}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {analysis && (
        <>
          <div className="label">Karnaugh map</div>
          <table className="kmap">
            <thead>
              <tr>
                <th className="corner">{analysis.rowVars.join('')}\{analysis.colVars.join('')}</th>
                {analysis.colGray.map((g) => (
                  <th key={g}>{g}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {analysis.grid.map((row, r) => (
                <tr key={r}>
                  <th>{analysis.rowGray[r]}</th>
                  {row.map((c) => cell(c.value, c.minterm))}
                </tr>
              ))}
            </tbody>
          </table>
          <dl className="result">
            <dt>Minimal SOP</dt>
            <dd className="mono">Y = {analysis.minimalSop}</dd>
            <dt>Minimal POS</dt>
            <dd className="mono">Y = {analysis.minimalPos}</dd>
          </dl>
          <ul className="implicants">
            {analysis.loops.map((l) => (
              <li key={l.implicant.pattern}>
                <span className="swatch" style={{ background: `var(--loop-${l.colorIndex % 6})` }} />
                <span className="mono">{l.implicant.term}</span>
                {l.implicant.essential && <span className="badge badge-x">essential</span>}
              </li>
            ))}
          </ul>
          <button className="btn" onClick={() => onBuild(synthesizeCircuitFromTruthTable(table, 'Synthesized'))}>
            Build this circuit
          </button>
        </>
      )}
    </div>
  );
}
