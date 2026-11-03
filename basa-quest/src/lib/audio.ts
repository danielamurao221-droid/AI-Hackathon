// Recorded narration. Files are optional: drop them into public/audio using the
// pattern below and they start playing. No code change is needed.
//
//   public/audio/fil/level-1/band-a/page-1.mp3
//   public/audio/en/level-1/band-b/page-3.mp3
//   public/audio/fil/level-2/question-1.mp3   (questions 1-5, shared by both bands)
import { AUDIO_BASE, AUDIO_EXT } from '../config';
import type { Band, Lang } from '../types';

export function pageAudio(lang: Lang, level: number, band: Band, page: number): string {
  return `${AUDIO_BASE}/${lang}/level-${level}/band-${band.toLowerCase()}/page-${page}.${AUDIO_EXT}`;
}

export function questionAudio(lang: Lang, level: number, q: number): string {
  return `${AUDIO_BASE}/${lang}/level-${level}/question-${q}.${AUDIO_EXT}`;
}

/** Files we already know are missing, so we don't keep asking for them. */
export const missingAudio = new Set<string>();
