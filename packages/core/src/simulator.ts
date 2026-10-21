/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * Discrete-event 4-state digital logic simulator, netlist compiler, and backward signal provenance tracer.
 */

import {
  createEmptyMemoryState,
  evaluateComponent,
  getComponentPins,
  updateSequentialState,
  type ComponentInstance,
  type PinDef,
  type Point,
  type SequentialMemoryState,
} from './components';
import {
  errorValue,
  floatingValue,
  hasErrorBit,
  isFullyFloating,
  resolveBusDrivers,
  valueFromInt,
  valueToDisplayString,
  valuesEqual,
  type LogicValue,
} from './value';

export interface Wire {
  id: string;
  from: Point;
  to: Point;
}

export interface Circuit {
  name: string;
  components: ComponentInstance[];
  wires: Wire[];
}

export interface NetPinRef {
  compId: string;
  pinId: string;
  dir: 'in' | 'out';
  width: number;
  x: number;
  y: number;
}

export interface Net {
  id: string;
  width: number;
  points: Point[];
  wireIds: string[];
  pins: NetPinRef[];
  tunnelNames: string[];
}

export interface NetDriverRecord {
  compId: string;
  pinId: string;
  value: LogicValue;
}

export interface SimulationResult {
  nets: Net[];
  /** Net ID -> resolved LogicValue */
  netValues: Record<string, LogicValue>;
  /** Net ID -> active drivers that contributed to this net */
  netDrivers: Record<string, NetDriverRecord[]>;
  /** Point key "x,y" -> Net ID */
  pointToNet: Record<string, string>;
  /** Wire ID -> Net ID */
  wireToNet: Record<string, string>;
  /** Component ID -> Pin ID -> LogicValue */
  pinValues: Record<string, Record<string, LogicValue>>;
  /** Component ID -> human-readable evaluation summary */
  explanations: Record<string, string>;
  /** Updated sequential memory state */
  memState: SequentialMemoryState;
  /** True if the circuit failed to settle within maxIterations (combinational feedback loop) */
  oscillating: boolean;
  /** Net IDs that oscillated during relaxation */
  oscillatingNets: string[];
  /** Number of relaxation iterations used */
  iterations: number;
}

export function pointKey(p: Point): string {
  return `${p.x},${p.y}`;
}

/** Check if point `p` lies strictly or inclusively on axis-aligned or collinear segment `a`..`b`. */
export function isPointOnWire(p: Point, w: Wire): boolean {
  const { from: a, to: b } = w;
  if (a.x === b.x && p.x === a.x) {
    const minY = Math.min(a.y, b.y);
    const maxY = Math.max(a.y, b.y);
    return p.y >= minY && p.y <= maxY;
  }
  if (a.y === b.y && p.y === a.y) {
    const minX = Math.min(a.x, b.x);
    const maxX = Math.max(a.x, b.x);
    return p.x >= minX && p.x <= maxX;
  }
  return (p.x === a.x && p.y === a.y) || (p.x === b.x && p.y === b.y);
}

/**
 * Compile a `Circuit` into connected electrical `Net`s.
 * - Connects wire endpoints, T-junctions (where a wire endpoint or component pin touches the middle of another wire),
 *   and matching `Tunnel` labels.
 */
