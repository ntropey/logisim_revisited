/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * Component palette: searchable, grouped by Logisim library.
 */
import { useState } from 'react';
import { CATEGORIES, PALETTE, type PaletteItem, type Tool } from '../canvas/tools';

interface Props {
  tool: Tool;
  onPick(item: PaletteItem): void;
}

export function Palette({ tool, onPick }: Props) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const active = tool.kind === 'place' ? tool.item.key : null;
  return (
    <div className="palette">
      <input className="input" type="search" placeholder="Search parts" aria-label="Search parts" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="palette-scroll scrollbar-thin">
        {CATEGORIES.map((cat) => {
          const items = PALETTE.filter((i) => i.category === cat && (!q || i.name.toLowerCase().includes(q) || i.type.toLowerCase().includes(q)));
          if (!items.length) return null;
          return (
            <section key={cat}>
              <h3>{cat}</h3>
              <div className="palette-grid">
                {items.map((i) => (
                  <button key={i.key} className={`part${active === i.key ? ' active' : ''}`} title={i.description} onClick={() => onPick(i)}>
                    {i.name}
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
