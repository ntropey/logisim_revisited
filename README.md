# Logisim Revisited

**Logisim Revisited** is a free, open-source digital logic circuit simulator, Karnaugh map analyzer, and interactive trainer built in TypeScript for the web and mobile devices. Inspired by Carl Burch's classic **Logisim 2.7.1**, it runs 100% client-side in your browser with no Java Runtime Environment required.

## Highlights

- **4-State Multi-Bit Logic Simulator (`@logisim/core`)**: Simulates `0` (Low), `1` (High), `Z` (Floating / High-Impedance), and `E` (Error / Short-Circuit Conflict) across 1-bit wires and multi-bit buses (up to 32 bits).
- **Classic Logisim Component Libraries**:
  - **Wiring**: Input Pin, Output Pin, Probe, Tunnel, Splitter, Clock, Constant, Power, Ground.
  - **Gates**: NOT, Buffer, Controlled Buffer (Tri-State), AND, OR, NAND, NOR, XOR, XNOR, Odd/Even Parity.
  - **Plexers**: Multiplexer, Demultiplexer, Decoder, Priority Encoder.
  - **Arithmetic**: Full Adder, Subtractor, Multiplier, Comparator, Shifter, Negator.
  - **Memory**: D, T, J-K, and S-R Flip-Flops, Register, Counter, RAM, and ROM.
  - **Input/Output**: Push Button, LED, 7-Segment Display, Hex Digit Display.
- **Symbolic AI Circuit Coach & Signal Prover**:
  - **"Why is this wire/pin 0 / 1 / E / Z?"**: Click any pin, gate, or wire net to trace signal propagation backward step-by-step from outputs to driving inputs, or pinpoint the exact competing drivers causing a red short-circuit (`E`).
  - **4-Stage Socratic AI Coach (`Coach me`)**: Walks through circuit debugging, truth-table verification, and Karnaugh map prime-implicant grouping in four progressive nudges (*Where to look*, *The pattern*, *The logic*, *Conclusion*).
- **Combinational Analysis (Truth Table ↔ Boolean Expression ↔ K-Map ↔ Circuit)**:
  - Interactive 2-, 3-, and 4-variable Gray-code Karnaugh Maps with Quine-McCluskey minimal Sum-of-Products (SOP) and Product-of-Sums (POS) prime-implicant loops, plus one-click automatic schematic synthesis.
- **Logisim 2.7.1 `.circ` XML Import & Export**: Load and save standard Logisim `.circ` XML circuit files directly in the browser.
- **Daily Logic Challenges**: Date-seeded digital logic design and troubleshooting puzzles with shareable completion cards.

## Quick Start

```sh
pnpm install
pnpm typecheck
pnpm test
pnpm --filter @logisim/app build
pnpm --filter @logisim/website build
pnpm --filter @logisim/website test
```

## License

Free software under the **GNU General Public License v3.0 or later** (`GPL-3.0-or-later`). See [LICENSE](LICENSE) and [docs/LICENSE-AUDIT.md](docs/LICENSE-AUDIT.md).
