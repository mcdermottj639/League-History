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
- **The Lab is gated, the archive never is.** `power.html` asks for a
  passphrase; `index.html` must keep working for a stranger who taps nothing.
  ⚠️ And a **shared `#r=` link stays open** — that is what goes in the chat.
- ⚠️ **This repo is PUBLIC.** Everything in it — real first names, the takes,
  the team names — is world-readable. That was the owner's setting, not an
  accident, but weigh it before adding anything new about a person.

## Files

- `index.html` — the members' app. Header (brand · **?** · who-you-are chip),
  name picker, two-level nav, and the empty `#lg-sheet` the ? fills.
  ⚠️ **It does not name `power.html` anywhere** (v21). The Lab link is appended
  by `league.js` on the commissioner's device; markup behind `hidden` would
  still be in view-source for the other eleven. `checks.js` fails if it comes
  back.
- `owner.js` — **the commissioner's gate** (v21), ~60 lines, loaded by BOTH
  `index.html` and `power.html`. Exposes `LeagueOwner.is()` / `unlock(phrase)`
  / `lock()` off one localStorage key.
  - 🚨 **The repo is PUBLIC, so it holds the passphrase's SHA-256 and never the
    passphrase.** A token compared with `===` is the passphrase, published.
  - ⚠️ **One file, both pages, one `?v=`.** A second copy of that hash would be
    a second source of truth for the same fact. It is `owner.js?v=1` in both
    pages and **both must bump together**, or one of them serves a stale gate.
  - ⚠️ **The input is normalised (trim · collapse spaces · lowercase) before
    hashing.** Safari autocapitalises the first letter of a text field, so a
    byte-exact hash would lock the owner out of his own tool on the one device
    it is for.
  - ⚠️ **Be honest about what it is.** It stops eleven relatives with the link
    — the whole threat. It does not stop someone who reads `owner.js` and runs
    a wordlist at that hash: a static site has no server to rate-limit anyone.
    `checks.js` refuses the obvious guesses; length is the only real defence.
  - `crypto.subtle` is https-only, so `unlock` returns `'ok' | 'no' |
    'insecure'` — "wrong passphrase" and "this browser can't check one" are
    opposite problems and the message shown has to say which.
