/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * Manual pages generator for the website.
 * Zero dependencies; works with build.mjs.
 */

/**
 * Manual page catalog - user guide chapters.
 */
const MANUAL_PAGES = [
  {
    slug: 'introduction',
    title: 'Introduction',
    summary: 'Getting started with Logisim Revisited: installation, first circuit, and basic operation.',
  },
  {
    slug: 'circuits',
    title: 'Circuit Library',
    summary: 'Browse the built-in circuit library, import .circ files, and manage your circuit collection.',
  },
  {
    slug: 'ai-coach',
    title: 'AI Circuit Coach',
    summary: '4-stage Socratic coach for debugging broken circuits, learning Karnaugh map minimization, and Boolean algebra simplification.',
  },
  {
    slug: 'k-map',
    title: 'Karnaugh Map Minimization',
    summary: 'Truth table entry, K-Map visualization, Quine-McCluskey minimization, and automatic gate circuit synthesis.',
  },
  {
    slug: 'import-export',
    title: 'Import/Export .circ Files',
    summary: 'Import classic .circ files from Logisim 2.7.1 and export your circuits for use in the original program.',
  },
  {
    slug: 'settings',
    title: 'Settings',
    summary: 'Grid snap, dark mode, wire color themes, auto-simulate, and privacy preferences.',
  },
  {
    slug: 'daily-challenges',
    title: 'Daily Logic Challenges',
    summary: 'Date-seeded daily challenges with shareable results, coach integration, and solution verification.',
  },
  {
    slug: 'offline',
    title: 'Offline & PWA',
    summary: 'Install as a Progressive Web App for offline use. Service worker caches assets for offline access.',
  },
  {
    slug: 'privacy',
    title: 'Privacy and Ads',
    summary: 'How circuits and settings are stored in your browser\'s localStorage. Advertising consent and Google Consent Mode v2.',
  },
];

/**
 * Build a manual page HTML.
 * Returns the HTML string.
 */
function buildManualPage(siteUrl, chapter) {
  const { slug, title, summary } = chapter;
  const body = `<article class="content guide">
<h1>${title}</h1>
<p class="lead">${summary}</p>
<p>Chapter content would be written here, describing the feature in detail with examples and screenshots.</p>
</article>`;

  const rail = (current) => `<aside class="rail"><label class="railselect"><span>Chapter</span><select onchange="location.href=this.value" aria-label="Jump to a chapter">
${MANUAL_PAGES.map((p) => `<option value="${p.slug}.html"${p.slug === current ? ' selected' : ''}>${p.title}</option>`).join('')}
</select></label>
<nav class="railnav" aria-label="Manual"><h2><a href="./">Manual</a></h2><ul class="flat">${MANUAL_PAGES.map((p) => `<li><a href="${p.slug}.html">${p.title}</a></li>`).join('')}</ul></nav>
</aside>`;

  return page({
    title: `${title} | Logisim Revisited Manual`,
    description: `${title}: user guide chapter`,
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
 * Build the Manual index page HTML.
 * Returns the HTML string.
 */
function buildManualIndexHtml(siteUrl) {
  const rail = (current) => `<aside class="rail"><label class="railselect"><span>Chapter</span><select onchange="location.href=this.value" aria-label="Jump to a chapter">
${MANUAL_PAGES.map((p) => `<option value="${p.slug}.html"${p.slug === current ? ' selected' : ''}>${p.title}</option>`).join('')}
</select></label>
<nav class="railnav" aria-label="Manual"><h2><a href="./">Manual</a></h2><ul class="flat">${MANUAL_PAGES.map((p) => `<li><a href="${p.slug}.html">${p.title}</a></li>`).join('')}</ul></nav>
</aside>`;

  const body = `<div class="with-rail">${rail(null)}
<div class="content">
<h1>Manual: Logisim Revisited</h1>
<p class="lead">User manual for the digital logic simulator, one chapter at a time.</p>
<div class="tgrid">
${MANUAL_PAGES.map((p, i) => `<a class="tcard" href="${p.slug}.html"><span class="band">${String(i + 1).padStart(2, '0')}</span><strong>${p.title}</strong><span>${p.summary}</span></a>`).join('\n')}
</div>
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
      description: 'User manual for Logisim Revisited: circuits, AI Coach, K-Map minimization, import/export, settings, offline, and privacy',
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: MANUAL_PAGES.length,
        itemListElement: MANUAL_PAGES.map((p, idx) => ({
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
export const MANUAL = MANUAL_PAGES;
export { buildManualPage, buildManualIndexHtml };