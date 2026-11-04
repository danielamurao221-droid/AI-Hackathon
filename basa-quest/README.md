# Basa Quest (demo prototype)

A phone-first story game in Filipino and English for Grade 3 readers. **Reading is how you win:**
every step needs the child to read (or listen to) a short clue and then *do* something with it.

The idea: **help a neighbour, then rebuild the barangay.** In Level 1, the child helps Tala get
ready for Kite Day. Finishing the level restores the faded plaza on the barangay map.

> **This is a clickable prototype for a Design Thinking project, not a production system.**
> It uses fictional sample data only. There is no backend, no accounts, no analytics and no
> outside network requests. All story and question text is **draft, `reviewed: false`** (see below).

**How Might We** make sure every struggling Grade 3 reader gets regular practice matched to their
level, even when teachers are stretched and help at home is limited?

## How the game works

| Loop | What happens |
| --- | --- |
| About 30 seconds | Read or hear a short clue → do something (tap a place, place a part, tap a sentence) → see the result straight away |
| About 10 minutes | Solve one neighbour's problem (7 scenes) → restore a place in the barangay |
| Long term | Restore places, meet new neighbours, collect words in the Word Notebook |

**Level 1: Ang Pulang Papel / The Red Paper**

| # | Scene | Game type | Reading is needed because… |
| --- | --- | --- | --- |
| 1 | Kite Day | Do what the text says (cards) | The day is only in Tala's words |
| 2 | Find the supplies | Do what the text says (map) | The map has no labels; the clue says *blue roof* and *mango tree* |
| 3 | Build the kite | Do what the text says (build) | Lolo Ben's note says which stick, where, and how many folds |
| 4 | Find the proof | Find the proof | The child taps the diary sentence that answers Nonoy |
| 5 | New word: *sobra* | Use a new word | The task only makes sense if you know *sobra* means "more than you need" |
| 6 | What should Tala do? | Decide + explain aloud | Both choices are allowed and lead to different dialogue; then "Bakit?" |
| 7 | Kite Day! | Payoff | Kites fly, the plaza is restored, the word goes in the notebook |

**Rewards.** A kite ribbon for solving scenes 2–5 (never for pressing Continue), a Word Notebook
entry, and one barangay piece (the plaza) for finishing the level. There are no timers, lives,
streaks, random prizes, scores or rankings. A wrong answer gives a clue-based hint and another try.
"Next" only appears after a scene is solved. Explaining aloud earns no reward: it is a conversation.

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

## Demo script (about 5 minutes)

1. Open the round **Demo** button (bottom right) → **Skip login → map (Learner 01)**.
   (Or log in normally: class code **DEMO123**, pick a learner, tap the two pictures in the hint.)
2. On the barangay map, the plaza is faded. Tap it, or tap **Simulan / Start**.
3. Play the 7 scenes. Try a wrong answer to see the hint. Switch **Filipino / English** at any time.
4. In scene 6, choose what Tala does, then explain aloud (or **Tell a partner**).
5. Watch the kites fly, tap **Back to the barangay**, and see the plaza come back to colour.
6. Demo button → **Teacher View** → Learner 01 shows "Level 1 done". Tap the row to see hints
   used per skill, proof tries, the choice for Nonoy, and how the child explained.

### Presenter controls (the round Demo button)

| Control | What it does |
| --- | --- |
| Student View / Teacher View | Switch between `/` and `/teacher` |
| Skip login → map (Learner 01) | Logs in Learner 01 and opens the barangay map |
| Show sample learner (Learner 07) | A learner halfway through Level 1 (2 ribbons, some hints used) |
| Reset Level 1 (current learner) | Clears Level 1 for whoever is logged in; the plaza fades again |
| Reset demo data | Clears all progress on this device (asks to confirm on the page) |

## Deploy to Vercel

This is a static Vite site. `vercel.json` sends every route (like `/teacher`) to `index.html`.

