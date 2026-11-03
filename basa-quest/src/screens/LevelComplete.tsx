import { useEffect } from 'react';
import { PLAYABLE_LEVELS, SESSION_MINUTES } from '../config';
import { ui } from '../content/story';
import { LangSwitch } from '../components/Common';
import { IconCheck, IconStar } from '../components/Icons';
import { useT } from '../lib/i18n';
import { closeLevel, openLevel, useAppState, type LevelProgress } from '../lib/store';

export function LevelComplete({ level, lp }: { level: number; lp: LevelProgress }) {
  const { t } = useT();
  const s = useAppState();
  const cheer = ui.cheers[(level - 1) % ui.cheers.length];
  const hasNext = level < PLAYABLE_LEVELS;
  const longSession = s.sessionStart !== null && Date.now() - s.sessionStart >= SESSION_MINUTES * 60_000;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const rows = [
    { got: lp.stars.story, text: t(ui.starStory) },
    { got: lp.stars.questions, text: t(ui.starQuestions) },
    { got: lp.stars.explain, text: t(ui.starExplain) },
  ];

  return (
    <main className="screen complete">
      <header className="topbar">
        <span className="topbar-spacer" />
        <div className="topbar-title" />
        <LangSwitch />
      </header>
      <div className="burst" aria-hidden="true">
        {rows.map((r, i) => (
          <span key={i} className={`big-star ${r.got ? 'got' : ''}`} style={{ animationDelay: `${i * 0.25}s` }}>
            <IconStar size={64} filled={r.got} />
          </span>
        ))}
      </div>
      <h1 className="center">{t(ui.levelDone, { n: level })}</h1>
      <p className="cheer center">{t(cheer)}</p>
      <ul className="star-list">
        {rows.map((r, i) => (
          <li key={i} className={r.got ? 'got' : ''}>
            <IconCheck /> {r.text}
          </li>
        ))}
      </ul>
      {!hasNext && <p className="card center">{t(ui.allDone)}</p>}
      {longSession && <p className="card soft center">{t(ui.breakTime)}</p>}
      <p className="muted center tiny">{t(ui.saved)}</p>
      <div className="stack">
        {hasNext && (
          <button type="button" className="btn btn-primary btn-block" onClick={() => openLevel(level + 1)}>
            {t(ui.nextLevel)}
          </button>
        )}
        <button type="button" className={`btn btn-block ${hasNext ? 'btn-soft' : 'btn-primary'}`} onClick={closeLevel}>
          {t(ui.backToMap)}
        </button>
      </div>
    </main>
  );
}
