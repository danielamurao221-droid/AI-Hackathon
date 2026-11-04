/*
 * LEVEL 1: "Ang Pulang Papel / The Red Paper"
 * STATUS: reviewed: false. A Grade 3 teacher and a Filipino language reviewer must check
 * every string in this file before use with real children. See README "Content review".
 *
 * How to edit
 * - Each scene is one game moment. `kind` picks the game type (see src/types.ts).
 * - Text with { A: …, B: … } differs by reading band. Band A: shorter sentences, easier
 *   words. Band B: a little longer and richer. The story and answers stay the same.
 * - Keep each clue to 1–3 short sentences.
 * - Every Line `id` is also its audio file name (see README "Add audio").
 * - Wrap a highlighted word in [[double brackets]].
 */
import type { Level } from '../types';

export const level1: Level = {
  level: 1,
  reviewed: false,
  title: { fil: 'Ang Pulang Papel', en: 'The Red Paper' },
  place: 'plaza',
  quest: {
    A: {
      fil: 'Tulungan si Tala na ihanda ang plaza para sa Araw ng Saranggola.',
      en: 'Help Tala get the plaza ready for Kite Day.',
    },
    B: {
      fil: 'Tulungan si Tala na gumawa ng saranggola at ihanda ang plaza para sa Araw ng Saranggola.',
      en: 'Help Tala make a kite and get the plaza ready for Kite Day.',
    },
  },
  scenes: [
    // ─────────────── 1. Hook ───────────────
    {
      id: 'hook',
      kind: 'pick',
      title: { fil: 'Araw ng Saranggola', en: 'Kite Day' },
      board: 'cards',
      targets: [
        { id: 'fri', label: { fil: 'Biyernes', en: 'Friday' } },
        { id: 'sat', label: { fil: 'Sabado', en: 'Saturday' } },
        { id: 'sun', label: { fil: 'Linggo', en: 'Sunday' } },
      ],
      rounds: [
        {
          lines: [
            {
              id: 'hook-1',
              who: 'tala',
              mood: 'wow',
              text: {
                A: {
                  fil: 'May Araw ng Saranggola sa plaza sa Sabado! Gusto kong magpalipad ng saranggolang ako ang gumawa.',
                  en: 'Kite Day is at the plaza on Saturday! I want to fly a kite I made myself.',
                },
                B: {
                  fil: 'Sa darating na Sabado, may Araw ng Saranggola sa plaza ng barangay! Gusto kong magpalipad ng saranggolang ako mismo ang gumawa.',
                  en: 'This Saturday, our barangay is having a Kite Day at the plaza! I want to fly a kite that I made all by myself.',
                },
              },
            },
            {
              id: 'hook-2',
              who: 'tala',
              mood: 'sad',
              text: {
                A: {
                  fil: 'Pero kupas at walang kulay ang plaza. Kailangan nito ng tulong!',
                  en: 'But the plaza is faded and plain. It needs help!',
                },
                B: {
                  fil: 'Pero kupas na ang pintura ng plaza, at wala pa itong palamuti. Kailangan nito ng tulong bago mag-Sabado!',
                  en: 'But the plaza’s paint is faded, and there are no decorations yet. It needs help before Saturday!',
                },
              },
            },
          ],
          prompt: {
            id: 'hook-q',
            text: { fil: 'Kailan ang Araw ng Saranggola? Pindutin ang araw.', en: 'When is Kite Day? Tap the day.' },
          },
          answer: 'sat',
          hints: {
            default: {
              fil: 'Basahin ulit ang sinabi ni Tala. Anong araw daw?',
              en: 'Read what Tala said again. Which day did she say?',
            },
          },
          success: {
            fil: 'Tama! Sa Sabado ang Araw ng Saranggola. Simulan na natin!',
            en: 'Yes! Kite Day is on Saturday. Let’s get started!',
          },
        },
      ],
    },

    // ─────────────── 2. Find the supplies ───────────────
    {
      id: 'supplies',
      kind: 'pick',
      title: { fil: 'Hanapin ang mga gamit', en: 'Find the supplies' },
      skill: 'wordReading',
      ribbon: 'sun',
      board: 'map',
      targets: [
        { id: 'storeBlue', art: 'storeBlue', x: 20, y: 30, label: { fil: 'tindahang asul ang bubong', en: 'store with a blue roof' } },
        { id: 'bakery', art: 'bakery', x: 78, y: 28, label: { fil: 'panaderyang pula ang bubong', en: 'bakery with a red roof' } },
        { id: 'workshop', art: 'workshop', x: 50, y: 62, label: { fil: 'pagawaan ni Lolo Ben', en: 'Lolo Ben’s workshop' } },
        { id: 'mangoTree', art: 'mangoTree', x: 20, y: 80, label: { fil: 'puno ng mangga', en: 'mango tree' } },
        { id: 'coconutTree', art: 'coconutTree', x: 82, y: 78, label: { fil: 'puno ng niyog', en: 'coconut tree' } },
      ],
      rounds: [
        {
          lines: [
            {
              id: 'supplies-1',
              who: 'tala',
              mood: 'happy',
              text: {
                A: {
                  fil: 'Nag-ipon ako ng barya mula sa baon ko. Bibili ako ng pulang papel sa tindahang asul ang bubong.',
                  en: 'I saved coins from my snack money. I will buy red paper at the store with the blue roof.',
                },
                B: {
                  fil: 'Ilang linggo akong nag-ipon ng barya mula sa baon ko. Bibili na ako ng pulang papel. Mabibili iyon sa tindahang asul ang bubong, hindi sa panaderya.',
                  en: 'For weeks, I saved coins from my snack money. Now I can buy red paper. They sell it at the store with the blue roof, not at the bakery.',
                },
              },
            },
          ],
          prompt: {
            id: 'supplies-1-q',
            text: { fil: 'Saan bibili si Tala ng papel? Pindutin sa mapa.', en: 'Where will Tala buy the paper? Tap it on the map.' },
          },
          answer: 'storeBlue',
          hints: {
            bakery: {
              fil: 'Amoy pandesal! Pero tinapay ang tinda rito. Anong kulay ng bubong ang sinabi ni Tala?',
              en: 'Mmm, it smells like pandesal! But this place sells bread. What colour roof did Tala say?',
            },
            workshop: {
              fil: 'Pagawaan ito ni Lolo Ben. Hindi siya nagtitinda ng papel. Basahin ulit ang clue.',
              en: 'This is Lolo Ben’s workshop. He doesn’t sell paper. Read the clue again.',
            },
            default: {
              fil: 'Puno iyan, hindi tindahan! Hanapin ang tindahang sinabi ni Tala.',
              en: 'That’s a tree, not a store! Look for the store Tala talked about.',
            },
          },
          success: { fil: 'Ayan! May pulang papel na si Tala.', en: 'There it is! Tala has her red paper.' },
        },
        {
          lines: [
            {
              id: 'supplies-2',
              who: 'tala',
              mood: 'think',
              text: {
                A: {
                  fil: 'Sabi ni Lolo Ben, nasa ilalim ng puno ng mangga ang kawayan.',
                  en: 'Lolo Ben says the bamboo is under the mango tree.',
                },
                B: {
                  fil: 'Kailangan din namin ng kawayan. Sabi ni Lolo Ben, nakatabi ang mga patpat na kawayan sa ilalim ng puno ng mangga.',
                  en: 'We also need bamboo. Lolo Ben says the bamboo sticks are stored under the mango tree.',
                },
              },
            },
          ],
          prompt: {
            id: 'supplies-2-q',
            text: { fil: 'Nasaan ang kawayan? Pindutin sa mapa.', en: 'Where is the bamboo? Tap it on the map.' },
          },
          answer: 'mangoTree',
          hints: {
            coconutTree: {
              fil: 'Puno nga ito, pero niyog ang bunga nito. Anong puno ang sinabi ni Lolo Ben?',
              en: 'It is a tree, but it grows coconuts. Which tree did Lolo Ben say?',
            },
            workshop: {
              fil: 'Malapit na! Pero nasa ilalim daw ng isang puno ang kawayan.',
              en: 'Close! But the bamboo is under a tree.',
            },
            default: {
              fil: 'Wala sa tindahan ang kawayan. Basahin ulit ang sinabi ni Lolo Ben.',
              en: 'The bamboo isn’t at a store. Read what Lolo Ben said again.',
            },
          },
          success: { fil: 'Nahanap mo ang kawayan! Handa na ang mga gamit.', en: 'You found the bamboo! The supplies are ready.' },
        },
      ],
    },

    // ─────────────── 3. Build the kite ───────────────
    {
      id: 'build',
      kind: 'build',
      title: { fil: 'Buuin ang saranggola', en: 'Build the kite' },
      skill: 'wordReading',
      ribbon: 'teal',
      lines: [
        {
          id: 'build-1',
          who: 'lolo',
          mood: 'happy',
          text: {
            A: { fil: 'Sundin ang sulat ko, apo.', en: 'Follow my note, Tala.' },
            B: {
              fil: 'Heto ang sulat ko, apo. Basahin mo ang bawat hakbang bago ka gumawa.',
              en: 'Here is my note, Tala. Read each step before you build.',
            },
          },
        },
      ],
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
          line: {
            id: 'build-step-1',
            text: {
              A: { fil: 'Ilagay ang mahabang patpat nang patayo.', en: 'Put the long stick standing up.' },
              B: {
                fil: 'Kunin ang mahabang patpat. Ilagay ito nang patayo, mula itaas hanggang ibaba.',
                en: 'Take the long stick. Place it standing up, from top to bottom.',
              },
            },
          },
          hint: {
            fil: 'Basahin ulit ang hakbang 1. Aling patpat ang nakatayo: ang mahaba o ang maikli?',
            en: 'Read step 1 again. Which stick stands up: the long one or the short one?',
          },
        },
        {
          part: 'short',
          slot: 'acrossTop',
          line: {
            id: 'build-step-2',
            text: {
              A: { fil: 'Ilagay ang maikling patpat nang pahiga, malapit sa itaas.', en: 'Put the short stick lying across, near the top.' },
              B: {
                fil: 'Ilagay ang maikling patpat nang pahiga. Dapat nasa itaas na bahagi ito, hindi sa gitna.',
                en: 'Lay the short stick across. It should be near the top, not in the middle.',
              },
            },
          },
          hint: {
            fil: 'Basahin ulit ang hakbang 2. Saan dapat ang maikling patpat: malapit sa itaas o sa gitna?',
            en: 'Read step 2 again. Where does the short stick go: near the top or in the middle?',
          },
        },
        {
          part: 'string',
          slot: 'knotTop',
          line: {
            id: 'build-step-3',
            text: {
              A: { fil: 'Itali ang tali kung saan nagkrus ang dalawang patpat.', en: 'Tie the string where the two sticks cross.' },
              B: {
                fil: 'Gamitin ang tali. Itali ito nang mahigpit kung saan nagkrus ang dalawang patpat.',
                en: 'Use the string. Tie it tightly at the spot where the two sticks cross.',
              },
            },
          },
          hint: {
            fil: 'Hakbang 3: hanapin kung saan nagtatagpo ang dalawang patpat. Doon itali.',
            en: 'Step 3: find the spot where the two sticks meet. Tie it there.',
          },
        },
        {
          part: 'paper',
          slot: 'paper',
          folds: 4,
          line: {
            id: 'build-step-4',
            text: {
              A: { fil: 'Ilagay ang papel, saka itupi ang apat na gilid.', en: 'Put on the paper, then fold all four edges.' },
              B: {
                fil: 'Ilatag ang pulang papel sa likod ng mga patpat. Itupi ang apat na gilid nito para kumapit sa patpat.',
                en: 'Lay the red paper behind the sticks. Fold all four edges so the paper holds on to the sticks.',
              },
            },
          },
          hint: {
            fil: 'Hakbang 4: ilang gilid ng papel ang kailangang itupi? Pindutin ang bawat gilid.',
            en: 'Step 4: how many edges of the paper need folding? Tap each edge.',
          },
        },
      ],
      success: {
        fil: 'Ang galing! Matibay ang saranggola at handa nang lumipad.',
        en: 'Wonderful! The kite is strong and ready to fly.',
      },
    },

    // ─────────────── 4. Find the proof ───────────────
    {
      id: 'proof',
      kind: 'proof',
      title: { fil: 'Hanapin ang patunay', en: 'Find the proof' },
      skill: 'details',
      ribbon: 'coral',
      lines: [
        {
          id: 'proof-1',
          who: 'nonoy',
          mood: 'think',
          text: {
            fil: 'Ate Tala, bakit ka nag-ipon ng barya mula sa baon mo?',
            en: 'Tala, why did you save coins from your snack money?',
          },
        },
      ],
      prompt: {
        id: 'proof-q',
        text: {
          fil: 'Basahin ang talaarawan ni Tala. Pindutin ang pangungusap na sumasagot sa tanong ni Nonoy.',
          en: 'Read Tala’s diary. Tap the sentence that answers Nonoy’s question.',
        },
      },
      passageTitle: { fil: 'Talaarawan ni Tala', en: 'Tala’s diary' },
      passage: {
        A: [
          { id: 'proof-p1', text: { fil: 'Mahilig akong manood ng saranggola sa langit.', en: 'I love watching kites in the sky.' } },
          { id: 'proof-p2', text: { fil: 'Gusto kong gumawa ng sarili kong saranggola.', en: 'I want to make my own kite.' } },
          { id: 'proof-p3', text: { fil: 'Kaya nag-ipon ako ng barya para makabili ng pulang papel.', en: 'So I saved coins to buy red paper.' } },
          { id: 'proof-p4', text: { fil: 'Ngayon, may pulang papel na ako!', en: 'Now I have red paper!' } },
        ],
        B: [
          { id: 'proof-p1', text: { fil: 'Tuwing hapon, pinapanood ko ang mga saranggolang sumasayaw sa hangin.', en: 'Every afternoon, I watch kites dance in the wind.' } },
          { id: 'proof-p2', text: { fil: 'Matagal ko nang gustong gumawa ng sarili kong saranggola.', en: 'I have wanted to make my own kite for a long time.' } },
          {
            id: 'proof-p3',
            text: {
              fil: 'Kaya dalawang linggo akong nagtabi ng barya mula sa baon ko, para makabili ng pulang papel.',
              en: 'So for two weeks, I set aside coins from my snack money to buy red paper.',
            },
          },
          { id: 'proof-p5', text: { fil: 'Hindi ako bumili ng kendi kahit gusto ko.', en: 'I didn’t buy candy, even though I wanted to.' } },
          { id: 'proof-p4', text: { fil: 'Ngayon, may matingkad na pulang papel na ako!', en: 'Now I have bright red paper!' } },
        ],
      },
      answer: 'proof-p3',
      hints: {
        'proof-p1': {
          fil: 'Totoo iyan, pero hindi nito sinasabi kung para saan ang barya.',
          en: 'That’s true, but it doesn’t say what the coins were for.',
        },
        'proof-p2': {
          fil: 'Malapit na! Pero walang barya sa pangungusap na iyan. Hanapin ang salitang “barya.”',
          en: 'Close! But that sentence doesn’t talk about coins. Look for the word “coins.”',
        },
        'proof-p4': {
          fil: 'Iyan ang nangyari pagkatapos. Hanapin kung bakit siya nag-ipon.',
          en: 'That’s what happened after. Look for why she saved.',
        },
        'proof-p5': {
          fil: 'Hindi raw siya bumili ng kendi. Pero para saan ang barya?',
          en: 'She didn’t buy candy. But what were the coins for?',
        },
        default: { fil: 'Basahin ulit ang talaarawan. Para saan ang barya?', en: 'Read the diary again. What were the coins for?' },
      },
      success: {
        fil: 'Iyan ang patunay! Nag-ipon si Tala para makabili ng pulang papel para sa saranggola.',
        en: 'That’s the proof! Tala saved coins to buy red paper for her kite.',
      },
    },

    // ─────────────── 5. Use a new word ───────────────
    {
      id: 'word',
      kind: 'word',
      title: { fil: 'Bagong salita', en: 'New word' },
      skill: 'vocabulary',
      ribbon: 'violet',
      word: {
        id: 'sobra',
        word: { fil: 'sobra', en: 'extra' },
        meaning: { fil: 'higit sa kailangan', en: 'more than you need' },
        example: { fil: 'May isang sobrang papel si Tala.', en: 'Tala has one extra sheet of paper.' },
      },
      teach: {
        id: 'word-teach',
        who: 'lolo',
        mood: 'happy',
        text: {
          A: {
            fil: 'Isang papel lang ang kailangan ng saranggola. Dalawa ang binili ni Tala. Kaya [[sobra]] ang isang papel.',
            en: 'The kite needs only one sheet of paper. Tala bought two. So one sheet is [[extra]].',
          },
          B: {
            fil: 'Isang papel lang ang kailangan ng saranggola, pero dalawa ang nabili ni Tala. Ang natirang papel ay [[sobra]], dahil higit ito sa kailangan.',
            en: 'The kite needs only one sheet of paper, but Tala bought two. The sheet left over is [[extra]], because it is more than she needs.',
          },
        },
      },
      tapWord: { fil: 'Pindutin ang salitang may kulay.', en: 'Tap the coloured word.' },
      task: {
        prompt: {
          id: 'word-task',
          who: 'lolo',
          mood: 'think',
          text: {
            A: {
              fil: 'Ang saranggola ay kailangan ng 2 patpat at 1 papel. Ano ang sobra sa mesa?',
              en: 'The kite needs 2 sticks and 1 sheet of paper. What is extra on the table?',
            },
            B: {
              fil: 'Para sa isang saranggola, 2 patpat at 1 papel lang ang kailangan. Tingnan ang mesa. Alin ang sobra?',
              en: 'One kite needs only 2 sticks and 1 sheet of paper. Look at the table. What is extra?',
            },
          },
        },
        table: { stick: 3, sheet: 2 },
        options: [
          { id: 'twoSticks', label: { fil: '2 patpat', en: '2 sticks' }, items: { stick: 2 } },
          { id: 'oneEach', label: { fil: '1 patpat at 1 papel', en: '1 stick and 1 sheet' }, items: { stick: 1, sheet: 1 } },
          { id: 'none', label: { fil: 'Walang sobra', en: 'Nothing is extra' }, items: {} },
        ],
        answer: 'oneEach',
        hints: {
          twoSticks: {
            fil: 'Bilangin ulit. Ilan ang patpat sa mesa? Ilan ang kailangan? At ang papel?',
            en: 'Count again. How many sticks are on the table? How many are needed? What about the paper?',
          },
          none: {
            fil: 'May higit pa sa kailangan! Ihambing ang nasa mesa sa kailangan ng saranggola.',
            en: 'There is more than needed! Compare the table with what the kite needs.',
          },
          default: { fil: 'Bilangin ulit ang nasa mesa.', en: 'Count what is on the table again.' },
        },
        success: {
          fil: 'Tama! Ang sobra ay higit sa kailangan: 1 patpat at 1 papel.',
          en: 'Yes! Extra means more than you need: 1 stick and 1 sheet.',
        },
      },
    },

    // ─────────────── 6. Decide and explain ───────────────
    {
      id: 'decide',
      kind: 'decide',
      title: { fil: 'Ano ang gagawin ni Tala?', en: 'What should Tala do?' },
      skill: 'explaining',
      lines: [
        {
          id: 'decide-1',
          who: 'nonoy',
          mood: 'sad',
          text: {
            A: {
              fil: 'Nakatingin si Nonoy sa mga saranggola. “Wala akong saranggola,” mahina niyang sabi.',
              en: 'Nonoy looks at the kites. “I don’t have a kite,” he says softly.',
            },
            B: {
              fil: 'Nakadungaw si Nonoy sa bakod at nakatingin sa mga saranggola. “Wala akong saranggola,” mahina niyang sabi. “Wala rin akong pambili ng papel.”',
              en: 'Nonoy peeks over the fence at the kites. “I don’t have a kite,” he says softly. “I can’t buy paper, either.”',
            },
          },
        },
        {
          id: 'decide-2',
          who: 'tala',
          mood: 'think',
          text: {
            A: {
              fil: 'Hawak ni Tala ang sobra niyang papel. Kung mapunit ang saranggola niya, kakailanganin niya ito.',
              en: 'Tala holds her extra paper. If her kite tears, she will need it.',
            },
            B: {
              fil: 'Hawak ni Tala ang sobra niyang pulang papel. Itinatabi niya ito kung sakaling mapunit ang saranggola niya sa Sabado.',
              en: 'Tala holds her extra red paper. She is keeping it in case her kite tears on Saturday.',
            },
          },
        },
      ],
      prompt: {
        id: 'decide-q',
        text: { fil: 'Ikaw ang pumili. Ano ang dapat gawin ni Tala?', en: 'You choose. What should Tala do?' },
      },
      options: [
        {
          id: 'give',
          icon: 'give',
          label: { fil: 'Ibigay kay Nonoy ang papel', en: 'Give the paper to Nonoy' },
          reply: [
            {
              id: 'decide-give-1',
              who: 'tala',
              mood: 'happy',
              text: { fil: '“Nonoy, sa iyo na ito. Gawa tayo ng saranggola mo!”', en: '“Nonoy, this is for you. Let’s make your kite!”' },
            },
            {
              id: 'decide-give-2',
              who: 'nonoy',
              mood: 'wow',
              text: { fil: '“Talaga, Ate Tala? Salamat!”', en: '“Really, Tala? Thank you!”' },
            },
          ],
          explain: {
            prompt: {
              id: 'decide-give-why',
              who: 'nonoy',
              mood: 'think',
              text: { fil: '“Bakit mo ibinigay sa akin ang papel?”', en: '“Why did you give me the paper?”' },
            },
            starter: {
              fil: 'Sa tingin ko, dapat ibigay ni Tala ang papel kasi…',
              en: 'I think Tala should give the paper because…',
            },
          },
        },
        {
          id: 'keep',
          icon: 'keep',
          label: { fil: 'Itabi muna ang papel', en: 'Keep the paper for now' },
          reply: [
            {
              id: 'decide-keep-1',
              who: 'tala',
              mood: 'think',
              text: {
                fil: '“Pasensya na, Nonoy. Itatabi ko muna ito, baka mapunit ang saranggola ko.”',
                en: '“Sorry, Nonoy. I’ll keep this for now, in case my kite tears.”',
              },
            },
            {
              id: 'decide-keep-2',
              who: 'nonoy',
              mood: 'think',
              text: { fil: '“Sige. Gagamit na lang ako ng lumang dyaryo.”', en: '“Okay. I’ll use old newspaper instead.”' },
            },
          ],
          explain: {
            prompt: {
              id: 'decide-keep-why',
              who: 'nonoy',
              mood: 'think',
              text: { fil: '“Bakit mo itinabi ang papel, Ate Tala?”', en: '“Why did you keep the paper, Tala?”' },
            },
            starter: {
              fil: 'Sa tingin ko, dapat itabi ni Tala ang papel kasi…',
              en: 'I think Tala should keep the paper because…',
            },
          },
        },
      ],
    },

    // ─────────────── 7. Payoff ───────────────
    {
      id: 'payoff',
      kind: 'payoff',
      title: { fil: 'Araw ng Saranggola!', en: 'Kite Day!' },
      byChoice: {
        give: [
          {
            id: 'payoff-give',
            who: 'nonoy',
            mood: 'happy',
            text: {
              A: {
                fil: 'Magkatabing lumilipad ang saranggola ni Tala at ang saranggola ni Nonoy!',
                en: 'Tala’s kite and Nonoy’s kite fly side by side!',
              },
              B: {
                fil: 'Magkatabing lumilipad ang pulang saranggola ni Tala at ang bagong saranggola ni Nonoy. “Tayo ang pinakamasaya rito!” sigaw ni Nonoy.',
                en: 'Tala’s red kite and Nonoy’s new kite fly side by side. “We’re the happiest kids here!” Nonoy shouts.',
              },
            },
          },
        ],
        keep: [
          {
            id: 'payoff-keep',
            who: 'tala',
            mood: 'happy',
            text: {
              A: {
                fil: 'Mataas ang lipad ng pulang saranggola ni Tala. Lumilipad din ang saranggolang dyaryo ni Nonoy!',
                en: 'Tala’s red kite flies high. Nonoy’s newspaper kite flies too!',
              },
              B: {
                fil: 'Mataas ang lipad ng pulang saranggola ni Tala. Sa tabi nito, lumilipad din ang saranggolang dyaryo na ginawa ni Nonoy. “Ang galing ng gawa mo!” sabi ni Tala.',
                en: 'Tala’s red kite flies high. Next to it flies the newspaper kite Nonoy made. “Your kite is great!” Tala says.',
              },
            },
          },
        ],
      },
      lines: [
        {
          id: 'payoff-plaza',
          who: 'lolo',
          mood: 'happy',
          text: {
            fil: 'Dahil sa tulong mo, makulay na ulit ang plaza!',
            en: 'Thanks to your help, the plaza is colourful again!',
          },
        },
      ],
      reward: { fil: 'Naibalik mo ang Plaza!', en: 'You restored the Plaza!' },
      praise: {
        supplies: { fil: 'Sinundan mo nang tama ang mga clue ni Tala.', en: 'You followed Tala’s clues to the right places.' },
        'supplies-retry': { fil: 'Binalikan mo ang mga clue hanggang mahanap mo ang mga gamit.', en: 'You went back to the clues until you found the supplies.' },
        build: { fil: 'Binasa mo nang mabuti ang sulat ni Lolo Ben.', en: 'You read Lolo Ben’s note carefully.' },
        'build-retry': { fil: 'Binalikan mo ang sulat ni Lolo Ben at naayos mo ang saranggola.', en: 'You reread Lolo Ben’s note and fixed the kite.' },
        proof: { fil: 'Nahanap mo ang patunay sa kuwento.', en: 'You found the proof in the story.' },
        'proof-retry': { fil: 'Hindi ka sumuko sa paghanap ng patunay.', en: 'You kept looking until you found the proof.' },
        word: { fil: 'Ginamit mo ang bagong salitang “sobra.”', en: 'You used the new word “extra.”' },
        'word-retry': { fil: 'Nagbilang ka ulit at naintindihan mo ang “sobra.”', en: 'You counted again and figured out “extra.”' },
        'choice-give': { fil: 'Pinili mong tulungan si Nonoy.', en: 'You chose to help Nonoy.' },
        'choice-keep': { fil: 'Inisip mo kung ano ang kailangan ni Tala.', en: 'You thought about what Tala needs.' },
        'explain-recorded': { fil: 'Ipinaliwanag mo nang malakas ang iniisip mo.', en: 'You explained your thinking out loud.' },
        'explain-partner': { fil: 'Ibinahagi mo ang iniisip mo sa katabi mo.', en: 'You shared your thinking with a partner.' },
      },
    },
  ],
};
