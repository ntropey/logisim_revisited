/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * Static site generator: no dependencies. Run `pnpm --filter @logisim/app build` first to include the app under /play/.
 * Set SITE_URL (e.g. https://example.org/) to also write sitemap.xml and robots.txt.
 * Set SITE_PASSWORD to put a temporary password gate on every page (see gate.mjs); no sitemap is written then.
 */
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ADSENSE_CLIENT, applyConsent } from './consent.mjs';
import { applyGate } from './gate.mjs';
import { cards, cleanPath, esc, page, rail, REPO } from './layout.mjs';
import { LEARN } from './learn.mjs';
import { MANUAL } from './manual.mjs';
import { COMPONENTS } from './components.mjs';
import { TECHNIQUES } from './techniques.mjs';
import { FONT_FILES, SITE_CSS } from './styles.mjs';
import { circuitSchematic, componentSchematic, simulatedTruthTable } from './schematics.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'dist');
const appDist = join(here, '..', '..', 'app', 'dist');
const appPublic = join(here, '..', '..', 'app', 'public');
const siteUrl = (process.env.SITE_URL ?? '').replace(/\/?$/, '/');

const GROUPS = [
  ['Arithmetic', ['half-adder', 'full-adder', '4-bit-alu']],
  ['Plexers', ['multiplexer']],
  ['Sequential', ['sr-latch', 'd-flip-flop', 't-flip-flop', 'jk-flip-flop']],
  ['Combinational', ['xor-parity', 'k-map-solver', 'short-circuit-demo']],
  ['Displays', ['7-segment-decoder']],
].map(([name, slugs], i) => ({
  name,
  num: String(i + 1).padStart(2, '0'),
  items: slugs.map((s) => {
    const t = TECHNIQUES.find((x) => x.slug === s);
    if (!t) throw new Error(`unknown technique ${s} in group ${name}`);
    return t;
  }),
}));
const ORDERED = GROUPS.flatMap((g) => g.items);
if (ORDERED.length !== TECHNIQUES.length) throw new Error('every technique needs a group');

const componentSlug = (c) => c.type.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const COMPONENT_CATEGORIES = [...new Set(COMPONENTS.map((c) => c.category))];

const pages = []; // [path, html]
const add = (path, opts) => pages.push([path, page({ siteUrl, path, ...opts })]);
const abs = (path) => (siteUrl !== '/' ? siteUrl + cleanPath(path) : cleanPath(path));
const article = (headline, description, path) => ({
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline,
  description,
  url: abs(path),
  author: { '@type': 'Organization', name: 'Logisim Revisited' },
});
const crumbs = (...items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(path) })),
});

/** An index + detail pages for a section whose entries are { slug, title, summary, body }. */
function section({ dir, label, heading, title, lead, items, closing = '' }) {
  const href = (i) => i.slug;
  const railFor = (current) =>
    rail({ label, heading, indexHref: './', items: items.map((i) => ({ href: href(i), title: i.title, key: i.slug })), current });
  add(`${dir}/index.html`, {
    section: `${dir}/`,
    wide: true,
    title: `${title} | Logisim Revisited`,
    description: lead,
    jsonld: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, description: lead, url: abs(`${dir}/`) },
    body: `<div class="with-rail">${railFor(null)}
<div class="content">
<p class="eyebrow">${esc(heading)}</p>
<h1>${esc(title)}</h1>
<p class="lead">${esc(lead)}</p>
${cards(items.map((i) => ({ href: href(i), title: i.title, summary: i.summary })))}
${closing}
</div></div>`,
  });
  items.forEach((i, n) => {
    const prev = items[n - 1];
    const next = items[n + 1];
    add(`${dir}/${i.slug}.html`, {
      section: `${dir}/`,
      wide: true,
      title: `${i.title} | Logisim Revisited ${heading}`,
      description: i.summary,
      jsonld: [article(i.title, i.summary, `${dir}/${i.slug}.html`), crumbs(['Home', ''], [heading, `${dir}/`], [i.title, `${dir}/${i.slug}.html`])],
      body: `<div class="with-rail">${railFor(i.slug)}
<article class="content guide">
<p class="crumbs"><a href="./">${esc(heading)}</a></p>
<h1>${esc(i.title)}</h1>
<p class="lead">${esc(i.summary)}</p>
${i.body}
<nav class="pager">
${prev ? `<a href="${href(prev)}"><small>Previous</small>← ${esc(prev.title)}</a>` : '<span></span>'}
${next ? `<a href="${href(next)}"><small>Next</small>${esc(next.title)} →</a>` : '<span></span>'}
</nav>
</article>
</div>`,
    });
  });
}

