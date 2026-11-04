// Basa Quest: app-wide settings. Change the app name here only.
export const APP_NAME = 'Basa Quest';

/** Demo class code that students type on the login screen. */
export const CLASS_CODE = 'DEMO123';

/** Planned levels, for the "Level 1 of 100" goal. Only Level 1 is playable. */
export const TOTAL_LEVELS = 100;

/** Learner loaded by the presenter's "Show sample learner" button (Quests 1–2 done). */
export const SAMPLE_LEARNER_ID = 'L07';

/**
 * Recorded audio lives in public/audio. See README "Add audio".
 * Text that differs by band:  /audio/{fil|en}/level-{n}/band-{a|b}/{line-id}.mp3
 * Text shared by both bands:  /audio/{fil|en}/level-{n}/{line-id}.mp3
 */
export const AUDIO_BASE = `${import.meta.env.BASE_URL}audio`;
export const AUDIO_EXT = 'mp3';

/** A gentle "time for a break" note appears after this many minutes. */
export const SESSION_MINUTES = 10;

/** Longest explain-aloud recording, in seconds. */
export const MAX_RECORDING_SECONDS = 90;

/** After this many wrong tries, offer Makinig + one clue-based hint. */
export const HINT_AFTER = 2;
/** After this many wrong tries, a soft sparkle appears near the target. */
export const SPARKLE_AFTER = 4;

/** Kite Day race: height to reach (metres) and the longest a run can last (seconds). */
export const RACE_TARGET = 100;
export const RACE_MAX_SECONDS = 60;

export const STORAGE_KEY = 'basaquest.demo.v3';
