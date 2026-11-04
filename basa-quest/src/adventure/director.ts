// Quest logic. Turns "talk to X / pick up Y / look at Z" into a short script of lines,
// notes, panels and state changes. Hints come only after repeated wrong tries.
import { HINT_AFTER } from '../config';
import { items, q1Needs, story, type ItemId } from '../content/adventure';
import type { UpgradeId } from '../content/ui';
import {
  addUpgrade,
  currentGame,
  learnWord,
  recordSkill,
  updateGame,
  updateQuest,
  type ClueGiver,
  type GameProgress,
} from '../lib/store';
import type { Bi, Line } from '../types';

export type PanelId = 'build' | 'proof' | 'sobra' | 'choice' | 'raceIntro';

export type Step =
  | { t: 'line'; line: Line }
  /** A clue-based hint, offered after repeated wrong tries (shown with Makinig). */
  | { t: 'hint'; line: Line }
  | { t: 'note'; title: Bi; lines: Line[] }
  | { t: 'panel'; panel: PanelId }
  | { t: 'reward'; upgrade?: UpgradeId; word?: string }
  | { t: 'do'; fn: () => void };

export interface Result {
  steps?: Step[];
  toast?: { text: Bi; vars?: Record<string, Bi> };
  /** Tell Phaser something visible happened (pickup sparkle, NPC hop…). */
  fx?: 'pickup' | 'put';
}

const lines = (ls: Line[]): Step[] => ls.map((line) => ({ t: 'line' as const, line }));
const BAG_SIZE = 3;

// ───────────── intro ─────────────

export function introSteps(): Step[] {
  return [...lines(story.intro), { t: 'do', fn: () => updateGame((g) => ({ ...g, introSeen: true })) }];
}

// ───────────── main entry ─────────────

export function interact(id: string): Result {
  const g = currentGame();
  if (id.startsWith('item:')) return pickUp(id.slice(5) as ItemId, g);
  switch (id) {
    case 'nena':
      return talkNena(g);
    case 'lolo':
      return talkLolo(g);
    case 'nonoy':
      return talkNonoy(g);
    case 'jun':
      return talkJun(g);
    case 'race':
      if (g.quests.q1.status !== 'done') return gateFix(g);
      return { steps: [{ t: 'line', line: story.raceAsk }, { t: 'panel', panel: 'raceIntro' }] };
    case 'boat':
      return searchBoat(g);
    case 'basket':
    case 'bench':
      return searchWrong(id, g);
    case 'home':
      return { steps: [{ t: 'line', line: story.idle.talaHome }] };
    default:
      if (id.startsWith('locked')) return { steps: [{ t: 'line', line: story.idle.locked }] };
      return {};
  }
}

// ───────────── Quest 1: Aling Nena's Note ─────────────

function noteSteps(): Step[] {
  return [{ t: 'note', title: story.q1NoteTitle, lines: story.q1Note }];
}

function talkNena(g: GameProgress): Result {
  const steps: Step[] = [];
  if (g.quests.q1.status === 'locked') {
    steps.push(...lines(story.q1Start), ...noteSteps(), { t: 'line', line: story.q1Look });
    steps.push({ t: 'do', fn: () => updateQuest('q1', (q) => ({ ...q, status: 'active' })) });
    return { steps };
  }
  if (g.quests.q3.status === 'active' && !g.q3.clues.includes('nena')) return clue('nena');
  if (g.quests.q1.status === 'active') return { steps: [...noteSteps()] };
  return { steps: [{ t: 'line', line: story.idle.nena }] };
}

function pickUp(item: ItemId, g: GameProgress): Result {
  if (g.quests.q1.status !== 'active') return {};
  if (g.bag.includes(item) || g.q1Delivered.includes(item)) return {};
  if (g.bag.length >= BAG_SIZE) return { toast: { text: { fil: 'Puno na ang dala mo. Ibalik muna ang isa.', en: 'Your bag is full. Put something back first.' } } };
  updateGame((gm) => ({ ...gm, bag: [...gm.bag, item] }));
  return { toast: { text: { fil: 'Napulot mo: {item}', en: 'You picked up: {item}' }, vars: { item: items[item].name } }, fx: 'pickup' };
}

export function putBack(item: ItemId) {
  updateGame((g) => ({ ...g, bag: g.bag.filter((b) => b !== item) }));
}

