// Kite ribbons (reward cards).
import type { RibbonColor } from '../types';

export const RIBBON_FILL: Record<RibbonColor, string> = {
  sun: '#f2b33d',
  teal: '#2f9c8a',
  coral: '#e86f51',
  violet: '#a066c9',
};

export function Ribbon({ color, size = 22 }: { color: RibbonColor; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 12 3 6v12zM12 12l9-6v12z" fill={RIBBON_FILL[color]} />
      <circle cx="12" cy="12" r="3" fill={RIBBON_FILL[color]} stroke="rgba(0,0,0,.2)" />
    </svg>
  );
}
