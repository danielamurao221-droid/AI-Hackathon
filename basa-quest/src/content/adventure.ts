/*
 * BASA QUEST, Level 1: "Ang Saranggola ni Tala / Tala's Kite" (adventure version)
 * STATUS: reviewed: false. A Grade 3 teacher and a Filipino language reviewer must check every
 * string in this file before use with real children. See README "Content review".
 *
 * How to edit
 * - Every piece of story text is a Line: { id, who, mood, text }.
 * - Text with { A: …, B: … } differs by reading band. Band A: shorter sentences, easier words.
 *   Band B: a little longer and richer. The quests and answers are the same for both bands.
 * - Keep each line to 1–3 short sentences.
 * - A Line `id` is also its audio file name (see README "Add audio"). Don't reuse ids.
 * - Lines whose id starts with "idle-" are small talk: they are not saved to the Quest Notebook.
 * - Wrap a word in [[double brackets]] to highlight it.
 */
import type { Bi, BText, BuildSpec, CharId, ExplainSpec, Line, Mood, WordEntry } from '../types';

export const ADVENTURE_META = {
  reviewed: false,
  title: { fil: 'Ang Saranggola ni Tala', en: 'Tala’s Kite' } as Bi,
};

/** Every line, by id (used by the Quest Notebook and the audio list). */
export const allLines: Record<string, Line> = {};
function ln(id: string, who: CharId | undefined, mood: Mood | undefined, text: BText): Line {
  const l: Line = { id, who, mood, text };
  allLines[id] = l;
  return l;
}

// ─────────────────────────── Words (Word Notebook + Kite Day word gates) ───────────────────────────
export const words: WordEntry[] = [
  {
    id: 'matibay',
    word: { fil: 'matibay', en: 'sturdy' },
    meaning: { fil: 'hindi madaling masira', en: 'hard to break' },
    example: { fil: 'Matibay ang bagong balangkas ng saranggola.', en: 'The kite’s new frame is sturdy.' },
    decoy: { fil: 'malambot', en: 'floppy' },
  },
  {
    id: 'pantay',
    word: { fil: 'pantay', en: 'even' },
    meaning: { fil: 'magkapareho ang dalawang gilid', en: 'the same on both sides' },
    example: { fil: 'Pantay ang dalawang gilid ng saranggola.', en: 'Both sides of the kite are even.' },
    decoy: { fil: 'tagilid', en: 'tilted' },
  },
  {
    id: 'sobra',
    word: { fil: 'sobra', en: 'extra' },
    meaning: { fil: 'higit sa kailangan', en: 'more than you need' },
    example: { fil: 'May sobrang tali si Lolo Ben.', en: 'Lolo Ben has extra string.' },
    decoy: { fil: 'kulang', en: 'missing' },
  },
];

// ─────────────────────────── Items you can pick up (Quest 1) ───────────────────────────
export type ItemId = 'longBamboo' | 'shortBamboo' | 'redPaper' | 'bluePaper' | 'glueJar' | 'soyBottle' | 'slipper';
export const items: Record<ItemId, { name: Bi }> = {
  longBamboo: { name: { fil: 'mahabang kawayan', en: 'long bamboo stick' } },
  shortBamboo: { name: { fil: 'maikling kawayan', en: 'short bamboo stick' } },
  redPaper: { name: { fil: 'pulang papel', en: 'red paper' } },
  bluePaper: { name: { fil: 'asul na papel', en: 'blue paper' } },
  glueJar: { name: { fil: 'garapon ng pandikit', en: 'jar of glue' } },
  soyBottle: { name: { fil: 'bote ng toyo', en: 'bottle of soy sauce' } },
  slipper: { name: { fil: 'tsinelas', en: 'slipper' } },
};
/** What Lolo Ben's list asks for. */
export const q1Needs: ItemId[] = ['longBamboo', 'redPaper', 'glueJar'];

