# Parlay v2 — prepared, not launched

Branch: `feature/parlay-live-organizer`. The committed `parlay/config.json` has
`enabled: false`; the current Parlay continues using its existing code. No merge,
production deployment, Firebase mutation, or organizer invitation is part of this build.

## What is built

- Picks, Ticket, Season, in that order. Compact six-choice matchup cards for
  spreads, totals and moneylines, with a reachable Save bar and Change/Clear.
- One member per game across all markets, enforced in a SQLite transaction.
  Replacement failures retain the old pick; revision checks reject stale edits.
- DraftKings prices supplied by ESPN's public NFL scoreboard. The chosen market
  follows line movement until its individual kickoff; then the last observed
  pregame quote is immutable. Scheduled kickoffs also lock during feed outages.
- Background collection independent of open browsers: 15-second target polling
  near kickoff/during games, five minutes otherwise; a ten-second scheduler means
  actual near-kickoff requests usually occur every 20 seconds. The UI refreshes
  every 20 seconds when visible and not editing.
- Live score/progress rows, upcoming legs and collapsed completed legs; automatic
  standard-market settlement, pushes and explicitly pending unsupported results.
- Combined decimal-price multiplication converted to American odds; $10 tracked
  return/profit. Partial tickets are labeled and cannot become full-ticket wins.
- Prior week's lowest fantasy scorer reimburses Zach $10. Full precision and zero
  scores count; missing scores remain pending and ties are shown for resolution.
- Member records, decided-pick denominators and previous tracked tickets.
- A small Manage picks control for the verified organizer, including adding picks
  for another member. Name selection alone never grants organizer permissions.
- Private capability link exchanged for a remembered server-verified session;
  no email/password signup, separate app, or betting-placement confirmation.

## Important boundaries

This is a tracker, not an integration that places or verifies a DraftKings wager.
Observed ESPN prices are not guaranteed instantaneous/direct DraftKings closing
prices. Quote timestamps, missing prices and stale snapshots remain visible.
The actual placed ticket can differ from this kickoff-based tracker.

Write-in props remain supported but are explicitly manual: no automatic prices
or results are invented. Ordinary identity preserves the app's existing trusted
name-selection model, not verified personal accounts. Organizer authority alone
uses a secret capability. The public source may change availability or format;
source failures disable stale-board saves and retain last observations.

## Files and runtime

`parlay-next.js` / `.css` wrap the legacy parlay behind the config gate.
`server/` is a Node 24 service with built-in SQLite, HTTP and crypto; no npm
installation or browser is required for it. `server/collector.mjs` uses existing
`espn.js` manager aliases for fantasy scores. Docker and Railway configuration
are supplied, but no hosting resource has been deployed for this feature.

Local fixture-only preview:

```sh
node scripts/preview-parlay.mjs
# Open http://127.0.0.1:8787, choose a member and select Parlay.
```

The preview scenario selector switches before/live/lost/won fixtures. It has no
production reads/writes. Organizer behavior is covered by service tests; the
preview's test-only capability is defined in that script. Never use it in hosting.

Validation (Node 24; pinned development-only jsdom dependency):

```sh
npm ci --ignore-scripts
npm test
```

The browser tool in the build environment blocked localhost with
`ERR_BLOCKED_BY_CLIENT`; mobile visual verification remains an explicit launch
check. Whole-app jsdom tests exercise all twelve member identities, organizer link
exchange, remembered/revoked access, member-attributed saves, offline/retry
behavior and late navigation responses. These do not substitute for visual QA.

## Private organizer link

Generate only to a private path outside the public repository:

```sh
node scripts/create-organizer.mjs --out /private/path/parlay-organizer-launch.md
```

The prepared private packet contains the final GitHub Pages URL fragment and
`PARLAY_ORGANIZER_HASH`. Do not commit either the packet or the capability.
The server receives only the hash as configuration; the link token is exchanged
via HTTPS and removed from the address bar. Browser storage contains a random
session token. Replacing the hash invalidates previous organizer sessions and
links. A new device needs the private link again; clearing storage also requires
reopening it. Share the packet's organizer link with Zach only after launch.

## Hosting preparation — required before activation

Create an isolated, always-on service from this branch (never repoint an existing
Sports-Hub service). Run one replica with a persistent volume mounted at `/data`.
Configure backups and verify a restart retains data before enabling any writes.
A container's ordinary filesystem is not durable storage.

Environment:

```text
PARLAY_DB=/data/parlay.sqlite
PARLAY_DURABLE_STORAGE=1
PARLAY_ORGANIZER_HASH=<hash from private packet>
PARLAY_YEAR=2026
PARLAY_START_WEEK=2
PARLAY_COLLECT=1
PARLAY_ORIGINS=https://mcdermottj639.github.io
PARLAY_API_URL=https://<new-service-domain>
```

