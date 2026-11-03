// Simple inline SVG icons and pictures. Original artwork, no external files.
import type { ReactNode } from 'react';
import type { PicId } from '../types';

type P = { size?: number; className?: string };

const svg = (size: number, className: string | undefined, children: ReactNode, vb = '0 0 24 24') => (
  <svg width={size} height={size} viewBox={vb} className={className} aria-hidden="true" focusable="false">
    {children}
  </svg>
);

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export const IconBack = ({ size = 24, className }: P) => svg(size, className, <path d="M15 5l-7 7 7 7" {...stroke} />);
export const IconNext = ({ size = 24, className }: P) => svg(size, className, <path d="M9 5l7 7-7 7" {...stroke} />);
export const IconCheck = ({ size = 24, className }: P) => svg(size, className, <path d="M5 12.5l4.5 4.5L19 7.5" {...stroke} />);
export const IconLock = ({ size = 24, className }: P) =>
  svg(size, className, <>
    <rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="currentColor" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" {...stroke} />
  </>);
export const IconStar = ({ size = 24, className, filled = true }: P & { filled?: boolean }) =>
  svg(size, className,
    <path
      d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"
      fill={filled ? '#f2b33d' : 'none'}
      stroke={filled ? '#d99a1e' : 'currentColor'}
      strokeWidth="1.6"
      strokeLinejoin="round"
    />);
export const IconTrophy = ({ size = 24, className }: P) =>
  svg(size, className, <>
    <path d="M7 3h10v5a5 5 0 0 1-10 0z" fill="#f2b33d" stroke="#c98b2b" strokeWidth="1.4" />
    <path d="M7 5H4a3 3 0 0 0 3 4M17 5h3a3 3 0 0 1-3 4" fill="none" stroke="#c98b2b" strokeWidth="1.6" />
    <rect x="10.5" y="12.5" width="3" height="4" fill="#c98b2b" />
    <rect x="7.5" y="16.5" width="9" height="3.5" rx="1" fill="#f2b33d" stroke="#c98b2b" strokeWidth="1.4" />
  </>);
export const IconSpeaker = ({ size = 24, className }: P) =>
  svg(size, className, <>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
    <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" {...stroke} />
  </>);
export const IconMic = ({ size = 24, className }: P) =>
  svg(size, className, <>
    <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
    <path d="M6 11a6 6 0 0 0 12 0M12 17v4M8.5 21h7" {...stroke} />
  </>);