// ─────────────────────────── Story ───────────────────────────
export const story = {
  intro: [
    ln('intro-1', 'tala', 'wow', {
      A: { fil: 'Sabado na! May Araw ng Saranggola sa plaza!', en: 'It’s Saturday! Kite Day is at the plaza!' },
      B: {
        fil: 'Sabado na ngayon, at may Araw ng Saranggola sa plaza ng barangay!',
        en: 'Today is Saturday, and there’s a Kite Day at the barangay plaza!',
      },
    }),
    ln('intro-2', 'tala', 'sad', {
      A: { fil: 'Pero luma na ang saranggola ko. Kailangan ko ng tulong.', en: 'But my kite is old. I need help.' },
      B: {
        fil: 'Pero luma at butas-butas na ang saranggola ko. Kailangan ko ng tulong para gumanda ito.',
        en: 'But my kite is old and full of holes. I need help to make it better.',
      },
    }),
    ln('intro-3', 'tala', 'think', {
      A: {
        fil: 'Sabi ni Lolo Ben, may sulat si Aling Nena para sa akin. Asul ang bubong ng tindahan niya.',
        en: 'Lolo Ben says Aling Nena has a note for me. Her store has a blue roof.',
      },
      B: {
        fil: 'Sabi ni Lolo Ben, may iniwan siyang sulat kay Aling Nena. Asul ang bubong ng sari-sari store niya, malapit sa daan.',
        en: 'Lolo Ben left a note for me with Aling Nena. Her sari-sari store has a blue roof, near the road.',
      },
    }),
  ],

  // Kite Day gate (plaza)
  gateLocked: ln('gate-1', 'jun', 'happy', {
    A: { fil: 'Ito ang gate ng Kite Day. Para ito sa may saranggola.', en: 'This is the Kite Day gate. It’s for kids with a kite.' },
    B: {
      fil: 'Magandang araw! Ito ang gate ng Araw ng Saranggola. Puwedeng pumasok ang sinumang may saranggola.',
      en: 'Good day! This is the Kite Day gate. Anyone with a kite can come in.',
    },
  }),
  gateOpen: ln('gate-2', 'jun', 'wow', {
    fil: 'May saranggola ka? Kahit luma, puwede kang sumubok! Bukas na ang gate.',
    en: 'You have a kite? Even an old one can try! The gate is open now.',
  }),
  // Before Quest 1 is done, Kuya Jun keeps the gate closed and repeats where to go.
  gateFix: ln('gate-fix', 'jun', 'think', {
    A: {
      fil: 'Naku, luma at butas-butas pa ang saranggola mo! Ipaayos mo muna bago ang karera.',
      en: 'Oh no, your old kite still has holes! Get it fixed before the race.',
    },
    B: {
      fil: 'Naku, luma at butas-butas pa ang saranggola mo. Hindi pa iyan makalilipad nang mataas. Ipaayos mo muna, saka bumalik dito.',
      en: 'Oh no, your old kite still has holes. It can’t fly high like that. Get it fixed first, then come back.',
    },
  }),
  gateWhereNena: ln('gate-fix-nena', 'jun', 'think', {
    fil: 'Sabi ni Lolo Ben, may sulat para sa iyo si Aling Nena. Asul ang bubong ng tindahan niya.',
    en: 'Lolo Ben said Aling Nena has a note for you. Her store has a blue roof.',
  }),
  gateWhereLolo: ln('gate-fix-lolo', 'jun', 'think', {
    fil: 'Dalhin mo kay Lolo Ben ang mga nasa listahan. May karatulang lagari ang pagawaan niya, katabi ng bahay ninyo.',
    en: 'Bring the things on the list to Lolo Ben. His workshop has a saw sign, next to your house.',
  }),
  raceAsk: ln('race-1', 'jun', 'happy', {
    A: {
      fil: 'Paliparin ang saranggola hanggang 100 metro. Iwasan ang mga ibon at malakas na hangin!',
      en: 'Fly your kite up to 100 metres. Avoid birds and strong gusts!',
    },
    B: {
      fil: 'Paliparin ang saranggola hanggang 100 metro. Iwasan ang mga ibon at malalakas na bugso ng hangin. Dumaan sa tamang word gate para sa dagdag na lipad!',
      en: 'Fly your kite up to 100 metres. Avoid birds and strong gusts. Fly through the right word gate for a boost!',
    },
  }),
  plazaRestored: ln('plaza-1', 'jun', 'happy', {
    fil: 'Dahil sa iyo, makulay na ulit ang plaza!',
    en: 'Thanks to you, the plaza is colourful again!',
  }),

  // ───── Quest 1: Aling Nena's Note ─────
  q1Start: [
    ln('q1-start-1', 'nena', 'happy', {
      fil: 'Tala! Iniwan ni Lolo Ben ang sulat na ito para sa iyo.',
      en: 'Tala! Lolo Ben left this note for you.',
    }),
  ],
  q1NoteTitle: { fil: 'Listahan ni Lolo Ben', en: 'Lolo Ben’s list' } as Bi,
  q1Note: [
    ln('q1-note-1', 'lolo', undefined, {
      A: {
        fil: 'Para maging [[matibay]] ang saranggola mo, dalhin mo sa pagawaan ko ang tatlong ito:',
        en: 'To make your kite [[sturdy]], bring these three things to my workshop:',
      },
      B: {
        fil: 'Apo, luma na ang saranggola mo. Para maging [[matibay]] ito, dalhin mo sa pagawaan ko ang tatlong bagay na ito:',
        en: 'Your old kite needs work. To make it [[sturdy]], bring these three things to my workshop:',
      },
    }),
    ln('q1-note-2', 'lolo', undefined, {
      A: { fil: '1. Ang mahabang kawayan, hindi ang maikli.', en: '1. The long bamboo stick, not the short one.' },
      B: { fil: '1. Ang kawayang mas mahaba pa sa braso mo.', en: '1. The bamboo stick that is longer than your arm.' },
    }),
    ln('q1-note-3', 'lolo', undefined, {
      A: { fil: '2. Ang papel na kulay pula.', en: '2. The paper that is red.' },
      B: { fil: '2. Ang papel na kasingpula ng sili.', en: '2. The paper that is as red as a chili.' },
    }),
    ln('q1-note-4', 'lolo', undefined, {
      A: { fil: '3. Ang maliit na garapon ng pandikit.', en: '3. The small jar of glue.' },
      B: { fil: '3. Ang maliit na garapong may malagkit na pandikit sa loob.', en: '3. The small jar with sticky glue inside.' },
    }),
    ln('q1-note-5', 'lolo', undefined, {
      A: {
        fil: 'Ang pagawaan ko ay may karatulang lagari. Katabi ito ng bahay ninyo.',
        en: 'My workshop has a saw sign. It is next to your house.',
      },
      B: {
        fil: 'Makikilala mo ang pagawaan ko dahil may karatulang lagari ito. Katabi ito ng bahay ninyo.',
        en: 'You’ll know my workshop by its saw sign. It is right next to your house.',
      },
    }),
  ],
  q1Look: ln('q1-start-2', 'nena', 'think', {
    fil: 'Hindi ko alam kung nasaan ang mga iyan. Maglibot ka sa barangay!',
    en: 'I don’t know where those things are. Look around the barangay!',
  }),
  q1Wrong: {
    shortBamboo: ln('q1-wrong-shortBamboo', 'lolo', 'wow', {
      fil: 'Ang ikli nito! Pangkamot lang ito ng likod ko.',
      en: 'This is so short! It’s only good for scratching my back.',
    }),
    bluePaper: ln('q1-wrong-bluePaper', 'lolo', 'think', {
      fil: 'Asul? Maganda, pero hindi pula ang kulay nito.',
      en: 'Blue? It’s pretty, but it isn’t red.',
    }),
    soyBottle: ln('q1-wrong-soyBottle', 'lolo', 'wow', {
      fil: 'Toyo? Para sa adobo ’yan, hindi sa saranggola!',
      en: 'Soy sauce? That’s for adobo, not for kites!',
    }),
    slipper: ln('q1-wrong-slipper', 'lolo', 'happy', {
      fil: 'Tsinelas? Lilipad ba ’yan? Hahaha!',
      en: 'A slipper? Can that fly? Ha ha ha!',
    }),
  } as Partial<Record<ItemId, Line>>,
  q1Returned: ln('q1-returned', undefined, undefined, {
    fil: 'Ibinalik ang maling gamit sa pinagkunan nito.',
    en: 'The wrong things went back to where you found them.',
  }),
  q1Good: ln('q1-good', 'lolo', 'happy', { fil: 'Ayan! Tama ito.', en: 'There! That’s right.' }),
  q1More: ln('q1-more', 'lolo', 'think', {
    fil: 'Kulang pa. Basahin ulit ang listahan sa notebook mo.',
    en: 'Something is still missing. Read the list in your notebook again.',
  }),
  q1Empty: ln('q1-empty', 'lolo', 'happy', {
    fil: 'Nabasa mo na ba ang listahan ko? Nasa Quest Notebook mo ito.',
    en: 'Did you read my list? It’s in your Quest Notebook.',
  }),
  q1Hints: {
    longBamboo: ln('q1-hint-longBamboo', 'lolo', 'think', {
      fil: 'Clue: mahaba ang kawayang kailangan ko. Saan ka nakakita ng mahabang kawayan?',
      en: 'Clue: I need a long bamboo stick. Where did you see a long one?',
    }),
    redPaper: ln('q1-hint-redPaper', 'lolo', 'think', {
      fil: 'Clue: pula ang papel sa listahan, gaya ng sili.',
      en: 'Clue: the list says red paper, red like a chili.',
    }),
    glueJar: ln('q1-hint-glueJar', 'lolo', 'think', {
      fil: 'Clue: nasa maliit na garapon ang pandikit. Hindi ito bote.',
      en: 'Clue: the glue is in a small jar. It is not a bottle.',
    }),
  } as Record<string, Line>,
  q1Done: [
    ln('q1-done-1', 'lolo', 'happy', {
      fil: 'Kumpleto! Gagawin kong [[matibay]] ang balangkas ng saranggola mo.',
      en: 'That’s everything! I’ll make your kite’s frame [[sturdy]].',
    }),
    ln('q1-reward', undefined, undefined, {
      fil: 'Bagong piyesa: Matibay na Balangkas! Mas matatag na ang saranggola mo.',
      en: 'New part: Strong Frame! Your kite is steadier now.',
    }),
  ],

  // ───── Quest 2: Lolo Ben's Build ─────
  q2Start: [
    ln('q2-start-1', 'lolo', 'happy', {
      A: { fil: 'Ngayon, ikaw ang bubuo. Sundin ang sulat ko.', en: 'Now you build it. Follow my note.' },
      B: {
        fil: 'Ngayon, ikaw naman ang bubuo ng saranggola. Basahin ang bawat hakbang bago gumawa.',
        en: 'Now it’s your turn to build the kite. Read each step before you build.',
      },
    }),
  ],
  q2Done: [
    ln('q2-done-1', 'lolo', 'wow', {
      fil: 'Diretso ang lipad! [[Pantay]] ang dalawang gilid ng saranggola mo.',
      en: 'It flies straight! Both sides of your kite are [[even]].',
    }),
    ln('q2-reward', undefined, undefined, {
      fil: 'Bagong piyesa: Mas Magandang Balanse! Mas madali nang iliko ang saranggola.',
      en: 'New part: Better Balance! Your kite is easier to steer.',
    }),
  ],

  // ───── Quest 3: The Missing String ─────
  q3Start: [
    ln('q3-start-1', 'lolo', 'sad', { fil: 'Naku! Nawawala ang mahaba kong tali.', en: 'Oh no! My long string is missing.' }),
    ln('q3-start-2', 'lolo', 'think', {
      A: {
        fil: 'Tanungin mo sina Nonoy, Aling Nena, at Kuya Jun. Itatala ng notebook mo ang sasabihin nila.',
        en: 'Ask Nonoy, Aling Nena and Kuya Jun. Your notebook will keep what they say.',
      },
      B: {
        fil: 'Baka may nakakita sa tali. Tanungin mo sina Nonoy, Aling Nena, at Kuya Jun. Itatala ng notebook mo ang bawat clue.',
        en: 'Maybe someone saw it. Ask Nonoy, Aling Nena and Kuya Jun. Your notebook will keep every clue.',
      },
    }),
  ],
  q3Clues: {
    nonoy: ln('q3-clue-nonoy', 'nonoy', 'wow', {
      A: {
        fil: 'Nakita ko si Muning, ang pusa ni Aling Nena. May hila-hila siyang mahabang tali!',
        en: 'I saw Muning, Aling Nena’s cat. She was dragging a long string!',
      },
      B: {
        fil: 'Kaninang umaga, nakita ko si Muning, ang pusa ni Aling Nena. Hila-hila niya ang isang mahabang tali, tapos tumakbo siya.',
        en: 'This morning I saw Muning, Aling Nena’s cat. She was dragging a long string, and then she ran off.',
      },
    }),
    nena: ln('q3-clue-nena', 'nena', 'think', {
      A: {
        fil: 'Si Muning? Laging natutulog si Muning sa ilalim ng bangka sa dalampasigan.',
        en: 'Muning? Muning always naps under the boat at the beach.',
      },
      B: {
        fil: 'Si Muning ba? Tuwing tanghali, natutulog siya sa ilalim ng bangka sa dalampasigan. Doon siya pinakamasaya.',
        en: 'Muning? Every noon she naps under the boat at the beach. That’s her favourite spot.',
      },
    }),
    jun: ln('q3-clue-jun', 'jun', 'think', {
      A: {
        fil: 'Walang tali sa plaza. Pero may narinig akong pusang ngumingiyaw malapit sa dagat.',
        en: 'There’s no string at the plaza. But I heard a cat meowing near the sea.',
      },
      B: {
        fil: 'Nilinis ko ang buong plaza kanina, at walang tali rito. Pero may narinig akong pusang ngumingiyaw malapit sa dagat.',
        en: 'I swept the whole plaza and found no string. But I heard a cat meowing near the sea.',
      },
    }),
  } as Record<'nonoy' | 'nena' | 'jun', Line>,
  q3Search: {
    basket: ln('q3-search-basket', undefined, undefined, { fil: 'Mga kamatis lang ang nasa basket.', en: 'Only tomatoes in the basket.' }),
    bench: ln('q3-search-bench', undefined, undefined, { fil: 'Isang tuyong dahon lang ang nasa ilalim ng upuan.', en: 'Just a dry leaf under the bench.' }),
  },
  q3SearchHint: ln('q3-hint', 'tala', 'think', {
    fil: 'Basahin ulit ang notebook. Saan natutulog si Muning?',
    en: 'Read the notebook again. Where does Muning nap?',
  }),
  q3Found: [
    ln('q3-found-1', undefined, undefined, {
      fil: 'Nandito si Muning, mahimbing na natutulog sa ibabaw ng tali!',
      en: 'Here’s Muning, fast asleep on top of the string!',
    }),
    ln('q3-found-2', 'muning', 'happy', { fil: 'Miyaw?', en: 'Meow?' }),
    ln('q3-found-3', 'tala', 'happy', {
      fil: 'Dahan-dahan kong kukunin ang tali. Dadalhin ko ito kay Lolo Ben.',
      en: 'I’ll gently take the string. I’ll bring it to Lolo Ben.',
    }),
  ],
  q3NeedClues: ln('q3-need-clues', 'lolo', 'think', {
    fil: 'Nahanap mo! Pero paano mo nalaman? Kausapin muna ang tatlong kapitbahay para may patunay tayo.',
    en: 'You found it! But how did you know? Talk to all three neighbours first, so we have proof.',
  }),
  q3ProofAsk: ln('q3-proof-q', 'lolo', 'think', {
    fil: 'Paano mo nalaman na nasa bangka ang tali? Pindutin ang clue na nagpapatunay.',
    en: 'How did you know the string was at the boat? Tap the clue that proves it.',
  }),
  q3ProofHints: {
    'q3-clue-nonoy': ln('q3-proof-hint-nonoy', 'lolo', 'think', {
      fil: 'Sinasabi nito na may tali si Muning. Pero saan siya natutulog?',
      en: 'This tells us Muning had the string. But where does she nap?',
    }),
    'q3-clue-jun': ln('q3-proof-hint-jun', 'lolo', 'think', {
      fil: 'Malapit sa dagat, oo. Pero aling clue ang nagsasabi kung saan mismo?',
      en: 'Near the sea, yes. But which clue says exactly where?',
    }),
  } as Record<string, Line>,
  q3ProofOk: ln('q3-proof-ok', 'lolo', 'happy', {
    fil: 'Tama! Sabi ni Aling Nena, natutulog si Muning sa ilalim ng bangka.',
    en: 'Yes! Aling Nena said Muning naps under the boat.',
  }),
  q3Sobra: ln('q3-sobra-1', 'lolo', 'wow', {
    A: {
      fil: 'Ang haba ng tali! Sampung dipa lang ang kailangan natin, pero labinlima ang tali. [[Sobra]] pa ito!',
      en: 'What a long string! We need only ten arm-lengths, but the string is fifteen. There is [[extra]]!',
    },
    B: {
      fil: 'Sampung dipa lang ng tali ang kailangan ng saranggola, pero labinlimang dipa ang haba nito. Ibig sabihin, may [[sobra]]: higit sa kailangan natin!',
      en: 'The kite needs only ten arm-lengths of string, but this one is fifteen long. That means there is [[extra]]: more than we need!',
    },
  }),
  q3SobraAsk: ln('q3-sobra-q', 'lolo', 'think', { fil: 'Ilang dipa ang sobra?', en: 'How many arm-lengths are extra?' }),
  q3SobraOptions: [
    { id: '5', label: { fil: '5 dipa', en: '5 arm-lengths' } },
    { id: '10', label: { fil: '10 dipa', en: '10 arm-lengths' } },
    { id: '15', label: { fil: '15 dipa', en: '15 arm-lengths' } },
  ],
  q3SobraAnswer: '5',
  q3SobraHint: ln('q3-sobra-hint', 'lolo', 'think', {
    fil: 'Ang sobra ay higit sa kailangan. Labinlima, bawasan ng sampu?',
    en: 'Extra means more than you need. Fifteen take away ten?',
  }),
  q3Done: [
    ln('q3-done-1', 'lolo', 'happy', {
      fil: 'Tama! Limang dipa ang sobra. Kaya mas mataas na makakalipad ang saranggola mo.',
      en: 'Yes! Five arm-lengths are extra. So your kite can fly higher.',
    }),
    ln('q3-reward', undefined, undefined, {
      fil: 'Bagong piyesa: Mahabang Tali! Mas mataas nang makakalipad ang saranggola mo.',
      en: 'New part: Long String! Your kite can fly higher now.',
    }),
  ],

  // ───── Nonoy's Choice ─────
  choiceIntro: [
    ln('choice-1', 'nonoy', 'sad', {
      A: { fil: 'Ate Tala, wala akong saranggola para sa Kite Day.', en: 'Tala, I don’t have a kite for Kite Day.' },
      B: {
        fil: 'Ate Tala, gusto ko ring sumali sa Kite Day, pero wala akong saranggola. Wala rin akong pambili ng papel.',
        en: 'Tala, I want to join Kite Day too, but I don’t have a kite. I can’t buy paper, either.',
      },
    }),
    ln('choice-2', 'tala', 'think', {
      A: {
        fil: 'May isa pa akong papel. Puwede ko itong pang-ayos kung mapunit ang saranggola ko.',
        en: 'I have one more sheet of paper. I could use it to fix my kite if it tears.',
      },
      B: {
        fil: 'May natira pa akong isang pulang papel. Itinatabi ko ito, kung sakaling mapunit ang saranggola ko sa karera.',
        en: 'I still have one red sheet left. I’m saving it in case my kite tears in the race.',
      },
    }),
  ],
  choiceAsk: ln('choice-q', undefined, undefined, { fil: 'Ikaw ang pumili. Ano ang gagawin ni Tala?', en: 'You choose. What should Tala do?' }),
  choices: {
    share: {
      label: { fil: 'Ibigay kay Nonoy ang papel', en: 'Share the paper with Nonoy' } as Bi,
      reply: [
        ln('choice-share-1', 'tala', 'happy', {
          fil: '“Nonoy, sa iyo na ito. Gawa tayo ng saranggola mo!”',
          en: '“Nonoy, this is for you. Let’s make your kite!”',
        }),
        ln('choice-share-2', 'nonoy', 'wow', {
          fil: '“Salamat, Ate! Sasamahan kita sa Kite Day. Sisigaw ako kapag may malakas na hangin!”',
          en: '“Thanks, Tala! I’ll come with you to Kite Day. I’ll shout when a big gust is coming!”',
        }),
      ],
      explain: {
        prompt: ln('choice-share-why', 'nonoy', 'think', { fil: '“Bakit mo ibinigay sa akin ang papel?”', en: '“Why did you give me the paper?”' }),
        starter: { fil: 'Sa tingin ko, dapat ibigay ni Tala ang papel kasi…', en: 'I think Tala should share the paper because…' },
      } as ExplainSpec,
    },
    keep: {
      label: { fil: 'Itabi ang papel', en: 'Keep the paper' } as Bi,
      reply: [
        ln('choice-keep-1', 'tala', 'think', {
          fil: '“Pasensya na, Nonoy. Itatabi ko muna ito, baka mapunit ang saranggola ko.”',
          en: '“Sorry, Nonoy. I’ll keep this for now, in case my kite tears.”',
        }),
        ln('choice-keep-2', 'nonoy', 'think', {
          fil: '“Sige. Gagawa na lang ako ng saranggolang dyaryo.”',
          en: '“Okay. I’ll make a newspaper kite instead.”',
        }),
        ln('choice-keep-3', undefined, undefined, {
          fil: 'Gumupit si Tala ng manipis na piraso ng papel. Dagdag na laso para sa buntot ng saranggola!',
          en: 'Tala cuts a thin strip from the paper. One more ribbon for the kite’s tail!',
        }),
      ],
      explain: {
        prompt: ln('choice-keep-why', 'nonoy', 'think', { fil: '“Bakit mo itinabi ang papel, Ate Tala?”', en: '“Why did you keep the paper, Tala?”' }),
        starter: { fil: 'Sa tingin ko, dapat itabi ni Tala ang papel kasi…', en: 'I think Tala should keep the paper because…' },
      } as ExplainSpec,
    },
  },

  // ───── Kite Day race ─────
  raceWarn: ln('race-warn', 'nonoy', 'wow', { fil: 'Ate! May malakas na hangin na parating!', en: 'Tala! A big gust is coming!' }),
  gatePrompt: ln('race-gate', undefined, undefined, {
    fil: 'Word gate! Aling salita ang may ganitong kahulugan?',
    en: 'Word gate! Which word has this meaning?',
  }),
  gateOk: ln('race-gate-ok', undefined, undefined, { fil: 'Tamang salita! Dagdag na lipad!', en: 'Right word! Extra lift!' }),
  gateMiss: ln('race-gate-miss', undefined, undefined, { fil: 'Hindi iyon, pero tuloy pa rin ang lipad!', en: 'Not that one, but keep flying!' }),
  raceWin: ln('race-win', 'jun', 'wow', { fil: 'Naabot mo ang 100 metro! Panalo ang saranggola mo!', en: 'You reached 100 metres! Your kite made it!' }),
  raceCrash: ln('race-crash', 'tala', 'think', { fil: 'Bumagsak ang saranggola. Ayos lang, subukan ulit!', en: 'The kite fell. That’s okay, try again!' }),
  raceString: ln('race-string', 'tala', 'think', {
    fil: 'Naubos ang tali mo sa 40 m. Humanap ng mas mahaba!',
    en: 'Your string ran out at 40 m. Find a longer one!',
  }),
  raceLow: ln('race-low', 'tala', 'think', {
    fil: 'Hindi pa sapat ang taas. Subukan ulit, o humanap ng bagong piyesa sa barangay.',
    en: 'Not high enough yet. Try again, or find new kite parts around the barangay.',
  }),
  tips: {
    frame: ln('tip-frame', 'lolo', 'think', {
      fil: 'Tip: Hindi agad bumabagsak ang saranggolang may matibay na balangkas.',
      en: 'Tip: A kite with a strong frame doesn’t fall so easily.',
    }),
    balance: ln('tip-balance', 'lolo', 'think', {
      fil: 'Tip: Mas madaling iliko ang saranggolang may magandang balanse.',
      en: 'Tip: A well-balanced kite is easier to steer.',
    }),
    longString: ln('tip-string', 'lolo', 'think', {
      fil: 'Tip: Kailangan ng mahabang tali para mas tumaas ang lipad.',
      en: 'Tip: You need a long string to fly higher.',
    }),
  },

  // ───── Small talk (not saved to the notebook) ─────
  idle: {
    nena: ln('idle-nena', 'nena', 'happy', { fil: 'Ingat sa paglalaro, Tala!', en: 'Have fun out there, Tala!' }),
    lolo: ln('idle-lolo', 'lolo', 'happy', { fil: 'Kumusta ang saranggola mo, apo?', en: 'How’s your kite doing?' }),
    nonoy: ln('idle-nonoy', 'nonoy', 'happy', { fil: 'Ang ganda ng hangin ngayon!', en: 'The wind is great today!' }),
    jun: ln('idle-jun', 'jun', 'happy', { fil: 'Kaunting kulay na lang ang kulang sa plaza!', en: 'The plaza just needs a little colour!' }),
    muning: ln('idle-muning', 'muning', 'happy', { fil: 'Purrr…', en: 'Purrr…' }),
    locked: ln('idle-locked', undefined, undefined, {
      fil: 'Malapit na! May bagong kapitbahay na lilipat dito.',
      en: 'Coming soon! A new neighbour is moving in here.',
    }),
    talaHome: ln('idle-home', 'tala', 'happy', { fil: 'Ito ang bahay namin.', en: 'This is our house.' }),
  },
};

