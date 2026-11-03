// Safe wrapper around localStorage. Every access is in try/catch.
// If localStorage is blocked (private mode, disabled, full), we fall back to
// an in-memory copy so the app keeps working for the current page visit.

const memory = new Map<string, string>();
let works: boolean | null = null;

export function storageAvailable(): boolean {
  if (works !== null) return works;
  try {
    const k = '__bq_test__';
    window.localStorage.setItem(k, k);
    window.localStorage.removeItem(k);
    works = true;
  } catch {
    works = false;
  }
  return works;
}

export function readJSON<T>(key: string): T | null {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    raw = null;
  }
  if (raw === null) raw = memory.get(key) ?? null;
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeJSON(key: string, value: unknown): void {
  let raw: string;
  try {
    raw = JSON.stringify(value);
  } catch {
    return;
  }
  memory.set(key, raw);
  try {
    window.localStorage.setItem(key, raw);
  } catch {
    works = false;
  }
}

export function removeKey(key: string): void {
  memory.delete(key);
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