- `league.js` — the shell: identity, router, jump nav, the rankings view, and
  the **? sheet** (`helpHTML` / `openHelp` / `closeHelp`).
  It is deliberately small; all the archive logic lives in `history.js`.
  - 🚨 **`pickList()` keeps the commissioner off the picker (v21).** Anyone in
    the league can be anyone else in the league — that is the whole point of
    the thing — but nobody gets to put the app into his voice. Two escapes,
    both for HIM: an unlocked device, or a device already reading as him
    (which is what stops the lock arriving as "your phone has forgotten who
    you are" on the one phone that was already right). Neither is reachable
    from a member's device.
  - **`ownerHere()` is that question, asked once (v23), by BOTH the picker and
    the footer's Lab link.** v21 gated the link on the unlock alone, which
    made the app's only route to the Lab appear after you had already got in —
    and the way in *is* the Lab. The owner opened the app on his own phone,
    reading as himself, with no way to reach his own tool.
    ⚠️ **The link is a door, not a key.** `power.html` still demands the
    passphrase on every device, every time; `ownerHere()` only decides what is
    on OFFER. Keeping those separate is the v21 design.
  - 🚨 **`labLink()` runs AFTER `setMe`, and that is load-bearing.** It asks
    `LH.me()`, which at the top of boot is still null — so the first cut
    answered "not him" on his own phone. **A value derived at init cannot
    answer a question asked later** (v1), hit again in the file that documents
    it twice. Three of four cases passed, because the unlocked one does not
    depend on `setMe`; only rendering the exact case caught it.
  - ⚠️ **The gate is deliberately NOT `LH.me()`.** Identity here is an
    invitation; wiring a lock to it would turn the friendliest thing in the
    app into a credential, and tapping a name must never open a door.
  - ⚠️ **It filters in the PICKER, not in `LH.roster()`.** `roster()` is the
    league and `checks.js` asserts all twelve are covered by a storyline —
    filtering there would have quietly narrowed the archive to eleven people.
  - ⚠️ **The ? sheet's tab list is BUILT FROM `L1` + `LH.SUBS`** — the app's own
    source of truth for what the tabs are and what they are called. `HELP` adds
    only the one sentence a tab cannot know about itself, keyed by the same
    code, and a tab with no sentence still lists itself. A hand-typed list of
    tabs would drift the first time one is renamed, the same way a hand-kept
    jump-nav manifest would.
  - ⚠️ **The badge key inside it comes from `LH.key()`, not from prose here.**
    It quotes "119 bracket games from 7 of 13 seasons" — counts that must
    re-derive, so they stay in `history.js` where the data is.
  - 📤 **The link to send lives in the ? sheet** (`appURL` / `copyText` /
    `shareApp`, v28), under "Send it to someone" — one tap from every screen,
    because the ? is the only control that is on every screen.
    - 🚨 **The URL is DERIVED from `location`, never typed in.** A hard-coded
      address in `league.js` would be a second source of truth for the address
      of the file it is written in, and it would go on handing out a dead link
      with total confidence the day the repo or the account is renamed. The
      members' app has no routing — no hash, no query — so the link to send is
      simply where you already are with `search`/`hash` stripped and a trailing
      `index.html` removed.
    - ⚠️ **The URL is on screen AS TEXT whether or not the button works.**
      `navigator.share` → the iOS share sheet, which is the actual job (it
      lands straight in the group chat); then the clipboard; then select the
      field and say so. A copy button that fails silently on an unknown
      browser would leave a reader holding nothing, which is the one outcome
      the section exists to prevent.
    - ⚠️ **The field is 16px, and that is not a style choice.** iOS Safari
      zooms the page in when a text input under 16px takes focus and does not
      zoom back out. It is an `input` rather than a `<code>` so a long URL
      SCROLLS instead of wrapping — a link broken across two lines is the
      classic way a pasted address arrives dead.
    - It is offered to **everyone**, not just the commissioner: the link
      getting lost in a group chat is a real way this app goes unread, and any
      of the twelve re-sending it is a feature.
- `league.css` — the `.lg-` layer. Loaded LAST, so it wins ties.
- `history.js` — **the archive** (~1,130 lines): the curated 13-season data,
  a single-pass stats engine, and every view. Exposes ONE global,
  `window.LeagueHistory`:
  - ⚠️ **Playoff record + Finals reached are in `rec`, not `cb` (v9).** They are
    career résumé — who gets in, who reaches the final — and the Cum Bowl is
    the opposite bracket, for the teams that missed. Filing them there put the
    league's best achievement behind the tab named for its worst.
  - 🚨 **THE APP KEEPS NO BRACKET WIN-LOSS RECORD (v19, owner's call:
    *"Title brackets have to be changed to final 4s everywhere"*).** A
    manager's playoff résumé is **final fours**, then finals, then titles.
    - The data still files three brackets as `br`: **W** the championship
      bracket (six teams — round 1, the final four, the final), **WC** the
      placement ladder below it, **C** the consolation ladder for the six that
      missed (GmC1-9, of which GmC3 is the Cum Bowl). None of them produces a
      W-L on a manager.
    - **Why it went, in two steps.** v14 found the app printing three different
      "playoff records" for one person — 11-4 (W+WC) on the career tile, 10-3
      (W) in the storyline beside it, 22 meetings in the head-to-head — each
      computed correctly, and the page still lied because nothing said which
      population each counted. Picking one left a record covering 7 of 13
      seasons sitting beside stats covering all 13, under a name that made a
      six-team bracket sound like the final four. **A number that needs a
      "seasons on file" caveat every single time it is printed will eventually
      be printed without one.**
    - **`f4` = final fours = places 1-4**, and it is structural, not a guess:
      the two teams that lose in the final four play each other for 3rd, so the
      four left after round one are exactly the top four finishers. Verified
      against the R2 pairings of all 7 brackets on file — which is what makes
      it knowable for all 13 seasons, the same shape as "a top-6 seed always
      finishes top 6".
    - ⚠️ **And deliberately NOT a final-four W-L either.** "8 final fours" over
      "5-3 in the final four" is two denominators side by side inviting the
      reader to add them up — the v3 fault wearing the new name.
    - The games are still used as MEETINGS and SCORES: head-to-heads,
      rivalries, the highest playoff score, the regular-season-to-playoff
      scoring gap. Never totalled into a record.
  - ⚠️ **The career tiles are `Playoff apps` (10/13) and `Final fours` (8/13)**
    — renamed in v10, corrected in v14 when "Playoff record" turned out to be
    counting placement games, and replaced outright in v19 when the record
    itself went. Two knock-ons, both found by rendering: the caption under the
    strip
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
  - `view(key)` — `hon` · `you` · `rec` · `cb` · `sea`. **Storylines opens
    `hon`** (v13), in the slot the badge key used to hold.
  - `profile(mgr)` — the drill-down every name opens
  - `setMe(mgr)` / `me()` / `name(mgr)` / `roster()` — identity
  - `key()` — the three-badge provenance key, for the ? sheet in `league.js`
- 🚨 **THE `hidden` SPECIFICITY TRAP HAS NOW BITTEN THIS APP THREE TIMES.**
  `:root[data-palette] .X { display: … }` is (0,2,1); the UA's
  `[hidden] { display: none }` is (0,1,0); the palette layer wins and
  `el.hidden = true` paints nothing but a no-op. It hit `.lg-jump` (v9),
  was pre-empted for `.lg-sheet` (v13), and was found in `.ai-sub` in v21
  after shipping since v4 — the history sub-tabs stayed on screen over the
  Power Rankings with "Honours" still lit. **Hide by property AND add a
  `[hidden]` rule at your own specificity. Every time, in the same edit as
  the markup.** No assertion can see this; only a render can.
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
  tool, and **passphrase-gated since v21** (`paintGate` in `power.js`, keyed
  off `owner.js`). Members never need it; it is not part of `index.html` and
  shares only the stylesheet, the crests and the gate.
  - 🚨 **A SHARED LINK IS NOT GATED, DELIBERATELY.** `boot()` reads `#r=`
    BEFORE it reaches the gate: that payload is self-contained and read-only
    and is the thing he pastes into the group chat. Gating the page he sends
    people to would have locked the league out of the rankings themselves.
  - Nothing below the gate runs until the device answers — no backend call, no
    draft restored. A member who lands here gets a card that says whose page
    it is and a 40px link to the app that IS theirs.
  - `addLock()` injects a 🔒 Lock button once unlocked: "unlock once per
    device" is only safe if a device can be un-unlocked. It talks to the owner's Render backend
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
    endpoint, no extra ESPN request.
    - 🚨 **CACHE FIRST, THEN REVALIDATE (v25).** `powerlab:season` held the
      last good payload from v1, but only as a FALLBACK for a failed fetch —
      so every visit still sat through a 30-60s cold start with the answer
      already on the phone. It paints from the cache immediately and asks the
      backend behind you (`cachedSeason` / `fetchSeason` / `revalidate`).
      Measured: 122ms against a 3s backend.
    - ⚠️ **The refresh must not yank the page out from under him.** Same week
      key → the numbers can only have been corrected, so they update in place
      and his order and takes are untouched. A NEW key → that is a different
      ranking, and rebuilding silently would delete an order he spent ten
      minutes on, so it OFFERS (`S.pending`, the `#pr-newweek` button).
      And `repaintUnlessTyping()` defers a repaint while a take has focus,
      because dropping his caret mid-sentence is its own kind of data loss.
    - ⚠️ **Four load states, four different facts** (`freshLine()`): live ·
      checking · stale · newweek. "Showing saved data because the backend
      didn't answer" and "showing saved data while I check" are opposite
      situations and the old single `S.stale` banner said the first when it
      meant the second — the same rule the app's rankings view follows.
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
  - **Every row carries what it takes to JUDGE it (v25, owner's ask).** Season
    line: record · ppg · all-play · PF. Form line (`formOf`, `.pr-form`): last
    week's result and score · last-3 average · high · low.
    - ⚠️ **`outcomes` is padded exactly like `scores`**, so it is sliced to the
      PLAYED length before the last one is read — otherwise "last week" is
      whatever ESPN left in an unplayed slot.
    - ⚠️ **The last-3 average is on the row because the model weights it 25%**
      and the row never showed it: the owner was being asked to argue with a
      number he could not see.
    - The read-only SHARED view deliberately does not get these — its payload
      carries no per-week scores, and widening it would grow every link.
  - 🚨 **`teamById` compares ids as STRINGS (v25), and that is not
    defensiveness.** `S.model` and `S.comments` are objects keyed by team id,
    so `Object.keys()` returns `"7"`, never `7`, and a `===` against a numeric
    `teamId` never matched. **"Model's own top 3 this week" rendered
    `? · ? · ?` for its entire life.** Bracket access coerces and `find` does
    not, which is exactly why the bug sat next to working code and no
    assertion saw it. Asserted now.
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
    - ⚠️ **It hands over BOTH halves of the commit (v24)**: the week file AND
      the `rankings/index.json` line (`publishIndexEntry()`). Every field of
      that line — `k`, `l`, `d`, `f` — is already in the payload, so leaving
      it to be worked out by hand was asking somebody to re-derive data the
      Lab is holding, once a week, forever.
    - ⚠️ **All four action buttons call `publish()`**, not just the 🚀 one, so
      the ▲▼ movement snapshot cannot be missed by using a different button.
    - **The week is pre-written, order AND all twelve takes** (`restoreOrBuild`
      → `writeWeek`). Editing is optional: open, tap 🚀, paste. That is the
      difference between a weekly column that happens and one that doesn't.
- `rankings/` — published weeks. `index.json` lists them; one JSON file each.
- `logos/` — the league's own twelve crests, keyed by manager.
- `sw.js` — network-first service worker. Bump `CACHE` on every release.
- `checks.js` — **run `node checks.js` after ANY data or detector change.** It
  also holds the **gate laws** (v21): `index.html` must not name `power.html`,
  `owner.js` must hold a 64-hex hash rather than a phrase, and the phrase must
  not be one of sixteen obvious guesses. None of that is visible in a render,
  which is exactly why it is asserted. ⚠️ The first law is about `power.html`
  only — `power.css` is legitimately in `index.html`, because the rankings view
  reuses the Lab's row styling so a member reads what the commissioner built. It
  runs the conservation laws below plus the storyline laws: every manager has
  one **and is on the rendered Storylines card** (v7 — those are different
  assertions; see Storylines), none has a template hole, each reader's own
  storyline is in second person, the card is still ranked by weight, and no
  superlative fires for two people at once.

## localStorage keys

The members' app writes **three keys and no more**, and the third is only ever
written on the commissioner's own device. Everything else here belongs to the
Lab, which only he opens.

- `lh:me` — the manager code the reader picked. There is no account and there
  must never be one: twelve relatives are not going to sign in to read a
  fantasy archive.
- `lh:skipped` — set when someone taps "I'm just looking". ⚠️ It exists so the
  picker **never asks twice**. A prompt that returns every visit is a nag, and
  this app's whole posture is that picking is an invitation, not a gate.
- `lh:owner` — `'1'` on the commissioner's device, set by `owner.js` when the
  passphrase is entered. It does two things and no more: puts his name back on
  the picker, and puts the Lab link back in the footer. ⚠️ **It is not an
  account and it holds nothing** — no name, no token, no phrase. Clearing site
  data locks the device and he types the phrase again.
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
  and a 12-team league that renders 10 rows is lying. They carry **no career**:
  no row in any table of managers, no rate, no tally, no profile, and they can
  never be picked in the name picker.
  ⚠️ **But they are still named where they placed (v19, owner's call).** A
  medal line reads **"🥈 Ebzery"**, not "not tracked" — the rule is that these
  two have no career, and nothing about that requires a podium to refuse to say
  who was on it. `mgrRaw` knows them; only `mgrOf` deliberately does not, and
  every stat goes through `mgrOf`.
- **Conservation laws** are the guard against double-counting: 150 season
  finishes · 24 Cum Bowl appearances · 11 losses · 70 title-bracket slots ·
  50 final fours · 13 titles · 76 playoff berths · h2h games == meetings.
  ⚠️ The bracket law counted **every** playoff game until v14 and was green
  the whole time `bw` meant two different things in two different views — a
  law over a total cannot see a definition drift underneath it. Re-run them after ANY
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

The cards at the top of Honours, on the You page and on every profile (v13 —
they opened Records until then) started life as
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
- **`signature` is the coverage backstop and it tops every manager up to TWO
  (v22).** The others look for extremes, so a manager who has never been
  extreme gets nothing. It finds the stats they sit furthest from the middle on
  and states them, low-weighted (max 32 against a real detector's 40+) so it
  never displaces a real find or changes the roll-call.
  - ⚠️ **It is NOT in the `DETECT` array any more.** It runs as a second phase
    inside `stories()`, because it has to count what a reader will SEE — the
    list *after* the decimal dedupe, not what the detectors emitted. Christel
    proved why: `cbscore` fired for him so he counted as covered, then the
    dedupe dropped it (its 153.6 was already quoted inside his zero-podium
    card) and left him on one card with the backstop none the wiser.
    **Assert what renders — and derive from what renders too.**
  - ⚠️ **This also retired `DETECT.slice(0, -1)`**, which meant "every detector
    except the backstop" only while the backstop stayed last in the array.
    Appending one below it would have silently broken coverage.
  - 🚨 **A top-up must not re-argue the card above it.** Every detector
    declares a `t` topic beside its `src`, and a claim is skipped when that
    manager already holds a story on the same topic — so "never on the podium"
    does not get "worst average finish" as its second card. A detector with no
    `t` suppresses nothing, which fails safe.
  - The career line under a claim is carried by the FIRST top-up only, and it
    **drops any clause already on the page** (`held[m].txt`): the floor card
    said "with 2 finals and no title" and this one said "with 2 finals but no
    title" directly beneath it. The `stories()` dedupe fingerprints DECIMALS
    and cannot see a whole number.
  - `checks.js` asserts **two on the rendered You page AND the rendered
    profile**, per manager.
- **🚨 COVERAGE IS SELECTED FOR, NOT HOPED FOR (v7).** `signature` guaranteed
  every manager *had* a storyline; the card then printed `stories().slice(0, 10)`
  and showed **eight of twelve**. CC, Gotch, Hyman and Slemp were absent from
  the one screen in the app that is a roll-call of the league — in a link handed
  to those same four people. And the miss is not random: the detectors look for
  EXTREMES, so the manager whose story is "solid for thirteen years" is exactly
  the one who ranks last and gets cut. **The fault landed hardest on the people
  it was least fair to.** `pickStories()` now takes every manager's best card
  first and sorts the selection by weight — so everyone is on the card and it
  still opens on the biggest story in the league. ⚠️ **SUPERSEDED in v16 in one
  respect: there is no `STORY_CAP` any more.** It was 14 with the last two
  slots filled by the strongest leftovers, and both spare slots kept landing on
  someone who already had a card — a second finding making the same case about
  the same person. It is exactly one card per manager now, so the count IS the
  league and a thirteenth manager brings a thirteenth card.
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
- **🚨 A HEADING THAT DOES NOT FIT IS A HEADING NOBODY READS (v14).** The v8
  rule made every heading carry its claim; it did not bound how long the claim
  could be, and "Wolff has the best win% in league history, zero titles, and
  has never played in a final" runs to three lines at 390px with the badge.
  Fourteen of those is a page, not a column you can scan. **Keep a heading
  under ~45 characters** — one fact in the head, the evidence in the body —
  and remember `nm()` makes it longer or shorter depending on who is reading.
  `checks.js` fails over 62 (raised from 58 in v18 for a card the owner asked
  to keep word-for-word). ⚠️ **The number is a tripwire for drift; the render
  is the test.** One heading does run to three lines — that one — and
  `text-wrap: balance` on `.fh-story-h` is what keeps a long one from leaving
  a single word and a badge stranded on the last line.
- **🚨 ONE CARD PER MANAGER on the league roll-call (v16), no display cap.**
  ⚠️ **Still one, after v22 doubled what each manager HAS.** "At least two
  storylines" is about the pages that are about a person — their You page and
  their profile. The roll-call is a roll-call: twelve people, twelve findings.
  The v22 roll-call is byte-identical to v21's, which was checked rather than
  assumed.
  The old cap filled its spare slots with the strongest leftovers, which twice
  handed one manager a second card while everyone else had one — and both times
  the second card made the SAME case ("best win%, no title" beside "0-4 in the
  title bracket", then "3 scoring titles and no ring"). **The owner caught the
  first; fixing that instance produced the second.** Fix the rule, not the
  instance. `checks.js` fails if any manager holds two slots.
- **`own: true` keeps a story on that manager's OWN pages only (v15).** Not
  every finding deserves one of fourteen slots on the league's roll-call —
  a second card that makes the same case about the same manager in a duller
  way is one slot spent twice. The story is still detected, still on their You
  page and profile, still in `_stories()`; `pickStories()` just skips it.
  ⚠️ **Coverage still beats the flag**: a manager whose ONLY story is an
  own-page one goes on the card anyway, because a name missing from the
  roll-call is the worse failure and is the whole reason that selection
  exists. `checks.js` asserts both halves against the RENDERED You page and
  profile, and asserts the flag itself by detector id — never by manager — so
  the decision cannot be quietly undone.
- **The whole card is the tap target**, not a "X's career →" link under it:
  that link cost a 38px row on every card to repeat a name already in the
  heading. ⚠️ Nothing inside a card may be a `<button>` any more — the card
  IS one, and a nested button is invalid and steals the tap.
- ⚠️ **No lead paragraph above the cards** (v14). It explained that the cards
  are derived rather than typed — true, and now in the ? sheet, which is where
  a standing explanation belongs rather than between the reader and the first
  story.
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

> ### 📋 WHEN THE OWNER PASTES A RANKINGS BLOB, DO THIS — no questions needed
> He does steps 1-2 on his phone and pastes the result here. A paste that is a
> JSON object with `k`, `l`, `d` and an `o` array IS a week to publish; so is a
> `power.html#r=<base64url>` share link, which decodes to the identical
> payload (`shareURL()` and `publishJSON()` both serialise `payload()`).
> Treat either as the instruction — he should not have to explain it weekly.
> 1. Write the object verbatim to `rankings/<d>-<slug of l>.json` — the same
>    name `publishFilename()` shows him. Never re-derive or reformat the rows.
> 2. **Prepend** `{k, l, d, f}` to `weeks` in `rankings/index.json`. v24 hands
>    him this line ready-made; older pastes need it built from the payload.
>    ⚠️ `k` must be UNIQUE — if it is already there he is republishing the
>    same week, so REPLACE that entry and overwrite the file rather than
>    adding a second.
> 3. Commit, push, and **merge to `main`** — Pages only deploys from `main`, so
>    a week left on a branch is a week nobody can see. Confirm the deploy.
> 4. Tell him it is live. No version bump is needed: `rankings/` is data, not
>    code, and the app fetches `index.json` with `cache: 'no-store'`.

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
   if you touched its files). ⚠️ **`owner.js` is in BOTH pages on one shared
   `?v=` — bump it in both or one of them serves a stale gate.**
3. Bump `CACHE` in `sw.js`.
4. `node --check` every JS file, then `node checks.js` — there is no test
   suite; syntax check, the conservation and gate laws, plus a headless
   render are the gate.
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

- **v28 — the link to send is in the app, and one ?v= per shared file
  (10 Sep 2026)** — the owner, before sending it out: *"somewhere in the app
  just put the link that I can always copy and paste to send"*, alongside a
  pre-send check of the whole thing.
  - 🚨 **AND A FALSE ALARM WORTH RECORDING, BECAUSE THE NEXT SESSION WILL HIT
    IT TOO.** This pass opened by reporting that `main` was on **v20** — that
    the whole v21 lock was undeployed and the live site still had `power.html`
    in the footer markup with McD on the picker. It was wrong. The container's
    **local `main` ref was nine commits stale**, created from an old
    `origin/main` at clone time and never updated, and `git log main` answers
    from that ref without a word of complaint. `origin/main` was on v27 the
    whole time. **`main` is a local bookmark, not the deployed state** — this
    repo deploys from what is on GitHub, so `git fetch` first and read
    `origin/main`, or a stale ref will have you reporting a security hole that
    does not exist. Same family as the v1 harness lesson: a stale copy of the
    truth answers confidently.
  - **The link itself is in the ? sheet**, which is the one control on every
    screen. `navigator.share` first (the iOS share sheet lands straight in the
    group chat, which is the actual job), then the clipboard, then select the
    field and say so — with **the URL on screen as text at every step**,
    because a copy button that fails silently leaves a reader holding nothing.
  - ⚠️ **Derived from `location`, never typed in** — see the `league.js` bullet
    above. And offered to all twelve rather than just the commissioner: the
    link getting lost in a group chat is a real way this app goes unread.
  - 🚨 **AND A SECOND SOURCE OF TRUTH FOR ONE FILE'S FRESHNESS, FOUND BY
    READING BOTH PAGES SIDE BY SIDE.** `styles.css` was `?v=1` in `power.html`
    and `?v=27` in `index.html`; `power.css` was `?v=4` against `?v=5`. Both
    files are loaded by both pages, so each had two independent counters — and
    `styles.css` had never been bumped on the Lab side at all, pinning any
    device that had opened the Lab to the pre-v20 stylesheet there for good.
    **This is the `owner.js` rule, which this file already states, applied to
    the two files nobody noticed were shared** — `power.css` only became
    shared when the rankings view started reusing it in v1. They ride
    `index.html`'s numbers now; `power.js` stays on its own, being Lab-only.
  - The share section sits BELOW "Tap your name" in the sheet, not above it.
    The first thing the app asks of a reader is still the invitation; asking a
    stranger to forward the link before they have picked a name is a favour
    requested before anything has been given.

- **v27 — the luck column says which way is bad (10 Sep 2026)** — the owner:
  *"Just add in that top blurb how negative number is worse luck"*.
  - **The sign IS the column, and the lead never said so.** It explained what
    the number measured and left the reader to infer that −14.4 is bad news
    and +12.8 is good — an inference that is obvious only once you already
    know. One clause: *"The bigger the minus, the worse the luck — a plus
    means the schedule was kind."*
  - The rule sits directly beside a live instance of itself: `rows[0]` is the
    UNLUCKIEST manager, so the worked example is always a minus.
  - ⚠️ **And the length check failed it again, at 308 against the 300 I raised
    it to in v26** — on an edit whose whole purpose was to ADD a sentence. So
    the check changed instead of the copy: it now asserts what the paragraph
    has to DO (shorter than the original, and states which direction is bad)
    rather than a number invented an hour earlier. **Third time a self-imposed
    numeric limit has argued with a sentence the owner asked for** (v18, v26,
    here) — the pattern is the lesson, not the limit.

- **v26 — the luck blurb says one thing (10 Sep 2026)** — the owner: *"Make
  the luck index blurb simpler. Just explain what the percentage means"*.
  - **476 characters down to 229**, and the question it answers is now the one
    that was asked: the number on the right is the gap **in win rate**, worked
    through with the reader's own numbers ("You scored like a 67.8% team and
    actually went 53.4% — that is −14.4").
  - **A second sentence went in the same pass, unprompted and correctly.** "The
    gap to what you actually went is luck" said the same thing the bold line
    says precisely. Two sentences for one idea is not simpler, it is just
    shorter twice.
  - 🚨 **BUT THE DENOMINATOR SENTENCE MOVED RATHER THAN WENT.** The rows print
    "97-46 deserved · 93-81 actual" side by side, and **v3 exists because the
    owner read exactly that and asked "shouldn't it be the same?"** Deleting
    the sentence that answers it would have reopened the bug it was filed for.
    It is in the caption now: available where the rows are, out of the way of
    a lead that is meant to be read first.
  - ⚠️ **And the check I wrote to police the length failed the result at 273
    chars against a limit of 260 I had invented that minute.** The right
    response was to read the paragraph, not to trim to the number — which is
    where the redundant sentence was actually spotted. **A number in a test is
    a tripwire for drift; the render is the test** (v18, again).
  - Verified at 390px as a stranger and as the manager the example is about —
    second person intact, both captions present, no overflow, no errors.

- **v25 — the Lab opens from memory, and the rows say enough to argue with
  (10 Sep 2026)** — the owner, watching the loading card: *"Don't make me wait
  every time. Once it loads once make sure there's a memory and content
  stays"*, then *"show me season stats and prev week stats on this screen to
  help me judge"*.
  - 🚨 **The cache had been there since v1 and was only ever used when the
    fetch FAILED.** `loadSeason()` awaited the network first, every time, so a
    device holding a perfectly good copy of a week of finished results still
    sat through a 30-60s free-tier cold start to be told the same thing. **A
    fallback and a first choice are different jobs**, and the payload — a
    week of games that already happened — does not go stale in the seconds it
    takes to check. Cache first, revalidate behind: **122ms against a 3s
    backend**, measured.
  - ⚠️ **The hard part is not the caching, it is not destroying his work.**
    Same week key → the numbers can only have been corrected, so they refresh
    in place and his order and takes are untouched. A NEW key → that is a
    different ranking, and silently rebuilding would delete an order he may
    have spent ten minutes on, so it offers a button instead. And a repaint
    while he is typing would drop his caret mid-take, so a focused textarea
    defers it.
  - ⚠️ **Four states, four facts.** "Showing saved data because the backend
    didn't answer" and "showing saved data while I check" are opposite
    situations; the old single `S.stale` banner said the first when it meant
    the second. That is the app's own rankings-view rule (an empty archive and
    an unreachable one are not the same sentence) applied where it was missing.
  - **The rows now carry season AND recent form**, because the model's own
    inputs were invisible: it weights the last three weeks at 25% and the row
    never showed them. Season · record, ppg, all-play, PF. Form · last week's
    result and score, last-3 average, high, low. Two lines, because "how good
    have they been" and "how good are they now" are the two questions a power
    ranking settles and neither should read as a qualifier on the other.
  - 🚨 **AND THE RENDER TURNED UP A BUG THAT HAS ALWAYS SHIPPED.** "Model's own
    top 3 this week" was printing **`? · ? · ?`**. `Object.keys(S.model)`
    returns `"7"`, never `7`, and `teamById` matched with `===` against a
    numeric `teamId` — so it never found anybody. **Bracket access coerces and
    `find` does not**, which is why the broken lookup sat inches from working
    code and nothing failed. Compared as strings now, and asserted.
  - **Also found by looking: the header brand rode over its own buttons.** A
    flex item will not shrink below its content without `min-width: 0`, and
    v21 had added a third child (🔒 Lock) to that row. Latent at Archivo's
    metrics, live in a fallback font or at a larger accessibility size.
  - Verified against a mocked backend across all four paths: first-ever visit
    with a slow backend, second visit (122ms, "checking" note, then silent),
    a new week landing mid-session (offers, then builds on tap), and the
    backend down (instant from cache, then the honest warning). Plus twelve
    form lines, no overflow, no header overlap, no page errors.

- **v24 — the publish step hands over the whole commit (10 Sep 2026)** — the
  owner, on the weekly loop: *"I have to do all this. Can't u"*.
  - **Most of "all this" turned out to be already done, and unadvertised.**
    The Lab pre-writes the entire week — the order AND all twelve takes — so
    the true minimum is open · 🚀 Publish · paste. Editing is an option, not a
    step. That was in the code (`restoreOrBuild` → `writeWeek`) and in no
    sentence anybody reads, which is its own kind of bug.
  - ⚠️ **What CANNOT move is the part that needs him**, and it is worth being
    plain about why rather than promising to automate it: the Lab reads his
    Render backend, and **this sandbox cannot reach it** (verified — the egress
    proxy denies the CONNECT). No session can pull the league's data, build the
    week, or write to a phone's clipboard. And the takes are the product; a
    ranking nobody argued with is just the standings.
  - **So the mechanical half got smaller instead.** `publishIndexEntry()` — the
    `rankings/index.json` line is now handed over beside the week file. Every
    field of it (`k`, `l`, `d`, `f`) was already in the payload, so leaving it
    to be worked out by hand was asking somebody to re-derive data the Lab was
    holding, once a week, forever.
  - 🚨 **And the bigger fix is in this file, not in the code: a WHEN-HE-PASTES
    procedure** under "How the power rankings work", written so any session
    acts on a pasted blob with no explanation from him — including that a
    `#r=` share link decodes to the same payload, that a repeated `k` means
    replace rather than append, and that **it must reach `main` or nobody sees
    it**. The thing he actually has to do every week is not the tapping, it is
    the explaining.
  - ⚠️ **A fixture bug nearly got reported to him as a product bug.** The
    publish test failed on "every row carries a manager code", and the first
    read was that the Lab's name→manager map had gone stale — which is
    plausible, because that map IS keyed on team names and this league renames
    every year. It was the fixture: the backend field is `t.team` and the
    fixture set `name`, so every row had a blank team name and nothing to map.
    **A fixture that is wrong in the same direction as a real risk is the
    easiest false positive to believe.** The test now also asserts the team
    names render, which is what would have caught it in one step.
  - Verified by driving the real Lab against a mocked season: unlock → twelve
    ranked rows, twelve pre-written takes, twelve names rendered, 🚀 produces
    valid JSON plus an index line whose `k`/`l`/`d`/`f` all agree with the
    file, every row carrying its manager code, no overflow, no console errors.

- **v23 — the owner could not reach his own Lab (10 Sep 2026)** — the owner,
  with a screenshot of the app on his phone: *"I don't see the lab or
  passphrase"*.
  - 🚨 **v21 built a door that only opened from the inside.** The footer link
    was gated on the unlock, and the only place to unlock is the Lab — so the
    app's single route to it appeared *after* you had already got there. On
    his own phone, reading as himself, there was nothing to tap. The
    workaround shipped in v21 was "type the URL the first time", which is a
    workaround written into a design rather than a design.
  - **The picker already had the right rule, so the link now uses it too.**
    `ownerHere()` — unlocked, OR already reading as him, a name no member is
    offered. One question, asked once, in both places.
  - ⚠️ **This is not a weakening of the lock, and the distinction is the whole
    v21 design: the link is a DOOR, not a key.** `power.html` still demands
    the passphrase on every device, every time. What changed is what is on
    OFFER, which was never the security boundary — a member who hand-set
    `lh:me` in devtools would see a link and then meet the gate, exactly as a
    member who types the URL does today. Asserted: following the link while
    only *reading as* McD still gets the gate and no editor.
  - 🚨 **AND THE FIRST CUT PUT THE CALL FOUR LINES TOO EARLY.** It ran at the
    top of boot, before `setMe`, so `LH.me()` was still null and it answered
    "not him" — reproducing the exact bug it was meant to fix. **A value
    derived at init cannot answer a question asked later**: the v1 lesson, in
    the file that documents it twice, and it still happened. What makes it
    worth recording is that **three of the four cases passed** — the unlocked
    one does not depend on `setMe` at all — so a suite that checked "does the
    owner see the link" with the obvious fixture would have gone green over
    it. Only rendering *his* case, the one in the screenshot, caught it.
  - Verified at 390px across all four devices: reading as McD but not unlocked
    (link ✅, twelve names), unlocked (link ✅, twelve), a member reading as
    Buley (no link, eleven), a stranger with nobody picked (no link, eleven).

- **v22 — two storylines each, and the floor is measured on the render (10 Sep
  2026)** — the owner, before sending the link: *"Make sure everyone has at
  least 2 storylines"*.
  - **Eight of the twelve had exactly one**, so eight people's own page was a
    single line — and, as always with this feature, the eight were the ones the
    extreme-hunting detectors had least to say about. One card is the floor
    that stops a page being blank; it is not the floor that makes a page worth
    opening.
  - ⚠️ **The old backstop could not have been asked for two.** It tested
    `covered.has(m)` — a boolean, which answers "any?" and cannot answer "how
    many?". `WANT = 2` and a count is the whole idea; everything else here is
    consequences of it.
  - 🚨 **AND THE COUNT WAS BEING TAKEN OFF THE WRONG LIST.** Christel came out
    at one card even after the change. `cbscore` fired for him, so he counted
    as covered — and then the dedupe in `stories()` dropped it, because its
    153.6 was already quoted inside his zero-podium card, and the backstop
    never knew. So `signature` left the `DETECT` array and became a **second
    phase inside `stories()`**, reading the list that survives the dedupe.
    **This is the v7 lesson from the other end: it is not enough to assert
    what renders, the code has to DERIVE from what renders too.**
  - ⚠️ **That also retired `DETECT.slice(0, -1)`**, a live landmine: it meant
    "every detector except the backstop" only for as long as the backstop
    stayed last in the array, and appending one below it would have broken
    coverage silently.
  - 🚨 **A second card must not re-argue the first.** Every detector now
    declares a `t` topic beside its `src`, and a claim whose topic that manager
    already holds is skipped — so "never finished in the top three" does not
    get "worst average finish" underneath it. That is the v2/v15/v16 fault, and
    the shape it keeps returning in is always a second card making the same
    case in a duller way. A detector with no `t` suppresses nothing, which
    fails safe.
  - **Three faults found by reading the generated prose, which is the only way
    any of them was ever going to be found:**
    - 🚨 **"Zach's best season was 7-7" was FALSE.** The win% claim's note used
      `a.best` — which is the best **finish**, not the best record. Zach's best
      finish is 2nd in 2024 at 7-7; his best record is 9-4 in 2019, three
      places lower. **The two disagree constantly in this league, and that gap
      is the whole premise of the archive** (the rank is the playoff finish,
      the record beside it is the regular season) — so a card has to say which
      one it means. It sorts `a.yrs` by record now.
    - **Three of the new cards rendered with no body at all.** The career line
      is deliberately carried by the first top-up only, which left the second
      one as a bare heading. Every claim writes its own `note` now, so each
      card stands up alone — and the new ones state a fact the card above does
      not (best and worst finish, best season by record, playoff appearances).
    - **The career line was restating clauses already on the page.** "with 2
      finals but no title" sat directly under a card ending "with 2 finals and
      no title"; "with 3 titles" sat under "2 of the 3 titles". Both invisible
      to the `stories()` dedupe, which fingerprints **decimals** and cannot see
      a whole number. Each clause is tested against that manager's kept cards
      now, which is why `held` carries `txt` and not just a count.
  - ⚠️ **The Honours roll-call is unchanged, deliberately — and verified, not
    assumed.** "At least two storylines" is about the pages that are about a
    person. The roll-call stays one card each (v16), and the v22 card is
    byte-identical to v21's, every owner-picked slot included (Wolff's
    `ringless`, McD's `rises`, Hurd's `scorer`).
  - `checks.js` asserts two on the **rendered** You page and the **rendered**
    profile, per manager. Verified by reverting `WANT` to 1: the suite names
    all six managers who fall below, on both pages each.
  - 26 storylines now, from 18. Verified in headless Chromium at 390px: no
    empty body, no clipped card, no overflow, roll-call still twelve, second
    person intact ("You have the 9th-best win%…"), longest heading 60 chars
    against the 62 limit, no two numerals touching.

- **v21 — the Lab gets a lock, and the commissioner leaves the picker (10 Sep
  2026)** — the owner, getting ready to send the link: *"the power ranking lab
  has to be closed off to just me[.] the rest of them they can switch between
  their accounts, but they can't switch to my account"*.
  - **Two asks, and they wanted two different mechanisms.** The obvious build
    is one: gate the Lab on "are you McD". 🚨 **That would have made the name
    picker a login** — the one screen in this app whose entire posture is that
    picking is an invitation, not a gate — and it would have been a login
    anyone could pass by tapping a face. The lock is a passphrase in
    `owner.js`; the picker just stops offering one name. **Tapping a name must
    never be able to open a door.**
  - 🚨 **The repo is PUBLIC, so what ships is the SHA-256 and not the phrase.**
    A token compared with `===` is the passphrase, written out in a file
    anybody can open on github.com — a lock drawn on a door. ⚠️ **And the
    honest limit is stated in the file itself**: this stops eleven relatives
    with the link, which is the whole threat; it does not stop somebody who
    reads `owner.js` and runs a wordlist, because a static site has no server
    to rate-limit them. `checks.js` refuses the sixteen guesses a relative
    would actually try. Length is the only real defence.
  - ⚠️ **The input is normalised before hashing, or iOS locks him out of his
    own tool.** Safari autocapitalises the first letter of a text field, so
    "bologna" is typed as "Bologna" and a byte-exact hash says no — on the one
    device this whole feature is for. Trim, collapse spaces, lowercase: three
    things a phone keyboard does *to* you, none of them things you meant.
  - 🚨 **A SHARED `#r=` LINK IS NOT GATED, AND ALMOST WAS.** Gating at the top
    of `power.js` was the one-line version; `power.html#r=` is also what the
    owner pastes into the group chat, so it would have locked the league out
    of the rankings themselves. The gate sits *inside* `boot()`, after the
    shared-payload branch, which is why that branch is worth reading before
    touching either.
  - **The Lab link left `index.html` entirely** rather than hiding behind
    `hidden`: markup behind an attribute is still in view-source, and a lock
    that announces its own door to the eleven people it excludes is most of
    the way to no lock. `league.js` appends it on an unlocked device.
  - **Two escapes from the picker filter, and both are for him**: an unlocked
    device, or a device already reading as him. The second exists so the lock
    does not arrive as *"your phone has forgotten who you are"* on the one
    phone that was already right, and it is unreachable from a member's device
    because it needs a name that is not on offer.
  - ⚠️ **Filtered in the PICKER, not in `LH.roster()`.** `roster()` is the
    league — `checks.js` asserts all twelve managers are covered by a
    storyline — so filtering at the source would have quietly narrowed the
    archive to eleven people to solve a display problem. The v3 lesson, again.
  - **Two render faults, neither assertable, both found by looking.** (a) The
    gate's way out was `<a>` inside a sentence and measured **15px** — the v1
    footer fault, on the one screen a member of the league ever reaches; it is
    its own 40px row now, and `.pr-back` beside it went from 33px to 38px
    while the floor was being enforced anyway. (b) `.pr-gate-no` (0,1,0) lost
    to `.pr-load p` (0,1,1), so **the wrong-passphrase line painted the same
    muted grey as the body copy** — a failure message that does not look like
    one. Scoped to `.pr-gate`. Nothing asserts a colour.
  - 🚨 **AND LOOKING AT THE RANKINGS TAB — the second thing anyone will tap —
    found a bug that had been shipping since v4.** `paint()` has always done
    `$('#lg-sub2').hidden = true` there and on a profile, and it has always
    been a **visual no-op**: `:root[data-palette] .ai-sub { display: flex }` is
    (0,2,1) against the UA's (0,1,0), so the five history sub-tabs stayed on
    screen over the Power Rankings **with "Honours" still lit** — a nav
    highlighting a page you are not on, which is the exact thing hiding it was
    for. **Third instance of the same trap** (`.lg-jump` v9, `.lg-sheet` v13).
    It survived seventeen versions because nothing asserts it and the two tabs
    it breaks are the two nobody screenshots.
  - Verified in headless Chromium at 390px over HTTP, against the real files:
    a stranger gets eleven names and no mention of `power.html` in the served
    DOM; a member switches between members; his own phone keeps his name; the
    Lab shows the gate and makes **no backend call** until it is answered;
    capitals and a trailing space still unlock; Lock puts it back; a `#r=`
    link renders ungated. The `index.html` law verified by reverting.

- **v20 — the newest champion is a row like the others (10 Sep 2026)** — the
  owner, on the 2025 card: *"This 2025 champion card should be same as
  others."*
  - The Champions section opened with a **crown**: 64px crest, 24px name, a
    gold rule across the top and the final score, above twelve uniform rows.
    It made the current champion **a different kind of thing** from the twelve
    before him — on a page whose whole job is to line thirteen seasons up
    against each other.
  - ⚠️ **It was also the only place in the app printing two decimals.**
    "124.04–107.28" comes straight off Sleeper; everything else here rounds to
    one. A hero card is exactly where an unrounded number survives longest,
    because it is the one card nothing else sits beside.
  - **The final score went with it, deliberately.** Only 5 of 13 seasons have
    one on file, so putting it on the rows that have it rebuilds the same
    problem one row down — some champions with a detail, some without. The
    2025 final is still in the archive: it is folded into `MEET`, so it shows
    on the head-to-head between the two people who played it.
  - `.fh-crown*` deleted from `styles.css` rather than left orphaned. The `.fh-`
    layer is the one part of that stylesheet that is genuinely this app's, so
    it does not get to accumulate the dead weight the copied layers carry.

- **v19 — final fours are the whole playoff résumé (10 Sep 2026)** — the
  owner, in one message: *"Title brackets have to be changed to final 4s
  everywhere… For 13 and 14 silver just write Ebzery here."*
  - **The bracket W-L is gone, not renamed.** A pure rename would have left
    "10-3 in the final four" describing a number that counts round-one games —
    the exact class of bug v14 existed to fix. What replaces it is **final
    fours**, which need no caveat: places 1-4, all 13 seasons, one denominator.
    Career tile, playoff card, storyline claims, the collapse card's body — all
    of it. `bw`/`bl` are deleted rather than hidden, and the conservation law
    that totalled bracket slots went with them: **a law over a value nothing
    displays is testing dead code.**
  - ⚠️ **Not a final-four W-L either**, though that was the obvious compromise.
    "8 final fours" beside "5-3 in the final four" is two denominators side by
    side, and a reader will try to add them — v3, in a new costume.
  - **The playoff card is a funnel now**: final fours · finals · won. Three
    numbers from one source, each a subset of the one before it.
  - 🚨 **And the "never won a bracket game" card finally got a stat it can
    stand on.** v14 caught it counting six missing seasons as losses and scoped
    it; v19 removes the caveat entirely — Wolff has **4 final fours and no
    final**, which is true across all 13 seasons and is a better line anyway.
  - **Untracked ≠ nameless.** 2013 and 2014 silver now read **Ebzery**. The
    exclusion is about a CAREER — tables, rates, tallies, a profile — and a
    medal line was refusing to say who won a medal on that basis. The season
    tables say "Ebzery · not tracked", which is both facts at once.
  - Verified: Wolff, McD, Buley and Hurd each hold exactly one slot on the
    Honours roll-call, which the owner asked for and v16 had already made
    structural.

- **v18 — Hurd's card, in his words (10 Sep 2026)** — the owner, with the
  scoring card circled on Hurd's You page: *"Use this one for Hurd's honors
  page. Keep it exactly like this."*
  - Same trade as v16's: both Hurd cards make the same case (scores like a
    champion, wins nothing), the roll-call gives everyone exactly one, so the
    collapse card steps back to his You page and profile.
  - ⚠️ **"Exactly like this" included the wording, which v14 had shortened.**
    "…has 3 scoring titles and no ring" went back to "…has led the league in
    scoring 3 times and won nothing". That is 59 characters and my own
    heading-length check failed it at 58 — **a limit I invented, against a
    sentence the owner chose.** The limit moved to 62.
  - ⚠️ **And it renders on three lines, which is what the limit existed to
    prevent.** The words are not the thing to change here, so the wrap is:
    `text-wrap: balance` spreads it evenly instead of leaving "nothing." and a
    badge alone on the last line. It improves every other heading too. A
    number in a test is a tripwire for drift; **the render is the test.**

- **v17 — two numerals must not touch (10 Sep 2026)** — the owner, on Buley's
  card: *"Should say 11th seven times."*
  - **"finished 11th 7 times"** makes a reader parse "11th 7" before the
    sentence resolves, and at a glance the pair can read as one number. The
    count is spelled out now (`plWord`), which is the ordinary typesetting rule
    and reads the way the sentence was said out loud in the first place.
  - **Small counts only.** "11th seventeen times" would be worse than the
    problem; above twelve the digit stays and the sentence has to be built so
    the pair cannot collide.
  - `checks.js` fails any heading matching `\d(st|nd|rd|th)?\s+\d`. Verified by
    reverting: the suite reports the exact heading.

- **v16 — the roll-call is one card each (10 Sep 2026)** — the owner, with
  the playoff-rise card circled on their own You page: *"Change my honors page
  storyline to this actually."*
  - **The titles card was redundant with the page it sat on.** Storylines opens
    Honours, and the next two cards down are the Champions list and the trophy
    case — which ARE the title count, ranked. (⚠️ It said "the Champions crown"
    when this was written; **v20 deleted that crown**, and the reasoning holds
    either way.) So "4 titles" as a storyline told
    a reader something the rest of that page tells them better, while spending
    the title-holder's one slot. It is `own`-flagged now: still on that
    manager's You page and profile, where the surrounding page is about them
    rather than about the trophies. The Honours slot goes to the playoff rise,
    which is a thing that page does NOT already say.
  - **🚨 AND THE FIX HANDED WOLFF THE FAULT IT HAD JUST REMOVED FROM HIM.** The
    freed slot went to the strongest leftover, which was "Wolff has 3 scoring
    titles and no ring" — a second card, about the manager who already had one,
    making the same case as his first ("best win%, no title"). v15 had removed
    exactly that shape from exactly that manager. **Fixing the instance moved
    the fault instead of ending it**, and it took one render to show it.
  - **So the rule changed, not the instance: one card per manager, no display
    cap.** The count IS the league. A thirteenth manager brings a thirteenth
    card, which is what "the cap is a floor, not a ceiling" was always trying
    to say. `checks.js` fails if any manager holds two slots. The card is 12
    cards and 1,192px now — against 14 cards and 2,346px two versions ago.
  - The findings that lose a slot are not lost: Buley's six Cum Bowls and
    Wolff's scoring titles are still on their own pages.

- **v15 — a card can be a career footnote (10 Sep 2026)** — the owner, with
  Wolff's 0-4 card circled on the Honours page: *"Remove this one from main
  storyline page… the other one is better. But still lives for Wolff's you
  page or anywhere else it's used."*
  - **Two cards were making the same case about the same person**, and one of
    them was better: "the best win% in league history and no title" against
    "0-4 in the title bracket". On a roll-call of twelve managers that is one
    slot spent twice, and the duller card was the one holding it.
  - **`own: true` is the mechanism**, and it is deliberately not "delete it":
    the finding is still true and still worth having where a reader is looking
    at that manager, so it stays on the You page and the profile and leaves
    the league card. The freed slot went to a real league-wide find (the
    biggest playoff RISE, the mirror of the collapse card).
  - ⚠️ **Coverage still beats the flag** — a manager whose only story is an
    own-page one is put on the card regardless. The v7 fault (four managers
    absent from the one screen that is a roll-call of the league) is not
    allowed back in through a new door.
  - **Both halves are asserted, against the render.** The check fails if an
    own-page story appears on the league card, and equally if it goes missing
    from that manager's You page or profile — a story being found and a reader
    seeing it are different facts. Verified by reverting the flag: the suite
    reports the failure.

- **v14 — one playoff record, and the storylines made scannable (10 Sep
  2026)** — the owner, in one message: *"Mine should be the goat discussion
  something and hurds doesn't sound good. And consolation is meaningless
  besides cum bowl… U say wolffs never won in the playoff bracket is that
  accurate… His playoff head to head and playoff record and bracket record are
  all diffferent."*
  - **🚨 "WOLFF HAS NEVER WON A WINNER'S-BRACKET GAME" WAS FALSE, AND THE
    OWNER CAUGHT IT BY READING IT.** Brackets exist for 7 of 13 seasons, and
    Wolff finished **4th in 2017** — in a six-team bracket that means he was
    still alive in the final four, so he won or was gifted a round-1 game the
    archive cannot see. The card counted the six missing seasons as if they
    were losses. **A superlative is only ever as wide as its sample**, and
    "never" is the widest word there is. It is a scoped claim now — "0-4
    across the seasons with a bracket on file" — and the detector names any
    final four it cannot see rather than swallowing it.
  - **🚨 THREE PLAYOFF RECORDS FOR ONE PERSON ON ONE PAGE.** `bw`/`bl` counted
    the title bracket AND the placement ladder (McD 11-4), the storyline
    beside it counted the title bracket alone (10-3), and the head-to-head
    counted every meeting including consolation and Cum Bowls (22). Each was
    right; the page still lied, because nothing said which population each one
    counted. **This is the v3 fault, and it survived v3 because v3 fixed the
    display where it was looking.** One definition now: `bw`/`bl` is the title
    bracket, everywhere, and every head-to-head caption says in as many words
    that it counts something else and why it will not match.
  - **No consolation record anywhere** (owner: *"consolation is meaningless
    besides cum bowl"*). A 9-1 run through GmC1-9 is nine games between teams
    already eliminated, and "11-1 in the consolation bracket, the best in the
    league" as a heading asks the reader to weigh it against four titles.
    `cw`/`cl` are deleted rather than hidden — a value computed and never read
    is invisible to every test (the v8 `STATS` lesson).
  - **Final fours replace it, and they cover all 13 seasons.** The two
    semi-final losers play for 3rd, so places 1-4 ARE the final four —
    verified against the R2 pairings of every bracket on file. ⚠️ And the
    answer to *"if winners bracket is final 4 call it final 4"* is that it
    **isn't**: the title bracket is six teams and the final four is the round
    after round 1. Both are named for what they are now.
  - **The headings the owner named.** Most titles is the **GOAT argument**
    (it fires for whoever leads titles — a shape, never a person). The
    collapse card was *"is the biggest story in the archive"*, which is
    billing rather than a finding; it says what it found now — outscores
    everyone, then disappears.
  - **The card is ~40% shorter: 2,346px → 1,425px for fourteen stories**,
    average card 159px → 101px. Measured, not estimated. Three changes: the
    whole card is the tap target (the per-card "X's career →" link cost a 38px
    row to repeat the name in the heading), the type steps down a notch, and
    **every heading was rewritten to fit under ~45 characters** — the v8 rule
    put the claim in the heading and never bounded its length, so three-line
    headings had quietly become normal.
  - The lead paragraph above the cards is gone, per the owner. What it said
    lives in the ? sheet.
  - Two new conservation laws, because the old one could not have caught any
    of this: **70 title-bracket slots** (35 W games × 2) and **50 final
    fours** (13 seasons × 4, less the two untracked). The old law totalled
    every playoff game and stayed green while `bw` meant two things.

- **v13 — Storylines opens the app; the key moves behind a ? (10 Sep 2026)** —
  the owner: *"I want story lines moved to where how to read this is on honours
  page. And how to read this goes up to a ? Button at the top that explains all
  the functions of the app along with it."*
  - **Storylines was the best thing the archive produces and it was filed
    third-of-five, behind a tab called Records.** It now opens **Honours**,
    which is the page the app lands on — so the first thing anyone sees is the
    league arguing with itself rather than a table. Nothing else moved: it is
    one term in the `hon` view and one term out of `rec`.
  - **The badge key was a card at the top of Honours, and a reference on ONE
    page is a reference nobody has when they need it** — a ⚑ badge on the Cum
    Bowl table sat four taps from its own explanation. Behind the **?** in the
    header it is reachable from every page, and it stops spending the best slot
    in the app on a legend.
  - **The sheet explains the whole app, not just the badges**: what the archive
    is, what tapping your name does (with the picker one tap away), what each
    tab holds, how the jump chips and name-taps work, the badge key, and the
    small print about the two untracked managers.
  - 🚨 **The tab list is BUILT FROM THE TABS** (`L1` + `LH.SUBS`), with `HELP`
    supplying only the one line a tab cannot know about itself. A second
    hand-kept list of tabs is the jump-nav fault in a different costume: it
    drifts the first time a tab is renamed, and nothing fails when it does.
  - 🚨 **`LH.key()` stays in `history.js`.** The key quotes "119 bracket games
    from 7 of 13 seasons, plus 13 Cum Bowls" — three numbers that must
    re-derive. Typing them into the sheet in `league.js` would have made the
    help text the one place in the app that lies after a season lands.
  - ⚠️ **The sheet hides by property AND by rule.** `:root[data-palette]
    .lg-sheet { display: flex }` is (0,2,1) and the UA's `[hidden]` is (0,1,0),
    so `box.hidden = true` alone would have left a full-screen overlay painted
    over the app forever — the exact v9 jump-nav trap, which is why the rule
    was written at the same time as the markup this time rather than found in
    a render.
  - Built on OPEN, never at load: it names the reader and quotes archive
    counts, and both answer differently after `setMe` (the v1 lesson).
  - Three ways out — ✕, the backdrop, Esc — and the sheet's own "pick your
    name" button closes it first, or the picker would open underneath it.
  - Verified at 390px and 900px: header fits the longest name beside the new
    button, no tap target under 38px, no type under 9px, no overflow, all three
    close paths, and the jump nav picked up Storylines on Honours and dropped
    it from Records with no code change — because it reads the DOM.

- **v12 — the styling was the ask; the words were not (10 Sep 2026)** — the
  owner, on v11's Storylines lead: *"U changed the story lines. Change them
  back."* ⚠️ **SUPERSEDED in v14: that paragraph is deleted** — the owner asked
  for it gone. The panel styling below still governs the other five leads.
  - **v11 restyled the lead AND re-cut the sentence.** The ask was to make that
    paragraph look nicer; splitting it into a claim line plus a ⚡ note under
    it answered a question nobody asked, and it did it to the one paragraph in
    the app that states how the archive works. Reverted to the exact original
    copy, `.fh-lead-2` deleted — the panel and the `max-width` are the whole
    change now, and every lead in the app reads the way it always has.
  - ⚠️ **A styling request is not a licence to edit copy**, and it is worth
    naming because the temptation is structural: a two-voice layout looks
    better than one grey block, so the layout starts asking for the sentence
    to be re-cut to fit it. When the display is the problem, fix the display —
    the v3 lesson, arrived at from the other direction (there, changing the
    DATA to fix a confusing display; here, changing the PROSE).
  - ⚠️ **The owner's screenshot said `LEAGUE HISTORY V10`** — they were reading
    a cached build and had not yet seen v11 at all. **The version in the header
    is the first thing to check on any "this looks wrong" report**, and it is
    why it is in the header.

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
  - **The Storylines lead is two voices** (`.fh-lead-2`) — ⚠️ **SUPERSEDED in
    v12: reverted, class deleted, the copy is the original again.** The claim
    as a block
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
    the reader's own numbers.** ⚠️ **SUPERSEDED in v26 in one respect: that
    explanation moved out of the lead and into the CAPTION**, where the owner
    asked for a simpler blurb. It is moved, never deleted — it is the sentence
    that answers the exact question this entry exists for. The instinct to fix a confusing display by
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
    the top of **Records** (⚠️ **SUPERSEDED in v13 — they open Honours now**,
    where the badge key used to sit), **Your storylines** on the You page, and
    each manager's own on their profile.
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
- **The Lab passphrase is not in this repo and not in this file** (v21) — only
  its SHA-256, in `owner.js`. Changing it is one line: hash the new phrase
  (normalised: trimmed, spaces collapsed, lowercased) and replace `HASH`.
  Nobody can recover the old one from here, which is the point.
- **Not built:** any way for a member to write anything back (a reaction, a
  pick, a comment). That needs a backend and is a real product decision, not a
  missing feature.
