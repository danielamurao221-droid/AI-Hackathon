// Panels that open during a conversation: proof, the "sobra" word task, Nonoy's choice,
// and the check before the Kite Day race.
import { useState } from 'react';
import { Bubble, Feedback, RichText } from '../../components/Common';
import { Character } from '../../components/Character';
import { IconCheck, IconGive, IconKeep, IconLock, IconNext } from '../../components/Icons';
import { story } from '../../content/adventure';
import { charNames, ui, upgradeText, type UpgradeId } from '../../content/ui';
import { lineAudio } from '../../lib/audio';
import { useT } from '../../lib/i18n';
import { sfx } from '../../lib/sfx';
import { currentGame, useAppState } from '../../lib/store';
import { finishChoice, proofWrong, sobraWrong } from '../director';
import { ExplainAloud } from './ExplainAloud';

// ───── Quest 3: tap the clue that proves where the string was ─────
export function ProofPanel({ onDone }: { onDone: () => void }) {
  const { t, tx, lang, band } = useT();
  const clues = [story.q3Clues.nonoy, story.q3Clues.nena, story.q3Clues.jun];
  const answer = story.q3Clues.nena.id;
  const [wrong, setWrong] = useState<string[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function pick(id: string) {
    if (ok || wrong.includes(id)) return;
    if (id === answer) {
      sfx.good();
      setOk(true);
      setHint(null);
    } else {
      sfx.hint();
      proofWrong();
      setWrong((w) => [...w, id]);
      setHint(id);
    }
  }

  return (
    <div className="panel-body">
      <Bubble line={story.q3ProofAsk} level={1} />
      <div className="proof-list" lang={lang}>
        {clues.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`proof-clue ${wrong.includes(c.id) ? 'tried' : ''} ${ok && c.id === answer ? 'proof' : ''}`}
            onClick={() => pick(c.id)}
            disabled={ok && c.id !== answer}
            data-clue={c.id}
          >
            {c.who && <Character who={c.who} mood="happy" size={40} />}
            <span>
              <b>{c.who ? t(charNames[c.who]) : ''}</b>
              <RichText text={tx(c.text)} />
            </span>
            {ok && c.id === answer && <span className="proof-stamp">{t(ui.proofFound)}</span>}
          </button>
        ))}
      </div>
      {hint && story.q3ProofHints[hint] && (
        <Feedback kind="hint" who="lolo" text={tx(story.q3ProofHints[hint].text)} src={lineAudio(story.q3ProofHints[hint], lang, 1, band)} />
      )}
      {ok && (
        <>
          <Feedback kind="good" who="lolo" text={tx(story.q3ProofOk.text)} src={lineAudio(story.q3ProofOk, lang, 1, band)} />
          <button type="button" className="btn btn-primary btn-block next-btn" onClick={onDone}>
            <span>{t(ui.next)}</span> <IconNext />
          </button>
        </>
      )}
    </div>
  );
}

// ───── Quest 3: use "sobra" ─────
export function SobraPanel({ onDone }: { onDone: () => void }) {
  const { t, tx, lang, band } = useT();
  const [wrong, setWrong] = useState<string[]>([]);
  const [ok, setOk] = useState(false);

  function pick(id: string) {
    if (ok || wrong.includes(id)) return;
    if (id === story.q3SobraAnswer) {
      sfx.good();
      setOk(true);
    } else {
      sfx.hint();
      sobraWrong();
      setWrong((w) => [...w, id]);
    }
  }

  return (
    <div className="panel-body">
      <Bubble line={story.q3SobraAsk} level={1} />
      <div className="string-art" aria-hidden="true">
        <span className="string-need">10</span>
        <span className="string-extra">+ ?</span>
      </div>
      <div className="word-options">
        {story.q3SobraOptions.map((o) => (
          <button
            key={o.id}
            type="button"
            className={`word-opt ${wrong.includes(o.id) ? 'tried' : ''} ${ok && o.id === story.q3SobraAnswer ? 'right' : ''}`}
            onClick={() => pick(o.id)}
            disabled={wrong.includes(o.id) || (ok && o.id !== story.q3SobraAnswer)}
            data-option={o.id}
            lang={lang}
          >
            <span className="big-num">{o.id}</span>
            <span>{t(o.label)}</span>
          </button>
        ))}
      </div>
      {wrong.length > 0 && !ok && <Feedback kind="hint" who="lolo" text={tx(story.q3SobraHint.text)} src={lineAudio(story.q3SobraHint, lang, 1, band)} />}
      {ok && (
        <button type="button" className="btn btn-primary btn-block next-btn" onClick={onDone}>
          <span>{t(ui.next)}</span> <IconNext />
        </button>
      )}
    </div>
  );
}