export function compileNetlist(circuit: Circuit): {
  nets: Net[];
  pointToNet: Record<string, string>;
  wireToNet: Record<string, string>;
  compPinDefs: Record<string, PinDef[]>;
} {
  const parent = new Map<string, string>();
  const coords = new Map<string, Point>();

  const ensureNode = (k: string, pt?: Point) => {
    if (!parent.has(k)) parent.set(k, k);
    if (pt && !coords.has(k)) coords.set(k, pt);
  };

  const find = (k: string): string => {
    let cur = parent.get(k) ?? k;
    if (cur !== k) {
      cur = find(cur);
      parent.set(k, cur);
    }
    return cur;
  };

  const union = (a: string, b: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(rb, ra);
  };

  // Collect all component pins and wire endpoints (active junction vertices)
  const junctionPoints: Point[] = [];
  const compPinDefs: Record<string, PinDef[]> = {};

  for (const comp of circuit.components) {
    const pins = getComponentPins(comp);
    compPinDefs[comp.id] = pins;
    for (const pin of pins) {
      const pt = { x: pin.x, y: pin.y };
      ensureNode(pointKey(pt), pt);
      junctionPoints.push(pt);
    }
  }

  for (const w of circuit.wires) {
    ensureNode(pointKey(w.from), w.from);
    ensureNode(pointKey(w.to), w.to);
    junctionPoints.push(w.from, w.to);
  }

  // Union each wire's endpoints and any junction point that lies along the wire segment (T-junction)
  for (const w of circuit.wires) {
    const kFrom = pointKey(w.from);
    const kTo = pointKey(w.to);
    union(kFrom, kTo);
    for (const jp of junctionPoints) {
      if (isPointOnWire(jp, w)) {
        union(kFrom, pointKey(jp));
      }
    }
  }

  // Union Tunnels that share the same non-empty label
  const tunnelFirstKey = new Map<string, string>();
  for (const comp of circuit.components) {
    if (comp.type === 'Tunnel') {
      const tName = (comp.attrs.label ?? '').trim();
      if (!tName) continue;
      const pin = compPinDefs[comp.id]?.[0];
      if (!pin) continue;
      const pk = pointKey({ x: pin.x, y: pin.y });
      const prev = tunnelFirstKey.get(tName);
      if (prev) union(prev, pk);
      else tunnelFirstKey.set(tName, pk);
    }
  }

  // Group by root representative
  const rootToNet = new Map<string, Net>();
  let netCounter = 0;

  const getOrCreateNet = (root: string): Net => {
    let net = rootToNet.get(root);
    if (!net) {
      net = {
        id: `net_${netCounter++}`,
        width: 1,
        points: [],
        wireIds: [],
        pins: [],
        tunnelNames: [],
      };
      rootToNet.set(root, net);
    }
    return net;
  };

  for (const [k, pt] of coords.entries()) {
    const r = find(k);
    const net = getOrCreateNet(r);
    net.points.push(pt);
  }

  const wireToNet: Record<string, string> = {};
  for (const w of circuit.wires) {
    const r = find(pointKey(w.from));
    const net = getOrCreateNet(r);
    net.wireIds.push(w.id);
    wireToNet[w.id] = net.id;
  }

  for (const comp of circuit.components) {
    const pins = compPinDefs[comp.id] ?? [];
    for (const pin of pins) {
      const r = find(pointKey({ x: pin.x, y: pin.y }));
      const net = getOrCreateNet(r);
      net.pins.push({
        compId: comp.id,
        pinId: pin.id,
        dir: pin.dir,
        width: pin.width,
        x: pin.x,
        y: pin.y,
      });
      if (pin.width > net.width) net.width = pin.width;
      if (comp.type === 'Tunnel' && comp.attrs.label) {
        const lbl = comp.attrs.label.trim();
        if (lbl && !net.tunnelNames.includes(lbl)) net.tunnelNames.push(lbl);
      }
    }
  }

  const pointToNet: Record<string, string> = {};
  for (const [k] of parent.entries()) {
    const net = rootToNet.get(find(k));
    if (net) pointToNet[k] = net.id;
  }

  return {
    nets: [...rootToNet.values()],
    pointToNet,
    wireToNet,
    compPinDefs,
  };
}

/**
 * Run discrete-event relaxation simulation on `circuit`.
 */
