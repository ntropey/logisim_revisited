/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * Component reference pages for the website.
 * Zero dependencies; works with build.mjs.
 */

/**
 * Component catalog - all 32 component types from @logisim/core.
 * Each entry includes description, pinout, and reference data.
 */
const COMPONENTS = [
  { type: 'Pin', category: 'Wiring', shortName: 'Input Pin', desc: 'Interactive input source; toggles with Poke tool. Has output variant (output Pin reads wire signal).', pins: 'in0/out0, width 1' },
  { type: 'Probe', category: 'Wiring', shortName: 'Output Pin / Probe', desc: 'Displays the live logic state of a wire or bus.', pins: 'in0, width 1' },
  { type: 'Tunnel', category: 'Wiring', shortName: 'Tunnel', desc: 'Connects wires with the same label across the schematic without visible crossing wires.', pins: 'pin0, width 1, label' },
  { type: 'Splitter', category: 'Wiring', shortName: 'Splitter', desc: 'Combines individual 1-bit wires into a multi-bit bus or splits a bus into branches.', pins: 'bus + b0..b7, width 4, inputs 4' },
  { type: 'Clock', category: 'Wiring', shortName: 'Clock', desc: 'Periodic square-wave signal source for sequential flip-flops and registers.', pins: 'out0, width 1, value 0' },
  { type: 'Constant', category: 'Wiring', shortName: 'Constant', desc: 'Outputs a fixed logic constant (0, 1, or multi-bit hex value).', pins: 'out0, width 1, value 1' },
  { type: 'Power', category: 'Wiring', shortName: 'Power (1)', desc: 'Supplies a constant logic High (1).', pins: 'out0, width 1, facing south' },
  { type: 'Ground', category: 'Wiring', shortName: 'Ground (0)', desc: 'Supplies a constant logic Low (0).', pins: 'out0, width 1, facing north' },
  { type: 'Button', category: 'I/O', shortName: 'Button', desc: 'Momentary push button that outputs 1 when pressed and 0 when released.', pins: 'out0, width 1, value 0' },
  { type: 'LED', category: 'I/O', shortName: 'LED', desc: 'Illuminates when its 1-bit input is High (1).', pins: 'in0, width 1, facing west' },
  { type: '7-Segment Display', category: 'I/O', shortName: '7-Segment', desc: 'Displays segments a–g and decimal point from 7 individual 1-bit inputs.', pins: 'seg_a through seg_g, dp, width 1' },
  { type: 'Hex Digit Display', category: 'I/O', shortName: 'Hex Display', desc: 'Decodes a 4-bit nibble into hexadecimal digits 0–F on a 7-segment display.', pins: 'in0 Hex, dp, width 4' },
  { type: 'NOT Gate', category: 'Gates', shortName: 'NOT', desc: 'Inverts its input (0 → 1, 1 → 0).', pins: 'in0, out0, width 1' },
  { type: 'Buffer', category: 'Gates', shortName: 'Buffer', desc: 'Passes its input unchanged (0 → 0, 1 → 1).', pins: 'in0, out0, width 1' },
  { type: 'Controlled Buffer', category: 'Gates', shortName: 'Tri-State Buffer', desc: 'Passes data when Enable is 1; outputs high-impedance Floating (Z) when Enable is 0.', pins: 'in0, en, out0, width 1' },
  { type: 'Controlled Inverter', category: 'Gates', shortName: 'Tri-State NOT', desc: 'Inverts data when Enable is 1; outputs Floating (Z) when Enable is 0.', pins: 'in0, en, out0, width 1' },
  { type: 'AND Gate', category: 'Gates', shortName: 'AND', desc: 'Outputs 1 only when all active inputs are 1.', pins: 'in0..inN, out0, width 1, inputs 2' },
  { type: 'OR Gate', category: 'Gates', shortName: 'OR', desc: 'Outputs 1 when at least one active input is 1.', pins: 'in0..inN, out0, width 1, inputs 2' },
  { type: 'NAND Gate', category: 'Gates', shortName: 'NAND', desc: 'Inverted AND: outputs 0 only when all active inputs are 1.', pins: 'in0..inN, out0, width 1, inputs 2' },
  { type: 'NOR Gate', category: 'Gates', shortName: 'NOR', desc: 'Inverted OR: outputs 1 only when all active inputs are 0.', pins: 'in0..inN, out0, width 1, inputs 2' },
  { type: 'XOR Gate', category: 'Gates', shortName: 'XOR', desc: 'Exclusive OR: outputs 1 when an odd number of inputs are 1.', pins: 'in0..inN, out0, width 1, inputs 2' },
  { type: 'XNOR Gate', category: 'Gates', shortName: 'XNOR', desc: 'Exclusive NOR (equivalence): outputs 1 when an even number of inputs are 1.', pins: 'in0..inN, out0, width 1, inputs 2' },
  { type: 'Odd Parity', category: 'Gates', shortName: 'Odd Parity', desc: 'Outputs 1 when an odd number of inputs are 1.', pins: 'in0..inN, out0, width 1, inputs 3' },
  { type: 'Even Parity', category: 'Gates', shortName: 'Even Parity', desc: 'Outputs 1 when an even number of inputs are 1.', pins: 'in0..inN, out0, width 1, inputs 3' },
  { type: 'Multiplexer', category: 'Plexers', shortName: 'MUX', desc: 'Routes one of 2^S data inputs to the output based on the Select line.', pins: 'in0..in(2^S-1), sel, S, out0, width 1, selectBits 1' },
  { type: 'Demultiplexer', category: 'Plexers', shortName: 'DEMUX', desc: 'Routes a single data input to one of 2^S outputs based on the Select line.', pins: 'in0, sel, S, out0..out(2^S-1), width 1, selectBits 1' },
  { type: 'Decoder', category: 'Plexers', shortName: 'Decoder', desc: 'Asserts exactly one of 2^S output lines corresponding to the binary Select value.', pins: 'sel, S, out0..out(2^S-1), width 1, selectBits 2' },
  { type: 'Priority Encoder', category: 'Plexers', shortName: 'Priority Encoder', desc: 'Outputs the binary index of the highest-priority active input line.', pins: 'in0..in(2^S-1), out0 Q, out1 GS, width 1, selectBits 2' },
  { type: 'Adder', category: 'Arithmetic', shortName: 'Adder', desc: 'Adds two N-bit operands plus Carry-In (cin) to produce Sum and Carry-Out (cout).', pins: 'a, b, cin, out0 Sum, out1 cout, width 1' },
  { type: 'Subtractor', category: 'Arithmetic', shortName: 'Subtractor', desc: 'Computes A - B - bin, producing Difference and Borrow-Out (bout).', pins: 'a, b, bin, out0 Diff, out1 bout, width 1' },
  { type: 'Multiplier', category: 'Arithmetic', shortName: 'Multiplier', desc: 'Multiplies two unsigned N-bit integers A and B.', pins: 'a, b, out0 Prod, width 4' },
  { type: 'Comparator', category: 'Arithmetic', shortName: 'Comparator', desc: 'Compares two N-bit values A and B, outputting A>B, A=B, and A<B.', pins: 'a, b, out0 A>B, out1 A=B, out2 A<B, width 4' },
  { type: 'Negator', category: 'Arithmetic', shortName: 'Negator', desc: "Computes the two's complement negation (-A) of an N-bit input.", pins: 'in0, out0 -A, width 4' },
  { type: 'Shifter', category: 'Arithmetic', shortName: 'Shifter', desc: 'Shifts or rotates an N-bit input by a shift distance.', pins: 'a, dist sh, out0 Out, width 4, shiftKind ll' },
  { type: 'D Flip-Flop', category: 'Memory', shortName: 'D Flip-Flop', desc: 'Captures the D input on the rising edge of Clock and holds it on Q.', pins: 'clk, d, rst, out0 Q, out1 ~Q, width 1' },
  { type: 'T Flip-Flop', category: 'Memory', shortName: 'T Flip-Flop', desc: 'Toggles state Q on the rising edge of Clock when T=1.', pins: 'clk, T (as d), rst, out0 Q, out1 ~Q, width 1' },
  { type: 'J-K Flip-Flop', category: 'Memory', shortName: 'J-K Flip-Flop', desc: 'Universal flip-flop: J=1 sets, K=1 resets, J=K=1 toggles on Clock edge.', pins: 'j, clk, k, rst, out0 Q, out1 ~Q, width 1' },
  { type: 'S-R Flip-Flop', category: 'Memory', shortName: 'S-R Flip-Flop', desc: 'Set-Reset flip-flop: S=1 sets Q=1, R=1 resets Q=0 on Clock edge.', pins: 'j (as S), clk, k (as R), rst, out0 Q, out1 ~Q, width 1' },
  { type: 'Register', category: 'Memory', shortName: 'Register', desc: 'Stores an N-bit value on the rising Clock edge when Enable is high.', pins: 'd, en, clk, rst, out0 Q, width 4' },
  { type: 'Counter', category: 'Memory', shortName: 'Counter', desc: 'Increments its N-bit value on each rising Clock edge.', pins: 'clk, rst, out0 Q, out1 ovf, width 4' },
  { type: 'ROM', category: 'Memory', shortName: 'ROM', desc: 'Read-Only Memory lookup table indexed by an address bus.', pins: 'addr, out0 D, width 4, selectBits 4, value 0,1,2,3,4,5,6,7,8,9,A,B,C,D,E,F' },
];

