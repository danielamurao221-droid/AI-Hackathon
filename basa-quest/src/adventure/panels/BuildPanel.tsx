// Quest 2 workbench: follow Lolo Ben's written steps to build the kite.
// Parts can be placed by tap-to-select then tap a spot, or by dragging.
// A wrong build makes the test flight wobble. After HINT_AFTER wobbles a clue-based hint
// (with Makinig) appears; after SPARKLE_AFTER the right spot for the failing step sparkles.
import { useEffect, useRef, useState, type KeyboardEvent as RKeyboardEvent, type PointerEvent as RPointerEvent } from 'react';
import { Feedback, ListenButton, RichText } from '../../components/Common';
import { IconCheck, IconNext } from '../../components/Icons';
import { HINT_AFTER, SPARKLE_AFTER } from '../../config';
import { slotNames, ui } from '../../content/ui';
import { lineAudio } from '../../lib/audio';
import { useT } from '../../lib/i18n';
import { sfx } from '../../lib/sfx';
import { addToNotebook } from '../../lib/store';
import type { BuildSpec, KitePart, KiteSlot } from '../../types';

type Kind = 'stick' | 'knot' | 'paper';
const PART_KIND: Record<KitePart, Kind> = { long: 'stick', short: 'stick', string: 'knot', paper: 'paper' };
const SLOT_KIND: Record<KiteSlot, Kind> = {
  vertical: 'stick',
  acrossTop: 'stick',
  acrossMid: 'stick',
  knotTop: 'knot',
  knotMid: 'knot',
  knotEnd: 'knot',
  paper: 'paper',
};

// Board geometry (viewBox 0 0 200 250).
const T = { x: 100, y: 20 };
const R = { x: 160, y: 75 };
const B = { x: 100, y: 230 };
const L = { x: 40, y: 75 };
const DIAMOND = `${T.x},${T.y} ${R.x},${R.y} ${B.x},${B.y} ${L.x},${L.y}`;
const KNOTS: Record<'knotTop' | 'knotMid' | 'knotEnd', { x: number; y: number }> = {
  knotTop: { x: 100, y: 75 },
  knotMid: { x: 100, y: 125 },
  knotEnd: { x: 100, y: 230 },
};
const EDGES = [
  [T, L],
  [T, R],
  [R, B],
  [B, L],
] as const;

function flap(i: number) {
  const [a, b] = EDGES[i];
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  // outward normal: away from the diamond centre (100, 100)
  let nx = -dy / len;
  let ny = dx / len;
  if ((mx - 100) * nx + (my - 100) * ny < 0) {
    nx = -nx;
    ny = -ny;
  }
  const p1 = { x: a.x + dx * 0.3, y: a.y + dy * 0.3 };
  const p2 = { x: a.x + dx * 0.7, y: a.y + dy * 0.7 };
  const apex = { x: mx + nx * 15, y: my + ny * 15 };
  return { p1, p2, apex, hit: { x: mx + nx * 9, y: my + ny * 9 } };
}

type Placed = Partial<Record<KiteSlot, KitePart>>;

const SLOT_CENTER: Record<KiteSlot, { x: number; y: number }> = {
  vertical: { x: 100, y: 40 },
  acrossTop: { x: 50, y: 75 },
  acrossMid: { x: 55, y: 125 },
  knotTop: { x: 100, y: 75 },
  knotMid: { x: 100, y: 125 },
  knotEnd: { x: 100, y: 230 },
  paper: { x: 100, y: 175 },
};

