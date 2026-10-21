/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * Static site generator: no dependencies. Run `pnpm --filter @logisim/app build` first to include the app under /play/.
 * Set SITE_URL (e.g. https://example.org/) to also write sitemap.xml and robots.txt.
 * Set SITE_PASSWORD to put a temporary password gate on every page (see gate.mjs); no sitemap is written then.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ADSENSE_CLIENT, applyConsent } from './consent.mjs';
import { caption, diagram, legend } from './diagram.mjs';
import { applyGate } from './gate.mjs';
import { LEARN } from './learn.mjs';
import { MANUAL } from './manual.mjs';
import { TECHNIQUES } from './techniques.mjs';
import { components } from './components.mjs';
import { circuits } from './circuits.mjs';

const examples = existsSync(new URL('./examples.json', import.meta.url))
  ? JSON.parse(readFileSync(new URL('./examples.json', import.meta.url), 'utf8'))
  : [];

const coachEx = examples.find((e) => e.slug === 'full-adder');

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'dist');
const appDist = join(here, '..', '..', 'app', 'dist');
const siteUrl = (process.env.SITE_URL ?? '').replace(/\/?$/, '/');
const REPO = 'https://github.com/your-org/logisim_revisited';

const esc = (s) => s.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"');

const GROUPS = [
  ['Arithmetic', ['half-adder', 'full-adder', '4-bit-alu']],
  ['Plexers', ['multiplexer']],
  ['Sequential', ['sr-latch']],
  ['Combinational', ['k-map-solver', 'short-circuit-demo']],
  ['Displays', ['7-segment-decoder']],
].map(([name, slugs], i) => ({ name, num: String(i + 1).padStart(2, '0'), items: slugs.map((s) => TECHNIQUES.find((t) => t.slug === s)) }));

for (const g of GROUPS) for (const t of g.items) if (!t) throw new Error('unknown technique in group ' + g.name);
const ORDERED = GROUPS.flatMap((g) => g.items);
if (ORDERED.length !== TECHNIQUES.length) throw new Error('every technique needs a group');
const groupOf = (t) => GROUPS.find((g) => g.items.includes(t));

const LOGO = (root) => `<a class="brand" href="${root}"><img src="${root}icon.svg" alt="" width="32" height="32"><span class="wordmark">Logisim<small>Revisited</small></span></a>`;

function page({ title, description, root, body, path, wide, jsonld }) {
  const canonical = siteUrl && path ? `<link rel="canonical" href="${siteUrl}${path}">` : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="msvalidate.01" content="154ADF6C231F0A051ADFE027C55A9FFF">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Logisim Revisited">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
${siteUrl ? `<meta property="og:url" content="${siteUrl}${path ?? ''}"><meta property="og:image" content="${siteUrl}icon-512.png">` : ''}
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="#F5F2EA" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#15171B" media="(prefers-color-scheme: dark)">
<link rel="icon" href="${root}favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${root}apple-touch-icon.png">
<link rel="preload" href="${root}fonts/newsreader-latin-500-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${root}site.css">
${canonical}
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>` : ''}
</head>
<body>
<header class="top">
  ${LOGO(root)}
  <nav aria-label="Main">
    <a href="${root}learn/">Learn</a>
    <a href="${root}circuits/">Circuits</a>
    <a href="${root}components/">Components</a>
    <a href="${root}manual/">Manual</a>
    <a href="${root}about.html">About</a>
    <a href="${REPO}">GitHub</a>
    <a class="btn small" href="${root}play/">Open app</a>
  </nav>
</header>
<main${wide ? ' class="wide"' : ''}>
${body}
</main>
<footer>
  <p>Free digital logic circuit simulator with AI Coach, based on Logisim 2.7.1. Free software under the GPL (GPL-3.0-or-later), with no warranty.</p>
  <p><a href="${REPO}">GitHub</a> · <a href="${REPO}/commits/main">Changelog</a> · <a href="https://sourceforge.net/projects/circuit/">Original Logisim</a> · <a href="${root}about.html">About and license</a> · <a href="${root}privacy.html">Privacy</a></p>
</footer>
</body>
</html>`;
}