/**
 * Build a component reference page HTML.
 * Returns the HTML string.
 */
function buildComponentPage(siteUrl, type) {
  const comp = COMPONENTS.find((c) => c.type === type);
  if (!comp) return null;

  const body = `<article class="content guide">
<h1>${comp.shortName}</h1>
<p class="meta">${comp.type}</p>
<p>${comp.desc}</p>
<p><strong>Category:</strong> ${comp.category}</p>
<p><strong>Pins:</strong> ${comp.pins}</p>
<p><strong>Default attributes:</strong> ${JSON.stringify(comp.defaultAttrs || {})}</p>
</article>`;

  const rail = (current) => `<aside class="rail"><label class="railselect"><span>Component</span><select onchange="location.href=this.value" aria-label="Jump to a component">
${COMPONENTS.map((c) => `<option value="${c.type}"${c.type === current ? ' selected' : ''}>${c.shortName}</option>`).join('')}
</select></label>
<nav class="railnav" aria-label="Components"><h2><a href="#">Components</a></h2>
<ul>${COMPONENTS.map((c) => `<li><a href="#${c.type}">${c.shortName}</a></li>`).join('')}</ul></nav>
</aside>`;

  return page({
    title: `${comp.shortName} | Logisim Revisited Components`,
    description: `${comp.shortName}: ${comp.desc}`,
    root: '../',
    path: `components/${type}.html`,
    wide: true,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: `${comp.shortName}`,
      description: comp.desc,
      url: `${siteUrl}components/${type}.html`,
      author: { '@type': 'Organization', name: 'Logisim Revisited', url: siteUrl },
    },
    body: `<div class="with-rail">${rail(type)}
${body}</div>`,
  });
}

