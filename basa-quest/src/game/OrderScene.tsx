// Game type: PUT EVENTS IN ORDER. The child taps event cards in the order they happened.
// Content: OrderScene in src/types.ts. Ready for later levels (not used in Level 1).
import { useMemo, useRef, useState } from 'react';
import { Bubble, Feedback } from '../components/Common';
import { ui } from '../content/ui';
import { extraAudioId, sharedAudio } from '../lib/audio';
import { useT } from '../lib/i18n';
import { sfx } from '../lib/sfx';
import type { OrderScene as Order } from '../types';
import { stableShuffle, useSeen, type SceneCtx } from './shared';

export function OrderScene({ scene, ctx }: { scene: Order; ctx: SceneCtx }) {
  const { t, tx, lang } = useT();
  const shuffled = useMemo(() => stableShuffle(scene.events, scene.id), [scene]);
  const [picked, setPicked] = useState<string[]>([]);
  const [hint, setHint] = useState(false);
  const attempts = useRef(0);
  useSeen(ctx.level, [...scene.lines, scene.prompt, ...scene.events]);

  function tap(id: string) {
    if (ctx.solved) return;
    sfx.tap();
    setHint(false);
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  function check() {
    if (ctx.solved || picked.length < scene.events.length) return;
    const ok = picked.every((id, i) => id === scene.events[i].id);
    if (ok) {
      sfx.good();
      ctx.onSolved(attempts.current);
    } else {
      sfx.hint();
      attempts.current += 1;
      // Keep the correct beginning, return the rest.
      const keep: string[] = [];
      for (let i = 0; i < picked.length && picked[i] === scene.events[i].id; i++) keep.push(picked[i]);
      setPicked(keep);
      setHint(true);
    }
  }

  return (
    <section className="scene-body">
      {scene.lines.map((line) => (
        <Bubble key={line.id} line={line} level={ctx.level} />
      ))}
      <Bubble line={scene.prompt} level={ctx.level} />
      <p className="muted small">{t(ui.orderHow)}</p>
      <div className="order-cards" lang={lang}>
        {shuffled.map((e) => {
          const n = picked.indexOf(e.id);
          return (
            <button key={e.id} type="button" className={`order-card ${n >= 0 ? 'placed' : ''}`} onClick={() => tap(e.id)} aria-pressed={n >= 0}>
              <span className="order-n" aria-hidden="true">{n >= 0 ? n + 1 : ''}</span>
              <span>{tx(e.text)}</span>
            </button>
          );
        })}
      </div>
      {hint && !ctx.solved && <Feedback kind="hint" text={t(scene.hint)} src={sharedAudio(lang, ctx.level, extraAudioId(scene.id, 'hint', 'order'))} />}
      {ctx.solved ? (
        <Feedback kind="good" text={t(scene.success)} src={sharedAudio(lang, ctx.level, extraAudioId(scene.id, 'ok'))} />
      ) : (
        <div className="row-btns">
          <button type="button" className="btn btn-ghost" onClick={() => setPicked([])} disabled={picked.length === 0}>
            {t(ui.clearOrder)}
          </button>
          <button type="button" className="btn btn-primary grow" onClick={check} disabled={picked.length < scene.events.length}>
            {t(ui.checkOrder)}
          </button>
        </div>
      )}
    </section>
  );
}
