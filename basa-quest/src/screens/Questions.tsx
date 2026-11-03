import { useEffect, useState } from 'react';
import { ui } from '../content/story';
import { ListenButton } from '../components/Common';
import { IconBook, IconCheck, IconNext } from '../components/Icons';
import { questionAudio } from '../lib/audio';
import { useT } from '../lib/i18n';
import { recordAnswer } from '../lib/store';
import type { Band, Chapter } from '../types';

const TOTAL = 5; // 4 tap questions + 1 explain-aloud

export function Questions({ chapter, band, q }: { chapter: Chapter; band: Band; q: number }) {
  const { t, lang } = useT();
  const question = chapter.questions[Math.min(q, chapter.questions.length - 1)];
  const [wrong, setWrong] = useState<number[]>([]);
  const [correct, setCorrect] = useState(false);
  const [showStory, setShowStory] = useState(false);

  // New question: reset the attempt state.
  useEffect(() => {
    setWrong([]);
    setCorrect(false);
    setShowStory(false);
    window.scrollTo(0, 0);
  }, [q, chapter.level]);

  function choose(i: number) {
    if (correct || wrong.includes(i)) return;
    if (i === question.answer) setCorrect(true);
    else setWrong((w) => [...w, i]);
  }

  function next() {
    const isLast = q >= chapter.questions.length - 1;
    recordAnswer(chapter.level, q, question.skill, wrong.length === 0, isLast);
  }

  return (
    <section className="questions">
      <p className="q-count">{t(ui.questionOf, { n: q + 1, m: TOTAL })}</p>
      <h2 className="q-prompt" lang={lang}>{t(question.prompt)}</h2>
      <ListenButton src={questionAudio(lang, chapter.level, q + 1)} small />

      <div className="choices">
        {question.choices.map((c, i) => {
          const isWrong = wrong.includes(i);
          const isRight = correct && i === question.answer;
          return (
            <button
              key={i}
              type="button"
              className={`choice ${isWrong ? 'tried' : ''} ${isRight ? 'right' : ''}`}
              onClick={() => choose(i)}
              disabled={isWrong || (correct && !isRight)}
              aria-pressed={isRight}
            >
              <span className="choice-letter">{'ABC'[i]}</span>
              <span>{t(c)}</span>
              {isRight && <IconCheck className="choice-check" />}
            </button>
          );
        })}
      </div>

      <div aria-live="polite">
        {!correct && wrong.length > 0 && (
          <div className="feedback hint">
            <strong>{t(ui.tryAgain)}</strong>
            <p>{t(question.hint)}</p>
            <p className="muted">{t(ui.tryAgainTap)}</p>
          </div>
        )}
        {correct && (
          <div className="feedback good">
            <strong>{wrong.length === 0 ? t(ui.correctFirst) : t(ui.correctRetry)}</strong>
            <p>{t(question.explain)}</p>
          </div>
        )}
      </div>

      {correct ? (
        <button type="button" className="btn btn-primary btn-block" onClick={next}>
          <span>{t(ui.next)}</span> <IconNext />
        </button>
      ) : (
        <button type="button" className="btn btn-ghost btn-block" onClick={() => setShowStory((v) => !v)} aria-expanded={showStory}>
          <IconBook /> <span>{showStory ? t(ui.hideStory) : t(ui.lookBack)}</span>
        </button>
      )}
      {showStory && !correct && (
        <div className="lookback" lang={lang}>
          {chapter.pages[band].map((pg, k) => (
            <p key={k}>{t(pg)}</p>
          ))}
        </div>
      )}
    </section>
  );
}
