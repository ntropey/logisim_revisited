/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * Stylesheet for the static site. Design tokens come straight from the app's styles.css so the two always match.
 */
import { readFileSync } from 'node:fs';

const appCss = readFileSync(new URL('../../app/src/styles.css', import.meta.url), 'utf8');
const TOKENS = appCss.slice(appCss.indexOf(':root'), appCss.indexOf('* { box-sizing'));

const FACES = [
  ['Newsreader', 400, 'newsreader'],
  ['Newsreader', 500, 'newsreader'],
  ['IBM Plex Sans', 400, 'ibm-plex-sans'],
  ['IBM Plex Sans', 500, 'ibm-plex-sans'],
  ['IBM Plex Sans', 600, 'ibm-plex-sans'],
  ['IBM Plex Mono', 400, 'ibm-plex-mono'],
]
  .map(
    ([family, weight, file]) =>
      `@font-face{font-family:'${family}';font-weight:${weight};font-style:normal;font-display:swap;src:url(fonts/${file}-latin-${weight}-normal.woff2) format('woff2')}`,
  )
  .join('\n');

export const FONT_FILES = [
  'newsreader-latin-400-normal.woff2',
  'newsreader-latin-500-normal.woff2',
  'ibm-plex-sans-latin-400-normal.woff2',
  'ibm-plex-sans-latin-500-normal.woff2',
  'ibm-plex-sans-latin-600-normal.woff2',
  'ibm-plex-mono-latin-400-normal.woff2',
];

