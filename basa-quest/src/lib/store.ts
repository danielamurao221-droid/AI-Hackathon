// Demo app state: one object, saved to localStorage (or memory if storage fails).
// The game and the teacher dashboard both read from here, so play updates the dashboard at once.
import { useSyncExternalStore } from 'react';
import { SAMPLE_LEARNER_ID, STORAGE_KEY } from '../config';
import { words, type ItemId } from '../content/adventure';
import type { UpgradeId } from '../content/ui';
import { demoLearners, findLearner } from '../data/demoClass';
import type { Band, Lang, Skill } from '../types';
import { clearRecordings } from './recordings';
import { readJSON, removeKey, writeJSON } from './storage';

export type ExplainMode = 'recorded' | 'partner' | 'skipped';
export type QuestId = 'q1' | 'q2' | 'q3' | 'choice';
export type ClueGiver = 'nonoy' | 'nena' | 'jun';

export interface QuestState {
  status: 'locked' | 'active' | 'done';
  /** Wrong tries (wrong delivery, wobbly test flight, wrong search spot, wrong proof). */
  attempts: number;
  /** Clue-based hints shown. */
  hints: number;
}

export interface FinaleStats {
  tries: number;
  crashes: number;
  wins: number;
  best: number;
  gateTries: number;
  gateCorrect: number;
}

export interface GameProgress {
  introSeen: boolean;
  pos: { x: number; y: number } | null;
  gateOpen: boolean;
  quests: Record<QuestId, QuestState>;
  q1Delivered: ItemId[];
  q3: { clues: ClueGiver[]; hasString: boolean; proofAttempts: number; sobraAttempts: number };
  bag: ItemId[];
  upgrades: UpgradeId[];
  choice: 'share' | 'keep' | null;
  explain: ExplainMode | null;
  /** Quest Notebook: line ids, in the order the child met them. */
  notebook: string[];
  /** Word Notebook: word ids. */
  words: string[];
  finale: FinaleStats;
  restored: boolean;
  restoreSeen: boolean;
}

export interface SkillStat {
  tries: number;
  firstTry: number;
  hints: number;
}

export interface LearnerProgress {
  game: GameProgress;
  sessions: number[];
  lastActivity: number | null;
  answers: Partial<Record<Skill, SkillStat>>;
}

export type Screen = 'world' | 'race';

export interface AppState {
  version: 3;
  lang: Lang;
  muted: boolean;
  learnerId: string | null;
  screen: Screen;
  sessionStart: number | null;
  progress: Record<string, LearnerProgress>;
  /** Teacher "Mark as reviewed": learnerId -> time. */
  reviewed: Record<string, number>;
  /** Teacher band changes: learnerId -> band. */
  bandOverride: Record<string, Band>;
}

function initialState(): AppState {
  return {
    version: 3,
    lang: 'fil',
    muted: false,
    learnerId: null,
    screen: 'world',
    sessionStart: null,
    progress: {},
    reviewed: {},
    bandOverride: {},
  };
}

function loadState(): AppState {
  const saved = readJSON<AppState>(STORAGE_KEY);
  if (!saved || saved.version !== 3) return initialState();
  return { ...initialState(), ...saved };
}

let state: AppState = loadState();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function getState(): AppState {
  return state;
}

export function setState(update: (s: AppState) => AppState) {
  state = update(state);
  writeJSON(STORAGE_KEY, state);
  emit();
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getState, getState);
}

// Keep two open tabs in sync (e.g. student on one, teacher on another).
try {
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return;
    state = loadState();
    emit();
  });
} catch {
  /* ignore */
}

// ───────────── seeds ─────────────

const q = (status: QuestState['status'], attempts = 0, hints = 0): QuestState => ({ status, attempts, hints });

export function newGame(): GameProgress {
  return {
    introSeen: false,
    pos: null,
    gateOpen: false,
    quests: { q1: q('locked'), q2: q('locked'), q3: q('locked'), choice: q('locked') },
    q1Delivered: [],
    q3: { clues: [], hasString: false, proofAttempts: 0, sobraAttempts: 0 },
    bag: [],
    upgrades: [],
    choice: null,
    explain: null,
    notebook: [],
    words: [],
    finale: { tries: 0, crashes: 0, wins: 0, best: 0, gateTries: 0, gateCorrect: 0 },
    restored: false,
    restoreSeen: false,
  };
}