/**
 * Build the Components index page HTML.
 * Returns the HTML string.
 */
function buildComponentsIndexHtml(siteUrl) {
  const rail = (current) => `<aside class="rail"><label class="railselect"><span>Component</span><select onchange="location.href=this.value" aria-label="Jump to a component">
${COMPONENTS.map((c) => `<option value="${c.type}"${c.type === current ? ' selected' : ''}>${c.shortName}</option>`).join('')}
</select></label>
<nav class="railnav" aria-label="Components"><h2><a href="#">Components</a></h2>
<ul>${COMPONENTS.map((c) => `<li><a href="components/${c.type}.html">${c.shortName}</a></li>`).join('')}</ul></nav>
</aside>`;

  const body = `<div class="with-rail">${rail(null)}
<div class="content">
<h1>Component Reference Library</h1>
<p class="lead">Reference for all 32 component types in Logisim Revisited.</p>
<div class="tgrid">
${COMPONENTS.map((c) => `<a class="tcard" href="components/${c.type}.html"><span class="band lv-${c.category === 'Gates' ? 'medium' : c.category === 'Arithmetic' ? 'hard' : c.category === 'Memory' ? 'medium' : 'easy'}">${c.shortName}</span><strong>${c.type}</strong><span>${c.category}</span></a>`).join('\n')}
</div>
</div></div>`;

  return page({
    title: 'Components | Logisim Revisited',
    description: 'Reference for all component types in Logisim Revisited',
    root: '../',
    path: 'components/',
    wide: true,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Component reference library',
      url: `${siteUrl}components/`,
      description: 'Reference for all 32 component types in Logisim Revisited: Wiring, Gates, Plexers, Arithmetic, and Memory',
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: COMPONENTS.length,
        itemListElement: COMPONENTS.map((c, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: c.shortName,
          url: `${siteUrl}components/${c.type}.html`,
        })),
      },
    },
    body,
  });
}

/**
 * Export all page builders.
 */
export const components = COMPONENTS;
export { buildComponentPage, buildComponentsIndexHtml };