/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * Learn pages generator for the website.
 * Zero dependencies; works with build.mjs.
 */

/**
 * Learn page catalog - educational pages about digital logic.
 */
const LEARN_PAGES = [
  {
    slug: 'how-digital-works',
    title: 'How Digital Logic Works',
    summary: 'Introduction to boolean logic, gates, and sequential circuits. Covers AND, OR, NOT, NAND, XOR, latches, and flip-flops with simple examples.',
  },
  {
    slug: 'k-map-tutorial',
    title: 'Karnaugh Map Tutorial',
    summary: 'Step-by-step K-Map minimization with 2, 3, and 4 variables. Learn prime implicants, essential prime implicants, and how to read Gray-code K-Maps.',
  },
  {
    slug: 'glossary',
    title: 'Glossary',
    summary: 'Terms and notation used in digital logic design: Minterm, maxterm, SOP, POS, prime implicant, don\'t care, fan-in, fan-out, tri-state, sequential vs combinational.',
  },
  {
    slug: 'logisim-online-no-java',
    title: 'Run Logisim Online (No Java)',
    summary: 'How to use Logisim circuits in the browser without installing Java. The @logisim/core engine runs entirely in JavaScript/WebAssembly. Share circuits via .circ import/export or shareable URLs.',
  },
];

/**
 * Build a learn page HTML.
 * Returns the HTML string.
 */
function buildLearnPage(siteUrl, page) {
  const { slug, title, summary } = page;
  const body = `<article class="content guide">
<h1>${title}</h1>
<p class="lead">${summary}</p>
<p>Educational content for this page would be written here, with examples and interactive elements.</p>
</article>`;

  const rail = (current) => `<aside class="rail"><label class="railselect"><span>Page</span><select onchange="location.href=this.value" aria-label="Jump to a page">
${LEARN_PAGES.map((p) => `<option value="${p.slug}.html"${p.slug === current ? ' selected' : ''}>${p.title}</option>`).join('')}
</select></label>
<nav class="railnav" aria-label="Learn"><h2><a href="./">Learn</a></h2><ul class="flat">${LEARN_PAGES.map((p) => `<li><a href="${p.slug}.html"${p.slug === current ? ' aria-current="page"' : ''}>${p.title}</a></li>`).join('')}</ul></nav>
</aside>`;

  return page({
    title: `${title} | Logisim Revisited Learn`,
    description: `${title}: educational guide`,
    root: '../',
    path: `${slug}.html`,
    wide: true,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description: summary,
      url: `${siteUrl}${slug}.html`,
      author: { '@type': 'Organization', name: 'Logisim Revisited', url: siteUrl },
    },
    body: `<div class="with-rail">${rail(slug)}
${body}</div>`,
  });
}

/**
 * Build the Learn index page HTML.
 * Returns the HTML string.
 */
function buildLearnIndexHtml(siteUrl) {
  const rail = (current) => `<aside class="rail"><label class="railselect"><span>Page</span><select onchange="location.href=this.value" aria-label="Jump to a page">
${LEARN_PAGES.map((p) => `<option value="${p.slug}.html"${p.slug === current ? ' selected' : ''}>${p.title}</option>`).join('')}
</select></label>
<nav class="railnav" aria-label="Learn"><h2><a href="./">Learn</a></h2><ul class="flat">${LEARN_PAGES.map((p) => `<li><a href="${p.slug}.html">${p.title}</a></li>`).join('')}</ul></nav>
</aside>`;

  const body = `<div class="with-rail">${rail(null)}
<div class="content">
<h1>Learn Digital Logic</h1>
<p class="lead">Educational pages about digital logic, K-Maps, and running Logisim online.</p>
<div class="tgrid">
${LEARN_PAGES.map((p, i) => `<a class="tcard" href="${p.slug}.html"><span class="band">${String(i + 1).padStart(2, '0')}</span><strong>${p.title}</strong><span>${p.summary}</span></a>`).join('\n')}
</div>
</div></div>`;

  return page({
    title: 'Learn | Logisim Revisited',
    description: 'Educational pages about digital logic',
    root: '../',
    path: 'learn/',
    wide: true,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Learn digital logic',
      url: `${siteUrl}learn/`,
      description: 'Educational pages about digital logic, K-Map minimization, and running Logisim online without Java',
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: LEARN_PAGES.length,
        itemListElement: LEARN_PAGES.map((p, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: p.title,
          url: `${siteUrl}${p.slug}.html`,
        })),
      },
    },
    body,
  });
}

/**
 * Export all page builders.
 */
export const LEARN = LEARN_PAGES;
export { buildLearnPage, buildLearnIndexHtml };