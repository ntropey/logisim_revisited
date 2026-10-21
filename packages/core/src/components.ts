/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * Component library definitions, pin layouts (10px grid), and deterministic evaluation for:
 *   0: Wiring (Pin, Probe, Tunnel, Splitter, Clock, Constant, Power, Ground)
 *   1: Gates (NOT, Buffer, Controlled Buffer, Controlled Inverter, AND, OR, NAND, NOR, XOR, XNOR, Odd/Even Parity)
 *   2: Plexers (Multiplexer, Demultiplexer, Decoder, Priority Encoder)
 *   3: Arithmetic (Adder, Subtractor, Multiplier, Comparator, Negator, Shifter)
 *   4: Memory (D Flip-Flop, T Flip-Flop, J-K Flip-Flop, S-R Flip-Flop, Register, Counter, ROM)
 *   5: Input/Output (Button, LED, 7-Segment Display, Hex Digit Display)
 */

import {
  bitNot,
  createValue,
  errorValue,
  evaluateGateBits,
  floatingValue,
  valueFromInt,
  valueFromString,
  valueToDisplayString,
  valueToInt,
  valueToSignedInt,
  type BitState,
  type LogicValue,
} from './value';

export type Facing = 'east' | 'west' | 'north' | 'south';

export type ComponentCategory = 'Wiring' | 'Gates' | 'Plexers' | 'Arithmetic' | 'Memory' | 'I/O';

export type ComponentType =
  | 'Pin'
  | 'Probe'
  | 'Tunnel'
  | 'Splitter'
  | 'Clock'
  | 'Constant'
  | 'Power'
  | 'Ground'
  | 'NOT Gate'
  | 'Buffer'
  | 'Controlled Buffer'
  | 'Controlled Inverter'
  | 'AND Gate'
  | 'OR Gate'
  | 'NAND Gate'
  | 'NOR Gate'
  | 'XOR Gate'
  | 'XNOR Gate'
  | 'Odd Parity'
  | 'Even Parity'
  | 'Multiplexer'
  | 'Demultiplexer'
  | 'Decoder'
  | 'Priority Encoder'
  | 'Adder'
  | 'Subtractor'
  | 'Multiplier'
  | 'Comparator'
  | 'Negator'
  | 'Shifter'
  | 'D Flip-Flop'
  | 'T Flip-Flop'
  | 'J-K Flip-Flop'
  | 'S-R Flip-Flop'
  | 'Register'
  | 'Counter'
  | 'ROM'
  | 'Button'
  | 'LED'
  | '7-Segment Display'
  | 'Hex Digit Display';

export interface ComponentAttrs {
  facing?: Facing;
  width?: number;
  inputs?: number;
  selectBits?: number;
  output?: boolean; // For 'Pin': true = Output Pin (inspects signal), false = Input Pin (drives signal)
  threeState?: boolean;
  label?: string;
  value?: string; // Current value for Input Pin, Constant, Clock, Button, or ROM hex contents
  shiftKind?: 'll' | 'lr' | 'ar' | 'rl' | 'rr';
}

export interface Point {
  x: number;
  y: number;
}

export interface ComponentInstance {
  id: string;
  type: ComponentType;
  loc: Point;
  attrs: ComponentAttrs;
}

export interface PinDef {
  id: string;
  label: string;
  dir: 'in' | 'out';
  width: number;
  /** Absolute schematic coordinate (snapped to 10px grid) */
  x: number;
  y: number;
}

export interface ComponentCatalogItem {
  type: ComponentType;
  category: ComponentCategory;
  libId: number;
  shortName: string;
  description: string;
  defaultAttrs: ComponentAttrs;
}

