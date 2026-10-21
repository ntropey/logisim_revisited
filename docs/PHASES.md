# Logisim Revisited - Phased Implementation Plan

## Current Status
- `@logisim/core`: **COMPLETE** (all tests passing)
  - 4-state logic (0,1,Z,E), component library, discrete-event simulator
  - Signal provenance tracer (traceSignal)
  - Combinational analysis (K-Map, Quine-McCluskey, synthesis)
  - .circ XML parser/exporter
  - Preset circuits & Daily Challenges

---

## Phase 1: @logisim/app PWA Foundation (Week 1)
**Goal**: Working schematic editor with live simulation

### 1.1 Project Setup
- [ ] Vite + React 19 + TypeScript config
- [ ] Tailwind CSS or CSS variables matching website tokens
- [ ] Service worker (workbox or custom) for PWA/offline
- [ ] Web Worker for simulation (off main thread)
- [ ] `manifest.webmanifest` for installability

### 1.2 Canvas & Interaction Layer
- [ ] SVG canvas with 10px grid snapping
- [ ] Pan/zoom (wheel + pinch, Ctrl+wheel)
- [ ] Tool palette: Select, Poke, Wire, Component placement
- [ ] Component ghost preview on hover
- [ ] Multi-select (marquee, Shift+click)

### 1.3 Component Rendering
- [ ] SVG symbols for all 32 component types (from catalog)
- [ ] Live wire color coding: gray(Z), green(0), red(1), blue(E), orange(unknown)
- [ ] Pin value badges on hover/selection
- [ ] Selection handles, rotation (R), flip (F), delete

### 1.4 Simulation Integration
- [ ] Worker protocol: `simulate`, `poke`, `stepClock`, `traceSignal`, `verify`, `analyze`, `synthesize`
- [ ] Auto-simulate on change (debounced 150ms)
- [ ] Poke tool toggles Input Pin / Clock / Button
- [ ] Clock tick button (advances all Clocks + sequential state)

### 1.5 File I/O
- [ ] `.circ` import/export via core parser
- [ ] Shareable URL encoding (compressed circuit JSON in `?c=` param)
- [ ] Download circuit as `.circ` file
- [ ] Import from file picker

---

## Phase 2: AI Circuit Coach & Signal Prover (Week 2)
**Goal**: "Why is this 0/1/E/Z?" + 4-stage Socratic coach

### 2.1 Signal Prover UI
- [ ] Right-click / long-press wire or pin → "Why this value?"
- [ ] Modal/side panel showing `traceSignal` stages with progressive highlighting
- [ ] Visual breadcrumb: Inputs → Gates → Target
- [ ] Color-coded verdict badges (Short-circuit, Floating, Oscillation, Valid)

### 2.2 Socratic AI Coach (4 stages)
- [ ] Coach panel: "Where to look" → "The pattern" → "The logic" → "Conclusion"
- [ ] Stage progression buttons (Next, Back, Reveal all)
- [ ] Board highlights sync with stage `highlightComponents`/`highlightNets`
- [ ] Shareable coach link: `?c=...&coach=stageN`

### 2.3 Daily Logic Challenge
- [ ] Date-seeded challenge from `LOGIC_CHALLENGES`
- [ ] Starter circuit loads with "Fix this circuit" prompt
- [ ] Coach auto-starts on first stage
- [ ] Verify button runs `verifyCircuitTruthTable` against `expectedFn`
- [ ] Completion dialog with "Share result" (copies URL with `?challenge=...&solved=1`)

### 2.4 Combinational Analysis Tab
- [ ] Truth Table editor (add/remove variables, edit output column)
- [ ] Boolean expression input (live parse + truth table)
- [ ] Interactive K-Map (2/3/4 var) with click-to-toggle 0/1/X
- [ ] Prime implicant loops rendered on K-Map (colored, draggable)
- [ ] "Synthesize Circuit" button → creates new circuit tab with AND-OR implementation

---

