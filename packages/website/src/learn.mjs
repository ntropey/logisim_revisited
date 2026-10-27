/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * Learn pages: short, self-contained guides to digital logic. Bodies are trusted HTML written here.
 */

export const LEARN = [
  {
    slug: 'how-digital-works',
    title: 'How Digital Logic Works',
    summary: 'Bits, gates and flip-flops, from AND and OR to circuits that remember.',
    body: `
<h2>Everything is a wire that is 0 or 1</h2>
<p>A digital circuit is a set of wires, and each wire carries one of two voltages: <strong>0</strong> (low) or <strong>1</strong> (high). Groups of wires side by side form a <em>bus</em> that carries a multi-bit number. Logisim Revisited also tracks two extra states that real hardware has: <strong>Z</strong> (nothing is driving the wire, so it floats) and <strong>E</strong> (two drivers disagree, which is a short circuit).</p>
<h2>Gates</h2>
<p>A gate computes one output bit from its inputs.</p>
<table class="ref">
<tr><th><a href="../components/not-gate.html">NOT</a></th><td>Inverts its input. 0 becomes 1 and 1 becomes 0.</td></tr>
<tr><th><a href="../components/and-gate.html">AND</a></th><td>Outputs 1 only if <em>every</em> input is 1.</td></tr>
<tr><th><a href="../components/or-gate.html">OR</a></th><td>Outputs 1 if <em>at least one</em> input is 1.</td></tr>
<tr><th><a href="../components/xor-gate.html">XOR</a></th><td>Outputs 1 if an <em>odd number</em> of inputs are 1, which for two inputs means they differ.</td></tr>
<tr><th><a href="../components/nand-gate.html">NAND</a>, <a href="../components/nor-gate.html">NOR</a>, <a href="../components/xnor-gate.html">XNOR</a></th><td>The AND, OR and XOR gates followed by a NOT.</td></tr>
</table>
<p>NAND alone is enough to build every other gate, which is why real chips lean on it.</p>
<h2>Combinational circuits</h2>
<p>When the output depends only on the current inputs, the circuit is <em>combinational</em>. Adders, multiplexers and decoders are all combinational. You can describe any of them with a truth table and, from that, a Boolean expression. See the <a href="k-map-tutorial.html">Karnaugh map tutorial</a> for how to make the expression small.</p>
<h2>Sequential circuits</h2>
<p>Feed a gate's output back to its own input and the circuit can <em>remember</em>. Two cross-coupled NOR gates make an S-R latch; add a clock and you get a flip-flop (<a href="../components/s-r-flip-flop.html">S-R Flip-Flop</a>, <a href="../components/j-k-flip-flop.html">J-K Flip-Flop</a>, <a href="../components/t-flip-flop.html">T Flip-Flop</a>, or <a href="../components/d-flip-flop.html">D Flip-Flop</a>) that only changes on a clock edge. Registers, counters and memories are built from flip-flops.</p>
<p>Try it: open the <a href="../circuits/jk-flip-flop.html">flip-flop circuit guide</a> or <a href="../play/">the app</a>, click an input pin with the Poke tool, and watch the wires change color.</p>`,
  },
  {
    slug: 'k-map-tutorial',
    title: 'Karnaugh Map Tutorial',
    summary: 'Minimize a Boolean function by circling groups on a Gray-code grid.',
    body: `
<h2>What a K-map is</h2>
<p>A Karnaugh map is a truth table rearranged into a grid so that neighboring cells differ in exactly one input. Groups of adjacent 1s then correspond to simpler product terms.</p>
<h2>Steps</h2>
<ol>
<li>Fill each cell with the function's output (1, 0, or X for don't care).</li>
<li>Circle rectangular groups of 1s. Group sizes must be a power of two: 1, 2, 4, 8, 16.</li>
<li>Make groups as large as possible. Groups may wrap around the edges, because the rows and columns are in Gray-code order (00, 01, 11, 10).</li>
<li>Cover every 1 with as few groups as possible. Don't-care cells may help a group grow, but need not be covered.</li>
<li>Each group becomes one AND term. Keep the variables that do not change inside the group. OR the terms together.</li>
</ol>
<h2>Example: majority of three</h2>
<p>The function is 1 when at least two of A, B and C are 1. Its map has three groups of two cells, giving <span class="mono">Y = A·B + B·C + A·C</span>.</p>
<h2>Terms to know</h2>
<ul>
<li>A <strong>prime implicant</strong> is a group that cannot be made any larger.</li>
<li>An <strong>essential</strong> prime implicant covers a 1 that no other prime implicant covers, so it must be in the answer.</li>
</ul>
<p>The app's Analysis tab does this for you with the Quine-McCluskey method, draws the loops on the map, and can synthesize the resulting gates. See <a href="../manual/k-map.html">the manual chapter</a>.</p>`,
  },
  {
    slug: 'glossary',
    title: 'Glossary',
    summary: 'Terms and notation used in digital logic design and in this app.',
    body: `
<table class="ref">
<tr><th>Minterm</th><td>An AND of every input variable, true or inverted, that is 1 for exactly one row of the truth table.</td></tr>
<tr><th>Maxterm</th><td>An OR of every input variable that is 0 for exactly one row of the truth table.</td></tr>
<tr><th>SOP</th><td>Sum of products: an OR of AND terms, such as <span class="mono">A·B + C</span>.</td></tr>
<tr><th>POS</th><td>Product of sums: an AND of OR terms, such as <span class="mono">(A+B)·C</span>.</td></tr>
<tr><th>Prime implicant</th><td>A product term that cannot be simplified further without becoming wrong.</td></tr>
<tr><th>Don't care (X)</th><td>An input combination whose output does not matter, which the minimizer may treat as 0 or 1.</td></tr>
<tr><th>Fan-in / fan-out</th><td>The number of inputs a gate has, and the number of gate inputs one output drives.</td></tr>
<tr><th>Tri-state</th><td>An output that is 0, 1, or disconnected (Z).</td></tr>
<tr><th>Z</th><td>High impedance: nothing drives the wire. Shown in blue.</td></tr>
<tr><th>E</th><td>Error: drivers conflict, or an input is invalid. Shown in red.</td></tr>
<tr><th>Bus</th><td>A bundle of wires carrying a multi-bit value.</td></tr>
<tr><th>Latch / flip-flop</th><td>A one-bit memory. A flip-flop changes only on a clock edge.</td></tr>
<tr><th>Rising edge</th><td>The moment a clock goes from 0 to 1.</td></tr>
<tr><th>Gray code</th><td>A counting order in which consecutive values differ in one bit.</td></tr>
</table>`,
  },
  {
    slug: 'logisim-online-no-java',
    title: 'Logisim Online in Your Browser (No Java Required)',
    summary: 'Run Logisim online directly in your web browser without installing Java: open and export .circ files, simulate 4-state digital logic, and debug circuits with the Logisim AI Coach.',
    body: `
<h2>Run Logisim Online Without Installing Java</h2>
<p>Classic Logisim 2.7.1 is a desktop Java (<span class="mono">.jar</span>) application. Modern school laptops, Chromebooks, iPads, and work computers often block Java installations or struggle with High-DPI scaling on legacy Swing windows.</p>
<p><strong>Logisim Revisited</strong> lets you run Logisim online directly in your browser. The discrete-event 4-state simulation engine, schematic editor, and <span class="mono">.circ</span> XML parser are rebuilt in pure TypeScript—so there is nothing to download, no Java Runtime Environment (JRE) required, and your circuits never leave your device.</p>
<h2>Opening and Saving Your <span class="mono">.circ</span> Files Online</h2>
<ol>
<li>Open <a href="../play/">the online Logisim simulator</a> in any desktop, Chromebook, or mobile browser.</li>
<li>Click <strong>Import</strong> in the top toolbar and choose your existing Logisim 2.7.1 <span class="mono">.circ</span> file.</li>
<li>Use the <strong>Poke</strong> tool to toggle <a href="../components/pin.html">Input Pins</a>, step the <a href="../components/clock.html">Clock</a>, and inspect wires live.</li>
<li>Click <strong>Export</strong> at any time to download a standard <span class="mono">.circ</span> XML file that opens back in desktop Logisim 2.7.1.</li>
</ol>
<p>All 41 core components across the six classic libraries—Wiring (<a href="../components/pin.html">Pin</a>, <a href="../components/tunnel.html">Tunnel</a>, <a href="../components/splitter.html">Splitter</a>, <a href="../components/clock.html">Clock</a>), Gates (<a href="../components/xor-gate.html">XOR</a>, <a href="../components/nand-gate.html">NAND</a>, <a href="../components/controlled-buffer.html">Tri-State Buffer</a>), Plexers (<a href="../components/multiplexer.html">MUX</a>, <a href="../components/decoder.html">Decoder</a>), Arithmetic (<a href="../components/adder.html">Adder</a>, <a href="../components/comparator.html">Comparator</a>), Memory (<a href="../components/s-r-flip-flop.html">S-R Flip-Flop</a>, <a href="../components/t-flip-flop.html">T Flip-Flop</a>, <a href="../components/j-k-flip-flop.html">J-K Flip-Flop</a>, <a href="../components/d-flip-flop.html">D Flip-Flop</a>, <a href="../components/register.html">Register</a>, <a href="../components/counter.html">Counter</a>, <a href="../components/rom.html">ROM</a>), and Input/Output (<a href="../components/7-segment-display.html">7-Segment Display</a>, <a href="../components/hex-digit-display.html">Hex Digit Display</a>)—are simulated right in the browser. See the full <a href="../components/">component reference</a>.</p>
<h2>What Logisim Revisited Adds Beyond Logisim 2.7.1</h2>
<ul>
<li><strong><a href="../manual/ai-coach.html">Logisim AI Circuit Coach &amp; Signal Prover</a>:</strong> Ask <em>"Why is this wire 0, 1, E, or Z?"</em> on any pin or net to trace its upstream drivers step by step, or get 4-stage Socratic hints without spoiling the answer.</li>
<li><strong><a href="../manual/k-map.html">Karnaugh Map &amp; Quine-McCluskey Analyzer</a>:</strong> Enter a truth table or Boolean expression, view the Gray-code K-map loops, and synthesize a two-level gate circuit onto the canvas in one click.</li>
<li><strong><a href="../manual/daily-challenges.html">Daily Logic Challenges</a>:</strong> Practice building and debugging combinational and sequential circuits with a new graded puzzle every day.</li>
</ul>`,
  },
];