export function simulateCircuit(
  circuit: Circuit,
  initialMemState: SequentialMemoryState = createEmptyMemoryState(),
  maxIterations = 64,
  settleDepth = 0,
): SimulationResult {
  const { nets, pointToNet, wireToNet } = compileNetlist(circuit);
  const netById = new Map<string, Net>(nets.map((n) => [n.id, n]));

  let memState = initialMemState;
  const netValues: Record<string, LogicValue> = {};
  const netDrivers: Record<string, NetDriverRecord[]> = {};
  for (const net of nets) {
    netValues[net.id] = floatingValue(net.width);
    netDrivers[net.id] = [];
  }

  const pinValues: Record<string, Record<string, LogicValue>> = {};
  const explanations: Record<string, string> = {};
  const oscillatingSet = new Set<string>();
  let iterations = 0;
  let converged = false;

  for (let iter = 0; iter < maxIterations; iter++) {
    iterations = iter + 1;
    // 1. Gather current input values for each component from netValues
    const compOutputs: Record<string, Record<string, LogicValue>> = {};
    for (const comp of circuit.components) {
      const inMap: Record<string, LogicValue> = {};
      pinValues[comp.id] = pinValues[comp.id] ?? {};
      const pins = getComponentPins(comp);
      for (const p of pins) {
        const netId = pointToNet[pointKey({ x: p.x, y: p.y })];
        const v = netId ? netValues[netId] ?? floatingValue(p.width) : floatingValue(p.width);
        if (p.dir === 'in') {
          inMap[p.id] = v;
          pinValues[comp.id][p.id] = v;
        }
      }
      const evalRes = evaluateComponent(comp, inMap, memState);
      compOutputs[comp.id] = evalRes.outputs;
      explanations[comp.id] = evalRes.explanation;
      for (const [outPinId, outVal] of Object.entries(evalRes.outputs)) {
        pinValues[comp.id][outPinId] = outVal;
      }
    }

    // 2. Resolve drivers on each net
    let anyChanged = false;
    for (const net of nets) {
      const drivers: NetDriverRecord[] = [];
      for (const pinRef of net.pins) {
        if (pinRef.dir === 'out') {
          const val = compOutputs[pinRef.compId]?.[pinRef.pinId];
          if (val && !isFullyFloating(val)) {
            drivers.push({ compId: pinRef.compId, pinId: pinRef.pinId, value: val });
          }
        }
      }
      netDrivers[net.id] = drivers;
      const nextVal = resolveBusDrivers(
        drivers.map((d) => d.value),
        net.width,
      );
      if (!valuesEqual(netValues[net.id], nextVal)) {
        anyChanged = true;
        if (iter >= maxIterations - 4) {
          oscillatingSet.add(net.id);
        }
        netValues[net.id] = nextVal;
      }
    }

    if (!anyChanged) {
      converged = true;
      break;
    }
  }

  // If oscillation occurred, mark oscillating nets as Error ('E')
  if (!converged) {
    for (const netId of oscillatingSet) {
      const net = netById.get(netId);
      if (net) netValues[netId] = errorValue(net.width);
    }
  }

  // Final pass to sync input pinValues and sequential clock tracking
  for (const comp of circuit.components) {
    const inMap: Record<string, LogicValue> = {};
    const pins = getComponentPins(comp);
    for (const p of pins) {
      const netId = pointToNet[pointKey({ x: p.x, y: p.y })];
      const v = netId ? netValues[netId] ?? floatingValue(p.width) : floatingValue(p.width);
      pinValues[comp.id][p.id] = v;
      if (p.dir === 'in') inMap[p.id] = v;
    }
    const evalRes = evaluateComponent(comp, inMap, memState);
    explanations[comp.id] = evalRes.explanation;
    memState = updateSequentialState(comp, inMap, memState);
  }

  // A clock edge just changed stored state: re-settle so outputs (Q, counts) reflect it immediately.
  // `prevClock` is now current, so the second pass sees no new edge; depth is capped for chained sequential parts.
  if (settleDepth < 4 && !sameMemValues(initialMemState.values, memState.values)) {
    return simulateCircuit(circuit, memState, maxIterations, settleDepth + 1);
  }

  return {
    nets,
    netValues,
    netDrivers,
    pointToNet,
    wireToNet,
    pinValues,
    explanations,
    memState,
    oscillating: !converged,
    oscillatingNets: [...oscillatingSet],
    iterations,
  };
}

/**
 * Toggle an interactive component (`Pin`, `Clock`, `Button`) in `circuit` (returns a new immutable `Circuit`).
 * If `bitIndex` is specified on a multi-bit Input Pin, toggles that specific bit (0 = LSB).
 */
export function pokeComponent(circuit: Circuit, compId: string, bitIndex = 0): Circuit {
  return {
    ...circuit,
    components: circuit.components.map((c) => {
      if (c.id !== compId) return c;
      if (c.type === 'Pin' && !c.attrs.output) {
        const w = c.attrs.width ?? 1;
        if (w === 1) {
          const next = c.attrs.value === '1' ? '0' : '1';
          return { ...c, attrs: { ...c.attrs, value: next } };
        }
        const curVal = simulatePinValue(c.attrs.value ?? '0', w);
        const nextNum = (curVal ^ (1 << bitIndex)) >>> 0;
        const binStr = nextNum.toString(2).padStart(w, '0').slice(-w);
        return { ...c, attrs: { ...c.attrs, value: binStr } };
      }
      if (c.type === 'Clock' || c.type === 'Button') {
        const next = c.attrs.value === '1' ? '0' : '1';
        return { ...c, attrs: { ...c.attrs, value: next } };
      }
      return c;
    }),
  };
}

