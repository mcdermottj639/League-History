/* Conservation laws, run against the SHIPPED history.js — not the scratch
   modules it was assembled from, so the checks test what actually deploys.
   A derived total that exceeds what physically happened is a double-count:
   the fault that once rendered "Slemp: 36 Cum Bowls" out of 13 that exist. */
global.window = {};
require('./history.js');
const S = window.LeagueHistory._stats;
const { ALL, SEASON, CUMBOWL, PLAYOFF_GAMES } = S;
const rows = [].concat(...SEASON.map((s) => s.rows));
const exRows = rows.filter((r) => !r.mgr);          // the two untracked managers
const exYrs = new Set(exRows.map((r) => r.yr + '\0' + r.t));
const exCB = CUMBOWL.filter((c) => [c.s11, c.s12].some((t) => exYrs.has(c.yr + '\0' + t))).length;
const exCBloss = CUMBOWL.filter((c) => exYrs.has(c.yr + '\0' + (c.p12 > c.p11 ? c.s11 : c.s12))).length;
const exPG = PLAYOFF_GAMES.reduce((a, g) => a + (exYrs.has(g.yr + '\0' + g.a) ? 1 : 0) + (exYrs.has(g.yr + '\0' + g.b) ? 1 : 0), 0);
const T = [
  ['seasons counted', ALL.reduce((a, x) => a + x.seasons, 0), rows.length - exRows.length],
  ['cum bowls played', ALL.reduce((a, x) => a + x.cbA, 0), CUMBOWL.length * 2 - exCB],
  ['cum bowls lost', ALL.reduce((a, x) => a + x.cb, 0), CUMBOWL.length - exCBloss],
  ['bracket game slots', ALL.reduce((a, x) => a + x.bw + x.bl + x.cw + x.cl, 0), PLAYOFF_GAMES.length * 2 - exPG],
  ['titles', ALL.reduce((a, x) => a + x.t1, 0), SEASON.filter((s) => s.champ && s.champ.mgr).length],
  ['playoff berths', ALL.reduce((a, x) => a + x.po, 0), SEASON.filter((s) => s.fin).length * 6 - exRows.filter((r) => r.place && r.place <= 6).length],
  ['h2h games == meetings', S.PAIRS.reduce((a, p) => a + p.n, 0), S.MEET.filter((g) => {
    const rr = (t, yr) => (SEASON.find((s) => s.yr === yr) || { rows: [] }).rows.find((x) => x.t === t);
    const a2 = rr(g.a, g.yr), b2 = rr(g.b, g.yr);
    return a2 && b2 && a2.mgr && b2.mgr && a2.mgr !== b2.mgr; }).length],
];
let bad = 0;
T.forEach(([k, got, want]) => { const ok = got === want; if (!ok) bad++;
  console.log(`  ${ok ? '✅' : '❌'} ${k.padEnd(22)} ${String(got).padStart(4)} ${ok ? '==' : '!='} ${want}`); });
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
  });
});
window.LeagueHistory.setMe(null);
ALL.forEach((a) => { const p = window.LeagueHistory.profile(a.m);
  if (/undefined|NaN|\[object/.test(p)) { console.log(`  ❌ profile ${a.m} has a template hole`); bad++; } });
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
console.log(`  ${bad ? '❌' : '✅'} storylines: ${window.LeagueHistory._stories().length} across ${new Set(window.LeagueHistory._stories().map((x) => x.m)).size} of ${window.LeagueHistory.roster().length} managers`);
console.log(bad ? `\n${bad} FAILURES` : '\n✅ all conservation laws hold');
process.exit(bad ? 1 : 0);
