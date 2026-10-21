/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * Main App component - PWA shell with canvas, tool palette, and side panels.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Canvas } from './canvas/Canvas';
import { ToolPalette } from './canvas/ToolPalette';
import { BottomSheet } from './ui/BottomSheet';
import { SettingsSheet } from './ui/SettingsSheet';
import { CoachPanel } from './ui/CoachPanel';
import { TracePanel } from './ui/TracePanel';
import { DailyChallenge } from './challenges/DailyChallenge';
import { useCircuitStore } from './hooks/useCircuitStore';
import { useSimulation } from './hooks/useSimulation';
import { useSettings } from './hooks/useSettings';
import { Circuit, ComponentInstance, Wire, SimulationResult, TraceStage, ComponentType } from '@logisim/core';
import { PRESET_CIRCUITS, LOGIC_CHALLENGES, getDailyChallenge } from '@logisim/core';
import type { LogicChallenge } from '@logisim/core';

type Tool = 'select' | 'poke' | 'wire' | ComponentType;

interface AppState {
  circuit: Circuit;
  simResult: SimulationResult | null;
  selectedIds: Set<string>;
  tool: Tool;
  wireStart: { compId: string; pinId: string; x: number; y: number } | null;
  hoverNetId: string | null;
  showSettings: boolean;
  showCoach: boolean;
  showTrace: boolean;
  showChallenge: boolean;
  currentChallenge: LogicChallenge | null;
  coachStages: TraceStage[];
  coachStageIndex: number;
  traceStages: TraceStage[];
  zoom: number;
  pan: { x: number; y: number };
}

const DEFAULT_CIRCUIT: Circuit = {
  name: 'Untitled',
  components: [],
  wires: [],
};

