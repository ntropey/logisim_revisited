/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * User preferences, persisted in localStorage and applied to <html> as data attributes.
 */
import { useCallback, useEffect, useState } from 'react';
import { loadJson, saveJson, SETTINGS_KEY } from '../lib/storage';

export interface Settings {
  theme: 'system' | 'light' | 'dark';
  showGrid: boolean;
  showValues: boolean;
}

const DEFAULTS: Settings = { theme: 'system', showGrid: true, showValues: true };

export function useSettings() {
  const [settings, setState] = useState<Settings>(() => ({ ...DEFAULTS, ...loadJson<Partial<Settings>>(SETTINGS_KEY) }));

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', settings.theme);
    saveJson(SETTINGS_KEY, settings);
  }, [settings]);

  const update = useCallback((patch: Partial<Settings>) => setState((s) => ({ ...s, ...patch })), []);
  return { settings, update };
}
