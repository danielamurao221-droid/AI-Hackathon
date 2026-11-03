// Basa Quest: app-wide settings. Change the app name here only.
export const APP_NAME = 'Basa Quest';

/** Demo class code that students type on the login screen. */
export const CLASS_CODE = 'DEMO123';

/** Levels shown on the map, and how many of them have real content. */
export const TOTAL_LEVELS = 100;
export const PLAYABLE_LEVELS = 3;

/** Learner loaded by the presenter's "Show sample learner" button. */
export const SAMPLE_LEARNER_ID = 'L07';

/**
 * Recorded audio lives in public/audio. See README "Adding audio".
 * Pattern: /audio/{fil|en}/level-{n}/band-{a|b}/page-{p}.mp3
 *          /audio/{fil|en}/level-{n}/question-{q}.mp3
 */
export const AUDIO_BASE = `${import.meta.env.BASE_URL}audio`;
export const AUDIO_EXT = 'mp3';

/** A gentle "time for a break" note appears after this many minutes. */
export const SESSION_MINUTES = 10;

/** Longest explain-aloud recording, in seconds. */
export const MAX_RECORDING_SECONDS = 90;

export const STORAGE_KEY = 'basaquest.demo.v1';
