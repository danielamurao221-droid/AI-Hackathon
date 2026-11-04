// The student game screen. Phaser draws the world and the race; React shows every piece of
// text (speech, notes, notebooks, panels), so switching language never restarts the game.
// This file (and Phaser) is loaded lazily, only after a student logs in.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type Phaser from 'phaser';
import { Bubble, LangSwitch, MuteButton, RichText, StorageNotice } from '../components/Common';
import { IconBook, IconNext, IconNotebook } from '../components/Icons';
import { Ribbon } from '../components/Kite';
import { RACE_TARGET, SESSION_MINUTES, TOTAL_LEVELS } from '../config';
import { q2Build, story, words } from '../content/adventure';
import { ui, upgradeText } from '../content/ui';
import { findLearner } from '../data/demoClass';
import { useT } from '../lib/i18n';
import { playMusic, stopMusic } from '../lib/music';
import { sfx } from '../lib/sfx';
import { addToNotebook, currentGame, setScreen, useAppState } from '../lib/store';
import type { Bi, Line } from '../types';
import { bus, input, type NearInfo } from './bus';
import { ActionButton, Joystick } from './Controls';
import { finishQ2, interact, introSteps, type Step } from './director';
import { createGame, showMode } from './game';
import { BagSheet, ItemIcon, LevelGoal, QuestNotebook, WordNotebook } from './Notebooks';
import { BuildPanel } from './panels/BuildPanel';
import { ChoicePanel, HintLine, ProofPanel, RaceIntroPanel, SobraPanel } from './panels/QuestPanels';

type Toast = { text: Bi; vars?: Record<string, Bi> } | null;

