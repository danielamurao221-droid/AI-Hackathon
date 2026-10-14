# Pacer — project history and handoff notes

Pacer is a student planner web app: students track tasks by subject, see what's due or overdue, get in-app deadline reminders, and work from a priority list that is ranked automatically or ordered by hand.

It was built in a Claude Code desktop session as a single-page claude.ai artifact, then exported to this folder so it can be connected to Supabase (artifacts block network calls to other hosts, so Supabase can't work there).

- Original artifact (private, the owner's claude.ai account): https://claude.ai/artifact/3H5VyzjCuXydHnjbCwAbjy (version 7 was the last one)
- This folder is now the source of truth. The artifact is not kept in sync.

## Files

| File | What it holds |
|---|---|
| `index.html` | All markup: sign-in screen, sidebar, five views, reminders panel, edit dialog, pop-up container, toast |
| `styles.css` | All styles. Starts with a small base reset (the artifact host used to inject it), then design tokens on `:root` with two dark-mode blocks |
| `app.js` | All logic in one IIFE. Plain vanilla JS, no build step, no dependencies |

Run locally: `python -m http.server 5173 --directory pacer` (also defined as `pacer` in the parent folder's `.claude/launch.json`), then open http://localhost:5173.

## How it evolved (in order)

1. **First build:** a "Student Workload" dashboard with three sidebar sections:
   - **Dashboard:** remaining / due today / overdue counts, plus this week's tasks by subject.
   - **Tasks:** an add form (name, subject, due date, importance low/medium/high) and mark-as-done.
   - **Priorities:** active tasks ranked by urgency and importance, each with a reason like "Due in 2 days, high importance".
2. **Subjects section:** two editable lists, *Subjects* (classes) and *Categories* (kinds of work, e.g. Assignment, Reading, Exam prep, Project).
   - Tasks have a required subject and an optional category.
   - **Rename** updates every task that uses the name. **Delete** asks what to do with tasks that use it: move them, clear the category, or delete them. Each item has one of 8 colors.
   - The dashboard breakdown can group by subject or category.
3. **Reminders (in-app only):**
   - A sticky alert bar on every view: red overdue, amber due today, blue due soon, green when all clear.
   - A bell with a count that opens a Reminders panel: grouped list, mark done, snooze until tomorrow.
   - Pop-up cards when the app opens, once per task per day.
   - The window is 1/2/3/5/7/14 days, default 3. Reminders re-check when the date changes.
   - Browser/OS notifications were not possible in the artifact sandbox.
4. **Mock sign-in and Account & settings:**
   - **Sign-in screen:** sign in, create account, forgot password and a demo account.
   - **Account & settings:** profile (display name, email, school), change password, theme (System / Light / Dark), the reminder window, and sign out.
   - The auth layer copies the supabase-js v2 `supabase.auth` API so it can be swapped later. See **Auth** below.
5. **Renamed to Pacer:**
   - New logo: a rounded teal square with a "P" (inline SVG in `.brand`).
   - The Account sidebar tab was removed as redundant. The user chip at the bottom of the sidebar opens settings instead; on phones it is the avatar at the end of the bottom bar.
   - Tasks became editable everywhere via a pencil button (Dashboard "Up next", Tasks, Priorities), which opens an edit dialog with a delete-with-confirm.
   - Manual reordering added: drag the handle on Tasks and Priorities rows.
6. **Priorities simplified:** the "Ranked / My order" tabs were removed at the user's request. It is one list; dragging switches to a custom order, and a **Reset to automatic ranking** button appears only while a custom order is active.
7. **Visual redesign with the `ui-ux-pro-max` skill** (installed at `~/.claude/skills/ui-ux-pro-max`):
   - Recommended look: Flat style, teal primary, orange for the main call to action, Plus Jakarta Sans.
   - Applied: borders instead of shadows, 16px base text, 150–200ms hover transitions, and a short slide-in when switching views (skipped under reduced motion).
   - The orange is used only for **Add task** and the top bar's **New task** button.
   - Accessibility fixes it flagged:
     - a single-pointer alternative to dragging (WCAG 2.5.7): clicking a handle opens Up / Down / To top / To bottom / Done buttons;
     - 24px minimum targets;
     - faint text darkened to 4.5:1 contrast.
8. **Exported to this folder** for VS Code + Supabase. It was tested here at 1280px in dark mode:
   - no console errors;
   - demo sign-in, dashboard, alerts and pop-ups work;
   - in Priorities, the move buttons and **To top** work.

## Owner preferences learned so far

- The app name is **Pacer**. Keep the P-in-rounded-square logo.
- Don't add duplicate navigation. Account lives in the sidebar user chip, not as a nav tab.
- Prefer one list with an override plus a reset button over mode tabs.
- Every task should be editable wherever it appears.
- Manual reordering must stay simple: drag the handle, with buttons as the fallback.
- Reminders must be visible without opening anything.

## Architecture (app.js)

**Rendering.** A full `render()` rebuilds each section's `innerHTML` from state. There is no framework.
- `render()` defers while a drag is in progress, and the Subjects lists defer while a rename input has focus.
- Forms live in static HTML so typing survives re-renders.
- One delegated `click` listener on `document` dispatches on `data-*` attributes: `data-toggle`, `data-edit`, `data-del`, `data-grip`, `data-move`, `data-order-mode`, `data-open-rem`, and others.

**Navigation.** The views are `dashboard`, `tasks`, `priorities`, `subjects` and `settings`.
- Selected through `go(view)`, which deep-links with `#view`.
- On screens up to 760px the sidebar becomes a bottom tab bar.

**State**
- `tasks`: an array of task objects, below.
- `lists`: one settings document, below.
- `mode`: `'loading' | 'db-wait' | 'db' | 'local'`.
- `session`: from the auth layer.
- UI-only state: `filter`, `groupBy`, `picking`, `confirming`, `mover`, `drag`, `editing`, `panelOpen`, `popIds`.

**Task object**
```js
{ id, name, subject, category, due: 'YYYY-MM-DD', importance: 'low'|'medium'|'high',
  done: bool, doneAt: ms|null, createdAt: ms, snoozedUntil: 'YYYY-MM-DD'|'', example?: true }
```
Tasks reference subjects and categories **by name**, not id. Renames rewrite every matching task (`renameItem`).

**Settings document (`lists`)**
```js
{ subjects:   [{ id, name, color: 1..8 }],
  categories: [{ id, name, color: 1..8 }],
  remindDays: 3,
  prioMode: 'auto'|'custom', prioOrder: [taskId…],
  taskMode: 'auto'|'custom', taskOrder: [taskId…] }
```
- `listOf(kind)` merges the stored list with any name still used by a task.
- With no stored categories, it uses the defaults Assignment, Reading, Exam prep, Project.
- `materialize()` returns a full copy of the document. Always build edits from it so no field is dropped.

**Ranking.** `rank()` computes score = urgency + importance, then assigns a tier.
- **Urgency:** overdue 60 + 2 per day (capped at 10 days); today 50; tomorrow 40; ≤3 days 30; ≤7 days 18; ≤14 days 8; later 2.
- **Importance:** high 30, medium 15, low 5.
- **Tiers:** ≥70 "Do now", ≥50 "Next up", ≥30 "This week", else "Later".
- **Ties:** sooner due date first, then name.

**Manual order**
- `arrange(items, order, cmp, idOf)` keeps saved ids in place and slots unsaved items in where the automatic sort would put them.
- `commitOrder(kind, ids)` saves an order and switches that list to custom mode.
- `moveTask()` is shared by the drag handles, arrow keys and move buttons.
- Dragging uses pointer events and only starts after 5px of movement; a smaller movement counts as a click and opens the move buttons.

**Storage today.** `boot()` tries the claude.ai artifact runtime (`window.claude.use('db')`). That object doesn't exist outside claude.ai, so locally it always falls back to `localStorage`:

| Key | Contents |
|---|---|
| `workload.tasks.v1` | tasks array |
| `workload.lists.v1` | settings document |
| `workload.seen.v1` | reminder pop-ups dismissed today (`{date, ids}`) |
| `workload.theme.v1` | `'system' \| 'light' \| 'dark'` |
| `workload.session.v1` | mock session |
| `workload.mockusers.v1` | mock accounts (profiles only, never passwords) |

The keys keep the old "workload" prefix on purpose so earlier data still loads. In the artifact, tasks lived in a per-user collection with the settings as a special document `lists~meta`. Snapshot code filters that id out of the tasks. All of this goes away with Supabase.

**Auth.** `const auth = (() => {...})()` near the bottom of `app.js` is a mock that matches supabase-js v2:
- the methods are `getSession`, `signInWithPassword`, `signUp({email, password, options:{data}})`, `resetPasswordForEmail`, `updateUser({email, password, data})`, `signOut` and `onAuthStateChange`;
- each returns `{ data, error }`.

The UI reads only `session.user.{id, email, created_at, user_metadata.full_name, user_metadata.school}`. Swapping in `supabase.createClient(URL, PUBLISHABLE_KEY).auth` should need no UI changes. `enterApp()` runs `boot()` once after the first sign-in.

**Theme.** CSS tokens on `:root` (light) are redefined under `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` and again under `:root[data-theme="dark"]`. The settings radios set or remove `data-theme` on `<html>`. Style components through the tokens, never with literal colors.

## Design system (keep consistent)

- **Font:** Plus Jakarta Sans for everything. JetBrains Mono for dates and counts (tabular figures).
- **Light:** bg `#f2f7f6`, surface `#fff`, text `#123f3c`, muted `#475569`, faint `#5f6f7e`, line `#d3e3e0`, sidebar `#0b3b38`, accent `#0f766e` (white text), call to action `#ea580c` (dark text).
- **Dark:** bg `#0a1413`, surface `#10201e`, accent `#2dd4bf` (dark text), call to action `#fb923c`.
- **Semantic colors:** `--crit` overdue, `--warn` due today, `--ok`. Each has a `-soft` background. These are separate from the accent.
- **Subject colors:** `--c1`…`--c8`.
- **Flat style:** cards use a 1px border and no shadow. Only floating layers (dialogs, panel, pop-ups, a row being dragged) use `--lift`.
- **Accessibility:**
  - 4.5:1 text contrast;
  - targets at least 24px;
  - visible focus rings;
  - `aria-label` on icon buttons;
  - Esc closes the dialog and the panel;
  - motion respects `prefers-reduced-motion`.

## Not yet verified

These were never exercised in a browser:
- drag-to-reorder with a real pointer;
- the edit dialog;
- Subjects rename and delete;
- the settings forms;
- light theme visuals;
- phone width.

Test these before or alongside the Supabase work.

## Supabase (connected 2026-10-14)

**Owner decisions:** use the team project "Thames AI Hackathon Team" (ref `rikvhwqwcoxrbzyakywy`, ap-southeast-1); no email confirmation; no migration of artifact-era tasks (start fresh); the site will be deployed (host not chosen yet). No Google sign-in for now.

**Database** (migration `supabase/migrations/20261014000000_pacer_schema.sql`, applied as `pacer_schema`):
- `profiles` (id = auth user id, full_name, school). Kept in sync from `raw_user_meta_data` by triggers on `auth.users` insert and update, so the app keeps using `updateUser({data})`.
- `tasks`: uuid id, `due date`, `importance` check, `done_at`/`created_at` timestamptz, `snoozed_until date`, `example`. Subjects and categories are still referenced **by name**.
- `subjects`, `categories`: primary key `(user_id, id)` with a text id (some ids are derived from the name), unique `lower(name)` per user, `position` for list order.
- `user_settings`: remind_days, prio_mode, prio_order uuid[], task_mode, task_order uuid[].
- RLS on every table, limited to the owner. `tasks` is in the `supabase_realtime` publication.
- Advisors after the migration: security clean; performance shows only "unused index" on `tasks_user_id_idx` (expected on a new table).

**Client** (`app.js`):
- supabase-js 2.58.0 from jsDelivr (`index.html`), with the **publishable key** and `flowType: 'pkce'`. PKCE keeps auth redirects in the query string, so `go()`'s `#view` rewrite doesn't clobber them.
- `auth = sb.auth`. `onAuthStateChange` handles everything (no separate `getSession`), deferred with `setTimeout` to avoid the supabase-js callback deadlock. `PASSWORD_RECOVERY` opens Settings for a new password.
- `boot()` loads the four tables, then subscribes to `tasks` changes. `teardown()` runs on sign-out or user switch.
- `saveMany` batches task upserts. `saveLists` is queued and writes subjects/categories (upsert + delete removed ids) and `user_settings`.
- Task and list ids come from `crypto.randomUUID()` (needs https or localhost).
- Theme and dismissed pop-ups stay in `localStorage`. The demo note and demo account were removed.

**Owner to do in the Supabase dashboard (the tools can't change auth settings):**
1. Authentication → Sign In / Providers → Email: turn **off** "Confirm email".
2. Authentication → URL Configuration: set Site URL to the deployed URL, and add it plus `http://localhost:5173` to Redirect URLs (needed for password-reset links).

## Hosting

- **GitHub:** https://github.com/danielamurao221-droid/AI-Hackathon (public, branch `main`).
- **Vercel:** project `thames4/pacer` (account `danielamurao221-3155`), production URL https://pacer-chi-taupe.vercel.app. Static site, no build step. `.vercelignore` keeps `instruction.md`, `CLAUDE.md` and `supabase/` off the site.
- Git auto-deploy is not connected yet: the Vercel account needs a GitHub login connection first, then run `vercel git connect`. Until then, deploy with `npx vercel@64.0.2 deploy --prod`.

