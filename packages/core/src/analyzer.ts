/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * Combinational Analysis Engine:
 *   - Boolean Expression parser & evaluator (supports AND: & * · implicit, OR: | +, XOR: ^, NOT: ~ ! ')
 *   - Truth Table (2 to 4 variables)
 *   - Quine-McCluskey prime implicant minimization (Sum of Products & Product of Sums)
 *   - Gray-Code Karnaugh Map (2x2, 2x4, 4x4) with prime-implicant loop coordinates
 *   - Automatic Two-Level Circuit Synthesis (Truth Table / K-Map -> wired Logisim Circuit)
 */

import type { ComponentInstance } from './components';
import type { Circuit, Wire } from './simulator';

export type TruthValue = '0' | '1' | 'X';

export interface TruthTable {
  vars: readonly string[];
  outName: string;
  /** Length = 2^(vars.length), indexed by binary value of vars (vars[0] = MSB) */
  rows: readonly TruthValue[];
}

export interface Implicant {
  /** Pattern of '0', '1', '-' of length vars.length */
  pattern: string;
  /** Covered minterm indices */
  minterms: number[];
  /**Formatted algebraic product term, e.g. "A·~B" */
  term: string;
  /** Whether this prime implicant is essential */
  essential: boolean;
}

export interface KMapCell {
  row: number;
  col: number;
  minterm: number;
  value: TruthValue;
}

export interface KMapLoop {
  implicant: Implicant;
  cells: { row: number; col: number }[];
  colorIndex: number;
}

export interface KMapAnalysis {
  table: TruthTable;
  rowVars: string[];
  colVars: string[];
  rowGray: string[];
  colGray: string[];
  grid: KMapCell[][];
  primeImplicants: Implicant[];
  minimalImplicants: Implicant[];
  loops: KMapLoop[];
  minimalSop: string;
  minimalPos: string;
  canonicalMinterms: number[];
  canonicalMaxterms: number[];
}

/**
 * Evaluate a Boolean expression for a given variable assignment `{ A: 1, B: 0, ... }`.
 * Supports:
 *   - Variables: A..Z (case-insensitive, matched against `vars`)
 *   - Constants: 0, 1
 *   - Prefix NOT: ~A, !A, ¬A
 *   - Postfix NOT: A'
 *   - AND: A & B, A * B, A · B, or implicit adjacency AB / A(B+C)
 *   - XOR: A ^ B, A ⊕ B
 *   - OR: A | B, A + B
 */
export function evaluateBooleanExpr(expr: string, env: Record<string, number>): number {
  const tokens = tokenizeExpr(expr);
  let pos = 0;

  const parseOr = (): number => {
    let left = parseXor();
    while (pos < tokens.length && tokens[pos] === '|') {
      pos++;
      const right = parseXor();
      left = left | right;
    }
    return left & 1;
  };

  const parseXor = (): number => {
    let left = parseAnd();
    while (pos < tokens.length && tokens[pos] === '^') {
      pos++;
      const right = parseAnd();
      left = left ^ right;
    }
    return left & 1;
  };

  const parseAnd = (): number => {
    let left = parseUnary();
    while (
      pos < tokens.length &&
      (tokens[pos] === '&' || isAtomOrPrefixStart(tokens[pos]))
    ) {
      if (tokens[pos] === '&') pos++;
      const right = parseUnary();
      left = left & right;
    }
    return left & 1;
  };

  const parseUnary = (): number => {
    if (pos < tokens.length && tokens[pos] === '~') {
      pos++;
      return (~parseUnary()) & 1;
    }
    let val = parsePrimary();
    while (pos < tokens.length && tokens[pos] === "'") {
      pos++;
      val = (~val) & 1;
    }
    return val & 1;
  };

  const parsePrimary = (): number => {
    const tok = tokens[pos];
    if (tok === undefined) return 0;
    if (tok === '(') {
      pos++;
      const v = parseOr();
      if (tokens[pos] === ')') pos++;
      return v;
    }
    pos++;
    if (tok === '0') return 0;
    if (tok === '1') return 1;
    const upper = tok.toUpperCase();
    return (env[tok] ?? env[upper] ?? 0) & 1;
  };

  return parseOr() & 1;
}

function isAtomOrPrefixStart(tok: string | undefined): boolean {
  if (!tok) return false;
  return tok === '(' || tok === '~' || tok === '0' || tok === '1' || /^[A-Za-z]/.test(tok);
}

function tokenizeExpr(expr: string): string[] {
  const out: string[] = [];
  const s = expr
    .replace(/\bNOT\b/gi, '~')
    .replace(/\bAND\b/gi, '&')
    .replace(/\bOR\b/gi, '|')
    .replace(/\bXOR\b/gi, '^');
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (/\s/.test(ch)) continue;
    if (ch === '+' || ch === '|' || ch === '∨') out.push('|');
    else if (ch === '*' || ch === '&' || ch === '·' || ch === '∧') out.push('&');
    else if (ch === '^' || ch === '⊕') out.push('^');
    else if (ch === '~' || ch === '!' || ch === '¬') out.push('~');
    else if (ch === "'" || ch === '(' || ch === ')' || ch === '0' || ch === '1') out.push(ch);
    else if (/[A-Za-z]/.test(ch)) {
      out.push(ch.toUpperCase());
    }
  }
  return out;
}

