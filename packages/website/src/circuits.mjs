/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * Interactive circuit guides data and page generator.
 * Zero dependencies; works with build.mjs.
 */

/**
 * Technique catalog - all circuit guides with description, example, and circuit data.
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
    name: 'S-R & J-K Flip-Flop Memory Stage',
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

/**
 * Build the circuit index page HTML.
 * Returns the HTML string.
 */
function buildIndexHtml(siteUrl) {
  const ORDERED = TECHNIQUES;
  const groupOf = (t) => TECHNIQUES.find((g) => g.slug === t)?.category ? 
    [{ name: 'All', slugs: TECHNIQUES.map((t) => t.slug) }] : null;

  const groups = [
    { name: 'Arithmetic', slugs: ['half-adder', 'full-adder', '4-bit-alu'] },
    { name: 'Plexers', slugs: ['multiplexer'] },
    { name: 'Sequential', slugs: ['sr-latch', '7-segment-decoder'] },
    { name: 'Combinational', slugs: ['k-map-solver', 'short-circuit-demo'] },
    { name: 'Displays', slugs: ['7-segment-decoder'] },
  ].map(([name, slugs], i) => ({
    name,
    num: String(i + 1).padStart(2, '0'),
    items: slugs.map((s) => TECHNIQUES.find((t) => t.slug === s)),
  }));

  const rail = (root, current) => `<aside class="rail">
<label class="railselect"><span>Circuit</span><select onchange="location.href=this.value" aria-label="Jump to a technique">
<option value="${root}circuits/">All circuits</option>
${groups.map((g) => `<optgroup label="${g.name}">${g.items.map((t) => `<option value="${root}circuits/${t.slug}.html"${t === current ? ' selected' : ''}>${t.name}</option>`).join('')}</optgroup>`).join('\n')}
</select></label>
<nav class="railnav" aria-label="Circuits"><h2><a href="${root}circuits/">Circuits</a></h2>
${groups.map(
  (g) => `<details${g.items.some((t) => t === current) ? ' open' : ''}><summary>${g.name} <span>${g.num}</span></summary>
<ul>${g.items.map((t) => `<li><a href="${root}circuits/${t.slug}.html"${t === current ? ' aria-current="page"' : ''}>${t.name}</a></li>`).join('')}</ul></details>`,).join('\n')}
</nav>
</aside>`;

  const body = `<div class="with-rail">${rail('../', null)}
<div class="content">
<h1>Interactive Circuit Guides</h1>
<p class="lead">Each guide includes an interactive schematic you can poke, simulate, and debug.</p>
${groups.map(
  (g) => `<section class="group"><h2><span class="num">${g.num}</span> ${g.name}</h2>
<div class="tgrid">
${g.items.map((t) => `<a class="tcard" href="${t.slug}.html"><span class="band lv-${t.level.toLowerCase()}">${t.level}</span><strong>${t.name}</strong><span>${t.summary}</span></a>`).join('\n')}
</div></section>`,).join('\n')}
</div></div>`;

  return page({
    title: 'Circuits | Logisim Revisited',
    description: 'Interactive digital logic circuit guides and examples',
    root: '../',
    path: 'circuits/',
    wide: true,
    jsonld: siteUrl
      ? {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Digital logic circuit guides',
          url: `${siteUrl}circuits/`,
          description: 'Interactive circuit guides for SR Latch, JK Flip-Flop, Half/Full Adder, 4-bit ALU, Multiplexer, 7-Segment Decoder, and Karnaugh Map Solver',
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: TECHNIQUES.length,
            itemListElement: TECHNIQUES.map((t, idx) => ({
              '@type': 'ListItem',
              position: idx + 1,
              name: t.name,
              url: `${siteUrl}circuits/${t.slug}.html`,
            })),
          },
        }
      : undefined,
    body,
  });
}

/**
 * Build an individual circuit page HTML.
 * Returns the HTML string.
 */
