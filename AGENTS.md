# AGENTS.md

Guidance for AI coding agents (and humans) working in this repository. Read this before making
changes.

## What this is

Logisim Revisited is a modern TypeScript port of **Logisim 2.7.1** (Carl Burch's educational digital
logic circuit design and simulation tool, 2001–2011). The goal is to bring discrete-event 4-state
digital logic simulation, `.circ` XML file compatibility, Karnaugh map / Quine-McCluskey combinational
analysis, and an interactive Symbolic AI Circuit Coach & Signal Prover to the browser and mobile PWA.
Licensed **GPL-3.0-or-later**.

## Repository layout

pnpm workspace, Node >= 22.18 (the site build imports TypeScript sources with Node's built-in type
stripping), TypeScript, ESM throughout.

- `packages/core` — the engine. Pure TypeScript: **no DOM, no Node APIs.** 4-state multi-bit logic values,
  component libraries (Wiring, Gates, Plexers, Arithmetic, Memory, Input/Output), discrete-event circuit
  simulator, backward signal provenance tracer, Quine-McCluskey & Karnaugh Map combinational analyzer,
  circuit synthesizer, and Logisim 2.7.1 `.circ` XML parser/serializer.
- `packages/app` — the PWA (React 19 + Vite 8). Interactive SVG schematic editor & live Poke simulator,
  4-stage Socratic AI Circuit Coach, "Why is this wire/pin 0 / 1 / E / Z?" signal prover, interactive
  Truth Table & Karnaugh Map drawer, and Daily Logic Challenge mode.
- `packages/website` — a dependency-free static site generator (plain `.mjs`). Pages: home, interactive
  circuit guides (`/circuits/`), component reference library (`/components/`), Learn pages (`/learn/`,
  including `logisim-online-no-java.html`), the manual (`/manual/`), about/privacy, and the app copied
  to `/play/`.
- `docs/` — `PORT-PLAN.md` (status and roadmap), `LICENSE-AUDIT.md`.

## Common commands

Run from the repository root:

```sh
pnpm install
pnpm typecheck                                    # tsc across packages; node --check for the website
pnpm test                                         # every package
pnpm --filter @logisim/core test
pnpm --filter @logisim/app test
pnpm --filter @logisim/app dev                    # dev server
pnpm --filter @logisim/app build                  # tsc + vite build -> packages/app/dist
pnpm --filter @logisim/website build              # site, including the app -> packages/website/dist
pnpm --filter @logisim/website test               # builds the site, then asserts on the output
```

`SITE_URL=https://logisimrevisited.com/` is set in CI for the website build (it writes `sitemap.xml`
and `robots.txt`).

Before finishing a change, run `pnpm typecheck` and `pnpm test`, and the affected package's `build`.

## Architecture notes

- **Pure core engine.** `packages/core` has zero DOM or Node dependencies so it runs identically in
  Node tests, the browser, or a Web Worker. The app currently calls it synchronously on the main thread
  (`state/useCircuitStore.ts`); move it to a worker only if circuits grow large enough to need it.
- **The website is generated.** `packages/website/src/build.mjs` builds every page through the one shell in
  `layout.mjs` (links are relative to the page, derived from its path) and writes `site.css` from `styles.mjs`,
  which reuses the app's design tokens. Scripts are inlined, e.g. `gate.mjs`, `consent.mjs`.
  `/play/` is the app's own Vite build copied verbatim.
- **One schematic renderer.** `packages/app/src/render/schematic.ts` (pure TS, no DOM or React) turns circuits
  into shape descriptions. The app canvas maps them to React elements; the site serializes them to SVG text
  for circuit guides, component pages and the home page, with styles from `render/schematic.css`. The site
  loads these `.ts` files through `website/src/register-ts.mjs`, so they must stay erasable TypeScript: no
  enums, namespaces or parameter properties, and type-only imports marked `type`.
- **Ads load only after consent.** `consent.mjs` adds Google Consent Mode v2 and the consent banner to
  every site page; the AdSense script is injected only after consent.
- **Coding conventions.** TypeScript `strict` (see `tsconfig.base.json`). Prefer named exports.
  Style: **2-space indent, single quotes, semicolons.**
- **American spelling.** UI text, docs, and comments use American spelling (`color`, `behavior`,
  `center`, `labeled`, `gray`). A website test fails if British spellings appear.
- **Git workflow.** Never commit or push directly to `main`; always work on a feature branch and open
  a pull request. Commit subjects read `Area: summary`, lowercase after the colon.