// ---- home
const LEGEND = '<div class="legend"><span class="lg place">0</span><span class="lg e">1</span><span class="lg z">Z floating</span><span class="lg elim">E conflict (dashed)</span></div>';

/** Simulated truth table as HTML, or '' for circuits that do not have one. */
function truthTableHtml(slug, tt = simulatedTruthTable(slug)) {
  if (!tt) return '';
  const framesJson = JSON.stringify(tt.rows.map((r) => r.svg)).replace(/</g, '\\u003c');
  return `<table class="truth" data-initial-row="${tt.initialRow}"><caption>Every input combination, run through the simulator — click any row to update the schematic</caption><thead><tr>${tt.inputs.map((n) => `<th>${esc(n)}</th>`).join('')}${tt.outputs.map((n) => `<th class="out">${esc(n)}</th>`).join('')}</tr></thead><tbody>${tt.rows
    .map((r) => `<tr>${r.inputs.map((b) => `<td>${b}</td>`).join('')}${r.outputs.map((v) => `<td class="out v${esc(v)}">${esc(v)}</td>`).join('')}</tr>`)
    .join('')}</tbody></table><script>(function(){var f=${framesJson},t=document.querySelector('table.truth'),s=document.querySelector('.schematic-stage'),bs=document.querySelectorAll('.poke-btn');if(!t||!s)return;var rs=t.querySelectorAll('tbody tr'),n=bs.length,cur=Number(t.getAttribute('data-initial-row'))||0;function set(i){cur=i;if(f[i])s.innerHTML=f[i];rs.forEach(function(r,idx){r.classList.toggle('active',idx===i);r.setAttribute('aria-selected',idx===i?'true':'false');});bs.forEach(function(b,k){var bit=(i>>(n-1-k))&1;b.setAttribute('aria-pressed',bit?'true':'false');var v=b.querySelector('.val');if(v){v.textContent=String(bit);v.className='val v'+bit;}});}rs.forEach(function(r,idx){r.tabIndex=0;r.setAttribute('role','button');r.addEventListener('click',function(){set(idx);});r.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();set(idx);}else if(e.key==='ArrowDown'&&idx+1<rs.length){e.preventDefault();rs[idx+1].focus();set(idx+1);}else if(e.key==='ArrowUp'&&idx>0){e.preventDefault();rs[idx-1].focus();set(idx-1);}});});bs.forEach(function(b,k){b.addEventListener('click',function(){set(cur^(1<<(n-1-k)));});});set(cur);})();</script>`;
}

function pokeButtonsHtml(tt) {
  if (!tt) return '';
  return `<div class="poke-bar" role="group" aria-label="Toggle circuit inputs"><span class="poke-label">Poke inputs:</span>${tt.inputs
    .map((name, idx) => {
      const bit = tt.rows[tt.initialRow].inputs[idx];
      return `<button type="button" class="poke-btn" data-input="${idx}" aria-pressed="${bit === 1}">${esc(name)} = <span class="val v${bit}">${bit}</span></button>`;
    })
    .join('')}</div>`;
}

