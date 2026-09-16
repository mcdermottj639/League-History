/* Conservation laws, run against the SHIPPED history.js — not the scratch
   modules it was assembled from, so the checks test what actually deploys.
   A derived total that exceeds what physically happened is a double-count:
   the fault that once rendered "Slemp: 36 Cum Bowls" out of 13 that exist. */
global.window = {};
require('./history.js');
const S = window.LeagueHistory._stats;
/* ⚠️ HELD ON TO, BECAUSE TWO LATER BLOCKS REPLACE `global.window` WHOLESALE
   to give `owner.js` a `crypto`. Anything required after those gets a window
   with no archive on it — and a module that binds `window.LeagueHistory` at
   load time (parlay.js does, for the voice) would silently come up with no
   names and no second person rather than throwing anywhere useful. */
const LHIST = window.LeagueHistory;
const { ALL, SEASON, CUMBOWL, PLAYOFF_GAMES } = S;
const rows = [].concat(...SEASON.map((s) => s.rows));
const exRows = rows.filter((r) => !r.mgr);          // the two untracked managers
const exYrs = new Set(exRows.map((r) => r.yr + '\0' + r.t));
const exCB = CUMBOWL.filter((c) => [c.s11, c.s12].some((t) => exYrs.has(c.yr + '\0' + t))).length;
const cbLoserOf = (c) => (c.p11 > c.p12 ? c.s12 : c.s11);
const exCBloss = CUMBOWL.filter((c) => exYrs.has(c.yr + '\0' + cbLoserOf(c))).length;
/* 🚨 THE CUM BOWL IS `GmC3` — THE 11-SEED v 12-SEED GAME (v79, owner: *"The
   cum bowl is 1st round of playoffs between the 11th and 12th ranked team
   immediately following the regular season"*), AND THESE LAWS ARE WRITTEN SO
   THAT NEITHER DEFINITION CAN PASS FOR THE OTHER.
   🚨 **v66's LAWS WERE THE REASON IT FELT SAFE TO MOVE, AND THEY COULD NOT
   HAVE CAUGHT THE MOVE BEING WRONG.** They asserted that the s11 team
   finished 11th and the s12 team 12th — which is a restatement of v66's own
   definition, not an independent fact about it: GmC9 decides 11th v 12th by
   construction, so the law was true of ANY reading that pointed at GmC9 and
   said nothing about whether GmC9 was the right game. **A law derived from
   the definition it is checking cannot fail for the only reason that
   matters.** It is the v14 rule one level up: the totals could not see which
   game they counted, and then the laws written to fix that could not see
   which game they were describing.
   So this one is structural and external — a fact about the FORMAT, taken
   from the bracket's own shape rather than from the tab's belief about it:
   round one of the consolation ladder pairs 7v8, 9v10 and 11v12, so the Cum
   Bowl's two teams are the bottom two seeds. Under v66's GmC9 reading it
   reports 9 of 12 seasons wrong; verified by pointing `CUMBOWL` back at
   GmC9, where every total above stays green and only this speaks.
   ⚠️ The seeds themselves come from ESPN for 2018-24 and are derived (win%,
   then points, within the consolation six) for 2013-17, which seed the
   bracket six only — so the law checks the real seed where there is one and
   the derived order where there is not, and a third law asserts the two
   agree wherever both exist. Two independent sources, never one. */
const cbSeedBad = [], cbDeriveBad = [];
CUMBOWL.filter((c) => !c.recon).forEach((c) => {
  const s = SEASON.find((x) => x.yr === c.yr);
  const row = (t) => s.rows.find((x) => x.t === t);
  const A = row(c.s11), B = row(c.s12);
  /* The bottom two of the six that missed the playoffs, by record then points. */
  const con = s.rows.filter((r) => !r.seed || r.seed >= 7)
    .sort((x, y) => (y.pct - x.pct) || (y.pf - x.pf));
  const d11 = con[con.length - 2], d12 = con[con.length - 1];
  if (!d11 || !d12 || d11.t !== c.s11 || d12.t !== c.s12) cbSeedBad.push(c.yr);
  /* Where ESPN published seeds for 11 and 12, they must BE 11 and 12. */
  if (A && B && A.seed && B.seed && (A.seed !== 11 || B.seed !== 12)) cbDeriveBad.push(c.yr);
});
const cbScoreBad = CUMBOWL.filter((c) => c.p11 === c.p12);
/* 🚨 ONE DEFINITION, NOT TWO. `MEET` tags a game `kind: 'cb'` independently of
   `CUMBOWL`, and from v66 to v78 the two named DIFFERENT games — the
   head-to-head rows called 2022's GmC3 a Cum Bowl while the tab showed GmC9.
   Nothing caught it, because both feed the same totals. They are tied now. */
const cbMeet = S.MEET.filter((m) => m.kind === 'cb');
const cbMeetBad = CUMBOWL.filter((c) => !cbMeet.some((m) =>
  m.yr === c.yr && [m.a, m.b].sort().join('|') === [c.s11, c.s12].sort().join('|')));
/* ⚠️ A bracket W-L IS kept on a manager again (v50/v52 — `bw`/`bl`/`bA`),
   which is why the directional title-bracket laws below exist. This comment
   said the opposite until v58: it was written when v19 deleted the record and
   was never reconciled when the record came back, so the file's own rationale
   contradicted the laws three lines under it. The untracked pair are excluded
   here exactly as `exRows` excludes them everywhere else. */
const BR_ON_FILE = new Set(PLAYOFF_GAMES.filter((g) => g.br === 'W').map((g) => g.yr));
/* 🚨 THE UNTRACKED PAIR REACH THE FINAL, so the title-bracket laws need the
   same exclusion `exRows` makes everywhere else — v56 added 2013-17 and
   Ebzery is the 2013 AND 2014 runner-up, six winner's-bracket slots that
   belong to nobody with a career. ⚠️ It also retires `W == L`: over the
   TRACKED subset that symmetry is legitimately false (Ebzery went 4-2 across
   the two seasons), and a law that has to be true is worth more than one that
   merely was. Wins and losses are counted straight off the games instead,
   which is strictly stronger — it catches an outcome flipped in one direction
   as well as a game let in from the wrong bracket. */
const trackedTeam = (yr, t) => {
  const s = SEASON.find((x) => x.yr === yr);
  const r = s && s.rows.find((x) => x.t === t);
  return !!(r && r.mgr);
};
const WB = { w: 0, l: 0 };
PLAYOFF_GAMES.filter((g) => g.br === 'W').forEach((g) => {
  const aWon = g.as > g.bs;
  if (trackedTeam(g.yr, g.a)) { if (aWon) WB.w++; else WB.l++; }
  if (trackedTeam(g.yr, g.b)) { if (aWon) WB.l++; else WB.w++; }
});
const T = [
  ['seasons counted', ALL.reduce((a, x) => a + x.seasons, 0), rows.length - exRows.length],
  /* 🚨 THE ALL-TIME STANDINGS ARE A DISPLAYED TOTAL NOW (v61), so they get a
     law — v52's rule, that a law over a value nothing displays is testing
     dead code, cuts both ways. Career W-L and career points-for are summed
     per manager in `MGRS` and printed straight onto the card; conserved
     against the season rows they came from, this catches a manager counted
     twice or dropped — the "Slemp: 36 Cum Bowls" shape, on the one table in
     the app that is pure accumulation. Points are rounded because both sides
     are float sums in different orders. */
  ['career wins', ALL.reduce((a, x) => a + x.w, 0), rows.filter((r) => r.mgr).reduce((a, r) => a + r.w, 0)],
  ['career losses', ALL.reduce((a, x) => a + x.l, 0), rows.filter((r) => r.mgr).reduce((a, r) => a + r.l, 0)],
  ['career points for', Math.round(ALL.reduce((a, x) => a + x.pf, 0)), Math.round(rows.filter((r) => r.mgr).reduce((a, r) => a + r.pf, 0))],
  ['cum bowls played', ALL.reduce((a, x) => a + x.cbA, 0), CUMBOWL.length * 2 - exCB],
  ['cum bowls lost', ALL.reduce((a, x) => a + x.cb, 0), CUMBOWL.length - exCBloss],
  /* One Cum Bowl per season, every season — it opens the consolation ladder. */
  ['cum bowls on file', CUMBOWL.length, SEASON.length],
  ['cum bowl pairs the bottom two seeds', cbSeedBad.length, 0],
  ["cum bowl agrees with ESPN's own 11 and 12 seeds", cbDeriveBad.length, 0],
  ['cum bowl has a winner (no tie)', cbScoreBad.length, 0],
  ['cum bowl is one game, not two definitions', cbMeetBad.length, 0],
  ['cum bowl meetings == cum bowls', cbMeet.length, CUMBOWL.length],
  /* Places 1-4 ARE the final four in this format (the semi-final losers play
     for 3rd), so every season with placements contributes exactly four. */
  ['final fours', ALL.reduce((a, x) => a + x.f4, 0), SEASON.filter((s) => s.fin).length * 4 - exRows.filter((r) => r.place && r.place <= 4).length],
  ['titles', ALL.reduce((a, x) => a + x.t1, 0), SEASON.filter((s) => s.champ && s.champ.mgr).length],
  ['playoff berths', ALL.reduce((a, x) => a + x.po, 0), SEASON.filter((s) => s.fin).length * 6 - exRows.filter((r) => r.place && r.place <= 6).length],
  /* 🚨 THE BRACKET LAW IS BACK WITH THE NUMBER IT GUARDS (v49). v19 deleted
     it as "a law over a value nothing displays is testing dead code" — true
     then, false now that the record is on the Playoff appearances card.
     ⚠️ And it is written to catch the fault that killed the record in the
     first place: it counts CHAMPIONSHIP-bracket games only, so the moment
     `bw`/`bl` start absorbing the placement or consolation ladder again the
     total overshoots. The v14 drift — `bw` quietly meaning two things in two
     views — is exactly what a law over the wrong total cannot see. */
  ['title-bracket wins', ALL.reduce((a, x) => a + x.bw, 0), WB.w],
  ['title-bracket losses', ALL.reduce((a, x) => a + x.bl, 0), WB.l],
  /* 🚨 THE OWNER'S OWN ARITHMETIC, AS A LAW (v51). He read his row — 10-3 —
     and asked why it was not 6, since a bracket is single elimination and he
     has 10 appearances and 4 titles. He was right about the RULE and the row
     was silent about its span: the record covers the 5 brackets he is in on
     file, not his 13-season career. The rule itself is structural and holds
     per manager over the seasons on file, so it is asserted rather than
     trusted — it is the one law that can catch a bracket game assigned to the
     wrong person, which no total can see. */
  ['h2h games == meetings', S.PAIRS.reduce((a, p) => a + p.n, 0), S.MEET.filter((g) => {
    const rr = (t, yr) => (SEASON.find((s) => s.yr === yr) || { rows: [] }).rows.find((x) => x.t === t);
    const a2 = rr(g.a, g.yr), b2 = rr(g.b, g.yr);
    return a2 && b2 && a2.mgr && b2.mgr && a2.mgr !== b2.mgr; }).length],
];
let bad = 0;
/* 🚨 A SUMMARY LINE MUST REPORT ITS OWN BLOCK, NOT THE RUNNING TOTAL.
   Three of them read `bad` directly — every failure in the suite so far — so
   any fault above turned them ❌ about a subject that was perfectly fine, and
   a session debugging one real failure was handed three false ones pointing
   at the wrong code. The line at the very bottom is the only one that SHOULD
   read the global, because the total is what it is reporting.
   `block()` snapshots the counter and answers for what happened since. */
const block = () => { const at = bad; return () => (bad > at ? '❌' : '✅'); };
T.forEach(([k, got, want]) => { const ok = got === want; if (!ok) bad++;
  console.log(`  ${ok ? '✅' : '❌'} ${k.padEnd(22)} ${String(got).padStart(4)} ${ok ? '==' : '!='} ${want}`); });
/* ⚠️ PER MANAGER, NOT AS A TOTAL. A total stays green while two managers'
   games are swapped — the v14 lesson, that a law over a total cannot see a
   definition drifting underneath it. Per person it is the one check that can
   catch a bracket game assigned to the wrong manager. ⚠️ Verified in v58 by
   flipping one 2016 championship-bracket result: the two directional totals
   above stay ✅ and this names the two managers affected.
   ⚠️ Since v57 every season has a bracket, so `bA` is now each manager's
   playoff-appearance count and this law is the owner's own arithmetic in
   full — losses == appearances − titles, for all twelve. */
ALL.forEach((x) => {
  const won = x.yrs.filter((r) => r.place === 1 && BR_ON_FILE.has(r.yr)).length;
  if (x.bl !== x.bA - won) {
    console.log(`  ❌ ${x.m}: ${x.bl} bracket losses, but ${x.bA} brackets − ${won} title(s) = ${x.bA - won}`); bad++;
  }
});
/* 🚨 THE CUM BOWL POINTS ARE PER MANAGER, AND THE SUMMED VERSION WAS WRITTEN
   FIRST AND THROWN AWAY (v67 — the PTS/G column). Swapping the two scores
   inside one Cum Bowl leaves every total in this file green: the appearance
   counts cannot see it (a count cannot see WHOSE game it counted — v66), and
   neither can a summed `cbPF`, because a swap conserves the sum. Verified by
   doing exactly that to 2019 before this law existed — six ✅ and nothing
   said a word, while the card printed both managers' PTS/G the wrong way
   round. This is the v51 rule, which the bracket law above already learned:
   per manager, not summed. Rounded to a tenth — both sides are float sums
   taken in different orders, and a tenth is what the column prints. */
{
  const ptMark = block();
  const mgrAtYr = (yr, t) => { const se = SEASON.find((x) => x.yr === yr);
    const r = se && se.rows.find((x) => x.t === t); return r ? r.mgr : null; };
  ALL.forEach((x) => {
    const want = CUMBOWL.reduce((a, c) =>
      a + (mgrAtYr(c.yr, c.s11) === x.m ? c.p11 : 0)
        + (mgrAtYr(c.yr, c.s12) === x.m ? c.p12 : 0), 0);
    if (Math.round(x.cbPF * 10) !== Math.round(want * 10)) {
      console.log(`  ❌ ${x.m}: ${x.cbPF.toFixed(1)} Cum Bowl points on the career, but ${want.toFixed(1)} on the games themselves`); bad++;
    }
  });
  console.log(`  ${ptMark()} cum bowl points            every manager's PTS/G is the points from their own games`);
}
/* 🚨 EVERY PLAYOFF APPEARANCE IS A BRACKET ON FILE (v59). The Playoff
   appearances caption now states, as fact, that the bracket count beside each
   record IS that manager's appearance count and that losses == appearances −
   titles. That is true only while EVERY season carries a championship bracket
   — 2025 very nearly did not — and the day one lands without, the caption
   goes on saying it, silently. A claim a card makes as fact is a law or it is
   a liability. Verified by dropping the 2025 W games: names six managers. */
const apMark = block();
ALL.forEach((x) => { if (x.bA !== x.po) {
  console.log(`  ❌ ${x.m}: ${x.bA} brackets on file but ${x.po} playoff appearances — the card's arithmetic claim is false`); bad++; } });
console.log(`  ${apMark()} brackets == appearances     every playoff berth has its bracket on file`);

/* Career playoff scoring uses exactly the title-bracket games for each
   manager. Checking per person detects score-side or ownership swaps. */
{
  const mark = block();
  ALL.forEach(a => {
    const scores = PLAYOFF_GAMES.filter(g => g.br === 'W').flatMap(g => {
      const season = SEASON.find(s => s.yr === g.yr);
      return [[g.a,g.as],[g.b,g.bs]].filter(([team]) => season.rows.some(r => r.t === team && r.mgr === a.m)).map(([,score]) => score);
    });
    const sum = scores.reduce((n,s) => n+s,0);
    if (a.bG !== scores.length || Math.abs(a.bPF-sum) > .000001 || Math.abs(a.bPpg-sum/scores.length) > .000001) {
      console.log(`  ❌ ${a.m}: playoff PPG disagrees with championship-bracket scores`); bad++;
    }
    if (!window.LeagueHistory.profile(a.m).includes('All-time playoff PPG: '+a.bPpg.toFixed(1))) {
      console.log(`  ❌ ${a.m}: career playoff PPG missing from profile`); bad++;
    }
  });
  const honors = window.LeagueHistory.view('hon'), leaders = window.LeagueHistory.view('led');
  if (!honors.includes('Seeds &amp; upsets') || leaders.includes('Seeds &amp; upsets') || !leaders.includes('Final fours') || honors.includes('🎖️ Final fours')) {
    console.log('  ❌ Seeds & upsets / Final fours are not on the requested tabs'); bad++;
  }
  if (!leaders.includes('All-time playoff PPG') || /GOAT argument/.test(window.LeagueHistory.profile('McD'))) {
    console.log('  ❌ requested playoff scoring or storyline change is missing'); bad++;
  }
  console.log(`  ${mark()} playoff PPG: each career, visible scoring, requested card locations and no GOAT story`);
}
/* 🚨 THE BRACKET MUST RESOLVE THE STANDINGS, EVERY SEASON (v66 audit — the
   owner: "Verify all the info for cum bowl and season stats"). The season
   tables and the bracket games came from DIFFERENT captures (ESPN's Standings
   tab vs its Final Playoff Results tab; v56's coordinate parser for the games),
   so each is independent evidence about the other. In this format every
   placing is decided by a game: the final → 1st/2nd, the semi-final losers →
   3rd/4th, the R1 losers → 5th/6th (⚠️ that pair plays TWICE on ESPN and the
   LAST game decides), and the six consolation teams are exactly places 7-12.
   🚨 **11th AND 12th ARE THE CUM BOWL'S, NOT `GmC9`'s (v79, owner's call),
   AND THIS LAW USED TO SAY THE OPPOSITE.** It asserted GmC7/GmC8/GmC9 decide
   7-8, 9-10 and 11-12 — ESPN's rule, correctly transcribed, and the league
   does not use it below 10th: *"11th and 12th are decided in the cum bowl"*.
   ⚠️ **The law went red in 9 seasons the moment the rule changed, which is
   exactly the v42 trap and exactly when it is easiest to "fix" a law without
   thinking.** So what replaced it is not a relaxation: 11th and 12th are
   pinned to the Cum Bowl's winner and loser directly, and `GmC7`/`GmC8` are
   still held to deciding adjacent places **whenever neither of their teams is
   in the Cum Bowl** — which is the whole of ESPN's ladder that survives, and
   it still catches a mistyped consolation result. And the regular season is a
   closed league: every point scored was scored against somebody, so a season's
   points-for must equal its points-against — one mistyped digit anywhere in a
   season breaks it — and wins must equal losses. Verified by swapping two
   2019 placings: three lines name the season. */
{
  const brMark = block();
  const P = (s, t) => { const r = s.rows.find((x) => x.t === t); return r ? r.place : null; };
  const W = (g) => (g.as > g.bs ? g.a : g.b), Lo = (g) => (g.as > g.bs ? g.b : g.a);
  SEASON.forEach((s) => {
    const yr = s.yr, gs = PLAYOFF_GAMES.filter((g) => g.yr === yr);
    const f = (msg) => { console.log(`  ❌ ${yr}: ${msg}`); bad++; };
    const w = s.rows.reduce((a, r) => a + r.w, 0), l = s.rows.reduce((a, r) => a + r.l, 0);
    if (w !== l) f(`regular-season wins ${w} != losses ${l}`);
    const pf = s.rows.reduce((a, r) => a + r.pf, 0), pa = s.rows.reduce((a, r) => a + r.pa, 0);
    if (Math.abs(pf - pa) > 0.05) f(`points for ${pf.toFixed(1)} != points against ${pa.toFixed(1)}`);
    if (new Set(s.rows.map((r) => r.w + r.l)).size !== 1) f('teams played different numbers of games');
    if (s.rows.length !== 12) f(`${s.rows.length} rows`);
    const fin = gs.find((g) => g.rd === 'FINAL');
    if (fin && (P(s, W(fin)) !== 1 || P(s, Lo(fin)) !== 2)) f('the final does not decide 1st and 2nd');
    const r2 = gs.filter((g) => g.br === 'W' && g.rd === 'R2');
    if (r2.length === 2 && r2.map(Lo).map((t) => P(s, t)).sort().join() !== '3,4') f('semi-final losers are not 3rd and 4th');
    const r1 = gs.filter((g) => g.br === 'W' && g.rd === 'R1');
    if (r1.length === 2 && r1.map(Lo).map((t) => P(s, t)).sort().join() !== '5,6') f('round-1 losers are not 5th and 6th');
    const last = {}; gs.filter((g) => g.br === 'WC').forEach((g) => { last[[g.a, g.b].sort().join('|')] = g; });
    Object.values(last).forEach((g) => { if (P(s, W(g)) !== P(s, Lo(g)) - 1) f(`placement game ${W(g)} v ${Lo(g)} does not decide adjacent places`); });
    const c = gs.filter((g) => g.br === 'C');
    if (c.length) {
      const teams = new Set(c.flatMap((g) => [g.a, g.b]));
      if (teams.size !== 6 || [...teams].some((t) => !(P(s, t) >= 7))) f('consolation teams are not exactly places 7-12');
      /* The league's own rule: the Cum Bowl settles the bottom two. */
      const cb = CUMBOWL.find((x) => x.yr === yr);
      if (cb) {
        const cw = cb.p11 > cb.p12 ? cb.s11 : cb.s12, cl = cb.p11 > cb.p12 ? cb.s12 : cb.s11;
        if (P(s, cw) !== 11) f(`the Cum Bowl winner is ${P(s, cw)}th, not 11th`);
        if (P(s, cl) !== 12) f(`the Cum Bowl loser is ${P(s, cl)}th, not 12th`);
        /* What is left of ESPN's ladder still has to hold: a placement game
           between two teams the Cum Bowl did not move must decide adjacent
           places, winner above loser. */
        const inCB = (t) => t === cw || t === cl;
        [['GmC7', 7], ['GmC8', 9]].forEach(([rd]) => { const g = c.find((x) => x.rd === rd);
          if (!g || inCB(g.a) || inCB(g.b)) return;
          if (P(s, W(g)) !== P(s, Lo(g)) - 1) f(`${rd} does not decide adjacent places (${P(s, W(g))} v ${P(s, Lo(g))})`); });
      }
    }
    gs.forEach((g) => { if (!s.rows.find((r) => r.t === g.a) || !s.rows.find((r) => r.t === g.b)) f(`${g.rd} names a team not in the standings`);
      if (g.a === g.b || g.as === g.bs || !(g.as > 0 && g.bs > 0)) f(`${g.rd} is not a valid game`); });
  });
  console.log(`  ${brMark()} bracket == standings: every placing decided by its game, PF == PA and W == L in all ${SEASON.length} seasons`);
}

