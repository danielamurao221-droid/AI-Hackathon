/*
 * Basa Quest: ALL child-facing text lives in this file.
 *
 * Story: "Ang Saranggola ni Tala / Tala's Kite" (original, written for this prototype)
 *
 * STATUS: reviewed: false
 * A Grade 3 teacher and a Filipino language reviewer must check every string here
 * before any use with real children. See README "Content review checklist".
 *
 * Editing tips
 * - Keep Filipino and English page counts the same inside each band.
 * - Band A: about 60-100 words per chapter. Band B: about 100-160 words per chapter.
 * - Questions are shared by both bands, so every answer must be findable in Band A too.
 * - `answer` is the index (0, 1 or 2) of the correct choice.
 */
import type { Bi, Chapter, PicId } from '../types';

export const CONTENT_META = {
  reviewed: false,
  title: { fil: 'Ang Saranggola ni Tala', en: "Tala's Kite" } as Bi,
  version: '0.1-draft',
};

export const chapters: Chapter[] = [
  // ───────────────────────────── LEVEL 1 ─────────────────────────────
  {
    level: 1,
    title: { fil: 'Ang Pulang Papel', en: 'The Red Paper' },
    pages: {
      A: [
        {
          fil: 'Nakatira si Tala sa isang maliit na bayan malapit sa dagat. Tuwing hapon, umiihip ang hangin mula sa dagat. Gustong-gusto ni Tala ang hangin.',
          en: 'Tala lives in a small town by the sea. Every afternoon, the wind blows in from the water. Tala loves the wind.',
        },
        {
          fil: 'Sa Sabado, may Araw ng Saranggola sa plaza. Gusto ni Tala na magpalipad ng sarili niyang saranggola. Nag-ipon siya ng barya mula sa baon niya para makabili ng pulang papel.',
          en: 'On Saturday, there will be a Kite Day at the plaza. Tala wants to fly her own kite. She saves coins from her snack money to buy red paper.',
        },
        {
          fil: 'Binigyan siya ni Lolo Ben ng manipis na patpat na kawayan. Magkasama nilang binuo ang saranggola. May natira pang isang sobrang pulang papel si Tala. Nakadungaw sa bakod ang kapitbahay nilang si Nonoy. “Wala akong saranggola,” mahina niyang sabi.',
          en: 'Lolo Ben gives her thin bamboo sticks. Together, they make the kite. Tala has one extra sheet of red paper left. Her neighbor Nonoy watches from the fence. “I don’t have a kite,” he says softly.',
        },
      ],
      B: [
        {
          fil: 'Nakatira si Tala sa isang maliit na bayan sa tabi ng dagat. Tuwing hapon, pinasasayaw ng malamig na hangin mula sa dagat ang mga dahon ng niyog. Gustong-gusto ni Tala ang hanging iyon. Sabi niya, parang kumakanta ang dagat.',
          en: 'Tala lives in a small town by the sea. Every afternoon, a cool wind blows in from the water and makes the coconut leaves dance. Tala loves that wind. She says it sounds like the sea is singing.',
        },
        {
          fil: 'Sa Sabado, may Araw ng Saranggola ang barangay sa plaza. Gusto ni Tala na magpalipad ng saranggolang siya mismo ang gumawa. Dalawang linggo siyang nag-ipon ng barya mula sa baon niya. Ngayon, may matingkad na pulang papel na siya.',
          en: 'This Saturday, the barangay will hold a Kite Day at the plaza. Tala wants to fly a kite that she made herself. For two weeks, she saved coins from her snack money. Now she has bright red paper.',
        },
        {
          fil: 'Kumuha si Lolo Ben ng manipis na patpat na kawayan. Itinuro niya kung paano itali ang mga ito nang pakrus. Maingat na idinikit ni Tala ang papel, isa-isang sulok. Nagtabi pa siya ng isang sobrang papel.',
          en: 'Lolo Ben brings thin bamboo sticks. He shows her how to tie them into a cross. Tala glues the paper on carefully, one corner at a time. She even keeps one extra sheet, just in case.',
        },
        {
          fil: 'Nakadungaw sa bakod ang kapitbahay nilang si Nonoy, na anim na taong gulang. Sinusundan niya ng tingin ang bawat tupi. “Wala akong saranggola,” mahina niyang sabi. “Baka puwede akong gumawa mula sa lumang dyaryo.” Tiningnan ni Tala ang sobra niyang papel. Hindi pa siya nagsalita.',
          en: 'Her neighbor Nonoy watches from the fence. He is six, and his eyes follow every fold. “I don’t have a kite,” he says softly. “Maybe I can make one from old newspaper.” Tala looks at her extra red sheet. She doesn’t say anything yet.',
        },
      ],
    },
    questions: [
      {
        id: 'l1q1',
        kind: 'why',
        skill: 'explaining',
        prompt: {
          fil: 'Bakit nag-ipon ng barya si Tala mula sa baon niya?',
          en: 'Why did Tala save coins from her snack money?',
        },
        choices: [
          { fil: 'Para makabili ng kendi', en: 'To buy candy' },
          { fil: 'Para makabili ng pulang papel para sa saranggola', en: 'To buy red paper for her kite' },
          { fil: 'Para ibigay kay Lolo Ben', en: 'To give to Lolo Ben' },
        ],
        answer: 1,
        hint: {
          fil: 'Isipin mo kung ano ang kailangan ni Tala para sa saranggola niya.',
          en: 'Think about what Tala needs to make her kite.',
        },
        explain: {
          fil: 'Nag-ipon si Tala para makabili ng pulang papel. Gusto niyang siya mismo ang gumawa ng saranggola!',
          en: 'Tala saved her coins to buy red paper. She wanted to make the kite herself!',
        },
      },
      {
        id: 'l1q2',
        kind: 'how',
        skill: 'details',
        prompt: {
          fil: 'Paano tinulungan ni Lolo Ben si Tala?',
          en: 'How did Lolo Ben help Tala?',
        },
        choices: [
          { fil: 'Binigyan niya si Tala ng patpat na kawayan.', en: 'He gave her bamboo sticks.' },
          { fil: 'Binilhan niya si Tala ng bagong saranggola.', en: 'He bought her a new kite.' },
          { fil: 'Siya ang nagpalipad ng saranggola.', en: 'He flew the kite for her.' },
        ],
        answer: 0,
        hint: {
          fil: 'Ano ang kailangan para magkahugis ang saranggola?',
          en: 'What does a kite need to keep its shape?',
        },
        explain: {
          fil: 'Binigyan siya ni Lolo Ben ng manipis na kawayan, at magkasama nilang ginawa ang saranggola.',
          en: 'Lolo Ben gave her thin bamboo sticks, and they made the kite together.',
        },
      },
      {
        id: 'l1q3',
        kind: 'feeling',
        skill: 'details',
        prompt: {
          fil: 'Ano sa tingin mo ang naramdaman ni Nonoy nang sabihin niyang “Wala akong saranggola”?',
          en: 'How do you think Nonoy felt when he said, “I don’t have a kite”?',
        },
        choices: [
          { fil: 'Galit na galit', en: 'Very angry' },
          { fil: 'Inaantok', en: 'Sleepy' },
          { fil: 'Medyo malungkot', en: 'A little sad' },
        ],
        answer: 2,
        hint: {
          fil: 'Mahina niya itong sinabi habang nakatingin sa saranggola ni Tala. Ano ang mararamdaman mo?',
          en: 'He said it softly while looking at Tala’s kite. How would you feel?',
        },
        explain: {
          fil: 'Mahina ang boses niya at nakatingin lang siya. Gusto rin niyang magkaroon ng saranggola.',
          en: 'He spoke softly and kept watching. He wished he had a kite too.',
        },
      },
      {
        id: 'l1q4',
        kind: 'word',
        skill: 'vocabulary',
        prompt: {
          fil: 'May isang sobrang pulang papel si Tala. Ano ang ibig sabihin ng “sobra”?',
          en: 'Tala has one extra sheet of red paper. What does “extra” mean?',
        },
        choices: [
          { fil: 'Higit sa kailangan', en: 'More than you need' },
          { fil: 'Napakaluma', en: 'Very old' },
          { fil: 'Punit', en: 'Torn' },
        ],
        answer: 0,
        hint: {
          fil: 'Tapos na ang saranggola. May natira pa bang papel?',
          en: 'The kite is finished. Is there still some paper left?',
        },
        explain: {
          fil: 'Ang sobra ay higit sa kailangan. Tapos na ang saranggola, pero may natira pang isang papel.',
          en: '“Extra” means more than you need. The kite was done, and one sheet was left.',
        },
      },
    ],
    explain: {
      id: 'l1q5',
      prompt: {
        fil: 'Walang saranggola si Nonoy. May sobrang pulang papel si Tala. Ano sa tingin mo ang gagawin ni Tala? Bakit?',
        en: 'Nonoy has no kite. Tala has extra red paper. What do you think Tala will do? Why?',
      },
      starter: {
        fil: 'Sa tingin ko, si Tala ay… kasi…',
        en: 'I think Tala will… because…',
      },
    },
  },

  // ───────────────────────────── LEVEL 2 ─────────────────────────────
  {
    level: 2,
    title: { fil: 'Ang Punit na Saranggola', en: 'The Torn Kite' },
    pages: {
      A: [
        {
          fil: 'Noong Biyernes, sinubukan nina Tala at Nonoy ang kanilang saranggola sa bukid. Gawa sa lumang dyaryo ang saranggola ni Nonoy. Iniangat ito ng hangin, pataas nang pataas!',
          en: 'On Friday, Tala and Nonoy test their kites in the field. Nonoy made his kite from old newspaper. The wind lifts it up, up, up!',
        },
        {
          fil: 'Pero sumabit ang saranggola sa puno ng bayabas. Rrrip! Napunit ito sa gitna. Hawak ni Nonoy ang sirang saranggola, at umiyak siya.',
          en: 'Then the kite hits a guava tree. Rrrip! It tears in the middle. Nonoy holds his broken kite and starts to cry.',
        },
        {
          fil: 'Naalala ni Tala ang sobra niyang pulang papel. Itinatabi niya iyon kung sakaling mapunit ang sarili niyang saranggola bukas. Tiningnan niya si Nonoy. Saka siya nagsabi, “Ayusin natin nang magkasama.” Tinapalan nila ng pulang papel ang butas hanggang lumubog ang araw.',
          en: 'Tala thinks about her extra red paper. She wanted to keep it in case her own kite tears tomorrow. She looks at Nonoy. Then she says, “Let’s fix it together.” They patch the hole with red paper until the sun goes down.',
        },
      ],
      B: [
        {
          fil: 'Biyernes ng hapon, dinala nina Tala at Nonoy ang kanilang saranggola sa malawak na bukid sa likod ng paaralan. Gawa sa lumang dyaryo at pandikit na kanin ang saranggola ni Nonoy. Nang dumating ang hangin, umakyat ito nang pataas nang pataas. Tumawa si Nonoy at tumakbo.',
          en: 'On Friday afternoon, Tala and Nonoy carry their kites to the open field behind the school. Nonoy made his kite from old newspaper and rice glue. When the wind comes, it climbs up, up, up. Nonoy laughs and runs.',
        },
        {
          fil: 'Biglang nag-iba ang ihip ng hangin. Bumulusok ang saranggolang dyaryo sa puno ng bayabas. Rrrip! Napunit ito nang mahaba sa gitna. Niyakap ni Nonoy ang sirang saranggola at nagsimulang umiyak.',
          en: 'Suddenly, the wind changes. The newspaper kite dives into a guava tree. Rrrip! A long tear opens in the middle. Nonoy hugs the broken kite to his chest and starts to cry.',
        },
        {
          fil: 'Naalala ni Tala ang sobrang pulang papel sa bag niya. Itinatabi niya iyon kung sakaling mapunit ang sarili niyang saranggola bukas. Kapag ibinigay niya iyon, wala na siyang pang-ayos. Kaunti na rin ang oras para makapagpraktis.',
          en: 'Tala thinks about the extra red sheet in her bag. She was keeping it in case her own kite tears tomorrow. If she gives it away, she will have nothing left for fixing. There is also very little time left to practice.',
        },
        {
          fil: 'Tiningnan ni Tala ang saranggola niya, saka si Nonoy. Lumuhod siya sa tabi nito. “Ayusin natin nang magkasama,” sabi niya. Tinapalan nila ang butas ng pulang papel at pandikit na kanin. Pagkatapos nila, palubog na ang araw.',
          en: 'Tala looks at her kite, then at Nonoy. She kneels down beside him. “Let’s fix it together,” she says. They patch the hole with red paper and rice glue. When they finish, the sun is already going down.',
        },
      ],
    },
    questions: [
      {
        id: 'l2q1',
        kind: 'why',
        skill: 'details',
        prompt: { fil: 'Bakit umiyak si Nonoy?', en: 'Why did Nonoy start to cry?' },
        choices: [
          { fil: 'Nadapa siya sa bukid.', en: 'He fell in the field.' },
          { fil: 'Napunit ang saranggola niya sa puno.', en: 'His kite tore on a tree.' },
          { fil: 'Kinuha ni Tala ang saranggola niya.', en: 'Tala took his kite.' },
        ],
        answer: 1,
        hint: {
          fil: 'Ano ang nangyari nang sumabit ang saranggola sa puno ng bayabas?',
          en: 'What happened when the kite hit the guava tree?',
        },
        explain: {
          fil: 'Sumabit ang saranggola sa puno at napunit sa gitna. Pinaghirapan iyon ni Nonoy kaya nalungkot siya.',
          en: 'The kite hit a guava tree and tore in the middle. Nonoy worked hard on it, so he was sad.',
        },
      },
      {
        id: 'l2q2',
        kind: 'why',
        skill: 'explaining',
        prompt: {
          fil: 'Bakit gusto sanang itabi ni Tala ang sobra niyang papel?',
          en: 'Why did Tala want to keep her extra paper at first?',
        },
        choices: [
          { fil: 'Para gumuhit ng larawan', en: 'To draw a picture' },
          { fil: 'Para ibenta sa tindahan', en: 'To sell it at a store' },
          { fil: 'Pang-ayos sa sarili niyang saranggola kung mapunit ito', en: 'To fix her own kite if it tears' },
        ],
        answer: 2,
        hint: {
          fil: 'Iniisip ni Tala ang mangyayari bukas. Ano ang puwedeng mangyari sa saranggola niya?',
          en: 'Tala was thinking about tomorrow. What could happen to her kite?',
        },
        explain: {
          fil: 'Itinatabi niya iyon kung sakaling mapunit ang saranggola niya. Kaya hindi madali ang pasya niyang ibigay ito.',
          en: 'She was keeping it in case her kite tore. That is why giving it away was not an easy choice.',
        },
      },
      {
        id: 'l2q3',
        kind: 'predict',
        skill: 'explaining',
        prompt: {
          fil: 'Ginamit ni Tala ang sobrang papel para sa saranggola ni Nonoy. Ano ang puwedeng mangyari sa Araw ng Saranggola?',
          en: 'Tala used her extra paper on Nonoy’s kite. What might happen at Kite Day?',
        },
        choices: [
          { fil: 'Kapag napunit ang saranggola niya, wala na siyang pang-ayos.', en: 'If her kite tears, she has no paper to fix it.' },
          { fil: 'Magiging ibon ang saranggola niya.', en: 'Her kite will turn into a bird.' },
          { fil: 'Hindi pupunta si Nonoy sa Araw ng Saranggola.', en: 'Nonoy will not go to Kite Day.' },
        ],
        answer: 0,
        hint: {
          fil: 'Isipin mo kung bakit itinatabi ni Tala ang sobrang papel.',
          en: 'Think about why Tala was keeping the extra paper.',
        },
        explain: {
          fil: 'Magaling na hula! Wala nang ekstrang papel si Tala kung mapunit ang saranggola niya. Tingnan natin ang mangyayari!',
          en: 'Good guess! Tala has no spare paper now if her kite tears. Let’s see what happens!',
        },
      },
      {
        id: 'l2q4',
        kind: 'word',
        skill: 'vocabulary',
        prompt: {
          fil: '“Napunit ito sa gitna.” Ano ang ibig sabihin ng “napunit”?',
          en: '“It tears in the middle.” What does “tear” mean here?',
        },
        choices: [
          { fil: 'Nabasa ng ulan', en: 'A drop of water from your eye' },
          { fil: 'Nasira at nahati ang papel', en: 'To rip apart' },
          { fil: 'Lumipad nang mataas', en: 'To fly up high' },
        ],
        answer: 1,
        hint: {
          fil: 'Alalahanin ang tunog sa kuwento: Rrrip!',
          en: 'Remember the sound in the story: Rrrip!',
        },
        explain: {
          fil: 'Ang napunit ay nasira at nahati. Nahati ang papel sa gitna.',
          en: 'Here, “tear” means to rip. The paper split in the middle.',
        },
      },
    ],
    explain: {
      id: 'l2q5',
      prompt: {
        fil: 'Ibinigay ni Tala ang papel na itinatabi niya. Bakit kaya niya iyon ginawa?',
        en: 'Tala gave away the paper she was keeping. Why do you think she did that?',
      },
      starter: {
        fil: 'Sa tingin ko, ginawa niya iyon kasi…',
        en: 'I think she did it because…',
      },
    },
  },

  // ───────────────────────────── LEVEL 3 ─────────────────────────────
  {
    level: 3,
    title: { fil: 'Araw ng Saranggola', en: 'Kite Day' },
    pages: {
      A: [
        {
          fil: 'Araw na ng Saranggola! Puno ng saranggola ang langit. Mataas na lumipad ang pulang saranggola ni Tala. Katabi nito ang tinapalang saranggola ni Nonoy.',
          en: 'It is Kite Day! The sky is full of kites. Tala’s red kite climbs high. Nonoy’s patched kite flies right next to it.',
        },
        {
          fil: 'Biglang umihip ang malakas na hangin. Bumagsak ang saranggola ni Tala, at napunit ang isang sulok. Wala na siyang sobrang papel. Parang gusto nang umiyak ni Tala.',
          en: 'Then a strong wind blows. Tala’s kite falls, and one corner tears. She has no extra paper now. Tala feels like crying.',
        },
        {
          fil: 'Tumakbo si Nonoy papunta sa kanya. Kinuha niya sa bulsa ang maliit na pulang papel. “Itinabi ko ang natira,” sabi niya. “Tinulungan mo ako, kaya tutulungan din kita.” Maya-maya, magkatabing lumilipad ang dalawang saranggola. Napangiti si Tala. Mas masaya ang lumipad nang magkasama.',
          en: 'Nonoy runs to her. He takes a small piece of red paper from his pocket. “I kept what was left,” he says. “You helped me, so I will help you.” Soon, two kites fly side by side. Tala smiles. Flying together is the best part.',
        },
      ],
      B: [
        {
          fil: 'Maliwanag at mahangin ang umaga ng Sabado. Puno ng tao ang plaza, at puno ng saranggola ang langit: asul, dilaw, berde, at ang matingkad na pula ni Tala. Katabi nito ang tinapalang saranggola ni Nonoy. Kumaway si Nonoy kay Tala.',
          en: 'Saturday morning is bright and windy. The plaza is full of people, and the sky is full of kites: blue, yellow, green, and Tala’s bright red one. Nonoy’s patched kite flies right next to it. He waves at Tala.',
        },
        {
          fil: 'Biglang umihip ang malakas na hangin sa plaza. Umikot ang saranggola ni Tala at bumagsak sa lupa. Napunit ang isang sulok nito. Dahan-dahan itong pinulot ni Tala. Wala na siyang sobrang papel. Naninikip ang lalamunan niya, at gusto na niyang umiyak.',
          en: 'Then a strong gust of wind sweeps across the plaza. Tala’s kite twists and drops to the ground. One corner is torn. Tala picks it up slowly. She has no extra paper anymore. Her throat feels tight, and she wants to cry.',
        },
        {
          fil: 'Tumakbo si Nonoy palapit at may dinukot sa bulsa. Inilabas niya ang maliit at nakatuping pulang papel. “Kagabi, itinabi ko ang natira nang ayusin natin ang saranggola ko,” sabi niya. “Tinulungan mo ako, kaya ngayon, tutulungan din kita.”',
          en: 'Nonoy runs over and reaches into his pocket. He pulls out a small, folded piece of red paper. “Last night, I kept what was left after we fixed my kite,” he says. “You helped me, so now I will help you.”',
        },
        {
          fil: 'Magkasama nilang tinapalan ang punit na sulok. Maya-maya, magkatabing umaakyat sa langit ang dalawang saranggola. Umuugong ang hangin mula sa dagat. Napangiti si Tala. Naisip niya, ang pinakamasaya pala ay hindi ang pinakamataas na lipad. Ito ay ang paglipad nang magkasama.',
          en: 'Together, they patch the torn corner. Soon, two kites rise side by side. The sea wind hums. Tala smiles. Maybe the best part of Kite Day is not flying the highest, she thinks. It is flying together.',
        },
      ],
    },
    questions: [
      {
        id: 'l3q1',
        kind: 'how',
        skill: 'details',
        prompt: {
          fil: 'Ano ang nangyari sa saranggola ni Tala nang umihip ang malakas na hangin?',
          en: 'What happened to Tala’s kite when the strong wind blew?',
        },
        choices: [
          { fil: 'Lumipad ito papunta sa dagat.', en: 'It flew away to the sea.' },
          { fil: 'Naging asul ito.', en: 'It turned blue.' },
          { fil: 'Bumagsak ito at napunit ang isang sulok.', en: 'It fell, and one corner tore.' },
        ],
        answer: 2,
        hint: {
          fil: 'Isipin kung ano ang ginawa ng malakas na hangin sa saranggola.',
          en: 'Think about what the strong wind did to the kite.',
        },
        explain: {
          fil: 'Pinabagsak ng hangin ang saranggola, at napunit ang isang sulok.',
          en: 'The wind made the kite fall, and one corner tore.',
        },
      },
      {
        id: 'l3q2',
        kind: 'feeling',
        skill: 'details',
        prompt: {
          fil: 'Ano ang naramdaman ni Tala nang mapunit ang saranggola niya?',
          en: 'How did Tala feel when her kite tore?',
        },
        choices: [
          { fil: 'Malungkot at nag-aalala', en: 'Sad and worried' },
          { fil: 'Sabik na sabik', en: 'Very excited' },
          { fil: 'Naiinip', en: 'Bored' },
        ],
        answer: 0,
        hint: {
          fil: 'Wala na siyang sobrang papel. Ano ang mararamdaman mo?',
          en: 'She had no extra paper left. How would you feel?',
        },
        explain: {
          fil: 'Gusto nang umiyak ni Tala. Punit ang saranggola niya at wala siyang pang-ayos.',
          en: 'Tala felt like crying. Her kite was torn and she had nothing to fix it with.',
        },
      },
      {
        id: 'l3q3',
        kind: 'why',
        skill: 'explaining',
        prompt: {
          fil: 'Bakit ibinigay ni Nonoy kay Tala ang pulang papel?',
          en: 'Why did Nonoy give Tala the red paper?',
        },
        choices: [
          { fil: 'Kasi ayaw niya ng kulay pula.', en: 'Because he did not like red.' },
          { fil: 'Kasi tinulungan siya ni Tala noon.', en: 'Because Tala helped him before.' },
          { fil: 'Kasi gusto na niyang umuwi.', en: 'Because he wanted to go home.' },
        ],
        answer: 1,
        hint: {
          fil: 'Alalahanin ang sinabi ni Nonoy: “Tinulungan mo ako…”',
          en: 'Remember what Nonoy said: “You helped me…”',
        },
        explain: {
          fil: 'Naalala ni Nonoy ang pagtulong ni Tala. Kaya gusto rin niyang tumulong.',
          en: 'Nonoy remembered how Tala helped him. Now he wanted to help her back.',
        },
      },
      {
        id: 'l3q4',
        kind: 'word',
        skill: 'vocabulary',
        prompt: {
          fil: '“Magkatabing lumilipad ang dalawang saranggola.” Ano ang ibig sabihin ng “magkatabi”?',
          en: '“Two kites fly side by side.” What does “side by side” mean?',
        },
        choices: [
          { fil: 'Malayo sa isa’t isa', en: 'Far apart' },
          { fil: 'Nasa tabi ng isa’t isa', en: 'Next to each other' },
          { fil: 'Baligtad', en: 'Upside down' },
        ],
        answer: 1,
        hint: {
          fil: 'Isipin mong nakaupo ka kasama ang kaibigan mo sa iisang upuan.',
          en: 'Think of sitting with a friend on the same bench.',
        },
        explain: {
          fil: 'Ang magkatabi ay nasa tabi ng isa’t isa, parang magkaibigan.',
          en: '“Side by side” means next to each other, like two friends.',
        },
      },
    ],
    explain: {
      id: 'l3q5',
      prompt: {
        fil: 'Sa dulo, naisip ni Tala na mas masaya ang lumipad nang magkasama. Bakit kaya ganoon ang pakiramdam niya?',
        en: 'At the end, Tala thinks flying together is the best part. Why do you think she feels that way?',
      },
      starter: {
        fil: 'Sa tingin ko, ganoon ang pakiramdam niya kasi…',
        en: 'I think she feels that way because…',
      },
    },
  },
];