function rail(root, current) {
  return `<aside class="rail">
<label class="railselect"><span>Technique</span><select onchange="location.href=this.value" aria-label="Jump to a technique">
<option value="${root}circuits/">All circuits</option>
${GROUPS.map((g) => `<optgroup label="${esc(g.name)}">${g.items.map((t) => `<option value="${root}circuits/${t.slug}.html"${t === current ? ' selected' : ''}>${esc(t.name)}</option>`).join('')}</optgroup>`).join('\n')}
</select></label>
<nav class="railnav" aria-label="Circuits"><h2><a href="${root}circuits/">Circuits</a></h2>
${GROUPS.map(
  (g) => `<details${g === current ? ' open' : ''}><summary>${esc(g.name)} <span>${g.num}</span></summary>
<ul>${g.items.map((t) => `<li><a href="${root}circuits/${t.slug}.html"${t === current ? ' aria-current="page"' : ''}>${esc(t.name)}</a></li>`).join('')}</ul></details>`,).join('\n')}
</nav>
</aside>`;
}

const puzzleOf = (e) => e.slug;

const pages = []; // [path, content]
const add = (path, content) => pages.push([path, content]);

// ---- home
const homeEx = examples.find((e) => e.slug === 'half-adder');
add(
  'index.html',
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="msvalidate.01" content="154ADF6C231F0A051ADFE027C55A9FFF">
<title>Logisim Revisited: digital logic circuit simulator with AI Coach</title>
<meta name="description" content="Free digital logic circuit simulator with AI Coach, Karnaugh maps, and .circ compatibility. No Java and no install.">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Logisim Revisited">
<meta property="og:title" content="Logisim Revisited: digital logic circuit simulator with AI Coach">
<meta property="og:description" content="Free digital logic circuit simulator with AI Coach, Karnaugh maps, and .circ compatibility. No Java and no install.">
${siteUrl ? `<meta property="og:url" content="${siteUrl}"/><meta property="og:image" content="${siteUrl}icon-512.png">` : ''}
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="#F5F2EA" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#15171B" media="(prefers-color-scheme: dark)">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="preload" href="fonts/newsreader-latin-500-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="site.css">
</head>
<body>
<header class="top">
  <a class="brand" href=""><img src="icon.svg" alt="" width="32" height="32"><span class="wordmark">Logisim<small>Revisited</small></span></a>
  <nav aria-label="Main">
    <a href="learn/">Learn</a>
    <a href="circuits/">Circuits</a>
    <a href="components/">Components</a>
    <a href="manual/">Manual</a>
    <a href="about.html">About</a>
    <a href="${REPO}">GitHub</a>
    <a class="btn small" href="play/">Open app</a>
  </nav>
</header>
<main class="wide">
  <section class="hero">
    <div>
      <p class="eyebrow">The digital logic simulator rebuilt for the web</p>
      <h1>Every circuit step,<br>explained.</h1>
      <p class="lead">A free digital logic circuit simulator: the engine, AI Coach, K-Map analyzer and .circ import/export rebuilt in TypeScript with no Java required. Get progressive nudges, step through every deduction on the board, or ask why any pin or wire is 0, 1, E (red), or Z (blue).</p>
      <p><a class="btn" href="play/">Open the simulator</a> <a class="btn alt" href="play/?daily=1">Daily challenge</a> <a class="btn alt" href="circuits/">Browse circuits</a></p>
    </div>
    ${homeEx ? `<figure class="example hero-board">${diagram(homeEx)}<figcaption><span class="mono">${esc(homeEx.name)}</span></figcaption></figure>` : ''}
  </section>
  <section class="spotlight">
    <div>
      <p class="eyebrow">AI Circuit Coach</p>
      <h2>Ask “Why not?” on any wire—and watch the proof unfold.</h2>
      <p class="lead">Stuck between two hypotheses? Select any wire or pin and ask the AI Coach “Why not 1?” It tests your hypothesis, traces the forced moves that ripple across the circuit, and highlights the exact contradiction.</p>
      <div class="coach-quote">
        <div class="mono"><strong>1. Assume</strong> → <strong>2. Forced moves</strong> → <strong>3. Contradiction</strong></div>
        <p>“Suppose we set that wire to 1. That forces gate A to output 0 and gate B to output 1… leaving no valid driver for the output pin. Therefore, the wire cannot be 1.”</p>
      </div>
      <p>Prefer not to spoil a hint? Click <strong>Coach me</strong> for progressive four-stage Socratic nudges—starting with <em>where to look</em> before revealing the pattern or the move.</p>
      <p><a class="btn" href="play/?p=half-adder&prove=r1c9.4">Try the AI Coach on a Half Adder →</a></p>
    </div>
    <figure class="example hero-board">
      ${diagram(coachEx)}
      <figcaption><span class="mono">AI Coach · Contradiction proof</span> · Assuming 1 on that wire eliminates every 3 in the feedback loop.</figcaption>
    </figure>
  </section>
  <section class="cards">
    <article><p class="eyebrow">AI Super Solver</p><h2>Nudges, walkthroughs & “Why not?”</h2><p>Let the AI Coach guide you in four stages—from where to look to the final move—or tap any wire candidate to watch the chain of forced moves that proves a contradiction.</p></article>
    <article><p class="eyebrow">K-Map Analyzer</p><h2>Truth Table & Karnaugh Map</h2><p>Minimize any Boolean expression with Quine-McCluskey and visualize the loops on a Gray-code K-Map.</p></article>
    <article><p class="eyebrow">Circuit Synthesis</p><h2>Truth Table → Gate Circuit</h2><p>Automatically synthesize a working AND-OR circuit from any truth table.</p></article>
    <article><p class="eyebrow">.circ Import/Export</p><h2>Import and export Logisim .circ files</h2><p>Open classic .circ circuits in the browser, or save your work for use in Logisim 2.7.1.</p></article>
  </section>
  <section class="learnhome"><p class="eyebrow">New to digital logic or looking for no-Java alternatives?</p><p>Read <a href="learn/how-digital-works.html">how digital logic works</a>, see <a href="learn/k-map-tutorial.html">what the K-Map tutorial means</a>, look up a word in the <a href="learn/glossary.html">glossary</a>, or learn how to run <a href="learn/logisim-online-no-java.html">Logisim online on Mac, Windows & mobile (no Java)</a>.</p></section>
  <section class="trust">
    <p>This circuit simulator runs entirely in your browser. No Java required. Works offline once installed.</p>
  </section>
</main>
<footer>
  <p>Free digital logic circuit simulator with AI Coach, based on Logisim 2.7.1. Free software under the GPL (GPL-3.0-or-later), with no warranty.</p>
  <p><a href="${REPO}">GitHub</a> · <a href="${REPO}/commits/main">Changelog</a> · <a href="https://sourceforge.net/projects/circuit/">Original Logisim</a> · <a href="about.html">About and license</a> · <a href="privacy.html">Privacy</a></p>
</footer>
</body>
</html>`,
);

// ---- circuit index
add(
  'circuits/index.html',
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="msvalidate.01" content="154ADF6C231F0A051ADFE027C55A9FFF">
<title>Circuits | Logisim Revisited</title>
<meta name="description" content="Interactive digital logic circuit guides and examples">
${siteUrl ? `<meta property="og:url" content="${siteUrl}circuits/">` : ''}
<meta property="og:type" content="website">
<meta property="og:site_name" content="Logisim Revisited">
<meta property="og:title" content="Circuits | Logisim Revisited">
<meta property="og:description" content="Interactive circuit guides for SR Latch, JK Flip-Flop, Half/Full Adder, 4-bit ALU, Multiplexer, 7-Segment Decoder, and Karnaugh Map Solver">
<link rel="icon" href="icon.svg" type="image/svg+xml">
</head>
<body>
<header class="top">
  <a class="brand" href="../"><img src="icon.svg" alt="" width="32" height="32"><span class="wordmark">Logisim<small>Revisited</small></span></a>
  <nav aria-label="Main">
    <a href="learn/">Learn</a>
    <a href="circuits/">Circuits</a>
    <a href="components/">Components</a>
    <a href="manual/">Manual</a>
    <a href="about.html">About</a>
    <a href="${REPO}">GitHub</a>
    <a class="btn small" href="play/">Open app</a>
  </nav>
</header>
<h1>Interactive Circuit Guides</h1>
  <p class="lead">Each guide includes an interactive schematic you can poke, simulate, and debug.</p>
  ${GROUPS.map((g) => `<section class="group"><h2><span class="num">${g.num}</span> ${esc(g.name)}</h2><div class="tgrid">${g.items.map((t) => `<a class="tcard" href="${t.slug}.html"><span class="band lv-${t.level.toLowerCase()}">${t.level}</span><strong>${esc(t.name)}</strong><span>${esc(t.summary)}</span></a>`).join('')}</div></section>`).join('\n')}
</div></div>
</main>
</body>
</html>`,
);

