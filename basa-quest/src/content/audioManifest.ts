// Lists every audio file the game will look for, with the text to record.
// Used by `npm run audio:list`. Not loaded by the app.
import { extraAudioId } from '../lib/audio';
import type { Band, Bi, Lang, Level, Line } from '../types';
import { isBanded, levels, pick } from './index';

export interface AudioFile {
  path: string;
  text: string;
}

const LANGS: Lang[] = ['fil', 'en'];
const BANDS: Band[] = ['A', 'B'];

export function audioManifest(list: Level[] = levels): AudioFile[] {
  const out: AudioFile[] = [];
  for (const lv of list) {
    const shared = (lang: Lang, id: string) => `public/audio/${lang}/level-${lv.level}/${id}.mp3`;
    const banded = (lang: Lang, band: Band, id: string) => `public/audio/${lang}/level-${lv.level}/band-${band.toLowerCase()}/${id}.mp3`;
    const line = (l: Line) => {
      for (const lang of LANGS) {
        if (isBanded(l.text)) for (const b of BANDS) out.push({ path: banded(lang, b, l.id), text: pick(l.text, b)[lang] });
        else out.push({ path: shared(lang, l.id), text: l.text[lang] });
      }
    };
    const extra = (id: string, text: Bi) => LANGS.forEach((lang) => out.push({ path: shared(lang, id), text: text[lang] }));
    const hints = (sceneId: string, hints: Record<string, Bi>, round?: number) =>
      Object.entries(hints).forEach(([k, v]) => extra(extraAudioId(sceneId, 'hint', k, round), v));

    for (const sc of lv.scenes) {
      switch (sc.kind) {
        case 'pick':
          sc.rounds.forEach((r, i) => {
            [...r.lines, r.prompt].forEach(line);
            hints(sc.id, r.hints, i);
            extra(extraAudioId(sc.id, 'ok', '', i), r.success);
          });
          break;
        case 'build':
          [...sc.lines, ...sc.steps.map((s) => s.line)].forEach(line);
          sc.steps.forEach((s, i) => extra(extraAudioId(sc.id, 'hint', `step${i + 1}`), s.hint));
          extra(extraAudioId(sc.id, 'ok'), sc.success);
          break;
        case 'proof':
          [...sc.lines, sc.prompt].forEach(line);
          for (const b of BANDS)
            for (const l of sc.passage[b]) for (const lang of LANGS) out.push({ path: banded(lang, b, l.id), text: pick(l.text, b)[lang] });
          hints(sc.id, sc.hints);
          extra(extraAudioId(sc.id, 'ok'), sc.success);
          break;
        case 'order':
          [...sc.lines, sc.prompt, ...sc.events].forEach(line);
          extra(extraAudioId(sc.id, 'hint', 'order'), sc.hint);
          extra(extraAudioId(sc.id, 'ok'), sc.success);
          break;
        case 'word':
          [sc.teach, sc.task.prompt].forEach(line);
          hints(sc.id, sc.task.hints);
          extra(extraAudioId(sc.id, 'ok'), sc.task.success);
          break;
        case 'explain':
          [...sc.lines, sc.explain.prompt].forEach(line);
          break;
        case 'decide':
          [...sc.lines, sc.prompt].forEach(line);
          sc.options.forEach((o) => [...o.reply, o.explain.prompt].forEach(line));
          break;
        case 'payoff':
          [...Object.values(sc.byChoice).flat(), ...sc.lines].forEach(line);
          break;
      }
    }
  }
  return out.map((f) => ({ ...f, text: f.text.replace(/\[\[(.+?)\]\]/g, '$1') }));
}
