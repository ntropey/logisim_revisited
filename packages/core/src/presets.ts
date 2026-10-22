/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * Canonical reference circuits and date-seeded Daily Logic Challenges.
 */

import type { TruthTable } from './analyzer';
import type { Circuit } from './simulator';

export interface PresetCircuit {
  slug: string;
  name: string;
  category: 'Combinational' | 'Arithmetic' | 'Plexers' | 'Sequential' | 'Displays' | 'Debugging';
  level: 'Easy' | 'Medium' | 'Hard' | 'Unfair' | 'Extreme';
  score: number;
  summary: string;
  circuit: Circuit;
  truthTable?: TruthTable;
}

export interface LogicChallenge {
  id: string;
  title: string;
  level: number; // 1..5
  score: number;
  goal: string;
  inputNames: string[];
  outputNames: string[];
  expectedFn: (inputs: Record<string, number>) => Record<string, number>;
  starterCircuit: Circuit;
  solutionCircuit: Circuit;
  coachStages: {
    label: string;
    text: string;
    highlightComponents: string[];
  }[];
}

export const PRESET_CIRCUITS: readonly PresetCircuit[] = [
  {
    slug: 'half-adder',
    name: 'Half Adder',
    category: 'Arithmetic',
    level: 'Easy',
    score: 100,
    summary: 'Adds two 1-bit inputs A and B using an XOR gate for Sum and an AND gate for Carry.',
    truthTable: {
      vars: ['A', 'B'],
      outName: 'Sum',
      rows: ['0', '1', '1', '0'],
    },
    circuit: {
      name: 'Half Adder',
      components: [
        { id: 'in_a', type: 'Pin', loc: { x: 80, y: 80 }, attrs: { facing: 'east', width: 1, output: false, label: 'A', value: '1' } },
        { id: 'in_b', type: 'Pin', loc: { x: 80, y: 140 }, attrs: { facing: 'east', width: 1, output: false, label: 'B', value: '1' } },
        { id: 'xor1', type: 'XOR Gate', loc: { x: 220, y: 90 }, attrs: { facing: 'east', width: 1, inputs: 2, label: 'XOR' } },
        { id: 'and1', type: 'AND Gate', loc: { x: 220, y: 150 }, attrs: { facing: 'east', width: 1, inputs: 2, label: 'AND' } },
        { id: 'out_sum', type: 'Pin', loc: { x: 290, y: 90 }, attrs: { facing: 'west', width: 1, output: true, label: 'Sum' } },
        { id: 'out_carry', type: 'Pin', loc: { x: 290, y: 150 }, attrs: { facing: 'west', width: 1, output: true, label: 'Carry' } },
      ],
      wires: [
        { id: 'w1', from: { x: 80, y: 80 }, to: { x: 140, y: 80 } },
        { id: 'w2', from: { x: 140, y: 80 }, to: { x: 170, y: 80 } },
        { id: 'w3', from: { x: 140, y: 80 }, to: { x: 140, y: 140 } },
        { id: 'w4', from: { x: 140, y: 140 }, to: { x: 170, y: 140 } },
        { id: 'w5', from: { x: 80, y: 140 }, to: { x: 120, y: 140 } },
        { id: 'w6', from: { x: 120, y: 140 }, to: { x: 120, y: 100 } },
        { id: 'w7', from: { x: 120, y: 100 }, to: { x: 170, y: 100 } },
        { id: 'w8', from: { x: 120, y: 140 }, to: { x: 120, y: 160 } },
        { id: 'w9', from: { x: 120, y: 160 }, to: { x: 170, y: 160 } },
        { id: 'w10', from: { x: 220, y: 90 }, to: { x: 290, y: 90 } },
        { id: 'w11', from: { x: 220, y: 150 }, to: { x: 290, y: 150 } },
      ],
    },
  },
  {
    slug: 'full-adder',
    name: 'Full Adder',
    category: 'Arithmetic',
    level: 'Medium',
    score: 240,
    summary: 'Adds three 1-bit inputs (A, B, and Carry-In Cin) using two cascaded XOR stages and carry-lookahead AND/OR gates.',
    truthTable: {
      vars: ['A', 'B', 'Cin'],
      outName: 'Sum',
      rows: ['0', '1', '1', '0', '1', '0', '0', '1'],
    },
    circuit: {
      name: 'Full Adder',
      components: [
        { id: 'in_a', type: 'Pin', loc: { x: 60, y: 60 }, attrs: { facing: 'east', width: 1, output: false, label: 'A', value: '1' } },
        { id: 'in_b', type: 'Pin', loc: { x: 60, y: 100 }, attrs: { facing: 'east', width: 1, output: false, label: 'B', value: '1' } },
        { id: 'in_cin', type: 'Pin', loc: { x: 60, y: 150 }, attrs: { facing: 'east', width: 1, output: false, label: 'Cin', value: '0' } },
        { id: 'xor1', type: 'XOR Gate', loc: { x: 170, y: 70 }, attrs: { facing: 'east', width: 1, inputs: 2, label: 'XOR1' } },
        { id: 'xor2', type: 'XOR Gate', loc: { x: 280, y: 80 }, attrs: { facing: 'east', width: 1, inputs: 2, label: 'XOR2' } },
        { id: 'and1', type: 'AND Gate', loc: { x: 280, y: 140 }, attrs: { facing: 'east', width: 1, inputs: 2, label: 'AND1' } },
        { id: 'and2', type: 'AND Gate', loc: { x: 170, y: 200 }, attrs: { facing: 'east', width: 1, inputs: 2, label: 'AND2' } },
        { id: 'or1', type: 'OR Gate', loc: { x: 370, y: 170 }, attrs: { facing: 'east', width: 1, inputs: 2, label: 'OR1' } },
        { id: 'out_sum', type: 'Pin', loc: { x: 420, y: 80 }, attrs: { facing: 'west', width: 1, output: true, label: 'Sum' } },
        { id: 'out_cout', type: 'Pin', loc: { x: 420, y: 170 }, attrs: { facing: 'west', width: 1, output: true, label: 'Cout' } },
      ],
      wires: [
        // A to xor1.in0 (120,60) and and2.in0 (120,190)
        { id: 'w1', from: { x: 60, y: 60 }, to: { x: 100, y: 60 } },
        { id: 'w2', from: { x: 100, y: 60 }, to: { x: 120, y: 60 } },
        { id: 'w3', from: { x: 100, y: 60 }, to: { x: 100, y: 190 } },
        { id: 'w4', from: { x: 100, y: 190 }, to: { x: 120, y: 190 } },
        // B to xor1.in1 (120,80) and and2.in1 (120,210)
        { id: 'w5', from: { x: 60, y: 100 }, to: { x: 80, y: 100 } },
        { id: 'w6', from: { x: 80, y: 100 }, to: { x: 80, y: 80 } },
        { id: 'w7', from: { x: 80, y: 80 }, to: { x: 120, y: 80 } },
        { id: 'w8', from: { x: 80, y: 100 }, to: { x: 80, y: 210 } },
        { id: 'w9', from: { x: 80, y: 210 }, to: { x: 120, y: 210 } },
        // xor1.out (170,70) to xor2.in0 (230,70) and and1.in0 (230,130)
        { id: 'w10', from: { x: 170, y: 70 }, to: { x: 200, y: 70 } },
        { id: 'w11', from: { x: 200, y: 70 }, to: { x: 230, y: 70 } },
        { id: 'w12', from: { x: 200, y: 70 }, to: { x: 200, y: 130 } },
        { id: 'w13', from: { x: 200, y: 130 }, to: { x: 230, y: 130 } },
        // Cin (60,150) to xor2.in1 (230,90) and and1.in1 (230,150)
        { id: 'w14', from: { x: 60, y: 150 }, to: { x: 210, y: 150 } },
        { id: 'w15', from: { x: 210, y: 150 }, to: { x: 230, y: 150 } },
        { id: 'w16', from: { x: 210, y: 150 }, to: { x: 210, y: 90 } },
        { id: 'w17', from: { x: 210, y: 90 }, to: { x: 230, y: 90 } },
        // xor2.out (280,80) to Sum (420,80)
        { id: 'w18', from: { x: 280, y: 80 }, to: { x: 420, y: 80 } },
        // and1.out (280,140) to or1.in0 (320,160)
        { id: 'w19', from: { x: 280, y: 140 }, to: { x: 300, y: 140 } },
        { id: 'w20', from: { x: 300, y: 140 }, to: { x: 300, y: 160 } },
        { id: 'w21', from: { x: 300, y: 160 }, to: { x: 320, y: 160 } },
        // and2.out (170,200) to or1.in1 (320,180)
        { id: 'w22', from: { x: 170, y: 200 }, to: { x: 300, y: 200 } },
        { id: 'w23', from: { x: 300, y: 200 }, to: { x: 300, y: 180 } },
        { id: 'w24', from: { x: 300, y: 180 }, to: { x: 320, y: 180 } },
        // or1.out (370,170) to Cout (420,170)
        { id: 'w25', from: { x: 370, y: 170 }, to: { x: 420, y: 170 } },
      ],
    },
  },
  {
    slug: 'multiplexer',
    name: '2-to-1 Multiplexer (Gate-Level)',
    category: 'Plexers',
    level: 'Medium',
    score: 200,
    summary: 'Selects between inputs D0 and D1 based on Select line S: Y = (~S · D0) + (S · D1).',
    truthTable: {
      vars: ['S', 'D0', 'D1'],
      outName: 'Y',
      rows: ['0', '0', '1', '1', '0', '1', '0', '1'],
    },
    circuit: {
      name: '2-to-1 Multiplexer',
      components: [
        { id: 'in_d0', type: 'Pin', loc: { x: 60, y: 70 }, attrs: { facing: 'east', width: 1, output: false, label: 'D0', value: '1' } },
        { id: 'in_d1', type: 'Pin', loc: { x: 60, y: 150 }, attrs: { facing: 'east', width: 1, output: false, label: 'D1', value: '0' } },
        { id: 'in_s', type: 'Pin', loc: { x: 60, y: 210 }, attrs: { facing: 'east', width: 1, output: false, label: 'S', value: '0' } },
        { id: 'not_s', type: 'NOT Gate', loc: { x: 150, y: 90 }, attrs: { facing: 'east', width: 1 } },
        { id: 'and0', type: 'AND Gate', loc: { x: 230, y: 80 }, attrs: { facing: 'east', width: 1, inputs: 2, label: 'AND0' } },
        { id: 'and1', type: 'AND Gate', loc: { x: 230, y: 160 }, attrs: { facing: 'east', width: 1, inputs: 2, label: 'AND1' } },
        { id: 'or1', type: 'OR Gate', loc: { x: 330, y: 120 }, attrs: { facing: 'east', width: 1, inputs: 2, label: 'OR' } },
        { id: 'out_y', type: 'Pin', loc: { x: 390, y: 120 }, attrs: { facing: 'west', width: 1, output: true, label: 'Y' } },
      ],
      wires: [
        { id: 'w1', from: { x: 60, y: 70 }, to: { x: 180, y: 70 } },
        { id: 'w2', from: { x: 60, y: 150 }, to: { x: 180, y: 150 } },
        { id: 'w3', from: { x: 60, y: 210 }, to: { x: 100, y: 210 } },
        { id: 'w4', from: { x: 100, y: 210 }, to: { x: 100, y: 90 } },
        { id: 'w5', from: { x: 100, y: 90 }, to: { x: 120, y: 90 } },
        { id: 'w6', from: { x: 150, y: 90 }, to: { x: 180, y: 90 } },
        { id: 'w7', from: { x: 100, y: 210 }, to: { x: 100, y: 170 } },
        { id: 'w8', from: { x: 100, y: 170 }, to: { x: 180, y: 170 } },
        { id: 'w9', from: { x: 230, y: 80 }, to: { x: 260, y: 80 } },
        { id: 'w10', from: { x: 260, y: 80 }, to: { x: 260, y: 110 } },
        { id: 'w11', from: { x: 260, y: 110 }, to: { x: 280, y: 110 } },
        { id: 'w12', from: { x: 230, y: 160 }, to: { x: 260, y: 160 } },
        { id: 'w13', from: { x: 260, y: 160 }, to: { x: 260, y: 130 } },
        { id: 'w14', from: { x: 260, y: 130 }, to: { x: 280, y: 130 } },
        { id: 'w15', from: { x: 330, y: 120 }, to: { x: 390, y: 120 } },
      ],
    },
  },
  {
    slug: '4-bit-alu',
    name: '4-Bit Arithmetic Logic Unit (ALU)',
    category: 'Arithmetic',
    level: 'Hard',
    score: 420,
    summary: 'Computes 4-bit A + B, A - B, A AND B, or A OR B selected by a 2-bit Opcode (Op) feeding a 4-to-1 Multiplexer.',
    circuit: {
      name: '4-Bit ALU',
      components: [
        { id: 'in_a', type: 'Pin', loc: { x: 70, y: 70 }, attrs: { facing: 'east', width: 4, output: false, label: 'A', value: '0101' } },
        { id: 'in_b', type: 'Pin', loc: { x: 70, y: 130 }, attrs: { facing: 'east', width: 4, output: false, label: 'B', value: '0011' } },
        { id: 'in_op', type: 'Pin', loc: { x: 240, y: 220 }, attrs: { facing: 'east', width: 2, output: false, label: 'Op', value: '00' } },
        { id: 'tun_a0', type: 'Tunnel', loc: { x: 90, y: 70 }, attrs: { facing: 'east', width: 4, label: 'A' } },
        { id: 'tun_b0', type: 'Tunnel', loc: { x: 90, y: 130 }, attrs: { facing: 'east', width: 4, label: 'B' } },
        // Adder
        { id: 'ta1', type: 'Tunnel', loc: { x: 140, y: 60 }, attrs: { facing: 'west', width: 4, label: 'A' } },
        { id: 'tb1', type: 'Tunnel', loc: { x: 140, y: 80 }, attrs: { facing: 'west', width: 4, label: 'B' } },
        { id: 'add1', type: 'Adder', loc: { x: 190, y: 70 }, attrs: { facing: 'east', width: 4 } },
        // Subtractor
        { id: 'ta2', type: 'Tunnel', loc: { x: 140, y: 120 }, attrs: { facing: 'west', width: 4, label: 'A' } },
        { id: 'tb2', type: 'Tunnel', loc: { x: 140, y: 140 }, attrs: { facing: 'west', width: 4, label: 'B' } },
        { id: 'sub1', type: 'Subtractor', loc: { x: 190, y: 130 }, attrs: { facing: 'east', width: 4 } },
        // Bitwise AND
        { id: 'ta3', type: 'Tunnel', loc: { x: 130, y: 180 }, attrs: { facing: 'west', width: 4, label: 'A' } },
        { id: 'tb3', type: 'Tunnel', loc: { x: 130, y: 200 }, attrs: { facing: 'west', width: 4, label: 'B' } },
        { id: 'and1', type: 'AND Gate', loc: { x: 190, y: 190 }, attrs: { facing: 'east', width: 4, inputs: 2 } },
        // Bitwise OR
        { id: 'ta4', type: 'Tunnel', loc: { x: 130, y: 240 }, attrs: { facing: 'west', width: 4, label: 'A' } },
        { id: 'tb4', type: 'Tunnel', loc: { x: 130, y: 260 }, attrs: { facing: 'west', width: 4, label: 'B' } },
        { id: 'or1', type: 'OR Gate', loc: { x: 190, y: 250 }, attrs: { facing: 'east', width: 4, inputs: 2 } },
        // 4:1 MUX at (320, 140) -> in0=(280,120), in1=(280,130), in2=(280,140), in3=(280,150), sel=(300,160)
        { id: 'mux1', type: 'Multiplexer', loc: { x: 320, y: 140 }, attrs: { facing: 'east', width: 4, selectBits: 2, label: 'ALU_MUX' } },
        { id: 'out_res', type: 'Pin', loc: { x: 380, y: 140 }, attrs: { facing: 'west', width: 4, output: true, label: 'Result' } },
      ],
      wires: [
        { id: 'w1', from: { x: 70, y: 70 }, to: { x: 90, y: 70 } },
        { id: 'w2', from: { x: 70, y: 130 }, to: { x: 90, y: 130 } },
        { id: 'w3', from: { x: 140, y: 60 }, to: { x: 150, y: 60 } },
        { id: 'w4', from: { x: 140, y: 80 }, to: { x: 150, y: 80 } },
        { id: 'w5', from: { x: 140, y: 120 }, to: { x: 150, y: 120 } },
        { id: 'w6', from: { x: 140, y: 140 }, to: { x: 150, y: 140 } },
        { id: 'w7', from: { x: 130, y: 180 }, to: { x: 140, y: 180 } },
        { id: 'w8', from: { x: 130, y: 200 }, to: { x: 140, y: 200 } },
        { id: 'w9', from: { x: 130, y: 240 }, to: { x: 140, y: 240 } },
        { id: 'w10', from: { x: 130, y: 260 }, to: { x: 140, y: 260 } },
        // Connect outputs to MUX inputs
        { id: 'w11', from: { x: 190, y: 70 }, to: { x: 250, y: 70 } },
        { id: 'w12', from: { x: 250, y: 70 }, to: { x: 250, y: 120 } },
        { id: 'w13', from: { x: 250, y: 120 }, to: { x: 280, y: 120 } },
        { id: 'w14', from: { x: 190, y: 130 }, to: { x: 280, y: 130 } },
        { id: 'w15', from: { x: 190, y: 190 }, to: { x: 250, y: 190 } },
        { id: 'w16', from: { x: 250, y: 190 }, to: { x: 250, y: 140 } },
        { id: 'w17', from: { x: 250, y: 140 }, to: { x: 280, y: 140 } },
        { id: 'w18', from: { x: 190, y: 250 }, to: { x: 260, y: 250 } },
        { id: 'w19', from: { x: 260, y: 250 }, to: { x: 260, y: 150 } },
        { id: 'w20', from: { x: 260, y: 150 }, to: { x: 280, y: 150 } },
        // Op select to (300, 160)
        { id: 'w21', from: { x: 240, y: 220 }, to: { x: 300, y: 220 } },
        { id: 'w22', from: { x: 300, y: 220 }, to: { x: 300, y: 160 } },
        // MUX out to Result
        { id: 'w23', from: { x: 320, y: 140 }, to: { x: 380, y: 140 } },
      ],
    },
  },
  {
    slug: 'jk-flip-flop',
    name: 'J-K Flip-Flop',
    category: 'Sequential',
    level: 'Medium',
    score: 260,
    summary: 'Stores one bit and changes it only on a rising clock edge: J sets, K resets, and J = K = 1 toggles.',
    circuit: {
      name: 'J-K Flip-Flop',
      components: [
        { id: 'in_j', type: 'Pin', loc: { x: 80, y: 90 }, attrs: { facing: 'east', width: 1, output: false, label: 'J', value: '1' } },
        { id: 'clk1', type: 'Clock', loc: { x: 80, y: 120 }, attrs: { facing: 'east', label: 'CLK', value: '0' } },
        { id: 'in_k', type: 'Pin', loc: { x: 80, y: 150 }, attrs: { facing: 'east', width: 1, output: false, label: 'K', value: '1' } },
        { id: 'jk1', type: 'J-K Flip-Flop', loc: { x: 220, y: 100 }, attrs: { facing: 'east', label: 'JK_FF' } },
        { id: 'out_q', type: 'Pin', loc: { x: 290, y: 100 }, attrs: { facing: 'west', width: 1, output: true, label: 'Q' } },
        { id: 'out_qn', type: 'Pin', loc: { x: 290, y: 120 }, attrs: { facing: 'west', width: 1, output: true, label: 'NotQ' } },
      ],
      wires: [
        { id: 'w1', from: { x: 80, y: 90 }, to: { x: 140, y: 90 } },
        { id: 'w2', from: { x: 140, y: 90 }, to: { x: 140, y: 100 } },
        { id: 'w3', from: { x: 140, y: 100 }, to: { x: 180, y: 100 } },
        { id: 'w4', from: { x: 80, y: 120 }, to: { x: 140, y: 120 } },
        { id: 'w5', from: { x: 140, y: 120 }, to: { x: 140, y: 110 } },
        { id: 'w6', from: { x: 140, y: 110 }, to: { x: 180, y: 110 } },
        { id: 'w7', from: { x: 80, y: 150 }, to: { x: 150, y: 150 } },
        { id: 'w8', from: { x: 150, y: 150 }, to: { x: 150, y: 120 } },
        { id: 'w9', from: { x: 150, y: 120 }, to: { x: 180, y: 120 } },
        { id: 'w10', from: { x: 220, y: 100 }, to: { x: 290, y: 100 } },
        { id: 'w11', from: { x: 220, y: 120 }, to: { x: 290, y: 120 } },
      ],
    },
  },
  {
    slug: '7-segment-decoder',
    name: '4-Bit Counter & Hex Digit Display',
    category: 'Displays',
    level: 'Medium',
    score: 280,
    summary: 'Drives a 7-segment Hex Digit Display from a 4-bit Synchronous Counter and Clock source.',
    circuit: {
      name: 'Hex Counter Display',
      components: [
        { id: 'clk1', type: 'Clock', loc: { x: 80, y: 140 }, attrs: { facing: 'east', label: 'CLK', value: '0' } },
        { id: 'rst1', type: 'Button', loc: { x: 80, y: 180 }, attrs: { facing: 'east', label: 'RST', value: '0' } },
        { id: 'cnt1', type: 'Counter', loc: { x: 180, y: 120 }, attrs: { facing: 'east', width: 4, label: 'COUNT4' } },
        { id: 'hex1', type: 'Hex Digit Display', loc: { x: 260, y: 60 }, attrs: { facing: 'east', label: 'HEX' } },
        { id: 'out_bus', type: 'Pin', loc: { x: 240, y: 160 }, attrs: { facing: 'west', width: 4, output: true, label: 'Count' } },
      ],
      wires: [
        { id: 'w1', from: { x: 80, y: 140 }, to: { x: 160, y: 140 } },
        { id: 'w2', from: { x: 80, y: 180 }, to: { x: 170, y: 180 } },
        { id: 'w3', from: { x: 170, y: 180 }, to: { x: 170, y: 140 } },
        { id: 'w4', from: { x: 180, y: 120 }, to: { x: 210, y: 120 } },
        { id: 'w5', from: { x: 210, y: 120 }, to: { x: 270, y: 120 } },
        { id: 'w6', from: { x: 210, y: 120 }, to: { x: 210, y: 160 } },
        { id: 'w7', from: { x: 210, y: 160 }, to: { x: 240, y: 160 } },
      ],
    },
  },
  {
    slug: 'k-map-solver',
    name: '3-Input Majority Voter (K-Map Minimal SOP)',
    category: 'Combinational',
    level: 'Medium',
    score: 220,
    summary: 'Outputs 1 when at least two of (A, B, C) are 1. Minimized via Karnaugh Map to Y = A·B + B·C + A·C.',
    truthTable: {
      vars: ['A', 'B', 'C'],
      outName: 'Majority',
      rows: ['0', '0', '0', '1', '0', '1', '1', '1'],
    },
    circuit: {
      name: 'Majority Voter',
      components: [
        { id: 'in_a', type: 'Pin', loc: { x: 60, y: 60 }, attrs: { facing: 'east', width: 1, output: false, label: 'A', value: '1' } },
        { id: 'in_b', type: 'Pin', loc: { x: 60, y: 120 }, attrs: { facing: 'east', width: 1, output: false, label: 'B', value: '1' } },
        { id: 'in_c', type: 'Pin', loc: { x: 60, y: 180 }, attrs: { facing: 'east', width: 1, output: false, label: 'C', value: '0' } },
        { id: 'tun_a', type: 'Tunnel', loc: { x: 80, y: 60 }, attrs: { facing: 'east', width: 1, label: 'A' } },
        { id: 'tun_b', type: 'Tunnel', loc: { x: 80, y: 120 }, attrs: { facing: 'east', width: 1, label: 'B' } },
        { id: 'tun_c', type: 'Tunnel', loc: { x: 80, y: 180 }, attrs: { facing: 'east', width: 1, label: 'C' } },
        // AB
        { id: 'ta1', type: 'Tunnel', loc: { x: 150, y: 50 }, attrs: { facing: 'west', width: 1, label: 'A' } },
        { id: 'tb1', type: 'Tunnel', loc: { x: 150, y: 70 }, attrs: { facing: 'west', width: 1, label: 'B' } },
        { id: 'and_ab', type: 'AND Gate', loc: { x: 210, y: 60 }, attrs: { facing: 'east', width: 1, inputs: 2, label: 'AB' } },
        // BC
        { id: 'tb2', type: 'Tunnel', loc: { x: 150, y: 110 }, attrs: { facing: 'west', width: 1, label: 'B' } },
        { id: 'tc2', type: 'Tunnel', loc: { x: 150, y: 130 }, attrs: { facing: 'west', width: 1, label: 'C' } },
        { id: 'and_bc', type: 'AND Gate', loc: { x: 210, y: 120 }, attrs: { facing: 'east', width: 1, inputs: 2, label: 'BC' } },
        // AC
        { id: 'ta3', type: 'Tunnel', loc: { x: 150, y: 170 }, attrs: { facing: 'west', width: 1, label: 'A' } },
        { id: 'tc3', type: 'Tunnel', loc: { x: 150, y: 190 }, attrs: { facing: 'west', width: 1, label: 'C' } },
        { id: 'and_ac', type: 'AND Gate', loc: { x: 210, y: 180 }, attrs: { facing: 'east', width: 1, inputs: 2, label: 'AC' } },
        // OR3
        { id: 'or_maj', type: 'OR Gate', loc: { x: 320, y: 120 }, attrs: { facing: 'east', width: 1, inputs: 3, label: 'OR3' } },
        { id: 'out_maj', type: 'Pin', loc: { x: 370, y: 120 }, attrs: { facing: 'west', width: 1, output: true, label: 'Majority' } },
      ],
      wires: [
        { id: 'w1', from: { x: 60, y: 60 }, to: { x: 80, y: 60 } },
        { id: 'w2', from: { x: 60, y: 120 }, to: { x: 80, y: 120 } },
        { id: 'w3', from: { x: 60, y: 180 }, to: { x: 80, y: 180 } },
        { id: 'w4', from: { x: 150, y: 50 }, to: { x: 160, y: 50 } },
        { id: 'w5', from: { x: 150, y: 70 }, to: { x: 160, y: 70 } },
        { id: 'w6', from: { x: 150, y: 110 }, to: { x: 160, y: 110 } },
        { id: 'w7', from: { x: 150, y: 130 }, to: { x: 160, y: 130 } },
        { id: 'w8', from: { x: 150, y: 170 }, to: { x: 160, y: 170 } },
        { id: 'w9', from: { x: 150, y: 190 }, to: { x: 160, y: 190 } },
        { id: 'w10', from: { x: 210, y: 60 }, to: { x: 250, y: 60 } },
        { id: 'w11', from: { x: 250, y: 60 }, to: { x: 250, y: 110 } },
        { id: 'w12', from: { x: 250, y: 110 }, to: { x: 270, y: 110 } },
        { id: 'w13', from: { x: 210, y: 120 }, to: { x: 270, y: 120 } },
        { id: 'w14', from: { x: 210, y: 180 }, to: { x: 250, y: 180 } },
        { id: 'w15', from: { x: 250, y: 180 }, to: { x: 250, y: 130 } },
        { id: 'w16', from: { x: 250, y: 130 }, to: { x: 270, y: 130 } },
        { id: 'w17', from: { x: 320, y: 120 }, to: { x: 370, y: 120 } },
      ],
    },
  },
  {
    slug: 'short-circuit-demo',
    name: 'Bus Contention / Short-Circuit Diagnostic',
    category: 'Debugging',
    level: 'Easy',
    score: 120,
    summary: 'Demonstrates how connecting two opposing gate outputs directly onto one wire causes a red Error (E) state that the AI Signal Prover can diagnose.',
    circuit: {
      name: 'Bus Contention Demo',
      components: [
        { id: 'in_a', type: 'Pin', loc: { x: 70, y: 70 }, attrs: { facing: 'east', width: 1, output: false, label: 'A', value: '1' } },
        { id: 'in_b', type: 'Pin', loc: { x: 70, y: 130 }, attrs: { facing: 'east', width: 1, output: false, label: 'B', value: '0' } },
        { id: 'buf1', type: 'Buffer', loc: { x: 160, y: 70 }, attrs: { facing: 'east', width: 1, label: 'DriverA' } },
        { id: 'buf2', type: 'Buffer', loc: { x: 160, y: 130 }, attrs: { facing: 'east', width: 1, label: 'DriverB' } },
        { id: 'out_bus', type: 'Pin', loc: { x: 260, y: 100 }, attrs: { facing: 'west', width: 1, output: true, label: 'SharedBus' } },
      ],
      wires: [
        { id: 'w1', from: { x: 70, y: 70 }, to: { x: 130, y: 70 } },
        { id: 'w2', from: { x: 70, y: 130 }, to: { x: 130, y: 130 } },
        { id: 'w3', from: { x: 160, y: 70 }, to: { x: 210, y: 70 } },
        { id: 'w4', from: { x: 210, y: 70 }, to: { x: 210, y: 100 } },
        { id: 'w5', from: { x: 160, y: 130 }, to: { x: 210, y: 130 } },
        { id: 'w6', from: { x: 210, y: 130 }, to: { x: 210, y: 100 } },
        { id: 'w7', from: { x: 210, y: 100 }, to: { x: 260, y: 100 } },
      ],
    },
  },
];

