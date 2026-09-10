# CLAUDE.md — Nectars Bolonga (League History)

Guidance for Claude (and humans) working on this repo. Read this first.

## What this is

The **Nectars Bolonga** fantasy football league's own app: thirteen seasons of
history (2013–2025) plus the **weekly power rankings** the commissioner
publishes. It is a **pure static browser app** — HTML/CSS/vanilla JS, no build
step, no framework, no backend, no API keys — served from GitHub Pages.

Live URL: **https://mcdermottj639.github.io/League-History/**
(⚠️ Pages must be enabled by hand: Settings → Pages → Deploy from branch →
`main` / root. A bot cannot enable it. If links 404, check that first.)

> ### 🚨 THE ONE THING THAT MAKES THIS APP DIFFERENT FROM SPORTS-HUB
> Sports-Hub has **one** reader. This has **twelve**, and every decision here
> comes back to that.
>
> **"You" is a ROLE, not a name.** The reader taps their name once and the
> whole archive re-voices itself around them — their row highlighted, their
> verbs in second person, their thirteen seasons on the You tab. That happens
> through exactly one call, `LeagueHistory.setMe(code)`; nothing else in the
> app knows or cares who is reading.
>
> **And a stranger must still get a whole app.** This link goes out to a group
> chat. It will be opened by someone's brother, and it will be opened before
> anybody taps a name. **Nothing may render blank, nag, or gate content behind
> picking.** Picking makes the app personal; it is not a login. Every view is
> written to work with `ME === null`.

> ### 📦 This came OUT of Sports-Hub (Sep 2026)
> The archive and the Power Rankings Lab were both built inside
> `mcdermottj639/Sports-Hub` and moved here. **They are gone from that repo** —
> do not re-add them there, and do not leave a second copy anywhere. A
> thirteen-season archive that exists twice will diverge, and then neither copy
> can be trusted.
>
> Why it left: Sports-Hub is the owner's personal app and sits at a URL whose
> parent paths carry a betting model and a fantasy team. This is a link handed
> to eleven other people. Same reasoning as Family Survivor before it.

## Hard constraints (do not break these)

- **No backend, no API keys, no build step.** The members' app must work with
  nothing but static files. It has no ESPN cookies and never will.
- **Deploys from `main`** via GitHub Pages (root).
- **The rankings are FILES, not a live model run.** See below.
- **No model identifier** (exact model name/ID) in commits, code, PRs or any
  pushed artifact. Chat only.
- Don't create PRs unless explicitly asked.
- ⚠️ **This repo is PUBLIC.** Everything in it — real first names, the takes,
  the team names — is world-readable. That was the owner's setting, not an
  accident, but weigh it before adding anything new about a person.

## Files

- `index.html` — the members' app. Header, name picker, two-level nav.
- `league.js` — the shell: identity, router, the rankings view. ~270 lines.
  It is deliberately small; all the archive logic lives in `history.js`.
- `league.css` — the `.lg-` layer. Loaded LAST, so it wins ties.
- `history.js` — **the archive** (~1,070 lines): the curated 13-season data,
  a single-pass stats engine, and every view. Exposes ONE global,
  `window.LeagueHistory`:
  - `SUBS` — the five history sub-tabs
  - `view(key)` — `hon` · `sea` · `rec` · `cb` · `you`
  - `profile(mgr)` — the drill-down every name opens
  - `setMe(mgr)` / `me()` / `name(mgr)` / `roster()` — identity
- `styles.css` — **a full copy of Sports-Hub's stylesheet**, brought over
  whole. See "The stylesheet" below before touching it.
- `power.html` / `power.css` / `power.js` — the **commissioner's** authoring
  tool. Members never need it. It talks to the owner's Render backend.
- `rankings/` — published weeks. `index.json` lists them; one JSON file each.
- `logos/` — the league's own twelve crests, keyed by manager.
- `sw.js` — network-first service worker. Bump `CACHE` on every release.

## 🚨 The data was VERIFIED, not transcribed

All **156 team-seasons** are mapped to PEOPLE, cross-checked against ESPN's own
owner-name column on the seasons that carry it: **~144 confirmations, one
correction, zero unresolved conflicts**.

- The correction is the standing lesson: **"Christels Mattress" is Will Hurd** —
  a team named AT Christel, not by him. Same trap as **"Slemp The Man Whore"**
  and **"Buley is Greek"**, which are both **McD's**. **Never map a fantasy
  team to a person by name similarity.**
