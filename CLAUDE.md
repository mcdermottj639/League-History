Warning: truncated output (original token count: 123969)
Total output lines: 7010

# CLAUDE.md — Nectars Bolonga (League History)

Guidance for Claude (and humans) working on this repo. Read this first.

## What this is

The **Nectars Bolonga** fantasy football league's own app: thirteen seasons of
history (2013–2025), the **season being played right now** (v39), the
**weekly power rankings** the commissioner publishes, and the **weekly group
parlay** the twelve of them put on together (v69). It is a **pure static browser app** — HTML/CSS/vanilla JS, no build
step and no framework — served from GitHub Pages. The active parlay uses the
isolated Supabase Parlay v2 backend (v93). Firebase still serves rankings;
legacy pick paths remain readable but read-only after the Week 2 cutover.

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
- 🚨 **Never rotate, replace, or regenerate a private link that has already
  been sent.** Zach's `#parlay-organizer=` capability, Hurd's `#oracle-editor=`
  capability, owner-handoff fragments, and any member/share URL already in the
  group chat stay as they are. Do not install a new `organizer_hash`, mint a
  replacement launch packet, or change fragment names. A new hash revokes the
  live session and forces a resend — Jack's standing rule is those links will
  not be resent. Lost-link recovery is an explicit owner instruction only, and
  even then the old hash stays valid until he says otherwise. Generate nothing
  that would require anyone to open a new link.

## v99 — Version only in help

The version stamp is removed from the main app footer and appears once, after
Small print at the bottom of the question-mark help sheet. It still derives
from APP_VERSION; deployment/cache versioning is unchanged. This supersedes
v75's decision to show the stamp on every screen.

## v100 — Hurdstradamus / Oracle

The primary navigation now includes **Oracle**, a public, read-only weekly
Hurdstradamus view. `oracle.js` derives the six fantasy matchups from the same
`season/current.json` schedule that powers the Season tab; it never creates a
second league roster or schedule. `oracle-config.json` points only to the
isolated `league-oracle` Edge Function. Published predictions are readable by
everyone; unfinished weeks honestly say they have not been released.

Hurd's editor is a separately verified `#oracle-editor=` capability, stripped
from the URL immediately and exchanged for a remembered, server-verified
session. Selecting Hurd as a normal reader never grants editing. Oracle tables,
capabilities and sessions are isolated from `league_parlay`; no Parlay role,
table, link or Zach capability is reused. The editor holds private drafts and
refuses publishing until all six scheduled matchups have winner, both scores,
records, a write-up and confidence. The owner-only link directory accepts a
one-time `#owner-oracle-link=` handoff and saves **Hurd · Hurdstradamus
editor** locally, exactly as it does Zach's private organizer link. Private
capabilities never ship in this repository.

## v101 — Oracle editor hardening

The primary tab order is History → Season → Oracle → Rankings → Parlay. Before
Hurd publishes, public readers see an explicit waiting-to-be-published state,
like unpublished Rankings—not draft controls or a broken tab. Drafts may be
saved incomplete; publishing is independently locked until all six scheduled
matchups have valid winner, scores, records, write-up and confidence. This
release bumps the app and service-worker cache version so all phones fetch the
new Oracle behavior. The Hurd capability, Zach capability, owner-link entries,
and normal league URL remain stable across later visual changes.

## v102 — Oracle entry and private preview

Opening Oracle replaces the prior tab synchronously with an Oracle loading
state; no stale History, Season, Rankings, or Parlay page remains visible while
the Oracle configuration and weekly state load. Every asynchronous Oracle paint
also verifies that Oracle still owns the shared body before writing, so changing
tabs mid-load cannot overwrite the destination page. Hurd's private editor now
includes **Preview**, which renders the current unsaved draft in the exact
fan-facing Oracle layout for Hurd alone, with a clear Back to editor control.
Preview never writes or publishes data. App assets and the service-worker cache
are versioned v102 for this release; all existing links and capabilities remain
unchanged.

## v103 — Long-form Oracle write-ups

Hurd's private Oracle editor accepts up to 10,000 characters per matchup. The
live counter uses thousands separators, and the Edge Function enforces the same
ceiling. This is intentionally large enough for long-form analysis while still
bounding accidental or abusive request payloads. Existing Hurd, Zach, owner,
and member links remain unchanged.

## v104 — Automatic Oracle records