export function truthTableFromExpr(
  expr: string,
  vars: readonly string[] = ['A', 'B', 'C'],
  outName = 'Y',
): TruthTable {
  const n = vars.length;
  const total = 1 << n;
  const rows: TruthValue[] = [];
  for (let i = 0; i < total; i++) {
    const env: Record<string, number> = {};
    for (let b = 0; b < n; b++) {
      env[vars[b]] = (i >> (n - 1 - b)) & 1;
    }
    const res = evaluateBooleanExpr(expr, env);
    rows.push(res === 1 ? '1' : '0');
  }
  return { vars, outName, rows };
}

function formatPatternAsSopTerm(pattern: string, vars: readonly string[]): string {
  const parts: string[] = [];
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === '1') parts.push(vars[i]);
    else if (pattern[i] === '0') parts.push(`~${vars[i]}`);
  }
  return parts.length === 0 ? '1' : parts.join('·');
}

function formatPatternAsPosClause(pattern: string, vars: readonly string[]): string {
  const parts: string[] = [];
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === '1') parts.push(`~${vars[i]}`);
    else if (pattern[i] === '0') parts.push(vars[i]);
  }
  if (parts.length === 0) return '0';
  return parts.length === 1 ? parts[0] : `(${parts.join(' + ')})`;
}

function canMergePatterns(a: string, b: string): string | null {
  let diffIdx = -1;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      if (a[i] === '-' || b[i] === '-' || diffIdx !== -1) return null;
      diffIdx = i;
    }
  }
  if (diffIdx === -1) return null;
  return a.slice(0, diffIdx) + '-' + a.slice(diffIdx + 1);
}

/**
 * Quine-McCluskey prime implicant finder and exact cover selector.
 */