export const COMPONENT_CATALOG: readonly ComponentCatalogItem[] = [
  // 0: Wiring
  { type: 'Pin', category: 'Wiring', libId: 0, shortName: 'Input Pin', description: 'Interactive input source that you can toggle with the Poke tool.', defaultAttrs: { facing: 'east', width: 1, output: false, value: '0' } },
  { type: 'Probe', category: 'Wiring', libId: 0, shortName: 'Output Pin / Probe', description: 'Displays the live logic state of a wire or bus.', defaultAttrs: { facing: 'west', width: 1 } },
  { type: 'Tunnel', category: 'Wiring', libId: 0, shortName: 'Tunnel', description: 'Connects wires with the same label across the schematic without visible crossing wires.', defaultAttrs: { facing: 'east', width: 1, label: 'NET0' } },
  { type: 'Splitter', category: 'Wiring', libId: 0, shortName: 'Splitter', description: 'Combines individual 1-bit wires into a multi-bit bus or splits a bus into branches.', defaultAttrs: { facing: 'east', width: 4, inputs: 4 } },
  { type: 'Clock', category: 'Wiring', libId: 0, shortName: 'Clock', description: 'Periodic square-wave signal source for sequential flip-flops and registers.', defaultAttrs: { facing: 'east', value: '0' } },
  { type: 'Constant', category: 'Wiring', libId: 0, shortName: 'Constant', description: 'Outputs a fixed logic constant (0, 1, or multi-bit hex value).', defaultAttrs: { facing: 'east', width: 1, value: '1' } },
  { type: 'Power', category: 'Wiring', libId: 0, shortName: 'Power (1)', description: 'Supplies a constant logic High (1).', defaultAttrs: { facing: 'south', width: 1 } },
  { type: 'Ground', category: 'Wiring', libId: 0, shortName: 'Ground (0)', description: 'Supplies a constant logic Low (0).', defaultAttrs: { facing: 'north', width: 1 } },
  // 1: Gates
  { type: 'NOT Gate', category: 'Gates', libId: 1, shortName: 'NOT', description: 'Inverts its input (0 → 1, 1 → 0).', defaultAttrs: { facing: 'east', width: 1 } },
  { type: 'Buffer', category: 'Gates', libId: 1, shortName: 'Buffer', description: 'Passes its input unchanged (0 → 0, 1 → 1).', defaultAttrs: { facing: 'east', width: 1 } },
  { type: 'Controlled Buffer', category: 'Gates', libId: 1, shortName: 'Tri-State Buffer', description: 'Passes data when Enable is 1; outputs high-impedance Floating (Z) when Enable is 0.', defaultAttrs: { facing: 'east', width: 1 } },
  { type: 'Controlled Inverter', category: 'Gates', libId: 1, shortName: 'Tri-State NOT', description: 'Inverts data when Enable is 1; outputs Floating (Z) when Enable is 0.', defaultAttrs: { facing: 'east', width: 1 } },
  { type: 'AND Gate', category: 'Gates', libId: 1, shortName: 'AND', description: 'Outputs 1 only when all active inputs are 1.', defaultAttrs: { facing: 'east', width: 1, inputs: 2 } },
  { type: 'OR Gate', category: 'Gates', libId: 1, shortName: 'OR', description: 'Outputs 1 when at least one active input is 1.', defaultAttrs: { facing: 'east', width: 1, inputs: 2 } },
  { type: 'NAND Gate', category: 'Gates', libId: 1, shortName: 'NAND', description: 'Inverted AND: outputs 0 only when all active inputs are 1.', defaultAttrs: { facing: 'east', width: 1, inputs: 2 } },
  { type: 'NOR Gate', category: 'Gates', libId: 1, shortName: 'NOR', description: 'Inverted OR: outputs 1 only when all active inputs are 0.', defaultAttrs: { facing: 'east', width: 1, inputs: 2 } },
  { type: 'XOR Gate', category: 'Gates', libId: 1, shortName: 'XOR', description: 'Exclusive OR: outputs 1 when an odd number of inputs are 1.', defaultAttrs: { facing: 'east', width: 1, inputs: 2 } },
  { type: 'XNOR Gate', category: 'Gates', libId: 1, shortName: 'XNOR', description: 'Exclusive NOR (equivalence): outputs 1 when an even number of inputs are 1.', defaultAttrs: { facing: 'east', width: 1, inputs: 2 } },
  { type: 'Odd Parity', category: 'Gates', libId: 1, shortName: 'Odd Parity', description: 'Outputs 1 when an odd number of inputs are 1.', defaultAttrs: { facing: 'east', width: 1, inputs: 3 } },
  { type: 'Even Parity', category: 'Gates', libId: 1, shortName: 'Even Parity', description: 'Outputs 1 when an even number of inputs are 1.', defaultAttrs: { facing: 'east', width: 1, inputs: 3 } },
  // 2: Plexers
  { type: 'Multiplexer', category: 'Plexers', libId: 2, shortName: 'MUX', description: 'Routes one of 2^S data inputs to the output based on the Select line.', defaultAttrs: { facing: 'east', width: 1, selectBits: 1 } },
  { type: 'Demultiplexer', category: 'Plexers', libId: 2, shortName: 'DEMUX', description: 'Routes a single data input to one of 2^S outputs based on the Select line.', defaultAttrs: { facing: 'east', width: 1, selectBits: 1 } },
  { type: 'Decoder', category: 'Plexers', libId: 2, shortName: 'Decoder', description: 'Asserts exactly one of 2^S output lines corresponding to the binary Select value.', defaultAttrs: { facing: 'east', selectBits: 2 } },
  { type: 'Priority Encoder', category: 'Plexers', libId: 2, shortName: 'Priority Encoder', description: 'Outputs the binary index of the highest-priority active input line.', defaultAttrs: { facing: 'east', selectBits: 2 } },
  // 3: Arithmetic
  { type: 'Adder', category: 'Arithmetic', libId: 3, shortName: 'Adder', description: 'Adds two N-bit operands plus Carry-In (cin) to produce Sum and Carry-Out (cout).', defaultAttrs: { facing: 'east', width: 1 } },
  { type: 'Subtractor', category: 'Arithmetic', libId: 3, shortName: 'Subtractor', description: 'Computes A - B - bin, producing Difference and Borrow-Out (bout).', defaultAttrs: { facing: 'east', width: 1 } },
  { type: 'Multiplier', category: 'Arithmetic', libId: 3, shortName: 'Multiplier', description: 'Multiplies two unsigned N-bit integers A and B.', defaultAttrs: { facing: 'east', width: 4 } },
  { type: 'Comparator', category: 'Arithmetic', libId: 3, shortName: 'Comparator', description: 'Compares two N-bit values A and B, outputting A>B, A=B, and A<B.', defaultAttrs: { facing: 'east', width: 4 } },
  { type: 'Negator', category: 'Arithmetic', libId: 3, shortName: 'Negator', description: "Computes the two's complement negation (-A) of an N-bit input.", defaultAttrs: { facing: 'east', width: 4 } },
  { type: 'Shifter', category: 'Arithmetic', libId: 3, shortName: 'Shifter', description: 'Shifts or rotates an N-bit input by a shift distance.', defaultAttrs: { facing: 'east', width: 4, shiftKind: 'll' } },
  // 4: Memory
  { type: 'D Flip-Flop', category: 'Memory', libId: 4, shortName: 'D Flip-Flop', description: 'Captures the D input on the rising edge of Clock and holds it on Q.', defaultAttrs: { facing: 'east' } },
  { type: 'T Flip-Flop', category: 'Memory', libId: 4, shortName: 'T Flip-Flop', description: 'Toggles state Q on the rising edge of Clock when T=1.', defaultAttrs: { facing: 'east' } },
  { type: 'J-K Flip-Flop', category: 'Memory', libId: 4, shortName: 'J-K Flip-Flop', description: 'Universal flip-flop: J=1 sets, K=1 resets, J=K=1 toggles on Clock edge.', defaultAttrs: { facing: 'east' } },
  { type: 'S-R Flip-Flop', category: 'Memory', libId: 4, shortName: 'S-R Flip-Flop', description: 'Set-Reset flip-flop: S=1 sets Q=1, R=1 resets Q=0 on Clock edge.', defaultAttrs: { facing: 'east' } },
  { type: 'Register', category: 'Memory', libId: 4, shortName: 'Register', description: 'Stores an N-bit value on the rising Clock edge when Enable is high.', defaultAttrs: { facing: 'east', width: 4 } },
  { type: 'Counter', category: 'Memory', libId: 4, shortName: 'Counter', description: 'Increments its N-bit value on each rising Clock edge.', defaultAttrs: { facing: 'east', width: 4 } },
  { type: 'ROM', category: 'Memory', libId: 4, shortName: 'ROM', description: 'Read-Only Memory lookup table indexed by an address bus.', defaultAttrs: { facing: 'east', width: 4, selectBits: 4, value: '0,1,2,3,4,5,6,7,8,9,A,B,C,D,E,F' } },
  // 5: Input/Output
  { type: 'Button', category: 'I/O', libId: 5, shortName: 'Button', description: 'Momentary push button that outputs 1 when pressed and 0 when released.', defaultAttrs: { facing: 'east', value: '0' } },
  { type: 'LED', category: 'I/O', libId: 5, shortName: 'LED', description: 'Illuminates when its 1-bit input is High (1).', defaultAttrs: { facing: 'west' } },
  { type: '7-Segment Display', category: 'I/O', libId: 5, shortName: '7-Segment', description: 'Displays segments a–g and decimal point from 7 individual 1-bit inputs.', defaultAttrs: { facing: 'east' } },
  { type: 'Hex Digit Display', category: 'I/O', libId: 5, shortName: 'Hex Display', description: 'Decodes a 4-bit nibble into hexadecimal digits 0–F on a 7-segment display.', defaultAttrs: { facing: 'east' } },
];

