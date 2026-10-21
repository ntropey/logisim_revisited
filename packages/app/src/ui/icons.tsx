/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * Small stroke icon set (24px grid, currentColor).
 */
const PATHS = {
  select: 'M5 3l14 7-6 2-2 6z',
  poke: 'M9 11V5a2 2 0 014 0v5m0 0V8a2 2 0 014 0v4m0 0a2 2 0 014 0v3a6 6 0 01-6 6h-1a6 6 0 01-5-3l-3-5a2 2 0 013-2l2 2',
  wire: 'M4 18h6V6h10M4 18a1.5 1.5 0 100 .01M20 6a1.5 1.5 0 100 .01',
  undo: 'M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3',
  redo: 'M15 14l5-5-5-5M20 9H10a6 6 0 000 12h3',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  rotate: 'M20 11a8 8 0 10-2.3 6.3M20 4v7h-7',
  tick: 'M12 7v5l3 2M12 3a9 9 0 100 18 9 9 0 000-18z',
  fit: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  parts: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM17 13v7M13.5 16.5h7',
  menu: 'M4 7h16M4 12h16M4 17h16',
  open: 'M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  upload: 'M12 16V5M7 10l5-5 5 5M5 20h14',
  share: 'M8 12l8-5M8 12l8 5M6 9a3 3 0 100 6 3 3 0 000-6zM18 4a3 3 0 100 6 3 3 0 000-6zM18 14a3 3 0 100 6 3 3 0 000-6z',
  gear: 'M12 9a3 3 0 100 6 3 3 0 000-6zM19 12a7 7 0 00-.1-1.3l2-1.5-2-3.4-2.3 1a7 7 0 00-2.2-1.3L14 3h-4l-.4 2.5A7 7 0 007.4 6.8l-2.3-1-2 3.4 2 1.5A7 7 0 005 12c0 .4 0 .9.1 1.3l-2 1.5 2 3.4 2.3-1a7 7 0 002.2 1.3L10 21h4l.4-2.5a7 7 0 002.2-1.3l2.3 1 2-3.4-2-1.5c.1-.4.1-.9.1-1.3z',
  chart: 'M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6',
  trophy: 'M8 4h8v5a4 4 0 01-8 0zM8 6H4v1a3 3 0 003 3M16 6h4v1a3 3 0 01-3 3M12 13v4M8 20h8M10 17h4',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 00-4 10.5c.7.7 1 1.4 1 2.5h6c0-1.1.3-1.8 1-2.5A6 6 0 0012 3z',
  info: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 11v5M12 8v.01',
  close: 'M6 6l12 12M18 6L6 18',
  check: 'M5 12l5 5 9-10',
  chevron: 'M9 6l6 6-6 6',
  play: 'M7 4l13 8-13 8z',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}
