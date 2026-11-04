// Registry of playable levels and helpers that read content.
import type { Band, BText, Bi, Lang, Level, Line, Scene, WordEntry } from '../types';
import { level1 } from './level1';

export const levels: Level[] = [level1];

export function getLevel(n: number): Level | undefined {
  return levels.find((l) => l.level === n);
}

/** Every word a level teaches, for the Word Notebook. */
export const allWords: WordEntry[] = levels.flatMap((l) =>
  l.scenes.flatMap((s) => (s.kind === 'word' ? [s.word] : [])),
);

export function isBanded(t: BText): t is { A: Bi; B: Bi } {
  return 'A' in t;
}

export function pick(t: BText, band: Band): Bi {
  return isBanded(t) ? t[band] : t;
}

export function textOf(t: BText, band: Band, lang: Lang): string {
  return pick(t, band)[lang];
}

/** Scene ids that earn a ribbon, in order. */
export function ribbonScenes(level: Level): Scene[] {
  return level.scenes.filter((s) => !!s.ribbon);
}

/** All readable lines of a scene, in the order a child meets them (used for "story so far"). */
export function sceneLines(scene: Scene, band: Band): Line[] {
  switch (scene.kind) {
    case 'pick':
      return scene.rounds.flatMap((r) => [...r.lines, r.prompt]);
    case 'build':
      return [...scene.lines, ...scene.steps.map((s) => s.line)];
    case 'proof':
      return [...scene.lines, ...scene.passage[band]];
    case 'order':
      return [...scene.lines, scene.prompt];
    case 'word':
      return [scene.teach, scene.task.prompt];
    case 'explain':
      return [...scene.lines, scene.explain.prompt];
    case 'decide':
      return [...scene.lines, ...scene.options.flatMap((o) => o.reply)];
    case 'payoff':
      return [...Object.values(scene.byChoice).flat(), ...scene.lines];
  }
}
