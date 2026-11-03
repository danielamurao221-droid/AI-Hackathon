import { useEffect, useRef, useState } from 'react';
import { PLAYABLE_LEVELS, TOTAL_LEVELS } from '../config';
import { ui } from '../content/story';
import { LangSwitch, Stars, StorageNotice } from '../components/Common';
import { IconLock, IconStar, IconTrophy } from '../components/Icons';
import { findLearner } from '../data/demoClass';
import { useT } from '../lib/i18n';
import { getProgress, isUnlocked, logout, openLevel, starCount, useAppState } from '../lib/store';

const ROW = 96; // px per level on the path
const X = [50, 72, 80, 66, 44, 26, 20, 34]; // winding path, in % of width

export function LevelMap() {
  const s = useAppState();
  const { t } = useT();
  const learner = findLearner(s.learnerId)!;
  const p = getProgress(s, learner.id);
  const [toast, setToast] = useState<string | null>(null);
  const listRef = useRef<HTMLOListElement>(null);

  const totalStars = Object.values(p.levels).reduce((sum, lp) => sum + starCount(lp), 0);
  let current = 1;
  for (let n = 1; n <= PLAYABLE_LEVELS; n++) if (isUnlocked(p, n)) current = n;

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-level="${current}"]`);
    el?.scrollIntoView({ block: 'center' });
  }, [current]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(id);
  }, [toast]);

  function tap(n: number) {
    if (isUnlocked(p, n)) {
      openLevel(n);
      return;
    }
    setToast(n <= PLAYABLE_LEVELS ? t(ui.lockedFinish, { n: n - 1 }) : t(ui.lockedSoon));
  }

  const levels = Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1);
  const height = TOTAL_LEVELS * ROW + ROW;
  const points = levels.map((n) => `${X[(n - 1) % X.length]},${(n - 1) * ROW + ROW / 2}`).join(' ');

  return (
    <main className="screen map">
      <header className="topbar sticky">
        <span className="avatar" style={{ background: learner.color }} aria-hidden="true">{learner.name.slice(-2)}</span>
        <div className="topbar-title">
          <div className="small-strong">{t(ui.hi, { name: learner.name })}</div>
          <div className="star-total"><IconStar size={18} /> {totalStars} {t(ui.stars)}</div>
        </div>
        <LangSwitch />
      </header>
      <h1 className="map-title">{t(ui.mapTitle)}</h1>
      <StorageNotice />

      <div className="path" style={{ height }}>
        <svg className="path-line" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden="true">
          <polyline points={points} vectorEffect="non-scaling-stroke" />
        </svg>
        <ol ref={listRef} className="path-list">
          {levels.map((n) => {
            const open = isUnlocked(p, n);
            const lp = p.levels[n];
            const done = !!lp?.completed;
            const isCurrent = open && !done;
            return (
              <li
                key={n}
                data-level={n}
                className="node-wrap"
                style={{ top: (n - 1) * ROW, left: `${X[(n - 1) % X.length]}%` }}
              >
                <button
                  type="button"
                  className={`node ${open ? 'open' : 'locked'} ${done ? 'done' : ''} ${isCurrent ? 'current' : ''}`}
                  onClick={() => tap(n)}
                  aria-disabled={!open}
                  aria-label={`${t(ui.level)} ${n}${open ? '' : ' 🔒'}`}
                >
                  {open ? <span className="node-num">{n}</span> : <><IconLock size={18} /><span className="node-num-sm">{n}</span></>}
                </button>
                {(done || starCount(lp) > 0) && <Stars count={starCount(lp)} size={18} />}
              </li>
            );
          })}
          <li className="node-wrap" style={{ top: TOTAL_LEVELS * ROW - 6, left: '50%' }}>
            <div className="trophy" aria-label={t(ui.trophy)} title={t(ui.trophy)}>
              <IconTrophy size={56} />
            </div>
          </li>
        </ol>
      </div>

      {toast && <div className="toast" role="status">{toast}</div>}

      <div className="map-footer">
        <button type="button" className="btn btn-ghost" onClick={logout}>{t(ui.logout)}</button>
      </div>
    </main>
  );
}
