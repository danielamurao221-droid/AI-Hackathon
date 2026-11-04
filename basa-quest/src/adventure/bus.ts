// A tiny event bus between the Phaser game and the React overlay, plus shared input.
// Phaser draws the world; React shows all text (so language switching never restarts the game).

type Handler = (payload?: unknown) => void;
const handlers = new Map<string, Set<Handler>>();

export const bus = {
  on(evt: string, fn: Handler): () => void {
    if (!handlers.has(evt)) handlers.set(evt, new Set());
    handlers.get(evt)!.add(fn);
    return () => handlers.get(evt)?.delete(fn);
  },
  emit(evt: string, payload?: unknown) {
    handlers.get(evt)?.forEach((fn) => {
      try {
        fn(payload);
      } catch (e) {
        console.error(e);
      }
    });
  },
};

/** Shared input: the on-screen joystick writes here, Phaser reads it every frame. */
export const input = {
  dx: 0,
  dy: 0,
  /** True while a dialogue, notebook or panel is open: the world stops moving. */
  paused: false,
};

export type InteractKind = 'talk' | 'pick' | 'look' | 'read' | 'race';

/** What the player is standing next to (null when nothing). */
export interface NearInfo {
  id: string;
  kind: InteractKind;
}

export const reducedMotion = (() => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
})();
