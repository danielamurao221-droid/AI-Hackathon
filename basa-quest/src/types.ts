export type Lang = 'fil' | 'en';

/** Reading band. Band A = shorter text and easier words, Band B = longer text. Never shown to children. */
export type Band = 'A' | 'B';

/** A piece of text in both languages. */
export type Bi = Record<Lang, string>;

/** Text that may differ by reading band. Use a plain Bi when both bands share it. */
export type BText = Bi | { A: Bi; B: Bi };

export type Skill = 'wordReading' | 'vocabulary' | 'details' | 'explaining';

export type CharId = 'tala' | 'nonoy' | 'lolo';
export type Mood = 'happy' | 'think' | 'sad' | 'wow';

export type PicId = 'mango' | 'cat' | 'sun' | 'fish' | 'star' | 'boat' | 'flower' | 'tree' | 'ball';

export type RibbonColor = 'sun' | 'teal' | 'coral' | 'violet';

/**
 * One readable clue or line of dialogue. `id` names its audio file and its entry in
 * "Balikan ang kuwento" (story so far). Wrap a word in [[double brackets]] to highlight it.
 */
export interface Line {
  id: string;
  who?: CharId;
  mood?: Mood;
  text: BText;
}

interface SceneBase {
  id: string;
  title: Bi;
  /** Teacher-dashboard skill this scene gives evidence for. */
  skill?: Skill;
  /** Solving this scene earns a kite ribbon of this colour. */
  ribbon?: RibbonColor;
}

// ── Do what the text says: tap the right place or card ──
export type MapArt = 'storeBlue' | 'bakery' | 'workshop' | 'mangoTree' | 'coconutTree';
export interface PickTarget {
  id: string;
  label: Bi;
  art?: MapArt;
  /** Position on the map board, 0-100 (% of width / height). */
  x?: number;
  y?: number;
}
export interface PickRound {
  lines: Line[];
  prompt: Line;
  answer: string;
  /** Hint per wrong target id, plus `default`. */
  hints: Record<string, Bi>;
  success: Bi;
}
export interface PickScene extends SceneBase {
  kind: 'pick';
  board: 'map' | 'cards';
  targets: PickTarget[];
  rounds: PickRound[];
}

// ── Do what the text says: build by following steps ──
export type KitePart = 'long' | 'short' | 'string' | 'paper';
export type KiteSlot = 'vertical' | 'acrossTop' | 'acrossMid' | 'knotTop' | 'knotMid' | 'knotEnd' | 'paper';
export interface BuildStep {
  line: Line;
  part: KitePart;
  slot: KiteSlot;
  /** For the paper step: how many edges must be folded. */
  folds?: number;
  hint: Bi;
}
export interface BuildScene extends SceneBase {
  kind: 'build';
  lines: Line[];
  noteTitle: Bi;
  steps: BuildStep[];
  parts: { id: KitePart; label: Bi }[];
  success: Bi;
}

// ── Find the proof ──
export interface ProofScene extends SceneBase {
  kind: 'proof';
  lines: Line[];
  prompt: Line;
  passageTitle: Bi;
  /** Sentences per band. Audio for these always lives in the band folder. */
  passage: Record<Band, Line[]>;
  answer: string;
  /** Hint per wrong sentence id, plus `default`. */
  hints: Record<string, Bi>;
  success: Bi;
}

// ── Put events in order ──
export interface OrderScene extends SceneBase {
  kind: 'order';
  lines: Line[];
  prompt: Line;
  /** Events in the CORRECT order. The game shuffles them. */
  events: Line[];
  hint: Bi;
  success: Bi;
}

// ── Use a new word ──
export type ItemArt = 'stick' | 'sheet';
export interface WordEntry {
  id: string;
  word: Bi;
  meaning: Bi;
  example: Bi;
}
export interface WordScene extends SceneBase {
  kind: 'word';
  word: WordEntry;
  teach: Line;
  tapWord: Bi;
  task: {
    prompt: Line;
    table: Partial<Record<ItemArt, number>>;
    options: { id: string; label: Bi; items: Partial<Record<ItemArt, number>> }[];
    answer: string;
    hints: Record<string, Bi>;
    success: Bi;
  };
}

// ── Explain aloud ──
export interface ExplainSpec {
  prompt: Line;
  starter: Bi;
}
export interface ExplainScene extends SceneBase {
  kind: 'explain';
  lines: Line[];
  explain: ExplainSpec;
}

// ── Decide with consequences ──
export interface DecideOption {
  id: string;
  label: Bi;
  icon: 'give' | 'keep';
  reply: Line[];
  explain: ExplainSpec;
}
export interface DecideScene extends SceneBase {
  kind: 'decide';
  lines: Line[];
  prompt: Line;
  options: DecideOption[];
}

// ── End of level ──
export interface PayoffScene extends SceneBase {
  kind: 'payoff';
  /** Lines shown for each decide option id. */
  byChoice: Record<string, Line[]>;
  lines: Line[];
  reward: Bi;
  /**
   * Encouragement built from what the child did. Keys: `<sceneId>` (solved first try),
   * `<sceneId>-retry` (solved after hints), `choice-<optionId>`, `explain-recorded`, `explain-partner`.
   */
  praise: Record<string, Bi>;
}

export type Scene =
  | PickScene
  | BuildScene
  | ProofScene
  | OrderScene
  | WordScene
  | ExplainScene
  | DecideScene
  | PayoffScene;

export type PlaceId = 'plaza' | 'talaHome' | 'workshop' | 'nonoyHome' | 'school' | 'market' | 'court' | 'library';

export interface Level {
  level: number;
  reviewed: boolean;
  title: Bi;
  /** Barangay place this level restores. */
  place: PlaceId;
  quest: BText;
  scenes: Scene[];
}