/* 🚨 THE SEEDS MUST AGREE WITH THE BRACKET'S OWN SHAPE (v62). ESPN's seeding
   for 2013-2017 was transcribed by hand off four screenshots, and a hand-typed
   number is exactly the kind of thing that lands on the wrong row silently.
   This is the check that proved them: in a six-team bracket the byes go to
   seeds 1 and 2 and round 1 is 3v6 and 4v5 — and the BRACKET GAMES came from a
   completely different extraction (v56's coordinate parser) than the seeds, so
   agreement between them is real evidence rather than a restatement.
   ⚠️ It is also what caught the guess: `calcSeed` reproduced this in 11 of 13
   seasons and failed 2013 and 2016, which is how the divisions were found.
   Verified by transposing two seeds in one season: it names that season. */
const seedMark = block();
SEASON.forEach((s) => {
  const w = PLAYOFF_GAMES.filter((g) => g.yr === s.yr && g.br === 'W');
  if (!w.length) return;
  const sd = (t) => (s.rows.find((r) => r.t === t) || {}).seed;
  if (!w.every((g) => sd(g.a) && sd(g.b))) return;          // unseeded season, not this law's business
  const r1 = w.filter((g) => g.rd === 'R1'), r2 = w.filter((g) => g.rd === 'R2');
  const inR1 = new Set(r1.flatMap((g) => [g.a, g.b]));
  const byes = [...new Set(r2.flatMap((g) => [g.a, g.b]))].filter((t) => !inR1.has(t));
  const b = byes.map(sd).sort((x, y) => x - y).join(',');
  const pairs = r1.map((g) => [sd(g.a), sd(g.b)].sort((x, y) => x - y).join('v')).sort().join(' ');
  if (b !== '1,2') { console.log(`  ❌ ${s.yr}: byes went to seeds ${b}, not 1,2 — a seed is on the wrong row`); bad++; }
  if (pairs !== '3v6 4v5') { console.log(`  ❌ ${s.yr}: round 1 paired ${pairs}, not 3v6 4v5 — a seed is on the wrong row`); bad++; }
});
console.log(`  ${seedMark()} seeds vs bracket        byes are 1 and 2, round 1 is 3v6 and 4v5, every seeded season`);

/* W==L is a LEAGUE-wide law, so it is checked over EVERY row in each season —
   not over the tracked subset, which is missing two managers. */
SEASON.forEach((s) => {
  const w = s.rows.reduce((a, r) => a + r.w, 0), l = s.rows.reduce((a, r) => a + r.l, 0);
  if (w !== l) { console.log(`  ❌ ${s.yr} league W-L: ${w} != ${l}`); bad++; }
});
/* all-play must be a closed system: every season, wins == losses across the field */
SEASON.forEach((s) => {
  const w = s.rows.reduce((a, r) => a + (s.rows.length - r.pfRank), 0);
  const l = s.rows.reduce((a, r) => a + (r.pfRank - 1), 0);
  if (w !== l) { console.log(`  ❌ all-play ${s.yr}: ${w} != ${l}`); bad++; }
});
/* Every rendered view must be non-trivial and free of unresolved template holes. */
/* ⚠️ The You view is DELIBERATELY short with nobody picked — it is the
   "tell the app who you are" state, and asserting a length against it was
   this check failing on correct code. Every view is checked in both. */
