// Explain-aloud recordings live ONLY in browser memory for this page visit.
// They are never uploaded and never written to storage. Logging out, resetting
// the demo, or closing the tab clears them.

const urls = new Map<string, string>();

export function getRecording(key: string): string | undefined {
  return urls.get(key);
}

export function setRecording(key: string, url: string) {
  const old = urls.get(key);
  if (old) URL.revokeObjectURL(old);
  urls.set(key, url);
}

export function clearRecordings() {
  urls.forEach((u) => URL.revokeObjectURL(u));
  urls.clear();
}
