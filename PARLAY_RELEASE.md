# Parlay v2 — prepared, not launched

Branch: `feature/parlay-live-organizer`. The committed `parlay/config.json` has
`enabled: false`; the current Parlay continues using its existing code. No merge, Firebase mutation, frontend activation, or organizer invitation is part of this build. The isolated Supabase schema is prepared; its scheduler is inactive. API deployment and organizer-hash installation were blocked by automatic approval review (see below).

## What is built

- Picks, Ticket, Season, in that order. Compact six-choice matchup cards for
  spreads, totals and moneylines, with a reachable Save bar and Change/Clear.
- One member per game across all markets, enforced by atomic Postgres revision checks across Edge workers.
  Replacement failures retain the old pick; revision checks reject stale edits.
- DraftKings prices supplied by ESPN's public NFL scoreboard. The chosen market
  follows line movement until its individual kickoff; then the last observed
  pregame quote is immutable. Scheduled kickoffs also lock during feed outages.
- Background collection independent of open browsers: a 30-second scheduled check
  near kickoff/during games, five-minute collection otherwise. Timing is best effort;
  stale quotes are labeled, never represented as exact closing prices. The UI refreshes
  every 20 seconds when visible and not editing.
- Live score/progress rows, upcoming legs and collapsed completed legs; automatic
  standard-market settlement, pushes and explicitly pending unsupported results.
- Combined decimal-price multiplication converted to American odds; $10 tracked
  return/profit. Partial tickets are labeled and cannot become full-ticket wins.
- A compact placed-ticket card shows actual DraftKings combined odds entered
  by the organizer, with $10 potential return and profit. Only organizer sessions
  can add/edit/clear them; ordinary members only see the saved figures. Supports
  signed American odds including comma-separated values; rejects invalid prices
  and stale edits. Entries remain editable after kickoff and persist per week.
  Placement odds never overwrite tracked leg prices or season results. Potential
  return includes stake and is before any pushes/voids, not a confirmed payout.
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
`server/domain.mjs` and `engine.mjs` are shared between local Node fixtures and
Supabase Edge Functions. `supabase/functions/league-parlay/index.ts` loads the
Web Request handler, Postgres storage adapter and scheduled collector. Node/SQLite
is retained only for the existing isolated local preview/test harness.

Production target: existing free `sports-hub` project `oqrfdhoyyogjmiqmjhnp`.
Private schema: `league_parlay`. Function: `league-parlay`. New job:
`league-parlay-collect`. No existing Sports-Hub tables, functions or jobs change.
No Railway service, new Supabase project or paid plan is required by this design.
Existing apps still share the project's quota/compute; monitor usage before release.

The service-only RPC is SECURITY INVOKER, denied to PUBLIC/anon/authenticated.
Private tables have RLS with no browser policies by design. The five informational
"RLS enabled, no policy" notices are expected default-deny protection, not a
request to add public policies. Atomic CAS retries re-run the domain checks;
collector leases prevent overlapping fetch cycles and stale-worker commits.
Secrets and session hashes never appear in public state. Collector calls require
a separate server-held capability. `verify_jwt=false` is required because this
app uses its existing private-link/session protocol rather than Supabase Auth.
The handler independently verifies authority for every protected route.

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

Latest verification: **40 Parlay tests passed**, including full-app Supabase-path
Week 1 organizer flows, plus conservation checks, storylines, rankings and
publishing suites. Real Postgres CAS/lease/backup/privilege checks passed in a
rolled-back transaction. Repeatable SQL is in `supabase/tests-readiness.sql`.

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

## Supabase preparation status

- Applied additive schema migration; verified actual Postgres CAS conflicts,
  collector leases, backup readback and denied browser-role privileges. Tests ran
  inside a rolled-back transaction; no league picks were read or written.
- New 30-second cron job exists but is **inactive**, and `collection_enabled=false`.
  Existing `sports-hub-ai-capture` schedule remains `7,37 * * * *`, active.
- Edge-compatible modules and canonical manager mapping load successfully in Deno.
- **API not deployed:** automatic approval review rejected deploying the public
  Edge Function with `verify_jwt=false` without explicit approval for that endpoint.
- **Organizer hash not installed:** automatic approval review separately rejected
  the credential installation without explicit approval. The private packet/link
  remains unchanged; the hash is still null in the database. Do not say it is live.
- Frontend `enabled:false` remains the gate. Merging the branch as-is does not launch v2.

Expected API base after approved deployment:
`https://oqrfdhoyyogjmiqmjhnp.supabase.co/functions/v1/league-parlay`
This is a path-based API base, not just a hostname. No browser API key is required.

## Week 1 and existing picks