add('index.html', {
  wide: true,
  title: 'Logisim Online & AI Circuit Coach | Logisim Revisited (No Java)',
  description: 'Run Logisim online in your browser with no Java required: 4-state digital logic simulator, Logisim AI Circuit Coach & signal prover, Karnaugh map solver, and .circ compatibility.',
  jsonld: {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Logisim Revisited',
    description: 'Run Logisim online in the browser with no Java: 4-state digital logic circuit simulator, Logisim AI Circuit Coach, Karnaugh maps, and .circ file compatibility.',
    url: abs(''),
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any (web browser)',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  },
  body: `<section class="hero">
  <div>
    <p class="eyebrow">Logisim online — rebuilt for the browser (no Java)</p>
    <h1>Every circuit step, explained.</h1>
    <p class="lead">Run Logisim online with the 4-state simulation engine, symbolic <strong>Logisim AI Circuit Coach</strong>, Karnaugh map analyzer, and Logisim 2.7.1 <span class="mono">.circ</span> import/export rebuilt in TypeScript. Ask why any pin or wire is 0, 1, E (red) or Z (blue), or get 4-stage Socratic nudges.</p>
    <div class="actions"><a class="btn" href="play/">Open the simulator</a> <a class="btn alt" href="play/?daily=1">Daily challenge</a> <a class="btn alt" href="circuits/">Browse circuits</a></div>
  </div>
  <figure class="gatecard">${circuitSchematic('half-adder')}<figcaption>A half adder with A = 1 and B = 1, drawn by the simulator: Sum is A XOR B, Carry is A AND B.</figcaption></figure>
</section>
<section class="spotlight">
  <div>
    <p class="eyebrow">Logisim AI Circuit Coach &amp; Signal Prover</p>
    <h2>Ask "why?" about any wire, and watch the proof unfold.</h2>
    <p class="lead">Select a wire, <a href="components/pin">Input/Output Pin</a>, flip-flop, or gate and ask why it has its value. The symbolic AI Coach traces the upstream drivers behind it and highlights the exact cause.</p>
    <p><a class="btn" href="manual/ai-coach">How the AI Coach works →</a></p>
  </div>
  <div class="coach-quote">
    <div class="mono"><strong>1. Where to look</strong> → <strong>2. The pattern</strong> → <strong>3. The logic</strong> → <strong>4. Conclusion</strong></div>
    <p>"The output is E because two gates drive this wire at once: one with 0 and one with 1. Separate them with an OR gate or a tri-state buffer."</p>
  </div>
</section>
<section class="cards">
  <article><p class="eyebrow">Simulator</p><h2>4-state logic</h2><p>0, 1, Z and E on single wires and buses up to 32 bits across all 41 classic <a href="components/">Logisim components</a>.</p></article>
  <article><p class="eyebrow">K-Map Analyzer</p><h2>Truth table to circuit</h2><p>Minimize with Quine-McCluskey, see the loops on a Gray-code map, then synthesize gates in one click.</p></article>
  <article><p class="eyebrow">Compatible</p><h2>.circ import and export</h2><p>Open classic Logisim 2.7.1 files in the browser, and save back for the original program.</p></article>
  <article><p class="eyebrow">Practice</p><h2>Daily challenges</h2><p>A new design or troubleshooting puzzle every day, with shareable results.</p></article>
</section>
<section class="learnhome"><p>Popular references: <a href="components/7-segment-display">7-Segment Display Pins</a> · <a href="components/s-r-flip-flop">S-R Flip-Flop</a> · <a href="components/t-flip-flop">T Flip-Flop</a> · <a href="components/xor-gate">XOR Logic Gate</a> · <a href="components/pin">Input Pin</a> · <a href="components/tunnel">Tunnel</a>. Looking for a Java-free Logisim? See <a href="learn/logisim-online-no-java">Logisim Online (No Java)</a>.</p></section>
<section class="trust"><p>Runs entirely in your browser. Works offline once installed.</p></section>`,
});

// ---- circuits
const circuitLink = (t) => ({ href: t.slug, title: t.name, summary: t.summary, band: t.level });
const circuitRail = (current) =>
  rail({
    label: 'Circuit',
    heading: 'Circuits',
    indexHref: './',
    items: ORDERED.map((t) => ({ href: t.slug, title: t.name, key: t.slug })),
    current,
  });
add('circuits/index.html', {
  section: 'circuits/',
  wide: true,
  title: 'Circuit Guides | Logisim Revisited',
  description: 'Guided digital logic circuits: adders, an ALU, a multiplexer, flip-flops, a counter, and a K-map majority voter.',
  jsonld: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Circuit guides', url: abs('circuits/') },
  body: `<div class="with-rail">${circuitRail(null)}
<div class="content">
<p class="eyebrow">Circuits</p>
<h1>Circuit guides</h1>
<p class="lead">Each guide explains one circuit, what to watch for, and opens it in the app so you can poke the inputs.</p>
${GROUPS.map(
  (g) => `<section class="group"><h2><span class="num">${g.num}</span>${esc(g.name)}</h2>${cards(g.items.map(circuitLink))}</section>`,
).join('\n')}
</div></div>`,
});
ORDERED.forEach((t, i) => {
  const prev = ORDERED[i - 1];
  const next = ORDERED[i + 1];
  const g = GROUPS.find((x) => x.items.includes(t));
  const tt = simulatedTruthTable(t.example);
  add(`circuits/${t.slug}.html`, {
    section: 'circuits/',
    wide: true,
    title: `${t.name}: digital logic circuit | Logisim Revisited`,
    description: `${t.name}: ${t.summary}`,
    jsonld: [article(t.name, t.summary, `circuits/${t.slug}.html`), crumbs(['Home', ''], ['Circuits', 'circuits/'], [t.name, `circuits/${t.slug}.html`])],
    body: `<div class="with-rail">${circuitRail(t.slug)}
<article class="content guide">
<p class="crumbs"><a href="./">Circuits</a> / ${esc(g.name)}</p>
<h1>${esc(t.name)}</h1>
<p class="meta"><span class="band lv-${t.level.toLowerCase()}">${esc(t.level)}</span></p>
<p class="lead">${esc(t.summary)}</p>
<div class="guide-cols">
<div class="prose">
${t.body.map((p) => `<p>${esc(p)}</p>`).join('\n')}
${t.tip ? `<p class="tip"><strong>Tip:</strong> ${esc(t.tip)}</p>` : ''}
</div>
<div class="figure-col">
<figure class="circuit"><div class="schematic-stage">${circuitSchematic(t.example)}</div>${pokeButtonsHtml(tt)}
<figcaption>As it opens in the app, with live wire colors.${LEGEND}</figcaption>
<p><a class="btn" href="../play/?p=${esc(t.example)}">Open in the app</a></p>
</figure>
${truthTableHtml(t.example, tt)}
</div>
</div>
<nav class="pager">
${prev ? `<a href="${prev.slug}"><small>Previous</small>← ${esc(prev.name)}</a>` : '<span></span>'}
${next ? `<a href="${next.slug}"><small>Next</small>${esc(next.name)} →</a>` : '<span></span>'}
</nav>
</article>
</div>`,
  });
});

// ---- learn, manual
section({
  dir: 'learn',
  label: 'Page',
  heading: 'Learn',
  title: 'Learn digital logic',
  lead: 'Start here if you are new, or if a guide uses a word you do not know.',
  items: LEARN,
  closing: '<p>Ready for the circuits themselves? See the <a href="../circuits/">circuit guides</a>, or <a href="../play/">open the app</a>.</p>',
});
section({
  dir: 'manual',
  label: 'Chapter',
  heading: 'Manual',
  title: 'Manual',
  lead: 'How to use the simulator, one chapter at a time.',
  items: MANUAL,
});

// ---- components
const COMP_ITEMS = COMPONENTS.map((c) => ({ ...c, slug: componentSlug(c) }));
if (new Set(COMP_ITEMS.map((c) => c.slug)).size !== COMP_ITEMS.length) throw new Error('duplicate component slug');
const compRail = (current) =>
  rail({
    label: 'Component',
    heading: 'Components',
    indexHref: './',
    items: COMP_ITEMS.map((c) => ({ href: c.slug, title: c.shortName, key: c.slug })),
    current,
  });

function componentTruthTableHtml(tt) {
  if (!tt) return '';
  return `<table class="truth"><caption>${esc(tt.caption)}</caption><thead><tr>${tt.headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${tt.rows
    .map((r) => `<tr>${r.map((cell) => `<td>${esc(cell)}</td>`).join('')}</tr>`)
    .join('')}</tbody></table>`;
}

function componentPinTableHtml(pinTable) {
  if (!pinTable || !pinTable.length) return '';
  return `<table class="ref"><thead><tr><th>Pin</th><th>Direction</th><th>Width</th><th>Location &amp; Role</th></tr></thead><tbody>${pinTable
    .map(([pin, dir, width, role]) => `<tr><td><span class="mono">${esc(pin)}</span></td><td>${esc(dir)}</td><td><span class="mono">${esc(width)}</span></td><td>${esc(role)}</td></tr>`)
    .join('')}</tbody></table>`;
}

add('components/index.html', {
  section: 'components/',
  wide: true,
  title: 'Component Reference | Logisim Revisited',
  description: `Reference for all ${COMP_ITEMS.length} components in the simulator, grouped by library.`,
  jsonld: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Component reference', url: abs('components/') },
  body: `<div class="with-rail">${compRail(null)}
<div class="content">
<p class="eyebrow">Components</p>
<h1>Component reference</h1>
<p class="lead">${COMP_ITEMS.length} components in ${COMPONENT_CATEGORIES.length} libraries, matching the Logisim 2.7.1 libraries.</p>
${COMPONENT_CATEGORIES.map(
  (cat) => `<section class="group"><h2>${esc(cat)}</h2>${cards(
    COMP_ITEMS.filter((c) => c.category === cat).map((c) => ({ href: c.slug, title: c.shortName, summary: c.desc, band: c.category })),
  )}</section>`,
).join('\n')}
</div></div>`,
});
COMP_ITEMS.forEach((c, i) => {
  const prev = COMP_ITEMS[i - 1];
  const next = COMP_ITEMS[i + 1];
  const pageTitle = c.seoTitle ? `${c.seoTitle} | Logisim Revisited` : `${c.shortName} (${c.type}) | Logisim Revisited Components`;
  const heading = c.h1 || c.shortName;
  add(`components/${c.slug}.html`, {
    section: 'components/',
    wide: true,
    title: pageTitle,
    description: c.desc,
    jsonld: [article(heading, c.desc, `components/${c.slug}.html`), crumbs(['Home', ''], ['Components', 'components/'], [c.shortName, `components/${c.slug}.html`])],
    body: `<div class="with-rail">${compRail(c.slug)}
<article class="content guide">
<p class="crumbs"><a href="./">Components</a> / ${esc(c.category)}</p>
<h1>${esc(heading)}</h1>
<p class="lead">${esc(c.desc)}</p>
<figure class="circuit part">${componentSchematic(c.type)}<figcaption>Default settings, facing east. Pins are the dots.</figcaption></figure>
<table class="ref">
<tr><th>Library</th><td>${esc(c.category)}</td></tr>
<tr><th>Type name</th><td><span class="mono">${esc(c.type)}</span></td></tr>
<tr><th>Pins and defaults</th><td><span class="mono">${esc(c.pins)}</span></td></tr>
</table>
<p><a class="btn" href="../play/">Try it in the app</a></p>
<h2>How the ${esc(c.shortName)} Works in Logisim</h2>
<div class="prose">
${(c.body ?? []).map((p) => `<p>${esc(p)}</p>`).join('\n')}
${c.tip ? `<p class="tip"><strong>Tip:</strong> ${esc(c.tip)}</p>` : ''}
</div>
<h2>${esc(c.shortName)} Pins &amp; Pinout</h2>
${componentPinTableHtml(c.pinTable)}
${c.truthTable ? `<h2>${esc(c.shortName)} Truth Table &amp; Behavior</h2>\n${componentTruthTableHtml(c.truthTable)}` : ''}
${
  c.related && c.related.length
    ? `<h2>Related Circuits &amp; Components</h2>\n<ul>${c.related.map((r) => `<li><a href="${esc(r.href)}">${esc(r.label)}</a></li>`).join('')}</ul>`
    : ''
}
<nav class="pager">
${prev ? `<a href="${prev.slug}"><small>Previous</small>← ${esc(prev.shortName)}</a>` : '<span></span>'}
${next ? `<a href="${next.slug}"><small>Next</small>${esc(next.shortName)} →</a>` : '<span></span>'}
</nav>
</article>
</div>`,
  });
});

// ---- about, privacy, 404
add('about.html', {
  title: 'About Logisim Revisited',
  description: 'About Logisim Revisited, a free digital logic simulator, and the Logisim 2.7.1 project it is based on.',
  body: `<h1>About Logisim Revisited</h1>
<p class="lead">A modern port of Logisim 2.7.1 for the web.</p>
<p>Logisim was written by Carl Burch and used for years to teach digital logic. It is a Java program, which makes it hard to run today. Logisim Revisited rebuilds its simulation engine and file format in TypeScript, adds an AI Coach, a signal prover and a Karnaugh map analyzer, and runs in any browser.</p>
<h2>License</h2>
<p>Free software under the GNU General Public License, version 3 or later, with no warranty. The source is on <a href="${REPO}">GitHub</a>. Logisim Revisited is an independent project and is not affiliated with or endorsed by the authors of the original Logisim.</p>
<h2>Original Logisim</h2>
<p>The original program is at <a href="https://sourceforge.net/projects/circuit/">sourceforge.net/projects/circuit</a>.</p>`,
});
add('privacy.html', {
  title: 'Privacy | Logisim Revisited',
  description: 'What Logisim Revisited stores on your device, and how advertising consent works.',
  body: `<h1>Privacy</h1>
<p class="lead">The simulator runs on your device. Your circuits are not uploaded.</p>
<h2>What is stored</h2>
<p>Circuits, settings and your consent choice are kept in your browser's local storage on your device. We cannot read them, and clearing your site data removes them.</p>
<h2>Advertising</h2>
<p>This website may show ads served by Google AdSense. Ad scripts load only after you give consent, and the banner follows Google Consent Mode v2. Without consent no ad script is loaded. You can change your choice at any time using the privacy settings link in the banner or in the app's Settings.</p>
<h2>Contact</h2>
<p>Questions or requests can be sent to <a href="mailto:support@revisitedlabs.com">support@revisitedlabs.com</a> or filed as an issue on <a href="${REPO}/issues">GitHub</a>.</p>`,
});
add('404.html', {
  root: '/',
  noindex: true,
  title: 'Page not found | Logisim Revisited',
  description: 'That page does not exist.',
  body: `<h1>Page not found</h1>
<p class="lead">That address does not lead anywhere.</p>
<p><a class="btn" href="/">Back to the start page</a> <a class="btn alt" href="/circuits/">Browse circuits</a></p>`,
});

// ---- write
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const [path, html] of pages) {
  const file = join(out, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}
writeFileSync(join(out, 'site.css'), SITE_CSS);

for (const f of ['icon.svg', 'favicon.svg', 'apple-touch-icon.png', 'icon-512.png']) {
  if (!existsSync(join(appPublic, f))) throw new Error(`missing packages/app/public/${f}`);
  cpSync(join(appPublic, f), join(out, f));
}
mkdirSync(join(out, 'fonts'), { recursive: true });
for (const f of FONT_FILES) cpSync(join(appPublic, 'fonts', f), join(out, 'fonts', f));

if (existsSync(appDist)) cpSync(appDist, join(out, 'play'), { recursive: true });
else console.warn('packages/app/dist not found: the site is built without /play/');

console.log(`consent banner added to ${applyConsent(out)} pages`);

const hostname = siteUrl !== '/' ? new URL(siteUrl).hostname : '';
if (hostname && !hostname.endsWith('github.io')) writeFileSync(join(out, 'CNAME'), hostname + '\n');

writeFileSync(join(out, 'ads.txt'), `google.com, pub-${ADSENSE_CLIENT.replace('ca-pub-', '')}, DIRECT, f08c47fec0942fa0\n`);
writeFileSync(join(out, '_redirects'), '');

const gated = Boolean(process.env.SITE_PASSWORD);
if (!gated && siteUrl !== '/') {
  const urls = pages.map(([p]) => p).filter((p) => p !== '404.html').map((p) => siteUrl + cleanPath(p));
  if (existsSync(appDist)) urls.push(siteUrl + 'play/');
  writeFileSync(
    join(out, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`,
  );
  writeFileSync(join(out, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${siteUrl}sitemap.xml\n`);
}
// Android App Links: template with placeholder package name and SHA256 signing fingerprint.
mkdirSync(join(out, '.well-known'), { recursive: true });
writeFileSync(
  join(out, '.well-known', 'assetlinks.json'),
  JSON.stringify(
    [
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: 'com.revisitedlabs.logisim',
          sha256_cert_fingerprints: ['PLACEHOLDER_SHA256_CERT_FINGERPRINT'],
        },
      },
    ],
    null,
    2,
  ) + '\n',
);
if (gated) console.log(`password gate added to ${applyGate(out, process.env.SITE_PASSWORD)} pages`);
console.log(`wrote ${pages.length} pages to ${out}`);