function buildCircuitPage(siteUrl, technique) {
  const { slug, name, level, summary, category, content, tip, example } = technique;
  const exs = [{ name: 'Example', svg: `<svg width="120" height="80"><rect x="0" y="0" width="120" height="80" fill="#111" stroke="#6B3FA0" stroke-width="1.5"/><text x="60" y="40" text-anchor="middle" fill="#6B3FA0" font-size="12">Example</text></svg>` }];
  const legend = `<div class="legend"><span class="lg place">0=Green</span><span class="lg e">1=Red</span><span class="lg z">Z=Blue</span></div>`;

  const rail = (current) => `<aside class="rail"><label class="railselect"><span>Circuit</span><select onchange="location.href=this.value" aria-label="Jump to a technique">
<option value="../">All circuits</option>
${[{ name: 'Arithmetic', slugs: ['half-adder', 'full-adder', '4-bit-alu'] }, { name: 'Plexers', slugs: ['multiplexer'] }, { name: 'Sequential', slugs: ['sr-latch', '7-segment-decoder'] }, { name: 'Combinational', slugs: ['k-map-solver', 'short-circuit-demo'] }, { name: 'Displays', slugs: ['7-segment-decoder'] }].map(([n, ss], i) => `<optgroup label="${n}">${ss.map((s) => `<option value="circuits/${s}.html"${s === example ? ' selected' : ''}>${TECHNIQUES.find((t) => t.slug === s)?.name}</option>`).join('')}</optgroup>`).join('')}
</select></label>
<nav class="railnav" aria-label="Circuits"><h2><a href="../">Circuits</a></h2>
${[{ name: 'Arithmetic', slugs: ['half-adder', 'full-adder', '4-bit-alu'] }, { name: 'Plexers', slugs: ['multiplexer'] }, { name: 'Sequential', slugs: ['sr-latch', '7-segment-decoder'] }, { name: 'Combinational', slugs: ['k-map-solver', 'short-circuit-demo'] }, { name: 'Displays', slugs: ['7-segment-decoder'] }].map(([n, ss], i) => `<details${ss.includes(example) ? ' open' : ''}><summary>${n} <span>${String(i + 1).padStart(2, '0')}</span></summary><ul>${ss.map((s) => `<li><a href="circuits/${s}.html">${TECHNIQUES.find((t) => t.slug === s)?.name}</a></li>`).join('')}</ul></details>`).join('')}
</nav>
</aside>`;

  const body = `<div class="with-rail">${rail(example)}
<article class="content guide">
<p class="crumbs"><a href="../">Circuits</a> / ${category}</p>
<h1>${name}</h1>
<p class="meta"><span class="band lv-${level.toLowerCase()}">${level}</span></p>
<p class="lead">${summary}</p>
<div class="guide-cols">
<div class="prose">
${content.map((p) => `<p>${p}</p>`).join('\n')}
${tip ? `<p class="tip"><strong>Tip:</strong> ${tip}</p>` : ''}
</div>
<div class="examples sticky">
<figure class="example" data-step="before">
<div class="steps" role="group" aria-label="Show the circuit"><button type="button" data-step="before" aria-pressed="true">← Before</button><button type="button" data-step="after" aria-pressed="false">After →</button></div>
${diagram({ components: [], wires: [] })}
<figcaption>Example circuit${legend}<a class="btn small" href="../play/?p=${slug}">Open in app</a></figcaption>
</figure>
</div>
</div>
<nav class="pager">
${prev ? `<a href="${prev.slug}.html"><small>Previous</small>← ${prev.name}</a>` : '<span></span>'}
${next ? `<a href="${next.slug}.html"><small>Next</small>${next.name} →</a>` : '<span></span>'}
</nav>
</article></div>`;

  return page({
    title: `${name}: digital logic circuit | Logisim Revisited`,
    description: `${name} circuit: ${summary}`,
    root: '../',
    path: `circuits/${slug}.html`,
    wide: true,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: `${name}: digital logic circuit`,
      description: summary,
      proficiencyLevel: level,
      url: `${siteUrl}circuits/${slug}.html`,
      author: { '@type': 'Organization', name: 'Logisim Revisited', url: siteUrl },
    },
    body,
  });
}

/**
 * Build the Learn index page HTML.
 * Returns the HTML string.
 */
function buildLearnHtml(siteUrl) {
  const learnPages = [
    { slug: 'how-digital-works', title: 'How Digital Logic Works', summary: 'Introduction to boolean logic, gates, and sequential circuits.' },
    { slug: 'k-map-tutorial', title: 'Karnaugh Map Tutorial', summary: 'Step-by-step K-Map minimization with 2, 3, and 4 variables.' },
    { slug: 'glossary', title: 'Glossary', summary: 'Terms and notation used in digital logic design.' },
    { slug: 'logisim-online-no-java', title: 'Run Logisim Online (No Java)', summary: 'How to use Logisim circuits in the browser without installing Java.' },
  ];

  const rail = (current) => `<aside class="rail"><label class="railselect"><span>Page</span><select onchange="location.href=this.value" aria-label="Jump to a page">${learnPages.map((c) => `<option value="${c.slug}.html"${c === current ? ' selected' : ''}>${c.title}</option>`).join('')}</select></label>
<nav class="railnav" aria-label="Learn"><h2><a href="./">Learn</a></h2><ul class="flat">${learnPages.map((c) => `<li><a href="${c.slug}.html"${c === current ? ' aria-current="page"' : ''}>${c.title}</a></li>`).join('')}</ul></nav></aside>`;

  const body = `<div class="with-rail">${rail(null)}
<div class="content">
<h1>Learn Digital Logic</h1>
<p class="lead">Start here if you are new, or if a guide uses a word you do not know.</p>
<div class="tgrid">${learnPages.map((c, i) => `<a class="tcard" href="${c.slug}.html"><span class="band">${String(i + 1).padStart(2, '0')}</span><strong>${c.title}</strong><span>${c.summary}</span></a>`).join('\n')}</div>
<p>When you are ready for the interactive circuits themselves, see the <a href="../circuits/">circuit guides</a>, or <a href="play/">open the app</a> and ask for a hint.</p>
</div></div>`;

  return page({
    title: 'Learn | Logisim Revisited',
    description: 'Learn how digital logic works, K-Map minimization, and no-Java alternatives',
    root: '../',
    path: 'learn/',
    wide: true,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Learn digital logic',
      url: `${siteUrl}learn/`,
      description: 'Learn digital logic: boolean gates, Karnaugh maps, sequential circuits, and running Logisim online without Java',
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: learnPages.length,
        itemListElement: learnPages.map((c, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: c.title,
          url: `${siteUrl}learn/${c.slug}.html`,
        })),
      },
    },
    body,
  });
}

