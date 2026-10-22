/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * Application shell: top bar, parts palette, canvas, and the Inspect / Analyze / Challenge drawer.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getDailyChallenge,
  hasErrorBit,
  LOGIC_CHALLENGES,
  parseCircXml,
  PRESET_CIRCUITS,
  serializeCircXml,
  type Circuit,
  type Facing,
  type LogicChallenge,
} from '@logisim/core';
import { Canvas, NO_SELECTION, type CanvasHandle, type InspectTarget, type Selection } from './canvas/Canvas';
import { SELECT, type PaletteItem, type Tool } from './canvas/tools';
import { decodeCircuitHash, encodeCircuitUrl } from './lib/share';
import { EMPTY_CIRCUIT, useCircuitStore } from './state/useCircuitStore';
import { useSettings } from './state/useSettings';
import { AnalysisPanel } from './ui/AnalysisPanel';
import { ChallengePanel } from './ui/ChallengePanel';
import { Icon, type IconName } from './ui/icons';
import { Inspector } from './ui/Inspector';
import { Palette } from './ui/Palette';
import { SettingsSheet } from './ui/SettingsSheet';
import { Sheet } from './ui/Sheet';

type Tab = 'inspect' | 'analyze' | 'challenge';
type Modal = 'settings' | 'presets' | null;

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'inspect', label: 'Inspect', icon: 'bulb' },
  { id: 'analyze', label: 'Analyze', icon: 'chart' },
  { id: 'challenge', label: 'Challenges', icon: 'trophy' },
];
const FACINGS: Facing[] = ['east', 'south', 'west', 'north'];
const NO_HIGHLIGHT = { components: [] as string[], nets: [] as string[] };

const isTyping = (t: EventTarget | null) => t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement;

