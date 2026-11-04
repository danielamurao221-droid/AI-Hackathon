// Simple expressive characters drawn with inline SVG. Original designs.
import type { CharId, Mood } from '../types';

const SKIN: Record<CharId, string> = { tala: '#b97a52', nonoy: '#a86c45', lolo: '#9c6a4a', nena: '#b07650', jun: '#8f5d3e', muning: '#f2a65a' };
const SHIRT: Record<CharId, string> = { tala: '#e86f51', nonoy: '#2f9c8a', lolo: '#5b7fd6', nena: '#a066c9', jun: '#f2b33d', muning: '#f2a65a' };

function Eyes({ mood, y = 33 }: { mood: Mood; y?: number }) {
  if (mood === 'happy')
    return (
      <g stroke="#23313a" strokeWidth="2.4" fill="none" strokeLinecap="round">
        <path d={`M22 ${y + 1}q3-4 6 0`} />
        <path d={`M36 ${y + 1}q3-4 6 0`} />
      </g>
    );
  if (mood === 'wow')
    return (
      <g fill="#23313a">
        <circle cx="25" cy={y} r="3.2" />
        <circle cx="39" cy={y} r="3.2" />
        <circle cx="26" cy={y - 1} r="1" fill="#fff" />
        <circle cx="40" cy={y - 1} r="1" fill="#fff" />
      </g>
    );
  return (
    <g fill="#23313a">
      <circle cx="25" cy={y} r="2.3" />
      <circle cx="39" cy={y} r="2.3" />
    </g>
  );
}

function Brows({ mood }: { mood: Mood }) {
  const d =
    mood === 'sad'
      ? 'M21 27l7 -2M43 27l-7 -2'
      : mood === 'think'
        ? 'M21 26.5h7M36 24l7 1.5'
        : mood === 'wow'
          ? 'M21 24.5q3.5-2 7 0M36 24.5q3.5-2 7 0'
          : 'M21 26q3.5-1.5 7 0M36 26q3.5-1.5 7 0';
  return <path d={d} stroke="#3a2a20" strokeWidth="2" fill="none" strokeLinecap="round" />;
}

function Mouth({ mood }: { mood: Mood }) {
  switch (mood) {
    case 'happy':
      return <path d="M25 41q7 7 14 0z" fill="#7a2e22" />;
    case 'sad':
      return <path d="M26 44q6-5 12 0" stroke="#7a2e22" strokeWidth="2.4" fill="none" strokeLinecap="round" />;
    case 'wow':
      return <ellipse cx="32" cy="42.5" rx="3.6" ry="4.4" fill="#7a2e22" />;
    case 'think':
      return <path d="M27 42.5q4 1.8 9-1" stroke="#7a2e22" strokeWidth="2.4" fill="none" strokeLinecap="round" />;
  }
}

function Cat({ size, mood }: { size: number; mood: Mood }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={`char char-muning mood-${mood}`} aria-hidden="true" focusable="false">
      <circle cx="32" cy="32" r="31" fill="var(--char-bg)" />
      <path d="M14 22 16 6l12 10M50 22 48 6 36 16" fill="#f2a65a" />
      <circle cx="32" cy="36" r="19" fill="#f2a65a" />
      <path d="M26 20h2v8h-2zM36 20h2v8h-2z" fill="#d98a3a" />
      {mood === 'happy' ? (
        <g stroke="#23313a" strokeWidth="2.4" fill="none" strokeLinecap="round">
          <path d="M21 35q3-4 6 0M37 35q3-4 6 0" />
        </g>
      ) : (
        <g fill="#23313a">
          <circle cx="24" cy="34" r="2.6" />
          <circle cx="40" cy="34" r="2.6" />
        </g>
      )}
      <path d="M30 41l2 2 2-2z" fill="#e86f51" />
      <path d="M14 40h9M14 45l9-2M50 40h-9M50 45l-9-2" stroke="#7a4a20" strokeWidth="1.4" />
    </svg>
  );
}

export function Character({ who, mood = 'happy', size = 56 }: { who: CharId; mood?: Mood; size?: number }) {
  if (who === 'muning') return <Cat size={size} mood={mood} />;
  const skin = SKIN[who];
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={`char char-${who} mood-${mood}`} aria-hidden="true" focusable="false">
      <circle cx="32" cy="32" r="31" fill="var(--char-bg)" />
      {/* shoulders */}
      <path d="M12 64c1-10 9-14 20-14s19 4 20 14z" fill={SHIRT[who]} />
      {/* hair behind */}
      {who === 'tala' && <path d="M47 26c8 4 9 16 3 22-1-8-3-13-6-16z" fill="#2b1d16" />}
      {/* head */}
      <circle cx="32" cy="33" r="17" fill={skin} />
      <circle cx="15.5" cy="35" r="3" fill={skin} />
      <circle cx="48.5" cy="35" r="3" fill={skin} />
      {/* hair */}
      {who === 'tala' && (
        <>
          <path d="M15 31c0-11 8-17 17-17s17 6 17 16c-6-1-12-4-15-9-3 5-10 9-19 10z" fill="#2b1d16" />
          <circle cx="45" cy="21" r="3.4" fill="#f2b33d" />
        </>
      )}
      {who === 'nonoy' && <path d="M16 29c0-9 7-14 16-14s16 5 16 14c-4-3-9-5-16-5s-12 2-16 5z" fill="#1f1712" />}
      {who === 'nena' && (
        <>
          <path d="M15 32c0-11 8-17 17-17s17 6 17 17c-3-5-9-9-17-9s-14 4-17 9z" fill="#2b1d16" />
          <circle cx="32" cy="13" r="6" fill="#2b1d16" />
        </>
      )}
      {who === 'jun' && (
        <>
          <path d="M14 27c1-9 8-14 18-14s17 5 18 14z" fill="#2f7a4a" />
          <path d="M28 25h26v4H28z" fill="#2f7a4a" />
        </>
      )}
      {who === 'lolo' && (
        <>
          <path d="M15 34c-1-6 1-11 4-13 1 4 1 8 0 13zM49 34c1-6-1-11-4-13-1 4-1 8 0 13z" fill="#d9d4cc" />
          <path d="M22 18c5-4 15-4 20 0-6-1-14-1-20 0z" fill="#d9d4cc" />
          <g stroke="#3a2a20" strokeWidth="1.6" fill="none">
            <circle cx="25" cy="33" r="5" />
            <circle cx="39" cy="33" r="5" />
            <path d="M30 33h4" />
          </g>
          <path d="M25 39.5q7-3 14 0q-7 2.5-14 0z" fill="#d9d4cc" />
        </>
      )}
      <Brows mood={mood} />
      <Eyes mood={mood} />
      <Mouth mood={mood} />
      <circle cx="20" cy="39" r="2.4" fill="#e86f51" opacity=".25" />
      <circle cx="44" cy="39" r="2.4" fill="#e86f51" opacity=".25" />
    </svg>
  );
}