/**
 * Build the Manual index page HTML.
 * Returns the HTML string.
 */
function buildManualHtml(siteUrl) {
  const manualPages = [
    { slug: 'introduction', title: 'Introduction', summary: 'Getting started with Logisim Revisited.' },
    { slug: 'circuits', title: 'Circuit Library', summary: 'Browse and import .circ circuits.' },
    { slug: 'ai-coach', title: 'AI Circuit Coach', summary: '4-stage Socratic coach for debugging and learning.' },
    { slug: 'k-map', title: 'Karnaugh Map Minimization', summary: 'Truth tables, K-Maps, and Quine-McCluskey.' },
    { slug: 'import-export', title: 'Import/Export .circ Files', summary: 'Import classic .circ files and export your work.' },
    { slug: 'settings', title: 'Settings', summary: 'Grid snap, dark mode, wire color themes, and privacy.' },
    { slug: 'daily-challenges', title: 'Daily Logic Challenges', summary: 'Date-seeded daily challenges with shareable results.' },
    { slug: 'offline', title: 'Offline & PWA', summary: 'Install as a Progressive Web App for offline use.' },
    { slug: 'privacy', title: 'Privacy and Ads', summary: 'How data is stored and advertising consent.' },
  ];

  const rail = (current) => `<aside class="rail"><label class="railselect"><span>Chapter</span><select onchange="location.href=this.value" aria-label="Jump to a chapter">${manualPages.map((c) => `<option value="${c.slug}.html"${c === current ? ' selected' : ''}>${c.title}</option>`).join('')}</select></label>
<nav class="railnav" aria-label="Manual"><h2><a href="./">Manual</a></h2><ul class="flat">${manualPages.map((c) => `<li><a href="${c.slug}.html"${c === current ? ' aria-current="page"' : ''}>${c.title}</a></li>`).join('')}</ul></nav></aside>`;

  const body = `<div class="with-rail">${rail(null)}
<div class="content">
<h1>Manual: Logisim Revisited</h1>
<p class="lead">How to use the digital logic simulator, one chapter at a time.</p>
<div class="tgrid">${manualPages.map((c, i) => `<a class="tcard" href="${c.slug}.html"><span class="band">${String(i + 1).padStart(2, '0')}</span><strong>${c.title}</strong><span>${c.summary}</span></a>`).join('\n')}</div>
</div></div>`;

  return page({
    title: 'Manual | Logisim Revisited',
    description: 'User manual for the digital logic simulator',
    root: '../',
    path: 'manual/',
    wide: true,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Manual: Logisim Revisited',
      url: `${siteUrl}manual/`,
      description: 'User manual for Logisim Revisited: circuits, AI Coach, K-Map minimization, import/export, settings, and offline mode',
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: manualPages.length,
        itemListElement: manualPages.map((c, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: c.title,
          url: `${siteUrl}manual/${c.slug}.html`,
        })),
      },
    },
    body,
  });
}

/**
 * Build an individual manual page HTML.
 * Returns the HTML string.
 */
function buildManualPage(siteUrl, chapter) {
  const { slug, title, summary } = chapter;
  const body = `<article class="content guide">
<p class="crumbs"><a href="./">Manual</a></p>
<h1>${title}</h1>
<p class="lead">${summary}</p>
<p>Content for this chapter would be written here, describing the feature in detail with examples and screenshots.</p>
</article>`;

  return page({
    title: `${title} | Logisim Revisited Manual`,
    description: `${title} part of the Logisim Revisited manual`,
    root: '../',
    path: `manual/${slug}.html`,
    wide: true,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description: summary,
      url: `${siteUrl}manual/${slug}.html`,
      author: { '@type': 'Organization', name: 'Logisim Revisited', url: siteUrl },
    },
    body,
  });
}

/**
 * Export all page builders.
 */
export const circuits = TECHNIQUES;
export { buildIndexHtml, buildCircuitPage, buildLearnHtml, buildManualHtml, buildManualPage };