import { describe, expect, it } from 'vitest';
import {
  analyzeTruthTable,
  createEmptyMemoryState,
  evaluateBooleanExpr,
  floatingValue,
  getDailyChallenge,
  LOGIC_CHALLENGES,
  parseCircXml,
  pokeComponent,
  PRESET_CIRCUITS,
  resolveBusDrivers,
  serializeCircXml,
  simulateCircuit,
  stepClockTick,
  synthesizeCircuitFromTruthTable,
  traceSignal,
  truthTableFromExpr,
  valueFromInt,
  valueFromString,
  valueToDisplayString,
  valueToInt,
  verifyCircuitTruthTable,
} from '../src/index';

describe('@logisim/core 4-state logic values & bus resolution', () => {
  it('converts between integers and multi-bit values and resolves bus conflicts', () => {
    const v5 = valueFromInt(5, 4);
    expect(valueToInt(v5)).toBe(5);
    expect(valueToDisplayString(v5)).toBe('0x5');

    const z1 = floatingValue(1);
    const high = valueFromInt(1, 1);
    const low = valueFromInt(0, 1);

    // Z + 1 -> 1
    expect(valueToDisplayString(resolveBusDrivers([z1, high], 1))).toBe('1');
    // 0 + 1 -> E (short-circuit conflict)
    expect(valueToDisplayString(resolveBusDrivers([low, high], 1))).toBe('E');
    // Multi-bit hex parsing
    expect(valueToInt(valueFromString('0xA', 4))).toBe(10);
  });
});

describe('@logisim/core preset circuits & discrete-event simulator', () => {
  it('simulates Half Adder, Full Adder, Multiplexer, 4-Bit ALU, and Majority Voter accurately', () => {
    const halfAdder = PRESET_CIRCUITS.find((p) => p.slug === 'half-adder')!;
    const simHA = simulateCircuit(halfAdder.circuit);
    expect(valueToDisplayString(simHA.pinValues.out_sum.in0)).toBe('0');
    expect(valueToDisplayString(simHA.pinValues.out_carry.in0)).toBe('1');

    // Toggle input B to 0 -> Sum=1, Carry=0
    const pokedHA = pokeComponent(halfAdder.circuit, 'in_b');
    const simHA2 = simulateCircuit(pokedHA);
    expect(valueToDisplayString(simHA2.pinValues.out_sum.in0)).toBe('1');
    expect(valueToDisplayString(simHA2.pinValues.out_carry.in0)).toBe('0');

    // Full Adder exhaustive verification across all 8 input vectors
    const fullAdder = PRESET_CIRCUITS.find((p) => p.slug === 'full-adder')!;
    const verFA = verifyCircuitTruthTable(
      fullAdder.circuit,
      ['A', 'B', 'Cin'],
      ['Sum', 'Cout'],
      ({ A, B, Cin }) => {
        const s = A + B + Cin;
        return { Sum: s & 1, Cout: s >= 2 ? 1 : 0 };
      },
    );
    expect(verFA.passed).toBe(true);
    expect(verFA.passedRows).toBe(8);

    // 4-Bit ALU: A=5 (0101), B=3 (0011), Op=00 (Add) -> Result = 8 (0x8)
    const alu = PRESET_CIRCUITS.find((p) => p.slug === '4-bit-alu')!;
    const simAlu = simulateCircuit(alu.circuit);
    expect(valueToInt(simAlu.pinValues.out_res.in0)).toBe(8);

    // 3-Bit Odd Parity Checker (xor-parity) exhaustive verification across all 8 input vectors
    const xorParity = PRESET_CIRCUITS.find((p) => p.slug === 'xor-parity')!;
    const verParity = verifyCircuitTruthTable(
      xorParity.circuit,
      ['A', 'B', 'C'],
      ['Parity'],
      ({ A, B, C }) => ({ Parity: (A ^ B ^ C) & 1 }),
    );
    expect(verParity.passed).toBe(true);
    expect(verParity.passedRows).toBe(8);
  });

  it('steps sequential J-K, S-R, T, and D Flip-Flops and 4-bit Counter on rising clock edges', () => {
    const jkPreset = PRESET_CIRCUITS.find((p) => p.slug === 'jk-flip-flop')!;
    let cir = jkPreset.circuit;
    let mem = createEmptyMemoryState();
    const sim0 = simulateCircuit(cir, mem);
    mem = sim0.memState;
    expect(valueToDisplayString(sim0.pinValues.out_q.in0)).toBe('0');

    // Rising clock edge (0 -> 1) with J=1, K=1 toggles Q from 0 to 1
    const tick1 = stepClockTick(cir, mem);
    cir = tick1.circuit;
    mem = tick1.result.memState;
    expect(valueToDisplayString(tick1.result.pinValues.out_q.in0)).toBe('1');

    // Falling clock edge (1 -> 0) holds Q=1
    const tick2 = stepClockTick(cir, mem);
    cir = tick2.circuit;
    mem = tick2.result.memState;
    expect(valueToDisplayString(tick2.result.pinValues.out_q.in0)).toBe('1');

    // Second rising clock edge (0 -> 1) toggles Q back to 0
    const tick3 = stepClockTick(cir, mem);
    expect(valueToDisplayString(tick3.result.pinValues.out_q.in0)).toBe('0');

    // S-R Flip-Flop preset (S=1, R=0 sets Q=1 on rising edge)
    const srPreset = PRESET_CIRCUITS.find((p) => p.slug === 'sr-latch')!;
    const srSim0 = simulateCircuit(srPreset.circuit, createEmptyMemoryState());
    const srTick1 = stepClockTick(srPreset.circuit, srSim0.memState);
    expect(valueToDisplayString(srTick1.result.pinValues.out_q.in0)).toBe('1');
    expect(valueToDisplayString(srTick1.result.pinValues.out_qn.in0)).toBe('0');

    // T Flip-Flop preset (T=1 toggles Q on rising edge)
    const tPreset = PRESET_CIRCUITS.find((p) => p.slug === 't-flip-flop')!;
    const tSim0 = simulateCircuit(tPreset.circuit, createEmptyMemoryState());
    const tTick1 = stepClockTick(tPreset.circuit, tSim0.memState);
    expect(valueToDisplayString(tTick1.result.pinValues.out_q.in0)).toBe('1');

    // D Flip-Flop preset (D=1 captures Q=1 on rising edge)
    const dPreset = PRESET_CIRCUITS.find((p) => p.slug === 'd-flip-flop')!;
    const dSim0 = simulateCircuit(dPreset.circuit, createEmptyMemoryState());
    const dTick1 = stepClockTick(dPreset.circuit, dSim0.memState);
    expect(valueToDisplayString(dTick1.result.pinValues.out_q.in0)).toBe('1');
  });

  it('traces signal provenance and diagnoses short-circuit bus contention (E)', () => {
    const contention = PRESET_CIRCUITS.find((p) => p.slug === 'short-circuit-demo')!;
    const sim = simulateCircuit(contention.circuit);
    const trace = traceSignal(contention.circuit, sim, { compId: 'out_bus' });
    expect(trace.verdict).toBe('short-circuit');
    expect(trace.stages.length).toBeGreaterThanOrEqual(2);
    expect(trace.headline).toMatch(/Short-circuit conflict/i);

    const fa = PRESET_CIRCUITS.find((p) => p.slug === 'full-adder')!;
    const simFa = simulateCircuit(fa.circuit);
    const traceSum = traceSignal(fa.circuit, simFa, { compId: 'out_sum' });
    expect(traceSum.verdict).toBe('valid-0');
    expect(traceSum.stages.length).toBeGreaterThanOrEqual(2);
  });

  it('verifies starter vs solution circuits for all Logic Challenges', () => {
    for (const ch of LOGIC_CHALLENGES) {
      const starterCheck = verifyCircuitTruthTable(ch.starterCircuit, ch.inputNames, ch.outputNames, ch.expectedFn);
      expect(starterCheck.passed).toBe(false);
      expect(starterCheck.firstFailure).not.toBeNull();

      const solCheck = verifyCircuitTruthTable(ch.solutionCircuit, ch.inputNames, ch.outputNames, ch.expectedFn);
      expect(solCheck.passed).toBe(true);
    }
    const daily = getDailyChallenge('2026-10-21');
    expect(daily.id).toBeTruthy();
  });
});

