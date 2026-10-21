/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * Technique catalog for the static site generator.
 * Zero dependencies; works with build.mjs.
 */

/** All circuit guides with description, example, and circuit data.
 * Each entry maps to a circuit page at /circuits/{slug}.html.
 */
const TECHNIQUES = [

  {
    slug: 'half-adder',
    name: 'Half Adder',
    level: 'Easy',
    summary: 'Adds two 1-bit inputs A and B using an XOR gate for Sum and an AND gate for Carry.',
    category: 'Arithmetic',
    body: [
      'A Half Adder adds two single-bit binary inputs.',
      'The Sum output is 1 when A and B differ (odd parity).',
      'The Carry output is 1 when both A and B are 1.',
      'Use an XOR gate for Sum and an AND gate for Carry.',
    ],
    tip: 'If Sum is wrong, check that the top gate is XOR, not OR.',
    example: 'half-adder',
  },

  {
    slug: 'full-adder',
    name: 'Full Adder',
    level: 'Medium',
    summary: 'Adds three 1-bit inputs (A, B, and Carry-In Cin) using two cascaded XOR stages and carry-lookahead AND/OR gates.',
    category: 'Arithmetic',
    body: [
      'A Full Adder adds three single-bit binary inputs: A, B, and Cin.',
      'Sum is 1 when an odd number of inputs are 1 (A ⊕ B ⊕ Cin).',
      'Carry-Out is 1 when two or more inputs are 1.',
      'Standard synthesis: Sum = A ⊕ B ⊕ Cin, Cout = (A·B) + (Cin·(A⊕B)).',
    ],
    tip: 'If Carry-Out is stuck at 0, check that the final gate is OR, not AND.',
    example: 'full-adder',
  },

  {
    slug: 'multiplexer',
    name: '2-to-1 Multiplexer',
    level: 'Medium',
    summary: 'Routes one of 2^S data inputs to the output based on the Select line: Y = (~S · D0) + (S · D1).',
    category: 'Plexers',
    body: [
      'A 2-to-1 multiplexer selects between two data inputs (D0, D1).',
      'The Select line S chooses which input routes to the output Y.',
      'When S=0: Y = D0; when S=1: Y = D1.',
      'Internally: Y = (~S · D0) + (S · D1) using two AND gates and an OR gate.',
    ],
    tip: 'If Y is always 0, check that the final gate is OR, not AND.',
    example: 'multiplexer',
  },

  {
    slug: '4-bit-alu',
    name: '4-Bit ALU',
    level: 'Hard',
    summary: 'Computes 4-bit A + B, A - B, A AND B, or A OR B selected by a 2-bit Opcode feeding a 4-to-1 Multiplexer.',
    category: 'Arithmetic',
    body: [
      'A 4-bit Arithmetic Logic Unit computes multiple operations.',
      'Operations selected by a 2-bit Opcode fed to a 4-to-1 multiplexer.',
      'Supports: addition (A+B), subtraction (A-B), bitwise AND, bitwise OR.',
      'Result routed from ALU outputs through the multiplexer.',
    ],
    tip: 'If the wrong operation appears, check the MUX select logic.',
    example: '4-bit-alu',
  },

  {
    slug: 'sr-latch',
    name: 'S-R Latch',
    level: 'Medium',
    summary: 'Demonstrates clocked sequential state storage and toggling using a J-K Flip-Flop driven by J, K, and a Clock source.',
    category: 'Sequential',
    body: [
      'Sequential circuits use clocked flip-flops to store state.',
      'A J-K Flip-Flop toggles when J=K=1 on the rising clock edge.',
      'S-R Flip-Flop: S=1 sets Q=1, R=1 resets Q=0 on clock edge.',
      'Key concept: state changes only on active clock edges.',
    ],
    tip: 'If Q toggles unexpectedly, check for glitches on the clock line.',
    example: 'sr-latch',
  },

  {
    slug: '7-segment-decoder',
    name: '4-Bit Counter & Hex Digit Display',
    level: 'Medium',
    summary: 'Drives a 7-segment Hex Digit Display from a 4-bit Synchronous Counter and Clock source.',
    category: 'Displays',
    body: [
      'A 4-bit Counter increments on each rising clock edge.',
      'A Hex Digit Display decodes a 4-bit nibble into segments a-g.',
      'A Button provides asynchronous reset.',
      'Key concept: synchronous counter with enable/clear.',
    ],
    tip: 'If the display flickers, check for bouncing on the reset button.',
    example: '7-segment-decoder',
  },

  {
    slug: 'k-map-solver',
    name: '3-Input Majority Voter (K-Map Minimal SOP)',
    level: 'Medium',
    summary: 'Outputs 1 when at least two of (A, B, C) are 1. Minimized via Karnaugh Map to Y = A·B + B·C + A·C.',
    category: 'Combinational',
    body: [
      'A 3-variable majority function: output 1 when ≥2 of 3 inputs are 1.',
      'K-Map minimization yields minimal SOP: Y = A·B + B·C + A·C.',
      'Three prime implicants: AB, BC, AC.',
      'All three are essential for covering all minterms.',
    ],
    tip: 'The K-Map shows three looping groups of two cells each.',
    example: 'k-map-solver',
  },

  {
    slug: 'short-circuit-demo',
    name: 'Bus Contention / Short-Circuit Diagnostic',
    level: 'Easy',
    summary: 'Demonstrates how connecting two opposing gate outputs directly onto one wire causes a red Error (E) state that the AI Signal Prover can diagnose.',
    category: 'Debugging',
    body: [
      'Connecting two gate outputs directly onto one wire creates a short circuit.',
      'The wire settles to Error (E, red) state when both drivers are active with opposite values.',
      'The AI Signal Prover traces the conflicting drivers and highlights the root cause.',
      'Fix: separate the outputs with an OR gate or use Controlled Buffers (tri-state).',
    ],
    tip: 'If the wire is Error (red), use the "Why this value?" feature to diagnose.',
    example: 'short-circuit-demo',
  },

];

export { TECHNIQUES };