// ---- circuit pages
const STEP_SCRIPT = `<script>document.querySelectorAll('figure.example').forEach(function(f){var b=f.querySelectorAll('.steps button');b.forEach(function(x){x.addEventListener('click',function(){f.setAttribute('data-step',x.dataset.step);b.forEach(function(y){y.setAttribute('aria-pressed',String(y===x))})})})})</script>`;
ORDERED.forEach((t, i) => {
  const prev = ORDERED[i - 1];
  const next = ORDERED[i + 1];
  const g = groupOf(t);
  const exs = examples.filter((e) => e.slug === t.slug);
  add(
    `circuits/${t.slug}.html`,
    `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="msvalidate.01" content="154ADF6C231F0A051ADFE027C55A9FFF">
<title>${t.name}: digital logic circuit | Logisim Revisited</title>
<meta name="description" content="${t.name} circuit: ${t.summary}">
${siteUrl ? `<meta property="og:url" content="${siteUrl}circuits/${t.slug}.html"` : ''}
<meta property="og:type" content="website">
<meta property="og:site_name" content="Logisim Revisited">
<meta property="og:title" content="${t.name}: digital logic circuit">
<meta property="og:description" content="${t.name} circuit: ${t.summary}">
<link rel="icon" href="icon.svg" type="image/svg+xml">
</head>
<body>
<header class="top">
  <a class="brand" href="../"><img src="icon.svg" alt="" width="32" height="32"><span class="wordmark">Logisim<small>Revisited</small></span></a>
  <nav aria-label="Main">
    <a href="../">Circuits</a>
    <a href="learn/">Learn</a>
    <a href="components/">Components</a>
    <a href="manual/">Manual</a>
    <a href="about.html">About</a>
    <a href="${REPO}">GitHub</a>
    <a class="btn small" href="play/">Open app</a>
  </nav>
</header>
<main class="wide">
  <div class="with-rail">${rail('../', t)}
  <article class="content guide">
  <p class="crumbs"><a href="../">Circuits</a> / ${esc(g.name)}</p>
  <h1>${esc(t.name)}</h1>
  <p class="meta"><span class="band lv-${t.level.toLowerCase()}">${t.level}</span></p>
  <p class="lead">${esc(t.summary)}</p>
  <div class="guide-cols">
  <div class="prose">
  ${t.body.map((p) => `<p>${esc(p)}</p>`).join('\n')}
  ${t.tip ? `<p class="tip"><strong>Tip:</strong> ${esc(t.tip)}</p>` : ''}
  ${exs[0] ? `<h2>Notation</h2><p class="notation mono">${esc(exs[0].name)}: ${esc(caption(exs[0]).replace(/^[^:]*: /, ''))}</p>` : ''}
  </div>
  <div class="examples${exs.length === 1 ? ' sticky' : ''}">
  ${exs.map((e) => `<figure class="example" data-step="before">
  <div class="steps" role="group" aria-label="Show the circuit"><button type="button" data-step="before" aria-pressed="true">← Before</button><button type="button" data-step="after" aria-pressed="false">After →</button></div>
  ${diagram(e)}
  <figcaption>${esc(caption(e))}${legend(e)}<a class="btn small" href="../play/?p=${puzzleOf(e)}">Open in app</a></figcaption>
  </figure>`).join('\n')}
  ${exs.length ? '' : `<p><a class="btn" href="../play/">Practice in the app</a></p>`}
  </div>
  </div>
  <nav class="pager">
  ${prev ? `<a href="${prev.slug}.html"><small>Previous</small>← ${esc(prev.name)}</a>` : '<span></span>'}
  ${next ? `<a href="${next.slug}.html"><small>Next</small>${esc(next.name)} →</a>` : '<span></span>'}
  </nav>
  </article>
  </div>
  </main>
</body>
</html>`,
  );
});