/** Rotate a relative offset `(dx, dy)` defined for `east`-facing component to `facing`. */
function rotateOffset(dx: number, dy: number, facing: Facing = 'east'): Point {
  switch (facing) {
    case 'east':
      return { x: dx, y: dy };
    case 'west':
      return { x: -dx, y: -dy };
    case 'south':
      return { x: -dy, y: dx };
    case 'north':
      return { x: dy, y: -dx };
  }
}

function makePin(
  comp: ComponentInstance,
  id: string,
  label: string,
  dir: 'in' | 'out',
  width: number,
  dx: number,
  dy: number,
): PinDef {
  const r = rotateOffset(dx, dy, comp.attrs.facing ?? 'east');
  return {
    id,
    label,
    dir,
    width,
    x: comp.loc.x + r.x,
    y: comp.loc.y + r.y,
  };
}

/**
 * Return the list of pins for `comp`.
 * In Logisim convention, `comp.loc` is typically the primary output pin (for gates/sources)
 * or the primary input pin (for Output Pins / LEDs / Tunnels), snapped to multiples of 10.
 */
export function getComponentPins(comp: ComponentInstance): PinDef[] {
  const w = comp.attrs.width ?? 1;
  const numIn = Math.max(2, comp.attrs.inputs ?? 2);
  const selBits = Math.max(1, Math.min(4, comp.attrs.selectBits ?? 1));

  switch (comp.type) {
    case 'Pin': {
      const isOut = Boolean(comp.attrs.output);
      return [makePin(comp, isOut ? 'in0' : 'out0', comp.attrs.label || (isOut ? 'Out' : 'In'), isOut ? 'in' : 'out', w, 0, 0)];
    }
    case 'Probe':
    case 'LED':
      return [makePin(comp, 'in0', comp.attrs.label || 'In', 'in', comp.type === 'LED' ? 1 : w, 0, 0)];
    case 'Tunnel':
      // Tunnels act as bidirectional passive named-net connectors; we expose a pin at (0,0)
      return [makePin(comp, 'pin0', comp.attrs.label || 'NET', 'in', w, 0, 0)];
    case 'Clock':
    case 'Constant':
    case 'Power':
    case 'Ground':
    case 'Button':
      return [makePin(comp, 'out0', comp.attrs.label || comp.type, 'out', comp.type === 'Constant' ? w : 1, 0, 0)];

    case 'NOT Gate':
    case 'Buffer':
      return [
        makePin(comp, 'in0', 'in', 'in', w, -30, 0),
        makePin(comp, 'out0', 'out', 'out', w, 0, 0),
      ];

    case 'Controlled Buffer':
    case 'Controlled Inverter':
      return [
        makePin(comp, 'in0', 'in', 'in', w, -20, 0),
        makePin(comp, 'en', 'en', 'in', 1, -10, 10),
        makePin(comp, 'out0', 'out', 'out', w, 0, 0),
      ];

    case 'AND Gate':
    case 'OR Gate':
    case 'NAND Gate':
    case 'NOR Gate':
    case 'XOR Gate':
    case 'XNOR Gate':
    case 'Odd Parity':
    case 'Even Parity': {
      const dx = -50;
      const pins: PinDef[] = [];
      const half = Math.floor(numIn / 2);
      for (let i = 0; i < numIn; i++) {
        let dy: number;
        if (numIn % 2 === 0) {
          const offset = i < half ? i - half : i - half + 1;
          dy = offset * 10;
        } else {
          dy = (i - half) * 10;
        }
        pins.push(makePin(comp, `in${i}`, `in${i}`, 'in', w, dx, dy));
      }
      pins.push(makePin(comp, 'out0', 'out', 'out', w, 0, 0));
      return pins;
    }

    case 'Splitter': {
      const branches = Math.max(2, Math.min(8, comp.attrs.inputs ?? w));
      const pins: PinDef[] = [makePin(comp, 'bus', 'bus', 'in', w, 0, 0)];
      for (let i = 0; i < branches; i++) {
        pins.push(makePin(comp, `b${i}`, `bit${i}`, 'out', 1, 20, -((branches - 1) * 10) + i * 10));
      }
      return pins;
    }

    case 'Multiplexer': {
      const count = 1 << selBits;
      const pins: PinDef[] = [];
      const topY = -Math.floor(count / 2) * 10;
      for (let i = 0; i < count; i++) {
        pins.push(makePin(comp, `in${i}`, `D${i}`, 'in', w, -40, topY + i * 10));
      }
      pins.push(makePin(comp, 'sel', 'S', 'in', selBits, -20, topY + count * 10));
      pins.push(makePin(comp, 'out0', 'Y', 'out', w, 0, 0));
      return pins;
    }

    case 'Demultiplexer': {
      const count = 1 << selBits;
      const topY = -Math.floor(count / 2) * 10;
      const pins: PinDef[] = [
        makePin(comp, 'in0', 'D', 'in', w, -40, 0),
        makePin(comp, 'sel', 'S', 'in', selBits, -20, topY + count * 10),
      ];
      for (let i = 0; i < count; i++) {
        pins.push(makePin(comp, `out${i}`, `Y${i}`, 'out', w, 0, topY + i * 10));
      }
      return pins;
    }

    case 'Decoder': {
      const count = 1 << selBits;
      const topY = -Math.floor(count / 2) * 10;
      const pins: PinDef[] = [makePin(comp, 'sel', 'S', 'in', selBits, -20, topY + count * 10)];
      for (let i = 0; i < count; i++) {
        pins.push(makePin(comp, `out${i}`, `Y${i}`, 'out', 1, 0, topY + i * 10));
      }
      return pins;
    }

    case 'Priority Encoder': {
      const count = 1 << selBits;
      const topY = -Math.floor(count / 2) * 10;
      const pins: PinDef[] = [];
      for (let i = 0; i < count; i++) {
        pins.push(makePin(comp, `in${i}`, `D${i}`, 'in', 1, -40, topY + i * 10));
      }
      pins.push(makePin(comp, 'out0', 'Q', 'out', selBits, 0, 0));
      pins.push(makePin(comp, 'any', 'GS', 'out', 1, 0, 10));
      return pins;
    }

    case 'Adder':
    case 'Subtractor':
      return [
        makePin(comp, 'a', 'A', 'in', w, -40, -10),
        makePin(comp, 'b', 'B', 'in', w, -40, 10),
        makePin(comp, 'cin', comp.type === 'Adder' ? 'cin' : 'bin', 'in', 1, -20, -20),
        makePin(comp, 'out0', comp.type === 'Adder' ? 'Sum' : 'Diff', 'out', w, 0, 0),
        makePin(comp, 'cout', comp.type === 'Adder' ? 'cout' : 'bout', 'out', 1, -20, 20),
      ];

    case 'Multiplier':
      return [
        makePin(comp, 'a', 'A', 'in', w, -40, -10),
        makePin(comp, 'b', 'B', 'in', w, -40, 10),
        makePin(comp, 'out0', 'Prod', 'out', w, 0, 0),
      ];

    case 'Comparator':
      return [
        makePin(comp, 'a', 'A', 'in', w, -40, -10),
        makePin(comp, 'b', 'B', 'in', w, -40, 10),
        makePin(comp, 'gt', 'A>B', 'out', 1, 0, -10),
        makePin(comp, 'eq', 'A=B', 'out', 1, 0, 0),
        makePin(comp, 'lt', 'A<B', 'out', 1, 0, 10),
      ];

    case 'Negator':
      return [
        makePin(comp, 'in0', 'A', 'in', w, -40, 0),
        makePin(comp, 'out0', '-A', 'out', w, 0, 0),
      ];

    case 'Shifter': {
      const distBits = Math.max(1, Math.ceil(Math.log2(Math.max(2, w))));
      return [
        makePin(comp, 'a', 'A', 'in', w, -40, -10),
        makePin(comp, 'dist', 'sh', 'in', distBits, -40, 10),
        makePin(comp, 'out0', 'Out', 'out', w, 0, 0),
      ];
    }

    case 'D Flip-Flop':
    case 'T Flip-Flop':
      return [
        makePin(comp, 'clk', 'CLK', 'in', 1, -40, 0),
        makePin(comp, 'd', comp.type === 'D Flip-Flop' ? 'D' : 'T', 'in', 1, -40, 20),
        makePin(comp, 'rst', 'RST', 'in', 1, -20, 30),
        makePin(comp, 'q', 'Q', 'out', 1, 0, 0),
        makePin(comp, 'qn', '~Q', 'out', 1, 0, 20),
      ];

    case 'J-K Flip-Flop':
    case 'S-R Flip-Flop':
      return [
        makePin(comp, 'j', comp.type === 'J-K Flip-Flop' ? 'J' : 'S', 'in', 1, -40, 0),
        makePin(comp, 'clk', 'CLK', 'in', 1, -40, 10),
        makePin(comp, 'k', comp.type === 'J-K Flip-Flop' ? 'K' : 'R', 'in', 1, -40, 20),
        makePin(comp, 'rst', 'RST', 'in', 1, -20, 30),
        makePin(comp, 'q', 'Q', 'out', 1, 0, 0),
        makePin(comp, 'qn', '~Q', 'out', 1, 0, 20),
      ];

    case 'Register':
      return [
        makePin(comp, 'd', 'D', 'in', w, -40, 0),
        makePin(comp, 'en', 'EN', 'in', 1, -40, 10),
        makePin(comp, 'clk', 'CLK', 'in', 1, -20, 20),
        makePin(comp, 'rst', 'RST', 'in', 1, -10, 20),
        makePin(comp, 'q', 'Q', 'out', w, 0, 0),
      ];

    case 'Counter':
      return [
        makePin(comp, 'clk', 'CLK', 'in', 1, -20, 20),
        makePin(comp, 'rst', 'RST', 'in', 1, -10, 20),
        makePin(comp, 'q', 'Q', 'out', w, 0, 0),
        makePin(comp, 'cout', 'ovf', 'out', 1, 0, 10),
      ];

    case 'ROM': {
      const addrBits = Math.max(1, Math.min(8, comp.attrs.selectBits ?? 4));
      return [
        makePin(comp, 'addr', 'A', 'in', addrBits, -40, 0),
        makePin(comp, 'out0', 'D', 'out', w, 0, 0),
      ];
    }

    case '7-Segment Display':
      return [
        makePin(comp, 'seg_g', 'g', 'in', 1, 0, 0),
        makePin(comp, 'seg_f', 'f', 'in', 1, 10, 0),
        makePin(comp, 'seg_a', 'a', 'in', 1, 20, 0),
        makePin(comp, 'seg_b', 'b', 'in', 1, 30, 0),
        makePin(comp, 'seg_e', 'e', 'in', 1, 0, 60),
        makePin(comp, 'seg_d', 'd', 'in', 1, 10, 60),
        makePin(comp, 'seg_c', 'c', 'in', 1, 20, 60),
        makePin(comp, 'seg_dp', 'dp', 'in', 1, 30, 60),
      ];

    case 'Hex Digit Display':
      return [
        makePin(comp, 'in0', 'Hex', 'in', 4, 10, 60),
        makePin(comp, 'dp', 'dp', 'in', 1, 20, 60),
      ];
  }
}