export function findPrimeImplicants(
  numVars: number,
  ones: readonly number[],
  dontCares: readonly number[],
  vars: readonly string[],
): { primeImplicants: Implicant[]; minimalImplicants: Implicant[] } {
  const allTerms = [...new Set([...ones, ...dontCares])].sort((a, b) => a - b);
  if (ones.length === 0) {
    return { primeImplicants: [], minimalImplicants: [] };
  }

  let currentGroup = new Map<string, Set<number>>();
  for (const m of allTerms) {
    const pat = m.toString(2).padStart(numVars, '0');
    currentGroup.set(pat, new Set([m]));
  }

  const primeMap = new Map<string, Set<number>>();

  while (currentGroup.size > 0) {
    const nextGroup = new Map<string, Set<number>>();
    const used = new Set<string>();
    const entries = [...currentGroup.entries()];

    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const merged = canMergePatterns(entries[i][0], entries[j][0]);
        if (merged !== null) {
          used.add(entries[i][0]);
          used.add(entries[j][0]);
          const existing = nextGroup.get(merged) ?? new Set<number>();
          for (const m of entries[i][1]) existing.add(m);
          for (const m of entries[j][1]) existing.add(m);
          nextGroup.set(merged, existing);
        }
      }
    }

    for (const [pat, mset] of entries) {
      if (!used.has(pat)) {
        primeMap.set(pat, mset);
      }
    }
    currentGroup = nextGroup;
  }

  // Filter out prime implicants that only cover don't-cares
  const oneSet = new Set(ones);
  const primeImplicants: Implicant[] = [];
  for (const [pattern, mset] of primeMap.entries()) {
    const coveredOnes = [...mset].filter((m) => oneSet.has(m)).sort((a, b) => a - b);
    if (coveredOnes.length === 0) continue;
    primeImplicants.push({
      pattern,
      minterms: [...mset].sort((a, b) => a - b),
      term: formatPatternAsSopTerm(pattern, vars),
      essential: false,
    });
  }

  // Sort prime implicants deterministically (fewer literals first, then lexicographical)
  primeImplicants.sort((a, b) => {
    const litA = [...a.pattern].filter((c) => c !== '-').length;
    const litB = [...b.pattern].filter((c) => c !== '-').length;
    if (litA !== litB) return litA - litB;
    return a.pattern.localeCompare(b.pattern);
  });

  // Identify essential prime implicants
  const uncovered = new Set<number>(ones);
  const chosen: Implicant[] = [];

  for (const m of ones) {
    const covering = primeImplicants.filter((pi) => pi.minterms.includes(m));
    if (covering.length === 1) {
      const ess = covering[0];
      ess.essential = true;
      if (!chosen.includes(ess)) {
        chosen.push(ess);
        for (const cm of ess.minterms) uncovered.delete(cm);
      }
    }
  }

  // Greedy / exact cover for remaining minterms
  while (uncovered.size > 0) {
    let best: Implicant | null = null;
    let bestCount = -1;
    for (const pi of primeImplicants) {
      if (chosen.includes(pi)) continue;
      const count = pi.minterms.filter((m) => uncovered.has(m)).length;
      if (count > bestCount) {
        bestCount = count;
        best = pi;
      }
    }
    if (!best || bestCount <= 0) break;
    chosen.push(best);
    for (const cm of best.minterms) uncovered.delete(cm);
  }

  return { primeImplicants, minimalImplicants: chosen };
}

const GRAY_1 = ['0', '1'];
const GRAY_2 = ['00', '01', '11', '10'];

/**
 * Perform full Combinational & Karnaugh Map analysis on a `TruthTable` (2, 3, or 4 variables).
 */
