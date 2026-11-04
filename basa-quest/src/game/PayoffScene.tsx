// End of a level: kites fly, the place is restored, and the child sees what they did.
// Encouragement is built from the child's own actions. No scores, no comparisons.
import { useEffect } from 'react';
import { Bubble } from '../components/Common';
import { KiteShape, Ribbon } from '../components/Kite';
import { IconCheck, IconNotebook } from '../components/Icons';
import { SESSION_MINUTES } from '../config';
import { allWords, getLevel } from '../content';
import { ui } from '../content/ui';
import { useT } from '../lib/i18n';
import { sfx } from '../lib/sfx';
import { completeLevel, getProgress, levelProgress, useAppState } from '../lib/store';
import type { Bi, PayoffScene as Payoff, RibbonColor } from '../types';
import { PlazaArt } from '../screens/BarangayMap';
import { useSeen, type SceneCtx } from './shared';

export function PayoffScene({ scene, ctx, learnerId }: { scene: Payoff; ctx: SceneCtx; learnerId: string }) {
  const { t, lang } = useT();
  const s = useAppState();
  const p = getProgress(s, learnerId);
  const lp = levelProgress(p, ctx.level);
  const level = getLevel(ctx.level)!;
  const choiceLines = (lp.choice && scene.byChoice[lp.choice]) || Object.values(scene.byChoice)[0] || [];
  const ribbons = level.scenes.filter((sc) => sc.ribbon && lp.ribbons.includes(sc.id)).map((sc) => sc.ribbon as RibbonColor);
  const words = allWords.filter((w) => level.scenes.some((sc) => sc.kind === 'word' && sc.word.id === w.id) && p.words.includes(w.id));
  const longSession = s.sessionStart !== null && Date.now() - s.sessionStart >= SESSION_MINUTES * 60_000;
  useSeen(ctx.level, [...choiceLines, ...scene.lines]);

  useEffect(() => {
    completeLevel(ctx.level);
    sfx.whoosh();
    const id = window.setTimeout(() => sfx.restore(), 500);
    return () => window.clearTimeout(id);
  }, [ctx.level]);

  // Encouragement from what this child did.
  const praise: Bi[] = [];
  for (const sc of level.scenes) {
    const log = lp.log[sc.id];
    if (!log?.solved) continue;
    const key = log.attempts > 0 ? `${sc.id}-retry` : sc.id;
    if (scene.praise[key]) praise.push(scene.praise[key]);
  }
  if (lp.choice && scene.praise[`choice-${lp.choice}`]) praise.push(scene.praise[`choice-${lp.choice}`]);
  if (lp.explain && lp.explain !== 'skipped' && scene.praise[`explain-${lp.explain}`]) praise.push(scene.praise[`explain-${lp.explain}`]);

  return (
    <section className="scene-body payoff">
      <div className="sky" aria-hidden="true">
        <svg viewBox="0 0 320 180" className="sky-svg">
          <rect width="320" height="180" fill="var(--sky)" />
          <circle cx="270" cy="34" r="18" fill="#f6c445" />
          <path d="M0 150c50-10 100-10 160 0s110 10 160 0v30H0z" fill="#9fd0a0" />
          <g className="fly fly-a">
            <g transform="translate(130 70) rotate(-8)">
              <KiteShape ribbons={ribbons} />
            </g>
          </g>
          <g className="fly fly-b">
            <g transform="translate(205 88) rotate(10) scale(.85)">
              <KiteShape newspaper patch={lp.choice === 'give'} />
            </g>
          </g>
        </svg>
      </div>

      {choiceLines.map((line) => (
        <Bubble key={line.id} line={line} level={ctx.level} />
      ))}
      {scene.lines.map((line) => (
        <Bubble key={line.id} line={line} level={ctx.level} />
      ))}

      <div className="reward-card">
        <div className="reward-art" aria-hidden="true">
          <svg viewBox="0 0 120 90" width="120" height="90">
            <PlazaArt restored />
          </svg>
        </div>
        <div>
          <span className="reward-label">{t(ui.barangayPiece)}</span>
          <strong className="reward-title">{t(scene.reward)}</strong>
        </div>
      </div>

      <div className="collect-row">
        <div className="collect">
          <span className="muted small">{t(ui.ribbonsOnKite)}</span>
          <span className="ribbon-row">
            {ribbons.map((r, i) => (
              <Ribbon key={i} color={r} size={26} />
            ))}
          </span>
        </div>
        {words.length > 0 && (
          <div className="collect">
            <span className="muted small">{t(ui.wordsLearned)}</span>
            <span className="word-chip">
              <IconNotebook size={18} /> {words.map((w) => w.word[lang]).join(', ')}
            </span>
          </div>
        )}
      </div>

      {praise.length > 0 && (
        <div className="praise">
          <strong>{t(ui.youDid)}</strong>
          <ul>
            {praise.map((b, i) => (
              <li key={i} lang={lang}>
                <IconCheck size={18} /> {t(b)}
              </li>
            ))}
          </ul>
        </div>
      )}
      {longSession && <p className="card soft center">{t(ui.breakTime)}</p>}
      <p className="muted center tiny">{t(ui.saved)}</p>
    </section>
  );
}
