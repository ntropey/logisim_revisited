/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * Manual chapters. Bodies are trusted HTML written here.
 */

export const MANUAL = [
  {
    slug: 'introduction',
    title: 'Introduction',
    summary: 'Getting started: your first circuit and the basic tools.',
    body: `
<p>Open <a href="../play/">the app</a> in any modern browser. Nothing to install: it runs on your device, on desktop or phone.</p>
<h2>Your first circuit</h2>
<ol>
<li>Pick a gate from the component palette and click the canvas to place it.</li>
<li>Place two input pins and an output pin.</li>
<li>Choose the <strong>Wire</strong> tool and drag from one pin to another.</li>
<li>Switch to the <strong>Poke</strong> tool and click an input to toggle it. Wires update immediately.</li>
</ol>
<h2>Wire colors</h2>
<p>Green is 0, red is 1, blue is Z (floating), and a red error mark means E (a conflict). The same colors are used on every guide on this site.</p>`,
  },
  {
    slug: 'circuits',
    title: 'Circuit Library',
    summary: 'Built-in example circuits and your own saved work.',
    body: `
<p>The library contains the circuits from the <a href="../circuits/">circuit guides</a>: adders, a 4-bit ALU, a multiplexer, flip-flops, a counter with a hex display, a majority voter, and a deliberate short circuit for practicing diagnosis.</p>
<p>Choose a circuit to load it onto the canvas. Your own circuits are saved in your browser, on your device only, and can be exported as <span class="mono">.circ</span> files at any time.</p>`,
  },
  {
    slug: 'ai-coach',
    title: 'AI Circuit Coach',
    summary: 'Four-stage nudges and the "why is this wire 0, 1, E or Z?" prover.',
    body: `
<p>The coach is symbolic, not a chatbot: it reasons from the circuit itself, so its explanations are exact and work offline.</p>
<h2>Coach me</h2>
<p>When a circuit does not give the expected output, choose <strong>Coach me</strong>. The coach reveals help in four stages, so you can stop as soon as you have the idea:</p>
<ol><li><strong>Where to look</strong></li><li><strong>The pattern</strong></li><li><strong>The logic</strong></li><li><strong>Conclusion</strong></li></ol>
<h2>Why is this wire 0, 1, E or Z?</h2>
<p>Select a pin, gate or wire and ask why it has its value. The prover walks backward from that point through the drivers that determine it. For a red E, it names the competing drivers; for a blue Z, it shows that nothing is driving the net.</p>`,
  },
  {
    slug: 'k-map',
    title: 'Karnaugh Map Minimization',
    summary: 'Truth tables, K-maps, Quine-McCluskey and one-click synthesis.',
    body: `
<p>Open the <strong>Analysis</strong> tab, then enter a Boolean expression or fill in a truth table for up to four variables.</p>
<ul>
<li>The <strong>K-map</strong> view uses Gray-code ordering and draws each prime-implicant loop.</li>
<li>The minimizer reports a minimal sum of products and product of sums, using Quine-McCluskey.</li>
<li><strong>Synthesize</strong> builds a two-level AND-OR circuit from the result and places it on the canvas.</li>
</ul>
<p>New to K-maps? Start with the <a href="../learn/k-map-tutorial.html">tutorial</a>.</p>`,
  },
  {
    slug: 'import-export',
    title: 'Import/Export .circ Files',
    summary: 'Exchange circuits with Logisim 2.7.1.',
    body: `
<p><strong>Import</strong> reads the XML <span class="mono">.circ</span> format written by Logisim 2.7.1. <strong>Export</strong> writes the same format so you can open your work in the original program.</p>
<p>Wiring, Gates, Plexers, Arithmetic, Memory and Input/Output components are supported. Anything else in a file is kept out of the simulation. Everything happens in your browser; files are never uploaded.</p>`,
  },
  {
    slug: 'settings',
    title: 'Settings',
    summary: 'Grid, theme and privacy preferences.',
    body: `
<p>Open <strong>Settings</strong> from the toolbar. You can change the color theme (light, dark or follow the system), grid snapping, and automatic simulation. Privacy and advertising choices are in the same panel and can be changed whenever you like.</p>`,
  },
  {
    slug: 'daily-challenges',
    title: 'Daily Logic Challenges',
    summary: 'A new puzzle every day, seeded by the date.',
    body: `
<p>Each day has a design or troubleshooting puzzle chosen from the date, so everyone gets the same one. Build or repair the circuit; the app checks it against the target truth table and reports the first row that fails. When you solve it you get a shareable result card.</p>
<p>The coach is available during a challenge. Start with a nudge before asking for the answer.</p>`,
  },
  {
    slug: 'offline',
    title: 'Offline and Install',
    summary: 'Use the app without a connection.',
    body: `
<p>Logisim Revisited is a progressive web app. Use your browser's <strong>Install</strong> or <strong>Add to Home Screen</strong> option and it will open like a native app and keep working without a connection, because the simulator runs on your device.</p>`,
  },
  {
    slug: 'privacy',
    title: 'Privacy and Ads',
    summary: 'What is stored, and how advertising consent works.',
    body: `
<p>Your circuits and settings are stored in your browser's local storage, on your device. The simulator and coach run on your device and send nothing to a server.</p>
<p>This website may show ads. Ad scripts load only after you consent, and the consent banner follows Google Consent Mode v2. You can change your choice at any time from the link in the banner or the app's Settings. Details are on the <a href="../privacy.html">privacy page</a>.</p>`,
  },
];