- **Two managers are deliberately untracked** (Kitchen, Ebzery — owner's call).
  Their SEASONS stay in the standings, because the standings are the standings
  and a 12-team league that renders 10 rows is lying. They carry no person, so
  they never enter a table, a rate, a tally or a podium line — a podium place
  held by one of them reads **"not tracked"**, never their team name.
- **Conservation laws** are the guard against double-counting: 150 season
  finishes · 24 Cum Bowl appearances · 11 losses · 238 bracket game-slots ·
  13 titles · 76 playoff berths · h2h games == meetings. Re-run them after ANY
  data edit; the harness that once read "Slemp: 36 Cum Bowls" out of 13 that
  exist is why they exist.

## ⚑ Three kinds of fact, and they must never be conflated

The archive holds three, and mixing them would make the whole app
untrustworthy. Every view carries a badge saying which it is.

| Badge | What it covers |
|---|---|
| **Final placing** | The rank in every table — where you finished after the playoffs |
| **Regular season** | Every W-L and points total. ESPN's standings are regular-season standings |
| **⚑ Playoffs only** | 119 bracket games from **7 of 13 seasons**, plus 13 Cum Bowls |

- ⚠️ **There is NO regular-season schedule anywhere in this data.** So nothing
  here is a career head-to-head, however much it looks like one. **If you add a
  stat, tag it** (`tag('po')` on a heading, `dot('po')` on a row).
- ⚠️ The `po` badge is **not colour-only**: measured, plain `--wm` on `--gy` is
  rgb(138,122,88) beside rgb(138,130,114), which nobody spots mid-page. It is
  darkened AND carries a **⚑**. Never red — this is a caveat, not an error.
- Two structural findings hold the tab up, both verified on every bracket:
  a **top-6 seed always finishes top 6** in this format (which is what makes
  playoff appearances knowable for all 13 seasons, not just the 7 with
  brackets), and **the rank is the playoff finish while the record beside it is
  the regular season** — they disagree constantly, and that gap is the history
  worth showing.

## 🏆 How the power rankings work

**The rankings are a FILE in this repo, not a live model run**, and that is the
whole design:

1. The commissioner opens **`power.html`** (the Lab). It calls the owner's
   Render backend for the league's real season data, pre-builds a ranking from
   the model, and he reorders and rewrites it by hand.
2. He taps **🚀 Publish to the app**. That copies a JSON payload and names the
   file it belongs in.
3. A session commits it: drop the JSON at `rankings/<the-given-name>.json` and
   **prepend an entry to `rankings/index.json`** (`{k, l, d, f}`, newest
   first). That is the whole publish step.
4. Every member's app picks it up on the next load.

Why not have the app compute it live: members have no ESPN cookies and no
backend, and **a ranking is an opinion column that must not silently re-derive
itself into a different answer a week after it was written**.

- ⚠️ **Publishing also marks the week** in the movement sense (`publish()` →
  `powerlab:pub`). ▲▼ is measured against the last set the league actually
  saw, never against the model's own previous guess. A publish that skipped
  that would make next week's arrows quietly wrong.
- ⚠️ The payload row carries the **manager CODE at index 7**, added for this
  app. It cannot use index 6 (`mgrLabel`), which deliberately returns `''`
  when the label would just repeat the team name — keying off it would deny
  **CC**, and only CC, their own highlighted row.
- **The model's weights are a judgment call, NOT fitted** — all-play win% 40%,
  points per game 25%, last 3 weeks 25%, actual record 10%. A power ranking has
  no graded outcome, so nothing here can be validated the way a betting model
  is. Never present it as measured; never "tune" it as if a sample existed. The
  app says so on the page.
- An **empty archive and an unreachable one are opposite facts** and the
  rankings view says which. "Nothing published yet" when the truth is "you are
  offline" is a lie the app must not tell.

## The stylesheet

`styles.css` is a **complete copy of Sports-Hub's**, brought over whole and
deliberately not trimmed. Its layer order and specificity are load-bearing and
documented at length in that repo; restructuring it blind is the one change
guaranteed to break rendering in ways no assertion catches.

- **Live here:** the champagne token block, the base components, the token /
  spacing / FLOW layers, `.ffp-` (cards, tiles, empty states) and `.fh-` (the
  archive's own layer, which comes last of the copied ones).
- **Dead here:** everything for the rail, betting, Pick'em, the live fantasy
  view, AI Picks. It costs bytes and nothing else.
- **Trimming it is a follow-up, not a drive-by** — do it with a render of all
  five history views, the picker and the rankings page before and after.
- **Load order is `styles.css` → `power.css` → `league.css`.** `league.css` is
  last on purpose. Append to it; never insert above it.
- ⚠️ **Every colour must be a token.** A hex here is a colour nothing else in
  the app can reach.

## Release ritual

1. Bump `APP_VERSION` in `league.js`.
2. Bump the matching `?v=N` on every asset in `index.html` (and `power.html`
   if you touched its files).
3. Bump `CACHE` in `sw.js`.
4. `node --check` every JS file — there is no test suite; syntax check plus a
   headless render is the gate.
5. Update this file in the SAME commit if you changed architecture, data or a
   feature.

Commit message footer (always):
```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01To1PtAzu7JTpCEQj8EiV9D
```

## Testing reality

- The sandbox **cannot reach ESPN or the Render backend**. The members' app
  needs neither — it is entirely static, so it verifies fully here. **The Lab
  does not**: its live data path must be checked on the owner's device.
- `fetch()` of `rankings/*.json` needs a real HTTP origin. Serve the folder
  (`python3 -m http.server`) — `file://` will fail CORS and make the rankings
  view look broken when it isn't.
- Drive the real `index.html` in headless Chromium and **look at the render**.
  Every fault worth finding in this codebase's history was visible and not
  assertable: a label that couldn't identify its own row, an empty white pill
  where a name should be, a badge that read as decoration.
- ⚠️ **A value derived at init cannot answer a question asked later.** The
  manager `name` field was a plain string copied from `nm()` at module load —
  before anyone has picked — so the app was second-person in patches until it
  became a live getter. Watch for this shape anywhere else.

## Style of work the owner expects

- Be honest about limits instead of shipping something flaky. When something
  can't work statically, say so and offer the real options (including "do
  nothing").
- Ship small, verifiable increments; bump the version so the owner can confirm
  what they're running. They verify on iPhone (Safari + home-screen PWA).

## Open / next

- **The members' app has no rankings yet** — `rankings/index.json` ships empty
  and the app says so honestly. The first real publish is the first test of
  that path end to end.
- **`MGR_NAME.McD` is `'Jack'`** — every other manager goes by the short name
  the league already uses, but the owner needed a label that isn't "You" now
  that "You" is a role. If the league calls him something else, that one string
  is the only edit.
- **Not built:** any way for a member to write anything back (a reaction, a
  pick, a comment). That needs a backend and is a real product decision, not a
  missing feature.
