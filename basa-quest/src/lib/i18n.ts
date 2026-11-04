import { textOf } from '../content';
import type { BText, Band, Bi, Lang } from '../types';
import { bandFor, useAppState } from './store';

/** Fill {placeholders} in a string. */
export function fmt(text: string, vars: Record<string, string | number> = {}): string {
  return text.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''));
}

/** Current language and band, plus helpers to turn content into strings. */
export function useT(): {
  lang: Lang;
  band: Band;
  t: (b: Bi, vars?: Record<string, string | number>) => string;
  tx: (b: BText) => string;
} {
  const s = useAppState();
  const band = s.learnerId ? bandFor(s, s.learnerId) : 'A';
  return {
    lang: s.lang,
    band,
    t: (b, vars) => fmt(b[s.lang], vars),
    tx: (b) => textOf(b, band, s.lang),
  };
}