export function BuildPanel({ spec: scene, onSolved }: { spec: BuildSpec; onSolved: (wrongTests: number, hints: number) => void }) {
  const { t, tx, lang, band } = useT();
  const [solved, setSolved] = useState(false);
  const hintsShown = useRef(0);
  const ctx = { solved };
  const [placed, setPlaced] = useState<Placed>({});
  const [selected, setSelected] = useState<KitePart | null>(null);
  const [folds, setFolds] = useState<boolean[]>([false, false, false, false]);
  const [failStep, setFailStep] = useState<number | null>(null);
  const [wobble, setWobble] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ part: KitePart; x: number; y: number } | null>(null);
  const attempts = useRef(0);
  const dragStart = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const pointerHandled = useRef(false);
  useEffect(() => {
    addToNotebook(scene.steps.map((s) => s.line.id));
  }, [scene]);

  useEffect(() => {
    if (!wobble) return;
    const id = window.setTimeout(() => setWobble(false), 800);
    return () => window.clearTimeout(id);
  }, [wobble]);

  const where = (part: KitePart) => (Object.keys(placed) as KiteSlot[]).find((s) => placed[s] === part);
  const allPlaced = scene.parts.every((p) => where(p.id));
  const paperOn = placed.paper === 'paper';

  function place(part: KitePart, slot: KiteSlot) {
    if (ctx.solved) return;
    if (PART_KIND[part] !== SLOT_KIND[slot]) {
      sfx.hint();
      setNote(t(ui.notThere));
      return;
    }
    sfx.place();
    setNote(null);
    setPlaced((p) => {
      const next: Placed = { ...p };
      for (const s of Object.keys(next) as KiteSlot[]) if (next[s] === part) delete next[s];
      next[slot] = part;
      return next;
    });
    if (part === 'paper') setFolds([false, false, false, false]);
    setSelected(null);
  }

  function tapSlot(slot: KiteSlot) {
    if (selected) place(selected, slot);
  }

  function toggleFold(i: number) {
    if (ctx.solved) return;
    sfx.tap();
    setFolds((f) => f.map((v, k) => (k === i ? !v : v)));
  }

  function test() {
    if (ctx.solved) return;
    if (!allPlaced) {
      sfx.hint();
      setNote(t(ui.needAllParts));
      return;
    }
    const foldCount = folds.filter(Boolean).length;
    const failing = scene.steps
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => placed[s.slot] !== s.part || (s.folds !== undefined && foldCount < s.folds));
    if (failing.length === 0) {
      sfx.good();
      setFailStep(null);
      setNote(null);
      setSolved(true);
      return;
    }
    attempts.current += 1;
    if (attempts.current >= HINT_AFTER) hintsShown.current += 1;
    sfx.wobble();
    setWobble(true);
    setFailStep(failing[0].i);
    setNote(null);
    // Parts in the wrong spot go back to the tray so the child can try again.
    setPlaced((p) => {
      const next = { ...p };
      for (const { s } of failing) {
        const at = (Object.keys(next) as KiteSlot[]).find((k) => next[k] === s.part);
        if (at && at !== s.slot) delete next[at];
        if (next[s.slot] && next[s.slot] !== s.part) delete next[s.slot];
      }
      return next;
    });
  }

  // ── drag support ──
  function onPointerDown(e: RPointerEvent<HTMLButtonElement>) {
    if (ctx.solved) return;
    dragStart.current = { x: e.clientX, y: e.clientY, moved: false };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }
  function onPointerMove(e: RPointerEvent<HTMLButtonElement>, part: KitePart) {
    const st = dragStart.current;
    if (!st) return;
    if (!st.moved && Math.hypot(e.clientX - st.x, e.clientY - st.y) > 8) {
      st.moved = true;
      setSelected(part);
      sfx.pick();
    }
    if (st.moved) setDrag({ part, x: e.clientX, y: e.clientY });
  }
  function onPointerUp(e: RPointerEvent<HTMLButtonElement>, part: KitePart) {
    const st = dragStart.current;
    dragStart.current = null;
    pointerHandled.current = true;
    if (st?.moved) {
      setDrag(null);
      const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-slot]');
      const slot = el?.getAttribute('data-slot') as KiteSlot | null;
      if (slot) place(part, slot);
      else {
        setSelected(null);
        setNote(t(ui.notThere));
      }
    } else {
      selectPart(part);
    }
  }
  function selectPart(part: KitePart) {
    if (ctx.solved) return;
    sfx.pick();
    setNote(null);
    setSelected((cur) => (cur === part ? null : part));
  }

  const activeKind = selected ? PART_KIND[selected] : null;
  const slotProps = (slot: KiteSlot) => {
    const accepts = activeKind === SLOT_KIND[slot];
    const filled = !!placed[slot];
    const enabled = !ctx.solved && accepts;
    return {
      'data-slot': slot,
      className: `slot ${accepts ? 'accepts' : ''} ${filled ? 'filled' : ''}`,
      style: { pointerEvents: enabled ? ('auto' as const) : ('none' as const) },
      role: 'button',
      tabIndex: enabled ? 0 : -1,
      'aria-label': t(slotNames[slot]),
      onClick: () => tapSlot(slot),
      onKeyDown: (e: RKeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          tapSlot(slot);
        }
      },
    };
  };

  const stick = (part: KitePart | undefined, orient: 'v' | 'h', y = 0) => {
    if (!part) return null;
    const long = part === 'long';
    if (orient === 'v') return <rect x="97" y={long ? 16 : 70} width="6" height={long ? 218 : 110} rx="3" className="stick" />;
    return <rect x={long ? 12 : 40} y={y - 3} width={long ? 176 : 120} height="6" rx="3" className="stick" />;
  };

  return (
    <section className="scene-body build-body">
      <div className="build-read">

        <div className="note-card">
          <div className="note-head">
            <strong>{t(scene.noteTitle)}</strong>
            <ListenButton srcs={scene.steps.map((s) => lineAudio(s.line, lang, 1, band))} texts={scene.steps.map((s) => tx(s.line.text))} compact />
          </div>
          <ol className="note-steps" lang={lang}>
            {scene.steps.map((s, i) => (
              <li key={s.line.id} className={`${failStep === i ? 'reread' : ''} ${ctx.solved ? 'ok' : ''}`} data-step={i + 1}>
                <span>
                    <RichText text={tx(s.line.text)} />
                  </span>
                {ctx.solved && <IconCheck size={18} className="step-ok" />}
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className="build-work">
        <p className="muted small">{t(ui.buildHow)}</p>

        <div className={`build-board ${wobble ? 'wobble' : ''} ${ctx.solved ? 'built' : ''}`}>
          <svg viewBox="0 0 200 250" className="board-svg">
            <rect width="200" height="250" rx="14" fill="var(--bench)" />
            {/* paper (bottom layer) */}
            <polygon points={DIAMOND} {...slotProps('paper')} className={`${slotProps('paper').className} slot-paper`} />
            {paperOn && <polygon points={DIAMOND} className="paper-on" pointerEvents="none" />}
            {/* sticks */}
            <line x1="100" y1="20" x2="100" y2="230" className="slot-line" />
            <line x1="40" y1="75" x2="160" y2="75" className="slot-line" />
            <line x1="45" y1="125" x2="155" y2="125" className="slot-line" />
            <rect x="86" y="10" width="28" height="230" {...slotProps('vertical')} />
            <rect x="30" y="61" width="140" height="28" {...slotProps('acrossTop')} />
            <rect x="30" y="111" width="140" height="28" {...slotProps('acrossMid')} />
            <g pointerEvents="none">
              {stick(placed.vertical, 'v')}
              {stick(placed.acrossTop, 'h', 75)}
              {stick(placed.acrossMid, 'h', 125)}
            </g>
            {/* knots */}
            {(Object.keys(KNOTS) as (keyof typeof KNOTS)[]).map((k) => (
              <g key={k}>
                <circle cx={KNOTS[k].x} cy={KNOTS[k].y} r="15" {...slotProps(k)} className={`${slotProps(k).className} slot-knot`} />
                {placed[k] === 'string' && (
                  <g pointerEvents="none" className="knot">
                    <path d={`M${KNOTS[k].x - 7} ${KNOTS[k].y - 7}l14 14M${KNOTS[k].x + 7} ${KNOTS[k].y - 7}l-14 14`} />
                    <path d={`M${KNOTS[k].x + 4} ${KNOTS[k].y + 5}q6 10 -2 18`} fill="none" />
                  </g>
                )}
              </g>
            ))}
            {/* folds */}
            {paperOn &&
              EDGES.map((_, i) => {
                const f = flap(i);
                return (
                  <g key={i}>
                    {folds[i] ? (
                      <line x1={f.p1.x} y1={f.p1.y} x2={f.p2.x} y2={f.p2.y} className="fold-done" pointerEvents="none" />
                    ) : (
                      <polygon points={`${f.p1.x},${f.p1.y} ${f.apex.x},${f.apex.y} ${f.p2.x},${f.p2.y}`} className="flap" pointerEvents="none" />
                    )}
                    <circle
                      cx={f.hit.x}
                      cy={f.hit.y}
                      r="15"
                      className={`fold-hit ${folds[i] ? 'folded' : ''}`}
                      role="button"
                      tabIndex={selected || ctx.solved ? -1 : 0}
                      aria-label={`${t(ui.foldEdge)} ${i + 1}`}
                      aria-pressed={folds[i]}
                      data-fold={i}
                      style={{ pointerEvents: selected || ctx.solved ? 'none' : 'auto' }}
                      onClick={() => toggleFold(i)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleFold(i);
                        }
                      }}
                    />
                  </g>
                );
              })}
            {ctx.solved && <path d="M100 230c-8 10 8 14 0 24" stroke="#6b4b2f" strokeWidth="1.6" fill="none" />}
            {!ctx.solved && failStep !== null && attempts.current >= SPARKLE_AFTER && (
              <g pointerEvents="none" className="board-sparkle" data-testid="board-sparkle">
                <circle cx={SLOT_CENTER[scene.steps[failStep].slot].x} cy={SLOT_CENTER[scene.steps[failStep].slot].y} r="16" />
                <circle cx={SLOT_CENTER[scene.steps[failStep].slot].x} cy={SLOT_CENTER[scene.steps[failStep].slot].y} r="5" />
              </g>
            )}
          </svg>
          {wobble && <span className="wobble-tag">{t(ui.wobble)}</span>}
        </div>

        <div className="tray" role="group" aria-label={t(ui.parts)}>
          {scene.parts.map((p) => {
            const on = !!where(p.id);
            return (
              <button
                key={p.id}
                type="button"
                className={`tray-part ${selected === p.id ? 'selected' : ''} ${on ? 'on-board' : ''}`}
                aria-pressed={selected === p.id}
                data-part={p.id}
                disabled={ctx.solved}
                onPointerDown={onPointerDown}
                onPointerMove={(e) => onPointerMove(e, p.id)}
                onPointerUp={(e) => onPointerUp(e, p.id)}
                onPointerCancel={() => {
                  dragStart.current = null;
                  setDrag(null);
                }}
                onClick={() => {
                  if (pointerHandled.current) {
                    pointerHandled.current = false;
                    return;
                  }
                  selectPart(p.id);
                }}
              >
                <PartIcon part={p.id} />
                <span lang={lang}>{t(p.label)}</span>
              </button>
            );
          })}
        </div>

        {note && <p className="gentle" role="status">{note}</p>}
        {failStep !== null && !ctx.solved && attempts.current < HINT_AFTER && <p className="gentle">{t(ui.wobbleTryAgain)}</p>}
        {failStep !== null && !ctx.solved && attempts.current >= HINT_AFTER && (
          <Feedback
            kind="hint"
            who="lolo"
            text={tx(scene.steps[failStep].hint.text)}
            src={lineAudio(scene.steps[failStep].hint, lang, 1, band)}
          />
        )}
        {ctx.solved ? (
          <>
            <Feedback kind="good" who="lolo" text={tx(scene.success.text)} src={lineAudio(scene.success, lang, 1, band)} />
            <button type="button" className="btn btn-primary btn-block next-btn" onClick={() => onSolved(attempts.current, hintsShown.current)}>
              <span>{t(ui.next)}</span> <IconNext />
            </button>
          </>
        ) : (
          <button type="button" className="btn btn-primary btn-block" onClick={test} aria-disabled={!allPlaced} data-testid="test-kite">
            {t(ui.testKite)}
          </button>
        )}
      </div>
      {drag && (
        <div className="drag-ghost" style={{ left: drag.x, top: drag.y }} aria-hidden="true">
          <PartIcon part={drag.part} />
        </div>
      )}
    </section>
  );
}

function PartIcon({ part }: { part: KitePart }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
      {part === 'long' && <rect x="19" y="2" width="6" height="40" rx="3" className="stick" />}
      {part === 'short' && <rect x="19" y="12" width="6" height="20" rx="3" className="stick" />}
      {part === 'string' && (
        <g fill="none" stroke="#6b4b2f" strokeWidth="2">
          <circle cx="22" cy="20" r="9" fill="#efe3c8" />
          <path d="M16 16c4 2 8 2 12 0M15 21c5 2 9 2 14 0M17 26c3 1 7 1 10 0M28 25c6 6 2 12-4 14" />
        </g>
      )}
      {part === 'paper' && <rect x="8" y="8" width="28" height="28" rx="2" fill="#d94a3a" transform="rotate(8 22 22)" />}
    </svg>
  );
}