// ───── Nonoy's Choice: share or keep, then "Bakit?" ─────
export function ChoicePanel({ onDone, learnerId }: { onDone: () => void; learnerId: string }) {
  const { t, lang } = useT();
  const [choice, setChoice] = useState<'share' | 'keep' | null>(null);
  const [done, setDone] = useState(false);
  const opt = choice ? story.choices[choice] : null;

  return (
    <div className="panel-body">
      <Bubble line={story.choiceAsk} level={1} />
      {!choice ? (
        <div className="decide-options" lang={lang}>
          {(['share', 'keep'] as const).map((id) => (
            <button
              key={id}
              type="button"
              className="decide-opt"
              data-option={id}
              onClick={() => {
                sfx.pick();
                setChoice(id);
              }}
            >
              {id === 'share' ? <IconGive size={40} /> : <IconKeep size={40} />}
              <span>{t(story.choices[id].label)}</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="choice-made" lang={lang}>
            {choice === 'share' ? <IconGive size={28} /> : <IconKeep size={28} />}
            <strong>{t(story.choices[choice].label)}</strong>
            {!done && (
              <button type="button" className="link-btn" onClick={() => setChoice(null)}>
                {t(ui.changeChoice)}
              </button>
            )}
          </div>
          <div className="reply" key={choice}>
            {opt!.reply.map((line) => (
              <Bubble key={line.id} line={line} level={1} />
            ))}
          </div>
          <ExplainAloud
            key={choice}
            spec={opt!.explain}
            level={1}
            recKey={`${learnerId}-choice`}
            done={done}
            onDone={(mode) => {
              finishChoice(choice, mode);
              setDone(true);
            }}
          />
          {done && (
            <button type="button" className="btn btn-primary btn-block next-btn" onClick={onDone}>
              <span>{t(ui.next)}</span> <IconNext />
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ───── Kite check before the race ─────
export function KiteParts() {
  const { t } = useT();
  const g = currentGame(useAppState());
  const list: UpgradeId[] = ['frame', 'balance', 'longString', g.choice === 'keep' ? 'ribbon' : 'nonoy'];
  return (
    <ul className="parts-list">
      {list.map((id) => {
        const has = g.upgrades.includes(id);
        return (
          <li key={id} className={has ? 'has' : ''} data-upgrade={id}>
            {has ? <IconCheck size={20} /> : <IconLock size={18} />}
            <span>
              <b>{t(upgradeText[id].name)}</b>
              <small>{has ? t(upgradeText[id].effect) : t(ui.notYet)}</small>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function RaceIntroPanel({ onStart, onLater }: { onStart: () => void; onLater: () => void }) {
  const { t } = useT();
  return (
    <div className="panel-body">
      <h2 className="panel-title">{t(ui.raceTitle)}</h2>
      <p className="race-goal">{t(ui.raceGoal)}</p>
      <h3>{t(ui.kiteParts)}</h3>
      <KiteParts />
      <p className="muted small">{t(ui.raceHow)}</p>
      <button type="button" className="btn btn-primary btn-block" onClick={onStart} data-testid="race-start">
        {t(ui.raceStart)}
      </button>
      <button type="button" className="btn btn-ghost btn-block" onClick={onLater}>
        {t(ui.backToBarangay)}
      </button>
    </div>
  );
}

/** A line shown as a "hint offer" after repeated wrong tries. */
export function HintLine({ line }: { line: import('../../types').Line }) {
  const { t } = useT();
  return (
    <div className="hint-offer">
      <strong>{t(ui.hintOffer)}</strong>
      <Bubble line={line} level={1} />
    </div>
  );
}