export function analyzeTruthTable(table: TruthTable): KMapAnalysis {
  const n = table.vars.length;
  const ones: number[] = [];
  const zeros: number[] = [];
  const dontCares: number[] = [];

  for (let i = 0; i < table.rows.length; i++) {
    const v = table.rows[i];
    if (v === '1') ones.push(i);
    else if (v === 'X') dontCares.push(i);
    else zeros.push(i);
  }

  const { primeImplicants, minimalImplicants } = findPrimeImplicants(n, ones, dontCares, table.vars);
  const { minimalImplicants: posImplicants } = findPrimeImplicants(n, zeros, dontCares, table.vars);

  const minimalSop =
    ones.length === 0
      ? '0'
      : minimalImplicants.some((pi) => pi.term === '1')
        ? '1'
        : minimalImplicants.map((pi) => pi.term).join(' + ');

  const minimalPos =
    zeros.length === 0
      ? '1'
      : posImplicants.some((pi) => pi.term === '1')
        ? '0'
        : posImplicants.map((pi) => formatPatternAsPosClause(pi.pattern, table.vars)).join('·');

  // Build Gray-code K-Map grid (2 vars: 2x2; 3 vars: 2x4; 4 vars: 4x4)
  const rowBitCount = n === 2 ? 1 : n === 3 ? 1 : 2;
  const rowVars = table.vars.slice(0, rowBitCount);
  const colVars = table.vars.slice(rowBitCount);
  const rowGray = rowBitCount === 1 ? GRAY_1 : GRAY_2;
  const colGray = colVars.length === 1 ? GRAY_1 : GRAY_2;

  const grid: KMapCell[][] = [];
  const mintermToCoord = new Map<number, { row: number; col: number }>();

  for (let r = 0; r < rowGray.length; r++) {
    const rowCells: KMapCell[] = [];
    for (let c = 0; c < colGray.length; c++) {
      const bits = rowGray[r] + colGray[c];
      const minterm = parseInt(bits, 2);
      const cell: KMapCell = {
        row: r,
        col: c,
        minterm,
        value: table.rows[minterm] ?? '0',
      };
      rowCells.push(cell);
      mintermToCoord.set(minterm, { row: r, col: c });
    }
    grid.push(rowCells);
  }

  const loops: KMapLoop[] = minimalImplicants.map((imp, idx) => ({
    implicant: imp,
    cells: imp.minterms.map((m) => mintermToCoord.get(m) ?? { row: 0, col: 0 }),
    colorIndex: idx % 6,
  }));

  return {
    table,
    rowVars,
    colVars,
    rowGray,
    colGray,
    grid,
    primeImplicants,
    minimalImplicants,
    loops,
    minimalSop,
    minimalPos,
    canonicalMinterms: ones,
    canonicalMaxterms: zeros,
  };
}

/**
 * Automatically synthesize a clean, runnable Logisim `Circuit` from a `TruthTable`
 * using its minimal Sum-of-Products (SOP) implicants!
 */