// ---- learn
add(
  'learn/index.html',
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="msvalidate.01" content="154ADF6C231F0A051ADFE027C55A9FFF">
<title>Learn | Logisim Revisited</title>
${siteUrl ? `<meta property="og:url" content="${siteUrl}learn/">` : ''}
<meta property="og:type" content="website">
<meta property="og:site_name" content="Logisim Revisited">
<meta property="og:title" content="Learn | Logisim Revisited">
<meta property="og:description" content="Educational pages about digital logic, K-Maps, and no-Java alternatives">
<link rel="icon" href="icon.svg" type="image/svg+xml">
</head>
<body>
<header class="top">
  <a class="brand" href="../"><img src="icon.svg" alt="" width="32" height="32"><span class="wordmark">Logisim<small>Revisited</small></span></a>
  <nav aria-label="Main">
    <a href="../">Circuits</a>
    <a href="learn/">Learn</a>
    <a href="components/">Components</a>
    <a href="manual/">Manual</a>
    <a href="about.html">About</a>
    <a href="${REPO}">GitHub</a>
    <a class="btn small" href="play/">Open app</a>
  </nav>
</header>
<main class="wide">
  <div class="with-rail">${rail(null)}
  <div class="content">
  <h1>Learn digital logic</h1>
  <p class="lead">Start here if you are new, or if a guide uses a word you do not know.</p>
  <div class="tgrid">
  ${LEARN.map((c, i) => `<a class="tcard" href="${c.slug}.html"><span class="band">${String(i + 1).padStart(2, '0')}</span><strong>${esc(c.title)}</strong><span>${esc(c.summary)}</span></a>`).join('\n')}
  </div>
  <p>When you are ready for the circuits themselves, see the <a href="../circuits/">circuit guides</a>, or <a href="play/">open the app</a> and ask for a hint.</p>
  </div></div>
  </main>
</body>
</html>`,
);

// ---- manual
add(
  'manual/index.html',
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="msvalidate.01" content="154ADF6C231F0A051ADFE027C55A9FFF">
<title>Manual | Logisim Revisited</title>
${siteUrl ? `<meta property="og:url" content="${siteUrl}manual/">` : ''}
<meta property="og:type" content="website">
<meta property="og:site_name" content="Logisim Revisited">
<meta property="og:title" content="Manual | Logisim Revisited">
<meta property="og:description" content="User manual for the digital logic simulator">
<link rel="icon" href="icon.svg" type="image/svg+xml">
</head>
<body>
<header class="top">
  <a class="brand" href="../"><img src="icon.svg" alt="" width="32" height="32"><span class="wordmark">Logisim<small>Revisited</small></span></a>
  <nav aria-label="Main">
    <a href="../">Circuits</a>
    <a href="learn/">Learn</a>
    <a href="components/">Components</a>
    <a href="manual/">Manual</a>
    <a href="about.html">About</a>
    <a href="${REPO}">GitHub</a>
    <a class="btn small" href="play/">Open app</a>
  </nav>
</header>
<main class="wide">
  <div class="with-rail">${rail(null)}
  <div class="content">
  <h1>Manual: Logisim Revisited</h1>
  <p class="lead">How to use the simulator, one chapter at a time.</p>
  <div class="tgrid">
  ${MANUAL.map((c, i) => `<a class="tcard" href="${c.slug}.html"><span class="band">${String(i + 1).padStart(2, '0')}</span><strong>${esc(c.title)}</strong><span>${esc(c.summary)}</span></a>`).join('\n')}
  </div>
  </div></div>
  </main>
</body>
</html>`,
);