function sameMemValues(a: Record<string, number>, b: Record<string, number>): boolean {
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => a[k] === b[k]);
}

function simulatePinValue(raw: string, width: number): number {
  const clean = raw.replace(/[^01]/g, '');
  if (!clean) return 0;
  return parseInt(clean, 2) & ((1 << width) - 1);
}

/**
 * Advance all `Clock` components by one half-cycle (or full rising-edge tick) and return the new circuit + simulation.
 */
export function stepClockTick(
  circuit: Circuit,
  memState: SequentialMemoryState,
): { circuit: Circuit; result: SimulationResult } {
  const toggled: Circuit = {
    ...circuit,
    components: circuit.components.map((c) =>
      c.type === 'Clock' ? { ...c, attrs: { ...c.attrs, value: c.attrs.value === '1' ? '0' : '1' } } : c,
    ),
  };
  const result = simulateCircuit(toggled, memState);
  return { circuit: toggled, result };
}

export interface TraceStage {
  label: string;
  text: string;
  highlightComponents: string[];
  highlightNets: string[];
}

export interface SignalTrace {
  targetLabel: string;
  netId: string | null;
  value: LogicValue;
  verdict: 'valid-0' | 'valid-1' | 'bus-value' | 'short-circuit' | 'floating' | 'oscillation';
  headline: string;
  stages: TraceStage[];
}

/**
 * Symbolic AI Signal Prover:
 * Given a component ID or a net ID, traces backwards through the circuit's active drivers to explain
 * WHY that signal is '0', '1', 'E' (Error / Short-Circuit), or 'Z' (Floating / Unconnected).
 */
