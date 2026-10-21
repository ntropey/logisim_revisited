import { describe, expect, it } from 'vitest';
import { PRESET_CIRCUITS } from '@logisim/core';
import { decodeCircuitHash, encodeCircuitUrl, isCircuit } from '../src/lib/share';

describe('share links', () => {
  it('round-trips every preset circuit through the URL hash', () => {
    for (const p of PRESET_CIRCUITS) {
      const url = encodeCircuitUrl(p.circuit, 'https://example.test/play/');
      expect(decodeCircuitHash(new URL(url).hash)).toEqual(p.circuit);
    }
  });

  it('survives non-ASCII circuit names', () => {
    const c = { name: 'Dëmo ⊕ 回路', components: [], wires: [] };
    expect(decodeCircuitHash(new URL(encodeCircuitUrl(c, 'https://example.test/')).hash)).toEqual(c);
  });

  it('rejects garbage', () => {
    expect(decodeCircuitHash('#c=!!!')).toBeNull();
    expect(decodeCircuitHash('#c=e30')).toBeNull(); // {} is not a circuit
    expect(decodeCircuitHash('')).toBeNull();
    expect(isCircuit({ name: 1 })).toBe(false);
  });
});
