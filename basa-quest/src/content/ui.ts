/*
 * Child-facing interface text (buttons, instructions, messages).
 * STATUS: reviewed: false. Use {name}-style placeholders for values.
 */
import type { Bi, PicId } from '../types';

export const UI_META = { reviewed: false };

/** Names for the picture-password pictures. */
export const pictureNames: Record<PicId, Bi> = {
  mango: { fil: 'mangga', en: 'mango' },
  cat: { fil: 'pusa', en: 'cat' },
  sun: { fil: 'araw', en: 'sun' },
  fish: { fil: 'isda', en: 'fish' },
  star: { fil: 'bituin', en: 'star' },
  boat: { fil: 'bangka', en: 'boat' },
  flower: { fil: 'bulaklak', en: 'flower' },
  tree: { fil: 'puno', en: 'tree' },
  ball: { fil: 'bola', en: 'ball' },
};

export const charNames = {
  tala: { fil: 'Tala', en: 'Tala' },
  nonoy: { fil: 'Nonoy', en: 'Nonoy' },
  lolo: { fil: 'Lolo Ben', en: 'Lolo Ben' },
} satisfies Record<string, Bi>;

/** Spoken names for the spots on the kite build board (for screen readers). */
export const slotNames = {
  vertical: { fil: 'patayong puwesto', en: 'standing-up spot' },
  acrossTop: { fil: 'pahigang puwesto sa itaas', en: 'across spot near the top' },
  acrossMid: { fil: 'pahigang puwesto sa gitna', en: 'across spot in the middle' },
  knotTop: { fil: 'tali sa itaas', en: 'tie spot near the top' },
  knotMid: { fil: 'tali sa gitna', en: 'tie spot in the middle' },
  knotEnd: { fil: 'tali sa dulo sa ibaba', en: 'tie spot at the bottom end' },
  paper: { fil: 'puwesto ng papel', en: 'paper spot' },
} satisfies Record<string, Bi>;