function finishedGame(): GameProgress {
  return {
    ...newGame(),
    introSeen: true,
    gateOpen: true,
    quests: { q1: q('done'), q2: q('done'), q3: q('done'), choice: q('done') },
    q1Delivered: ['longBamboo', 'redPaper', 'glueJar'],
    q3: { clues: ['nonoy', 'nena', 'jun'], hasString: true, proofAttempts: 0, sobraAttempts: 0 },
    upgrades: ['frame', 'balance', 'longString'],
    words: words.map((w) => w.id),
    restored: true,
    restoreSeen: true,
  };
}

/** Sample learner: Quests 1–2 done, Quest 3 started, one try at the race. */
function sampleGame(): GameProgress {
  return {
    ...newGame(),
    introSeen: true,
    pos: { x: 700, y: 1150 },
    gateOpen: true,
    quests: { q1: q('done', 1, 0), q2: q('done', 2, 1), q3: q('active'), choice: q('active') },
    q1Delivered: ['longBamboo', 'redPaper', 'glueJar'],
    q3: { clues: ['nonoy'], hasString: false, proofAttempts: 0, sobraAttempts: 0 },
    upgrades: ['frame', 'balance'],
    notebook: [
      'intro-1', 'intro-2', 'intro-3', 'q1-start-1', 'q1-note-1', 'q1-note-2', 'q1-note-3', 'q1-note-4', 'q1-note-5', 'q1-start-2',
      'q1-done-1', 'q1-reward', 'q2-start-1', 'q2-step-1', 'q2-step-2', 'q2-step-3', 'q2-step-4', 'q2-done-1', 'q2-reward',
      'q3-start-1', 'q3-start-2', 'q3-clue-nonoy',
    ],
    words: ['matibay', 'pantay'],
    finale: { tries: 1, crashes: 1, wins: 0, best: 54, gateTries: 2, gateCorrect: 1 },
  };
}

function seedProgress(learnerId: string): LearnerProgress {
  const l = findLearner(learnerId);
  const base: LearnerProgress = { game: newGame(), sessions: [], lastActivity: null, answers: {} };
  if (learnerId === SAMPLE_LEARNER_ID) {
    return {
      ...base,
      game: sampleGame(),
      lastActivity: Date.now() - 26 * 3_600_000,
      answers: { details: { tries: 1, firstTry: 0, hints: 0 }, directions: { tries: 1, firstTry: 0, hints: 1 }, vocabulary: { tries: 2, firstTry: 1, hints: 0 } },
    };
  }
  if (l && l.base.levelsDone >= 1) return { ...base, game: finishedGame() };
  return base;
}

export function getProgress(s: AppState, learnerId: string): LearnerProgress {
  return s.progress[learnerId] ?? seedProgress(learnerId);
}

/** Current learner's game (a fresh one if nobody is logged in). */
export function currentGame(s: AppState = state): GameProgress {
  return s.learnerId ? getProgress(s, s.learnerId).game : newGame();
}

export function bandFor(s: AppState, learnerId: string): Band {
  return s.bandOverride[learnerId] ?? findLearner(learnerId)?.band ?? 'A';
}

function updateLearner(fn: (p: LearnerProgress) => LearnerProgress) {
  setState((s) => {
    if (!s.learnerId) return s;
    const p = fn(getProgress(s, s.learnerId));
    return { ...s, progress: { ...s.progress, [s.learnerId]: { ...p, lastActivity: Date.now() } } };
  });
}

/** Change the current learner's game. */
export function updateGame(fn: (g: GameProgress) => GameProgress) {
  updateLearner((p) => ({ ...p, game: fn(p.game) }));
}

export function updateQuest(id: QuestId, fn: (qs: QuestState) => QuestState) {
  updateGame((g) => ({ ...g, quests: { ...g.quests, [id]: fn(g.quests[id]) } }));
}

/** Evidence for a dashboard skill: one solved task, with its wrong tries and hints. */
export function recordSkill(skill: Skill, wrongTries: number, hints: number) {
  updateLearner((p) => {
    const prev = p.answers[skill] ?? { tries: 0, firstTry: 0, hints: 0 };
    return {
      ...p,
      answers: { ...p.answers, [skill]: { tries: prev.tries + 1, firstTry: prev.firstTry + (wrongTries === 0 ? 1 : 0), hints: prev.hints + hints } },
    };
  });
}

