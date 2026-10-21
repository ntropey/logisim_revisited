/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * Shareable circuit links: the circuit is encoded into the URL hash, so nothing is uploaded anywhere.
 */
import type { Circuit } from '@logisim/core';

const toBase64Url = (s: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(s)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const fromBase64Url = (s: string) => {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};

export function encodeCircuitUrl(circuit: Circuit, base = location.href.split(/[?#]/)[0]): string {
  return `${base}#c=${toBase64Url(JSON.stringify(circuit))}`;
}

export function decodeCircuitHash(hash: string): Circuit | null {
  const m = /^#?c=([A-Za-z0-9_-]+)$/.exec(hash);
  if (!m) return null;
  try {
    const c = JSON.parse(fromBase64Url(m[1]));
    return isCircuit(c) ? c : null;
  } catch {
    return null;
  }
}

export function isCircuit(c: unknown): c is Circuit {
  const x = c as Circuit;
  return !!x && typeof x.name === 'string' && Array.isArray(x.components) && Array.isArray(x.wires);
}
