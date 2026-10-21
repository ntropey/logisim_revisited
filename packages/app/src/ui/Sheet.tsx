/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * Modal dialog that is a centered card on desktop and a bottom sheet on phones.
 */
import { useEffect, type ReactNode } from 'react';
import { Icon } from './icons';

export function Sheet({ title, onClose, children }: { title: string; onClose(): void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="scrim" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </header>
        <div className="sheet-body scrollbar-thin">{children}</div>
      </div>
    </div>
  );
}