const LAYOUT = `
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; }
body { margin: 0; background: var(--bg); color: var(--fg); font: 400 16px/1.65 var(--font-ui); }
a { color: var(--accent); text-underline-offset: 2px; }
a:hover { text-decoration-thickness: 2px; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
img, svg { max-width: 100%; height: auto; }
code, kbd, .mono { font-family: var(--font-mono); font-size: .88em; }
code { background: var(--surface-2); padding: 1px 5px; border-radius: 3px; overflow-wrap: anywhere; }
kbd { padding: 1px 6px; border: 1px solid var(--line); border-radius: 3px; background: var(--card); }
h1, h2, h3 { font-family: var(--font-display); font-weight: 500; line-height: 1.2; letter-spacing: -.01em; }
h1 { font-size: clamp(2rem, 4.5vw, 3.1rem); margin: .2em 0 .4em; }
h2 { font-size: 1.55rem; margin: 1.8em 0 .5em; }
h3 { font-size: 1.15rem; margin: 1.4em 0 .4em; }
.skip { position: absolute; left: -999px; top: 8px; background: var(--card); padding: 8px 14px; border-radius: 6px; z-index: 10; }
.skip:focus { left: 8px; }

.top { position: sticky; top: 0; z-index: 5; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; padding: 10px max(16px, calc((100vw - 1180px) / 2)); background: color-mix(in srgb, var(--bg) 88%, transparent); backdrop-filter: blur(10px); border-bottom: 1px solid var(--line); }
.brand { display: flex; align-items: center; gap: 10px; text-decoration: none; color: var(--fg); }
.wordmark { font: 500 1.25rem/1 var(--font-display); display: flex; flex-direction: column; }
.wordmark small { font: 600 .62rem/1.3 var(--font-ui); letter-spacing: .22em; text-transform: uppercase; color: var(--muted); }
.top nav { display: flex; align-items: center; gap: 4px 18px; flex-wrap: wrap; }
.top nav a:not(.btn) { color: var(--fg); text-decoration: none; font-size: .95rem; padding: 4px 0; border-bottom: 2px solid transparent; }
.top nav a:not(.btn):hover, .top nav a[aria-current] { border-bottom-color: var(--accent); }

main { max-width: 760px; margin: 0 auto; padding: 40px 16px 72px; }
main.wide { max-width: 1180px; }
footer { border-top: 1px solid var(--line); padding: 28px 16px 40px; text-align: center; color: var(--muted); font-size: .88rem; }
footer p { margin: .3em auto; max-width: 760px; }

.btn { display: inline-flex; align-items: center; justify-content: center; padding: 10px 20px; border-radius: 8px; background: var(--accent); color: var(--card); text-decoration: none; font-weight: 500; font-size: .95rem; border: 1px solid var(--accent); transition: filter .15s, transform .15s; }
.btn:hover { filter: brightness(1.12); transform: translateY(-1px); }
.btn.alt { background: transparent; color: var(--accent); }
.btn.small { padding: 6px 14px; font-size: .85rem; }
.eyebrow { font: 600 .72rem/1.2 var(--font-ui); letter-spacing: .16em; text-transform: uppercase; color: var(--accent); margin: 0 0 .6em; }
.lead { font-size: 1.15rem; color: var(--muted); max-width: 62ch; }

.hero { display: grid; gap: 40px; grid-template-columns: 1.1fr .9fr; align-items: center; padding: 28px 0 56px; }
.hero h1 { font-size: clamp(2.4rem, 6vw, 4rem); }
.hero .actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 1.4em; }
.hero-board { margin: 0; background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 18px; box-shadow: 0 12px 40px rgba(0,0,0,.08); }
.gatecard { margin: 0; background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 18px; box-shadow: 0 12px 40px rgba(0,0,0,.08); }
.gatecard svg { width: 100%; }
.gatecard figcaption, .hero-board figcaption { margin-top: 10px; font-size: .85rem; color: var(--muted); }
.spotlight { display: grid; gap: 40px; grid-template-columns: 1fr 1fr; align-items: start; padding: 40px 0; border-top: 1px solid var(--line); }
.coach-quote { background: var(--accent-soft); border-left: 4px solid var(--accent); border-radius: 8px; padding: 14px 18px; margin: 1.2em 0; }
.coach-quote p { margin: .5em 0 0; }
.cards { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); padding: 40px 0; border-top: 1px solid var(--line); }
.cards article { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 20px; }
.cards .eyebrow { margin-bottom: .5em; }
.cards h2 { font-size: 1.2rem; margin: 0 0 .4em; }
.cards p { margin: 0; color: var(--muted); font-size: .95rem; }
.learnhome, .trust { text-align: center; color: var(--muted); border-top: 1px solid var(--line); padding: 28px 0 0; }

.tgrid { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); margin: 1.2em 0; }
.tcard { display: flex; flex-direction: column; gap: 6px; padding: 16px 18px; background: var(--card); border: 1px solid var(--line); border-radius: 12px; text-decoration: none; color: var(--fg); transition: border-color .15s, transform .15s, box-shadow .15s; }
.tcard:hover { border-color: var(--accent); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.08); }
.tcard strong { font: 500 1.1rem/1.3 var(--font-display); }
.tcard span:last-child { color: var(--muted); font-size: .9rem; }
.band { align-self: flex-start; font: 600 .68rem/1 var(--font-mono); letter-spacing: .08em; padding: 4px 8px; border-radius: 99px; background: var(--accent-soft); color: var(--accent); text-transform: uppercase; }
.band.lv-easy { background: var(--place-bg); color: var(--place); }
.band.lv-medium { background: var(--tint-b); color: var(--fin); }
.band.lv-hard { background: var(--elim-bg); color: var(--elim); }
.group h2 .num { font: 500 .8rem var(--font-mono); color: var(--muted); margin-right: 6px; }

.with-rail { display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: 40px; align-items: start; }
.rail { position: sticky; top: 76px; }
.railselect { display: none; }
.railnav h2 { font: 600 .72rem/1.2 var(--font-ui); letter-spacing: .16em; text-transform: uppercase; margin: 0 0 .8em; }
.railnav h2 a { color: var(--muted); text-decoration: none; }
.railnav ul { list-style: none; margin: 0; padding: 0; }
.railnav li a { display: block; padding: 6px 12px; margin-left: -12px; border-radius: 6px; text-decoration: none; color: var(--fg); font-size: .92rem; }
.railnav li a:hover { background: var(--surface-2); }
.railnav li a[aria-current] { background: var(--accent-soft); color: var(--accent); font-weight: 500; }
.content > h1:first-child, .guide > h1:first-of-type { margin-top: 0; }
.crumbs { font-size: .85rem; color: var(--muted); margin: 0; }
.prose p, .content p, .content li { max-width: 68ch; }
.tip { background: var(--tint-b); border-radius: 8px; padding: 10px 14px; }
.guide-cols { display: grid; gap: 32px; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: start; margin-top: 1em; }
.pager { display: flex; justify-content: space-between; gap: 12px; margin-top: 48px; }
.pager a { display: flex; flex-direction: column; padding: 12px 18px; border: 1px solid var(--line); border-radius: 10px; text-decoration: none; background: var(--card); }
.pager a:hover { border-color: var(--accent); }
.pager small { color: var(--muted); }
.placeholder { background: var(--card); border: 1px dashed var(--line); border-radius: 12px; padding: 22px; text-align: center; color: var(--muted); }
table.ref { border-collapse: collapse; width: 100%; margin: 1em 0; font-size: .95rem; }
table.ref th, table.ref td { text-align: left; padding: 9px 12px; border-bottom: 1px solid var(--line); vertical-align: top; }
table.ref th { font-weight: 600; width: 9em; color: var(--muted); }
.legend { display: flex; gap: 8px; flex-wrap: wrap; margin: 8px 0; font: 600 .7rem var(--font-mono); }
.legend .lg { padding: 2px 8px; border-radius: 99px; }
.legend .place { background: var(--place-bg); color: var(--place); }
.legend .e, .legend .elim { background: var(--elim-bg); color: var(--elim); }
.legend .z { background: var(--tint-a); color: var(--wire-z); }

@media (max-width: 860px) {
  .hero, .spotlight, .guide-cols { grid-template-columns: 1fr; }
  .with-rail { grid-template-columns: 1fr; gap: 20px; }
  .rail { position: static; }
  .railnav { display: none; }
  .railselect { display: block; }
  .railselect span { display: block; font-size: .8rem; color: var(--muted); margin-bottom: 4px; }
  .railselect select { width: 100%; font: inherit; padding: 10px 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--card); color: var(--fg); min-height: 44px; }
  .top { position: static; }
  .top nav a:not(.btn) { padding: 8px 0; }
}
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition: none !important; animation: none !important; scroll-behavior: auto !important; } }
`;

export const SITE_CSS = `/* Logisim Revisited site styles. GPL-3.0-or-later. */\n${FACES}\n${TOKENS}\n${LAYOUT}`;