export default function GameHost() {
  const s = useAppState();
  const { t } = useT();
  const learner = findLearner(s.learnerId)!;
  const g = currentGame(s);
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [near, setNear] = useState<NearInfo | null>(null);
  const [queue, setQueue] = useState<Step[]>([]);
  const [sheet, setSheet] = useState<'quests' | 'words' | 'bag' | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const autoStart = useRef(false);
  const [race, setRace] = useState<RaceUI>({ stage: 'intro', h: 0, strength: 2, max: 2 });

  const showToast = (tt: Toast) => {
    window.clearTimeout(toastTimer.current);
    setToast(tt);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  };

  // Start Phaser once.
  useEffect(() => {
    const game = createGame(hostRef.current!, s.screen);
    gameRef.current = game;
    return () => {
      game.destroy(true);
      gameRef.current = null;
      input.paused = false;
      stopMusic();
    };
  }, []);

  // World <-> race.
  useEffect(() => {
    if (gameRef.current) showMode(gameRef.current, s.screen);
    setNear(null);
    if (s.screen === 'race') {
      setRace((r) => ({ ...r, stage: autoStart.current ? 'flying' : 'intro', result: undefined, gate: undefined }));
      playMusic('race');
    } else playMusic('world');
  }, [s.screen]);

  // Messages from Phaser.
  useEffect(() => {
    const offs = [
      bus.on('near', (p) => setNear((p as NearInfo) ?? null)),
      bus.on('interact', (id) => {
        const r = interact(id as string);
        if (r.fx) bus.emit('fx', r.fx);
        if (r.toast) showToast(r.toast);
        if (r.steps?.length) setQueue((q) => [...q, ...r.steps!]);
      }),
      bus.on('sparkle', () => showToast({ text: ui.sparkle })),
      bus.on('restored', () => {
        playMusic('win');
        setQueue((q) => [...q, { t: 'line', line: story.plazaRestored }]);
      }),
      bus.on('world:ready', () => {
        if (!currentGame().introSeen) setQueue((q) => (q.length ? q : introSteps()));
      }),
      bus.on('race:ready', () => {
        if (autoStart.current) {
          autoStart.current = false;
          bus.emit('race:start');
          setRace((r) => ({ ...r, stage: 'flying' }));
        }
      }),
      bus.on('race:hud', (p) => {
        const d = p as { h: number; strength: number; max: number };
        setRace((r) => ({ ...r, h: d.h, strength: d.strength, max: d.max }));
      }),
      bus.on('race:gate', (p) => setRace((r) => ({ ...r, stage: 'gate', gate: p as RaceUI['gate'] }))),
      bus.on('race:gateResult', (p) => {
        const ok = (p as { ok: boolean }).ok;
        setRace((r) => ({ ...r, gateOk: ok, gate: undefined }));
        window.setTimeout(() => setRace((r) => ({ ...r, gateOk: undefined })), 1800);
      }),
      bus.on('race:warn', () => {
        setRace((r) => ({ ...r, warn: true }));
        window.setTimeout(() => setRace((r) => ({ ...r, warn: false })), 3200);
      }),
      bus.on('race:end', (p) => {
        const d = p as { result: 'win' | 'crash' | 'low'; h: number };
        if (d.result === 'win') playMusic('win');
        setRace((r) => ({ ...r, stage: 'end', result: d.result, h: d.h, gate: undefined }));
      }),
    ];
    return () => offs.forEach((o) => o());
  }, []);

  // A gentle "time for a break" note after about 10 minutes (no timer is ever shown).
  useEffect(() => {
    const id = window.setInterval(() => {
      const start = s.sessionStart;
      if (start && Date.now() - start >= SESSION_MINUTES * 60_000) {
        window.clearInterval(id);
        showToast({ text: ui.breakTime });
      }
    }, 30_000);
    return () => window.clearInterval(id);
  }, [s.sessionStart]);

  // Run silent "do" steps, and save shown lines to the Quest Notebook.
  const step = queue[0];
  useEffect(() => {
    if (!step) return;
    if (step.t === 'do') {
      step.fn();
      setQueue((q) => q.slice(1));
    } else if (step.t === 'line' || step.t === 'hint') addToNotebook([step.line.id]);
    else if (step.t === 'note') addToNotebook(step.lines.map((l) => l.id));
    else if (step.t === 'reward') {
      sfx.ribbon();
      bus.emit('fx', 'celebrate');
    }
  }, [step]);

  input.paused = !!step || sheet !== null || s.screen === 'race';
  const overlayOpen = !!step || sheet !== null;
  useEffect(() => {
    document.body.classList.toggle('overlay-open', overlayOpen);
    return () => document.body.classList.remove('overlay-open');
  }, [overlayOpen]);
  const next = (extra: Step[] = []) => setQueue((q) => [...extra, ...q.slice(1)]);

  return (
    <main className="game-screen" data-screen={s.screen}>
      <header className="game-hud">
        <span className="avatar avatar-sm" style={{ background: learner.color }} aria-hidden="true">
          {learner.name.slice(-2)}
        </span>
        {s.screen === 'world' ? (
          <>
            <button type="button" className="icon-btn" onClick={() => setSheet('quests')} aria-label={t(ui.questNotebook)} title={t(ui.questNotebook)} data-testid="open-quests">
              <IconBook />
            </button>
            <button type="button" className="icon-btn" onClick={() => setSheet('words')} aria-label={t(ui.wordNotebook)} title={t(ui.wordNotebook)} data-testid="open-words">
              <IconNotebook />
            </button>
            <button type="button" className="icon-btn bag-btn" onClick={() => setSheet('bag')} aria-label={`${t(ui.bag)}: ${g.bag.length}`} title={t(ui.bag)} data-testid="open-bag">
              <BagIcon />
              {g.bag.length > 0 && <span className="badge">{g.bag.length}</span>}
            </button>
          </>
        ) : (
          <RaceMeter h={race.h} strength={race.strength} max={race.max} />
        )}
        <span className="grow" />
        <MuteButton />
        <LangSwitch compact />
      </header>

      <div className="game-stage">
        <div ref={hostRef} className="phaser-host" aria-label="Basa Quest" />
        <StorageNotice />
        {s.screen === 'world' && g.bag.length > 0 && (
          <div className="bag-strip" aria-hidden="true">
            {g.bag.map((id) => (
              <ItemIcon key={id} id={id} size={28} />
            ))}
          </div>
        )}
        {toast && (
          <div className="toast" role="status">
            {fill(t(toast.text), toast.vars, t)}
          </div>
        )}

        {s.screen === 'race' && (
          <RaceOverlay
            race={race}
            onStart={() => {
              bus.emit('race:start');
              setRace((r) => ({ ...r, stage: 'flying' }));
            }}
            onGo={() => {
              bus.emit('race:go');
              setRace((r) => ({ ...r, stage: 'flying' }));
            }}
            onRetry={() => {
              autoStart.current = true;
              setRace((r) => ({ ...r, stage: 'flying', result: undefined, h: 0 }));
              bus.emit('race:retry');
            }}
            onBack={() => setScreen('world')}
          />
        )}

        {/* Controls */}
        <div className="controls">
          <Joystick horizontalOnly={s.screen === 'race'} />
          {s.screen === 'world' && <ActionButton near={near} />}
        </div>
      </div>

      {step && step.t !== 'do' && (
        <StepView
          step={step}
          learnerId={learner.id}
          onNext={() => {
            sfx.tap();
            next();
          }}
          onPanelDone={next}
          onRace={() => {
            autoStart.current = true;
            next();
            setScreen('race');
          }}
        />
      )}

      {sheet === 'quests' && <QuestNotebook onClose={() => setSheet(null)} />}
      {sheet === 'words' && <WordNotebook onClose={() => setSheet(null)} />}
      {sheet === 'bag' && <BagSheet onClose={() => setSheet(null)} />}
    </main>
  );
}

