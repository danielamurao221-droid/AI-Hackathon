# Basa Quest (demo prototype)

A phone-first story game in Filipino and English for Grade 3 readers. Children read or listen
to a story, answer "why" and "how" questions, and explain one answer out loud. Teachers see who
needs help on a simple dashboard.

> **This is a clickable prototype for a Design Thinking project, not a production system.**
> It uses fictional sample data only. There is no backend, no accounts, no analytics and
> no outside network requests. Story content is **draft and not yet reviewed** (see below).

**How Might We** make sure every struggling Grade 3 reader gets regular practice matched to
their level, even when teachers are stretched and help at home is limited?

---

## Run it

Needs Node.js 18 or newer.

```bash
cd basa-quest
npm install
npm run dev        # http://localhost:5173
npm run build      # production build into dist/
npm run preview    # serve the production build at http://localhost:4173
```

### One-file preview

```bash
npm run build:preview   # writes preview/basa-quest.html (CSS + JS inlined, ~300 KB)
```

This single HTML file runs without a server (for example from a USB stick or as a private
claude.ai Artifact). It uses `#teacher` for the teacher view. Recorded audio is not included.

## Demo script (about 5 minutes)

1. Open the app. Type class code **DEMO123**.
2. Pick **Learner 01**. Tap the two pictures shown in the "Demo" hint (any order).
3. On the map, tap **1**. Read the pages (try the **Filipino / English** switch and **Listen**).
4. Answer questions 1–4. Try a wrong answer to see the gentle hint.
5. Question 5: tap the microphone and speak, or tap **Tell a partner**.
6. See the 3 stars, then **Next level**.
7. Open the round **Demo** button (bottom right), choose **Teacher View**. Learner 01's
   row now shows "Played on this device", the new level and "Just now".

Presenter controls (the round button, bottom right):

| Control | What it does |
| --- | --- |
| Student View / Teacher View | Switch between `/` and `/teacher` |
| Show sample learner (Learner 07) | Logs in a learner with levels 1–2 done, ready for level 3 |
| Reset demo data | Clears all progress on this device back to the sample data |

Teacher dashboard direct link: `/teacher`.

## Deploy to Vercel

This app is a static Vite site. `vercel.json` sends every route (like `/teacher`) to
`index.html`.

**Option A: Vercel dashboard**
1. Push this folder to GitHub.
2. In Vercel, choose **Add New → Project** and import the repo.
3. If the app is inside a bigger repo, set **Root Directory** to `basa-quest`.
4. Framework preset: **Vite**. Build command `npm run build`, output directory `dist`.
5. Deploy.

**Option B: Vercel CLI**
```bash
cd basa-quest
npx vercel        # preview deploy
npx vercel --prod # production deploy
```

No environment variables are needed.

### Moving the app into its own GitHub repo

The app is self-contained in `basa-quest/`. To give it its own repo with history:

```bash
# from the root of the current repo
git subtree split --prefix=basa-quest -b basa-quest-only
# create an empty repo on GitHub (e.g. basa-quest), then:
git push git@github.com:<your-account>/basa-quest.git basa-quest-only:main
```

Or copy the folder into a new repo (leave out `node_modules` and `dist`).

---

## Edit the content

All child-facing text is in **one file: `src/content/story.ts`**.

- `chapters`: one per level. Each has `title`, `pages.A` (Band A), `pages.B` (Band B),
  4 tap `questions` and 1 `explain` prompt.
- Each text has `fil` and `en`. Keep the **same number of pages** in both languages.
- In a question, `answer` is the position of the correct choice: `0`, `1` or `2`.
- `hint` appears after a wrong tap. `explain` appears after the correct tap.
- `skill` links a question to a teacher-dashboard skill: `vocabulary`, `details` or `explaining`.
- `ui`: buttons, instructions and messages.

Other settings:

| File | What to change |
| --- | --- |
| `src/config.ts` | App name (`APP_NAME`), class code, playable levels, sample learner, session length |
| `src/data/demoClass.ts` | The fictional class, skill names and teacher tips |
| `src/lib/classData.ts` | How "Needs help this week" is ranked |

Word counts (target: Band A 60–100, Band B 100–160 per chapter):

| Level | Band A fil / en | Band B fil / en |
| --- | --- | --- |
| 1 | 93 / 87 | 159 / 156 |
| 2 | 90 / 89 | 149 / 151 |
| 3 | 94 / 90 | 160 / 159 |

## Add audio