export function App() {
  const store = useCircuitStore();
  const { circuit, sim, commit, replace, load, checkpoint } = store;
  const { settings, update: updateSettings } = useSettings();
  const canvas = useRef<CanvasHandle>(null);

  const [tool, setTool] = useState<Tool>(SELECT);
  const [selection, setSelection] = useState<Selection>(NO_SELECTION);
  const [target, setTarget] = useState<InspectTarget | null>(null);
  const [tab, setTab] = useState<Tab>('inspect');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [partsOpen, setPartsOpen] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [challenge, setChallenge] = useState<LogicChallenge | null>(null);
  const [inspectHl, setInspectHl] = useState(NO_HIGHLIGHT);
  const [challengeHl, setChallengeHl] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [loadVersion, setLoadVersion] = useState(0);
  const importInput = useRef<HTMLInputElement>(null);
  const spaceReturn = useRef<Tool | null>(null);

  const say = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 3500);
  }, []);

  const loadCircuit = useCallback(
    (c: Circuit) => {
      load(c);
      setSelection(NO_SELECTION);
      setTarget(null);
      setLoadVersion((v) => v + 1);
    },
    [load],
  );

  const startChallenge = useCallback(
    (c: LogicChallenge) => {
      setChallenge(c);
      setTab('challenge');
      setDrawerOpen(true);
      loadCircuit(c.starterCircuit);
    },
    [loadCircuit],
  );

  // Open whatever the URL asks for: a shared circuit, an example, or a challenge.
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const shared = decodeCircuitHash(location.hash);
    const slug = q.get('p') === 'sr-latch' ? 'jk-flip-flop' : q.get('p'); // renamed; old links keep working
    const preset = PRESET_CIRCUITS.find((p) => p.slug === slug);
    const daily = q.get('daily');
    const picked = LOGIC_CHALLENGES.find((c) => c.id === q.get('challenge'));
    if (shared) loadCircuit(shared);
    else if (preset) loadCircuit(preset.circuit);
    else if (picked) startChallenge(picked);
    else if (daily) startChallenge(getDailyChallenge(daily === '1' ? new Date().toISOString().slice(0, 10) : daily));
    else setLoadVersion(1);
  }, [loadCircuit, startChallenge]);

  useEffect(() => {
    const id = requestAnimationFrame(() => canvas.current?.fit());
    return () => cancelAnimationFrame(id);
  }, [loadVersion]);

  // On phones the drawer shares the screen with the canvas, so re-fit when it opens or closes.
  useEffect(() => {
    if (!window.matchMedia('(max-width: 860px)').matches) return;
    const id = requestAnimationFrame(() => canvas.current?.fit());
    return () => cancelAnimationFrame(id);
  }, [drawerOpen]);

  const pickPart = (item: PaletteItem) => {
    setTool({ kind: 'place', item });
    setSelection(NO_SELECTION);
    setPartsOpen(false);
  };

  const deleteSelection = useCallback(() => {
    if (!selection.comps.size && !selection.wires.size) return;
    commit({
      ...circuit,
      components: circuit.components.filter((c) => !selection.comps.has(c.id)),
      wires: circuit.wires.filter((w) => !selection.wires.has(w.id)),
    });
    setSelection(NO_SELECTION);
    setTarget(null);
  }, [circuit, commit, selection]);

  const rotateSelection = useCallback(() => {
    if (!selection.comps.size) return;
    commit({
      ...circuit,
      components: circuit.components.map((c) =>
        selection.comps.has(c.id) ? { ...c, attrs: { ...c.attrs, facing: FACINGS[(FACINGS.indexOf(c.attrs.facing ?? 'east') + 1) % 4] } } : c,
      ),
    });
  }, [circuit, commit, selection]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (mod && key === 'z') {
        e.preventDefault();
        e.shiftKey ? store.redo() : store.undo();
      } else if (mod && key === 'y') {
        e.preventDefault();
        store.redo();
      } else if (mod) {
        return;
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelection();
      } else if (e.key === 'Escape') {
        setTool(SELECT);
        setSelection(NO_SELECTION);
      } else if (key === 'r') rotateSelection();
      else if (key === 'v') setTool(SELECT);
      else if (key === 'p') setTool({ kind: 'poke' });
      else if (key === 'w') setTool({ kind: 'wire' });
      else if (e.key === ' ' && !e.repeat) {
        e.preventDefault();
        spaceReturn.current = tool;
        setTool({ kind: 'poke' });
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === ' ' && spaceReturn.current) {
        setTool(spaceReturn.current);
        spaceReturn.current = null;
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [store, deleteSelection, rotateSelection, tool]);

  const exportCirc = () => {
    const url = URL.createObjectURL(new Blob([serializeCircXml(circuit)], { type: 'application/xml' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${circuit.name.replace(/[^\w-]+/g, '_') || 'circuit'}.circ`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importCirc = async (file: File) => {
    try {
      const c = parseCircXml(await file.text());
      setChallenge(null);
      loadCircuit(c);
      say(`Opened ${file.name}`);
    } catch {
      say('That file could not be read as a Logisim .circ file.');
    }
  };

  const share = async () => {
    const url = encodeCircuitUrl(circuit);
    try {
      await navigator.clipboard.writeText(url);
      say('Link copied. Anyone with it can open this circuit.');
    } catch {
      prompt('Copy this link:', url);
    }
  };

  const selectedComp = selection.comps.size === 1 ? (circuit.components.find((c) => selection.comps.has(c.id)) ?? null) : null;
  const conflict = Object.values(sim.netValues).some(hasErrorBit);
  const status = sim.oscillating ? { cls: 'x', text: 'Oscillating' } : conflict ? { cls: 'e', text: 'Error signal (E)' } : { cls: '0', text: 'Stable' };
  const highlight =
    tab === 'challenge'
      ? { components: new Set(challengeHl), nets: new Set<string>() }
      : { components: new Set(inspectHl.components), nets: new Set(inspectHl.nets) };

  const toolBtn = (kind: 'select' | 'poke' | 'wire', icon: IconName, label: string) => (
    <button className={`tool${tool.kind === kind ? ' on' : ''}`} onClick={() => setTool(kind === 'select' ? SELECT : { kind })} aria-pressed={tool.kind === kind} title={label}>
      <Icon name={icon} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="../" title="Logisim Revisited home">
          <img src="icon.svg" alt="" width="28" height="28" />
          <span className="wordmark">Logisim<small>Revisited</small></span>
        </a>
        <input className="circuit-name" value={circuit.name} onChange={(e) => replace({ ...circuit, name: e.target.value })} aria-label="Circuit name" maxLength={40} />
        <span className="spacer" />
        <button className="icon-btn" onClick={store.undo} disabled={!store.canUndo} title="Undo (Ctrl+Z)" aria-label="Undo"><Icon name="undo" /></button>
        <button className="icon-btn" onClick={store.redo} disabled={!store.canRedo} title="Redo (Ctrl+Shift+Z)" aria-label="Redo"><Icon name="redo" /></button>
        <span className="divider" />
        <button className="icon-btn" onClick={() => setModal('presets')} title="Examples" aria-label="Examples"><Icon name="open" /></button>
        <button className="icon-btn" onClick={() => importInput.current?.click()} title="Import .circ" aria-label="Import .circ"><Icon name="upload" /></button>
        <button className="icon-btn" onClick={exportCirc} title="Export .circ" aria-label="Export .circ"><Icon name="download" /></button>
        <button className="icon-btn" onClick={share} title="Copy share link" aria-label="Copy share link"><Icon name="share" /></button>
        <input ref={importInput} type="file" accept=".circ,.xml" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) importCirc(f); e.target.value = ''; }} />
        <button className="icon-btn" onClick={() => setModal('settings')} title="Settings" aria-label="Settings"><Icon name="gear" /></button>
      </header>

      <div className="body">
        <aside className={`parts${partsOpen ? ' open' : ''}`} aria-label="Parts">
          <div className="parts-head">
            <h2>Parts</h2>
            <button className="icon-btn only-mobile" onClick={() => setPartsOpen(false)} aria-label="Close parts"><Icon name="close" /></button>
          </div>
          <Palette tool={tool} onPick={pickPart} />
        </aside>

        <main className="stage">
          <Canvas
            ref={canvas}
            circuit={circuit}
            sim={sim}
            tool={tool}
            selection={selection}
            highlight={highlight}
            showGrid={settings.showGrid}
            showValues={settings.showValues}
            commit={commit}
            replace={replace}
            checkpoint={checkpoint}
            onSelect={setSelection}
            onInspect={(t) => {
              setTarget(t);
              if (t) {
                // Mid-challenge the Check button must stay in reach; the Inspect tab still updates in the background.
                setTab((cur) => (cur === 'challenge' && challenge ? cur : 'inspect'));
                setDrawerOpen(true);
              }
            }}
          />
          {circuit.components.length === 0 && circuit.wires.length === 0 && (
            <div className="empty-stage">
              <h2>Start a circuit</h2>
              <p>Pick a part, click the canvas to place it, then use the wire tool to connect pins.</p>
              <div className="row">
                <button className="btn" onClick={() => setPartsOpen(true)}>Choose parts</button>
                <button className="btn alt" onClick={() => setModal('presets')}>Open an example</button>
              </div>
            </div>
          )}
          <div className={`chip chip-${status.cls}`} role="status">{status.text}</div>
          <div className="toolbar" role="toolbar" aria-label="Tools">
            <button className="tool only-mobile" onClick={() => setPartsOpen(true)} title="Parts"><Icon name="parts" /><span>Parts</span></button>
            {toolBtn('select', 'select', 'Select')}
            {toolBtn('poke', 'poke', 'Poke')}
            {toolBtn('wire', 'wire', 'Wire')}
            <span className="divider" />
            <button className="tool" onClick={rotateSelection} disabled={!selection.comps.size} title="Rotate (R)"><Icon name="rotate" /><span>Rotate</span></button>
            <button className="tool" onClick={deleteSelection} disabled={!selection.comps.size && !selection.wires.size} title="Delete (Del)"><Icon name="trash" /><span>Delete</span></button>
            <button className="tool" onClick={store.tick} title="Toggle every clock"><Icon name="tick" /><span>Tick</span></button>
          </div>
          <div className="zoom" role="group" aria-label="Zoom">
            <button className="icon-btn" onClick={() => canvas.current?.zoomBy(1.25)} aria-label="Zoom in"><Icon name="plus" /></button>
            <button className="icon-btn" onClick={() => canvas.current?.zoomBy(0.8)} aria-label="Zoom out"><Icon name="minus" /></button>
            <button className="icon-btn" onClick={() => canvas.current?.fit()} aria-label="Fit to window"><Icon name="fit" /></button>
          </div>
          {tool.kind === 'place' && <div className="hint">Click to place {tool.item.name}. Esc to stop.</div>}
          {tool.kind === 'wire' && <div className="hint">Drag between points, or click to chain. Double-click or Esc to finish.</div>}
        </main>

        <aside className={`drawer${drawerOpen ? ' open' : ''}`} aria-label="Panels">
          <nav
            className="tabs"
            role="tablist"
            aria-label="Panels"
            onKeyDown={(e) => {
              const idx = TABS.findIndex((t) => t.id === tab);
              if (idx === -1) return;
              if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                const next = TABS[(idx + 1) % TABS.length].id;
                setTab(next);
                setDrawerOpen(true);
              } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                const prev = TABS[(idx - 1 + TABS.length) % TABS.length].id;
                setTab(prev);
                setDrawerOpen(true);
              }
            }}
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                tabIndex={tab === t.id ? 0 : -1}
                aria-selected={tab === t.id}
                className={tab === t.id ? 'on' : ''}
                onClick={() => {
                  setTab(t.id);
                  setDrawerOpen(tab !== t.id || !drawerOpen);
                }}
              >
                <Icon name={t.icon} size={18} />
                <span>{t.label}</span>
              </button>
            ))}
          </nav>
          <div className="drawer-body scrollbar-thin" role="tabpanel">
            {tab === 'inspect' && (
              <Inspector circuit={circuit} sim={sim} target={target} selectedComp={selectedComp} commit={commit} onHighlight={setInspectHl} />
            )}
            {tab === 'analyze' && (
              <AnalysisPanel
                onBuild={(c) => {
                  setChallenge(null);
                  loadCircuit(c);
                  setTab('inspect');
                  say('Built a two-level AND-OR circuit. Poke the inputs to try it.');
                }}
              />
            )}
            {tab === 'challenge' && (
              <ChallengePanel challenge={challenge} circuit={circuit} onStart={startChallenge} onExit={() => { setChallenge(null); loadCircuit(EMPTY_CIRCUIT); }} onHighlight={setChallengeHl} />
            )}
          </div>
        </aside>
      </div>

      {modal === 'settings' && <SettingsSheet settings={settings} onChange={updateSettings} onClose={() => setModal(null)} />}
      {modal === 'presets' && (
        <Sheet title="Examples" onClose={() => setModal(null)}>
          <div className="preset-list">
            {PRESET_CIRCUITS.map((p) => (
              <button
                key={p.slug}
                className="list-item"
                onClick={() => {
                  setChallenge(null);
                  loadCircuit(p.circuit);
                  setModal(null);
                }}
              >
                <span>
                  <strong>{p.name}</strong>
                  <span className="muted small"> · {p.category} · {p.level}</span>
                  <span className="muted small block">{p.summary}</span>
                </span>
                <Icon name="chevron" size={16} />
              </button>
            ))}
          </div>
        </Sheet>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

export default App;
