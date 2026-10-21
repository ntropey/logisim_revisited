/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * 4-state multi-bit digital logic value engine compatible with classic Logisim 2.7.1:
 *   '0' = Low (false)
 *   '1' = High (true)
 *   'Z' = Floating / High-Impedance / Unknown (blue wire in Logisim)
 *   'E' = Error / Conflicting drivers / Oscillation (red wire in Logisim)
 */

export type BitState = '0' | '1' | 'Z' | 'E';

/** Multi-bit logic value. `bits[0]` is the least significant bit (LSB); `bits[width - 1]` is the MSB. */
export interface LogicValue {
  readonly width: number;
  readonly bits: readonly BitState[];
}

export function createValue(bits: readonly BitState[]): LogicValue {
  if (bits.length === 0) return { width: 1, bits: ['Z'] };
  return { width: bits.length, bits: [...bits] };
}

export function floatingValue(width = 1): LogicValue {
  const w = Math.max(1, Math.min(32, width));
  return { width: w, bits: new Array<BitState>(w).fill('Z') };
}

export function errorValue(width = 1): LogicValue {
  const w = Math.max(1, Math.min(32, width));
  return { width: w, bits: new Array<BitState>(w).fill('E') };
}

export function valueFromInt(num: number, width = 1): LogicValue {
  const w = Math.max(1, Math.min(32, width));
  const bits: BitState[] = [];
  const u = num >>> 0;
  for (let i = 0; i < w; i++) {
    bits.push(((u >>> i) & 1) === 1 ? '1' : '0');
  }
  return { width: w, bits };
}

/** Parse MSB-first string like '1010', 'Z', 'E', or '0x1F'. */
export function valueFromString(str: string, width?: number): LogicValue {
  const trimmed = str.trim().toUpperCase();
  if (trimmed.startsWith('0X')) {
    const parsed = parseInt(trimmed.slice(2), 16);
    const w = width ?? Math.max(1, (trimmed.length - 2) * 4);
    return Number.isNaN(parsed) ? floatingValue(w) : valueFromInt(parsed, w);
  }
  const clean = trimmed.replace(/[^01ZEUX]/g, '');
  if (clean.length === 0) return floatingValue(width ?? 1);
  // MSB is at index 0 of string; LSB is at end
  const msbFirst: BitState[] = [...clean].map((ch) => {
    if (ch === '0') return '0';
    if (ch === '1') return '1';
    if (ch === 'E') return 'E';
    return 'Z';
  });
  const lsbFirst = msbFirst.reverse();
  const targetWidth = width ?? lsbFirst.length;
  const out: BitState[] = [];
  for (let i = 0; i < targetWidth; i++) {
    out.push(lsbFirst[i] ?? '0');
  }
  return { width: targetWidth, bits: out };
}

/** Convert to unsigned integer if all bits are known ('0' or '1'); otherwise returns null. */
export function valueToInt(val: LogicValue): number | null {
  let acc = 0;
  for (let i = 0; i < val.width; i++) {
    const b = val.bits[i];
    if (b !== '0' && b !== '1') return null;
    if (b === '1') acc = (acc | ((1 << i) >>> 0)) >>> 0;
  }
  return acc >>> 0;
}

/** Convert to signed 2's complement integer if all bits are known ('0' or '1'); otherwise null. */
export function valueToSignedInt(val: LogicValue): number | null {
  const u = valueToInt(val);
  if (u === null) return null;
  if (val.width >= 32) return u | 0;
  const signBit = 1 << (val.width - 1);
  return (u & signBit) !== 0 ? u - (1 << val.width) : u;
}

/** Format value as MSB-first binary string ('0', '1', '1010', 'E', 'Z'). */
export function valueToBinString(val: LogicValue): string {
  return [...val.bits].reverse().join('');
}

/** Format value for schematic badge readout (1-bit: '0'/'1'/'Z'/'E'; multi-bit: hex or binary). */
export function valueToDisplayString(val: LogicValue): string {
  if (val.width === 1) return val.bits[0];
  if (val.bits.some((b) => b === 'E')) return 'E';
  if (val.bits.every((b) => b === 'Z')) return 'Z';
  const n = valueToInt(val);
  if (n !== null) {
    const hexDigits = Math.ceil(val.width / 4);
    return '0x' + n.toString(16).toUpperCase().padStart(hexDigits, '0');
  }
  return valueToBinString(val);
}

export function valuesEqual(a: LogicValue | undefined, b: LogicValue | undefined): boolean {
  if (!a || !b) return a === b;
  if (a.width !== b.width) return false;
  for (let i = 0; i < a.width; i++) {
    if (a.bits[i] !== b.bits[i]) return false;
  }
  return true;
}

