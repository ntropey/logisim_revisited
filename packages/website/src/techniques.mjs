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
    slug: 'jk-flip-flop',
    name: 'J-K Flip-Flop',
    level: 'Medium',
    summary: 'Stores one bit and changes it only on a rising clock edge: J sets, K resets, and J = K = 1 toggles.',
    category: 'Sequential',
    body: [
      'A flip-flop is a one-bit memory. Unlike a gate, its output depends on what happened before, not only on its inputs right now.',
      'The J-K flip-flop looks at J and K only at the rising edge of the clock, the moment CLK goes from 0 to 1. In between, Q holds its value no matter how J and K change.',
      'At a rising edge: J = 0, K = 0 keeps Q; J = 1, K = 0 sets Q to 1; J = 0, K = 1 resets Q to 0; J = 1, K = 1 toggles Q. The NotQ output is always the opposite of Q.',
      'In this circuit J and K both start at 1. Each Tick toggles the clock, so every second Tick is a rising edge and flips Q. Poke J or K to 0 and tick twice more to see reset, set and hold.',
      'An S-R flip-flop works the same way with S and R in place of J and K, except that S = R = 1 is not allowed.',
    ],
    tip: 'Q only changes on the 0 to 1 edge. If a Tick does nothing, the clock just went from 1 back to 0; press Tick again.',
    example: 'jk-flip-flop',
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

  {
    slug: 'sr-latch',
    name: 'S-R Flip-Flop',
    level: 'Easy',
    summary: 'Sets Q = 1 when S = 1 and resets Q = 0 when R = 1 on a rising clock edge, while S = R = 0 holds the stored bit.',
    category: 'Sequential',
    body: [
      'The S-R (Set-Reset) Flip-Flop is a clocked 1-bit sequential memory element with Set (S), Clock (CLK), and Reset (R) inputs.',
      'Unlike an unclocked latch that reacts immediately whenever its inputs change, the clocked S-R Flip-Flop samples S and R only at the rising edge of CLK (when the clock transitions from 0 to 1).',
      'On a rising clock edge: S = 0, R = 0 holds the current state Q; S = 1, R = 0 sets Q to 1 (and NotQ to 0); S = 0, R = 1 resets Q to 0 (and NotQ to 1).',
      'Driving both S = 1 and R = 1 at the same time is the forbidden (invalid) state in S-R design because Set and Reset conflict. A J-K Flip-Flop resolves that conflict by toggling Q when both inputs are 1.',
    ],
    tip: 'Avoid driving S = 1 and R = 1 simultaneously. Open the circuit in the simulator, poke S and R, and click Tick to step through Set, Hold, and Reset.',
    example: 'sr-latch',
  },

  {
    slug: 't-flip-flop',
    name: 'T Flip-Flop Frequency Divider',
    level: 'Easy',
    summary: 'Toggles Q between 0 and 1 on each rising clock edge when T = 1, dividing the clock frequency by two.',
    category: 'Sequential',
    body: [
      'A T (Toggle) Flip-Flop flips its stored bit Q (~Q) on the rising edge (0 → 1 transition) of Clock (CLK) whenever its Toggle input T is 1, and holds Q steady when T is 0.',
      'Its characteristic equation is Q(next) = T ⊕ Q. Because Q changes state only once per full clock period (on the rising edge), tying T = 1 makes output Q oscillate at exactly half the frequency of CLK.',
      'This divide-by-2 behavior is the foundation of binary ripple counters and synchronous up-counters: chaining N T Flip-Flops divides the input clock by 2^N and counts from 0 to 2^N - 1.',
      'In this circuit T starts at 1. Each pair of Tick clicks completes one full clock cycle and toggles Q once.',
    ],
    tip: 'Keep T = 1 and click Tick repeatedly: Q flips only on the 0 → 1 rising clock edge, dividing the clock frequency by 2.',
    example: 't-flip-flop',
  },

  {
    slug: 'd-flip-flop',
    name: 'D Flip-Flop',
    level: 'Easy',
    summary: 'Captures the data bit on D at the rising edge of the clock and holds it steady on Q until the next rising edge.',
    category: 'Sequential',
    body: [
      'The D (Data or Delay) Flip-Flop is the fundamental building block of CPU registers, shift registers, and synchronous state machines.',
      'Its characteristic equation is simply Q(next) = D at the rising edge (0 → 1 transition) of Clock (CLK). Whatever 0 or 1 bit sits on D at the moment CLK rises is captured onto Q, while NotQ outputs the complement.',
      'Between rising clock edges, Q is completely isolated from D: you can toggle D back and forth without disturbing the stored output until the next 0 → 1 clock edge arrives.',
      'Grouping four or eight D Flip-Flops on a shared clock line forms a parallel multi-bit Register.',
    ],
    tip: 'Poke D to change the input data bit, then click Tick until CLK transitions from 0 to 1 to watch Q capture the new value.',
    example: 'd-flip-flop',
  },

  {
    slug: 'xor-parity',
    name: 'XOR Gate & 3-Bit Odd Parity Checker',
    level: 'Easy',
    summary: 'Cascades two 2-input XOR gates to compute A ⊕ B ⊕ C, outputting 1 whenever an odd number of inputs are 1.',
    category: 'Combinational',
    body: [
      'An Exclusive-OR (XOR) gate outputs 1 when its two inputs differ (Y = A ⊕ B = A·~B + ~A·B) and 0 when they are equal.',
      'Because XOR is associative, cascading two 2-input XOR gates computes the 3-bit XOR sum Parity = (A ⊕ B) ⊕ C, which is 1 whenever an odd number of inputs (one or all three) are High (1).',
      'Notice that flipping any single input bit (A, B, or C) always flips the final Parity output—the exact property used by memory buses and serial links to detect single-bit transmission errors.',
      'The same two-stage XOR cascade also computes the Sum bit (A ⊕ B ⊕ Cin) inside every Full Adder.',
    ],
    tip: 'Click any row in the truth table to apply that (A, B, C) input combination directly to the schematic and watch the live wire colors update.',
    example: 'xor-parity',
  },

];

export { TECHNIQUES };