function deliver(g: GameProgress): Result {
  const q1 = g.quests.q1;
  if (g.bag.length === 0) return { steps: [{ t: 'line', line: story.q1Empty }] };
  const right = g.bag.filter((i) => q1Needs.includes(i) && !g.q1Delivered.includes(i));
  const wrong = g.bag.filter((i) => !right.includes(i));
  const delivered = [...g.q1Delivered, ...right];
  const allDone = q1Needs.every((i) => delivered.includes(i));
  const wrongTry = wrong.length > 0;
  const attempts = q1.attempts + (wrongTry ? 1 : 0);
  const giveHint = wrongTry && attempts >= HINT_AFTER && !allDone;
  const missing = q1Needs.find((i) => !delivered.includes(i));

  const steps: Step[] = [
    {
      t: 'do',
      fn: () => {
        updateGame((gm) => ({ ...gm, bag: [], q1Delivered: delivered }));
        updateQuest('q1', (q) => ({ ...q, attempts, hints: q.hints + (giveHint ? 1 : 0) }));
      },
    },
  ];
  for (const w of wrong) {
    const funny = story.q1Wrong[w];
    if (funny) steps.push({ t: 'line', line: funny });
  }
  if (wrongTry) steps.push({ t: 'line', line: story.q1Returned });
  if (right.length > 0) steps.push({ t: 'line', line: story.q1Good });

  if (allDone) {
    steps.push(...lines(story.q1Done), { t: 'reward', upgrade: 'frame', word: 'matibay' });
    steps.push({
      t: 'do',
      fn: () => {
        updateQuest('q1', (q) => ({ ...q, status: 'done' }));
        recordSkill('details', attempts, currentGame().quests.q1.hints);
        addUpgrade('frame');
        learnWord('matibay');
        updateQuest('q2', (q) => ({ ...q, status: 'active' }));
      },
    });
    steps.push(...q2Steps());
  } else if (giveHint && missing) {
    steps.push({ t: 'hint', line: story.q1Hints[missing] });
  } else {
    steps.push({ t: 'line', line: story.q1More });
  }
  return { steps };
}

// ───────────── Quest 2: Lolo Ben's Build ─────────────

function q2Steps(): Step[] {
  return [...lines(story.q2Start), { t: 'panel', panel: 'build' }];
}

/** Called by the build panel when the test flight is steady. */
export function finishQ2(wrongTests: number, hints: number): Step[] {
  updateQuest('q2', (q) => ({ ...q, attempts: wrongTests, hints }));
  return [
    ...lines(story.q2Done),
    { t: 'reward', upgrade: 'balance', word: 'pantay' },
    {
      t: 'do',
      fn: () => {
        updateQuest('q2', (q) => ({ ...q, status: 'done' }));
        recordSkill('directions', wrongTests, hints);
        addUpgrade('balance');
        learnWord('pantay');
        updateQuest('q3', (q) => ({ ...q, status: 'active' }));
        updateQuest('choice', (q) => ({ ...q, status: 'active' }));
      },
    },
    ...lines(story.q3Start),
  ];
}

// ───────────── Lolo Ben ─────────────

function talkLolo(g: GameProgress): Result {
  const { q1, q2, q3 } = g.quests;
  if (q1.status === 'active') return deliver(g);
  if (q2.status === 'active') return { steps: q2Steps() };
  if (q3.status === 'active') {
    if (!g.q3.hasString) return { steps: [{ t: 'line', line: story.q3Start[1] }] };
    if (g.q3.clues.length < 3) return { steps: [{ t: 'line', line: story.q3NeedClues }] };
    return { steps: [{ t: 'panel', panel: 'proof' }, { t: 'line', line: story.q3Sobra }, { t: 'panel', panel: 'sobra' }, ...q3DoneSteps()] };
  }
  return { steps: [{ t: 'line', line: story.idle.lolo }] };
}

// ───────────── Quest 3: The Missing String ─────────────

function clue(who: ClueGiver): Result {
  return {
    steps: [
      { t: 'line', line: story.q3Clues[who] },
      { t: 'do', fn: () => updateGame((g) => (g.q3.clues.includes(who) ? g : { ...g, q3: { ...g.q3, clues: [...g.q3.clues, who] } })) },
    ],
  };
}