export function traceSignal(
  circuit: Circuit,
  sim: SimulationResult,
  target: { compId?: string; netId?: string },
): SignalTrace {
  const compById = new Map<string, ComponentInstance>(circuit.components.map((c) => [c.id, c]));

  let rootNetId: string | null = target.netId ?? null;
  let rootComp: ComponentInstance | undefined = target.compId ? compById.get(target.compId) : undefined;

  if (!rootNetId && rootComp) {
    const pins = getComponentPins(rootComp);
    const outPin = pins.find((p) => p.dir === 'out') ?? pins[0];
    if (outPin) {
      rootNetId = sim.pointToNet[pointKey({ x: outPin.x, y: outPin.y })] ?? null;
    }
  }

  const net = sim.nets.find((n) => n.id === rootNetId) ?? null;
  const val = (rootNetId ? sim.netValues[rootNetId] : undefined) ?? floatingValue(1);
  const valStr = valueToDisplayString(val);
  const targetName = rootComp
    ? `${rootComp.type}${rootComp.attrs.label ? ` "${rootComp.attrs.label}"` : ` (${rootComp.id})`}`
    : net?.tunnelNames[0]
      ? `Tunnel "${net.tunnelNames[0]}"`
      : rootNetId ?? 'Selected wire';

  // Case 1: Oscillating feedback loop
  if (rootNetId && sim.oscillatingNets.includes(rootNetId)) {
    return {
      targetLabel: targetName,
      netId: rootNetId,
      value: val,
      verdict: 'oscillation',
      headline: `${targetName} is oscillating (Error E) due to an unclocked combinational feedback loop.`,
      stages: [
        {
          label: 'Oscillation detected',
          text: `${targetName} did not settle to a stable logic level within ${sim.iterations} gate-delay steps because an inverted output feeds back into its own input without a clocked Flip-Flop.`,
          highlightComponents: rootComp ? [rootComp.id] : [],
          highlightNets: [rootNetId],
        },
      ],
    };
  }

  // Case 2: Multiple competing drivers on the same net -> Short-Circuit Conflict ('E')
  const drivers = rootNetId ? sim.netDrivers[rootNetId] ?? [] : [];
  if (drivers.length > 1 && hasErrorBit(val)) {
    const driverDescriptions = drivers.map((d) => {
      const c = compById.get(d.compId);
      const name = c ? `${c.type}${c.attrs.label ? ` "${c.attrs.label}"` : ''}` : d.compId;
      return `${name} drives ${valueToDisplayString(d.value)}`;
    });
    const driverCompIds = drivers.map((d) => d.compId);
    return {
      targetLabel: targetName,
      netId: rootNetId,
      value: val,
      verdict: 'short-circuit',
      headline: `Short-circuit conflict (Error E) on ${targetName}: ${drivers.length} outputs drive opposing logic levels onto the same wire.`,
      stages: [
        {
          label: 'Conflicting wire net',
          text: `Look at ${targetName} (highlighted in red). It shows Error (E) because multiple output pins are wired directly together.`,
          highlightComponents: rootComp ? [rootComp.id] : [],
          highlightNets: rootNetId ? [rootNetId] : [],
        },
        {
          label: 'Competing drivers',
          text: `On this net, ${driverDescriptions.join(' while ')}. Connecting a 0 driver and a 1 driver directly together creates a short circuit.`,
          highlightComponents: driverCompIds,
          highlightNets: rootNetId ? [rootNetId] : [],
        },
        {
          label: 'How to fix',
          text: `Separate the outputs, combine them with a logic gate (such as an OR gate or Multiplexer), or use Controlled Buffers (tri-state drivers) so only one driver is enabled at a time.`,
          highlightComponents: driverCompIds,
          highlightNets: rootNetId ? [rootNetId] : [],
        },
      ],
    };
  }

  // Case 3: No active driver on the net -> Floating ('Z')
  if (drivers.length === 0 && isFullyFloating(val)) {
    return {
      targetLabel: targetName,
      netId: rootNetId,
      value: val,
      verdict: 'floating',
      headline: `${targetName} is Floating (Z, blue wire) because no active output pin is driving this net.`,
      stages: [
        {
          label: 'Floating net (Z)',
          text: `${targetName} has state Z (high-impedance / unconnected). Either no gate or Input Pin is wired to its input, or all tri-state drivers on the net have Enable=0.`,
          highlightComponents: rootComp ? [rootComp.id] : [],
          highlightNets: rootNetId ? [rootNetId] : [],
        },
        {
          label: 'How to fix',
          text: `Draw a wire from an Input Pin, Constant, or gate output to ${targetName} so every input receives a valid 0 or 1 level.`,
          highlightComponents: rootComp ? [rootComp.id] : [],
          highlightNets: rootNetId ? [rootNetId] : [],
        },
      ],
    };
  }

  // Case 4: Trace backward through the causal chain of driving components
  const visitedComps = new Set<string>();
  const chainComps: ComponentInstance[] = [];
  const chainNets: string[] = [];

  const walkBackward = (netId: string | null, depth: number) => {
    if (!netId || depth > 8) return;
    if (!chainNets.includes(netId)) chainNets.push(netId);
    const netDrvs = sim.netDrivers[netId] ?? [];
    for (const d of netDrvs) {
      if (visitedComps.has(d.compId)) continue;
      visitedComps.add(d.compId);
      const c = compById.get(d.compId);
      if (!c) continue;
      chainComps.push(c);
      const pins = getComponentPins(c);
      for (const p of pins) {
        if (p.dir === 'in') {
          const inNetId = sim.pointToNet[pointKey({ x: p.x, y: p.y })] ?? null;
          walkBackward(inNetId, depth + 1);
        }
      }
    }
  };

  if (rootComp && rootComp.type !== 'Pin' && rootComp.type !== 'Probe' && rootComp.type !== 'LED') {
    visitedComps.add(rootComp.id);
    chainComps.push(rootComp);
    for (const p of getComponentPins(rootComp)) {
      if (p.dir === 'in') {
        const inNetId = sim.pointToNet[pointKey({ x: p.x, y: p.y })] ?? null;
        walkBackward(inNetId, 1);
      }
    }
  } else {
    walkBackward(rootNetId, 0);
  }

  // Order from primary inputs (leaves) to target output
  const ordered = [...chainComps].reverse();
  const primarySources = ordered.filter(
    (c) =>
      (c.type === 'Pin' && !c.attrs.output) ||
      c.type === 'Constant' ||
      c.type === 'Clock' ||
      c.type === 'Button' ||
      c.type === 'Power' ||
      c.type === 'Ground',
  );
  const logicBlocks = ordered.filter((c) => !primarySources.includes(c));

  const stages: TraceStage[] = [];
  if (primarySources.length > 0) {
    stages.push({
      label: 'Driving inputs',
      text: primarySources.map((c) => sim.explanations[c.id]).join(' '),
      highlightComponents: primarySources.map((c) => c.id),
      highlightNets: chainNets.slice(-primarySources.length),
    });
  }

  if (logicBlocks.length > 0) {
    stages.push({
      label: 'Gate propagation',
      text: logicBlocks.map((c) => sim.explanations[c.id]).join(' '),
      highlightComponents: logicBlocks.map((c) => c.id),
      highlightNets: chainNets,
    });
  }

  stages.push({
    label: 'Final signal level',
    text:
      rootComp && sim.explanations[rootComp.id]
        ? `${sim.explanations[rootComp.id]} Therefore, ${targetName} is ${valStr}.`
        : `Consequently, ${targetName} settles to logic level ${valStr}.`,
    highlightComponents: rootComp ? [rootComp.id, ...ordered.map((c) => c.id)] : ordered.map((c) => c.id),
    highlightNets: rootNetId ? [rootNetId, ...chainNets] : chainNets,
  });

  const verdict = hasErrorBit(val)
    ? 'short-circuit'
    : val.width === 1
      ? val.bits[0] === '1'
        ? 'valid-1'
        : 'valid-0'
      : 'bus-value';

  return {
    targetLabel: targetName,
    netId: rootNetId,
    value: val,
    verdict,
    headline: `Why ${targetName} is ${valStr}`,
    stages,
  };
}

