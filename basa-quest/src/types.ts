export type Lang = 'fil' | 'en';

/** Reading band. Band A = shorter text and easier words, Band B = longer text. Never shown to children. */
export type Band = 'A' | 'B';

/** A piece of text in both languages. */
export type Bi = Record<Lang, string>;

/** Text that may differ by reading band. Use a plain Bi when both bands share it. */
export type BText = Bi | { A: Bi; B: Bi };

/** Skills shown on the teacher dashboard. */
export type Skill = 'details' | 'directions' | 'proof' | 'vocabulary' | 'explaining';

export type CharId = 'tala' | 'nonoy' | 'lolo' | 'nena' | 'jun' | 'muning';
export type Mood = 'happy' | 'think' | 'sad' | 'wow';

export type PicId = 'mango' | 'cat' | 'sun' | 'fish' | 'star' | 'boat' | 'flower' | 'tree' | 'ball';

export type RibbonColor = 'sun' | 'teal' | 'coral' | 'violet';

/**
 * One readable line: speech, a note, or a clue. `id` names its audio file and its entry in
 * the Quest Notebook. Wrap a word in [[double brackets]] to highlight it.
 */
export interface Line {
  id: string;
  who?: CharId;
  mood?: Mood;
  text: BText;
}

export interface WordEntry {
  id: string;
  word: Bi;
  meaning: Bi;
  example: Bi;
  /** The wrong word shown on the other Kite Day word gate. */
  decoy: Bi;
}

// ── Kite workbench (Quest 2) ──
export type KitePart = 'long' | 'short' | 'string' | 'paper';
export type KiteSlot = 'vertical' | 'acrossTop' | 'acrossMid' | 'knotTop' | 'knotMid' | 'knotEnd' | 'paper';
export interface BuildStep {
  line: Line;
  part: KitePart;
  slot: KiteSlot;
  /** For the paper step: how many edges must be folded. */
  folds?: number;
  hint: Line;
}
export interface BuildSpec {
  id: string;
  noteTitle: Bi;
  steps: BuildStep[];
  parts: { id: KitePart; label: Bi }[];
  success: Line;
}

export interface ExplainSpec {
  prompt: Line;
  starter: Bi;
}
