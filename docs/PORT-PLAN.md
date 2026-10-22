# Port Plan & Status

Last updated 2026-10-22.

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

## Next

- **App polish**: keyboard navigation on the canvas, marquee selection, copy/paste, bus value badges on wires, a first-run tour, touch long-press for Delete.
- **App tests**: end-to-end tests (Playwright is installed in CI images) for place/wire/poke; component tests for the panels.
- **Content**: an interactive (pokeable) schematic on guide pages; a true cross-coupled S-R latch guide (first check how the simulator settles latch feedback from power-on).
- **Core gaps**: RAM, Logisim sub-circuits and appearance, and libraries beyond the six shipped (Base, TTL) are not supported; the importer ignores them.
- **Domain**: the custom domain is attached but GitHub has not issued an HTTPS certificate; see the notes on re-triggering the DNS check in the repository settings.