export function synthesizeCircuitFromTruthTable(table: TruthTable, circuitName = 'Synthesized'): Circuit {
  const analysis = analyzeTruthTable(table);
  const components: ComponentInstance[] = [];
  const wires: Wire[] = [];
  let wireIdx = 1;
  const addWire = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    if (from.x === to.x && from.y === to.y) return;
    if (from.x !== to.x && from.y !== to.y) {
      const mid = { x: to.x, y: from.y };
      wires.push({ id: `w${wireIdx++}`, from, to: mid });
      wires.push({ id: `w${wireIdx++}`, from: mid, to });
    } else {
      wires.push({ id: `w${wireIdx++}`, from, to });
    }
  };

  // Place Input Pins on the left + Tunnels for clean routing (plus inverted Tunnels when needed)
  const needsNot = new Set<number>();
  for (const imp of analysis.minimalImplicants) {
    for (let i = 0; i < imp.pattern.length; i++) {
      if (imp.pattern[i] === '0') needsNot.add(i);
    }
  }

  table.vars.forEach((vName, idx) => {
    const y = 60 + idx * 50;
    components.push({
      id: `pin_${vName}`,
      type: 'Pin',
      loc: { x: 60, y },
      attrs: { facing: 'east', width: 1, output: false, label: vName, value: '0' },
    });
    components.push({
      id: `tun_${vName}`,
      type: 'Tunnel',
      loc: { x: 80, y },
      attrs: { facing: 'east', width: 1, label: vName },
    });
    addWire({ x: 60, y }, { x: 80, y });

    if (needsNot.has(idx)) {
      const ny = y + 20;
      addWire({ x: 70, y }, { x: 70, y: ny });
      addWire({ x: 70, y: ny }, { x: 90, y: ny });
      components.push({
        id: `not_${vName}`,
        type: 'NOT Gate',
        loc: { x: 120, y: ny },
        attrs: { facing: 'east', width: 1 },
      });
      components.push({
        id: `tun_not_${vName}`,
        type: 'Tunnel',
        loc: { x: 130, y: ny },
        attrs: { facing: 'east', width: 1, label: `~${vName}` },
      });
      addWire({ x: 120, y: ny }, { x: 130, y: ny });
    }
  });

  // Special case: constant 0 or 1
  if (analysis.minimalSop === '0' || analysis.minimalSop === '1') {
    components.push({
      id: 'const_out',
      type: 'Constant',
      loc: { x: 260, y: 120 },
      attrs: { facing: 'east', width: 1, value: analysis.minimalSop },
    });
    components.push({
      id: `out_${table.outName}`,
      type: 'Pin',
      loc: { x: 320, y: 120 },
      attrs: { facing: 'west', width: 1, output: true, label: table.outName },
    });
    addWire({ x: 260, y: 120 }, { x: 320, y: 120 });
    return { name: circuitName, components, wires };
  }

  // Build product terms (AND gates or direct literal tunnels)
  const termOutputs: { x: number; y: number }[] = [];
  analysis.minimalImplicants.forEach((imp, tIdx) => {
    const lits: string[] = [];
    for (let i = 0; i < imp.pattern.length; i++) {
      if (imp.pattern[i] === '1') lits.push(table.vars[i]);
      else if (imp.pattern[i] === '0') lits.push(`~${table.vars[i]}`);
    }
    const baseY = 60 + tIdx * 60;
    if (lits.length === 1) {
      components.push({
        id: `term_tun_${tIdx}`,
        type: 'Tunnel',
        loc: { x: 280, y: baseY },
        attrs: { facing: 'west', width: 1, label: lits[0] },
      });
      termOutputs.push({ x: 280, y: baseY });
    } else {
      const andId = `and_${tIdx}`;
      const andComp: ComponentInstance = {
        id: andId,
        type: 'AND Gate',
        loc: { x: 280, y: baseY },
        attrs: { facing: 'east', width: 1, inputs: lits.length },
      };
      components.push(andComp);
      const half = Math.floor(lits.length / 2);
      lits.forEach((lit, lIdx) => {
        const offset =
          lits.length % 2 === 0
            ? lIdx < half
              ? lIdx - half
              : lIdx - half + 1
            : lIdx - half;
        const pinY = baseY + offset * 10;
        const pinX = 230;
        components.push({
          id: `in_tun_${tIdx}_${lIdx}`,
          type: 'Tunnel',
          loc: { x: pinX - 10, y: pinY },
          attrs: { facing: 'west', width: 1, label: lit },
        });
        addWire({ x: pinX - 10, y: pinY }, { x: pinX, y: pinY });
      });
      termOutputs.push({ x: 280, y: baseY });
    }
  });

  if (termOutputs.length === 1) {
    const pt = termOutputs[0];
    components.push({
      id: `out_${table.outName}`,
      type: 'Pin',
      loc: { x: 350, y: pt.y },
      attrs: { facing: 'west', width: 1, output: true, label: table.outName },
    });
    addWire(pt, { x: 350, y: pt.y });
  } else {
    const orY = Math.round(termOutputs.reduce((acc, p) => acc + p.y, 0) / termOutputs.length / 10) * 10;
    const orX = 390;
    components.push({
      id: 'or_final',
      type: 'OR Gate',
      loc: { x: orX, y: orY },
      attrs: { facing: 'east', width: 1, inputs: termOutputs.length },
    });
    const half = Math.floor(termOutputs.length / 2);
    termOutputs.forEach((pt, idx) => {
      const offset =
        termOutputs.length % 2 === 0
          ? idx < half
            ? idx - half
            : idx - half + 1
          : idx - half;
      const inY = orY + offset * 10;
      const inX = orX - 50;
      const channelX = 300 + idx * 10;
      addWire(pt, { x: channelX, y: pt.y });
      addWire({ x: channelX, y: pt.y }, { x: channelX, y: inY });
      addWire({ x: channelX, y: inY }, { x: inX, y: inY });
    });
    components.push({
      id: `out_${table.outName}`,
      type: 'Pin',
      loc: { x: 440, y: orY },
      attrs: { facing: 'west', width: 1, output: true, label: table.outName },
    });
    addWire({ x: orX, y: orY }, { x: 440, y: orY });
  }

  return { name: circuitName, components, wires };
}
