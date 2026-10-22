/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * Shared page shell for every generated page: head, header, footer and the left rail.
 * Links are written relative to the page (root is derived from its path), so the site works from any base URL.
 */

export const REPO = 'https://github.com/ntropey/logisim_revisited';

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const NAV = [
  ['learn/', 'Learn'],
  ['circuits/', 'Circuits'],
  ['components/', 'Components'],
  ['manual/', 'Manual'],
  ['about.html', 'About'],
];

/** '../' repeated once per directory in a page path ('circuits/x.html' -> '../'). */
export const rootOf = (path) => '../'.repeat(path.split('/').length - 1);

/**
 * Build the page shell.
 * @param {object} o
 * @param {string} o.siteUrl   absolute site URL ending in '/', or '/' when unknown
 * @param {string} o.path      output path, e.g. 'circuits/half-adder.html'
 * @param {string} [o.root]    override the relative root (the 404 page uses '/')
 * @param {string} o.section   top-level nav section for aria-current ('learn/', 'circuits/', ...)
 */
export function page({ siteUrl, path, root = rootOf(path), section = '', title, description, body, wide = false, jsonld, noindex = false }) {
  const known = siteUrl && siteUrl !== '/';
  const url = known ? siteUrl + path.replace(/index\.html$/, '') : '';
  const ld = jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>` : '';
  const nav = NAV.map(
    ([href, label]) => `<a href="${root}${href}"${section === href ? ' aria-current="page"' : ''}>${label}</a>`,
  ).join('\n    ');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">\n' : ''}${url ? `<link rel="canonical" href="${url}">\n<meta property="og:url" content="${url}">\n<meta property="og:image" content="${siteUrl}icon-512.png">\n` : ''}<meta property="og:type" content="website">
<meta property="og:site_name" content="Logisim Revisited">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="#F5F2EA" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#15171B" media="(prefers-color-scheme: dark)">
<link rel="icon" href="${root}favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${root}apple-touch-icon.png">
<link rel="preload" href="${root}fonts/newsreader-latin-500-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${root}site.css">
${ld}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="top">
  <a class="brand" href="${root}"><img src="${root}icon.svg" alt="" width="32" height="32"><span class="wordmark">Logisim<small>Revisited</small></span></a>
  <nav aria-label="Main">
    ${nav}
    <a class="btn small" href="${root}play/">Open app</a>
  </nav>
</header>
<main id="main"${wide ? ' class="wide"' : ''}>
${body}
</main>
<footer>
  <p>Free digital logic circuit simulator with AI Coach, based on Logisim 2.7.1. Free software under the GPL (GPL-3.0-or-later), with no warranty.</p>
  <p style="font-size:.75rem;color:var(--muted);margin-top:8px">
    More tools:
    <a href="https://hodokurevisited.com/" target="_blank" rel="noopener noreferrer">Hodoku Revisited</a> ·
    <a href="https://kakurorevisited.com/" target="_blank" rel="noopener noreferrer">Kakuro Revisited</a> ·
    <a href="https://nonogramrevisited.com/" target="_blank" rel="noopener noreferrer">Nonogram Revisited</a> ·
    <a href="https://logisimrevisited.com/" target="_blank" rel="noopener noreferrer">Logisim Revisited</a>
  </p>
  <p><a href="${REPO}">GitHub</a> · <a href="${REPO}/commits/main">Changelog</a> · <a href="https://sourceforge.net/projects/circuit/">Original Logisim</a> · <a href="${root}about.html">About and license</a> · <a href="${root}privacy.html">Privacy</a></p>
</footer>
</body>
</html>`;
}

/**
 * Left rail: a <select> on phones, a nav list on wide screens.
 * @param {{label:string, heading:string, indexHref:string, items:{href:string,title:string,key:string}[], current?:string}} o
 */
export function rail({ label, heading, indexHref, items, current }) {
  return `<aside class="rail"><label class="railselect"><span>${esc(label)}</span><select onchange="location.href=this.value" aria-label="Jump to a ${esc(label.toLowerCase())}">
${items.map((i) => `<option value="${i.href}"${i.key === current ? ' selected' : ''}>${esc(i.title)}</option>`).join('')}
</select></label>
<nav class="railnav" aria-label="${esc(heading)}"><h2><a href="${indexHref}">${esc(heading)}</a></h2><ul class="flat">${items
    .map((i) => `<li><a href="${i.href}"${i.key === current ? ' aria-current="page"' : ''}>${esc(i.title)}</a></li>`)
    .join('')}</ul></nav></aside>`;
}

/** Card grid used by the section index pages. */
export function cards(items) {
  return `<div class="tgrid">${items
    .map(
      (i, n) =>
        `<a class="tcard" href="${i.href}"><span class="band">${i.band ?? String(n + 1).padStart(2, '0')}</span><strong>${esc(i.title)}</strong><span>${esc(i.summary)}</span></a>`,
    )
    .join('\n')}</div>`;
}
