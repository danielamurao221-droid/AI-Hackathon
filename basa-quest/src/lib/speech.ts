// Phone voice: reads a line aloud with the device's built-in text-to-speech when no recorded
// file exists yet. Recorded files in public/audio always play first.
// Filipino is only read with a real Filipino/Tagalog voice; if the device has none, the
// Listen button shows "Audio coming soon" instead of reading Filipino in an English accent.
import { PHONE_VOICE } from '../config';
import type { Lang } from '../types';

let voices: SpeechSynthesisVoice[] = [];

function synth(): SpeechSynthesis | null {
  try {
    return typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
  } catch {
    return null;
  }
}

function load() {
  const s = synth();
  if (!s) return;
  try {
    voices = s.getVoices();
  } catch {
    voices = [];
  }
}
load();
try {
  synth()?.addEventListener?.('voiceschanged', load);
} catch {
  /* ignore */
}

const MATCH: Record<Lang, RegExp[]> = {
  // Filipino voices are usually tagged fil-PH or tl-PH.
  fil: [/^fil([-_]|$)/i, /^tl([-_]|$)/i],
  // Philippine English first, then any English.
  en: [/^en[-_]PH/i, /^en([-_]|$)/i],
};

/** Best installed voice for a language (on-device voices first), or null. */
export function pickVoice(lang: Lang): SpeechSynthesisVoice | null {
  if (!PHONE_VOICE) return null;
  if (voices.length === 0) load();
  for (const re of MATCH[lang]) {
    const found = voices.filter((v) => re.test(v.lang));
    if (found.length) return found.find((v) => v.localService) ?? found[0];
  }
  return null;
}

/** Speak `text`. Returns false (and does nothing) if there is no suitable voice. */
export function speak(text: string, lang: Lang, onEnd: () => void): boolean {
  const s = synth();
  const voice = pickVoice(lang);
  if (!s || !voice) return false;
  try {
    s.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/\[\[(.+?)\]\]/g, '$1'));
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = 0.85; // a little slower for young readers
    u.pitch = 1.05;
    u.onend = onEnd;
    u.onerror = onEnd;
    s.speak(u);
    return true;
  } catch {
    return false;
  }
}

export function stopSpeaking() {
  try {
    synth()?.cancel();
  } catch {
    /* ignore */
  }
}
