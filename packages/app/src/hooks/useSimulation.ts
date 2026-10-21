/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * React hook for simulation operations via Web Worker.
 */

import { useCallback, useRef, useEffect } from 'react';
import type { Circuit, SimulationResult, TraceStage, TruthTable, KMapAnalysis, VerificationResult, SequentialMemoryState } from '@logisim/core';
import { getSolverClient } from './solverClient';

export function useSimulation() {
  const clientRef = useRef(getSolverClient());

  useEffect(() => {
    return () => {
      // Don't terminate - keep singleton alive
    };
  }, []);

  const simulate = useCallback(async (circuit: Circuit, memState: SequentialMemoryState): Promise<SimulationResult> => {
    return clientRef.current.simulate(circuit, memState);
  }, []);

  const poke = useCallback(async (circuit: Circuit, compId: string, bitIndex = 0): Promise<Circuit> => {
    return clientRef.current.poke(circuit, compId, bitIndex);
  }, []);

  const stepClock = useCallback(async (circuit: Circuit, memState: SequentialMemoryState): Promise<{ circuit: Circuit; result: SimulationResult }> => {
    return clientRef.current.stepClock(circuit, memState);
  }, []);

  const traceSignal = useCallback(async (circuit: Circuit, simResult: SimulationResult, target: { compId?: string; netId?: string }): Promise<TraceStage[]> => {
    return clientRef.current.traceSignal(circuit, simResult, target);
  }, []);

  const verify = useCallback(async (
    circuit: Circuit,
    inputNames: string[],
    outputNames: string[],
    expectedFn: (inputs: Record<string, number>) => Record<string, number>
  ): Promise<VerificationResult> => {
    return clientRef.current.verify(circuit, inputNames, outputNames, expectedFn);
  }, []);

  const analyze = useCallback(async (truthTable: TruthTable): Promise<KMapAnalysis> => {
    return clientRef.current.analyze(truthTable);
  }, []);

  const synthesize = useCallback(async (truthTable: TruthTable, circuitName?: string): Promise<Circuit> => {
    return clientRef.current.synthesize(truthTable, circuitName);
  }, []);

  return { simulate, poke, stepClock, traceSignal, verify, analyze, synthesize };
}