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

> ## ⚠️ Standing rule: keep this file current
> Whenever you change the architecture, the data, the deploy path, or add or
> remove a feature, **update the relevant section in the SAME commit.** Future
> sessions rely on this being accurate — don't wait to be asked.
>
> **Two kinds of section, maintained differently:**
> - **Current-state sections** (What this is · Hard constraints · Files ·
>   localStorage keys · the three-kinds-of-fact table · How the rankings work ·
>   The stylesheet) describe the app as it is TODAY. **Rewrite them in place.**
>   They must never describe a past build.
> - **The Changelog** is a record of decisions and the reasoning behind them,
>   so entries are NOT rewritten — but they are written in the present tense,
>   which means a stale one reads as current to anyone who greps. When a change
>   invalidates an older entry, **add an inline `⚠️ SUPERSEDED in vN` marker**
>   naming what replaced it. Both halves are required.
>
> ⚠️ This rule is inherited from Sports-Hub, where it was learned the hard way:
> a version shipped there with four changelog entries still describing a UI
> that had been gone for three releases. **A moved document goes stale fastest
> of all** — the Power Rankings Lab section below arrived from that repo and
> already had two lines in it that stopped being true before the move.

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
- `league.js` — the shell: identity, router, jump nav, the rankings view.
  It is deliberately small; all the archive logic lives in `history.js`.
