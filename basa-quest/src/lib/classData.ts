// Builds teacher-dashboard rows by combining the fixed demo class data with
// anything learners did in the app on this device.
import { PLAYABLE_LEVELS } from '../config';
import { demoLearners, skillNames, type DemoLearner } from '../data/demoClass';
import type { Band, Skill } from '../types';
import { bandFor, getProgress, levelsDone, starCount, type AppState } from './store';

const DAY = 86_400_000;
const WEEK = 7 * DAY;
const HELP_THRESHOLD = 0.65; // below this first-try rate, a skill needs help
/** Score above which a learner counts as "may need extra help". */
export const NEED_CUTOFF = 0.3;
export const SKILLS: Skill[] = ['wordReading', 'vocabulary', 'details', 'explaining'];

export interface Row {
  learner: DemoLearner;
  band: Band;
  levelsDone: number;
  /** Level the learner is on now (PLAYABLE_LEVELS + 1 means all done). */
  currentLevel: number;
  stars: number;
  starsByLevel: number[];
  sessionsThisWeek: number;
  lastActivity: number;
  accuracy: Record<Skill, number>;
  helpSkill: Skill | null;
  needScore: number;
  reasons: string[];
  reviewedAt: number | null;
  live: boolean; // has played on this device
}

export function buildRows(s: AppState, now = Date.now()): Row[] {
  return demoLearners.map((l) => {
    const live = !!s.progress[l.id];
    const p = getProgress(s, l.id);
    const done = levelsDone(p);
    const liveSessions = p.sessions.filter((t) => now - t < WEEK).length;
    const sessionsThisWeek = l.base.sessionsThisWeek + liveSessions;
    const lastActivity = p.lastActivity ?? now - l.base.daysSinceActive * DAY - 3 * 3_600_000;

    // Mix the demo accuracy with real answers given in the app.
    const accuracy = {} as Record<Skill, number>;
    for (const sk of SKILLS) {
      const a = p.answers[sk];
      const w = l.base.answered;
      accuracy[sk] = a ? (l.base.accuracy[sk] * w + a.firstTry) / (w + a.tries) : l.base.accuracy[sk];
    }
    let helpSkill: Skill | null = null;
    for (const sk of SKILLS) if (helpSkill === null || accuracy[sk] < accuracy[helpSkill]) helpSkill = sk;
    const minAcc = helpSkill ? accuracy[helpSkill] : 1;
    if (minAcc >= HELP_THRESHOLD) helpSkill = null;

    const daysAway = (now - lastActivity) / DAY;
    const reasons: string[] = [];
    if (helpSkill) {
      reasons.push(
        helpSkill === 'wordReading'
          ? `Read-aloud check score: ${pct(minAcc)} (word reading)`
          : `${pct(minAcc)} right on first try in ${skillNames[helpSkill].toLowerCase()} questions`,
      );
    }
    if (sessionsThisWeek === 0) reasons.push('No sessions this week (goal: 2–3)');
    else if (sessionsThisWeek === 1) reasons.push('Only 1 session this week (goal: 2–3)');
    if (daysAway >= 5) reasons.push(`No activity for ${Math.floor(daysAway)} days`);

    const needScore =
      (helpSkill ? 0.3 + (HELP_THRESHOLD - minAcc) * 3 : 0) + (sessionsThisWeek === 0 ? 0.35 : sessionsThisWeek === 1 ? 0.1 : 0) + (daysAway >= 5 ? 0.15 : 0);

    return {
      learner: l,
      band: bandFor(s, l.id),
      levelsDone: done,
      currentLevel: Math.min(done + 1, PLAYABLE_LEVELS + 1),
      stars: Object.values(p.levels).reduce((n, lp) => n + starCount(lp), 0),
      starsByLevel: Array.from({ length: PLAYABLE_LEVELS }, (_, i) => starCount(p.levels[i + 1])),
      sessionsThisWeek,
      lastActivity,
      accuracy,
      helpSkill,
      needScore,
      reasons,
      reviewedAt: s.reviewed[l.id] ?? null,
      live,
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

export function levelLabel(r: Row): string {
  return r.currentLevel > PLAYABLE_LEVELS ? `All ${PLAYABLE_LEVELS} done` : `Level ${r.currentLevel}`;
}