export const IconStop = ({ size = 24, className }: P) => svg(size, className, <rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor" />);
export const IconPlay = ({ size = 24, className }: P) => svg(size, className, <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />);
export const IconPeople = ({ size = 24, className }: P) =>
  svg(size, className, <>
    <circle cx="8.5" cy="8" r="3.2" fill="currentColor" />
    <circle cx="16" cy="9" r="2.7" fill="currentColor" opacity=".7" />
    <path d="M2.5 20a6 6 0 0 1 12 0zM13 20a5 5 0 0 1 9 0z" fill="currentColor" />
  </>);
export const IconBook = ({ size = 24, className }: P) =>
  svg(size, className, <path d="M3 5.5c3-1.5 6-1.5 9 .5v14c-3-2-6-2-9-.5zM21 5.5c-3-1.5-6-1.5-9 .5v14c3-2 6-2 9-.5z" fill="currentColor" />);
export const IconSearch = ({ size = 24, className }: P) =>
  svg(size, className, <><circle cx="10.5" cy="10.5" r="6" {...stroke} /><path d="M15 15l5 5" {...stroke} /></>);
export const IconSliders = ({ size = 24, className }: P) =>
  svg(size, className, <>
    <path d="M4 7h10M18 7h2M4 17h4M12 17h8" {...stroke} />
    <circle cx="16" cy="7" r="2.2" {...stroke} />
    <circle cx="10" cy="17" r="2.2" {...stroke} />
  </>);
export const IconClose = ({ size = 24, className }: P) => svg(size, className, <path d="M6 6l12 12M18 6L6 18" {...stroke} />);

/** Picture-password pictures. Drawn on a 64×64 grid. */
export function Picture({ id, size = 56 }: { id: PicId; size?: number }) {
  const body = (() => {
    switch (id) {
      case 'mango':
        return <>
          <path d="M20 20c10-8 30-4 32 14 2 16-14 24-26 20S8 30 20 20z" fill="#f6b73c" />
          <path d="M44 22c4 4 6 10 4 18" stroke="#e8902a" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M30 16c2-6 8-9 14-8-2 6-8 9-14 8z" fill="#3fa36b" />
        </>;
      case 'cat':
        return <>
          <path d="M14 26 12 8l14 10M50 26l2-18-14 10" fill="#8a8f98" />
          <circle cx="32" cy="36" r="20" fill="#9aa0a8" />
          <circle cx="24" cy="33" r="3" fill="#23313a" />
          <circle cx="40" cy="33" r="3" fill="#23313a" />
          <path d="M29 41l3 3 3-3z" fill="#e86f51" />
          <path d="M14 40h10M14 45l10-2M50 40H40M50 45l-10-2" stroke="#23313a" strokeWidth="1.6" />
        </>;
      case 'sun':
        return <>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <rect key={a} x="30" y="4" width="4" height="12" rx="2" fill="#f2b33d" transform={`rotate(${a} 32 32)`} />
          ))}
          <circle cx="32" cy="32" r="13" fill="#f6c445" />
        </>;
      case 'fish':
        return <>
          <path d="M8 32c8-14 30-16 40 0-10 16-32 14-40 0z" fill="#5b9bd6" />
          <path d="M46 32l12-10v20z" fill="#3f7fbf" />
          <circle cx="20" cy="29" r="3" fill="#fff" />
          <circle cx="20" cy="29" r="1.5" fill="#23313a" />
        </>;
      case 'star':
        return <path d="M32 6l7.5 16 17.5 2-13 12 3.5 17.5L32 45l-15.5 8.5L20 36 7 24l17.5-2z" fill="#f2b33d" stroke="#d99a1e" strokeWidth="2" strokeLinejoin="round" />;
      case 'boat':
        return <>
          <path d="M8 40h48l-8 12H16z" fill="#c9733a" />
          <path d="M32 8v32" stroke="#6b4b2f" strokeWidth="3" />
          <path d="M34 10l18 26H34z" fill="#fff" stroke="#c9d3da" strokeWidth="1.5" />
          <path d="M30 14 16 36h14z" fill="#e86f51" />
          <path d="M4 56c6-4 10-4 16 0s10 4 16 0 10-4 16 0 8 4 8 4" stroke="#5b9bd6" strokeWidth="3" fill="none" />
        </>;
      case 'flower':
        return <>
          <path d="M32 40v20" stroke="#3fa36b" strokeWidth="4" />
          <path d="M32 52c-6-6-14-4-14-4s6 8 14 4z" fill="#3fa36b" />
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="32" cy="16" rx="8" ry="11" fill="#e98fb0" transform={`rotate(${a} 32 28)`} />
          ))}
          <circle cx="32" cy="28" r="7" fill="#f2b33d" />
        </>;
      case 'tree':
        return <>
          <rect x="28" y="36" width="8" height="22" rx="2" fill="#8a5a36" />
          <circle cx="32" cy="24" r="16" fill="#3fa36b" />
          <circle cx="20" cy="32" r="10" fill="#4cb87a" />
          <circle cx="44" cy="32" r="10" fill="#4cb87a" />
        </>;
      case 'ball':
        return <>
          <circle cx="32" cy="32" r="24" fill="#5b7fd6" />
          <path d="M8 32h48" stroke="#fff" strokeWidth="5" />
          <path d="M32 8c-10 8-10 40 0 48" stroke="#f2b33d" strokeWidth="5" fill="none" />
        </>;
    }
  })();
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      {body}
    </svg>
  );
}
