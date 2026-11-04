// Builds teacher-dashboard rows by combining the fixed demo class data with what
// learners actually did in the game on this device. Never includes audio.
import { demoLearners, SKILL_LIST, skillNames, type DemoLearner } from '../data/demoClass';
import type { Band, Skill } from '../types';
import { bandFor, getProgress, type AppState, type ExplainMode, type QuestId, type SkillStat } from './store';

const DAY = 86_400_000;
const WEEK = 7 * DAY;
const HELP_THRESHOLD = 0.65; // below this first-try rate, a skill needs help
/** Score above which a learner counts as "may need extra help". */
export const NEED_CUTOFF = 0.3;
export const SKILLS: Skill[] = SKILL_LIST;

export interface QuestRow {
  id: QuestId;
  name: string;
  skill: Skill;
  status: 'locked' | 'active' | 'done';
  retries: number;
  hints: number;
}

/** Real game activity, shown in the learner detail view. */
export interface Activity {
  quests: QuestRow[];
  choice: 'share' | 'keep' | null;
  explain: ExplainMode | null;
  race: { tries: number; crashes: number; wins: number; best: number; gateTries: number; gateCorrect: number };
  upgrades: number;
  words: number;
}

export interface Row {
  learner: DemoLearner;
  band: Band;
  levelLabel: string;
  done: boolean;
  sessionsThisWeek: number;
  lastActivity: number;
  accuracy: Record<Skill, number>;
  helpSkill: Skill | null;
  needScore: number;
  reasons: string[];
  reviewedAt: number | null;
  /** Logged in on this device during the demo. */
  live: boolean;
  activity: Activity | null;
}

const QUEST_INFO: { id: QuestId; name: string; skill: Skill }[] = [
  { id: 'q1', name: 'Quest 1 · Aling Nena’s Note', skill: 'details' },
  { id: 'q2', name: 'Quest 2 · Lolo Ben’s Build', skill: 'directions' },
  { id: 'q3', name: 'Quest 3 · The Missing String', skill: 'proof' },
  { id: 'choice', name: 'Nonoy’s Choice', skill: 'explaining' },
];

export function buildRows(s: AppState, now = Date.now()): Row[] {
  return demoLearners.map((l) => {
    const live = !!s.progress[l.id];
    const p = getProgress(s, l.id);
    const g = p.game;
    const liveSessions = p.sessions.filter((t) => now - t < WEEK).length;
    const sessionsThisWeek = l.base.sessionsThisWeek + liveSessions;
    const lastActivity = p.lastActivity ?? now - l.base.daysSinceActive * DAY - 3 * 3_600_000;

    // Mix the demo accuracy with real first-try results from the game (word gates count too).
    const answers: Partial<Record<Skill, SkillStat>> = { ...p.answers };
    if (g.finale.gateTries > 0) {
      const v = answers.vocabulary ?? { tries: 0, firstTry: 0, hints: 0 };
      answers.vocabulary = { ...v, tries: v.tries + g.finale.gateTries, firstTry: v.firstTry + g.finale.gateCorrect };
    }
    const accuracy = {} as Record<Skill, number>;
    for (const sk of SKILLS) {
      const a = answers[sk];
      const w = l.base.answered;
      accuracy[sk] = a ? (l.base.accuracy[sk] * w + a.firstTry) / (w + a.tries) : l.base.accuracy[sk];
    }
    let helpSkill: Skill | null = null;
    for (const sk of SKILLS) if (helpSkill === null || accuracy[sk] < accuracy[helpSkill]) helpSkill = sk;
    const minAcc = helpSkill ? accuracy[helpSkill] : 1;
    if (minAcc >= HELP_THRESHOLD) helpSkill = null;

    const started = g.introSeen || Object.values(g.quests).some((q) => q.status !== 'locked');
    const hasRealPlay = live || l.id === 'L07';
    const activity: Activity | null =
      started && hasRealPlay
        ? {
            quests: QUEST_INFO.map((qi) => ({ ...qi, status: g.quests[qi.id].status, retries: g.quests[qi.id].attempts, hints: g.quests[qi.id].hints })),
            choice: g.choice,
            explain: g.explain,
            race: g.finale,
            upgrades: g.upgrades.length,
            words: g.words.length,
          }
        : null;

    const daysAway = (now - lastActivity) / DAY;
    const reasons: string[] = [];
    if (helpSkill) reasons.push(`${pct(minAcc)} right on first try in ${skillNames[helpSkill].toLowerCase()}`);
    if (sessionsThisWeek === 0) reasons.push('No sessions this week (goal: 2–3)');
    else if (sessionsThisWeek === 1) reasons.push('Only 1 session this week (goal: 2–3)');
    if (daysAway >= 5) reasons.push(`No activity for ${Math.floor(daysAway)} days`);
    if (g.explain === 'skipped') reasons.push('Skipped the explain-aloud step');

    const needScore =
      (helpSkill ? 0.3 + (HELP_THRESHOLD - minAcc) * 3 : 0) +
      (sessionsThisWeek === 0 ? 0.35 : sessionsThisWeek === 1 ? 0.1 : 0) +
      (daysAway >= 5 ? 0.15 : 0) +
      (g.explain === 'skipped' ? 0.1 : 0);

    const doneQuests = (['q1', 'q2', 'q3'] as QuestId[]).filter((q) => g.quests[q].status === 'done').length;
    const levelLabel = g.restored ? 'Level 1 done · plaza restored' : started ? `Level 1 · ${doneQuests}/3 quests` : 'Level 1 · not started';

    return {
      learner: l,
      band: bandFor(s, l.id),
      levelLabel,
      done: g.restored,
      sessionsThisWeek,
      lastActivity,
      accuracy,
      helpSkill,
      needScore,
      reasons,
      reviewedAt: s.reviewed[l.id] ?? null,
      live,
      activity,
    };
  });
}

export function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

export function timeAgo(t: number, now = Date.now()): string {
  const m = Math.floor((now - t) / 60_000);
  if (m < 2) return 'Just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'Yesterday' : `${d} days ago`;
}

export const choiceNames: Record<string, string> = {
  share: 'Shared the extra paper with Nonoy',
  keep: 'Kept the extra paper',
};

export const explainNames: Record<ExplainMode, string> = {
  recorded: 'Recorded on the device (audio not stored)',
  partner: 'Told a partner',
  skipped: 'Skipped',
};