// ───── Quest 2 workbench steps (used by the kite build board) ─────
export const q2Build: BuildSpec = {
  id: 'q2',
  noteTitle: { fil: 'Sulat ni Lolo Ben', en: 'Lolo Ben’s note' },
  parts: [
    { id: 'long', label: { fil: 'Mahabang patpat', en: 'Long stick' } },
    { id: 'short', label: { fil: 'Maikling patpat', en: 'Short stick' } },
    { id: 'string', label: { fil: 'Tali', en: 'String' } },
    { id: 'paper', label: { fil: 'Pulang papel', en: 'Red paper' } },
  ],
  steps: [
    {
      part: 'long',
      slot: 'vertical',
      line: ln('q2-step-1', undefined, undefined, {
        A: { fil: 'Ilagay ang mahabang patpat nang patayo.', en: 'Put the long stick standing up.' },
        B: { fil: 'Kunin ang mahabang patpat. Ilagay ito nang patayo, mula itaas hanggang ibaba.', en: 'Take the long stick. Place it standing up, from top to bottom.' },
      }),
      hint: ln('q2-hint-1', 'lolo', 'think', {
        fil: 'Basahin ulit ang hakbang 1. Aling patpat ang nakatayo: ang mahaba o ang maikli?',
        en: 'Read step 1 again. Which stick stands up: the long one or the short one?',
      }),
    },
    {
      part: 'short',
      slot: 'acrossTop',
      line: ln('q2-step-2', undefined, undefined, {
        A: { fil: 'Ilagay ang maikling patpat nang pahiga, malapit sa itaas. Dapat [[pantay]] ang dalawang gilid.', en: 'Put the short stick across, near the top. Both sides must be [[even]].' },
        B: {
          fil: 'Ilagay ang maikling patpat nang pahiga. Dapat nasa itaas na bahagi ito, hindi sa gitna, at [[pantay]] ang dalawang gilid.',
          en: 'Lay the short stick across. It should be near the top, not in the middle, with both sides [[even]].',
        },
      }),
      hint: ln('q2-hint-2', 'lolo', 'think', {
        fil: 'Basahin ulit ang hakbang 2. Saan ang maikling patpat: malapit sa itaas o sa gitna?',
        en: 'Read step 2 again. Where does the short stick go: near the top or in the middle?',
      }),
    },
    {
      part: 'string',
      slot: 'knotTop',
      line: ln('q2-step-3', undefined, undefined, {
        A: { fil: 'Itali ang tali kung saan nagkrus ang dalawang patpat.', en: 'Tie the string where the two sticks cross.' },
        B: { fil: 'Gamitin ang tali. Itali ito nang mahigpit kung saan nagkrus ang dalawang patpat.', en: 'Use the string. Tie it tightly at the spot where the two sticks cross.' },
      }),
      hint: ln('q2-hint-3', 'lolo', 'think', {
        fil: 'Hakbang 3: hanapin kung saan nagtatagpo ang dalawang patpat. Doon itali.',
        en: 'Step 3: find the spot where the two sticks meet. Tie it there.',
      }),
    },
    {
      part: 'paper',
      slot: 'paper',
      folds: 4,
      line: ln('q2-step-4', undefined, undefined, {
        A: { fil: 'Ilagay ang papel, saka itupi ang apat na gilid.', en: 'Put on the paper, then fold all four edges.' },
        B: {
          fil: 'Ilatag ang pulang papel sa likod ng mga patpat. Itupi ang apat na gilid nito para kumapit sa patpat.',
          en: 'Lay the red paper behind the sticks. Fold all four edges so the paper holds on to the sticks.',
        },
      }),
      hint: ln('q2-hint-4', 'lolo', 'think', {
        fil: 'Hakbang 4: ilang gilid ng papel ang kailangang itupi? Pindutin ang bawat gilid.',
        en: 'Step 4: how many edges of the paper need folding? Tap each edge.',
      }),
    },
  ],
  success: ln('q2-ok', 'lolo', 'happy', { fil: 'Ayan! Subukan natin ang lipad.', en: 'There! Let’s test the flight.' }),
};

