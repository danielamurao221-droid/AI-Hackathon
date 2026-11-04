// Demo app state: one object, saved to localStorage (or memory if storage fails).
// Student play and the teacher dashboard both read from here, so finishing a
// scene updates the dashboard straight away.
import { useSyncExternalStore } from 'react';
import { PLAYABLE_LEVELS, SAMPLE_LEARNER_ID, STORAGE_KEY } from '../config';
import { allWords, getLevel, ribbonScenes } from '../content';
import { demoLearners, findLearner } from '../data/demoClass';
import type { Band, Lang, Skill } from '../types';
import { clearRecordings } from './recordings';
import { readJSON, removeKey, writeJSON } from './storage';

export type ExplainMode = 'recorded' | 'partner' | 'skipped';

export interface SceneLog {
  /** Wrong tries before solving. Each wrong try showed a hint. */
  attempts: number;
  solved: boolean;
}

export interface LevelProgress {
  /** Index of the current scene. */
  scene: number;
  done: boolean;
  /** Scene ids that earned a ribbon. */
  ribbons: string[];
  /** Line ids the child has seen, for "Balikan ang kuwento". */
  clues: string[];
  log: Record<string, SceneLog>;
  /** Option id chosen in the decide scene. */
  choice: string | null;
  explain: ExplainMode | null;
  /** The map has already played the "place restored" animation. */
  restoreSeen: boolean;
}

export interface SkillStat {
  tries: number;
  firstTry: number;
  hints: number;
}

export interface LearnerProgress {
  levels: Record<number, LevelProgress>;
  /** Word Notebook: word ids learned. */
  words: string[];
  /** Timestamps of logins made in the app. */
  sessions: number[];
  lastActivity: number | null;
  answers: Partial<Record<Skill, SkillStat>>;
}

export interface AppState {
  version: 2;
  lang: Lang;
  muted: boolean;
  learnerId: string | null;
  activeLevel: number | null;
  sessionStart: number | null;
  progress: Record<string, LearnerProgress>;
  /** Teacher "Mark as reviewed": learnerId -> time. */
  reviewed: Record<string, number>;
  /** Teacher band changes: learnerId -> band. */
  bandOverride: Record<string, Band>;
}

function initialState(): AppState {
  return {
    version: 2,
    lang: 'fil',
    muted: false,
    learnerId: null,
    activeLevel: null,
    sessionStart: null,
    progress: {},
    reviewed: {},
    bandOverride: {},
  };
}

function loadState(): AppState {
  const saved = readJSON<AppState>(STORAGE_KEY);
  if (!saved || saved.version !== 2) return initialState();
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

function subscribe(fn: () => void) {
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

// ───────────── helpers ─────────────

export function emptyLevel(): LevelProgress {
  return { scene: 0, done: false, ribbons: [], clues: [], log: {}, choice: null, explain: null, restoreSeen: false };
}

function finishedLevel(level: number): LevelProgress {
  const l = getLevel(level);
  return { ...emptyLevel(), done: true, restoreSeen: true, ribbons: l ? ribbonScenes(l).map((s) => s.id) : [] };
}

/** Starting progress for a learner, copied from the teacher's demo data. */
function seedProgress(learnerId: string): LearnerProgress {
  const l = findLearner(learnerId);
  const base: LearnerProgress = { levels: {}, words: [], sessions: [], lastActivity: null, answers: {} };
  if (learnerId === SAMPLE_LEARNER_ID) {
    // Sample learner: halfway through Level 1, with real-looking activity.
    const lv1 = getLevel(1)!;
    const seen = lv1.scenes.slice(0, 3).flatMap((s) => (s.kind === 'pick' ? s.rounds.flatMap((r) => [...r.lines, r.prompt]) : s.kind === 'build' ? [...s.lines, ...s.steps.map((x) => x.line)] : []));
    return {
      ...base,
      levels: {
        1: {
          ...emptyLevel(),
          scene: 3,
          ribbons: ['supplies', 'build'],
          clues: seen.map((x) => x.id),
          log: { hook: { attempts: 0, solved: true }, supplies: { attempts: 1, solved: true }, build: { attempts: 2, solved: true } },
        },
      },
      lastActivity: Date.now() - 26 * 3_600_000,
      answers: { wordReading: { tries: 2, firstTry: 0, hints: 3 } },
    };
  }
  if (l && l.base.levelsDone >= 1) {
    return { ...base, levels: { 1: finishedLevel(1) }, words: allWords.map((w) => w.id) };
  }
  return base;
}

export function getProgress(s: AppState, learnerId: string): LearnerProgress {
  return s.progress[learnerId] ?? seedProgress(learnerId);
}

export function levelProgress(p: LearnerProgress, level: number): LevelProgress {
  return p.levels[level] ?? emptyLevel();
}

export function isUnlocked(level: number): boolean {
  return level >= 1 && level <= PLAYABLE_LEVELS && !!getLevel(level);
}

export function totalRibbons(p: LearnerProgress): number {
  return Object.values(p.levels).reduce((n, lp) => n + lp.ribbons.length, 0);
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

function updateLevel(level: number, fn: (lp: LevelProgress) => LevelProgress) {
  updateLearner((p) => ({ ...p, levels: { ...p.levels, [level]: fn(levelProgress(p, level)) } }));
}

// ───────────── student actions ─────────────

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
      activeLevel: null,
      sessionStart: now,
      progress: { ...s.progress, [learnerId]: { ...p, sessions: [...p.sessions, now], lastActivity: now } },
    };
  });
}

