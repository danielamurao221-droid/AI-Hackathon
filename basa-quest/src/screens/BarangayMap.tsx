// Home screen: an illustrated barangay. Finishing a level restores its place.
import { useEffect, useState } from 'react';
import { LangSwitch, MuteButton, Sheet, StorageNotice, useToast } from '../components/Common';
import { Character } from '../components/Character';
import { IconLock, IconNotebook, IconTrophy } from '../components/Icons';
import { KiteShape, Ribbon } from '../components/Kite';
import { TOTAL_LEVELS } from '../config';
import { allWords, getLevel } from '../content';
import { places, type Place } from '../content/barangay';
import { ui } from '../content/ui';
import { findLearner } from '../data/demoClass';
import { useT } from '../lib/i18n';
import { sfx } from '../lib/sfx';
import { getProgress, levelProgress, logout, markRestoreSeen, openLevel, totalRibbons, useAppState } from '../lib/store';

export function BarangayMap() {
  const s = useAppState();
  const { t, tx, lang } = useT();
  const learner = findLearner(s.learnerId)!;
  const p = getProgress(s, learner.id);
  const lv1 = getLevel(1)!;
  const lp = levelProgress(p, 1);
  const restored = lp.done;
  const [restoring, setRestoring] = useState(false);
  const [notebookOpen, setNotebookOpen] = useState(false);
  const [toast, showToast] = useToast();
  const inProgress = !lp.done && (lp.scene > 0 || Object.keys(lp.log).length > 0);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Play the "plaza restored" moment once, the first time the map opens after Level 1.
  useEffect(() => {
    if (!lp.done || lp.restoreSeen) return;
    setRestoring(true);
    sfx.restore();
    showToast(t(ui.plazaRestored));
    const id = window.setTimeout(() => {
      setRestoring(false);
      markRestoreSeen(1);
    }, 2600);
    return () => window.clearTimeout(id);
  }, [lp.done, lp.restoreSeen]);

  function tapPlace(pl: Place) {
    if (pl.level) {
      sfx.tap();
      openLevel(pl.level);
      return;
    }
    if (pl.locked) {
      sfx.hint();
      showToast(t(ui.lockedPlace, { place: t(pl.name) }));
      return;
    }
    sfx.tap();
    if (pl.who && pl.greeting)
      showToast(
        <span className="toast-who">
          <Character who={pl.who} mood="happy" size={36} />
          <span>{t(pl.greeting)}</span>
        </span>,
      );
  }

  return (
    <main className="screen map-screen">
      <header className="topbar">
        <span className="avatar" style={{ background: learner.color }} aria-hidden="true">
          {learner.name.slice(-2)}
        </span>
        <div className="topbar-title">
          <div className="small-strong">{t(ui.hi, { name: learner.name })}</div>
          <div className="star-total">
            <Ribbon color="coral" size={18} /> {totalRibbons(p)} {t(ui.ribbons)}
          </div>
        </div>
        <LangSwitch />
      </header>

      <div className="map-tools">
        <div className="goal" aria-label={`${t(ui.levelOf, { n: 1, m: TOTAL_LEVELS })}. ${t(ui.trophyGoal)}`}>
          <span className="goal-label">{t(ui.levelOf, { n: 1, m: TOTAL_LEVELS })}</span>
          <span className="goal-track" aria-hidden="true">
            <span className="goal-fill" style={{ width: `${(restored ? 1 : 0.4) * (100 / TOTAL_LEVELS) + 1}%` }} />
          </span>
          <IconTrophy size={26} />
        </div>
        <button type="button" className="icon-btn" onClick={() => setNotebookOpen(true)} aria-label={t(ui.notebook)} title={t(ui.notebook)}>
          <IconNotebook />
        </button>
        <MuteButton />
      </div>
      <StorageNotice />

      <h1 className="map-title">{t(ui.mapTitle)}</h1>
      <div className={`barangay ${restored ? 'is-restored' : ''} ${restoring ? 'restoring' : ''}`}>
        <svg viewBox="0 0 360 460" className="barangay-art" aria-hidden="true">
          <BarangayArt restored={restored} />
        </svg>
        {places.map((pl) => (
          <button
            key={pl.id}
            type="button"
            className={`place ${pl.locked ? 'locked' : ''} ${pl.level ? 'quest' : ''}`}
            style={{ left: `${pl.x}%`, top: `${pl.y}%` }}
            onClick={() => tapPlace(pl)}
            data-place={pl.id}
            aria-label={pl.locked ? `${t(pl.name)}: ${t(ui.comingSoon)}` : t(pl.name)}
          >
            {pl.locked && (
              <span className="place-lock">
                <IconLock size={16} />
              </span>
            )}
            <span className="place-name" lang={lang}>
              {pl.locked ? t(ui.comingSoon) : t(pl.name)}
            </span>
          </button>
        ))}
      </div>

      <section className={`quest-card ${restored ? 'done' : ''}`}>
        <Character who="tala" mood={restored ? 'happy' : inProgress ? 'think' : 'wow'} size={60} />
        <div className="quest-text">
          <span className="tiny muted">{t(ui.levelOf, { n: 1, m: TOTAL_LEVELS })}</span>
          <strong>{t(lv1.title)}</strong>
          <p lang={lang}>{restored ? t(ui.questDone) : tx(lv1.quest)}</p>
          {inProgress && <span className="tiny muted">{t(ui.sceneOf, { n: Math.min(lp.scene + 1, lv1.scenes.length), m: lv1.scenes.length })}</span>}
        </div>
        <button
          type="button"
          className={`btn btn-block ${restored ? 'btn-soft' : 'btn-primary'}`}
          onClick={() => {
            sfx.tap();
            openLevel(1);
          }}
        >
          {restored ? t(ui.playAgain) : inProgress ? t(ui.continue) : t(ui.play)}
        </button>
      </section>
      <p className="next-soon">
        <IconLock size={16} /> {t(ui.nextLevelSoon)}
      </p>

      <div className="map-footer">
        <button type="button" className="btn btn-ghost" onClick={logout}>
          {t(ui.logout)}
        </button>
      </div>

      {toast}
      {notebookOpen && (
        <Sheet title={t(ui.notebook)} onClose={() => setNotebookOpen(false)}>
          {p.words.length === 0 ? (
            <p className="muted">{t(ui.notebookEmpty)}</p>
          ) : (
            <ul className="notebook">
              {allWords
                .filter((w) => p.words.includes(w.id))
                .map((w) => (
                  <li key={w.id} lang={lang}>
                    <p className="word-big">
                      {w.word[lang]} <span className="word-alt">· {w.word[lang === 'fil' ? 'en' : 'fil']}</span>
                    </p>
                    <p>
                      <strong>{t(ui.meaning)}:</strong> {t(w.meaning)}
                    </p>
                    <p className="muted">{t(w.example)}</p>
                  </li>
                ))}
            </ul>
          )}
        </Sheet>
      )}
    </main>
  );
}