/** Add lines to the Quest Notebook (small talk is skipped). */
export function addToNotebook(ids: string[]) {
  const g = currentGame();
  const fresh = ids.filter((id) => !id.startsWith('idle-') && !g.notebook.includes(id));
  if (fresh.length === 0) return;
  updateGame((gm) => ({ ...gm, notebook: [...gm.notebook, ...fresh] }));
}

export function learnWord(id: string) {
  updateGame((g) => (g.words.includes(id) ? g : { ...g, words: [...g.words, id] }));
}

export function addUpgrade(id: UpgradeId) {
  updateGame((g) => (g.upgrades.includes(id) ? g : { ...g, upgrades: [...g.upgrades, id] }));
}

export function savePosition(x: number, y: number) {
  const s = getState();
  if (!s.learnerId) return;
  // Position changes often; write it without waking every listener.
  const p = getProgress(s, s.learnerId);
  state = { ...s, progress: { ...s.progress, [s.learnerId]: { ...p, game: { ...p.game, pos: { x: Math.round(x), y: Math.round(y) } } } } };
  writeJSON(STORAGE_KEY, state);
}

export function setScreen(screen: Screen) {
  setState((s) => ({ ...s, screen }));
}

// ───────────── app actions ─────────────

export function setLang(lang: Lang) {
  setState((s) => ({ ...s, lang }));
}

export function setMuted(muted: boolean) {
  setState((s) => ({ ...s, muted }));
}

export function login(learnerId: string) {
  setState((s) => {
    const p = getProgress(s, learnerId);
    const now = Date.now();
    return {
      ...s,
      learnerId,
      screen: 'world',
      sessionStart: now,
      progress: { ...s.progress, [learnerId]: { ...p, sessions: [...p.sessions, now], lastActivity: now } },
    };
  });
}

export function logout() {
  clearRecordings();
  setState((s) => ({ ...s, learnerId: null, screen: 'world', sessionStart: null }));
}

// ───────────── teacher + presenter ─────────────

export function setReviewed(learnerId: string, on: boolean) {
  setState((s) => {
    const reviewed = { ...s.reviewed };
    if (on) reviewed[learnerId] = Date.now();
    else delete reviewed[learnerId];
    return { ...s, reviewed };
  });
}

export function setBand(learnerId: string, band: Band) {
  setState((s) => ({ ...s, bandOverride: { ...s.bandOverride, [learnerId]: band } }));
}

export function resetDemo() {
  clearRecordings();
  removeKey(STORAGE_KEY);
  const { lang, muted } = state;
  state = { ...initialState(), lang, muted };
  writeJSON(STORAGE_KEY, state);
  emit();
}

/** Start the game over for whoever is logged in. */
export function resetGame() {
  const id = state.learnerId;
  if (!id) return;
  clearRecordings();
  setState((s) => {
    const p = getProgress(s, id);
    return { ...s, screen: 'world', progress: { ...s.progress, [id]: { ...p, game: newGame(), answers: {} } } };
  });
}

/** Log in the sample learner (Quests 1–2 done, Quest 3 started). */
export function loadSampleLearner() {
  clearRecordings();
  setState((s) => {
    const progress = { ...s.progress };
    delete progress[SAMPLE_LEARNER_ID];
    return { ...s, progress };
  });
  login(SAMPLE_LEARNER_ID);
}

/** Presenter shortcut: log in the first demo learner and go straight into the world. */
export function skipLogin() {
  clearRecordings();
  login(demoLearners[0].id);
}

/** Presenter shortcut: start the Kite Day race with sample upgrades. */
export function startFinaleDemo() {
  if (!state.learnerId) login(demoLearners[0].id);
  updateGame((g) => ({
    ...g,
    introSeen: true,
    gateOpen: true,
    quests: { ...g.quests, q1: { ...g.quests.q1, status: 'done' }, q2: { ...g.quests.q2, status: 'done' }, q3: { ...g.quests.q3, status: 'done' } },
    upgrades: ['frame', 'balance', 'longString', g.choice === 'keep' ? 'ribbon' : 'nonoy'],
    words: words.map((w) => w.id),
    choice: g.choice ?? 'share',
  }));
  setScreen('race');
}