The production handler accepts Weeks **1–18**. There is no Week 2 floor. Before
activation, automatic NFL discovery cannot move the chosen legacy week forward.
At launch, explicitly select the then-current legacy week; never infer it from a
hard-coded date or from this document. Empty, partial and twelve-pick Week 1
exports are covered, including a midgame import. All original rows/text/prices
are retained. Started games stay locked; historical kickoff quotes cannot be
reconstructed from a current feed, so those imported legs remain marked missing
for review. Unmatched/duplicate entries block activation. Week 1 reimbursement
is explicitly undecided because there is no prior week in the season.

Do not import early and then overwrite picks added between preparation and merge.
Rehearsal is read-only. The final export must occur **after** legacy writes are
frozen and must be reconciled before the one-time real import. Preserve and
reconcile any archived weeks too if they exist when launch is authorized.

## Authorized backend preparation (still no merge)

1. Obtain explicit approval for deploying `league-parlay` with gateway JWT checks
   disabled and app-level capability/session checks enabled, and for installing
   the prepared organizer hash. The exact implementation is in this branch.
   Do not retry the rejected actions through another route.
2. Deploy `supabase/functions/league-parlay/index.ts` plus its imported repo modules.
   Preserve existing functions and project-wide auth/API settings. Store only the
   prepared SHA-256 hash in `league_parlay.config.organizer_hash`; the raw link
   capability never belongs in SQL, logs, source or browser config.
3. Verify HTTPS health, allowed-origin CORS, private-link exchange, ordinary Zach's
   lack of organizer authority, invalid/revoked sessions and write rejection before
   migration. Keep `enabled:false` in the frontend throughout this verification.
4. Enable only the new collector/job, verify its HTTP response and fresh data as
   well as the scheduler result. A succeeded cron enqueue alone is not proof that
   the collection request succeeded. Do not modify `sports-hub-ai-capture`.

Operator tooling uses a private `PARLAY_SUPABASE_SERVICE_KEY` environment value
and the known project URL. Never put that key in command arguments, logs or repo.
The static app never receives it. Commands use an explicit week; below, `1` is
only an example and is correct if Week 1 is the actual legacy week at launch:

```sh
node scripts/supabase-parlay.mjs status
node scripts/supabase-parlay.mjs prepare --year 2026 --week 1
node scripts/supabase-parlay.mjs rehearse --year 2026 --week 1 --export /private/authorized-week.json
```

`prepare` collects public schedule data and selects the launch week; it refuses
existing imported picks or an active release. `rehearse` only uses a local copy
and prints counts, not private picks. Offline export must be a member-keyed object.

## Future launch order — only when Jack says merge/go live

1. Recheck current `main`, reconcile any concurrent changes/version numbers, and
   rerun all tests. Complete real mobile visual checks at 320px/390px and test the
   deployed API privately. Do not claim merge-only readiness before these pass.
2. Obtain authorized access to the live Firebase pick export. A private-source
   read was previously blocked by automatic approval review and not retried.
   Current fixtures do not substitute for reconciling the real shared list.
3. Freeze legacy writes for the relevant Parlay paths only, leaving other app
   rules unchanged. Export the then-current list and all relevant archives; retain
   a private original. Confirm old cached apps cannot keep writing the old list.
4. Rehearse against that final export, reconcile every source row, then import:

   ```sh
   node scripts/supabase-parlay.mjs import --year 2026 --week 1 --export /private/authorized-week.json --backup /private/pre-import-UNIQUE.json --legacy-writes-frozen
   ```

   The importer saves a remote backup, verifies readback and saves a matching
   private local backup; it refuses reused filenames and repeated imports.
   Unresolved entries remain retained and prevent activation. Do not discard them.
5. Verify the live collector and backup, then activate with explicit attestations:

   ```sh
   node scripts/supabase-parlay.mjs activate --year 2026 --week 1 --backup /private/pre-activation-UNIQUE.json --legacy-writes-frozen --migration-reconciled
   node scripts/check-parlay-launch.mjs https://oqrfdhoyyogjmiqmjhnp.supabase.co/functions/v1/league-parlay
   ```

   Automatic backups are not included on the free plan. The private downloaded
   backup is required in addition to the in-project snapshot; keep it safely.
   Do not falsely attest to frozen writes, reconciliation, or backup verification.
6. Enable frontend config with the verified API base and year; merge only under
   the explicit launch instruction. Verify Pages, original member links, shared
   picks, score updates and private organizer access. Zach receives only his link.

After new-service edits, rollback requires a reconciled export back to legacy;
merely flipping the frontend gate would hide newer picks. Never allow two writable
pick stores. Production import/cutover always uses the actual week at launch.

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
  explicit cutover evidence plus a verified private backup.

### Remaining gates — do not claim merge-only readiness

Explicit endpoint/organizer-hash approval, deployed API and collector verification,
mobile visual QA, and authorized real-pick migration rehearsal are still required.
The schema/job are prepared, the new job is inactive, the current app is unchanged,
and no merge has occurred. Future launch additionally requires a fresh frozen
export, reconciliation, backup, activation and Pages verification.
