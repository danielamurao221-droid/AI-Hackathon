// One playable level: Story -> Questions -> Explain aloud -> Level complete.
import { getChapter, ui } from '../content/story';
import { Stars, TopBar } from '../components/Common';
import { useT } from '../lib/i18n';
import { bandFor, closeLevel, emptyLevel, getProgress, starCount, useAppState } from '../lib/store';
import { ExplainAloud } from './ExplainAloud';
import { LevelComplete } from './LevelComplete';
import { Questions } from './Questions';
import { StoryReader } from './StoryReader';

export function Level({ level }: { level: number }) {
  const s = useAppState();
  const { t } = useT();
  const chapter = getChapter(level);
  if (!chapter || !s.learnerId) {
    return (
      <main className="screen">
        <button type="button" className="btn btn-primary" onClick={closeLevel}>{t(ui.backToMap)}</button>
      </main>
    );
  }
  const p = getProgress(s, s.learnerId);
  const lp = p.levels[level] ?? emptyLevel();
  const band = bandFor(s, s.learnerId);

  if (lp.step === 'done') return <LevelComplete level={level} lp={lp} />;

  const steps = [
    { key: 'story', label: t(ui.stepRead) },
    { key: 'questions', label: t(ui.stepAnswer) },
    { key: 'explain', label: t(ui.stepExplain) },
  ];
  const stepIndex = steps.findIndex((x) => x.key === lp.step);

  return (
    <main className="screen level">
      <TopBar onBack={closeLevel} title={`${t(ui.level)} ${level}`} backLabel={t(ui.backToMap)} />
      <div className="level-head">
        <h1 className="chapter-title">{t(chapter.title)}</h1>
        <Stars count={starCount(lp)} size={20} />
      </div>
      <ol className="steps" aria-label="Steps">
        {steps.map((st, i) => (
          <li key={st.key} className={i < stepIndex ? 'past' : i === stepIndex ? 'now' : ''} aria-current={i === stepIndex ? 'step' : undefined}>
            {st.label}
          </li>
        ))}
      </ol>
      {lp.step === 'story' && <StoryReader chapter={chapter} band={band} page={lp.page} />}
      {lp.step === 'questions' && <Questions chapter={chapter} band={band} q={lp.q} />}
      {lp.step === 'explain' && <ExplainAloud chapter={chapter} learnerId={s.learnerId} />}
    </main>
  );
}
