// Quest Notebook (every clue, rereadable, with Makinig), Word Notebook, and the bag.
import { Bubble, Sheet } from '../components/Common';
import { IconTrophy } from '../components/Icons';
import { TOTAL_LEVELS } from '../config';
import { allLines, items, notebookSections, words, type ItemId } from '../content/adventure';
import { ui } from '../content/ui';
import { useT } from '../lib/i18n';
import { sfx } from '../lib/sfx';
import { currentGame, useAppState, type QuestId } from '../lib/store';
import { putBack } from './director';
import { KiteParts } from './panels/QuestPanels';

const QUESTS: { id: QuestId; name: { fil: string; en: string } }[] = [
  { id: 'q1', name: { fil: 'Quest 1: Ang Sulat ni Aling Nena', en: 'Quest 1: Aling Nena’s Note' } },
  { id: 'q2', name: { fil: 'Quest 2: Ang Pagbuo ni Lolo Ben', en: 'Quest 2: Lolo Ben’s Build' } },
  { id: 'q3', name: { fil: 'Quest 3: Ang Nawawalang Tali', en: 'Quest 3: The Missing String' } },
  { id: 'choice', name: { fil: 'Ang Pasya ni Nonoy', en: 'Nonoy’s Choice' } },
];

export function LevelGoal() {
  const { t } = useT();
  return (
    <div className="goal">
      <span className="goal-label">{t(ui.levelOf, { n: 1, m: TOTAL_LEVELS })}</span>
      <span className="goal-track" aria-hidden="true">
        <span className="goal-fill" style={{ width: `${(currentGame().restored ? 1 : 0.4) * (100 / TOTAL_LEVELS) + 1}%` }} />
      </span>
      <IconTrophy size={24} />
    </div>
  );
}

export function QuestNotebook({ onClose }: { onClose: () => void }) {
  const { t } = useT();
  const s = useAppState();
  const g = currentGame(s);
  const sections = notebookSections
    .map((sec) => ({ ...sec, ids: sec.ids.filter((id) => g.notebook.includes(id)) }))
    .filter((sec) => sec.ids.length > 0);
  return (
    <Sheet title={t(ui.questNotebook)} onClose={onClose}>
      <LevelGoal />
      <ul className="quest-status">
        {QUESTS.filter((q) => g.quests[q.id].status !== 'locked').map((q) => (
          <li key={q.id} className={g.quests[q.id].status}>
            <span>{t(q.name)}</span>
            <span className="chip">{g.quests[q.id].status === 'done' ? t(ui.done) : t(ui.inProgress)}</span>
          </li>
        ))}
      </ul>
      {sections.length === 0 && <p className="muted">{t(ui.notebookEmpty)}</p>}
      <div className="story-so-far" data-testid="quest-notebook">
        {sections.map((sec) => (
          <section key={sec.title.en}>
            <h3>{t(sec.title)}</h3>
            {sec.ids.map((id) => (
              <Bubble key={id} line={allLines[id]} level={1} />
            ))}
          </section>
        ))}
      </div>
      <h3>{t(ui.kiteParts)}</h3>
      <KiteParts />
    </Sheet>
  );
}

export function WordNotebook({ onClose }: { onClose: () => void }) {
  const { t, lang } = useT();
  const s = useAppState();
  const g = currentGame(s);
  const learned = words.filter((w) => g.words.includes(w.id));
  return (
    <Sheet title={t(ui.wordNotebook)} onClose={onClose}>
      {learned.length === 0 ? (
        <p className="muted">{t(ui.wordsEmpty)}</p>
      ) : (
        <ul className="notebook" data-testid="word-notebook">
          {learned.map((w) => (
            <li key={w.id} lang={lang}>
              <p className="word-big">
                {w.word[lang]} <span className="word-alt">· {w.word[lang === 'fil' ? 'en' : 'fil']}</span>
              </p>
              <p>
                <strong>{t(ui.meaning)}:</strong> {t(w.meaning)}
              </p>
              <p className="muted">{t(w.example)}</p>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}

export function BagSheet({ onClose }: { onClose: () => void }) {
  const { t } = useT();
  const s = useAppState();
  const g = currentGame(s);
  return (
    <Sheet title={t(ui.bag)} onClose={onClose}>
      {g.bag.length === 0 ? (
        <p className="muted">{t(ui.bagEmpty)}</p>
      ) : (
        <ul className="bag-list">
          {g.bag.map((id: ItemId) => (
            <li key={id}>
              <ItemIcon id={id} />
              <span className="grow">{t(items[id].name)}</span>
              <button
                type="button"
                className="btn btn-soft btn-sm"
                onClick={() => {
                  sfx.tap();
                  putBack(id);
                }}
              >
                {t(ui.putBack)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}

/** Small item pictures for the bag (same shapes as in the game). */
export function ItemIcon({ id, size = 36 }: { id: ItemId; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 34" aria-hidden="true">
      {id === 'longBamboo' && <rect x="2" y="15" width="32" height="5" rx="2" fill="#b9874f" />}
      {id === 'shortBamboo' && <rect x="12" y="15" width="13" height="5" rx="2" fill="#b9874f" />}
      {id === 'redPaper' && <rect x="8" y="6" width="20" height="22" fill="#d94a3a" />}
      {id === 'bluePaper' && <rect x="8" y="6" width="20" height="22" fill="#4f7fd6" />}
      {id === 'glueJar' && (
        <>
          <rect x="10" y="12" width="16" height="16" rx="3" fill="#e8f1f2" stroke="#c9d3da" />
          <rect x="9" y="8" width="18" height="5" fill="#f2b33d" />
        </>
      )}
      {id === 'soyBottle' && (
        <>
          <rect x="12" y="8" width="12" height="21" rx="3" fill="#3a2420" />
          <rect x="15" y="2" width="6" height="8" fill="#3a2420" />
          <rect x="12" y="15" width="12" height="6" fill="#e86f51" />
        </>
      )}
      {id === 'slipper' && <ellipse cx="18" cy="18" rx="7" ry="13" fill="#4f7fd6" />}
    </svg>
  );
}