export function hasErrorBit(val: LogicValue): boolean {
  return val.bits.includes('E');
}

export function isFullyFloating(val: LogicValue): boolean {
  return val.bits.every((b) => b === 'Z');
}

export function isFullyDefined(val: LogicValue): boolean {
  return val.bits.every((b) => b === '0' || b === '1');
}

/**
 * Resolve multiple drivers connected to the same wire net.
 * - 'Z' (floating) does not drive the wire.
 * - Driving both '0' and '1' on the same bit causes a short-circuit conflict 'E'.
 * - Any 'E' driver propagates 'E'.
 * - Width mismatch across drivers produces an 'E' bus.
 */
export function resolveBusDrivers(drivers: readonly LogicValue[], defaultWidth = 1): LogicValue {
  if (drivers.length === 0) return floatingValue(defaultWidth);
  const w = drivers[0].width;
  if (drivers.some((d) => d.width !== w)) {
    return errorValue(Math.max(defaultWidth, ...drivers.map((d) => d.width)));
  }
  const bits: BitState[] = new Array<BitState>(w).fill('Z');
  for (let i = 0; i < w; i++) {
    let cur: BitState = 'Z';
    for (const d of drivers) {
      const b = d.bits[i];
      if (b === 'Z') continue;
      if (b === 'E') {
        cur = 'E';
        break;
      }
      if (cur === 'Z') {
        cur = b;
      } else if (cur !== b) {
        cur = 'E';
        break;
      }
    }
    bits[i] = cur;
  }
  return { width: w, bits };
}

export function bitNot(b: BitState): BitState {
  if (b === '0') return '1';
  if (b === '1') return '0';
  return 'E';
}

export function bitAnd(a: BitState, b: BitState): BitState {
  if (a === '0' || b === '0') return '0';
  if (a === '1' && b === '1') return '1';
  return 'E';
}

export function bitOr(a: BitState, b: BitState): BitState {
  if (a === '1' || b === '1') return '1';
  if (a === '0' && b === '0') return '0';
  return 'E';
}

export function bitXor(a: BitState, b: BitState): BitState {
  if (a === 'E' || b === 'E' || a === 'Z' || b === 'Z') return 'E';
  return a === b ? '0' : '1';
}

/**
 * Evaluate a multi-input bitwise gate across `inputs` (ignoring unconnected 'Z' inputs when >=2 other inputs exist,
 * matching Logisim 2.7.1 gate behavior where unconnected extra inputs on a multi-input gate are ignored,
 * whereas if ALL inputs are 'Z', the output is 'E' / floating).
 */
export function evaluateGateBits(
  kind: 'NOT' | 'BUF' | 'AND' | 'NAND' | 'OR' | 'NOR' | 'XOR' | 'XNOR' | 'ODD' | 'EVEN',
  inputs: readonly LogicValue[],
  width = 1,
): LogicValue {
  if (kind === 'NOT' || kind === 'BUF') {
    const a = inputs[0] ?? floatingValue(width);
    const bits: BitState[] = [];
    for (let i = 0; i < width; i++) {
      const bit = a.bits[i] ?? 'Z';
      if (bit === 'Z' || bit === 'E') bits.push('E');
      else bits.push(kind === 'NOT' ? bitNot(bit) : bit);
    }
    return { width, bits };
  }

  const bits: BitState[] = [];
  for (let i = 0; i < width; i++) {
    const active = inputs.map((v) => v.bits[i] ?? 'Z').filter((b) => b !== 'Z');
    if (active.length === 0) {
      bits.push('E');
      continue;
    }
    if (kind === 'AND' || kind === 'NAND') {
      let res: BitState = '1';
      for (const b of active) {
        if (b === '0') {
          res = '0';
          break;
        }
        if (b === 'E') res = 'E';
      }
      bits.push(kind === 'NAND' && res !== 'E' ? bitNot(res) : res);
    } else if (kind === 'OR' || kind === 'NOR') {
      let res: BitState = '0';
      for (const b of active) {
        if (b === '1') {
          res = '1';
          break;
        }
        if (b === 'E') res = 'E';
      }
      bits.push(kind === 'NOR' && res !== 'E' ? bitNot(res) : res);
    } else {
      // XOR, XNOR, ODD, EVEN
      if (active.some((b) => b === 'E')) {
        bits.push('E');
      } else {
        const ones = active.filter((b) => b === '1').length;
        const odd = ones % 2 === 1;
        const outBit: BitState =
          kind === 'XOR' || kind === 'ODD' ? (odd ? '1' : '0') : odd ? '0' : '1';
        bits.push(outBit);
      }
    }
  }
  return { width, bits };
}