Hurd never types team records. Oracle reconstructs each team's record entering
the selected week from the season score feed, then automatically adds the
predicted win or loss when Hurd selects a winner. The editor fields are
read-only, and public Preview/published cards calculate from the winner rather
than trusting legacy record text. Existing saved or published predictions,
editor capability, and public links remain intact.

Every edit also backs up the working week locally under
`lh:oracle-drafts:2026:v1`. Preview/back, week switching, failed saves and
reopening retain working text. Save draft remains the explicit server sync;
local backup is not cross-device sync. Never clear Hurd's production rows
for tests. Missing score/confidence inputs must keep Publish disabled.

## v110 — Faster Rankings loading

## v112 — Season odds tracking

**Who carries the ticket** now records the PRICES each member has been taking,
not just whether their leg hit. Every member row carries their **average**
price beside their record, and a season tile carries the same for the weekly
ticket. ⚠️ **The average is the only figure PRINTED** (owner: *"Just give us
avg we don't need total"*) — `tally()` still computes the sum, because the
average is made of it and a stored total costs nothing, but nothing renders it.

🚨 **THE ODDS ARE ADDED UP, AND THAT IS THE OWNER'S EXPLICIT CALL, NOT A
SHORTCUT.** *"Why would we do parlay truly it's the season tracking so we want
to see the odds they've been doing… we do add them up u can the total and then
the avg for each weeks. Avg example -153 while total is -740."* So +100 and
-150 reads **-50** (and averages **-25**), where the same two legs multiplied
as a real parlay would pay **+233**. This is a record of what the league has been betting, not a
payout, and the copy says so in as many words (**"Added, not parlay math"**) —
⚠️ an average landing between -100 and +100 is an artifact of adding American
prices and is NOT a quotable line. The v3 fault is two figures side by side
with nothing saying they are different things, and this number sits one tab
from **Tracked odds**, which IS the parlay product.

- **A price only counts once the kickoff lock froze it** — `lockedAt` set,
  `missingQuote` false, and a real observed quote. An unlocked, unpriced or
  flagged leg is left OUT, and each row prints its own `N priced` so the tally
  **names its own population** rather than quietly running short (the v51 rule).
  ⚠️ **The per-row counts came straight back off** (owner: *"Remove the prices
  and decided"*) — the row is the record and the odds, nothing else. So the
  **caption** carries the population instead, naming any legs with no locked
  price. Something has to: a total quietly short of the legs played, with
  nothing on screen saying why, is the v3 fault.
- **Zach's entered placed odds beat the tracked kickoff combination** for the
  weekly ticket, because that is what the ticket actually went in at. The note
  under the tiles names the split (how many weeks came from each source)
  instead of blending two populations in silence.
- ⚠️ **Derived in `parlay-next.js` beside `records`, in ONE place.** It is a
  display derivation over the public week payload, exactly like the record it
  sits next to; a second copy in `domain.mjs` would be a second source of truth
  for the same fact and would drift.
- `.pn-record` gained a flex basis. Without one the right column wrapped under
  short names and sat beside long ones — one row rendering two different shapes
  down a twelve-name table.
- Four regression tests in `server/frontend.test.mjs` fix every price by hand,
  so the arithmetic is checked against numbers that file states rather than
  whatever the preview seed produces. ⚠️ **Both guards were fault-injected**:
  removing the lock/quote condition and reversing the placed-odds preference
  each fail the test written for them (the v39 rule — a check whose failure
  path has never run is not a check).
- Verified: 77 tests pass, `node checks.js` green, and the real generated
  markup rendered in headless Chromium at 390px with the real stylesheets — no
  overflow, consistent rows. ⚠️ **Not verified on his phone**, and the sandbox
  cannot reach the live Supabase parlay, so the numbers were rendered from
  fixtures rather than a live week.

## v113 — Tied records sort by odds

**Who carries the ticket** still ranks by record first. When the W–L is the
same, the row order follows the averaged American price, **higher number
first**: CC at −110 before McD at −238, Gotch at +155 before a −105 miss.
A missing price sorts last inside a tied record. Name is only the final
tiebreak. Owner: *"If the record is the same can these be sorted by odds 2nd.
Like the 1-0s should go cc Hyman Zach Christel McD."* No links, capabilities
or hash change.

## Tuesday editorial week — Oracle and Rankings

Oracle refreshes must keep published content visible. Saved public content
renders synchronously without a loading placeholder, and identical refreshes
retain the existing card DOM, images, focus and matchup navigation scroll.
Only the small refresh-status message changes when the content is unchanged.

Public tabs open on the latest **published** Oracle prophecy and Rankings set.
The week picker includes the current unpublished week with an explicit
"Awaiting publication" state. Returning to either tab opens the latest
published set again. Hurd's private editor still opens on the current Tuesday
week; older drafts and published weeks remain selectable. Do not change his
private link, session, or capability handling to implement this behavior.

Oracle's API reports the NFL week from the same Tuesday 4 AM Eastern cutoff as
Parlay, rather than selecting the first unpublished database row (an old Week 1
placeholder can remain unpublished forever). The public Oracle opens to the
current week's waiting state; Hurd opens to its draft, while older drafts and
published weeks remain selectable. This requires redeploying `league-oracle` as
well as publishing `oracle.js` on Pages. Rankings still shows published sets
only; the latest published set announces when the current week's rankings are
awaiting publication. The Power Rankings Lab builds from actual fantasy scores
after games, so the Tuesday cutoff does not invent results or publish a set.

## v114 — Tuesday 4 AM ET opens the next parlay week

ESPN’s default scoreboard often stays on the completed week through Monday
night and into Tuesday. Jack’s rule: **the next week is in the parlay week
list by 4:00 AM ET each Tuesday** so people can enter picks that morning.
`nflBettingWeek()` in `domain.mjs` is the clock: 2026 Week 1 opened Tue Sep 8
4:00 AM America/New_York, then every seven days. After launch the collector
takes `max(current, ESPN week, betting week)` and never moves backwards.
Prelaunch still cannot skip the selected legacy week. Organizer, Hurd, and
member links are unchanged. The live `league-parlay` function must be
redeployed for this to take effect; a Pages-only merge does not open Week 3.

## v111 — Ticket-wide Parlay lock and Thursday reset

The first scheduled kickoff locks the entire current parlay at both the server
and the interface; nobody can save, replace, or clear a game after that point.
The existing private organizer session is the only reset authority. Reset is
available for the current week only after a completed Thursday miss, calculated
in America/New_York so Thursday-night games that are Friday UTC are handled
correctly. It snapshots the locked attempt, its placed odds and final results,
invalidates stale browser revisions, then opens a fresh empty ticket. Previous
attempts are exposed only as shared ticket history and remain in Season tracking
for ticket counts, member records, hit rate and financial totals; normal member
name selection never grants organizer access and organizer links remain unchanged.

Public Rankings snapshots are cached separately under `lh:rankings-public:v1`
for up to one day. Readers render the last successfully published ranking
immediately with a clear refresh status while Firebase checks in the background.
An unavailable refresh leaves that public copy readable; a confirmed empty
shared archive still renders honestly. The cache contains only public snapshots,
never publisher sessions, credentials, or ranking edit drafts. The publisher
controls wait for the fresh shared snapshot, so a saved display cannot edit or
unpublish stale data.

## v109 — Faster Oracle loading

Public Oracle responses are cached separately under lh:oracle-public:2026:v1
for up to one day. Readers immediately see a labeled saved copy while a fresh
public response loads; failed refreshes keep that copy readable. Editor states
and device drafts never enter this cache. The season request starts alongside
configuration/authentication, is deduplicated, and no longer blocks public
write-ups. Editor schedule/state requests run together after authorization.
Late season updates repaint readers only, never editable forms, and all async
paints retain the shared-tab ownership check. Save/publish behavior is unchanged.

## v108 — Compact Oracle spacing

Tighten the editorial cards without reducing commentary, team-name, or score
font sizes: 48px crests, shorter flexible name rows, closer record/score spacing,
and confidence beside the pick label instead of in a third banner row. Reduce
section padding, divider gaps, and card spacing. Long names still wrap; score
baselines retain shared grid alignment. CSS-only presentation adjustment:
no Oracle logic, storage, drafts, or published prediction changes.

## v107 — Oracle editorial design (display-only)

Oracle's public and private-preview cards use an ivory/plum/gold editorial skin
in oracle-editorial.css: celestial masthead, horizontal matchup shortcuts,
real manager crests, condensed team names, separate entering-week record badges,
large projected scores, saved projected records, and a pick/margin ribbon.
Margins appear only when the selected winner also has the higher numeric score.
Commentary is serif; recognizable standalone team/record opening lines and
score-verdict closing lines receive separate styles. All remaining text and line
breaks are retained, escaped, and never written back. No invented article titles.
Published team names and records are preserved from the saved snapshot when
available; season-derived records are fallbacks only. Existing editor, storage,
capabilities, drafts, and published rows are unchanged. Public render tests must
assert that display and matchup navigation send no save/publish requests.

## v106 — Oracle matchup hierarchy and stable team order

⚠️ Visual styling superseded in v107; stable saved team order remains.

Published Oracle cards preserve the exact away/home order stored with Hurd's
prediction, even if a later season-feed refresh presents the matchup in reverse.
Each team's projected score and projected record render together in its own
side-by-side scoreboard column on mobile and desktop. A contrasting pick strip
and a separately labeled Hurd's breakdown panel keep long write-ups visually
distinct from matchup facts. The saved prediction order remains the game order.

## v105 — Decimal-score publishing and draft safety

Oracle scores accept finite decimals from 0 through 300 in both the editor and
the deployed Supabase handler; integer-only validation previously blocked valid
125.9-style predictions. All six matchups must still have scores, a winner,
write-up and integer confidence from 0 through 100 before publishing. Each card
now identifies its missing fields, with readable status and completion messages.

Preview/back and week switching use the loaded state, so they work offline and
cannot replace working text with a fresh server response. Saves capture a
snapshot without rebuilding the form afterward; typing during a slow save stays
intact and the status explains when newer edits still need syncing. Exact text,
including line breaks, remains in the device backup. Selected weeks are restored.
Device-only drafts are never substituted into the public reader view. Existing
capabilities, links, stored predictions, and explicit Save draft semantics remain
unchanged. Never publish test predictions to production.

Regression tests run the actual Edge Function against an isolated in-memory
database and exercise the real editor against that handler: decimal save/reopen/
preview/publish, long write-ups, invalid inputs, private drafts, failed/slow
saves, selected-week restoration, and automatic projected records.

## v98 — Single public sharing control

The question-mark sheet keeps its existing public Share the link control. The
owner directory renders saved private entries only, removing the duplicate
League app public row. Saved labels, URLs and statuses remain untouched; private
status controls use the correct zero-based storage index after removing the
synthetic public row. Existing member links and organizer access are unchanged.

## v97 — One-tap owner link setup

The private owner handoff uses an `owner-parlay-link` URL fragment, removed
immediately by owner-links.js before shell boot. On an already unlocked owner
device, the help sheet opens and saves the SAME Zach organizer capability as a
ready-to-copy directory row. Existing other entries remain; repeat setup does
not duplicate rows. The handoff does not grant owner or organizer access and
never automatically sends the link. A non-owner device gets an explanation,
not a saved or displayed secret. No actual capability is shipped in repo assets.
The directory remains device-local; the setup link can be reopened on another
unlocked owner browser. Keep that handoff private, just like the organizer link.
The original manual import and JSON backup remain supported.

## v96 — Previous-week payer feed

The existing fantasy season endpoint supplies week, scores and outcomes but no
season year; the Edge collector's mandatory-year check had silently rejected it.
Both collectors now share payerFromFantasy: explicit wrong years fail, missing
years are accepted only in the configured active NFL calendar season (September
through February), the source week must cover the ticket, and all twelve mapped
members need valid scores and final W/L/T outcomes. The prior NFL board must
still be fully final. Missing scores, in-progress outcomes and ties are retained
as pending/tied rather than guessed. Edge fantasy fetch errors are recorded in
collector.lastFantasyError. The current endpoint cannot independently attest its
year when omitted; calendar/week checks bound that existing source limitation.
When Zach is lowest, the line says he covers the $10 rather than owes himself.
No pick, session, capability, rankings or payment-confirmation behavior changes.

## v95 — Parlay entry transition

Jack's phone recording showed History shortcuts lingering during Parlay's first
request and a false read-only alarm while validating the saved snapshot. The
shell now clears those shortcuts immediately; Parlay replaces the prior body
synchronously with its current data or a loading status before awaiting config.
Cached picks stay disabled until verified, with a neutral checking status. Actual
connection/config failures still show read-only warnings. No storage is cleared,
no links or permissions change. Regression tests hold config/state requests open
to check the intermediate screen and failure recovery. The iOS launch snapshot
before the webpage resumes is controlled by the OS, not this transition fix.

## v94 — Parlay readability pass

Based on Jack's phone recording, Parlay uses 20px/700 headings, a 15px body,
13px secondary copy and at least 44px controls. Picks combines the two member
lists into one card, retaining every member and native expandable rows. Ticket
puts tracked figures first, with reimbursement and clearly separated actual
DraftKings odds inside the same summary card. Organizer inputs remain available.
Upcoming games show kickoff times, not placeholder 0–0 scores. Shared freshness
copy replaces repetitive per-pick timestamps; stale/missing quotes, delayed live
scores, review notes and organizer attribution remain visible. Season displays
one empty-record explanation and compact accessible dashes for unrecorded members.
No backend, auth, links, saved picks, odds calculations or data migration changes.
All 43 Parlay tests and the conservation, narrative, rankings and publishing
suites pass. Jack authorized merge; this pass has not had a browser visual review.

## v93 — Week 2 launch and owner link directory

Jack explicitly authorized launch and preserving all existing links. On
2026-09-16, Firebase's ONLY changed rule was `picks/$week/$mgr/.write=false`;
rankings rules and data were preserved. An ETag-guarded same-value write probe
returned 401. The frozen export contained exactly four Week 2 picks (Hurd, McD,
Slemp, Zach), no other pick weeks or published ticket archives. All four mapped
without unresolved rows; original text, price and timestamps remain in the
legacy export. Durable private backups and Supabase pre/post-import backups
were verified. Backend activation and readiness passed for Week 2. Config is
now enabled. Do not re-import or switch back to legacy after new writes.
Public app URL, old `#p=` shared picks, member-name storage, owner access and
the existing private organizer capability are unchanged. Backend/DOM tests
pass; mobile visual QA was blocked locally, so do not claim it was performed.

The earlier v91/v92 preparation and no-merge instructions below are historical,
superseded by Jack's explicit v93 launch approval and this cutover record.

The question-mark help sheet mounts `owner-links.js` only for `LeagueOwner.is()`.
Name selection and Zach's parlay organizer role do not grant this UI. As of v98, the public URL stays in the separate sharing section; this directory
lists only private links explicitly imported or saved on the
owner's device. Private capabilities must NEVER be bundled in this public repo.
`lh:owner-links:v1` is a device-local, unencrypted address book, not cloud storage
or a server authorization gate. Import the existing private organizer launch
Markdown to seed Zach's link; JSON export/import provides portable private backups.
No network requests, automatic capability creation, or backend changes occur.
Labels “Not live yet”, “Ready to send”, and “Inactive” are operator-maintained;
only ready entries can be copied. Changing a label does NOT launch, grant or
revoke access. Existing entries are preserved on import. Future feature links
can be added once their permission system exists; this does not implement it.

## v92 — Supabase preparation (historical; superseded by v93 launch)

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
- Supabase schema is applied and tested. New cron is ACTIVE after explicit approval; frontend writes remain off.
  Existing Sports-Hub tables/functions/scheduler are untouched.
- Jack explicitly approved backend deployment plus organizer-hash installation
  without merging. `league-parlay` version 3 is deployed with custom capability/
  session auth (`verify_jwt=false`); the matching private hash is installed.
  Twelve live HTTP checks passed, including organizer exchange and remembered
  session, ordinary Zach/member boundaries, invalid credentials, CORS and blocked
  prelaunch writes. Verification sessions were removed; the original link remains.
- Jack subsequently explicitly approved collector activation. It is running.
  Live checks saved 16 Week 1 games and found 32 DraftKings prices per market
  (moneyline/spread/total) on the discovered Week 2 board, without changing the
  selected prelaunch week. Sports-Hub's existing job/function remain untouched.
- Fixed missing JSON Accept and truthful client-identification headers in the
  Supabase port after upstream 403; successful live responses confirmed the fix.
  Source failures now return HTTP 502/ok=false; never equate an enqueued cron call
  with a successful feed refresh. Forty-one Parlay tests plus existing suites pass.
  Backend link verification does not mean the still-legacy Pages app is upgraded.
- `parlay/config.json` stays disabled. Do not merge or activate on this preparation
  instruction. `PARLAY_RELEASE.md` is authoritative for actual remaining gates.
- No changes to rankings, owner controls, current member links or Firebase rules.

## v91 — Prepared Parlay v2 (historical; superseded by v93 launch)

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
    - ⚠️ **Competition rank, like `signatur…93969 tokens truncated…e has at
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