/** Quest Notebook sections, in story order. */
export const notebookSections: { title: Bi; ids: string[] }[] = [
  { title: { fil: 'Simula', en: 'Start' }, ids: story.intro.map((l) => l.id) },
  {
    title: { fil: 'Quest 1: Ang Sulat ni Aling Nena', en: 'Quest 1: Aling Nena’s Note' },
    ids: [...story.q1Start, ...story.q1Note, story.q1Look, ...Object.values(story.q1Hints), ...story.q1Done].map((l) => l.id),
  },
  {
    title: { fil: 'Quest 2: Ang Pagbuo ni Lolo Ben', en: 'Quest 2: Lolo Ben’s Build' },
    ids: [...story.q2Start, ...q2Build.steps.map((s) => s.line), ...story.q2Done].map((l) => l.id),
  },
  {
    title: { fil: 'Quest 3: Ang Nawawalang Tali', en: 'Quest 3: The Missing String' },
    ids: [
      ...story.q3Start,
      story.q3Clues.nonoy,
      story.q3Clues.nena,
      story.q3Clues.jun,
      story.q3SearchHint,
      ...story.q3Found,
      story.q3Sobra,
      ...story.q3Done,
    ].map((l) => l.id),
  },
  {
    title: { fil: 'Ang Pasya ni Nonoy', en: 'Nonoy’s Choice' },
    ids: [...story.choiceIntro, ...story.choices.share.reply, ...story.choices.keep.reply].map((l) => l.id),
  },
  {
    title: { fil: 'Araw ng Saranggola', en: 'Kite Day' },
    ids: [story.gateLocked, story.gateFix, story.gateWhereNena, story.gateWhereLolo, story.gateOpen, story.raceAsk, story.raceString, story.plazaRestored].map((l) => l.id),
  },
];