## Phase 3: Polish & Mobile UX (Week 3)
- [ ] BottomSheet for mobile (tools, properties, coach)
- [ ] SettingsSheet: Grid snap, Wire color theme, Dark mode, Privacy/Consent
- [ ] Touch-optimized wire drawing (drag from pin, auto-route Manhattan)
- [ ] Undo/Redo (command pattern, 50 steps)
- [ ] Keyboard shortcuts (V=Select, W=Wire, P=Poke, 1-9=Components, R=Rotate, Del=Delete)
- [ ] Command palette (Ctrl+K)
- [ ] Auto-save to localStorage (circuit + UI state)

---

## Phase 4: @logisim/website Static Site (Week 4)
**Goal**: SEO-optimized interactive textbook + app at /play/

### 4.1 Site Generator (`build.mjs`)
- [ ] Dependency-free ESM generator (like hodoku's `build.mjs`)
- [ ] JSON-LD schemas: WebApplication, TechArticle, CollectionPage, FAQPage, BreadcrumbList
- [ ] Sitemap.xml + robots.txt when `SITE_URL` set
- [ ] Copies app build to `/play/`
- [ ] Inlines `consent.mjs`, `gate.mjs` scripts

### 4.2 Consent & Ads (`consent.mjs`)
- [ ] Google Consent Mode v2 (ad_storage, ad_user_data, ad_personalization, analytics_storage)
- [ ] Regional defaults (EEA/UK/CH denied, ROW granted)
- [ ] Local consent storage + "Cookie settings" footer button
- [ ] AdSense script loaded only after consent

### 4.3 Content Pages
- [ ] Home: Hero, feature cards, Daily Challenge preview
- [ ] `/components/` - Reference for all 32 components with SVG symbol, pinout, truth table
- [ ] `/circuits/` - Interactive guides (SR Latch, JK FF, Half/Full Adder, 4-bit ALU, MUX, 7-Seg Decoder, K-Map Solver)
  - Each guide: inline SVG schematic + live poke-able simulation (core in worker)
  - Before/After toggle for broken→fixed challenges
- [ ] `/learn/` - "How digital logic works", "Logisim online no Java", "Boolean algebra", "K-Map tutorial"
- [ ] `/manual/` - 12 chapters matching app features
- [ ] About/License, Privacy, 404

### 4.4 Tests
- [ ] `node --test` verifies all pages exist, internal links resolve, no British spellings
- [ ] JSON-LD validation

---

## Phase 5: CI/CD & Deploy (Week 5)
- [ ] GitHub Actions: `pnpm typecheck`, `pnpm test`, `pnpm build` (app + website)
- [ ] Pages workflow deploys website to GitHub Pages (custom domain)
- [ ] Dependabot config
- [ ] CNAME file for custom domain

---

## File Structure Target

```
packages/
  core/          ✅ DONE
    src/
      index.ts, value.ts, components.ts, simulator.ts, analyzer.ts, circXml.ts, presets.ts
    test/core.test.ts
  app/           🔄 TODO
    src/
      main.tsx, App.tsx, styles.css
      canvas/Canvas.tsx, ToolPalette.tsx, ComponentRenderer.tsx
      simulation/worker.ts, solverClient.ts, protocol.ts
      ui/BottomSheet.tsx, SettingsSheet.tsx, CoachPanel.tsx, TracePanel.tsx
      analysis/TruthTableEditor.tsx, KMapDrawer.tsx, SynthesisPanel.tsx
      challenges/DailyChallenge.tsx, ChallengeVerifier.tsx
      file/CircuitSerializer.ts, UrlEncoder.ts
      store.ts, hooks/
    public/sw.js, manifest.webmanifest, icons/
    index.html, vite.config.ts
  website/       🔄 TODO
    src/
      build.mjs, consent.mjs, gate.mjs
      circuits.mjs, components.mjs, learn.mjs, manual.mjs
      diagram.mjs (SVG circuit renderer for guides)
      techniques/... (component data)
    test/build.test.mjs
    public/fonts/, icons/
```

---

## Commands to Run
```bash
# From repo root
pnpm install
pnpm typecheck
pnpm test

# Core
pnpm --filter @logisim/core test

# App (once created)
pnpm --filter @logisim/app dev
pnpm --filter @logisim/app build

# Website (once created)
pnpm --filter @logisim/website build
pnpm --filter @logisim/website test
```