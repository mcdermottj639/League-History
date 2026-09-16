# CLAUDE.md — Nectars Bolonga (League History)

Guidance for Claude (and humans) working on this repo. Read this first.

## What this is

The **Nectars Bolonga** fantasy football league's own app: thirteen seasons of
history (2013–2025), the **season being played right now** (v39), the
**weekly power rankings** the commissioner publishes, and the **weekly group
parlay** the twelve of them put on together (v69). It is a **pure static browser app** — HTML/CSS/vanilla JS, no build
step and no framework — served from GitHub Pages. The currently active parlay
uses its legacy Firebase flow; an optional, disabled Supabase Parlay v2 backend
is prepared in v92 (see below).

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

- **No API keys, no build step, and the members' app must WORK with nothing
  but static files.** ⚠️ **Softened in v42, deliberately and only here:** the
  Season tab now *refreshes* from the owner's backend, because standings are
  facts and making him publish them was the wrong model. The constraint still
  holds where it matters — the app never DEPENDS on that call. Three sources
  in order (this phone's cache → the published snapshot in the repo → the
  network), so a dead backend costs freshness and nothing else. It still has
  no ESPN cookies and never will.
- **Deploys from `main`** via GitHub Pages (root).
- **Rankings are saved snapshots, never a live model run.** v83 publishes directly to Firebase with authenticated, per-week writes. See the v83 section below.
- **No model identifier** (exact model name/ID) in commits, code, PRs or any
  pushed artifact. Chat only.
- Don't create PRs unless explicitly asked.
- **The Lab is gated, the archive never is.** `power.html` asks for a
  passphrase; `index.html` must keep working for a stranger who taps nothing.
  ⚠️ And a **shared `#r=` link stays open** — that is what goes in the chat.
- ⚠️ **This repo is PUBLIC.** Everything in it — real first names, the takes,
  the team names — is world-readable. That was the owner's setting, not an
  accident, but weigh it before adding anything new about a person.

## v92 — Supabase Parlay preparation (unmerged; not launched)

Supersedes v91's proposed Node/SQLite production hosting. Production target is
existing free Supabase `sports-hub` (`oqrfdhoyyogjmiqmjhnp`), with isolated
`league_parlay` tables, `league-parlay` Edge Function, and its own cron job.
Shared domain/engine modules retain the tested pick behavior. Node/SQLite remains
only the local preview/test harness. No Railway service/new subscription is needed.

- PostgreSQL CAS retries enforce atomic game claims across Edge workers; hashed
  persistent sessions, private service-only invoker RPC, RLS default-deny tables,
  collector leases and secret scheduler calls. No service keys in the static app.
- Weeks 1–18 supported. Prelaunch discovery cannot override the chosen legacy
  week. Empty/partial/full Week 1 imports and midgame locks are tested. Preserve
  originals and block on unresolved/duplicate imports; do not invent closing odds.
- Week 1 reimbursement is undecided, not an endless wait for a nonexistent Week 0.
- `scripts/supabase-parlay.mjs` provides operator status, public-feed preparation,
  read-only rehearsal, frozen-export import, verified private backups and activation.
  All real migration commands take an explicit week. No automatic Firebase read.
- Supabase schema is applied and tested. New cron is INACTIVE; collection is off.
  Existing Sports-Hub tables/functions/scheduler are untouched.
- **Approval review blocked** Edge deployment with `verify_jwt=false` and separately
  blocked installing the organizer hash. Neither action was retried. Gateway JWT
  validation must be off for this existing app's session/capability protocol; the
  handler performs its own route authorization. Exact deployment plus hash install
  needs explicit approval. Hash is not installed; organizer link not live-verified.
- `parlay/config.json` stays disabled. Do not merge or activate on this preparation
  instruction. `PARLAY_RELEASE.md` is authoritative for actual remaining gates.
- No changes to rankings, owner controls, current member links or Firebase rules.

## v91 — Prepared Parlay v2 (disabled; not launched)

**Do not merge or enable without Jack's launch instruction.** This section
supersedes v89's parlay architecture only when `parlay/config.json` enables v2.
All legacy parlay sections below continue to describe the currently active app.

- `parlay-next.js` wraps `LeagueParlay.paint`; explicit disabled config delegates
  to the legacy implementation only on devices that have never enabled v2.
  Config failures stay read-only/retryable. `data-parlay-mode` also prevents
  legacy background renders/writes from taking over an upgraded view. New CSS is scoped under `.pn`.
- Picks → Ticket → Season. Compact spread/total/moneyline board; live tracking;
  $10 stake, prior week's low-score reimbursement, individual/weekly history.
- Node 24 `server/app.mjs`, domain/engine/store/collector modules and persistent
  SQLite own v2 state. Atomic game reservations, revisions, role-checked writes,
  immutable last-observed pregame snapshots, public-source background collection.
- Organizer-only “Add actual odds” / “Edit actual odds” on Ticket records the
  placed DraftKings combined American odds per week. Everyone can see the $10
  potential return/profit; tracked kickoff odds/results stay separate. Entries
  can be corrected after kickoff, use monotonic revisions and append an audit
  record. These are placement terms, not a confirmed settlement/payment; pushes
  or voids can change the actual payout. Past tickets retain the entry.
- Source: DraftKings **via ESPN**, not a direct/live-guaranteed DraftKings feed.
  No fabricated prices. Props/missing data need explicit review. Tracker amounts
  are not the actual placed ticket; Zach places the bet outside the app.
- Organizer capability links are private, hash-verified by the service, exchanged
  for random sessions and removed from the URL. Selecting Zach's name is never
  authorization. Ordinary members keep the existing trusted name-selection model.
- New localStorage keys: `lh:parlay-session:v2` (role/token/expiry) and
  `lh:parlay-state:v2` (read-only last snapshot, API-scoped), and
  `lh:parlay-enabled:v2` (last enabled config; prevents unsafe legacy fallback).
  Sessions are scoped to the service/season and organizer controls wait for
  server verification. No capability key
  lives in repo/config/storage. `league.js` routes invite entry to Parlay.
- `scripts/preview-parlay.mjs` runs isolated fixtures; `server/*.test.mjs` covers
  both service behavior and frontend rendering. `scripts/create-organizer.mjs`
  writes private launch packets OUTSIDE the repo; `scripts/import-parlay.mjs`
  imports an authorized offline legacy export. No automatic private-source reads.
- `scripts/activate-parlay.mjs` makes a verified SQLite backup, requires explicit
  frozen-legacy/reconciled-migration assertions and activates only the current
  imported week with zero unresolved rows. Import alone never enables writes.
  `scripts/check-parlay-launch.mjs`, `server/Dockerfile`, `server/railway.json`
  and `PARLAY_RELEASE.md` document deployment, durable storage and safe cutover.
- `npm ci --ignore-scripts` then `npm test` runs reproducible pinned jsdom
  whole-app member/organizer tests, service tests and all existing suites. Tests
  use fixtures only. Clear/re-add revisions remain monotonic; delayed saves
  capture their member/week; shared pick links keep their original entry visible.
- No merge/deployment/live data change occurred. Private Firebase migration read
  was blocked by approval review and was not retried. Browser localhost was
  blocked; mobile visual QA remains pending. A read-only Railway agent capability
  query scoped to Sports-Hub was also blocked by automatic approval review; it
  was not retried. Separate hosting needs explicit approval. See release gates.

## v90 — Accurate season narratives and member storylines (current state)

Season write-ups describe observed results, never extrapolate a one-game record
to 0–14 or 14–0. Week 1 compares the actual score with all other teams (including
ties); later weeks use complete weekly all-play records. Historical comparisons
name the games played and finished-season baseline, with ties at displayed
precision. The personal odds are explicitly ESPN's. Schedule gap is a weekly
rate difference, distinct from History's season-total all-play proxy.

All playoff scoring stories, record ranks, and **Playoff scoring lift** use the
championship bracket (`br === 'W'`). The lift baseline matches each playoff game
to that year's regular-season PPG, weighting both averages by the same games.
The result agrees with all-time playoff PPG and excludes placement/consolation.
The broader postseason record book and head-to-head meetings still include those
games and label their population. No raw historical scores were changed.

Stories remain generated for every manager, with one league card and at least
two on each personal/profile view. New detectors identify deep playoff runs and
unbeaten championship-game records; scoring-title stories add finals context.
Ranks, shared records, scoring titles, titleless-manager comparisons and podium
uniqueness derive their scope/ties. No GOAT/dynasty story is restored. Deduplicate
claim identities rather than coincidentally equal decimals; a podium story
explicitly absorbs the single-score records it already states.

The odds explanation distinguishes completed results from future scoring
estimates. It never declares records pure luck, either forecast necessarily
wrong, or an absent 50% target equivalent to elimination. The target means at
least 50% in a sufficiently sampled simulation bucket, not a clinching rule.
The simulation itself is unchanged. Its view cache keys on **reader plus full
snapshot**, preventing stale what-if narratives after name switches or same-date
score updates. Last-three form waits for three scores; tied games render as T.

Verification: `node checks.js`, `node storylines.test.cjs`, JS syntax checks and
mobile render inspection. The narrative suite checks all twelve identities,
independent championship-game arithmetic, Week 1/ties/missing samples, cache
invalidation and future shared records. Keep these guards when adding stories.

## v89 — Parlay matchup availability (current state)

Each shared pick hides its entire matchup from other readers' boards, including
both sides, spreads, moneylines and totals. The picker can still edit their own
matchup. Clearing or replacing the shared row releases the old game on refresh.
Existing board picks are recognized by whole team-code tokens in their text;
write-in props must include a team code to associate them with a game. Unlabelled
player-only props cannot be reliably associated and are not guessed.
Saving re-reads the shared week and refuses a taken game or an unavailable check.
This supersedes the local-first save policy when the shared store is configured.
No database rules are changed: this is board filtering plus preflight validation,
not an atomic server reservation. Simultaneous saves can still race; a hard
uniqueness guarantee requires a separately authorized backend/rules change.

## v88 — History taxonomy: numbers, stories and trophies (current state)

The five history tabs are now **You · Trophy Case · Record Book · League Lore ·
Cum Bowl**. This is a refiling and rename only; no archive card was removed.

- **Trophy Case** is the former Honors page: trophy case, champions, still
  waiting, Seeds & upsets, and the champion's curse.
- **Record Book** combines the former numerical parts of Records and Leaders,
  ordered Career → league records → playoff scoring → playoff access/record →
  Final fours → January scoring.
- **League Lore** contains the derived narrative views: Storylines, Luck Index,
  and Rivalries.
- **Cum Bowl** still leads with the Cum Bowl and keeps the collapsed season
  archive underneath. **You** is unchanged.

The public key `led` is removed and replaced with `lore`. This is safe because
the selected history sub-tab is memory-only; boot still sets `you` or `hon`.
The legacy `hon` key remains the stable internal key for Trophy Case and the
stranger landing page. `SUBS` remains the single source of truth for labels and
order, and the help sheet derives its tab list from it.

## v87 — Combined rankings and archive refinements

⚠️ **SUPERSEDED in v88 for history tab names and card locations only.** The
rankings design, playoff-PPG definition, GOAT-storyline removal, and all data
rules below remain current.

The owner approved the cream-and-gold combined mockup: three weekly highlights,
compact ranking cards, and expandable season details. Keep this design scoped;
do not add features or change other tabs without a request. **Rankings must not
name an author.** The subtitle is “League rankings. The numbers and the story.”
and the commentary heading is “The write-up”. Saved write-ups are unchanged.
The stored byline remains for backward compatibility but is not displayed here.

`rankings-view.js` derives highlights, scoring ranks (including ties), movement,
rank charts, PPG comparison bars, all-play and recent results. The first team is
expanded initially. Rankings use saved snapshots only, isolate seasons, exclude
future weeks and do not draw lines across missing publications. First editions
show a single dot and no invented movement. Native details controls support
keyboard navigation; long history charts scroll within their card.

The Lab captures optional row index 8 `{scores, outcomes, allPlay}` when publishing.
Only complete available facts are included: Firebase removes null/empty fields,
so omitting them preserves save confirmation. Editing order/commentary preserves
these facts. No new Firebase rules are needed. For pre-v87 Week 1 snapshots,
PPG is the weekly score and a one-game record proves W/L/T. All-play can be
recovered only when all twelve Week 1 scores differ; rounded ties are unknown.
Older later weeks without these details show unavailable values, never invented
history. If only cumulative PPG is available, the highlight says “Scoring leader”
rather than pretending it is the latest week's score.

Additional explicit owner requests in this release:
- **All-time playoff PPG** has its own Leaders table and appears on career/profile
  cards. `bPF / bG` uses only championship-bracket (`W`) games, the same population
  as the playoff record. Each value includes its game count. Placement,
  consolation and Cum Bowl scores are excluded. The existing January comparison
  remains its separately labelled all-bracket population.
- The `dynasty` / GOAT storyline detector is removed. Trophy counts stay intact.
- **Seeds & upsets moves to Honors; Final fours moves to Leaders.** The help copy
  and DOM-derived jump links follow those locations.

Checks: `node checks.js`, `node rankings-view.test.cjs`, and
`NODE_PATH=<jsdom directory> node publishing.test.cjs`. Never test authenticated
writes against production. Publishing/member authorization remains unchanged.
The browser's local-preview policy blocks localhost/file previews in this
session; visual verification is performed against the deployed public page.

## v86 — Parlay quick-nav survives live refreshes

The parlay's live board and shared-picks requests can repaint the tab after the
shell has already built its quick-nav. `render()` replaces `#lg-body` wholesale,
so the shell-generated `lg-sec-*` ids vanished with the old headings while the
visible buttons kept pointing at them. This is why the same buttons worked on
one tap and did nothing on another.

Every parlay `.section-title` now owns a stable, unique `lp-sec-*` id. Any live
repaint recreates the exact destinations the quick-nav already targets. The
parlay laws reject a missing or duplicate destination. The real page was also
driven through the failure sequence: build the nav, force a shared-picks refresh,
and click a chip; every target remained live and the click scrolled to it.

## v85 — Firebase numeric-week arrays (current reader correction)

The owner's recording showed v84 saying it could not reach rankings and refusing
Publish with “A published week could not be read.” His real Week 1 was already
saved correctly. A read of production returned `{"2026": [null, week1]}`:
Firebase serializes dense numeric keys as arrays. `RankingStore.list()` was
validating the null preseason slot as a ranking and throwing before Week 1.

The reader now skips null slots and validates every non-null snapshot. This also
handles gaps after unpublishing. It accepts both numeric-key objects and arrays;
never delete or republish valid user content to repair this serialization shape.
Malformed non-null weeks still fail validation and now receive a data-error
message instead of an incorrect offline claim. Publishing tests use Firebase's
array serialization, replacing the object-only mock that hid this failure.
The recorded live payload was read locally for verification; no production
rankings were changed and no additional rules or sign-in setup is required.

## v84 — Publishing with fewer steps (current state)

**Standing UX preference from the owner: the less he has to do, the better.**
Remember setup and sign-in, resume the action that requested sign-in, and put
routine controls beside the content. Avoid manual export/copy loops.

`ranking-store.js` reads saved ranking snapshots from Firebase and writes one
week atomically with an ETag. `lh:publisher-session` stores the Firebase refresh
token, public API key and UID on this device. Access tokens stay in memory;
passwords are NEVER stored. Reopening either page restores the publisher session
and renews it automatically. Sign-out removes the stored session; storage events
propagate sign-out across tabs, and an in-flight refresh cannot undo sign-out.
Invalid/revoked refresh tokens clear the session; temporary network failures do
not. The UI publisher UID is `34sUlXl2ZebtCJfR97Hz4R9N6Jw1`, supplied by the
owner. Firebase rules remain the actual authority. Updating the allowed publisher
requires updating the rules and this UID together.

`rankings-editor.js` adds Edit rankings / Unpublish to the members' Rankings tab
only on the publisher's device (or offers sign-in on a locally unlocked owner
device). Ordinary members read the same table and have no controls. Edits open
the selected saved snapshot, including its season, and preserve stats/date.
Changing order recalculates movement against the preceding published week.
Writes and deletions explicitly target the selected year/week and require the
ETag, so old-season edits cannot overwrite the current year's same-numbered week.
Draft edits use `lh:ranking-edit:{year}:{week}` and restore only when the original
published revision still matches. Foreground refresh never destroys an editor.
Unpublishing still requires confirmation; routine saving is one action.

The Lab uses the same remembered session and reusable sign-in form. The initial
sign-in continues the pending publish; subsequent weeks need only Publish.
Clearing site data, signing out, private-session expiry or account revocation can
require sign-in again. No additional database-rules change is needed for v84.

User was guided through publisher rules/account setup in this conversation.
Production authenticated writes are not performed by development tests.
`node checks.js` and `publishing.test.cjs` pass with jsdom/mocked Firebase,
including login restoration, refresh/revocation, shared-view edits/unpublish,
member controls, conflict handling, and original snapshot preservation.

### v83 — Direct ranking publishing (historical; sign-in superseded in v84)

v83 replaced the manual JSON/commit workflow with authenticated Firebase writes
and corrected false published confirmations. Its session was memory-only;
v84 replaces that part. `rankings/index.json` remains an outage fallback with an
explicit stale-data message. Firebase is authoritative whenever reachable.
Older sections below describing file exports or copying publish data to chat are
superseded. No model run happens in a member's Rankings view: these are snapshots.

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
  - 🔑 **`hash(phrase)` is the SAME normalise-and-hash `unlock` checks with**
    (v41), exposed for `power.html#newpass`. 🚨 **There is exactly ONE
    normalise-and-hash in the file and both callers go through it.** A second
    path would let the reset tool hand over a value the gate can never match —
    the owner commits it, deploys it, and is locked out of his own tool
    permanently, with nothing on screen able to explain why. `checks.js`
    asserts the single call site, that the value equals an independent SHA-256
    of the normalised phrase, and — the only assertion that answers the
    question he is trusting it with — that **a hash straight from the tool,
    substituted into `HASH`, actually opens the gate.**
    ⚠️ It reveals nothing: anyone can SHA-256 anything, and it says nothing
    about the phrase currently in `HASH`.
  - `crypto.subtle` is https-only, so `unlock` returns `'ok' | 'no' |
    'insecure'` — "wrong passphrase" and "this browser can't check one" are
    opposite problems and the message shown has to say which.
  - 👥 **It also mints and checks GUEST PASSES (v33)** — `invite(who, until)` /
    `accept(token)` / `guest()` / `mayLab()` / `endGuest()`, off a second key
    (`lh:guest`).
    - 🚨 **A GUEST IS NOT THE OWNER, AND THEY ARE TWO DIFFERENT KEYS ON
      PURPOSE.** `is()` stays FALSE on a guest's device, which is the single
      fact keeping the commissioner's name off their name picker (v21 — nobody
      gets to put the app into his voice) and keeping them from minting further
      invites. It is one boolean away from being wrong and **nothing on screen
      would show it**, so `checks.js` asserts it by name.
    - `mayLab()` = `is() || guest()` is the question `power.html` asks; `is()`
      alone still governs the picker and the invite card.
    - ⚠️ **Be as honest about an invite as about the passphrase.** It is a door
      key, not a proof: the repo is public, so anybody who reads `owner.js`
      could craft one — the same bar the published hash already sets, against
      the same eleven relatives. What it genuinely buys is a pass that runs out
      on its own and a passphrase that never leaves his head.
    - ⚠️ **The expiry runs on the GUEST'S clock**, so it is a courtesy to an
      honest person, not a lock on a determined one. `INVITES_FROM` is the
      answer to a determined one: every invite records its issue date, and
      moving that constant forward kills every outstanding pass at once. It
      costs a commit, which is the point — a fire alarm, not a control.
    - `accept()` returns `'ok' | 'bad' | 'expired' | 'revoked'` — four
      outcomes for the reason `unlock` has three: a guest stuck at the gate has
      nobody to ask but the screen, and "ran out" and "arrived broken" send
      them to two different places.
- `rankings-view.js` — saved-snapshot visual derivations and combined Rankings cards; loaded by the app and Lab.
- `rankings-view.test.cjs` — numeric, history, tie, missing-data and safe-rendering regressions.
- `league.js` — the shell: identity, router, jump nav, the rankings view, and
  the **? sheet** (`helpHTML` / `openHelp` / `closeHelp`).
  - 🚨 **`L1` IS FOUR TABS NOW (v69) AND THE EMOJI CAME OFF TO PAY FOR IT.**
    `History` · `Season` · `Rankings` · `Parlay`. `.ai-sub button` is
    `white-space: nowrap; overflow: hidden`, so a label wider than its share
    is simply cut off with nothing on screen saying so — found by comparing
    each button's `scrollWidth` to its `clientWidth`, the only thing that can
    see it. Two tabs never came close; three at 320px left 93px each and
    "📊 This Season" measured over it (v39).
    🚨 **A FOURTH DOES NOT FIT WITH MARKS ON, AND THE MEASUREMENT DECIDED IT,
    NOT TASTE.** Against the FALLBACK font — the one a phone that cannot reach
    Google Fonts renders, which is the number that has to fit (v55) — the
    biggest type four labels fit at:
    **with emoji** 320px 11px · 375px 13px · 390px 13.5px · 430px 15px;
    **without** 15px at every width down to 320px. An emoji costs ~20px of a
    ~67px button and shrinking it does not recover that: at 0.65em it still
    costs ~14px and still clips at 375px. So it was four tabs at 11px on a
    narrow phone or four at 15px with no marks — and **v55 exists because the
    owner asked for this type to be BIGGER**, while the level-2 bar has never
    carried emoji, so the two rows now match. The marks are all still on the
    section headings inside each page, which is where the jump chips read them.
    ⚠️ **Put one back and the row clips at 320, 375 and 390px, in silence.**
    ⚠️ The ? sheet builds its tab list FROM `L1`, so a rename needs no second
    edit; `HELP` supplies only the sentence a tab cannot know about itself.
  It is deliberately small; all the archive logic lives in `history.js`.
  - 🚨 **`paint()` STAMPS `#lg-body` WITH THE VIEW THAT OWNS IT
    (`host.dataset.view = S.view`, v76), AND TWO OTHER FILES REFUSE TO PAINT A
    BODY THAT IS NOT THEIRS.** `#lg-body` is ONE element reused by all four
    tabs, and two of them write into it from work that outlives the tab:
    `season.js` revalidates behind the reader (v42) and `parlay.js` re-asks
    the shared store on `visibilitychange` (v73) — which fires on **every**
    reopen. Neither could ask whether it was still on screen, so the answer
    arrived and overwrote whatever was: the owner reopened on History and got
    the parlay's pick card in the body with History and Leaders both lit.
    ⚠️ **Stamped HERE, at the one place a view change goes through**, and
    BEFORE the body is handed to any view — a stamp written after the hand-off
    is one the view could not have read (the v41 hash-order precedent, and
    `checks.js` asserts the order). A flag kept inside each module would be a
    second copy of a fact the shell already owns, and it would drift.
    ⚠️ **Nothing is lost by refusing**: coming back to a tab repaints it from
    scratch with whatever arrived while you were away — asserted, because a
    guard that always said no would "fix" this by breaking the feature and
    nothing on screen would tell the two apart until somebody's picks stopped
    turning up.
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
  - 🚨 **`labHere()` is a DIFFERENT question from `ownerHere()` (v33), and the
    split is the whole safety of guest passes.** `ownerHere()` — "is this his
    phone" — still governs `pickList()`. `labHere()` = that, or a live guest
    pass, and it governs only the footer's Lab link. Wiring the picker to the
    weaker one would have handed every guest the commissioner's name, which is
    exactly what v21 exists to prevent. A guest's link names the date the pass
    runs out, because a pass that simply stops one morning reads as the app
    breaking rather than as something that was always going to happen.
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
    It quotes "209 bracket games from 13 of 13 seasons" — counts that must
    re-derive, so they stay in `history.js` where the data is. ⚠️ **v56 is the
    proof this rule was worth it**: five seasons of brackets landed and that
    sentence, the Playoff appearances caption and the record's own span all
    re-derived with no edit. A hand-typed "119" would have been the one place
    in the app that lied the day the data arrived.
  - 🔢 **`APP_VERSION` renders in the FOOTER, not the masthead** (v75, owner's
    call). ⚠️ **What matters is that it is on every screen, and it still is** —
    v12 exists because a "this looks wrong" report turned out to be a cached
    build, so the first question is always which version they are running.
    ⚠️ It takes `--gy` in a rule of its own rather than inheriting the footer
    paragraph's `--mu2`: measured, that tone is **2.27:1** and this string's
    whole job is to be legible in somebody's screenshot. It is now **6.2:1**,
    against the **3.11:1** it had in the masthead — so the move made the one
    diagnostic in the app more readable than it has ever been.
    🚨 **The selector must out-specify `.lg-foot p`.** The first cut was
    `:root[data-palette] .lg-ver-l` — (0,3,0) against that rule's (0,3,1) —
    so the muted declaration won and took the whole thing with it, colour,
    size and weight, leaving the version at exactly the contrast the rule was
    written to avoid. Only measuring the render caught it; the CSS read
    correctly and lost. `checks.js` asserts the element and its one writer
    together, because the failure mode of a move is landing nowhere.
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
  - 🚨 **THE TAB BARS ARE `flex: 1 1 auto`, NOT `flex: 1`** (v53), and the
    type is sized against the FALLBACK font. Equal shares gave "You" as much
    room as "Cum Bowl", which was clipping at ≤360px. Content width plus an
    equal share of the leftover. ⚠️ **The row height is pinned by
    `min-height: 38px` with `line-height: 1`**, so type can grow to ~19px
    before the text starts driving the height and everything below it moves —
    that headroom is what this change spends, and the limit is width, not
    height. ⚠️ **Never size these to Archivo**: it is narrower than the
    fallback, so a phone that cannot reach Google Fonts would clip.
  - ⚠️ **`touch-action: manipulation` on the shell AND on every control**
    (v52). Two quick taps on a tab were reading as iOS double-tap-to-zoom, and
    the tab bar is the one thing here that gets tapped in a rhythm. It is set
    twice on purpose: a UA resolves `touch-action` up the ancestor chain only
    as far as the nearest SCROLLING ancestor, so the shell rule alone stops
    working the moment a card or the sheet scrolls. 🚨 **Never
    `user-scalable=no`** — `manipulation` keeps pinch zoom, which somebody
    needs to read this; the viewport meta stays scalable and `checks` for it
    are in the render harness, not the suite (nothing assertable can see a
    gesture).
- `history.js` — **the archive** (~1,130 lines): the curated 13-season data,
  a single-pass stats engine, and every view. Exposes ONE global,
  `window.LeagueHistory`:
  - 🎖️ **`MGR_TEAM` / `mascot(m)` — 🎖️ for the league, 🦅 for the
    commissioner** (v63, owner's call: *"make this the emoji instead of the
    custom by player but leave mine the eagles"*). It sits on the heading of
    the page about a manager — their You tab and their profile.
    - ⚠️ **This reverses v49's per-team mascots, which were also his idea** —
      twelve NFL teams, asked and answered one by one. **His answers are kept
      in the comment above the map rather than deleted**, because re-collecting
      them means asking twelve people again. That is documentation, not dead
      code.
    - 🚨 **v49'S REAL RULE SURVIVES, AND IT IS NOT "EVERYONE GETS THEIR OWN
      MARK".** The fault v49 fixed was that the 🦅 was the **fallback** — so
      every other manager, and every stranger, opened the app under the
      commissioner's bird. Here the 🦅 is an **entry**, reached only by his own
      code, and the fallback is still 👤. `checks.js` still asserts the
      stranger case by name.
    - ⚠️ **A stranger gets 👤, not 🎖️, deliberately.** With eleven managers on
      🎖️ it is effectively the members' mark, so handing it to somebody who has
      tapped no name would tell them they are one.
    - ⚠️ **U+1F396 has `Emoji_Presentation=No` and therefore NEEDS its
      variation selector** — the exact ⚡ trap v49 found, where a font is free
      to draw the bare codepoint as a thin monochrome TEXT glyph. Verified on
      the render: `U+1F396 U+FE0F`, in colour.
    - ⚠️ **🎖️ is also the Final fours section mark on Record Book, and that is
      checked rather than assumed.** They never share a page — the mascot is on
      You and on a profile, Final fours is on Record Book — so the v50 jump-nav
      clash does not arise. It does mean the glyph carries two meanings across
      the app; the owner's call, and worth knowing before a future session
      "fixes" one of them.
    - ⚠️ Keyed by MANAGER CODE, like `MGR_LOGO` and for the same reason: the
      fantasy team names change every September, the twelve people do not.
  - **The playoff résumé is on Record Book (v88).** Final fours, playoff
    appearances/record and all-time playoff PPG are together there. Seeds &
    upsets remains on Trophy Case.
    - ⚠️ **`playoffHTML` was renamed on screen in the same edit.** It headed
      BOTH cards as "Playoff record", which covered the résumé; alone over an
      appearance rate, a heading promising a *record* describes something
      **this app deliberately does not keep** (v19) — the v14 fault, a name
      that makes a number sound like another number. It reads **Playoff
      appearances**, matching the career tile's `Playoff apps` since v10.
    - ⚠️ **Trophy Case closes with 📉 The champion's curse,
      under Seeds & upsets.** It is about what happens to a CHAMPION, so it sits
      with the champions rather than among the Record Book leaderboards. Its mark
      changed from 👑 to 📉 in the same edit: 👑 is the trophy case, two cards
      up, and the jump row is read by its mark.
    - ⚠️ **Final fours became a `.section-title`, not a `.fh-sub`.** It was a
      sub-card *inside* Playoff record, so moving it meant promoting it — and
      that is also what puts it in the jump nav with no second edit, and what
      side-steps the `.fh-sub` badge trap (a 9.5px line box cannot hold a 19px
      badge; measured here at 26px with the badge inside it).
  - 🚨 **`bw`/`bl` — THE CHAMPIONSHIP-BRACKET RECORD, BACK IN v50** (owner:
    *"add record into playoff appearances"*). ⚠️ **This SUPERSEDES the v19
    rule below in one respect only** — that entry's reasoning is why the
    conditions on it are absolute, so read it first.
    - **One population: `br === 'W'`.** The six-team championship bracket —
      R1, the final four, the final. **NOT** the WC placement ladder, **NOT**
      the C consolation ladder, **NOT** the Cum Bowl. That is the definition
      v14 settled on. ⚠️ McD read **10-3** on the 7 seasons then on file —
      the exact figure v14 named, which is how the definition was confirmed —
      and reads **14-6** now that every season is in.
    - 🚨 **65 games across ALL 13 seasons** (35 across 7 until v56, 60 across
      12 until v57). 🚨 **THE v3 ADJACENCY RISK THIS RULE WAS WRITTEN AGAINST
      IS GONE, and v58 says so on the card rather than leaving the old warning
      up.** With a bracket on file for every season, **`bA === po` for all
      twelve managers** — verified — so the record and the appearance rate
      beside it now genuinely share a denominator instead of merely looking as
      though they might. The caption states that the arithmetic closes rather
      than warning about a mismatch that no longer exists. It still prints in
      exactly ONE place and still carries the ⚑, because the *population*
      (championship bracket only) is still narrower than the meetings pool.
    - ⚠️ **Deliberately NOT reconstructed from `s2.final` the way `MEET` is.**
      That would add a final from seasons with no bracket, so the record would
      cover more seasons in its last round than in its first.
    - 🚨 **`bA` — THE NUMBER OF BRACKETS ON FILE, printed beside the record**
      (v51). The owner read his row and asked *"Shouldn't I have 6 losses
      since 10 appearances and 4 titles"* — **and he was right about the
      rule**: a bracket is single elimination, so over a career losses ARE
      appearances minus titles. It read 10-3 because the record covers the 5
      brackets he is in ON FILE, not his 10 appearances. The number was
      correct and the row was silent about its span — **the v3 fault, found
      by the owner in ten seconds.** Every row names its own bracket count now
      (`10-3 from 5 brackets`), so the arithmetic closes on the page.
    - `checks.js` asserts **losses == brackets − titles, PER MANAGER** (v51) —
      the owner's own arithmetic as a law, and **since v57 it is his whole
      career**: every season has a bracket, so `bA` IS the appearance count.
      ⚠️ **Per manager, not summed**: a total stays green while two managers'
      games are swapped. **Re-verified in v58 by flipping one 2016
      championship-bracket result** — both directional totals stay ✅ and only
      this law speaks, naming the two managers affected. It is the only law
      that can catch a bracket game attributed to the wrong person.
    - `checks.js` asserts **title-bracket wins (61) and losses (63)
      SEPARATELY**. ⚠️ **SUPERSEDED the single "70 slots" law in v56**: the
      untracked Ebzery reached the 2013 AND 2014 finals, so over the tracked
      subset `W == L` is legitimately false and a symmetric total was a law
      that merely happened to hold. Two directional totals are strictly
      stronger — they catch an outcome flipped in one direction, which a
      symmetric total never could. Both are still written against the
      *population*, so letting the placement ladder back in overshoots.
  - 🎯 **`seedHTML` — SEEDS & UPSETS COVERS ALL 13 SEASONS (v62).** ⚠️ It
    covered 8 until the owner sent the four remaining brackets; the whole
    "one card that does not cover every season" story is v58-v60 history now.
    - 🚨 **ESPN'S SEEDS ARE TRANSCRIBED, NEVER COMPUTED — AND THE REASON IS
      DIVISIONS.** `calcSeed` guessed from win% then points and got 11 of 13
      seasons; it failed 2013 and 2016 because **the league ran two divisions,
      Nectars and Bologna, and the winners took the top two seeds.** In 2016
      that put an **8-5 team at ${'#'}2 above a 10-3 team**. No arithmetic on
      records or points recovers that, which is why the numbers had to come off
      the bracket page. `calcSeed` is deleted (v62) — dead code whose premise
      was disproved.
    - 🚨 **`checks.js` CONSERVES THE SEEDS AGAINST THE BRACKET'S OWN SHAPE.**
      Byes go to 1 and 2, round 1 is 3v6 and 4v5, every seeded season. **The
      bracket games came from v56's coordinate parser and the seeds from four
      screenshots** — two independent sources — so agreement is evidence, not
      a restatement. Verified by transposing two 2016 seeds: it names the year
      and both symptoms.
    - ⚠️ **2013-2017 seed the bracket SIX only** (7-12 are not on the page), so
      the card's gate is "every championship-bracket game has a seed on both
      sides", not "all twelve rows seeded". ⚠️ And `bySeed`'s comparator was
      fixed in the same edit: `a.seed && b.seed ? … : 0` stops being transitive
      the moment a season is partly seeded, so a missing seed sorts LAST rather
      than "equal".
    - ⚠️ **Both headline sentences are DERIVED from the title counts**, so the
      card re-writes itself as seasons land — which it already did: with 8
      seasons the only line worth printing was the two ${'#'}6 champions; with
      13 the **${'#'}5 seed leads outright on titles and ${'#'}3 and ${'#'}4
      have never won one.**
  - 🏅 **`standingsHTML` — ALL-TIME STANDINGS (v61, owner's ask: *"Lifetime
    standings like w-l and pts for all should be in here somewhere"*).**
    Thirteen regular seasons added up: W-L, win%, points for, points a game.
    - ⚠️ **He was right that it was missing, and the near-misses are why it
      read as present.** The trophy case carries a career W-L as a SUB-LINE
      under a table sorted by MEDALS, and the luck index carries one as the
      "actual" half of a gap. **Career points-for was nowhere in the app at
      all**, and nothing was ranked by record.
    - 🚨 **Sorted by win RATE, and the totals cannot be.** Hyman has 9 seasons
      against everyone else's 13, so ranking on total wins ranks longevity —
      and on total points doubly so: **Hurd leads all-time scoring with 18,235
      while Hyman's 104.9 a game is the best in the league.** Both are on the
      card, the order is the rate, and every row names its own season count
      (the v51 rule).
    - ⚠️ **Competition rank, like `signature` since v58** — McD and Zach are
      both 93-81, Gotch and CC both 88-86.
    - ⚠️ **`tag('reg')`, never `fin`.** The order here is the REGULAR SEASON
      and it disagrees with the trophy case constantly — Wolff is first with
      no title. The caption says so, rather than leaving two tables on two
      tabs to quietly contradict each other.
    - ⚠️ It reuses `.fh-po`'s shape (name + record on one line, context on a
      full-width second) because five columns on a phone squeeze the name —
      the v39/v52 finding. `checks.js` conserves career W, L and points-for
      against the season rows they were summed from.
  - 🔥 **`januaryHTML` — PLAYOFF SCORING LIFT (v90).** Reads the same
    `ST.era` as the scoring story detectors. Championship bracket only; each
    playoff score is matched to that manager's regular-season PPG in that year.
    Both averages use identical playoff-game weights, avoiding different era
    mixes. Each row names its sample size and agrees with the playoff PPG card.
    This is descriptive scoring evidence, not proof of repeatable clutch skill.
  - 🚨 **NO OTHER BRACKET W-L EXISTS (v19, owner's call:
    *"Title brackets have to be changed to final 4s everywhere"*).** A
    manager's playoff résumé is **final fours**, then finals, then titles.
    - The data still files three brackets as `br`: **W** the championship
      bracket (six teams — round 1, the final four, the final), **WC** the
      placement ladder below it, **C** the consolation ladder for the six that
      missed (GmC1-9, of which **GmC3 is the Cum Bowl** — round one, the 11
      seed against the 12. ⚠️ **v66 moved it to `GmC9` and v79 moved it back
      on the owner's word**; see the Cum Bowl section below).
      None of them produces a W-L on a manager.
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
  - 🚨 **`careerCard`'s year strip is sized by the MANAGER'S season count, not
    by 13** (v64, owner: *"fix this view for Hyman since he's got less total
    seasons"*). `.fh-car` was `grid-template-columns: repeat(13, 1fr)`, so a
    manager who has not played all thirteen filled the FIRST n columns and left
    the rest of the card empty — **Hyman's nine squares stopped two-thirds
    across** and Riz's eleven stopped short too. `careerCard` sets `--n` inline
    from the row count; the CSS reads `repeat(var(--n, 13), minmax(0, 1fr))`.
    ⚠️ `minmax(0, 1fr)` rather than `1fr`, because a bare `1fr` floors at the
    content's min-width and that is how a grid silently overflows.
    ⚠️ **Only the LAYOUT was wrong — every number on that page was already
    right** (`6/9` playoff apps, `3/9` final fours, "6 of 9 seasons" in the
    storyline). The stats engine has always counted a manager's own seasons;
    it was one hard-coded 13 in a stylesheet.
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
  - `SUBS` — the five history sub-tabs, **in display order**: You · Trophy Case ·
    Record Book · League Lore · Cum Bowl (v88). Cum Bowl still absorbs Seasons;
    "You" remains first.
    - 🚨 **IT STAYS AT FIVE, AND THAT IS THE CONSTRAINT, NOT A COINCIDENCE.**
      v55 measured this bar clipping silently at 320px and had to move to
      `flex: 1 1 auto` to fit the labels it already had. So v65 paid for the
      new tab by MERGING two: Seasons went under Cum Bowl. **A sixth tab is
      not a free action here** — measure `scrollWidth` against `clientWidth`
      on every button at 320px before adding one.
    - Reordering is that array alone; `VIEWS` is a map and `league.js` just
      walks `SUBS`, and so do the sub-tab bar, the ? sheet's tab list and
      `checks.js`.
    - 🚨 **The FIRST tab is not the LANDING tab, deliberately (v45).** `you`
      with nobody picked is an invitation card and a "Choose my name" button —
      right as a destination, wrong as a front door, because a stranger would
      open the app on a nag with no archive behind it. `league.js`'s boot lands
      a reader who HAS picked on `you` (the v1 rule, which `choose()` already
      followed) and everybody else on `hon`. **Reordering `SUBS` does not
      change where the app opens**; that is one line in boot.
  - `view(key)` — `hon` · `you` · `rec` · `lore` · `cb`. `hon` is the stable
    internal key for Trophy Case; `rec` is Record Book; `lore` is League Lore.
    ⚠️ **`sea` is gone** (v65): the seasons render under `cb`. The old `led`
    key is also gone (v88). Both are safe to delete because `S.sub` lives in
    memory and boot only ever sets it to `you` or `hon`, so no device can hold
    a pointer at a removed view.
    - 🚨 **RECORD BOOK IS THE NUMBERS; LEAGUE LORE IS THE STORIES (v88).**
      Record Book holds 🏅 All-time standings · 📕 The record book · 🏈 All-time
      playoff PPG · 📊 Playoff appearances · 🎖️ Final fours · 🔥 Who shows up
      in January. League Lore holds 📌 Storylines · 🎲 The luck index ·
      ⚔️ Rivalries. Seeds & upsets stays on Trophy Case.
    - 🚽 **`cb` LEADS WITH THE CUM BOWL AND THE SEASONS FOLLOW** (v65, owner:
      *"Cum bowl is the prize of those tab. When I click it I want cum bowl.
      Then seasons can be offered but out of the way"*). Nothing auto-expands
      any more, so the page is one card and then a tidy list of thirteen years.
      ⚠️ **This cost the year chips and that was the trade.** `buildJump` uses
      `.section-title` when a page has two or more and only falls back to
      `<details>` summaries otherwise — so a second heading on that page turns
      13 year chips into 2 section chips. The years are still one tap each in
      the list; jumping straight to 2019 from the chip row is gone.
    - 🚽 **THE CUM BOWL IS `GmC3` — THE 11-SEED v 12-SEED GAME, ROUND ONE OF
      THE CONSOLATION LADDER, AND IT DECIDES 11th AND 12th (v79, owner: *"The
      cum bowl is 1st round of playoffs between the 11th and 12th ranked team
      immediately following the regular season"* and *"losing the cum bowl
      does make u finish last… we don't give a shit about the losers
      bracket"*).**
      - ⚠️ **v66 moved it to `GmC9` and every number on the tab was wrong for
        thirteen versions.** The 2022 card read *Slemp 91.5 · Hurd 72.0* where
        the league means *Slemp 108.9 · CC 92.6*. He found it by opening the
        2022 loser bracket and reading it against the tab.
      - 🚨 **THE PLACINGS ARE THE LEAGUE'S RULE OVERRIDING ESPN'S, IN 9 OF 13
        SEASONS, AND HE WAS SHOWN THE COLLISION BEFORE A ROW MOVED.** ESPN
        settles 11th/12th with `GmC9`, so its pages have Hurd last in 2022
        while the Cum Bowl loser is CC. `cbPlaced` applies the league's rule
        at the SEASON build — **the transcribed rows are untouched**, so the
        evidence the archive was built from survives and one `return` undoes
        it. 41 placings moved across 9 seasons.
      - ⚠️ **The sharp edge, stated rather than discovered later:** the Cum
        Bowl WINNER is 11th even when they went on to win the whole ladder.
        Gotch won the 2023 Cum Bowl and then two more games — ESPN scores him
        7th, this scores him 11th. Same for McD in 2021 (ESPN 8th) and Gotch
        again in 2020. That is what "11th and 12th are decided in the cum
        bowl" means; softening it is one line.
      - ⚠️ **`s11`/`s12` are the SEEDS and the winner is read off the SCORES**
        — two facts stored apart, because they disagree: in 2022 the 12 seed
        won it and is 11th while the 11 seed lost it and is last. v66 made
        them one field, which is how both went wrong together.
      - ⚠️ **The 11/12 seeds are transcribed where ESPN published them
        (2018-24) and derived where it did not** (2013-17 seed the bracket six
        only). The derivation — win% then points inside the consolation six —
        reproduces the real seed in **all 7 seeded seasons** and matches the
        11/12 assignment hand-typed back in v65 in **all 5 unseeded ones**.
        Two independent sources, 12 of 12, and `checks.js` holds both.
      - 🚨 **AND v66 LEFT A SECOND DEFINITION BEHIND IT.** `MEET` has tagged
        `GmC3` as `kind: 'cb'` since v1 and v66 never touched it, so from v66
        to v78 a head-to-head row called 2022's *Slob on my Cobb v London
        Silly Willies* a Cum Bowl while the tab showed a different game. **One
        file, two answers, thirteen versions, every law green** — because
        every law was over TOTALS, which cannot see which game they counted.
        `checks.js` ties the two together now.
    - 🚽 **The Cum Bowl table is FOUR columns since v67** — played · lost ·
      **PTS/G** (owner: *"Add points per game in the cum bowl for this
      sections. Feels info light"*). `cbPF` is summed in the same walk of
      `CUMBOWL` that records the appearance, so the count and the points it
      averages can never come from two readings of one game.
      - 🚨 **THE LAW FOR IT IS PER MANAGER, AND THE SUMMED ONE WAS WRITTEN
        FIRST AND THROWN AWAY.** Swapping the two scores inside one Cum Bowl
        conserves every total in `checks.js` — the appearance counts cannot
        see it (v66: a count cannot see WHOSE game it counted) and neither can
        a summed `cbPF`. Fault-injected on 2019 before the law existed: six ✅
        and the card printing both managers' PTS/G the wrong way round. The
        v51 rule, learned a third time.
      - ⚠️ **The caption's gap is measured against EACH game's own season**
        (`lgPpg`), never a 13-year average — the league scored 90.6 a game in
        2013 and 108.5 in 2018, so a flat baseline would report the era. It
        reads **86.7 a game, 13.5 below the league that same season; the
        winner 98.5, the loser 74.8** — all four derived.
      - ⚠️ **The column itself is raw and the caption says so.** These are 1-8
        games each, so most rows are a scoreline or two rather than a scoring
        average, and that sample is a bigger caveat than the era is. The
        alternative — a per-manager gap against their own regular season, the
        `januaryHTML` shape — is the honest ranking if this ever wants sorting
        by it; the table is sorted by PLAYED, so it does not rank on points.
      - 🚨 **PTS/G TAKES THE SAME `--gy` AS THE COLUMNS BESIDE IT.** The first
        cut gave it `--mu` to read as secondary: measured on the render,
        **rgb(138,130,114) on white is 3.46:1**, under the 4.5 a 12.5px number
        needs — and it is the exact tone the ⚑-badge bullet above already
        names as the one nobody spots mid-page. It is also the newest thing on
        the card, so printing it fainter than the counts was backwards twice.
        ⚠️ No `--pos`/`--neg` either: scoring a lot in a Cum Bowl is not good
        news and scoring little is not bad news (v189's semantic-colour rule).
      - ⚠️ **`.neg`/`.pos` on the LOST column is INERT and has always been.**
        `#fantasy-history .neg` needs an id this app does not have and
        `.fh-prof .neg` never wraps this table, so `.fh-cbt-r span`'s `--gy`
        wins everywhere — measured, LOST renders the same grey as PLAYED.
        Deliberately left alone in v67: nothing on screen is wrong, and
        turning it red is a design change nobody asked for. See Open / next.
  - `profile(mgr)` — the drill-down every name opens
  - `setMe(mgr)` / `me()` / `name(mgr)` / `roster()` — identity
  - `key()` — the three-badge provenance key, for the ? sheet in `league.js`
- `season.js` — **the season still being played** (v39). One global,
  `window.LeagueSeason`, one entry point `paint(host, crest)`.
  - 🚨 **`render()` REFUSES A BODY IT NO LONGER OWNS (`ownsHost()`, v76).**
    It has revalidated behind the reader since v42, so an answer routinely
    lands after they have switched tabs — and `#lg-body` is the same element
    for every view, so the season painted itself over whatever was there.
    ⚠️ **This was a live fault here too, not a precaution taken by analogy**:
    the render harness holds `season/current.json` open for two seconds and
    the season lands on top of History with the guard removed. It was found
    by analogy (the v3 lesson — fixing the tab somebody pointed at while the
    same fault sits one file over), and then it was *reproduced*, which is the
    difference between a guard and a guess. ⚠️ The stamp it reads is set by
    `league.js`'s `paint()`; see that bullet for why it lives there.
  - 🚨 **IT FETCHES ESPN, AND THE PUBLISHED FILE IS THE FLOOR (v42).**
    ⚠️ **SUPERSEDED the v39 design**, which read only `season/current.json`.
    That made the commissioner PUBLISH the standings — and the copy saying so
    is what exposed the fault: **rankings are an opinion column and must not
    silently re-derive; standings, odds and matchups are facts and should just
    be current.** Applying the rankings model to facts was the mistake.
    - **Three sources, in order:** this phone's last good copy (`lh:season`,
      instant) → the published snapshot in the repo → the network, behind the
      reader. Never awaited before paint: measured, **first paint 297-357ms
      against a deliberately 2-second backend**, so nobody ever sees a spinner.
    - 🚨 **THROTTLED ON THE NFL SCHEDULE** (v43, the owner's point): **10
      minutes inside a game window, 12 hours every other hour of the week.**
      A flat throttle stops twelve phones stampeding but does not stop them
      WAKING a sleeping service all week — and Render's free tier is metered
      in instance-hours, not requests, so keeping it awake is the actual cost.
      Nothing can change on a Wednesday. Verified: a cache one minute old
      makes **zero** calls, and `checks.js` fails if the two throttles ever
      invert.
      ⚠️ It reads the DEVICE's clock, so a wrong timezone shifts the window by
      those hours — the only consequence is slightly more or fewer refreshes,
      never wrong data. ⚠️ And deliberately NOT derived from the scores
      instead: before week 1 every score is 0, which is indistinguishable from
      "games pending", so the data alone would hold the short throttle open
      for days in exactly the stretch this is meant to quieten.
    - ⚠️ **It never DEPENDS on the backend.** Asleep, dead, or an expired ESPN
      cookie all degrade to the last real data with a line saying which — the
      hard constraint survives, and that is what keeps this safe to hand to
      eleven other people.
    - **Four states, four facts** (`freshLine()`): straight from ESPN · saved
      on this phone · the last published copy · and "the live data didn't
      answer" — which is a different sentence from "checking", the distinction
      this app keeps insisting on.
  - 🚨 **`isMe` IS A TRAP AND IS NEVER READ HERE.** The season payload flags
    the team of the account the BACKEND authenticates as — the commissioner's,
    on every device that ever asks. A members' app reading it would badge HIS
    team as THEIRS on eleven phones. That is the v33 byline bug exactly. The
    snapshot carries manager CODES from `mgrFor` instead, the same mechanism
    index 7 of the rankings payload already ships for the same reason.
  - ⚠️ **Every comparison with the archive is ERA-RELATIVE.** `LH.career()`
    hands over `rel` — points a game against the league *that same year* — and
    this file compares `rel` to `rel`. A raw 2026 ppg against raw 2013-25 ppgs
    ranks seasons by WHEN they happened, because scoring has climbed; that is
    the `relPpg` rule the storyline detectors already follow.
  - **v90 narrative rules:** observed records plus weekly all-play; no projected
    final record. Historical scoring ties are stated. Odds caches include reader
    and full snapshot; missing 50% targets never establish elimination.
  - ⚠️ **Season-level facts only.** The archive holds season totals, not
    week-by-week scores, so nothing here can say "your best START" or "you
    have never lost three in a row" — those are facts about a shape the data
    does not have.
  - ⚠️ **Preseason invents nothing** — the Lab's rule since v1 ("a fabricated
    0-0 beside a name is a lie"), applied to the members' app. Zero games means
    no ppg, no `rel`, no luck and no standings table, because twelve identical
    rows of zeros is not a standings table. What IS real before week 1 is the
    odds, the schedule and who you play, so the page opens on those.
  - ⚠️ **The week is DERIVED from the scores, not read off `wk`.** ESPN's
    pointer advances on its own clock and a snapshot can be taken either side
    of it; how many weeks carry a score never is ambiguous, so "next week" is
    one past that and it agrees with the standings on the same page by
    construction.
  - **Four states, four sentences** (`EMPTY`): nothing published · the file
    404s · offline · the file is there and unreadable. `season/current.json`
    SHIPS with an empty `t` so an unpublished season answers 200 — which is
    what makes a 404 reportable as a broken deploy rather than as business as
    usual. `checks.js` asserts the file ships.
- `parlay.js` — **the weekly group parlay** (v69), `window.LeagueParlay`, one
  entry point `paint(host, crest)`. Twelve managers, one NFL bet each, all on
  one ticket.
  - 🚨 **EVERY `.section-title` HAS A STABLE `lp-sec-*` ID.** The shell builds
    the quick-nav after `paint()` returns, but the live board and shared-picks
    requests finish later and `render()` replaces every node in `#lg-body`.
    The generated `lg-sec-*` ids were attached to the discarded headings, so
    the still-visible quick-nav buttons often pointed at nothing. A parlay
    repaint now recreates the same destinations before the reader can tap;
    `checks.js` refuses an unkeyed or duplicate parlay heading.
  - 🚨 **`render()` REFUSES A BODY IT NO LONGER OWNS (`ownsHost()`, v76), AND
    THIS FILE IS WHERE THE OWNER SAW IT.** Every write to `#lg-body` goes
    through `render`, so the guard only has to be there — and it has to be
    there, because the callers are the problem: a picks fetch, a board fetch,
    and a `visibilitychange` handler that fires on every reopen with
    `force: true`. Any of them resolves long after the reader has moved on.
    ⚠️ **It reads the SHELL's stamp rather than a flag of its own** — `paint`
    is never told when its view is torn down, so a local "am I visible"
    boolean would have to be maintained from outside anyway, and the moment it
    drifted this would be back to painting over other people's pages.
    ⚠️ **Refusing costs nothing**: returning to the tab repaints from scratch
    with the newest list, which is asserted in both directions.
  - 🚨 **IT IS THE ONE TAB WHOSE FACTS ARE TYPED IN, AND IT SAYS SO ON THE
    PAGE.** Everything else in this app is derived from the archive precisely
    so it cannot go stale; a bet has no such source — the pick, the price and
    whether it landed come off a betting slip by hand into
    `parlay/current.json`. The card states which half is transcribed and which
    half is worked out, because the alternative is letting a reader assume the
    same provenance the rest of the app has earned.
  - ⚠️ **AND EVERYTHING WITH A NUMBER IN IT IS STILL DERIVED** — the combined
    price, the payout, every record, every rate, every rank. A hand-typed
    "+414,491" beside twelve legs would be the one number on the page that
    lies the moment a leg is corrected, **and a leg WILL be corrected**:
    results get entered wrong on a Sunday night. Correcting one leg corrects
    the whole tab.
  - 🚨 **A PUSH DROPS OUT OF THE PRICE AND DOES NOT KILL THE TICKET**, which
    is what a book does with one and the only rule here that is not obvious
    from the slip. Wrong in either direction it is silent: treated as a loss,
    a live parlay reads dead; left in the multiplication, every payout for the
    rest of the season is quietly too big. ⚠️ **It is out of the COUNT for the
    same reason** — a ticket of eleven wins and a void leg cashed, and the
    first cut printed it "11/12", a complete ticket reading as though a leg
    had missed. If a void leg is out of the arithmetic it is out of the
    denominator, or the two numbers on one card describe different tickets.
  - ⚠️ **One conversion each way** (`dec`/`amer`), and every caller goes
    through it. Two implementations of one conversion is how a payout and the
    price above it end up disagreeing about the same ticket, both nearly
    right. 🚨 **±100 is the one price that cannot round-trip** — even money is
    decimal 2.0 written two ways — so the law asserts the round-trip outside
    ±100 and asserts even money separately. The first cut of that law reported
    a fault in correct code, and a law that cries wolf gets ignored.
  - **Four sections:** 🎲 this week's ticket (the legs, the price, the
    verdict) · 📋 the season so far · 🎯 who carries the ticket · 📖 every
    ticket. Four `.section-title`s, so the jump nav picks them up with no
    second edit.
  - 🚨 **THE VERDICT IS THE POINT OF THE TAB, AND THE SOLE ASSASSIN IS THE
    BEST LINE IN IT.** One losing leg gets its own sentence — *"One leg.
    Yours is the only one that missed — and it cost the other eleven."* —
    rather than being folded into a list. ⚠️ **The dead branches key on HOW
    MANY LEGS MISSED, not on the status**: a fault injection that made a push
    kill the ticket produced `status: 'dead'` with an empty loser list, and
    this function printed the word "undefined" into the sentence under the
    ticket. Unreachable in correct code, one bug from being the first thing on
    the page.
  - ⚠️ **Ranked by hit RATE and every row names its own denominator** (the v51
    rule) — somebody who sat a week out has fewer legs, and two rates over two
    denominators is not a comparison (v3). Pushes and pending legs are in
    neither half of the rate, and the card says so. **Competition rank with an
    `=` for joint** (v58), never array position.
  - 🚨 **ALL TWELVE ARE ON THAT TABLE, PICKED OR NOT (v78, owner: *"each
    persons w-l record for the year"*).** Built from the legs alone it was a
    list of whoever had happened to put one in, so a manager sitting the
    season out was simply **absent from the one card that is the league's
    running record** — the v7 coverage fault in a new costume, landing again
    on the person it is least fair to, since "has not been putting a leg in"
    is exactly what this card could usefully say and it said it by saying
    nothing. Seeded from **`LH.roster()`**, never a list typed out here.
    - ⚠️ **A row with no legs prints NO record, not `0-0`** — that is the
      Lab's oldest rule (v1: *a fabricated 0-0 beside a name is a lie*), and
      `0-0` would read as a settled nought-and-nought rather than as somebody
      who has not been in. Three states, three sentences: no leg all season ·
      legs in with nothing settled · a real record.
    - 🚨 **AND THE ROSTER ROWS MADE A NON-TRANSITIVE COMPARATOR REACHABLE.**
      The sort read `y.rate == null ? -1 : …`, which answers −1 whichever way
      round it is asked for two managers who both have nothing settled — the
      `bySeed` fault (v62). Week 1 of a season is twelve unrated rows side by
      side, and measured, the old one simply **reversed the roster** and never
      reached its own tiebreak. Unrated rows are in NAME order now, which is
      the one order a reader can account for. ⚠️ **The first law written for
      it was vacuous** — it compared two derivations of one input, and V8
      sorts twelve items with an insertion sort that is deterministic even
      when the comparator is not. It asserts the order the rows must be IN.
  - ⚠️ **The sample caveat is DERIVED from how many tickets are in**, so the
    card stops apologising by itself once there is a season behind it.
  - ⚠️ **Odds are spelled with a HYPHEN, not the app's typographic minus.**
    Everywhere else a negative number takes U+2212, but odds sit on the same
    line as the pick they belong to, and "Eagles -3.5" beside "−115" is one
    line in two different dashes. A price is quoted text off a slip.
  - ⚠️ **The provenance mark is ✍️, deliberately not ⚑.** The flag is the
    archive's *playoffs only* badge with a specific meaning in the ? sheet's
    key; borrowing it for a different kind of caveat teaches a reader that one
    glyph means two things — the v50 icon-clash rule, applied across pages.
  - 🎯 **THE TWELVE PICK IN THE APP, AND THE PICKS TRAVEL BY LINK (v70,
    owner's ask: *"each person has to be able to pick there game in the app
    for parlay. And then someone takes the ticket and bets it on a book"*).**
    A reader writes their bet and its price, the app saves it on that phone
    and turns it into a line for the group chat; whoever is placing the bet
    pastes the chat into the collector, which finds every pick in it and
    assembles the ticket.
    - 🚨 **THERE IS NOWHERE TO WRITE, SO THE CHAT IS THE TRANSPORT.**
      ⚠️ **SUPERSEDED in v73 when `sync` is set** — there is somewhere to write
      now, and it is the reader's own Firebase store rather than anything in
      this repo. With `sync` blank, which is how the file ships, every word
      below is still exactly what happens. This is
      a set of static files with no account and no server — the one hard
      constraint the app has never bent. A pick therefore travels the way the
      Lab's shared rankings already travel, as a payload in a link
      (`index.html#p=…`), except pointed the other way: the Lab sends one
      payload to twelve people and this collects twelve into one.
    - ⚠️ **BE HONEST ABOUT WHAT THAT DOES NOT BUY, AND THE CARD IS.**
      ⚠️ **SUPERSEDED in v73 when `sync` is set**, which is the version that
      spent what Open / next had costed. Everyone
      sees every pick *in the chat* as it is made, and everyone sees the
      finished ticket in the app. What it cannot do is show the other eleven
      picks INSIDE the app before the ticket is assembled. Saying so beats
      implying a sync that is not there.
    - 🚨 **A PICK IS NOT A CREDENTIAL.** The payload carries a manager code, so
      anybody could craft one in somebody else's name — the same bar the
      published passphrase hash sets, against the same eleven relatives. What
      protects the ticket is that the collector SEES every leg with a name on
      it before it goes to a book. **Two picks from one manager are reported
      rather than silently resolved** (the later one wins, and the card says
      so): quietly picking one is how a leg nobody meant reaches a book.
    - 🚨 **THE SHARED LINE CARRIES THE REAL NAME, NEVER `nm()`.** That helper
      answers "You" for whoever holds the phone, and this string is read by
      the other eleven — a pick shared by Buley would arrive in the chat as
      *"You: Bills -7"*. The v33 byline bug, one feature over, and now a law.
    - ⚠️ **UTF-8 before base64url.** `btoa` is Latin-1 only and a bet is free
      text off a phone keyboard: one emoji, one curly quote, one em-dash and
      it throws. The Lab learned this on takes.
    - ⚠️ **A phone's minus is U+2212 as often as a hyphen**, and reading it as
      a plus would silently invert the leg — the sign IS the bet. `parseOdds`
      normalises it and refuses anything that is not a whole number of at
      least 100 either way.
    - 🚨 **THE OPEN WEEK IS DERIVED WHEREVER IT CAN BE.** `open` in the file
      names the week; otherwise picks are for the week after the newest
      ticket. So the first week of a season needs one line and every week
      after it needs nothing — and **a week that already has a ticket is
      closed**, because a pick then is a pick at a game that has kicked off.
      - 🚨 **AND A STATED `open` IS ONLY HONOURED WHILE IT IS AHEAD OF THE
        NEWEST TICKET (v78).** `open` is the one hand-kept field on this tab,
        so it is the one that goes stale, and it went stale in two directions
        and both were silent. Sitting **on** the week just published it
        returned null and the pick card **vanished** — a symptom this file
        used to document as something to remember to edit around, which is a
        hand-kept fix for a hand-kept field. Sitting **behind** the season —
        which is what a week that never gets a ticket leaves behind, and
        **week 1 of 2026 is exactly that** — it went on offering picks, with
        that week's board, for games played a month ago, under a ticket card
        reading Week 5. **Reproduced on the render before it was fixed.**
        The newest ticket decides; the stated week only wins in front of it.
      - ⚠️ **The board does not travel with an overtaken week.** Once the
        stated week is passed its games belong to a week that has been played,
        so carrying them forward would put last month's fixtures under this
        week's heading — worse than no board, which renders the prop field and
        says so.
      - ⚠️ **So a week that takes no ticket costs ONE edit, once.** Nothing
        published can advance past a week that never had a ticket, so `open`
        still has to be moved by hand that once; every week after it heals
        itself the moment a ticket lands.
    - ⚠️ **A name is needed to put a LEG in, and that is not a gate.** Every
      table on the page still renders for a stranger; a bet belongs to a
      person, so the one thing that cannot be anonymous is the one thing that
      asks — with the picker one tap away, worded as an invitation.
    - ⚠️ **Its listeners are registered behind a `typeof document` guard**,
      because `checks.js` requires this file in node. A bare
      `document.addEventListener` at module scope throws on load and takes
      every parlay law with it — a crash instead of a fault, which is the
      least useful failure a check can have.
    - ⚠️ **A status line belongs to ONE card** (`say(txt, where)`). A single
      shared string rendered into every `.lp-say` printed "Saved. Send it to
      the chat" under the collector as well — one event reported twice, the
      second time about something the reader never did. Only a render showed
      it; there is a law for it now.
    - ⚠️ **Each share button NAMES the box it sends** (`data-lp-for`). The
      first cut picked one by position and happened to be right — a thing
      that works by accident stops working the day a fourth field is added,
      silently, by sending the wrong text.
  - 👥 **THE PICKS CAN LAND IN EVERYBODY'S APP (v73, owner: *"That apps don't
    get stored and saved through the app? Why not"*, having asked three
    times).** With `sync` set in `parlay/current.json`, saving a pick writes
    it to a Firebase Realtime Database and the tab grows a **👥 who is in**
    card showing all twelve as they come in. With `sync` blank — how it ships
    — every line of it is dead and the tab is exactly the v72 app.
    - 🚨 **THE ANSWER TO "WHY NOT" WAS THAT THERE WAS NOWHERE TO WRITE, AND
      THAT IS A FACT ABOUT HOSTING, NOT A DESIGN PREFERENCE.** GitHub Pages
      hands files out; nothing in this project accepts anything back. The
      three honest routes were his Render backend (a different repo, a
      free-tier cold start, and **unreachable from this sandbox**, so
      untestable here), a keyless third party, or nothing. He picked
      Firebase. **The hard constraint survives intact**, because the store is
      an upgrade over the chat path and never a dependency of it — the v42
      doctrine, pointed at a WRITE for the first time.
    - 🚨 **EVERY ROW IS UNTRUSTED INPUT AND GOES THROUGH THE SAME `checkPick`
      A PASTED LINK GOES THROUGH.** The repo is public, so the URL is public,
      so the store is world-writable by design: a row can name somebody who
      is not in the league, carry a price that is not a number, be an empty
      string or not be an object at all. `rowsToLegs` drops each and COUNTS
      it, and the card says how many it dropped. ⚠️ **One validator, not two**
      — two would eventually disagree about what a leg is, which is the v14
      fault.
    - 🚨 **A SYNCED PICK IS STILL NOT A CREDENTIAL, AND THE CARD SAYS SO IN
      THOSE WORDS.** There is nothing to sign in to; anybody who reads
      `parlay.js` could write a row under any name — the same bar the
      published passphrase hash sets, against the same eleven relatives. What
      protects the ticket is unchanged: a person reads twelve legs with twelve
      names on them before it goes to a book. A law asserts the sentence,
      because a shared list that *looked* authenticated would be worse than no
      shared list.
    - 🚨 **ONE RESOLVER FOR THREE ROUTES.** A leg now arrives by pasted chat,
      by tapped link and by the shared list, and all three end in `takeLeg` —
      `takeOne` is only the decoding step in front of it. A second copy of
      "later wins" would eventually disagree about which of two picks is on
      the ticket. A law asserts the store and the chat produce a
      byte-identical leg from the same pick.
    - ⚠️ **THE STORE IS A MIRROR, NEVER THE SOURCE OF YOUR OWN PICK.**
      `lh:pick` is written first and cannot fail; the `PUT` happens after. So
      a dead store costs the other eleven a live view and costs the picker
      nothing — their leg is saved and their chat line is on screen
      underneath it. Four states, four sentences (checking · this many in ·
      the last list that came through · could not reach it).
    - 🚨 **THE CHAT BOX DISAPPEARS ONLY WHEN THE PICK IS ACTUALLY OUT** (owner,
      on the live store: *"Remove that send it to chat part that's big and
      ugly nobodies ever doing that"*). He is right that it is clutter once
      the store works — and it is also the ONLY route a leg has when the
      store is off or the write is refused, so deleting it outright would
      strand a pick silently, with the reader believing they had sent it.
      `mineIsUp` asks whether the reader's own code is in the fetched list, so
      the box renders in exactly the two states where it is the way through.
      ⚠️ **Derived from the list, never a `sent: true` flag on `lh:pick`** —
      that would be a second copy of a fact the store holds, and it would go
      on claiming "sent" after a row was overwritten or the URL changed.
      ⚠️ A successful `PUT` writes the row into `P.picks` immediately rather
      than clearing and re-fetching: the 200 IS the confirmation, and clearing
      first made the box flash back for one frame at the exact moment it had
      been earned.
    - 🚨 **THE CACHE IS PRIMED BEFORE THE FIRST PAINT, AND THE ORDER IN
      `paint` IS LOAD-BEARING.** The first cut read `lh:picks` inside
      `refreshPicks`, which `paint` calls AFTER `render()` — so the opening
      paint always drew an empty list, and a cache younger than the 30s TTL
      then returned early without rendering at all. **Five picks in
      localStorage and "0 of 12 picks are in" on the screen.** This is the
      Lab's v25 fault exactly (there the cache existed from v1 and was only
      used when the fetch FAILED; here it was read and never drawn) — *a
      fallback and a first choice are different jobs*. `checks.js` asserts it
      twice, because neither half is enough on its own: the helper works, AND
      `primePicks` appears before `render()` in `paint`'s source (the v41
      hash-order precedent).
    - 🚨 **A REPAINT HAPPENS ONLY WHEN THERE IS NEWS, AND THE FOCUS GUARD
      COVERS ONLY A CARET.** The first cut skipped any repaint while a BUTTON
      had focus — which is true of the tab button the reader has just tapped,
      so **the answer to the very first fetch was thrown away** and the card
      went on offering the chat box for a pick that was already shared. The
      v25 rule was aimed at the wrong risk: the unrecoverable harm is a lost
      caret (INPUT/TEXTAREA), and the thumb risk is removed at the source
      instead — an answer identical to what is on screen does not render at
      all (`sameRows`). `force` overrides both, because an explicit Refresh
      has to clear its own "Checking…" even when nothing changed.
    - ⚠️ **Pulling the list into the ticket is a TAP with a count on it**, not
      a silent merge: it changes what somebody is about to put money on, and
      it reports what it did — including duplicates, which are still reported
      rather than resolved quietly (the v70 rule).
    - 🧹 **CLEAR MY PICK TAKES THE ROW OFF THE SHARED LIST (v75, owner:
      *"Allow option to clear pick from selection just like the change pick
      option"*), AND THE ORDER OF THE TWO WRITES IS THE WHOLE CARE IN IT.**
      The DELETE goes FIRST and `lh:pick` is cleared only if it succeeds —
      the opposite order would leave the reader with no pick on their own
      phone while the other eleven, and the ticket, still carried their bet.
      That is the worst possible split, so **a refused delete changes nothing
      and says why**. ⚠️ It is the mirror of SAVING, where the local write
      goes first because it is the one that must not fail: a save adds and a
      clear removes, so they are not symmetric.
      ⚠️ **`data-lp="drop"`, never `"clear"`** — that action name is already
      the collector's "Start again", and two branches answering one name in
      one delegated listener means the wrong thing gets cleared, silently.
      The v71 `boardHTML` collision, pre-empted rather than rediscovered; a
      law asserts it by name.
      ⚠️ **The rules had to widen by one clause** (`!newData.exists() ||`),
      because a delete carries no `newData` and v73's rule refused it. Write
      is still leaf-only, so the most anybody can remove is one pick — which
      they could already overwrite with anything. **The app ships working
      against BOTH rule sets**: with the old ones the delete 401s, nothing is
      cleared, and the card says the pick is still on the ticket.
    - ⚠️ **"Change my pick" leaves the old row up until the new one is saved**,
      because a change overwrites rather than deletes, and it says so.
      Clearing is the way to come off the list entirely.
    - ⚠️ **It asks again when the app becomes visible**, not on a timer — that
      is the moment somebody wants to know who has picked, and a poll running
      all Sunday would spend a battery on a list that changes twelve times a
      week. Plus a Refresh button that says *"Checking…"* first, because a
      repaint of identical rows reads as a control that does nothing (v30).
    - ⚠️ **👥 is its own mark**, and a law refuses the five that are already
      headings on this page — the v50 clash arrives here the same way it did
      there, as a knock-on of a new card appearing.
  - 🏈 **THE WEEK'S BOARD IS TAPPED, NOT TYPED (v71, owner: *"Each week every
    game ML, spread and total are available or a person can fill in a prop bet
    for a game… Why can we have pick selections like by tapping not
    writing"*).** Every game renders its three markets, two sides each, as
    buttons; a prop field stays underneath for anything the board does not
    carry.
    - 🚨 **THE REAL WIN IS NOT THE TAPPING, IT IS THAT THE LINE IS DERIVED.**
      Twelve people typing "Eagles -3.5", "PHI -3.5", "philly -3½" produce
      twelve spellings of one bet, and nothing downstream can tell they are
      the same — no per-market record, no duplicate detection, no checking a
      leg against the board it came from. An option writes its own text, so
      twelve picks are comparable. That is the difference between a list and
      data, and it is why this was worth doing properly.
    - 🚨 **THE BOARD COMES FROM ESPN'S PUBLIC NFL SCOREBOARD (v72)**, fetched
      from the reader's phone with no key, and `open.games` in the file is the
      FLOOR beneath it — the v42 doctrine, which is the only reason a members'
      app is allowed to fetch anything. Blocked, slow or gone, the tab is
      exactly as good as it was and says which copy is on screen.
      ⚠️ **The ESPN feed that was ALREADY wired is a different one** —
      `/api/fantasy/football/season`, the commissioner's FANTASY league, whose
      `sch` is a list of fantasy team ids. There is no fixture and no price
      anywhere in it. "ESPN is linked" was true and was the wrong ESPN; worth
      keeping written down, because it will be assumed again.
    - 🚨 **`boardFrom` WAS WRITTEN AGAINST A REAL CAPTURE, NOT AGAINST
      MEMORY** (the v39 rule). `fixtures/espn-nfl-scoreboard.json` holds four
      of the owner's pasted events verbatim, chosen because they are the ones
      that make it hard:
      - **Two of them are FINAL.** A week's payload carries games that have
        already been played beside the ones still to come — the real week 1
        had two — so anything but `status.type.state === 'pre'` is dropped.
        Offering a bet on a game whose score is three lines away in the same
        payload is the worst thing this board could do.
      - **One has the AWAY team favourite.** The top-level `spread` is the
        HOME spread, so "BAL -3.5" arrives as `spread: 3.5` because
        Indianapolis is at home. Verified against `details` on all fourteen —
        but the per-side `pointSpread.home.close.line` says `"+3.5"` in as
        many words and carries its own price, so that is what is read.
      - **The juice is not symmetric.** One game is home −3.5 at −118 and away
        +3.5 at −102. Pricing both sides at −110 would put a leg on the ticket
        at a number the book is not offering, so each side keeps its own.
      - **`close` beats `open`**, which are both present and differ (one game
        opened DEN +130 and closed +114).
    - ⚠️ **The committed board was hand-transcribed and then CHECKED AGAINST
      THE TRANSFORM.** Two of its games are among the four captured verbatim,
      and the typed numbers match what `boardFrom` produces from the raw
      payload exactly — which is what makes the other twelve trustworthy.
    - ⚠️ **A game missing a market renders no button for it**, rather than a
      button with no price behind it. A board arrives half-posted all the
      time — a total up before a spread — and half a game is still worth
      showing. A one-sided moneyline renders neither side.
    - 🚨 **AND A BOARD IS GAMES YOU CAN BET, NOT GAMES ESPN KNOWS ABOUT
      (v80, `playable()`).** ESPN lists a week's fixtures as soon as the
      schedule exists and prices them only when the books do — so **every
      week has a window, days long, where the payload is all games and no
      markets**, and it is the window the tab sits in for most of the week.
      Every gate counted GAMES, so the card said *"Tap a line below"* over an
      empty board with the write-it-in field **folded shut**: a control named
      in a sentence and absent from the page, which is the v30 fault.
      Reproduced on the render before it was fixed.
      ⚠️ **ONE helper and four gates read it** — the lead sentence, the board,
      the note, and whether the prop field opens. Four gates asking one
      question four ways is how three agree and one does not.
      🚨 **The buttons stay keyed by their index into the WHOLE week, never
      into the priced subset.** A pick travels as `{g, id}` and `selPick`
      resolves it back through `gamesOf`, so renumbering around an unpriced
      fixture would point a saved tap at a **different game** — silently, and
      only in the half-priced state, which is every week for a day or two.
      There is a law that reads the rendered buttons back against the week
      they came from, on a board with the gaps deliberately at 0 and 2.
    - 🚨 **SAVE SITS WHERE THE CHOOSING HAPPENS.** The first cut put it above
      the board, which on a sixteen-game slate (~90 buttons) means tapping a
      line and scrolling back to the top to confirm it. The chosen line rides
      a **bar pinned to the bottom of the screen** — a bet slip, the one
      pattern everyone using this already knows — and the prop field keeps its
      own button inside itself. Neither path has two buttons and neither has
      none. ⚠️ The page renders a spacer when the bar is up, or the bar covers
      whatever is at the bottom of the scroll.
    - ⚠️ **At 320px the label and the price cannot share a button.** Measured:
      "Under 47.5" beside "-110" in a ~127px button clipped five of the ten
      totals, silently, on the one control the feature exists to tap. They
      stack under 360px and the button grows 44px → 48px. The v39/v52 fix — a
      second value gets its own line rather than squeezing the first — applied
      to a button instead of a row.
    - ⚠️ **Tapping a line clears the prop box and typing in the prop box
      clears the selection.** Two answers to one question; the one touched
      last is the one they mean.
    - 🚨 **`gameBoardHTML`, not `boardHTML`.** That name was already the
      leaderboard's, and a second function declaration of the same name in one
      scope silently WINS — "Who carries the ticket" vanished off the page and
      nothing threw. The tie law caught it, which is a law written for
      something else doing the catching; there is a named law for it now.
- `parlay/current.json` — the season's tickets. **ONE file, APPENDED to** —
  unlike `season/current.json`, which is overwritten, because the running
  record IS the tab. ⚠️ It ships with an empty `weeks` array so an unstarted
  season answers 200 and a 404 is reportable as a broken deploy rather than as
  business as usual; `checks.js` asserts it ships. ⚠️ **`open` ({`k`, `l`})
  names the week picks are being taken for** — needed only for the first week
  of a season, since every week after it derives from the newest ticket.
  🚨 **And it is only honoured while it is AHEAD of the newest ticket (v78)**,
  so a stale one is ignored rather than offering picks at games that have
  been played — see `parlay.js`. The one case that still needs a hand is a
  week that takes no ticket at all, because nothing published can advance
  past it.
  ⚠️ **`open.games` is that week's board**, one object per game, in the shape
  `boardFrom` emits: `{a, h, kick, sp:{h, hp, a, ap}, ml:{h, a},
  tot:{n, op, up}}` — `a`/`h` the away and home abbreviations, `sp` each
  side's line and its own price, `ml` the two moneylines, `tot` the number
  and the price either way. Every market is optional and a missing one simply
  renders no buttons. ⚠️ It is the FLOOR: the app fetches ESPN's public
  scoreboard over the top of it.
  - 🚨 **`sync` IS THE WHOLE SHARED-PICKS FEATURE, AND IT IS LIVE** (v73, set
    the same day) — a Firebase Realtime Database URL (https, no path, no
    trailing slash), currently
    `https://nectars-bologna-default-rtdb.firebaseio.com`, the owner's own
    project. With it set every pick writes to the store and the tab grows a
    **👥 who is in** card; blank it and the tab is byte-for-byte the app v72
    shipped, picks travelling through the group chat. **So turning the feature
    on and off is this one line and NO version bump** — `parlay/` is data
    outside the versioned JS and is fetched `no-store`.
    ⚠️ **`checks.js` does NOT assert it is blank, and briefly did.** That law
    was written against v73's release state and was never an invariant; it
    would have failed the moment he switched the store on, which is the v42
    trap (a test that encodes the old design fails exactly when the design
    changes). What is asserted instead is stronger and permanent: **the file
    carries no credential** (see below), **a `sync` that is SET must actually
    resolve** — a URL with a path or plain `http` is refused *silently*, so
    the tab would look like the chat-path app while somebody believed the
    store was live — and **with `sync` blank the tab is still the v72 app**,
    asserted against a blanked copy so it keeps testing after the switch-on.
    ⚠️ 🚨 **IT IS NOT A CREDENTIAL AND MUST NEVER BE TREATED AS ONE.** The repo
    is public, so the URL is public, and anybody who reads `parlay.js` could
    write a row under any name — the same bar the published passphrase hash
    already sets, against the same eleven relatives. Every row is untrusted
    input; see `parlay.js` below. 🚨 **Never put a Firebase API key, a
    `databaseSecret`, a service account or any other token in this file** —
    the whole design is that there is nothing here worth stealing, and
    `checks.js` now greps the shipped file for each of those shapes. A token
    committed to a public repo is readable for ever, including after it is
    deleted from the tip. The setup steps and the exact security rules are
    under "🔗 Turning the shared picks on" below.
- `espn.js` — **the manager map and the ESPN transform**, loaded by BOTH pages
  (v42), `window.LeagueESPN`.
  - 🚨 **IT EXISTS BECAUSE THE ALTERNATIVE WAS TWO COPIES.** When the Season
    tab started fetching live it needed exactly what the Lab already had:
    which team belongs to which manager, and how to turn an ESPN payload into
    the app's shape. Written twice, those drift every September — and **v36 is
    what ONE stale map already cost**: half the league lost its crests and its
    YOU row. `checks.js` fails if `power.js` or `season.js` grows its own.
  - `toSnapshot(payload)` is the one transform, so a published week and a live
    refresh can never disagree about what the same payload means. ⚠️ Verified
    **byte-identical** to what the Lab's own `seasonSnapshot()` produced before
    it moved, against the owner's real capture.
  - 🚨 **`isMe` IS NEVER READ, and this is where it would have bitten.** It
    flags the team of the account the BACKEND authenticates as — the
    commissioner's, on every device. The members' app fetching live is exactly
    the case that would badge his team as theirs on eleven phones (the v33
    byline bug, one field over). `checks.js` asserts neither this file nor
    `season.js` mentions it.
  - `mgrFor(name, teams)` takes the teams IN rather than reading a module
    cache — the v37 rule: a refresh swaps the season in place, so a resolver
    holding its own snapshot goes stale exactly when a correction lands.
- `odds.js` — **the app's own playoff odds** (v40), `window.LeagueOdds`.
  - 🚨 **THE ONE MODEL HERE THAT CAN BE GRADED.** A power ranking has no
    outcome to score against, which is why that card says its weights are a
    judgment call and must never be presented as validated. A team either
    makes the bracket or does not, so this can be scored with a Brier score
    and two forecasters can be compared. **So nothing claims to beat ESPN —
    both numbers are on the page and the season decides.**
  - **Measured on the archive, and the third one is the point:**
    last season's scoring → this season's `r = +0.14`; career average
    (excluding that year) → that year's `r = +0.17`; **win rate above .500 →
    next season's `r = −0.02`**. A manager's RECORD carries no predictive
    signal at all. Every input here is points; the app says so on the card.
  - **Variance decomposition** (13 seasons): season-to-season swing within one
    manager **7.74 ppg**, true between-manager skill **2.16 ppg**, reliability
    of a single season **0.07**. Thirteen seasons of history earns 50% weight;
    one earns 7%. Hurd's +4.65 career is worth **+2.34 ppg** as a forecast.
  - 🚨 **SHRINKAGE IS THE EDGE, AND IT IS MEASURED, NOT ASSERTED.** Weekly
    scores swing far wider than teams truly differ, so early scoring is mostly
    noise: weight on observed scoring is `n / (n + σ²week / σ²between)`, both
    measured live. Against a known truth it beats raw points-per-game by
    **11% (Brier) at week 3, 2.4% at week 6, and nothing by week 10** — the
    edge is real and it is concentrated early, which is exactly the theory.
  - ⚠️ **`SEASON_K` (12.8), `SKILL_SD` (2.16) and `SEASON_SD` (7.74) are the
    only numbers carried in from the archive analysis.** Everything else
    self-calibrates from the season in progress.
  - 🚨 **SEEDED, BECAUSE TWELVE PEOPLE COMPARE PHONES.** An unseeded Monte
    Carlo gives each reader a slightly different percentage for the same
    published week, and two people holding screens side by side would watch
    the app disagree with itself. Seed is the week. Rounded to a WHOLE
    percent, which is about the resolution a simulation of this size has —
    ESPN publishes 61.425%, which is three digits of false precision.
  - **The what-ifs are conditionals off ONE set of simulated seasons**, never
    re-run per game, so they cannot disagree with each other or with the
    headline number. That is the section ESPN does not do: a percentage alone
    cannot be argued with and does not tell you what to want on Sunday.
  - ⚠️ **Honest expectation: ESPN should win early.** They can see twelve
    rosters preseason; we can see thirteen years worth ±2.3 ppg. The edge
    arrives with real scoring. Said on the page, not just here.
- `calibrate.js` — **`node calibrate.js`, ~90 seconds, run it whenever you
  touch `odds.js`.** Grades the model against a known truth over 300 synthetic
  seasons.
  - 🚨 **DELIBERATELY NOT IN `checks.js`, AND IT FOUND BOTH REAL MODELLING
    BUGS.** The suite holds laws — things true of every run, cheap, and false
    the moment somebody breaks them. "When it says 70%, does it happen 70% of
    the time" is a question about a distribution, needs hundreds of seasons,
    and returns a judgment rather than a pass. Both faults it caught were
    invisible to every assertion: drawing weekly scores around the ESTIMATED
    team mean as if it were exact (week 3 said 95% for teams that made it 83%
    of the time), and clipping the between-team spread at zero before use,
    which biases a noisy subtraction upward and roughly doubled how far the
    model trusted three weeks of scoring.
- `season/current.json` — the published snapshot. **One file, overwritten** —
  no index, no history: a season in progress has exactly one current state and
  the finished ones are the archive's job.
- 🚨 **THE `hidden` SPECIFICITY TRAP HAS NOW BITTEN THIS APP THREE TIMES.**
  `:root[data-palette] .X { display: … }` is (0,2,1); the UA's
  `[hidden] { display: none }` is (0,1,0); the palette layer wins and
  `el.hidden = true` paints nothing but a no-op. It hit `.lg-jump` (v9),
  was pre-empted for `.lg-sheet` (v13), and was found in `.ai-sub` in v21
  after shipping since v4 — the history sub-tabs stayed on screen over the
  Power Rankings with "Honors" still lit. **Hide by property AND add a
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
  - **🔒 Lock / Sign out lives at the very BOTTOM** (v35, `lockBarHTML` +
    `wireLock`), not in the header. "Unlock once per device" is only safe if a
    device can be un-unlocked, but locking is irreversible FROM the page — the
    owner re-types the passphrase, a guest needs a fresh invite — so the one
    destructive control does not sit a thumb-width from the brand. It renders
    last, below every action, and it is built INTO the rank view (a repaint
    rewrites `#pr-rank`, so a node hung off `.pr-main` would linger but one at
    the bottom of the page must be part of what gets repainted). It talks to the owner's Render backend
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
    - 🚨 **THE PAYLOAD CARRIES MORE THAN THE LAB READS, AND v39 FOUND IT BY
      LOOKING.** The full field list, confirmed against a live capture:
      per-team `teamId`, `team`, `abbrev`, `isMe`, `wins`/`losses`/`ties`,
      `pointsFor`, **`pointsAgainst`**, **`playoffPct`**, `scores[]`,
      `outcomes[]`, **`schedule[]`** (14 opponent teamIds), plus top-level
      `week`, **`regularSeasonWeeks`**, **`playoffTeams`** and `allPlay`.
      `power.js` reads about half of that, so a session inferring the payload
      from what the Lab consumes will conclude the schedule and the odds do
      not exist — and both do, and the season tab is built on them.
      ⚠️ **The schedule is real and symmetric** (verified: every pairing agrees
      in both directions, no self-plays, weeks 1-11 a full round robin and
      12-14 a repeat of 1-3), and **`playoffPct` sums to exactly 600** — six
      spots × 100%, the signature of an actual simulation. It is **ESPN's own
      number**, passed through untouched, and the app says so on the card
      rather than implying it computed it.
      ⚠️ **`teamId`s are NOT contiguous** — this league runs
      `1,2,3,4,5,6,7,10,11,12,13,14`. Never index by position or assume 1..12.
      ⚠️ **One 2026 team name ships with a TRAILING SPACE** ("Jefferson
      Airplane "). `nrm` trims when resolving a manager; a heading does not,
      so the snapshot writer trims on the way out.
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
    PNG (~420 KB for the set) — the FILE is 144px everywhere; what changed in
    v38 is only how big it is DRAWN. ⚠️ **Every draw size stepped up ~20% in
    v38** (owner: *"Make all the pics slightly bigger so u can see them
    better"*): rankings row 34→40, Lab row 30→36, shared view 34→40, picker
    46→54, header chip 26→32, profile 56→66, champions 32→38, medals 30→36,
    record lists 26→32, storyline cards 28→34. They are set INLINE by
    `crest(m, size)` / `crestURL(team, size)` at each call site, not in one
    stylesheet rule, so a size change means walking all three files
    (`league.js`, `history.js`, `power.js`) plus `.pr-helm-sm` and
    `.lg-me .fh-crest`. ⚠️ **Several were re-cropped in 2026**: the 2023
    sheet padded non-square logos to 144px with arbitrary letterbox BANDS
    (Zach filled 54% of its tile, McD 97%), so at the size a rankings row uses
    they read as different KINDS of thing. The bands are trimmed and the image
    centre-cropped square on the nine where nothing is lost. **Four crests are
    2026 replacements the owner supplied, each matched to its team name** —
    Hurd (Aaron Rodgers down, for "Aarogant Fraudgers"), Zach (Jared Goff, for
    "Jared Goff Hits Women"), Riz (a crashed Prime Air jet, for "Jefferson
    Airplane") and Gotch (Judge Judy, for "Thurgood Marshall"). ⚠️ Each was
    framed by what survives at the **40px a rankings row uses**, not by what
    looks best large — that is the only size most of the league ever sees one
    at, and it is what ruled out the wider Judge Judy crop (its nameplate is
    illegible there anyway) and the anonymous centre crop of the plane. The
    remaining wordmark crests (Woods "Morning Wood", Buley "Morning Dew") are
    LEFT WHOLE: a square crop cuts the words, and the words are the joke. ⚠️ **CC was a
    fourth, and only the owner looking at it caught that** — its art spans the
    full width of its frame, so the square crop lopped both sides off the
    circle. It is PADDED-TO-FIT instead: bands trimmed, a dark scan artifact
    down the left edge removed, the whole logo centred on white (its own
    ground, so the pad is invisible). **A centre-crop is safe only when the
    subject is centred; when the art fills the frame, pad rather than crop.**
    A crest is the league's own artwork, so a swap or re-crop is a DATA
    change — no version bump, same as publishing a week.
    - ⚠️ **Keyed by MANAGER, never by team name** — the names change every year
      while the twelve people do not. 🚨 **But the manager itself is resolved
      FROM the team name** (`MANAGERS`, team-name → code), so that map goes
      stale every season: an unmapped 2026 name silently degrades to the
      generated helmet AND publishes a blank manager code, costing that team
      its crest and its YOU row in the members' app. v36 rebuilt `MANAGERS`
      from the live 2026 ESPN names, owner-column verified. **This is the one
      part of the Lab that needs a human every season** — see Open / next.
      And it keys off
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
  - 🚨 **The header WRAPS; it never breaks a word (v32).** `.pr-top` is
    `flex-wrap: wrap` and the brand keeps its min-content floor. v25 had given
    it `min-width: 0` + `overflow-wrap: anywhere` to stop the brand riding over
    its buttons, and that lets a flex item shrink below its longest word —
    measured, the brand read **POWER / RANKI / NGS** at 390px and **one letter
    per line at 320px**. ⚠️ `break-word` instead of `anywhere` is NOT the fix
    and was measured to be identical: the squeeze is the bug, the wrap mode
    only decides how it is spelled. The members' app is immune by a different
    route — `.lg-brand h1` is `white-space: nowrap` inside an `overflow:
    hidden` brand, so it clips rather than shatters; **checked rather than
    assumed, and deliberately left alone.** ⚠️ **v35 moved 🔒 Lock OUT of this
    header** (to the page bottom, an accidental-tap fix), so the row is back to
    two children — the `flex-wrap` stays as the guard, not because it is needed
    at two.
  - ⚠️ **Two lines in the paragraph above are Sports-Hub history and are no
    longer true here**, and they are left as a warning about how a moved
    document goes stale: the palette is pinned in the markup (`data-palette` +
    `data-theme` on `<html>`), there is no `PALETTE_MIGRATE` in this repo and
    no "third copy" to keep in sync — that machinery was deleted before the
    move. What IS still true: **every colour is a token**, ▲/▼ are
    `--pos`/`--neg` and never the accent, and an accent fill takes `--on-ac`,
    never `#fff` (white on gold measures ~1.9:1).
  - **`power.js` has its own `?v=`** (Lab-only, so it does not ride
    `league.js`'s `APP_VERSION`) — but `styles.css` and `power.css` are loaded
    by BOTH pages and therefore ride `index.html`'s number. ⚠️ They had two
    independent counters until v28 and `styles.css` sat at `?v=1` here long
    enough to pin any device that had opened the Lab to a pre-v20 stylesheet.
    `checks.js` asserts the two pages agree on both (v39).
  - **🔑 `power.html#newpass` — set a new passphrase** (v41), and it is
    **ungated on purpose**: you reach for it precisely when you cannot get
    through the gate, so putting it behind the gate is the v23 fault again — a
    door that only opens from the inside. It hashes on the device and hands
    back the one line that replaces `HASH`; **the phrase never leaves the
    phone** — not into the repo, not into a chat.
    - 🚨 **It is read BEFORE the branch that clears the hash**, like `#r=` and
      `#invite=`. Third feature to need that ordering and the first two
      shipped broken (v23, v33). `checks.js` now asserts the source order.
    - ⚠️ **It grants nothing and changes nothing.** The new phrase works only
      once the line is committed and deployed; until then the old one still
      opens the Lab, and the card says so rather than letting him clear the
      page and lose both.
    - ⚠️ A reset does **not** lock out already-unlocked devices (`lh:owner`
      holds no phrase) and does **not** cancel guest passes (that is
      `INVITES_FROM`). Both stated on the card.
    - The card warns under 12 characters, measured on the NORMALISED phrase —
      counting the raw input would credit trailing spaces and capitals that
      are about to be thrown away. **Length is the only real defence** against
      a published hash.
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
  - **👥 Let someone else build a week** (v33, `inviteHTML`/`wireInvite`) — the
    commissioner hands the Lab to another manager for a week or a season.
    - 🚨 **Gated on `is()`, NEVER `mayLab()`.** A guest holding a pass must not
      mint further passes — that is the difference between lending a key and
      lending the ability to cut keys. The card is **absent** from a guest's
      DOM rather than hidden, for the reason `index.html` carries no Lab link:
      markup behind an attribute is still in view-source.
    - 🚨 **`boot()` redeems `#invite=` BEFORE the gate**, for the same reason it
      reads `#r=` first: the invite is the thing that gets somebody past the
      gate, so a gate in front of it is a key locked inside its own door — the
      v23 fault exactly. ⚠️ **And it must read the hash before anything CLEARS
      it**: the first cut sat below the existing "don't strand the reader"
      branch, which `replaceState`s the hash away, so every invite landed on
      the passphrase gate with no message and looked like a link that had never
      worked. **A value consumed at init cannot answer a question asked later**
      — the v1 lesson again, caught only by rendering the guest's own case.
    - 🚨 **A GUEST'S BYLINE IS THEIR OWN, and this is where the leak would have
      been.** `defaultByline()` used the backend's `isMe`, which is the flag on
      the account it authenticates as — the OWNER's, always — so a guest's
      rankings would have gone to the group chat under **his** team name. The
      shared view carries a byline for exactly one reason (whose take is this),
      and getting it wrong is worse than omitting it. `teamForMgr()` walks
      `MANAGERS` rather than keeping a second map, because team names change
      every year and the twelve people do not.
    - **Four durations, and one of them has no end** (v34): this week · a month
      · the rest of the season · **until he turns it off** · or a date he picks.
      🚨 **"No end" is stored as a DATE so far out it never arrives**
      (`9999-12-31`), never as a missing expiry or a null — so `owner.js` keeps
      exactly one expiry rule with no "forever" branch, and a pass that never
      ends cannot become a pass that never expires *because of a bug*.
      ⚠️ **And it must never be printed.** "until Fri, 31 Dec 9999" reads as a
      glitch rather than as standing access, so `untilTxt`/`openEnded` gate
      every place a pass date is shown — the invite output, the guest banner
      and the members' app footer link, all three checked by render.
      ⚠️ **An open-ended pass is the one grant with no natural end, so
      `checks.js` asserts `INVITES_FROM` still kills it** — otherwise it would
      be the single thing he could never take back.
    - A guest gets a banner saying what they have and until when, and 🔒 turns
      into **Sign out** with its own confirm — "access until Saturday" is only
      safe on a borrowed phone if it can be ended before Saturday.
    - ⚠️ **`.pr-inv-f[hidden]` is written in the same edit as the markup that
      toggles it.** `.pr-inv-f` is `display: flex` at (0,1,0) and the UA's
      `[hidden]` is also (0,1,0) — a tie the later sheet wins, so `el.hidden`
      would have been a visual no-op. Fourth outing for that trap.
  - **↩️ Unpublish this week** (v31, `pubStateHTML`/`paintPubState`/`unpublish`)
    — the mirror of 🚀, and the reason publishing is safe to get wrong.
    - 🚨 **A RETRACTION HAS TWO HALVES AND ONLY ONE OF THEM IS A COMMIT.** The
      file comes out of the repo; the **movement mark** comes out of
      `powerlab:pub` on his phone. Skip the second and next week's ▲▼ are
      measured against a ranking the league never saw — every arrow on the page
      wrong, silently, with nothing on screen admitting it. "Movement the league
      never saw is not movement" is the rule publishing exists to keep; this is
      how it survives a mistake. The button does its half and hands over the
      other as a pasteable sentence (`unpublishInstruction`).
    - ⚠️ **It also puts the published state ON SCREEN for the first time.**
      Publishing has always had that side effect and the page never showed it,
      so "have I already sent this one?" was a question only localStorage could
      answer — and it matters most exactly when you are least sure, having just
      published something wrong.
    - ⚠️ **Rendered as innerHTML into an empty `#pr-pubstate`, never a `hidden`
      toggle.** `[hidden]` is (0,1,0) against the palette layer's (0,2,1) and
      stays on screen — the trap that has bitten this app three times. An empty
      container cannot have that bug.
    - ⚠️ **It sits BELOW the publish output, not above it.** 🚀 produces two
      lines he has to act on immediately; an offer to undo, wedged between the
      button he pressed and the JSON it made, pushes the thing he needs off
      screen to make room for the thing he probably does not.
- `rankings/` — legacy fallback weeks (v83: Firebase is authoritative). `index.json` lists them; one JSON file each.
- `logos/` — the league's own twelve crests, keyed by manager.
- `sw.js` — network-first service worker. Bump `CACHE` on every release.
- `storylines.test.cjs` — narrative regression checks; see v90 above.
- `checks.js` — **run `node checks.js` after ANY data or detector change.**
  ⚠️ **A summary line reports ITS OWN block — use `block()`** (v49). Three of
  them read the running `bad` counter, so any failure above turned them ❌
  about a subject that was fine. Only the total at the bottom reads the global.
  It holds the **parlay laws** (v69 — the price is the product of its legs, a
  push leaves the price without killing the ticket, ±100 is the one price that
  cannot round-trip, every leg belongs to a real manager, one leg per manager
  per ticket, and every record is checked PER MANAGER against that manager's
  own legs, because a swap conserves every total). It
  also holds the **gate laws** (v21): `index.html` must not name `power.html`,
  `owner.js` must hold a 64-hex hash rather than a phrase, and the phrase must
  not be one of sixteen obvious guesses. None of that is visible in a render,
  which is exactly why it is asserted. ⚠️ The first law is about `power.html`
  only — `power.css` is legitimately in `index.html`, because the rankings view
  reuses the Lab's row styling so a member reads what the commissioner built. It
  holds the **storyline voice laws** (v81 — the roll-call is the same twelve
  findings for every reader as for a stranger, because a duplicate that exists
  only in second person is invisible to a law that runs as nobody; a head
  claiming a habit has more than one instance in its body; and no `stuckAt`
  card is a title count in disguise). It
  runs the mascot law (v49 — every manager's team glyph is read off the
  RENDERED You heading and profile and must match, and a reader who has picked
  nobody must get the neutral 👤 rather than any manager's team), the
  conservation laws below, plus the storyline laws: every manager has
  one **and is on the rendered Storylines card** (v7 — those are different
  assertions; see Storylines), none has a template hole, each reader's own
  storyline is in second person, the card is still ranked by weight, and no
  superlative fires for two people at once.

## localStorage keys

The members' app writes **nine keys**, and only two of them are ever written
by anybody but the reader themselves. Everything else here belongs to the Lab,
which only the commissioner opens. ⚠️ This heading said "three keys and no
more" until v70 and had been wrong since v33 — `lh:season` and `lh:guest`
landed under it without it being re-counted. A number in prose beside a list
is a hand-kept copy of that list, and it drifts.

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
- `lh:season` — the Season tab's last good ESPN payload, transformed (v42).
  What makes the tab open instantly instead of waiting on a sleeping backend,
  and what it falls back to when the backend never answers. Per-device.
- `lh:guest` — a **guest pass** (v33): `{w, u, i}` — which manager, the last
  day it works, and the day it was issued. Written by `owner.js` when an
  invite link is opened, and **checked for expiry on every read** rather than
  on a timer, so a page left open for three days is not still inside.
  ⚠️ **It is deliberately not `lh:owner`.** A guest gets the Lab and nothing
  else: not his name on the picker, not the ability to invite anybody. Clearing
  site data, or 🔒 Sign out, ends it.
- `lh:pick` — **this device's own leg for the open week** (v70): `{k, m, p, o,
  at}`. ⚠️ Keyed by WEEK, so it is restored only for the week it belongs to —
  a new week gets an empty form rather than last week's bet, the same rule
  `powerlab:draft` follows and for the same reason: a stale draft is worse
  than none.
  🚨 **AND KEYED BY MANAGER SINCE v82 — `m` IS NEW AND IT IS THE WHOLE OF THAT
  VERSION.** Week alone was not enough, because "you" is a ROLE here: any of
  the twelve can read as any other, so tapping a different name on the picker
  handed that device's saved bet to the new reader as their own — *"your pick
  is in"* over somebody else's leg, above a who-card listing that same reader
  under **Still to pick**. ⚠️ **It was never only a viewing fault**, which is
  why it is a law and not a tidy-up: `edit` and `save` write to `LH.me()`'s
  row, so changing an inherited pick would have put one manager's bet on the
  shared list under another's name, and `drop` would have cleared the real
  owner's pick off their own phone while their row stayed on the ticket — the
  exact split the v75 delete order exists to prevent, reached from the other
  side. ⚠️ **A pick saved BEFORE v82 carries no `m`, and the shared list is
  what says whose it is** (`legacyMine`): a matching row under the reader
  makes it theirs, a matching row under somebody ELSE makes it not, and a
  pick matching no row at all never got out — which is precisely the state
  the chat box exists for, so that one stays. Resolved on every read rather
  than stamped once, because a stamp taken before the list has arrived is a
  guess written down.
- `lh:tick` — **the picks somebody is collecting into a ticket** (v70):
  `{k, legs:[{m, p, o, t}]}`. Written on whichever phone is assembling, by
  pasting the chat or by opening a pick link. ⚠️ **It reaches nobody else's
  app** — it is one person's working copy until the assembled block is
  committed, and the card says so in as many words.
- `lh:board` — **the last board fetched from ESPN** (v72): `{k, games, at}`.
  Per device, refreshed at most every 15 minutes, and only ever an upgrade on
  the board committed in `parlay/current.json` — a blocked or dead call costs
  freshness and nothing else.
- `lh:picks` — **the last copy of the SHARED pick list** (v73): `{k, rows, at}`,
  where `rows` is the store's own object keyed by manager code. Written only
  when `sync` is configured; it is a cache of somebody else's data, so it is
  the one key here that is not about this device at all. ⚠️ **It is never the
  source of the reader's OWN pick** — that is `lh:pick`, which is written
  first and cannot fail, so a dead store costs the other eleven a live view
  and costs the picker nothing.
- `powerlab:draft` — the Power Rankings Lab's week in progress
  (`{key, order, comments, at}`, autosaved on every edit). `key` = weeks
  played, so it is restored only for the week it belongs to — a new week's
  results pre-build a fresh ranking instead.
- `powerlab:pub` — published weeks keyed by that same key
  (`{order, comments, at, label, file, prevFile}`). Written when the owner
  SHARES, and it is what ▲▼ movement is measured against — movement the league
  never saw is not movement.
  - ⚠️ **`file` is set only by 🚀 Publish** (v31), never by a link, a text copy
    or a one-pager. Those are messages: the league saw the table, so the week
    is marked, but there is nothing in the repo to take back. Publishing writes
    a FILE, and only a file can be retracted — which is the difference the
    ↩️ Unpublish card states rather than papering over.
  - ⚠️ **`prevFile` remembers a rename.** `publishFilename()` is built from
    TODAY, so correcting Week 3 two days later produces a second name; without
    this, "overwrite the file" quietly becomes "add a second and orphan the
    first". The publish output turns it into a ③ delete-the-old step.
  - ↩️ **Unpublishing deletes the whole entry**, so `prevOrder()` walks past it
    to the last week the league actually kept. That is the half of a retraction
    that no commit can do.
- `powerlab:season` — last good `/api/fantasy/football/season` payload, so the
  lab still ranks when the free-tier backend is asleep (with a stale banner).
- `powerlab:teams` — **learned `teamId` → manager code** (v37), the rename-proof
  crest key. ESPN's `teamId` is the franchise id and does NOT change when a
  manager renames their team, so `mgrFor` resolves by it: any team whose
  current name resolves through `MANAGERS` records its id here, and thereafter
  the id answers even when the NAME no longer does. Bootstraps from the name
  map (so a fresh device still needs `MANAGERS` current for its first open),
  then self-heals across renames. Per-device; written only on the owner's (or a
  guest's) device as seasons load.
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
  finishes · 24 Cum Bowl appearances · 11 losses · **one Cum Bowl per season,
  and it PAIRS THE BOTTOM TWO SEEDS — ESPN's own 11 and 12 where it published
  them, the worst two of the consolation six by record where it did not, and
  the two sources must agree** (v79). ⚠️ **This replaces v66's three laws
  (winner 11th · loser 12th · winner outscored loser), and they are the
  cautionary tale**: they restated v66's own definition rather than testing
  it, so they were true of any reading that pointed at `GmC9` and could not
  fail for the only reason that mattered. **A law derived from the definition
  it is checking is not a law.** Plus **the Cum Bowl is ONE game, not two
  definitions** — `MEET`'s `kind: 'cb'` must name the same game `CUMBOWL`
  does, which from v66 to v78 it did not · 61 title-bracket wins and
  63 losses (counted separately since v56 — see above) · 50 final fours ·
  13 titles · 76 playoff berths · h2h games == meetings · **losses ==
  brackets − titles per manager** · **every tied rank says "joint"** (v58) ·
  **brackets on file == playoff appearances, per manager** (v59 — the claim
  the Playoff appearances caption makes as fact, so it is a law) · **career
  wins, losses and points-for == the season rows they were summed from**
  (v61, now that the all-time standings display them) · **the seeds agree with
  the bracket's own shape** — byes are 1 and 2, round 1 is 3v6 and 4v5 (v62,
  over two independent sources) · **no two roll-call cards make the same
  claim** and **a decimal is one number** (v66) · **every manager's Cum Bowl
  points == the points from their own games, PER MANAGER** (v67 — a summed
  version stays green through a swap) · **the parlay's price is the product of
  its legs, a push leaves the price and does not kill the ticket, and every
  manager's leg record is the legs from their own rows, PER MANAGER** (v69 —
  the third outing for the per-manager rule, because a swap conserves a sum) ·
  **the shipped `parlay/current.json` carries no credential, a nearly-right
  `sync` URL is refused, a blank one still gives the v72 app, every row from
  the store goes through the same `checkPick` a pasted link does, and a leg
  made from the store is byte-identical to the same leg made from the chat**
  (v73 — ⚠️ the first version of the first of these asserted the file ships
  with `sync` blank, which was true of the release and was never an invariant;
  it would have failed the moment the store was switched on. See the
  `parlay/current.json` bullet. And one resolver for three routes, or two
  would eventually disagree about which pick is on the ticket) · **the shell
  stamps `#lg-body` with the view that owns it, before it hands the body to
  any view, and both late painters read that stamp — and
  say yes to their own body as well as no to somebody else's** (v76 — a guard
  that always said no would "fix" the bug by breaking the feature) · **no
  rankings copy names who publishes a set, none of it carries a pronoun for
  one, and the empty card still promises that a set is coming** (v77 — the
  last clause because copy that named nobody by saying nothing would pass the
  first two) · **a week whose games carry no odds is not a board — no option
  buttons, no empty container, no note claiming a source, the prop field open
  and the card saying why — and an option's `data-g` indexes the WHOLE week
  rather than the priced subset, so a tap cannot land on a different game**
  (v80 — the second clause because renumbering is the obvious fix and it is
  the silent one) · **every manager in the roster has a row on the rendered season
  record, a row with no legs prints no record rather than 0-0, twelve unrated
  rows sort to name order, and a stated `open` behind or on the newest ticket
  neither opens a played week nor carries that week's board forward** (v78 —
  the sort law because the roster rows made a non-transitive comparator
  reachable, and its first cut could not fail; the `open` law replaced one
  that asserted the OLD answer, which is the v42 trap) · **a saved pick is
  the reader's only when it is theirs — reading as another manager must be
  offered the board rather than handed that device's bet, an ownerless
  pre-v82 pick is resolved against the shared list rather than adopted, one
  that reached no row still keeps its chat line, and a pick that IS up wears
  no chat box** (v82 — asserted off the RENDERED card and in BOTH directions,
  because a guard that always said "not yours" would hide the bug by never
  showing anybody their own pick) · **the
  bracket resolves the
  standings** — the final decides 1st/2nd, the semi-final losers are 3rd/4th,
  the R1 losers 5th/6th (their pair plays TWICE on ESPN and the last game
  decides), the consolation six are exactly 7-12 and GmC7/8/9 decide 7-8,
  9-10 — ⚠️ **and 11th/12th are the CUM BOWL's since v79, not GmC9's**, which
  is the league's own rule overriding ESPN's ladder in 9 of 13 seasons; the
  ladder half of the law survives only where neither of a game's teams is in
  the Cum Bowl — plus **PF == PA and W == L in every season** (v66 audit,
  owner's ask). ⚠️ That checksum closes to **0.00 in all 13 seasons**, so its
  tolerance is float rounding only: one wrong digit anywhere in a season
  trips it, verified.
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
| **⚑ Playoffs only** | 209 bracket games from **all 13 seasons** — **every Cum Bowl is one of them** (`GmC3`), bar the 2025 reconstruction. ⚠️ It read "plus 13 Cum Bowls" until v66 and that double-counted twelve games — true under both definitions, which is why moving the game (v66) and moving it back (v79) neither caused nor cured it |

- 🚨 **THE PARLAY TAB IS A FOURTH KIND OF FACT AND WEARS NONE OF THESE THREE
  BADGES** (v69). Its picks and results are transcribed from a betting slip,
  not derived from the archive, so giving it one of these would say it had a
  provenance it does not have. It carries its own ✍️ note instead, and
  deliberately not the ⚑ — see `parlay.js`.
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

The cards in League Lore, on the You page and on every profile started life as
paragraphs typed into a chat. **They are not typed in now, and that is the
whole point:** a sentence like "Buley has finished 11th seven times" is wrong
the moment a season lands. A detector looks for a SHAPE in the data and fills
its own numbers in, so the sentence is fixed and the facts re-derive on load.
Same rule as the Sports-Hub model card — a hand-written description of
something computed is wrong the first time somebody changes it.

- **Each detector is about a shape, not a person.** `worstToFirst` fires for
  anyone who wins a title immediately after a bottom-four finish; its current
  one-off runs belong to McD, Gotch and Woods. **Nothing in `DETECT` names a manager**, which is what stops
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
    list after claim deduplication, not what the detectors emitted. `bigScores`
    omits a record already carried by that manager's podium story. Equal decimal
    numbers in unrelated stories do not delete a finding.
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
    title" directly beneath it. Claim identity is deduplicated separately; shared numbers alone do not
    establish duplicate facts.
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
  - 🚨 **AND THAT RULE NOW COVERS ORDINAL RANKS TOO (v58), WHICH IT NEVER DID.**
    `signature`'s `rankOf` was `findIndex` on a sorted array — pure ARRAY
    POSITION — so four managers on 5 final fours were handed 2nd, 3rd, 4th and
    5th in `ALL` order and the card printed **"2nd of 12"** as sole
    possession. The same value produced a different sentence depending on who
    was reading. Rank is `1 + how many are strictly better` now, and `tiedOn`
    makes the wording say **"joint"**.
    ⚠️ **The new bracket data is what exposed it**: `f4` moved for eight
    managers in v56/v57 and created three fresh multi-way ties, exactly at the
    ranks this backstop fills. It was latent and wrong before; it became
    visible and wrong.
    ⚠️ `checks.js` asserts it **off the RENDERED story, never off the rank
    helper** (the v7 rule) — verified by removing tie-awareness, which names
    CC, Gotch and Zach.
    ⚠️ **And a bottom-three rank is counted FROM THE BOTTOM (v59).** v57's
    "second-worst" wording keyed on `N − r`; with competition ranks a tie
    group at the bottom shares the TOP of its range — three managers on 3
    final fours are all 9th — so `N − r` said none of them was bottom-three
    while together they were exactly that. `rankBottom` gives "joint
    second-worst", which is true and is how a person says it. Untied, the two
    counts agree and no wording changes.
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
- 🚨 **TWO MANAGERS MUST NOT MAKE THE SAME CLAIM, AND THE GUARD FOR IT COULD
  NOT SEE THE READER (v81).** `pickStories()` skips a manager whose claim
  another manager has already made (v66), keyed on the head with the NAME
  stripped — which is only ONE of the two things the voice changes. The other
  is the VERB: *"You do worst-to-first as a party trick"* and *"Woods does
  worst-to-first as a party trick"* are one claim spelled two ways, so the
  guard held for everybody except the person standing in the duplicate. The
  owner opened his own app and found his card and Woods's making the same
  claim, on the one screen that is meant to be twelve different findings.
  ⚠️ **It was invisible to a stranger, which is who every render sweep and
  every law on this card had ever been.** Measured on v79's own render: three
  managers each saw a duplicate on their own phone and a stranger saw none.
  - **The key comes from a THIRD-PERSON build of the same detectors**
    (`neutralHeads`), not from string surgery on a verb — there is no list of
    verb pairs to keep in step and a detector added later is covered without
    being told. Built once and kept: the detectors are pure over the archive,
    so only the SENTENCES move when the reader does.
  - 🚨 **The law for it asserts an OUTCOME, never a normalised sentence.** A
    law that stripped the verb the same way the code does would be the code
    agreeing with itself. What has to be true is simpler and permanent: **the
    roll-call is the same twelve findings — same manager, same detector — for
    all twelve readers as for a stranger.** Fault-injected back to v79's
    keying, it names McD, Woods and Gotch.
- 🚨 **A HEAD THAT CLAIMS A HABIT MUST HAVE THE INSTANCES BEHIND IT (v81).**
  `worstToFirst` had exactly one wording — *"does worst-to-first as a party
  trick"* — written when one manager had done it twice. v79's Cum Bowl
  placings left **three** managers on exactly ONE run each, and the card went
  on calling a single off-season a habit over a body listing one line. The
  head states what happened when it happened once and keeps the party trick
  for a manager who genuinely does it again.
  ⚠️ **The single-run head carries NO number, deliberately.** Put the finish
  in it and "12th to champion" and "11th to champion" stop looking like one
  claim to the dedupe above, and the duplicate this version exists to end
  comes straight back. The number is in the body, where it is detail rather
  than the claim.
  ⚠️ And the body says how rare it is LEAGUE-WIDE rather than how many titles
  that manager has: *"One of 4 titles"* sat directly above the GOAT card's
  *"with 4 titles"* on his own page — one fact on two adjacent cards, which
  the `stories()` dedupe fingerprints DECIMALS and cannot see.
- **`stuckAt` skips championships.** Repeated first place is a trophy count,
  not a finish somebody cannot escape. The GOAT/`dynasty` detector was removed
  at the owner's request in v87; do not restore it through another storyline.
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
> 2b. **Overwrite `season/current.json`** with the third block the Lab hands
>    over. ⚠️ **Since v42 this is a FLOOR, not the source** — the Season tab
>    fetches ESPN itself, so this file only matters for a device that has
>    never loaded and cannot reach the backend. Worth refreshing when it is
>    handed over; not worth chasing him for. — the standings, ESPN's playoff odds and the schedule that the
>    **📊 Season** tab reads. ⚠️ It is OVERWRITTEN, never appended to and never
>    indexed: one file, one current state. A paste that carries only the
>    rankings blob is an older Lab or a hand-copied one, and the season tab
>    simply keeps showing the previous week — say so rather than inventing it.
> 3. Commit, push, and **merge to `main`** — Pages only deploys from `main`, so
>    a week left on a branch is a week nobody can see. Confirm the deploy.
> 4. Tell him it is live. No version bump is needed: `rankings/` is data, not
>    code, and the app fetches `index.json` with `cache: 'no-store'`.

> ### ↩️ WHEN HE SAYS UNPUBLISH — the same procedure, run backwards
> **He can take a week back, and it is a supported move rather than a rescue**
> (v31). Publishing is two lines in this repo; unpublishing is those two lines
> coming out, and republishing is publishing again. The Lab hands over the
> retraction sentence ready to paste — *"Unpublish After Week 3 from the league
> app: delete rankings/&lt;file&gt;, and remove the entry with `"k": 3` …"* — so a
> paste of that IS the instruction and needs no explanation from him.
> 1. **Delete `rankings/<the file>`** and **remove that `k` from `weeks` in
>    `rankings/index.json`.** Both halves. Leaving the index line behind points
>    the app at a file that 404s — the app says so honestly and offers the
>    other weeks, but it is still a broken week on everyone's screen.
> 2. Commit, push, **merge to `main`**. Until it lands there the league still
>    sees the old week; Pages is the only thing that decides what is published.
> 3. ⚠️ **If he has NOT already tapped ↩️ Unpublish in the Lab, tell him to.**
>    That is the half no session can do: the movement mark lives in
>    `powerlab:pub` on his phone, and while it is set, next week's ▲▼ are
>    measured against a table the league never saw — silently, with every arrow
>    wrong and nothing on screen admitting it.
> 4. **Republishing is just publishing.** Same `k` → replace the index entry
>    and overwrite the file, never add a second. ⚠️ If the file NAME differs
>    (`publishFilename()` is built from today's date, so a Sunday publish
>    corrected on Tuesday gets a new name), **delete the old file** — the Lab's
>    publish output says so as a ③ step when it spots one.

> ### 🎲 WHEN HE SENDS THE WEEK'S BETS — do this
> Twelve people, one NFL bet each, one ticket. He sends the slip (a screenshot,
> or the picks typed out); a session turns it into a week in
> `parlay/current.json`. There is no Lab for this yet — see Open / next.
> 🏈 **The BOARD looks after itself since v72.** The app fetches ESPN's public
> scoreboard from the reader's phone, so nobody types lines. What is in
> `open.games` is only the floor for a device that cannot reach ESPN — worth
> refreshing when a season starts (paste the scoreboard JSON and a session
> runs it through `boardFrom`), not worth chasing weekly.
>
> ⚡ **Since v70 the app usually hands the TICKET over ready-made.** Whoever collects
> the picks gets a block out of the collector card that is already exactly the
> object below — if what he sends looks like that, write it in verbatim and
> skip to step 4. The rest of this is for a slip typed out by hand.
> 👥 **And since v73, IF `sync` is set**, the collector fills itself: whoever
> is placing the bet taps "Pull in the N picks" and the block is ready with no
> chat to paste. Nothing about the steps below changes — the ticket still
> reaches the league as a commit to this file, because a placed bet is a
> record of something that happened and not a live feed.
> 1. **Append an object to `weeks`**: `k` the NFL week (UNIQUE), `l` its label,
>    `d` the date it went on, `stake` the total in dollars and `book` where it
>    was placed (both optional), and `legs` — one per manager: `m` the manager
>    CODE (`McD` · `CC` · `Hurd` · `Hyman` · `Christel` · `Woods` · `Zach` ·
>    `Buley` · `Wolff` · `Riz` · `Slemp` · `Gotch`), `p` the pick **verbatim as
>    the slip reads it**, and `o` the American odds as a number.
> 2. **Leave `r` off until it has settled.** Omitted means "not yet", and the
>    tab says so; `W`, `L` or `P` once the game is in. He will send results
>    later in the week — setting them is the whole update, and every number on
>    the tab re-derives.
> 3. 🚨 **NEVER type a combined price, a payout, a record or a rate.** All of
>    it is worked out from the legs on load. A typed one is the single number
>    that lies the moment a leg is corrected.
> 4. ⚠️ **APPEND — this file is the season's record**, unlike
>    `season/current.json` which is overwritten. A repeated `k` means he is
>    correcting that week, so REPLACE that entry rather than adding a second.
> 5. ✅ **`open` looks after itself since v78 — there is nothing to do here.**
>    Picks derive to the week after the newest ticket, and a stated `open` is
>    ignored the moment the season passes it, so a stale one can neither
>    vanish the pick card nor offer a week that has been played. ⚠️ **The one
>    time it still needs a hand is a week that takes NO ticket at all** (week
>    1 of 2026), because nothing published can advance past it: set
>    `open` to the next week, with `games` empty — ESPN fills the board from
>    the reader's phone (v72), and a missing floor renders the prop field and
>    says so.
> 6. Commit, push, **merge to `main`**. ⚠️ **No version bump**: `parlay/` is
>    data outside the versioned JS and the app fetches it `no-store`. (Contrast
>    v68 — data that lives INSIDE `history.js` does need a bump, because a
>    device holding the old `?v=` keeps the old data for good.)

> ### 🔗 TURNING THE SHARED PICKS ON — the owner's five minutes, then one line
> Built in v73 and **shipped off**: `parlay/current.json` carries `"sync": ""`.
> Everything below is what turns it on. It is his account and his five
> minutes; no session can do it, which is the only reason it is a procedure
> and not a commit.
> 1. **He creates the store.** console.firebase.google.com → Add project (no
>    Analytics needed) → Build → **Realtime Database** → Create → any location
>    → **Start in locked mode**. It hands back a URL like
>    `https://nectars-default-rtdb.firebaseio.com/`.
> 2. **He pastes the rules** (Realtime Database → Rules → Publish):
>    ```json
>    {
>      "rules": {
>        "picks": {
>          ".read": true,
>          "$week": {
>            "$mgr": {
>              ".write": "!newData.exists() || newData.hasChildren(['p','o','t'])",
>              ".validate": "newData.child('p').isString() && newData.child('p').val().length <= 120 && newData.child('o').isNumber() && newData.child('t').isNumber()"
>            }
>          }
>        }
>      }
>    }
>    ```
>    🚨 **`.write` IS GRANTED AT THE LEAF AND NOWHERE ABOVE IT, AND THAT IS THE
>    ONE THING NOT TO "TIDY".** Hoisting it to `picks` or to the root would let
>    a single request replace or empty the whole tree; at the leaf, the worst
>    anybody can do is overwrite or remove one pick — which is what changing
>    your mind and clearing a pick both do anyway, and it is visible on the
>    card with a name on it. There is no `.read`/`.write` at the root, so
>    nothing else in that database is reachable at all.
>    ⚠️ **`!newData.exists() ||` WAS ADDED IN v75 AND IS WHAT ALLOWS A DELETE.**
>    A delete has no `newData`, so the v73 rule refused it and 🧹 Clear my pick
>    could not take a row off the shared list. **It loosens less than it
>    looks**: write is still leaf-only, so the most anybody can remove is one
>    pick — and they could already overwrite that same pick with anything,
>    which is strictly worse. Anyone whose row is removed reappears under
>    "Still to pick", so it is visible rather than silent.
>    ⚠️ **The app works either way.** With the OLD rules still published, Clear
>    degrades honestly — the delete 401s, nothing is cleared, and the card
>    says the pick is still on the ticket and to change it instead. So this
>    paste is worth doing and is not urgent.
> 3. **He sends the URL; a session sets `"sync"` to it** (https, no path, no
>    trailing slash — `syncBase` refuses anything else, and there are laws for
>    each of those shapes). ⚠️ **No version bump**: `parlay/` is data.
>    ✅ **DONE 13 Sep 2026**: `https://nectars-bologna-default-rtdb.firebaseio.com`.
> 4. ⚠️ **Never add anything else from that console.** No API key, no
>    `databaseSecret`, no service account, no config object — none of it is
>    needed and **this repo is PUBLIC**. The design is that the one thing in
>    here is a URL that grants exactly what the rules above grant.
> 5. **To turn it off**: set `"sync"` back to `""` and commit. The tab reverts
>    to the chat path with nothing else changed, which is what the first law
>    in the shared-picks block asserts.

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
- 🗣️ **NONE OF THE RANKINGS COPY NAMES WHO PUBLISHES (v77, owner: *"make no
  claim to who will publish them"*).** It said *"the commissioner publishes a
  set each week"* — and **since v33 he can hand the Lab to any manager for a
  week or a season**, so the app was promising something only he can keep, on
  the one screen a reader meets when nothing has landed. It reads *"A set is
  published each week during the season"*: the promise without the claim.
  ⚠️ **Four strings moved together, and three were found by looking for the
  fourth** (the v3 rule) — the empty card, the ? sheet's Rankings sentence, the
  byline FALLBACK on a published week, and the model caveat under the rows.
  🚨 **The fallback was the worst of them.** `p.b ? … : "The commissioner's"`
  fires only when a payload carries NO byline — which is exactly when the app
  knows least about who built the week, so it was guessing hardest at the one
  moment it had nothing to go on. It reads "This week's rankings" now; a week
  with a saved byline also uses neutral copy in v87; the saved field is preserved.
  ⚠️ The ? sheet's line also carried a pronoun (*"once **he** publishes"*) —
  the repo's no-pronouns rule reaching the help text rather than a storyline.
  ⚠️ **`checks.js` asserts all four by their own anchors AND that the promise
  survives** — copy that named nobody by saying nothing would pass a
  name-check while leaving the card unable to explain its own tab.
- **An empty archive, an unreachable one and a MISSING one are three opposite
  facts, and the rankings view says which** (`WK_EMPTY`, keyed by `S.wkErr`).
  "Nothing published yet" when the truth is "you are offline" is a lie the app
  must not tell — and so is saying it when the truth is "`index.json` 404s".
  ⚠️ **`missing` can only ever be a fault**: that file ships in the repo with
  an empty `weeks` array, so an empty SEASON still answers 200. A 404 means a
  broken deploy, and folding it into the friendly copy would hide a failed
  publish behind the one sentence that says everything is fine.
- **A week that is listed and 404s offers the other weeks** (v31). The card
  said "or pick another week" over a screen with no picker on it — a control
  named in a sentence and absent from the page, which is the v30 fault written
  out in prose rather than drawn. `wkPick()` came out of `rankHTML` so both
  cards render the same control, and with only one week on file the sentence
  stops making an offer it cannot keep. ⚠️ It became REACHABLE the moment
  retracting a week became a supported move: a half-done unpublish — file
  deleted, index line still there — lands exactly here. And it logs which file
  failed, because "the file is listed but could not be read" is a sentence
  somebody will have to debug from a phone.
- **A file that parses is not a week that renders** (v29). `paintRankings`
  checks `p.o` is a non-empty array and wraps the render in a `try`, because
  the two failures either side of that are both silent: `p.o` as a STRING
  threw out of an async function whose only rejection handler was `buildJump`,
  so the tab sat on "Loading this week…" for ever with an empty console; and
  `(p.o || [])` catches a MISSING array, so that variant rendered a confident,
  complete, empty ranking with nobody in it. Same fault, one honest sentence.
  ⚠️ And the rejection handler now LOGS — passing `buildJump` as both
  arguments of `.then` is what made the hang invisible in the first place.

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
   if you touched its files). ⚠️ `styles.css` and `power.css` are in BOTH
   pages on ONE number each — `checks.js` fails if the two pages disagree. ⚠️ **`owner.js` is in BOTH pages on one shared
   `?v=` — bump it in both or one of them serves a stale gate.**
3. Bump `CACHE` in `sw.js`.
4. `node --check` every JS file, then `node checks.js` and `node storylines.test.cjs` — there is no test
   suite; syntax check, the conservation and gate laws, plus a headless
   render are the gate. ⚠️ **If you touched `odds.js`, also run
   `node calibrate.js`** (~90s): the suite cannot see a miscalibrated model,
   and that harness is what caught both of the ones that shipped in a draft.
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

- **v90 — Season/storyline accuracy audit (16 Sep 2026).** Removes misleading
  one-game full-season pace, narrows playoff stories to championship games,
  matches scoring baselines, adds conversion stories, corrects luck/odds
  explanations and ties, and isolates cached what-ifs by reader/snapshot.
  Every member retains two or more personal stories and one league card.


Same convention as Sports-Hub's, and for the same reason: entries record the
REASONING, not just the change, so the next session does not repeat a mistake.
**Write them in the present tense, never rewrite one, and when a later change
invalidates an entry add an inline `⚠️ SUPERSEDED in vN` marker to it** — a
stale entry written in the present tense reads as current to anyone who greps.

- **v88 — the history tabs answer five different questions (16 Sep 2026)** —
  the owner approved the workshopped structure without removing any cards.
  - **You** answers how the reader did. **Trophy Case** answers who won.
    **Record Book** answers who owns the numbers. **League Lore** answers what
    the league's stories are. **Cum Bowl** answers who lost and preserves the
    season archive underneath.
  - 🚨 **Records vs Leaders was a code distinction, not a reader distinction.**
    Every numerical table now lives together in Record Book, while derived
    narrative findings live in League Lore. The former Honors page becomes
    Trophy Case with its contents and order intact.
  - No card is deleted: all-time standings, record book, playoff PPG, playoff
    appearances, Final fours and January scoring make up Record Book;
    Storylines, Luck Index and Rivalries make up League Lore.
  - The old `led` key is removed rather than retained as a dead alias. Sub-tab
    state is memory-only, so a browser cannot reopen holding it. `hon` stays as
    the stable internal Trophy Case key because boot deliberately sends a
    stranger there.

- **v82 — a pick belongs to a person, not to a phone (14 Sep 2026)** — the
  owner, with the Parlay tab open while reading as another manager: *"I did
  view as another member and is this what they are seeing in the parlay? I
  told u to sunset the send to group copy and paste and add in the games to
  click"*.
  - 🚨 **NO, IT IS NOT WHAT THEY ARE SEEING — AND ANSWERING THAT HONESTLY
    MEANT RENDERING IT RATHER THAN ARGUING ABOUT IT.** Both things he was
    looking at (a chat box that should be gone, no games to tap) shipped
    correctly in v74 and v80. What he had was a state **only his own phone
    can produce**: he saved a pick as McD, then tapped Hurd on the picker.
    Driven in headless Chromium across seven ownership states, a real member
    on their own phone with no pick gets **twelve tappable lines and no chat
    box**, and his own McD view gets his pick with no chat box. The
    screenshot reproduced byte-for-byte only in the identity-switch case.
  - 🚨 **BUT THE ARTEFACT WAS A REAL BUG WEARING A HARMLESS COSTUME, AND IT IS
    THE VERSION.** `lh:pick` was keyed by WEEK alone — written in v70, when
    nothing about a pick had to know who made it. This app's founding premise
    is that **"you" is a ROLE**, so the one thing a per-device key could not
    be is anonymous. Reading as Hurd, the card said *"your pick is in"* over
    McD's leg while the who-card two inches below listed **Hurd under "Still
    to pick"** — one page, two answers, which is the v14 fault in its purest
    form and the thing the owner actually caught.
  - ⚠️ **AND IT WAS NEVER ONLY A VIEWING FAULT, WHICH IS WHY IT IS A LAW.**
    `edit` and `save` write to `LH.me()`'s row, so changing an inherited pick
    would have put one manager's bet on the shared list **under another
    manager's name** — the one thing the whole ticket rests on not happening,
    since what protects it is a person reading twelve legs with twelve names
    on them. And `drop` would have cleared the real owner's pick off their
    own phone while their row stayed on the ticket: **the exact split the v75
    delete order exists to prevent, reached from the other side.**
  - 🚨 **THE MIGRATION IS RESOLVED, NOT GUESSED, AND THE FIRST CUT GUESSED.**
    A pick saved before v82 records no owner. Dropping every ownerless pick
    outright takes a real leg off its owner's own screen mid-week while the
    who-card still shows them in; **adopting it for whoever is reading is the
    bug this version exists to end** — and that is what my first cut did,
    stamping the reader's code on sight. It reproduced his exact symptom on
    the very next open. The shared list is what can say whose a pick is: a
    matching row under the reader makes it theirs, a matching row under
    somebody ELSE makes it not, and **a pick matching no row at all never got
    out** — which is precisely the state the chat box is for, so that one
    survives. ⚠️ Resolved on every read rather than stamped once, because a
    stamp taken before the list has arrived is a guess written down.
  - 🚨 **THE LAW READS THE RENDERED CARD, NEVER `myPick`** (the v7 rule) — a
    law that agreed with the resolver would go on passing over a view that
    had stopped consulting it, and the rendered card is where he saw this.
    **Both directions**, because a guard that always answered "not yours"
    would "fix" the bug by never showing anybody their own pick, and nothing
    on screen tells those two apart. Fault-injected three ways — the v81
    keying restored (*"reading as another manager showed McD's saved pick as
    the reader's own"*), the guard forced to no, and the ownerless survivor
    dropped — and each is named by its own failure.
  - ⚠️ **MY OWN FIXTURE WAS VACUOUS FIRST AND THE LAW SAID SO.** It set
    `P.picks` and never `P.file`, so `syncOn()` was false, every ownerless
    pick was the reader's by default, and half the law could not fail. Fourth
    version running that a check needed its own setup proved (v67, v73, v77,
    here) — **a sweep is only as trustworthy as its own setup.**
  - ⚠️ **THE CHAT BOX STAYS, AND STAYS FOR ONE STATE.** He is right that it
    is clutter, and v74 already narrowed it to *"this pick is not on the
    shared list"*. Deleting it outright would strand a leg in silence
    whenever a write is refused or `sync` is off, with the reader believing
    they had sent it — so it renders in exactly the two states where it is
    the way through, and a law now asserts it is **absent** from a pick that
    is up.
  - ⚠️ **One thing this cannot verify and it is on his phone: whether ESPN
    answers.** `open.games` in `parlay/current.json` is `[]`, so the board a
    member taps is whatever ESPN's public scoreboard returns — and this
    sandbox cannot reach it (403 through the egress proxy), so the twelve
    lines above are a fixture board. **If ESPN is blocked or unpriced, that
    member gets the write-it-in field and a line saying the lines are not
    posted** (v80), which is correct and is not a board. Worth a look on a
    real phone before Sunday; see Open / next.
  - **Verified:** `node --check` on every JS file; `node checks.js` green with
    the new law fault-injected three ways; the seven ownership states driven
    through the real `index.html` over HTTP; and a render sweep of 4 tabs ×
    {a stranger, McD, Hurd, Woods} × {320, 390} with the store live — no
    horizontal overflow, no clipped text, no type under 9px, no tap target
    under 38px, no template hole, no rendered comment, no page error.
    ⚠️ **The sweep was proved able to fail** by dropping its one exclusion,
    at which point it reports the 76 pre-existing Season-tab clips that are
    already in Open / next and are unchanged by this version.

- **v81 — the roll-call said the same thing twice, and only the reader could
  see it (13 Sep 2026)** — the owner, with the Records storylines on screen:
  *"Remove the fact that I have the party trick line and woods does in the
  main storylines in record. Mine was unluckiest which was fine I never asked
  u to change those."*
  - ⚠️ **Built as v80 and renumbered to v81 on the merge — the v50 collision,
    exactly, and the second time two sessions in flight have both taken the
    next number.** The board work below got to `main` first and keeps v80.
    🚨 **And it is invisible to git for the same reason it was in v50: both
    sides had independently written `'v80'` into `APP_VERSION`, `CACHE` and
    both pages' `?v=`, so those lines merged CLEAN** — an identical string is
    not a conflict. Only `CLAUDE.md`'s changelog collided, because two entries
    cannot occupy one spot; had this version touched no prose it would have
    merged silently and shipped two different builds under one number.
    **Read `origin/main` before bumping, and read the version again out of
    the merged tree.**
  - 🚨 **HE IS RIGHT ON BOTH HALVES, AND v79 CAUSED BOTH — AS A KNOCK-ON OF
    THE PLACINGS, NOT OF ANYTHING ANYBODY EDITED.** Moving the Cum Bowl back
    to `GmC3` re-placed 41 finishes across 9 seasons, and two detectors read
    placings: `worstToFirst` picked up **two new managers** (McD 11th in 2021
    → champion in 2022, Gotch 11th in 2023 → champion in 2024) and lost one of
    Woods's two runs, and `stuckAt` surfaced a tie it had never reached. **The
    data was right, the detectors were right, and the roll-call was wrong** —
    which is the derivation rule's standing bill: a card that re-derives will
    re-derive into a sentence nobody chose.
  - 🚨 **THE DUPLICATE WAS INVISIBLE TO EVERY LAW AND EVERY SWEEP, BECAUSE ALL
    OF THEM READ THE APP AS A STRANGER.** `pickStories` has skipped a manager
    whose claim another manager already made since v66, keyed on the head with
    the NAME taken out — which is only ONE of the two things the voice
    changes. The other is the VERB. *"You do worst-to-first as a party trick"*
    and *"Woods does worst-to-first as a party trick"* are one claim spelled
    two ways, so **the guard held for everybody except the person standing in
    the duplicate.** Measured on v79's own render: McD, Woods and Gotch each
    saw two cards making one claim on their own phone; a stranger saw one.
    - **The key is taken from a THIRD-PERSON build of the same detectors**
      rather than from string surgery on a verb — no list of verb pairs to
      keep in step, and a detector added later is covered without being told.
    - 🚨 **The law asserts an OUTCOME, not a normalised sentence**, because a
      law that stripped the verb the way the code does would be the code
      agreeing with itself: **the roll-call is the same twelve findings — same
      manager, same detector — for every reader as for a stranger.** The v66
      law is left exactly where it is and stays ✅ through the injection,
      which is the clearest possible statement of what it could not see.
    - ⚠️ **And the first fault injection did not reproduce the bug**, because
      the new head is verb-free and the OLD key already dedupes it. A law
      whose failure path has never run is not a law (v39), so it was injected
      against the real v79 state — both the old key and the verb back in the
      head — and it names all three managers.
  - 🚨 **"AS A PARTY TRICK" IS A CLAIM ABOUT REPETITION AND NOBODY REPEATS IT
    ANY MORE.** It was the detector's only wording, written when one manager
    had done it twice; v79 left all three on exactly ONE run, so the card
    called a single off-season a habit over a body listing one line. The head
    says what happened when it happened once and keeps the party trick for a
    manager who does it again.
    ⚠️ **The single-run head carries no number, deliberately** — put the
    finish in it and "12th to champion" and "11th to champion" stop looking
    like one claim to the dedupe, and the duplicate comes straight back.
    ⚠️ And its body says how rare this is LEAGUE-WIDE rather than how many
    titles that manager has: the first cut read *"One of 4 titles"* directly
    ⚠️ SUPERSEDED in v87: the GOAT detector is removed. Previously above the GOAT card's *"with 4 titles"* on his own page — one fact on two
    adjacent cards, which the `stories()` dedupe fingerprints DECIMALS and
    cannot see (v8).
  - 🚨 **AND FIXING ONLY THE CARD HE POINTED AT WOULD HAVE MOVED THE FAULT
    RATHER THAN ENDED IT — WHICH IS THE WHOLE OF WHY HIS SECOND SENTENCE
    MATTERS.** With the duplicate gone his slot fell to `stuckAt`, reading
    **"You have finished 1st four times"** — the title count, in the slot the
    owner himself moved the title count OFF in v16 (`dynasty` is `own: true`
    for exactly that reason). `stuckAt`'s own comment has named the risk since
    v2, *"Buley (11th x7) and the champion (1st x4)"*, and only `leaders()`
    kept the champion off the page because 7 beat 4; v79 took Buley to 4 and
    the tie surfaced. **A championship is not a rut**, so the detector skips
    1st and the title count stays `dynasty`'s — one concept, one number, one
    place it prints (v14). *"Mine was unluckiest"* is what the card reads
    again, and it is reached by two rules rather than by naming him.
  - ⚠️ **Nothing in `DETECT` names a manager and nothing here changed that.**
    Both fixes are about a shape: a claim two people can make, and a finish
    that is not a rut. McD's worst-to-first is still detected, still true, and
    still on his own You page and profile — it is only off the roll-call,
    which is what `pickStories` has done with a shared claim since v66.
  - **Verified:** `node --check` on every JS file; `node checks.js` green with
    all three new laws fault-injected and each naming its own fault (and the
    voice law injected against the true v79 state, not a half of it); the
    twelve-reader sweep in node showing one card per manager, the same twelve
    findings for all twelve readers, and no duplicate claim for anybody; and a
    render of the real `index.html` over HTTP at 320 and 390px across
    {Records, You, Honors} × {a stranger, McD, Woods, Gotch, Buley} — no
    horizontal overflow, no clipped text, no type under 9px, no tap target
    under 38px, no template hole, no rendered comment, no page error.
    ⚠️ **The sweep was fault-injected by pointing it at a v79 checkout served
    on its own port**, where it reports the duplicate for McD, Woods and Gotch
    and nothing for a stranger — which is both the proof it can fail and the
    measurement of the bug.

- **v80 — a board is games you can BET (13 Sep 2026)** — the owner, on the
  week 2 board: *"What time will we get the week 2 odds shown"*.
  - **The question has no time in the answer, and checking that is what found
    the bug.** Nothing here is scheduled: the board is pulled from ESPN by
    the reader's phone when the tab paints, cached 15 minutes, so the lines
    appear on the first open more than fifteen minutes after ESPN carries
    them. What that exposed is **what the tab does in the meantime**.
  - 🚨 **ESPN LISTS A WEEK'S FIXTURES LONG BEFORE THE BOOKS PRICE THEM, AND
    EVERY GATE ON THIS CARD COUNTED GAMES.** So in the window between the
    two — days long, every week, and exactly where week 2 sits today — the
    payload came back with sixteen games and no markets, and the card
    rendered: *"Tap a line below, or write your own prop"*, **no lines**, a
    `.lp-board` container with nothing in it, *"Lines as published with the
    app"* under it, and the write-it-in field **collapsed**, because three
    games looked like a board. **A control named in a sentence and absent
    from the page is the v30 fault**, and this is it in the state the tab
    spends most of the week in. Reproduced on the render first.
  - ⚠️ **The distinction the code was missing is one word**: a board is games
    you can BET, not games ESPN knows about. `playable()` is that question
    asked once, and the lead sentence, the board, the note and the prop
    field's own `open` all read it. **Four gates asking one question four
    ways is how three of them agree and one does not** — which is what had
    already happened here, since `gameBoardHTML` filtered per game correctly
    and then rendered its wrapper anyway.
  - 🚨 **THE REAL RISK WAS NOT THE EMPTY BOX, IT WAS RENUMBERING.** The
    obvious fix is to render the filtered list — and a pick travels as
    `{g, id}` with `selPick` resolving it back through `gamesOf`, so the
    moment one unpriced fixture sat above a priced one, **a saved tap would
    point at a different game**. Silently, and only in the half-priced state,
    which is every week for a day or two. The buttons keep their index into
    the whole week; a law reads the rendered buttons back against the week
    they came from, with the gaps deliberately at 0 and 2, and it names the
    wrong game when injected.
  - ⚠️ **The copy says why, and that it fixes itself.** "The week's board is
    not in yet" now covers two different situations (no fixtures, or no
    prices), so it reads *"The week's lines are not posted yet… Tappable
    lines turn up here on their own once they are"* — nobody has to be told
    to come back, and nobody files it as broken.
  - 🚨 **ANOTHER SESSION TOOK v79 WHILE THIS WAS BEING BUILT, WHICH IS THE
    v50 COLLISION ARRIVING EXACTLY AS PREDICTED.** v50 shipped as v49 because
    two sessions independently wrote the same string into `APP_VERSION`,
    `CACHE` and both pages, and **git merges an identical line clean** — so
    the clash is invisible to the merge. The rule it wrote down is read
    `origin/main` before bumping and re-read after merging; what this version
    adds is the practical half: **do the bump LAST**. The work was committed
    with no version in it, `origin/main` was re-read (it had moved to v79),
    their commit was merged with no conflict, and only then was the number
    taken — so there was never a moment when two commits claimed one version.
  - Verified on the merged tree, both sessions' work together: `node --check`
    on every JS file, `node checks.js` green including v79's new Cum Bowl
    laws and v80's five, each of mine fault-injected and naming its own
    fault. Rendered across **96 view-contexts** — four tabs × four personas ×
    {320, 390} × {the shipped file, a week of fixtures with no odds, a
    half-priced week}: no overflow, no clipped text, no template hole, no
    page error, and every clip reported is the Season tab's team names, which
    are pre-existing and in Open / next. Plus the tap driven through the real
    page on a half-priced board — `data-g` 1 and 3 with the gaps at 0 and 2,
    and the last game's moneyline saving as **TEN ML vs LAR +145**.

- **v79 — the Cum Bowl is round one, and it decides last place (13 Sep 2026)**
  — the owner, with the whole 2022 consolation bracket on screen beside the
  app: *"Pic 2 is the actual cum bowl. U have it as the 3rd of consolidation
  bracket. That is so wrong… The cum bowl is 1st round of playoffs between the
  11th and 12th ranked team immediately following the regular season."* Then,
  on the first fix: *"losing the cum bowl does make u finish last. We DO NOT
  CARE about any consolidation bracket games besides the cum bowl."*
  - 🚨 **v66 MOVED THE CUM BOWL TO `GmC9` AND IT WAS WRONG FOR THIRTEEN
    VERSIONS.** The 2022 card read *Slemp 91.5 · Hurd 72.0*; the league means
    *Slemp 108.9 · CC 92.6*. He found it by reading the bracket against the
    tab — the same way he found v66's bug, off one card.
  - 🚨 **THE STRUCTURE WAS CHECKABLE AND NOBODY HAD CHECKED IT.** Round one of
    the consolation ladder pairs 7v8, 9v10 and 11v12, so `GmC3` is the 11 seed
    against the 12 — verified in **all 12 seasons with a ladder**, two ways:
    ESPN's own published seeds say 11 and 12 in the 7 seeded seasons, and in
    the 5 unseeded ones (2013-17 seed the bracket six only) the pair is the
    bottom two of the consolation six by record. ⚠️ **That derivation also
    matches the 11/12 assignment hand-typed in v65, off the ESPN pages, years
    earlier** — so the seeds now rest on two independent sources, 12 of 12.
  - 🚨 **v66's LAWS WERE THE REASON IT FELT SAFE TO MOVE, AND THEY COULD NOT
    HAVE CAUGHT THE MOVE BEING WRONG. THIS IS THE VERSION'S REAL LESSON.**
    They asserted that the winner finished 11th and the loser 12th — which is
    a restatement of v66's own definition, not a test of it: `GmC9` decides
    11th/12th *by construction*, so the law was true of any reading pointing
    at `GmC9` and said nothing about whether `GmC9` was the right game. **A
    law derived from the definition it is checking cannot fail for the only
    reason that matters.** It is the v14 rule one level up: the totals could
    not see which game they counted, and the laws written to fix that could
    not see which game they described. The replacement is external — a fact
    about the FORMAT (round one pairs the bottom two seeds), taken from the
    bracket's own shape. Pointed back at `GmC9` it reports 9 of 12 seasons
    wrong while every total stays green.
  - 🚨 **AND v66 LEFT A SECOND DEFINITION STANDING IN THE SAME FILE.** `MEET`
    has tagged `GmC3` as `kind: 'cb'` since v1 and v66 never touched it — so
    from v66 to v78 a head-to-head row called 2022's *Slob on my Cobb v London
    Silly Willies* a Cum Bowl while the Cum Bowl tab showed a different game.
    **One file, two answers, thirteen versions, every law green**, because
    both feed the same totals. ⚠️ **The half nobody edited was the right
    half.** A law ties them together now. ⚠️ My first comment about this
    asserted a duplicated row as well; the data said otherwise and the comment
    was corrected before it shipped — **a claim about a bug is a claim, and it
    gets checked like one.**
  - 🚨 **THE PLACINGS: THE LEAGUE'S RULE BEATS ESPN'S, IN 9 OF 13 SEASONS, AND
    THAT WAS PUT TO HIM BEFORE A ROW MOVED.** My first cut wrote *"Losing it
    does not make you the league's worst"* — derived, honestly, from ESPN's
    standings, where the GmC3 loser finished last only 5 times in 13. He said
    that is not how the league works. ⚠️ **So the question went back to him
    with the collision named in his own season** — ESPN has Hurd last in 2022,
    the Cum Bowl loser is CC — because 41 placings across 9 seasons is not a
    call to make on an inference. He chose the Cum Bowl.
    - **`cbPlaced` applies it at the SEASON build and the transcribed rows are
      untouched.** ESPN's pages are the evidence the whole archive rests on;
      hand-editing thirteen row arrays to record a convention would have
      destroyed the evidence to store the conclusion. One `return` undoes it.
    - ⚠️ **The sharp edge is stated on the card and here rather than left to
      be discovered:** the Cum Bowl WINNER is 11th even when they went on to
      win the whole ladder. Gotch won the 2023 Cum Bowl and two more games —
      ESPN scores him 7th, this scores him 11th; same for McD in 2021 and
      Gotch again in 2020. That is what the rule says, and it is the owner's
      to soften.
    - 🚨 **THE STANDINGS LAW WENT RED IN 9 SEASONS AND WAS REWRITTEN, NOT
      RELAXED — the v42 trap, arriving exactly when it is easiest to "fix" a
      law without thinking.** It had encoded ESPN's ladder (GmC7/8/9 decide
      7-8, 9-10, 11-12). Now 11th and 12th are pinned to the Cum Bowl
      directly, and GmC7/GmC8 are still held to deciding adjacent places
      **whenever neither of their teams is in the Cum Bowl** — the whole of
      ESPN's ladder that survives, and it still catches a mistyped result.
      Fault-injected both ways.
  - ⚠️ **The one v66 flag that came off is the one v66 argued from data.**
    `cleanFloor` was made own-page-only because the redefinition weakened it
    to "never finished 11th or 12th", which three managers cleared. Back at
    `GmC3` it is "never last AND never once a bottom-two seed", which exactly
    one manager in the league clears — Zach — so it is a league card again.
    **The other three `own` flags are the owner's calls between two cards and
    are untouched**: a flag that exists because of a fact goes when the fact
    does; a flag that exists because somebody chose does not.
  - ⚠️ **Three of my own sentences were wrong before the code was, and the
    render is what showed it.** The card's *"Nobody scores in these"* was true
    of `GmC9` (13.5 under the league, two spent teams in week 17) and false of
    round one (3.1 under) — so the headline is now **picked by the numbers**,
    between the low-scoring reading and the blowout reading, and cannot outlive
    its data. I also wrote "nine games later" where it is two rounds, and
    seeded the new comparator as `(a) || (b) >= 0`, where `>=` binds tighter
    than `||` — it asked whether the POINTS gap was positive and used win% as
    a truthiness test. The `bySeed` family (v62), caught by reading it back.
  - ⚠️ **And the render harness lied first, again.** The sub-tab bar is
    rewritten by `innerHTML` on every view change, so the button the sweep had
    just clicked was DETACHED and its `aria-selected` still read `false` — 50
    reported failures, every one about the harness. It re-queries now. **A
    sweep is only as trustworthy as its own setup**, which is v67's lesson and
    the third version running it has had something to say.
  - ⚠️ **KNOCK-ONS IN THE STORYLINES, FOUND IN v81 AND NOT HERE.** Re-placing
    41 finishes moved two detectors that read placings — `worstToFirst` gained
    two managers and lost one of Woods's runs, `stuckAt` surfaced a tie — and
    the roll-call started printing one claim twice. **Every law and every
    sweep in this version was green over it, because all of them read the app
    as a stranger and the duplicate only existed in second person.** See v81.
  - **Verified:** 24 Cum Bowl appearances and 11 losses (the v1-v65 figures,
    which the file header comment has said all along and which v66 silently
    contradicted at 25/13); `node --check` on every JS file; `node checks.js`
    green with all six new laws fault-injected and each naming its own fault;
    a sentence-level diff of **every rendered view** against v78 across five
    readers; and a render sweep of 2 widths × 6 readers × 5 tabs with every
    `<details>` forced open — no overflow, no clipped text, no type under 9px,
    no tap target under 38px, no template hole, no rendered comment, no page
    error — with the sweep itself fault-injected to prove it can fail.

- **v78 — the parlay's running record covers all twelve, and a stale open week
  stops offering played games (13 Sep 2026)** — the owner: *"Make sure for the
  parlay page it tracks the history so we can see past parlays and each
  persons w-l record for the year. Week 1 won't have any picks but starting
  next week we will."*
  - **Most of what he asked for was already there and was checked before
    anything was written.** 📖 Every ticket has held every past parlay since
    v69, 🎯 Who carries the ticket has held the per-manager record, and 📋 The
    season so far has held the tally — all derived from `weeks`, so a
    corrected leg corrects the lot. Driven with a four-week fixture (a push
    week, a one-leg bust, a clean sweep, one still running) it renders
    correctly. **The faults were in the two things his sentence implies and
    nobody had exercised: a twelve-person table, and a week that never gets a
    ticket.**
  - 🚨 **THE W-L TABLE WAS A LIST OF WHOEVER HAD HAPPENED TO PICK.** It is
    built from the legs, so a manager who sat the season out had **no row at
    all** — absent from the one card that is the league's running record,
    with nothing on screen distinguishing "has not put a leg in" from "not in
    this league". That is the **v7 coverage fault** in a new costume, and it
    lands the same way: on the person it is least fair to, because "has not
    been putting a leg in" is exactly what this card could usefully say and
    it said it by saying nothing. All twelve are seeded from `LH.roster()`.
    - ⚠️ **A row with no legs prints NO record, not `0-0`.** The Lab's oldest
      rule (v1: *a fabricated 0-0 beside a name is a lie*) — and `0-0` would
      read as a settled nought-and-nought rather than as somebody who has not
      been in. Three states, three sentences.
    - 🚨 **AND THE NEW ROWS MADE A NON-TRANSITIVE COMPARATOR REACHABLE.** The
      sort read `y.rate == null ? -1 : …`, which answers −1 **whichever way
      round it is asked** for two managers who both have nothing settled — the
      `bySeed` fault (v62), arriving in the one card where week 1 of a season
      puts twelve unrated rows side by side. Measured, the old comparator
      simply **reversed the roster** and never reached its own tiebreak, so
      the first week of a season would have ranked twelve people in an order
      nothing on the page could explain.
    - 🚨 **MY FIRST LAW FOR THAT COULD NOT FAIL, AND ONLY FAULT INJECTION
      SAID SO.** It derived the same season twice and compared the orders —
      which passes over a broken comparator, because V8 sorts twelve items
      with an insertion sort that is deterministic even when the comparator is
      not. It asserts the order the rows must be IN (by name, since nobody is
      ranked). **A law whose failure path cannot run is not a law** (v39) —
      and a law that merely *agrees with the bug* is the worse half of it.
  - 🚨 **"WEEK 1 WON'T HAVE ANY PICKS" IS A STATE THE OPEN-WEEK RULE COULD NOT
    SURVIVE, AND HE SAID IT IN PASSING.** `open` is the one hand-kept field on
    this tab, so it is the one that goes stale, and every week after the first
    was meant to derive from the newest ticket — **which requires a ticket**.
    A week that takes none leaves `open` pointing at it for ever. Reproduced
    on the render: tickets through week 5, `open` still on week 1, and the tab
    offered **week 1's picks with week 1's board** — games played a month
    earlier — under a ticket card reading Week 5. That is the exact thing v70
    wrote the rule to prevent, stated as *"a week that already has a ticket is
    closed"* when the real rule is *behind the season*.
    - **A stated `open` is now honoured only while it is ahead of the newest
      ticket**, so the season heals it. ⚠️ **And the board does not travel with
      an overtaken week** — carrying those games forward would put last
      month's fixtures under this week's heading, which is worse than no
      board, since a missing one renders the prop field and says so.
    - ⚠️ **It also ends a symptom this file used to document as a chore.** An
      `open` left sitting ON the week just published returned null and the
      pick card simply **vanished**; CLAUDE.md's publish procedure carried a
      step telling the next session to remember to edit it. **A hand-kept fix
      for a hand-kept field is not a fix**, and that step is gone.
    - 🚨 **THE EXISTING LAW FOR THIS ASSERTED THE OLD ANSWER, WHICH IS THE v42
      TRAP ARRIVING ON SCHEDULE.** It required `_open` to return **null** for
      a week with a ticket — true of the code, never the invariant, and it
      went red the moment the design changed, which is the one time it is
      easiest to "fix" a law without thinking. Rewritten to the permanent
      fact: **a week that has been bet is never the open week**, whatever is
      written in `open`.
    - ⚠️ **The data move still has to happen once**, and it is done: `open` is
      **Week 2**, with `games` empty so ESPN fills the board from the reader's
      phone (v72). Week 1 takes no ticket, so nothing published could have
      advanced past it.
  - 🚨 **TWO MEASURED RENDER FAULTS IN THE EXACT CARD HE ASKED ABOUT, BOTH
    SILENT, NEITHER VISIBLE TO ANY ASSERTION.**
    - **The rank column clipped a joint two-digit rank.** `=10` measures 25px
      against a 22px grid cell, so a three-way tie in the bottom third — which
      the fixture produces, and which is ordinary in a twelve-person league —
      cut the rank off with nothing on screen saying so. 26px now, with
      `.lp-ld-s`'s padding moved with it or the sub-line stops lining up.
    - **The rank was `--mu2`: 2.56:1 on white and 2.36:1 on the reader's own
      tinted row.** v69 measured that exact tone and moved every piece of TEXT
      on this tab off it; this one was missed — and it is **the column the
      card is sorted by**, rendering faintest on the row belonging to whoever
      is holding the phone (the v52 finding: the row that looks broken is
      yours). It is 6.6:1.
  - Verified across **96 view-contexts** — four tabs × {a stranger, the
    reader, another manager, the nine-season manager} × {320, 390} × {a
    four-week season, the shipped file, a season where only five of twelve
    have picked}: no horizontal overflow, no clipped text, no template hole,
    no rendered comment, no page error, and every clip the sweep does report
    is the **Season tab's team names**, which are pre-existing and already in
    Open / next, unchanged by this version. Plus the stale-open reproduction
    both ways and a no-legs row reading in second person for its own reader.
    `node --check` on every JS file and `node checks.js` green, with all five
    new laws fault-injected and each one naming its own fault.

- **v77 — the rankings promise a set, not a person (13 Sep 2026)** — the
  owner, with the empty Rankings tab on screen: *"Change the wording to the
  rankings will be published. Make no claim to who will publish them"*.
  - **The card said *"The commissioner publishes a set each week during the
    season"*, and the app has not been able to promise that since v33.** That
    version built guest passes precisely so he can hand the Lab to another
    manager for a week or a season — the copy was written in v1 and simply
    never revisited when the feature that contradicted it shipped. It reads
    *"A set is published each week during the season"*: **the promise kept,
    the claim dropped.**
  - 🚨 **HE POINTED AT ONE STRING AND THERE WERE FOUR, WHICH IS THE v3 RULE
    AND THE REASON TO LOOK BEFORE EDITING.** The ? sheet's Rankings sentence,
    the byline line on a published week, and the model caveat under the rows
    all made the same claim. Fixing only the one in the screenshot would have
    left the reader meeting it again on the next tap.
  - 🚨 **THE BYLINE FALLBACK WAS THE WORST OF THE FOUR, AND IT IS THE ONE
    NOBODY WOULD HAVE FOUND FROM A SCREENSHOT.** `p.b ? … : "The
    commissioner's"` fires **only when the payload carries no byline at all** —
    so the app asserted authorship hardest in the single case where it knew
    nothing about who built the week. ⚠️ SUPERSEDED in v87: bylines are no longer shown in Rankings. Previously, a week WITH a byline is untouched and
    still leads with it, which is what v33 added it for.
  - ⚠️ **The ? sheet's line also said "only once *he* publishes a set".** This
    repo has banned pronouns in generated copy since v1 (a sentence that
    agrees with the wrong person is the first thing a reader notices) — the
    rule had simply never been pointed at the help text, because that text is
    not generated. It is now in the law.
  - 🚨 **THE FIRST CUT OF THE LAW CRIED WOLF, WHICH IS THE ONE THING A LAW
    MUST NOT DO.** It tried to find string literals in `league.js` with a
    regex and reported three faults in correct code — it was matching
    fragments of **the comments explaining this very rule**. A regex cannot
    tokenise JavaScript. Each of the four strings is extracted by its own
    anchor instead, and every branch is fault-injected.
  - ⚠️ **And the law asserts the PROMISE as well as the silence.** Stripping
    the claim must not strip the sentence: copy that named nobody by saying
    nothing would satisfy a name-check while leaving the one card a reader
    meets before anything lands unable to explain what the tab is for.
    Fault-injected by deleting the clause.
  - ⚠️ **A vacuous render assertion, again, caught by reading the output.**
    The check for the bylineless week swapped the index fixture mid-session
    and re-clicked the tab — but `loadWeeks()` memoises, so the empty list was
    re-used, the week never rendered, and *"and it names no publisher"* passed
    over a **blank page**. Each case gets its own browser context now, and the
    render is asserted before anything is asserted about its words. Third time
    in three versions (v73's cache, v76's season hold, here).
  - Verified on the render at 320 and 390px: the empty card, the ? sheet, and
    a published week with no byline — reading *"A set is published each week
    during the season"* and *"This week's rankings for the league"*, with no
    "commissioner" anywhere in any of them, no overflow and no page errors.
    `node --check` on every JS file and `node checks.js` green, the new law
    fault-injected five ways.

- **v76 — the parlay was painting over other tabs (13 Sep 2026)** — the owner,
  with a screenshot of History and Leaders both lit and the parlay's pick card
  in the body: *"It seems sometimes when I reopen the app it loads looking at
  the parlay page even if it's on another tab. Fix that bug"*.
  - 🚨 **THE BUG IS MINE, INTRODUCED IN v73 AND MADE WORSE IN v74, AND IT IS
    THE COST OF ONE ELEMENT SHARED BY FOUR VIEWS.** `#lg-body` is a single
    node that every tab writes into, and two files write into it from work
    that outlives the tab: `season.js` has revalidated behind the reader since
    v42, and v73 added a `visibilitychange` handler to `parlay.js` that
    re-asks the shared store — **which fires on every reopen, with
    `force: true`, so it rendered unconditionally**. Neither had any way to
    ask whether it was still on screen. The answer arrived and overwrote
    whatever was there, leaving the tab bar telling the truth about a page
    that was no longer under it.
  - ⚠️ **THIS IS THE v1 RULE POINTED THE OTHER WAY, AND WORTH NAMING AS ITS
    OWN SHAPE.** v1 was *a value derived at init cannot answer a question
    asked later*; this is its mirror — **an answer that arrives later cannot
    assume the question is still being asked.** Everything async in this app
    now has to be able to say who it is for, not just what it found.
  - **The shell stamps the body and the two late painters read the stamp.**
    `paint()` sets `host.dataset.view = S.view` at the one place a view change
    goes through, before the body is handed to anybody, and `season.js` and
    `parlay.js` each return early from `render()` when the stamp is not
    theirs. ⚠️ **The stamp lives in the shell rather than as a flag in each
    module**, because `paint` is never told when a view is torn down: a local
    "am I visible" boolean would have to be maintained from outside, and the
    day it drifted this would be back exactly where it started.
  - 🚨 **ASSERTED IN BOTH DIRECTIONS, BECAUSE ONE DIRECTION IS NOT A FIX.** A
    guard that always answered no would take the bug off the screen by
    breaking the feature outright — the parlay would simply never repaint, and
    **nothing on screen distinguishes the two until somebody's picks stop
    turning up**. So the law drives the real helper both ways and drives
    `render()` itself: it must leave another view's body untouched AND paint
    its own. Fault-injected five ways (stamp deleted, stamp moved below the
    hand-off, either guard deleted, guard forced false) and each is named.
  - 🚨 **AND FIXING IT IN `season.js` TOO WAS DONE BY ANALOGY AND THEN
    REPRODUCED, WHICH IS THE DIFFERENCE BETWEEN A GUARD AND A GUESS.** The
    owner only ever saw the parlay; the v3 lesson (fixing the tab somebody
    pointed at while the same fault sits one file over) said to check the
    other. ⚠️ **My first render assertion for it was VACUOUS and only fault
    injection showed it** — with the guard removed it still passed, because
    nothing was in flight when the tab changed: this sandbox cannot reach the
    backend, so the revalidate fails fast. Holding `season/current.json` open
    for two seconds puts a real answer in the air, and then the season does
    land on top of History with the guard out. **A check whose failure path
    has never run is not a check** (v39), for the second time in three
    versions.
  - ⚠️ **`checks.js` asserts the ORDER as well as the stamp.** A stamp written
    after the body has been handed to a view is a stamp that view could not
    have read — the v41 hash-order precedent, and the law names which caller
    got there first.
  - Verified: the exact reproduction from his screenshot (reopen while on
    History) no longer produces the parlay card; a reopen **on** the parlay
    still picks up new picks; leaving and coming back repaints with the newest
    list; and a season fetch that lands after the tab changed stays off
    screen. `node --check` on every JS file, `node checks.js` green, and the
    24-context render sweep clean but for the three colours already sitting in
    Open / next (the `▾`, `.lg-brand small`, `.lg-foot p`) — none of which
    this version touches.

- **v75 — clear my pick, and the version moves to the foot (13 Sep 2026)** —
  the owner, two asks: *"Allow option to clear pick from selection just like
  the change pick option"* and *"Move the v75 or whatever v we are on to the
  bottom of page"*.
  - 🔢 **The version leaves the masthead for the footer**, and the only
    property that had to survive is that it is still on **every** screen —
    v12 exists because a "this looks wrong" report turned out to be a cached
    build, and the first question is always which one they are running.
  - 🚨 **AND MOVING IT EXPOSED THAT THE SWEEP HAD NEVER MEASURED THE CHROME.**
    Every render sweep in this repo's history queried `#lg-body *`, so the
    masthead and the footer — the two things on every screen — were outside
    every measurement taken since v1. Widened to `.lg-top *, #lg-body *,
    .lg-foot *`, it immediately reported **three** contrast failures, one of
    them mine and two of them years old:
    - **`.lg-brand small` is 3.11:1**, and that is where the version string
      had been sitting for 74 versions. **The app's one diagnostic was below
      the readable threshold the whole time** — which turns the owner's
      layout preference into a legibility fix by accident.
    - **`.lg-foot p` is 2.27:1**, the faintest text in the app. Recorded in
      Open / next rather than drive-by fixed, like the `▾`.
    - 🚨 **AND MINE FAILED AT 2.27:1 TOO, BECAUSE THE SELECTOR LOST.**
      `:root[data-palette] .lg-ver-l` is (0,3,0); `:root[data-palette]
      .lg-foot p` is (0,3,1). The muted rule won and took the **entire**
      declaration — colour, size and weight — so the element rendered at
      exactly the contrast its own comment existed to avoid. **The CSS read
      correctly and lost**, which is the specificity trap this file already
      warns about three times, arriving in the plainest possible form.
      Measured off the render (`rgb(169,161,147)`, not the `--gy` it was
      given); nothing else could have seen it. It is **6.2:1** now.
  - 🧹 **And the button he asked for:** Clear my pick, beside Change.

  *(the clear-my-pick reasoning follows)*
  - **A second button beside Change my pick**, which takes the row off the
    shared list rather than overwriting it. Change was the only exit and it
    only ever swaps one bet for another; there was no way to come off the
    ticket.
  - 🚨 **THE ORDER OF THE TWO WRITES IS THE WHOLE FEATURE.** The DELETE goes
    first and `lh:pick` is cleared only if it succeeds. Reverse them — the
    obvious way, and the way SAVING does it — and a refused delete leaves the
    reader with no pick on their own phone while the other eleven, and the
    ticket, still carry their bet. **That split is worse than not having the
    button.** ⚠️ Saving is the mirror and is right to be: a save ADDS, so the
    local write is the one that must not fail; a clear REMOVES, so the remote
    one is. They are not symmetric and treating them the same is the bug.
  - 🚨 **IT NEEDED THE FIREBASE RULES WIDENED BY ONE CLAUSE, AND THE APP SHIPS
    WORKING WITHOUT IT.** A delete carries no `newData`, so v73's
    `newData.hasChildren([…])` refused it. `!newData.exists() ||` allows it —
    still leaf-only, so the most anybody can remove is one pick, which they
    could already overwrite with anything. Against the OLD rules the delete
    401s, **nothing is cleared**, and the card says the pick is still on the
    ticket and to change it instead. So the paste is worth doing and is not
    urgent, which is the only honest way to ship a feature that depends on
    somebody else's console.
  - ⚠️ **`data-lp="drop"`, never `"clear"`** — the collector's "Start again"
    already owns that name on the same delegated listener, and two branches
    for one name means the wrong thing gets cleared in silence. **The v71
    `boardHTML` collision, pre-empted this time rather than found**, with a
    law naming both.
  - ⚠️ **A law pins the DELETE path to the reader's own row.** One wrong
    segment and Clear removes somebody else's leg or the whole week — verified
    by injecting exactly that (`/picks/w4.json`), which the law reports three
    ways.
  - ⚠️ **And one of my own sweep assertions was wrong before the code was.**
    It expected the shared count to fall to "0 of 12" after a clear; the
    fixture holds five rows, one of them the junk one, so the true answer is
    4 → 3. The sweep dutifully reported the CODE for my arithmetic. **An
    assertion has to know what its fixture holds** — it checks the reader's
    own row is gone and the total dropped by exactly one now.
  - Verified by driving the real button at 320 and 390px, both ways: with the
    store accepting the delete (row gone, count down one, card back to the
    board, `lh:pick` empty) and with it **refusing** (nothing cleared, the
    pick still on the card, the note saying it is still on the ticket). The
    store mock is stateful for this — a route that always answers the same
    cannot tell a delete happened. Plus the same 18 view-contexts, with the
    three-button row measured at 320px: nothing clipped, no overflow, no tap
    target under 38px.

- **v74 — the chat box goes, and two bugs come with it (13 Sep 2026)** —
  folded into the v73 entry below, because it is the same feature reaching the
  owner's phone: the store confirmed working both directions, the chat
  fallback narrowed to the two states that need it, and the render sweep
  turning up a discarded first fetch and a cache that was read and never
  drawn. See the last four bullets of v73.

- **v73 — the picks can land in everybody's app (13 Sep 2026)** — the owner,
  with the "picks travel through the group chat" card on screen: *"That apps
  don't get stored and saved through the app? Why not"*.
  - **He had now asked three times** — v70's *"it saves for all the be seen on
    parlay tab"*, v71's follow-up, and this. The first two got a mechanism
    that was honest and was not what he asked for. ⚠️ **Repeating the
    constraint a third time would have been the wrong answer**: the right one
    was to say plainly *why* there is nowhere to write, put the three real
    routes to him with what each costs, and let him pick. He picked Firebase
    in one word.
  - 🚨 **THE "WHY NOT" IS A FACT ABOUT HOSTING AND NOT A DESIGN PREFERENCE,
    AND THAT DISTINCTION IS WHAT MADE IT ANSWERABLE.** GitHub Pages hands
    files out; nothing in this project accepts anything back. So the question
    was never "should the app store picks" — it was "who owns the thing that
    takes a write", and the only three answers were his Render backend (a
    different repo, a free-tier cold start, and **unreachable from this
    sandbox**), a keyless third party, or nothing.
  - **`sync` in `parlay/current.json`.** Fill it in and every saved pick
    writes to a Firebase Realtime Database and the tab grows a **👥 who is
    in** card. Leave it blank and the tab is byte-for-byte the v72 app.
    🚨 **Turning it on is one line of DATA with no version bump**, which is
    what made the switch-on a five-minute job an hour after the code shipped:
    he made the project, pasted the rules, sent the URL.
    - ⚠️ **AND THE LAW I WROTE FOR IT WAS WRONG WITHIN THE HOUR.** The first
      cut asserted the file *ships blank* — true of the release, never an
      invariant, and it went red the moment he switched the store on. **That
      is the v42 trap exactly: a test that encodes the old design fails at the
      one moment it is easiest to "fix" without thinking.** Replaced with the
      three that are permanent — the file carries **no credential** (grepped
      for apiKey, databaseSecret, private_key, service account, bearer token,
      because the repo is public and a committed token is readable for ever),
      a `sync` that is SET must **actually resolve** (a path or plain http is
      refused *silently*, so the tab would look like the chat-path app while
      somebody believed the store was live), and with `sync` blank the tab is
      still the v72 app — asserted against a blanked COPY, so it goes on
      testing the degrade path now that the real file is live.
  - 🚨 **THE HARD CONSTRAINT SURVIVES, AND IT IS THE SAME ARGUMENT v42 MADE
    ABOUT READS, POINTED AT A WRITE.** `lh:pick` is written first and cannot
    fail; the `PUT` happens after. A dead store costs the other eleven a live
    view and costs the picker nothing — their leg is saved and their chat line
    is on screen underneath it. **The store is an upgrade over the chat path,
    never a dependency of it**, which is the only footing on which a members'
    app is allowed to write anywhere at all.
  - 🚨 **EVERY ROW OUT OF IT IS UNTRUSTED INPUT, BECAUSE THE URL IS PUBLIC AND
    THE REPO IS PUBLIC.** The store is world-writable by design: a row can
    name somebody not in the league, carry a price that is not a number, be
    an empty string, or not be an object at all. `rowsToLegs` puts every one
    through **the same `checkPick` a pasted link goes through** — one
    validator, not two, because two would eventually disagree about what a leg
    is (the v14 fault) — and drops what fails while COUNTING it, so the card
    says how many it left out rather than quietly showing eleven of twelve.
  - 🚨 **AND A SYNCED PICK IS STILL NOT A CREDENTIAL, WHICH IS THE SENTENCE
    MOST WORTH GETTING RIGHT ON THAT CARD.** There is nothing to sign in to;
    anybody who reads `parlay.js` could write a row under any name — the same
    bar the published passphrase hash already sets, against the same eleven
    relatives. What protects the ticket is unchanged: a person reads twelve
    legs with twelve names on them before it goes to a book. **A shared list
    that LOOKED authenticated would be worse than no shared list**, so the
    card says "a shared list, not a login" and there is a law on that clause.
  - 🚨 **ONE RESOLVER FOR THREE ROUTES, AND THE SPLIT IS THE WHOLE OF WHY IT
    IS SAFE.** A leg now arrives by pasted chat, by tapped link and by the
    shared list. `takeOne` became the decoding step in front of `takeLeg`, and
    all three end there — a second copy of "later wins" would eventually
    disagree with the first about which of two picks is on a ticket somebody
    has paid for. The law asserts the store and the chat produce a
    **byte-identical leg** from the same pick, and it is fault-injected.
  - 🚨 **THE SECURITY RULES GRANT WRITE AT THE LEAF AND NOWHERE ABOVE IT**,
    and that is the one thing in the setup not to "tidy". At
    `picks/$week/$mgr` the worst anybody can do is overwrite one pick — which
    is what changing your mind does anyway, and it is on screen with a name
    beside it. Hoisted to `picks` or the root, a single request empties the
    tree. They are in CLAUDE.md ready to paste, with nothing else in that
    database readable or writable at all. ⚠️ **No API key, no database secret,
    no config object goes in this repo** — the design is that the one thing
    committed is a URL that grants exactly what those rules grant.
  - ⚠️ **Nothing is ever deleted from the store** (a delete has no `newData`,
    so the rules refuse it), so "Change my pick" now says out loud that the
    other eleven are still looking at the old bet until the new one is saved.
    A thing the reader would otherwise assume either way.
  - ⚠️ **Pulling the list into the ticket is a TAP with a count on it.** It
    changes what somebody is about to put money on, so it reports what it did
    — duplicates included, still reported rather than resolved quietly (v70).
    And it has **its own sentence**: "nothing in that paste looked like a
    pick" is true of a paste and nonsense about a list nobody pasted.
  - ⚠️ **It asks again when the app becomes VISIBLE, not on a timer.** That is
    the moment somebody wants to know who has picked; a poll running all
    Sunday would spend a battery on a list that changes twelve times a week.
    ⚠️ And the Refresh button says **"Checking…"** before it goes, because the
    answer is usually the same list and a repaint of identical rows reads as a
    control that does nothing — the v30 fault, which is about silence rather
    than about being wrong.
  - ⚠️ **👥 is its own mark and a law refuses the five already on that page.**
    The v50 icon clash arrives here exactly the way it did there — as a
    knock-on of a new card appearing next to old ones — and the jump row is
    read by its mark.
  - 🚨 **UNTESTED AGAINST A REAL FIREBASE, AND THAT IS SAID HERE RATHER THAN
    IMPLIED.** This sandbox cannot reach `*.firebaseio.com`. What IS verified
    is every branch with the network intercepted at the browser — the store
    answering, the store dead, and the store absent — driven through the real
    `index.html` over HTTP. **The one thing his phone has to confirm is that
    saving a pick reads back "Saved — the others can see it on their Parlay
    tab"** rather than "the shared list couldn't be reached". Same division
    this repo already draws around the Lab and around ESPN.
  - 🚨 **AND READING THE FLOW — NOT MEASURING IT — FOUND A CONTROL THAT WOULD
    HAVE LIED.** A tap focuses the button, and `quietRender` skips a repaint
    while a button has focus (so an unprompted refresh cannot move a control
    under a thumb). Route an explicit Refresh through that and **"Checking…"
    stays on screen for ever with the fresh list already in hand** — a button
    reporting the opposite of what it just did, which is worse than the v30
    silence it was written to avoid. An answer the reader ASKED for repaints
    regardless. There is an interaction test for it in the sweep now: click
    Refresh, wait, assert no status line still says "Checking".
  - 🚨 **THE FIRST TWO SWEEPS WERE WORTHLESS AND SAID SO ONLY WHEN ASKED TO
    PROVE THEMSELVES.** The **service worker answered `parlay/current.json`
    before Playwright's route interception saw it**, so every "store on"
    context was silently measuring the shipped blank file — the who card was
    absent and the harness dutifully reported it absent. `serviceWorkers:
    'block'`, plus an assertion that the intercepted `sync` actually arrived
    in the page, which is the v67 rule one turn further on: **a sweep must
    prove its own setup landed, not just that it reached the right tab.**
  - 🚨 **ONE COLOUR OF MINE FAILED ITS OWN MEASUREMENT, AND FIXING IT MEANT
    FIXING THREE CARDS I HAD NOT TOUCHED.** `.lp-leg-p b` is `--mu`, which is
    **3.81:1 at 11.5px on white and 3.5:1 on the reader's own tinted row** —
    the exact tone v69 moved every other muted string off. It slipped that
    sweep because its four callers are a closed `<details>` (the collector),
    two ticket lists, and a card that did not exist yet. Fixed in the RULE
    rather than on the new card: fixing the one you happen to be looking at
    while the same fault sits alongside is the v3 lesson.
  - ⚠️ **The sweep blocks Google Fonts on purpose**, which is both faster
    (13s a page load through the proxy became under a second) and the correct
    measurement: the fallback is what a phone that cannot reach Google
    renders, it is wider than Archivo, and so it is the number that has to fit
    (v55).
  - Verified across **18 view-contexts** — {store on · store dead · store
    absent} × {320, 390} × {a stranger, the reader, another manager}, driven
    through the real `index.html` over HTTP with the store intercepted at the
    browser: no horizontal overflow, no clipped text, no type under 9px, no
    tap target under 38px, no template hole, no rendered comment, no page
    error, and every colour over 4.5:1 **except the pre-existing `▾` on every
    `<details>`**, which is in Open / next with its measurements and is
    confirmed unchanged from v72. `node --check` on every JS file and
    `node checks.js` green, with all seven new laws fault-injected.

- **v72 — the board comes from ESPN (13 Sep 2026)** — the owner pasted the
  live scoreboard payload after being told it was the one thing missing.
  - **Fourteen games, 84 tappable lines, real prices, fetched from the
    phone.** No key, no backend, no typing.
  - 🚨 **THE TRANSFORM WAS WRITTEN AGAINST THE CAPTURE, WHICH IS THE ONLY
    REASON IT IS RIGHT.** Four of the pasted events are in
    `fixtures/espn-nfl-scoreboard.json` verbatim, and each one is there
    because it breaks something a transform written from memory would have
    got wrong:
    - **Two of the week's games were already FINAL** (NE at SEA, and SF v LAR
      in Melbourne). A payload for "week 1" is not a list of upcoming games,
      and offering a bet on one whose score is three lines away in the same
      response is the worst thing this board could do. Only
      `status.type.state === 'pre'` survives.
    - **One has the AWAY team favourite**, and that is where the obvious
      reading fails: the top-level `spread` is the HOME spread, so
      *"BAL -3.5"* arrives as `spread: 3.5` because Indianapolis is at home.
      Verified against `details` on all fourteen. The per-side
      `pointSpread.home.close.line` says `"+3.5"` in as many words and carries
      its own price, so that is what is read and the top-level number is only
      a fallback.
    - **The juice is not symmetric** — one game is home −3.5 at −118 and away
      +3.5 at −102. v71's shape had ONE price per spread, which would have put
      a leg on the ticket at a number the book is not offering. Each side
      carries its own now.
    - **`close` and `open` are both present and differ** (one game opened
      DEN +130 and closed +114). The open price is what was available
      yesterday.
  - ⚠️ **The committed board is a FLOOR, not the source** — the v42 doctrine,
    which is the only thing that makes fetching from a members' app allowable.
    ESPN is asked behind the reader, at most every fifteen minutes, and can
    only upgrade what is already on screen. Blocked, slow or gone, the tab is
    exactly as good as it was and the card says which copy it is showing.
    ⚠️ **This sandbox cannot reach ESPN** (403 through the egress proxy), so
    what is verified here is the transform against the capture and the floor
    against a blocked call; the live fetch itself is the owner's phone to
    confirm, the same division this repo already draws around the Lab.
  - ⚠️ **The fourteen committed games were typed by hand and then checked
    against the transform.** Two of them are among the four captured verbatim,
    and the typed numbers match `boardFrom`'s output from the raw payload
    exactly — which is what makes the other twelve worth trusting. A
    transcription with no independent check is the v56 bracket problem, and
    that is how it was solved there too.
  - ⚠️ **A repaint is skipped while anything has focus.** Lines move, so the
    refresh genuinely lands mid-interaction — and a board that re-renders
    under a thumb moves the button being tapped. The Lab's v25 rule, arriving
    somewhere it matters more.
  - ⚠️ **A pick'em renders `PK`, not `0`** — a zero line looks like a missing
    value, which on a board is the difference between "no spread" and "no
    points".
  - Verified: the transform against the verbatim capture (finals dropped, away
    favourite the right way round, per-side juice preserved, `close` beaten
    out of `open`); the shipped board rendering 14 games and 84 lines at 390px
    with nothing clipped, nothing under 44px and no overflow; the away
    favourite tapping through to **"BAL -3.5 at IND +102"** on the slip; and
    40 view-contexts with ESPN deliberately blocked, which is the floor.

- **v71 — the board, tapped (13 Sep 2026)** — the owner, on v70: *"Each week
  every game ML, spread and total are available or a person can fill in a prop
  bet for a game… Did u make it like they have to write the pick in? Why can
  we have pick selections like by tapping not writing. ESPN is linked no. That
  should have the lines and games."*
  - **He is right on both counts.** v70 shipped a text field, which is the
    wrong control for a board, and every game now renders its three markets —
    spread, moneyline, total, two sides each — as buttons, with a prop field
    underneath for anything the board does not carry.
  - 🚨 **THE REAL WIN IS THAT THE LINE IS DERIVED, NOT THAT IT IS TAPPED.**
    Twelve people typing "Eagles -3.5", "PHI -3.5", "philly -3½" produce
    twelve spellings of one bet and nothing downstream can tell they are the
    same. An option writes its own text, so the twelve legs on a ticket are
    comparable — which is what would let a per-market record, or a check of a
    leg against the board it came from, ever exist. **A free-text field was
    not just worse to use, it was throwing the data away.**
  - 🚨 **"ESPN IS LINKED" IS TRUE AND IT IS THE WRONG ESPN, WHICH IS WORTH
    WRITING DOWN BECAUSE IT WILL BE ASSUMED AGAIN.** What is wired is
    `/api/fantasy/football/season` through his own Render backend: twelve
    FANTASY teams, whose `sch` is a list of fantasy team ids. There is no NFL
    fixture and no price anywhere in that payload — shown to him from the
    shipped snapshot rather than asserted. ESPN's **public NFL scoreboard**
    does carry games, spreads, totals and moneylines, keylessly, and the app
    could fetch it from the reader's phone exactly as the Season tab already
    fetches. ⚠️ **This sandbox cannot reach it** (the egress proxy answers 000
    — tested, alongside `api.github.com` answering 200 as a control), so
    writing a transform against a payload I cannot see would be inferring a
    shape from memory, which is the v39 fault stated as a rule. It needs one
    capture. In Open / next with the exact URL.
  - **So the board is data**, in `open.games`, and **it is not invented**: the
    file ships with no board, the card says the week's board is not in yet,
    and the prop field opens by itself so there is still a way in. A screenshot
    of the book is enough to fill it from.
  - 🚨 **SAVE SITS WHERE THE CHOOSING HAPPENS, AND THE FIRST CUT DID NOT.**
    Sixteen games is about ninety buttons; putting the button above the board
    means tapping a line and then scrolling back to the top to confirm it. The
    chosen line rides a bar pinned to the bottom of the screen — a bet slip,
    the one pattern everybody using this already knows — and the prop field
    keeps its own button beside the thing being typed. Found by looking at the
    render, not by measuring it: every number on that page was correct.
  - ⚠️ **At 320px the label and the price could not share a button.** Measured
    rather than guessed: "Under 47.5" beside "-110" in a ~127px button clipped
    **five of the ten totals**, silently, on the one control the whole feature
    exists to tap. They stack under 360px; the button goes 44px → 48px and
    nothing clips at 320, 360 or 390. The v39/v52 rule — the second value gets
    its own line rather than squeezing the first — applied to a button.
  - 🚨 **AND A NAME COLLISION TOOK A WHOLE CARD OFF THE PAGE IN SILENCE.** The
    new `boardHTML(ow)` was the second function of that name in one scope —
    the leaderboard's `boardHTML(s)` was already there — and **a later
    declaration simply wins**. "Who carries the ticket" stopped rendering,
    nothing threw, and the page still looked complete. What caught it was the
    v58 tie law, written for something else entirely, going red about ranks
    that were no longer on the page. It is `gameBoardHTML` now and there is a
    law that names the two cards by their headings, so the next one says what
    it is instead of being deduced.
  - ⚠️ **One more silent drop, same session:** `openWeekOf` rebuilt the week as
    `{k, l}` and left `games` behind, so every option button stopped rendering
    while the page still looked finished — a text field exactly where the
    board should be, which is the state this version exists to end. Asserted
    now: the board must survive being resolved into a week.
  - **Every new law fault-injected**, including the two above, the spread
    sides being opposites, a one-sided moneyline rendering nothing, an option
    whose text does not name its game, and the prop field being reachable when
    there is no board.
  - Verified at 320, 360 and 390px with a five-game fixture board (one of them
    deliberately half-posted, totals only): 26 options, none clipped, none
    under 44px, no overflow; the slip appears on tap, names the line, and the
    page carries a spacer so it never covers the last card; the saved pick
    goes out as **"Week 1 parlay — Buley: PHI -7.5 vs DAL (-110)"**. Plus 40
    view-contexts with the board up and 40 with the file as it ships.

- **v70 — the twelve pick in the app (13 Sep 2026)** — the owner, on the tab
  that had just shipped: *"But each person has to be able to pick there game
  in the app for parlay. And then someone takes the ticket and bets it on a
  book. Probably won't happen for week 1 but build it so they all see."*
  - **Write your bet, get a line, drop it in the chat; whoever is placing the
    bet pastes the chat and the ticket assembles itself.** Three screens:
    your pick, the collector, and the published ticket v69 already had.
  - 🚨 **THIS IS THE FIRST TIME THE MEMBERS' APP HAS TAKEN INPUT, AND THERE IS
    STILL NOWHERE TO WRITE.** Open / next has said since v1 that a member
    writing anything back "needs a backend and is a real product decision".
    That is still true and this does not change it — what changed is noticing
    that the app already had a transport for exactly this shape of problem.
    The Lab has shipped a self-contained payload in a link since v1
    (`power.html#r=`), and the group chat is where this league already talks.
    So a pick is a payload pointed the other way: **the Lab sends one to
    twelve people, this collects twelve into one.**
  - ⚠️ **AND THE HONEST LIMIT IS ON THE CARD, NOT JUST IN HERE.** "Build it so
    they all see" is satisfied twice over — every pick is visible in the chat
    as it is made, and the finished ticket is in everybody's app. What it
    cannot do is show the other eleven picks *inside* the app before the
    ticket is assembled. A card that implied that sync would be lying about
    the one thing a reader would check, so it says plainly that picks travel
    through the chat and why.
  - 🚨 **THE SHARED LINE CARRIES THE REAL NAME, AND `nm()` WOULD HAVE BROKEN
    IT SILENTLY.** That helper answers "You" for whoever is holding the phone
    — correct everywhere else in this app and catastrophic here, because this
    string is read by the other eleven: Buley's pick would have arrived in the
    group chat as **"You: Bills -7"**. It is the v33 byline bug one feature
    over (a guest's rankings going out under the commissioner's team name),
    and the shape is worth naming as a rule: **a sentence written on one
    device and read on another has no "you" in it.** Asserted, and verified by
    swapping the helper back.
  - 🚨 **TWO PICKS FROM ONE MANAGER ARE REPORTED, NEVER SILENTLY RESOLVED.**
    Taking the later one is right — somebody changed their mind — but doing
    it quietly is how a leg nobody meant ends up on a ticket that has been
    paid for. The card names it; the law asserts the later one wins AND that
    an older one cannot overwrite a newer.
  - 🚨 **THE OPEN WEEK IS DERIVED, AND A PLACED WEEK IS CLOSED.** `open` in
    the file wins, otherwise picks are for the week after the newest ticket —
    so the first week of a season costs one line and every week after it costs
    nothing. And a week that already has a ticket takes no picks, because a
    pick then is a pick at a game that has kicked off.
  - ⚠️ **A name is needed to put a LEG in, and that is not the app gating
    content.** Every table still renders for a stranger exactly as before; a
    bet belongs to a person, so the one thing that cannot be anonymous is the
    one thing that asks. The picker is one tap away and the wording is an
    invitation — the v45 line between "personal" and "a login", held.
  - **Two encoding traps, both from the Lab's scar tissue:** `btoa` is
    Latin-1 only, so a bet with an emoji or a curly quote throws unless it is
    UTF-8 encoded first (verified with **"Saquon 75+ — “lock” 🦅 ½ unit"**);
    and **a phone's minus is U+2212 as often as a hyphen**, which reading as a
    plus would silently invert the leg. The sign IS the bet.
  - ⚠️ **The listeners are behind a `typeof document` guard**, because
    `checks.js` requires this file in node. Without it a bare
    `document.addEventListener` at module scope throws on load and takes every
    parlay law down with it — **a crash instead of a fault, which is the least
    useful failure a check can have.** Found by running the suite, not by
    reading the file.
  - 🚨 **THREE FAULTS THE MEASUREMENTS COULD NOT SEE, ALL FOUND BY LOOKING AT
    THE PAGE:**
    - **The status line printed twice.** One shared `note` string was
      rendered into every `.lp-say`, so "Saved. Send it to the chat" appeared
      under the collector as well as under the pick — one event reported
      twice, the second time about something the reader never did. A note
      belongs to the card that raised it; there is a law for it now.
    - **Two headings shared 🎯** once picks were open — the pick card and
      "Who carries the ticket" — so the jump row carried the same mark twice,
      and that row is read by its mark. **The v50 clash, arriving the same
      way: as a knock-on of something else appearing on the page.** The pick
      card is 📝, whose codepoint needs no variation selector (checked on the
      render, the v49 trap).
    - **A share button was picking its textarea by position** and happened to
      be right. A thing that works by accident stops working the day a fourth
      field is added — silently, by sending the wrong text. Each button names
      its own box now.
  - ⚠️ **And one clip at 320px**: the collector's summary hint ("collect the
    picks") pushed its own line 93px into a 26px box. The hint is gone and the
    count carries it.
  - **Verified by driving three phones**, not by reading the code: Buley picks
    on one (emoji and curly quotes intact through the payload, the line naming
    *Buley* and not *You*), McD pastes the whole chat on another and gets both
    legs, a price and the block to publish, and a third opens a bare pick link
    — which lands on the Parlay tab, adds the leg and **cleans the hash so a
    reload cannot add it twice**. Plus 40 view-contexts at 320 and 390px with
    the collector forced open, every new law fault-injected, and the shipped
    file (week 1 open, no tickets) rendering clean.
  - ⚠️ **The `?v=` bump was done in both pages this time**, which is only worth
    saying because v69 got it wrong in exactly one command — `espn.js` is in
    that law now and the law is what made this one boring.

- **v69 — the group parlay gets its own tab (13 Sep 2026)** — the owner:
  *"We've done a weekly group parlay for the league where everyone make and
  nfl bet and we parlay together. Can we have a tab for that."*
  - **Twelve people, one NFL bet each, one ticket.** The tab is that ticket:
    every leg with whose it is, the twelve prices multiplied into one, how far
    it got, and across the season who keeps landing their leg and who keeps
    killing everybody else's.
  - 🚨 **A FOURTH TAB DOES NOT FIT, AND THE MEASUREMENT IS WHAT CHOSE BETWEEN
    THE TWO WAYS OUT.** `.ai-sub button` clips in silence, so this was
    measured against the FALLBACK font before a label was picked: with the
    emoji on, four labels need **11px at 320px** and still clip at 375 and
    390; with them off, **15px fits at every width down to 320**. An emoji
    costs ~20px of a ~67px button and shrinking it recovers nothing — at
    0.65em it still costs ~14px and still clips. So the choice was four tabs
    at 11px on a narrow phone or four at 15px with no marks. **v55 exists
    because the owner asked for this type to be BIGGER**, and the level-2 bar
    has never carried emoji, so the marks came off and the two rows now match.
    ⚠️ **This is the one judgment call in the version and it is his to
    reverse**: the emoji go back for one line of `L1` plus a type step down.
  - 🚨 **THE ONE TAB IN THIS APP WHOSE FACTS ARE TYPED IN, AND IT SAYS SO.**
    Everything else here is derived from the archive precisely so it cannot go
    stale. A bet has no such source. Rather than let that difference sit
    unmentioned under a page that looks like every other page, the card names
    which half is transcribed (the picks, the results) and which half is
    worked out (the price, the payout, every record and rate). ⚠️ **The mark
    is ✍️, deliberately not ⚑** — the flag already means *playoffs only* three
    taps away in the ? sheet, and one glyph with two meanings is the v50 clash
    across pages instead of within one.
  - 🚨 **A PUSH IS THE ONLY RULE HERE THAT IS NOT OBVIOUS FROM THE SLIP, AND
    IT IS WRONG SILENTLY IN BOTH DIRECTIONS.** A void leg drops out of the
    price and does not kill the ticket — treat it as a loss and a live parlay
    reads dead; leave it in the multiplication and every payout for the rest
    of the season is quietly too big. ⚠️ **And it has to leave the COUNT too**:
    a ticket of eleven wins and a void leg CASHED, and the first cut printed
    it as **"11/12"** — a complete ticket reading as though a leg had missed,
    with the verdict above it saying *"All twelve landed"* about a twelve-leg
    ticket that had eleven. If a leg is out of the arithmetic it is out of the
    denominator, or the two numbers on one card describe different tickets.
  - 🚨 **THE PER-MANAGER LAW, FOR THE THIRD TIME, AND IT CAUGHT THE INJECTION
    THE TOTALS COULD NOT.** Swap two managers' results inside one week and
    every total in the file is conserved — v51 learned this on the bracket
    record, v67 on the Cum Bowl points, and a new feature attributing numbers
    to people is exactly where it lands next. Verified by injecting that swap:
    the per-manager law names **both** managers while nothing else moves.
    **Any number attributed to a person gets a per-person law or it gets
    nothing.**
  - **Every new law was fault-injected**, and two of them were wrong before
    the code was:
    - 🚨 **THE ROUND-TRIP LAW REPORTED A FAULT IN CORRECT CODE.** ±100 is one
      price written two ways — even money is decimal 2.0 — so it cannot round
      back to both, and +100 is the convention. The law would have gone off on
      every even-money leg in the league. **A law that cries wolf gets
      ignored**, so it asserts the round-trip outside ±100 and asserts even
      money separately.
    - **The second-person law was looking at the wrong ticket.** It asserted
      the sole-bust sentence on a fixture whose newest week was still running,
      so the sentence it was checking never rendered at all. Fixing the law
      turned up the actual gap: **a past ticket kept its verdict off screen
      entirely** — the best line the data produces was visible only in the
      week it happened. Past tickets carry their verdict now.
  - 🚨 **AND A FAULT INJECTION FOUND A TEMPLATE HOLE NOTHING ELSE WOULD
    HAVE.** Making a push kill the ticket produced `status: 'dead'` with an
    EMPTY loser list, and the verdict printed the word **"undefined"** into
    the sentence under the ticket. Unreachable in correct code and one bug
    away from being the first thing on the page, so the dead branches key on
    **how many legs missed** rather than on the status.
  - ⚠️ **Five colours failed their own measurement**, which is the v67 rule
    arriving on schedule: a colour is invisible to every assertion in this
    repo, and the only thing that catches one is computing the contrast off
    the render. On white, `--mu2` at 9.5px is **2.56:1**, `--mu` at 9.5-11.5px
    is **3.81:1** and `--wm` at 9.5px is **4.2:1**, all under the 4.5 small
    text needs. The muted tones went to `--gy` (6.6:1) and the live pill took
    the accent with `--on-ac`. **HIT and MISS keep `--pos`/`--neg`** — both
    clear 4.5, and unlike v67's points column a leg landing genuinely IS good
    news, which is the test v189's rule sets. ⚠️ **PUSH and OPEN now share a
    colour and that is correct**, because the WORD carries the state and
    neither is good or bad news.
    - ⚠️ **The contrast harness itself was wrong first**, and it is worth
      recording: it read `rgba(184,148,47,.09)` — the reader's own highlighted
      row — as an opaque dark gold and reported **eight false failures on
      exactly the rows that were fine**. It composites each layer onto the one
      behind it now. A checker that cries wolf is worse than no checker, twice
      in one version.
  - ⚠️ **`.lp-tag` shipped at 8.5px** under this app's 9px floor, on all 40
    view-contexts, and **a cashed week clipped its own summary by ONE pixel**
    ("11/…") because "IT CASHED" is 62px against "BUSTED"'s 46px. The tag has
    a short word of its own now. A one-pixel clip is still a clip, and the
    sweep's `+1` tolerance is what had been hiding it — tightened.
  - 🚨 **AND BUMPING THE VERSION SPLIT A SHARED FILE IN ONE COMMAND.** A
    blanket `?v=68 → ?v=69` over `index.html` left `power.html` loading
    `espn.js?v=68` — the manager map, the one shared file with no law on it,
    which is **v28 verbatim** (`styles.css` sat at `?v=1` on the Lab side long
    enough to pin any device that had opened it to a pre-v20 stylesheet).
    `espn.js` is in that law now, so the next blanket bump fails loudly.
    **The law belongs on every shared FILE, not on the ones that have already
    burned us.**
  - ⚠️ **Four prose faults, all found by reading the render**, none of them
    visible to any measurement: *"would have returned"* over a ticket that is
    still running (three tenses now, because a ticket is in one of three
    times); the season lead saying *"…and once has that been all of them"*
    and the very next sentence saying *"Once the whole thing has landed"* —
    one finding twice on one card, the v22 fault; a hard-coded *"and one is
    still running"* that would have said "one" for any number; and odds in
    the app's typographic minus sitting on the same line as a pick written
    with a hyphen (**"Eagles -3.5" beside "−115"**, one line, two dashes).
  - **No new localStorage key and no backend.** The ticket is a file the same
    way the rankings are, for a stronger reason: a parlay is a record of
    something that already happened, so a page that re-derived it from a live
    odds feed would show a different bet next week than the one the league
    placed.
  - Verified at 320 and 390px across **40 view-contexts** — the four tabs ×
    {stranger, McD, Buley, Wolff, Christel} — with a fixture covering all four
    ticket states (live, cashed with a push, a one-leg bust, a three-leg
    bust): no horizontal overflow, no clipped tab label, no clipped text, no
    type under 9px, no tap target under 38px, no template hole, no rendered
    comment, no page error, every colour over 4.5:1. The ? sheet listed the
    new tab **with no edit** (it is built from `L1`) and the jump nav picked
    up four chips the same way. `node --check` on every JS file and
    `node checks.js` green, every new law fault-injected.

- **v68 — 2025's last unordered pair, settled (13 Sep 2026)** — the owner:
  *"Make Slemp 9 and Hurd 10 for 2025."*
  - **v66 ordered 11/12 and left 9/10 rendering as a joined `9-10` row.** This
    closes it: all 156 team-seasons now have a place of their own.
  - 🚨 **BUT THE TWO PAIRS ARE NOT THE SAME KIND OF FACT, AND THE CAPTION HAD
    TO SAY SO.** 11th and 12th are **reconstructed** — he named the game
    (*"Buley losing to Christel"*) and the Cum Bowl rule does the rest, with
    two week-15 scores standing behind it in `CB_RECON`. 9th and 10th are
    **stated**: Sleeper exported no such game, no score exists, and nothing in
    the archive can check them. Reusing v66's wording would have made a
    remembered order look like a recovered one — **the v14 fault, a number
    that sounds like a different kind of number** — so the caption names which
    half rests on what.
  - 🚨 **2025 IS THE ONLY SEASON WHERE THIS IS EVEN POSSIBLE, AND THAT WAS
    VERIFIED RATHER THAN ASSUMED.** v66's law conserves every placing against
    the game that decided it, and **`GmC8` decides 9th/10th in all twelve ESPN
    seasons** — 2025 has 5 winner's-bracket games and no consolation ladder at
    all. Fault-injected by swapping 2024's 9th and 10th: the suite reports
    *"2024: GmC8 does not decide 9th/10th"*. So the law is awake and simply
    has nothing to check here — which is the thing the caption now admits
    rather than letting silence read as confirmation.
  - ⚠️ **Both his calls read the way the records do, and that is NOT why they
    were made** — worth separating, because "it matches the records" is how a
    guess gets laundered into a fact. Slemp went **7-7 with 70 more points**
    against Hurd's 6-8, and Christel's 3-11 was the league's worst.
  - **Measured, the change is three numbers.** Slemp's 2025 square 10 → 9 and
    his average finish 6.8 → 6.7; Hurd's square 9 → 10 (his 6.8 is unmoved by
    rounding). **The storylines are byte-identical for all thirteen readers** —
    checked by rendering both builds side by side rather than assumed, because
    the swap broke a real tie: Slemp and Hurd sat on an identical 6.769 average
    finish and now do not, and v58's "joint" rule would have had something to
    say if any card ranked on it. None does.
  - ⚠️ **It is a version bump even though it is only data**, per the v51 rule:
    this data lives in `history.js`, so a device holding `history.js?v=67`
    would keep the old order for good. **Where the data lives decides whether a
    data change needs a release.**
  - 🚨 **AND READING THE DOM FOUND THE CAPTION HAD NEVER BEEN A CAPTION.**
    `seasonsHTML` ended
    `${s.tieNote || (… ? '<p class="ffp-cap">…</p>' : '')}` — **the fallback
    carried the element and the data did not**, so 2025's note printed as a
    raw text node directly inside the `<details>`, inheriting **16px
    near-black against a caption's 11px muted**. The one sentence whose job is
    to footnote the table was the loudest thing in the card. Pre-existing
    since v66 and made worse by this version's longer sentence; caught because
    a query for `.ffp-cap` inside the season came back **empty while the text
    was plainly on screen**. One expression, two presentations, depending on
    which branch fired — and nothing assertable can see it, because the
    difference is a computed style. **The data holds the sentence and the
    template holds the element** (`seasonNote`), so both branches now render
    identically. ⚠️ The fallback branch is kept though no season has `tie`
    rows any more: the row renderer still supports `tie`, and deleting one
    half of a live feature is worse than an unexercised branch.
  - Verified at 320 and 390px across 50 view-contexts — the five tabs ×
    {stranger, McD, Slemp, Hurd, Christel}: the 2025 table reads 9 Slemp /
    10 Hurd with no joined row left, its note an 11px `.ffp-cap`, no
    horizontal overflow, no clipped cell, no type under 9px, no tap target
    under 38px, no template hole, no page error. `node --check` on every JS
    file and `node checks.js` green.

- **v67 — the Cum Bowl gets a scoreboard (13 Sep 2026)** — the owner, with
  the tab open: *"Add points per game in the cum bowl for this sections.
  Feels info light"*.
  - **He is right that it was thin, and the reason is worth naming: the card
    knew nothing about the games it was counting.** Played and lost are both
    counts — the table could tell you Buley has been in eight of these and
    lost two, and could not tell you a single thing that happened in one.
    Every scoreline was already in `CUMBOWL`, sitting unused one collapsed
    `<details>` away.
  - 🚨 **THE LAW FOR THE NEW COLUMN WAS WRITTEN AS A TOTAL FIRST, AND THE
    TOTAL WAS GREEN OVER A REAL BUG.** Summed `cbPF` against the summed game
    scores, in the style of v61's career points-for — then fault-injected by
    swapping the two scores inside the 2019 Cum Bowl. **Six ✅ under `cum
    bowl` and not one word**, while the card printed Hurd's points against
    Buley's name and Buley's against Hurd's. A swap conserves a sum. The
    appearance counts could not see it either, for the reason v66 exists: a
    count cannot see WHOSE game it counted. Rewritten per manager, and it
    names both of them.
    - ⚠️ **This is the v51 rule arriving for the third time** (v51 for the
      bracket record, v58's re-verification, here). Worth stating as the
      general form rather than as another instance: **a law over a sum is
      blind to a swap, and a swap is what a new per-manager column is most
      likely to get wrong.** Any number that is attributed to a person gets a
      per-person law or it gets nothing.
  - ⚠️ **The caption's comparison is against EACH game's own season, and a
    flat baseline would have reported the era instead.** The league scored
    90.6 a game in 2013 and 108.5 in 2018 — an 18-point span across a card
    whose rows are one to eight games. Measured per season, a Cum Bowl runs
    **13.5 below** what the league was scoring that year; measured against a
    13-year average it would have read 13.5 too, by luck, and been wrong the
    next time a season landed. The `relPpg` rule, applied to a card rather
    than to a detector.
  - **And the derived facts are better than the column on its own.** The two
    teams average **86.7**; the winner puts up **98.5** and the loser
    **74.8**. A Cum Bowl is not two bad teams playing badly — it is one of
    them not turning up. That sentence is four `toFixed(1)`s and no typed
    numbers, so it re-writes itself the next time a season lands.
  - ⚠️ **The column is RAW points, and the honest caveat is the sample rather
    than the era.** One to eight games each: most rows are a scoreline or two.
    The card says so in as many words and names each row's own PLAYED beside
    it (the v51 rule). The era-safe alternative — each manager's gap against
    their own regular season in those same years, the `januaryHTML` shape —
    is what this would need to be sorted BY; the table is sorted by PLAYED,
    so it never ranks on points.
  - 🚨 **AND THE COLOUR I CHOSE FOR IT FAILED ITS OWN MEASUREMENT.** PTS/G
    shipped in the first cut as `--mu`, to read as secondary to the counts.
    Measured on the render: **rgb(138,130,114) on white, 3.46:1** — under the
    4.5 a 12.5px number needs, and the exact tone this file already warns is
    the one "nobody spots mid-page". It is also the newest information on the
    card, so making it fainter than the two columns it was added beside was
    backwards twice over. It takes the same `--gy`, which needs no rule at
    all. ⚠️ No `--pos`/`--neg` either — scoring a lot in a Cum Bowl is not
    good news and scoring little is not bad news (v189's semantic-colour
    rule). **A colour is invisible to every assertion in this repo; the only
    thing that catches one is computing the contrast off the render.**
  - ⚠️ **Found while doing that: `.neg` on the LOST column has never done
    anything.** It needs `#fantasy-history`, an id this app does not have.
    Left alone — nothing on screen is wrong and turning LOST red is a design
    change nobody asked for. In Open / next with the question of what else
    inherited that dead Sports-Hub selector.
  - ⚠️ **A fourth column, on the row shape v39 and v52 both had to rescue.**
    It survives only because this table is keyed by MANAGER — Christel is the
    longest name at ~62px — and not by team name. Measured at 320px rather
    than assumed: the name column holds 112px with nothing clipped. Written
    into the CSS that a fifth column goes to two lines like `.fh-po`.
  - Verified at 320 and 390px across 50 view-contexts — the five tabs ×
    {stranger, McD, Buley, Hurd, Christel}: no horizontal overflow, no clipped
    cell, no type under 9px, no tap target under 38px, no template hole, no
    page error. The card renders four columns at both widths (name 112px at
    320, 182px at 390; numbers 44/38/48) with the reader's own row lit.
    `node --check` on every JS file and `node checks.js` green, with the new
    law fault-injected.
    - ⚠️ **A first sweep came back "clean across all view-contexts" and was
      worthless.** It clicked `button[data-sub=…]`; the attribute is
      `data-l2`, so every tap missed and all 50 contexts measured whichever
      tab the app had booted onto — including, silently, the one card this
      version changes. The harness asserts `aria-selected` on the tab it
      asked for before it measures anything now. **A sweep that cannot fail
      to reach its subject is not a sweep** — the v39 rule about a check whose
      failure path has never run, one level up in the harness.

- **v66 — the Cum Bowl was the wrong game, for 65 versions (12 Sep 2026)**
  ⚠️ **SUPERSEDED IN v79, AND ALMOST ENTIRELY: this entry moved the Cum Bowl
  to `GmC9` and the owner says it is `GmC3` — round one, the 11 seed against
  the 12 — exactly where it sat from v1 to v65.** The reasoning is kept in
  full because it is this repo's best record of how a definition drifts, and
  because v79 had to work out which half of it survived: the *mechanism* (the
  games are derived from the bracket, never hand-typed) is right and stayed;
  the *conclusion about the game* was wrong; and its central evidence — that
  "the loser is the league's worst" held only 4 times in 12 — was measuring
  ESPN's ladder, which this league does not use below 10th. Nothing below is
  current. —
  the owner, looking at one storyline card: *"Buley has finished 11th seven
  times. Is this accurate? Remember cum bowl winner is always 11th place."*
  - 🚨 **THE COUNT WAS RIGHT AND THE SENTENCE UNDER IT WAS A THREAD.** Seven
    11ths is what the archive's placings said. But his rule — winner is 11th —
    is true — ⚠️ **of the CUM BOWL, which is where v79 lands it: the league
    settles 11th/12th with this game and ignores the rest of the ladder. The
    inference below, that his rule must therefore point at `GmC9`, is the
    whole error of this version** — is true of `GmC9`, the last game of the consolation ladder, in **12 of the
    12 seasons with a bracket on file**, and true of the game the app called
    the Cum Bowl in **3 of 13**. The app held `GmC3`: round ONE of that
    ladder, the 11-SEED against the 12-SEED. A whole round early, since v1.
  - 🚨 **AND THE APP HAD BEEN ADMITTING IT, DRESSED AS A FINDING.** The card
    carried a caption reading *"Winning does not always save you — in 8
    seasons the Cum Bowl winner still finished 12th, because the consolation
    bracket keeps running afterwards."* That sentence is the bug describing
    itself in its own words, printed under the table, for versions. **A rule
    the data breaks two times in three is not a quirk worth a caption, it is
    the wrong definition** — and the way to notice is to ask what the league
    means by the word, which is a question only the owner can answer.
  - 🚨 **THE LEAD SENTENCE WAS FALSE TWO SEASONS IN THREE, AND THE TABLE
    NAMED THE WRONG PEOPLE.** ⚠️ **SUPERSEDED in v79: the lead was TRUE and
    the standings it was measured against were the wrong authority.** The
    league's own rule is that the Cum Bowl decides last place, so counting it
    against ESPN's ladder ordering — which is all "4 of 12" ever was — tested
    the sentence against a tiebreak nobody in this league reads. *"The loser
    is the league's worst"* held for 4
    of the 12 GmC3 games. Meanwhile appearances were credited for being
    SEEDED badly rather than for finishing badly, so the tab said **McD had
    played a Cum Bowl** (2021 — he finished 8th) and **Gotch had played two**
    (2020 and 2023 — 7th both times), while the managers who actually played
    off for last went uncounted. ⚠️ **SUPERSEDED in v79, and this is the
    sharpest illustration of the error**: those appearances were correct —
    being a bottom-two SEED is exactly what playing a Cum Bowl means — and
    under v79 all three of those seasons place McD and Gotch **11th**, because
    they won the game. The finishes cited here as proof of a bug were ESPN's
    ordering, not the league's. Buley read **6 played, 4 lost**; he has been
    in **8** and lost **2**.
  - 🚨 **EVERY CONSERVATION LAW WAS GREEN THE ENTIRE TIME, AND THAT IS THE
    LESSON, NOT AN ASIDE.** "24 appearances, 11 losses" balanced perfectly
    against a hand-typed list of the wrong game — **a count cannot see WHICH
    game it counted** (v14's rule, a definition drifting under a total, in its
    purest form yet: here the total was never even wrong). So the new laws are
    written against the thing that MAKES it the Cum Bowl — the winner finishes
    11th, the loser 12th, and the winner outscored the loser. Verified by
    reinstating GmC3: the first reports 9 of 13 seasons and every older law
    stays ✅.
  - 🚨 **AND THE GAMES ARE DERIVED FROM THE BRACKET NOW, NOT RE-TYPED.**
    `PLAYOFF_GAMES` has held every consolation game since v56, so a
    hand-maintained `CUMBOWL` was a second copy of data the archive already
    had — which is exactly how it drifted a round away in silence. It is a
    filter over the bracket plus one entry for 2025, which has no consolation
    ladder on file.
  - **2025's bottom two are the owner's, and they moved.** Sleeper never
    ordered the bottom four, so the season carried two unordered pairs AND a
    `worst: "buleyn14"` field that flatly contradicted rows putting Slemp
    last. He settled it: *"It was Buley losing to Christel in 2025. Sleeper
    didn't match them up so we just took the scores."* Loser is 12th, so
    Christel is 11th and Buley last, and Hurd and Slemp are the pair left
    unordered (⚠️ **SUPERSEDED in v68**: he ordered that pair too — Slemp 9th,
    Hurd 10th — so 2025 has no unordered pair left). ⚠️ It also reads better
    against the records — Christel went
    **3-11**, the worst in the league, and was being shown 9th or 10th while
    7-7 Slemp was shown 11th or 12th.
  - **So the card he asked about reads "six times"**, and its claim survives
    intact: the next-most-repeated finish in the league is four (McD's four
    titles), so nobody repeats a finish more often either way.
  - 🚨 **THE RENDER FOUND A CODE COMMENT PRINTED ON THE PAGE, SHIPPED IN
    v65.** Four lines of source — *"/* ⚠️ Nothing opens by default any more
    (v65)…"* — rendered as a paragraph between the Cum Bowl card and the
    season list, because the comment was written INSIDE the template literal,
    where it is just text. **v65 verified itself by counting jump chips and
    measuring tab widths, and every one of those measurements was correct and
    blind to this.** There is a law for the cheap half now (no view may
    contain a comment opener), fault-injected; the other half is still reading
    the page.
  - ⚠️ **Three knock-ons in the storylines, each a rule rather than a patch:**
    - **"Also the record" was about to print on five cards.** The loss record
      is now shared five ways at 2, and that clause was the one place in the
      feature that never went through `alsoTxt` — the v2 rule (a superlative
      that fires twice is just wrong) with a gap in it that the old data never
      exercised. It states the number without the claim when it is shared.
    - **`cleanFloor` is `own`-flagged**, because the finding got weaker rather
      than wrong: "never last and never even a bottom-two SEED" was one
      manager in thirteen years; "never finished 11th or 12th" is two, and it
      printed **"McD has never finished in the bottom two … with 5 finals and
      4 titles"** — a card whose own body argues its headline is not the
      story — in the slot that had held *"McD is the unluckiest team in the
      league"*.
    - 🚨 **TWO MANAGERS MADE THE IDENTICAL CLAIM.** The roll-call came out
      with *"Gotch has 5 final fours, joint 2nd of 12."* directly above the
      same sentence about Zach. Both true, both correctly saying "joint"
      (v58), and together they read as a generator repeating itself on the one
      screen that is meant to be twelve different findings — the `stories()`
      dedupe fingerprints DECIMALS and cannot see a sentence with none.
      `pickStories` skips to that manager's next card rather than dropping
      either, so coverage is untouched, and it is a law.
  - ⚠️ **And one of my own laws was wrong before it was even new:** the v57
    "same numeral in heading and body" check split **"53.4%"** into 53 and 4,
    so Zach's card was reported for printing 4 twice against a body reading
    "9-4 in 2019". A decimal is one number. Narrowed, and re-verified that it
    still catches the whole-number collision it was written for.
  - ⚠️ **The ⚑ key stopped double-counting in the same edit.** It read "209
    bracket games … plus 13 Cum Bowls" — but a Cum Bowl IS a bracket game, so
    twelve of the thirteen were already inside the 209. True before v66 too;
    what changed is that the archive now states the relationship instead of
    keeping a second list that merely happened to duplicate one.
  - 🚨 **AND THEN A SWEEP OF EVERY WORD THE APP RENDERS** (the owner, after
    catching me calling a round-one game a Cum Bowl in chat: *"Check all the
    words"*). 262 distinct sentences across five tabs × three readers plus all
    twelve profiles, every checkable claim re-derived. Two were wrong, and
    **neither was about the Cum Bowl data — both were prose that outlived its
    fact**, which is the same shape as the comment above:
    - **"lives on Playoff appearances under Records"** on the Honors final-four
      caption — true from v48 to v64, false the moment **v65 moved that card to
      Leaders**. A cross-reference pointing a reader at the wrong tab, with
      nothing able to notice. ⚠️ **Fixed by DERIVING it**: `subName('led')`
      reads the label out of `SUBS`, so it follows a rename the way the ? sheet
      already does — verified by renaming the tab and watching the sentence
      follow. Typing a tab's name is the hand-kept-list fault in its smallest
      possible costume.
    - 🚨 **"Placement games and the consolation ladder decide nothing"** — in
      TWO captions, and **v66 made it self-contradicting**: `GmC9` is a
      consolation game and it is the whole Cum Bowl tab. What the sentence
      meant is that they produce no W-L on a manager (the v19 rule, still
      true); what it SAID is that they decide nothing, while the app three
      taps away is built on what they decide. They decide places rather than
      records now, and the Cum Bowl is named as the example.
    - ⚠️ Everything else checked out, re-derived rather than eyeballed: 5 of 12
      defending champions made the playoffs again, the six ringless managers
      hold 6 finals and 15 podiums, Christel is the only manager with no top
      three, Hurd's 3 scoring titles are tied with Wolff, 65 championship
      games, 28 of 65 won by the better seed. **The numbers were fine. The
      sentences around them were where both faults lived** — third version
      running (v58, v59, here).
  - Verified at 320 and 390px across 30 view-contexts — the five tabs ×
    {stranger, McD, Buley, Christel, Slemp, Wolff}: no clipped tab label, no
    horizontal overflow, no tap target under 38px, no template hole, no
    rendered comment, no page error. `node --check` on every JS file and
    `node checks.js` green, with each new law fault-injected.

- **v65 — Records splits, and the Cum Bowl swallows Seasons (12 Sep 2026)** —
  ⚠️ **SUPERSEDED in v88 for the Records/Leaders split; the five-tab constraint
  and Cum Bowl/Seasons merge remain current.**
  the owner, with the Records jump nav on screen and four chips circled in
  red: *"I want cum bowl added to seasons as two sub tabs but call it cum bowl
  and then the 4 I drew on here slice off and make there own page"*.
  - 🚨 **RECORDS HAD GROWN TO EIGHT CARDS AND WAS TWO PAGES PRETENDING TO BE
    ONE.** The four he circled — 🏅 All-time standings · 📊 Playoff appearances
    · 🎯 Seeds & upsets · 🔥 Who shows up in January — are all the same SHAPE:
    twelve rows, one per manager, ranked. The four left behind are what the
    archive turns UP: storylines it detected, the record book, the luck index,
    the rivalries. **He filed them by kind and it is the same split v48 made
    between Honors and Records**, one level down. Records is the findings;
    **Leaders** (his name for it) is the tables.
  - 🚨 **THE NEW TAB HAD TO BE PAID FOR, AND THAT IS WHY THE MERGE IS IN THE
    SAME VERSION.** v55 measured this bar clipping **silently** at 320px with
    five tabs and had to move to `flex: 1 1 auto` to fit the labels it already
    had. A sixth would have gone back over that ceiling with nothing on screen
    admitting it. So Seasons went under Cum Bowl and the count stayed at five:
    measured at 320px, `You 32 · Honors 53 · Records 59 · Leaders 58 ·
    Cum Bowl 70`, every button's `scrollWidth` inside its `clientWidth`.
    **Five is a constraint here, not a coincidence**, and it is written into
    the `SUBS` bullet above rather than left to be rediscovered.
  - 🚽 **The Cum Bowl leads its own tab**, per his follow-up: *"Cum bowl is the
    prize of those tab. When I click it I want cum bowl. Then seasons can be
    offered but out of the way."* So the card renders first and the thirteen
    seasons sit underneath it as a collapsed list — **and nothing auto-expands
    any more**, which is what makes "out of the way" true rather than "also
    on the page".
  - ⚠️ **THE HONEST TRADE: the merge cost the year chips, and no code chose
    that.** `buildJump` uses `.section-title` headings when a page has two or
    more and only falls back to `<details>` summaries otherwise — so the moment
    Seasons stopped being the only heading on its page, **13 year chips became
    2 section chips**. The years are still one tap each in the list; jumping
    straight to 2019 from the chip row is gone. Worth stating plainly because
    it is a real loss, it is a side effect of a layout rule rather than a
    decision, and a future session reading "the nav is built from the DOM"
    will not predict it.
  - ⚠️ **`sea` is deleted rather than left as an alias, and it is safe for a
    checkable reason**: `S.sub` lives in memory only — there is no
    localStorage key for the sub-tab and boot sets it to `you` or `hon` — so
    no device can come back holding a pointer at a view that no longer exists.
    A dead key kept "just in case" would be the v8 `STATS` trap: a value
    nothing reads and no test can see.
  - ⚠️ **The ? sheet needed its two sentences rewritten and nothing else.**
    The tab LIST is built from `SUBS`, so it picked up Leaders and dropped
    Seasons with no edit — fourth version running that this is the only
    hand-edit a tab change needs, which is the standing argument for keeping
    every other list derived.
  - ⚠️ **One stale current-state line found while documenting this**, and it
    is the reason this file's standing rule exists: the `playoffHTML` bullet
    still said that card *"stays on Records, because it is a leaderboard"* —
    true from v48 to v64 and false the moment Leaders existed, **with its own
    reasoning now arguing for the opposite tab**. Corrected in place; the v48
    changelog entry keeps its wording and the current-state section does not.
  - Verified at 320 and 390px across **50 view-contexts** — the new five tabs
    × {stranger, McD, Hurd, CC, Woods}: no clipped tab label, no horizontal
    overflow, no type under 9px, no tap target under 38px, no template hole,
    no page error. Records renders 4 chips, Leaders 4, Cum Bowl 2
    (🚽 The Cum Bowl · 📖 Season by season) with zero open `<details>`.
    `node --check` on every JS file and `node checks.js` green, including the
    laws that walk `SUBS`.

- **v64 — the career strip fits the career (12 Sep 2026)** — the owner, with
  his own You page open: *"Fix this view for Hyman since he's got less total
  seasons. Make sure nothing else is screwed for him."*
  - 🚨 **ONE HARD-CODED 13, IN A STYLESHEET.** `.fh-car` was
    `grid-template-columns: repeat(13, 1fr)`, so the year strip always laid out
    thirteen columns however many seasons the manager had. Hyman has **nine**:
    his squares filled the first nine columns and the last four were empty, so
    the strip stopped two-thirds across a full-width card. Riz's eleven stopped
    short too. `--n` is set inline from the row count now and the strip fills
    its card at every width — measured, dead space right went **86px → 0** at
    390px, with the squares growing 23px → 34px.
  - ⚠️ **Everything else on his page was already correct, which is worth saying
    because it is the whole argument for deriving.** `6/9` playoff apps, `3/9`
    final fours, *"made the playoffs in 6 of 9 seasons"*, his avg finish, his
    luck, his best and worst years — every one reads his own career length.
    The stats engine never assumed thirteen; a stylesheet did.
  - ⚠️ **And the invitation card was promising a number it could not keep.**
    *"this page becomes your thirteen seasons"* — shown to somebody who has
    picked nobody, and then Hyman taps his name and gets nine. It promises no
    count now. A hand-typed thirteen in the one file whose whole discipline is
    derivation, on the screen a stranger sees first.
  - ⚠️ `minmax(0, 1fr)` rather than `1fr`: a bare `1fr` floors at the content's
    min-width, which is how a grid silently overflows its container. Not a
    problem at nine to thirteen columns; it is the guard for whoever joins.
  - Verified at 320 and 390px for a 9-, an 11- and a 13-season manager, on the
    You tab and on a profile: zero dead space, no clipped cell, no overflow,
    and 50 view-contexts clean.

- **v63 — one mascot for the league, the eagle for the commissioner (12 Sep
  2026)** — the owner: *"🎖️ make this the emoji instead of the custom by player
  but leave mine the eagles"*.
  - **A straight reversal of v49, which was his idea too**, and the answers
    that made it are kept in the comment rather than thrown away — twelve NFL
    teams collected one question at a time. Deleting them would cost twelve
    questions to get back; a comment costs nothing.
  - 🚨 **AND v49'S ACTUAL RULE IS UNTOUCHED, WHICH IS WORTH BEING PRECISE
    ABOUT.** v49 did not exist to give everyone a *different* mark — it existed
    because the 🦅 was the **fallback**, so eleven managers and every stranger
    opened their own career page under the commissioner's bird. Here the 🦅 is
    an **entry**, reachable only by his own code, and the fallback is still 👤.
    The failure v49 named cannot recur; what changed is only how many entries
    share a glyph, which v49 already said was fine ("duplicates are CORRECT").
  - ⚠️ **A stranger keeps 👤 rather than 🎖️.** With eleven of twelve on the
    medal it is effectively the members' mark, and handing it to somebody who
    has tapped no name would tell them they are one.
  - ⚠️ **U+1F396 needs its variation selector, and this is the third time that
    has mattered here.** `Emoji_Presentation=No`, so the bare codepoint may be
    drawn as a thin monochrome TEXT glyph — exactly what ⚡ did on v49's first
    render. Checked on the rendered heading rather than in the source:
    `U+1F396 U+FE0F`, in colour, on both the heading and its jump chip.
  - ⚠️ **🎖️ is already the Final fours mark on Honors (⚠️ SUPERSEDED in v87: now Leaders) — checked, and they never
    share a page.** The mascot renders on You and on a profile; Final fours is
    on Honors. So the v50 clash (two identical marks in one jump row) does not
    arise. The glyph does now carry two meanings across the app, which is his
    call and is written down so a later session does not "fix" one of them.
  - Verified on the render at 390px: 🎖️ on all eleven, 🦅 on his own heading and
    profile, 👤 for a stranger, the per-manager mascot law still green (now
    reporting **2 distinct across 12 of 12**), and 50 view-contexts clean.

- **v62 — the last four brackets, and why the guess was wrong (12 Sep 2026)**
  — the owner sent the 2013, 2014, 2015 and 2016 winner's brackets, the four
  v60 asked for.
  - **Seeds & upsets covers all 13 seasons now**, 65 championship-bracket
    games, with ESPN's own seeding rather than a derivation.
  - 🚨 **AND THE SCREENSHOTS ANSWERED THE QUESTION v58 COULD NOT: DIVISIONS.**
    Every row on these four pages reads *"(8-5-0, 1st in Bologna Division)"* —
    **the league ran two divisions, Nectars and Bologna, and the winners took
    the top two seeds.** That is why an 8-5 team was seeded second above a
    10-3 team in 2016, and why 9-4 Weggie Rayne outranked 9-4 Christels in
    2013. ⚠️ **The 2017 page carries no division labels**, which is exactly
    why `calcSeed` reproduced 2017 and failed those two. The anomaly was never
    a data error; it was a league rule the archive did not know about.
  - 🚨 **VERIFIED BEFORE A SINGLE SEED WAS TYPED.** Each screenshot was matched
    to its season on evidence it could not have been fitted to: team names,
    records, final placings and **all eight round-1 scores** agree with the
    archive exactly (2013's 130.5/112.1 and 119.2/102.2, 2016's 76.9/102.3 and
    63.9/110.1, and so on).
  - 🚨 **THEN CHECKED AGAINST A SECOND, INDEPENDENT SOURCE — AND THIS IS THE
    ONE THAT MATTERS.** In a six-team bracket the byes go to seeds 1 and 2 and
    round 1 is 3v6 and 4v5. The bracket GAMES came from v56's coordinate
    parser; the SEEDS came from four phone screenshots. They agree in **13 of
    13 seasons**. That is now a conservation law, verified by transposing two
    2016 seeds, because a hand-typed number landing on the wrong row is
    precisely the failure no other check could see.
  - 🚨 **THE CARD'S HEADLINE MOVED, AND IT MOVED BY ITSELF.** With 8 seeded
    seasons the only line worth printing was the two ${'#'}6 champions. With 13,
    **the ${'#'}5 seed has won more titles than any other — five — while the
    ${'#'}3 and ${'#'}4 seeds have never won one.** Both sentences read the
    title counts rather than naming a seed, so the new data rewrote the card
    with no edit. That is the derivation rule paying out for the fourth time in
    five versions. ⚠️ The better seed still wins only **28 of 65**.
  - ⚠️ **`calcSeed` is DELETED.** Nothing read it, v58 wrapped it in a warning
    never to wire it up, and its premise is now disproved rather than merely
    unproven. A computed value nothing reads is the v8 `STATS` trap; keeping
    one whose rationale has been refuted is worse.
  - ⚠️ **Two faults of my own, both caught by running it rather than reading
    it:** I replaced the `sdYrs` definition instead of inserting beside it (the
    render threw `ReferenceError` on the first paint), and my first derivation
    of the division span was wrong — it looks for a lower seed with a BETTER
    record, which finds only 2016, because 2013's division winner was 9-4
    against a 9-4 and is invisible to that test. **The card reports the
    inversion it can actually see and never claims a division span it cannot**,
    which is the honest version of a derived sentence.
  - ⚠️ **`bySeed`'s comparator was not transitive for a partly-seeded season.**
    2013-2017 publish seeds for the bracket six only, and
    `a.seed && b.seed ? a.seed - b.seed : 0` returns 0 for a seeded row against
    an unseeded one. A missing seed sorts LAST now. Also checked what depends
    on it: `s.top` feeds "how often the top seed wins" in the hero strip, and
    it is **unchanged at 3 of 13** — the divisions disagreed at ${'#'}2 versus
    ${'#'}3, never at the top, so that stat was coincidentally right and is now
    actually right.
  - Verified: checks green including the new seed law, and 50 view-contexts at
    320/390px clean.

- **v61 — the lifetime table the archive never had (12 Sep 2026)** — the
  owner: *"Lifetime standings like w-l and pts for all should be in here
  somewhere."*
  - **He was right, and the near-misses are why nobody had noticed.** A career
    W-L was already on screen twice — as a sub-line under the trophy case
    (a table sorted by MEDALS) and as the "actual" half of the luck index's
    gap. So the number existed and the TABLE did not: nothing in the app was
    ranked by record, and **career points-for was not anywhere at all.**
    ⚠️ Worth recording as a shape: *a fact present as a sub-line under
    something else reads as covered.* Third time this archive has held the
    data and not the view (v13's badge key, v52's playoff record).
  - 🚨 **RANKED BY WIN RATE, AND THE TOTALS CANNOT BE — the card says so with
    its own numbers.** Hyman has 9 seasons against everyone else's 13, so
    total wins would rank longevity. Points are worse: **Hurd leads all-time
    scoring with 18,235 and Hyman scores the most per game at 104.9.** Both
    are printed, which is the honest version of the v3 rule — not hiding a
    total that is not a ranking, but putting the rate beside it and naming
    every row's season count.
  - ⚠️ **Competition rank from the first commit.** McD and Zach are both
    93-81; Gotch and CC are both 88-86. Shipping a new table that handed out a
    sole 3rd and 4th from one identical record would have been v58's fault
    reintroduced in the very next feature — so the tie handling went in with
    the card rather than after somebody read it.
  - ⚠️ **`tag('reg')`, and the caption states the contradiction rather than
    leaving it.** This order is the regular season and it disagrees with the
    trophy case constantly — **Wolff is first all-time with no title.** Two
    tables on two tabs ranking the same twelve people in different orders is
    only honest if each says which question it answers.
  - ⚠️ **Two-line rows, not five columns** — the v39/v52 finding applied
    before it could bite. Reuses `.fh-po`'s shape, so no new layout idea, and
    the reader's own row bleeds to the card edge the same way.
  - Verified at 320 and 390px as a stranger, as the league leader, as the
    9-season manager and as the bottom row: twelve rows of uniform height, no
    clipped name, no wrapped sub-line, no overflow, no page error, the jump
    nav picking up an eighth chip with no code change, and checks green
    including the three new laws.

- **v60 — the seeds were never missing, just never copied across (12 Sep
  2026)** — the owner, with the 2017 bracket on screen: *"Seeds are right
  there u said they weren't before."*
  - 🚨 **HE IS RIGHT, AND IT IS THE v56 LESSON REPEATING ONE LAYER DOWN.**
    v58's Seeds & upsets caption said *"ESPN published a seeding for 8 of the
    13."* False. ESPN prints `#1`-`#6` on the Final Playoff Results page for
    **every** season, including the five he captured for v56 — they are on the
    2017 screenshot in plain sight. The archive has no `seed` for 2013-2017
    because those numbers were never transcribed, not because they do not
    exist. **v56's own entry says THE GAMES WERE NEVER MISSING FROM ESPN;
    THEY HAD NOT BEEN COLLECTED, in capitals, in this file — and I made the
    identical inference about the seeds two versions later.** "Not in our
    data" is not "does not exist", and the check for it is to look at the
    source rather than at the schema.
  - **Verified the screenshot is 2017** before changing anything: same teams,
    same records, same final placings, same round-1 scores (110.5, 119, 74,
    69.6). Its seeding is #1 My Knee Grows, #2 Morning Woods, #3 Pepperoni
    TD's, #4 What Can Browns Do For Jews, #5 The Great Wentz, #6 Shady (ACL)
    Crack Cooks.
  - ⚠️ **The case against COMPUTING them is unchanged and better evidenced.**
    2016 gave a bye to an **8-5 team over a 10-3 team**, and 2013 seeded a 9-4
    team above another 9-4 team with **161 more points**. No arithmetic on
    records or points recovers either, so `calcSeed` stays unwired — but the
    reason is "ESPN used a tiebreak this archive does not hold", not "ESPN
    published nothing."
  - The caption now says the other five seasons **are** seeded on ESPN and the
    gap is transcription, with the 8-5-over-10-3 fact as the reason the card
    will not guess. No data change; the card still covers 8 of 13 and now says
    why. ✅ **CLOSED in v62** — he sent the four brackets within the hour and
    the card covers 13 of 13. The 8-5-over-10-3 anomaly turned out to be
    **divisions**, named right on the pages he sent.

- **v59 — a second look at v58, asked for (12 Sep 2026)** — the owner, after
  a model switch: *"Anything you'd alter?"* Three things, all in v58's own
  work, none of them found by the suite.
  - 🚨 **I WROTE A CAPTION CLAIM WITHOUT CHECKING IT, AND IT WAS FALSE.** The
    January card's caption said both numbers on a row cover *"the seasons
    they actually reached the bracket."* `ST.era`'s `reg` filtered by
    `PO_YEARS` — seasons with ANY bracket on file — which was doing real work
    while that was 7 of 13 and does nothing now that it is all 13. 2025 is
    winner's-bracket only, so the **six managers who missed its playoffs had
    a 2025 regular season in `reg` with nothing opposite it in `po`.** Hurd's
    gap read **−9.1** on the card, on his own storyline, and in v58's own
    changelog; it is **−10.1**. **A caption that asserts a property of a
    computation is a promise the computation has to keep**, and I read the
    comment above the code instead of the code — the comment was true when
    written and had gone stale the same way every caption in v58 had.
    - `reg` is per manager now: exactly the seasons THAT manager played a
    ⚠️ **SUPERSEDED in v90:** championship-only matched baselines and
    descriptive rate gaps replace the former sample/interpretation.
      bracket game in. Both the card and the detector read the same `ST.era`,
      so they moved together (McD/Hyman/Gotch/Woods/Wolff/Zach unchanged; the
      six 2025 non-playoff teams moved 0.2-1.0). `PO_YEARS` lost its last
      reader and is deleted — a computed-and-never-read value is the v8 trap.
  - 🚨 **THE v58 CAPTION MADE A FACTUAL CLAIM THE SUITE DID NOT GUARD.**
    "The bracket count beside each record IS that manager's playoff
    appearances" is true only while every season carries a championship
    bracket — 2025 very nearly did not. The day one lands without, the card
    goes on saying it. **A claim a card makes as fact is a law or it is a
    liability**: `bA === po` per manager is asserted now, and verified by
    dropping the 2025 W games, which names exactly the six 2025 playoff teams.
  - ⚠️ **"joint 9th of 12" was true and read like a generator wrote it.**
    v57's bottom-three wording keys on `N − r`; with competition ranks a tie
    group at the bottom shares the top of its range, so three managers on 3
    final fours were all "9th" and none counted as bottom-three while together
    they were exactly that. Counted from the bottom they are **joint
    second-worst** — the v57 rule ("said from the bottom, how a person says
    it") applied to the tie case v58 introduced. Untied ranks are unchanged.
  - **Verified:** suite green including the new `brackets == appearances` law
    (fault-injected: six named), the `shared ranks` law still passing under
    the new wording, Hurd's card reading −10.1 in both voices, and the same
    50 view-contexts at 320/390px clean.
  - ⚠️ **The one judgment call left standing, deliberately, and put to the
    owner rather than decided at 4am:** the Season tab's clipped team names.
    `.ls-odd` is `18px auto 1fr 40px 36px` — the two percentages ARE the row,
    so v39's "move the stats to a second line" does not transfer; the name
    would have to wrap instead, on the live tab, with rows of uneven height.
    That is a design decision on the page he opens first, not a fix.

- **v58 — the sweep after the data landed (12 Sep 2026)** — the owner, going
  to bed: *"We just got a ton of new playoff data that had to shift and change
  the info all of the app that we missed… make sure we are accurate
  entertaining and informative with this wealth of information."*
  - 🚨 **THE DATA WAS RIGHT AND THE SENTENCES AROUND IT HAD GONE WRONG.**
    v56/v57 took the archive from 119 bracket games over 7 seasons to 209 over
    13, and every count in the app re-derived correctly — that is the
    derivation rule paying out exactly as v13 promised. What did **not**
    re-derive was the PROSE built to explain a gap that no longer exists.
    Three captions collapsed into nonsense the moment `PO_YRS` reached
    `SEASON.length`:
    - Honors rendered *"it covers all 13 seasons rather than the 13 with a
      bracket on file"* — a contrast between 13 and 13.
    - The You tab and **every profile** rendered *"knowable for every season,
      not just the 13 with a bracket on file"*.
    - The record book rendered *"209 games across 13 of 13 seasons, because
      only those seasons have a bracket on file"*.
    **A sentence whose job is to excuse a gap becomes gibberish when the gap
    closes, and nothing fails when it does.** Numbers re-derive; the argument
    around them does not.
  - 🚨 **AND ONE OF THEM WAS FLATLY FALSE, TWO TABS FROM ITS OWN
    CONTRADICTION.** That same Honors caption said **"The app keeps no bracket
    win-loss record"** — true when v19 wrote it, false since v50 put
    `14-6 from 10 brackets` on Records. The identical claim sat in a
    `history.js` comment and in `checks.js`. **A comment that outlives its
    fact is how the next session reintroduces the bug it describes**, so all
    three were fixed together, not just the one on screen.
  - 🚨 **THE DENOMINATOR WARNING HAD INVERTED, AND THAT IS THE HAPPIEST FIND
    HERE.** Playoff appearances shouted *"the two numbers on a row have
    different denominators"* — written when the record covered 7 seasons and
    the rate covered 13. With a bracket on file for every season, **`bA === po`
    for all twelve managers**: a manager's bracket count IS their playoff
    appearances. So the owner's own question from v51 — *"Shouldn't I have 6
    losses since 10 appearances and 4 titles"* — now closes on his real
    career, **14-6 from 10 brackets**, and the card says the arithmetic works
    instead of warning about a mismatch the data removed.
  - 🚨 **SEEDS & UPSETS IS THE ONE CARD THAT STILL DOES NOT COVER EVERY
    SEASON, AND IT WAS THE ONLY ONE NOT SAYING SO.** 2013-2017 arrived with
    brackets but **no seeds** — ESPN never published them. The card computes
    over 40 games from 8 seasons while `PO_NOTE`, printed directly above it,
    claimed 209 games across 13. **Two denominators adjacent and unlabelled is
    this app's oldest fault (v3), and the new data is what created it**: the
    two spans used to be close enough to hide.
    - ⚠️ **`calcSeed` looked like the fix and is a trap.** It already computes
      a fallback seed and nothing reads it. Tested against the only
      independent evidence the archive has — the bracket's own shape, byes to
      seeds 1 and 2, R1 as 3v6 and 4v5 — it reproduces all 8 real-seed seasons
      and 2014/2015/2017, then **fails 2013 and 2016**: in 2013 the bye went
      to a 9-4 team with *fewer* points than the 9-4 team it ranks above, and
      in 2016 to an 8-5 team over a 10-3 team. Wiring it up would have
      invented two seasons of seeding and fabricated upsets that never
      happened. **The conservative card was right; it just needed to say its
      span.** The warning is written at `calcSeed` itself, because the
      temptation is obvious and the failure would be silent.
  - 🚨 **A RANK THAT FOUR PEOPLE SHARE WAS PRINTED AS SOLE POSSESSION.**
    `signature`'s `rankOf` was `findIndex` on a sorted array — pure array
    position — so the four managers on 5 final fours got 2nd, 3rd, 4th and 5th
    in `ALL` order, and Gotch's card read **"5 final fours, 2nd of 12."** The
    same value produced a different sentence depending on who was reading; on
    win%, McD and Zach are identical at 93-81 and Zach was labelled "4th-best".
    **The app's oldest storyline rule is that a superlative firing twice is
    just wrong** (v2) — every real detector honours it through
    `leaders()`/`alsoTxt()`, and these ordinals never did.
    - **Fixed in the two rank HELPERS, not the cards** (the v16 rule): rank is
      `1 + how many are strictly better`, and `tiedOn` makes it read
      **"joint 2nd of 12"**.
    - ⚠️ **The new data is what exposed it**: `f4` moved for eight managers and
      created three fresh multi-way ties, exactly at the ranks this backstop
      fills. Latent and wrong before; visible and wrong after.
    - 🚨 **AND WRITING THE LAW FOR IT REPRODUCED THE v39 BUG VERBATIM.** The
      first cut called a `fail` defined in another function, so the failure
      path threw `ReferenceError` instead of reporting — *"a check whose
      failure path has never run is not a check"*, in the file that says so.
      **Only fault injection found it**, because the success path never runs
      the failure path. Rewired to the suite's own `block()` + `bad++`.
    - ⚠️ **And the law's first home made an innocent block go red** — it sat
      inside the `storylines` summary's `block()` window, which is the exact
      v49 fault (a summary reporting the running counter). Moved below it, and
      verified both ways: injected, it names CC, Gotch and Zach while
      `storylines` stays ✅.
  - 🔥 **THE ONE ADDITION: "Who shows up in January".** Every manager's
    regular-season ppg against their own playoff ppg. The gap has been
    computed for all twelve since v2 and the app only ever printed the biggest
    faller and the biggest riser, gated at −5/+4 — thresholds set when
    brackets existed for 7 seasons. Over 13 the spread widened and **ten of
    twelve now sit more than two points from their regular-season scoring**
    while the card still named two. **The v7 coverage fault in a new costume**,
    landing again on the managers the extreme-hunting detectors have least to
    say about. Woods **+7.3**, Hurd **−9.1** (⚠️ **SUPERSEDED in v59: −10.1**
    — the v58 number carried a 2025 regular season with no bracket opposite
    it), six of twelve on the plus side.
    - 🚨 **It reads `ST.era` — the same object the detectors read.** Computing
      the gap a second time, even correctly, would have been the v14 fault
      exactly: one concept, two numbers, each right, and the page lying
      because nothing says which is which.
    - ⚠️ **No denominator trap, which is rare in this app:** both numbers are
      the same manager over the same seasons, so scoring inflation moves the
      pair together and cancels out. Only the cross-manager ranking spans
      eras, so every row names its own game count (the v51 rule).
    - ⚠️ It reuses `.fh-lx` wholesale, so it needed **no new CSS** and wraps
      exactly as the luck index does — checked at 320px, where both go to two
      lines identically, rather than assumed.
  - ⚠️ **Two faults in my OWN new copy, both caught by reading the render:** a
    spelled-out number opening a sentence in lowercase (*"…−9.1. six managers
    of the 12…"*) — the v39 fault, in the same session that fixed the rest of
    v39's family — and a year range printed **backwards** (*"2018-2025"* came
    out *"2025-2018"*, because `SEASON` is stored newest-first and I trusted
    array order, which is the thing `byPF`/`bySeed` exist to refuse). There is
    a `cap()` beside `plWord` now, and the range is sorted explicitly.
  - ⚠️ **A voice bug of my own, too:** the new card's lead picked its pronoun
    from the top-ranked manager, so with Woods reading, a general description
    of the card became *"what you scored"*. Leads about a whole table are
    impersonal; `vb()` is for sentences about a person.
  - **Verified:** all 209 games re-checked against independent evidence — the
    five new Cum Bowls (`GmC3` — ⚠️ **v66 said that was round one and not the
    Cum Bowl; v79 confirms it IS the Cum Bowl, so this line was right as
    written**) match the hand-entered `CUMBOWL` array exactly,
    team and score, and all 13 finals match the recorded 1st/2nd placings.
    `node checks.js` green including the new **shared ranks** law, and the
    per-manager bracket law re-verified by flipping a 2016 result (both
    directional totals stay ✅; only it speaks). Rendered in headless Chromium
    over HTTP at 320 and 390px across **50 view-contexts** — five tabs ×
    {stranger, McD, Hurd, CC, Woods} — with no horizontal overflow, no clipped
    tab label, no type under 9px, no tap target under 38px, no template hole
    and no page error.
  - 🚨 **FOUND AND DELIBERATELY NOT FIXED: the Season tab clips team names at
    both phone widths, including the reader's own** (`.ls-odd-t`, `.ls-sw-n`,
    `.ls-sc-n`). 17 clipped cells at 320px, two at 390px for every persona.
    **v39 fixed exactly this for the standings table and the three lists added
    after it never got the fix.** It is pre-existing, unrelated to the playoff
    data, and wants its own pass with a render at both widths — so it is in
    Open / next with its measurements rather than bolted onto a release about
    the archive.

- **v57 — the last bracket, and a rank that reads like a person wrote it
  (12 Sep 2026)** — the owner sent the 2025 Sleeper bracket.
  - **13 of 13 seasons.** Five winner's-bracket games, and **his own
    arithmetic now closes on the full career**: 10 playoff appearances, 4
    titles, **14-6** — the six losses he predicted three exchanges ago, from
    the data rather than from the rule.
  - 🚨 **SLEEPER PRINTS TWO NUMBERS PER TEAM and one of them is a
    PROJECTION.** Bold actual, grey projected, stacked. Reading the wrong one
    would have produced a complete, plausible, entirely fictional bracket —
    and no conservation law could tell, because a fiction balances just as
    well as a fact. **The check is the final**: 124.04-107.28 is what
    `SEASON[2025].final` has held by hand since v1, and the bold numbers match
    it exactly.
  - ⚠️ **The 2025 final is now in `PLAYOFF_GAMES`, so the `s2.final`
    reconstruction stops firing for it.** `seen` is keyed on year + pair and
    that dedupe is the only thing standing between one game and two; verified
    by counting FINAL rows in `MEET` (one).
  - ⚠️ **Winner's bracket only** — the placement and consolation games were
    below the fold. Written down rather than left to be inferred from a
    thinner head-to-head count later.
  - 🚨 **AND THE NEW DATA BROKE A STORYLINE, WHICH IS THE POINT OF THAT
    CHECK.** Riz's card came out "made the playoffs in 4 of **11** seasons"
    over "The **11th**-best rate of the 12" — two different elevens, a season
    count and a rank, colliding on one card. `checks.js` caught it (a numeral
    ≥3 in heading and body) the moment the 2025 games shifted the rankings.
    **Nobody wrote that sentence; the data moved underneath it**, which is
    exactly the failure the detectors exist to survive and the check exists to
    catch.
    - **Fixed in the two rank HELPERS, not in the card that failed.** Every
      claim reads a rank through `rk`/`bestish`, so the collision was
      available to all of them — the v16 rule, fix the rule not the instance.
      A rank in the bottom three is now said from the bottom: "the
      second-worst rate of the 12", which is also simply how a person says it.
  - **A new league record appeared on its own**: Hyman's 193.5 in the 2025
    first round is the highest playoff score ever recorded, displacing
    Christel's 183.3 — detected, not typed, with no edit to any card.
  - Verified: 209 games, all 13 seasons, every conservation law green
    including the per-manager `losses == brackets − titles`, and the playoff
    card, storylines, mascots, Records order and both tab bars re-rendered at
    390 and 320px.

- **v56 — the five missing brackets, from the owner's own captures (12 Sep
  2026)** — the owner, on being told 6 of 13 seasons had no bracket games:
  *"What? U don't have every bracket from the whole history?"* — then sent the
  five ESPN "Final Playoff Results" pages.
  - 🚨 **THE GAMES WERE NEVER MISSING FROM ESPN; THEY HAD NOT BEEN
    COLLECTED.** A parallel session had just worked that out from the source
    captures — ESPN serves two tabs a season, Standings and Final Playoff
    Results, and 2013-17 only ever had Standings opened. The owner opened the
    other five tabs in about three minutes. **119 games from 7 seasons → 204
    from 12.** Only 2025 is still out, and only because it is the Sleeper
    season.
  - 🚨 **PARSED BY COORDINATE, NOT BY READING THE TEXT DUMP.** The page is
    three columns — round 1, round 2, championship — and a flat text
    extraction interleaves them, so `Slob on my Cobb 130.5` and
    `Cutty-Marshall 112.1` arrive on lines that do not say they are the same
    game. Every pairing would have been a guess. The extractor reads word
    boxes: a team's score sits at the same y + 8.5px in the next column, two
    adjacent entries in one column are one game. **Getting this wrong would
    have put the right scores against the wrong people** — silently, and in a
    way no conservation law could see, because the totals would still balance.
  - 🚨 **AND THE PROOF THAT IT DIDN'T IS THE CUM BOWL.** ⚠️ **v66 marked this
    paragraph superseded, claiming `GmC3` is not the Cum Bowl; v79 reinstates
    it on the owner's word, so this entry was correct as originally written
    and the v66 marker is the thing that was wrong.** Left visible rather than
    deleted: a marker that turns out to be the error is worth more as a
    warning than as a clean page. `GmC3` **is** the Cum
    Bowl, and this archive has had all thirteen Cum Bowls by hand since v1 —
    entered from a different source, years apart. All five extracted GmC3
    games match the stored ones **exactly, team names and scores to the
    decimal**. Plus: every champion and runner-up matches the recorded
    placings, the six winner's-bracket teams are exactly that season's top
    six, the six consolation teams are exactly the rest, and every third-place
    finisher wins a placement game. **A parser validated against data it never
    saw.**
  - ⚠️ **One name arrived truncated** — ESPN clipped "I Had a Dog His Name Was
    Ji…" in the 2016 bracket. Resolved against that season's own standings,
    where exactly one team matches the prefix, and the resolver asserts
    uniqueness rather than taking the first hit.
  - 🚨 **THE NEW DATA BROKE TWO OF MY OWN LAWS, AND THEY WERE RIGHT TO
    BREAK.** `title-bracket slots` came out 114 against 120 and `W == L` came
    out 56 against 58. The cause is **Ebzery**, who is untracked and who
    reached the final in **both** 2013 and 2014 — six winner's-bracket slots
    belonging to nobody with a career. Every other law in this file already
    subtracts the untracked pair; mine were written when no untracked manager
    had ever been in a bracket, so the exclusion had never been exercised.
    - ⚠️ **`W == L` is retired rather than patched.** Over the tracked subset
      that symmetry is now legitimately FALSE — Ebzery went 4-2 across the two
      — so it was a law that happened to hold, not one that has to. Wins and
      losses are counted straight off the games instead, which is strictly
      stronger: it catches an outcome flipped in one direction, which a
      symmetric total never could.
  - **The owner's own arithmetic closes.** He asked why he had 3 losses when
    10 appearances and 4 titles should mean 6. With the brackets in he reads
    **12-6 from 9 brackets** (⚠️ **SUPERSEDED in v57**, which added 2025:
    **14-6 from 10 brackets**, and 10 brackets is now his whole playoff
    career) — 9 − 3 titles on file = 6, and the per-manager
    law asserts it for all twelve.
  - ⚠️ **Nothing user-facing had to be edited, and that is the derivation rule
    paying out.** The ⚑ key re-read itself to "204 bracket games from 12 of 13
    seasons", the Playoff appearances caption to "60 games across the 12
    seasons (2013-2024)", every row to its own new bracket count. A hand-typed
    count would have been the one thing in the app that lied the day the data
    landed — which is exactly what v13 said when it refused to type one.
  - Verified: 204 games, 12 of 13 seasons (⚠️ **SUPERSEDED in v57**: 209
    games, 13 of 13), all conservation laws green, and
    the playoff card, the mascots and the Records order all re-rendered at 390
    and 320px as the reader, another manager and a stranger.

- **v55 — bigger tab type, and the row did not move (12 Sep 2026)** — the
  owner: *"these fonts should be larger. Looks like there space to make them
  bigger without shifting anything else lower which is what I want"*.
  - **He was right that the space was there, and it is worth writing down
    WHERE.** `.ai-sub button` is `min-height: 38px` with `line-height: 1`, so
    the box is 38px while the text needs only padding + font — 27px at the old
    size. The height is pinned by the tap-target floor, not by the type, so
    roughly 11px of growth is free and the row stays 47px. Past ~19px the text
    starts driving the height and everything below it moves.
  - 🚨 **THE LIMIT IS WIDTH, AND IT CLIPS IN SILENCE — AND MEASURING IT FOUND
    A LIVE BUG.** `.ai-sub button` is `white-space: nowrap; overflow: hidden`,
    so an over-wide label is cut off with nothing on screen saying so. Sweeping
    every button's `scrollWidth` against its `clientWidth` across nine widths
    showed **"Cum Bowl" was ALREADY clipped at 320 and 360px** — its 11px was
    measured at 390px only (v218's note says so in as many words) and never
    re-checked narrower. Third time this trap has bitten (v218, v39, here).
  - 🚨 **`flex: 1 1 auto` IS THE FIX, AND IT IS WHAT PAID FOR THE BIGGER
    TYPE.** Equal fifths handed "You" — three letters — exactly as much room
    as "Cum Bowl", so the bar was starving its longest label to subsidise its
    shortest. Content width plus an equal share of the leftover raises the
    320px ceiling from 9px to 12px, which is what makes the increase possible
    at all rather than just possible on big phones.
  - 🚨 **SIZED AGAINST THE FALLBACK FONT, NOT ARCHIVO.** Measured both, by
    serving the real Archivo from disk: **Archivo is narrower, so its ceilings
    run 2-4px higher.** A phone that cannot reach Google Fonts renders the
    fallback — so the fallback is the number that has to fit. Sizing to
    Archivo would have clipped on exactly the offline first load this app is
    built to survive. Every size clears the fallback ceiling by ≥1.5px.
  - **11px → 15px on the tabs, 11px → 13px on the sub-tabs** at phone widths
    (13/11 under 360px, 17/14 on desktop).
  - ⚠️ **Desktop wanted 15px on the sub-tabs and it cost a pixel.** At that
    size the button's transparent 1px border tips the box past `min-height`
    and the row goes 47px → 48px — which is exactly the "shifting things
    lower" he asked not to have, one pixel at a time. 14px instead.
  - **Proved by diffing against the previous build, not by eyeballing it**: a
    second copy of the repo at v54 served on its own port, and the top of
    `#lg-body` compared width by width. Identical at 320, 360, 375, 390, 414,
    430 and 900 — under both fonts — with the type larger at every one.

- **v54 — a double tap on a tab zoomed the page in (12 Sep 2026)** — the
  owner: *"if I double click the you tab it zooms in fix that"*.
  - **iOS Safari reads two quick taps in one spot as double-tap-to-zoom**, and
    the tab bar is the one control in this app that genuinely gets tapped in a
    rhythm — switching view and back is two taps 90px apart, and changing your
    mind is two taps on ONE button. There is no way back out except pinching,
    on a page whose whole job is to be handed to eleven people who will not
    debug it.
  - 🚨 **`user-scalable=no` is NOT the fix, and it is the one that suggests
    itself.** It removes the symptom by removing zoom from anyone who needs it
    to read. `touch-action: manipulation` means "everything except double-tap
    zoom" — panning and pinch both survive, and the render check asserts the
    viewport meta is still scalable so a later session cannot quietly trade
    one for the other.
  - ⚠️ **Set on the shell AND on the controls.** A UA resolves `touch-action`
    up the ancestor chain only as far as the nearest SCROLLING ancestor, so
    the shell rule alone would stop working the first time something between
    it and a button scrolls — and `.lg-sheet` already does.
  - 🚨 **THE LAB HAS HAD THIS SINCE v1 AND THE MEMBERS' APP NEVER GOT IT.**
    `power.css` carries the same rule with the same comment. The app that was
    missing it is the one that goes to eleven other people. Fixing only the
    page someone points at while the identical fault sits one file over is the
    v3 lesson — so both were checked rather than assumed, and the Lab's is
    confirmed live.
  - ⚠️ **What this sandbox CANNOT verify: the gesture.** Double-tap zoom is a
    Safari behaviour and headless Chromium does not reproduce it. What is
    verified is that every control on every screen computes
    `touch-action: manipulation` — the picker, the ? sheet, the tab bars, the
    jump chips, the name taps, storyline cards, the profile back button, and
    a Lab button — including the screens built after boot, since the views are
    re-rendered wholesale. **The gesture itself is the owner's phone to
    confirm**, the same division this repo already draws around the Lab's live
    data path.

- **v53 — the owner did the arithmetic and the row was silent (12 Sep 2026)**
  — the owner, on his own row: *"Then move luck index and rivalries to bottom
  of records. Are those records correct. Shouldn't I have 6 losses since 10
  appearances and 4 titles"*.
  - 🚨 **HE WAS RIGHT ABOUT THE RULE, THE NUMBER WAS RIGHT, AND THE PAGE WAS
    STILL WRONG.** A championship bracket is single elimination, so across a
    career losses ARE appearances minus titles: 10 − 4 = 6. It read **10-3**
    because the record covers the **5 brackets he is in on file**, not his 10
    appearances — brackets exist for 7 of 13 seasons, and he missed two of
    those seven. ⚠️ **SUPERSEDED in v56**: he then supplied the five missing
    brackets, so the record covers 12 of 13 and reads **12-6** — his 6 losses,
    arrived at from the data rather than from the rule. The reasoning here
    stands and is why `bA` exists; only the numbers moved. Both numbers correct; the row never said which seasons it
    counted. **This is the v3 fault in its purest form, and v52 shipped it one
    version after writing "the risk it reintroduces is adjacency" in its own
    changelog entry.** A caption at the bottom of the card is not the same as
    a denominator on the row, and the owner found it in ten seconds.
  - **Every row names its own bracket count now** — `10-3 from 5 brackets` —
    so the arithmetic closes without scrolling to the caption, and the caption
    states the single-elimination rule rather than leaving a reader to
    rediscover it the way he did.
  - 🚨 **His question is now a law, and it is PER MANAGER.** `losses ==
    brackets − titles`, asserted for each of the twelve. ⚠️ **Summed it is
    35 == 35 and useless**: verified by swapping W and L in the aggregation —
    `title-bracket slots` stays ✅ at 70, `W == L` stays ✅ at 35, and only the
    per-manager law speaks, naming four managers. **A law over a total cannot
    see a definition drifting underneath it** (v14) — and it cannot see a game
    attributed to the wrong person either, which is what this one is for.
  - **The reorder is one expression**, and the jump nav followed with no
    second edit because it is built from the rendered DOM — verified on the
    render rather than assumed, the same way v44 and v13 checked it. Records
    now runs findings → the record book → the playoff cards → the two derived
    cards last.
  - Verified at 390 and 320px as the reader, another manager and a stranger:
    twelve rows with no name truncated and no sub-line wrapped, seven jump
    chips in the new order, no type under 9px, no tap target under 20px, no
    overflow, no page errors, checks.js green.

- **v52 — the playoff record comes back, on one denominator (12 Sep 2026)** —
  the owner: *"Yes fix it to final fours and add record into playoff
  appearances. That was my q and u just moved past it"*.
  - ⚠️ **HE ASKED TWICE AND I ANSWERED A DIFFERENT QUESTION.** He asked
    whether a playoff record should be *part of* Playoff appearances; I
    audited where the record *currently* lives, found it deleted in v19,
    reported "nothing is orphaned" and closed the question. **"It does not
    exist" is an answer to "where is it", not to "should we add it."** He had
    to ask a third time to get the thing he asked for twice.
  - 🚨 **IT IS THE NUMBER v19 DELETED, AND THE CONDITIONS ON IT ARE THE WHOLE
    OF THIS VERSION.** v14 found the app printing three different "playoff
    records" for one person — 11-4 (W+WC), 10-3 (W), 22 meetings — each
    computed correctly, and the page still lied because nothing said which
    population each counted. v19 removed it rather than caption it. So it
    comes back as **`br === 'W'` only** — the six-team championship bracket,
    not the placement ladder, not the consolation ladder, not the Cum Bowl —
    and McD reads **10-3**, the exact figure v14 named for that population.
    One definition, one place it prints, both spans on the card.
  - 🚨 **The risk it reintroduces is ADJACENCY, not arithmetic.** 35 games
    across 7 of 13 seasons (⚠️ **60 across 12 of 13 since v56**) now sits
    beside an appearance rate covering all 13
    — two denominators side by side, which is the v3 fault whenever they are
    left looking comparable. The row carries the ⚑; the caption says the rate
    is all thirteen seasons, the record is 35 championship-bracket games from
    2018-24, and that it will never square with the 126 meetings on the
    head-to-head pages.
  - **The conservation law came back with it: 70 title-bracket slots.**
    ⚠️ **SUPERSEDED in v56**: the single symmetric law was retired for two
    directional totals (61 wins, 63 losses) once the untracked Ebzery's two
    finals made `W == L` legitimately false over the tracked subset. v19
    retired it as "a law over a value nothing displays is testing dead code",
    which was right then and is wrong now. ⚠️ **It is written against the
    POPULATION, and that distinction is the point**: reverted to let the
    placement ladder back in it reports `112 != 70`, while **`W == L` stays
    green** — a law over a symmetric total cannot see a definition drifting
    underneath it, which is exactly how v14's bug survived.
  - 🚨 **TWO LAYOUT FAULTS, BOTH FOUND BY LOOKING AT IT, NEITHER ASSERTABLE:**
    - **A fourth column was not possible.** The row is a 96px name against a
      bar and a percentage; adding the record took the name under 80px with
      most of the league truncated. The v39 standings fix applies unchanged —
      the bar and the number have floors, the name is the only thing left to
      squeeze — so the stats moved to a full-width second line.
    - 🚨 **`dot('po')` PRINTED "PLAYOFFS ONLY" ON ALL TWELVE ROWS, AND THE ROW
      IT BROKE WAS THE READER'S OWN.** That helper renders the badge's full
      uppercase label, because it is built to caveat ONE number somewhere a
      heading badge cannot reach. Twelve times down a card it is louder than
      the records it qualifies and it is the same six words repeated — and it
      wrapped `.fh-po.you` onto a second line, because the reader's row is
      inset 14px each side and therefore runs out of width first. **The only
      row that looked broken was the one belonging to whoever was holding the
      phone.** The flag glyph alone carries it (`.fh-po-br`), the caption says
      the sentence once, and the row went 88px → 73px.
  - **And the fix he asked for in the same breath:** the You tab's "Tell the
    app who you are" card promised *"your medals, your playoff record and
    your Cum Bowls"* — prose that outlived the stat by seven versions, on a
    stranger's first screen. It reads **final fours** now, which is what that
    page shows. Asserted: no view and no profile contains the phrase.
  - Verified at 390 and 320px as the reader, as another manager and as a
    stranger: twelve rows, no name truncated, no sub-line wrapped, the ⚑
    inside its own line box, no type under 9px, no overflow, no page errors,
    and the v49 mascots re-checked unchanged.


- **v51 — the Patriots mascot is a beer (12 Sep 2026)** — the owner: *"Keep that
  icon but change the pats one to 🍺"*.
  - **Both Patriots managers change, not one.** A mascot here is per TEAM —
    three Jets fans share ✈️ — so leaving one of the pair on 🇺🇸 would read as a
    mis-mapped manager rather than as a joke. `checks.js` still counts **9
    teams across 12 of 12**, which is the number that would have moved to 10 if
    only one entry had changed.
  - ⚠️ **Nothing to guard on this glyph, and it was checked rather than
    assumed.** U+1F37A is a single codepoint with `Emoji_Presentation=Yes`: no
    variation selector, unlike ✈️ and ⚡️ in the same map (v49 found ⚡ drawing
    as a thin monochrome text glyph without one), and no ZWJ sequence to
    degrade into two marks, unlike 🐦‍⬛. Verified by printing the codepoints of
    all twelve.
  - ⚠️ **It IS a version bump, unlike a crest swap.** A crest is its own file,
    so replacing one is data and rides no `?v=`; a mascot is a line in
    `history.js`, and a device holding `history.js?v=50` would keep the old
    glyph for good. **Where the data lives decides whether a data change needs
    a release.**
  - Verified on the render as each Patriots manager, as a Jets manager and as a
    stranger: 🍺 on both their You headings and both their profiles, every other
    mascot unmoved, the 👤 fallback intact for a stranger, **no 🇺🇸 left in any
    rendered view**, no overflow, no page errors, checks.js green.

- **v50 — the champion's curse closes Honors (12 Sep 2026)** — the owner: *"Put
  champions curse below that"*.
  - ⚠️ **Shipped as v49 and renumbered to v50 on the merge.** Another session's
    mascot work reached `main` first with its own v49 — and because both sides
    had independently written `'v49'` into `APP_VERSION`, `CACHE` and both
    pages' `?v=`, **git merged those lines clean**: an identical string is not a
    conflict, so the collision was invisible to the merge and was caught by
    reading the version out of the merged tree. The entry below keeps v49,
    having got there first; this one moves up. **Two sessions in flight cannot
    both be trusted to pick the next number — read `origin/main` before
    bumping, and check the version again after any merge.**
  - **One term out of `rec` and onto the end of `hon`.** The card is
    self-contained — its copy names no neighbour — so nothing else moved, and
    Records is now Storylines · the record book · the luck index · rivalries ·
    playoff appearances · seeds and upsets.
  - **And it belongs here**: the curse is about what happens to a CHAMPION the
    year after, so it reads as the last word on a page about champions rather
    than as one more leaderboard.
  - 🚨 **THE MOVE CREATED AN ICON CLASH THAT DID NOT EXIST BEFORE.** It was
    **👑 The champion's curse** — and 👑 is also **The trophy case**, two cards
    above it on the page it just landed on. Two identical marks on one page,
    and **two identical chips in the jump row**, which is scanned by its mark:
    the same argument v48 used to give final fours a 🎖️ of its own. So it is
    📉 now, which also says what the card found. ⚠️ **A card that was fine
    where it was can be wrong where it lands** — an icon is only unique
    relative to its page, so check the destination's marks on any move, not
    just the card's own copy. Second version running where the knock-on was a
    NAME rather than a layout (v48 renamed Playoff record).
  - ⚠️ **And a near-miss worth recording: `ord()` here is the WHOLE ordinal.**
    The curse rows read `${p.next}: ${ord(p.place)}`, which looks exactly like
    the v39 fault in `season.js` — where `ord()` is the SUFFIX only and reading
    it as a whole ordinal printed *"a best finish of st."* Two files, two
    functions, one name. `history.js`'s returns `n + suffix`, so the rows are
    correct (verified on the render: **"2025: 3rd 8-6"**). **Checked before
    "fixing" it** — a repo rule applied to the wrong file would have produced
    "2025: 33rd".
  - Verified at 320 and 390px, as a reader and as a stranger: Honors renders
    **👑 The trophy case · 🏆 Champions · 💔 Still waiting · 🎖️ Final fours (⚠️ SUPERSEDED in v87: Seeds & upsets takes this slot) ·
    📉 The champion's curse**, five distinct marks and five distinct chips, the
    curse last with twelve rows and the reader's own three title years lit;
    Records renders six sections with no curse rows; both ? sheet sentences
    follow; no overflow, no type under 9px, no page errors, checks.js green.
- **v49 — everyone gets their own mascot (12 Sep 2026)** — the owner, on the
  🦅 above his career page: *"Where we have this eagle for me cause I am an
  eagles fan can we get a different one for each person based on there team.
  Ask me each and I'll tell u"*.
  - 🚨 **THE EAGLE WAS NEVER GENERIC AND NOBODY HAD NOTICED.** It was hardcoded
    in the "Your career" heading from v1, and it is HIS team — so the other
    eleven managers each opened the one page in the app that is about them,
    under somebody else's bird, and so did every stranger the link reached.
    **The app's most personal screen was carrying the commissioner's identity
    as if it were the app's own.** Same family as the `isMe` trap the season
    and byline code keep nearly walking into (v33, v39, v42): a fact about one
    particular person, wearing the costume of a default.
  - **The teams are the owner's own answers, twelve of them, asked and told** —
    never inferred, which is this repo's oldest data rule ("Christels Mattress
    is Will Hurd"; never map a person by name similarity). Guessing a person's
    NFL team from their fantasy team name would have been that fault exactly.
  - 🚨 **The fallback is 👤, and choosing it was the only real design decision
    here.** The obvious fallback is to leave the 🦅 for anyone unrecognised —
    which quietly re-creates the whole bug for the reader most exposed to it,
    the stranger who has tapped nothing. `checks.js` asserts the stranger case
    by name, because the failure is one line and looks like nothing on screen.
  - ⚠️ **Deliberately NO uniqueness law.** Three of the twelve are Jets fans
    and two are Patriots fans. A mascot says who you root for; a check that
    demanded twelve distinct glyphs would have been asserting something the
    owner's own answers make false.
  - ⚠️ **The law reads the RENDER, not `MGR_TEAM`** — the v7 lesson, which is
    exactly what makes it worth writing: a law that agrees with the map passes
    over views that have stopped reading the map. It pulls the glyph out of the
    rendered You heading and the rendered profile and requires them to match,
    per manager. **Verified by reinstating three faults** — a manager dropped
    from the map, the fallback set back to 🦅, and the profile hardcoded —
    and each is reported by name.
  - **It went on the profile too, not just the You tab.** Eleven of the twelve
    mascots are otherwise invisible to everybody but their owner, and the
    profile is where you look at somebody else's career — so the mark that
    says whose page this is belongs on it.
  - ⚠️ **Ravens is the one glyph with a rendering risk, stated rather than
    swapped away.** 🐦‍⬛ is a ZWJ sequence; a device older than iOS 16.4 draws
    it as a bird AND a black square. Every phone in this league is far past
    that, and the swap is one character (🪶) if it ever shows up.
  - ⚠️ **And LOOKING at it caught one the measurements could not: `⚡` drew as
    a thin monochrome TEXT glyph** beside eleven colour ones. U+26A1 needs the
    variation selector, exactly as `✈️` already carries — every assertion was
    green over it, because a glyph in the wrong presentation is the right
    character at the right size in the right place.
  - Rendered at 390 and 320px for all twelve plus the stranger: one line each,
    no clipping, no horizontal overflow, no page errors, `checks.js` green.
  - 🚨 **AND THE FAULT INJECTION EXPOSED A LIAR IN THE SUITE ITSELF.** Dropping
    one manager from the mascot map turned **`❌ own-page stories`** red too —
    a subject the injected fault does not touch. Three summary lines printed
    `${bad ? '❌' : '✅'}`, the RUNNING TOTAL, so any failure anywhere above
    them reported itself again under two or three unrelated headings. **The one
    moment a suite is read most carefully is the moment it was most
    misleading**, and it would have sent a session debugging one real failure
    straight into three innocent blocks. `block()` snapshots the counter and
    answers for what happened since; the total at the bottom stays global,
    because the total is what it reports. Verified both ways — an unrelated
    fault leaves the other three ✅, and each still goes ❌ for its own.

- **v48 — final fours close Honors (12 Sep 2026)** — the owner: *"Put final
  fours at the bottom of honors instead of records"*.
  - ⚠️ **"Final fours" was ONE OF TWO CARDS under one heading, and only one of
    them moved.** `playoffHTML()` rendered the appearance-rate leaderboard AND
    the final-four funnel under **📊 Playoff record**. He named the second by
    its own on-screen label, so that is what moved; the rate card is a
    leaderboard and stays with the record book and the luck index. Said plainly
    when reporting it, because "instead of records" could have meant both.
  - **The split is by KIND, which is why it reads right:** final fours · finals
    · won is an achievement, and Honors is the page of achievements (trophy
    case · champions · still waiting); how often you get in is a rate, and
    Records is the page of rates.
  - 🚨 **IT COULD NOT MOVE WITHOUT BEING PROMOTED.** It was a `.fh-sub`
    sub-card *inside* another section, so a bare move would have hung a small
    9.5px subheading under "Still waiting" with no section of its own and **no
    jump chip** — the nav is built from `.section-title` headings. As a real
    section it reorders, chips and scroll-spies like every other card for free.
    ⚠️ And it side-steps the v9 trap rather than meeting it: a `.fh-sub` cannot
    contain its own provenance badge (9.5px line box, 19px badge). Measured on
    the render at 26px with the badge inside the box.
  - ⚠️ **THE HEADING LEFT BEHIND BECAME A LIE, AND THAT IS THE REAL FINDING.**
    "Playoff record" covered a résumé while it headed both cards. Alone above
    an appearance rate it promises a win-loss record — the one thing **this app
    deliberately does not keep** (v19, where a bracket W-L was deleted rather
    than renamed). That is the v14 fault exactly: a name that makes a number
    sound like a different number. It reads **📊 Playoff appearances** now, the
    same word the career tile has used since v10. Not asked for; a consequence
    of the move, fixed in the same edit as the move.
  - **The ? sheet's two sentences moved with it** — they name what each tab
    holds, the one thing a list built from `SUBS` cannot derive. Third version
    running that this is the only hand-edit a card move needs, which is the
    argument for keeping every other list derived.
  - Verified at 320 and 390px, as a reader and as a stranger: Honors renders
    **👑 The trophy case · 🏆 Champions · 💔 Still waiting · 🎖️ Final fours (⚠️ SUPERSEDED in v87: Seeds & upsets takes this slot)**,
    the last of those closing the page with twelve rows and the reader's own
    row lit; Records keeps twelve appearance rows, zero final-four rows, and
    its three legitimate `.fh-sub` subheadings; the jump nav picked the new chip
    up and dropped nothing; the storyline cards that quote final fours still
    render; no overflow, no type under 9px, no page errors, checks.js green.

- **v47 — the tab is spelled "Honors" (12 Sep 2026)** — the owner: *"Spell of
  Honors too"*.
  - **One string: the `SUBS` label.** Everything that prints that word derives
    it from there — the sub-tab bar, the ? sheet's tab list, `checks.js` — so
    the render was checked rather than the code trusted, and nothing else on
    screen carried the spelling.
  - ⚠️ **The KEY stays `hon`.** Renaming it would touch `VIEWS`, `HELP`,
    `S.sub`'s default and every comment that names a view, to change a word a
    reader sees. A label is what the reader reads; a key is plumbing, and
    they are allowed to disagree.
  - ⚠️ **Code comments were updated, the CHANGELOG deliberately was not.**
    Comments are current-state documentation and a grep for the on-screen label
    should find the code that renders it, so the 14 in `history.js`,
    `league.js`, `league.css` and `index.html` now read "Honors". The entries
    below are a record of decisions and are not rewritten — **23 of them say
    "Honours" and it is the same tab.** Same for the current-state sections
    above, which were updated, which is the split this file's standing rule
    asks for.
  - Verified at 320 and 390px, as a reader and as a stranger: the bar reads
    **You · Honors · Records · Cum Bowl · Seasons**, the ? sheet lists the same
    five with no edit, the lit state follows the tab, every tab is 87×38px with
    nothing clipped, the v30 back-out from a profile via the lit tab still
    restores the bar with Honors lit, no page errors, checks.js green. No
    "Honours" left anywhere in the code.

- **v46 — the trophy case leads Honours (12 Sep 2026)** — the owner: *"Make
  trophy case the top of honours and champions 2nd"*.
  - **One term in the `hon` view**, and it is clean for a reason worth checking
    rather than assuming: neither card's copy refers to the other's position,
    and the jump nav is built from the rendered DOM, so the chips reordered
    themselves with no second edit. The ? sheet's sentence for the tab is the
    one thing that does NOT re-derive — it names what a tab opens with, which
    is exactly what a list built from `SUBS` cannot know — so it moved in the
    same pass, the same half-edit v44 needed.
  - ⚠️ **`heroHTML()` stays first and is not a card.** It is the page's
    standfirst and the six-tile stat strip, it carries no `.section-title`, and
    so it is not a jump chip either — "the top of Honours" means the first
    CARD under it, which is what the owner is looking at.
  - **It also reads better as a ranking.** The trophy case is all twelve
    managers ordered by what they have won; Champions is thirteen seasons in
    reverse order. Opening on the league table and then going year by year is
    the way round a reader already expects — the standings before the results.
  - ⚠️ **A HARNESS LIMIT FOUND WHILE CHECKING THIS, AND WORTH WRITING DOWN:
    the jump chips cannot be observed to scroll in headless Chromium under
    `--virtual-time-budget`.** All three chips left `scrollY` at 0, which looks
    exactly like the v30 fault (a control that is on screen and silent when
    tapped). It is the harness: a bare `window.scrollTo({top: 600, behavior:
    'smooth'})` also leaves `scrollY` at 0 in that mode while an instant
    `scrollTo(600)` moves, so the smooth-scroll animation never gets frames.
    **Verified as a harness artefact rather than reported as a bug** — the
    chips were checked by confirming each resolves the right heading and its
    offset (520 · 1441 · 2577px), and nothing about this version touches that
    code. A future session measuring scroll behaviour here needs real frames,
    not virtual time.
  - Verified at 320 and 390px, as a reader and as a stranger: Honours renders
    **👑 The trophy case · 🏆 Champions · 💔 Still waiting** in that order, the
    jump chips match, the hero strip is still the first child, the reader's own
    rows stay lit in both cards (1 medal row, 3 champion years for Woods), no
    horizontal overflow, no type under 9px, no page errors, checks.js green.

- **v45 — You is the first tab (12 Sep 2026)** — the owner: *"Put you as the
  first tab too. Honours 2nd"*.
  - **The reorder is the `SUBS` array and nothing else**, which is what that
    array is for: the sub-tab bar, the ? sheet's tab list and `checks.js` all
    walk it, so the sheet picked the new order up with no edit — verified on
    the render rather than assumed, same as v13's rename did.
  - 🚨 **BUT THE FIRST TAB CANNOT BE THE LANDING TAB, AND THIS IS THE WHOLE
    CARE IN THIS VERSION.** `youHTML()` with `ME === null` is deliberately an
    invitation card and a "Choose my name" button — correct for a destination,
    and **exactly what must never be a front door**: the app's hard rule is
    that nothing may render blank, nag, or gate content behind picking, and
    landing a stranger on that screen is all three. So boot lands a reader who
    has picked on `you` and everybody else on `hon`. One line, and it keeps
    "You first" meaning something for the twelve people the app is for without
    spending the stranger's first screen on a request.
  - ⚠️ **It is the v1 rule, extended rather than invented.** `choose()` has
    always landed a tap on the You page — *"it is a question about yourself;
    the answer should be the page about you"* — so a returning reader opening
    on their own thirteen seasons is the same rule applied to the same person
    one visit later.
  - ⚠️ **And it means a reorder of `SUBS` no longer implies where the app
    opens.** Written into the `SUBS` bullet above, because the next session to
    reorder those tabs will reasonably assume the array decides both, and the
    failure mode if it did is a stranger's first screen.
  - Verified in headless Chromium at 320 and 390px across three devices: a
    reader who has picked (tabs read **You · Honours · Records · Cum Bowl ·
    Seasons**, lands on You with `aria-selected` on it and "🦅 Your career" as
    the first heading), a stranger who tapped "I'm just looking" (same tab
    order, lands on **Honours**, 4,023 characters of archive rather than an
    invitation), and a first-ever open (the picker is still the front door).
    Storylines still opens Records with twelve cards and the You page still
    carries its own; no clipped tab label at 320px with the labels reordered,
    no tab under 38px, no horizontal overflow, no page errors, checks.js green.

- **v44 — Storylines goes back to the top of Records (12 Sep 2026)** — the
  owner: *"Move storylines back to the top of records tab instead"*.
  - **It is the same one-term move v13 was, run backwards**: `storiesHTML()`
    out of the `hon` view and onto the front of `rec`. Nothing else about the
    feature changes — same detectors, same one-card-per-manager roll-call, same
    cards on the You page and every profile, `LH.SUBS` order untouched.
  - ⚠️ **v13's argument was about REACH, and reach is no longer the problem.**
    It moved the strip to Honours because it was *"filed third-of-five behind a
    tab called Records, so most readers never reached it"* — which was true
    when the only route to a buried card was scrolling for it. Since then the
    **?** sheet names what each tab opens with and the jump nav chips straight
    to any card on a page. Those were built for other reasons and they retired
    the premise of the move.
  - **What Honours lost by holding it is coherence.** That page is now the
    Champions list, the trophy case and who is still waiting (⚠️ **v46 swapped
    the first two**: the trophy case leads) — three views of
    the same trophy — while Records is the page of *derived findings*, which is
    what a storyline is. The strip sits with the record book, the luck index
    and the champion's curse rather than above a list of champions it keeps
    half-restating. The owner's read, and it is the better filing.
  - ⚠️ **One comment went stale and was marked rather than quietly left.**
    v16's `own: true` on the titles card was argued from ADJACENCY — "the next
    two cards down ARE the title count, ranked" — and those two cards are not
    underneath it any more. **The flag stays**: he picked which card holds his
    one slot, and that choice is about the card, not about which tab renders
    it. Re-deriving the `own` flags off the new layout would have undone two
    explicit owner calls (v16, v18) as a side effect of moving a term.
  - **The ? sheet's two sentences moved with it**, because they name what each
    tab opens with — a tab list that is built from `L1`/`SUBS` still can't know
    that, which is exactly why `HELP` exists and why it has to be edited in the
    same pass. Verified on the render, not by reading the code.
  - Verified in headless Chromium at 320 and 390px, as the reader and as a
    stranger who has tapped nothing: Records opens on **twelve** storyline
    cards, Honours renders **zero** and still opens on Champions, the jump nav
    picked the chip up on Records and dropped it from Honours **with no code
    change** (it reads the DOM), Honours still has three landmarks so the nav
    does not hit the under-two `hidden` branch, no horizontal overflow, no type
    under 9px, no clipped tab label, no page errors, and `node checks.js`
    green — including the laws that count storylines on the **rendered** You
    page and profile, which is where the per-manager floor of two lives.

- **v43 — the refresh follows the NFL schedule (11 Sep 2026)** — the owner, on
  v42's flat throttle: *"It's an nfl schedule so don't have to run in off
  times as well only 1 a day when not playing games."*
  - **He is right, and the reason is subtler than request count.** A flat
    10-minute throttle stops twelve phones stampeding, which is what I built it
    for — but it does nothing about WAKING a sleeping service all week. Render's
    free tier is metered in **instance-hours, not requests**, so the cost is
    how much of the day the thing is awake, and twelve people idly opening the
    app on a Tuesday keeps it up for an answer that cannot have moved.
    **I sized the throttle against the wrong resource.**
  - **10 minutes inside a game window, 12 hours outside one.** Thursday night,
    Sunday, Monday night — everything else is a league that is not playing.
  - ⚠️ **Deliberately NOT derived from the scores**, which was the more elegant
    idea and is wrong: before week 1 every score is 0, which is
    indistinguishable from "this week's games are still pending" — so a
    data-driven rule would hold the short throttle open through the whole
    preseason, which is exactly the stretch this exists to quieten. The clock
    knows something the payload does not.
  - ⚠️ **It reads the device's clock**, so a phone in the wrong timezone shifts
    the window. Stated rather than fixed: the only consequence is slightly more
    or fewer refreshes, never wrong data, and the freshness line always says
    which copy is on screen. A timezone library for that trade is not worth its
    bytes.
  - `checks.js` walks a week and fails if a game window is not on the short
    throttle, a quiet day is not on the long one, or the two ever invert —
    which would hammer the backend all week and go quiet exactly when the
    scores are moving. Verified by inverting them.

- **v42 — the Season tab fetches for itself (11 Sep 2026)** — the owner, on
  the tab that had been saying "not published yet" since it shipped: *"Why's
  it saying commish publishes the standings this is all supposed to be
  information… what did you build?"*
  - 🚨 **HE WAS RIGHT, AND THE COPY IS WHAT GAVE IT AWAY.** v39 read only
    `season/current.json`, written by the Lab's 🚀 button. That is exactly
    right for **rankings** — an opinion column, dated, which must not silently
    re-derive into a different answer next week. It is exactly wrong for
    **standings, odds and matchups**, which are facts and should just be
    current. I applied the rankings model to the wrong kind of data, and the
    sentence *"the commissioner publishes the standings"* is that mismatch
    stated out loud on his screen. **When generated copy sounds absurd read
    back, the design is usually what is absurd.**
  - 🚨 **AND BEFORE ANY OF THAT: THE TAB WAS EMPTY BECAUSE I NEVER COMMITTED
    THE DATA I ALREADY HAD.** He pasted a live capture in v39; I ran it through
    the real Lab to build a snapshot, verified against it, and left it in a
    scratch directory — then told him to go press the button himself. He spent
    three exchanges asking why a finished feature showed nothing. **A verified
    artifact sitting in a scratch directory is not shipped**, and "the user can
    do that step" is not a reason to hand somebody an empty screen.
  - **Three sources, in order: this phone → the repo → the network.** Cache
    first and revalidate behind, the v25 shape. Measured: **first paint
    297-357ms against a deliberately 2-second backend**, so the free tier's
    30-60s cold start never reaches a reader. ⚠️ **Throttled at 10 minutes**
    because twelve people share one free service — a cache a minute old makes
    **zero** calls, verified.
  - ⚠️ **The hard constraint survives, and that is the design.** "No backend"
    becomes "never DEPENDS on the backend": asleep, dead, or an expired ESPN
    cookie each degrade to the last real data with a line saying which. The
    published snapshot is the floor beneath the cache. That is what keeps this
    safe to hand to eleven people who cannot debug it.
  - 🚨 **ONE MANAGER MAP AND ONE TRANSFORM, IN `espn.js`.** The Season tab
    needed both, and the Lab already had both. A second copy drifts every
    September — **v36 is what one stale map cost: half the league lost its
    crests AND its YOU row.** So they moved out and both pages delegate.
    ⚠️ **Verified byte-identical**: the shared transform run against his real
    capture produces exactly what the Lab's own function produced before the
    move, and the Lab's publish output after the refactor matches what is live
    character for character. A refactor of a data path is only safe if you can
    show the bytes did not move.
  - 🚨 **`isMe` is the field this change made dangerous**, and it is now
    asserted absent from both `espn.js` and `season.js`. It flags the team of
    the account the BACKEND authenticates as — his, on every device. A members'
    app fetching live is precisely the case where reading it badges his team as
    theirs on eleven phones. Third time that flag has nearly leaked his
    identity into somebody else's screen (v33, v39, here).
  - **Verified across six data paths**, each with a mocked backend: a fresh
    device against a slow backend (paints the published file, upgrades to live,
    caches it), a one-minute-old cache (instant, zero calls), an hour-old cache
    (instant, then refreshes), the backend down with a cache (keeps the data,
    says the live data didn't answer), the backend down with no cache (falls
    back to the repo), and nothing anywhere (one honest sentence).
  - ⚠️ **Two of my own tests failed for being stale, not for finding a bug**, and
    both were worth reading rather than reflexively fixing: one asserted the
    exact "not published yet" copy this version deletes, and the other was an
    "empty state" test that now renders real data — because the repo's snapshot
    stopped being empty. **A test that encodes the old design fails at exactly
    the moment the design changes, which is the one time it is easiest to
    "fix" it without thinking.**

- **v41 — the passphrase can be reset without ever saying it (11 Sep 2026)** —
  the owner: *"Reset my passphrase"*.
  - **The obvious build is to ask him for the new phrase and hash it here.**
    That works, and it quietly spends the one property the whole gate design
    rests on: v21 exists so the phrase lives in his head and nowhere else, and
    a phrase typed into a chat is a phrase that has left it. So the tool hashes
    on his phone and he sends back only the 64 hex characters.
  - 🚨 **THE FAILURE THIS IS BUILT AGAINST IS PERMANENT AND SILENT.** If the
    tool computes its hash by any path other than the one `unlock` checks with
    — a second `norm`, a stray trim, a different digest — it hands over a value
    the gate can never match. He commits it, deploys it, and is locked out of
    his own tool with **nothing on screen able to say why**, and no way back
    except guessing which of two implementations was wrong. So `owner.js` now
    has exactly ONE normalise-and-hash and both callers go through it.
  - **The assertion that matters is the end-to-end one.** "The tool agrees with
    itself" is not the property; "the tool agrees with the gate" is. `checks.js`
    takes the hash the tool produces, substitutes it into `HASH` exactly as a
    commit would, runs that gate in a fresh context, and asserts the phrase
    **opens it**. Verified by reversion: dropping the lowercase from the tool's
    path reports *"a hash straight from the reset tool did NOT unlock the gate
    — committing it would lock the owner out"*, which is the sentence that
    would otherwise have been a weekend.
  - 🚨 **UNGATED, AND READ BEFORE THE HASH IS CLEARED.** You reach for it
    exactly when you cannot pass the gate, so gating it is the v23 fault — a
    door that only opens from the inside. And `boot()` `replaceState`s any
    unrecognised hash away, so a reader placed below that branch finds an empty
    hash every time: **third feature to need this ordering, and the first two
    shipped broken** (v23's invite, v33's redemption). The source order is
    asserted now rather than remembered.
  - ⚠️ **Fifth outing for the `[hidden]` specificity trap, pre-empted.**
    `.pr-np-out` is `display: block` at (0,1,0) against the UA's `[hidden]` at
    (0,1,0) — a tie the later sheet wins — so the rule was written in the same
    edit as the markup, and the render confirms `display: none` rather than
    trusting it.
  - ⚠️ **A false alarm worth recording, because it was the right thing to
    check.** `sha256` reads `window.crypto.subtle`, not the global — so a test
    harness without it makes every hash throw, every `unlock` answer
    `'insecure'`, and the sixteen-guesses law pass without testing anything.
    The existing gate law sets it (line 244) and is fine; my new one did not,
    and would have been green over a broken tool. **Checked rather than
    assumed, and the check found the fault in my code rather than the old.**
  - ⚠️ **And a real one: two promise chains both ending in `done()`**, which
    calls `process.exit` — whichever resolved first would have killed the other
    mid-check, silently, looking exactly like a pass. Chained now.
  - The card states what a reset does NOT do: unlocked devices stay unlocked
    (the flag holds no phrase) and guest passes survive (that is
    `INVITES_FROM`). Both are things he would otherwise assume either way.
  - Verified at 390/320px: ungated, no backend call, the hash matches an
    independent SHA-256 of the normalised phrase, padding and capitals and
    double spaces all collapse to the same value, 16px inputs, 38px targets,
    no overflow, no page errors, and the members' app and Lab unchanged.

- **v40 — our own playoff odds, and a way to find out if they are any good
  (10 Sep 2026)** — the owner: *"How can we make our playoff prediction
  different and more accurate than espn"*.
  - 🚨 **THE ANSWER STARTS WITH WHAT MAKES THIS DIFFERENT FROM EVERY OTHER
    MODEL IN THE APP: IT CAN BE GRADED.** The power rankings have no outcome
    to score against — that is why their card refuses to call the weights
    validated. A team either makes the bracket or does not, so "more accurate"
    is a measurable claim rather than an assertable one. **So the app claims
    nothing.** Both numbers sit side by side and the season decides.
  - **Three tests on the archive before a line of the model was written**, and
    the third is the one that mattered: last season's scoring predicts this
    season's at `r = +0.14`, career average at `r = +0.17`, and **win rate
    above .500 predicts next season's at `r = −0.02` — zero.** A manager's
    ⚠️ **SUPERSEDED in v90:** championship-only matched baselines and
    descriptive rate gaps replace the former sample/interpretation.
    RECORD is pure luck. That is the app's oldest instinct (all-play over
    standings, the luck index) with a number under it at last, and it is why
    every input here is points.
  - **Then the variance decomposition, which sized the whole thing:** within
    one manager, season-to-season swing is **7.74 ppg**; true between-manager
    skill is **2.16 ppg**, 3.6× smaller. One season is 7% signal. Thirteen
    seasons of history earns 50% weight — Hurd's +4.65 career average is worth
    **+2.34 ppg** as a forecast, Slemp's −4.49 is worth −2.26. Real, unique to
    us (ESPN sees rosters, not thirteen years), and small.
  - 🚨 **SO THE EDGE IS NOT THE HISTORY, IT IS THE SHRINKAGE.** Weekly scores
    swing ~17-22 points; teams truly differ by ~5. A model that reads a 3-0
    team scoring 130 a week as a 130-a-week team is fitting noise. Graded
    against a known truth over 300 synthetic seasons, shrinking beats raw
    points-per-game by **11% of Brier at week 3, 2.4% at week 6, and −1.3% by
    week 10.** The edge is real and it is concentrated early — which is the
    theory, confirmed rather than assumed.
  - 🚨 **AND THE GRADING FOUND TWO REAL BUGS THAT NO ASSERTION COULD SEE.**
    Both printed twelve confident percentages summing to exactly 600:
    - **The simulation treated the estimated team mean as a known fact.** It
      is a guess with an error bar, and leaving that out makes the spread of
      simulated seasons too narrow. Measured: at week 3 it said **95% for
      teams that made it 83% of the time**, and 4% for teams that made it 15%.
      Both tails overconfident, which is the signature. Drawing each simulated
      season's true strengths from the posterior fixed it.
    - **The between-team spread was clipped at zero before use.** With twelve
      teams and three weeks that subtraction often goes negative, and clipping
      one tail of a noisy estimate biases it upward — against a truth of 5.5
      it recovered **6.68 at week 2**, which roughly doubled how far the model
      trusted three weeks of scoring. It is blended with an archive-grounded
      prior now, and lambda tracks its ideal from week 3 on.
    After both, the middle of the curve is honest (said 57% → happened 57%,
    said 76% → 75%, said 94% → 95% at week 6). ⚠️ **The far tail at week 3 is
    still a little overconfident** on ~5% of forecasts. Stated, not hidden.
  - 🚨 **`calibrate.js` IS IN THE REPO AND IS DELIBERATELY NOT IN
    `checks.js`.** The suite holds laws: true of every run, cheap, false the
    moment somebody breaks them. "When it says 70%, does it happen 70% of the
    time" is a question about a distribution, takes 300 seasons and 90
    seconds, and returns a judgment rather than a pass. Both bugs above lived
    happily under a green suite. **A conservation law cannot see a
    miscalibrated model.**
  - **What makes it DIFFERENT is the part that needed no accuracy at all:**
    what your number hinges on. How many of your last N you need, how hard
    your remaining schedule is, and what each individual week is worth —
    *"your biggest week is CC in week 6: 94% if you win it, 79% if you don't."*
    A percentage on its own cannot be argued with and does not tell you what
    to want on Sunday. ⚠️ **The what-ifs are conditionals off ONE set of
    simulated seasons**, never re-run per game, so they cannot disagree with
    each other or with the headline.
  - 🚨 **SEEDED, BECAUSE TWELVE PEOPLE COMPARE PHONES.** An unseeded Monte
    Carlo hands every reader a slightly different percentage for the same
    published week — two people holding screens side by side would watch the
    app contradict itself, which reads as broken and cannot be debugged from a
    group chat. And rounded to a WHOLE percent: ESPN publishes 61.425%, which
    is three digits of false precision on a number that is itself a
    simulation.
  - ⚠️ **The honest expectation, said on the page and not only here: ESPN
    should win early.** Preseason they see twelve rosters and we see thirteen
    years worth ±2.3 ppg. Our edge arrives with real scoring — even by week 4,
    ahead by week 7, if at all. Nobody has kept score yet; see Open / next.
  - 🚨 **TWO OF THE NEW CHECKS WERE GREEN OVER BROKEN CODE, AGAIN.** v39 had
    the same lesson and it still happened twice more:
    - **The head-to-head tiebreak test used two teams who only play each
      other** — so their head-to-head record IS their overall record, a tie on
      wins is a tie on everything, and removing the tiebreak entirely left it
      green. It takes four teams for the rule to have anything to do.
    - **The parameter-uncertainty check asserted the error bar was COMPUTED,
      not that it was USED.** Deleting its one use in the simulation passed.
      It is asserted by consequence now (the bar must shrink as the season
      fills in, and the odds must sharpen), and the real proof is
      `calibrate.js`.
    **Every law in this entry was verified by reinstating its fault.**
  - ⚠️ **Two layout faults, both from adding one column** — the fifth column
    put three of twelve team names back into truncation (fixed by sizing the
    numeric columns to their widest value; two of the longest names still
    ellipsis, which the crest covers), and the disagreement sentence would
    have named **ten teams in a row**; it counts them past three.
  - Verified at 320/390px as the reader, another manager and a stranger: the
    tab paints including a 10,000-season simulation in **340ms**, no overflow,
    no page errors, the hinge section correctly absent for a stranger, and
    checks.js plus calibrate.js both green.

- **v39 — the season being played, as a third tab (10 Sep 2026)** — the owner:
  *"Could we add a third tab in between league history and rankings that's the
  current season… pulls through standings playoff percentages and then maybe
  another one could be that weeks matchups it gives projected winners… maybe a
  piece of it could be tied to their team."*
  - 🚨 **I TOLD HIM TWO OF THE THREE WERE IMPOSSIBLE, AND I WAS WRONG.** The
    season payload's field list, read off what `power.js` consumes, has no
    schedule in it — so matchups had nothing to pair and playoff odds had
    nothing to simulate over. Both were reported as blocked. Then he pasted a
    live capture and it carries **`schedule[]`** (14 opponent ids, verified
    symmetric in both directions with no self-plays) and **`playoffPct`**
    (which sums to exactly 600 — six spots × 100%, the signature of a real
    simulation). **The Lab reads about half the payload, so inferring the
    payload from the Lab under-reports it.** The field list is written down
    now, under the Lab's data bullet, so the next session does not have to
    ask. ⚠️ The general lesson is narrower than "look harder": a consumer is
    evidence of what a producer sends *at least*, never of what it sends *at
    most*, and the sandbox cannot reach the producer to check.
  - **It reads a FILE, and the strongest argument for that is not consistency.**
    Standings in fantasy change **once a week**, so a weekly snapshot is not a
    stale copy of the live table — it IS the live table, except during Sunday
    games. Against that: a free-tier cold start would make whichever of the
    twelve opens the app first each day wait 30-60s, and —
  - 🚨 **`isMe` WOULD HAVE BADGED HIS TEAM AS THEIRS ON ELEVEN PHONES.** The
    payload flags the team of the account the BACKEND authenticates as, which
    is his, on every device that ever asks. A live members' app reading it
    gets that wrong for everybody except him — the v33 byline bug, one field
    over. The snapshot carries manager CODES from `mgrFor` instead. This is
    the third time that flag has nearly leaked his identity into somebody
    else's screen; it is now written down as a trap rather than as a field.
  - 🚨 **AND THE TIMING REWROTE THE SCOPE.** He signed off on standings, a
    your-team panel and career context. Then the capture showed `week: 1` with
    every score `0.0` — **preseason** — so the tab as approved would have
    launched as twelve identical rows of zeros, and stayed thin until week 3.
    The two features I had called impossible were the two with real data in
    them *today*. The page opens on odds, the week's matchups and the
    schedule, and the standings/luck/pace sections fill in from week 1. **The
    Lab's rule since v1 — "a fabricated 0-0 beside a name is a lie" — now
    applies to the members' app too**, and a section with nothing to say says
    that rather than rendering an empty shape.
  - ⚠️ **THE CAREER COMPARISON HAD TO BE ERA-RELATIVE OR IT WOULD FLATTER
    EVERY CURRENT SEASON.** "Your 118.4 ppg is the best of your career" ranks
    seasons by WHEN they happened, because scoring has climbed for thirteen
    years — the exact fault `relPpg` exists for. `LH.career()` hands over
    `rel` (points a game against the league *that year*) and the tab compares
    `rel` to `rel`. ⚠️ It also killed a feature I wanted: "your best start
    since 2019" is not knowable, because the archive holds season totals and
    no week-by-week scores. A fact about a shape the data does not have.
  - 🚨 **FOUR FAULTS IN THE GENERATED PROSE, ALL FOUND BY READING THE OUTPUT,
    NONE VISIBLE TO ANY ASSERTION** — the v2 lesson, fifth outing:
    - **"a best finish of st."** `ord()` is the SUFFIX only, and reading it as
      a whole ordinal dropped the number on every card that had one. There is
      an `ordN()` now, and `ord()` is only ever concatenated.
    - 🚨 **"your 14th-best win rate in thirteen seasons."** The rank places
      this season among the finished ones PLUS itself, so it runs 1..n+1, and
      it was printed against the finished count. **The rank and the
      denominator have to count the same thing** — the v3 family again. It is
      stated as how many finished seasons this one beats, which is true at
      both ends.
    - **"…the best shot in the league. six of twelve teams make it"** — a
      spelled-out number opening a sentence, lowercase, twice.
    - **"with four titles and a best finish of 1st"** — a clause re-arguing
      the one beside it (v22). The best finish is only worth saying for
      somebody who has never won.
  - 🚨 **TWO LAYOUT DECISIONS REVERSED BY MEASURING THEM.** Both looked fine
    in a screenshot and neither survived a ruler:
    - The playoff-odds rows had a 64px bar. Measured, **the whole league
      spanned 22px of it and the top four teams differed by ONE pixel** —
      while five of twelve team names were being truncated for want of the
      same space. A bar that cannot show a difference is decoration bought
      with the column carrying the information. Deleted; names clipped went
      5 → 1. (Scaling the bars to the leader would have made them legible by
      making their lengths mean nothing.)
    - The standings row was rank · crest · name · W-L · PF · all-play — six
      columns on a phone. The name column came out at **128px with 6 of 12
      truncated at 390px, and 71px with ALL TWELVE truncated at 320px**;
      tightening the numeric columns made it *worse*, because the crest and
      the numbers have floors and the name is the only thing left to squeeze.
      The stats moved to a second line (the `.pr-row` shape the rankings view
      already uses): **262px, zero truncation, and the row is no taller** —
      the 32px crest was already setting the height, so the second line was
      free. ⚠️ And the fix made the lead paragraph wrong: it called all-play
      "the one **column**" when there were no longer columns. A sentence
      naming something that is not on the page, one more time.
  - 🚨 **THE TAB BAR CLIPS SILENTLY, AND A THIRD TAB BROUGHT IT INTO RANGE.**
    `.ai-sub button` is `flex: 1; white-space: nowrap; overflow: hidden`.
    Three tabs at 320px leave 93px each and **"📊 This Season" measured over
    it** — cut off with nothing on screen admitting it. Caught by comparing
    each button's `scrollWidth` to its `clientWidth`, which is the only thing
    that can. Labels shortened to "History" and "Season" AND the type tightens
    under 360px, because a shorter label only holds until the next word is
    added (the v32 rule: fix the squeeze, not its spelling).
  - 🚨 **TWO OF MY OWN CHECKS WERE BROKEN, AND BOTH WENT GREEN.** Worth more
    than the features:
    - `seasonLaws()` used a `fail` defined inside a *different* function, so
      every failure path would have thrown ReferenceError instead of
      reporting — and the success path never calls `fail`, so the suite passed
      over a check that could not fail out loud. **A check whose failure path
      has never run is not a check.**
    - The assertion written to catch the rank-outruns-denominator fault used
      `\b\d+\b`, which **never matches "14th"** — there is no word boundary
      between the digits and the suffix. So the exact fault it was written for
      walked straight past it. It tests for any numeral at all now, since
      every count in that phrase is spelled.
    Both found by **reinstating each fault and confirming the suite says so**,
    which is now how every law in this entry was verified.
  - Verified in headless Chromium at 320/390px across: nothing published, a
    preseason snapshot, a week-5 snapshot, each as the reader, as another
    manager, and as a stranger who has tapped no name. No horizontal overflow,
    no type under 9px, no tap target under 38px, no page errors, every tab
    label unclipped, the history sub-tabs correctly gone on the new tab (the
    `[hidden]` trap, not bitten a fifth time), the v30 lit-tab back-out still
    working, and the ? sheet listing the new tab with no edit because it is
    built from `L1`. ⚠️ **Both fixtures were written by the REAL Lab** driven
    against the live capture, not hand-built — a fixture wrong in the same
    direction as a real risk is the easiest false positive to believe (v24).

- **v37 — crests are rename-proof (10 Sep 2026)** — the owner, after v36:
  *"Make it name change proof."*
  - **The stable key is ESPN's `teamId`, which does not change on a rename** —
    but nothing in the repo knows which id is whose, and the sandbox cannot
    reach the backend to ask. So instead of a one-time capture (what v36
    assumed), the Lab LEARNS it: every team whose current name resolves through
    `MANAGERS` records `teamId → code` into `powerlab:teams`. Today all twelve
    resolve (v36), so one Lab open binds all twelve; next season the names
    change, the ids do not, and the learned map answers. **Proven** by driving
    the Lab through two seasons: twelve current names (all resolve, map
    persists), then twelve renames to strings the map has NEVER held (all still
    resolve to the right logos and the reader's own row keeps YOU).
  - 🚨 **Two bugs found before shipping, both invisible to `node --check`.**
    (a) `let LEARNED = load(K_TEAMS)` at module scope was a **temporal-dead-zone
    throw** — `load` is a `const` defined further down, so power.js threw at
    load, which is a BLANK LAB. Caught by actually requiring the module in
    node, not by a syntax check; fixed by reading the map lazily on first use.
    (b) The first cut cached a name→id index at adoption, but **`revalidate`
    swaps `S.season` in place without `restoreOrBuild`** (the v25 same-week
    path), so the index went stale and every renamed team helmeted anyway. A
    rename-proof reader that reads a stale snapshot is not rename-proof — it
    resolves the id LIVE from `S.season` now.
  - **Names stay authoritative when known**, and refresh the learned binding on
    every adoption — so a franchise changing HANDS (a new person on an old id)
    self-corrects the moment their new name is added to `MANAGERS`. The learned
    id is the carry-forward, never an override of a known name.
  - ⚠️ **`MANAGERS` is not retired.** It bootstraps a fresh device (a guest,
    a new phone, cleared data) that has never learned the ids — see Open / next.
  - The published payload's manager code is written by `mgrFor` on the owner's
    device, which holds the learned map, so published weeks carry correct codes
    through renames with no change to the members' app.

- **v36 — the crests came back: the name map was a year stale (10 Sep
  2026)** — the owner, on his live phone: *"Pics still not loading here and
  this is v35."*
  - 🚨 **NOT the letterboxing from the crop pass — a genuinely different fault
    I had flagged and then had to be shown.** Crests resolve MANAGER from team
    NAME (`MANAGERS`), and this league renames every season. Half the 2026
    names — "Aarogant Fraudgers", "Mortal Wombats", "Gregs Morning Dew Dew" —
    were not in the map, so `mgrFor` returned `''`, `crestSrc` returned null,
    and the row fell back to the generated helmet. The four that still matched
    ("Slob on my Cobb", "Morning Woods", "Thurgood Marshall", and Slemp) were
    exactly the teams whose names had not changed, which is why it looked like
    "some pics load, some don't" rather than an outage.
  - **And it is worse than a missing picture.** The same `mgrFor` writes the
    manager CODE into the published payload (index 7), so an unmapped team
    ships to the members' app with no code — no crest AND no YOU highlight on
    that person's own row. A rename quietly de-personalises the one screen the
    app exists to personalise.
  - 🚨 **Mapped from ESPN's OWN OWNER COLUMN, never by name similarity.** The
    owner sent the season table with the owner names showing, and gave the
    twelve in order — so "Aarogant Fraudgers (Will…)" → Hurd (Will Hurd, the
    exact "Christels Mattress is Will Hurd" lesson), "Pepperoni TDs (David
    Hy…)" → Hyman, and so on. The name-similarity trap is the repo's oldest
    data rule and this is precisely the case that tempts it.
  - **Old names kept as aliases**, additively: a team that reverts mid-season
    still resolves, and nothing that worked was removed.
  - ⚠️ **Verified without the backend, which the sandbox cannot reach**: drove
    the Lab against a fixture built from the twelve real 2026 names and
    asserted every row's crest `src` is a real `logos/*.png` (zero
    `data:`-URL helmets) and that the reader's own team ("Death Dont Hurts
    Very Long" = McD) carries the YOU marker. Then rendered it.
  - **No data to backfill**: `rankings/index.json` is still empty, so no
    already-published week carries the stale codes — the first real publish
    from the fixed Lab ships correct ones.
  - ⚠️ **SUPERSEDED in v37**: the durable teamId fix shipped, and it needed NO
    owner capture — the Lab learns the `teamId` → manager bindings at runtime
    from the name map while names still resolve, so a one-time device export
    turned out to be unnecessary.

- **v35 — the lock moves to the bottom (10 Sep 2026)** — the owner: *"Move
  that lock button way down to the bottom. It'll only cause problems."*
  - **He is right about the shape of the risk.** 🔒 Lock sat in the header, one
    tap from everything, and it is the ONE control on the page that cannot be
    undone from the page: the owner has to re-type the passphrase, a guest
    needs a whole new invite. An irreversible, destructive action next to the
    brand where a thumb lands reaching for the top of the screen is a
    lock-yourself-out waiting to happen. It renders last now, below every
    action card, as a quiet ruled-off row with a line saying exactly what it
    does.
  - ⚠️ **Built INTO the rank view, not appended once at boot.** `paintRank`
    rewrites `#pr-rank` on every edit — a reorder, a rebuild, accepting a new
    week — so a node hung off `.pr-main` would survive a repaint but a node at
    the bottom of the page IS inside `#pr-rank` and must be re-rendered with
    it. `lockBarHTML()` goes in the template and `wireLock()` runs beside the
    other button handlers, so the control is always where a repaint leaves it.
    Verified by driving a reorder: still last, still wired, after the repaint.
  - **A bonus, not the reason: the header is back to two children.** v32 fixed
    the brand shattering when 🔒 Lock made the header a three-child flex row;
    removing it un-crowds that row outright. The `flex-wrap` guard stays — a
    fix that only holds until the next thing is added back is not a fix.
  - Verified in headless Chromium at 390px, owner and guest: no lock in the
    header, the lock last on the page (owner reads "Lock this device", guest
    "Sign out of the Lab"), 44px tap target, survives a reorder repaint, no
    overflow, no page errors, checks.js green.

- **v34 — a pass that does not run out (10 Sep 2026)** — the owner, reading
  v33: *"Wait so if I send the link this week and in a month want to assign
  someone they need a new link? Can't just grant them access to the lab"*.
  - **Half the answer was that he already could** — the duration is his choice
    when he makes the link, and "the rest of the season" is one link, sent
    once, covering every week of the year. He had read the 7-day option in the
    worked example as the mechanism rather than as one of the choices. ⚠️ Worth
    recording as a documentation fault rather than a code one: **an example
    that uses the narrowest option teaches the narrowest option.**
  - **The other half was real and is now built: a pass with NO end date.**
    "Grant them access to the Lab" is a different intent from "lend it for a
    week", and the app only expressed the second.
  - 🚨 **"Forever" is stored as a DATE, not as a special case.** `9999-12-31`,
    so `owner.js` keeps exactly one expiry rule and there is no "no expiry"
    branch to get wrong. A standing pass and a dated one travel the same code
    path; the only thing that differs is how the date is written on screen.
  - ⚠️ **And it must never be written on screen.** "until Fri, 31 Dec 9999" is
    the same class of thing as a raw `2026-09-07` reading like a database
    field — it looks like a glitch, not like standing access. Three places show
    a pass date (the invite output, the guest's banner, the footer link in the
    members' app) and all three were checked by rendering rather than by
    reading the code, because two of them are on a device the owner never sees.
  - 🚨 **The one grant with no natural end must still be cancellable.**
    `checks.js` asserts `INVITES_FROM` kills an open-ended pass, because
    otherwise it would be the single thing he could hand out and never take
    back — and it would look identical to every other pass while being it.
  - ⚠️ **The honesty note grew a sentence rather than being left to imply.**
    Cancelling is all-or-nothing: it takes a line changed in the repo and it
    ends *every* outstanding invite. So the card now says plainly that a dated
    pass cleans up after itself and a standing one does not, which is the
    trade he is actually making when he picks.
  - Verified at 390px: the owner minting an open-ended pass (copy reads "stays
    open until you cancel it", no `9999` anywhere), a guest redeeming it
    (twelve editable rows, banner with no date, own byline, 🔒 Sign out), and
    that guest in the members' app (footer link with no date, eleven names on
    the picker). No page errors, checks.js green.

- **v33 — the Lab can be lent out (10 Sep 2026)** — the owner: *"And allow me
  the ability to give another member access to do the rankings. Whether for a
  week or for extended time."*
  - **He sends an invite link; it expires on its own.** 👥 in the Lab: pick a
    manager, pick how long (this week · a month · the season · a date), and it
    produces a link that opens the Lab on their phone until that date. No
    session, no commit, no passphrase leaving his head.
  - 🚨 **A GUEST IS NOT THE OWNER, AND THAT IS ONE BOOLEAN.** `lh:guest` is a
    separate key and `LeagueOwner.is()` stays **false** on a guest's device.
    That single fact is what keeps his name off their name picker — v21 exists
    because tapping a name must never open a door, and lending somebody the
    rankings tool is not lending them his voice — and what stops a guest
    minting further invites. **Nothing on screen would show it if it were
    wrong**, so `checks.js` asserts it by name; verified by reverting (a
    one-line "also set the owner key" makes the suite say so).
  - 🚨 **THE FIRST CUT PUT THE REDEMPTION FOUR LINES TOO LATE.** `boot()` has
    always had a "don't strand the reader on a blank page" branch that
    `replaceState`s any unrecognised hash away — and the invite reader sat
    below it, so `location.hash` was **already empty** by the time it looked.
    Every invite landed on the passphrase gate with no message, indistinguishable
    from a link that had never worked. **A value consumed at init cannot answer
    a question asked later** — the v1 lesson, third costume (v23 was the last),
    and again only rendering the exact case caught it: the owner's side passed
    perfectly.
  - 🚨 **AND A GUEST WOULD HAVE PUBLISHED UNDER HIS NAME.** `defaultByline()`
    read the backend's `isMe`, which flags the account it authenticates as —
    his, always. So Hyman's rankings would have gone to the group chat bylined
    **Current Champ**. The byline exists for exactly one reason (*"someone
    shared their power rankings"* is useless in a twelve-person league), and a
    byline that is confidently wrong is worse than none.
  - ⚠️ **Be as honest about an invite as this repo is about the passphrase.**
    It is a door key, not a proof: the repo is public, so anyone who reads
    `owner.js` could craft one — the same bar the published hash already sets,
    against the same eleven relatives. And **the expiry runs on the guest's own
    clock**, so "until Saturday" is a courtesy to an honest person. The card
    says all of this to his face rather than implying a lock that isn't there.
    `INVITES_FROM` is the real take-back: every invite carries its issue date
    and moving that constant kills every outstanding pass at once. It costs a
    commit, which is right — a fire alarm, not a control.
  - **Three ways an invite fails, three sentences** — ran out · arrived damaged
    · revoked. The app's own rule (an empty archive and an unreachable one are
    not the same sentence) applied to the one screen a guest can get stuck on,
    where they have nobody to ask but the copy.
  - ⚠️ **A fourth outing for the `hidden` specificity trap, pre-empted.**
    `.pr-inv-f` is `display: flex` at (0,1,0) against the UA's `[hidden]` at
    (0,1,0) — a tie the later sheet wins — so the date row's rule was written
    in the same edit as the markup, and the render confirms `display: none`
    rather than trusting it.
  - **Found while measuring, and fixed with its twin:** the new `<summary>` was
    a **21px** tap target against this app's 38px floor — and so was the
    existing "How the model ranks" one, which has always been. Fixing only the
    new one would have been the v3 fault.
  - ⚠️ **A KNOWN LIMIT, STATED RATHER THAN PAPERED OVER.** ▲▼ movement lives in
    `powerlab:pub` on whichever device published, so a week a GUEST builds is
    not marked on the commissioner's phone — his next week's arrows measure
    against the last week *he* published. Pre-existing in shape (a second
    device, or clearing site data, does the same) and the honest fix is for the
    Lab to seed movement from `rankings/`, which is its own change. See
    Open / next.
  - Verified in headless Chromium at 390px against the real files: the owner
    (invite card, link minted, date row genuinely hidden), a guest redeeming a
    link (twelve editable rows, banner with the date, **no** invite card, 🔒
    Sign out, byline **Cheeky Clapz**), that guest in the members' app (Lab
    link with its date, **eleven** names on the picker, no McD), sign-out
    (pass cleared, gate back), and expired and damaged invites each saying
    their own thing. No overflow, no page errors, checks.js green.

- **v32 — the brand stopped shattering (10 Sep 2026)** — the owner, with a
  screenshot of the Lab on his phone: *"Look fine?"*
  - **It did not.** The header read **POWER / RANKI / NGS** — a word broken
    across two lines mid-syllable, on the masthead of the page. Reproduced
    byte-for-byte in headless Chromium at 390px, which is what made it
    fixable rather than arguable.
  - 🚨 **AND 390px WAS THE MILD CASE.** The same rule gives five lines at
    360px and, at 320px, **one letter per line and a 438px-tall sticky
    header** — over half the screen, on the page's own chrome. Nobody had
    looked below 390px because nobody owns a phone that narrow any more, and
    an accessibility text size does exactly the same thing to a wider one.
  - **It was v25's fix, working as designed.** Adding 🔒 Lock made the header
    three children, the brand rode over its buttons, and `min-width: 0` +
    `overflow-wrap: anywhere` stopped that. Both halves are needed for the
    overlap and together they let a flex item shrink **below its longest
    word** — at which point `anywhere` breaks inside the word rather than
    overflow. **A fix that removes a symptom by removing a constraint will
    find the next thing that constraint was holding up.**
  - ⚠️ **`overflow-wrap: break-word` is NOT the fix, and it measures
    identical.** The obvious one-word patch — break only a word that cannot
    fit on a line of its own — changes nothing here, because the item may
    still shrink to nothing and the word still cannot fit. Verified as its own
    variant before it was discarded: same 113px, same `POWER / RANKI / NGS`.
    **The squeeze is the bug; the wrap mode only decides how it is spelled.**
  - **So the constraint goes back and the overflow gets somewhere to go.** The
    brand keeps its min-content floor and `.pr-top` is `flex-wrap: wrap`, so
    what no longer fits drops the buttons to their own row — the v25
    protection by a mechanism that cannot shatter a word. `break-word` stays
    as the last resort for a word wider than the screen.
  - ⚠️ **Five variants were measured, not reasoned about**, and three of them
    were wrong in ways that read fine on paper: `break-word` alone (identical),
    min-content without a wrap (clean brand, horizontal overflow — the v25
    fault back), and a smaller type size (still one letter per line at 320px).
    A layout argument settled by measuring beats a layout argument.
  - ⚠️ **The members' app was checked and deliberately not touched.**
    `.lg-brand h1` is `white-space: nowrap` in an `overflow: hidden` brand, so
    it clips instead of shattering — a different answer to the same problem,
    already correct. Fixing the page someone pointed at while the same fault
    sits elsewhere is the v3 lesson; so is "fixing" a page that was fine.
  - Verified at 320 / 360 / 390 / 430px: brand reads **"Power Rankings"** on
    one line at every width, 112px header (against 113px broken), no
    horizontal overflow, both chrome buttons still 38px, no page errors.

- **v31 — a week can be taken back (10 Sep 2026)** — the owner, before the
  first real publish: *"Am I able to publish and then unpublish and publish the
  rankings just in case I screw something up[?]"*
  - **The repo half already worked, and was verified rather than assumed.**
    Publishing is a file plus a line in `rankings/index.json`; both are fetched
    `no-store` behind a network-first worker, so removing them takes the week
    off everyone's app on the next load. Driven end to end against the real
    files: nothing published → published → retracted → republished with a
    corrected take → two weeks → the newest retracted. Each says something
    different and true, and the reader's own row stays badged throughout.
  - 🚨 **THE HALF THAT DID NOT WORK IS THE ONE NO COMMIT CAN REACH.** Tapping
    🚀 writes the week into `powerlab:pub` on his phone, and `prevOrder()` walks
    back from there to decide what next week's ▲▼ are measured against. Pull
    the week out of the repo and that mark stays — so next week's arrows are
    measured against **a table the league never saw**, silently, every arrow on
    the page wrong and nothing admitting it. *"Movement the league never saw is
    not movement"* is the rule publishing exists to keep, and until now there
    was no way to unkeep it. ↩️ **Unpublish this week** is that way, and it
    hands over the repo half as a pasteable sentence — the v24 shape: the
    mechanical part gets smaller, the part that needs him is named honestly.
  - **It also puts the published state on screen for the first time.** That
    side effect has shipped since v1 and the page never showed it, so *"have I
    already sent this one?"* was answerable only from localStorage — and it
    matters most in exactly the situation this feature is for, where you have
    just published something wrong and are least sure what you did.
  - 🚨 **A REPUBLISH ON A DIFFERENT DAY IS A DIFFERENT FILENAME, and "overwrite
    the file" quietly becomes "orphan the first one".** `publishFilename()` is
    built from `payload().d`, which is TODAY — so Week 3 published on Sunday and
    corrected on Tuesday gets two names, and this repo's own paste procedure
    says to overwrite. The mark records which file went out, so the publish
    output can name the stale one as a ③ delete step. Found by asking what
    "republish" means when you do it slowly.
  - ⚠️ **`file` is recorded ONLY by 🚀, and that distinction is the whole of
    what unpublishing can offer.** A link, a text copy and a one-pager all mark
    the week — the league saw the table — but there is nothing in the repo to
    take back, so the card says that instead of offering a retraction it cannot
    perform. Verified: 📋 Copy as text then ↩️ Unpublish renders no textarea
    and no instruction, correctly.
  - ⚠️ **Two render decisions, both from this file's own scar tissue.** The
    block is innerHTML into an empty container rather than a `hidden` toggle —
    `[hidden]` is (0,1,0) against the palette layer's (0,2,1) and would have
    stayed on screen, the trap that has bitten this app three times. And it
    sits BELOW the publish output: the first cut put an offer to undo between
    the button he pressed and the JSON it produced, pushing the two lines he
    actually needs off the screen.
  - 🚨 **AND THE HALF-DONE RETRACTION FOUND A PRE-EXISTING LIE.** Index line
    left behind, file deleted — the most likely way to fumble an unpublish, and
    the app answered *"Try again, or **pick another week**"* on a screen with no
    picker on it. **A control named in a sentence and absent from the page is
    the v30 fault written out in prose**, and it was unreachable until
    retracting became a thing anyone would do. The picker renders on that card
    now, and with only one week on file the sentence stops making the offer.
  - Verified in headless Chromium at 390px: the Lab across never-published,
    published, retracted and republished; the stale-filename ③ step; the
    link-only path; week 4's arrows falling back from a retracted week 3 to
    week 2 (▲11 / LW 12 where a marked week 3 read — / LW 1); and the members'
    app across all six repo states. No overflow, no sub-9px type, 46px on the
    new button, no page errors.

- **v30 — a lit tab that does nothing reads as a broken app (10 Sep 2026)** —
  found in the pre-send render sweep, by tapping the obvious thing.
  - **A profile is rendered UNDER its section's tab**, so from Christel's
    career page the "📜 League History" pill is the lit one. Tapping a lit tab
    to back out of a drill-down is the first thing anybody tries — and the
    guard only reset `S.prof` when the tab CHANGED, so that tap did nothing
    at all: no repaint, no scroll, no error.
  - ⚠️ **The way out existed** — "‹ Back to the league" — which is exactly why
    this is worth a fix rather than a shrug. **A control that is on screen,
    highlighted, and silent when tapped reads as a broken app**, not as the
    wrong control, and the reader who taps it has no way to tell which it was.
    A no-op is the one response a UI can give that carries no information.
  - The condition is now "different tab **or** we are in a profile". Verified:
    from a profile the lit tab lands back on Honours with the sub-tabs
    restored (`display` none → flex), and switching between tabs is unchanged.

- **v29 — the rankings view stops failing quietly (10 Sep 2026)** — found by
  driving the publish path with deliberately broken week files, as part of a
  pre-send check of the whole app.
  - 🚨 **A WEEK WHOSE `o` WAS A STRING HUNG THE TAB FOR EVER, IN SILENCE.**
    `rankHTML` walks `p.o`; a string threw; `paintRankings` is async and its
    only rejection handler was `paint()`'s `.then(buildJump, buildJump)` — so
    the throw was swallowed whole. No console error, no page error, no
    `pageerror` event: the Rankings tab simply stayed on **"Loading this
    week…"** while every other tab worked perfectly. **Passing the same
    function as both arguments of `.then` turns a crash into a hang**, and a
    hang with an empty console is the hardest thing in this app to diagnose
    from a phone in a group chat.
  - 🚨 **AND THE NEAR MISS WAS WORSE THAN THE CRASH.** `(p.o || [])` catches a
    MISSING array — so a week file with no rows in it rendered the header, the
    byline, the date and the model caveat around an **empty list**: a
    confident, complete-looking ranking with nobody in it. The variant that
    threw at least stopped. **The defensive `|| []` was what turned a loud
    failure into a quiet lie**, which is the whole argument against writing
    them without a matching check.
  - Both are the same fact — the file is readable and its contents are not a
    week — so both get one honest sentence, and the rejection handler logs.
  - ⚠️ **A 404 on `index.json` was reading as "No rankings published yet."**
    The classifier had two states and the view rendered two sentences, but
    they were not the same two: anything with an HTTP status became `missing`
    and `missing` fell through to the friendly copy. **That file ships with an
    empty `weeks` array, so an empty season answers 200 — a 404 there is
    always a broken deploy**, and it was being reported to the league as
    business as usual. Three states, three sentences, in a map keyed by the
    state so a fourth cannot be added without writing its sentence.
  - Verified by driving all five paths against the real files: empty, 404,
    offline, a good week (rows, the reader's own row badged YOU), `o` as a
    string, and `o` absent. Each says something different and true.

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
  - **The playoff card is a funnel now**: final fours · finals · won (⚠️ **v48
    moved that card to the bottom of Honors** and renamed what it left behind
    on Records to "Playoff appearances"). Three
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
    Honours (⚠️ **SUPERSEDED in v44 — the strip moved back to Records**, so the
    adjacency below no longer holds; the owner's choice of WHICH card holds his
    slot stands, since that is about the card and not about the tab), and the
    next two cards down are the Champions list and the trophy
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
    OWNER CAUGHT IT BY READING IT.** Brackets existed for 7 of 13 seasons
    (⚠️ **12 of 13 since v56**), and
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
  - **The headings the owner named.** Most titles is the **GOAT argument** (⚠️ SUPERSEDED in v87: this detector is removed)
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
    of this: **70 title-bracket slots** (35 W games × 2 — ⚠️ **SUPERSEDED in
    v56**, now two directional totals, 61 wins and 63 losses) and **50 final
    fours** (13 seasons × 4, less the two untracked). The old law totalled
    every playoff game and stayed green while `bw` meant two things.

- **v13 — Storylines opens the app; the key moves behind a ? (10 Sep 2026)**
  ⚠️ **SUPERSEDED in v44 in its FIRST half only: Storylines is back at the top
  of Records.** The ? sheet is unchanged and the badge key still lives behind
  it — that half of this entry is current. — the owner: *"I want story lines moved to where how to read this is on honours
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
    re-derive. ⚠️ **They did, in v56**: the counts read 204 and 12 of 13 now,
    with no edit to this sentence's subject — which is the whole argument. Typing them into the sheet in `league.js` would have made the
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
    where the badge key used to sit — ⚠️ **and RE-SUPERSEDED in v44, which put
    them back at the top of Records**, so this line is current again),
    **Your storylines** on the You page, and
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

- **Nobody has kept score against ESPN yet** (v40). Both forecasts are on the
  page and neither is proven better — that needs a Brier scoreboard logged
  weekly and read over seasons, not one screen. The honest build is to record
  both numbers per team per week when a snapshot is published, then grade them
  once the season ends. ⚠️ Twelve teams in one season is a tiny, correlated
  sample; three seasons might settle it. Until then the page says so.
- **The season tab needs its first publish** — `season/current.json` ships with
  an empty `t` and the app says so honestly. It has been driven end to end
  against snapshots the REAL Lab wrote from a live payload capture (preseason
  and a synthetic week 5), so what is untested is only the part this sandbox
  cannot reach: the Lab pulling live data off the Render backend.
- **🚨 WHY 2013-17 AND 2025 HAVE NO BRACKET GAMES — answered, 12 Sep 2026.**
  ⚠️ **CLOSED. v56 added 2013-17 and v57 added 2025** — the archive holds
  **209 games across all 13 seasons**. Everything below about ESPN's two tabs
  is kept because it is WHY the gap existed and how to spot the same shape
  again, not because anything is outstanding. ⚠️ **One real remainder: 2025 is
  winner's-bracket ONLY** — its placement and consolation games were below the
  fold of the Sleeper capture, so that season has no `WC` or `C` rows and its
  head-to-head counts are correspondingly thin. The five games it does have
  are the ones the title record needs.
  The archive used to hold 119 bracket games from 7 of 13 seasons and this file
  stated that as a limit without a cause. The cause is now known, and it was
  **not** that the data did not exist:
  - Every season was built from Safari print-to-PDF captures of ESPN's league
    history pages. ESPN serves **two different pages per season** — the
    **Standings** tab and the **Final Playoff Results** tab (the bracket, with
    every score).
  - For **2018-24** both tabs were captured. That is exactly the 7 seasons with
    games, at 17 games each.
  - For **2013-17** only the **Standings** tab was captured. Those pages carry
    final standings, records, points for/against and the playoff seed, and no
    bracket at all — which is why those seasons have complete placings and
    zero games. **The Final Playoff Results tab for those years was never
    opened; it is not known to be empty.**
  - **2025 was never captured at all** and is the one **Sleeper** season
    (`platform: 'sleeper'`), so it is not on ESPN. Its final score
    (JMcD6 124.04 - Cheeky_Clapz 107.28) came in by hand.
  - **To close it:** ESPN league history → each of 2013, 2014, 2015, 2016,
    2017 → the **Final Playoff Results** tab, plus the 2025 bracket from
    Sleeper. 17 games a season completes everything; the 5 winner's-bracket
    games a season completes the title record alone.
    ✅ **The five ESPN seasons were done in v56** — 85 games, 17 each,
    exactly this shape. ✅ **And 2025 came in from Sleeper in v57, which
    closed this item completely** — 5 winner's-bracket games, the only part
    of that season Sleeper showed above the fold. **Nothing remains.** The one
    standing consequence is that 2025 has no `WC` or `C` rows, so placement
    and consolation stats cover 12 of the 13 while the championship-bracket
    record and the ⚑ badge cover all 13.
  - ⚠️ **Do NOT derive the missing games from the final placings.** It looks
    arithmetic — 1st won every game, 2nd lost the final — but the number of
    games each team played depends on byes, which depend on seeding, and it
    assumes 2013-17 used the same six-team shape. That is inventing data, which
    this archive does not do. The `⚑ Playoffs only` badge exists precisely so
    the seven-season limit is stated rather than papered over.
  - The shape to add, one object per game, in `PLAYOFF_GAMES`:
    `{ yr, br: 'W'|'WC'|'C', rd, a, as, b, bs }` — `br` is winner's bracket /
    winner's consolation ladder / consolation, `rd` is `'R1'|'R2'|'FINAL'` for
    W and `'GmC1'..'GmC9'` for C, `a`/`b` are TEAM names exactly as that
    season's standings spell them, `as`/`bs` the scores.
- **The members' app has no rankings yet** — `rankings/index.json` ships empty
  and the app says so honestly. The publish path has been driven end to end
  against the real files with fixture weeks (v31: publish · unpublish ·
  republish · two weeks · a half-done retraction), so what is still untested is
  only the part this sandbox cannot reach — the Lab pulling live data off his
  Render backend and producing the blob.
- **`MGR_NAME.McD` is `'McD'`** (v5) — the owner needed a label that isn't
  "You" now that "You" is a role, and **the label the other eleven see is his
  call, not a guess**: it was `'Jack'` for one version and he asked for the
  short name the league already uses, same as every other manager. He still
  reads as "You" on his own device — `nm()` checks `isMe` first — so this
  string is only ever seen by somebody else.
- **The Lab passphrase is not in this repo and not in this file** (v21) — only
  its SHA-256, in `owner.js`. Nobody can recover the old one from here, which
  is the point. 🔑 **To change it (v41): the owner opens
  `power.html#newpass`, types the new phrase, and sends the line it produces —
  then replace `HASH` and bump `owner.js?v=` in BOTH pages.** Never ask him to
  type the phrase into a chat; the tool exists so it stays on his device.
  ⚠️ A reset does not lock out unlocked devices and does not cancel guest
  passes — those are `lh:owner` and `INVITES_FROM` respectively.
- **Movement is per-device, and a guest's week does not reach his phone**
  (v33). `powerlab:pub` is the ▲▼ baseline and it lives in localStorage, so a
  week built by an invited manager — or by him on a second device, or after
  clearing site data — leaves the next set of arrows measuring against an older
  week. The honest fix is to seed `powerlab:pub` at boot from what
  `rankings/index.json` actually published, which is the real source of truth
  for "the last set the league saw". Deliberately not folded into v33: it needs
  a manager-code → `teamId` remap that survives a team being renamed mid-season.
- **Crests are rename-proof now, but `MANAGERS` is still the bootstrap** (v37).
  `mgrFor` resolves by ESPN's stable `teamId` (learned into `powerlab:teams`),
  so a device that has opened the Lab once while names resolved keeps every
  crest through any future rename with no maintenance. **The name map is not
  retired, though**: it is how a FRESH device (a guest, or the owner after
  clearing data or on a new phone) learns the bindings the first time, so if
  names have changed AND the map is stale AND the device is fresh, that device
  helmets until the map is updated. So updating `MANAGERS` from the new
  season's ESPN owner column each year is still worth doing as a
  belt-and-suspenders — it just no longer breaks the owner's returning device
  when skipped. ⚠️ A residual real risk the id key introduces: if a franchise
  changes HANDS (a new person on an old `teamId`), the learned binding is wrong
  until that person's new name is added to `MANAGERS`, which overrides it — so
  the name map is still authoritative when a name is known.
- 🚨 **THE SEASON TAB SILENTLY CLIPS TEAM NAMES AT 320px AND 390px, INCLUDING
  THE READER'S OWN** — found in the v58 render sweep, **pre-existing and not
  caused by the playoff data**, so it was recorded rather than fixed in a
  release about the archive. `.ls-odd-t` (playoff odds), `.ls-sw-n` ("what
  yours hinges on") and `.ls-sc-n` (your schedule) are all
  `overflow:hidden; text-overflow:ellipsis` in narrow grid columns. Measured
  against the real 2026 names: at 320px, **17 clipped cells** for a signed-in
  reader — five of them in the odds table, including
  `"Death Dont Hurts Very Long YOU"` at `scrollWidth 228 / clientWidth 128`.
  At 390px two still clip **for every persona, a stranger included**. Nothing
  overflows the page, so it is invisible to a scroll-width check and shows
  only as "…".
  ⚠️ **v39 already fixed exactly this for the standings table** (`.ls-tr`) by
  moving the stats to a second line — and that fix was never applied to the
  three lists added after it in v40/v42/v43. The fix is the same shape; it
  wants its own pass with a render at both widths, which is why it is here
  and not in v58.
- 🚨 **THE HEADER AND FOOTER HAD NEVER BEEN MEASURED ONCE, AND BOTH FAIL
  CONTRAST** — found in v75, when the sweep was widened to reach them. Every
  render sweep this repo has ever run queried `#lg-body *`, so the two
  elements that are on **every single screen** — the masthead sub-line and
  the footer paragraph — were outside every measurement taken since v1.
  - `.lg-brand small` ("LEAGUE HISTORY") is `--mu` at 9.5px on the header's
    own ground: **3.11:1**. ⚠️ **That is where the version string used to
    live**, so the app's one diagnostic spent 74 versions below the readable
    threshold — which is the argument for the move rather than a coincidence
    of it.
  - `.lg-foot p` is `--mu2` at 11px: **2.27:1**, the faintest text in the app.
  Both are one token each and neither is in v75's scope, so they are recorded
  rather than drive-by fixed — the same call as the `▾` below. ⚠️ **The real
  lesson is the harness, not the two rules**: a sweep is only as wide as its
  selector, and this one was quietly excluding the chrome while reporting
  itself clean across dozens of view-contexts. The sweep now queries
  `.lg-top *, #lg-body *, .lg-foot *`.
- ⚠️ **THE "LEGS HIT" TILE MEASURES 4.20:1 AND THE RULE IS SHARED WITH THE
  ARCHIVE** — found in the v78 sweep, pre-existing since v69, and recorded
  rather than drive-by fixed for the same reason as the `▾` below. `.ffp-tile
  .v.wm` is `--wm` at 17px bold, which is under the 18.66px where WCAG's 3:1
  large-text allowance starts, so 4.5 applies and it misses. ⚠️ **It is one
  token in ONE rule in `styles.css`, and that rule also paints the archive's
  "Top seed won" tile on the Honors hero strip** — so it is a cross-page
  change wanting a render of the history views, not a line in a parlay
  release. (v69 verified this tab and reported every colour over 4.5:1; this
  one and `.lp-ld-r` both slipped that sweep, which is worth knowing before
  trusting a past sweep's all-clear over a fresh measurement.)
- ⚠️ **THE `▾` ON EVERY `<summary>` MEASURES 2.56:1 AND IS THE ONLY "THIS
  OPENS" AFFORDANCE ON THOSE CARDS** — found in the v73 sweep, pre-existing
  since v69, unrelated to the shared picks, and therefore recorded rather than
  drive-by fixed. It is `--mu2`, which **v69 itself measured at 2.56:1 and
  moved every piece of TEXT off** — the chevrons kept it because they are not
  text. WCAG wants 3:1 for a control's affordance, so it misses even the
  looser bar, on the parlay's collector and prop cards and on the Lab's "How
  the model ranks". Eight instances at 320 and 390px, at 12 and 12.5px.
  ⚠️ **It is one token** (`--mu2` → `--gy`, 6.6:1) **in two rules —
  `.lp-prop > summary i` (league.css) and `.fh-det summary i` (styles.css) —
  but between them those cover every `<details>` in the app**, so it wants its
  own pass with a render of all five history views plus the parlay and the
  Lab, which is the same reason the Season tab's clipped names are still
  sitting here. ⚠️ **Confirmed pre-existing rather than assumed**: neither rule
  differs from v72. A colour is invisible to every assertion in this repo;
  only computing it off the render finds one.
- **The Cum Bowl LOST column emits `.neg` and nothing styles it** (found while
  measuring v67's new column). `#fantasy-history .neg` is (1,1,0) but needs an
  id this app does not carry, and `.fh-prof .neg` never wraps `.fh-cbt-r` —
  so `.fh-cbt-r span { color: var(--gy) }` wins and LOST renders the same grey
  as PLAYED. It is a class emitted and never read, which is the v8 `STATS`
  shape one layer out: invisible to every assertion, because a colour is.
  Nothing is wrong on screen, so the fix is a decision rather than a repair —
  either drop the class or decide LOST should be red, and the same sweep
  should check what else in `.fh-` inherited that dead `#fantasy-history`
  selector from Sports-Hub.
- 🎲 **The parlay's RESULTS are still entered by hand** (v69, narrowed in
  v70). The picks now come out of the app as a ready-made block, so
  publishing a ticket is paste-and-commit. What is left is the settle: twelve
  `r` fields once the games are in. That is the repetitive half and it is
  exactly the shape the collector already solves — a "settle this week"
  screen with twelve W/L/P toggles that hands back the same block would close
  it. ⚠️ Worth doing when the by-hand loop actually annoys him.
- ✅ **THE BOARD FETCHES ITSELF — CLOSED in v72**, off the owner's capture.
  ⚠️ **One thing genuinely untested and it is the fetch itself**: this sandbox
  cannot reach `site.api.espn.com` (403 through the egress proxy), so what is
  verified is the transform against the captured payload and the committed
  floor against a blocked call. **If ESPN does not send CORS headers to a
  GitHub Pages origin the call fails and the floor takes over silently** —
  the tab keeps working and the note reads "Lines as published with the app"
  instead of "Lines from ESPN". That is the one line to check on his phone,
  and it is why the floor exists rather than being an afterthought.
- ✅ **THE PICKS CAN SYNC — BUILT in v73, and it is waiting on ONE LINE.** The
  owner asked a third time (*"That apps don't get stored and saved through the
  app? Why not"*) and picked Firebase off the costed list below. The code
  shipped with `"sync": ""`, so **the feature is complete and off**; it turns
  on the moment he creates the database and a session fills that line in. See
  "🔗 TURNING THE SHARED PICKS ON" above for his five minutes and the exact
  security rules.
  - 🚨 **UNTESTED AGAINST A REAL FIREBASE, AND THAT IS THE HONEST GAP.** This
    sandbox cannot reach `*.firebaseio.com`, so what is verified is every
    branch with the network intercepted at the browser: the store answering,
    the store dead, and the store absent. **The single thing his phone has to
    confirm is that saving a pick turns the line under it into "Saved — the
    others can see it on their Parlay tab"** rather than "the shared list
    couldn't be reached". Same division this repo already draws around the Lab
    and around ESPN.
  - ⚠️ **What it still does not buy:** nothing pushes. A reader sees new picks
    when they open or return to the app, or tap Refresh — not while staring at
    the page. A live socket is what would change that and it is not worth a
    dependency for twelve people picking once a week.
  - ✅ **CONFIRMED WORKING ON HIS PHONE, both directions.** The who-card read
    *"Updated just now"* against an empty store (which is the success line —
    unreachable reads *"Couldn't reach the shared list"*), and saving a pick
    read *"Saved — the others can see it on their Parlay tab"* with his row
    appearing under **1 of 12 picks are in**. So CORS from GitHub Pages is
    fine and both rules are live. **The gap this closed was the only thing
    the sandbox could not test.**
  - ⚠️ **Everything below this line shipped as v74**, an hour later, off his
    read of the live tab — kept in this entry because it is one story.
  - 🚨 **AND THEN HE ASKED FOR THE CHAT BOX GONE, WHICH FOUND TWO REAL BUGS.**
    *"Remove that send it to chat part that's big and ugly nobodies ever doing
    that"* — correct, once the store works it is clutter, and it is also the
    only route a leg has when the store does not. It renders on `mineIsUp`
    now (see `parlay.js`), and building that turned up:
    - **The first fetch's answer was being thrown away.** `quietRender`
      skipped a repaint while a BUTTON had focus, which is true of the tab
      button the reader just tapped. Aimed at the wrong risk: the caret is
      what cannot be recovered, and the thumb problem is better solved by not
      repainting when nothing changed.
    - 🚨 **FIVE PICKS IN THE CACHE AND "0 OF 12" ON THE SCREEN.** `paint`
      rendered before it primed `lh:picks`, and a cache inside the 30s TTL
      returned early without ever rendering. **The Lab's v25 fault, verbatim,
      one file over** — a cache that is read and not drawn is not a cache.
      Found by the render sweep reloading inside the TTL window, which is the
      switch-away-and-come-back case, i.e. the common one.
    - ⚠️ **And one of my new laws was vacuous.** "Priming must not load
      another week's cache" cannot fail, because `syncLegs` already gates on
      the week — fault injection said nothing, so it was deleted rather than
      left looking like protection. The v39 rule ("a check whose failure path
      has never run is not a check") extends to one that has no failure path.
    - ⚠️ Also tidied in the same pass: the who card said *"0 of 12 picks are
      in"* and *"Nobody has picked yet"* on one card — one fact twice, the v22
      shape, which the owner's screenshot made obvious.
  The two routes NOT taken, kept because they are the alternatives if Firebase
  ever has to go:
  - **His own Render backend**, which already exists for the Lab's ESPN data.
    A write endpoint plus a per-league secret would do it. ⚠️ Three real
    costs: **this sandbox cannot reach that service**, so no session can build
    or test it here (the same wall the Lab's live data path hits); it is a
    different repo; and its free tier sleeps, so the first pick of the day
    waits 30-60s. It also ends the property that this app works with nothing
    but static files.
  - **A keyless third party** — a Google Form writing to a Sheet published as
    CSV, which the app could read with no key at all. ⚠️ Picking would happen
    in a form rather than in the app, which is most of what he asked for; and
    it puts a dependency in the members' app that **cannot be verified in
    this sandbox**, which today verifies fully.
  A write key committed to a PUBLIC repo was never on the list, and neither
  was anything that needs a build step. The Firebase route avoids both: what
  goes in the repo is a URL, and the security rules rather than a secret are
  what bound it.
- ⚠️ **`season.js`'s paint call is unguarded and `parlay.js`'s is not** (v69).
  `window.LeagueSeason.paint(...)` throws out of the click handler rather than
  out of a promise if that script fails to load, leaving the previous view on
  screen under a lit tab — the v30 fault. The parlay branch guards against it
  because it was new; the season one was left alone rather than drive-by
  fixed. One line, whenever that file is next open.
- 🚨 **The Season tab's clipped team names are STILL THERE** — re-measured in
  the v69 sweep, unchanged from v58: `.ls-odd-t` at 320px clips
  `"Death Dont Hurts Very Long"` at 191/128, and two names still clip at 390px
  for every persona including a stranger. It is above in its own item; this is
  only to record that a second render sweep found the same thing rather than
  it having quietly fixed itself.
- **Not built:** any way for a member to write anything back that ANOTHER
  member's app can read, OTHER than a parlay pick. ⚠️ **v70 narrowed this and
  v73 closed it for one thing only** — a pick reaches the others through the
  shared store once `sync` is set. A reaction, a comment or anything else
  would ride the same store and the same rules, and each one is its own
  decision about what twelve relatives can write into a page the others read.