/** The plaza: faded until restored. Also used on the level reward card. */
export function PlazaArt({ restored }: { restored: boolean }) {
  return (
    <g className={`plaza-art ${restored ? 'on' : 'off'}`}>
      <rect x="6" y="20" width="108" height="64" rx="8" fill="#f1dfb8" stroke="#d9c08e" strokeWidth="2" />
      <path d="M6 52h108M60 20v64" stroke="#e6cf9f" strokeWidth="2" />
      {/* stage */}
      <rect x="40" y="10" width="40" height="18" rx="3" fill="#e86f51" />
      <path d="M36 10 60 0 84 10z" fill="#2f9c8a" />
      {/* benches + plants */}
      <rect x="14" y="62" width="22" height="6" rx="2" fill="#8a5a36" />
      <rect x="84" y="62" width="22" height="6" rx="2" fill="#8a5a36" />
      <circle cx="16" cy="30" r="7" fill="#4cb87a" />
      <circle cx="104" cy="30" r="7" fill="#4cb87a" />
      <circle cx="16" cy="28" r="2.2" fill="#e98fb0" />
      <circle cx="104" cy="28" r="2.2" fill="#f2b33d" />
      {/* bunting */}
      <g className="bunting">
        <path d="M8 18q52 16 104 0" stroke="#6b4b2f" strokeWidth="1" fill="none" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const x = 14 + i * 13;
          const y = 18 + Math.sin((i / 7) * Math.PI) * 7;
          const c = ['#e86f51', '#f2b33d', '#2f9c8a', '#5b7fd6'][i % 4];
          return <path key={i} d={`M${x - 5} ${y}h10l-5 8z`} fill={c} />;
        })}
      </g>
    </g>
  );
}

