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
<li>Place two <a href="../components/pin.html">input pins and an output pin</a>.</li>
<li>Choose the <strong>Wire</strong> tool and drag from one pin to another.</li>
<li>Switch to the <strong>Poke</strong> tool and click an input to toggle it. Wires update immediately.</li>
</ol>
<h2>Wire colors</h2>
<p>Green is 0, bright green/red is 1, blue is Z (floating), and a red error mark means E (a conflict). The same colors are used on every guide on this site.</p>`,
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
    title: 'Logisim AI Circuit Coach & Signal Prover',
    summary: 'How Logisim AI works: deterministic 4-stage Socratic circuit coaching, automated truth-table verification, and the "Why is this wire 0, 1, E, or Z?" backward signal prover.',
    body: `
<p><strong>Logisim AI</strong> in Logisim Revisited is a symbolic, deterministic reasoning engine built directly into the circuit simulator—not an LLM chatbot that guesses or hallucinates. Because it analyzes your live netlist and 4-state signal graph directly in the browser, every explanation is 100% faithful to your circuit and works completely offline.</p>
<h2>Four-Stage Socratic Coaching ("Coach me")</h2>
<p>When a circuit does not match the target truth table or behaves unexpectedly, open the <strong>AI Coach</strong> drawer and choose <strong>Coach me</strong>. Instead of giving away the entire solution at once, the coach reveals help in four progressive stages so you can stop as soon as the idea clicks:</p>
<ol>
<li><strong>1. Where to look:</strong> Highlights the specific component, pin, or net where the discrepancy or wiring error originates (such as an unconnected input pin or a short-circuit bus).</li>
<li><strong>2. The pattern:</strong> Identifies the category of digital logic issue—for example, competing drivers on a <a href="../components/tunnel.html">Tunnel</a> net, an inverted Carry chain in a <a href="../circuits/full-adder.html">Full Adder</a>, or a wrong pin order on a <a href="../components/7-segment-display.html">7-Segment Display</a>.</li>
<li><strong>3. The logic:</strong> Shows the exact input combination (truth-table row) where your circuit’s actual output diverges from the expected Boolean output, or traces the controlling input on an <a href="../components/and-gate.html">AND</a>, <a href="../components/or-gate.html">OR</a>, or <a href="../components/xor-gate.html">XOR Gate</a>.</li>
<li><strong>4. Conclusion:</strong> Explains the concrete fix needed to repair the circuit.</li>
</ol>
<h2>"Why is this wire 0, 1, E, or Z?" Signal Prover</h2>
<p>Click any wire, <a href="../components/pin.html">Pin</a>, <a href="../components/probe.html">Probe</a>, flip-flop (<a href="../components/s-r-flip-flop.html">S-R</a>, <a href="../components/t-flip-flop.html">T</a>, <a href="../components/j-k-flip-flop.html">J-K</a>, or <a href="../components/d-flip-flop.html">D Flip-Flop</a>), or gate on the schematic and ask <strong>Why?</strong> The backward signal provenance tracer walks upstream from that point through every gate and net that determines its current state:</p>
<ul>
<li><strong>Why is this 0 or 1?</strong> Traces the active driving gate and highlights whether a controlling input (such as a single <span class="mono">0</span> on an AND gate or <span class="mono">1</span> on an OR gate) determined the output.</li>
<li><strong>Why is this E (red conflict)?</strong> Pinpoints the two or more competing outputs driving <span class="mono">0</span> and <span class="mono">1</span> onto the same wire simultaneously, or identifies the upstream floating/invalid input propagating an error. Try it live in the <a href="../circuits/short-circuit-demo.html">Short-Circuit Demo</a>.</li>
<li><strong>Why is this Z (blue floating)?</strong> Shows that no active output pin is driving the net (for example, an unconnected wire or a <a href="../components/controlled-buffer.html">Tri-State Buffer</a> whose Enable pin is <span class="mono">0</span>).</li>
</ul>`,
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