Put MP3 files in `public/audio/` with this naming pattern. No code changes are needed.
Until a file exists, the Listen button shows "Audio coming soon". The app does not use
browser text-to-speech.

```
public/audio/{fil|en}/level-{n}/band-{a|b}/page-{p}.mp3   # story pages
public/audio/{fil|en}/level-{n}/question-{q}.mp3          # questions 1–5 (both bands)
```

Examples: `public/audio/fil/level-1/band-a/page-1.mp3`, `public/audio/en/level-3/question-5.mp3`.
Band A has 3 pages per level and Band B has 4. Record a clear, slow, warm voice. Mono 64 kbps MP3
keeps files small on mobile data. The pattern is set in `src/lib/audio.ts` and `src/config.ts`.

---

## Privacy and child safety (as built)

- Fictional learners only ("Learner 01"–"Learner 30", IDs `DEMO-0001`…). No real names, LRNs,
  birthdays, photos or contact details are asked for or stored.
- Login uses a class code plus a 2-picture password. No typed passwords or LRNs.
- Voice recordings stay in browser memory for the current page visit only. They are never
  uploaded or saved, and are cleared on log out, reset or closing the tab.
- No chat, leaderboards, outside links, sharing, analytics, cookies, ads or remote fonts.
- Child screens never compare children and never show band or "low/slow/struggling" labels.
- Teacher screens show "Demo prototype: sample data only".
- Progress is saved in `localStorage`. If storage is blocked, the app keeps working in memory
  for the current visit and shows a small note.

## Content review checklist (reviewed: false)

**Everything in `src/content/story.ts` is a draft written for this prototype.** Before using
it with children, a Grade 3 teacher and a Filipino language reviewer must check the text below.
When it is approved, set `CONTENT_META.reviewed` to `true`.

Story: *Ang Saranggola ni Tala / Tala's Kite* (original). Tala saves her snack money for kite
paper, chooses to use her spare sheet to fix her younger neighbor Nonoy's torn kite, and on
Kite Day Nonoy returns the favour.

Please review:

- [ ] **Level 1 "Ang Pulang Papel / The Red Paper"**: Band A (3 pages) and Band B (4 pages), fil + en
- [ ] **Level 2 "Ang Punit na Saranggola / The Torn Kite"**: Band A (3 pages) and Band B (4 pages), fil + en
- [ ] **Level 3 "Araw ng Saranggola / Kite Day"**: Band A (3 pages) and Band B (4 pages), fil + en
- [ ] **12 tap questions** (4 per level): prompts, 3 choices each, correct answer, hints, explanations
- [ ] **3 explain-aloud prompts** and their sentence starters
- [ ] **Word-meaning questions**: the Filipino and English versions test different words
      ("sobra"/"extra", "napunit"/"tear", "magkatabi"/"side by side"). Check that each is right for Grade 3.
- [ ] **Level 2 Q3 (prediction)** has one "best" answer. Decide if prediction questions should
      accept more than one sensible answer.
- [ ] **Interface text** in `ui` (buttons, hints, encouragement, microphone and "Tell a partner" messages)
- [ ] **Picture-password names** (`pictureNames`)
- [ ] Natural Filipino: aspect, word choice, and the sound word "Rrrip!" in Filipino
- [ ] Fit with DepEd Grade 3 reading level and local context (barangay Kite Day, baon, Lolo)
- [ ] Teacher-facing text in `src/data/demoClass.ts` (`skillTips`) and `src/screens/Teacher.tsx`

## Project structure

```
basa-quest/
  index.html, vite.config.ts, vercel.json, tsconfig.json
  public/audio/                 recorded narration goes here (see README.txt)
  src/
    config.ts                   app name and settings
    types.ts
    content/story.ts            ALL story, question and UI text (fil + en)
    data/demoClass.ts           30 fictional learners
    lib/
      store.ts                  demo state + actions (saved to localStorage)
      storage.ts                safe localStorage wrapper with memory fallback
      classData.ts              teacher dashboard calculations
      audio.ts                  audio file paths
      recordings.ts             in-memory voice recordings
      router.ts, i18n.ts
    components/                 icons, scene art, language switch, presenter controls
    screens/                    Login, LevelMap, Level, StoryReader, Questions,
                                ExplainAloud, LevelComplete, Teacher
```

## Known limits of the prototype

- Only levels 1–3 have content. Levels 4–100 are locked placeholders.
- The teacher dashboard is in English only.
- Word-reading scores are fixed demo numbers (a real version would use a teacher read-aloud check).
- Data lives on one device. A teacher on another phone will not see a learner's progress.
