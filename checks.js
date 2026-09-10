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
/* ⚠️ No bracket W-L is kept on a manager any more (v19) — final fours are the
   whole playoff résumé — so the law that totalled bracket slots has nothing
   left to conserve, and the per-game exclusion it needed goes with it. The
   untracked pair are still excluded from the final-four law below, which is
   now the only one derived from placements. */
const T = [
  ['seasons counted', ALL.reduce((a, x) => a + x.seasons, 0), rows.length - exRows.length],
  ['cum bowls played', ALL.reduce((a, x) => a + x.cbA, 0), CUMBOWL.length * 2 - exCB],
  ['cum bowls lost', ALL.reduce((a, x) => a + x.cb, 0), CUMBOWL.length - exCBloss],
  /* Places 1-4 ARE the final four in this format (the semi-final losers play
     for 3rd), so every season with placements contributes exactly four. */
  ['final fours', ALL.reduce((a, x) => a + x.f4, 0), SEASON.filter((s) => s.fin).length * 4 - exRows.filter((r) => r.place && r.place <= 4).length],
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
window.LeagueHistory._cardStories().forEach((x) => {
  const big = (t) => new Set((String(t).match(/\d+/g) || []).map(Number).filter((n) => n >= 3));
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
/* 🚨 An `own` story is kept OFF the league card and must still be ON that
   manager's own pages — both halves, because either one failing silently is
   the whole point of the flag. Asserted against the RENDERED You page and the
   RENDERED profile, not against the detector: a story being found and a
   reader seeing it are different facts, and only the second one matters. */
window.LeagueHistory.setMe(null);
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
['nofinal', 'dynasty', 'collapse'].forEach((id) => {
  const st = window.LeagueHistory._stories().find((x) => x.id === id);
  if (st && !st.own) { console.log(`  ❌ story "${id}" is a league headline again; the owner made it own-page only (v15)`); bad++; }
});
console.log(`  ${bad ? '❌' : '✅'} own-page stories: ${owned.length} kept off the card, live on their own pages`);

/* 🚨 EVERYONE HAS AT LEAST TWO STORYLINES (v22, owner's call: "Make sure
   everyone has at least 2 storylines"). Counted on the RENDER — the You page
   and the profile — and not on `_stories()`, because those are different
   facts and only the second one matters (the v7 lesson, and the reason the
   backstop itself now counts survivors rather than emissions: Christel's
   second card fired, counted, and was then dropped by the dedupe).
   ⚠️ The heading re-voices for whoever is reading, so it is re-derived in
   their voice before being looked for on their own page. */
{
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
    window.LeagueHistory.setMe(null);
  });
  const counts = window.LeagueHistory.roster()
    .map((r) => window.LeagueHistory._stories().filter((x) => x.m === r.m).length);
  console.log(`  ${bad ? '❌' : '✅'} every manager has ${Math.min(...counts)}+ storylines on their own pages (most: ${Math.max(...counts)})`);
}

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
console.log(`  ${bad ? '❌' : '✅'} storylines: ${window.LeagueHistory._stories().length} found, ${card.length} on the card, covering ${onCard.size} of ${window.LeagueHistory.roster().length} managers`);

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
    done();
  });
}

function done() {
  console.log(bad ? `\n${bad} FAILURES` : '\n✅ all conservation laws hold');
  process.exit(bad ? 1 : 0);
}