export function getChapter(level: number): Chapter | undefined {
  return chapters.find((c) => c.level === level);
}

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

/** Child-facing interface text. Use {name}-style placeholders for values. */
export const ui = {
  tagline: { fil: 'Magbasa, mag-isip, at magbahagi!', en: 'Read, think, and share!' },
  enterCode: { fil: 'Ilagay ang class code', en: 'Type your class code' },
  codeHint: { fil: 'Itanong sa guro. Demo code: DEMO123', en: 'Ask your teacher. Demo code: DEMO123' },
  codeWrong: { fil: 'Hindi gumana ang code. Subukan ulit!', en: 'That code didn’t work. Try again!' },
  next: { fil: 'Susunod', en: 'Next' },
  back: { fil: 'Bumalik', en: 'Back' },
  whoAreYou: { fil: 'Sino ka?', en: 'Who are you?' },
  pickPictures: { fil: 'Pindutin ang 2 lihim mong larawan', en: 'Tap your 2 secret pictures' },
  pictureWrong: { fil: 'Hindi pa tama. Subukan ulit!', en: 'Not quite. Let’s try again!' },
  demoPictures: { fil: 'Demo: ang mga larawan mo ay', en: 'Demo: your pictures are' },
  clear: { fil: 'Burahin', en: 'Clear' },
  hi: { fil: 'Kumusta, {name}!', en: 'Hi, {name}!' },
  mapTitle: { fil: 'Ang landas mo sa pagbasa', en: 'Your reading path' },
  stars: { fil: 'bituin', en: 'stars' },
  level: { fil: 'Antas', en: 'Level' },
  lockedSoon: { fil: 'Malapit na ang antas na ito!', en: 'This level is coming soon!' },
  lockedFinish: { fil: 'Tapusin muna ang Antas {n}.', en: 'Finish Level {n} first.' },
  trophy: { fil: 'Ang huling gantimpala!', en: 'The big prize at the end!' },
  logout: { fil: 'Lumabas', en: 'Log out' },
  stepRead: { fil: 'Basahin', en: 'Read' },
  stepAnswer: { fil: 'Sagutin', en: 'Answer' },
  stepExplain: { fil: 'Ipaliwanag', en: 'Explain' },
  listen: { fil: 'Makinig', en: 'Listen' },
  stopListening: { fil: 'Ihinto', en: 'Stop' },
  audioSoon: {
    fil: 'Malapit na ang audio! Magpabasa muna sa kaklase o guro.',
    en: 'Audio coming soon! Ask a classmate or your teacher to read with you.',
  },
  pageOf: { fil: 'Pahina {n} ng {m}', en: 'Page {n} of {m}' },
  doneReading: { fil: 'Tapos na akong magbasa!', en: 'I finished reading!' },
  questionOf: { fil: 'Tanong {n} ng {m}', en: 'Question {n} of {m}' },
  tryAgain: { fil: 'Magandang subok! Heto ang clue:', en: 'Good try! Here’s a clue:' },
  tryAgainTap: { fil: 'Pumili ulit.', en: 'Pick again.' },
  correctFirst: { fil: 'Magaling mag-isip!', en: 'Good thinking!' },
  correctRetry: { fil: 'Hindi ka sumuko, at nakuha mo!', en: 'You kept trying, and you got it!' },
  lookBack: { fil: 'Balikan ang kuwento', en: 'Look back at the story' },
  hideStory: { fil: 'Itago ang kuwento', en: 'Hide the story' },
  explainTitle: { fil: 'Ipaliwanag nang malakas', en: 'Explain out loud' },
  explainHow: { fil: 'Pindutin ang mikropono at sabihin ang sagot mo.', en: 'Tap the microphone and say your answer.' },
  startWith: { fil: 'Puwede kang magsimula sa:', en: 'You can start with:' },
  record: { fil: 'Mag-record', en: 'Record' },
  stop: { fil: 'Ihinto', en: 'Stop' },
  play: { fil: 'Pakinggan', en: 'Play' },
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
  levelDone: { fil: 'Tapos na ang Antas {n}!', en: 'Level {n} complete!' },
  starStory: { fil: 'Binasa mo ang kuwento', en: 'You read the story' },
  starQuestions: { fil: 'Sinagot mo ang mga tanong', en: 'You answered the questions' },
  starExplain: { fil: 'Ipinaliwanag mo ang iniisip mo', en: 'You explained your thinking' },
  cheers: [
    { fil: 'Ang sipag mong mag-isip!', en: 'You worked hard on your thinking!' },
    { fil: 'Ang galing ng pagpapaliwanag mo!', en: 'You shared your ideas so well!' },
    { fil: 'Lumalakas ang pagbasa mo araw-araw!', en: 'Your reading grows stronger every day!' },
  ] as Bi[],
  nextLevel: { fil: 'Susunod na antas', en: 'Next level' },
  backToMap: { fil: 'Bumalik sa mapa', en: 'Back to map' },
  allDone: {
    fil: 'Natapos mo ang lahat ng antas sa ngayon! May mga bagong kuwento pang darating.',
    en: 'You finished every level for now! New stories are on the way.',
  },
  breakTime: {
    fil: 'Mga 10 minuto ka nang nagbabasa. Ang galing! Puwede kang magpahinga at ituloy mamaya.',
    en: 'You’ve been reading for about 10 minutes. Great job! You can rest and continue later.',
  },
  saved: { fil: 'Naka-save ang progreso mo.', en: 'Your progress is saved.' },
  storageOff: {
    fil: 'Mase-save lang ang progreso habang bukas ang page na ito.',
    en: 'Progress is kept only while this page is open.',
  },
} satisfies Record<string, Bi | Bi[]>;
