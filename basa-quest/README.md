# Basa Quest (demo prototype)

A small top-down adventure game in Filipino and English for Grade 3 readers. The child walks
Tala around her barangay, talks to neighbours, reads short clues, finds the right things,
upgrades a kite, and flies it in the Kite Day race. **Reading is how you win:** every quest
needs the clue to be read or heard.

> **This is a clickable prototype for a Design Thinking project, not a production system.**
> It uses fictional sample data only. There is no backend, no accounts, no analytics and no
> outside network requests. All story text is **draft, `reviewed: false`** (see below).

**How Might We** make sure every struggling Grade 3 reader gets regular practice matched to their
level, even when teachers are stretched and help at home is limited?

## The game

**Loop:** explore → talk to a neighbour → read the quest → find the right place or item →
upgrade the kite → try the Kite Day race → come back for more upgrades if needed.

| Quest | What the child does | Why reading is needed | Reward |
| --- | --- | --- | --- |
| Start | Read Tala’s worry about her old kite | The store is described only as “the one with a blue roof” | – |
| 1 · Aling Nena’s Note | Collect 3 items for Lolo Ben, bring them to his workshop | The note gives details (long, not short; red; small jar). Look-alikes are on the map: short bamboo, blue paper, soy sauce, a slipper | **Strong Frame** (kite can take more bumps) + word *matibay* |
| 2 · Lolo Ben’s Build | Build the kite on the workbench (tap or drag parts), then test flight | Lolo Ben’s written steps say which stick, where, and how many folds | **Better Balance** (easier steering, less wobble, gusts hurt less) + word *pantay* |
| 3 · The Missing String | Ask Nonoy, Aling Nena and Kuya Jun; find the string; tap the clue that proves it; work out how much is *sobra* | Only the clues say where Muning the cat naps | **Long String** (climbs faster and higher) + word *sobra* |
| Nonoy’s Choice | Share or keep the extra paper, then answer Nonoy’s “Bakit?” aloud | Both choices are fine and lead to different dialogue; the opinion is never graded | Share → Nonoy shouts a warning before one big gust. Keep → one more tail ribbon (one more bump) |
| Kite Day race | Steer the kite to 100 m, avoid birds and gusts, fly through the right word gate | Word gates show a meaning from the Word Notebook; the race **pauses** while the child reads | Winning restores the plaza (animation + music) |

**No markers.** There are no arrows or destination markers. After **2** wrong tries the game offers
one clue-based hint with Makinig. After **4**, a soft sparkle appears near the target so no child
gets stuck. (Change these in `src/config.ts`: `HINT_AFTER`, `SPARKLE_AFTER`.)

**Failing is safe.** Wrong items get a funny reaction and go back where they were. A wobbly test
flight just wobbles. In the race, a crash shows a tip and an instant **Try again**; nothing is lost.
A kite with no upgrades can try the race but will find it hard (2 bumps, slow climb, more drift).

**Rewards** are kite parts, tail ribbons and Word Notebook entries. There are no timers on reading,
no streaks, random prizes, rankings, ads or chat. The race lasts at most 60 seconds, but word
gates wait while the child reads.

**Notebooks.** The Quest Notebook keeps every clue, in story order, with Makinig on each line.
The Word Notebook keeps *matibay*, *pantay* and *sobra*, with meanings and examples.

## Run it

Needs Node.js 18 or newer.

```bash
cd basa-quest
npm install
npm run dev            # http://localhost:5173
npm run build          # production build into dist/
npm run preview        # serve the production build at http://localhost:4173
npm run build:preview  # one self-contained HTML file: preview/basa-quest.html
npm run audio:list     # every audio file the game looks for, with its text
```

**Controls:** on-screen joystick (bottom left) and action button (bottom right), or arrow keys /
WASD to move and Space / Enter to act. In the race, steer with the joystick, arrow keys, or by
touching and dragging on the sky.

## Demo script (about 6 minutes)

