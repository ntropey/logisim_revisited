/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * Settings and privacy. The app itself loads no ads or trackers; the only storage is local to this browser.
 */
import { CIRCUIT_KEY, removeKey, SETTINGS_KEY } from '../lib/storage';
import type { Settings } from '../state/useSettings';
import { Sheet } from './Sheet';

interface Props {
  settings: Settings;
  onChange(patch: Partial<Settings>): void;
  onClose(): void;
}

export function SettingsSheet({ settings, onChange, onClose }: Props) {
  return (
    <Sheet title="Settings" onClose={onClose}>
      <div className="field">
        <label className="label" htmlFor="theme">
          Theme
        </label>
        <select id="theme" className="select" value={settings.theme} onChange={(e) => onChange({ theme: e.target.value as Settings['theme'] })}>
          <option value="system">Match my device</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
      <label className="check">
        <input type="checkbox" checked={settings.showGrid} onChange={(e) => onChange({ showGrid: e.target.checked })} /> Show grid dots
      </label>
      <label className="check">
        <input type="checkbox" checked={settings.showValues} onChange={(e) => onChange({ showValues: e.target.checked })} /> Show values on pins and probes
      </label>
      <h3>Privacy</h3>
      <p className="muted">
        Your circuit and these settings are stored only in this browser. The simulator runs on your device and sends nothing anywhere. This app loads no
        ads; see the <a href="../privacy.html">privacy page</a> for the website.
      </p>
      <button
        className="btn alt"
        onClick={() => {
          if (confirm('Delete the saved circuit and settings from this browser?')) {
            removeKey(CIRCUIT_KEY);
            removeKey(SETTINGS_KEY);
            location.reload();
          }
        }}
      >
        Clear saved data
      </button>
      <h3>Shortcuts</h3>
      <ul className="keys">
        <li><kbd>V</kbd> select · <kbd>P</kbd> poke · <kbd>W</kbd> wire</li>
        <li><kbd>Space</kbd> hold to poke · <kbd>R</kbd> rotate · <kbd>Del</kbd> delete</li>
        <li><kbd>Ctrl</kbd>+<kbd>Z</kbd> undo · <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd> redo · <kbd>Esc</kbd> cancel</li>
      </ul>
    </Sheet>
  );
}
