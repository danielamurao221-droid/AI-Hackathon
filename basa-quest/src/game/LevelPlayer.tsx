// Runs one level: a header with ribbons, "Balikan ang kuwento" and sound, then the
// current scene. The "Next" button only appears after the scene is solved.
import { useEffect, useState } from 'react';
import { Bubble, LangSwitch, MuteButton, Sheet } from '../components/Common';
import { IconBack, IconBook, IconNext } from '../components/Icons';
import { Ribbon } from '../components/Kite';
import { getLevel, sceneLines } from '../content';
import { ui } from '../content/ui';
import { useT } from '../lib/i18n';
import { sfx } from '../lib/sfx';
import { closeLevel, getProgress, levelProgress, nextScene, solveScene, useAppState } from '../lib/store';
import type { Level, RibbonColor, Scene } from '../types';
import { BuildScene } from './BuildScene';
import { DecideScene } from './DecideScene';
import { ExplainScene } from './ExplainScene';
import { OrderScene } from './OrderScene';
import { PayoffScene } from './PayoffScene';
import { PickScene } from './PickScene';
import { ProofScene } from './ProofScene';
import { WordScene } from './WordScene';
import type { SceneCtx } from './shared';

export function LevelPlayer({ level }: { level: number }) {
  const s = useAppState();
  const { t } = useT();
  const lv = getLevel(level);
  const [storyOpen, setStoryOpen] = useState(false);
  const [ribbonFx, setRibbonFx] = useState<RibbonColor | null>(null);

  useEffect(() => {
    if (!ribbonFx) return;
    const id = window.setTimeout(() => setRibbonFx(null), 1700);
    return () => window.clearTimeout(id);
  }, [ribbonFx]);

  if (!lv || !s.learnerId) {
    return (
      <main className="screen">
        <button type="button" className="btn btn-primary" onClick={closeLevel}>
          {t(ui.backToMap)}
        </button>
      </main>
    );
  }
  const learnerId = s.learnerId;
  const lp = levelProgress(getProgress(s, learnerId), level);
  const idx = Math.min(Math.max(lp.scene, 0), lv.scenes.length - 1);
  const scene = lv.scenes[idx];
  const ribbonTotal = lv.scenes.filter((sc) => sc.ribbon).length;

  return (
    <main className="screen level">
      <header className="topbar">
        <button type="button" className="icon-btn" onClick={closeLevel} aria-label={t(ui.backToMap)}>
          <IconBack />
        </button>
        <div className="topbar-title">
          <span className="tiny muted">{t(ui.levelOf, { n: level, m: 100 })}</span>
          <span className="level-name">{t(lv.title)}</span>
        </div>
        <LangSwitch />
      </header>

      <div className="hud">
        <ol className="scene-dots" aria-label={t(ui.sceneOf, { n: idx + 1, m: lv.scenes.length })}>
          {lv.scenes.map((sc, i) => (
            <li key={sc.id} className={i < idx ? 'past' : i === idx ? 'now' : ''} />
          ))}
        </ol>
        <span className={`hud-ribbons ${ribbonFx ? 'bump' : ''}`} aria-label={`${lp.ribbons.length} / ${ribbonTotal} ${t(ui.ribbons)}`}>
          <Ribbon color="coral" size={22} />
          <b>{lp.ribbons.length}</b>/{ribbonTotal}
        </span>
        <button type="button" className="icon-btn" onClick={() => setStoryOpen(true)} aria-label={t(ui.lookBack)} title={t(ui.lookBack)}>
          <IconBook />
        </button>
        <MuteButton />
      </div>

      <SceneHost
        key={`${idx}-${scene.id}`}
        lv={lv}
        scene={scene}
        learnerId={learnerId}
        onRibbon={(c) => {
          setRibbonFx(c);
          window.setTimeout(() => sfx.ribbon(), 180);
        }}
      />

      {ribbonFx && (
        <div className="ribbon-fx" role="status">
          <Ribbon color={ribbonFx} size={56} />
          <strong>{t(ui.ribbonGot)}</strong>
        </div>
      )}

      {storyOpen && (
        <Sheet title={t(ui.lookBack)} onClose={() => setStoryOpen(false)}>
          <StorySoFar lv={lv} clues={lp.clues} />
        </Sheet>
      )}
    </main>
  );
}

function SceneHost({ lv, scene, learnerId, onRibbon }: { lv: Level; scene: Scene; learnerId: string; onRibbon: (c: RibbonColor) => void }) {
  const { t } = useT();
  const [solved, setSolved] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const ctx: SceneCtx = {
    level: lv.level,
    solved,
    onSolved: (attempts) => {
      if (solved) return;
      setSolved(true);
      solveScene(lv.level, scene.id, scene.skill, attempts, !!scene.ribbon);
      if (scene.ribbon) onRibbon(scene.ribbon);
    },
  };

  return (
    <div className="scene" data-scene={scene.id}>
      <h1 className="scene-title">{t(scene.title)}</h1>
      {scene.kind === 'pick' && <PickScene scene={scene} ctx={ctx} />}
      {scene.kind === 'build' && <BuildScene scene={scene} ctx={ctx} />}
      {scene.kind === 'proof' && <ProofScene scene={scene} ctx={ctx} />}
      {scene.kind === 'order' && <OrderScene scene={scene} ctx={ctx} />}
      {scene.kind === 'word' && <WordScene scene={scene} ctx={ctx} />}
      {scene.kind === 'explain' && <ExplainScene scene={scene} ctx={ctx} learnerId={learnerId} />}
      {scene.kind === 'decide' && <DecideScene scene={scene} ctx={ctx} learnerId={learnerId} />}
      {scene.kind === 'payoff' && <PayoffScene scene={scene} ctx={ctx} learnerId={learnerId} />}

      {scene.kind === 'payoff' ? (
        <button
          type="button"
          className="btn btn-primary btn-block next-btn"
          onClick={() => {
            sfx.tap();
            closeLevel();
          }}
        >
          {t(ui.backToMap)}
        </button>
      ) : (
        solved && (
          <button
            type="button"
            className="btn btn-primary btn-block next-btn"
            onClick={() => {
              sfx.tap();
              nextScene(lv.level);
            }}
          >
            <span>{t(ui.next)}</span> <IconNext />
          </button>
        )
      )}
    </div>
  );
}

/** "Balikan ang kuwento": every clue the child has seen so far, in story order. */
function StorySoFar({ lv, clues }: { lv: Level; clues: string[] }) {
  const { t, band } = useT();
  const groups = lv.scenes
    .map((sc) => ({ sc, lines: sceneLines(sc, band).filter((l) => clues.includes(l.id)) }))
    .filter((g) => g.lines.length > 0);
  if (groups.length === 0) return <p className="muted">{t(ui.lookBackEmpty)}</p>;
  return (
    <div className="story-so-far">
      {groups.map(({ sc, lines }) => (
        <section key={sc.id}>
          <h3>{t(sc.title)}</h3>
          {lines.map((l) => (
            <Bubble key={l.id} line={l} level={lv.level} inBandFolder={sc.kind === 'proof' && l.id.startsWith('proof-p')} />
          ))}
        </section>
      ))}
    </div>
  );
}
