// Demo app state: one object, saved to localStorage (or memory if storage fails).
// Student play and the teacher dashboard both read from here, so finishing a
// level updates the dashboard straight away.
import { useSyncExternalStore } from 'react';
import { PLAYABLE_LEVELS, SAMPLE_LEARNER_ID, STORAGE_KEY } from '../config';
import { findLearner } from '../data/demoClass';
import type { Band, Lang, Skill } from '../types';
import { clearRecordings } from './recordings';
import { readJSON, removeKey, writeJSON } from './storage';

export type Step = 'story' | 'questions' | 'explain' | 'done';

export interface LevelProgress {
  step: Step;
  page: number;
  q: number;
  completed: boolean;
  stars: { story: boolean; questions: boolean; explain: boolean };
}

export interface LearnerProgress {
  levels: Record<number, LevelProgress>;
  /** Timestamps of logins made in the app. */
  sessions: number[];
  lastActivity: number | null;
  /** Answers given in the app: tries and first-try-correct per skill. */
  answers: Partial<Record<Skill, { tries: number; firstTry: number }>>;
}

export interface AppState {
  version: 1;
  lang: Lang;
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
    version: 1,
    lang: 'fil',
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
  if (!saved || saved.version !== 1) return initialState();
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
  return () => listeners.delete(fn);
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
  return { step: 'story', page: 0, q: 0, completed: false, stars: { story: false, questions: false, explain: false } };
}

function completeLevel(): LevelProgress {
  return { step: 'done', page: 0, q: 0, completed: true, stars: { story: true, questions: true, explain: true } };
}

/** Starting progress for a learner, copied from the teacher's demo data. */
function seedProgress(learnerId: string): LearnerProgress {
  const l = findLearner(learnerId);
  const levels: Record<number, LevelProgress> = {};
  for (let n = 1; n <= (l?.base.levelsDone ?? 0); n++) levels[n] = completeLevel();
  return { levels, sessions: [], lastActivity: null, answers: {} };
}

export function getProgress(s: AppState, learnerId: string): LearnerProgress {
  return s.progress[learnerId] ?? seedProgress(learnerId);
}

export function levelsDone(p: LearnerProgress): number {
  let n = 0;
  for (let i = 1; i <= PLAYABLE_LEVELS; i++) if (p.levels[i]?.completed) n = i;
  return n;
}

export function isUnlocked(p: LearnerProgress, level: number): boolean {
  if (level < 1 || level > PLAYABLE_LEVELS) return false;
  return level === 1 || !!p.levels[level - 1]?.completed;
}

export function starCount(lp: LevelProgress | undefined): number {
  if (!lp) return 0;
  return Number(lp.stars.story) + Number(lp.stars.questions) + Number(lp.stars.explain);
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
  updateLearner((p) => ({ ...p, levels: { ...p.levels, [level]: fn(p.levels[level] ?? emptyLevel()) } }));
}

// ───────────── actions ─────────────

export function setLang(lang: Lang) {
  setState((s) => ({ ...s, lang }));
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
  const s = getState();
  if (!s.learnerId) return;
  const p = getProgress(s, s.learnerId);
  if (!isUnlocked(p, level)) return; // locked levels can never open
  const lp = p.levels[level];
  if (lp?.step === 'done') {
    // Replay a finished level from the start. Stars already earned are kept.
    updateLevel(level, (old) => ({ ...old, step: 'story', page: 0, q: 0 }));
  }
  setState((st) => ({ ...st, activeLevel: level }));
}

export function closeLevel() {
  setState((s) => ({ ...s, activeLevel: null }));
}

export function setPage(level: number, page: number) {
  updateLevel(level, (lp) => ({ ...lp, page }));
}

export function finishStory(level: number) {
  updateLevel(level, (lp) => ({ ...lp, step: 'questions', q: 0, stars: { ...lp.stars, story: true } }));
}

export function recordAnswer(level: number, q: number, skill: Skill, firstTry: boolean, isLast: boolean) {
  updateLearner((p) => {
    const prev = p.answers[skill] ?? { tries: 0, firstTry: 0 };
    const lp = p.levels[level] ?? emptyLevel();
    const nextLp: LevelProgress = isLast
      ? { ...lp, step: 'explain', q: 0, stars: { ...lp.stars, questions: true } }
      : { ...lp, q: q + 1 };
    return {
      ...p,
      answers: { ...p.answers, [skill]: { tries: prev.tries + 1, firstTry: prev.firstTry + (firstTry ? 1 : 0) } },
      levels: { ...p.levels, [level]: nextLp },
    };
  });
}

export function finishExplain(level: number) {
  updateLevel(level, (lp) => ({ ...lp, step: 'done', completed: true, stars: { ...lp.stars, explain: true } }));
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
  const lang = state.lang;
  state = { ...initialState(), lang };
  writeJSON(STORAGE_KEY, state);
  emit();
}

/** Log in the sample learner, who has levels 1-2 done and level 3 ready. */
export function loadSampleLearner() {
  clearRecordings();
  setState((s) => {
    const progress = { ...s.progress };
    delete progress[SAMPLE_LEARNER_ID];
    return { ...s, progress };
  });
  login(SAMPLE_LEARNER_ID);
}