// ---- about
add(
  'about.html',
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="msvalidate.01" content="154ADF6C231F0A051ADFE027C55A9FFF">
<title>About Logisim Revisited</title>
${siteUrl ? `<meta property="og:url" content="${siteUrl}about.html"` : ''}
<meta property="og:type" content="website">
<meta property="og:site_name" content="Logisim Revisited">
<meta property="og:title" content="About Logisim Revisited">
<meta property="og:description" content="About Logisim Revisited, a free digital logic simulator">
<link rel="icon" href="icon.svg" type="image/svg+xml">
</head>
<body>
<header class="top">
  <a class="brand" href=""><img src="icon.svg" alt="" width="32" height="32"><span class="wordmark">Logisim<small>Revisited</small></span></a>
  <nav aria-label="Main">
    <a href="../">Circuits</a>
    <a href="learn/">Learn</a>
    <a href="components/">Components</a>
    <a href="manual/">Manual</a>
    <a href="about.html">About</a>
    <a href="${REPO}">GitHub</a>
    <a class="btn small" href="play/">Open app</a>
  </nav>
</header>
<main class="wide">
  <div>
  <h1>About</h1>
  <p>Logisim Revisited is a free digital logic circuit simulator. It is a TypeScript port of Logisim, the digital logic circuit simulator and educational tool by Carl Burch (2001-2011). Logisim has not been updated since 2013 and runs only as a Java desktop program. This project brings its simulation engine to the web and mobile with a new interface.</p>
  <h2>Accuracy</h2>
  <p>The simulation engine was verified against the original Java program: hundreds of circuits are tested and the new engine must find identical 4-state logic behavior.</p>
  <h2>License</h2>
  <p>Logisim Revisited comes with ABSOLUTELY NO WARRANTY. The code is free software under the GNU General Public License, version 3 or later, as the original. You may use, study, change and share it under those terms. The complete source code is at <a href="${REPO}">${REPO}</a>. Changes to the original code are marked in the file headers.</p>
  <p>Logisim Revisited is not affiliated with or endorsed by Carl Burch or Hendrix College. The technique guides and the user interface are new texts and designs and are not taken from the original Logisim manual.</p>
  <p>The simulation engine follows the same 4-state logic (0, 1, Z, E) as classic Logisim 2.7.1.</p>
  </div>
  </main>
</body>
</html>`,
);

// ---- privacy
add(
  'privacy.html',
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="msvalidate.01" content="154ADF6C231F0A051ADFE027C55A9FFF">
<title>Privacy | Logisim Revisited</title>
${siteUrl ? `<meta property="og:url" content="${siteUrl}privacy.html"` : ''}
<meta property="og:type" content="website">
<meta property="og:site_name" content="Logisim Revisited">
<meta property="og:title" content="Privacy | Logisim Revisited">
<meta property="og:description" content="What data Logisim Revisited stores and what it does not">
<link rel="icon" href="icon.svg" type="image/svg+xml">
</head>
<body>
<header class="top">
  <a class="brand" href=""><img src="icon.svg" alt="" width="32" height="32"><span class="wordmark">Logisim<small>Revisited</small></span></a>
  <nav aria-label="Main">
    <a href="../">Circuits</a>
    <a href="learn/">Learn</a>
    <a href="components/">Components</a>
    <a href="manual/">Manual</a>
    <a href="about.html">About</a>
    <a href="${REPO}">GitHub</a>
    <a class="btn small" href="play/">Open app</a>
  </nav>
</header>
<main class="wide">
  <div>
  <h1>Privacy</h1>
  <p>The app runs entirely in your browser. Circuits are simulated and stored on your device. Your current circuit and settings are saved in your browser's local storage so you can continue later; they are never sent to a server.</p>
  <h2>Advertising</h2>
  <p>This site shows ads served by Google AdSense. For visitors in the EEA, the UK and Switzerland, Google Consent Mode v2 (<code>ad_storage</code>, <code>ad_user_data</code>, <code>ad_personalization</code> and <code>analytics_storage</code>) defaults to denied and Google's certified IAB TCF v2.2 consent banner asks whether you accept cookies and personalized ads. Any visitor can also review, change or withdraw consent at any time with the "Cookie settings" button in the footer, which opens Google's consent manager (or stores your local preference under <code>logisim-consent</code> in your browser's local storage, so rejecting disables the advertising script).</p>
  <p>You can also manage or turn off personalized ads in <a href="https://adssettings.google.com/">Google's ad settings</a>, and learn how Google uses data at <a href="https://policies.google.com/technologies/partner-sites">policies.google.com/technologies/partner-sites</a>.</p>
  <p>The solver app under <a href="play/">/play/</a> shares the same consent preference (and offers "Cookie settings" under <em>Settings → About and license</em>). Your circuits, history and settings stay in your browser.</p>
  <p>This site has no accounts and uses no analytics of its own.</p>
  <p>Questions: open an issue at <a href="${REPO}/issues">${REPO}/issues</a>.</p>
  </div>
  </main>
</body>
</html>`,
);