1. Demo button (round, top right) → **Skip login → game (Learner 01)**.
2. Read Tala’s intro, then walk to the store with the blue roof and talk to Aling Nena.
3. Pick up a wrong item on purpose (the soy sauce), bring it to Lolo Ben and hear his reaction.
4. Collect the right items, build the kite on the workbench, and watch the test flight.
5. Demo button → **Start at the Kite Day race (sample upgrades)**, fly through a word gate.
6. Demo button → **Teacher View**, open Learner 01.

| Presenter control | What it does |
| --- | --- |
| Student View / Teacher View | Switch between `/` and `/teacher` |
| Skip login → game (Learner 01) | Logs in Learner 01 and opens the barangay |
| Show sample learner (Learner 07) | Quests 1–2 done, Quest 3 started, one race tried |
| Start at the Kite Day race (sample upgrades) | Race with Strong Frame, Better Balance, Long String |
| Reset game (current learner) | Starts the game over for whoever is logged in |
| Reset demo data | Clears all progress on this device (asks to confirm on the page) |

## Tech

- React + TypeScript + Vite, static site. React shows all text (speech, notes, notebooks, panels),
  so switching Filipino/English never restarts the game.
- **Phaser 3.90.0** (pinned exactly, bundled locally) draws the world and the race. It is
  **lazy-loaded** only after a student logs in (about 350 KB gzipped); login and the teacher
  dashboard stay small.
- All art is drawn with code at startup (`src/adventure/art.ts`). No image, sprite, font or audio files.
- Music and sound effects are made with the Web Audio API (`src/lib/music.ts`, `src/lib/sfx.ts`).
  The mute button silences both. Animations respect “reduce motion”.
- Progress is saved in `localStorage`, with an in-memory fallback if storage is blocked.

```
src/
  adventure/
    GameHost.tsx      game screen: HUD, controls, dialogue, notebooks, race overlay (lazy-loaded)
    WorldScene.ts     the barangay: map, collisions, Tala, neighbours, items, sparkles, plaza restore
    RaceScene.ts      Kite Day race: birds, gusts, word gates, upgrades
    director.ts       quest logic: who says what, wrong tries, hints, rewards
    art.ts            all textures, drawn with code
    bus.ts            events + joystick input shared by Phaser and React
    Controls.tsx      joystick + action button
    Notebooks.tsx     Quest Notebook, Word Notebook, bag
    panels/           kite workbench, proof, "sobra" task, Nonoy's choice, explain aloud
  content/
    adventure.ts      ALL story text, both languages, both bands (reviewed: false)
    ui.ts             buttons and messages (reviewed: false)
  screens/            Login, Teacher
  lib/                store, storage fallback, sound, music, audio paths, class data
```

## Deploy to Vercel

1. Push to GitHub. In Vercel: **Add New → Project**, import the repo.
2. If the app is inside a bigger repo, set **Root Directory** to `basa-quest`.
3. Framework **Vite**, build `npm run build`, output `dist`. No environment variables.

Or: `cd basa-quest && npx vercel --prod`. `vercel.json` sends `/teacher` to `index.html`.

To move the app into its own repo (keeps history):

```bash
git subtree split --prefix=basa-quest -b basa-quest-only
git push git@github.com:<your-account>/basa-quest.git basa-quest-only:main
```

## Edit the content

All story text is in **`src/content/adventure.ts`**. Each line looks like:

```ts
ln('q1-note-3', 'lolo', undefined, {
  A: { fil: '2. Ang papel na kulay pula.', en: '2. The paper that is red.' },
  B: { fil: '2. Ang papel na kasingpula ng sili.', en: '2. The paper that is as red as a chili.' },
}),
```

- The first value is the line id (also its audio file name). Don't reuse ids.
- `{ A, B }` = different wording per reading band. Use a plain `{ fil, en }` when both bands share it.
- Keep lines to 1–3 short sentences. Wrap a word in `[[ ]]` to highlight it.
- Items on the map and what the list needs: `items` and `q1Needs`. Item positions: `ITEM_SPOTS`
  in `src/adventure/WorldScene.ts`.
