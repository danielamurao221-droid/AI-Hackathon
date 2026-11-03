// Fictional demo class: 30 learners named "Learner 01" to "Learner 30".
// No real names, LRNs, birthdays or photos. IDs use the clearly fake DEMO-0000 format.
// Numbers are generated from a fixed seed, so every visitor sees the same class.
import { SAMPLE_LEARNER_ID } from '../config';
import type { Band, PicId, Skill } from '../types';

export interface DemoLearner {
  id: string; // internal key, e.g. "L07"
  name: string; // "Learner 07"
  demoId: string; // "DEMO-0007"
  band: Band; // decided by the teacher
  pictures: [PicId, PicId]; // picture password
  color: string; // avatar colour
  base: {
    levelsDone: number; // 0-3
    sessionsThisWeek: number;
    daysSinceActive: number;
    /** Share of questions right on the first try, per skill (0-1).
     *  wordReading comes from the teacher's read-aloud check, not the app. */
    accuracy: Record<Skill, number>;
    /** How many answers the accuracy above is based on (weight vs. live answers). */
    answered: number;
  };
}

export const PICTURES: PicId[] = ['mango', 'cat', 'sun', 'fish', 'star', 'boat', 'flower', 'tree', 'ball'];

const COLORS = ['#e86f51', '#1f7a6d', '#f2b33d', '#5b7fd6', '#a066c9', '#3fa36b', '#d9577f', '#c98b2b'];

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pairs: [PicId, PicId][] = [];
for (let i = 0; i < PICTURES.length; i++)
  for (let j = i + 1; j < PICTURES.length; j++) pairs.push([PICTURES[i], PICTURES[j]]);

function round2(n: number) {
  return Math.round(Math.min(0.98, Math.max(0.35, n)) * 100) / 100;
}

function build(): DemoLearner[] {
  const rand = mulberry32(2026);
  const list: DemoLearner[] = [];
  for (let i = 1; i <= 30; i++) {
    const nn = String(i).padStart(2, '0');
    const id = `L${nn}`;
    const strength = rand(); // overall reading confidence for this fake learner
    const band: Band = strength < 0.45 ? 'A' : 'B';
    const weakSkill = (['wordReading', 'vocabulary', 'details', 'explaining'] as Skill[])[Math.floor(rand() * 4)];
    const accuracy = {} as Record<Skill, number>;
    for (const s of ['wordReading', 'vocabulary', 'details', 'explaining'] as Skill[]) {
      let v = 0.7 + strength * 0.26 + (rand() - 0.5) * 0.1;
      if (s === weakSkill) v -= 0.03 + (1 - strength) * 0.2;
      accuracy[s] = round2(v);
    }
    list.push({
      id,
      name: `Learner ${nn}`,
      demoId: `DEMO-${String(i).padStart(4, '0')}`,
      band,
      pictures: pairs[(i * 7) % pairs.length],
      color: COLORS[i % COLORS.length],
      base: {
        levelsDone: Math.min(3, Math.floor(rand() * 2.2 + strength * 1.6)),
        sessionsThisWeek: Math.floor(1 + rand() * 1.7 + strength * 1.2),
        daysSinceActive: Math.floor(rand() * rand() * 9),
        accuracy,
        answered: 8,
      },
    });
  }

  // Fixed learners for a predictable demo.
  const l01 = list[0];
  l01.base.levelsDone = 0; // fresh start: play levels 1 to 3 from the beginning

  const sample = list.find((l) => l.id === SAMPLE_LEARNER_ID)!;
  sample.band = 'A';
  sample.pictures = ['mango', 'cat'];
  sample.base = {
    levelsDone: 2,
    sessionsThisWeek: 2,
    daysSinceActive: 1,
    accuracy: { wordReading: 0.78, vocabulary: 0.72, details: 0.7, explaining: 0.5 },
    answered: 8,
  };
  return list;
}

export const demoLearners: DemoLearner[] = build();

export function findLearner(id: string | null | undefined): DemoLearner | undefined {
  return demoLearners.find((l) => l.id === id);
}

export const skillNames: Record<Skill, string> = {
  wordReading: 'Word reading',
  vocabulary: 'Vocabulary',
  details: 'Understanding details',
  explaining: 'Explaining why',
};

export const skillTips: Record<Skill, string> = {
  wordReading: 'Listen to them read one page aloud. Let them use the Listen button first, then read the same page.',
  vocabulary: 'Preview 2–3 story words before reading. Ask them to use each word in their own sentence.',
  details: 'After each page, ask “Who? What? Where?” and let them point to the sentence in the story.',
  explaining: 'Model the starter “I think… because…”. Pair them with a partner for the explain-aloud step.',
};
