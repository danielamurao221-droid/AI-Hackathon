export type Lang = 'fil' | 'en';

/** Reading band. Band A = shorter text, Band B = longer text. Never shown to children. */
export type Band = 'A' | 'B';

/** A piece of text in both languages. */
export type Bi = Record<Lang, string>;

export type Skill = 'wordReading' | 'vocabulary' | 'details' | 'explaining';

export type QuestionKind = 'why' | 'how' | 'feeling' | 'predict' | 'word';

export interface TapQuestion {
  id: string;
  kind: QuestionKind;
  /** Which teacher-dashboard skill this question gives evidence for. */
  skill: Skill;
  prompt: Bi;
  choices: Bi[];
  /** Index of the correct choice. */
  answer: number;
  /** Shown after a wrong tap. Gentle, points back to the story. */
  hint: Bi;
  /** Shown after the correct tap. Explains why it is correct. */
  explain: Bi;
}

export interface ExplainQuestion {
  id: string;
  prompt: Bi;
  /** Sentence starter to help the child begin. */
  starter: Bi;
}

export interface Chapter {
  level: number;
  title: Bi;
  /** Pages per band. Filipino and English share the same page count. */
  pages: Record<Band, Bi[]>;
  questions: TapQuestion[];
  explain: ExplainQuestion;
}

export type PicId = 'mango' | 'cat' | 'sun' | 'fish' | 'star' | 'boat' | 'flower' | 'tree' | 'ball';