export const ui = {
  // Login
  tagline: { fil: 'Magbasa, tumulong, at buuin ang barangay!', en: 'Read, help, and rebuild the barangay!' },
  enterCode: { fil: 'Ilagay ang class code', en: 'Type your class code' },
  codeHint: { fil: 'Itanong sa guro. Demo code: DEMO123', en: 'Ask your teacher. Demo code: DEMO123' },
  codeWrong: { fil: 'Hindi gumana ang code. Subukan ulit!', en: 'That code didn’t work. Try again!' },
  next: { fil: 'Susunod', en: 'Next' },
  back: { fil: 'Bumalik', en: 'Back' },
  whoAreYou: { fil: 'Sino ka?', en: 'Who are you?' },
  pickPictures: { fil: 'Pindutin ang 2 lihim mong larawan', en: 'Tap your 2 secret pictures' },
  pictureWrong: { fil: 'Hindi pa tama. Subukan ulit!', en: 'Not quite. Let’s try again!' },
  demoPictures: { fil: 'Demo: ang mga larawan mo ay', en: 'Demo: your pictures are' },

  // Map
  hi: { fil: 'Kumusta, {name}!', en: 'Hi, {name}!' },
  mapTitle: { fil: 'Ang Ating Barangay', en: 'Our Barangay' },
  levelOf: { fil: 'Antas {n} ng {m}', en: 'Level {n} of {m}' },
  trophyGoal: { fil: 'Buuin ang buong barangay!', en: 'Rebuild the whole barangay!' },
  ribbons: { fil: 'laso', en: 'ribbons' },
  notebook: { fil: 'Word Notebook', en: 'Word Notebook' },
  notebookEmpty: {
    fil: 'Wala pang salita rito. Makakakuha ka ng bagong salita habang naglalaro.',
    en: 'No words yet. You will collect new words as you play.',
  },
  meaning: { fil: 'Kahulugan', en: 'Meaning' },
  comingSoon: { fil: 'Malapit na', en: 'Coming soon' },
  lockedPlace: {
    fil: '{place}: malapit na! May bagong kapitbahay na darating.',
    en: '{place}: coming soon! A new neighbour is on the way.',
  },
  play: { fil: 'Simulan', en: 'Start' },
  continue: { fil: 'Ituloy', en: 'Continue' },
  playAgain: { fil: 'Laruin ulit', en: 'Play again' },
  sceneOf: { fil: 'Eksena {n} ng {m}', en: 'Scene {n} of {m}' },
  questDone: {
    fil: 'Naibalik mo ang plaza! Malapit nang dumating ang susunod na kapitbahay.',
    en: 'You restored the plaza! The next neighbour is coming soon.',
  },
  nextLevelSoon: { fil: 'Antas 2: malapit na', en: 'Level 2: coming soon' },
  plazaRestored: { fil: 'Makulay na ulit ang plaza!', en: 'The plaza is colourful again!' },
  logout: { fil: 'Lumabas', en: 'Log out' },

  // Level HUD
  backToMap: { fil: 'Bumalik sa barangay', en: 'Back to the barangay' },
  lookBack: { fil: 'Balikan ang kuwento', en: 'Look back at the story' },
  lookBackEmpty: { fil: 'Wala pang clue. Magbasa para makahanap!', en: 'No clues yet. Read to find some!' },
  close: { fil: 'Isara', en: 'Close' },
  soundOn: { fil: 'Buksan ang tunog', en: 'Turn sound on' },
  soundOff: { fil: 'Patayin ang tunog', en: 'Turn sound off' },
  listen: { fil: 'Makinig', en: 'Listen' },
  stopListening: { fil: 'Ihinto', en: 'Stop' },
  audioSoon: { fil: 'Malapit na ang audio! Magpabasa muna sa kaklase o guro.', en: 'Audio coming soon! Ask a classmate or your teacher to read with you.' },
  ribbonGot: { fil: 'Nakakuha ka ng laso!', en: 'You earned a ribbon!' },
  tryAgainHint: { fil: 'Subukan ulit. Heto ang clue:', en: 'Try again. Here’s a clue:' },

  // Build
  parts: { fil: 'Mga gamit', en: 'Parts' },
  buildHow: {
    fil: 'Pindutin ang gamit, saka pindutin kung saan ito ilalagay. Puwede ring i-drag.',
    en: 'Tap a part, then tap where it goes. You can also drag it.',
  },
  testKite: { fil: 'Subukan ang saranggola', en: 'Test the kite' },
  needAllParts: { fil: 'Ilagay muna ang lahat ng gamit.', en: 'Place all the parts first.' },
  notThere: { fil: 'Hindi diyan puwede ang gamit na iyan.', en: 'That part can’t go there.' },
  wobble: { fil: 'Umuuga ang saranggola!', en: 'The kite wobbles!' },
  foldEdge: { fil: 'Itupi ang gilid', en: 'Fold this edge' },
  stepDone: { fil: 'Tapos', en: 'Done' },

  // Proof
  proofFound: { fil: 'Patunay!', en: 'Proof!' },

  // Word
  newWord: { fil: 'Bagong salita!', en: 'New word!' },
  addedToNotebook: { fil: 'Nadagdag sa Word Notebook', en: 'Added to your Word Notebook' },
  onTable: { fil: 'Nasa mesa', en: 'On the table' },

  // Order
  orderHow: { fil: 'Pindutin ang mga pangyayari ayon sa pagkakasunod.', en: 'Tap the events in the order they happened.' },
  checkOrder: { fil: 'Tingnan kung tama', en: 'Check the order' },
  clearOrder: { fil: 'Ulitin', en: 'Start over' },

  // Decide + explain
  changeChoice: { fil: 'Pumili ng iba', en: 'Choose again' },
  explainTitle: { fil: 'Sagutin nang malakas', en: 'Answer out loud' },
  explainHow: { fil: 'Pindutin ang mikropono at sabihin ang sagot mo.', en: 'Tap the microphone and say your answer.' },
  startWith: { fil: 'Puwede kang magsimula sa:', en: 'You can start with:' },
  record: { fil: 'Mag-record', en: 'Record' },
  stop: { fil: 'Ihinto', en: 'Stop' },
  play_: { fil: 'Pakinggan', en: 'Play' },
  reRecord: { fil: 'Mag-record ulit', en: 'Record again' },
  waitingMic: { fil: 'Hinihintay ang mikropono…', en: 'Waiting for the microphone…' },
  recording: { fil: 'Nagre-record… dahan-dahan lang.', en: 'Recording… take your time.' },
  recorded: { fil: 'Narinig namin ang boses mo!', en: 'We got your voice!' },
  voiceNote: {
    fil: 'Sa device na ito lang ang boses mo. Mabubura ito pag-alis mo.',
    en: 'Your voice stays on this device. It is cleared when you leave.',
  },
  micFail: { fil: 'Hindi gumagana ang mikropono ngayon. Ayos lang ’yan!', en: 'The microphone isn’t working right now. That’s okay!' },
  tellPartner: { fil: 'Sabihin mo sa katabi mo', en: 'Tell a partner' },
  tellPartnerHow: {
    fil: 'Sabihin ang sagot mo sa kaklase o kasama mong nasa tabi mo.',
    en: 'Say your answer to a classmate or grown-up next to you.',
  },
  iToldPartner: { fil: 'Nasabi ko na sa katabi ko', en: 'I told a partner' },
  orTellPartner: { fil: 'O kaya, sabihin sa katabi mo', en: 'Or tell a partner instead' },
  doneExplaining: { fil: 'Tapos na akong magpaliwanag', en: 'I’m done explaining' },
  skipExplain: { fil: 'Laktawan muna', en: 'Skip for now' },

  // Payoff
  youDid: { fil: 'Ang ginawa mo:', en: 'What you did:' },
  barangayPiece: { fil: 'Piraso ng barangay', en: 'Barangay piece' },
  wordsLearned: { fil: 'Salitang natutunan', en: 'Word learned' },
  ribbonsOnKite: { fil: 'Mga laso sa saranggola mo', en: 'Ribbons on your kite' },
  breakTime: {
    fil: 'Mga 10 minuto ka nang naglalaro. Ang galing! Puwede kang magpahinga at ituloy mamaya.',
    en: 'You’ve played for about 10 minutes. Great job! You can rest and continue later.',
  },
  saved: { fil: 'Naka-save ang progreso mo.', en: 'Your progress is saved.' },
  storageOff: {
    fil: 'Mase-save lang ang progreso habang bukas ang page na ito.',
    en: 'Progress is kept only while this page is open.',
  },
} satisfies Record<string, Bi>;
