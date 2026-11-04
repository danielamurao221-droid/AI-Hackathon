// Game type: DECIDE WITH CONSEQUENCES. Every option is allowed and leads to its own
// dialogue, then the child explains "Bakit?" aloud. No option is ever called wrong.
// Content: DecideScene in src/types.ts. Level 1 scene "decide".
import { Bubble } from '../components/Common';
import { IconGive, IconKeep } from '../components/Icons';
import { ui } from '../content/ui';
import { useT } from '../lib/i18n';
import { sfx } from '../lib/sfx';
import { setChoice, setExplain, useAppState, levelProgress, getProgress } from '../lib/store';
import type { DecideScene as Decide } from '../types';
import { ExplainAloud } from './ExplainScene';
import { useSeen, type SceneCtx } from './shared';

export function DecideScene({ scene, ctx, learnerId }: { scene: Decide; ctx: SceneCtx; learnerId: string }) {
  const { t, lang } = useT();
  const s = useAppState();
  const choiceId = levelProgress(getProgress(s, learnerId), ctx.level).choice;
  const chosen = scene.options.find((o) => o.id === choiceId) ?? null;
  useSeen(ctx.level, [...scene.lines, scene.prompt, ...(chosen ? chosen.reply : [])]);

  function choose(id: string) {
    if (ctx.solved) return;
    sfx.pick();
    setChoice(ctx.level, id);
  }

  return (
    <section className="scene-body">
      {scene.lines.map((line) => (
        <Bubble key={line.id} line={line} level={ctx.level} />
      ))}
      <Bubble line={scene.prompt} level={ctx.level} />

      {!chosen ? (
        <div className="decide-options" lang={lang}>
          {scene.options.map((o) => (
            <button key={o.id} type="button" className="decide-opt" onClick={() => choose(o.id)} data-option={o.id}>
              {o.icon === 'give' ? <IconGive size={40} /> : <IconKeep size={40} />}
              <span>{t(o.label)}</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="choice-made" lang={lang}>
            {chosen.icon === 'give' ? <IconGive size={28} /> : <IconKeep size={28} />}
            <strong>{t(chosen.label)}</strong>
            {!ctx.solved && (
              <button type="button" className="link-btn" onClick={() => setChoice(ctx.level, null)}>
                {t(ui.changeChoice)}
              </button>
            )}
          </div>
          <div className="reply" key={chosen.id}>
            {chosen.reply.map((line) => (
              <Bubble key={line.id} line={line} level={ctx.level} />
            ))}
          </div>
          <ExplainAloud
            key={chosen.id}
            spec={chosen.explain}
            level={ctx.level}
            recKey={`${learnerId}-${scene.id}`}
            done={ctx.solved}
            onDone={(m) => {
              setExplain(ctx.level, m);
              ctx.onSolved(0);
            }}
          />
        </>
      )}
    </section>
  );
}
