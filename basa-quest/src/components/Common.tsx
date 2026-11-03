import { useEffect, useRef, useState } from 'react';
import { missingAudio } from '../lib/audio';
import { useT } from '../lib/i18n';
import { setLang, useAppState } from '../lib/store';
import { storageAvailable } from '../lib/storage';
import { ui } from '../content/story';
import { IconBack, IconSpeaker, IconStar, IconStop } from './Icons';

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

export function TopBar({ onBack, title, backLabel }: { onBack?: () => void; title?: string; backLabel?: string }) {
  const { t } = useT();
  return (
    <header className="topbar">
      {onBack ? (
        <button type="button" className="icon-btn" onClick={onBack} aria-label={backLabel ?? t(ui.back)}>
          <IconBack />
        </button>
      ) : (
        <span className="topbar-spacer" />
      )}
      <div className="topbar-title">{title}</div>
      <LangSwitch />
    </header>
  );
}

export function Stars({ count, size = 22, max = 3 }: { count: number; size?: number; max?: number }) {
  return (
    <span className="stars" aria-label={`${count} / ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <IconStar key={i} size={size} filled={i < count} className={i < count ? '' : 'star-empty'} />
      ))}
    </span>
  );
}

/**
 * Plays a recorded file if it exists in public/audio. If the file is missing,
 * shows a friendly "Audio coming soon" note instead. No text-to-speech.
 */
export function ListenButton({ src, small }: { src: string; small?: boolean }) {
  const { t } = useT();
  const [state, setState] = useState<'idle' | 'playing' | 'missing'>(missingAudio.has(src) ? 'missing' : 'idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setState(missingAudio.has(src) ? 'missing' : 'idle');
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [src]);

  function onClick() {
    if (state === 'playing') {
      audioRef.current?.pause();
      setState('idle');
      return;
    }
    if (missingAudio.has(src)) {
      setState('missing');
      return;
    }
    try {
      const a = new Audio(src);
      audioRef.current = a;
      const fail = () => {
        missingAudio.add(src);
        if (audioRef.current === a) setState('missing');
      };
      a.addEventListener('error', fail);
      a.addEventListener('ended', () => audioRef.current === a && setState('idle'));
      setState('playing');
      a.play().catch(fail);
    } catch {
      missingAudio.add(src);
      setState('missing');
    }
  }

  return (
    <div className={`listen ${small ? 'listen-small' : ''}`}>
      <button type="button" className="btn btn-soft" onClick={onClick} aria-pressed={state === 'playing'}>
        {state === 'playing' ? <IconStop /> : <IconSpeaker />}
        <span>{state === 'playing' ? t(ui.stopListening) : t(ui.listen)}</span>
      </button>
      {state === 'missing' && (
        <p className="soon" role="status">
          {t(ui.audioSoon)}
        </p>
      )}
    </div>
  );
}

/** Small note shown once if localStorage is blocked. */
export function StorageNotice() {
  const { t } = useT();
  if (storageAvailable()) return null;
  return <p className="storage-note">{t(ui.storageOff)}</p>;
}

export function DemoBadge() {
  return <span className="demo-badge">Demo prototype: sample data only</span>;
}