export function logout() {
  clearRecordings();
  setState((s) => ({ ...s, learnerId: null, activeLevel: null, sessionStart: null }));
}

export function openLevel(level: number) {
  if (!getState().learnerId || !isUnlocked(level)) return; // locked levels never open
  const lv = getLevel(level)!;
  updateLevel(level, (lp) =>
    // Replaying a finished level (or one left on the last scene) starts from scene 1.
    // Ribbons, words and the restored place are kept.
    lp.done || lp.scene >= lv.scenes.length ? { ...lp, scene: 0, choice: null, explain: null } : lp,
  );
  setState((s) => ({ ...s, activeLevel: level }));
}

export function closeLevel() {
  setState((s) => ({ ...s, activeLevel: null }));
}

export function seeLines(level: number, ids: string[]) {
  const lp = levelProgress(getProgress(getState(), getState().learnerId ?? ''), level);
  const fresh = ids.filter((id) => !lp.clues.includes(id));
  if (fresh.length === 0) return;
  updateLevel(level, (l) => ({ ...l, clues: [...l.clues, ...fresh] }));
}

/** A scene was solved. `attempts` = wrong tries (each showed a hint). */
export function solveScene(level: number, sceneId: string, skill: Skill | undefined, attempts: number, ribbon: boolean) {
  updateLearner((p) => {
    const lp = levelProgress(p, level);
    const answers = { ...p.answers };
    if (skill) {
      const prev = answers[skill] ?? { tries: 0, firstTry: 0, hints: 0 };
      answers[skill] = { tries: prev.tries + 1, firstTry: prev.firstTry + (attempts === 0 ? 1 : 0), hints: prev.hints + attempts };
    }
    return {
      ...p,
      answers,
      levels: {
        ...p.levels,
        [level]: {
          ...lp,
          ribbons: ribbon && !lp.ribbons.includes(sceneId) ? [...lp.ribbons, sceneId] : lp.ribbons,
          log: { ...lp.log, [sceneId]: { attempts, solved: true } },
        },
      },
    };
  });
}

export function nextScene(level: number) {
  updateLevel(level, (lp) => ({ ...lp, scene: lp.scene + 1 }));
}

export function setChoice(level: number, choice: string | null) {
  updateLevel(level, (lp) => ({ ...lp, choice }));
}

export function setExplain(level: number, mode: ExplainMode) {
  updateLevel(level, (lp) => ({ ...lp, explain: mode }));
}

export function learnWord(wordId: string) {
  updateLearner((p) => (p.words.includes(wordId) ? p : { ...p, words: [...p.words, wordId] }));
}

/** Level finished: the place is restored (the map animates it once). */
export function completeLevel(level: number) {
  updateLevel(level, (lp) => (lp.done ? lp : { ...lp, done: true, restoreSeen: false }));
}

export function markRestoreSeen(level: number) {
  updateLevel(level, (lp) => ({ ...lp, restoreSeen: true }));
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

/** Clear Level 1 for the learner who is logged in (plaza goes back to faded). */
export function resetLevel(level: number) {
  const id = state.learnerId;
  if (!id) return;
  clearRecordings();
  setState((s) => {
    const p = getProgress(s, id);
    const levels = { ...p.levels };
    delete levels[level];
    const lv = getLevel(level);
    const levelWords = lv ? lv.scenes.flatMap((sc) => (sc.kind === 'word' ? [sc.word.id] : [])) : [];
    return {
      ...s,
      activeLevel: null,
      progress: { ...s.progress, [id]: { ...p, levels, words: p.words.filter((w) => !levelWords.includes(w)) } },
    };
  });
}

/** Log in the sample learner, who is halfway through Level 1. */
export function loadSampleLearner() {
  clearRecordings();
  setState((s) => {
    const progress = { ...s.progress };
    delete progress[SAMPLE_LEARNER_ID];
    return { ...s, progress };
  });
  login(SAMPLE_LEARNER_ID);
}

/** Presenter shortcut: log in the first demo learner and go straight to the map. */
export function skipLogin() {
  clearRecordings();
  login(demoLearners[0].id);
}
