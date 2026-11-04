/*
 * Child-facing interface text (buttons, instructions, messages).
 * STATUS: reviewed: false. Use {name}-style placeholders for values.
 */
import type { Bi, CharId, KiteSlot, PicId } from '../types';

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

export const charNames: Record<CharId, Bi> = {
  tala: { fil: 'Tala', en: 'Tala' },
  nonoy: { fil: 'Nonoy', en: 'Nonoy' },
  lolo: { fil: 'Lolo Ben', en: 'Lolo Ben' },
  nena: { fil: 'Aling Nena', en: 'Aling Nena' },
  jun: { fil: 'Kuya Jun', en: 'Kuya Jun' },
  muning: { fil: 'Muning', en: 'Muning' },
};

/** Spoken names for the spots on the kite build board (for screen readers). */
export const slotNames: Record<KiteSlot, Bi> = {
  vertical: { fil: 'patayong puwesto', en: 'standing-up spot' },
  acrossTop: { fil: 'pahigang puwesto sa itaas', en: 'across spot near the top' },
  acrossMid: { fil: 'pahigang puwesto sa gitna', en: 'across spot in the middle' },
  knotTop: { fil: 'tali sa itaas', en: 'tie spot near the top' },
  knotMid: { fil: 'tali sa gitna', en: 'tie spot in the middle' },
  knotEnd: { fil: 'tali sa dulo sa ibaba', en: 'tie spot at the bottom end' },
  paper: { fil: 'puwesto ng papel', en: 'paper spot' },
};

export type UpgradeId = 'frame' | 'balance' | 'longString' | 'ribbon' | 'nonoy';
export const upgradeText: Record<UpgradeId, { name: Bi; effect: Bi }> = {
  frame: { name: { fil: 'Matibay na Balangkas', en: 'Strong Frame' }, effect: { fil: 'Mas matatag, hindi agad bumabagsak', en: 'Steadier, harder to knock down' } },
  balance: { name: { fil: 'Mas Magandang Balanse', en: 'Better Balance' }, effect: { fil: 'Mas madaling iliko, mas kaunting uga', en: 'Easier to steer, less wobble' } },
  longString: { name: { fil: 'Mahabang Tali', en: 'Long String' }, effect: { fil: 'Mas mabilis at mas mataas na lipad', en: 'Climbs faster and higher' } },
  ribbon: { name: { fil: 'Dagdag na Laso', en: 'Extra Tail Ribbon' }, effect: { fil: 'Isang makulay na laso sa buntot', en: 'A colourful ribbon on the tail' } },
  nonoy: { name: { fil: 'Kasama si Nonoy', en: 'Nonoy is with you' }, effect: { fil: 'Sisigaw siya bago ang isang malakas na hangin', en: 'He shouts before one big gust' } },
};