function fill(text: string, vars: Record<string, Bi> | undefined, t: (b: Bi) => string) {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (_, k: string) => (vars[k] ? t(vars[k]) : ''));
}

function BagIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 9h14l-1.5 11h-11z" fill="currentColor" />
      <path d="M9 9V7a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

// ───────────── Dialogue: one step at a time ─────────────

function StepView({
  step,
  learnerId,
  onNext,
  onPanelDone,
  onRace,
}: {
  step: Exclude<Step, { t: 'do' }>;
  learnerId: string;
  onNext: () => void;
  onPanelDone: (extra?: Step[]) => void;
  onRace: () => void;
}) {
  const { t, lang } = useT();
  let body: ReactNode = null;
  let wide = false;
  let showNext = true;
  switch (step.t) {
    case 'line':
      body = <Bubble line={step.line} level={1} />;
      break;
    case 'hint':
      body = <HintLine line={step.line} />;
      break;
    case 'note':
      body = (
        <div className="paper-note" data-testid="note">
          <strong className="paper-title">{t(step.title)}</strong>
          {step.lines.map((l) => (
            <NoteLine key={l.id} line={l} />
          ))}
        </div>
      );
      break;
    case 'reward': {
      const w = words.find((x) => x.id === step.word);
      body = (
        <div className="reward-card" data-testid="reward">
          {step.upgrade && (
            <div className="reward-row">
              <Ribbon color="coral" size={40} />
              <div>
                <span className="reward-label">{t(ui.newPart)}</span>
                <strong className="reward-title">{t(upgradeText[step.upgrade].name)}</strong>
                <small>{t(upgradeText[step.upgrade].effect)}</small>
              </div>
            </div>
          )}
          {w && (
            <div className="reward-row">
              <IconNotebook size={36} />
              <div lang={lang}>
                <span className="reward-label">{t(ui.newWord)}</span>
                <strong className="reward-title">
                  {w.word[lang]} <span className="word-alt">· {w.word[lang === 'fil' ? 'en' : 'fil']}</span>
                </strong>
                <small>
                  {t(ui.meaning)}: {t(w.meaning)}
                </small>
              </div>
            </div>
          )}
        </div>
      );
      break;
    }
    case 'panel':
      wide = true;
      showNext = false;
      if (step.panel === 'build') body = <BuildPanel spec={q2Build} onSolved={(wrong, hints) => onPanelDone(finishQ2(wrong, hints))} />;
      if (step.panel === 'proof') body = <ProofPanel onDone={() => onPanelDone()} />;
      if (step.panel === 'sobra') body = <SobraPanel onDone={() => onPanelDone()} />;
      if (step.panel === 'choice') body = <ChoicePanel learnerId={learnerId} onDone={() => onPanelDone()} />;
      if (step.panel === 'raceIntro') body = <RaceIntroPanel onStart={onRace} onLater={() => onPanelDone()} />;
      break;
  }
  return (
    <div className={`dialogue ${wide ? 'dialogue-wide' : ''}`} role="dialog" aria-modal="true" data-step={step.t}>
      <div className="dialogue-card">
        {body}
        {showNext && (
          <button type="button" className="btn btn-primary btn-block next-btn" onClick={onNext} data-testid="next" autoFocus>
            <span>{t(ui.next)}</span> <IconNext />
          </button>
        )}
      </div>
    </div>
  );
}

function NoteLine({ line }: { line: Line }) {
  const { tx, lang } = useT();
  return (
    <p className="paper-line" lang={lang} data-line={line.id}>
      <RichText text={tx(line.text)} />
    </p>
  );
}

// ───────────── Kite Day race overlay ─────────────

