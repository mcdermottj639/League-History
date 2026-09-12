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
/* 🏈 EVERY MANAGER HAS A MASCOT, AND IT IS THE SAME ONE IN BOTH PLACES (v48).
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
console.log(`  ${seen.length === 12 ? '✅' : '❌'} mascots: ${new Set(seen).size} teams across ${seen.length} of 12 managers, neutral for a stranger`);
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
    window.LeagueHistory.setMe(null);
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
  ['styles.css', 'power.css'].forEach((f) => {
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