export interface SequentialMemoryState {
  /** Stored integer value per sequential component ID */
  values: Record<string, number>;
  /** Previous clock pin bit state ('0' | '1') for rising-edge detection */
  prevClock: Record<string, BitState>;
}

export function createEmptyMemoryState(): SequentialMemoryState {
  return { values: {}, prevClock: {} };
}

export interface ComponentEvalResult {
  outputs: Record<string, LogicValue>;
  explanation: string;
}

/**
 * Deterministically evaluate a component's outputs from its current input pin values and sequential state.
 */
export function evaluateComponent(
  comp: ComponentInstance,
  inputs: Record<string, LogicValue>,
  memState: SequentialMemoryState,
): ComponentEvalResult {
  const w = comp.attrs.width ?? 1;
  const label = comp.attrs.label ? `${comp.type} "${comp.attrs.label}"` : comp.type;

  switch (comp.type) {
    case 'Pin': {
      if (comp.attrs.output) {
        const v = inputs.in0 ?? floatingValue(w);
        return {
          outputs: {},
          explanation: `Output Pin ${comp.attrs.label || comp.id} reads ${valueToDisplayString(v)}.`,
        };
      }
      const val = valueFromString(comp.attrs.value ?? '0', w);
      return {
        outputs: { out0: val },
        explanation: `Input Pin ${comp.attrs.label || comp.id} is set to ${valueToDisplayString(val)}.`,
      };
    }

    case 'Probe':
    case 'LED':
    case 'Tunnel':
    case '7-Segment Display':
    case 'Hex Digit Display':
      return {
        outputs: {},
        explanation: `${label} displays its input signal.`,
      };

    case 'Clock': {
      const bit: BitState = comp.attrs.value === '1' ? '1' : '0';
      const val = createValue([bit]);
      return {
        outputs: { out0: val },
        explanation: `Clock ${comp.attrs.label || comp.id} is currently ${bit === '1' ? 'High (1)' : 'Low (0)'}.`,
      };
    }

    case 'Button': {
      const bit: BitState = comp.attrs.value === '1' ? '1' : '0';
      return {
        outputs: { out0: createValue([bit]) },
        explanation: `Button ${comp.attrs.label || comp.id} is ${bit === '1' ? 'pressed (1)' : 'released (0)'}.`,
      };
    }

    case 'Constant': {
      const val = valueFromString(comp.attrs.value ?? '1', w);
      return {
        outputs: { out0: val },
        explanation: `Constant supplies fixed value ${valueToDisplayString(val)}.`,
      };
    }

    case 'Power':
      return {
        outputs: { out0: valueFromInt((1 << w) - 1, w) },
        explanation: 'Power source supplies constant logic 1.',
      };

    case 'Ground':
      return {
        outputs: { out0: valueFromInt(0, w) },
        explanation: 'Ground supplies constant logic 0.',
      };

    case 'Splitter': {
      const branches = Math.max(2, Math.min(8, comp.attrs.inputs ?? w));
      const busVal = inputs.bus ?? floatingValue(w);
      const outputs: Record<string, LogicValue> = {};
      for (let i = 0; i < branches; i++) {
        outputs[`b${i}`] = createValue([busVal.bits[i] ?? 'Z']);
      }
      return {
        outputs,
        explanation: `Splitter unpacks ${w}-bit bus (${valueToDisplayString(busVal)}) into individual bit lines.`,
      };
    }

    case 'NOT Gate':
    case 'Buffer': {
      const inVal = inputs.in0 ?? floatingValue(w);
      const outVal = evaluateGateBits(comp.type === 'NOT Gate' ? 'NOT' : 'BUF', [inVal], w);
      return {
        outputs: { out0: outVal },
        explanation:
          comp.type === 'NOT Gate'
            ? `${label} inverts input ${valueToDisplayString(inVal)} → ${valueToDisplayString(outVal)}.`
            : `${label} buffers input ${valueToDisplayString(inVal)} → ${valueToDisplayString(outVal)}.`,
      };
    }

    case 'Controlled Buffer':
    case 'Controlled Inverter': {
      const inVal = inputs.in0 ?? floatingValue(w);
      const enBit = (inputs.en ?? floatingValue(1)).bits[0];
      if (enBit === '0') {
        const z = floatingValue(w);
        return {
          outputs: { out0: z },
          explanation: `${label} has Enable=0, so its output is disconnected (Floating Z).`,
        };
      }
      if (enBit === '1') {
        const outVal = evaluateGateBits(comp.type === 'Controlled Inverter' ? 'NOT' : 'BUF', [inVal], w);
        return {
          outputs: { out0: outVal },
          explanation: `${label} has Enable=1, passing ${valueToDisplayString(outVal)}.`,
        };
      }
      return {
        outputs: { out0: errorValue(w) },
        explanation: `${label} has an invalid/floating Enable (${enBit}), producing Error (E).`,
      };
    }

    case 'AND Gate':
    case 'OR Gate':
    case 'NAND Gate':
    case 'NOR Gate':
    case 'XOR Gate':
    case 'XNOR Gate':
    case 'Odd Parity':
    case 'Even Parity': {
      const numIn = Math.max(2, comp.attrs.inputs ?? 2);
      const inList: LogicValue[] = [];
      for (let i = 0; i < numIn; i++) {
        inList.push(inputs[`in${i}`] ?? floatingValue(w));
      }
      const kindMap: Record<string, 'AND' | 'OR' | 'NAND' | 'NOR' | 'XOR' | 'XNOR' | 'ODD' | 'EVEN'> = {
        'AND Gate': 'AND',
        'OR Gate': 'OR',
        'NAND Gate': 'NAND',
        'NOR Gate': 'NOR',
        'XOR Gate': 'XOR',
        'XNOR Gate': 'XNOR',
        'Odd Parity': 'ODD',
        'Even Parity': 'EVEN',
      };
      const outVal = evaluateGateBits(kindMap[comp.type], inList, w);
      const formattedInputs = inList.map((v, idx) => `in${idx}=${valueToDisplayString(v)}`).join(', ');
      return {
        outputs: { out0: outVal },
        explanation: `${label} (${formattedInputs}) evaluates to ${valueToDisplayString(outVal)}.`,
      };
    }

    case 'Multiplexer': {
      const selBits = Math.max(1, Math.min(4, comp.attrs.selectBits ?? 1));
      const selVal = inputs.sel ?? floatingValue(selBits);
      const selIdx = valueToInt(selVal);
      if (selIdx === null) {
        return {
          outputs: { out0: errorValue(w) },
          explanation: `${label} select input S=${valueToDisplayString(selVal)} is undefined, outputting Error (E).`,
        };
      }
      const chosen = inputs[`in${selIdx}`] ?? floatingValue(w);
      return {
        outputs: { out0: chosen },
        explanation: `${label} select S=${selIdx} routes input D${selIdx} (${valueToDisplayString(chosen)}) to output Y.`,
      };
    }

    case 'Demultiplexer': {
      const selBits = Math.max(1, Math.min(4, comp.attrs.selectBits ?? 1));
      const count = 1 << selBits;
      const selVal = inputs.sel ?? floatingValue(selBits);
      const selIdx = valueToInt(selVal);
      const dataVal = inputs.in0 ?? floatingValue(w);
      const outputs: Record<string, LogicValue> = {};
      for (let i = 0; i < count; i++) {
        outputs[`out${i}`] = selIdx === null ? errorValue(w) : i === selIdx ? dataVal : valueFromInt(0, w);
      }
      return {
        outputs,
        explanation:
          selIdx === null
            ? `${label} select S is undefined.`
            : `${label} select S=${selIdx} routes D (${valueToDisplayString(dataVal)}) to Y${selIdx}.`,
      };
    }

    case 'Decoder': {
      const selBits = Math.max(1, Math.min(4, comp.attrs.selectBits ?? 2));
      const count = 1 << selBits;
      const selVal = inputs.sel ?? floatingValue(selBits);
      const selIdx = valueToInt(selVal);
      const outputs: Record<string, LogicValue> = {};
      for (let i = 0; i < count; i++) {
        outputs[`out${i}`] = selIdx === null ? errorValue(1) : valueFromInt(i === selIdx ? 1 : 0, 1);
      }
      return {
        outputs,
        explanation:
          selIdx === null
            ? `${label} select S is undefined.`
            : `${label} decodes S=${selIdx} by asserting output Y${selIdx}=1.`,
      };
    }

    case 'Priority Encoder': {
      const selBits = Math.max(1, Math.min(4, comp.attrs.selectBits ?? 2));
      const count = 1 << selBits;
      let highest = -1;
      for (let i = count - 1; i >= 0; i--) {
        const b = (inputs[`in${i}`] ?? floatingValue(1)).bits[0];
        if (b === '1') {
          highest = i;
          break;
        }
      }
      if (highest >= 0) {
        return {
          outputs: { out0: valueFromInt(highest, selBits), any: valueFromInt(1, 1) },
          explanation: `${label} encodes highest active input D${highest}=1 as ${highest}.`,
        };
      }
      return {
        outputs: { out0: floatingValue(selBits), any: valueFromInt(0, 1) },
        explanation: `${label} has no active inputs, so GS=0 and Q=Z.`,
      };
    }

    case 'Adder':
    case 'Subtractor': {
      const aVal = inputs.a ?? floatingValue(w);
      const bVal = inputs.b ?? floatingValue(w);
      const cinVal = inputs.cin ?? valueFromInt(0, 1);
      const aInt = valueToInt(aVal);
      const bInt = valueToInt(bVal);
      const cBit = cinVal.bits[0] === 'Z' ? 0 : cinVal.bits[0] === '1' ? 1 : cinVal.bits[0] === '0' ? 0 : null;
      if (aInt === null || bInt === null || cBit === null) {
        return {
          outputs: { out0: errorValue(w), cout: errorValue(1) },
          explanation: `${label} requires defined operands A and B.`,
        };
      }
      if (comp.type === 'Adder') {
        const total = aInt + bInt + cBit;
        const mask = w >= 32 ? 0xffffffff : (1 << w) - 1;
        const sum = total & mask;
        const cout = total > mask ? 1 : 0;
        return {
          outputs: { out0: valueFromInt(sum, w), cout: valueFromInt(cout, 1) },
          explanation: `${label} computes ${aInt} + ${bInt} + ${cBit} = ${sum} (cout=${cout}).`,
        };
      } else {
        const mask = w >= 32 ? 0xffffffff : (1 << w) - 1;
        const raw = aInt - bInt - cBit;
        const diff = raw & mask;
        const bout = raw < 0 ? 1 : 0;
        return {
          outputs: { out0: valueFromInt(diff, w), cout: valueFromInt(bout, 1) },
          explanation: `${label} computes ${aInt} - ${bInt} - ${cBit} = ${diff} (bout=${bout}).`,
        };
      }
    }

    case 'Multiplier': {
      const aInt = valueToInt(inputs.a ?? floatingValue(w));
      const bInt = valueToInt(inputs.b ?? floatingValue(w));
      if (aInt === null || bInt === null) {
        return { outputs: { out0: errorValue(w) }, explanation: `${label} operands are undefined.` };
      }
      const prod = Math.imul(aInt, bInt);
      return {
        outputs: { out0: valueFromInt(prod, w) },
        explanation: `${label} computes ${aInt} × ${bInt} = ${valueToDisplayString(valueFromInt(prod, w))}.`,
      };
    }

    case 'Comparator': {
      const aInt = valueToSignedInt(inputs.a ?? floatingValue(w));
      const bInt = valueToSignedInt(inputs.b ?? floatingValue(w));
      if (aInt === null || bInt === null) {
        return {
          outputs: { gt: errorValue(1), eq: errorValue(1), lt: errorValue(1) },
          explanation: `${label} inputs are undefined.`,
        };
      }
      return {
        outputs: {
          gt: valueFromInt(aInt > bInt ? 1 : 0, 1),
          eq: valueFromInt(aInt === bInt ? 1 : 0, 1),
          lt: valueFromInt(aInt < bInt ? 1 : 0, 1),
        },
        explanation: `${label} compares A=${aInt} vs B=${bInt}: A>B is ${aInt > bInt ? 1 : 0}, A=B is ${aInt === bInt ? 1 : 0}, A<B is ${aInt < bInt ? 1 : 0}.`,
      };
    }

    case 'Negator': {
      const aInt = valueToInt(inputs.in0 ?? floatingValue(w));
      if (aInt === null) {
        return { outputs: { out0: errorValue(w) }, explanation: `${label} input is undefined.` };
      }
      const neg = -aInt;
      return {
        outputs: { out0: valueFromInt(neg, w) },
        explanation: `${label} computes two's complement -(${aInt}) = ${valueToDisplayString(valueFromInt(neg, w))}.`,
      };
    }

    case 'Shifter': {
      const aInt = valueToInt(inputs.a ?? floatingValue(w));
      const dist = valueToInt(inputs.dist ?? valueFromInt(0, 1));
      if (aInt === null || dist === null) {
        return { outputs: { out0: errorValue(w) }, explanation: `${label} inputs are undefined.` };
      }
      const kind = comp.attrs.shiftKind ?? 'll';
      let shifted = aInt;
      if (kind === 'll') shifted = aInt << dist;
      else if (kind === 'lr') shifted = aInt >>> dist;
      else if (kind === 'ar') {
        const signed = valueToSignedInt(inputs.a ?? floatingValue(w)) ?? 0;
        shifted = signed >> dist;
      }
      return {
        outputs: { out0: valueFromInt(shifted, w) },
        explanation: `${label} shifts ${aInt} by ${dist} bits → ${valueToDisplayString(valueFromInt(shifted, w))}.`,
      };
    }

    case 'D Flip-Flop':
    case 'T Flip-Flop':
    case 'J-K Flip-Flop':
    case 'S-R Flip-Flop': {
      const rst = (inputs.rst ?? valueFromInt(0, 1)).bits[0];
      const stored = rst === '1' ? 0 : (memState.values[comp.id] ?? 0) & 1;
      const qBit: BitState = stored === 1 ? '1' : '0';
      return {
        outputs: {
          q: createValue([qBit]),
          qn: createValue([bitNot(qBit)]),
        },
        explanation: `${label} holds state Q=${qBit} (~Q=${bitNot(qBit)}).`,
      };
    }

    case 'Register': {
      const rst = (inputs.rst ?? valueFromInt(0, 1)).bits[0];
      const stored = rst === '1' ? 0 : memState.values[comp.id] ?? 0;
      const qVal = valueFromInt(stored, w);
      return {
        outputs: { q: qVal },
        explanation: `${label} holds stored value ${valueToDisplayString(qVal)}.`,
      };
    }

    case 'Counter': {
      const rst = (inputs.rst ?? valueFromInt(0, 1)).bits[0];
      const stored = rst === '1' ? 0 : memState.values[comp.id] ?? 0;
      const mask = w >= 32 ? 0xffffffff : (1 << w) - 1;
      const qVal = valueFromInt(stored & mask, w);
      const ovf = (stored & mask) === mask ? 1 : 0;
      return {
        outputs: { q: qVal, cout: valueFromInt(ovf, 1) },
        explanation: `${label} count is ${stored & mask} (${valueToDisplayString(qVal)}).`,
      };
    }

    case 'ROM': {
      const addrBits = Math.max(1, Math.min(8, comp.attrs.selectBits ?? 4));
      const addr = valueToInt(inputs.addr ?? floatingValue(addrBits));
      if (addr === null) {
        return { outputs: { out0: errorValue(w) }, explanation: `${label} address bus is undefined.` };
      }
      const words = (comp.attrs.value ?? '0').split(/[\s,]+/).map((s) => parseInt(s, 16));
      const word = Number.isNaN(words[addr] ?? 0) ? 0 : words[addr] ?? 0;
      const outVal = valueFromInt(word, w);
      return {
        outputs: { out0: outVal },
        explanation: `${label} reads address ${addr} → ${valueToDisplayString(outVal)}.`,
      };
    }
  }
}