interface RaceUI {
  stage: 'intro' | 'flying' | 'gate' | 'end';
  h: number;
  strength: number;
  max: number;
  gate?: { wordId: string; correct: 'left' | 'right' };
  gateOk?: boolean;
  warn?: boolean;
  result?: 'win' | 'crash' | 'low';
}

function RaceMeter({ h, strength, max }: { h: number; strength: number; max: number }) {
  const { t } = useT();
  return (
    <div className="race-meter" aria-label={`${t(ui.height)}: ${h} / ${RACE_TARGET} m`}>
      <span className="race-h" data-testid="race-height">
        {h}
        <small>/{RACE_TARGET} m</small>
      </span>
      <span className="race-bar" aria-hidden="true">
        <span style={{ width: `${Math.min(100, (h / RACE_TARGET) * 100)}%` }} />
      </span>
      <span className="pips" aria-label={`${t(ui.kiteStrength)}: ${strength}/${max}`}>
        {Array.from({ length: max }, (_, i) => (
          <i key={i} className={i < strength ? 'on' : ''} />
        ))}
      </span>
    </div>
  );
}

function RaceOverlay({
  race,
  onStart,
  onGo,
  onRetry,
  onBack,
}: {
  race: RaceUI;
  onStart: () => void;
  onGo: () => void;
  onRetry: () => void;
  onBack: () => void;
}) {
  const { t } = useT();
  const g = currentGame(useAppState());
  const word = race.gate ? words.find((w) => w.id === race.gate!.wordId) : undefined;
  const missing = (['frame', 'balance', 'longString'] as const).filter((u) => !g.upgrades.includes(u));
  return (
    <>
      {race.stage === 'intro' && (
        <div className="race-card" role="dialog" aria-modal="true">
          <RaceIntroPanel onStart={onStart} onLater={onBack} />
        </div>
      )}
      {race.stage === 'gate' && word && (
        <div className="race-card gate-card" role="dialog" aria-modal="true" data-testid="gate-card">
          <Bubble line={story.gatePrompt} level={1} />
          <p className="gate-meaning">“{t(word.meaning)}”</p>
          <p className="muted small">{t(ui.steerTo)}</p>
          <button type="button" className="btn btn-primary btn-block" onClick={onGo} data-testid="gate-go" autoFocus>
            {t(ui.fly)}
          </button>
        </div>
      )}
      {race.gateOk !== undefined && (
        <div className={`race-toast ${race.gateOk ? 'ok' : ''}`} role="status">
          {race.gateOk ? t(pickText(story.gateOk)) : t(pickText(story.gateMiss))}
        </div>
      )}
      {race.warn && (
        <div className="race-warn" role="status">
          <Bubble line={story.raceWarn} level={1} />
        </div>
      )}
      {race.stage === 'end' && (
        <div className="race-card" role="dialog" aria-modal="true" data-testid="race-end" data-result={race.result}>
          {race.result === 'win' && (
            <>
              <Bubble line={story.raceWin} level={1} />
              <div className="reward-card">
                <div className="reward-row">
                  <Ribbon color="sun" size={40} />
                  <div>
                    <span className="reward-label">{t(ui.levelOf, { n: 1, m: TOTAL_LEVELS })}</span>
                    <strong className="reward-title">{t(ui.winTitle)}</strong>
                  </div>
                </div>
              </div>
              <LevelGoal />
              <p className="muted small">🔒 {t(ui.lockedNeighbours)}</p>
              <button type="button" className="btn btn-primary btn-block" onClick={onBack} data-testid="race-back">
                {t(ui.backToBarangay)}
              </button>
            </>
          )}
          {race.result !== 'win' && (
            <>
              <Bubble line={race.result === 'crash' ? story.raceCrash : story.raceLow} level={1} />
              <p className="muted center">{t(ui.bestHeight, { n: Math.max(race.h, g.finale.best) })}</p>
              {missing.slice(0, 1).map((m) => (
                <Bubble key={m} line={story.tips[m]} level={1} />
              ))}
              <button type="button" className="btn btn-primary btn-block" onClick={onRetry} data-testid="race-retry" autoFocus>
                {t(ui.retry)}
              </button>
              <button type="button" className="btn btn-ghost btn-block" onClick={onBack} data-testid="race-back">
                {t(ui.backToBarangay)}
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}

function pickText(l: Line): Bi {
  return 'A' in l.text ? l.text.A : l.text;
}