- Word gate words and their decoys: `words`.
- Race course (birds, gusts, gates) and difficulty: top of `src/adventure/RaceScene.ts`.

## Add audio

Put MP3 files in `public/audio/`. No code changes are needed. Until a file exists, **Makinig /
Listen** shows “Audio coming soon”. The app never uses text-to-speech.

```
public/audio/{fil|en}/level-1/band-{a|b}/{line-id}.mp3   # text that differs by band
public/audio/{fil|en}/level-1/{line-id}.mp3              # text shared by both bands
```

```bash
npm run audio:list > audio-list.tsv   # 218 files, with the exact text to read
```

## Teacher dashboard (`/teacher`)

| Game activity | Dashboard skill |
| --- | --- |
| Quest 1 (collect the right items) | Following details |
| Quest 2 (build from the steps) | Following directions |
| Quest 3 (find the string, pick the proving clue) | Understanding & proof |
| Word gates in the race, and the “sobra” task | Vocabulary |
| Nonoy’s Choice | Explaining why |

For a learner who played on this device, the detail view shows each quest’s status, retries and
hints used, the choice for Nonoy, whether the explanation was recorded or told to a partner (or
skipped), race tries / crashes / best height, and word gates right. **Audio is never stored or shown.**

## Privacy and child safety (as built)

- Fictional learners only (“Learner 01”–“Learner 30”, IDs `DEMO-0001`…). No real names, LRNs,
  birthdays, photos or contact details.
- Login: class code + 2-picture password. No typed passwords or LRNs.
- Voice recordings stay in browser memory for the current visit only; never uploaded or saved.
  If the microphone is blocked, “Tell a partner” lets the child continue.
- No chat, leaderboards, outside links, sharing, analytics, cookies, ads, remote fonts or assets.
- Child screens never compare children and never show band or “low/slow/struggling” labels.
- Teacher screens show “Demo prototype: sample data only”.

## Content review checklist (`reviewed: false`)

A Grade 3 teacher and a Filipino language reviewer must check all of this before use with
children. Set `reviewed: true` when approved.

- [ ] **`src/content/adventure.ts`**, Filipino and English, Band A and Band B:
  - [ ] Intro (does “blue roof” work as the only way to find the store?)
  - [ ] Quest 1 note: are “long”, “red”, “small jar” enough to tell items apart? Band B uses
        “longer than your arm” and “as red as a chili”: fair for Grade 3?
  - [ ] Lolo Ben’s funny reactions to wrong items (kind, not mocking?)
  - [ ] Quest 2 build steps and hints
  - [ ] Quest 3 clues: does the reasoning (Nonoy saw the cat with string → Aling Nena says the cat
        naps under the boat) make sense? Is Aling Nena’s clue clearly “the proof”?
  - [ ] The “sobra” task (15 − 10 = 5 arm-lengths): right level of maths for Grade 3?
  - [ ] Nonoy’s Choice: both paths, both “Bakit?” prompts and sentence starters
  - [ ] Race lines, word gate meanings and decoy words (*malambot*, *tagilid*, *kulang*)
- [ ] **`src/content/ui.ts`**: buttons, instructions, microphone and partner messages
- [ ] Natural Filipino and forms of address (“Ate Tala”, “apo”, “Aling Nena”, “Kuya Jun”)
- [ ] Teacher text: `skillTips` and `skillSource` in `src/data/demoClass.ts`

## Known limits

- One game area (Level 1). Other neighbours and levels are locked (“coming soon”).
- The teacher dashboard is in English only.
- Data lives on one device.
- Test hooks: adding `?e2e=1` to the URL exposes small helpers (`window.__bqWorld`,
  `window.__bqRace`) used by automated tests. They do nothing otherwise.
