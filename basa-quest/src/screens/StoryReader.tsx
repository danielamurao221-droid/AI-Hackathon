import { useEffect } from 'react';
import { ui } from '../content/story';
import { ListenButton } from '../components/Common';
import { IconBack, IconCheck, IconNext } from '../components/Icons';
import { Scene } from '../components/Scene';
import { pageAudio } from '../lib/audio';
import { useT } from '../lib/i18n';
import { finishStory, setPage } from '../lib/store';
import type { Band, Chapter } from '../types';

export function StoryReader({ chapter, band, page }: { chapter: Chapter; band: Band; page: number }) {
  const { t, lang } = useT();
  const pages = chapter.pages[band];
  const i = Math.min(Math.max(page, 0), pages.length - 1);
  const last = i === pages.length - 1;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [i]);

  return (
    <section className="story">
      <Scene level={chapter.level} page={i} />
      <div className="page-dots" aria-label={t(ui.pageOf, { n: i + 1, m: pages.length })}>
        {pages.map((_, k) => (
          <span key={k} className={k === i ? 'on' : k < i ? 'seen' : ''} />
        ))}
      </div>
      <ListenButton src={pageAudio(lang, chapter.level, band, i + 1)} />
      <p className="story-text" lang={lang}>{t(pages[i])}</p>
      <p className="muted center">{t(ui.pageOf, { n: i + 1, m: pages.length })}</p>
      <div className="row-btns">
        <button
          type="button"
          className="btn btn-soft"
          onClick={() => setPage(chapter.level, i - 1)}
          disabled={i === 0}
          aria-label={t(ui.back)}
        >
          <IconBack /> <span>{t(ui.back)}</span>
        </button>
        {last ? (
          <button type="button" className="btn btn-primary grow" onClick={() => finishStory(chapter.level)}>
            <IconCheck /> <span>{t(ui.doneReading)}</span>
          </button>
        ) : (
          <button type="button" className="btn btn-primary grow" onClick={() => setPage(chapter.level, i + 1)}>
            <span>{t(ui.next)}</span> <IconNext />
          </button>
        )}
      </div>
    </section>
  );
}
