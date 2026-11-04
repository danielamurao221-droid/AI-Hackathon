// Helpers that read content.
import type { Band, BText, Bi, Lang } from '../types';

export { allLines, words as allWords } from './adventure';

export function isBanded(t: BText): t is { A: Bi; B: Bi } {
  return 'A' in t;
}

export function pick(t: BText, band: Band): Bi {
  return isBanded(t) ? t[band] : t;
}

export function textOf(t: BText, band: Band, lang: Lang): string {
  return pick(t, band)[lang];
}