export interface TruthTableRowFailure {
  rowIndex: number;
  inputs: Record<string, number>;
  expected: Record<string, number>;
  actual: Record<string, string>;
}

export interface VerificationResult {
  passed: boolean;
  totalRows: number;
  passedRows: number;
  firstFailure: TruthTableRowFailure | null;
}

/**
 * Exhaustively test a `Circuit` across all $2^N$ combinations of `inputNames`, comparing `outputNames`
 * against `expectedFn(inputs)` (used by Daily Challenges and the AI Circuit Coach).
 */
export function verifyCircuitTruthTable(
  circuit: Circuit,
  inputNames: readonly string[],
  outputNames: readonly string[],
  expectedFn: (inputs: Record<string, number>) => Record<string, number>,
): VerificationResult {
  const n = inputNames.length;
  const totalRows = 1 << n;
  let passedRows = 0;
  let firstFailure: TruthTableRowFailure | null = null;

  for (let row = 0; row < totalRows; row++) {
    const inputMap: Record<string, number> = {};
    for (let i = 0; i < n; i++) {
      const bit = (row >> (n - 1 - i)) & 1;
      inputMap[inputNames[i]] = bit;
    }

    const testCircuit: Circuit = {
      ...circuit,
      components: circuit.components.map((c) => {
        if (c.type === 'Pin' && !c.attrs.output && c.attrs.label && inputMap[c.attrs.label] !== undefined) {
          return {
            ...c,
            attrs: { ...c.attrs, value: String(inputMap[c.attrs.label]) },
          };
        }
        return c;
      }),
    };

    const sim = simulateCircuit(testCircuit);
    const expected = expectedFn(inputMap);
    const actual: Record<string, string> = {};
    let rowOk = true;

    for (const outName of outputNames) {
      const outComp = testCircuit.components.find(
        (c) => (c.type === 'Pin' && c.attrs.output && c.attrs.label === outName) || (c.type === 'LED' && c.attrs.label === outName),
      );
      if (!outComp) {
        actual[outName] = 'missing';
        rowOk = false;
        continue;
      }
      const inVal = sim.pinValues[outComp.id]?.in0 ?? floatingValue(1);
      const disp = valueToDisplayString(inVal);
      actual[outName] = disp;
      const expVal = valueToDisplayString(valueFromInt(expected[outName] ?? 0, outComp.attrs.width ?? 1));
      if (disp !== expVal) rowOk = false;
    }

    if (rowOk) {
      passedRows++;
    } else if (!firstFailure) {
      firstFailure = {
        rowIndex: row,
        inputs: inputMap,
        expected,
        actual,
      };
    }
  }

  return {
    passed: passedRows === totalRows,
    totalRows,
    passedRows,
    firstFailure,
  };
}