[null, 'Buley'].forEach((who) => {
  window.LeagueHistory.setMe(who);
  window.LeagueHistory.SUBS.forEach(([k]) => {
    const h = window.LeagueHistory.view(k);
    const floor = (k === 'you' && !who) ? 300 : 1500;
    if (h.length < floor) { console.log(`  ❌ view ${k} (me=${who || 'nobody'}) is only ${h.length} chars`); bad++; }
    if (/undefined|NaN|\[object/.test(h)) { console.log(`  ❌ view ${k} (me=${who || 'nobody'}) has a template hole`); bad++; }
    /* 🚨 A CODE COMMENT INSIDE A TEMPLATE LITERAL IS TEXT ON THE PAGE, and
       v65 shipped one: four lines of source rendered as a paragraph between
       the Cum Bowl card and the season list. It was found in the v66 render
       by reading the page — every measurement v65 took (chip counts, tab
       widths, tap targets) was correct and blind to it. This is the cheap
       half of that: nothing in these views has any business containing a
       comment opener. The other half is still looking at it. */
    if (/\/\*|\*\//.test(h)) { console.log(`  ❌ view ${k} (me=${who || 'nobody'}) renders a code comment`); bad++; }
  });
});
window.LeagueHistory.setMe(null);
ALL.forEach((a) => { const p = window.LeagueHistory.profile(a.m);
  if (/undefined|NaN|\[object/.test(p)) { console.log(`  ❌ profile ${a.m} has a template hole`); bad++; } });
/* 🏈 EVERY MANAGER HAS A MASCOT, AND IT IS THE SAME ONE IN BOTH PLACES (v49).
   Read off the RENDER rather than out of `MGR_TEAM`, so this cannot pass by
   agreeing with a map that the views have stopped using — and so checks.js
   never holds a second copy of who supports whom. A manager added without a
   team falls through to the 👤 fallback, which is correct behaviour and a
   silent one: the page still renders, it just quietly stops being about them.
   ⚠️ Deliberately NO uniqueness law. Three of the twelve are Jets fans. */
const HEAD_M = (h) => (h.match(/<h2 class="section-title">(\S+) Your career/) || [])[1];
const PROF_M = (h) => (h.match(/<h3>(\S+) /) || [])[1];
window.LeagueHistory.setMe(null);
const strangerM = HEAD_M(window.LeagueHistory.view('you'));
const seen = [];
/* 🚨 A reader who has picked nobody must get the neutral mark, never a team.
   The 🦅 this replaced was the commissioner's own — so eleven other people,
   and every stranger the link is forwarded to, opened the app under his bird. */
if (strangerM !== '👤') { console.log(`  ❌ nobody picked: the You heading shows "${strangerM}", not the neutral 👤`); bad++; }
window.LeagueHistory.roster().forEach((r) => {
  window.LeagueHistory.setMe(r.m);
  const mine = HEAD_M(window.LeagueHistory.view('you'));
  const prof = PROF_M(window.LeagueHistory.profile(r.m));
  if (!mine || mine === '👤') { console.log(`  ❌ ${r.name} has no mascot on their You page (shows "${mine}")`); bad++; }
  else if (mine !== prof) { console.log(`  ❌ ${r.name}'s mascot is "${mine}" on the You page but "${prof}" on their profile`); bad++; }
  else seen.push(mine);
});
console.log(`  ${seen.length === 12 ? '✅' : '❌'} mascots: ${new Set(seen).size} distinct across ${seen.length} of 12 managers, neutral for a stranger`);
if (seen.length !== 12) bad++;
window.LeagueHistory.setMe(null);
/* 🚨 Every manager must have at least one storyline, in every voice.
   The detectors look for EXTREMES, so a manager who has never been extreme at
   anything gets nothing — and that means someone opens their own You page and
   finds a blank space where everyone else has a story. `signature` exists to
   stop that, and this is what proves it still does. */
window.LeagueHistory.roster().forEach((r) => {
  window.LeagueHistory.setMe(r.m);
  const mine = window.LeagueHistory._stories().filter((x) => x.m === r.m);
  const txt = mine.map((x) => x.head + ' ' + x.body).join(' ');
  if (!mine.length) { console.log(`  ❌ ${r.name} has no storyline`); bad++; }
  if (/undefined|NaN|\[object/.test(txt)) { console.log(`  ❌ ${r.name} storyline has a template hole`); bad++; }
  if (/ ,|,,| \./.test(txt)) { console.log(`  ❌ ${r.name} storyline has a punctuation artefact`); bad++; }
  /* And it must be in the reader's voice: a storyline about YOU that says your
     own name is the one thing this whole app exists not to do. */
  if (mine.length && !/\b(You|you)\b/.test(txt)) { console.log(`  ❌ ${r.name}'s own storyline is not in second person`); bad++; }
});
window.LeagueHistory.setMe(null);
/* A superlative that fires for two people is just wrong. */
const sup = window.LeagueHistory._stories().filter((x) => /more than anyone|the most of anyone|No one in the league|the only manager|biggest story/i.test(x.head + x.body));
const byId = {};
sup.forEach((x) => { (byId[x.id] = byId[x.id] || []).push(x.m); });
Object.entries(byId).forEach(([id, ms]) => {
  const uniq = [...new Set(ms)];
  if (uniq.length > 1 && !/scorer|cbking|stuck/.test(id)) { console.log(`  ❌ superlative "${id}" fires for ${uniq.length} managers`); bad++; }
});
/* 🚨 A HEADING MUST CARRY THE FINDING, and the body must not repeat it.
   v7 shipped four cards headed "Gotch, in one line." — a label, not a claim —
   with the actual finding buried mid-body. And the fix exposed the mirror
   fault: a heading saying "6 of 9 seasons" over a body saying "9 seasons" is
   one fact printed twice on one card. `stories()` already dedupes DECIMALS
   across cards; whole numbers within a card were invisible to it.
   Threshold 3+ deliberately: 1 and 2 collide constantly and harmlessly
   ("11-1" in the head, "1 title" in the body), so flagging them would be noise
   and noise gets ignored. */
window.LeagueHistory.setMe(null);
/* ⚠️ A DECIMAL IS ONE NUMBER, NOT TWO (v66). `\d+` split "53.4%" into 53 and
   4, so Zach's card — headed "the joint 3rd-best win% in the league, 53.4%"
   over a body reading "9-4 in 2019" — was reported as printing 4 twice. The
   fractional digits of a percentage are not a number the reader sees
   repeated. Decimals are matched whole and then skipped, because `stories()`
   already dedupes those ACROSS cards, which is the job they need doing. */
window.LeagueHistory._cardStories().forEach((x) => {
  const big = (t) => new Set((String(t).match(/\d+(?:\.\d+)?/g) || [])
    .filter((s) => !s.includes('.')).map(Number).filter((n) => n >= 3));
  const inHead = big(x.head);
  const dup = [...big(x.body)].filter((n) => inHead.has(n));
  if (dup.length) { console.log(`  ❌ story "${x.id}/${x.m}" prints ${dup.join(', ')} in both its heading and its body`); bad++; }
  /* A heading that is only a name and a label tells the reader nothing. */
  if (/^[^.!?]{0,14}, in one line\.$/.test(x.head) || x.head.split(/\s+/).length < 4) {
    console.log(`  ❌ story "${x.id}/${x.m}" heading carries no claim: "${x.head}"`); bad++;
  }
  /* 🚨 …and a heading that does not FIT is one nobody reads (v14). Fourteen
     cards are a column to scan; past ~50 characters a heading wraps to three
     lines at 390px once its badge is beside it, and the card becomes an
     article. The v8 rule put the claim in the heading and never bounded its
     length, so three-liners had quietly become normal.
     ⚠️ The bound is 62, not the 58 it started at: the owner picked "…has led
     the league in scoring 3 times and won nothing" (59) as a card they wanted
     kept exactly, and it renders on two lines. The number is a tripwire for
     drift, not the real test — the real test is a render at 390px. */
  /* 🚨 Two numerals must not touch in a heading (v17, owner's call): "finished
     11th 7 times" makes the reader parse "11th 7" before the sentence
     resolves. `plWord` spells the second one out. */
  if (/\d(?:st|nd|rd|th)?\s+\d/.test(x.head)) {
    console.log(`  ❌ story "${x.id}/${x.m}" puts two numerals side by side: "${x.head}"`); bad++;
  }
  if (x.head.length > 62) {
    console.log(`  ❌ story "${x.id}/${x.m}" heading is ${x.head.length} chars, too long to scan: "${x.head}"`); bad++;
  }
});

/* 🚨 ASSERT THE CARD, NOT THE ENGINE. This check used to read `_stories()` and
   report "18 across 12 of 12" — while the Storylines card printed `slice(0, 10)`
   and showed EIGHT. Every assertion was green over a screen that left four
   managers out. A detector finding a story is not the same fact as a reader
   seeing it, and only the second one matters. */
const card = window.LeagueHistory._cardStories();
const onCard = new Set(card.map((x) => x.m));
window.LeagueHistory.roster().forEach((r) => {
  if (!onCard.has(r.m)) { console.log(`  ❌ ${r.name} is not on the Storylines card`); bad++; }
});
/* 🚨 NO TWO CARDS ON THE ROLL-CALL MAY MAKE THE SAME CLAIM (v66). The
   backstop states a rank and a rank can be shared, so the card came out with
   "Gotch has 5 final fours, joint 2nd of 12" directly above the identical
   sentence about Zach — each true, correctly hedged, and reading as a
   generator repeating itself on the one screen that is meant to be twelve
   different findings. The decimal dedupe in `stories()` cannot see a sentence
   with no decimal in it. Compared with the manager's name stripped, since the
   name is the one part that always differs. */
{
  const dupMark = block();
  const seen = new Map();
  card.forEach((x) => {
    const claim = x.head.replace(window.LeagueHistory.name(x.m), '').trim();
    if (seen.has(claim)) {
      console.log(`  ❌ the roll-call says the same thing twice: "${claim}" (${seen.get(claim)} and ${x.m})`); bad++;
    } else seen.set(claim, x.m);
  });
  console.log(`  ${dupMark()} roll-call: ${card.length} cards, ${seen.size} distinct claims`);
}

/* 🚨 THE ROLL-CALL IS THE SAME TWELVE FINDINGS WHOEVER IS READING (v81),
   AND THE LAW ABOVE COULD NOT SEE THAT IT WASN'T. It runs as a STRANGER, like
   every render sweep this card has ever had, and it compares heads with only
   the NAME stripped — so a duplicate that exists only in second person was
   invisible to it twice over. `pickStories` keyed on the same string, so *"You
   do worst-to-first as a party trick"* and *"Woods does worst-to-first as a
   party trick"* were two different claims to the guard and one claim to the
   reader, and the owner found his own card and Woods's making it side by side.
   ⚠️ **Asserted as an OUTCOME, not by normalising the sentence.** A law that
   stripped the verb the same way the code does would be the code agreeing with
   itself. What has to be true is simpler and permanent: the voice is the only
   thing a reader changes, so the twelve findings must be the same twelve —
   same manager, same detector — for all twelve of them as for a stranger.
   Fault-injected by keying `claim()` back on `x.head`: it names McD. */
{
  const voiceMark = block();
  window.LeagueHistory.setMe(null);
  const keys = () => window.LeagueHistory._cardStories().map((x) => x.m + '/' + x.id).sort();
  const asStranger = keys();
  window.LeagueHistory.roster().forEach((r) => {
    window.LeagueHistory.setMe(r.m);
    const theirs = keys();
    const gained = theirs.filter((k) => !asStranger.includes(k));
    const lost = asStranger.filter((k) => !theirs.includes(k));
    if (gained.length || lost.length) {
      console.log(`  ❌ the roll-call changes for ${r.name}: ${gained.join(', ') || 'nothing'} in place of ${lost.join(', ') || 'nothing'}`); bad++;
    }
  });
  window.LeagueHistory.setMe(null);
  console.log(`  ${voiceMark()} roll-call: the same ${asStranger.length} findings for every reader, voice aside`);
}

/* 🚨 A HEAD THAT CLAIMS A HABIT MUST HAVE THE INSTANCES BEHIND IT (v81).
   "does worst-to-first as a party trick" was the only wording this detector
   had, written when one manager had done it twice. v79's Cum Bowl placings
   left three managers on exactly ONE run each, and the card went on calling a
   single off-season a habit over a body listing one line. Counted off the body
   the reader sees, not off the detector's own array. */
{
  const trickMark = block();
  window.LeagueHistory.setMe(null);
  const w2f = window.LeagueHistory._stories().filter((x) => x.id === 'w2f');
  w2f.forEach((x) => {
    const runs = (x.body.match(/→ champion/g) || []).length;
    const habit = /party trick/.test(x.head);
    if (habit && runs < 2) { console.log(`  ❌ "${x.m}" is called a party trick over ${runs} run`); bad++; }
    if (!habit && runs > 1) { console.log(`  ❌ "${x.m}" has ${runs} worst-to-first runs and the head says one-off`); bad++; }
  });
  console.log(`  ${trickMark()} worst-to-first: ${w2f.length} cards, each claiming only what its body shows`);
}

/* 🚨 A REPEATED FIRST PLACE IS THE TITLE COUNT, AND THAT CARD IS
   `dynasty` (v81). `stuckAt` is about a finish a manager cannot escape; a
   championship is not one. Its own comment has always named the risk — "Buley
   (11th x7) and the champion (1st x4)" — and only `leaders()` kept the
   champion off, because 7 beat 4. v79 took Buley to 4, the tie surfaced, and
   the roll-call printed "McD has finished 1st four times" into the slot the
   owner moved the title count OFF in v16 (`dynasty` is `own: true` for exactly
   that reason). One concept, one number, one place it prints (v14). */
{
  const stuckMark = block();
  window.LeagueHistory.setMe(null);
  const st = window.LeagueHistory._stories().filter((x) => x.id === 'stuck');
  st.forEach((x) => {
    if (/finished 1st/.test(x.head)) {
      console.log(`  ❌ "${x.m}" is stuck at 1st: that is the title count, and it belongs to the GOAT card`); bad++;
    }
  });
  console.log(`  ${stuckMark()} stuck-at: ${st.length} card(s), none of them a title count in disguise`);
}

/* 🚨 An `own` story is kept OFF the league card and must still be ON that
   manager's own pages — both halves, because either one failing silently is
   the whole point of the flag. Asserted against the RENDERED You page and the
   RENDERED profile, not against the detector: a story being found and a
   reader seeing it are different facts, and only the second one matters. */
window.LeagueHistory.setMe(null);
const ownMark = block();
const owned = window.LeagueHistory._stories().filter((x) => x.own);
owned.forEach((x) => {
  if (window.LeagueHistory._cardStories().some((c) => c.id === x.id && c.m === x.m)) {
    console.log(`  ❌ own-page story "${x.id}/${x.m}" is on the league card`); bad++;
  }
  if (!window.LeagueHistory.profile(x.m).includes(x.head)) {
    console.log(`  ❌ own-page story "${x.id}/${x.m}" is missing from that profile`); bad++;
  }
  window.LeagueHistory.setMe(x.m);
  /* the heading re-voices for the reader, so re-derive it in their voice */
  const theirs = (window.LeagueHistory._stories().find((y) => y.id === x.id && y.m === x.m) || {}).head;
  if (!theirs || !window.LeagueHistory.view('you').includes(theirs)) {
    console.log(`  ❌ own-page story "${x.id}/${x.m}" is missing from that You page`); bad++;
  }
  window.LeagueHistory.setMe(null);
});
/* And the flag itself is a decision, not an accident: the owner read the 0-4
   title-bracket card next to the win%-and-no-title card about the same person
   and said the other one is better. Recorded by detector id — never by
   manager — so it cannot be quietly undone, and so it goes quiet on its own
   if the detector ever stops firing. */
/* ⚠️ 'floor' joined them in v66 and CAME OFF in v79, and the asymmetry is the
   point: every id left here is an OWNER's call between two cards about one
   person (v15, v16, v18), which no later session may quietly undo. 'floor'
   was the one flag argued from the data instead — v66's note said so — and
   the data it was argued from was the wrong Cum Bowl. A flag that exists
   because of a fact goes when the fact does; a flag that exists because
   somebody chose does not. */
['nofinal', 'dynasty', 'collapse'].forEach((id) => {
  const st = window.LeagueHistory._stories().find((x) => x.id === id);
  if (st && !st.own) { console.log(`  ❌ story "${id}" is a league headline again; the owner made it own-page only (v15)`); bad++; }
});
console.log(`  ${ownMark()} own-page stories: ${owned.length} kept off the card, live on their own pages`);

/* 🚨 EVERYONE HAS AT LEAST TWO STORYLINES (v22, owner's call: "Make sure
   everyone has at least 2 storylines"). Counted on the RENDER — the You page
   and the profile — and not on `_stories()`, because those are different
   facts and only the second one matters (the v7 lesson, and the reason the
   backstop itself now counts survivors rather than emissions: Christel's
   second card fired, counted, and was then dropped by the dedupe).
   ⚠️ The heading re-voices for whoever is reading, so it is re-derived in
   their voice before being looked for on their own page. */
{
  const twoMark = block();
  const WANT2 = 2;
  window.LeagueHistory.roster().forEach((r) => {
    window.LeagueHistory.setMe(null);
    const prof = window.LeagueHistory.profile(r.m);
    const asThem = window.LeagueHistory._stories().filter((x) => x.m === r.m);
    const onProf = asThem.filter((x) => prof.includes(x.head)).length;
    if (onProf < WANT2) { console.log(`  ❌ ${r.name}'s profile renders ${onProf} storyline(s), want ${WANT2}`); bad++; }

    window.LeagueHistory.setMe(r.m);
    const you = window.LeagueHistory.view('you');
    const mine = window.LeagueHistory._stories().filter((x) => x.m === r.m);
    const onYou = mine.filter((x) => you.includes(x.head)).length;
    if (onYou < WANT2) { console.log(`  ❌ ${r.name}'s You page renders ${onYou} storyline(s), want ${WANT2}`); bad++; }
    LHIST.setMe(null);
  });
  const counts = window.LeagueHistory.roster()
    .map((r) => window.LeagueHistory._stories().filter((x) => x.m === r.m).length);
  console.log(`  ${twoMark()} every manager has ${Math.min(...counts)}+ storylines on their own pages (most: ${Math.max(...counts)})`);
}

const cardMark = block();
/* 🚨 ONE CARD PER MANAGER on the league roll-call (v16). Twice a spare slot
   went to a second card about someone who already had one, and both times it
   made the same case in a duller way — fixing the instance just moved it. */
{
  const seen = new Set(), dup = [];
  card.forEach((x) => { if (seen.has(x.m)) dup.push(`${x.id}/${x.m}`); seen.add(x.m); });
  if (dup.length) { console.log(`  ❌ the Storylines card gives someone two slots: ${dup.join(', ')}`); bad++; }
}

/* And it must still LEAD with the biggest story — coverage that reordered the
   card into a flat roll-call would have fixed one thing by breaking another. */
if (card.length > 1 && card[0].w < card[card.length - 1].w) { console.log('  ❌ Storylines card is not ranked by weight'); bad++; }
console.log(`  ${cardMark()} storylines: ${window.LeagueHistory._stories().length} found, ${card.length} on the card, covering ${onCard.size} of ${window.LeagueHistory.roster().length} managers`);

/* ══ 🚨 A SHARED RANK MUST SAY IT IS SHARED (v58) ═══════════════════════
   The `signature` backstop ranked managers with `findIndex` on a sorted
   array — pure ARRAY POSITION — so four managers on 5 final fours were
   handed 2nd, 3rd, 4th and 5th, and the card printed "2nd of 12" as sole
   possession. The app's oldest storyline rule is that **a superlative which
   fires twice is just wrong** (v2); every real detector honours it through
   `leaders()`/`alsoTxt()` and these ordinals never did.
   ⚠️ THE NEW BRACKET DATA IS WHAT MADE IT VISIBLE: `f4` moved for eight
   managers in v56/v57 and created three fresh multi-way ties, exactly at the
   ranks this backstop fills.
   ⚠️ It reads the RENDERED story, not the rank helper — a law that agrees
   with the helper passes happily over a card that has stopped using it (v7).
   Verified by reverting `rankOf` to `findIndex`: this names Gotch and CC. */
const RANK_STAT = { pct: (a) => a.pct, f4: (a) => a.f4, po: (a) => a.poRate, place: (a) => a.avgPlace };
const RANKY = /\b(\d+(?:st|nd|rd|th) of \d+|[a-z]+-best|best in the league|worst in the league)\b/;
const tieMark = block();
window.LeagueHistory.roster().forEach((r) => {
  window.LeagueHistory.setMe(null);
  window.LeagueHistory._stories().filter((st) => st.m === r.m).forEach((st) => {
    const val = RANK_STAT[st.t]; if (!val) return;
    const me = ALL.find((x) => x.m === r.m);
    const shared = ALL.filter((x) => val(x) === val(me)).length > 1;
    const txt = `${st.head} ${st.body}`;
    if (shared && RANKY.test(txt) && !/joint/.test(txt)) {
      console.log(`  ❌ ${r.m}: claims a sole rank on "${st.t}" but is tied — ${st.head}`); bad++;
    }
  });
});
window.LeagueHistory.setMe(null);
console.log(`  ${tieMark()} shared ranks: every tied rank on the rendered cards says "joint"`);

/* ══ 🔒 THE GATE ═══════════════════════════════════════════════════════════
   The link goes to eleven other people. Two things have to stay true about
   the commissioner's tool, and neither is visible in any render of the app —
   which is exactly why they are asserted here. */
{
  const fs = require('fs');
  const idx = fs.readFileSync('./index.html', 'utf8');
  /* 1. THE DOOR IS NOT ADVERTISED. `league.js` appends the Lab link on an
     unlocked device; a link sitting in the markup behind `hidden` would still
     be in view-source for the other eleven, and a lock that announces itself
     to everyone it excludes is most of the way to no lock at all. */
  if (/power\.html/.test(idx.replace(/<!--[\s\S]*?-->/g, ''))) {
    console.log('  ❌ index.html names the Lab in its own markup — it must be appended by league.js on an unlocked device only');
    bad++;
  }

  /* 2. THE REPO CARRIES A HASH, NEVER THE PHRASE. This repo is PUBLIC. A
     token compared with `===` would be the passphrase, published. */
  const own = fs.readFileSync('./owner.js', 'utf8');
  const h = /const HASH = '([^']*)'/.exec(own);
  if (!h || !/^[0-9a-f]{64}$/.test(h[1])) {
    console.log('  ❌ owner.js does not hold a SHA-256 hash — a plaintext passphrase in a public repo is not a lock');
    bad++;
  }

  /* 3. AND THE PHRASE IS NOT A GUESS AWAY. Nothing here can measure how good
     a passphrase is, but it can refuse the ones a relative would actually
     try first — the league's own words above all. There is no server to
     rate-limit anybody, so a guessable phrase is the whole lock gone. */
  const { webcrypto } = require('crypto');
  global.window = { crypto: webcrypto };
  const store = {};
  global.localStorage = { getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
  delete require.cache[require.resolve('./owner.js')];
  require('./owner.js');
  const O = global.window.LeagueOwner;
  const GUESSES = ['', 'password', '1234', 'admin', 'letmein', 'nectars', 'bolonga',
    'nectars bolonga', 'mcd', 'jack', 'league history', 'power rankings',
    'commissioner', 'football', 'fantasy', 'cum bowl'];
  Promise.all(GUESSES.map((g) => O.unlock(g))).then((r) => {
    const got = GUESSES.filter((_, i) => r[i] === 'ok');
    if (got.length) { console.log(`  ❌ the passphrase is one of the obvious guesses: ${got.join(', ')}`); bad++; }
    else if (O.is()) { console.log('  ❌ a failed unlock still set the key'); bad++; }
    else console.log(`  ✅ the gate: hash only, ${GUESSES.length} obvious guesses refused`);
    inviteLaws(O);
    /* ⚠️ CHAINED, NOT RACED. `done()` calls `process.exit`, so two independent
       promises both ending in it means whichever resolves first kills the
       other mid-check — silently, and looking exactly like a pass. */
    resetToolLaws().then(done);
  });
}

/* ══ 👥 INVITE LAWS (v33) ══════════════════════════════════════════════════
   None of this is visible in a render, which is exactly why it is asserted.
   The one that matters most is the second: a guest pass must never make
   `is()` true, because `is()` is what keeps the commissioner's name off the
   name picker and what gates minting further invites. It is one boolean away
   from being wrong and nothing on screen would show it. */
function inviteLaws(O) {
  const day = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
  const fail = (m) => { console.log(`  ❌ ${m}`); bad++; };
  O.lock(); O.endGuest();

  if (O.accept(O.invite('Hyman', day(7))) !== 'ok') return fail('a fresh invite was refused');
  const g = O.guest();
  if (!g || g.who !== 'Hyman') return fail('an accepted invite did not record who it was for');
  if (!O.mayLab()) return fail('a valid guest pass does not open the Lab');
  /* 🚨 THE LOAD-BEARING ONE. */
  if (O.is()) return fail('a guest pass made the device read as the OWNER — the picker would offer his name');

  O.endGuest();
  if (O.mayLab() || O.guest()) return fail('signing out left the pass in place');

  if (O.accept(O.invite('Hyman', day(-1))) !== 'expired') return fail('an invite that ran out was accepted');
  if (O.guest()) return fail('an expired invite still stored a pass');
  if (O.accept('!!not-base64!!') !== 'bad') return fail('a damaged invite was not reported as damaged');
  if (O.accept(O.invite('Hyman', 'whenever')) !== 'bad') return fail('an invite with a junk date was accepted');

  /* An invite issued before the revoke line is dead however long it had left:
     the owner's only real take-back, since a pass lives on another phone. */
  const old = JSON.parse(Buffer.from(O.invite('Hyman', day(30)).replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
  old.i = '2000-01-01';
  const stale = Buffer.from(JSON.stringify(old)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  if (O.accept(stale) !== 'revoked') return fail('an invite issued before INVITES_FROM was still accepted');

  /* A pass that expires overnight must be dead on the next READ, not on a
     timer — a page left open for three days must not still be inside. */
  O.accept(O.invite('Hyman', day(1)));
  try {
    const raw = JSON.parse(global.localStorage.getItem('lh:guest'));
    raw.u = day(-1);
    global.localStorage.setItem('lh:guest', JSON.stringify(raw));
  } catch (_) { return fail('could not reach the stored pass'); }
  if (O.guest() || O.mayLab()) return fail('a pass that ran out was still open on the next read');

  /* 🚨 AN OPEN-ENDED PASS MUST STILL BE KILLABLE (v34). "No end date" is
     stored as a date that never arrives rather than as a missing expiry, so
     there is no "forever" branch to get wrong — but the whole point of the
     revoke line is that it reaches the passes with no other way to end. A
     standing pass that outlived a cancellation would be the one grant the
     owner could never take back. */
  O.endGuest();
  if (O.accept(O.invite('Hyman', '9999-12-31')) !== 'ok') return fail('an open-ended invite was refused');
  if (!O.mayLab() || O.is()) return fail('an open-ended pass did not behave like a guest pass');
  O.endGuest();
  const forever = JSON.parse(Buffer.from(O.invite('Hyman', '9999-12-31').replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
  forever.i = '2000-01-01';
  const dead = Buffer.from(JSON.stringify(forever)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  if (O.accept(dead) !== 'revoked') return fail('a cancelled open-ended invite still worked — it could never be taken back');

  console.log('  ✅ invites: expire, revocable (open-ended too), damaged refused, never grant owner');
}

/* ══ 📊 THIS SEASON (v39) ══════════════════════════════════════════════════
   The current-season tab reads a published file and derives everything else.
   None of what follows is visible in a render, which is why it is asserted. */
function seasonLaws() {
  /* ⚠️ Its OWN `fail`. The invites block defines one inside itself, so every
     failure path here would have thrown ReferenceError instead of reporting —
     and the success path never calls it, so the suite went green over a check
     that could not fail out loud. A check whose failure path has never run is
     not a check. Verified by breaking each law in turn. */
  const fail = (m) => { console.log(`  ❌ ${m}`); bad++; };
  const fs = require('fs');
  require('./season.js');
  const LS = window.LeagueSeason;

  /* 🚨 `season/current.json` MUST SHIP, and it must parse with an array `t`.
     That is the whole reason a 404 on it can be reported as a broken deploy
     rather than as "nothing published yet": an unpublished season still
     answers 200 with an empty `t`. If this file ever stops shipping, the app
     starts telling the league a fault is business as usual — the exact lie
     the three-state error map exists to prevent. */
  let snap;
  try { snap = JSON.parse(fs.readFileSync('./season/current.json', 'utf8')); }
  catch (e) { return fail('season/current.json is missing or unparseable: ' + e.message); }
  if (!Array.isArray(snap.t)) return fail('season/current.json has no `t` array — an empty season must still parse');

  /* The app must actually load it, and on the same ?v= as the rest. */
  const html = fs.readFileSync('./index.html', 'utf8');
  const lj = fs.readFileSync('./league.js', 'utf8');
  const ver = (lj.match(/APP_VERSION = 'v(\d+)'/) || [])[1];
  if (!ver) return fail('could not read APP_VERSION from league.js');
  if (!html.includes(`season.js?v=${ver}`)) return fail(`index.html does not load season.js?v=${ver}`);
  ['history.js', 'league.js'].forEach((f) => {
    if (!html.includes(`${f}?v=${ver}`)) fail(`${f} is not on ?v=${ver} in index.html`);
  });
  /* 🚨 THE SHARED FILES MUST RIDE ONE NUMBER (v28). `styles.css` and
     `power.css` are loaded by BOTH pages, so each had two independent
     counters — and `styles.css` sat at ?v=1 on the Lab side for so long that
     any device which had opened the Lab was pinned to a pre-v20 stylesheet
     there for good. A second counter for one file's freshness is a second
     source of truth, and the stale one wins on whichever page forgot. */
  const ph = fs.readFileSync('./power.html', 'utf8');
  /* ⚠️ `espn.js` JOINED THIS LIST IN v69, AFTER SPLITTING IN ONE COMMAND.
     It is loaded by both pages exactly like the two stylesheets, and it was
     the one shared file with no law — so a blanket `?v=68 → ?v=69` over
     index.html alone left power.html on the old copy of the manager map, in
     silence. That is v28 verbatim, and the reason the law is written per
     shared FILE rather than per file that has burned us. */
  ['styles.css', 'power.css', 'espn.js'].forEach((f) => {
    const a = (html.match(new RegExp(f.replace('.', '\\.') + '\\?v=(\\d+)')) || [])[1];
    const b = (ph.match(new RegExp(f.replace('.', '\\.') + '\\?v=(\\d+)')) || [])[1];
    if (!a || !b) return fail(`${f} has no ?v= in one of the two pages`);
    if (a !== b) fail(`${f} is ?v=${a} in index.html but ?v=${b} in power.html — one page serves a stale copy`);
  });

  /* 🚨 ONE MANAGER MAP, ONE TRANSFORM (v42). The Season tab fetches ESPN now,
     so it needs the same two facts the Lab does. A second copy of either is a
     second thing to update every September — and v36 is what ONE stale map
     already cost: half the league lost its crests AND its YOU row. */
  const espn = fs.readFileSync('./espn.js', 'utf8');
  const pj0 = fs.readFileSync('./power.js', 'utf8');
  const sj0 = fs.readFileSync('./season.js', 'utf8');
  if (!/const MANAGERS = \{/.test(espn)) fail('espn.js does not hold the manager map');
  [['power.js', pj0], ['season.js', sj0]].forEach(([n, src]) => {
    if (/const MANAGERS = \{/.test(src)) fail(`${n} has its OWN manager map — there must be exactly one, in espn.js`);
  });
  ['index.html', 'power.html'].forEach((f) => {
    if (!/espn\.js\?v=/.test(fs.readFileSync('./' + f, 'utf8'))) fail(`${f} does not load espn.js`);
  });

  /* 🚨 `isMe` FLAGS THE COMMISSIONER'S TEAM ON EVERY DEVICE THAT ASKS. The
     members' app fetching live is exactly where reading it would badge his
     team as theirs on eleven phones — the v33 byline bug, one field over.
     Neither the transform nor the view may touch it. */
  [['espn.js', espn], ['season.js', sj0]].forEach(([n, src]) => {
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    if (/\bisMe\b/.test(code)) fail(`${n} reads isMe — it flags the commissioner's team on every device`);
  });

  /* The live fetch must be throttled and must never be awaited before paint:
     twelve people share one free-tier backend, and a cold start in front of
     the render is a 30-60s spinner for whoever opens the app first. */
  if (!/throttleMs/.test(sj0)) fail('season.js has no throttle on the live fetch');

  /* 🚨 THE NFL PLAYS ON THREE DAYS. Asking a sleeping free-tier service on a
     Wednesday burns instance-hours for an answer that cannot have moved, so
     the quiet-day throttle must be far longer than the game-window one. If
     these ever invert, twelve phones would hammer the backend all week and
     go quiet exactly when the scores are actually moving. */
  const ts = window.LeagueSeason._throttleMs;
  const at = (day, h) => { const d = new Date(2026, 8, 6 + day); d.setHours(h, 0, 0, 0); return d; };
  const live = ts(at(0, 13)), quiet = ts(at(3, 15));
  if (!(live < quiet)) fail(`the throttle is not schedule-aware (Sunday 1pm ${live}ms vs Wednesday 3pm ${quiet}ms)`);
  if (quiet < 6 * 3600e3) fail(`the quiet-day throttle is only ${Math.round(quiet / 60000)} min — it should be hours, not minutes`);
  [[0, 13], [1, 20], [4, 20]].forEach(([d, h]) => { if (ts(at(d, h)) !== live) fail(`a game window (day ${d}, ${h}:00) is not on the short throttle`); });
  [[2, 11], [3, 15], [6, 14]].forEach(([d, h]) => { if (ts(at(d, h)) !== quiet) fail(`a quiet day (day ${d}, ${h}:00) is not on the long throttle`); });
  if (/await revalidate\(\)/.test(sj0)) fail('season.js awaits the live fetch — that puts a cold start in front of the reader');

  /* A tab with no entry in HELP still lists itself in the ? sheet, but the one
     sentence a tab cannot know about itself would be missing. */
  if (!/\['season',/.test(lj)) return fail('league.js has no season tab in L1');
  if (!/\n    season: /.test(lj)) fail('the ? sheet has no HELP entry for the season tab');

  /* ── the derivations, on a fixture whose answers are known by construction ─
     Twelve teams, a fixed pairing every week, three weeks played. */
  const N = 12, WKS = 3, RW = 14;
  const t = [];
  for (let i = 0; i < N; i++) {
    const opp = String(i % 2 === 0 ? i + 2 : i);   // 1-2, 3-4, ... as 1-based ids
    t.push({ id: String(i + 1), n: 'Team ' + (i + 1), m: '', w: i % 2 === 0 ? WKS : 0,
      l: i % 2 === 0 ? 0 : WKS, ti: 0, pf: 300 + i * 10, pa: 300, apw: N - 1 - i, apl: i,
      pct: 100 - i * 8, s: [100 + i, 101 + i, 102 + i], sch: Array(RW).fill(opp) });
  }
  const d = LS._derive({ k: WKS, l: 'After Week 3', rw: RW, pt: 6, t });

  if (d.wp !== WKS) fail(`weeks played derived as ${d.wp}, expected ${WKS}`);
  if (d.pre) fail('three weeks of scores read as preseason');
  if (d.nextWk !== WKS + 1) fail(`next week derived as ${d.nextWk}, expected ${WKS + 1}`);

  /* Seeds must be a permutation of 1..N — a duplicate or a gap means the sort
     leaked, and a standings table with two 4th places is not a table. */
  const seeds = d.table.map((x) => x.seed).sort((a, b) => a - b);
  if (seeds.join(',') !== Array.from({ length: N }, (_, i) => i + 1).join(',')) fail('seeds are not 1..' + N);
  for (let i = 1; i < d.table.length; i++) {
    const a = d.table[i - 1], b = d.table[i];
    const aw = a.w + a.ti / 2, bw = b.w + b.ti / 2;
    if (aw < bw || (aw === bw && a.pf < b.pf)) fail('standings are not sorted by wins then points');
  }

  /* 🚨 EVERY TEAM PLAYS EXACTLY ONCE, AND NOBODY PLAYS THEMSELVES. A pairing
     bug here does not throw and does not look wrong — it silently drops a
     game or shows a team twice, and only counting catches it. */
  if (d.games.length !== N / 2) fail(`week has ${d.games.length} games, expected ${N / 2}`);
  const seen = {};
  d.games.forEach(([a, b]) => {
    if (a.id === b.id) fail('a team is scheduled against itself');
    [a, b].forEach((x) => { if (seen[x.id]) fail('team ' + x.id + ' appears in two games'); seen[x.id] = 1; });
  });
  if (Object.keys(seen).length !== N) fail('not every team is in a matchup');

  /* Preseason invents nothing: no ppg, no rel, no luck off zero games. */
  const pre = LS._derive({ rw: RW, pt: 6, t: t.map((x) => ({ ...x, w: 0, l: 0, ti: 0, pf: 0, s: [] })) });
  if (!pre.pre) fail('a season with no scores did not read as preseason');
  if (pre.teams.some((x) => x.ppg !== null || x.rel !== null || x.luck !== null)) {
    fail('preseason invented a ppg, a relative score or a luck figure from zero games');
  }
  if (pre.nextWk !== 1) fail('preseason next week is not week 1');

  /* A finished regular season has no next week — never a week 15. */
  const over = LS._derive({ rw: 2, pt: 6, t: t.map((x) => ({ ...x, s: [100, 101] })) });
  if (over.nextWk !== null) fail('past the last week the app still offered a next one');

  /* 🚨 THE RANK MUST NEVER OUTRUN ITS DENOMINATOR. `placeTxt` is handed a
     rank running 1..seasons+1 and a count of finished seasons, and printing
     one against the other produced "your 14th-best win rate in thirteen
     seasons". Walk every rank and assert no phrase quotes a number larger
     than the seasons it counts against. */
  const SEAS = 13;
  for (let r = 1; r <= SEAS + 1; r++) {
    const txt = LS._placeTxt(r, SEAS, 'seasons', 'your');
    /* ⚠️ ANY numeral at all is the failure, and the first version of this
       check missed it: `\b\d+\b` never matches "14th", because there is no
       word boundary between the digits and the suffix — so the exact fault
       that shipped walked straight past the assertion written to catch it.
       Every count in this phrase is spelled, so a digit means a rank leaked
       into the prose. Verified by reinstating the fault. */
    if (/\d/.test(txt)) fail(`placeTxt(${r}) prints a numeral: "${txt}"`);
    if (/\b(fourteen|fifteen|sixteen)\b/.test(txt)) fail(`placeTxt(${r}) quotes a count past ${SEAS}: "${txt}"`);
    if (!/thirteen/.test(txt)) fail(`placeTxt(${r}) lost its denominator: "${txt}"`);
  }

  /* The favourite must name its basis, and must not pick one in preseason
     from scoring that does not exist. */
  const A = { n: 'A', ppg: 120, l3: 110, pct: 60 }, B = { n: 'B', ppg: 100, l3: 130, pct: 40 };
  const inSeason = LS._favourite(A, B, false);
  if (!inSeason || !/Favoured on scoring/.test(inSeason.why)) fail('in-season favourite does not state its basis');
  if (!/Recent form disagrees/.test(inSeason.why)) fail('form disagreeing with scoring went unsaid');
  const preF = LS._favourite(A, B, true);
  if (!preF || !/ESPN/.test(preF.why)) fail('preseason favourite is not attributed to ESPN');

  if (!bad) console.log('  ✅ this season: file ships, derivations hold, no rank outruns its denominator');
}
seasonLaws();

/* ══ 🎯 PLAYOFF ODDS (v40) ═════════════════════════════════════════════════
   The one model in the app that can be graded, so it gets asserted like one.
   None of this is visible in a render: a Monte Carlo that is subtly wrong
   still prints twelve confident percentages. */
function oddsLaws() {
  const fail = (m) => { console.log(`  ❌ ${m}`); bad++; };
  const fs = require('fs');
  require('./odds.js');
  const LO = window.LeagueOdds;

  const html = fs.readFileSync('./index.html', 'utf8');
  const ver = (fs.readFileSync('./league.js', 'utf8').match(/APP_VERSION = 'v(\d+)'/) || [])[1];
  if (!html.includes(`odds.js?v=${ver}`)) fail(`index.html does not load odds.js?v=${ver}`);

  /* Twelve teams, a fixed round-robin-ish pairing, some weeks played. */
  const N = 12, RW = 14, PT = 6;
  const mk = (weeks) => {
    const teams = [];
    for (let i = 0; i < N; i++) {
      const opp = String(i % 2 === 0 ? i + 2 : i);
      const scores = [];
      for (let w = 0; w < weeks; w++) scores.push(100 + i + (w % 3) * 4);
      teams.push({ id: String(i + 1), scores, sch: Array(RW).fill(opp) });
    }
    return { teams, rw: RW, pt: PT, priors: {}, seed: 1234, sims: 2000 };
  };

  const r = LO.build(mk(5));

  /* 🚨 THE CONSERVATION LAW OF A PLAYOFF FIELD. Exactly `pt` teams make it in
     every simulated season, so the twelve probabilities must total pt x 100.
     A double-counted team, a team ranked twice, an off-by-one in the cut —
     all of them break this and none of them looks wrong on screen. (It is
     also the invariant ESPN's own numbers satisfy, which is how we know
     theirs is a real simulation.) */
  const sum = Object.keys(r.odds).reduce((a, k) => a + r.odds[k], 0);
  if (Math.abs(sum - PT * 100) > 1e-6) fail(`odds sum to ${sum.toFixed(3)}, must be ${PT * 100}`);
  Object.keys(r.odds).forEach((k) => {
    if (!(r.odds[k] >= 0 && r.odds[k] <= 100)) fail(`team ${k} has an impossible probability: ${r.odds[k]}`);
  });

  /* 🚨 SAME SEED, SAME NUMBER — twelve people compare phones. An unseeded
     Monte Carlo fails this silently and reads as the app contradicting
     itself, which is the kind of bug nobody can debug from a group chat. */
  const again = LO.build(mk(5));
  if (Object.keys(r.odds).some((k) => r.odds[k] !== again.odds[k])) {
    fail('the simulation is not deterministic — two runs of the same week disagree');
  }
  const other = LO.build(Object.assign(mk(5), { seed: 99 }));
  if (Object.keys(r.odds).every((k) => r.odds[k] === other.odds[k])) {
    fail('changing the seed changed nothing — the RNG is not being used');
  }

  /* Preseason invents no confidence: with nothing played, the weight on
     observed scoring must be exactly zero and everything is the prior. */
  const pre = LO.build(mk(0));
  if (pre.est.lambda !== 0) fail(`with no games played the model still trusts scoring (lambda ${pre.est.lambda})`);
  const preSum = Object.keys(pre.odds).reduce((a, k) => a + pre.odds[k], 0);
  if (Math.abs(preSum - PT * 100) > 1e-6) fail('preseason odds do not sum to the field');

  /* 🚨 TRUST IN THE DATA MUST GROW WITH THE DATA. If this ever inverts, the
     model is reading late-season evidence as less informative than early
     noise — the exact thing shrinkage exists to prevent, upside down. */
  let last = -1;
  [0, 3, 6, 10, 13].forEach((w) => {
    const l = LO.build(mk(w)).est.lambda;
    if (l < last - 1e-9) fail(`shrinkage weight fell from ${last.toFixed(3)} to ${l.toFixed(3)} as weeks were added`);
    last = l;
  });

  /* 🚨 WINNING MUST NEVER HURT. The what-ifs are conditionals off one set of
     simulated seasons; if any game reads better to lose than to win, either
     the conditioning or the ranking is wrong, and the page would be telling
     somebody to root against their own team. */
  const withMe = LO.build(Object.assign(mk(5), { me: '7' }));
  if (!withMe.swings.length) fail('the reader has no remaining games in a 5-of-14 season');
  withMe.swings.forEach((g) => {
    if (g.ifWin == null || g.ifLose == null) return;
    if (g.ifWin < g.ifLose - 1e-9) fail(`week ${g.week}: losing (${g.ifLose.toFixed(1)}%) beats winning (${g.ifWin.toFixed(1)}%)`);
  });

  /* 🚨 PARAMETER UNCERTAINTY MUST BE IN THERE, and it breaks no conservation
     law — a model that treats a three-week estimate as a known fact still
     prints twelve percentages that add to 600. What it does instead is get
     CONFIDENT too early: measured against a known truth, the first cut said
     95% for teams that made it 83% of the time. So the observable
     consequence is asserted: the error bar on a team's strength must exist
     while the season is young and must shrink as the season fills in. */
  const u3 = LO.build(mk(3)).est, u11 = LO.build(mk(11)).est;
  if (!(u3.muSd > 0)) fail('the model treats a three-week estimate as exact — no error bar on team strength');
  if (!(u11.muSd < u3.muSd)) fail(`the error bar on team strength did not shrink with the season (${u3.muSd.toFixed(2)} -> ${u11.muSd.toFixed(2)})`);

  /* And its consequence on the output: with more of the season known, the
     field must spread OUT. If early odds are as extreme as late ones, the
     model is not learning, it is just guessing confidently from the start. */
  const spread = (o) => { const v = Object.keys(o.odds).map((k) => o.odds[k]); return Math.max.apply(null, v) - Math.min.apply(null, v); };
  const s3 = spread(LO.build(mk(3))), s11 = spread(LO.build(mk(11)));
  if (s11 <= s3) fail(`the odds did not sharpen as the season went on (week 3 spread ${s3.toFixed(0)}, week 11 ${s11.toFixed(0)})`);

  /* 🚨 THE HEAD-TO-HEAD TIEBREAK MUST ACTUALLY BREAK A TIE — the league's
     rule is head-to-head, then points.
     ⚠️ The first version of this check could not have caught anything: it
     used two teams who only ever played each other, so their head-to-head
     record IS their overall record and a tie on wins is a tie on everything.
     Removing the tiebreak left it green. It needs four teams, so that two of
     them can be level on wins, level nowhere else, and split by the game
     between them: `a` and `b` both finish 1-1, `b` has MORE points, and `a`
     beat `b` in week 1. Head-to-head puts `a` second; points-only puts `b`
     there. */
  const h2h = {
    rw: 2, pt: 2, priors: {}, seed: 5, sims: 1,
    teams: [
      { id: 'a', scores: [120, 100], sch: ['b', 'c'] },
      { id: 'b', scores: [110, 120], sch: ['a', 'd'] },
      { id: 'c', scores: [130, 115], sch: ['d', 'a'] },
      { id: 'd', scores: [100, 110], sch: ['c', 'b'] },
    ],
  };
  const hr = LO.build(h2h);
  if (Math.abs(hr.odds.a + hr.odds.b + hr.odds.c + hr.odds.d - 200) > 1e-6) fail('the four-team tiebreak season does not conserve its field');
  if (hr.odds.c !== 100) fail('the 2-0 team did not take a guaranteed spot');
  if (hr.odds.a !== 100) fail('head-to-head did not break the tie — `a` beat `b` and still lost the spot on points');

  if (!bad) console.log('  ✅ playoff odds: field conserved, deterministic, winning never hurts, shrinkage grows');
}
oddsLaws();

/* ══ 🎲 THE GROUP PARLAY (v69) ════════════════════════════════════════════
   The one tab whose FACTS are typed in — the picks and the results come off a
   betting slip, because a bet has no other source. Everything with a number
   in it is still derived, and that is what these laws are about: the price,
   the payout, the records and the ranks all have to come off the legs, so a
   corrected leg corrects the tab instead of leaving one confident wrong
   number behind. */
function parlayLaws() {
  /* ⚠️ Its OWN `fail` — the v39 rule. A check whose failure path has never
     run is not a check, and borrowing another block's `fail` throws
     ReferenceError on exactly the path nobody exercises. */
  const fail = (m) => { console.log(`  ❌ ${m}`); bad++; };
  const mark = block();
  const fs = require('fs');
  /* Put the archive back first: parlay.js reads `window.LeagueHistory` at
     load time for the voice, and a block above has swapped the window out. */
  global.window = global.window || {};
  global.window.LeagueHistory = LHIST;
  /* ⚠️ A REAL localStorage, not a stub that swallows writes. The collection
     path IS storage — two picks from one manager, a week rolling over, a
     cleared ticket — so a no-op shim would make every one of those laws pass
     by never storing anything. */
  const mem = {};
  global.localStorage = {
    getItem: (k) => (k in mem ? mem[k] : null),
    setItem: (k, v) => { mem[k] = String(v); },
    removeItem: (k) => { delete mem[k]; },
  };
  require('./parlay.js');
  const LP = global.window.LeagueParlay;
  if (!LP) return fail('parlay.js exposes no LeagueParlay');

  /* 🚨 `parlay/current.json` MUST SHIP, and it must parse with an array
     `weeks`. That is the whole reason a 404 on it is reportable as a broken
     deploy rather than as "nothing up yet": an unstarted season still answers
     200 with an empty array. Stop shipping it and the app starts telling the
     league that a fault is business as usual. */
  let file;
  try { file = JSON.parse(fs.readFileSync('./parlay/current.json', 'utf8')); }
  catch (e) { return fail('parlay/current.json is missing or unparseable: ' + e.message); }
  if (!Array.isArray(file.weeks)) return fail('parlay/current.json has no `weeks` array — an unstarted season must still parse');

  const html0 = fs.readFileSync('./index.html', 'utf8');
  const ver = (fs.readFileSync('./league.js', 'utf8').match(/APP_VERSION = 'v(\d+)'/) || [])[1];
  /* 🚨 THE VERSION HAS TO BE SOMEWHERE ON THE PAGE. It moved out of the
     masthead in v75, and the failure mode of a move is that it lands nowhere
     — silently, because nothing else reads it. v12 is why it matters: a
     "this looks wrong" report turned out to be a cached build, and the first
     question is always which version they are running. The element and its
     one writer are asserted together; either alone would pass over a move
     that dropped the other. */
  if (!/id="lg-ver"/.test(html0)) fail('index.html has no #lg-ver — the app cannot say which version it is running');
  if (!/\$\('#lg-ver'\)/.test(fs.readFileSync('./league.js', 'utf8'))) {
    fail('nothing in league.js writes the version into #lg-ver, so the slot renders empty');
  }
  if (!html0.includes(`parlay.js?v=${ver}`)) fail(`index.html does not load parlay.js?v=${ver}`);

  /* ── the arithmetic ─────────────────────────────────────────────────────
     American odds are what a slip is written in and the wrong thing to
     multiply. There is one conversion each way and every caller goes through
     it; two implementations is how a payout and the price above it end up
     disagreeing about the same ticket, both nearly right. */
  [-1000, -250, -110, -101, 101, 120, 350, 2500].forEach((o) => {
    const back = LP._amer(LP._dec(o));
    if (back !== o) fail(`odds round-trip broke: ${o} → ${LP._dec(o)} → ${back}`);
  });
  /* ⚠️ ±100 IS THE ONE PRICE THAT CANNOT ROUND-TRIP, AND THAT IS ARITHMETIC
     RATHER THAN A BUG — even money is decimal 2.0 written two ways, so a
     conversion back has to pick one and +100 is the convention. The first cut
     of this law asserted the round-trip over ±100 and reported a fault in
     correct code, which is its own kind of failure: a law that cries wolf
     gets ignored, and this one would have gone off on every even-money leg. */
  if (LP._dec(100) !== 2 || LP._dec(-100) !== 2) fail('even money is not 2.0 in decimal');
  if (LP._amer(2) !== 100) fail('decimal 2.0 does not come back as +100');
  if (Math.abs(LP._dec(-110) - 1.909090909) > 1e-6) fail('−110 is not 1.9091 in decimal');
  if (Math.abs(LP._dec(150) - 2.5) > 1e-9) fail('+150 is not 2.5 in decimal');

  const R = ['McD', 'CC', 'Hurd', 'Hyman', 'Christel', 'Woods', 'Zach', 'Buley', 'Wolff', 'Riz', 'Slemp', 'Gotch'];
  const leg = (m, o, r) => ({ m, p: `${m} pick`, o, r });
  const FIX = [
    /* Week 1 — eleven land and one does not: the sole assassin. */
    { k: 1, l: 'Week 1', d: '2026-09-10', stake: 60,
      legs: R.map((m, i) => leg(m, i % 2 ? -110 : 120, m === 'Buley' ? 'L' : 'W')) },
    /* Week 2 — the whole thing lands, with a push in it. */
    { k: 2, l: 'Week 2', d: '2026-09-17', stake: 60,
      legs: R.map((m) => leg(m, -110, m === 'Wolff' ? 'P' : 'W')) },
    /* Week 3 — still running, nothing missed yet. */
    { k: 3, l: 'Week 3', d: '2026-09-24', stake: 60,
      legs: R.map((m, i) => leg(m, -140, i < 8 ? 'W' : undefined)) },
  ];

  const t1 = LP._ticket(FIX[0]), t2 = LP._ticket(FIX[1]), t3 = LP._ticket(FIX[2]);

  /* 🚨 A PUSH DROPS OUT OF THE PRICE AND DOES NOT KILL THE TICKET. Getting it
     wrong is silent in both directions: as a loss, a live parlay reads dead;
     left in the multiplication, every payout for the rest of the season is
     quietly too big. It is the one rule here that is not obvious from a slip. */
  if (t2.status !== 'cashed') fail(`a ticket of eleven wins and a push reads "${t2.status}" — a push is not a loss`);
  const want2 = Math.pow(LP._dec(-110), 11);
  if (Math.abs(t2.price - want2) > 1e-9) fail(`the push is still in the price: ${t2.price} against ${want2}`);
  if (t1.status !== 'dead') fail('one losing leg did not kill the ticket');
  if (t3.status !== 'live') fail('a ticket with legs still to come does not read as live');

  /* The price is the product of the legs, recomputed here rather than trusted. */
  const want1 = FIX[0].legs.reduce((a, g) => a * LP._dec(g.o), 1);
  if (Math.abs(t1.price - want1) > 1e-9) fail(`combined price is not the product of its legs: ${t1.price} against ${want1}`);
  if (Math.abs(t1.ret - 60 * t1.price) > 1e-9) fail('the payout is not the stake times the price');

  /* ⚠️ ONE LEG PER MANAGER PER WEEK. Two would double every count that
     manager appears in and would double-count a sole kill as two. */
  FIX.concat(file.weeks).forEach((w) => {
    const seen = {};
    (w.legs || []).forEach((g) => { seen[g.m] = (seen[g.m] || 0) + 1; });
    Object.keys(seen).filter((m) => seen[m] > 1)
      .forEach((m) => fail(`${w.l || w.k}: ${m} has ${seen[m]} legs on one ticket`));
  });

  /* Every leg belongs to somebody the app can name. An unknown code renders
     as the raw code rather than as a blank, which is visible — but it also
     means a typo would quietly attribute a bet to nobody. */
  const known = new Set(LHIST.roster().map((r) => r.m));
  file.weeks.forEach((w) => (w.legs || []).forEach((g) => {
    if (!known.has(g.m)) fail(`${w.l || w.k}: "${g.m}" is not a manager in this league`);
  }));

  /* 🚨 THE RECORDS ARE PER MANAGER, AND A SUMMED LAW WOULD BE BLIND TO THE
     LIKELIEST MISTAKE. Swap two managers' results inside one week and every
     total in the file is conserved — the fault the Cum Bowl points column hit
     in v67 and the bracket record hit in v51, arriving a third time in a new
     feature. So this recounts each manager's own legs out of the fixture and
     compares them to the row the tab prints for that manager. */
  const S2 = LP._season(FIX);
  R.forEach((m) => {
    const mine = [].concat(...FIX.map((w) => (w.legs || []).filter((g) => g.m === m)));
    const row = S2.rows.find((x) => x.m === m);
    if (!row) return fail(`${m} has legs on the ticket and no row in the table`);
    const w = mine.filter((g) => g.r === 'W').length, l = mine.filter((g) => g.r === 'L').length;
    const p = mine.filter((g) => g.r === 'P').length;
    if (row.legs !== mine.length || row.w !== w || row.l !== l || row.p !== p) {
      fail(`${m}'s record is ${row.w}-${row.l}-${row.p} from ${row.legs} legs, but their own legs are ${w}-${l}-${p} from ${mine.length}`);
    }
    /* A sole kill is only ever a week where exactly one leg lost. */
    const solo = FIX.filter((wk) => { const L = (wk.legs || []).filter((g) => g.r === 'L');
      return L.length === 1 && L[0].m === m; }).length;
    if (row.solo !== solo) fail(`${m} is credited with ${row.solo} sole kills against ${solo} in the data`);
  });
  if (!S2.rows.some((x) => x.solo === 1)) fail('the fixture has a one-leg bust and nobody is credited with it');

  /* The money is over SETTLED tickets only — a live one is not a loss yet. */
  if (S2.staked !== 120) fail(`staked reads ${S2.staked} over two settled tickets of 60 — a running ticket is not a loss yet`);
  if (Math.abs(S2.back - 60 * t2.price) > 1e-9) fail('the money back is not the cashed tickets times their price');

  /* ── what RENDERS, which is the only thing a reader gets (the v7 rule) ──
     A law that agrees with `_season` would go on passing over a view that had
     stopped reading it. */
  const strange = LP._html(FIX);
  [['undefined', /undefined/], ['NaN', /NaN/], ['[object', /\[object/],
   ['a code comment', /\/\*|\*\//]].forEach(([what, re]) => {
    if (re.test(strange)) fail(`the parlay view renders ${what}`);
  });
  if (strange.length < 1500) fail(`the parlay view is only ${strange.length} chars`);
  if (/YOU<\/span>/.test(strange)) fail('a reader who has picked nobody gets a YOU badge on somebody else\'s leg');

  /* 🚨 A RANK THAT IS SHARED MUST SAY SO (v58). Eleven of the twelve in the
     fixture have identical records, so array position would hand out 1st
     through 11th off nothing but sort order — the same value producing a
     different sentence depending on who is reading. */
  const tiedRows = S2.rows.filter((x) => x.tied);
  if (tiedRows.length < 2) fail('the fixture has managers on identical rates and none is marked as tied');
  tiedRows.forEach((x) => { const same = S2.rows.filter((y) => y.rate === x.rate);
    if (new Set(same.map((y) => y.rank)).size !== 1) fail(`${x.m} shares a rate and not a rank — that is array position, not a rank`); });
  if (!/>=\d/.test(strange)) fail('tied ranks render without the = that says they are joint');

  /* And the reader's own leg is lit, in second person, on the same markup. */
  LHIST.setMe('Buley');
  const mine = LP._html(FIX);
  if (!/YOU<\/span>/.test(mine)) fail('the reader\'s own leg is not badged YOU');
  if (!/Yours is the only one that missed/.test(mine)) fail('the sole-bust sentence does not read in second person for the reader');
  if (/Buley's is the only one/.test(mine)) fail('the reader is addressed by name where the app should say "you"');
  LHIST.setMe(null);

  /* 🚨 ALL TWELVE ARE ON THE RUNNING RECORD, WHETHER OR NOT THEY HAVE
     PICKED (v78). Built from the legs alone, this table listed whoever had
     happened to put one in — so somebody sitting the season out was simply
     ABSENT from the one card that is the league's year, and nothing on
     screen distinguished "no legs" from "not in the league". That is the v7
     coverage fault, so it gets v7's law: asserted off the RENDERED card, per
     manager BY NAME, never off `_season` — a law that agreed with the
     derivation would go on passing over a view that had stopped reading it. */
  const THIN = [{ k: 1, l: 'Week 1', d: '2026-09-10', stake: 60,
    legs: ['McD', 'CC', 'Woods'].map((m, i) => leg(m, -110, i ? 'W' : 'L')) }];
  const thinHTML = LP._html(THIN);
  R.forEach((m) => {
    if (thinHTML.indexOf(`>${LHIST.name(m)}<`) === -1) {
      fail(`${m} is not on the rendered season record — a manager with no legs must still have a row`);
    }
  });
  /* ⚠️ AND A ROW WITH NO LEGS PRINTS NO RECORD. "0-0" beside a name is the
     Lab's oldest rule broken on a new card (v1: a fabricated 0-0 is a lie),
     and it would read as a settled nought-and-nought rather than as somebody
     who has not been in. The sentence underneath says which. */
  if (!/has not had a leg on yet/.test(thinHTML)) {
    fail('a manager with no legs does not say so — the row is silent about why it is empty');
  }
  if (/>0-0</.test(thinHTML)) fail('a manager with no legs is printed as 0-0 — that is a record they have not got');
  /* ⚠️ THE ROW ORDER MUST BE TOTAL, AND THE ROSTER ROWS ARE WHAT MADE THAT
     REACHABLE. Week 1 of a season puts twelve UNRATED rows side by side, and
     the old comparator answered −1 whichever way round it was asked for two
     of them — the non-transitive `bySeed` fault (v62). A sort that is not a
     sort is silent: it simply comes out in an order that depends on the
     engine — and measured, the old one simply REVERSED the roster and never
     reached its own tiebreak at all, so the first week of a season would have
     ranked twelve people in an order nothing on the page could explain.
     ⚠️ The first cut of this law compared two derivations of the same input
     and passed over the broken comparator, because V8 sorts twelve items with
     an insertion sort that is deterministic even when the comparator is not.
     A law whose failure path cannot run is not a law (v39), so it asserts the
     order the rows must actually be IN: nobody is ranked, so they are by
     name, which is the one order a reader can account for. */
  const NONE = [{ k: 1, l: 'Week 1', d: '2026-09-10', legs: [] }];
  const order = LP._season(NONE).rows.map((x) => LHIST.name(x.m));
  const byName = order.slice().sort((a, b) => a.localeCompare(b));
  if (order.length !== R.length || order.join(',') !== byName.join(',')) {
    fail(`twelve unrated rows come out as "${order.join(',')}" rather than in name order — that is not a sort, it is input order`);
  }

  /* 🚨 A STATED `open` IS ONLY HONOURED WHILE IT IS AHEAD OF THE SEASON
     (v78). `open` is the one hand-kept field on this tab and it goes stale in
     two directions, both silent — and the season it goes stale in is this
     one, because week 1 takes no ticket at all, so nothing published can
     advance it. Reproduced on the render before it was fixed: tickets
     through week 5 with `open` still on week 1 offered week 1's picks, with
     week 1's board, under a ticket card reading Week 5. */
  const PLAYED = [{ k: 2, l: 'Week 2', legs: [leg('McD', -110, 'W')] },
    { k: 3, l: 'Week 3', legs: [leg('McD', -110, 'W')] }];
  const STALE = { open: { k: 1, l: 'Week 1', games: [{ a: 'TB', h: 'CIN' }] }, weeks: PLAYED };
  const owStale = LP._open(STALE, PLAYED);
  if (!owStale || owStale.k !== 4) {
    fail(`an \`open\` behind the newest ticket gives week ${owStale && owStale.k} — picks would be taken at games already played`);
  }
  /* ⚠️ AND THE BOARD DOES NOT TRAVEL WITH IT. Once the stated week is
     overtaken its games belong to a week that has been played, so handing
     them to the next week would put last month's fixtures under this week's
     heading — worse than no board, which renders the prop field and says so. */
  if (owStale && owStale.games.length) {
    fail('the overtaken week\'s board was carried into the derived week — those games have been played');
  }
  /* The documented symptom this also ends: `open` left sitting ON the week
     just published used to return null and the pick card VANISHED. */
  const onPub = LP._open({ open: { k: 3, l: 'Week 3' }, weeks: PLAYED }, PLAYED);
  if (!onPub || onPub.k !== 4) fail('an `open` on the week just published leaves no week open — the pick card vanishes');
  /* And a stated week that is genuinely ahead is still honoured, board and
     all — a guard that always derived would "fix" this by deleting the one
     field that makes the first week of a season possible. */
  const AHEAD = { open: { k: 9, l: 'Week 9', games: [{ a: 'TB', h: 'CIN' }] }, weeks: PLAYED };
  const owAhead = LP._open(AHEAD, PLAYED);
  if (!owAhead || owAhead.k !== 9 || owAhead.l !== 'Week 9' || owAhead.games.length !== 1) {
    fail('a stated `open` ahead of the season is not honoured with its own board — the first week of a season needs it');
  }
  /* With no tickets at all the stated week is all there is, which is exactly
     where this season starts. */
  const owFirst = LP._open({ open: { k: 2, l: 'Week 2', games: [] } }, []);
  if (!owFirst || owFirst.k !== 2) fail('with no tickets published the stated open week is not honoured');

  /* Four opposite facts, four sentences — and a missing one is a hole rather
     than a quiet fall-through to the friendly copy. */
  const said = {};
  ['none', 'missing', 'offline', 'bad'].forEach((k) => {
    const h = LP._empty(k);
    if (!h || h.length < 120) return fail(`the "${k}" state has no sentence of its own`);
    if (said[h]) fail(`the "${k}" state says the same thing as "${said[h]}"`);
    said[h] = k;
  });


  /* ══ 🎯 PICKS: TWELVE PHONES, ONE TICKET, NO BACKEND ═══════════════════
     A pick travels as a payload in a link through the group chat. Everything
     below is about that trip: it has to survive a phone keyboard, it has to
     refuse a leg that would go on the ticket wrong, and it must never put the
     word "You" in a message eleven other people read. */
  const R2 = LHIST.roster().map((r) => r.m);

  /* 🚨 UTF-8 BEFORE base64. `btoa` is Latin-1 only and a bet is free text off
     a phone — one emoji, one curly quote, one em-dash and it throws. */
  [{ v: 1, k: 4, m: 'McD', p: 'Eagles -3.5 vs Cowboys', o: -110, t: 1 },
   { v: 1, k: 4, m: 'Buley', p: 'Saquon 75+ — “lock” 🦅 ½ unit', o: 145, t: 2 }].forEach((p) => {
    let back;
    try { back = LP._dec64(LP._enc64(p)); } catch (e) { return fail(`a pick with "${p.p}" would not encode: ${e.message}`); }
    if (JSON.stringify(back) !== JSON.stringify(p)) fail(`a pick did not survive the round trip: ${JSON.stringify(back)}`);
  });
  if (/[+/=]/.test(LP._enc64({ a: 'ÿÿÿÿ?>?>' }))) fail('the payload is not base64URL — it will not survive being a link');

  /* 🚨 THE OPEN WEEK IS DERIVED, AND A PLACED WEEK IS CLOSED. Picking for a
     week whose ticket is already at a book is picking after kickoff. */
  const ow4 = LP._open({}, [{ k: 1 }, { k: 2 }, { k: 3 }]);
  if (!ow4 || ow4.k !== 4) fail(`picks after three tickets should open week 4, got ${JSON.stringify(ow4)}`);
  /* ⚠️ THIS LAW ASSERTED THE OLD ANSWER AND NOW ASSERTS THE PROPERTY (v78),
     which is the v42 trap handled rather than walked into. It required
     `_open` to return NULL for a week that had a ticket — true of the code
     and never the invariant, and the pick card simply vanishing is a symptom
     CLAUDE.md used to document as something to edit around. The permanent
     fact is the one worth holding: a week that has been bet is never the
     open week, whatever is written in `open`. */
  const PLAYED3 = [{ k: 1 }, { k: 2 }, { k: 3 }];
  [{ k: 1 }, { k: 2 }, { k: 3 }].forEach((o) => {
    const ow = LP._open({ open: o }, PLAYED3);
    if (ow && PLAYED3.some((w) => w.k === ow.k)) fail(`week ${ow.k} has a ticket at a book and is open for picks`);
    if (!ow || ow.k !== 4) fail(`a stale open on week ${o.k} gives ${ow && ow.k} rather than the next week, 4`);
  });
  if (LP._open({}, []) !== null) fail('with no tickets and no stated week, picks must be closed rather than guessed');
  /* The board has to survive being resolved into a week — dropping it renders
     a page that looks complete and has no board on it. */
  const owB = LP._open({ open: { k: 1, l: 'Week 1', games: [{ a: 'DAL', h: 'PHI', sp: { h: -3, a: 3 } }] } }, []);
  if (!owB || !owB.games || owB.games.length !== 1) fail('the week\'s board was dropped on the way to the view');
  LHIST.setMe('Buley');
  if (!LP._pickHTML(owB).includes('data-lp="opt"')) fail('a week that has a board rendered no lines to tap');
  LHIST.setMe(null);
  /* 🚨 A SAVED PICK BELONGS TO A PERSON, SO SWITCHING NAMES MUST NOT INHERIT
     ONE (v82). `lh:pick` was keyed by WEEK alone, and "you" is a ROLE here —
     any of the twelve can read as any other — so tapping a different name on
     the picker handed that device's saved bet to the new reader as their
     own: "your pick is in" over somebody else's leg, above a who-card
     listing that same reader under "Still to pick". It was not only a
     viewing fault, which is why it gets a law rather than a tidy-up: `edit`
     and `save` write to `LH.me()`'s row, so changing an inherited pick would
     have put one manager's bet on the shared list under another's name, and
     `drop` would have cleared the real owner's pick off their own phone
     while their row stayed on the ticket.
     ⚠️ ASSERTED OFF THE RENDERED CARD, never off `myPick` — the v7 rule. A
     law that agreed with the resolver would go on passing over a view that
     had stopped consulting it, and the rendered card is where the owner saw
     this. Both directions, because a resolver that always said "not yours"
     would "fix" this by never showing anybody their own pick. */
  const owP = LP._open({ open: { k: 1, l: 'Week 1', games: [{ a: 'DAL', h: 'PHI', sp: { h: -3, a: 3 } }] } }, []);
  const pickOf = (me, stored, rows) => {
    /* The shared list only exists when `sync` does, so the fixture has to
       stand the store up — without it `syncOn()` is false, every ownerless
       pick is the reader's by default and the whole law passes vacuously.
       (It did, first time round, and said so.) */
    LP._file({ sync: 'https://nectars-bologna-default-rtdb.firebaseio.com' });
    LP._picks(rows ? { k: 1, rows, at: Date.now() } : null);
    if (stored) localStorage.setItem('lh:pick', JSON.stringify(stored));
    else localStorage.removeItem('lh:pick');
    LHIST.setMe(me);
    const h = LP._pickHTML(owP);
    LHIST.setMe(null);
    return { h, mine: /your pick is in/.test(h), board: h.includes('data-lp="opt"') };
  };
  const OWNED_P = { k: 1, m: 'McD', p: 'BUF ML vs DET', o: -166, at: 1 };
  const LEGACY_P = { k: 1, p: 'BUF ML vs DET', o: -166, at: 1 };
  const ROWS_P = { McD: { p: 'BUF ML vs DET', o: -166, t: 1 } };
  const owned = pickOf('Hurd', OWNED_P, ROWS_P);
  if (owned.mine) fail('reading as another manager showed McD\'s saved pick as the reader\'s own');
  if (!owned.board) fail('a reader with no pick of their own was not offered the board');
  const his = pickOf('McD', OWNED_P, ROWS_P);
  if (!his.mine) fail('a manager\'s own saved pick did not render as theirs — the guard says no to everybody');
  /* A pick saved BEFORE v82 records no owner, and the shared list is what
     says whose it is: a matching row under somebody else makes it not the
     reader's, a matching row under the reader makes it theirs, and a pick on
     no row at all never got out — which is the one state the chat box is
     for, so it must survive. */
  const legacyOther = pickOf('Hurd', LEGACY_P, ROWS_P);
  if (legacyOther.mine) fail('an ownerless pick that matches McD\'s row on the shared list was handed to Hurd');
  if (!pickOf('McD', LEGACY_P, ROWS_P).mine) fail('an ownerless pick that matches the reader\'s own row was taken off them');
  const unsent = pickOf('Hurd', { k: 1, p: 'SEA -3 vs ARI', o: -110, at: 1 }, ROWS_P);
  if (!unsent.mine) fail('an ownerless pick on nobody\'s row was dropped — a failed write must still leave the pick and its chat line');
  if (!/data-lp="send"/.test(unsent.h)) fail('a pick that never reached the shared list offered no way to send it');
  /* And a pick that IS up wears no chat box — v74's whole point, and the
     state the owner thought he was looking at. */
  if (/data-lp="send"/.test(his.h)) fail('a pick that is on the shared list still offered the chat box');
  localStorage.removeItem('lh:pick'); LP._reset();

  const ow1 = LP._open({ open: { k: 1, l: 'Week 1' } }, []);
  if (!ow1 || ow1.k !== 1) fail('a stated open week was not honoured');
  if (LP._open({ open: { k: 9 } }, [{ k: 1 }, { k: 2 }]).k !== 9) fail('a stated open week must beat the derived one');

  /* Four ways a leg is refused, and each sends the collector somewhere else. */
  [[{ m: 'Nobody', o: -110, p: 'x' }, 'who'],
   [{ m: 'McD', o: 12, p: 'x' }, 'odds'],
   [{ m: 'McD', o: -110, p: '   ' }, 'empty'],
   [null, 'bad']].forEach(([p, want]) => {
    const got = LP._check(p);
    if (got !== want) fail(`a pick that should be refused as "${want}" came back "${got}"`);
  });
  ['-110', '−110', ' +150 ', '1,200'].forEach((t) => {
    if (!isFinite(LP._odds(t))) fail(`"${t}" is a price a phone produces and it was refused`);
  });
  if (isFinite(LP._odds('evens'))) fail('"evens" is not a price and was accepted');
  /* ⚠️ A phone's minus is U+2212 as often as a hyphen, and reading it as a
     PLUS would silently invert the leg — the sign is the whole bet. */
  if (LP._odds('−110') !== -110) fail('a typographic minus did not read as negative');

  /* 🚨 A PICK FOR ANOTHER WEEK NEVER JOINS THIS TICKET. */
  const mk = (o) => LP._enc64(Object.assign({ v: 1, k: 4, m: 'McD', p: 'Eagles -3.5', o: -110, t: 1 }, o));
  if (LP._takeOne(mk({ k: 9 }), 4) !== 'week') fail('a pick for a different week was accepted onto the ticket');

  /* 🚨 TWO PICKS FROM ONE MANAGER IS REPORTED, AND THE LATER ONE WINS.
     Silently taking one of them is how a leg nobody meant reaches a book. */
  localStorage.removeItem('lh:tick');
  if (LP._takeOne(mk({ t: 10, p: 'first bet' }), 4) !== 'ok') fail('the first pick did not go on');
  if (LP._takeOne(mk({ t: 20, p: 'second bet' }), 4) !== 'dupe') fail('a second pick from one manager was not reported as a duplicate');
  let box = JSON.parse(localStorage.getItem('lh:tick'));
  if (box.legs.length !== 1) fail(`one manager produced ${box.legs.length} legs on the ticket`);
  if (box.legs[0].p !== 'second bet') fail('the later pick did not win');
  if (LP._takeOne(mk({ t: 5, p: 'stale bet' }), 4) !== 'dupe' ||
      JSON.parse(localStorage.getItem('lh:tick')).legs[0].p !== 'second bet') {
    fail('an OLDER pick overwrote a newer one');
  }

  /* The whole chat pasted in at once: it finds every payload and ignores the
     prose, which is most of what a group chat is. */
  localStorage.removeItem('lh:tick');
  const chat = R2.slice(0, 5).map((m, i) =>
    `Week 4 parlay — ${LHIST.name(m)}: bet ${i} (-110)\nhttps://x.test/#p=${LP._enc64({ v: 1, k: 4, m, p: `bet ${i}`, o: -110, t: i })}`)
    .join('\nlol nice\n') + '\nwho else is in';
  const many = LP._takeMany(chat, 4);
  if (many.ok !== 5) fail(`five picks pasted out of a chat, ${many.ok} added`);
  box = JSON.parse(localStorage.getItem('lh:tick'));
  if (box.legs.length !== 5) fail(`the collection holds ${box.legs.length} legs, not five`);
  /* PER MANAGER, not a count — a count cannot see whose bet it kept (v66). */
  box.legs.forEach((leg) => {
    const want = `bet ${R2.indexOf(leg.m)}`;
    if (leg.p !== want) fail(`${leg.m}'s leg reads "${leg.p}" and their pick was "${want}"`);
  });
  if (LP._takeMany('just chatting, no links here', 4).none !== true) fail('a paste with no picks in it did not say so');

  /* 🚨 THE COLLECTED TICKET MUST BE A TICKET THE ENGINE ACCEPTS. The blob the
     collector sends is the same shape a published week is, or publishing it
     is a second format that only looks like the first. */
  const asm = LP._ticket({ k: 4, l: 'Week 4', legs: box.legs });
  if (asm.legs.length !== 5 || !(asm.price > 1)) fail('the collected legs do not assemble into a priced ticket');
  if (asm.status !== 'live') fail(`a ticket of unsettled legs reads "${asm.status}" rather than live`);

  /* ── what the pick card RENDERS, per reader (the v7 rule) ────────────── */
  localStorage.removeItem('lh:pick');
  LHIST.setMe(null);
  const strangerPick = LP._pickHTML({ k: 4, l: 'Week 4' });
  if (!/data-pickme/.test(strangerPick)) fail('a reader with no name is not offered the picker on the pick card');
  if (/id="lp-bet"/.test(strangerPick)) fail('a reader with no name is shown a pick form their leg cannot belong to');

  LHIST.setMe('Buley');
  if (!/id="lp-bet"/.test(LP._pickHTML({ k: 4, l: 'Week 4' }))) fail('a reader who has picked a name gets no pick form');
  localStorage.setItem('lh:pick', JSON.stringify({ k: 4, p: 'Bills -7', o: -115, at: 1 }));
  const mineHTML = LP._pickHTML({ k: 4, l: 'Week 4' });
  /* 🚨 THE SHARED LINE CARRIES THE REAL NAME. `nm()` answers "You" for
     whoever holds the phone, and this string is read by the other eleven in
     a group chat — the v33 byline bug, one feature over. */
  if (!/Buley: Bills -7/.test(mineHTML)) fail('the shared pick line does not name the manager it belongs to');
  if (/&gt;?You: /.test(mineHTML) || /— You:/.test(mineHTML)) fail('the shared pick line says "You" — eleven other people read it');
  if (!/#p=/.test(mineHTML)) fail('the shared pick line carries no payload');
  /* A saved pick belongs to ITS week and must not be restored into the next
     one — the `powerlab:draft` rule, where a stale draft is worse than none. */
  if (/Bills -7/.test(LP._pickHTML({ k: 5, l: 'Week 5' }).replace(/placeholder="[^"]*"/g, ''))) {
    fail("last week's pick was restored into a new week");
  }
  localStorage.removeItem('lh:pick');

  /* ══ 🏈 THE BOARD: TAPPED, AND THE TEXT DERIVED FROM IT ════════════════
     The point of an option is not the tap, it is that the LINE IS WRITTEN BY
     THE BOARD. Twelve people typing "Eagles -3.5" / "PHI -3.5" / "philly -3½"
     produce twelve spellings of one bet and nothing downstream can tell they
     are the same. */
  const G = { a: 'DAL', h: 'PHI', sp: { h: -3.5, hp: -118, a: 3.5, ap: -102 },
    ml: { h: -170, a: 145 }, tot: { n: 47.5, op: -108, up: -112 } };
  const opts = LP._options(G);
  if (opts.length !== 6) fail(`a full game should offer six lines, offered ${opts.length}`);
  opts.forEach((o) => {
    /* Through the module's OWN gate, not a copy of it here — a second
       implementation of "is this a price" is a second thing to keep true. */
    if (LP._check({ m: 'McD', p: o.p, o: o.o }) !== 'ok') fail(`the "${o.lab}" option makes a leg the pipeline refuses`);
    if (!o.p.includes(G.a) || !o.p.includes(G.h)) fail(`"${o.p}" does not name both teams, so it cannot be read back to a game`);
  });
  if (new Set(opts.map((o) => o.p)).size !== opts.length) fail('two lines on one game write the same bet');
  /* The two sides of a spread are opposites, or one of them is a free bet. */
  const sa = opts.find((o) => o.id === 'sa'), sh = opts.find((o) => o.id === 'sh');
  if (!/\+3\.5/.test(sa.p) || !/-3\.5/.test(sh.p)) fail(`the spread sides are not opposites: "${sa.p}" against "${sh.p}"`);
  /* ⚠️ A half-posted board is normal — a total up before a spread — and half
     a game is still worth showing. What must never render is a button for a
     market that has no price behind it. */
  if (LP._options({ a: 'NYJ', h: 'BUF', tot: { n: 41 } }).length !== 2) fail('a game with only a total did not offer exactly the two totals');
  if (LP._options({ a: 'NYJ', h: 'BUF', ml: { h: -110 } }).length !== 0) fail('a one-sided moneyline still produced buttons');
  if (LP._options({ sp: { h: -3, a: 3 } }).length !== 0) fail('a game with no teams produced options');
  /* 🚨 EACH SIDE KEEPS ITS OWN PRICE. Pricing both at -110 puts a leg on the
     ticket at a number the book is not offering — and the real board is
     asymmetric on most games. */
  if (sa.o === sh.o) fail('both sides of the spread were priced the same when the board prices them differently');
  if (sa.o !== -102 || sh.o !== -118) fail(`the spread juice was not carried through: ${sa.o} / ${sh.o}`);
  if (LP._options({ a: 'A', h: 'B', sp: { h: 0, a: 0 } })[0].lab !== 'A PK') fail('a pick\'em renders as a number rather than PK');

  /* ══ ESPN'S OWN BOARD, READ OFF A REAL CAPTURE ═════════════════════════
     Written against the payload the owner pasted, not against memory — the
     v39 rule. `fixtures/espn-nfl-scoreboard.json` holds four of its events
     verbatim, including both of the ones that make this hard. */
  const cap = JSON.parse(fs.readFileSync('./fixtures/espn-nfl-scoreboard.json', 'utf8'));
  const board = LP._board(cap);
  /* 🚨 A GAME THAT HAS KICKED OFF IS NOT PICKABLE, AND THE WEEK CONTAINS
     THEM. The real week 1 carries two FINAL games beside fourteen still to
     play; offering a bet on one whose score is in the same payload is the
     worst thing this board could do. */
  if (board.length !== 2) fail(`the board kept ${board.length} of the capture's games — the two FINAL ones must be dropped`);
  ['SEA', 'LAR', 'NE', 'SF'].forEach((t) => {
    if (board.some((g) => g.a === t || g.h === t)) fail(`${t} played a game that is already FINAL and it is still on the board`);
  });
  const cin = board.find((g) => g.h === 'CIN'), ind = board.find((g) => g.h === 'IND');
  if (!cin || !ind) fail('the capture\'s two live games did not both come through');
  else {
    /* Every number below was read off the paste by hand and must come back
       out of the transform unchanged. */
    const want = { h: -3.5, hp: -118, a: 3.5, ap: -102 };
    Object.keys(want).forEach((k) => {
      if (cin.sp[k] !== want[k]) fail(`TB at CIN spread ${k} came back ${cin.sp[k]}, the capture says ${want[k]}`);
    });
    if (cin.ml.h !== -205 || cin.ml.a !== 170) fail(`TB at CIN moneyline came back ${cin.ml.h}/${cin.ml.a}, the capture says -205/+170`);
    if (cin.tot.n !== 50.5 || cin.tot.op !== -108 || cin.tot.up !== -112) fail('TB at CIN total did not survive the transform');
    /* 🚨 THE AWAY TEAM IS THE FAVOURITE IN THIS ONE, which is where a
       transform that assumes the home side is laying points goes wrong: the
       capture reads "BAL -3.5" while `spread` is +3.5, because the sign is
       relative to the HOME team. */
    if (ind.sp.h !== 3.5 || ind.sp.a !== -3.5) fail(`an away favourite came out backwards: home ${ind.sp.h}, away ${ind.sp.a}`);
    if (ind.ml.a !== -175 || ind.ml.h !== 145) fail('the away favourite\'s moneyline came out backwards');
    const io = LP._options(ind);
    if (!io.some((o) => o.p === 'BAL -3.5 at IND')) fail('the away favourite does not render as laying the points');
    if (!io.some((o) => o.p === 'IND +3.5 vs BAL')) fail('the home underdog does not render as taking them');
  }
  /* `close` before `open`: both are in the payload for every market and they
     differ. The open price is what was available yesterday. */
  if (cin && cin.sp.hp === -110) fail('the OPEN price was taken where a CLOSE price exists');
  if (LP._board({}).length || LP._board({ events: 'nope' }).length) fail('a payload that is not a scoreboard produced games');

  /* And the board that ships must itself be pickable. */
  const shipped = JSON.parse(fs.readFileSync('./parlay/current.json', 'utf8'));
  const shippedGames = (shipped.open && shipped.open.games) || [];
  shippedGames.forEach((g) => {
    const o = LP._options(g);
    if (!o.length) fail(`the shipped board's ${g.a} at ${g.h} offers nothing to tap`);
    o.forEach((x) => { if (LP._check({ m: 'McD', p: x.p, o: x.o }) !== 'ok') fail(`the shipped board makes a leg the pipeline refuses: ${x.p}`); });
  });

  /* A tapped line has to survive all the way onto a ticket. */
  LHIST.setMe('Buley');
  localStorage.removeItem('lh:pick');
  const OWG = { k: 4, l: 'Week 4', games: [G] };
  LP._sel({ g: 0, id: 'sh' });
  const boardHTML2 = LP._pickHTML(OWG);
  if (!/PHI -3\.5 vs DAL/.test(boardHTML2)) fail('a tapped line is not shown back as the pick it makes');
  if ((boardHTML2.match(/data-lp="opt"/g) || []).length !== 6) fail('the board did not render a button per line');
  if (!/aria-pressed="true"/.test(boardHTML2)) fail('the chosen line is not marked as chosen for a screen reader');
  const asTicket = LP._ticket({ k: 4, l: 'Week 4', legs: [{ m: 'Buley', p: sh.p, o: sh.o }] });
  if (!(asTicket.price > 1)) fail('a tapped line does not price as a leg');
  LP._sel(null);
  /* With no board there is still a way in — the prop field, open by itself,
     because it is then the only door. */
  const noBoard = LP._pickHTML({ k: 4, l: 'Week 4' });
  if (!/id="lp-bet"/.test(noBoard)) fail('with no board there is no way to enter a pick at all');
  if (!/<details class="lp-prop" open/.test(noBoard)) fail('with no board the prop field is closed, so the only way in is hidden');
  if (/data-lp="opt"/.test(noBoard)) fail('a board with no games still rendered option buttons');

  /* 🚨 A BOARD IS GAMES YOU CAN BET, NOT GAMES ESPN KNOWS ABOUT (v79).
     ESPN lists a week's fixtures as soon as the schedule exists and prices
     them only when the books do, so every week has a window — days long —
     where the payload is all games and no markets. Every gate counted GAMES,
     so the card said "Tap a line below" over an empty board with the
     write-it-in field folded shut: a control named in a sentence and absent
     from the page (the v30 fault), in the state the tab sits in most of the
     week. This is the same law as the one above, for the case that is not
     "no games" and is not "a board" either. */
  const UNPRICED = { k: 4, l: 'Week 4', games: [
    { a: 'WSH', h: 'GB', kick: '2026-09-20T17:00Z' },
    { a: 'NYG', h: 'DAL', kick: '2026-09-20T17:00Z' }] };
  const dry = LP._pickHTML(UNPRICED);
  if (/data-lp="opt"/.test(dry)) fail('a week whose games carry no odds rendered option buttons');
  if (/class="lp-board"/.test(dry)) fail('an unpriced week still rendered a board container — an empty box with no explanation');
  if (/Tap a line below/.test(dry)) fail('the card says "Tap a line below" with no line on the page to tap');
  if (!/<details class="lp-prop" open/.test(dry)) fail('an unpriced week leaves the prop field shut — the only way in is hidden');
  if (/Lines as published|Lines from/.test(dry)) fail('an unpriced week claims a source for lines it has not got');
  if (!/lines are not posted yet/.test(dry)) fail('an unpriced week does not say why there is nothing to tap');
  /* ⚠️ AND THE NOTE IS GATED THE SAME WAY, asserted through its own helper —
     four gates asking one question four ways is how three agree and one
     does not. */
  if (LP._note(UNPRICED) !== '') fail('the board note speaks for a week with no lines in it');

  /* 🚨 AN OPTION IS KEYED BY ITS INDEX INTO THE WHOLE WEEK, NEVER INTO
     THE PRICED SUBSET. A pick travels as `{g, id}` and resolves back through
     `gamesOf`, so renumbering around an unpriced fixture would point a saved
     tap at a DIFFERENT GAME — silently, and only for the weeks where some
     games are priced and some are not, which is every week for a day or two.
     Asserted by reading the rendered buttons back against the week they came
     from, on a board deliberately built with the gaps at 0 and 2. */
  const MIXED = { k: 4, l: 'Week 4', games: [
    { a: 'WSH', h: 'GB', kick: '2026-09-20T17:00Z' },
    { a: 'NYG', h: 'DAL', kick: '2026-09-20T17:00Z', sp: { h: -3.5, hp: -118, a: 3.5, ap: -102 } },
    { a: 'SEA', h: 'PIT', kick: '2026-09-20T17:05Z' },
    { a: 'LAR', h: 'TEN', kick: '2026-09-20T20:25Z', ml: { h: 145, a: -175 } }] };
  const mixHTML = LP._pickHTML(MIXED);
  const optBtns = mixHTML.match(/data-g="(\d+)" data-o="([a-z]+)"/g) || [];
  if (optBtns.length !== 4) fail(`a half-priced week rendered ${optBtns.length} lines against the 4 its two priced games carry`);
  optBtns.forEach((b) => {
    const m = b.match(/data-g="(\d+)" data-o="([a-z]+)"/);
    const g = MIXED.games[Number(m[1])];
    if (!g) return fail(`an option points at game ${m[1]}, which is not in the week`);
    if (!LP._options(g).some((o) => o.id === m[2])) {
      fail(`an option says ${m[2]} on game ${m[1]} (${g.a} @ ${g.h}), which does not offer it — the buttons are renumbered around the unpriced games`);
    }
  });
  /* And the tap resolves to the line the button names, on the HIGH index —
     the one an off-by-n would move. */
  LP._sel({ g: 3, id: 'mh' });
  if (!/TEN ML vs LAR/.test(LP._pickHTML(MIXED))) fail('a tap on the last priced game does not resolve to its own line');
  LP._sel(null);

  /* 🚨 AND THE PAGE STILL CARRIES THE CARDS IT ALREADY HAD. A second function
     declaration of the same name silently WINS in the same scope, which is
     how the "Who carries the ticket" leaderboard vanished when the game board
     was added — nothing threw, and the tie law caught it by accident. */
  const full = LP._html(FIX);
  ['Who carries the ticket', 'The season so far'].forEach((h) => {
    if (!full.includes(h)) fail(`the parlay page has lost its "${h}" card`);
  });

  /* 🚨 THE PARLAY REPAINTS AFTER THE SHELL BUILDS ITS QUICK-NAV. Shared-pick
     and live-board answers both replace the host's innerHTML, so ids assigned
     by buildJump() to the old heading nodes disappear. The visible buttons
     then point at nothing. Every parlay heading owns a stable id instead, and
     the same id must survive different render states. */
  const sectionIds = (h) => [...String(h).matchAll(/<h2 class="section-title" id="([^"]+)"/g)].map((m) => m[1]);
  const stableSections = [
    LP._pickHTML({ k: 4, l: 'Week 4' }),
    LP._whoHTML({ k: 4, l: 'Week 4' }),
    full,
    LP._empty('offline'),
  ].flatMap(sectionIds);
  if (new Set(stableSections).size !== stableSections.length) fail('two parlay sections share a quick-nav destination id');
  const parlaySrc = fs.readFileSync('./parlay.js', 'utf8');
  const declaredSections = new Set([...parlaySrc.matchAll(/class="section-title" id="([^"]+)"/g)].map((m) => m[1]));
  ['pick', 'who', 'ticket', 'season', 'records', 'history', 'empty'].forEach((id) => {
    if (!declaredSections.has(`lp-sec-${id}`)) fail(`the parlay's ${id} section has no stable quick-nav destination`);
  });
  if (declaredSections.size !== 7) fail(`the parlay declares ${declaredSections.size} quick-nav destinations instead of 7`);
  if ((parlaySrc.match(/class="section-title"(?! id=)/g) || []).length) {
    fail('a parlay section heading has no stable id — a live repaint would strand its quick-nav button');
  }

  /* 🚨 A STATUS LINE BELONGS TO ONE CARD. One shared string rendered into
     every `.lp-say` printed "Saved. Send it to the chat" under the collector
     as well as under the pick — one event reported twice, the second time
     about something the reader never did. Only a render showed it. */
  LP.take(mk({ m: 'Wolff', t: 99 }));
  const notes = (h) => (h.match(/class="lp-say"[^>]*>([^<]*)</g) || []).filter((x) => !/>\s*</.test(x));
  if (notes(LP._collectHTML({ k: 4, l: 'Week 4' })).length !== 1) fail('the collector did not report what it just did');
  if (notes(LP._pickHTML({ k: 4, l: 'Week 4' })).length !== 0) {
    fail('a note raised by the collector is also printed on the pick card');
  }

  [['pick card', mineHTML], ['collector', LP._collectHTML({ k: 4, l: 'Week 4' })]].forEach(([what, h]) => {
    if (/undefined|NaN|\[object/.test(h)) fail(`the ${what} has a template hole`);
    if (/\/\*|\*\//.test(h)) fail(`the ${what} renders a code comment`);
  });

  /* ── 👥 THE SHARED PICKS ────────────────────────────────────────────────
     🚨 THE FIRST WRITE THIS APP HAS EVER DONE, SO THE FIRST LAW IS THAT IT
     IS OFF. `sync` ships blank; with it blank the tab must be byte-for-byte
     the app it was before the feature existed, because that is the whole
     safety argument — the store is an upgrade over the chat path and never a
     dependency of it. */
  /* 🚨 THE SHIPPED FILE MUST NEVER CARRY A SECRET, AND THIS IS THE LAW THAT
     OUTLIVES THE FEATURE. The repo is PUBLIC. A Firebase console offers an
     apiKey, a databaseSecret, a whole config object and a service account,
     none of which this app needs — the design is that the one thing committed
     is a URL that grants exactly what the published rules grant. A token in
     here would be readable by anyone, for ever, including after it is
     deleted from the tip. */
  const shippedTxt = fs.readFileSync('./parlay/current.json', 'utf8');
  [[/api[_-]?key/i, 'an API key'], [/databaseSecret/i, 'a database secret'],
    [/private[_-]?key/i, 'a private key'], [/serviceAccount/i, 'a service account'],
    [/client[_-]?secret/i, 'a client secret'], [/Bearer\s/i, 'a bearer token'],
    [/AIza[0-9A-Za-z_-]{10,}/, 'a Google API key'],
  ].forEach(([re, what]) => {
    if (re.test(shippedTxt)) fail(`parlay/current.json looks like it carries ${what} — this repo is PUBLIC and the store needs no credential`);
  });

  /* 🚨 AND IF `sync` IS SET IT MUST ACTUALLY RESOLVE. ⚠️ This REPLACED a law
     asserting the file ships BLANK, which was true of v73's release and was
     never an invariant — the owner turned the store on the same day, and a
     law that encodes the old design fails at exactly the moment the design
     changes (the v42 lesson). What matters is not whether it is on, it is
     that ON means on: `syncBase` refuses a URL with a path, a trailing
     scheme slip or plain http, and it refuses SILENTLY — the tab would look
     exactly like the chat-path app while somebody believed the store was
     live. So a set-but-unusable `sync` is a fault, and blank is fine. */
  const shippedSync = String(shipped.sync || '').trim();
  if (shippedSync && !LP._syncBase(shipped)) {
    fail(`parlay/current.json sets sync to "${shippedSync}" and syncBase refuses it — the shared picks would be silently off (https, no path, no trailing slash)`);
  }

  /* 🚨 AND WITH IT BLANK THE TAB IS STILL THE APP IT WAS. That is the whole
     safety argument for having written a WRITE at all: the store is an
     upgrade over the chat path and never a dependency of it, so deleting one
     line has to put v72 back exactly. Asserted against a blank file rather
     than against the shipped one, so it keeps testing that after the store
     is switched on. */
  LP._reset();
  LP._file(Object.assign({}, shipped, { sync: '' }));
  if (LP._syncBase({ sync: '' })) fail('a blank sync still resolves to a store URL');
  if (LP._whoHTML({ k: 4, l: 'Week 4' }) !== '') fail('the "who is in" card renders with no store configured');
  if (!/travel through the group chat/.test(LP._howto())) fail('with no store the tab does not say picks travel through the chat');
  if (/data-lp="pull"/.test(LP._collectHTML({ k: 4, l: 'Week 4' }))) fail('the collector offers to pull from a store that is not configured');

  /* ⚠️ A URL that is nearly right is the same fact as no URL, and it must not
     produce something the app then fetches forever. */
  [['', 'blank'], ['   ', 'whitespace'], ['http://x.firebaseio.com', 'plain http'],
    ['https://x.firebaseio.com/picks', 'a path'], ['ftp://x', 'a wrong scheme'],
    ['x.firebaseio.com', 'no scheme'], [null, 'null'], [{}, 'an object'],
  ].forEach(([v, what]) => {
    if (LP._syncBase({ sync: v })) fail(`${what} was accepted as a store URL`);
  });
  ['https://x-default-rtdb.firebaseio.com', 'https://x-default-rtdb.firebaseio.com/',
    'https://x-default-rtdb.europe-west1.firebasedatabase.app',
  ].forEach((v) => {
    const b = LP._syncBase({ sync: v });
    if (b !== v.replace(/\/+$/, '')) fail(`a real store URL was refused or mangled: ${v} → ${b}`);
    if (/\/$/.test(b)) fail('a trailing slash survived, so every path would be doubled');
  });

  const SB = 'https://lh-test-default-rtdb.firebaseio.com';
  LP._file({ weeks: [], open: { k: 4, l: 'Week 4' }, sync: SB });

  /* 🚨 EVERY ROW IS UNTRUSTED INPUT AND GOES THROUGH THE SAME `checkPick` A
     PASTED LINK GOES THROUGH. The store is world-writable by design — the
     URL is in a public repo — so a row can be anything at all, and a junk one
     must be dropped and counted rather than rendered, thrown over, or quietly
     put on a ticket somebody is about to pay for. */
  const ROWS = {
    Buley: { p: 'Bills -7', o: -110, t: 10 },
    Wolff: { p: 'Over 47.5', o: -115, t: 20 },
    Nobody: { p: 'Jets ML', o: 250, t: 30 },
    Hurd: { p: 'Chiefs -3', o: 'nonsense', t: 40 },
    Gotch: { p: '   ', o: -110, t: 50 },
    Zach: 'not even an object',
    Riz: { p: 'Under 44', o: -105 },
  };
  const got = LP._rows(4, ROWS);
  if (got.legs.length !== 3) fail(`the store's rows produced ${got.legs.length} legs, not the 3 that are actually bets`);
  if (got.legs.some((g) => g.m === 'Nobody')) fail('a store row naming somebody not in the league became a leg');
  if (got.bad.length !== 4) fail(`${got.bad.length} bad rows were reported, not 4`);
  if (!got.bad.some((b) => b.m === 'Nobody' && b.why === 'who')) fail('an unknown manager was not reported as unknown');
  if (!got.bad.some((b) => b.m === 'Hurd' && b.why === 'odds')) fail('a row with no usable price was not reported as such');
  if (!got.bad.some((b) => b.m === 'Gotch' && b.why === 'empty')) fail('a row with no bet on it was not reported as empty');
  if (LP._rows(4, null).legs.length || LP._rows(4, 'nope').legs.length) fail('a store answer that is not an object produced legs');
  /* ⚠️ A row with no `t` is still a bet — it just sorts as the oldest. Losing
     it would drop a real leg over a missing field the app itself supplies. */
  if (!got.legs.some((g) => g.m === 'Riz' && g.t === 0)) fail('a row with no timestamp was dropped rather than treated as the oldest');

  /* 🚨 ONE RESOLVER FOR THREE ROUTES. A leg arrives by paste, by tapped link
     and now by the shared list, and a second copy of "later wins" would
     eventually disagree with this one about which pick is on the ticket —
     the v14 fault. So the store path must go through `takeLeg` and produce
     exactly what the chat path produces. */
  localStorage.removeItem('lh:tick');
  const early = { k: 4, m: 'CC', p: 'Ravens -6', o: -120, t: 100 };
  const later = { k: 4, m: 'CC', p: 'Ravens -6.5', o: -105, t: 200 };
  if (LP._takeLeg(early, 4) !== 'ok') fail('a first store leg did not go on');
  if (LP._takeLeg(later, 4) !== 'dupe') fail('a second pick from one manager was not REPORTED as a duplicate');
  const box2 = JSON.parse(localStorage.getItem('lh:tick'));
  if (box2.legs.length !== 1) fail(`one manager left ${box2.legs.length} legs on the ticket`);
  if (box2.legs[0].p !== 'Ravens -6.5') fail('the later pick did not win');
  if (LP._takeLeg(early, 4) !== 'dupe' || JSON.parse(localStorage.getItem('lh:tick')).legs[0].p !== 'Ravens -6.5') {
    fail('an OLDER pick overwrote a newer one');
  }
  /* And the store cannot smuggle in a leg for a week that is not open. */
  if (LP._takeLeg({ k: 9, m: 'Woods', p: 'Jets ML', o: 200, t: 1 }, 4) !== 'week') {
    fail("a store row for another week went onto this week's ticket");
  }
  /* The two routes agree, which is the point of there being one resolver. */
  localStorage.removeItem('lh:tick');
  LP._takeAll([{ k: 4, m: 'Buley', p: 'Bills -7', o: -110, t: 10 }], 4);
  const viaStore = JSON.parse(localStorage.getItem('lh:tick'));
  localStorage.removeItem('lh:tick');
  LP._takeOne(LP._enc64({ v: 1, k: 4, m: 'Buley', p: 'Bills -7', o: -110, t: 10 }), 4);
  const viaChat = JSON.parse(localStorage.getItem('lh:tick'));
  if (JSON.stringify(viaStore) !== JSON.stringify(viaChat)) {
    fail(`the same pick makes a different leg by store than by chat:\n      store ${JSON.stringify(viaStore)}\n      chat  ${JSON.stringify(viaChat)}`);
  }
  const pulled = LP._takeAll(LP._rows(4, ROWS).legs, 4);
  if (pulled.ok + pulled.dupe !== 3) fail(`pulling the shared list added ${pulled.ok + pulled.dupe} of its 3 real legs`);
  if (pulled.who || pulled.odds || pulled.empty || pulled.bad) fail('a junk row reached the resolver, which means it was not filtered on the way out of the store');

  /* ── and what it renders ────────────────────────────────────────────── */
  LP._picks({ k: 4, rows: ROWS, at: Date.now() });
  LHIST.setMe('Buley');
  const who = LP._whoHTML({ k: 4, l: 'Week 4' });
  if (!who) fail('with a store configured there is no "who is in" card');
  if (!/section-title/.test(who)) fail('the "who is in" card is not a section, so the jump nav cannot reach it');
  /* ⚠️ 👥 rather than 📝 or 🎯 — both are already headings on this page and
     the jump row is scanned by its mark (the v50 clash). */
  if (!/👥/.test(who)) fail('the "who is in" card has no mark of its own');
  ['📝', '🎯', '🎲', '📋', '📖'].forEach((g) => {
    if (who.includes(g)) fail(`the "who is in" heading reuses ${g}, which is already another card's mark on this page`);
  });
  if (!/Bills -7/.test(who) || !/Over 47\.5/.test(who)) fail('the shared picks are not on screen');
  if (/Nobody|nonsense|not even an object/.test(who)) fail('a junk row was rendered');
  if (!/lp-leg you/.test(who)) fail("the reader's own row is not marked as theirs");
  if (!/lg-you/.test(who)) fail("the reader's own row carries no YOU badge");
  if (!/3 of 12 picks are in/.test(who)) fail('the card does not say how many of the twelve are in');
  /* Nine names still to pick, and the card has to say who — that is the
     thing somebody chasing the ticket actually needs. */
  if (!/Still to pick/.test(who)) fail('the card does not name who has still to pick');
  if (!/would not read as a bet/.test(who)) fail('rows that were dropped are dropped in silence');
  if (/undefined|NaN|\[object/.test(who)) fail('the "who is in" card has a template hole');
  if (/\/\*|\*\//.test(who)) fail('the "who is in" card renders a code comment');

  /* 🚨 A SYNCED PICK MUST NOT LOOK AUTHENTICATED. There is nothing to sign in
     to, the URL is public, and anybody who reads the JS could write a row
     under any name — exactly the bar the published passphrase hash sets.
     Saying so is the difference between a shared list and a claim about who
     wrote what, and it is one sentence away from being wrong. */
  const howto = LP._howto();
  if (!/not a login/i.test(howto)) fail('with a store on, the tab does not say that a pick is not proof of who made it');
  if (!/before it goes to a book/i.test(howto)) fail('the tab does not say a person still reads every leg before the bet is placed');
  if (/nowhere for twelve phones to write to/.test(howto)) fail('with a store on, the tab still says there is nowhere to write');

  /* Four states, four sentences — never one shown for another. */
  LP._reset(); LP._file({ weeks: [], sync: SB });
  if (!/Checking who is in/.test(LP._whoHTML({ k: 4, l: 'Week 4' }))) fail('before the store has answered, the card does not say it is checking');
  LP._picks({ k: 4, rows: {}, at: Date.now() });
  /* ⚠️ The wording moved when the empty block stopped restating the lead's
     count; what must hold is that an answered-and-empty week says SOMETHING
     of its own, and never reads as "still checking". */
  if (!/going spare/.test(LP._whoHTML({ k: 4, l: 'Week 4' }))) fail('an empty week does not read as an empty week');
  if (/Checking who is in/.test(LP._whoHTML({ k: 4, l: 'Week 4' }))) fail('an answered-and-empty store still reads as "checking"');
  if (!/data-lp="sync"/.test(LP._whoHTML({ k: 4, l: 'Week 4' }))) fail('there is no way to ask the store again');

  /* And the collector offers the list once it has one. */
  LP._picks({ k: 4, rows: ROWS, at: Date.now() });
  const col2 = LP._collectHTML({ k: 4, l: 'Week 4' });
  if (!/data-lp="pull"/.test(col2)) fail('with picks in the shared list the collector does not offer to pull them');
  if (!/Pull in the 3 picks/.test(col2)) fail('the pull button does not say how many it would add');
  /* 🚨 THE CHAT BOX IS THE FALLBACK, SO IT MAY ONLY VANISH WHEN THE PICK IS
     ACTUALLY OUT. The owner asked for it gone once the store was live — and
     deleting it outright would strand a pick every time the store is off or
     the write is refused, silently, with the reader believing they had sent
     it. Three states, and the two that need the box are the two nobody looks
     at. */
  const SB2 = 'https://lh-test-default-rtdb.firebaseio.com';
  const OWP = { k: 4, l: 'Week 4' };
  const MINE = { p: 'PIT -6.5 vs ATL', o: -112, t: 5 };
  LHIST.setMe('McD');
  const hasBox = (h) => /data-lp-t="pick"/.test(h) && /data-lp="send"/.test(h);
  const setMine = () => localStorage.setItem('lh:pick', JSON.stringify({ k: 4, p: MINE.p, o: MINE.o, at: MINE.t }));

  /* (a) store live and the pick is ON it — no box, and no offer to send. */
  LP._reset(); LP._file({ weeks: [], sync: SB2 }); setMine();
  LP._picks({ k: 4, rows: { McD: MINE }, at: Date.now() });
  const upH = LP._pickHTML(OWP);
  if (hasBox(upH)) fail('the pick is on the shared list and the card still offers to send it to the chat');
  if (/Send it to the chat|Copy it for the chat/.test(upH)) fail('the chat button survived on a pick that is already shared');
  if (!/data-lp="edit"/.test(upH)) fail('removing the chat box took "Change my pick" with it');
  if (!/On the shared list/.test(upH)) fail('the card does not say the pick is on the shared list');

  /* (b) 🚨 store live and the pick is NOT on it — the write was refused or the
     store is unreachable, and the chat is now the ONLY way this leg reaches
     the ticket. This is the state that must never lose the box. */
  LP._picks({ k: 4, rows: {}, at: Date.now() });
  const offH = LP._pickHTML(OWP);
  if (!hasBox(offH)) fail('a pick that never reached the shared list has no way out — the chat fallback is gone');
  if (!/has not reached the shared list/.test(offH)) fail('a pick that did not reach the store does not say so');

  /* (c) no store at all — v72's app, where the chat is the whole transport. */
  LP._reset(); LP._file({ weeks: [] }); setMine();
  const noSyncH = LP._pickHTML(OWP);
  if (!hasBox(noSyncH)) fail('with no store configured the chat box is missing, so a pick cannot reach anybody');
  if (/On the shared list/.test(noSyncH)) fail('with no store the card claims the pick is on a shared list');

  /* ⚠️ And another manager's pick being up must not hide MY box — `mineIsUp`
     has to ask about the reader, not about the list being non-empty. */
  LP._reset(); LP._file({ weeks: [], sync: SB2 }); setMine();
  LP._picks({ k: 4, rows: { Buley: { p: 'Bills -7', o: -110, t: 9 } }, at: Date.now() });
  if (!hasBox(LP._pickHTML(OWP))) fail("somebody else's pick being up hid the reader's own chat fallback");
  localStorage.removeItem('lh:pick');

  /* 🚨 CLEAR IS ON THE CARD, AND IT MUST NOT COLLIDE WITH THE COLLECTOR'S
     "Start again". Both are a delegated `data-lp` on one listener, so two
     branches answering to one name means whichever is reached first wins —
     silently, exactly like v71's duplicate `boardHTML`. Asserted by name
     because the failure is invisible: the wrong thing gets cleared. */
  LP._reset(); LP._file({ weeks: [], sync: SB2 }); setMine();
  LP._picks({ k: 4, rows: { McD: MINE }, at: Date.now() });
  const clearH = LP._pickHTML(OWP);
  if (!/data-lp="drop"/.test(clearH)) fail('there is no way to clear a saved pick');
  if (/data-lp="clear"/.test(clearH)) fail('the pick card reuses the collector\'s "clear" action — one name, two handlers, and the wrong one wins');
  if (!/data-lp="edit"/.test(clearH)) fail('adding Clear took "Change my pick" off the card');
  /* Three controls on one row when the chat box is up; two when it is not. */
  const btns = (h) => (h.match(/data-lp="(send|edit|drop)"/g) || []).length;
  if (btns(clearH) !== 2) fail(`a shared pick offers ${btns(clearH)} controls, not the expected Change + Clear`);
  LP._picks({ k: 4, rows: {}, at: Date.now() });
  if (btns(LP._pickHTML(OWP)) !== 3) fail('an unshared pick lost one of Send / Change / Clear');

  /* 🚨 AND THE DELETE IS SCOPED TO THE READER'S OWN ROW. One wrong path
     segment and Clear removes somebody else's leg, or the whole week. */
  const dpath = LP._delPath(SB2, 4, 'McD');
  if (dpath !== `${SB2}/picks/w4/McD.json`) fail(`the clear path is wrong: ${dpath}`);
  ['Buley', 'Wolff'].forEach((m) => {
    if (dpath.includes(m)) fail(`the clear path for McD names ${m}`);
  });
  if (LP._delPath(SB2, 4, 'McD') === LP._delPath(SB2, 4, 'Buley')) {
    fail('two managers resolve to the same clear path — one would wipe the other');
  }
  if (/\/picks\/w4\.json$|\/picks\.json$/.test(dpath)) fail('the clear path points at a whole week or the whole tree, not one pick');
  localStorage.removeItem('lh:pick');

  /* 🚨 THE CACHE MUST BE ON SCREEN BEFORE THE NETWORK IS ASKED, AND THE ORDER
     IN `paint` IS THE WHOLE OF IT. The first cut primed `P.picks` inside
     `refreshPicks`, which paint calls AFTER render — so the opening paint drew
     an empty list, and a cache younger than the TTL returned early without
     rendering at all: five picks in localStorage and "0 of 12 picks are in"
     on the screen. Asserted two ways, because neither alone is enough — the
     helper working says nothing about when it is called, and the source order
     says nothing about whether it works. (The v41 precedent: the hash reader
     is asserted by source order for the same reason.) */
  LP._reset(); LP._file({ weeks: [], sync: SB2 });
  localStorage.setItem('lh:picks', JSON.stringify({ k: 4, rows: { Buley: MINE, Wolff: MINE }, at: Date.now() }));
  LP._prime(OWP);
  const primed = LP._whoHTML(OWP);
  if (!/2 of \d+ picks are in/.test(primed)) fail('a cached pick list is not on screen before the network is asked');
  /* ⚠️ A "prime must not load another week's cache" assertion was written here
     and DELETED as vacuous: `syncLegs` already gates on the week, so breaking
     the guard inside `primePicks` changes nothing on screen and the check
     could not fail. Fault injection is what showed it — the repo's own rule,
     that a check whose failure path has never run is not a check, applies
     just as much to one that has no failure path at all. */
  localStorage.removeItem('lh:picks');

  const paintSrc = fs.readFileSync('./parlay.js', 'utf8');
  const paintFn = (paintSrc.match(/async function paint\([\s\S]*?\n  \}/) || [''])[0];
  if (!paintFn) fail('could not find paint() to check its order');
  else if (!(paintFn.indexOf('primePicks') > -1 && paintFn.indexOf('primePicks') < paintFn.indexOf('render()'))) {
    fail('paint() renders before it primes the pick cache — the opening paint would draw an empty list over data this device already has');
  }

  /* ⚠️ And an answer identical to what is on screen must not repaint at all:
     that is what lets the focus guard cover only a caret rather than every
     button, which is what threw the first fetch away. */
  if (!LP._same({ a: 1 }, { a: 1 })) fail('an unchanged pick list is seen as news, so the page repaints for nothing');
  if (LP._same({ a: 1 }, { a: 2 })) fail('a changed pick list is seen as unchanged, so a new pick would never appear');

  /* ⚠️ One fact, once: the lead carries the count, so the empty block must
     not restate it (the v22 shape). */
  LP._picks({ k: 4, rows: {}, at: Date.now() });
  const emptyWho = LP._whoHTML(OWP);
  if (/0 of \d+ picks are in/.test(emptyWho) && /Nobody has picked yet/.test(emptyWho)) {
    fail('the who card says "0 of 12 picks are in" and "Nobody has picked yet" — one fact twice on one card');
  }

  LP._reset();
  LP._file(shipped);
  LHIST.setMe(null);
  LHIST.setMe(null);
  console.log(`  ${mark()} the parlay: price is the product, a push is not a loss, every record is per manager`);
}
parlayLaws();

/* ══ 🚨 ONE BODY, FOUR VIEWS — WHO IS ALLOWED TO PAINT IT (v76) ═══════════
   The owner reopened the app on the History tab and got the parlay's pick
   card in the body with History and Leaders both lit. `#lg-body` is ONE
   element shared by every view, and two of them write into it from work that
   outlives the tab: `season.js` revalidates behind the reader (v42) and
   `parlay.js` re-asks the shared store on `visibilitychange` (v73) — which
   fires on EVERY reopen, with `force: true`, so it rendered unconditionally.
   The shell stamps `#lg-body` with the view that owns it and both files
   refuse to paint a body that is not theirs.
   ⚠️ ASSERTED IN BOTH DIRECTIONS, because a guard that always says no would
   "fix" this by breaking the feature outright — and nothing on screen would
   distinguish the two until somebody's picks stopped arriving. */
function hostLaws() {
  const mark = block();
  const fail = (m) => { console.log(`  ❌ ${m}`); bad++; };
  const fs = require('fs');

  /* ① THE SHELL STAMPS IT, AND BEFORE IT DISPATCHES. A stamp written after
     the view has been handed the host is a stamp the view could not have
     read — the v41 hash-order precedent, asserted the same way. */
  const lj = fs.readFileSync('./league.js', 'utf8');
  const paintFn = (lj.match(/\n  function paint\(\)[\s\S]*?\n  \}\n/) || [''])[0];
  if (!paintFn) fail('could not find league.js paint() to check the host stamp');
  else {
    const at = paintFn.indexOf('host.dataset.view');
    if (at < 0) fail('league.js paint() does not stamp #lg-body with the view that owns it — a late fetch can paint over any tab');
    else {
      /* Every hand-off of `host` to a view must come after the stamp. */
      ['LeagueSeason.paint(host', 'LeagueParlay.paint(host', 'paintRankings(host'].forEach((call) => {
        const c = paintFn.indexOf(call);
        if (c > -1 && c < at) fail(`league.js paint() hands the body to ${call.split('.')[0]} before it stamps who owns it`);
      });
    }
  }

  /* ② BOTH LATE PAINTERS READ THAT STAMP. Asserted by source for season.js,
     which has no render handle to drive, and by behaviour for parlay.js,
     which does — the source check alone would pass over a guard that reads
     the stamp and then ignores it. */
  [['season.js', 'season'], ['parlay.js', 'parlay']].forEach(([f, view]) => {
    const src = fs.readFileSync('./' + f, 'utf8');
    if (!new RegExp(`dataset\\.view === '${view}'`).test(src)) {
      fail(`${f} never checks whether it still owns #lg-body — a fetch that lands after the reader switches tabs paints over them`);
    }
    const rf = (src.match(/\n  function render\(\)[\s\S]*?\n  \}\n/) || [''])[0];
    if (rf && !/ownsHost\(\)/.test(rf)) fail(`${f}'s render() does not ask whether it owns the body`);
  });

  /* ③ AND IT SAYS YES WHEN IT SHOULD. Both directions off the real helper. */
  const LP = window.LeagueParlay;
  if (typeof LP._owns !== 'function') fail('parlay.js exposes no ownership check to drive');
  else {
    const fake = { dataset: {}, innerHTML: '' };
    LP._host(fake);
    fake.dataset.view = 'parlay';
    if (!LP._owns()) fail('the parlay refuses to paint a body that IS its own — the tab would never render');
    fake.dataset.view = 'hist';
    if (LP._owns()) fail('the parlay claims a body the archive owns — the bug this version fixes');
    fake.dataset.view = '';
    if (LP._owns()) fail('an unstamped body reads as the parlay\'s — it would paint over the picker or a first boot');

    /* The guard has to be in `render` itself, not only in its callers: the
       fetch, the board and the visibility handler all end there, and a guard
       per caller is three chances to forget the fourth. */
    fake.dataset.view = 'hist';
    fake.innerHTML = '<h2>the archive</h2>';
    LP._render();
    if (fake.innerHTML !== '<h2>the archive</h2>') fail('parlay render() overwrote a body owned by another view');
    fake.dataset.view = 'parlay';
    LP._render();
    if (fake.innerHTML === '<h2>the archive</h2>') fail('parlay render() painted nothing into its OWN body — the guard is on backwards');
    LP._host(null);
  }

  console.log(`  ${mark()} one body, four views: only the view on screen may paint it`);
}
hostLaws();

/* ══ 🗣️ THE RANKINGS COPY NAMES NO PUBLISHER (v77) ═══════════════════════
   The owner: "make no claim to who will publish them". Since v33 he can hand
   the Lab to any manager for a week or a season, so copy promising that HE
   publishes is the app guessing at something it cannot know — and the byline
   FALLBACK did it in the one case where it knows least, a payload carrying no
   byline at all. Four strings, asserted together because three of them were
   found by looking for the fourth (the v3 rule).
   ⚠️ THE FIRST CUT OF THIS LAW TRIED TO TOKENISE league.js WITH A REGEX for
   string literals and reported three faults in correct code — it was matching
   fragments of the comments that EXPLAIN this rule. A law that cries wolf gets
   ignored, so each of the four is extracted by its own anchor instead. */
function rankVoiceLaws() {
  const mark = block();
  const fail = (m) => { console.log(`  ❌ ${m}`); bad++; };
  const fs = require('fs');
  const lj = fs.readFileSync('./league.js', 'utf8');

  const SPOTS = [
    ['the empty rankings card', /none: "<b>No rankings published yet[\s\S]*?",/],
    ["the ? sheet's Rankings line", /\n    rank: (["'])[\s\S]*?\1,/],
    ['the byline line on a published week', /<p class="pr-sub">[\s\S]*?<\/p>/],
    ['the model caveat under the rows', /⚠️ <b>The order is one person's opinion[\s\S]*?<\/p>/],
  ];
  const got = {};
  SPOTS.forEach(([what, re]) => {
    const m = lj.match(re);
    if (!m) return fail(`could not find ${what} to check its voice`);
    got[what] = m[0];
    if (/commissioner/i.test(m[0])) fail(`${what} still names who publishes the rankings`);
    /* The same sentence used to read "only once HE publishes a set" — the
       repo's oldest voice rule (no pronouns in generated copy) reaching the
       help sheet rather than a storyline. */
    if (/\bpublish/i.test(m[0]) && /\b(he|his|she|her|hers)\b/i.test(m[0])) {
      fail(`${what} carries a pronoun for whoever publishes`);
    }
  });

  /* ⚠️ Stripping the CLAIM must not strip the PROMISE. Without this the copy
     could satisfy every line above by saying nothing at all, and the one card
     a reader meets before anything has landed would stop explaining the tab. */
  const none = got['the empty rankings card'] || '';
  if (none && !/each week during the season/.test(none)) {
    fail('the empty rankings card no longer says a set is published each week');
  }
  const sub = got['the byline line on a published week'] || '';
  if (sub && (/p\.b/.test(sub) || !sub.includes('League rankings. The numbers and the story.'))) {
    fail('the published rankings must use neutral copy without an author');
  }

  console.log(`  ${mark()} the rankings copy says a set is published, never who publishes it`);
}
rankVoiceLaws();

/* ══ 🔑 THE PASSPHRASE RESET TOOL (v41) ═══════════════════════════════════
   `power.html#newpass` hands the owner the hash that replaces `HASH`. If that
   hash is computed by ANY path other than the one the gate checks with, he
   commits it, deploys it, and is locked out of his own tool permanently —
   with nothing on screen able to say why. None of that is visible in a
   render: the tool would look like it worked. */
async function resetToolLaws() {
  const fail = (m) => { console.log(`  ❌ ${m}`); bad++; };
  const fs = require('fs');
  const own = fs.readFileSync('./owner.js', 'utf8');

  /* 🚨 ONE NORMALISE-AND-HASH IN THE FILE. Two would let the gate and the
     tool drift, which is the whole failure this guards. */
  const sites = (own.match(/sha256\(norm\(/g) || []).length;
  if (sites !== 1) fail(`owner.js has ${sites} normalise-and-hash call sites — there must be exactly 1, or the gate and the reset tool can drift`);

  /* ⚠️ `sha256` reads `window.crypto.subtle`, not the global — a sandbox
     without it makes every hash throw, `unlock` answer 'insecure', and every
     assertion below pass without ever testing anything. */
  const { webcrypto } = require('crypto');
  delete require.cache[require.resolve('./owner.js')];
  global.window = { crypto: webcrypto };
  require('./owner.js');
  const O = global.window.LeagueOwner;
  if (typeof O.hash !== 'function') return fail('owner.js exposes no hash() — the reset tool has nothing to call');

  const h = await O.hash('Correct Horse Battery Staple');
  if (!/^[0-9a-f]{64}$/.test(h)) fail(`hash() did not return 64 hex characters: ${h}`);

  /* Normalisation must be applied, or a phrase typed with iOS's automatic
     capital would hash to something the gate never matches — the exact
     lock-out the `norm` comment in owner.js exists to prevent. */
  const variants = await Promise.all([
    O.hash('correct horse battery staple'),
    O.hash('  Correct   Horse Battery   Staple  '),
    O.hash('CORRECT HORSE BATTERY STAPLE'),
  ]);
  if (variants.some((v) => v !== h)) fail('hash() does not normalise — capitals or spacing change the result');

  /* 🚨 THE VALUE MUST BE THE CANONICAL ONE, not merely self-consistent.
     "The tool agrees with itself" is not the property that matters. */
  const want = require('crypto').createHash('sha256').update('correct horse battery staple').digest('hex');
  if (h !== want) fail(`hash() is not a SHA-256 of the normalised phrase (${h} vs ${want})`);

  /* 🚨 AND THE END-TO-END PROOF, which is the only one that actually answers
     the question he is trusting this with: take the hash the tool produces,
     put it in `HASH` exactly as a commit would, and check the gate OPENS for
     that phrase. Everything above could pass while this failed. */
  const patched = own.replace(/const HASH = '[0-9a-f]{64}'/, `const HASH = '${h}'`);
  if (patched === own) return fail('could not substitute HASH to prove the round trip');
  const sandbox = { window: { crypto: webcrypto }, TextEncoder, localStorage: undefined };
  require('vm').createContext(sandbox);
  require('vm').runInContext(patched, sandbox);
  const P = sandbox.window.LeagueOwner;
  const opened = await P.unlock('Correct Horse Battery Staple');
  if (opened !== 'ok') fail(`a hash straight from the reset tool did NOT unlock the gate (${opened}) — committing it would lock the owner out`);
  const refused = await P.unlock('something else entirely');
  if (refused !== 'no') fail(`the patched gate accepted a wrong phrase (${refused})`);

  /* 🚨 THE TOOL IS READ BEFORE THE HASH IS CLEARED. `boot()` replaceStates any
     unrecognised hash away; a reader placed below that finds nothing, every
     time. Two features have already shipped broken this way (v23, v33) and
     both looked fine until the exact case was rendered. */
  const pj = fs.readFileSync('./power.js', 'utf8');
  const at = pj.indexOf('newpass');
  const clears = pj.indexOf("// A hash that isn't a valid payload");
  if (at < 0) fail('power.js has no #newpass branch');
  else if (clears < 0) fail('could not find the hash-clearing branch in power.js');
  else if (at > clears) fail('#newpass is read AFTER the branch that clears the hash — it would never see its own link');

  /* The tool must be reachable while locked out; that is the entire point. */
  if (/mayLab\(\)[\s\S]{0,200}newpass/.test(pj)) fail('#newpass sits behind the gate — it is needed precisely when the gate cannot be passed');

  /* owner.js is in BOTH pages on ONE shared ?v= — bump it in one and the other
     serves a stale gate, which after a reset means a device that cannot open. */
  const a = (fs.readFileSync('./index.html', 'utf8').match(/owner\.js\?v=(\d+)/) || [])[1];
  const b = (fs.readFileSync('./power.html', 'utf8').match(/owner\.js\?v=(\d+)/) || [])[1];
  if (!a || !b) fail('owner.js has no ?v= in one of the two pages');
  else if (a !== b) fail(`owner.js is ?v=${a} in index.html but ?v=${b} in power.html — one page serves a stale gate`);

  if (!bad) console.log('  ✅ reset tool: one hash path, normalised, canonical, and its output opens the gate');
}

function done() {
  console.log(bad ? `\n${bad} FAILURES` : '\n✅ all conservation laws hold');
  process.exit(bad ? 1 : 0);
}