- `league.css` — the `.lg-` layer. Loaded LAST, so it wins ties.
- `history.js` — **the archive** (~1,130 lines): the curated 13-season data,
  a single-pass stats engine, and every view. Exposes ONE global,
  `window.LeagueHistory`:
  - ⚠️ **Playoff record + Finals reached are in `rec`, not `cb` (v9).** They are
    career résumé — who gets in, who reaches the final — and the Cum Bowl is
    the opposite bracket, for the teams that missed. Filing them there put the
    league's best achievement behind the tab named for its worst.
  - ⚠️ **The career tiles are `Playoff apps` (10/13) and `Playoff record ⚑`
    (11-4), renamed in v10** — "Playoffs" and "Bracket" did not say which was
    which. Two knock-ons, both found by rendering: the caption under the strip
    names that tile in bold, so it had to be renamed in the same edit or it
    pointed at a label no longer on screen; and the longer label wraps at
    390px, so `.fh-you-t i` reserves two lines on EVERY tile (else row 2 came
    out 55px against row 1's 46px) and the ⚑ is bound to "record" with a
    non-breaking space, because a provenance flag alone on a line reads as a
    stray mark rather than a badge.
  - `SUBS` — the five history sub-tabs, **in display order**: Honours · You ·
    Records · Cum Bowl · Seasons (v6 — "You" was fifth and is second now; the
    owner's call). Reordering is that array alone; `VIEWS` is a map and
    `league.js` just walks `SUBS`.
  - `view(key)` — `hon` · `you` · `rec` · `cb` · `sea`
  - `profile(mgr)` — the drill-down every name opens
  - `setMe(mgr)` / `me()` / `name(mgr)` / `roster()` — identity
- ⚠️ **Two render faults the v9 move exposed, both pre-existing and both
  invisible to every assertion — see the two 🚨 comments in `league.css`:**
  (a) `el.hidden = true` on `#lg-jump` was a **visual no-op**, because
  `:root[data-palette] .lg-jump { display: flex }` is (0,2,1) and the UA's
  `[hidden] { display: none }` is (0,1,0). `buildJump()` has always hidden a
  nav with under two chips and no view had under two until now, so the branch
  had never run — it painted an empty 13px bordered strip. **Hide by property,
  add a `[hidden]` rule at your own specificity.** (b) `.fh-sub` is
  `font: 800 9.5px/1` and a provenance badge inside it is ~19px tall, so it
  overflowed its line box and printed **on top of** its own heading once the
  pair wrapped at 390px. **A line box cannot contain an inline taller than its
  line-height** — use flex when a heading carries a badge.
- `styles.css` — **a full copy of Sports-Hub's stylesheet**, brought over
  whole. See "The stylesheet" below before touching it.
- `power.html` / `power.css` / `power.js` — the **commissioner's** authoring
  tool. Members never need it; it is not part of `index.html` and shares only
  the stylesheet and the crests. It talks to the owner's Render backend
  (`sports-hub-fantasy-api.onrender.com`, overridable via localStorage
  `sportshub:api`), which is on Render's **free tier** and cold-starts ~30-60s
  after 15 minutes idle — hence the 45s timeout in `API_TIMEOUT`.
  **The documentation below moved here from Sports-Hub's `CLAUDE.md` when the
  lab did, and this is where it is maintained now.**
  The owner's **weekly fantasy power rankings** for their ESPN league: the
  model pre-builds a ranking each week, the owner reorders anyone and writes
  a take on anyone, and the result ships to the league. **The model is the
  starting point, never the answer** — a row the owner moved says where the
  model had it, which is the point of the whole thing.
  - **Data: ONE call**, `/api/fantasy/football/season` (v195), which already
    carries per-team `scores`/`outcomes`/W-L/`pointsFor` plus the derived
    **all-play** record off the backend's cached League snapshot. No new
    endpoint, no extra ESPN request. Last good payload cached on device
    (`powerlab:season`).
  - **The model** (`buildModel`): all-play win% **40%** · points per game
    **25%** · last `RECENT_N` (3) weeks **25%** · actual record **10%**, the
    three continuous inputs z-normalised across the league first so they are
    commensurable. All-play is heaviest because it is the only input immune to
    schedule luck — it is what separates a power ranking from the standings.
    ⚠️ **The weights are a judgment call, NOT fitted** — a power ranking has no
    graded outcome, so nothing here can be measured the way `app.js`'s betting
    model is. Never present it as validated; never "tune" it as if a sample
    existed. Said in the app too, in the "How the model ranks" card.
  - **Preseason (zero weeks played) invents nothing** — no order, and **no
    records or ppg on the rows**, because a fabricated 0-0 beside a name is a
    lie. It hands over the twelve teams and says why.
  - **A week is keyed by WEEKS PLAYED**, not `league.current_week` — label
    `Preseason` / `After Week N`. The draft (`powerlab:draft`) restores only
    for the same key, so a new week's results pre-build a fresh ranking and
    can never eat edits belonging to a week already published.
  - **Reordering:** ▲▼ for nudges plus an invisible `<select>` over each rank
    number, so tapping the number opens the native iOS picker and 12th → 1st
    is one gesture. Deliberately not HTML5 drag (dead under iOS touch).
  - **Sharing** — `power.html#r=<base64url>`, a **self-contained** payload
    (names, records, ppg, takes, the model's rank, movement), so a recipient
    makes **no backend call**: it survives a sleeping backend, and a link that
    re-derived from the live feed would show a different ranking a week later
    than the one that was sent. `btoa` is Latin-1 only, so the payload is
    UTF-8-encoded and chunked before encoding — takes are full of emoji. Plus
    a plain-text copy, which is what actually gets pasted into the league chat.
  - **🚨 Sharing PUBLISHES the week** (`powerlab:pub`), and the button says so:
    ▲▼ movement is measured against the last set the owner actually shared,
    never against the model's own previous guess. No published prior week → no
    arrows and a line saying why.
  - **The shared view carries a BYLINE** (`S.byline`, defaulting to the owner's
    own team name, editable in the header, `b` in the payload). *"Someone
    shared their power rankings"* is useless in a twelve-person league — the
    first thing a recipient needs is whose take it is.
  - **Movement follows the owner's OWN published table**: a team that held its
    spot reads **`—`**, and every mark carries a **`LW N`** last-week rank
    beside it. `moveStr`/`moveCls`/`lastWk`, gated on `hasMove` = *a week has
    been published at all* (`null`), never on *the team moved* (`0`).
    ⚠️ v208 shipped the dash's ABSENCE, on the v196 stray-dash reasoning; that
    reasoning is about a dash ALONE, and the last-week line is the context that
    makes it read as "held". Dates are formatted (`niceDate`) — a raw
    `2026-09-07` reads like a database field. A manager label that just repeats
    the team name is suppressed ("CC CC").
  - **⛑️ Crests: the league's OWN logos, with the generated helmet as the
    fallback** (`logos/`, `CREST_SRC`, `crestSrc`/`crestURL`/`drawCrest`,
    `preloadSrcs`/`CREST_READY`). **All twelve** teams carry their real logo,
    lifted from the owner's own 2023 rankings sheet, as a 144px same-origin
    PNG (~420 KB for the set).
    - ⚠️ **Keyed by MANAGER, never by team name** — the names change every year
      (the 2023 sheet says "Death Dont Hurts Very Long" where the league now
      says "Current Champ") while the twelve people do not. And it keys off
      **`mgrFor`, NOT `mgrLabel`**: `mgrLabel` deliberately returns `''` when
      the label would just repeat the team name (the "CC CC" rule), so keying
      off it would have silently denied CC — and only CC — its own logo.
    - ⚠️ **It is an OVERRIDE, not a replacement.** A manager with no file falls
      back to the generated helmet, and that is what keeps the export
      unbreakable: a generated crest needs no network, cannot 404 and cannot
      taint the canvas. Same-origin PNGs don't taint it either, but they *can*
      fail to load, and `drawCrest` treats a failure as "use the helmet". A
      suite check points a row at a dead file and asserts the save still works.
    - ⚠️ **The helmet is a FALLBACK, not a filter, and the distinction cost a
      round trip.** The first cut shipped nine, holding back three of the
      owner's own logos on the writing carve-out. That carve-out governs what
      the **template engine generates**; it was never about the league's own
      historical artefacts, which the owner made and all twelve managers have
      had since 2023. The owner said so — *"U don't get to leave stuff out.
      Add it all"* — and they were right. The helmet path stays live for a
      manager the map doesn't know and for a file that fails to load; a suite
      check drives both, since no team in this league exercises it any more.
    - `onePager` draws synchronously, so the files must already be decoded:
      `preloadSrcs` runs at boot and `saveOnePager` awaits it. `drawCrest` also
      falls back to the module-level `CREST_READY` map, because the first cut
      required the caller to hand one in and any caller that forgot silently
      got helmets with no error.
  - ⚠️ **Two lines in the paragraph above are Sports-Hub history and are no
    longer true here**, and they are left as a warning about how a moved
    document goes stale: the palette is pinned in the markup (`data-palette` +
    `data-theme` on `<html>`), there is no `PALETTE_MIGRATE` in this repo and
    no "third copy" to keep in sync — that machinery was deleted before the
    move. What IS still true: **every colour is a token**, ▲/▼ are
    `--pos`/`--neg` and never the accent, and an accent fill takes `--on-ac`,
    never `#fff` (white on gold measures ~1.9:1).
  - **Its `?v=` numbers restarted at 1 with the move.** `power.css`/`power.js`
    are `?v=1` in `power.html`, as is its `styles.css?v=`. Bump them when you
    change those files; the Lab is standalone and does not ride `league.js`'s
    `APP_VERSION`.
  - **🚀 Publish to the app** is this repo's addition — see "How the power
    rankings work" below. The share link, the text copy and the one-pager are
    all unchanged from Sports-Hub.
- `rankings/` — published weeks. `index.json` lists them; one JSON file each.
- `logos/` — the league's own twelve crests, keyed by manager.
- `sw.js` — network-first service worker. Bump `CACHE` on every release.
- `checks.js` — **run `node checks.js` after ANY data or detector change.** It
  runs the conservation laws below plus the storyline laws: every manager has
  one **and is on the rendered Storylines card** (v7 — those are different
  assertions; see Storylines), none has a template hole, each reader's own
  storyline is in second person, the card is still ranked by weight, and no
  superlative fires for two people at once.

## localStorage keys

The members' app writes **two keys and no more**. Everything else here belongs
to the Lab, which only the commissioner opens.

- `lh:me` — the manager code the reader picked. There is no account and there
  must never be one: twelve relatives are not going to sign in to read a
  fantasy archive.
- `lh:skipped` — set when someone taps "I'm just looking". ⚠️ It exists so the
  picker **never asks twice**. A prompt that returns every visit is a nag, and
  this app's whole posture is that picking is an invitation, not a gate.
- `powerlab:draft` — the Power Rankings Lab's week in progress
  (`{key, order, comments, at}`, autosaved on every edit). `key` = weeks
  played, so it is restored only for the week it belongs to — a new week's
  results pre-build a fresh ranking instead.
- `powerlab:pub` — published weeks keyed by that same key
  (`{order, comments, at, label}`). Written when the owner SHARES, and it is
  what ▲▼ movement is measured against — movement the league never saw is not
  movement.
- `powerlab:season` — last good `/api/fantasy/football/season` payload, so the
  lab still ranks when the free-tier backend is asleep (with a stale banner).
- `powerlab:spice` — `'0'` when the owner has turned off the rationed
  profanity in the pre-written takes. Absent/`'1'` = on, which is the default
  and matches the style spec's ~2-3 lines a week.
- ⚠️ **These four came over from Sports-Hub with the Lab**, so a device the
  owner used while it lived there already carries them and will restore that
  week's draft — which is correct, and worth knowing before wondering where a
  half-written week came from.

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

## 📌 Storylines — detected, never written

The cards on Records, on the You page and on every profile started life as
paragraphs typed into a chat. **They are not typed in now, and that is the
whole point:** a sentence like "Buley has finished 11th seven times" is wrong
the moment a season lands. A detector looks for a SHAPE in the data and fills
its own numbers in, so the sentence is fixed and the facts re-derive on load.
Same rule as the Sports-Hub model card — a hand-written description of
something computed is wrong the first time somebody changes it.

- **Each detector is about a shape, not a person.** `worstToFirst` fires for
  anyone who wins a title off a bottom-four finish; it happens to be Woods
  twice today. **Nothing in `DETECT` names a manager**, which is what stops
  the feature quietly turning back into a hand-written page.
- **Every sentence must read in second person too**, because any of them can be
  about whoever is holding the phone. Use `nm()` and **`vb(m, 'have', 'has')`**;
  never write "has", "his" or "he" into a template. There are no pronouns in
  these strings at all — the name always works and never misgenders anyone.
- **`signature` is the last detector and it exists for coverage.** The others
  look for extremes, so a manager who has never been extreme gets nothing — and
  three people opening a blank You page is the one outcome this feature exists
  to avoid. It finds the stat they sit furthest from the middle on and states
  it, low-weighted so it never displaces a real find. `checks.js` asserts all
  twelve are covered.
- **🚨 COVERAGE IS SELECTED FOR, NOT HOPED FOR (v7).** `signature` guaranteed
  every manager *had* a storyline; the card then printed `stories().slice(0, 10)`
  and showed **eight of twelve**. CC, Gotch, Hyman and Slemp were absent from
  the one screen in the app that is a roll-call of the league — in a link handed
  to those same four people. And the miss is not random: the detectors look for
  EXTREMES, so the manager whose story is "solid for thirteen years" is exactly
  the one who ranks last and gets cut. **The fault landed hardest on the people
  it was least fair to.** `pickStories()` now takes every manager's best card
  first, fills the rest of `STORY_CAP` (14) with the strongest remaining, then
  sorts the whole selection by weight — so everyone is on the card and it still
  opens on the biggest story in the league. The cap is a floor, not a ceiling:
  a thirteenth manager is never dropped to respect a display limit.
- **🚨 THE HEADING IS THE CLAIM (v8).** v7's coverage fix put four cards on the
  screen headed **"Gotch, in one line."** — a label, not a finding — while the
  actual claim (11-1 in the consolation bracket, the best in the league) sat
  buried mid-body behind a comma. Every other card states its fact in the
  heading, so these four read as filler beside them and a reader scanning
  headings learned nothing about four of the twelve. **Getting them onto the
  card was only half the job; a heading that carries no finding is a card the
  reader skips.** Each `CLAIMS` entry now writes its own heading and the body is
  career context only. `checks.js` fails on a heading under four words or of the
  form "X, in one line."
  - ⚠️ **And the fix exposed the mirror fault:** a heading saying "6 of 9
    seasons" over a body saying "9 seasons, 63-59" is one fact printed twice on
    one card. `stories()` dedupes DECIMALS across cards and could not see a
    whole number repeated within one, so a claim that states the season count
    sets `seasons: true` and the body drops it. Checked at 3+ only — 1 and 2
    collide constantly and harmlessly ("11-1" over "1 title"), and a check that
    cries wolf gets ignored.
  - ⚠️ **`STATS` was dead code that would have thrown.** An unused array left
    beside `CLAIMS`, interpolating a `sup` that is defined nowhere in the file.
    It never ran, so nothing ever errored. Deleted. (Sports-Hub v206, same
    shape: a value that is computed and never read is invisible to every test.)
- **⚠️ And the CHECK was reading the wrong thing, which is why this shipped.**
  It asserted `_stories()` — "18 across 12 of 12" — while the card rendered ten.
  A detector finding a story and a reader seeing it are two different facts and
  only the second one matters. `checks.js` now asserts `_cardStories()`, the
  exact list the card maps over, and re-checks that it is still ranked. Verified
  by reverting the fix: the new check reports four failures, one per absent
  manager. **Assert what renders.**
- **🚨 Built per READER, not once at load** — and this fault was written into
  this file twice. The first cut ran the detectors at module init, which is
  before `setMe`, so every headline froze with the manager's own name in it and
  the storylines were the one part of the app that never said "you". **A value
  derived at init cannot answer a question asked later.** Memoised on `ME`.
- **⚠️ Era-safe comparisons only.** Scoring has climbed across thirteen years,
  so a raw career ppg ranks managers by *which seasons they played* — a
  nine-season career starting late tops the all-time list without ever
  outscoring anyone. `relPpg` measures against the league in the seasons that
  manager actually played. Same family of fault as printing an all-play record
  (11 opponents) beside a real one (13-14 games) as if they compared: the
  numbers are each right and the comparison is not. **Percentages, or a common
  baseline — never two different denominators side by side.**
- **A superlative that fires twice is just wrong.** `stuckAt` originally
  returned every manager with a 4+ repeated finish, so two of them claimed the
  record on one screen. Use `leaders()` and `alsoTxt()`, which say "tied with"
  rather than pretending.
- **Facts are deduped across cards** — the zero-podium card folds in whatever
  records that manager holds, which had the Cum Bowl record printed twice on
  one screen as two separate findings.
- Every card carries a provenance badge, same three kinds as everything else.

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

## Changelog

Same convention as Sports-Hub's, and for the same reason: entries record the
REASONING, not just the change, so the next session does not repeat a mistake.
**Write them in the present tense, never rewrite one, and when a later change
invalidates an entry add an inline `⚠️ SUPERSEDED in vN` marker to it** — a
stale entry written in the present tense reads as current to anyone who greps.

- **v11 — the standfirst is a panel now, and it has a line length (10 Sep
  2026)** — the owner, with a screenshot of the Storylines intro: *"make this
  look niceer"*.
  - **Every view opens with a `.fh-lead`** — the sentence that says what the
    table under it means — and it was plain 12px grey body copy, flush against
    the card's own padding and the same size as the story text beneath it. So
    it read as the first paragraph OF the content rather than the note ABOUT
    it, and nothing told a reader where the preamble ended. It is a panel now:
    a neutral ink wash, a gold rule down the left, the card's own radius.
  - **The actual defect in the screenshot was the MEASURE, not the styling.**
    `.lg-main` has no width cap, so on a laptop that paragraph ran the full
    window — about 120 characters a line, roughly double what prose stays
    readable at, which is why it looked like a stray band of text. `max-width:
    64ch` is the fix and it is the half that matters away from a phone.
    ⚠️ The rest of the app still runs full-bleed on a desktop; capping the
    whole shell is a separate change and needs every table re-rendered wide.
  - ⚠️ **The fill is a NEUTRAL wash, not the champagne tint, and that was a
    correction.** The first cut used `rgba(var(--acRGB), .09)` — which is
    exactly the tint `.fh-tr.you` and `.fh-cbt-r.you` use to mean **this row
    is you**. Rendered beside the Cum Bowl table the two read as the same
    signal, so a decorative panel was quietly spending the one colour this app
    reserves for identity. The gold survives as the left rule only.
  - **The Storylines lead is two voices** (`.fh-lead-2`): the claim as a block
    line, the derivation note under it at 11.5px. A `<b>` that happens to wrap
    mid-sentence is emphasis, not a heading — so the claim is `display: block`
    rather than relying on where the text breaks. Both stay `--gy`/`--ink`;
    dropping the note to `--mu` measures ~3.7:1 on the tinted ground.
  - **Applied to all six leads, not just the one in the screenshot** — Honours,
    the luck index, the champion's curse, the Cum Bowl and Rivalries carry the
    same element, and fixing only the card someone pointed at is the v3 fault
    (a symptom fixed where you happen to be looking while the same display
    keeps doing it elsewhere).
  - Verified in headless Chromium against the real `index.html` over HTTP at
    390px and 1180px, all five leads rendered: no horizontal overflow, nothing
    under the 9px type floor, no console errors, conservation laws green.

- **v4 — jump nav, a real icon, and the luck rows put back (10 Sep 2026)**
  - **A jump nav on every page** (`buildJump`), one chip per card, tapping
    straight to it. **Built from the rendered DOM, never from a list of what
    each view is supposed to contain** — a hand-kept list is a second
    description of the same thing and drifts the first time a card is added.
  - **Two kinds of landmark**, because the views are two shapes: most pages
    are a run of `.section-title` headings, but Seasons is thirteen
    `<details>` under ONE heading, and there the useful chip is the **year**.
    Falls back to the second when the first finds fewer than two.
  - **Level 2 moved OUT of `#lg-body`** into `#lg-sub2`, so the jump nav can
    sit beneath it. The first cut had the nav above the sub-tabs, which reads
    backwards: the sub-tabs choose the page, the nav moves within it.
  - Tapping a `<details>` chip **opens it first** — scrolling to a collapsed
    summary looks like the tap did nothing. Chips wrap rather than scrolling
    sideways (a horizontal scroller hides its own tail, which is how
    Sports-Hub lost three tabs off the right edge for twenty versions), and a
    scroll-spy flags the card you are actually in.
  - Hidden below two landmarks — one chip is a button that goes where you
    already are. Rankings therefore has none, correctly.
  - **🎨 A real home-screen icon.** The league name is a joke about lunch
    meat, so the icon is the joke: a **slice of bologna wearing football
    laces**, on the app's own plated gold. A slice is already a circle, which
    is the one shape that survives being shrunk to a 29px badge, and the laces
    are what stop it reading as a pink dot. Generated by a script (Pillow,
    5× supersampled) rather than drawn by hand, and **judged on a contact
    sheet at 128 / 60 / 40 / 29px** — an icon is only ever seen small.
    ⚠️ The gold uses a **double highlight**, same rule as the app's `--grad`:
    one flat stop reads as mustard.
  - ⚠️ **Icons cache hard.** Every reference carries `?v=`, in `index.html`,
    `power.html` AND `manifest.webmanifest`. Bump all three together or a
    device keeps the old one indefinitely.
  - **League History is the first tab now**, Rankings second, and the app
    opens on it — the archive is always there, a published week only exists
    during the season.

- **v3 — the luck index was comparing two different denominators (10 Sep
  2026)** — the owner, on the luck rows: *"are these luck numbers correct?
  deserved 97-46 got 93-81? shouldnt it be the same."*
  - **The gap was right; the row was misleading.** All-play is **11 opponents
    a season** (11 × 13 = 143 games); the real schedule is 13 or 14 games a
    year (174). Two records, two denominators, printed side by side with
    nothing saying so — so the natural reading is that they should add up, and
    they never could. 97/143 = 67.8%, 93/174 = 53.4%, and −14.4 is exactly
    that difference.
  - ⚠️ **SUPERSEDED within the hour by v4, and the correction is the useful
    part.** v3 replaced the two records with the two rates. The owner read it
    and said the page was *more* confusing: *"go back to the old i guess and
    just add a line in the desciption explaing."* They were right — the
    records are the concrete thing and the rates are the abstraction, so
    swapping them removed what people actually wanted to see in order to fix a
    problem that was only ever a missing sentence. **The rows show records
    again and the description explains the denominators, worked through with
    the reader's own numbers.** The instinct to fix a confusing display by
    changing the data shown is usually wrong; the display was not lying, it
    was silent.
  - ⚠️ **This is the same fault v2 fixed in the storyline cards and left in the
    card those cards were derived from.** Fixing a symptom where you happen to
    be looking, while the primary display keeps doing it, is worse than not
    noticing — the reader hits the original either way.
  - **⚠️ And it is this family's most dangerous bug shape: every number was
    correct and the display still lied.** Sports-Hub's v202 and v203 are the
    same fault. When a view puts two figures next to each other it is asserting
    they are comparable; if they are not, either fix the presentation or do not
    put them together.
  - A gap that rounds to 0.0 no longer paints red — neither good nor bad is
    neutral (the v189 semantic-colour rule).

- **v2 — storylines (10 Sep 2026)** — the owner, with screenshots of writeups
  from a chat: *"u had these really interesting write ups and more in the chat.
  How can we add these to the app."*
  - **Not by pasting them.** Every number in those paragraphs was already
    derivable, and a pasted paragraph is wrong the next time a season lands.
    They are detectors now — see the section above.
  - All six writeups reproduce from the archive exactly, which was checked
    before a line of the engine was written: Woods' two worst-to-first titles,
    Buley's 11th × 7 and 6/4 Cum Bowl records, Christel's zero podiums beside
    the 183.3 and 153.6 records, Zach's clean floor, Hurd's 109.4 → 94.2 and
    5-14, Wolff's 56.9% and 0-4. **The data was the check on the prose, not the
    other way round.**
  - **Five faults in the generated prose, all found by reading the output** —
    two managers both claiming the same record; "Tied for the most with tied
    with Hurd"; two different denominators printed side by side; a gendered
    pronoun in a template; and one fact rendered as two separate cards.
  - **Coverage was the real design problem.** The detectors found ten of twelve
    managers; the other two would have opened their own page and found nothing.
    `signature` closes that, and `checks.js` now fails if it ever reopens.
  - Placed in three spots rather than a sixth tab (five already crowd 390px):
    the top of **Records**, **Your storylines** on the You page, and each
    manager's own on their profile.
  - `checks.js` moved into the repo from the scratch harness — it was testing
    a path in the other repo, which stopped existing when history.js moved.

- **v1 — the league's own app (10 Sep 2026)** — the owner: *"I started a repo
  called league history and it's gonna be so that I can send it out to all the
  members of the league… they're gonna click their name and then the app speaks
  to them like you have spoken to me."*
  - **Identity is one call.** `history.js` gained `ME`, `setMe`, `isMe`,
    `realNm` and `vb`; `nm()` is the single place second person is decided, so
    pointing it at a different manager re-voices every table, rivalry line and
    caption in the archive with no other edit.
  - ⚠️ **`vb(m, 'have', 'has')` exists because second person changes the
    verb.** "You have outscored" but "Buley has outscored" — a sentence that
    agrees with the wrong person is the first thing a reader notices. Any new
    generated sentence about a manager goes through it.
  - **🚨 A value derived at init cannot answer a question asked later.** The
    manager `name` field was a plain string copied from `nm()` at module load
    — which is BEFORE anyone has picked — so every view reading `a.name` (the
    trophy case, the luck index, the playoff table, the Cum Bowl record, a
    profile header) went on printing the manager's own name after `setMe` had
    made them the reader. Only the few places that happened to call `nm()`
    live said "You", so **the app was second-person in patches**. It is a live
    getter now (`Object.defineProperty`). Watch for this shape anywhere else.
  - **The picker is the front door once, then a header button forever.** It
    never returns uninvited — `lh:skipped` is what makes "I'm just looking" a
    real answer rather than a delay.
  - **Picking lands you on the You page**, not back where you were. It is a
    question about yourself; the answer should be the page about you, or the
    tap looks like it did nothing.
  - **🚀 Publish added to the Lab**, and the payload gained the manager code at
    index 7 — index 6 (`mgrLabel`) is deliberately blank when the label would
    repeat the team name, so keying off it would deny **CC**, and only CC,
    their own highlighted row. Same trap the crests hit in Sports-Hub's v208.
  - **The rankings view loads `power.css`**, so what a member reads is
    pixel-identical to what the commissioner built. Load order is
    `styles.css` → `power.css` → `league.css`.
  - **Two faults only the render caught:** the header's "who are you" chip
    painted as an **empty white pill** on the picker screen — the one screen
    everybody sees first — because `paintHead` lived inside `paint()`, which
    does not run while the picker is up; and the footer's Lab link was a
    **13px tap target**, a third of the 38px floor, because an inline link in
    a paragraph has no height of its own.
  - ⚠️ **A stale harness will lie to you.** The driver page is a copy of
    `index.html` with a script injected; after editing `index.html` it must be
    rebuilt, or you are testing the previous version. It cost a round trip
    here — the rankings view rendered completely unstyled and the CSS was
    fine.
  - Verified in headless Chromium at 390px against the real `index.html`
    served over HTTP: the picker, all five history views, a manager profile,
    the rankings view with a fixture week and with an empty archive, and the
    "just looking" path. No clipping, nothing under the 9px type floor, no tap
    target under 38px, no horizontal overflow, every crest loading, no console
    errors.

## Open / next

- **The members' app has no rankings yet** — `rankings/index.json` ships empty
  and the app says so honestly. The first real publish is the first test of
  that path end to end.
- **`MGR_NAME.McD` is `'McD'`** (v5) — the owner needed a label that isn't
  "You" now that "You" is a role, and **the label the other eleven see is his
  call, not a guess**: it was `'Jack'` for one version and he asked for the
  short name the league already uses, same as every other manager. He still
  reads as "You" on his own device — `nm()` checks `isMe` first — so this
  string is only ever seen by somebody else.
- **Not built:** any way for a member to write anything back (a reaction, a
  pick, a comment). That needs a backend and is a real product decision, not a
  missing feature.
