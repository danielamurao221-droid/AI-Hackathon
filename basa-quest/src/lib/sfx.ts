// Small sound effects made with the Web Audio API. No sound files, no network.
// Every call is safe: if audio is unavailable or muted, nothing happens.
import { getState } from './store';

type Win = Window & { webkitAudioContext?: typeof AudioContext };
let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (getState().muted) return null;
  try {
    if (!ctx) {
      const C = window.AudioContext ?? (window as Win).webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, at: number, dur: number, type: OscillatorType = 'sine', vol = 0.12, slideTo?: number) {
  const a = audio();
  if (!a) return;
  try {
    const t0 = a.currentTime + at;
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(a.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  } catch {
    /* ignore */
  }
}

function noise(at: number, dur: number, vol = 0.05) {
  const a = audio();
  if (!a) return;
  try {
    const len = Math.floor(a.sampleRate * dur);
    const buf = a.createBuffer(1, len, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = a.createBufferSource();
    const filter = a.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 900;
    const gain = a.createGain();
    gain.gain.value = vol;
    src.buffer = buf;
    src.connect(filter).connect(gain).connect(a.destination);
    src.start(a.currentTime + at);
  } catch {
    /* ignore */
  }
}

export const sfx = {
  tap: () => tone(660, 0, 0.06, 'triangle', 0.06),
  pick: () => tone(520, 0, 0.08, 'triangle', 0.08, 700),
  place: () => {
    tone(220, 0, 0.09, 'triangle', 0.14);
    tone(330, 0.03, 0.07, 'sine', 0.06);
  },
  good: () => {
    tone(523, 0, 0.12, 'triangle', 0.1);
    tone(784, 0.09, 0.2, 'triangle', 0.1);
  },
  hint: () => tone(392, 0, 0.22, 'sine', 0.08, 330),
  wobble: () => {
    tone(300, 0, 0.12, 'sawtooth', 0.04, 240);
    tone(260, 0.12, 0.12, 'sawtooth', 0.04, 300);
  },
  ribbon: () => [659, 784, 988, 1319].forEach((f, i) => tone(f, i * 0.07, 0.18, 'triangle', 0.08)),
  word: () => [523, 659, 784].forEach((f, i) => tone(f, i * 0.06, 0.16, 'sine', 0.09)),
  whoosh: () => noise(0, 0.6, 0.06),
  restore: () => {
    noise(0, 0.4, 0.03);
    [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.1 + i * 0.1, 0.3, 'triangle', 0.08));
  },
};
