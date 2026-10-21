/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * localStorage wrappers that never throw (private windows and blocked storage are normal).
 */

export function loadJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be full or unavailable; the app keeps working without persistence.
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export const CIRCUIT_KEY = 'logisim-circuit';
export const SETTINGS_KEY = 'logisim-settings';