// ---- 404
add(
  '404.html',
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="msvalidate.01" content="154ADF6C231F0A051ADFE027C55A9FFF">
<title>Page not found | Logisim Revisited</title>
${siteUrl ? `<meta property="og:url" content="${siteUrl}404.html"` : ''}
<meta property="og:type" content="website">
<meta property="og:site_name" content="Logisim Revisited">
<meta property="og:title" content="Page not found">
<link rel="icon" href="icon.svg" type="image/svg+xml">
</head>
<body>
<header class="top">
  <a class="brand" href=""><img src="icon.svg" alt="" width="32" height="32"><span class="wordmark">Logisim<small>Revisited</small></span></a>
  <nav aria-label="Main">
    <a href="../">Circuits</a>
    <a href="learn/">Learn</a>
    <a href="components/">Components</a>
    <a href="manual/">Manual</a>
    <a href="about.html">About</a>
    <a href="${REPO}">GitHub</a>
    <a class="btn small" href="play/">Open app</a>
  </nav>
</header>
<main>
  <h1>Page not found</h1>
  <p><a href="../">Back to the start page</a></p>
  </main>
</body>
</html>`,
);

// ---- write
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const [path, content] of pages) {
  const file = join(out, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}
writeFileSync(join(out, 'site.css'), '/* tokens shared with app */');

for (const f of ['icon.svg', 'favicon.svg', 'apple-touch-icon.png', 'icon-512.png']) {
  const src = join(here, '..', '..', 'app', 'public', f);
  if (existsSync(src)) cpSync(src, join(out, f));
}
const fontSrc = join(here, '..', '..', 'app', 'node_modules', '@fontsource');
const FONTS = [
  ['inter', 'latin', '400'],
  ['inter', 'latin', '700'],
];
mkdirSync(join(out, 'fonts'), { recursive: true });
for (const [id, , w] of FONTS) {
  const src = join(fontSrc, id, 'files', `${id}-latin-${w}-normal.woff2`);
  if (existsSync(src)) cpSync(src, join(out, 'fonts', `${id}-latin-${w}-normal.woff2`));
}
if (existsSync(appDist)) cpSync(appDist, join(out, 'play'), { recursive: true });
else console.warn('packages/app/dist not found: the site is built without /play/');

console.log(`consent banner added to ${applyConsent(out)} pages`);

if (siteUrl && siteUrl !== '/' && !new URL(siteUrl).hostname.endsWith('github.io')) writeFileSync(join(out, 'CNAME'), new URL(siteUrl).hostname + '\n');

writeFileSync(join(out, 'ads.txt'), `google.com, pub-${ADSENSE_CLIENT.replace('ca-pub-', '')}, DIRECT, f08c47fec0942fa0\n`);

const gated = Boolean(process.env.SITE_PASSWORD);
if (!gated && siteUrl !== '/') {
  const urls = pages.map(([p]) => p).filter((p) => p !== '404.html').map((p) => siteUrl + p.replace(/index\.html$/, ''));
  if (existsSync(appDist)) urls.push(siteUrl + 'play/');
  writeFileSync(
    join(out, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`,
  );
  writeFileSync(join(out, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${siteUrl}sitemap.xml\n`);
}
if (gated) console.log(`password gate added to ${applyGate(out, process.env.SITE_PASSWORD)} pages`);
console.log(`wrote ${pages.length} pages to ${out}`);