function House({ x, y, roof, wall = '#fff4dd', w = 44 }: { x: number; y: number; roof: string; wall?: string; w?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-w / 2} y="-8" width={w} height="26" rx="2" fill={wall} stroke="#c9b48a" />
      <path d={`M${-w / 2 - 5} -8 0 ${-26} ${w / 2 + 5} -8z`} fill={roof} />
      <rect x="-5" y="4" width="10" height="14" fill="#8a5a36" />
      <rect x={w / 2 - 14} y="-2" width="8" height="8" fill="#cfe9f0" />
    </g>
  );
}

function Locked({ x, y, kind }: { x: number; y: number; kind: 'school' | 'market' | 'court' | 'library' }) {
  return (
    <g transform={`translate(${x} ${y})`} className="locked-place">
      {kind === 'court' ? (
        <>
          <rect x="-30" y="-18" width="60" height="38" rx="3" fill="#cfcabf" />
          <circle cx="0" cy="1" r="8" fill="none" stroke="#f4f1ea" strokeWidth="2" />
          <path d="M0 -18v38" stroke="#f4f1ea" strokeWidth="2" />
        </>
      ) : (
        <>
          <rect x="-28" y="-10" width="56" height="28" rx="2" fill="#d8d3c8" />
          <path d="M-33 -10 0 -30 33 -10z" fill="#bdb6a8" />
          <rect x="-6" y="4" width="12" height="14" fill="#a8a194" />
          {kind === 'school' && <path d="M0 -30v-10h10v6h-10" fill="#bdb6a8" stroke="#a8a194" />}
          {kind === 'market' && <path d="M-28 -10h56v6h-56z" fill="#c4bdaf" />}
          {kind === 'library' && <path d="M-18 -4h10v8h-10zM8 -4h10v8H8z" fill="#c4bdaf" />}
        </>
      )}
    </g>
  );
}

function BarangayArt({ restored }: { restored: boolean }) {
  return (
    <g>
      <rect width="360" height="460" fill="var(--grass)" />
      {/* sea */}
      <path d="M0 0h360v54c-30 8-60 8-90 0s-60-8-90 0-60 8-90 0-60-8-90 0z" fill="#9fd0df" />
      <path d="M20 22q10-6 20 0M90 32q10-6 20 0M220 18q10-6 20 0M300 30q10-6 20 0" stroke="#e8f6fa" strokeWidth="2" fill="none" />
      {/* roads */}
      <path d="M0 220h360M180 70v390M60 340h240" stroke="var(--road)" strokeWidth="18" strokeLinecap="round" />
      {/* palms + trees */}
      <circle cx="320" cy="390" r="14" fill="#4cb87a" />
      <circle cx="30" cy="140" r="12" fill="#4cb87a" />
      <circle cx="340" cy="150" r="11" fill="#4cb87a" />
      <circle cx="120" cy="420" r="10" fill="#4cb87a" />
      {/* locked future places */}
      <Locked x={79} y={98} kind="school" />
      <Locked x={281} y={98} kind="market" />
      <Locked x={306} y={210} kind="court" />
      <Locked x={180} y={415} kind="library" />
      {/* neighbours */}
      <House x={54} y={212} roof="#2f9c8a" />
      <House x={90} y={334} roof="#e86f51" />
      <g transform="translate(274 334)">
        <rect x="-30" y="-8" width="60" height="26" rx="2" fill="#e8d2ad" stroke="#b8935a" />
        <path d="M-35 -8 0 -26 35 -8z" fill="#8a5a36" />
        <rect x="-12" y="2" width="24" height="16" fill="#6b4b2f" />
        <rect x="18" y="8" width="16" height="3" rx="1" fill="#c9a86a" transform="rotate(-20 18 8)" />
      </g>
      {/* plaza */}
      <g transform="translate(120 175)">
        <PlazaArt restored={restored} />
      </g>
      {restored && (
        <g className="map-kites">
          <g transform="translate(150 140) scale(.55)" className="map-kite a">
            <KiteShape ribbons={['sun', 'teal', 'coral', 'violet']} />
          </g>
          <g transform="translate(215 150) scale(.45)" className="map-kite b">
            <KiteShape newspaper />
          </g>
        </g>
      )}
    </g>
  );
}
