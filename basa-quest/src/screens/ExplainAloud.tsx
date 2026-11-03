// Question 5: explain an answer out loud.
// Audio is recorded with MediaRecorder and kept in memory only (see lib/recordings.ts).
// If the mic is missing or blocked, the child can "Tell a partner" and continue.
import { useEffect, useRef, useState } from 'react';
import { MAX_RECORDING_SECONDS } from '../config';
import { ui } from '../content/story';
import { ListenButton } from '../components/Common';
import { IconCheck, IconMic, IconPeople, IconPlay, IconStop } from '../components/Icons';
import { questionAudio } from '../lib/audio';
import { useT } from '../lib/i18n';
import { getRecording, setRecording } from '../lib/recordings';
import { finishExplain } from '../lib/store';
import type { Chapter } from '../types';

type Mode = 'idle' | 'asking' | 'recording' | 'recorded' | 'partner';

export function ExplainAloud({ chapter, learnerId }: { chapter: Chapter; learnerId: string }) {
  const { t, lang } = useT();
  const key = `${learnerId}-${chapter.level}`;
  const [mode, setMode] = useState<Mode>(getRecording(key) ? 'recorded' : 'idle');
  const [micFailed, setMicFailed] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const playerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    return () => {
      // Leaving the screen: stop the mic and any playback.
      window.clearTimeout(timerRef.current);
      try {
        if (recRef.current?.state === 'recording') recRef.current.stop();
      } catch {
        /* ignore */
      }
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      playerRef.current?.pause();
    };
  }, []);

  function goPartner() {
    stopStream();
    setMode('partner');
  }

  function stopStream() {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
  }

  async function startRecording() {
    playerRef.current?.pause();
    const canRecord =
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof window.MediaRecorder !== 'undefined';
    if (!canRecord) {
      setMicFailed(true);
      setMode('partner');
      return;
    }
    setMode('asking');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const rec = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      rec.onstop = () => {
        stopStream();
        window.clearTimeout(timerRef.current);
        if (chunks.length === 0) {
          setMicFailed(true);
          setMode('partner');
          return;
        }
        const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
        setRecording(key, URL.createObjectURL(blob));
        setMode('recorded');
      };
      rec.onerror = () => {
        stopStream();
        setMicFailed(true);
        setMode('partner');
      };
      recRef.current = rec;
      rec.start();
      setMode('recording');
      timerRef.current = window.setTimeout(() => stopRecording(), MAX_RECORDING_SECONDS * 1000);
    } catch {
      stopStream();
      setMicFailed(true);
      setMode('partner');
    }
  }

  function stopRecording() {
    try {
      if (recRef.current?.state === 'recording') recRef.current.stop();
    } catch {
      setMode('partner');
    }
  }

  function play() {
    const url = getRecording(key);
    if (!url) return;
    try {
      playerRef.current?.pause();
      const a = new Audio(url);
      playerRef.current = a;
      a.play().catch(() => undefined);
    } catch {
      /* ignore */
    }
  }

  return (
    <section className="explain">
      <p className="q-count">{t(ui.questionOf, { n: 5, m: 5 })}</p>
      <h2 className="q-prompt" lang={lang}>{t(chapter.explain.prompt)}</h2>
      <ListenButton src={questionAudio(lang, chapter.level, 5)} small />

      <div className="starter">
        <span className="muted">{t(ui.startWith)}</span>
        <strong lang={lang}>{t(chapter.explain.starter)}</strong>
      </div>

      {mode !== 'partner' && (
        <div className="recorder card">
          {mode === 'idle' && <p>{t(ui.explainHow)}</p>}
          {mode === 'asking' && <p role="status">{t(ui.waitingMic)}</p>}
          {mode === 'recording' && (
            <p role="status" className="rec-live"><span className="rec-dot" /> {t(ui.recording)}</p>
          )}
          {mode === 'recorded' && <p role="status"><IconCheck className="ok-ic" /> {t(ui.recorded)}</p>}

          {(mode === 'idle' || mode === 'asking') && (
            <button type="button" className="mic-btn" onClick={startRecording} disabled={mode === 'asking'}>
              <IconMic size={40} />
              <span>{t(ui.record)}</span>
            </button>
          )}
          {mode === 'recording' && (
            <button type="button" className="mic-btn recording" onClick={stopRecording}>
              <IconStop size={36} />
              <span>{t(ui.stop)}</span>
            </button>
          )}
          {mode === 'recorded' && (
            <div className="row-btns">
              <button type="button" className="btn btn-soft grow" onClick={play}>
                <IconPlay /> <span>{t(ui.play)}</span>
              </button>
              <button type="button" className="btn btn-soft grow" onClick={startRecording}>
                <IconMic /> <span>{t(ui.reRecord)}</span>
              </button>
            </div>
          )}
          <p className="tiny muted">{t(ui.voiceNote)}</p>
        </div>
      )}

      {mode === 'partner' && (
        <div className="card partner">
          {micFailed && <p className="gentle">{t(ui.micFail)}</p>}
          <div className="partner-head">
            <IconPeople size={40} />
            <strong>{t(ui.tellPartner)}</strong>
          </div>
          <p>{t(ui.tellPartnerHow)}</p>
          <button type="button" className="btn btn-primary btn-block" onClick={() => finishExplain(chapter.level)}>
            <IconCheck /> <span>{t(ui.iToldPartner)}</span>
          </button>
        </div>
      )}

      {mode === 'recorded' && (
        <button type="button" className="btn btn-primary btn-block" onClick={() => finishExplain(chapter.level)}>
          <IconCheck /> <span>{t(ui.doneExplaining)}</span>
        </button>
      )}
      {mode !== 'partner' && mode !== 'recording' && (
        <button type="button" className="btn btn-ghost btn-block" onClick={goPartner}>
          <IconPeople /> <span>{t(ui.orTellPartner)}</span>
        </button>
      )}
    </section>
  );
}
