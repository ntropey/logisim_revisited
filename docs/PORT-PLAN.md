# Port Plan & Status

## Completed Milestones

1. **`@logisim/core` Engine**:
   - 4-state logic value representation (`0`, `1`, `Z`, `E`) and multi-bit bus resolution.
   - Component evaluation for Wiring, Gates, Plexers, Arithmetic, Memory, and Input/Output libraries.
   - Netlist compiler (wire coordinate union-find + named Tunnel merging) and iterative discrete-event propagation engine with oscillation detection.
   - Backward causal signal provenance tracer (`traceSignal`) for explaining `0`, `1`, `E` (short-circuit conflict), and `Z` (floating net) states.
   - Combinational Analysis: Boolean expression parser, Truth Table generator, Quine-McCluskey prime implicant solver, Gray-code Karnaugh Map loop finder, and two-level AND-OR circuit synthesizer.
   - Logisim 2.7.1 `.circ` XML parser and serializer (`parseCircXml`, `serializeCircXml`).
   - Built-in reference circuits and date-seeded Daily Logic Challenges.

2. **`@logisim/app` PWA**:
   - Interactive SVG schematic canvas with Poke tool, Wire drawing tool, Component placement, and live 4-state color-coded wires.
   - Symbolic AI Circuit Coach (4-stage Socratic walkthroughs) and "Why is this pin/wire 0/1/E/Z?" signal prover.
   - Combinational Analysis & interactive K-Map drawer tab with 1-click circuit synthesis.
   - Mobile-responsive `BottomSheet`, `SettingsSheet` (with Privacy & Cookie settings), `SolvedDialog`, `.circ` XML import/export, and offline service worker.

3. **`@logisim/website` Static Site**:
   - Static HTML generator with `WebApplication`, `FAQPage`, `TechArticle`, `BreadcrumbList`, and `CollectionPage` JSON-LD schemas.
   - Interactive circuit guides (`/circuits/`), component reference (`/components/`), learning guides (`/learn/`, including `logisim-online-no-java.html`), and user manual (`/manual/`).
   - Regional Google Consent Mode v2 + consent-aware AdSense loader (`consent.mjs`).
