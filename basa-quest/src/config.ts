// Basa Quest: app-wide settings. Change the app name here only.
export const APP_NAME = 'Basa Quest';

/** Demo class code that students type on the login screen. */
export const CLASS_CODE = 'DEMO123';

/** Planned levels (for the "Level 1 of 100" goal) and how many are playable now. */
export const TOTAL_LEVELS = 100;
export const PLAYABLE_LEVELS = 1;

/** Learner loaded by the presenter's "Show sample learner" button. */
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

export const STORAGE_KEY = 'basaquest.demo.v2';
