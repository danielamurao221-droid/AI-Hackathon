import { useEffect, useRef, useState, type ReactNode } from 'react';
import { charNames, ui } from '../content/ui';
import { lineAudio, missingAudio } from '../lib/audio';
import { useT } from '../lib/i18n';
import { sfx } from '../lib/sfx';
import { setLang, setMuted, useAppState } from '../lib/store';
import { storageAvailable } from '../lib/storage';
import type { Line, Mood } from '../types';
import { Character } from './Character';
import { IconClose, IconSoundOff, IconSpeaker, IconStop } from './Icons';

/** Filipino / English switch. Available on every child screen. */
export function LangSwitch() {
  const { lang } = useAppState();
  return (
    <div className="lang-switch" role="group" aria-label="Language / Wika">
      <button type="button" aria-pressed={lang === 'fil'} onClick={() => setLang('fil')} lang="fil">
        Filipino
      </button>
      <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')} lang="en">
        English
      </button>
    </div>
  );
}

export function MuteButton() {
  const { muted } = useAppState();
  const { t } = useT();
  return (
    <button
      type="button"
      className="icon-btn"
      aria-pressed={muted}
      aria-label={muted ? t(ui.soundOn) : t(ui.soundOff)}
      title={muted ? t(ui.soundOn) : t(ui.soundOff)}
      onClick={() => {
        setMuted(!muted);
        if (muted) window.setTimeout(() => sfx.tap(), 0);
      }}
    >
      {muted ? <IconSoundOff /> : <IconSpeaker />}
    </button>
  );
}

/** Renders text, turning [[word]] into a highlighted word. */
export function RichText({ text, onWord, wordLabel }: { text: string; onWord?: () => void; wordLabel?: string }) {
  const parts = text.split(/\[\[(.+?)\]\]/g);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 0 ? (
          <span key={i}>{p}</span>
        ) : onWord ? (
          <button key={i} type="button" className="hl-word tappable" onClick={onWord} aria-label={wordLabel ? `${p}: ${wordLabel}` : p}>
            {p}
          </button>
        ) : (
          <mark key={i} className="hl-word">
            {p}
          </mark>
        ),
      )}
    </>
  );
}

/**
 * Plays recorded files in order if they exist in public/audio. If the first file is
 * missing, shows a friendly "Audio coming soon" note instead. No text-to-speech.
 */
export function ListenButton({ srcs, compact }: { srcs: string[]; compact?: boolean }) {
  const { t } = useT();
  const key = srcs.join('|');
  const [state, setState] = useState<'idle' | 'playing' | 'missing'>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setState(srcs.length && missingAudio.has(srcs[0]) ? 'missing' : 'idle');
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [key]);

  function playFrom(i: number) {
    const src = srcs[i];
    if (!src) {
      setState('idle');
      return;
    }
    if (missingAudio.has(src)) {
      setState(i === 0 ? 'missing' : 'idle');
      return;
    }
    try {
      const a = new Audio(src);
      audioRef.current = a;
      const fail = () => {
        missingAudio.add(src);
        if (audioRef.current === a) setState(i === 0 ? 'missing' : 'idle');
      };
      a.addEventListener('error', fail);
      a.addEventListener('ended', () => audioRef.current === a && playFrom(i + 1));
      a.play().catch(fail);
    } catch {
      missingAudio.add(src);
      setState('missing');
    }
  }

  function onClick() {
    if (state === 'playing') {
      audioRef.current?.pause();
      setState('idle');
      return;
    }
    setState('playing');
    playFrom(0);
  }

  const label = state === 'playing' ? t(ui.stopListening) : t(ui.listen);
  return (
    <span className={`listen ${compact ? 'listen-compact' : ''}`}>
      <button
        type="button"
        className={compact ? 'icon-btn icon-btn-soft' : 'btn btn-soft btn-sm listen-btn'}
        onClick={onClick}
        aria-pressed={state === 'playing'}
        aria-label={compact ? label : undefined}
        title={compact ? label : undefined}
      >
        {state === 'playing' ? <IconStop size={20} /> : <IconSpeaker size={20} />}
        {!compact && <span>{label}</span>}
      </button>
      {state === 'missing' && (
        <span className="soon" role="status">
          {t(ui.audioSoon)}
        </span>
      )}
    </span>
  );
}

/** A character saying a line, with a Listen button. */
export function Bubble({
  line,
  level,
  inBandFolder,
  moodOverride,
  onWord,
  wordLabel,
}: {
  line: Line;
  level: number;
  inBandFolder?: boolean;
  moodOverride?: Mood;
  onWord?: () => void;
  wordLabel?: string;
}) {
  const { t, tx, lang, band } = useT();
  const src = lineAudio(line, lang, level, band, inBandFolder);
  return (
    <div className={`bubble-row ${line.who ? '' : 'narration'}`} data-line={line.id}>
      {line.who && (
        <div className="bubble-who">
          <Character who={line.who} mood={moodOverride ?? line.mood ?? 'happy'} size={52} />
          <span className="bubble-name">{t(charNames[line.who])}</span>
        </div>
      )}
      <div className="bubble">
        <p className="clue-text" lang={lang}>
          <RichText text={tx(line.text)} onWord={onWord} wordLabel={wordLabel} />
        </p>
        <ListenButton srcs={[src]} />
      </div>
    </div>
  );
}

/** Hint (after a wrong try) or success message, with a character reaction. */
export function Feedback({ kind, text, src, who = 'tala' }: { kind: 'hint' | 'good'; text: string; src: string; who?: Line['who'] }) {
  const { t, lang } = useT();
  return (
    <div className={`feedback ${kind}`} role="status" aria-live="polite">
      {who && <Character who={who} mood={kind === 'good' ? 'happy' : 'think'} size={44} />}
      <div className="feedback-body">
        {kind === 'hint' && <strong>{t(ui.tryAgainHint)}</strong>}
        <p lang={lang}>{text}</p>
      </div>
      <ListenButton srcs={[src]} compact />
    </div>
  );
}

/** Bottom sheet on phones, centred dialog on wider screens. */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const { t } = useT();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="grow">{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t(ui.close)}>
            <IconClose />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Short message that fades out by itself. */
export function useToast(): [ReactNode, (msg: ReactNode) => void] {
  const [msg, setMsg] = useState<ReactNode>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const show = (m: ReactNode) => {
    window.clearTimeout(timer.current);
    setMsg(m);
    timer.current = window.setTimeout(() => setMsg(null), 2800);
  };
  return [
    msg ? (
      <div className="toast" role="status">
        {msg}
      </div>
    ) : null,
    show,
  ];
}

/** Small note shown if localStorage is blocked. */
export function StorageNotice() {
  const { t } = useT();
  if (storageAvailable()) return null;
  return <p className="storage-note">{t(ui.storageOff)}</p>;
}

export function DemoBadge() {
  return <span className="demo-badge">Demo prototype: sample data only</span>;
}
