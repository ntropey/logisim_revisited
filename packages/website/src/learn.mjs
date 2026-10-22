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
<tr><th>NOT</th><td>Inverts its input. 0 becomes 1 and 1 becomes 0.</td></tr>
<tr><th>AND</th><td>Outputs 1 only if <em>every</em> input is 1.</td></tr>
<tr><th>OR</th><td>Outputs 1 if <em>at least one</em> input is 1.</td></tr>
<tr><th>XOR</th><td>Outputs 1 if an <em>odd number</em> of inputs are 1, which for two inputs means they differ.</td></tr>
<tr><th>NAND, NOR, XNOR</th><td>The AND, OR and XOR gates followed by a NOT.</td></tr>
</table>
<p>NAND alone is enough to build every other gate, which is why real chips lean on it.</p>
<h2>Combinational circuits</h2>
<p>When the output depends only on the current inputs, the circuit is <em>combinational</em>. Adders, multiplexers and decoders are all combinational. You can describe any of them with a truth table and, from that, a Boolean expression. See the <a href="k-map-tutorial.html">Karnaugh map tutorial</a> for how to make the expression small.</p>
<h2>Sequential circuits</h2>
<p>Feed a gate's output back to its own input and the circuit can <em>remember</em>. Two cross-coupled NOR gates make an S-R latch; add a clock and you get a flip-flop that only changes on a clock edge. Registers, counters and memories are built from flip-flops.</p>
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
    title: 'Run Logisim Online (No Java)',
    summary: 'Use Logisim circuits in the browser without installing Java.',
    body: `
<h2>The problem</h2>
<p>Logisim 2.7.1 is a Java program. Many school and work computers no longer allow installing Java, and recent operating systems make old Java applications awkward to run.</p>
<h2>The alternative</h2>
<p>Logisim Revisited is a port of Logisim 2.7.1 to TypeScript. The simulation engine runs entirely in your browser, so there is nothing to install, nothing is uploaded, and it works offline once installed as a web app.</p>
<h2>Opening your old circuits</h2>
<ol>
<li>Open <a href="../play/">the app</a>.</li>
<li>Choose <strong>Import</strong> and select your <span class="mono">.circ</span> file.</li>
<li>Poke inputs, edit, and export back to <span class="mono">.circ</span> whenever you like.</li>
</ol>
<p>The importer reads the Logisim 2.7.1 file format. Components outside the supported libraries (Wiring, Gates, Plexers, Arithmetic, Memory, Input/Output) are not simulated. See the <a href="../components/">component reference</a> for what is covered.</p>
<h2>What is new</h2>
<p>A step-by-step <a href="../manual/ai-coach.html">AI Coach</a>, a "why is this wire 0, 1, E or Z?" prover, a Karnaugh map analyzer, and daily logic challenges.</p>`,
  },
];
