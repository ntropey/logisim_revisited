/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * SVG circuit diagram renderer for website guides.
 * Zero DOM dependencies; works in Node and browser.
 */

/**
 * Render a circuit diagram as inline SVG.
 * Accepts a circuit object from @logisim/core (parsed via parseCircXml)
 * or a technique example object; light/dark mode aware via CSS variables.
 * This is a lightweight placeholder; real SVG would map component types to symbols.
 */
function diagram(circuit) {
  const components = circuit?.components || [];
  const wires = circuit?.wires || [];

  let compSVG = '';
  for (const comp of components) {
    const x = comp.loc?.x ?? 0;
    const y = comp.loc?.y ?? 0;
    const t = comp.type ?? 'comp';
    const label = comp.attrs?.label || '';
    // Simple rect for each component type
    const color = t.includes('Gate') ? '#2B4EA2' : t.includes('Pin') ? '#A8321F' : t.includes('Clock') ? '#6B3FA0' : '#C9D6F4';
    compSVG += `<rect x="${x - 20}" y="${y - 10}" width="40" height="20" fill="${color}" stroke="#1C1B18" stroke-width="1"/><text x="${x}" y="${y + 5}" text-anchor="middle" font-size="9" fill="#1C1B18">${t.replace(/ Gate$/, '')}${label ? ` "${label}"` : ''}</text>`;
  }

  let wireSVG = '';
  for (const w of wires) {
    const from = w.from;
    const to = w.to;
    wireSVG += `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="var(--line)" stroke-width="1"/>`;
  }

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320" style="background: var(--card); border: 1px solid var(--line); border-radius: 4;">
  ${wireSVG}
  ${compSVG}
</svg>`;
}

/**
 * Render legend for circuit diagram.
 * Shows pin connection dots and wire color meaning.
 */
function legend(circuit) {
  const simInfo = circuit.simResult
    ? `Net values: 0=green, 1=red, Z=blue, E=orange`
    : '';
  return `<div class="legend">
  <span class="lg place">0=Green</span><span class="lg e">1=Red</span><span class="lg z">Z=Blue</span><span class="lg elim">E=Orange</span>
  ${simInfo}
  </div>`;
}

export { diagram, legend, caption };

/** Extract a short caption from a circuit example object. */
function caption(e) { return e.name || e.slug || 'Circuit'; }