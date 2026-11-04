// Recorded narration. Files are optional: drop them into public/audio using the
// pattern below and they start playing. No code change is needed.
//
//   Text that differs by band:  public/audio/{fil|en}/level-{n}/band-{a|b}/{id}.mp3
//   Text shared by both bands:  public/audio/{fil|en}/level-{n}/{id}.mp3
//
// `id` is the Line id in the content file (e.g. "supplies-1"), or for hints and
// success messages: "{sceneId}-hint-{key}", "{sceneId}-ok" (see `extraAudioId`).
// Run `npm run audio:list` to print every expected file name.
import { AUDIO_BASE, AUDIO_EXT } from '../config';
import { isBanded } from '../content';
import type { Band, Lang, Line } from '../types';

export function bandAudio(lang: Lang, level: number, band: Band, id: string): string {
  return `${AUDIO_BASE}/${lang}/level-${level}/band-${band.toLowerCase()}/${id}.${AUDIO_EXT}`;
}

export function sharedAudio(lang: Lang, level: number, id: string): string {
  return `${AUDIO_BASE}/${lang}/level-${level}/${id}.${AUDIO_EXT}`;
}

/** Audio for a Line. `inBandFolder` forces the band folder (used for proof passages). */
export function lineAudio(line: Line, lang: Lang, level: number, band: Band, inBandFolder = false): string {
  return inBandFolder || isBanded(line.text) ? bandAudio(lang, level, band, line.id) : sharedAudio(lang, level, line.id);
}

/** Ids for hint and success messages, which are shared by both bands. */
export function extraAudioId(sceneId: string, kind: 'hint' | 'ok', key = '', round?: number): string {
  const r = round !== undefined && round > 0 ? `-r${round + 1}` : '';
  return kind === 'ok' ? `${sceneId}${r}-ok` : `${sceneId}${r}-hint-${key}`;
}

/** Files we already know are missing, so we don't keep asking for them. */
export const missingAudio = new Set<string>();
