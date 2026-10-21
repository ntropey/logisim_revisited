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
import { cards, esc, page, rail, REPO } from './layout.mjs';
import { LEARN } from './learn.mjs';
import { MANUAL } from './manual.mjs';
import { COMPONENTS } from './components.mjs';
import { TECHNIQUES } from './techniques.mjs';
import { FONT_FILES, SITE_CSS } from './styles.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'dist');
const appDist = join(here, '..', '..', 'app', 'dist');
const appPublic = join(here, '..', '..', 'app', 'public');
const siteUrl = (process.env.SITE_URL ?? '').replace(/\/?$/, '/');

const GROUPS = [
  ['Arithmetic', ['half-adder', 'full-adder', '4-bit-alu']],
  ['Plexers', ['multiplexer']],
  ['Sequential', ['sr-latch']],
  ['Combinational', ['k-map-solver', 'short-circuit-demo']],
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
const abs = (path) => (siteUrl !== '/' ? siteUrl + path : path);
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
  const href = (i) => `${i.slug}.html`;
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
const HALF_ADDER_SVG = `<svg viewBox="0 0 360 220" role="img" aria-label="A half adder: an XOR gate produces Sum and an AND gate produces Carry" fill="none" stroke="var(--fg)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
<g stroke="var(--wire-1)"><path d="M24 52h78M52 52v90h44"/><path d="M180 70h100"/></g>
<g stroke="var(--wire-0)"><path d="M24 178h72M72 178V88h30"/><path d="M166 160h114"/></g>
<path d="M84 40q20 30 0 60"/><path d="M96 40C140 40 165 55 180 70C165 85 140 100 96 100q20-30 0-60z" fill="var(--card)"/>
<path d="M96 130h40a30 30 0 0 1 0 60H96z" fill="var(--card)"/>
<g stroke="none" fill="var(--muted)" font-family="IBM Plex Mono, monospace" font-size="13"><text x="2" y="47">A</text><text x="2" y="173">B</text><text x="288" y="75">Sum</text><text x="288" y="165">Carry</text><text x="110" y="75" fill="var(--fg)">XOR</text><text x="104" y="165" fill="var(--fg)">AND</text></g>
</svg>`;

add('index.html', {
  wide: true,
  title: 'Logisim Revisited: digital logic circuit simulator with AI Coach',
  description: 'Free digital logic circuit simulator with AI Coach, Karnaugh maps, and .circ compatibility. No Java and no install.',
  jsonld: {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Logisim Revisited',
    description: 'Digital logic circuit simulator with an AI Coach, Karnaugh maps and Logisim .circ compatibility, in the browser.',
    url: abs(''),
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any (web browser)',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  },
  body: `<section class="hero">
  <div>
    <p class="eyebrow">The digital logic simulator rebuilt for the web</p>
    <h1>Every circuit step, explained.</h1>
    <p class="lead">A free digital logic simulator with the engine, AI Coach, K-map analyzer and .circ import and export rebuilt in TypeScript. No Java. Ask why any pin or wire is 0, 1, E (red) or Z (blue), or get step-by-step nudges.</p>
    <div class="actions"><a class="btn" href="play/">Open the simulator</a> <a class="btn alt" href="play/?daily=1">Daily challenge</a> <a class="btn alt" href="circuits/">Browse circuits</a></div>
  </div>
  <figure class="gatecard">${HALF_ADDER_SVG}<figcaption>A half adder. Sum is A XOR B; Carry is A AND B.</figcaption></figure>
</section>
<section class="spotlight">
  <div>
    <p class="eyebrow">AI Circuit Coach</p>
    <h2>Ask "why?" about any wire, and watch the proof unfold.</h2>
    <p class="lead">Select a wire or pin and ask why it has its value. The coach traces the drivers behind it and highlights the exact cause.</p>
    <p><a class="btn" href="manual/ai-coach.html">How the coach works →</a></p>
  </div>
  <div class="coach-quote">
    <div class="mono"><strong>1. Where to look</strong> → <strong>2. The pattern</strong> → <strong>3. The logic</strong> → <strong>4. Conclusion</strong></div>
    <p>"The output is E because two gates drive this wire at once: one with 0 and one with 1. Separate them with an OR gate or a tri-state buffer."</p>
  </div>
</section>
<section class="cards">
  <article><p class="eyebrow">Simulator</p><h2>4-state logic</h2><p>0, 1, Z and E on single wires and buses up to 32 bits, with the classic Logisim component libraries.</p></article>
  <article><p class="eyebrow">K-Map Analyzer</p><h2>Truth table to circuit</h2><p>Minimize with Quine-McCluskey, see the loops on a Gray-code map, then synthesize gates in one click.</p></article>
  <article><p class="eyebrow">Compatible</p><h2>.circ import and export</h2><p>Open classic Logisim 2.7.1 files in the browser, and save back for the original program.</p></article>
  <article><p class="eyebrow">Practice</p><h2>Daily challenges</h2><p>A new design or troubleshooting puzzle every day, with shareable results.</p></article>
</section>
<section class="learnhome"><p>New to digital logic? Read <a href="learn/how-digital-works.html">how digital logic works</a> or the <a href="learn/k-map-tutorial.html">Karnaugh map tutorial</a>. Looking for a Java-free Logisim? See <a href="learn/logisim-online-no-java.html">Logisim online</a>.</p></section>
<section class="trust"><p>Runs entirely in your browser. Works offline once installed.</p></section>`,
});

// ---- circuits
const circuitLink = (t) => ({ href: `${t.slug}.html`, title: t.name, summary: t.summary, band: t.level });
const circuitRail = (current) =>
  rail({
    label: 'Circuit',
    heading: 'Circuits',
    indexHref: './',
    items: ORDERED.map((t) => ({ href: `${t.slug}.html`, title: t.name, key: t.slug })),
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
<div class="prose">
${t.body.map((p) => `<p>${esc(p)}</p>`).join('\n')}
${t.tip ? `<p class="tip"><strong>Tip:</strong> ${esc(t.tip)}</p>` : ''}
<p><a class="btn" href="../play/?p=${esc(t.example)}">Open in the app</a></p>
<div class="legend"><span class="lg place">0 green</span><span class="lg e">1 red / E error</span><span class="lg z">Z blue</span></div>
</div>
<nav class="pager">
${prev ? `<a href="${prev.slug}.html"><small>Previous</small>← ${esc(prev.name)}</a>` : '<span></span>'}
${next ? `<a href="${next.slug}.html"><small>Next</small>${esc(next.name)} →</a>` : '<span></span>'}
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
    items: COMP_ITEMS.map((c) => ({ href: `${c.slug}.html`, title: c.shortName, key: c.slug })),
    current,
  });
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
    COMP_ITEMS.filter((c) => c.category === cat).map((c) => ({ href: `${c.slug}.html`, title: c.shortName, summary: c.desc, band: c.category })),
  )}</section>`,
).join('\n')}
</div></div>`,
});
COMP_ITEMS.forEach((c) => {
  add(`components/${c.slug}.html`, {
    section: 'components/',
    wide: true,
    title: `${c.shortName} (${c.type}) | Logisim Revisited Components`,
    description: c.desc,
    jsonld: [article(`${c.shortName} component`, c.desc, `components/${c.slug}.html`), crumbs(['Home', ''], ['Components', 'components/'], [c.shortName, `components/${c.slug}.html`])],
    body: `<div class="with-rail">${compRail(c.slug)}
<article class="content guide">
<p class="crumbs"><a href="./">Components</a> / ${esc(c.category)}</p>
<h1>${esc(c.shortName)}</h1>
<p class="lead">${esc(c.desc)}</p>
<table class="ref">
<tr><th>Library</th><td>${esc(c.category)}</td></tr>
<tr><th>Type name</th><td><span class="mono">${esc(c.type)}</span></td></tr>
<tr><th>Pins and defaults</th><td><span class="mono">${esc(c.pins)}</span></td></tr>
</table>
<p><a class="btn" href="../play/">Try it in the app</a></p>
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
<p>Questions or requests can be filed as an issue on <a href="${REPO}/issues">GitHub</a>.</p>`,
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
