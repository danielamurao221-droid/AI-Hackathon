// Game type: DO WHAT THE TEXT SAYS (tap the right place or card).
// Content: PickScene in src/types.ts. Used by Level 1 scenes "hook" and "supplies".
import { useRef, useState } from 'react';
import { Bubble, Feedback } from '../components/Common';
import { IconCheck } from '../components/Icons';
import { extraAudioId, sharedAudio } from '../lib/audio';
import { useT } from '../lib/i18n';
import { sfx } from '../lib/sfx';
import type { MapArt, PickScene as Pick } from '../types';
import { ui } from '../content/ui';
import { useSeen, type SceneCtx } from './shared';

export function PickScene({ scene, ctx }: { scene: Pick; ctx: SceneCtx }) {
  const { t, lang } = useT();
  const [round, setRound] = useState(0);
  const [wrong, setWrong] = useState<string[]>([]);
  const [hintKey, setHintKey] = useState<string | null>(null);
  const [roundDone, setRoundDone] = useState(false);
  const attempts = useRef(0);
  const r = scene.rounds[round];
  const last = round === scene.rounds.length - 1;
  useSeen(ctx.level, [...r.lines, r.prompt]);

  function choose(id: string) {
    if (roundDone || wrong.includes(id)) return;
    if (id === r.answer) {
      sfx.good();
      setRoundDone(true);
      setHintKey(null);
      if (last) ctx.onSolved(attempts.current);
    } else {
      sfx.hint();
      attempts.current += 1;
      setWrong((w) => [...w, id]);
      setHintKey(r.hints[id] ? id : 'default');
    }
  }

  function nextRound() {
    sfx.tap();
    setRound((n) => n + 1);
    setWrong([]);
    setHintKey(null);
    setRoundDone(false);
  }

  const lastLine = r.lines[r.lines.length - 1];
  return (
    <section className="scene-body">
      {r.lines.map((line) => (
        <Bubble
          key={line.id}
          line={line}
          level={ctx.level}
          moodOverride={line === lastLine ? (roundDone ? 'happy' : hintKey ? 'think' : undefined) : undefined}
        />
      ))}
      <Bubble line={r.prompt} level={ctx.level} />

      {scene.board === 'map' ? (
        <div className="pick-map">
          <svg viewBox="0 0 320 220" className="pick-map-art" aria-hidden="true">
            <rect width="320" height="220" rx="16" fill="#d7ecd0" />
            <path d="M0 120c60-14 100 14 160 0s110-16 160 0v18c-60-14-100 14-160 0S60 124 0 138z" fill="#ecdcb8" />
            <path d="M152 0h16v220h-16z" fill="#ecdcb8" />
            {scene.targets.map((tg) => (
              <g key={tg.id} transform={`translate(${(tg.x ?? 50) * 3.2} ${(tg.y ?? 50) * 2.2})`}>
                {tg.art && <MapArtSvg art={tg.art} />}
              </g>
            ))}
          </svg>
          {scene.targets.map((tg) => {
            const isWrong = wrong.includes(tg.id);
            const isRight = roundDone && tg.id === r.answer;
            return (
              <button
                key={tg.id}
                type="button"
                className={`map-spot ${isWrong ? 'tried' : ''} ${isRight ? 'right' : ''}`}
                style={{ left: `${tg.x}%`, top: `${tg.y}%` }}
                onClick={() => choose(tg.id)}
                aria-label={t(tg.label)}
                data-target={tg.id}
              >
                {isRight && <IconCheck className="spot-check" />}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="pick-cards">
          {scene.targets.map((tg) => {
            const isWrong = wrong.includes(tg.id);
            const isRight = roundDone && tg.id === r.answer;
            return (
              <button
                key={tg.id}
                type="button"
                className={`pick-card ${isWrong ? 'tried' : ''} ${isRight ? 'right' : ''}`}
                onClick={() => choose(tg.id)}
                data-target={tg.id}
                lang={lang}
              >
                <span className="pick-card-top" aria-hidden="true" />
                <span>{t(tg.label)}</span>
                {isRight && <IconCheck className="spot-check" />}
              </button>
            );
          })}
        </div>
      )}

      {hintKey && !roundDone && (
        <Feedback
          kind="hint"
          who={lastLine?.who ?? 'tala'}
          text={t(r.hints[hintKey])}
          src={sharedAudio(lang, ctx.level, extraAudioId(scene.id, 'hint', hintKey, round))}
        />
      )}
      {roundDone && (
        <Feedback kind="good" who={lastLine?.who ?? 'tala'} text={t(r.success)} src={sharedAudio(lang, ctx.level, extraAudioId(scene.id, 'ok', '', round))} />
      )}
      {roundDone && !last && (
        <button type="button" className="btn btn-primary btn-block" onClick={nextRound}>
          {t(ui.next)}
        </button>
      )}
    </section>
  );
}

/** Small drawings for map targets, centred at (0,0). */
export function MapArtSvg({ art }: { art: MapArt }) {
  switch (art) {
    case 'storeBlue':
      return (
        <g>
          <rect x="-26" y="-12" width="52" height="30" rx="2" fill="#fff4dd" stroke="#c9b48a" />
          <path d="M-32 -12 0 -32 32 -12z" fill="#4f7fd6" />
          <path d="M-22 -12h44v8h-44z" fill="#fff" />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={-22 + i * 9} y="-12" width="4.5" height="8" fill="#4f7fd6" />
          ))}
          <rect x="-6" y="2" width="12" height="16" fill="#8a5a36" />
        </g>
      );
    case 'bakery':
      return (
        <g>
          <rect x="-26" y="-12" width="52" height="30" rx="2" fill="#fff4dd" stroke="#c9b48a" />
          <path d="M-32 -12 0 -32 32 -12z" fill="#d94a3a" />
          <rect x="-6" y="2" width="12" height="16" fill="#8a5a36" />
          <ellipse cx="-15" cy="1" rx="8" ry="5" fill="#d99a4e" />
          <path d="M-19 0l2-3M-15 0l2-3M-11 0l2-3" stroke="#b0702e" strokeWidth="1.2" />
        </g>
      );
    case 'workshop':
      return (
        <g>
          <rect x="-34" y="-10" width="68" height="28" rx="2" fill="#e8d2ad" stroke="#b8935a" />
          <path d="M-38 -10 0 -28 38 -10z" fill="#8a5a36" />
          <rect x="-12" y="0" width="24" height="18" fill="#6b4b2f" />
          <path d="M18 -2l10 10M22 -4l4 4" stroke="#5d6b73" strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case 'mangoTree':
      return (
        <g>
          <rect x="-4" y="0" width="8" height="22" rx="2" fill="#8a5a36" />
          <circle cx="0" cy="-8" r="20" fill="#3fa36b" />
          <circle cx="-14" cy="0" r="11" fill="#4cb87a" />
          <circle cx="14" cy="0" r="11" fill="#4cb87a" />
          {[[-8, -8], [6, -14], [10, 2], [-12, 4]].map(([x, y], i) => (
            <ellipse key={i} cx={x} cy={y} rx="3.4" ry="4.6" fill="#f6b73c" transform={`rotate(-20 ${x} ${y})`} />
          ))}
        </g>
      );
    case 'coconutTree':
      return (
        <g>
          <path d="M-2 24c2-16 4-26 8-36" stroke="#8a5a36" strokeWidth="5" fill="none" />
          <path d="M6 -12c-12-4-22 2-26 8 8-4 18-6 26-8zM6 -12c10-8 22-6 26 0-8-2-18-2-26 0zM6 -12c-2-10 2-16 8-20-2 8-4 14-8 20zM6 -12c-6-8-14-10-20-8 8 2 14 4 20 8z" fill="#3fa36b" />
          <circle cx="3" cy="-9" r="3.4" fill="#7a5a2e" />
          <circle cx="9" cy="-8" r="3.4" fill="#7a5a2e" />
        </g>
      );
  }
}