export const LOGIC_CHALLENGES: readonly LogicChallenge[] = [
  {
    id: 'challenge-half-adder',
    title: 'Fix the Broken Half Adder',
    level: 1,
    score: 120,
    goal: 'Make Sum = A XOR B and Carry = A AND B for all 4 input combinations. Right now Sum is using an OR gate instead of an XOR gate!',
    inputNames: ['A', 'B'],
    outputNames: ['Sum', 'Carry'],
    expectedFn: ({ A, B }) => ({ Sum: (A ^ B) & 1, Carry: (A & B) & 1 }),
    starterCircuit: {
      name: 'Broken Half Adder',
      components: [
        { id: 'in_a', type: 'Pin', loc: { x: 80, y: 80 }, attrs: { facing: 'east', width: 1, output: false, label: 'A', value: '1' } },
        { id: 'in_b', type: 'Pin', loc: { x: 80, y: 140 }, attrs: { facing: 'east', width: 1, output: false, label: 'B', value: '1' } },
        { id: 'xor1', type: 'OR Gate', loc: { x: 220, y: 90 }, attrs: { facing: 'east', width: 1, inputs: 2, label: 'WrongGate' } },
        { id: 'and1', type: 'AND Gate', loc: { x: 220, y: 150 }, attrs: { facing: 'east', width: 1, inputs: 2, label: 'AND' } },
        { id: 'out_sum', type: 'Pin', loc: { x: 290, y: 90 }, attrs: { facing: 'west', width: 1, output: true, label: 'Sum' } },
        { id: 'out_carry', type: 'Pin', loc: { x: 290, y: 150 }, attrs: { facing: 'west', width: 1, output: true, label: 'Carry' } },
      ],
      wires: PRESET_CIRCUITS[0].circuit.wires,
    },
    solutionCircuit: PRESET_CIRCUITS[0].circuit,
    coachStages: [
      {
        label: 'Where to look',
        text: 'Test the input combination A=1, B=1 and inspect the top gate driving the Sum output pin.',
        highlightComponents: ['in_a', 'in_b', 'xor1', 'out_sum'],
      },
      {
        label: 'The pattern',
        text: 'When A=1 and B=1, binary addition 1 + 1 = 10₂ produces Carry=1 and Sum=0. However, the OR gate outputs Sum=1.',
        highlightComponents: ['xor1', 'out_sum'],
      },
      {
        label: 'The logic',
        text: 'The Sum bit of a Half Adder is 1 only when A and B differ (odd parity), which is the exact truth table of an Exclusive-OR (XOR) gate.',
        highlightComponents: ['xor1'],
      },
      {
        label: 'Conclusion',
        text: 'Replace the OR Gate at (220, 90) with an XOR Gate (or click Apply step to fix the gate).',
        highlightComponents: ['xor1', 'out_sum'],
      },
    ],
  },
  {
    id: 'challenge-mux-select',
    title: 'Repair the 2-to-1 Multiplexer',
    level: 2,
    score: 210,
    goal: 'Route D0 to Y when S=0, and D1 to Y when S=1. Currently the final gate combining the two AND branches is an AND gate instead of an OR gate.',
    inputNames: ['S', 'D0', 'D1'],
    outputNames: ['Y'],
    expectedFn: ({ S, D0, D1 }) => ({ Y: S ? D1 : D0 }),
    starterCircuit: {
      name: 'Broken Multiplexer',
      components: PRESET_CIRCUITS[2].circuit.components.map((c) =>
        c.id === 'or1' ? { ...c, type: 'AND Gate', attrs: { ...c.attrs, label: 'WrongCombine' } } : c,
      ),
      wires: PRESET_CIRCUITS[2].circuit.wires,
    },
    solutionCircuit: PRESET_CIRCUITS[2].circuit,
    coachStages: [
      {
        label: 'Where to look',
        text: 'Look at the two product terms AND0 (~S·D0) and AND1 (S·D1) and the gate combining them at (330, 120).',
        highlightComponents: ['and0', 'and1', 'or1'],
      },
      {
        label: 'The pattern',
        text: 'Because S and ~S are complements, at least one of AND0 or AND1 is always 0.',
        highlightComponents: ['not_s', 'and0', 'and1'],
      },
      {
        label: 'The logic',
        text: 'Feeding two mutually exclusive terms into an AND gate forces the output Y to 0 for every input vector. A Sum-of-Products expression requires an OR gate to sum the product terms.',
        highlightComponents: ['or1', 'out_y'],
      },
      {
        label: 'Conclusion',
        text: 'Change the final gate at (330, 120) from an AND Gate to an OR Gate.',
        highlightComponents: ['or1', 'out_y'],
      },
    ],
  },
  {
    id: 'challenge-full-adder',
    title: 'Complete the Full Adder Carry Logic',
    level: 3,
    score: 310,
    goal: 'Make Sum = A ⊕ B ⊕ Cin and Cout = (A·B) + (Cin·(A ⊕ B)) hold for all 8 rows of the truth table.',
    inputNames: ['A', 'B', 'Cin'],
    outputNames: ['Sum', 'Cout'],
    expectedFn: ({ A, B, Cin }) => {
      const total = A + B + Cin;
      return { Sum: total & 1, Cout: total >= 2 ? 1 : 0 };
    },
    starterCircuit: {
      name: 'Broken Full Adder',
      components: PRESET_CIRCUITS[1].circuit.components.map((c) =>
        c.id === 'or1' ? { ...c, type: 'AND Gate', attrs: { ...c.attrs, label: 'CarryCombine' } } : c,
      ),
      wires: PRESET_CIRCUITS[1].circuit.wires,
    },
    solutionCircuit: PRESET_CIRCUITS[1].circuit,
    coachStages: [
      {
        label: 'Where to look',
        text: 'Check the carry-out network (AND1, AND2, and the gate driving Cout) when A=1, B=1, Cin=1.',
        highlightComponents: ['and1', 'and2', 'or1', 'out_cout'],
      },
      {
        label: 'The pattern',
        text: 'With A=1, B=1, Cin=1, AND1 outputs 0 and AND2 outputs 1, so Cout should be 1, but the combining gate outputs 0 because it requires both terms to be 1.',
        highlightComponents: ['xor1', 'and1', 'and2', 'or1'],
      },
      {
        label: 'The logic',
        text: 'In standard Full Adder synthesis, Carry-Out is the OR of the generate term (A·B) and propagate term (Cin·(A⊕B)); an AND gate there makes Cout nearly always 0.',
        highlightComponents: ['or1', 'out_cout'],
      },
      {
        label: 'Conclusion',
        text: 'Use an OR Gate at (370, 170) to form Cout = (A·B) + (Cin·(A⊕B)).',
        highlightComponents: ['or1', 'out_cout'],
      },
    ],
  },
];

/**
 * Deterministic date-seeded Daily Challenge selector.
 */
export function getDailyChallenge(dateIso: string): LogicChallenge {
  let hash = 2166136261;
  for (let i = 0; i < dateIso.length; i++) {
    hash ^= dateIso.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const idx = Math.abs(hash) % LOGIC_CHALLENGES.length;
  return LOGIC_CHALLENGES[idx];
}
