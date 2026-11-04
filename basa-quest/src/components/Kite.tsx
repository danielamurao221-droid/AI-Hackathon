// Kite art used on the build board, the payoff and the map.
import type { RibbonColor } from '../types';

export const RIBBON_FILL: Record<RibbonColor, string> = {
  sun: '#f2b33d',
  teal: '#2f9c8a',
  coral: '#e86f51',
  violet: '#a066c9',
};

/** A kite centred at (0,0), about 40 wide and 60 tall. */
export function KiteShape({
  color = '#d94a3a',
  newspaper,
  patch,
  ribbons = [],
}: {
  color?: string;
  newspaper?: boolean;
  patch?: boolean;
  ribbons?: RibbonColor[];
}) {
  const fill = newspaper ? '#e6e2d8' : color;
  return (
    <g>
      <path d="M0 -26 18 -4 0 30 -18 -4Z" fill={fill} stroke="rgba(0,0,0,.15)" strokeWidth="1" />
      {newspaper && (
        <g stroke="#a9a397" strokeWidth="1">
          <path d="M-8 -10h12M-10 -4h18M-8 2h14M-5 8h9" />
        </g>
      )}
      {patch && <path d="M-18 -4 0 -26 0 -4Z" fill="#d94a3a" />}
      <path d="M0 -26v56M-18 -4h36" stroke="#8a5a36" strokeWidth="1.6" />
      <path d="M0 30c-6 8 6 12 0 20s6 12 0 20" stroke="#6b4b2f" strokeWidth="1.4" fill="none" />
      {ribbons.map((r, i) => (
        <path key={i} d={`M0 ${38 + i * 9}l-7 -4v8zM0 ${38 + i * 9}l7 -4v8z`} fill={RIBBON_FILL[r]} />
      ))}
    </g>
  );
}

export function Ribbon({ color, size = 22 }: { color: RibbonColor; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 12 3 6v12zM12 12l9-6v12z" fill={RIBBON_FILL[color]} />
      <circle cx="12" cy="12" r="3" fill={RIBBON_FILL[color]} stroke="rgba(0,0,0,.2)" />
    </svg>
  );
}