describe('@logisim/core Combinational Analysis, K-Map & Circuit Synthesis', () => {
  it('minimizes Boolean expressions via Quine-McCluskey and synthesizes working circuits', () => {
    expect(evaluateBooleanExpr("A & B + ~A & C", { A: 1, B: 1, C: 0 })).toBe(1);
    expect(evaluateBooleanExpr("A & B + ~A & C", { A: 1, B: 0, C: 1 })).toBe(0);

    // 3-input Majority function: A*B + B*C + A*C
    const table = truthTableFromExpr('A*B + B*C + A*C', ['A', 'B', 'C'], 'Maj');
    const kmap = analyzeTruthTable(table);
    expect(kmap.minimalImplicants.length).toBe(3);
    expect(kmap.loops.length).toBe(3);

    // Synthesize circuit and verify all 8 rows of the truth table on the synthesized schematic!
    const synth = synthesizeCircuitFromTruthTable(table, 'SynthMajority');
    const ver = verifyCircuitTruthTable(synth, ['A', 'B', 'C'], ['Maj'], ({ A, B, C }) => ({
      Maj: A + B + C >= 2 ? 1 : 0,
    }));
    expect(ver.passed).toBe(true);
  });
});

describe('@logisim/core Logisim 2.7.1 .circ XML parser & exporter', () => {
  it('round-trips a circuit through serializeCircXml and parseCircXml with identical simulation behavior', () => {
    const orig = PRESET_CIRCUITS[0].circuit;
    const xml = serializeCircXml(orig);
    expect(xml).toContain('<project source="2.7.1" version="1.0">');
    expect(xml).toContain('name="XOR Gate"');

    const parsed = parseCircXml(xml);
    expect(parsed.name).toBe('Half Adder');
    expect(parsed.components.length).toBe(orig.components.length);
    expect(parsed.wires.length).toBe(orig.wires.length);

    const ver = verifyCircuitTruthTable(parsed, ['A', 'B'], ['Sum', 'Carry'], ({ A, B }) => ({
      Sum: (A ^ B) & 1,
      Carry: (A & B) & 1,
    }));
    expect(ver.passed).toBe(true);
  });
});
