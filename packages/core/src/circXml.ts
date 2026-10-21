/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * Pure TypeScript parser and exporter for classic Java Logisim 2.7.1 (.circ) XML files.
 * Zero DOM dependencies so it runs identically in Node, Vitest, and Web Workers.
 */

import {
  COMPONENT_CATALOG,
  type ComponentAttrs,
  type ComponentInstance,
  type ComponentType,
  type Facing,
} from './components';
import type { Circuit, Wire } from './simulator';

const VALID_TYPES = new Set<string>(COMPONENT_CATALOG.map((c) => c.type));

function parseCoord(str: string): { x: number; y: number } | null {
  const m = /\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/.exec(str);
  if (!m) return null;
  return { x: Number(m[1]), y: Number(m[2]) };
}

function unescapeXml(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Parse a Logisim 2.7.1 `.circ` XML string into a `Circuit`.
 */
export function parseCircXml(xml: string): Circuit {
  const trimmed = xml.trim();
  if (!trimmed.includes('<project') && !trimmed.includes('<circuit')) {
    throw new Error('Invalid .circ file: missing <project> or <circuit> element.');
  }

  // Extract the first <circuit name="...">...</circuit> block (or the whole string if <circuit> is root)
  const circuitMatch = /<circuit\b([^>]*)>([\s\S]*?)<\/circuit>/i.exec(trimmed);
  const circuitHeader = circuitMatch ? circuitMatch[1] : '';
  const circuitBody = circuitMatch ? circuitMatch[2] : trimmed;

  const nameMatch = /\bname\s*=\s*"([^"]*)"/i.exec(circuitHeader);
  const name = nameMatch ? unescapeXml(nameMatch[1]) : 'main';

  const wires: Wire[] = [];
  let wireIdx = 1;
  const wireRegex = /<wire\b([^>]*)\/?>/gi;
  for (const m of circuitBody.matchAll(wireRegex)) {
    const attrsStr = m[1];
    const fromAttr = /\bfrom\s*=\s*"([^"]*)"/i.exec(attrsStr);
    const toAttr = /\bto\s*=\s*"([^"]*)"/i.exec(attrsStr);
    if (!fromAttr || !toAttr) continue;
    const from = parseCoord(fromAttr[1]);
    const to = parseCoord(toAttr[1]);
    if (from && to) {
      wires.push({ id: `w_${wireIdx++}`, from, to });
    }
  }

  const components: ComponentInstance[] = [];
  let compIdx = 1;
  const compRegex = /<comp\b([^>]*)(?:\/>|>([\s\S]*?)<\/comp>)/gi;
  for (const m of circuitBody.matchAll(compRegex)) {
    const header = m[1];
    const inner = m[2] ?? '';
    const locMatch = /\bloc\s*=\s*"([^"]*)"/i.exec(header);
    const nameAttr = /\bname\s*=\s*"([^"]*)"/i.exec(header);
    if (!locMatch || !nameAttr) continue;
    const loc = parseCoord(locMatch[1]);
    const rawName = unescapeXml(nameAttr[1]);
    if (!loc || !VALID_TYPES.has(rawName)) continue;

    const type = rawName as ComponentType;
    const catalogEntry = COMPONENT_CATALOG.find((c) => c.type === type);
    const attrs: ComponentAttrs = { ...(catalogEntry?.defaultAttrs ?? {}) };

    const aRegex = /<a\b[^>]*\bname\s*=\s*"([^"]*)"[^>]*\bval\s*=\s*"([^"]*)"[^>]*\/?>/gi;
    for (const am of inner.matchAll(aRegex)) {
      const k = am[1].trim();
      const v = unescapeXml(am[2].trim());
      if (k === 'facing' && (v === 'east' || v === 'west' || v === 'north' || v === 'south')) {
        attrs.facing = v as Facing;
      } else if (k === 'width') {
        attrs.width = Math.max(1, Math.min(32, Number(v) || 1));
      } else if (k === 'inputs' || k === 'fanout') {
        attrs.inputs = Math.max(2, Math.min(8, Number(v) || 2));
      } else if (k === 'select') {
        attrs.selectBits = Math.max(1, Math.min(4, Number(v) || 1));
      } else if (k === 'output') {
        attrs.output = v === 'true';
      } else if (k === 'tristate') {
        attrs.threeState = v === 'true';
      } else if (k === 'label') {
        attrs.label = v;
      } else if (k === 'value') {
        attrs.value = v.startsWith('0x') && (attrs.width ?? 1) === 1 ? String(parseInt(v.slice(2), 16) & 1) : v;
      } else if (k === 'shift') {
        if (v === 'll' || v === 'lr' || v === 'ar' || v === 'rl' || v === 'rr') attrs.shiftKind = v;
      }
    }

    components.push({
      id: `comp_${compIdx++}`,
      type,
      loc,
      attrs,
    });
  }

  return { name, components, wires };
}

/**
 * Serialize a `Circuit` to a Logisim 2.7.1 compatible `.circ` XML document.
 */
export function serializeCircXml(circuit: Circuit): string {
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8" standalone="no"?>',
    '<project source="2.7.1" version="1.0">',
    `  <main name="${escapeXml(circuit.name || 'main')}"/>`,
    '  <lib desc="#Wiring" name="0"/>',
    '  <lib desc="#Gates" name="1"/>',
    '  <lib desc="#Plexers" name="2"/>',
    '  <lib desc="#Arithmetic" name="3"/>',
    '  <lib desc="#Memory" name="4"/>',
    '  <lib desc="#I/O" name="5"/>',
    `  <circuit name="${escapeXml(circuit.name || 'main')}">`,
  ];

  for (const w of circuit.wires) {
    lines.push(`    <wire from="(${w.from.x},${w.from.y})" to="(${w.to.x},${w.to.y})"/>`);
  }

  for (const c of circuit.components) {
    const cat = COMPONENT_CATALOG.find((item) => item.type === c.type);
    const lib = cat?.libId ?? 1;
    const attrLines: string[] = [];
    if (c.attrs.facing && c.attrs.facing !== 'east') {
      attrLines.push(`      <a name="facing" val="${c.attrs.facing}"/>`);
    }
    if (c.attrs.width && c.attrs.width > 1) {
      attrLines.push(`      <a name="width" val="${c.attrs.width}"/>`);
    }
    if (c.attrs.inputs && c.attrs.inputs !== 2) {
      attrLines.push(`      <a name="inputs" val="${c.attrs.inputs}"/>`);
    }
    if (c.attrs.selectBits && c.attrs.selectBits > 1) {
      attrLines.push(`      <a name="select" val="${c.attrs.selectBits}"/>`);
    }
    if (c.attrs.output) {
      attrLines.push('      <a name="output" val="true"/>');
    }
    if (c.attrs.label) {
      attrLines.push(`      <a name="label" val="${escapeXml(c.attrs.label)}"/>`);
    }
    if (c.attrs.value !== undefined) {
      attrLines.push(`      <a name="value" val="${escapeXml(c.attrs.value)}"/>`);
    }
    if (attrLines.length === 0) {
      lines.push(`    <comp lib="${lib}" loc="(${c.loc.x},${c.loc.y})" name="${escapeXml(c.type)}"/>`);
    } else {
      lines.push(`    <comp lib="${lib}" loc="(${c.loc.x},${c.loc.y})" name="${escapeXml(c.type)}">`);
      lines.push(...attrLines);
      lines.push('    </comp>');
    }
  }

  lines.push('  </circuit>', '</project>', '');
  return lines.join('\n');
}