export function App() {
  const [state, setState] = useState<AppState>({
    circuit: DEFAULT_CIRCUIT,
    simResult: null,
    selectedIds: new Set(),
    tool: 'select',
    wireStart: null,
    hoverNetId: null,
    showSettings: false,
    showCoach: false,
    showTrace: false,
    showChallenge: false,
    currentChallenge: null,
    coachStages: [],
    coachStageIndex: 0,
    traceStages: [],
    zoom: 1,
    pan: { x: 0, y: 0 },
  });

  const { circuit, setCircuit, simResult, setSimResult, memState, setMemState } = useCircuitStore();
  const { simulate, poke, stepClock, traceSignal, verify, analyze, synthesize } = useSimulation();
  const { settings, setSettings } = useSettings();

  // Load from localStorage or URL on mount
  useEffect(() => {
    const saved = localStorage.getItem('logisim-circuit');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCircuit(parsed);
      } catch {
        // Ignore parse errors
      }
    }
    // Check for challenge in URL
    const params = new URLSearchParams(window.location.search);
    const challengeId = params.get('challenge');
    if (challengeId) {
      const challenge = LOGIC_CHALLENGES.find(c => c.id === challengeId);
      if (challenge) {
        setState(s => ({ ...s, currentChallenge: challenge, circuit: challenge.starterCircuit, showChallenge: true }));
        setCircuit(challenge.starterCircuit);
      }
    }
    // Check for daily challenge
    const daily = params.get('daily');
    if (daily) {
      const date = daily === '1' ? new Date().toISOString().split('T')[0] : daily;
      const challenge = getDailyChallenge(date);
      setState(s => ({ ...s, currentChallenge: challenge, circuit: challenge.starterCircuit, showChallenge: true }));
      setCircuit(challenge.starterCircuit);
    }
  }, [setCircuit]);

  // Auto-save circuit
  useEffect(() => {
    if (circuit.components.length > 0 || circuit.wires.length > 0) {
      localStorage.setItem('logisim-circuit', JSON.stringify(circuit));
    }
  }, [circuit]);

  // Run simulation when circuit changes
  useEffect(() => {
    const result = simulate(circuit, memState);
    setSimResult(result);
    setMemState(result.memState);
  }, [circuit, memState, simulate, setSimResult, setMemState]);

  const setTool = useCallback((tool: Tool) => {
    setState(s => ({ ...s, tool, wireStart: null, selectedIds: new Set() }));
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM()!;
    const transformed = pt.matrixTransform(ctm.inverse());
    const x = Math.round(transformed.x / 10) * 10;
    const y = Math.round(transformed.y / 10) * 10;

    setState(s => {
      const { tool, circuit, selectedIds, wireStart, simResult } = s;
      
      if (tool === 'wire') {
        // Find pin at this position
        const pinHit = findPinAt(circuit, simResult, x, y);
        if (pinHit) {
          if (wireStart) {
            // Complete wire
            if (wireStart.compId !== pinHit.compId || wireStart.pinId !== pinHit.pinId) {
              const newWire: Wire = {
                id: `w_${Date.now()}`,
                from: { x: wireStart.x, y: wireStart.y },
                to: { x: pinHit.x, y: pinHit.y },
              };
              return {
                ...s,
                circuit: { ...circuit, wires: [...circuit.wires, newWire] },
                wireStart: null,
              };
            }
          } else {
            // Start wire
            return { ...s, wireStart: { ...pinHit, x, y } };
          }
        }
        return { ...s, wireStart: null };
      }

      if (tool === 'poke') {
        // Find component at this position
        const compHit = findComponentAt(circuit, x, y);
        if (compHit && (compHit.type === 'Pin' && !compHit.attrs.output || compHit.type === 'Clock' || compHit.type === 'Button')) {
          const newCircuit = poke(circuit, compHit.id);
          return { ...s, circuit: newCircuit };
        }
        return s;
      }

      if (tool === 'select') {
        const compHit = findComponentAt(circuit, x, y);
        if (compHit) {
          const newSelected = new Set(selectedIds);
          if (e.shiftKey) {
            newSelected.has(compHit.id) ? newSelected.delete(compHit.id) : newSelected.add(compHit.id);
          } else {
            newSelected.clear();
            newSelected.add(compHit.id);
          }
          return { ...s, selectedIds: newSelected };
        } else if (!e.shiftKey) {
          return { ...s, selectedIds: new Set() };
        }
      }

      if (typeof tool === 'string' && tool !== 'select' && tool !== 'poke' && tool !== 'wire') {
        // Place component
        const catalog = PRESET_CIRCUITS.flatMap(p => p.circuit.components).find(c => c.type === tool);
        const defaultComp = PRESET_CIRCUITS.find(p => p.circuit.components.some(c => c.type === tool))?.circuit.components.find(c => c.type === tool);
        if (defaultComp) {
          const newComp: ComponentInstance = {
            ...defaultComp,
            id: `comp_${Date.now()}`,
            loc: { x, y },
          };
          return {
            ...s,
            circuit: { ...circuit, components: [...circuit.components, newComp] },
            selectedIds: new Set([newComp.id]),
            tool: 'select',
          };
        }
      }

      return s;
    });
  }, [poke]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    setState(s => {
      const { selectedIds, circuit, tool } = s;
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.size > 0) {
          return {
            ...s,
            circuit: {
              ...circuit,
              components: circuit.components.filter(c => !selectedIds.has(c.id)),
              wires: circuit.wires.filter(w => {
                // Remove wires connected to deleted components
                const connected = circuit.components.some(c => 
                  selectedIds.has(c.id) && (
                    (c.type === 'Pin' && !c.attrs.output && (w.from.x === c.loc.x && w.from.y === c.loc.y || w.to.x === c.loc.x && w.to.y === c.loc.y)) ||
                    (c.type !== 'Pin' && (w.from.x === c.loc.x && w.from.y === c.loc.y || w.to.x === c.loc.x && w.to.y === c.loc.y))
                  )
                );
                return !connected;
              }),
            },
            selectedIds: new Set(),
          };
        }
      }

      if (e.key === 'r' || e.key === 'R') {
        if (selectedIds.size === 1) {
          const comp = circuit.components.find(c => selectedIds.has(c.id));
          if (comp) {
            const facings: ('east'|'west'|'north'|'south')[] = ['east', 'south', 'west', 'north'];
            const idx = facings.indexOf(comp.attrs.facing ?? 'east');
            const nextFacing = facings[(idx + 1) % 4];
            return {
              ...s,
              circuit: {
                ...circuit,
                components: circuit.components.map(c => 
                  c.id === comp.id ? { ...c, attrs: { ...c.attrs, facing: nextFacing } } : c
                ),
              },
            };
          }
        }
      }

      if (e.key === ' ' && tool !== 'wire') {
        e.preventDefault();
        return { ...s, tool: 'poke' };
      }

      return s;
    });
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.key === ' ') {
      setState(s => ({ ...s, tool: 'select' }));
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const handleTraceRequest = useCallback((compId: string, netId: string | null) => {
    if (!simResult) return;
    const trace = traceSignal(state.circuit, simResult, { compId, netId });
    setState(s => ({ ...s, traceStages: trace.stages, showTrace: true }));
  }, [simResult, traceSignal]);

  const handleCoachRequest = useCallback((stages: TraceStage[]) => {
    setState(s => ({ ...s, coachStages: stages, coachStageIndex: 0, showCoach: true }));
  }, []);

  const handleVerifyChallenge = useCallback(async () => {
    if (!state.currentChallenge) return;
    const result = verify(state.circuit, state.currentChallenge.inputNames, state.currentChallenge.outputNames, state.currentChallenge.expectedFn);
    if (result.passed) {
      alert('Challenge completed! 🎉');
      // Share result
      const url = new URL(window.location.href);
      url.searchParams.set('solved', '1');
      navigator.clipboard.writeText(url.toString());
    } else {
      alert(`Failed at row ${result.firstFailure?.rowIndex}: expected ${JSON.stringify(result.firstFailure?.expected)}, got ${JSON.stringify(result.firstFailure?.actual)}`);
    }
  }, [state.circuit, state.currentChallenge, verify]);

  const handleNewCircuit = useCallback((presetSlug?: string) => {
    if (presetSlug) {
      const preset = PRESET_CIRCUITS.find(p => p.slug === presetSlug);
      if (preset) {
        setCircuit(preset.circuit);
        setState(s => ({ ...s, selectedIds: new Set() }));
      }
    } else {
      setCircuit({ name: 'Untitled', components: [], wires: [] });
      setState(s => ({ ...s, selectedIds: new Set() }));
    }
  }, [setCircuit]);

  const handleExportCirc = useCallback(() => {
    const { serializeCircXml } = require('@logisim/core');
    const xml = serializeCircXml(state.circuit);
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.circuit.name || 'circuit'}.circ`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state.circuit]);

  const handleImportCirc = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const { parseCircXml } = require('@logisim/core');
        const circuit = parseCircXml(e.target?.result as string);
        setCircuit(circuit);
      } catch (err) {
        alert('Failed to import .circ file: ' + err);
      }
    };
    reader.readAsText(file);
  }, [setCircuit]);

  const handleShareUrl = useCallback(() => {
    const { encodeCircuitToUrl } = require('./file/UrlEncoder');
    const url = encodeCircuitToUrl(state.circuit);
    navigator.clipboard.writeText(url);
    alert('Shareable URL copied to clipboard!');
  }, [state.circuit]);

  const panZoom = { x: state.pan.x, y: state.pan.y, k: state.zoom };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Top Bar */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '8px 16px',
        background: 'var(--card)',
        borderBottom: '1px solid var(--line)',
        flexWrap: 'wrap',
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ flexShrink: 0 }}>
            <rect width="32" height="32" rx="6" fill="var(--accent)"/>
            <path d="M8 16L14 22L24 10" stroke="var(--card)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ font: '500 1.25rem var(--font-display)', color: 'var(--fg)' }}>Logisim Revisited</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <ToolPalette tool={state.tool} onToolChange={setTool} />
          
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn small" onClick={() => handleNewCircuit()} title="New Circuit (Ctrl+N)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
            <button className="btn small" onClick={handleExportCirc} title="Export .circ">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 12V4C4 3.44772 4.44772 3 5 3H11C11.5523 3 12 3.44772 12 4V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 8V4M6 6L8 4L10 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button className="btn small" onClick={() => document.getElementById('import-file')?.click()} title="Import .circ">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 4V12C12 12.5523 11.5523 13 11 13H5C4.44772 13 4 12.5523 4 12V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 12V8M6 10L8 8L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <input id="import-file" type="file" accept=".circ,.xml" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleImportCirc(e.target.files[0])} />
            </button>
            <button className="btn small" onClick={handleShareUrl} title="Share Circuit">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 8C4 5.79086 5.79086 4 8 4C10.2091 4 12 5.79086 12 8" stroke="currentColor" strokeWidth="1.5"/><path d="M12 8L16 12M12 8L16 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
            <button className="btn small" onClick={() => stepClock(state.circuit, memState).then(r => { setCircuit(r.circuit); setSimResult(r.result); setMemState(r.result.memState); })} title="Clock Tick (Space)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M8 4V8L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
            {state.currentChallenge && (
              <button className="btn small" onClick={handleVerifyChallenge} title="Verify Solution">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 8L7 11L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            )}
            <button className="btn small alt" onClick={() => setState(s => ({ ...s, showSettings: true }))} title="Settings">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M8 4V6M8 10V12M4 8H6M10 8H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
            {Math.round(state.zoom * 100)}%
          </span>
          {simResult && (
            <>
              <span className={`badge badge-${hasErrorBit(simResult) ? 'e' : simResult.oscillating ? 'x' : '0'}`}>
                {simResult.oscillating ? 'OSC' : hasErrorBit(simResult) ? 'ERROR' : 'OK'}
              </span>
              <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                {simResult.iterations} iter
              </span>
            </>
          )}
        </div>
      </header>

      {/* Main Canvas Area */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <Canvas
          circuit={state.circuit}
          simResult={simResult}
          selectedIds={state.selectedIds}
          tool={state.tool}
          wireStart={state.wireStart}
          hoverNetId={state.hoverNetId}
          panZoom={panZoom}
          onCanvasClick={handleCanvasClick}
          onPanZoomChange={(pan, zoom) => setState(s => ({ ...s, pan, zoom }))}
          onHoverNetChange={netId => setState(s => ({ ...s, hoverNetId: netId }))}
          onTraceRequest={handleTraceRequest}
          onCoachRequest={handleCoachRequest}
        />
      </main>

      {/* Bottom status bar */}
      <footer style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 16px',
        background: 'var(--card)',
        borderTop: '1px solid var(--line)',
        fontSize: 12,
        color: 'var(--muted)',
        fontFamily: 'var(--font-mono)',
      }}>
        <span>{state.circuit.components.length} components, {state.circuit.wires.length} wires</span>
        <span>{state.selectedIds.size} selected</span>
        <span>Tool: {state.tool}</span>
      </footer>

      {/* Sheets & Panels */}
      {state.showSettings && (
        <SettingsSheet
          onClose={() => setState(s => ({ ...s, showSettings: false }))}
          settings={settings}
          onSettingsChange={setSettings}
        />
      )}

      {state.showCoach && state.coachStages.length > 0 && (
        <CoachPanel
          stages={state.coachStages}
          currentIndex={state.coachStageIndex}
          onStageChange={idx => setState(s => ({ ...s, coachStageIndex: idx }))}
          onClose={() => setState(s => ({ ...s, showCoach: false }))}
          onNext={() => setState(s => ({ ...s, coachStageIndex: Math.min(s.coachStageIndex + 1, s.coachStages.length - 1) }))}
          onPrev={() => setState(s => ({ ...s, coachStageIndex: Math.max(s.coachStageIndex - 1, 0) }))}
        />
      )}

      {state.showTrace && state.traceStages.length > 0 && (
        <TracePanel
          stages={state.traceStages}
          onClose={() => setState(s => ({ ...s, showTrace: false }))}
        />
      )}

      {state.showChallenge && state.currentChallenge && (
        <DailyChallenge
          challenge={state.currentChallenge}
          onClose={() => setState(s => ({ ...s, showChallenge: false, currentChallenge: null }))}
          onVerify={handleVerifyChallenge}
        />
      )}
    </div>
  );
}

// Helper functions
function findPinAt(circuit: Circuit, simResult: SimulationResult | null, x: number, y: number) {
  for (const comp of circuit.components) {
    const pins = require('@logisim/core').getComponentPins(comp);
    for (const pin of pins) {
      if (pin.x === x && pin.y === y) {
        return { compId: comp.id, pinId: pin.id, x: pin.x, y: pin.y, dir: pin.dir, width: pin.width };
      }
    }
  }
  return null;
}

function findComponentAt(circuit: Circuit, x: number, y: number) {
  // Check if click is near component center (within 30px)
  for (const comp of circuit.components) {
    const dx = comp.loc.x - x;
    const dy = comp.loc.y - y;
    if (dx * dx + dy * dy <= 900) { // 30px radius
      return comp;
    }
  }
  return null;
}

function hasErrorBit(sim: SimulationResult): boolean {
  return Object.values(sim.netValues).some(v => 
    require('@logisim/core').hasErrorBit(v)
  );
}