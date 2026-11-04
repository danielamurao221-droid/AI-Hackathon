// Game type: EXPLAIN ALOUD. The child answers "Bakit?" out loud. The meaning is never graded.
// Audio is recorded with MediaRecorder and kept in memory only (see lib/recordings.ts).
// If the mic is missing or blocked, the child can "Tell a partner" and continue.
// No reward is given for this step: it is a conversation, not a test.
import { useEffect, useRef, useState } from 'react';
import { MAX_RECORDING_SECONDS } from '../config';
import { ui } from '../content/ui';
import { Bubble } from '../components/Common';
import { IconCheck, IconMic, IconPeople, IconPlay, IconStop } from '../components/Icons';
import { useT } from '../lib/i18n';
import { getRecording, setRecording } from '../lib/recordings';
import { sfx } from '../lib/sfx';
import { setExplain, type ExplainMode } from '../lib/store';
import type { ExplainScene as Explain, ExplainSpec } from '../types';
import { useSeen, type SceneCtx } from './shared';

type Mode = 'idle' | 'asking' | 'recording' | 'recorded' | 'partner';

/** Reusable recorder block: prompt, sentence starter, record / replay / re-record, partner fallback. */
export function ExplainAloud({
  spec,
  level,
  recKey,
  done,
  onDone,
}: {
  spec: ExplainSpec;
  level: number;
  /** Key for the in-memory recording (e.g. learner + scene). */
  recKey: string;
  done: boolean;
  onDone: (mode: ExplainMode) => void;
}) {
  const { t, lang } = useT();
  const [mode, setMode] = useState<Mode>(getRecording(recKey) ? 'recorded' : 'idle');
  const [micFailed, setMicFailed] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const playerRef = useRef<HTMLAudioElement | null>(null);
  useSeen(level, [spec.prompt]);

  useEffect(() => {
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

  function stopStream() {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
  }

  function goPartner() {
    stopStream();
    sfx.tap();
    setMode('partner');
  }

  async function startRecording() {
    playerRef.current?.pause();
    sfx.tap();
    const canRecord =
      typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof window.MediaRecorder !== 'undefined';
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
        setRecording(recKey, URL.createObjectURL(blob));
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
    const url = getRecording(recKey);
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

  function finish(m: ExplainMode) {
    sfx.good();
    onDone(m);
  }

  return (
    <div className="explain">
      <Bubble line={spec.prompt} level={level} />
      <div className="starter">
        <span className="muted">{t(ui.startWith)}</span>
        <strong lang={lang}>{t(spec.starter)}</strong>
      </div>

      {done ? null : mode !== 'partner' ? (
        <div className="recorder card">
          {mode === 'idle' && <p>{t(ui.explainHow)}</p>}
          {mode === 'asking' && <p role="status">{t(ui.waitingMic)}</p>}
          {mode === 'recording' && (
            <p role="status" className="rec-live">
              <span className="rec-dot" /> {t(ui.recording)}
            </p>
          )}
          {mode === 'recorded' && (
            <p role="status">
              <IconCheck className="ok-ic" /> {t(ui.recorded)}
            </p>
          )}
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
                <IconPlay /> <span>{t(ui.play_)}</span>
              </button>
              <button type="button" className="btn btn-soft grow" onClick={startRecording}>
                <IconMic /> <span>{t(ui.reRecord)}</span>
              </button>
            </div>
          )}
          <p className="tiny muted">{t(ui.voiceNote)}</p>
          {mode === 'recorded' && (
            <button type="button" className="btn btn-primary btn-block" onClick={() => finish('recorded')}>
              <IconCheck /> <span>{t(ui.doneExplaining)}</span>
            </button>
          )}
          {mode !== 'recording' && (
            <button type="button" className="btn btn-ghost btn-block" onClick={goPartner}>
              <IconPeople /> <span>{t(ui.orTellPartner)}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="card partner">
          {micFailed && <p className="gentle">{t(ui.micFail)}</p>}
          <div className="partner-head">
            <IconPeople size={40} />
            <strong>{t(ui.tellPartner)}</strong>
          </div>
          <p>{t(ui.tellPartnerHow)}</p>
          <button type="button" className="btn btn-primary btn-block" onClick={() => finish('partner')}>
            <IconCheck /> <span>{t(ui.iToldPartner)}</span>
          </button>
        </div>
      )}
      {!done && mode !== 'recording' && (
        <button type="button" className="link-btn" onClick={() => finish('skipped')}>
          {t(ui.skipExplain)}
        </button>
      )}
    </div>
  );
}

/** Stand-alone explain scene (for later levels). Level 1 uses ExplainAloud inside the decide scene. */
export function ExplainScene({ scene, ctx, learnerId }: { scene: Explain; ctx: SceneCtx; learnerId: string }) {
  useSeen(ctx.level, scene.lines);
  return (
    <section className="scene-body">
      {scene.lines.map((line) => (
        <Bubble key={line.id} line={line} level={ctx.level} />
      ))}
      <ExplainAloud
        spec={scene.explain}
        level={ctx.level}
        recKey={`${learnerId}-${scene.id}`}
        done={ctx.solved}
        onDone={(m) => {
          setExplain(ctx.level, m);
          ctx.onSolved(0);
        }}
      />
    </section>
  );
}