`PARLAY_PREVIEW` must be absent in production. The entrypoint is
`node server/app.mjs`, with host `0.0.0.0` and platform `PORT`. Health: `/health`.
The durable-storage flag is an operator assertion, not proof of a mounted volume.
Readiness requires current-week migration, explicit cutover activation, zero
unresolved entries, collector and storage flags; manually verify the
volume and collector freshness too. The GitHub Pages app will continue to serve
static assets while the configured HTTPS service owns shared state and writes.

## Authorized launch order

Only after Jack explicitly says to launch/merge:

1. Complete 320px/390px visual checks and organizer/member flows in isolated
   preview. Verify all existing suites and service tests against the final commit.
2. Provision the above service and durable volume; verify public data collection,
   correct season/week, backups and persistence. Keep the frontend gate off.
3. Obtain explicit authorization for reading the current shared Firebase picks.
   Automatic approval review blocked this read during development because it is
   private league data in a separate source. It was not retried. Fixture migration
   tests passed, but migration against the actual current shared list is unverified.
4. Freeze legacy Firebase writes for the active week, preserve a private backup,
   export that week's rows with authorized access and run the offline importer
   against the service's persistent DB after its schedule has been collected:

   ```sh
   node scripts/import-parlay.mjs --db /data/parlay.sqlite --export /private/current-picks.json --year 2026 --week 2
   ```

   Inspect counts, original text, unmatched entries and duplicate games before
   continuing. The importer retains ambiguous/duplicate originals and never
   invents historical kickoff quotes. Existing archived weeks require explicit
   import/reconciliation if any have been added since this branch was prepared.
   Do not overwrite newer picks with an older export. The importer is one-time.
5. With explicit launch authorization and legacy writes already frozen, back up
   and activate service writes (import alone remains read-only):

   ```sh
   node scripts/activate-parlay.mjs --db /data/parlay.sqlite --year 2026 --week 2 --backup /data/backups/pre-cutover.sqlite --legacy-writes-frozen --migration-reconciled
   ```

   This command verifies the new backup and refuses an old imported week,
   unresolved original rows, or a stale board. Use a new backup filename.
   It does not freeze Firebase itself: the flags attest to verified cutover work.
   Run `node scripts/check-parlay-launch.mjs https://<new-service-domain>` and
   verify organizer access privately, member boundaries and current-week state.
6. Set `parlay/config.json` to `enabled: true`, the service's HTTPS `api` origin,
   and `year: 2026`; rerun checks. Merge only with the user's launch authorization.
7. Verify Pages serves the final version, config, shared picks and scores.
   Confirm the private organizer URL works before sending Zach that URL alone.

If the season/week changes before launch, review the start-week and import plan;
do not blindly import Week 2 or drop interim weeks. Do not launch with two writable
pick stores. Rollback after new-service edits needs a reconciled export back to
the old store; simply flipping the frontend gate would lose sight of newer picks.

## Second-pass release audit

Fixed during the review:

- No silent fallback to an old writable list when config/network fails; a
  previously upgraded device keeps its cached tracker read-only until recovery.
- Slow config and save responses cannot repaint History or write a different
  member/week after navigation. Legacy listeners yield to the upgraded view.
- Organizer controls require server validation, sessions are API/season scoped,
  temporary invite failures can retry, and the link identifies Zach automatically.
- Clear/re-add revisions cannot reuse an old version and accept stale edits.
- A missing game in an otherwise fresh scoreboard cannot reuse a stale quote.
- Props are not misread as game totals by migration. Original exports are retained,
  including unknown/conflicting rows; unresolved rows prevent cutover activation.
- Delayed NFL games continue being collected across weekly rollovers. Discovery
  cannot move the open week backwards. Wrong-year fantasy responses are rejected.
- An earlier week's import cannot unlock a later launch. Service writes need
  explicit cutover evidence plus a verified SQLite backup.

### Actual remaining blockers — do not claim merge-only readiness

No production service, volume, domain, or organizer session has been created.
Automatic approval review rejected a read-only Railway agent capability query
because it was scoped to the existing Sports-Hub production project and the
open-ended agent can mutate that project. It was not retried or routed around.
Ask for explicit approval to provision a **separate** League-History service;
do not mutate Sports-Hub. The earlier private Firebase read rejection also
still stands: an authorized read is needed to rehearse the real migration.

Before calling this merge-ready: provision isolated hosting with a persistent
volume/backups, verify the private link on that service, check mobile rendering,
and rehearse migration against an explicitly authorized read-only export. Do
not freeze live writes or activate cutover until the future launch instruction.
At that instruction, refresh/reconcile the export for the then-current week,
perform the verified cutover, enable frontend config, merge, and check Pages.
A future merge must recheck current main/version numbers so concurrent work is
preserved. Merging this branch unchanged today leaves v2 disabled.
