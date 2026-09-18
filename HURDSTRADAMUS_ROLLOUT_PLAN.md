# Hurdstradamus — build-ready rollout plan

Status: **first live version released.** The Oracle tab, isolated Oracle
service, public read view, and Hurd's private editor capability are active.
This document remains the editable product contract for future feedback; it
does not contain the private capability or its link.

## Goal

Add a weekly NFL prediction experience called **Hurdstradamus** to Nectars
Bolonga. League members get a polished, read-only public view. Hurd gets one
private, reusable editor link that opens the same app in editor mode and
remembers his verified access on that browser/device.

The first build should follow the final visual direction Hurd supplies. The
initial creative direction is midnight purple, antique gold, a crystal ball and
constellation details, with the editorial line **“The Commish Has Spoken.”**
Those are visual defaults, not locked product requirements.

## Non-negotiable experience rules

| Audience | What they can do | What they must never see |
| --- | --- | --- |
| Any visitor / league member | Open Oracle, read published predictions and records, choose their own name as elsewhere in the app | An authentication wall, editor controls, drafts, or private capability data |
| Hurd via private editor link | Create, revise, save a draft and publish/unpublish a week | Owner-only link directory or control over another feature |
| Jack / owner device | Keep the private Hurd link in the existing private link directory and retain normal owner controls | A hardcoded credential or a public copy of Hurd’s link |

- Hurd’s editor access is not based on selecting “Hurd” as a member. It is a
  server-verified `oracle_editor` role, exchanged from a private capability,
  then remembered in local storage only after verification.
- The actual capability is never committed to this public repository, included
  in JavaScript, placed in screenshots, or shown in the public help sheet.
- It uses the same safe handoff shape as Zach’s organizer link: one private
  fragment link, stripped from the address bar immediately after exchange; a
  reusable saved session; and a private, device-local owner-directory entry.
- The existing public league URL, member picker, Parlay, Rankings, history,
  backend data, and their links must keep working exactly as they do today.
- Publishing is an explicit action. Saving a draft never changes the public
  Oracle page. Unpublishing removes only that public weekly snapshot.

## Public Oracle page — first functional contract

One weekly page, designed mobile-first and fully useful without a selected
member. It will have:

1. A weekly hero / identity treatment and a week selector.
2. One prediction card per league matchup with both team names/logos, predicted
   winner, projected final score, projected records, Hurd’s write-up,
   confidence percentage, and optional Upset Watch mark.
3. A clear published status and date. Before a week is published, show a
   concise “prophecies have not been released” state—not an empty or broken
   page.
4. Weekly prediction record plus all-time prediction record. Definitions must
   be visible: a prediction is correct when the predicted winner wins; ties or
   unavailable official results are excluded until resolved.
5. An “All prophecies” entry point that expands/navigates to the week’s full
   set without hiding normal league content behind it.

The final copy, labels, animation level, card density, and hierarchy remain
open for Hurd’s review. There is no requirement to duplicate the initial mockup
pixel-for-pixel.

## Hurd editor — first functional contract

Hurd’s private view uses the same matchups as the public page, with editor-only
controls. Each matchup supports:

- predicted winner;
- projected score for both teams;
- each team’s projected record, calculated automatically from the record entering the week and Hurd’s selected winner;
- Hurd’s matchup write-up (maximum 10,000 characters, with a live count);
- confidence (stored as an integer 0–100);
- optional Upset Watch toggle;
- draft save and clear, with truthful saved/error status;
- next/previous matchup navigation and a completion indicator.

The editor must calculate completion from the stored predictions. **Publish**
is disabled until every scheduled league matchup has a winner, both scores,
both records, and a write-up; it must explain what remains instead of silently
failing. Publish creates an immutable public revision snapshot for that week;
subsequent changes require an intentional republish. The detailed revision
wording can be chosen during implementation, but public readers must never see
mid-edit content.

## Data and authorization plan

Do not reuse, widen, or modify `league_parlay` tables or its organizer role.
The isolated Oracle data area is active in the existing Supabase project.

| Data object | Purpose | Public access |
| --- | --- | --- |
| `oracle_weeks` | Season/week metadata, draft state, publish metadata, public revision | Published snapshot only |
| `oracle_predictions` | One prediction per scheduled league matchup | Published snapshot only |
| `oracle_editor_sessions` | Hashed, expiring editor session records | None |
| `oracle_capabilities` | Hashed private-link capability, revocable by owner | None |

The API will expose separate public state and authenticated editor endpoints.
Every editor write revalidates Hurd’s verified role on the server. The page
must never treat a client-side flag, selected name, or local-storage value as
authorization.

## Link and owner handoff plan

After the editor capability is safely installed outside the repository:

1. Generate Hurd’s one private `#oracle-editor=…` launch link.
2. On Jack’s unlocked owner device, use a matching one-time owner setup link
   to save **“Hurd · Hurdstradamus editor”** in the existing private link
   directory, without duplication.
3. Send only Hurd the editor link. Members continue using the normal league
   app URL; no new member install, name selection, or link is required.
4. Test on a private browser: normal Hurd name selection remains ordinary
   member access; only the private editor link grants editing.

## Decisions intentionally waiting for Hurd

- Final tab name: **Oracle**, **Hurdstradamus**, or another label.
- The visual system and wording for the hero, cards, badges, and empty state.
- Whether predictions are one weekly reveal or can be published progressively.
- Exact records convention (record entering the week vs. projected after the
  matchup) and how ties are displayed.
- Confidence presentation (percentage, tier, crystal scale, or a combination).
- Whether historical weekly archives and accuracy breakdowns launch in v1 or
  follow after the weekly flow is stable.

## Follow-up sequence after Hurd's first review

1. Apply Hurd’s feedback to the screen layout, labels, content rules, and
   visual system.
2. Preserve the existing isolated authorization, public/draft separation, and
   six-matchup completion lock while making those edits.
3. Add any requested historical views only after the weekly publishing flow is
   stable and understood by Hurd.

## Explicitly out of scope for the first pass

- Changing existing team names, logos, authentication, league history,
  Rankings, Parlay data, or Zach’s access.
- Auto-generating predictions, live odds, or automatic scoring from an
  external source.
- Shipping a private link or access credential before the server-side editor
  role is installed and verified.
