// Lists every audio file the game will look for, with the text to record.
// Used by `npm run audio:list`. Not loaded by the app.
import type { Band, Lang } from '../types';
import { allLines } from './adventure';
import { isBanded, pick } from './index';

export interface AudioFile {
  path: string;
  text: string;
  lang: Lang;
  /** Who says the line (empty for narration), so the generator can pick a fitting voice. */
  who: string;
}

const LANGS: Lang[] = ['fil', 'en'];
const BANDS: Band[] = ['A', 'B'];

export function audioManifest(): AudioFile[] {
  const out: AudioFile[] = [];
  for (const l of Object.values(allLines)) {
    for (const lang of LANGS) {
      if (isBanded(l.text)) {
        for (const b of BANDS)
          out.push({ path: `public/audio/${lang}/level-1/band-${b.toLowerCase()}/${l.id}.mp3`, text: pick(l.text, b)[lang], lang, who: l.who ?? '' });
      } else out.push({ path: `public/audio/${lang}/level-1/${l.id}.mp3`, text: l.text[lang], lang, who: l.who ?? '' });
    }
  }
  return out.map((f) => ({ ...f, text: f.text.replace(/\[\[(.+?)\]\]/g, '$1') }));
}
