// Game type: FIND THE PROOF. The child taps the sentence that answers the question.
// Content: ProofScene in src/types.ts. Level 1 scene "proof".
import { useRef, useState } from 'react';
import { Bubble, Feedback, ListenButton } from '../components/Common';
import { ui } from '../content/ui';
import { extraAudioId, lineAudio, sharedAudio } from '../lib/audio';
import { useT } from '../lib/i18n';
import { sfx } from '../lib/sfx';
import type { ProofScene as Proof } from '../types';
import { useSeen, type SceneCtx } from './shared';

export function ProofScene({ scene, ctx }: { scene: Proof; ctx: SceneCtx }) {
  const { t, tx, lang, band } = useT();
  const passage = scene.passage[band];
  const [wrong, setWrong] = useState<string[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const attempts = useRef(0);
  useSeen(ctx.level, [...scene.lines, scene.prompt, ...passage]);

  function tap(id: string) {
    if (ctx.solved || wrong.includes(id)) return;
    if (id === scene.answer) {
      sfx.good();
      setHint(null);
      ctx.onSolved(attempts.current);
    } else {
      sfx.hint();
      attempts.current += 1;
      setWrong((w) => [...w, id]);
      setHint(scene.hints[id] ? id : 'default');
    }
  }

  return (
    <section className="scene-body">
      {scene.lines.map((line) => (
        <Bubble key={line.id} line={line} level={ctx.level} moodOverride={ctx.solved ? 'happy' : undefined} />
      ))}
      <Bubble line={scene.prompt} level={ctx.level} />

      <div className="diary">
        <div className="note-head">
          <strong>{t(scene.passageTitle)}</strong>
          <ListenButton srcs={passage.map((l) => lineAudio(l, lang, ctx.level, band, true))} compact />
        </div>
        <div className="diary-lines" lang={lang}>
          {passage.map((l) => {
            const isWrong = wrong.includes(l.id);
            const isRight = ctx.solved && l.id === scene.answer;
            return (
              <button
                key={l.id}
                type="button"
                className={`sentence ${isWrong ? 'tried' : ''} ${isRight ? 'proof' : ''}`}
                onClick={() => tap(l.id)}
                disabled={ctx.solved && !isRight}
                data-sentence={l.id}
              >
                {tx(l.text)}
                {isRight && <span className="proof-stamp">{t(ui.proofFound)}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {hint && !ctx.solved && (
        <Feedback kind="hint" who="tala" text={t(scene.hints[hint])} src={sharedAudio(lang, ctx.level, extraAudioId(scene.id, 'hint', hint))} />
      )}
      {ctx.solved && <Feedback kind="good" who="tala" text={t(scene.success)} src={sharedAudio(lang, ctx.level, extraAudioId(scene.id, 'ok'))} />}
    </section>
  );
}