/**
 * Update sequential state (`memState`) on a clock step or asynchronous reset.
 * Detects rising clock edges (`prevClock === '0'` and current `clk === '1'`).
 */
export function updateSequentialState(
  comp: ComponentInstance,
  inputs: Record<string, LogicValue>,
  memState: SequentialMemoryState,
): SequentialMemoryState {
  const w = comp.attrs.width ?? 1;
  const clkBit = (inputs.clk ?? valueFromInt(0, 1)).bits[0];
  const rstBit = (inputs.rst ?? valueFromInt(0, 1)).bits[0];
  const prevClk = memState.prevClock[comp.id] ?? '0';
  const risingEdge = prevClk === '0' && clkBit === '1';

  const nextValues = { ...memState.values };
  const nextPrevClock = { ...memState.prevClock, [comp.id]: clkBit };

  if (rstBit === '1') {
    nextValues[comp.id] = 0;
    return { values: nextValues, prevClock: nextPrevClock };
  }

  const cur = nextValues[comp.id] ?? 0;

  if (risingEdge) {
    if (comp.type === 'D Flip-Flop') {
      const dBit = (inputs.d ?? valueFromInt(0, 1)).bits[0];
      if (dBit === '0' || dBit === '1') nextValues[comp.id] = dBit === '1' ? 1 : 0;
    } else if (comp.type === 'T Flip-Flop') {
      const tBit = (inputs.d ?? valueFromInt(1, 1)).bits[0];
      if (tBit === '1' || tBit === 'Z') nextValues[comp.id] = cur ^ 1;
    } else if (comp.type === 'J-K Flip-Flop') {
      const j = (inputs.j ?? valueFromInt(0, 1)).bits[0] === '1';
      const k = (inputs.k ?? valueFromInt(0, 1)).bits[0] === '1';
      if (j && k) nextValues[comp.id] = cur ^ 1;
      else if (j) nextValues[comp.id] = 1;
      else if (k) nextValues[comp.id] = 0;
    } else if (comp.type === 'S-R Flip-Flop') {
      const s = (inputs.j ?? valueFromInt(0, 1)).bits[0] === '1';
      const r = (inputs.k ?? valueFromInt(0, 1)).bits[0] === '1';
      if (s && !r) nextValues[comp.id] = 1;
      else if (!s && r) nextValues[comp.id] = 0;
    } else if (comp.type === 'Register') {
      const enBit = (inputs.en ?? valueFromInt(1, 1)).bits[0];
      if (enBit === '1' || enBit === 'Z') {
        const dInt = valueToInt(inputs.d ?? valueFromInt(0, w));
        if (dInt !== null) nextValues[comp.id] = dInt;
      }
    } else if (comp.type === 'Counter') {
      const mask = w >= 32 ? 0xffffffff : (1 << w) - 1;
      nextValues[comp.id] = (cur + 1) & mask;
    }
  }

  return { values: nextValues, prevClock: nextPrevClock };
}
