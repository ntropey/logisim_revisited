/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * Circuit state with undo/redo. The core simulator is synchronous and fast for schematic-sized circuits,
 * so every edit re-simulates immediately on the main thread and the result lives next to the circuit.
 */
import { useCallback, useEffect, useReducer } from 'react';
import {
  createEmptyMemoryState,
  simulateCircuit,
  stepClockTick,
  type Circuit,
  type SequentialMemoryState,
  type SimulationResult,
} from '@logisim/core';
import { CIRCUIT_KEY, loadJson, saveJson } from '../lib/storage';
import { isCircuit } from '../lib/share';

export const EMPTY_CIRCUIT: Circuit = { name: 'Untitled', components: [], wires: [] };

interface Snapshot {
  circuit: Circuit;
  memState: SequentialMemoryState;
  sim: SimulationResult;
}

interface Store extends Snapshot {
  past: Circuit[];
  future: Circuit[];
}

type Action =
  | { type: 'commit'; circuit: Circuit } // an undoable edit
  | { type: 'replace'; circuit: Circuit } // part of a gesture already checkpointed (drag)
  | { type: 'checkpoint' }
  | { type: 'load'; circuit: Circuit } // new document: clears history and sequential state
  | { type: 'tick' }
  | { type: 'undo' }
  | { type: 'redo' };

const MAX_HISTORY = 100;

function settle(circuit: Circuit, mem: SequentialMemoryState): Snapshot {
  const sim = simulateCircuit(circuit, mem);
  return { circuit, memState: sim.memState, sim };
}

function init(): Store {
  const saved = loadJson<Circuit>(CIRCUIT_KEY);
  const circuit = isCircuit(saved) ? saved : EMPTY_CIRCUIT;
  return { ...settle(circuit, createEmptyMemoryState()), past: [], future: [] };
}

function reducer(s: Store, a: Action): Store {
  switch (a.type) {
    case 'commit':
      return { ...settle(a.circuit, s.memState), past: [...s.past, s.circuit].slice(-MAX_HISTORY), future: [] };
    case 'replace':
      return { ...s, ...settle(a.circuit, s.memState) };
    case 'checkpoint':
      return { ...s, past: [...s.past, s.circuit].slice(-MAX_HISTORY), future: [] };
    case 'load':
      return { ...settle(a.circuit, createEmptyMemoryState()), past: [], future: [] };
    case 'tick': {
      const { circuit, result } = stepClockTick(s.circuit, s.memState);
      return { ...s, circuit, memState: result.memState, sim: result, past: [...s.past, s.circuit].slice(-MAX_HISTORY), future: [] };
    }
    case 'undo': {
      const prev = s.past[s.past.length - 1];
      if (!prev) return s;
      return { ...settle(prev, s.memState), past: s.past.slice(0, -1), future: [s.circuit, ...s.future] };
    }
    case 'redo': {
      const next = s.future[0];
      if (!next) return s;
      return { ...settle(next, s.memState), past: [...s.past, s.circuit], future: s.future.slice(1) };
    }
  }
}

export function useCircuitStore() {
  const [store, dispatch] = useReducer(reducer, undefined, init);

  useEffect(() => saveJson(CIRCUIT_KEY, store.circuit), [store.circuit]);

  const commit = useCallback((circuit: Circuit) => dispatch({ type: 'commit', circuit }), []);
  const replace = useCallback((circuit: Circuit) => dispatch({ type: 'replace', circuit }), []);
  const load = useCallback((circuit: Circuit) => dispatch({ type: 'load', circuit }), []);

  return {
    circuit: store.circuit,
    sim: store.sim,
    canUndo: store.past.length > 0,
    canRedo: store.future.length > 0,
    commit,
    replace,
    load,
    checkpoint: useCallback(() => dispatch({ type: 'checkpoint' }), []),
    tick: useCallback(() => dispatch({ type: 'tick' }), []),
    undo: useCallback(() => dispatch({ type: 'undo' }), []),
    redo: useCallback(() => dispatch({ type: 'redo' }), []),
  };
}
