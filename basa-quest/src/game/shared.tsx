// Helpers shared by all scene components.
import { useEffect } from 'react';
import { seeLines } from '../lib/store';
import type { Line } from '../types';

/** What every scene component receives from the level runner. */
export interface SceneCtx {
  level: number;
  /** Call once when the scene is solved. `attempts` = wrong tries (each showed a hint). */
  onSolved: (attempts: number) => void;
  solved: boolean;
}

/** Remember lines the child has been shown, for "Balikan ang kuwento". */
export function useSeen(level: number, lines: Line[]) {
  const key = lines.map((l) => l.id).join('|');
  useEffect(() => {
    seeLines(level, lines.map((l) => l.id));
  }, [level, key]);
}

/** Deterministic shuffle so the same scene always looks the same (no randomness for children). */
export function stableShuffle<T>(items: T[], seed: string): T[] {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) | 0;
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) | 0;
    const j = Math.abs(h) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  // Never show the correct order as-is.
  if (out.every((x, i) => x === items[i]) && out.length > 1) out.push(out.shift()!);
  return out;
}
