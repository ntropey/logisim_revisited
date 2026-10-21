/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * Worker protocol types for communication between main thread and simulation worker.
 */

import type { Circuit, SimulationResult, LogicValue, ComponentInstance, Wire, TraceStage, TruthTable, KMapAnalysis, VerificationResult } from '@logisim/core';

export type WorkerRequest =
  | { type: 'SIMULATE'; circuit: Circuit; memState: any }
  | { type: 'POKE'; circuit: Circuit; compId: string; bitIndex?: number }
  | { type: 'STEP_CLOCK'; circuit: Circuit; memState: any }
  | { type: 'TRACE_SIGNAL'; circuit: Circuit; simResult: SimulationResult; target: { compId?: string; netId?: string } }
  | { type: 'VERIFY'; circuit: Circuit; inputNames: string[]; outputNames: string[]; expectedFn: string }
  | { type: 'ANALYZE'; truthTable: TruthTable }
  | { type: 'SYNTHESIZE'; truthTable: TruthTable; circuitName?: string }
  | { type: 'GET_PRESETS' }
  | { type: 'GET_CHALLENGES' }
  | { type: 'GET_DAILY'; dateIso: string };

export type WorkerResponse =
  | { type: 'SIMULATE_RESULT'; result: SimulationResult }
  | { type: 'POKE_RESULT'; circuit: Circuit }
  | { type: 'STEP_CLOCK_RESULT'; circuit: Circuit; result: SimulationResult }
  | { type: 'TRACE_RESULT'; stages: TraceStage[] }
  | { type: 'VERIFY_RESULT'; result: VerificationResult }
  | { type: 'ANALYZE_RESULT'; analysis: KMapAnalysis }
  | { type: 'SYNTHESIZE_RESULT'; circuit: Circuit }
  | { type: 'PRESETS_RESULT'; presets: any[] }
  | { type: 'CHALLENGES_RESULT'; challenges: any[] }
  | { type: 'DAILY_RESULT'; challenge: any }
  | { type: 'ERROR'; error: string };

export type WorkerMessage = WorkerRequest | WorkerResponse;