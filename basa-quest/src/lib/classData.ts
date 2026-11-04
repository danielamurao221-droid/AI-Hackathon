// Builds teacher-dashboard rows by combining the fixed demo class data with
// what learners actually did in the app on this device.
import { getLevel } from '../content';
import { demoLearners, skillNames, type DemoLearner } from '../data/demoClass';
import type { Band, Skill } from '../types';
import { bandFor, getProgress, levelProgress, type AppState, type ExplainMode, type SkillStat } from './store';

const DAY = 86_400_000;
const WEEK = 7 * DAY;
const HELP_THRESHOLD = 0.65; // below this first-try rate, a skill needs help
/** Score above which a learner counts as "may need extra help". */
export const NEED_CUTOFF = 0.3;
export const SKILLS: Skill[] = ['wordReading', 'vocabulary', 'details', 'explaining'];

/** Level 1 actions shown on the dashboard. Never includes audio. */
export interface Activity {
  /** Current scene (1-based) and total scenes. */
  scene: number;
  scenes: number;
  done: boolean;
  ribbons: number;
  hintsBySkill: Partial<Record<Skill, number>>;
  /** Wrong taps before the proof sentence was found; null if not reached yet. */
  proofTries: number | null;
  choice: string | null;
  explain: ExplainMode | null;
}

export interface Row {
  learner: DemoLearner;
  band: Band;
  levelLabel: string;
  level1Done: boolean;
  ribbons: number;
  sessionsThisWeek: number;
  lastActivity: number;
  accuracy: Record<Skill, number>;
  helpSkill: Skill | null;
  needScore: number;
  reasons: string[];
  reviewedAt: number | null;
  /** Logged in on this device during the demo. */
  live: boolean;
  /** In-app activity for Level 1, if there is any. */
  activity: Activity | null;
}

export function buildRows(s: AppState, now = Date.now()): Row[] {
  const lv1 = getLevel(1)!;
  return demoLearners.map((l) => {
    const live = !!s.progress[l.id];
    const p = getProgress(s, l.id);
    const lp = levelProgress(p, 1);
    const liveSessions = p.sessions.filter((t) => now - t < WEEK).length;
    const sessionsThisWeek = l.base.sessionsThisWeek + liveSessions;
    const lastActivity = p.lastActivity ?? now - l.base.daysSinceActive * DAY - 3 * 3_600_000;

    // Mix the demo accuracy with real first-try results from the app.
    const accuracy = {} as Record<Skill, number>;
    for (const sk of SKILLS) {
      const a: SkillStat | undefined = p.answers[sk];
      const w = l.base.answered;
      accuracy[sk] = a ? (l.base.accuracy[sk] * w + a.firstTry) / (w + a.tries) : l.base.accuracy[sk];
    }
    let helpSkill: Skill | null = null;
    for (const sk of SKILLS) if (helpSkill === null || accuracy[sk] < accuracy[helpSkill]) helpSkill = sk;
    const minAcc = helpSkill ? accuracy[helpSkill] : 1;
    if (minAcc >= HELP_THRESHOLD) helpSkill = null;

    const hasActivity = Object.keys(lp.log).length > 0;
    const activity: Activity | null = hasActivity
      ? {
          scene: Math.min(lp.scene + 1, lv1.scenes.length),
          scenes: lv1.scenes.length,
          done: lp.done,
          ribbons: lp.ribbons.length,
          hintsBySkill: Object.fromEntries(SKILLS.filter((sk) => p.answers[sk]).map((sk) => [sk, p.answers[sk]!.hints])),
          proofTries: lp.log.proof?.solved ? lp.log.proof.attempts : null,
          choice: lp.choice,
          explain: lp.explain,
        }
      : null;

    const daysAway = (now - lastActivity) / DAY;
    const reasons: string[] = [];
    if (helpSkill) reasons.push(`${pct(minAcc)} right on first try in ${skillNames[helpSkill].toLowerCase()}`);
    if (sessionsThisWeek === 0) reasons.push('No sessions this week (goal: 2–3)');
    else if (sessionsThisWeek === 1) reasons.push('Only 1 session this week (goal: 2–3)');
    if (daysAway >= 5) reasons.push(`No activity for ${Math.floor(daysAway)} days`);
    if (activity?.explain === 'skipped') reasons.push('Skipped the explain-aloud step');

    const needScore =
      (helpSkill ? 0.3 + (HELP_THRESHOLD - minAcc) * 3 : 0) +
      (sessionsThisWeek === 0 ? 0.35 : sessionsThisWeek === 1 ? 0.1 : 0) +
      (daysAway >= 5 ? 0.15 : 0) +
      (activity?.explain === 'skipped' ? 0.1 : 0);

    const levelLabel = lp.done
      ? 'Level 1 done'
      : activity
        ? `Level 1 · scene ${activity.scene}/${activity.scenes}`
        : 'Level 1';

    return {
      learner: l,
      band: bandFor(s, l.id),
      levelLabel,
      level1Done: lp.done,
      ribbons: lp.ribbons.length,
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
  give: 'Gave the extra paper to Nonoy',
  keep: 'Kept the extra paper',
};

export const explainNames: Record<ExplainMode, string> = {
  recorded: 'Recorded on the device (audio not stored)',
  partner: 'Told a partner',
  skipped: 'Skipped',
};
