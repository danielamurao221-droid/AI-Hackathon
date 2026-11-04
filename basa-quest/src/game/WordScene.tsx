// Game type: USE A NEW WORD. Meet the word in the story, then use its meaning to solve a task.
// Content: WordScene in src/types.ts. Level 1 scene "word" ("sobra" / "extra").
import { useRef, useState } from 'react';
import { Bubble, Feedback } from '../components/Common';
import { IconNotebook } from '../components/Icons';
import { ui } from '../content/ui';
import { extraAudioId, sharedAudio } from '../lib/audio';
import { useT } from '../lib/i18n';
import { sfx } from '../lib/sfx';
import { learnWord } from '../lib/store';
import type { ItemArt, WordScene as Word } from '../types';
import { useSeen, type SceneCtx } from './shared';

export function WordScene({ scene, ctx }: { scene: Word; ctx: SceneCtx }) {
  const { t, lang } = useT();
  const [opened, setOpened] = useState(false);
  const [wrong, setWrong] = useState<string[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const attempts = useRef(0);
  const task = scene.task;
  useSeen(ctx.level, opened ? [scene.teach, task.prompt] : [scene.teach]);

  function openWord() {
    if (!opened) sfx.word();
    setOpened(true);
  }

  function choose(id: string) {
    if (ctx.solved || wrong.includes(id)) return;
    if (id === task.answer) {
      sfx.good();
      setHint(null);
      learnWord(scene.word.id);
      ctx.onSolved(attempts.current);
    } else {
      sfx.hint();
      attempts.current += 1;
      setWrong((w) => [...w, id]);
      setHint(task.hints[id] ? id : 'default');
    }
  }

  return (
    <section className="scene-body">
      <Bubble line={scene.teach} level={ctx.level} onWord={openWord} wordLabel={t(ui.newWord)} />
      {!opened && <p className="tap-word-hint">{t(scene.tapWord)}</p>}

      {opened && (
        <div className={`word-card ${ctx.solved ? 'stamped' : ''}`} lang={lang}>
          <div className="word-card-head">
            <span className="word-badge">{t(ui.newWord)}</span>
            <IconNotebook size={22} />
          </div>
          <p className="word-big">
            {scene.word.word[lang]} <span className="word-alt">· {scene.word.word[lang === 'fil' ? 'en' : 'fil']}</span>
          </p>
          <p>
            <strong>{t(ui.meaning)}:</strong> {t(scene.word.meaning)}
          </p>
          <p className="muted">{t(scene.word.example)}</p>
          {ctx.solved && <p className="word-added">✓ {t(ui.addedToNotebook)}</p>}
        </div>
      )}

      {opened && (
        <>
          <Bubble line={task.prompt} level={ctx.level} moodOverride={ctx.solved ? 'happy' : hint ? 'think' : undefined} />
          <div className="table-art" aria-label={t(ui.onTable)}>
            <span className="table-label">{t(ui.onTable)}</span>
            <Items items={task.table} big />
          </div>
          <div className="word-options">
            {task.options.map((o) => {
              const isWrong = wrong.includes(o.id);
              const isRight = ctx.solved && o.id === task.answer;
              return (
                <button
                  key={o.id}
                  type="button"
                  className={`word-opt ${isWrong ? 'tried' : ''} ${isRight ? 'right' : ''}`}
                  onClick={() => choose(o.id)}
                  disabled={isWrong || (ctx.solved && !isRight)}
                  data-option={o.id}
                >
                  <Items items={o.items} />
                  <span lang={lang}>{t(o.label)}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {hint && !ctx.solved && (
        <Feedback kind="hint" who="lolo" text={t(task.hints[hint])} src={sharedAudio(lang, ctx.level, extraAudioId(scene.id, 'hint', hint))} />
      )}
      {ctx.solved && <Feedback kind="good" who="lolo" text={t(task.success)} src={sharedAudio(lang, ctx.level, extraAudioId(scene.id, 'ok'))} />}
    </section>
  );
}

function Items({ items, big }: { items: Partial<Record<ItemArt, number>>; big?: boolean }) {
  const sticks = items.stick ?? 0;
  const sheets = items.sheet ?? 0;
  const s = big ? 1.4 : 1;
  if (!sticks && !sheets) return <span className="items-empty" aria-hidden="true">—</span>;
  return (
    <svg width={(sticks * 12 + sheets * 30 + 8) * s} height={44 * s} viewBox={`0 0 ${sticks * 12 + sheets * 30 + 8} 44`} aria-hidden="true">
      {Array.from({ length: sticks }, (_, i) => (
        <rect key={`s${i}`} x={4 + i * 12} y="4" width="6" height="36" rx="3" className="stick" />
      ))}
      {Array.from({ length: sheets }, (_, i) => (
        <rect key={`p${i}`} x={4 + sticks * 12 + i * 30 + 2} y="10" width="24" height="24" rx="2" fill="#d94a3a" transform={`rotate(${i % 2 ? -6 : 6} ${4 + sticks * 12 + i * 30 + 14} 22)`} />
      ))}
    </svg>
  );
}