1. Push this folder to GitHub.
2. In Vercel: **Add New → Project**, import the repo.
3. If the app is inside a bigger repo, set **Root Directory** to `basa-quest`.
4. Framework preset **Vite**, build command `npm run build`, output directory `dist`. Deploy.

Or with the CLI: `cd basa-quest && npx vercel --prod`. No environment variables are needed.

**Moving the app into its own GitHub repo** (keeps history):

```bash
# from the root of the current repo
git subtree split --prefix=basa-quest -b basa-quest-only
git push git@github.com:<your-account>/basa-quest.git basa-quest-only:main
```

---

## Edit the content

| File | What is in it |
| --- | --- |
| `src/content/level1.ts` | All Level 1 scenes: clues, dialogue, answers, hints, praise |
| `src/content/ui.ts` | Buttons, instructions and messages |
| `src/content/barangay.ts` | Places on the map, who lives there, greetings, locked places |
| `src/config.ts` | App name (`APP_NAME`), class code, sample learner, session length |
| `src/data/demoClass.ts` | The 30 fictional learners, skill names, teacher tips |

Tips for `level1.ts`:

- Each scene has a `kind` that picks the game type (types are described in `src/types.ts`).
- Text written as `{ A: {...}, B: {...} }` differs by reading band. **Band A** = shorter sentences
  and easier words; **Band B** = a little longer and richer. Keep the story and answers the same.
- Keep each clue to 1–3 short sentences.
- Every line has an `id`. It is also its audio file name, so don't reuse ids.
- `answer` is the id of the correct target, sentence or option. `hints` has one entry per
  wrong choice plus `default`.
- Wrap a word in `[[double brackets]]` to highlight it (used for the new word).

### Reusable game types

Each type is one component in `src/game/` that reads its data from the content file.

| `kind` | Component | Used in Level 1 |
| --- | --- | --- |
| `pick` | Do what the text says: tap the right place (map) or card | Scenes 1–2 |
| `build` | Do what the text says: follow written steps (tap or drag parts) | Scene 3 |
| `proof` | Find the proof: tap the sentence that answers the question | Scene 4 |
| `word` | Use a new word: meet it in the story, then use its meaning | Scene 5 |
| `decide` | Decide with consequences: each option has its own dialogue, then explain | Scene 6 |
| `explain` | Explain aloud on its own (record or tell a partner) | inside scene 6 |
| `order` | Put events in order | ready for later levels |
| `payoff` | End of level: kites, restored place, praise from what the child did | Scene 7 |

To add Level 2 later: write `src/content/level2.ts`, add it to `levels` in
`src/content/index.ts`, give a place on the map `level: 2`, and raise `PLAYABLE_LEVELS`.

## Add audio

Put MP3 files in `public/audio/`. No code changes are needed. Until a file exists, the
**Makinig / Listen** button shows "Audio coming soon". The app never uses text-to-speech.

```
public/audio/{fil|en}/level-1/band-{a|b}/{line-id}.mp3   # text that differs by band
public/audio/{fil|en}/level-1/{line-id}.mp3              # text shared by both bands
```

Hints and "correct!" messages use `{scene}-hint-{key}` and `{scene}-ok` (for example
`supplies-hint-bakery`, `build-hint-step2`, `proof-ok`). The second clue in the supplies scene
uses `supplies-r2-…`.

**Get the full recording list** with the exact text for each file:

```bash
npm run audio:list > audio-list.tsv   # 154 files for Level 1; opens in Excel or Google Sheets
```

Record slowly and warmly. Mono 64 kbps MP3 keeps files small for mobile data.

## Teacher dashboard (`/teacher`)

Each Level 1 scene gives evidence for one skill:

| Scene | Skill on the dashboard |
| --- | --- |
| Find the supplies, Build the kite | Word reading & directions |
| Find the proof | Understanding details |
| New word | Vocabulary |
| Decide and explain | Explaining why |

