/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * Worker client - manages communication with the simulation Web Worker.
 */

import type { Circuit, SimulationResult, TraceStage, TruthTable, KMapAnalysis, VerificationResult, SequentialMemoryState } from '@logisim/core';
import type { WorkerRequest, WorkerResponse } from './protocol';

type PendingRequest = {
  resolve: (value: any) => void;
  reject: (reason: any) => void;
};

export class SolverClient {
  private worker: Worker;
  private pending = new Map<number, PendingRequest>();
  private requestId = 0;
  private ready = false;
  private initPromise: Promise<void>;

  constructor() {
    this.worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = this.handleMessage.bind(this);
    this.initPromise = new Promise(resolve => {
      // Worker is ready immediately for module workers
      this.ready = true;
      resolve();
    });
  }

  private handleMessage(e: MessageEvent<WorkerResponse>) {
    const response = e.data;
    // Find the oldest pending request (FIFO)
    const firstKey = this.pending.keys().next().value;
    if (firstKey !== undefined) {
      const pending = this.pending.get(firstKey);
      this.pending.delete(firstKey);
      if (pending) {
        if (response.type === 'ERROR') {
          pending.reject(new Error(response.error));
        } else {
          pending.resolve(response);
        }
      }
    }
  }

  private async sendRequest<T extends WorkerResponse>(request: WorkerRequest): Promise<T> {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const id = this.requestId++;
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage(request);
      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error('Worker request timeout'));
        }
      }, 30000);
    });
  }

  async simulate(circuit: Circuit, memState: SequentialMemoryState): Promise<SimulationResult> {
    const response = await this.sendRequest<{ type: 'SIMULATE_RESULT'; result: SimulationResult }>({
      type: 'SIMULATE',
      circuit,
      memState,
    });
    return response.result;
  }

  async poke(circuit: Circuit, compId: string, bitIndex = 0): Promise<Circuit> {
    const response = await this.sendRequest<{ type: 'POKE_RESULT'; circuit: Circuit }>({
      type: 'POKE',
      circuit,
      compId,
      bitIndex,
    });
    return response.circuit;
  }

  async stepClock(circuit: Circuit, memState: SequentialMemoryState): Promise<{ circuit: Circuit; result: SimulationResult }> {
    const response = await this.sendRequest<{ type: 'STEP_CLOCK_RESULT'; circuit: Circuit; result: SimulationResult }>({
      type: 'STEP_CLOCK',
      circuit,
      memState,
    });
    return { circuit: response.circuit, result: response.result };
  }

  async traceSignal(circuit: Circuit, simResult: SimulationResult, target: { compId?: string; netId?: string }): Promise<TraceStage[]> {
    const response = await this.sendRequest<{ type: 'TRACE_RESULT'; stages: TraceStage[] }>({
      type: 'TRACE_SIGNAL',
      circuit,
      simResult,
      target,
    });
    return response.stages;
  }

  async verify(
    circuit: Circuit,
    inputNames: string[],
    outputNames: string[],
    expectedFn: (inputs: Record<string, number>) => Record<string, number>
  ): Promise<VerificationResult> {
    const fnStr = expectedFn.toString();
    const response = await this.sendRequest<{ type: 'VERIFY_RESULT'; result: VerificationResult }>({
      type: 'VERIFY',
      circuit,
      inputNames,
      outputNames,
      expectedFn: fnStr,
    });
    return response.result;
  }

  async analyze(truthTable: TruthTable): Promise<KMapAnalysis> {
    const response = await this.sendRequest<{ type: 'ANALYZE_RESULT'; analysis: KMapAnalysis }>({
      type: 'ANALYZE',
      truthTable,
    });
    return response.analysis;
  }

  async synthesize(truthTable: TruthTable, circuitName?: string): Promise<Circuit> {
    const response = await this.sendRequest<{ type: 'SYNTHESIZE_RESULT'; circuit: Circuit }>({
      type: 'SYNTHESIZE',
      truthTable,
      circuitName,
    });
    return response.circuit;
  }

  async getPresets(): Promise<any[]> {
    const response = await this.sendRequest<{ type: 'PRESETS_RESULT'; presets: any[] }>({
      type: 'GET_PRESETS',
    });
    return response.presets;
  }

  async getChallenges(): Promise<any[]> {
    const response = await this.sendRequest<{ type: 'CHALLENGES_RESULT'; challenges: any[] }>({
      type: 'GET_CHALLENGES',
    });
    return response.challenges;
  }

  async getDaily(dateIso: string): Promise<any> {
    const response = await this.sendRequest<{ type: 'DAILY_RESULT'; challenge: any }>({
      type: 'GET_DAILY',
      dateIso,
    });
    return response.challenge;
  }

  terminate() {
    this.worker.terminate();
  }
}

// Singleton instance
let clientInstance: SolverClient | null = null;

export function getSolverClient(): SolverClient {
  if (!clientInstance) {
    clientInstance = new SolverClient();
  }
  return clientInstance;
}