function searchBoat(g: GameProgress): Result {
  if (g.quests.q3.status === 'active' && !g.q3.hasString) {
    return {
      steps: [...lines(story.q3Found), { t: 'do', fn: () => updateGame((gm) => ({ ...gm, q3: { ...gm.q3, hasString: true } })) }],
    };
  }
  return { steps: [{ t: 'line', line: story.idle.muning }] };
}

function searchWrong(spot: 'basket' | 'bench', g: GameProgress): Result {
  const steps: Step[] = [{ t: 'line', line: story.q3Search[spot] }];
  if (g.quests.q3.status === 'active' && !g.q3.hasString) {
    const attempts = g.quests.q3.attempts + 1;
    const hint = attempts >= HINT_AFTER;
    steps.unshift({ t: 'do', fn: () => updateQuest('q3', (q) => ({ ...q, attempts, hints: q.hints + (hint ? 1 : 0) })) });
    if (hint) steps.push({ t: 'hint', line: story.q3SearchHint });
  }
  return { steps };
}

/** Wrong taps in the proof panel count as Quest 3 tries. */
export function proofWrong() {
  updateGame((g) => ({ ...g, q3: { ...g.q3, proofAttempts: g.q3.proofAttempts + 1 } }));
  updateQuest('q3', (q) => ({ ...q, attempts: q.attempts + 1, hints: q.hints + 1 }));
}

export function sobraWrong() {
  updateGame((g) => ({ ...g, q3: { ...g.q3, sobraAttempts: g.q3.sobraAttempts + 1 } }));
}

function q3DoneSteps(): Step[] {
  return [
    ...lines(story.q3Done),
    { t: 'reward', upgrade: 'longString', word: 'sobra' },
    {
      t: 'do',
      fn: () => {
        const g = currentGame();
        updateQuest('q3', (q) => ({ ...q, status: 'done' }));
        recordSkill('proof', g.quests.q3.attempts, g.quests.q3.hints);
        recordSkill('vocabulary', g.q3.sobraAttempts, g.q3.sobraAttempts);
        addUpgrade('longString');
        learnWord('sobra');
      },
    },
  ];
}

// ───────────── Nonoy + Nonoy's Choice ─────────────

function talkNonoy(g: GameProgress): Result {
  const steps: Step[] = [];
  if (g.quests.q3.status === 'active' && !g.q3.clues.includes('nonoy')) steps.push(...(clue('nonoy').steps ?? []));
  if (g.quests.choice.status === 'active' && !g.choice) {
    steps.push(...lines(story.choiceIntro), { t: 'line', line: story.choiceAsk }, { t: 'panel', panel: 'choice' });
  }
  if (steps.length === 0) steps.push({ t: 'line', line: story.idle.nonoy });
  return { steps };
}

/** Called by the choice panel when the child has chosen and explained (or skipped). */
export function finishChoice(choice: 'share' | 'keep', mode: 'recorded' | 'partner' | 'skipped') {
  updateGame((g) => ({ ...g, choice, explain: mode }));
  updateQuest('choice', (q) => ({ ...q, status: 'done' }));
  recordSkill('explaining', mode === 'skipped' ? 1 : 0, 0);
  addUpgrade(choice === 'share' ? 'nonoy' : 'ribbon');
}

// ───────────── Kuya Jun + the gate ─────────────

/** The race stays locked until Quest 1 is done: Kuya Jun repeats where to go next. */
function gateFix(g: GameProgress): Result {
  const where = g.quests.q1.status === 'locked' ? story.gateWhereNena : story.gateWhereLolo;
  return { steps: [{ t: 'line', line: story.gateFix }, { t: 'line', line: where }] };
}

function talkJun(g: GameProgress): Result {
  if (g.quests.q1.status !== 'done') return gateFix(g);
  if (!g.gateOpen) {
    return {
      steps: [
        { t: 'line', line: story.gateLocked },
        { t: 'line', line: story.gateOpen },
        { t: 'do', fn: () => updateGame((gm) => ({ ...gm, gateOpen: true })) },
      ],
    };
  }
  if (g.quests.q3.status === 'active' && !g.q3.clues.includes('jun')) return clue('jun');
  if (g.restored) return { steps: [{ t: 'line', line: story.plazaRestored }] };
  return { steps: [{ t: 'line', line: story.idle.jun }] };
}
