// Simple background music made with the Web Audio API (no audio files).
// Quiet pentatonic loops; silent when the game is muted.
import { tone } from './sfx';

const F: Record<string, number> = {
  C4: 261.6, D4: 293.7, E4: 329.6, G4: 392, A4: 440, C5: 523.3, D5: 587.3, E5: 659.3, G3: 196, A3: 220, C3: 130.8, E3: 164.8,
};

interface Song {
  bpm: number;
  melody: (string | null)[];
  bass: (string | null)[];
  loop: boolean;
  vol: number;
}

const SONGS: Record<'world' | 'race' | 'win', Song> = {
  world: {
    bpm: 92,
    melody: ['G4', 'E4', 'G4', 'A4', 'G4', 'E4', 'D4', null, 'E4', 'G4', 'A4', 'C5', 'A4', 'G4', 'E4', null],
    bass: ['C3', null, 'G3', null, 'A3', null, 'G3', null, 'C3', null, 'E3', null, 'A3', null, 'G3', null],
    loop: true,
    vol: 0.035,
  },
  race: {
    bpm: 132,
    melody: ['C5', 'A4', 'G4', 'A4', 'C5', 'D5', 'E5', null, 'D5', 'C5', 'A4', 'G4', 'A4', 'C5', 'A4', null],
    bass: ['C3', 'C3', 'G3', 'G3', 'A3', 'A3', 'E3', 'E3', 'C3', 'C3', 'G3', 'G3', 'A3', 'A3', 'G3', 'G3'],
    loop: true,
    vol: 0.03,
  },
  win: {
    bpm: 150,
    melody: ['C5', 'E5', 'G4', 'C5', 'E5', 'G4', 'C5', 'D5', 'E5', null, null, null],
    bass: ['C3', null, 'E3', null, 'G3', null, 'C3', null, 'C3', null, null, null],
    loop: false,
    vol: 0.06,
  },
};

let timer: number | undefined;
let current: keyof typeof SONGS | null = null;

export function playMusic(name: keyof typeof SONGS) {
  if (current === name) return;
  stopMusic();
  current = name;
  const song = SONGS[name];
  const beat = 60 / song.bpm;
  let i = 0;
  timer = window.setInterval(() => {
    const m = song.melody[i % song.melody.length];
    const b = song.bass[i % song.bass.length];
    if (m) tone(F[m], 0, beat * 0.9, 'triangle', song.vol);
    if (b) tone(F[b], 0, beat * 1.6, 'sine', song.vol * 1.2);
    i += 1;
    if (!song.loop && i >= song.melody.length) {
      stopMusic();
      if (name === 'win') playMusic('world');
    }
  }, beat * 1000);
}

export function stopMusic() {
  window.clearInterval(timer);
  timer = undefined;
  current = null;
}
