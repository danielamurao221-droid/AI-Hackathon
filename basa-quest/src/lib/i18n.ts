import type { Bi, Lang } from '../types';
import { useAppState } from './store';

/** Fill {placeholders} in a string. */
export function fmt(text: string, vars: Record<string, string | number> = {}): string {
  return text.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''));
}

/** Returns a translate function for the current language. */
export function useT(): { lang: Lang; t: (b: Bi, vars?: Record<string, string | number>) => string } {
  const { lang } = useAppState();
  return { lang, t: (b, vars) => fmt(b[lang], vars) };
}