export const ui = {
  // Login
  tagline: { fil: 'Maglakbay, magbasa, at paliparin ang saranggola!', en: 'Explore, read, and fly your kite!' },
  enterCode: { fil: 'Ilagay ang class code', en: 'Type your class code' },
  codeHint: { fil: 'Itanong sa guro. Demo code: DEMO123', en: 'Ask your teacher. Demo code: DEMO123' },
  codeWrong: { fil: 'Hindi gumana ang code. Subukan ulit!', en: 'That code didn’t work. Try again!' },
  next: { fil: 'Susunod', en: 'Next' },
  ok: { fil: 'Sige', en: 'OK' },
  back: { fil: 'Bumalik', en: 'Back' },
  whoAreYou: { fil: 'Sino ka?', en: 'Who are you?' },
  pickPictures: { fil: 'Pindutin ang 2 lihim mong larawan', en: 'Tap your 2 secret pictures' },
  pictureWrong: { fil: 'Hindi pa tama. Subukan ulit!', en: 'Not quite. Let’s try again!' },
  demoPictures: { fil: 'Demo: ang mga larawan mo ay', en: 'Demo: your pictures are' },

  // Loading + controls
  loading: { fil: 'Inihahanda ang barangay…', en: 'Getting the barangay ready…' },
  controlsHelp: {
    fil: 'Igalaw si Tala gamit ang joystick o arrow keys. Pindutin ang bilog na button para kumausap o pumulot.',
    en: 'Move Tala with the joystick or arrow keys. Press the round button to talk or pick things up.',
  },
  move: { fil: 'Igalaw si Tala', en: 'Move Tala' },
  talk: { fil: 'Kausapin', en: 'Talk' },
  pickUp: { fil: 'Pulutin', en: 'Pick up' },
  look: { fil: 'Tingnan', en: 'Look' },
  read: { fil: 'Basahin', en: 'Read' },
  race: { fil: 'Karera!', en: 'Race!' },
  hello: { fil: 'Kumusta, {name}!', en: 'Hi, {name}!' },
  logout: { fil: 'Lumabas', en: 'Log out' },

  // HUD
  questNotebook: { fil: 'Quest Notebook', en: 'Quest Notebook' },
  wordNotebook: { fil: 'Word Notebook', en: 'Word Notebook' },
  bag: { fil: 'Dala mo', en: 'Your bag' },
  bagEmpty: { fil: 'Wala ka pang dala.', en: 'Your bag is empty.' },
  putBack: { fil: 'Ibalik', en: 'Put back' },
  bagFull: { fil: 'Puno na ang dala mo. Ibalik muna ang isa.', en: 'Your bag is full. Put something back first.' },
  picked: { fil: 'Napulot mo: {item}', en: 'You picked up: {item}' },
  returned: { fil: 'Ibinalik mo: {item}', en: 'You put back: {item}' },
  close: { fil: 'Isara', en: 'Close' },
  soundOn: { fil: 'Buksan ang tunog', en: 'Turn sound on' },
  soundOff: { fil: 'Patayin ang tunog', en: 'Turn sound off' },
  listen: { fil: 'Makinig', en: 'Listen' },
  stopListening: { fil: 'Ihinto', en: 'Stop' },
  audioSoon: { fil: 'Malapit na ang audio! Magpabasa muna sa kaklase o guro.', en: 'Audio coming soon! Ask a classmate or your teacher to read with you.' },
  tryAgainHint: { fil: 'Subukan ulit. Heto ang clue:', en: 'Try again. Here’s a clue:' },
  hintOffer: { fil: 'Kailangan ng tulong? Pakinggan at basahin ang clue:', en: 'Need help? Listen to and read this clue:' },
  sparkle: { fil: 'May kumikislap sa malapit…', en: 'Something is sparkling nearby…' },
  notebookEmpty: { fil: 'Wala pang clue. Kausapin ang mga kapitbahay!', en: 'No clues yet. Talk to your neighbours!' },
  wordsEmpty: { fil: 'Wala pang salita. Makakakuha ka habang naglalaro.', en: 'No words yet. You will collect them as you play.' },
  meaning: { fil: 'Kahulugan', en: 'Meaning' },
  newWord: { fil: 'Bagong salita!', en: 'New word!' },
  newPart: { fil: 'Bagong piyesa!', en: 'New kite part!' },
  inProgress: { fil: 'Ginagawa', en: 'In progress' },
  done: { fil: 'Tapos', en: 'Done' },
  kiteParts: { fil: 'Mga piyesa ng saranggola', en: 'Kite parts' },
  notYet: { fil: 'Wala pa', en: 'Not yet' },
  levelOf: { fil: 'Antas {n} ng {m}', en: 'Level {n} of {m}' },
  trophyGoal: { fil: 'Buuin ang buong barangay!', en: 'Rebuild the whole barangay!' },
  comingSoon: { fil: 'Malapit na', en: 'Coming soon' },

  // Build (Quest 2)
  parts: { fil: 'Mga gamit', en: 'Parts' },
  buildHow: { fil: 'Pindutin ang gamit, saka pindutin kung saan ito ilalagay. Puwede ring i-drag.', en: 'Tap a part, then tap where it goes. You can also drag it.' },
  testKite: { fil: 'Subukang paliparin', en: 'Test flight' },
  needAllParts: { fil: 'Ilagay muna ang lahat ng gamit.', en: 'Place all the parts first.' },
  notThere: { fil: 'Hindi diyan puwede ang gamit na iyan.', en: 'That part can’t go there.' },
  wobble: { fil: 'Umuuga ang saranggola!', en: 'The kite wobbles!' },
  wobbleTryAgain: { fil: 'Umuga ang test flight. Basahin ulit ang sulat at subukan muli.', en: 'The test flight wobbled. Read the note again and try once more.' },
  foldEdge: { fil: 'Itupi ang gilid', en: 'Fold this edge' },

  // Proof + word task (Quest 3)
  proofFound: { fil: 'Patunay!', en: 'Proof!' },

  // Explain aloud
  startWith: { fil: 'Puwede kang magsimula sa:', en: 'You can start with:' },
  explainHow: { fil: 'Pindutin ang mikropono at sabihin ang sagot mo.', en: 'Tap the microphone and say your answer.' },
  record: { fil: 'Mag-record', en: 'Record' },
  stop: { fil: 'Ihinto', en: 'Stop' },
  play_: { fil: 'Pakinggan', en: 'Play' },
  reRecord: { fil: 'Mag-record ulit', en: 'Record again' },
  waitingMic: { fil: 'Hinihintay ang mikropono…', en: 'Waiting for the microphone…' },
  recording: { fil: 'Nagre-record… dahan-dahan lang.', en: 'Recording… take your time.' },
  recorded: { fil: 'Narinig namin ang boses mo!', en: 'We got your voice!' },
  voiceNote: { fil: 'Sa device na ito lang ang boses mo. Mabubura ito pag-alis mo.', en: 'Your voice stays on this device. It is cleared when you leave.' },
  micFail: { fil: 'Hindi gumagana ang mikropono ngayon. Ayos lang ’yan!', en: 'The microphone isn’t working right now. That’s okay!' },
  tellPartner: { fil: 'Sabihin mo sa katabi mo', en: 'Tell a partner' },
  tellPartnerHow: { fil: 'Sabihin ang sagot mo sa kaklase o kasama mong nasa tabi mo.', en: 'Say your answer to a classmate or grown-up next to you.' },
  iToldPartner: { fil: 'Nasabi ko na sa katabi ko', en: 'I told a partner' },
  orTellPartner: { fil: 'O kaya, sabihin sa katabi mo', en: 'Or tell a partner instead' },
  doneExplaining: { fil: 'Tapos na akong magpaliwanag', en: 'I’m done explaining' },
  skipExplain: { fil: 'Laktawan muna', en: 'Skip for now' },
  changeChoice: { fil: 'Pumili ng iba', en: 'Choose again' },

  // Race
  raceTitle: { fil: 'Karera ng Saranggola', en: 'Kite Day Race' },
  raceGoal: { fil: 'Layunin: 100 metro', en: 'Goal: 100 metres' },
  raceStart: { fil: 'Simulan!', en: 'Start!' },
  raceHow: {
    fil: 'Iliko ang saranggola gamit ang joystick o arrow keys. Walang orasan sa pagbasa ng word gate.',
    en: 'Steer with the joystick or arrow keys. Word gates wait for you while you read.',
  },
  height: { fil: 'Taas', en: 'Height' },
  metres: { fil: '{n} m', en: '{n} m' },
  kiteStrength: { fil: 'Tatag', en: 'Strength' },
  fly: { fil: 'Lipad!', en: 'Fly!' },
  steerTo: { fil: 'Iliko papunta sa tamang gate.', en: 'Steer into the right gate.' },
  retry: { fil: 'Subukan ulit', en: 'Try again' },
  backToBarangay: { fil: 'Bumalik sa barangay', en: 'Back to the barangay' },
  winTitle: { fil: 'Naibalik mo ang Plaza!', en: 'You restored the Plaza!' },
  lockedNeighbours: { fil: 'Mga bagong kapitbahay: malapit na', en: 'New neighbours: coming soon' },
  bestHeight: { fil: 'Pinakamataas mo: {n} m', en: 'Your best: {n} m' },

  breakTime: { fil: 'Mga 10 minuto ka nang naglalaro. Ang galing! Puwede kang magpahinga at ituloy mamaya.', en: 'You’ve played for about 10 minutes. Great job! You can rest and continue later.' },
  saved: { fil: 'Naka-save ang progreso mo.', en: 'Your progress is saved.' },
  storageOff: { fil: 'Mase-save lang ang progreso habang bukas ang page na ito.', en: 'Progress is kept only while this page is open.' },
} satisfies Record<string, Bi>;
