/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * Simulation Web Worker - runs discrete-event simulation off the main thread.
 */

import {
  simulateCircuit,
  pokeComponent,
  stepClockTick,
  traceSignal,
  verifyCircuitTruthTable,
  analyzeTruthTable,
  synthesizeCircuitFromTruthTable,
  PRESET_CIRCUITS,
  LOGIC_CHALLENGES,
  getDailyChallenge,
  type Circuit,
  type SimulationResult,
  type TraceStage,
  type TruthTable,
  type KMapAnalysis,
  type VerificationResult,
  type SequentialMemoryState,
} from '@logisim/core';
import type { WorkerRequest, WorkerResponse } from './protocol';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const evalFn = new Function('return ' + '(' + 'function' + ')')();

// Convert expectedFn string back to function
function deserializeExpectedFn(fnStr: string): (inputs: Record<string, number>) => Record<string, number> {
  try {
    // eslint-disable-next-line no-new-func
    return new Function('inputs', `return (${fnStr})(inputs);`);
  } catch {
    return () => ({});
  }
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const req = e.data;
  let response: WorkerResponse;

  try {
    switch (req.type) {
      case 'SIMULATE': {
        const result = simulateCircuit(req.circuit, req.memState);
        response = { type: 'SIMULATE_RESULT', result };
        break;
      }
      case 'POKE': {
        const circuit = pokeComponent(req.circuit, req.compId, req.bitIndex ?? 0);
        response = { type: 'POKE_RESULT', circuit };
        break;
      }
      case 'STEP_CLOCK': {
        const { circuit, result } = stepClockTick(req.circuit, req.memState);
        response = { type: 'STEP_CLOCK_RESULT', circuit, result };
        break;
      }
      case 'TRACE_SIGNAL': {
        const trace = traceSignal(req.circuit, req.simResult, req.target);
        response = { type: 'TRACE_RESULT', stages: trace.stages };
        break;
      }
      case 'VERIFY': {
        const expectedFn = deserializeExpectedFn(req.expectedFn);
        const result = verifyCircuitTruthTable(req.circuit, req.inputNames, req.outputNames, expectedFn);
        response = { type: 'VERIFY_RESULT', result };
        break;
      }
      case 'ANALYZE': {
        const analysis = analyzeTruthTable(req.truthTable);
        response = { type: 'ANALYZE_RESULT', analysis };
        break;
      }
      case 'SYNTHESIZE': {
        const circuit = synthesizeCircuitFromTruthTable(req.truthTable, req.circuitName);
        response = { type: 'SYNTHESIZE_RESULT', circuit };
        break;
      }
      case 'GET_PRESETS': {
        response = { type: 'PRESETS_RESULT', presets: PRESET_CIRCUITS };
        break;
      }
      case 'GET_CHALLENGES': {
        response = { type: 'CHALLENGES_RESULT', challenges: LOGIC_CHALLENGES };
        break;
      }
      case 'GET_DAILY': {
        const challenge = getDailyChallenge(req.dateIso);
        response = { type: 'DAILY_RESULT', challenge };
        break;
      }
      default:
        response = { type: 'ERROR', error: `Unknown request type: ${(req as any).type}` };
    }
  } catch (err) {
    response = { type: 'ERROR', error: err instanceof Error ? err.message : String(err) };
  }

  self.postMessage(response);
};

export {};