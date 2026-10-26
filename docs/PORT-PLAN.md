# Port Plan & Status

Last updated 2026-10-26.

## Done

1. **`@logisim/core` engine** (7 tests):
   - 4-state logic values (`0`, `1`, `Z`, `E`) and multi-bit bus resolution.
   - Component evaluation for the Wiring, Gates, Plexers, Arithmetic, Memory and Input/Output libraries.
   - Netlist compiler (wire union-find, T-junctions, named tunnels) and an iterative discrete-event simulator with oscillation detection.
   - Backward signal tracer (`traceSignal`) explaining `0`, `1`, `E` (conflict) and `Z` (floating).
   - Boolean expression parser, truth tables, Quine-McCluskey, Gray-code K-map loops, two-level circuit synthesis.
   - Logisim 2.7.1 `.circ` parser and serializer.
   - Preset circuits, date-seeded logic challenges.

2. **`@logisim/app` PWA** (rebuilt 2026-10-21 on the real core API):
   - SVG schematic editor: place, wire (drag or click-to-chain), move with connected wires following, rotate, delete, poke; pan, wheel and pinch zoom; undo/redo.
   - Gate shapes, I/O widgets, live 4-state wire colors, junction dots, E conflicts drawn dashed.
   - Inspector: pin tables, property editing, "Why is this 0/1/E/Z?" prover, and progressive Coach hints that highlight the parts involved.
   - Analyze tab: expression or truth table (2-4 variables), K-map with loops, minimal SOP/POS, one-click circuit synthesis.
   - Challenges tab: daily challenge, verifier with first failing row, hints, shareable result.
   - `.circ` import/export, share-by-URL (`#c=`), `?p=`, `?challenge=`, `?daily=` deep links, light/dark/system theme, local autosave, offline service worker.
   - Simulation runs on the main thread. The core is synchronous and fast at schematic sizes, which removed the old worker's request-matching and `eval` problems.

3. **`@logisim/website`**: circuit guides, component pages and the home page draw real schematics with the app's renderer, and combinational guides show a truth table produced by the simulator. One page shell (`layout.mjs`), relative links derived from each page's path, a real stylesheet built on the app's tokens, 70 pages (home, circuits, learn, manual, components, about, privacy, 404), consent-aware AdSense, sitemap and robots when `SITE_URL` is set, and a test that checks structure, spelling and internal links.

4. **End-to-end tests** (`packages/app/e2e`, 21 Playwright tests, desktop and phone): presets and URLs, poke/undo/redo, persistence, Tick, building and wiring by hand, moving with wires attached, keyboard rotate/delete, inspector edits, Coach hints, the E prover, K-map to circuit, solving a challenge, .circ export/import, share links, offline service worker, and the phone layout. They run in CI.

## Next

- **App polish**: keyboard navigation on the canvas, marquee selection, copy/paste, bus value badges on wires, a first-run tour, touch long-press for Delete.
- **UI/UX roadmap (ui-ux-pro-max audit)**:
  - Mobile touch-hold context menu for component actions and deletion.
  - Interactive audio feedback on clock tick, poke transitions, and challenge success.
  - Canvas mini-map widget for large-scale schematics.
  - Accessible high-contrast wire pattern options in Settings (building on dashed E conflict and dotted Z floating lines).
- **Content**: an interactive (pokeable) schematic on guide pages; a true cross-coupled S-R latch guide (first check how the simulator settles latch feedback from power-on).
- **Core gaps**: RAM, Logisim sub-circuits and appearance, and libraries beyond the six shipped (Base, TTL) are not supported; the importer ignores them.
- **Pro / Advanced Tier Concept (Hierarchical Sub-Circuits & System Design)**:
  - **Multi-Sheet Project Manager**: Support multi-circuit `.circ` projects (e.g., CPU Datapath, ALU, Control Unit, Register File) with sheet selector tabs.
  - **Custom Component Blocks (Sub-Circuits)**: Enable any circuit sheet to be instantiated as a reusable block in the parts palette with auto-generated or custom pin perimeters.
  - **Hierarchical Simulation**: Modular netlist evaluation with cycle/recursion guards and live in-block inspection (double-click to step inside a running sub-circuit).
  - **Advanced Memory / Microcode**: Interactive hex editor for large RAM/ROM blocks to power microcode sequencers and assembly program loading (ideal for 8-bit RISC / CPU capstone projects).
- **Domain**: `logisimrevisited.com` serves over HTTPS (verified 2026-10-26).