For a learner who played on the device, the detail view shows hints used per skill, whether the
proof sentence was found on the first try, the choice made for Nonoy, and whether the explanation
was recorded, told to a partner, or skipped. **Audio is never stored or shown.** Skill percentages
mix the fake class data with real first-try results from the app.

## Privacy and child safety (as built)

- Fictional learners only ("Learner 01"–"Learner 30", IDs `DEMO-0001`…). No real names, LRNs,
  birthdays, photos or contact details are asked for or stored.
- Login uses a class code plus a 2-picture password. No typed passwords or LRNs.
- Voice recordings stay in browser memory for the current page visit. They are never uploaded or
  saved, and are cleared on log out, reset, or closing the tab.
- No chat, leaderboards, outside links, sharing, analytics, cookies, ads, remote fonts or images.
- Child screens never compare children and never show band or "low/slow/struggling" labels.
- Teacher screens show "Demo prototype: sample data only".
- Progress is saved in `localStorage`. If storage is blocked, the app keeps working in memory for
  the visit and shows a small note.
- Sound effects are generated in the browser (Web Audio API) and can be muted. Animations respect
  "reduce motion".

## Content review checklist (`reviewed: false`)

Everything below is a draft written for this prototype. A Grade 3 teacher and a Filipino language
reviewer must check it before use with children. Set `reviewed: true` in each file when approved.

Story: *Ang Pulang Papel / The Red Paper* (original). Tala saves her baon for red paper, builds
a kite with Lolo Ben's help, has one sheet left over, and decides what to do when her younger
neighbour Nonoy has no kite.

- [ ] **`src/content/level1.ts`: all 7 scenes**, Band A and Band B, Filipino and English
  - [ ] Scene 1 clues and the day cards
  - [ ] Scene 2 clues (blue-roof store, mango tree) and every hint
  - [ ] Scene 3 Lolo Ben's 4 steps (are they clear enough to follow with no pictures?) and hints
  - [ ] Scene 4 diary sentences (Band B has an extra distractor about candy) and hints
  - [ ] Scene 5 teaching sentence for *sobra / extra*, the counting task and hints
  - [ ] Scene 6 situation, both choices, both dialogue paths, both "Bakit?" prompts and sentence starters
  - [ ] Scene 7 endings for each choice, and the praise lines
- [ ] **`src/content/ui.ts`**: buttons, instructions, microphone and "Tell a partner" messages
- [ ] **`src/content/barangay.ts`**: place names and greetings
- [ ] Natural Filipino: aspect, word choice, and forms of address ("Ate Tala", "apo")
- [ ] Is *sobra* the right target word, and is "extra" the right English pair?
- [ ] Is the counting task in scene 5 fair for Grade 3?
- [ ] Do Band A clues stay short enough (1–2 sentences) for the readers who need them?
- [ ] Teacher-facing text: `skillTips` in `src/data/demoClass.ts` and `src/screens/Teacher.tsx`

## Project structure

```
basa-quest/
  index.html, vite.config.ts, vercel.json, tsconfig.json
  public/audio/                 recorded narration goes here (see README.txt)
  scripts/                      build-preview.mjs, list-audio.mjs
  src/
    config.ts                   app name and settings
    types.ts                    content model (scene types)
    content/                    level1.ts, ui.ts, barangay.ts, index.ts, audioManifest.ts
    data/demoClass.ts           30 fictional learners
    game/                       LevelPlayer + one component per game type
    screens/                    Login, BarangayMap, Teacher
    components/                 characters, kite, icons, language switch, Listen button, presenter
    lib/                        store, storage fallback, sound effects, audio paths, class data
```

## Known limits of the prototype

- Only Level 1 has content. Other places and levels are locked and marked "coming soon".
- The teacher dashboard is in English only.
- Data lives on one device. A teacher on another phone will not see a learner's progress.
- Speech is not analysed. The explain-aloud step is never graded.
