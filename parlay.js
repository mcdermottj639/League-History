/* ══════════════════════════════════════════════════════════════════════════
   🎲 THE GROUP PARLAY — twelve people, one bet each, one ticket.

   Every week each manager puts up a single NFL bet and the twelve of them go
   on together as one parlay. This tab is that ticket: who picked what, what
   the twelve turn into as a price, how far it got, and — across the season —
   who keeps landing their leg and who keeps killing everybody else's.

   🚨 THIS IS THE ONE TAB WHOSE FACTS ARE TYPED IN, AND THE PAGE SAYS SO.
   Everything else in this app is derived from the archive precisely so it
   cannot go stale. A bet has no such source: the pick, the price and whether
   it landed come off a betting slip, by hand, into `parlay/current.json`.
   Pretending otherwise would be the worse of the two options, so the card
   states which half is transcribed and which half is worked out.

   ⚠️ AND THE WORKED-OUT HALF IS EVERYTHING WITH A NUMBER IN IT. The combined
   price, the payout, the hit rates, the records, the rankings — all of it
   comes off the legs on load. A hand-typed "+18400" beside twelve legs would
   be the one number on the page that lies the moment a leg is corrected, and
   a leg WILL be corrected: results get entered wrong on a Sunday night.

   🚨 IT IS A FILE, LIKE THE RANKINGS, AND FOR A STRONGER REASON. There is no
   backend a member could write a pick to, and there must never be one — but
   more than that, a parlay is a record of something that already happened.
   The ticket that went in on Thursday is the ticket, and a page that
   re-derived it from a live odds feed would show a different bet next week
   than the one the league actually placed.

   ⚠️ EVERY VIEW WORKS WITH NOBODY PICKED. A stranger gets the whole ticket,
   the whole table and no highlighted row — the same rule the rest of the app
   runs on. Picking a name lights your leg and turns the sentences about you
   into second person; it is never a gate.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const LH = window.LeagueHistory;
  const FILE = 'parlay/current.json';

  /* The voice, from the archive — so a sentence about the reader reads the
     same here as it does on their You page. `nm` is "You" for whoever is
     holding the phone and the real name for everybody else; `vb` is why there
     are no pronouns in any template in this file. */
  const nm = (m) => (LH && LH.voice ? LH.voice.nm(m) : m);
  const rnm = (m) => (LH ? LH.name(m) : m);
  const vb = (m, second, third) => (LH && LH.voice ? LH.voice.vb(m, second, third) : third);

  const nWord = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
    'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen'];
  /* Two numerals must not touch (v17) — "12 3 times" reads as one number. */
  const spell = (n) => (n >= 0 && n < nWord.length ? nWord[n] : String(n));
  const Cap = (t) => String(t).charAt(0).toUpperCase() + String(t).slice(1);
  const times = (n) => (n === 1 ? 'once' : n === 2 ? 'twice' : `${spell(n)} times`);
  const ord = (n) => (n % 100 >= 11 && n % 100 <= 13) ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th');
  const ordN = (n) => `${n}${ord(n)}`;

  function niceDate(d) {
    const t = new Date(d + 'T12:00:00');
    return isNaN(t) ? d : t.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  /* ══ THE ARITHMETIC ════════════════════════════════════════════════════
     American odds are the format a slip is written in and the wrong format to
     multiply, so every price goes to decimal, gets multiplied, and comes back.
     ⚠️ There is exactly ONE conversion each way and every caller goes through
     it. Two implementations of the same conversion is how a payout and the
     price above it end up disagreeing about the same ticket — and both would
     look plausible, because both would be nearly right. */
  const dec = (o) => (o > 0 ? 1 + o / 100 : 1 + 100 / -o);
  const amer = (d) => (d >= 2 ? Math.round((d - 1) * 100) : -Math.round(100 / (d - 1)));
  const okOdds = (o) => isFinite(o) && Math.abs(o) >= 100;
  const grp = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  /* ⚠️ A HYPHEN, NOT THE APP'S TYPOGRAPHIC MINUS. Everywhere else here a
     negative number takes U+2212, but odds sit on the same line as the pick
     they belong to — "Eagles -3.5" beside "−115" is one line in two different
     dashes, which the render showed and no assertion can. A price is quoted
     text off a slip, so it is spelled the way the slip spells it. */
  const sgnNum = (n) => (n >= 0 ? '+' : '-') + grp(Math.abs(n));
  const oddsTxt = (o) => (okOdds(o) ? sgnNum(o) : '—');
  const priceTxt = (d) => (d > 1 ? sgnNum(amer(d)) : '—');
  const cash = (n) => {
    const r = Math.round(n * 100) / 100;
    return '$' + grp(r % 1 === 0 ? String(r) : r.toFixed(2));
  };
  const pc0 = (n) => `${Math.round(n * 100)}%`;

  /* Four outcomes and one of them is "not yet". Anything else in the file —
     a typo, a half-entered week — reads as unsettled rather than as a quiet
     win or loss, because an unrecognised result must never move a record. */
  const res = (l) => {
    const r = String(l && l.r != null ? l.r : '').trim().toUpperCase();
    return (r === 'W' || r === 'L' || r === 'P') ? r : '';
  };
  const MARK = { W: ['HIT', 'w'], L: ['MISS', 'l'], P: ['PUSH', 'p'], '': ['OPEN', 'o'] };

  /* ══ HOW A PICK GETS FROM TWELVE PHONES INTO ONE TICKET ════════════════
     🚨 THERE IS NO BACKEND AND THERE IS NOT GOING TO BE ONE, so a pick
     travels the way everything else in this league travels: as a link in the
     group chat. It is the same mechanism the Lab's `#r=` shared rankings have
     used since v1, pointed the other way — the Lab sends one payload to
     twelve people, and this collects twelve payloads into one.

     ⚠️ BE HONEST ABOUT WHAT THAT DOES AND DOES NOT BUY. Everybody sees every
     pick, in the chat, as it is made, and everybody sees the finished ticket
     in the app. What it cannot do is show the other eleven picks INSIDE the
     app before the ticket is assembled — that needs somewhere to write, and
     this app has nowhere. The card says so rather than implying a sync that
     is not there.

     ⚠️ AND A PICK IS NOT A CREDENTIAL. The payload carries a manager code, so
     anybody could craft one that says somebody else's name — the same bar the
     published passphrase hash sets, against the same eleven relatives. What
     protects the ticket is that the collector SEES every leg with a name on
     it before it goes to a book, so a wrong one is obvious rather than
     silent. Two picks from one manager are both reported for that reason. */
  const PICK_KEY = 'lh:pick';
  const TICK_KEY = 'lh:tick';
  const read = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (_) { return null; } };
  const write = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} };

  /* ⚠️ UTF-8 THEN base64url, never `btoa` straight. `btoa` is Latin-1 only and
     a pick is free text off a phone keyboard — one emoji or curly quote and
     it throws. The Lab learned this on takes; a bet gets the same treatment. */
  const b64enc = (obj) => {
    const bytes = new TextEncoder().encode(JSON.stringify(obj));
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  const b64dec = (str) => {
    const b = atob(String(str).replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = new Uint8Array(b.length);
    for (let i = 0; i < b.length; i++) bytes[i] = b.charCodeAt(i);
    return JSON.parse(new TextDecoder().decode(bytes));
  };

  /* ⚠️ A phone keyboard gives you "−110" as often as "-110", and a stray
     space or comma either side. Anything that is not a whole number of at
     least 100 either way is not a price, and the field says so rather than
     saving a leg the ticket cannot multiply. */
  const parseOdds = (v) => {
    const t = String(v == null ? '' : v).replace(/[\s,]/g, '').replace(/[−–—]/g, '-');
    return /^[+-]?\d+$/.test(t) ? Number(t) : NaN;
  };
  const PICK_MAX = 120;

  const knownMgr = (m) => !!(LH && LH.roster().some((r) => r.m === m));

  /* Four outcomes, because a leg that will not go on the ticket has four
     different reasons and they send the collector to four different places. */
  function checkPick(p) {
    if (!p || typeof p !== 'object') return 'bad';
    if (!knownMgr(p.m)) return 'who';
    if (!okOdds(Number(p.o))) return 'odds';
    if (!String(p.p || '').trim()) return 'empty';
    return 'ok';
  }

  /* 🚨 THE OPEN WEEK IS DERIVED WHEREVER IT CAN BE, AND STATED ONLY ONCE.
     `open` in the file names the week picks are being taken for; otherwise
     picks are for the week after the newest ticket, which is knowable and
     cannot drift. So the first week of a season needs one line in the file
     and every week after it needs nothing — and a week that already HAS a
     ticket is closed, because the bet has been placed and a pick would be a
     pick at a game that has kicked off.

     🚨 A STATED `open` IS ONLY HONOURED WHILE IT IS AHEAD OF THE SEASON,
     AND THAT CLAUSE IS THE WHOLE OF v78's FIX. `open` is the one hand-kept
     field on this tab, so it is the one that goes stale — and it went stale
     in two directions, both silent:
       • Sitting ON the week just published, the old code returned null and
         the pick card simply VANISHED. CLAUDE.md documented that symptom as
         something to remember to edit around, which is a hand-kept fix for a
         hand-kept field.
       • Sitting BEHIND the season — which is what a week that never gets a
         ticket leaves behind, and week 1 of this season is exactly that — it
         went on offering picks, with that week's board, for games played a
         month ago, while the ticket above it read Week 5. Reproduced on the
         render before it was fixed.
     Either way the answer is the same and it is derived: the newest ticket
     decides, and the stated week only wins while it is in front of it. A
     week that never gets a ticket therefore costs one edit ONCE, and the
     first published ticket heals it for the rest of the season. */
  function openWeekOf(file, weeks) {
    const ks = (weeks || []).map((w) => Number(w.k)).filter((n) => isFinite(n));
    const newest = ks.length ? Math.max.apply(null, ks) : null;
    let k = null, l = null;
    if (file && file.open && isFinite(Number(file.open.k))) {
      k = Number(file.open.k); l = String(file.open.l || `Week ${k}`);
    }
    if (newest != null && (k == null || k <= newest)) { k = newest + 1; l = `Week ${k}`; }
    if (k == null) return null;
    /* ⚠️ THE BOARD TRAVELS WITH THE WEEK. The first cut returned `{k, l}` and
       dropped `games` on the floor, so every option button silently stopped
       rendering — the page still looked complete, just with a text field
       where the board should be, which is precisely the state this version
       exists to end. A law asserts the board survives the trip. */
    /* ⚠️ AND THE BOARD ONLY TRAVELS WITH THE WEEK IT WAS WRITTEN FOR. Once
       the stated week is overtaken, its games belong to a week that has been
       played — handing them to the next week would put last month's fixtures
       under this week's heading, which is worse than no board at all (a
       missing board renders the prop field and says so). */
    const stated = !!(file && file.open && Number(file.open.k) === k);
    const games = (stated && Array.isArray(file.open.games)) ? file.open.games : [];
    return { k, l, games };
  }

  /* ══ ONE TICKET ════════════════════════════════════════════════════════
     🚨 A PUSH DROPS OUT OF THE PRICE, IT DOES NOT KILL THE TICKET. That is
     what a book does with one, and getting it wrong in either direction is a
     silent error: treat it as a loss and a live parlay reads as dead; leave it
     in the multiplication and the payout is quietly too big for the rest of
     the season. It is the one rule here that is not obvious from the slip. */
  function ticketOf(wk) {
    const legs = (wk.legs || []).map((l) => ({
      m: String(l.m || ''), p: String(l.p == null ? '' : l.p), o: Number(l.o), r: res(l),
    }));
    const of = (r) => legs.filter((g) => g.r === r);
    const won = of('W'), lost = of('L'), push = of('P'), open = of('');
    const priced = legs.filter((g) => g.r !== 'P' && okOdds(g.o));
    const price = priced.reduce((a, g) => a * dec(g.o), 1);
    /* One loss is the whole ticket, however many legs are still to come —
       which is why `dead` is tested before `live`. */
    const status = !legs.length ? 'empty' : lost.length ? 'dead' : open.length ? 'live' : 'cashed';
    const stake = Number(wk.stake) > 0 ? Number(wk.stake) : 0;
    return {
      k: Number(wk.k), label: String(wk.l || (wk.k != null ? `Week ${wk.k}` : 'This week')),
      date: wk.d || '', book: wk.book || '',
      legs, won, lost, push, open, priced, price, status, stake,
      /* 🚨 THE DENOMINATOR EXCLUDES PUSHES, exactly as the price does. A
         ticket of eleven wins and a push CASHED, and the first cut printed
         it as "11/12" — a complete ticket reading as though a leg had
         missed. If a void leg is out of the multiplication it is out of the
         count, or the two numbers on one card describe different tickets. */
      counted: legs.filter((g) => g.r !== 'P').length,
      ret: stake ? stake * price : 0,
      decided: status === 'dead' || status === 'cashed',
    };
  }

  /* ══ THE SEASON ════════════════════════════════════════════════════════
     🚨 EVERY TALLY IS PER MANAGER, AND A SUMMED ONE WOULD BE BLIND TO THE
     LIKELIEST MISTAKE. Swap two managers' results inside one week and every
     total in the file is conserved — the same fault the Cum Bowl points
     column hit in v67 and the bracket record hit in v51. A number attributed
     to a person gets a per-person law or it gets nothing. */
  function seasonOf(weeks) {
    const ts = weeks.map(ticketOf).filter((t) => t.legs.length).sort((a, b) => b.k - a.k);
    const by = {};
    ts.forEach((t) => {
      /* The sole assassin: the one leg that broke an otherwise perfect
         ticket. Only ever a real thing when exactly one leg missed. */
      const solo = t.lost.length === 1 ? t.lost[0].m : null;
      t.legs.forEach((g) => {
        const a = by[g.m] || (by[g.m] = { m: g.m, legs: 0, w: 0, l: 0, p: 0, open: 0, solo: 0 });
        a.legs++;
        if (g.r === 'W') a.w++; else if (g.r === 'L') a.l++;
        else if (g.r === 'P') a.p++; else a.open++;
        if (solo && g.m === solo) a.solo++;
      });
    });
    /* 🚨 ALL TWELVE ARE ON THE TABLE, WHETHER OR NOT THEY HAVE HAD A LEG
       ON (v78, the owner's ask: *"each persons w-l record for the year"*).
       Built from the legs alone, this table was a list of whoever had
       happened to pick — so a manager who sat the season out was simply
       ABSENT from the one card that is the league's running record, and
       nothing on screen said whether they were missing or had no legs. That
       is the v7 coverage fault in a new costume, and it lands hardest on
       exactly the person it is least fair to: somebody who has not been
       putting a leg in is the one thing this card could usefully show, and
       it showed it by saying nothing.
       ⚠️ It seeds from `LH.roster()`, the app's own source of truth for who
       the league is — never a list typed out here, which would drift the
       first time the league changed size. A manager with no legs is REAL and
       is not a fabricated 0-0: the row says so in words and prints no
       record, which is the Lab's rule (v1) rather than an exception to it. */
    (LH ? LH.roster().map((r) => r.m) : []).forEach((m) => {
      if (!by[m]) by[m] = { m, legs: 0, w: 0, l: 0, p: 0, open: 0, solo: 0 };
    });
    /* ⚠️ The rate's denominator is settled, non-push legs — a pending leg is
       not a miss and a push is neither. Every row prints that count beside
       the rate, because a manager who sat a week out has a smaller one and
       two rates over two denominators is this app's oldest fault (v3). */
    const rows = Object.values(by).map((a) => {
      const dcd = a.w + a.l;
      return Object.assign(a, { dcd, rate: dcd ? a.w / dcd : null });
    }).sort((x, y) => {
      /* 🚨 THE OLD COMPARATOR WAS NOT TRANSITIVE, AND THE ROSTER ROWS ARE
         WHAT MADE IT REACHABLE. It read `y.rate == null ? -1 : …`, so for two
         managers who BOTH have nothing settled it answered −1 whichever way
         round it was asked — the `bySeed` fault v62 fixed, in the one card
         where week 1 of a season puts twelve unrated rows side by side. */
      if ((x.rate == null) !== (y.rate == null)) return x.rate == null ? 1 : -1;
      if (x.rate != null && y.rate !== x.rate) return y.rate - x.rate;
      return y.w - x.w || y.legs - x.legs || rnm(x.m).localeCompare(rnm(y.m));
    });
    /* 🚨 COMPETITION RANK, AND THE WORDING HAS TO SAY "JOINT" (v58). Rank is
       one plus how many are strictly better, never the array position — the
       same value must not produce a different sentence depending on where a
       tie happened to sort. */
    rows.forEach((a) => {
      if (a.rate == null) { a.rank = null; a.tied = false; return; }
      a.rank = 1 + rows.filter((b) => b.rate != null && b.rate > a.rate).length;
      a.tied = rows.some((b) => b !== a && b.rate != null && b.rate === a.rate);
    });
    const decided = ts.filter((t) => t.decided);
    const cashed = decided.filter((t) => t.status === 'cashed');
    const staked = decided.reduce((n, t) => n + t.stake, 0);
    const back = cashed.reduce((n, t) => n + t.ret, 0);
    /* The best the league has managed, and it is the number that makes the
       joke land: twelve legs, and the closest anybody has come. */
    const best = decided.slice().sort((a, b) => b.won.length - a.won.length ||
      a.lost.length - b.lost.length)[0] || null;
    return {
      ts, rows, decided, cashed, staked, back,
      hasCash: decided.some((t) => t.stake > 0),
      legsW: ts.reduce((n, t) => n + t.won.length, 0),
      legsD: ts.reduce((n, t) => n + t.won.length + t.lost.length, 0),
      best,
    };
  }

  /* ══ THE TICKET ON SCREEN ══════════════════════════════════════════════ */
  /* Two words per state: the one on the hero pill, and a SHORT one for the
     tag on a collapsed past ticket. ⚠️ Not decoration — "IT CASHED" is 62px
     against "BUSTED"'s 46px, and at 320px that pushed the summary's own line
     one pixel past its box, so a cashed week read "11/…". A one-pixel clip is
     still a clip, and the only thing that sees it is comparing scrollWidth to
     clientWidth on the render. */
  const STAT = { cashed: ['IT CASHED', 'w', 'CASHED'], dead: ['BUSTED', 'l', 'BUSTED'],
    live: ['STILL ALIVE', 'o', 'ALIVE'], empty: ['NO LEGS IN', 'o', 'NO LEGS'] };

  function legsHTML(t, cr) {
    const me = LH ? LH.me() : null;
    return t.legs.map((g) => {
      const mine = !!me && g.m === me;
      const [word, cls] = MARK[g.r];
      return `<div class="lp-leg${mine ? ' you' : ''}">
        <div class="lp-leg-t">
          ${cr ? cr(g.m, 32) : ''}
          <span class="lp-leg-n">${esc(rnm(g.m))}${mine ? ' <span class="lg-you">YOU</span>' : ''}</span>
          <span class="lp-r lp-r-${cls}">${word}</span>
        </div>
        <div class="lp-leg-p">${g.p ? esc(g.p) : 'No pick written down'}<b>${oddsTxt(g.o)}</b></div>
      </div>`;
    }).join('');
  }

  /* The sentence under the ticket, and it is the whole point of the tab. */
  function verdict(t) {
    if (t.status === 'cashed') {
      /* ⚠️ `counted`, not `legs.length` — a ticket of eleven wins and a void
         leg read "All twelve landed", which is a sentence about a ticket that
         did not exist. A push is not a leg that landed and it is not a leg
         that missed; it says so on its own. */
      const void_ = t.push.length
        ? ` ${Cap(spell(t.push.length))} ${t.push.length === 1 ? 'leg was' : 'legs were'} void.` : '';
      return `<b>All ${spell(t.counted)} landed.</b>${void_} ${t.stake
        ? `${esc(cash(t.stake))} came back as <b>${esc(cash(t.ret))}</b>.`
        : `At <b>${esc(priceTxt(t.price))}</b>, every dollar on it returned <b>${esc(cash(t.price))}</b>.`}`;
    }
    if (t.status === 'live') {
      const done = t.won.length + t.push.length;
      return `<b>${Cap(spell(done))} in, ${spell(t.open.length)} to come.</b> Nothing has missed yet.`;
    }
    /* ⚠️ THE DEAD BRANCHES KEY ON HOW MANY LEGS MISSED, NOT ON THE STATUS,
       and that is not defensiveness — a fault injection that made a push kill
       the ticket produced `status: 'dead'` with an EMPTY loser list, and this
       function printed the word "undefined" into the sentence under the
       ticket. Unreachable in correct code; one bug away from being the first
       thing on the page. */
    if (t.lost.length === 1) {
      const g = t.lost[0];
      /* The best and meanest line this data produces, so it gets its own
         wording rather than being folded into the list below. */
      return `<b>One leg.</b> ${vb(g.m, 'Yours', `${esc(rnm(g.m))}'s`)} is the only one that missed — ${esc(g.p || 'no pick written down')} — and it cost the other ${spell(t.counted - 1)}.`;
    }
    if (t.lost.length > 1) {
      const who = t.lost.map((g) => esc(nm(g.m)));
      const list = who.length > 1 ? `${who.slice(0, -1).join(', ')} and ${who[who.length - 1]}` : who[0];
      return `<b>${Cap(spell(t.lost.length))} legs missed:</b> ${list}.`;
    }
    return '<b>No legs in yet.</b> The ticket is on file but nobody\'s pick has been written down.';
  }

  /* ⚠️ THREE TENSES, BECAUSE A TICKET IS IN ONE OF THREE TIMES. "would have
     returned" over a ticket that is still running is simply the wrong tense,
     and the render is what showed it; and a cashed ticket already says what
     came back in its verdict, so repeating it here is the v22 fault — a line
     re-arguing the line above it. */
  function payLine(t) {
    if (t.status === 'cashed') return '';
    const hit = `<b>${t.won.length} of ${t.counted}</b> hit`;
    if (t.status === 'live') {
      return `<p class="lp-pay">${t.stake
        ? `${esc(cash(t.stake))} on it returns <b>${esc(cash(t.ret))}</b> if every leg lands.`
        : `Every dollar on it returns <b>${esc(cash(t.price))}</b> if every leg lands.`}</p>`;
    }
    if (t.status === 'dead') {
      return `<p class="lp-pay">${hit}${t.stake ? ` · it would have paid <b>${esc(cash(t.ret))}</b>` : ''}</p>`;
    }
    return '';
  }

  /* ⚠️ `last` rather than a fixed heading: with picks open for week 4 the
     newest ticket on file is week 3, and calling that "this week's ticket"
     is a sentence that goes wrong the moment the feature above it works. */
  function ticketHTML(t, cr, last) {
    const [word, cls] = STAT[t.status] || STAT.empty;
    return `<h2 class="section-title">🎲 ${last ? 'The last ticket' : "This week's ticket"}</h2>
      <div class="ffp-card lp-hero">
        <div class="lp-k">${esc(t.label)}${t.date ? ` · ${esc(niceDate(t.date))}` : ''}${t.book ? ` · ${esc(t.book)}` : ''}</div>
        <div class="lp-top">
          <div class="lp-price"><b>${esc(priceTxt(t.price))}</b><i>${spell(t.legs.length)} legs, one ticket</i></div>
          <span class="lp-stat lp-r-${cls}">${word}</span>
        </div>
        <p class="lp-verdict">${verdict(t)}</p>
        ${payLine(t)}
      </div>
      <div class="ffp-card lp-legs">${legsHTML(t, cr)}</div>`;
  }

  /* ══ THE SEASON ON SCREEN ══════════════════════════════════════════════ */
  function tallyHTML(s) {
    const n = s.ts.length, dn = s.decided.length;
    const tiles = [
      `<div class="ffp-tile"><div class="v">${n}</div><div class="k">Tickets</div></div>`,
      `<div class="ffp-tile"><div class="v${s.cashed.length ? ' pos' : ' neg'}">${s.cashed.length}</div><div class="k">Cashed</div></div>`,
      `<div class="ffp-tile"><div class="v wm">${s.legsW}<span class="of">/${s.legsD}</span></div><div class="k">Legs hit</div></div>`,
    ];
    if (s.hasCash) {
      tiles.push(`<div class="ffp-tile"><div class="v">${s.best ? `${s.best.won.length}<span class="of">/${s.best.counted}</span>` : '—'}</div><div class="k">Best week</div></div>`,
        `<div class="ffp-tile"><div class="v">${esc(cash(s.staked))}</div><div class="k">Staked</div></div>`,
        `<div class="ffp-tile"><div class="v${s.back >= s.staked ? ' pos' : ' neg'}">${esc(cash(s.back))}</div><div class="k">Back</div></div>`);
    }
    /* Derived, so it re-writes itself the week a ticket gets closer. */
    const running = n - dn;
    /* ⚠️ ONE FACT, ONE SENTENCE. The first cut said "…and once has that been
       all of them" in the lead and then "Once the whole thing has landed"
       immediately after it — the same finding twice on one card, which is
       what the v22 dedupe rule is about. The lead counts the legs; this
       sentence is the only one that says how often the ticket itself came
       in. */
    const closest = s.cashed.length
      ? `The whole thing has landed <b>${times(s.cashed.length)}</b>.`
      : s.best && s.best.lost.length
        ? `The closest the league has come is <b>${s.best.won.length} of ${s.best.counted}</b>, ${esc(s.best.label.toLowerCase())}.`
        : '';
    return `<h2 class="section-title">📋 The season so far</h2>
      <div class="fh-lead"><p>${dn
        ? `${Cap(spell(dn))} ticket${dn === 1 ? '' : 's'} ${dn === 1 ? 'has' : 'have'} been settled${running ? ` and ${spell(running)} ${running === 1 ? 'is' : 'are'} still running` : ''}. Every leg has to land for any of it to pay, which is the whole joke: <b>${s.legsW} of ${s.legsD}</b> individual bets have won.`
        : `Nothing has settled yet. Every leg has to land for any of it to pay, which is the whole joke.`} ${closest}</p></div>
      <div class="ffp-strip">${tiles.join('')}</div>`;
  }

  function boardHTML(s) {
    const me = LH ? LH.me() : null;
    const rows = s.rows.map((a) => {
      const mine = !!me && a.m === me;
      /* Three states and three sentences, which is the distinction the roster
         rows made necessary: no leg all season, legs in with nothing settled,
         and a real record. Folding the first two together would tell somebody
         who has never picked that their results are pending. */
      const bits = [];
      if (a.dcd) bits.push(`<b>${pc0(a.rate)}</b> of ${spell(a.dcd)} settled`);
      else if (!a.legs) bits.push(`${vb(a.m, 'have', 'has')} not had a leg on yet`);
      else bits.push('nothing settled yet');
      if (a.p) bits.push(`${spell(a.p)} push${a.p === 1 ? '' : 'es'}`);
      if (a.open) bits.push(`${spell(a.open)} still running`);
      if (a.solo) bits.push(`<b>killed the ticket on ${vb(a.m, 'your', 'their')} own ${times(a.solo)}</b>`);
      /* ⚠️ NO RECORD RATHER THAN 0-0. A manager with no legs has no W-L, and
         printing one would be the Lab's oldest rule broken on a new card —
         *a fabricated 0-0 beside a name is a lie* (v1). The sentence
         underneath says what is true instead. */
      return `<div class="lp-ld${mine ? ' you' : ''}">
        <div class="lp-ld-t">
          <span class="lp-ld-r">${a.rank ? `${a.tied ? '=' : ''}${a.rank}` : '—'}</span>
          <span class="lp-ld-n">${esc(rnm(a.m))}${mine ? ' <span class="lg-you">YOU</span>' : ''}</span>
          <span class="lp-ld-w">${a.legs ? `${a.w}-${a.l}${a.p ? `-${a.p}` : ''}` : '—'}</span>
        </div>
        <div class="lp-ld-s">${bits.join(' · ')}</div>
      </div>`;
    }).join('');
    /* ⚠️ The sample caveat is DERIVED from how many tickets are in, so it
       stops apologising by itself once there is a season behind it. */
    const thin = s.decided.length <= 2
      ? ` With ${spell(s.decided.length)} ticket${s.decided.length === 1 ? '' : 's'} settled this is a tally, not a record.`
      : '';
    return `<h2 class="section-title">🎯 Who carries the ticket</h2>
      <div class="fh-lead"><p>Every leg anybody has had on this season, ranked by how often it lands. <b>All twelve are here</b> whether or not they have put one in. <b>An = means joint</b>, and every row names how many settled legs that rate is over — somebody who sat a week out has fewer, and two rates over two different denominators is not a comparison. A push counts as neither.${thin}</p></div>
      <div class="ffp-card">${rows}</div>`;
  }

  function pastHTML(s, cr) {
    const past = s.ts.slice(1);
    if (!past.length) return '';
    const me = LH ? LH.me() : null;
    return `<h2 class="section-title">📖 Every ticket</h2>
      ${past.map((t) => {
        const [, cls, tag] = STAT[t.status] || STAT.empty;
        return `<details class="ffp-card fh-det">
          <summary><b>${esc(t.label)}</b><span>${esc(priceTxt(t.price))} · ${t.won.length}/${t.counted}</span><em class="lp-tag lp-r-${cls}">${tag}</em><i>▾</i></summary>
          <p class="lp-verdict">${verdict(t)}</p>
          <div class="lp-legs">${t.legs.map((g) => {
            const mine = !!me && g.m === me;
            const [w2, c2] = MARK[g.r];
            return `<div class="lp-leg${mine ? ' you' : ''}">
              <div class="lp-leg-t">${cr ? cr(g.m, 32) : ''}
              <span class="lp-leg-n">${esc(rnm(g.m))}${mine ? ' <span class="lg-you">YOU</span>' : ''}</span>
              <span class="lp-r lp-r-${c2}">${w2}</span></div>
              <div class="lp-leg-p">${g.p ? esc(g.p) : 'No pick written down'}<b>${oddsTxt(g.o)}</b></div>
            </div>`;
          }).join('')}</div>
        </details>`;
      }).join('')}`;
  }

  /* ══ THE WEEK'S BOARD ══════════════════════════════════════════════════
     🚨 YOU TAP A PRICE, YOU DO NOT TYPE ONE (v71, owner: *"Why can we have
     pick selections like by tapping not writing"*). v70 shipped a text field
     and he was right that it is the wrong control for a board.

     ⚠️ AND THE REAL WIN IS NOT THE TAPPING, IT IS THAT THE TEXT IS DERIVED.
     Twelve people typing "Eagles -3.5", "PHI -3.5", "philly -3½" produce
     twelve spellings of one bet, and nothing downstream can tell they are the
     same — no per-market record, no duplicate detection, no checking a leg
     against the board it came from. An option that writes its own line makes
     twelve picks comparable, which is the difference between a list and data.

     🚨 THE LINES ARE DATA, BECAUSE NOTHING IN THIS APP KNOWS AN NFL GAME.
     The ESPN feed that IS wired is the commissioner's FANTASY league — twelve
     fantasy teams and a fantasy schedule of team ids. It carries no fixture
     and no price, so a board cannot be derived from anything already here and
     is not going to be invented. ⚠️ ESPN's public NFL scoreboard does publish
     both, keylessly, and the app could fetch it from the reader's phone the
     way the Season tab already fetches — see Open / next; it needs one live
     capture to build the transform against, which this sandbox cannot get.

     ⚠️ A GAME MISSING A MARKET RENDERS NO BUTTON FOR IT rather than a button
     that cannot price itself. A board arrives half-filled all the time — a
     total posted before a spread — and half a game is still worth showing. */
  /* A line reads "+3.5" / "-7" / "PK", never "0" — a pick'em written as a
     number looks like a missing value. */
  const sp = (n) => (n === 0 ? 'PK' : n > 0 ? `+${n}` : `${n}`);
  const juice = (v) => (okOdds(Number(v)) ? Number(v) : -110);

  function optionsFor(g) {
    const out = [];
    const a = String(g.a || '').trim(), h = String(g.h || '').trim();
    if (!a || !h) return out;
    const s = g.sp || {}, m = g.ml || {}, t = g.tot || {};
    /* 🚨 EACH SIDE CARRIES ITS OWN PRICE, and the real board is why. ESPN's
       own numbers for one game come back as home -3.5 at -118 and away +3.5
       at -102 — the juice is NOT symmetric, and pricing both sides at -110
       would put a leg on the ticket at a price the book is not offering. */
    if (isFinite(Number(s.h)) && isFinite(Number(s.a))) {
      const hn = Number(s.h), an = Number(s.a);
      out.push({ id: 'sa', lab: `${a} ${sp(an)}`, p: `${a} ${sp(an)} at ${h}`, o: juice(s.ap) });
      out.push({ id: 'sh', lab: `${h} ${sp(hn)}`, p: `${h} ${sp(hn)} vs ${a}`, o: juice(s.hp) });
    }
    if (okOdds(Number(m.a)) && okOdds(Number(m.h))) {
      out.push({ id: 'ma', lab: `${a} ML`, p: `${a} ML at ${h}`, o: Number(m.a) });
      out.push({ id: 'mh', lab: `${h} ML`, p: `${h} ML vs ${a}`, o: Number(m.h) });
    }
    if (isFinite(Number(t.n))) {
      const n = Number(t.n);
      out.push({ id: 'to', lab: `Over ${n}`, p: `${a}/${h} over ${n}`, o: juice(t.op) });
      out.push({ id: 'tu', lab: `Under ${n}`, p: `${a}/${h} under ${n}`, o: juice(t.up) });
    }
    return out;
  }

  /* ══ ESPN'S OWN BOARD ══════════════════════════════════════════════════
     🚨 WRITTEN AGAINST A REAL CAPTURE, NOT AGAINST MEMORY (v72). The owner
     pasted the live scoreboard payload; every field read below was read off
     it. The v39 rule is that a consumer proves what a producer sends AT
     LEAST, never at most — and the corollary is that a transform written
     from recollection is a guess with good posture.

     🚨 A GAME THAT HAS KICKED OFF IS NOT PICKABLE, AND THE WEEK CONTAINS
     THEM. The capture's week 1 carries two FINAL games (NE at SEA, SF v LAR
     in Melbourne) alongside fourteen still to play. Anything but
     `state === 'pre'` is dropped, or the board offers a bet on a game whose
     result is already printed three lines away in the same payload.

     ⚠️ `close` BEFORE `open`. Both are there for every market and they
     differ — one game opened DEN +130 and closed +114. The open price is
     what was available yesterday; the board has to show what is available
     now, and falls back to the open only when there is no close.

     ⚠️ THE PER-SIDE LINES ARE READ, NOT DERIVED FROM `spread`. That
     top-level number is the HOME spread (verified against `details` on all
     fourteen: "BAL -3.5" arrives as `spread: 3.5` because Indianapolis is
     home) — correct, but it carries no price and it makes the reader infer a
     sign. `pointSpread.home.close.line` says "+3.5" in as many words. */
  const NFL_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';
  const side = (o) => (o && (o.close || o.open)) || null;
  const lineNum = (v) => { const n = Number(String(v == null ? '' : v).replace(/^[ou]/i, ''));
    return isFinite(n) ? n : NaN; };

  function boardFrom(payload) {
    const evs = (payload && Array.isArray(payload.events)) ? payload.events : [];
    const out = [];
    evs.forEach((e) => {
      const c = (e.competitions || [])[0];
      if (!c) return;
      const state = (((c.status || e.status || {}).type) || {}).state;
      if (state !== 'pre') return;
      const cs = c.competitors || [];
      const H = cs.find((x) => x.homeAway === 'home'), A = cs.find((x) => x.homeAway === 'away');
      const h = H && H.team && H.team.abbreviation, a = A && A.team && A.team.abbreviation;
      if (!h || !a) return;
      const g = { a, h, kick: e.date || c.date || '' };
      const o = (c.odds || [])[0];
      if (o) {
        const ps = o.pointSpread || {}, hs = side(ps.home), as = side(ps.away);
        if (hs && as && isFinite(lineNum(hs.line)) && isFinite(lineNum(as.line))) {
          g.sp = { h: lineNum(hs.line), hp: parseOdds(hs.odds), a: lineNum(as.line), ap: parseOdds(as.odds) };
        } else if (isFinite(Number(o.spread))) {
          /* No per-side block: the home spread is all there is, so both sides
             take the standard price rather than inventing two. */
          g.sp = { h: Number(o.spread), hp: -110, a: -Number(o.spread), ap: -110 };
        }
        const ml = o.moneyline || {}, mh = side(ml.home), ma = side(ml.away);
        if (mh && ma) g.ml = { h: parseOdds(mh.odds), a: parseOdds(ma.odds) };
        const tt = o.total || {}, to = side(tt.over), tu = side(tt.under);
        if (to && isFinite(lineNum(to.line))) {
          g.tot = { n: lineNum(to.line), op: parseOdds(to.odds), up: tu ? parseOdds(tu.odds) : NaN };
        } else if (isFinite(Number(o.overUnder))) {
          g.tot = { n: Number(o.overUnder), op: -110, up: -110 };
        }
      }
      out.push(g);
    });
    /* Kickoff order, then alphabetical — a board is read down the day. */
    out.sort((x, y) => String(x.kick).localeCompare(String(y.kick)) || x.a.localeCompare(y.a));
    return out;
  }


  const gamesOf = (ow) => {
    if (!ow) return [];
    /* The live board beats the committed one for the same week, and only for
       the same week — a board fetched for week 4 must never render under a
       heading that says week 5. */
    if (P.live && Number(P.live.k) === ow.k && Array.isArray(P.live.games) && P.live.games.length) return P.live.games;
    return Array.isArray(ow.games) ? ow.games : [];
  };
  /* 🚨 A BOARD IS GAMES YOU CAN BET, NOT GAMES ESPN KNOWS ABOUT (v79).
     ESPN lists a week's fixtures as soon as the schedule exists and prices
     them only when the books do — so between the two there is a window,
     several days long every week, where `gamesOf` returns sixteen games and
     not one of them carries a market. Every gate here counted GAMES, so the
     card said *"Tap a line below"* over an empty board with the write-it-in
     field folded shut: a control named in a sentence and absent from the
     page, which is the v30 fault, in the state the tab sits in for most of
     the week. Reproduced on the render before it was fixed.
     ⚠️ ONE helper, and every gate reads it — the lead sentence, the note,
     the board itself and whether the prop field opens. Four gates asking the
     same question four ways is how three of them end up agreeing and one
     does not. */
  const playable = (ow) => gamesOf(ow).filter((g) => optionsFor(g).length);
  /* The selected option, resolved from the board rather than remembered as
     text — so a corrected line corrects the pick that is sitting on it. */
  function selPick(ow) {
    if (!P.sel) return null;
    const g = gamesOf(ow)[P.sel.g];
    if (!g) return null;
    return optionsFor(g).find((o) => o.id === P.sel.id) || null;
  }

  const kickTxt = (v) => {
    if (!v) return '';
    const d = new Date(v);
    return isNaN(d) ? '' : d.toLocaleString(undefined,
      { weekday: 'short', hour: 'numeric', minute: '2-digit' });
  };

  /* ⚠️ `gameBoardHTML`, not `boardHTML` — that name was already taken by the
     "Who carries the ticket" leaderboard, and a second function declaration
     of the same name in the same scope silently WINS. The leaderboard
     disappeared from the page and nothing threw; the tie law caught it, which
     is a law written for something else entirely doing the catching. */
  function gameBoardHTML(ow) {
    const games = gamesOf(ow);
    /* ⚠️ Keyed by INDEX INTO `gamesOf`, never into the filtered list — the
       selection travels as `{g, id}` and `selPick` resolves it back through
       `gamesOf`, so renumbering here would point a saved tap at a different
       game the moment one unpriced fixture sat above it. */
    if (!playable(ow).length) return '';
    return `<div class="lp-board">${games.map((g, i) => {
      const opts = optionsFor(g);
      if (!opts.length) return '';
      return `<div class="lp-gm">
        <div class="lp-gm-h"><b>${esc(g.a)} @ ${esc(g.h)}</b><i>${esc(kickTxt(g.kick))}</i></div>
        <div class="lp-opts">${opts.map((o) => {
          const on = P.sel && P.sel.g === i && P.sel.id === o.id;
          return `<button type="button" class="lp-opt${on ? ' on' : ''}" data-lp="opt"
            data-g="${i}" data-o="${esc(o.id)}" aria-pressed="${on}">
            <span class="lp-opt-l">${esc(o.lab)}</span><span class="lp-opt-o">${esc(oddsTxt(o.o))}</span></button>`;
        }).join('')}</div>
      </div>`;
    }).join('')}</div>`;
  }

  /* ⚠️ THE LIVE BOARD IS A REFRESH, NEVER A DEPENDENCY — the v42 doctrine,
     which is the only reason fetching from a members' app is allowed at all.
     The board committed in `parlay/current.json` is the floor; ESPN is asked
     behind the reader and only ever upgrades what is already on screen. If
     the call is blocked, slow, or gone, the tab is exactly as good as it was
     before it existed and says which copy it is showing.
     ⚠️ Keyless and public — no account, no token, nothing this repo could
     leak by being public. It is ESPN's own scoreboard, the same one the
     website reads. */
  const BOARD_KEY = 'lh:board';
  const BOARD_TTL = 15 * 60 * 1000;

  async function fetchBoard(k) {
    const r = await fetch(`${NFL_URL}?seasontype=2&week=${k}`, { cache: 'no-store' });
    if (!r.ok) throw new Error('http ' + r.status);
    return boardFrom(await r.json());
  }

  function refreshBoard(ow) {
    if (!ow || typeof fetch !== 'function') return;
    const c = read(BOARD_KEY);
    if (c && Number(c.k) === ow.k && Array.isArray(c.games) && c.games.length) {
      P.live = c;
      if (Date.now() - (Number(c.at) || 0) < BOARD_TTL) return;
    }
    fetchBoard(ow.k).then((games) => {
      if (!games.length) return;
      P.live = { k: ow.k, games, at: Date.now() };
      write(BOARD_KEY, P.live);
      /* ⚠️ Never yank the page out from under a thumb: a repaint while a
         field has focus drops the caret, and one arriving mid-tap would move
         the button being tapped. The Lab's v25 rule, and lines move often
         enough here that it would actually happen. */
      const el = document.activeElement;
      if (el && /^(INPUT|TEXTAREA|BUTTON)$/.test(el.tagName)) return;
      render();
    }).catch((e) => { console.warn('[parlay] the live board did not answer', e); });
  }

  function boardNote(ow) {
    /* ⚠️ A note about where the lines came from is nonsense when there are
       no lines, however many fixtures came back with them. */
    if (!playable(ow).length) return '';
    const live = P.live && Number(P.live.k) === ow.k && P.live.games.length;
    if (!live) return '<p class="lp-note">Lines as published with the app.</p>';
    const mins = Math.round((Date.now() - (Number(P.live.at) || 0)) / 60000);
    return `<p class="lp-note">Lines from <b>ESPN</b>${mins > 0 ? `, ${mins === 1 ? 'a minute' : `${mins} minutes`} ago` : ', just now'}. They move — what you save is the price at the moment you tap it.</p>`;
  }


  /* ══ 👥 THE SHARED PICKS ═══════════════════════════════════════════════
     🚨 THE FIRST TIME THIS APP HAS WRITTEN ANYTHING ANYWHERE, AND IT IS
     OPTIONAL BY CONSTRUCTION. `sync` in `parlay/current.json` is a Firebase
     Realtime Database URL. With it absent — which is how the file ships —
     every line below is dead and the tab behaves exactly as v72 did, picks
     travelling through the group chat. That is the v42 doctrine extended to
     a WRITE: the app may reach the network, it must never depend on it. So
     turning this on is a DATA edit with no version bump, and turning it off
     again is deleting one line.

     🚨 AND IT IS NOT A LOGIN. The URL sits in a PUBLIC repo, so anybody who
     opens this file could write a pick under any name — the same bar the
     published passphrase hash sets, against the same eleven relatives.
     Nothing here is treated as proof of anything: every row goes through the
     SAME `checkPick` a pasted link goes through, and the ticket is still
     assembled by a person looking at twelve legs with twelve names on them
     before it reaches a book. The card says that out loud rather than
     letting a synced pick look authenticated.

     ⚠️ THE STORE IS A MIRROR, NEVER THE SOURCE OF YOUR OWN PICK. `lh:pick`
     stays authoritative on the phone that made it, so a failed write costs
     the other eleven a live view and costs the picker nothing — their leg is
     saved and their chat line is still on screen underneath it.

     ⚠️ THE RULES THAT GO WITH IT ARE LEAF-ONLY ON PURPOSE (they are in
     CLAUDE.md, ready to paste). `.write` is granted at `picks/$week/$mgr`
     and nowhere above it, so a single request cannot replace or empty the
     tree — the worst anybody can do is overwrite one pick, which is exactly
     what changing your mind does anyway, and it is visible on the card. */
  const SYNC_KEY = 'lh:picks';
  const SYNC_TTL = 30 * 1000;

  /* ⚠️ Refused unless it is plain https with no path. A blank, a mistyped
     scheme and a stray trailing slash are all the same fact — no store — and
     none of them may produce a URL the app then fetches forever. */
  function syncBase(file) {
    const raw = String((file && file.sync) || '').trim().replace(/\/+$/, '');
    return /^https:\/\/[A-Za-z0-9.-]+$/.test(raw) ? raw : '';
  }
  const syncOn = () => !!syncBase(P.file);
  const weekPath = (base, k) => `${base}/picks/w${k}.json`;
  const pickPath = (base, k, m) => `${base}/picks/w${k}/${encodeURIComponent(m)}.json`;

  /* 🚨 EVERY ROW GOES THROUGH THE SAME `checkPick` A PASTED LINK GOES
     THROUGH. The store is world-writable, so a row can be anything at all: a
     manager who is not in the league, a price that is not a number, an empty
     bet, or a string where an object should be. ONE validator rather than
     two — two would eventually disagree about what a leg is, which is the
     v14 fault — and a junk row is dropped and counted rather than rendered
     or thrown over. */
  function rowsToLegs(k, obj) {
    const legs = [], bad = [];
    if (!obj || typeof obj !== 'object') return { legs, bad };
    Object.keys(obj).forEach((m) => {
      const r = (obj[m] && typeof obj[m] === 'object') ? obj[m] : {};
      const p = { k, m, p: String(r.p == null ? '' : r.p).slice(0, PICK_MAX),
        o: Number(r.o), t: Number(r.t) || 0 };
      const why = checkPick(p);
      if (why === 'ok') legs.push(p); else bad.push({ m, why });
    });
    legs.sort((a, b) => rnm(a.m).localeCompare(rnm(b.m)));
    return { legs, bad };
  }

  const syncLegs = (ow) => rowsToLegs(ow.k,
    (P.picks && Number(P.picks.k) === ow.k) ? P.picks.rows : null);

  /* 🚨 "IS MY PICK ON THE SHARED LIST" IS THE QUESTION THE CHAT BOX ANSWERS,
     AND IT IS DERIVED FROM THE LIST ITSELF (v73, owner: *"Remove that send it
     to chat part that's big and ugly nobodies ever doing that"*). He is right
     that with the store live it is clutter — and it is also the ONLY route a
     pick has when the store is off or the write was refused, so it cannot
     just be deleted. It renders when the pick is NOT up, which is exactly
     when it is the way through.
     ⚠️ Derived rather than flagged: a `saved: true` on `lh:pick` would be a
     second copy of a fact the store already holds, and it would go on saying
     "sent" after a manager's row was overwritten or the URL changed. The list
     is the truth. */
  const mineIsUp = (ow) => {
    const me = LH && LH.me();
    return !!(me && syncOn() && syncLegs(ow).legs.some((g) => g.m === me));
  };

  async function getPicks(base, k) {
    const r = await fetch(weekPath(base, k), { cache: 'no-store' });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  }

  /* 🚨 A DELETE IS REFUSED BY THE PUBLISHED RULES UNLESS THEY HAVE BEEN
     WIDENED, AND THAT IS HANDLED RATHER THAN ASSUMED. The rules shipped with
     v73 grant `.write` at the leaf only when `newData.hasChildren(['p','o',
     't'])` — a delete has no `newData`, so it is denied. Widening them to
     `!newData.exists() || newData.hasChildren(…)` allows exactly one pick to
     be removed and nothing else, because write is STILL leaf-only. Until
     that is pasted, this call 401s and the card says the pick is still on
     the shared list instead of pretending it is gone. */
  async function delPick(base, k, m) {
    const r = await fetch(pickPath(base, k, m), { method: 'DELETE', cache: 'no-store' });
    if (!r.ok) throw new Error('http ' + r.status);
    return true;
  }

  async function putPick(base, k, m, p, o, t) {
    const r = await fetch(pickPath(base, k, m), {
      method: 'PUT', cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ p, o, t }),
    });
    if (!r.ok) throw new Error('http ' + r.status);
    return true;
  }

  /* 🚨 THE CACHE IS READ BEFORE THE FIRST PAINT, NOT DURING THE REFRESH, AND
     THAT DISTINCTION IS THE WHOLE POINT OF HAVING ONE. The first cut primed
     `P.picks` inside `refreshPicks`, which `paint()` calls AFTER `render()` —
     so the opening paint always drew an empty list, and a cache younger than
     the TTL then returned early without rendering at all. Result: **five
     picks sitting in localStorage and "0 of 12 picks are in" on the screen**,
     for the whole time the reader was looking at it.
     ⚠️ **This is the Lab's v25 fault exactly** — there the cache existed from
     v1 and was only ever used when the fetch FAILED; here it was read and
     never drawn. Both are "a fallback and a first choice are different jobs".
     Found by the render sweep, which reloads inside the TTL window — the
     switch-away-and-come-back case, which is the common one. */
  function primePicks(ow) {
    if (!ow || !syncOn()) return;
    const c = read(SYNC_KEY);
    if (c && Number(c.k) === ow.k) P.picks = c;
  }

  /* ⚠️ Cache first, then revalidate — the v25/v42 shape, for the same reason:
     the list has to be on screen before the network is asked, so a slow or
     dead store costs freshness and never a blank card. */
  function refreshPicks(ow, force) {
    const base = syncBase(P.file);
    if (!base || !ow || typeof fetch !== 'function') return;
    const c = read(SYNC_KEY);
    if (c && Number(c.k) === ow.k) {
      P.picks = c;
      if (!force && Date.now() - (Number(c.at) || 0) < SYNC_TTL) return;
    }
    if (P.busy) return;
    P.busy = true;
    /* 🚨 AN ANSWER THE READER ASKED FOR REPAINTS EVEN IF THE BUTTON THEY
       TAPPED STILL HAS FOCUS. `quietRender` exists to stop an UNPROMPTED
       refresh moving a control under a thumb — and a tap focuses the button,
       so routing an explicit Refresh through it would have left "Checking…"
       on screen for ever with the fresh list already in hand. A button that
       reports the opposite of what it just did is worse than one that
       reports nothing (v30). Found by reading the flow, not by measuring. */
    const done = () => (force ? render() : quietRender());
    const before = (P.picks && Number(P.picks.k) === ow.k) ? P.picks.rows : null;
    getPicks(base, ow.k).then((obj) => {
      P.busy = false; P.syncErr = false;
      if (P.where === 'who') say('', 'who');
      const rows = (obj && typeof obj === 'object') ? obj : {};
      const news = !before || !sameRows(before, rows);
      P.picks = { k: ow.k, rows, at: Date.now() };
      write(SYNC_KEY, P.picks);
      /* Nothing new and nobody asked: leave the page alone entirely. */
      if (!force && !news) return;
      done();
    }).catch((e) => {
      P.busy = false; P.syncErr = true;
      if (P.where === 'who') say('', 'who');
      console.warn('[parlay] the shared picks did not answer', e);
      done();
    });
  }

  /* 🚨 REPAINT ONLY WHEN THERE IS NEWS, AND NEVER EAT A CARET — and the first
     cut of this got it backwards in a way only the browser showed. It skipped
     any repaint while a BUTTON had focus, which is true of the tab button the
     reader just tapped, so **the answer to the very first fetch was thrown
     away**: the card stayed on its pre-fetch state and went on offering the
     chat box for a pick that was already shared. The v25 rule ("do not move a
     control under a thumb") aimed at the wrong risk.
     - The unrecoverable harm is a lost CARET, so that is the only thing the
       guard covers now.
     - The thumb risk is real but it is about a repaint that changes nothing,
       so it is removed at the source: an answer identical to what is already
       on screen does not render at all. A list of twelve picks changes when
       somebody picks, which is rare, and that is exactly when a repaint is
       wanted.
     `force` still overrides both — an explicit Refresh has to clear its own
     "Checking…" even when the answer came back the same. */
  const sameRows = (a, b) => {
    try { return JSON.stringify(a || {}) === JSON.stringify(b || {}); }
    catch (_) { return false; }
  };

  function quietRender() {
    if (typeof document === 'undefined' || !P.host) return;
    const el = document.activeElement;
    if (el && /^(INPUT|TEXTAREA)$/.test(el.tagName || '')) return;
    render();
  }

  const agoTxt = (at) => {
    const mins = Math.round((Date.now() - (Number(at) || 0)) / 60000);
    return mins <= 0 ? 'just now' : mins === 1 ? 'a minute ago' : `${mins} minutes ago`;
  };

  function whoHTML(ow) {
    if (!syncOn()) return '';
    const me = LH ? LH.me() : null;
    const { legs, bad } = syncLegs(ow);
    const all = LH ? LH.roster().map((r) => r.m) : [];
    const missing = all.filter((m) => !legs.some((x) => x.m === m));
    const seen = P.picks && Number(P.picks.k) === ow.k;
    /* Four states, four sentences — the rule this app keeps: "nobody has
       picked yet" and "we could not reach the list" are opposite facts and
       one line must never be shown for the other. */
    const line = P.syncErr && !seen
      ? "<p class=\"lp-note\">Couldn't reach the shared list just now. Your own pick is safe on this phone, and the chat still works.</p>"
      : !seen ? '<p class="lp-note">Checking who is in…</p>'
        : P.syncErr ? `<p class="lp-note">Showing the last list that came through, ${esc(agoTxt(P.picks.at))} — the store did not answer just now.</p>`
          : `<p class="lp-note">Updated ${esc(agoTxt(P.picks.at))}.</p>`;
    const rows = legs.map((g) => {
      const mine = !!me && g.m === me;
      return `<div class="lp-leg${mine ? ' you' : ''}">
        <div class="lp-leg-t">${P.cr ? P.cr(g.m, 32) : ''}<span class="lp-leg-n">${esc(rnm(g.m))}${mine ? ' <span class="lg-you">YOU</span>' : ''}</span></div>
        <div class="lp-leg-p">${esc(g.p)}<b>${esc(oddsTxt(g.o))}</b></div>
      </div>`;
    }).join('');
    /* ⚠️ It read "Nobody has picked yet." directly under a lead saying "0 of
       12 picks are in" — one fact twice on one card, which is the v22 shape
       and the one thing this app is otherwise careful about. The lead carries
       the count; this carries the invitation. */
    const none = `<div class="ffp-empty"><b>The first leg of ${esc(ow.l)} is going spare.</b></div>`;
    return `<h2 class="section-title">👥 ${esc(ow.l)} — who is in</h2>
      <div class="ffp-card">
        <p class="fh-lead"><b>${legs.length} of ${all.length} picks are in.</b> Everybody's leg lands here as they save it, so the twelve of you are looking at the same board.</p>
        ${legs.length ? `<div class="lp-legs">${rows}</div>` : none}
        ${missing.length ? `<p class="lp-note">Still to pick: <b>${missing.map((m) => esc(rnm(m))).join(', ')}</b>.</p>` : legs.length ? '<p class="lp-note">That is everybody — the ticket can go on.</p>' : ''}
        ${bad.length ? `<p class="lp-note">⚠️ ${bad.length === 1 ? 'One row' : `${bad.length} rows`} in the list would not read as a bet and ${bad.length === 1 ? 'was' : 'were'} left out.</p>` : ''}
        ${line}
        ${noteFor('who')}
        <div class="lp-btns"><button type="button" class="lp-alt" data-lp="sync">Refresh</button></div>
      </div>`;
  }

  /* ══ 🎯 YOUR PICK ══════════════════════════════════════════════════════ */
  /* 🚨 A STATUS LINE BELONGS TO ONE CARD. `note` was a single string rendered
     into every `.lp-say` on the page, so "Saved. Send it to the chat" printed
     under the pick card AND under the collector — one event, reported twice,
     in a place where the second one is about something the reader did not do.
     Found by looking at the render; no assertion could see it, so there is a
     law for it now. `where` is which card asked. */
  const P = { host: null, cr: null, api: null, file: null, err: null,
    note: '', where: '', det: false, paste: '', sel: null, prop: false };
  const say = (txt, where) => { P.note = txt; P.where = where; };
  const noteFor = (where) => (P.where === where && P.note
    ? `<p class="lp-say" role="status">${esc(P.note)}</p>` : '<p class="lp-say" role="status"></p>');

  /* 🚨 A PICK BELONGS TO A PERSON, NOT JUST TO A WEEK (v82, owner: *"I did
     view as another member and is this what they are seeing"* — it was not).
     `lh:pick` was keyed by WEEK alone, and this app's founding premise is
     that "you" is a ROLE: any of the twelve can read as any other. So tapping
     a different name on the picker inherited that device's saved bet as
     though it were the new reader's own — the card read "your pick is in"
     over somebody else's leg, with the who-card underneath it listing that
     same reader under **Still to pick**. One page, two answers.
     ⚠️ IT WAS NOT ONLY A VIEWING FAULT. `edit` and `save` write to
     `LH.me()`'s row, so changing the inherited pick would have put one
     manager's bet on the shared list under another manager's name — and
     `drop` would have cleared the real owner's pick off their own phone
     while their row stayed on the ticket. The exact split the v75 delete
     order exists to prevent, reached from the other side. */
  const myPick = (k) => {
    const j = read(PICK_KEY); const me = LH && LH.me();
    if (!j || Number(j.k) !== k || !me) return null;
    return j.m ? (j.m === me ? j : null) : (legacyMine(j, me) ? j : null);
  };

  /* ⚠️ A PICK SAVED BEFORE v82 RECORDS NO OWNER, AND THE SHARED LIST IS WHAT
     CAN SAY WHOSE IT IS. Dropping every ownerless pick outright would take a
     real leg off its owner's own screen mid-week while the who-card still
     showed them in; adopting it for whoever is reading is the bug this
     version exists to end. So it is RESOLVED rather than guessed: a row on
     the list for the reader that matches it makes it theirs, a row for
     somebody ELSE that matches it makes it not theirs, and a pick that
     matches no row at all is a pick whose write never landed — which is
     exactly the state the chat box exists for, so that one stays.
     ⚠️ Resolved on every read rather than stamped once, because a stamp
     taken before the list has arrived is a guess written down. It costs
     nothing to keep resolving: the moment that reader saves, the pick is
     written with `m` and this stops being consulted, and `lh:pick` is keyed
     by week so nothing ownerless survives into the next one. */
  const legacyMine = (j, me) => {
    if (!syncOn()) return true;
    const rows = (P.picks && Number(P.picks.k) === Number(j.k)) ? P.picks.rows : null;
    if (!rows || typeof rows !== 'object') return true;
    const same = (r) => !!r && String(r.p) === String(j.p) && Number(r.o) === Number(j.o);
    if (same(rows[me])) return true;
    return !Object.keys(rows).some((m) => m !== me && same(rows[m]));
  };

  /* 🚨 THE REAL NAME, NEVER `nm()`. This string is read by the other eleven
     in a group chat, and `nm()` answers "You" for whoever is holding the
     phone — so a pick shared by Buley would arrive in the chat as
     "You: Bills -7". That is the v33 byline bug exactly: a sentence written
     on one device and read on another has no "you" in it. */
  function pickText(ow, m, p, o) {
    const url = (P.api && P.api.url) ? P.api.url() : '';
    const pay = b64enc({ v: 1, k: ow.k, m, p, o, t: Date.now() });
    return `${ow.l} parlay — ${rnm(m)}: ${p} (${oddsTxt(o)})\n${url}#p=${pay}`;
  }

  function pickHTML(ow) {
    const me = LH ? LH.me() : null;
    /* ⚠️ A name is needed to put a LEG in, and that is not the app gating
       content — every table on this page renders for a stranger exactly as
       before. A bet belongs to a person, so the one thing that cannot be
       anonymous is the one thing that asks. The picker is one tap away and
       the wording is an invitation, the same as everywhere else. */
    if (!me) {
      return `<h2 class="section-title">📝 ${esc(ow.l)} — the picks are open</h2>
        <div class="ffp-card lp-you">
          <p><b>Everybody puts one NFL bet in and the twelve go on together.</b>
          Tap your name and you can put your leg in from here — it writes the line
          for you to drop in the group chat, and whoever is placing the bet collects
          the twelve into one ticket.</p>
          <button type="button" class="lg-sheet-go" data-pickme="1">👤 Pick your name</button>
        </div>`;
    }
    const mine = myPick(ow.k);
    /* ⚠️ Read once, before the branch, so the note and the controls under it
       cannot disagree about whether the pick got out. */
    const up = mine && mineIsUp(ow);
    /* ⚠️ 📝 rather than 🎯, and the render is what caught it: "Who carries the
       ticket" is already 🎯, so with picks open the jump row carried the same
       mark twice — and that row is scanned by its mark (the v50 clash, which
       arrived there the same way, as a knock-on of something else moving).
       ⚠️ U+1F4DD is `Emoji_Presentation=Yes`, so unlike ⚡ and 🎖️ it needs no
       variation selector — checked on the render rather than assumed. */
    const head = `<h2 class="section-title">📝 ${esc(ow.l)} — ${mine ? 'your pick is in' : 'your pick'}</h2>`;
    if (mine) {
      return `${head}
        <div class="ffp-card lp-you">
          <div class="lp-mine">
            <span class="lp-mine-p">${esc(mine.p)}</span>
            <span class="lp-mine-o">${esc(oddsTxt(mine.o))}</span>
          </div>
          <p class="lp-note">${up
            ? 'On the shared list — the other eleven can see it.'
            : syncOn()
              ? "Saved on this phone, but it has not reached the shared list. Send it to the chat so it still makes the ticket."
              : 'Saved on this phone. It is not on the ticket until somebody collects it, so send it to the chat.'}</p>
          ${up ? '' : `<textarea class="lp-out" data-lp-t="pick" readonly rows="3" aria-label="Your pick, ready to send">${esc(pickText(ow, LH.me(), mine.p, mine.o))}</textarea>`}
          <div class="lp-btns">
            ${up ? '' : `<button type="button" class="lg-sheet-go" data-lp="send" data-lp-for="pick">${navigator.share ? '📤 Send it to the chat' : '📋 Copy it for the chat'}</button>`}
            <button type="button" class="${up ? 'lg-sheet-go' : 'lp-alt'}" data-lp="edit">Change my pick</button>
            <button type="button" class="lp-alt" data-lp="drop">Clear my pick</button>
          </div>
          ${noteFor('pick')}
        </div>`;
    }
    const games = playable(ow);
    const chosen = selPick(ow);
    /* ⚠️ The prop field is a fallback, not the front door — it opens by
       itself only when there is no board to tap, which is exactly when it is
       the only way in. With a board up it is one line, out of the way. */
    const prop = `<details class="lp-prop"${(!games.length || P.prop) ? ' open' : ''} data-lp-prop="1">
        <summary><b>Something else — write it in</b><i>▾</i></summary>
        <label class="lp-lab" for="lp-bet">The bet</label>
        <input class="lp-in" id="lp-bet" type="text" maxlength="${PICK_MAX}" autocomplete="off"
          placeholder="Saquon 75+ rushing yards" value="${esc(P.draftP || '')}" />
        <label class="lp-lab" for="lp-odds">The price</label>
        <input class="lp-in lp-in-s" id="lp-odds" type="text" inputmode="text" autocomplete="off"
          placeholder="-110" value="${esc(P.draftO || '')}" />
        <div class="lp-btns"><button type="button" class="lg-sheet-go" data-lp="save">Save my pick</button></div>
      </details>`;
    /* 🚨 SAVE SITS WHERE THE CHOOSING HAPPENS, AND THE FIRST CUT PUT IT ABOVE
       THE BOARD. Sixteen games is roughly ninety buttons and a very long
       scroll, so tapping a line and then scrolling back to the top to confirm
       it is the whole interaction fighting the reader. The chosen line rides
       a bar pinned to the bottom of the screen — a bet slip, which is the one
       pattern everybody using this already knows — and the prop field keeps
       its own button inside itself, next to the thing being typed. Neither
       path has two buttons and neither has none. */
    return `${head}
      <div class="ffp-card lp-you">
        <p><b>One NFL bet, any market.</b> ${games.length
          ? 'Tap a line below, or write your own prop.'
          : "The week's lines are not posted yet, so write the bet the way the book writes it. Tappable lines turn up here on their own once they are."}</p>
        ${noteFor('pick')}
        ${boardNote(ow)}
        ${gameBoardHTML(ow)}
        ${prop}
      </div>
      ${chosen ? `<div class="lp-bar"><div class="lp-bar-in">
        <div class="lp-bar-t"><b>${esc(chosen.p)}</b><span>${esc(oddsTxt(chosen.o))}</span></div>
        <button type="button" class="lg-sheet-go" data-lp="save">Save</button>
      </div></div>` : ''}`;
  }

  /* ══ 🧾 COLLECTING THE TICKET ══════════════════════════════════════════ */
  const collected = () => { const j = read(TICK_KEY); return (j && Array.isArray(j.legs)) ? j : { k: null, legs: [] }; };

  /* 🚨 ONE RESOLVER, AND THAT IS WHY IT IS SPLIT IN TWO. A leg now arrives by
     three routes — a pasted chat, a tapped link, and the shared list — and
     each of them ends here. A second copy of "later wins" would eventually
     disagree with this one about which of two picks is on the ticket, which
     is the v14 fault (one concept, two implementations, each right, the page
     lying). `takeOne` is only the decoding step in front of it. */
  function takeLeg(p, wantK) {
    const why = checkPick(p);
    if (why !== 'ok') return why;
    if (wantK != null && Number(p.k) !== wantK) return 'week';
    const box = collected();
    if (box.k !== Number(p.k)) { box.k = Number(p.k); box.legs = []; }
    const leg = { m: p.m, p: String(p.p).slice(0, PICK_MAX), o: Number(p.o), t: Number(p.t) || 0 };
    const at = box.legs.findIndex((x) => x.m === leg.m);
    let out = 'ok';
    if (at !== -1) {
      /* 🚨 TWO PICKS FROM ONE PERSON IS REPORTED, NEVER SILENTLY RESOLVED.
         Taking the later one is the right answer — somebody changed their
         mind — but doing it quietly is how a leg nobody meant ends up on a
         ticket that has already been paid for. */
      if (leg.t >= box.legs[at].t) box.legs[at] = leg;
      out = 'dupe';
    } else box.legs.push(leg);
    write(TICK_KEY, box);
    return out;
  }

  /* One payload in. Returns why it did not go on, so the card can say which
     of the four things went wrong rather than "that didn't work". */
  function takeOne(payload, wantK) {
    let p;
    try { p = b64dec(payload); } catch (_) { return 'bad'; }
    return takeLeg(p, wantK);
  }

  const emptyTally = () => ({ ok: 0, dupe: 0, bad: 0, who: 0, odds: 0,
    empty: 0, week: 0, none: false });

  /* The shared list, merged in through the SAME resolver a paste goes
     through — so a manager who is in both is one leg and is reported as a
     duplicate, and the later of the two wins whichever route it came by. */
  function takeAll(legs, wantK) {
    const tally = emptyTally();
    tally.none = !legs.length;
    legs.forEach((p) => { tally[takeLeg(p, wantK)]++; });
    return tally;
  }

  /* Pull every payload out of whatever got pasted — the whole chat, one
     message, or a bare code. Anything that is not a payload is ignored
     rather than reported, because a paste of a chat is mostly not payloads. */
  function takeMany(text, wantK) {
    const found = String(text || '').match(/[#&]p=([A-Za-z0-9\-_]+)/g) || [];
    let codes = found.map((x) => x.slice(3));
    if (!codes.length) {
      const bare = String(text || '').trim();
      if (/^[A-Za-z0-9\-_]{16,}$/.test(bare)) codes = [bare];
    }
    const tally = emptyTally();
    tally.none = !codes.length;
    codes.forEach((c) => { tally[takeOne(c, wantK)]++; });
    return tally;
  }

  function tallyLine(t) {
    if (t.none) return 'Nothing in that paste looked like a pick. Copy the whole message — the link is the part that matters.';
    const bits = [];
    if (t.ok) bits.push(`<b>${t.ok} added</b>`);
    if (t.dupe) bits.push(`${t.dupe} already had a pick — kept the later one`);
    if (t.week) bits.push(`${t.week} for a different week, left out`);
    if (t.who) bits.push(`${t.who} named somebody not in the league`);
    if (t.odds) bits.push(`${t.odds} had no usable price`);
    if (t.empty + t.bad) bits.push(`${t.empty + t.bad} arrived damaged`);
    return bits.join(' · ') || 'Nothing new in that one.';
  }

  /* ⚠️ Its own sentence, not `tallyLine`'s. "Nothing in that paste looked
     like a pick" is true of a paste and nonsense about a list nobody pasted
     — the same rule that keeps four empty states apart. */
  function pullLine(t) {
    if (t.none) return 'Nobody has put a pick in the shared list yet.';
    const bits = [];
    if (t.ok) bits.push(`<b>${t.ok} added</b>`);
    if (t.dupe) bits.push(`${t.dupe} already had a pick — kept the later one`);
    if (t.week) bits.push(`${t.week} for a different week, left out`);
    if (t.who + t.odds + t.empty + t.bad) bits.push(`${t.who + t.odds + t.empty + t.bad} would not read as a bet`);
    return bits.join(' · ') || 'Nothing new — the ticket already has all of those.';
  }

  const today = () => new Date().toISOString().slice(0, 10);

  function collectHTML(ow) {
    const box = collected();
    /* ⚠️ Offered rather than done for you, and the count is on the button.
       Merging the shared list into the ticket mutates what somebody is about
       to put money on, so it is a tap with a number on it and a line
       afterwards saying what it did — never a silent sync. */
    const shared = syncOn() ? syncLegs(ow).legs : [];
    const pull = shared.length
      ? `<p class="lp-note">Everybody's picks are in the shared list — pull them straight in.</p>
      <div class="lp-btns"><button type="button" class="lg-sheet-go" data-lp="pull">Pull in the ${shared.length === 1 ? 'one pick' : `${shared.length} picks`}</button></div>`
      : '';
    const legs = box.legs.slice().sort((a, b) => rnm(a.m).localeCompare(rnm(b.m)));
    const t = legs.length ? ticketOf({ k: box.k, l: ow.l, legs }) : null;
    const missing = LH ? LH.roster().map((r) => r.m).filter((m) => !legs.some((x) => x.m === m)) : [];
    const blob = legs.length ? JSON.stringify({
      k: box.k, l: ow.l, d: today(),
      ...(Number(P.stake) > 0 ? { stake: Number(P.stake) } : {}),
      legs: legs.map((x) => ({ m: x.m, p: x.p, o: x.o })),
    }, null, 2) : '';
    const book = t ? `${ow.l} group parlay — ${spell(t.legs.length)} legs (${priceTxt(t.price)})\n`
      + legs.map((x) => `${x.p}  ${oddsTxt(x.o)}   [${rnm(x.m)}]`).join('\n') : '';
    return `<details class="ffp-card fh-det lp-col"${P.det ? ' open' : ''} data-lp-det="1">
      <summary><b>🧾 Putting the ticket on?</b><span>${legs.length ? `${legs.length} in` : ''}</span><i>▾</i></summary>
      ${pull}
      <p class="lp-note">${pull ? 'Or paste' : 'Paste'} the picks out of the group chat — all of them at once is fine, it finds every one. Tapping somebody's link adds it too.</p>
      <textarea class="lp-in lp-paste" id="lp-paste" rows="3" placeholder="Paste the chat here"></textarea>
      <div class="lp-btns">
        <button type="button" class="lg-sheet-go" data-lp="add">Add the picks</button>
        ${legs.length ? '<button type="button" class="lp-alt" data-lp="clear">Start again</button>' : ''}
      </div>
      ${noteFor('col')}
      ${t ? `<div class="lp-asm">
        <div class="lp-top">
          <div class="lp-price"><b>${esc(priceTxt(t.price))}</b><i>${spell(t.legs.length)} legs so far</i></div>
        </div>
        ${legs.map((x) => `<div class="lp-leg">
          <div class="lp-leg-t">${P.cr ? P.cr(x.m, 32) : ''}<span class="lp-leg-n">${esc(rnm(x.m))}</span></div>
          <div class="lp-leg-p">${esc(x.p)}<b>${esc(oddsTxt(x.o))}</b></div>
        </div>`).join('')}
        ${missing.length ? `<p class="lp-note">Still to come: <b>${missing.map((m) => esc(rnm(m))).join(', ')}</b>.</p>` : '<p class="lp-note">That is everybody.</p>'}
        <label class="lp-lab" for="lp-stake">Stake (optional)</label>
        <input class="lp-in lp-in-s" id="lp-stake" type="text" inputmode="decimal" placeholder="60" value="${esc(P.stake || '')}" />
        ${Number(P.stake) > 0 ? `<p class="lp-note">${esc(cash(Number(P.stake)))} on it returns <b>${esc(cash(Number(P.stake) * t.price))}</b> if every leg lands.</p>` : ''}
        <label class="lp-lab">The bet, to type into the book</label>
        <textarea class="lp-out" data-lp-t="book" readonly rows="4">${esc(book)}</textarea>
        <div class="lp-btns"><button type="button" class="lg-sheet-go" data-lp="send" data-lp-for="book">${navigator.share ? '📤 Send the ticket' : '📋 Copy the ticket'}</button></div>
        <label class="lp-lab">Send this to get it on everyone's app</label>
        <textarea class="lp-out lp-blob" data-lp-t="blob" readonly rows="4">${esc(blob)}</textarea>
        <div class="lp-btns"><button type="button" class="lg-sheet-go" data-lp="send" data-lp-for="blob">${navigator.share ? '📤 Send it' : '📋 Copy it'}</button></div>
        <p class="lp-note">⚠️ Collected on <b>this phone only</b>. It does not reach anybody else's app until that block is committed to the repo.</p>
      </div>` : ''}
    </details>`;
  }

  /* ⚠️ Two sentences for two different apps, and the app has to say which one
     it is. With a store wired up the picks genuinely do reach everybody; with
     none they genuinely do not, and v72 shipped the second sentence because
     it was the only true one. Printing either while the other is the case
     would be the worst copy on the page — a reader would check it, and it is
     one line of data apart from being wrong. */
  const howtoHTML = () => (syncOn()
    ? `<div class="ffp-card"><p class="ffp-cap">👥 <b>Everybody's picks land in the app as they are made.</b> Save yours and it is on the other eleven phones within seconds — no chat step needed, though the line is still there if you want to send it. ⚠️ <b>It is a shared list, not a login:</b> there is nothing to sign in to here, so a pick is only as good as the name on it, and whoever puts the bet on still reads all twelve legs before it goes to a book.</p></div>`
    : `<div class="ffp-card"><p class="ffp-cap">🔗 <b>Picks travel through the group chat, not through the app.</b> This app is a set of static files with nothing behind it — no account, no server, nowhere for twelve phones to write to. So your pick is saved on your phone and turned into a line you send; whoever is placing the bet collects the twelve and publishes the ticket, and from then on everybody sees it here.</p></div>`);

  /* ⚠️ Said once, at the bottom, and it is the honest half of this tab: the
     legs are transcribed and everything with a number in it is not. */
  /* ⚠️ ✍️ RATHER THAN ⚑, AND THE DIFFERENCE MATTERS. ⚑ is the archive's
     "playoffs only" badge — a mark with a specific meaning three taps away in
     the ? sheet's key — and borrowing it for a different kind of caveat would
     teach a reader that one glyph means two things. The v50 rule about an
     icon only being unique relative to its page, applied across pages. */
  const SOURCE = `<div class="ffp-card"><p class="ffp-cap">✍️ <b>The picks come from the twelve of you and the results are typed in from the slip.</b> They are the only facts in this app that are not worked out from the archive, because a bet has no other source. Everything else on this page is derived from those legs when it loads — the combined price, the payout, every record and every rate — so correcting one leg corrects the whole tab.</p></div>`;

  /* ══ WHAT IS ON SCREEN WHEN THERE IS NO TICKET ═════════════════════════
     Four opposite facts, four sentences, keyed by the state — so adding a
     fifth without writing its sentence is a visible hole rather than a quiet
     fall-through to the friendly one. "Nothing published yet" when the truth
     is "you are offline" is a lie, and it is the same lie when the truth is
     "the file 404s": `parlay/current.json` SHIPS with an empty `weeks` array,
     so an unstarted season still answers 200 and a 404 can only be a broken
     deploy. */
  const EMPTY = {
    none: "<b>No ticket up yet, and no week open for picks.</b>Each week everybody puts one NFL bet in and the twelve of them ride together as a single parlay. Picks open for a week as soon as one is set — after that every week opens by itself the moment the last ticket is published.",
    missing: "<b>The parlay file didn't load.</b>The file that holds the tickets is not there, which is a fault at our end rather than yours. The rest of the app is unaffected.",
    offline: "<b>Can't reach this week's ticket.</b>You're offline, or the page didn't load properly. The History tab works with no connection at all, so all thirteen seasons are still there.",
    bad: "<b>That ticket doesn't look right.</b>The file is there but what is in it isn't a parlay, so nothing is shown rather than half of one. The rest of the app is unaffected.",
  };

  const emptyHTML = (why) => `<h2 class="section-title">🎲 The group parlay</h2>
    <div class="ffp-card"><div class="ffp-empty">${EMPTY[why] || EMPTY.none}</div></div>`;

  async function load() {
    let r;
    try { r = await fetch(FILE, { cache: 'no-store' }); }
    catch (e) { return { why: 'offline' }; }
    if (!r.ok) return { why: 'missing' };
    let j;
    try { j = await r.json(); } catch (e) { return { why: 'bad' }; }
    if (!j || !Array.isArray(j.weeks)) return { why: 'bad' };
    return { file: j };
  }

  /* 🚨 EVERY WRITE GOES THROUGH `render`, SO THE GUARD ONLY HAS TO BE HERE —
     and it has to be here, because the callers are the problem: a picks
     fetch, a board fetch, and a `visibilitychange` that fires on every
     reopen. Any of them can resolve long after the reader has moved to
     another tab, and `#lg-body` is the same element for every view.
     ⚠️ Read off the SHELL's stamp rather than a flag of our own: `paint` is
     not told when its view is torn down, so a local "am I visible" boolean
     would have to be maintained from the outside anyway — and the moment it
     drifted, this would be back to painting over other people's pages. */
  const ownsHost = () => !!(P.host && P.host.dataset && P.host.dataset.view === 'parlay');

  function render() {
    const host = P.host;
    if (!host) return;
    /* Somebody else's page is on screen; this answer is no longer wanted.
       Nothing is lost — coming back to the tab repaints from scratch. */
    if (!ownsHost()) return;
    if (P.err) { host.innerHTML = emptyHTML(P.err); return; }
    const file = P.file || { weeks: [] };
    const weeks = Array.isArray(file.weeks) ? file.weeks : [];
    const ow = openWeekOf(file, weeks);
    let s2;
    /* A file that parses is not a ticket that renders (the v29 rule). The
       throw and the near-miss are the same fault — the file is readable and
       what is in it is not a week — so both get the one honest sentence. */
    try { s2 = seasonOf(weeks); } catch (e) {
      console.error('[parlay] the file parsed but would not derive', e);
      host.innerHTML = emptyHTML('bad'); return;
    }
    const has = !!(s2 && s2.ts.length);
    if (!ow && !has) { host.innerHTML = emptyHTML('none'); return; }
    try {
      let out = '';
      if (ow) out += pickHTML(ow) + whoHTML(ow) + collectHTML(ow) + howtoHTML();
      if (has) out += ticketHTML(s2.ts[0], P.cr, !!ow) + tallyHTML(s2) + boardHTML(s2) + pastHTML(s2, P.cr);
      /* The bar is pinned to the viewport, so the page needs room under it or
         it covers whatever the reader has scrolled to the bottom of. */
      const barred = ow && LH && LH.me() && !myPick(ow.k) && selPick(ow);
      host.innerHTML = out + SOURCE + (barred ? '<div class="lp-bar-pad"></div>' : '');
    } catch (e) {
      console.error('[parlay] that ticket would not render', e);
      host.innerHTML = emptyHTML('bad');
    }
  }

  const curOpen = () => openWeekOf(P.file || {}, (P.file && P.file.weeks) || []);
  const val = (id) => { const el = document.getElementById(id); return el ? el.value : ''; };

  /* 🚨 GUARDED, BECAUSE `checks.js` REQUIRES THIS FILE IN NODE. The laws
     drive the derivations and the rendered markup with no DOM at all, so a
     bare `document.addEventListener` at module scope throws on load and takes
     every parlay law down with it — the suite would report a crash rather
     than a fault, which is the least useful failure a check can have.
     ⚠️ One delegated listener per event for the whole module: this view is
     re-rendered wholesale on every edit, so per-element handlers would be
     re-bound each time and a stale one would fire at a node that is gone. */
  if (typeof document !== 'undefined') wire();

  function wire() {
  document.addEventListener('click', (e) => {
    const b = e.target && e.target.closest ? e.target.closest('[data-lp]') : null;
    if (!b) return;
    const act = b.dataset.lp;
    const ow = curOpen();
    if (act === 'opt') {
      /* Tapping a line clears whatever was half-typed in the prop box and
         vice versa — two answers to one question, and the one they touched
         last is the one they mean. */
      P.sel = { g: Number(b.dataset.g), id: b.dataset.o };
      P.draftP = ''; P.draftO = '';
      say('', 'pick');
      return render();
    }
    if (act === 'save') {
      const chosen = selPick(ow);
      const p = chosen ? chosen.p : String(val('lp-bet') || '').trim().slice(0, PICK_MAX);
      const o = chosen ? chosen.o : parseOdds(val('lp-odds'));
      if (!p) { say('Write the bet first — however the book writes it.', 'pick'); return render(); }
      if (!okOdds(o)) { say('The price needs to be a number like -110 or +150.', 'pick'); return render(); }
      if (!ow || !LH.me()) { say('Picks are not open right now.', 'pick'); return render(); }
      /* 🚨 LOCAL FIRST, ALWAYS, AND THE STORE AFTERWARDS. The write that
         cannot fail happens before the one that can, so a dead store costs
         the other eleven a live view and costs the picker nothing — their
         leg is saved and their chat line is on screen underneath it. The
         v42 doctrine, pointed at a write. */
      const at = Date.now();
      write(PICK_KEY, { k: ow.k, m: LH.me(), p, o, at });
      P.draftP = ''; P.draftO = ''; P.sel = null;
      const base = syncBase(P.file);
      if (!base) { say('Saved. Send it to the chat so it makes the ticket.', 'pick'); return render(); }
      say('Saved. Putting it up for the others…', 'pick');
      render();
      putPick(base, ow.k, LH.me(), p, o, at).then(() => {
        say('Saved — the others can see it on their Parlay tab.', 'pick');
        /* ⚠️ The 200 IS the confirmation that the row exists, so the list is
           updated here rather than being emptied and re-fetched. Clearing it
           first made the chat box flash back on for one frame between the
           save and the refresh landing — the control the owner asked to
           remove, reappearing at the exact moment it had just been earned. */
        const rows = (P.picks && Number(P.picks.k) === ow.k) ? P.picks.rows : {};
        rows[LH.me()] = { p, o, t: at };
        P.picks = { k: ow.k, rows, at: Date.now() };
        refreshPicks(ow, true); render();
      }).catch((e) => {
        console.warn('[parlay] that pick did not reach the shared list', e);
        say("Saved on this phone, but the shared list couldn't be reached. Send it to the chat instead.", 'pick');
        render();
      });
      return;
    }
    /* 🚨 `drop`, NOT `clear` — that action name is already the collector's
       "Start again", and a second handler for one name in one delegated
       listener means whichever branch is reached first wins, silently. The
       v71 name collision (`boardHTML` twice) took a whole card off the page
       the same way; it is cheaper to not do it again than to find it.
       🚨 AND THE LOCAL STATE NEVER CONTRADICTS THE STORE. When the pick is on
       the shared list, the DELETE goes FIRST and `lh:pick` is only cleared if
       it succeeds — the opposite order would leave the reader with no pick on
       their own phone while the other eleven, and the ticket, still carried
       their bet. That is the worst possible split, so a refused delete leaves
       everything exactly as it was and says why. (The reverse order is right
       for SAVING, where the local write is the one that must not fail — the
       two are not symmetric, because a save adds and a clear removes.) */
    if (act === 'drop') {
      const mine = ow ? myPick(ow.k) : null;
      if (!mine) return;
      const base = syncBase(P.file);
      /* No store, or it never got there: nothing to take back. */
      if (!base || !mineIsUp(ow)) {
        write(PICK_KEY, null); P.draftP = ''; P.draftO = ''; P.sel = null;
        say('Cleared. Pick again whenever you like.', 'pick');
        return render();
      }
      say('Taking it off the shared list…', 'pick');
      render();
      delPick(base, ow.k, LH.me()).then(() => {
        write(PICK_KEY, null); P.draftP = ''; P.draftO = ''; P.sel = null;
        const rows = (P.picks && Number(P.picks.k) === ow.k) ? P.picks.rows : {};
        delete rows[LH.me()];
        P.picks = { k: ow.k, rows, at: Date.now() };
        say('Cleared, and off the shared list. Pick again whenever you like.', 'pick');
        refreshPicks(ow, true); render();
      }).catch((e) => {
        console.warn('[parlay] that pick would not come off the shared list', e);
        say("Couldn't take it off the shared list, so it is still on the ticket. Change it to something else instead.", 'pick');
        render();
      });
      return;
    }
    if (act === 'edit') {
      const mine = ow ? myPick(ow.k) : null;
      if (mine) { P.draftP = mine.p; P.draftO = String(mine.o); }
      write(PICK_KEY, null);
      /* ⚠️ Said rather than left to be discovered: clearing it here does not
         clear it for the others. Nothing is deleted from the shared list —
         saving the new one writes over the old one — so between the two taps
         the other eleven are still looking at the old bet. */
      say(syncOn() ? 'The others still see your old pick until you save the new one.' : '', 'pick');
      return render();
    }
    if (act === 'add') {
      const t = takeMany(val('lp-paste'), ow ? ow.k : null);
      P.det = true;
      say(tallyLine(t).replace(/<[^>]+>/g, ''), 'col');
      return render();
    }
    if (act === 'clear') { write(TICK_KEY, null); say('Cleared.', 'col'); P.det = true; return render(); }
    /* ⚠️ It says "checking" before it goes, because the answer is usually the
       same list and a Refresh that repaints identical rows reads as a button
       that does nothing — the v30 fault, which is about a control being
       silent rather than about it being wrong. */
    if (act === 'sync') { say('Checking…', 'who'); refreshPicks(ow, true); return render(); }
    if (act === 'pull') {
      const t = takeAll(syncLegs(ow).legs, ow ? ow.k : null);
      P.det = true;
      say(pullLine(t).replace(/<[^>]+>/g, ''), 'col');
      return render();
    }
    if (act === 'send') {
      /* ⚠️ The button NAMES the box it sends, rather than counting boxes in
         the card. The first cut picked one by position and happened to be
         right — a thing that works by accident stops working the day a
         fourth field is added, silently, by sending the wrong text. */
      const box = b.closest('.ffp-card') || document;
      const ta = box.querySelector(`[data-lp-t="${b.dataset.lpFor}"]`);
      if (!ta) return;
      /* ⚠️ The text is on screen and selectable whatever the button does — a
         share that fails silently on an unknown browser would leave somebody
         holding nothing, which is the whole reason for the third rung. */
      if (P.api && P.api.share) {
        const w = b.dataset.lpFor === 'pick' ? 'pick' : 'col';
        P.api.share(ta.value).then((msg) => { if (msg != null) { say(msg, w); render(); } });
      } else { ta.focus(); ta.select(); say('Press and hold to copy it.', b.dataset.lpFor === 'pick' ? 'pick' : 'col'); render(); }
      return;
    }
  });

  /* Typing is kept in memory so a repaint cannot eat a half-written bet, and
     the stake only repaints on blur — re-rendering per keystroke would drop
     the caret, which is its own kind of data loss (the Lab's v25 rule). */
  document.addEventListener('input', (e) => {
    const el = e.target;
    if (!el || !el.id) return;
    if (el.id === 'lp-bet' || el.id === 'lp-odds') P.sel = null;
    if (el.id === 'lp-bet') P.draftP = el.value;
    if (el.id === 'lp-odds') P.draftO = el.value;
    if (el.id === 'lp-stake') P.stake = el.value;
  });
  document.addEventListener('change', (e) => {
    if (e.target && e.target.id === 'lp-stake') { P.det = true; render(); }
  });
  /* ⚠️ Coming back to the app IS the moment somebody wants to know who has
     picked, so that is when it asks — rather than a timer running down a
     battery all Sunday for a list that changes twelve times a week. */
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && P.host) refreshPicks(curOpen(), true);
  });

  /* `toggle` does not bubble, so it is caught on the way down. */
  document.addEventListener('toggle', (e) => {
    if (e.target && e.target.matches && e.target.matches('[data-lp-det]')) P.det = !!e.target.open;
    if (e.target && e.target.matches && e.target.matches('[data-lp-prop]')) P.prop = !!e.target.open;
  }, true);
  }

  /* Handed a payload by the shell when the app is opened on somebody's pick
     link. ⚠️ It runs BEFORE the first paint and therefore before the file is
     loaded, so it cannot check the week — it takes the leg on its own say-so
     and the collector card shows which week it belongs to. */
  function take(payload) {
    const r = takeOne(payload, null);
    P.det = true;
    P.where = 'col';
    P.note = r === 'ok' ? 'Added that pick to the ticket you are collecting.'
      : r === 'dupe' ? 'That manager already had a pick — kept the later one.'
      : r === 'who' ? 'That link names somebody who is not in the league.'
      : r === 'odds' ? 'That link arrived without a usable price.'
      : r === 'empty' ? 'That link arrived with no bet on it.'
      : 'That pick link arrived damaged.';
    if (P.host) render();
    return r;
  }

  async function paint(host, cr, api) {
    P.host = host; P.cr = cr; P.api = api || P.api;
    host.innerHTML = '<div class="ffp-card"><div class="ffp-empty">Loading this week\'s ticket…</div></div>';
    const got = await load();
    if (got.why) { P.err = got.why; P.file = null; } else { P.err = null; P.file = got.file; }
    /* Before the paint, or the paint draws a list this device already has. */
    primePicks(curOpen());
    render();
    /* Both behind the reader, deliberately not awaited: the page is already
       on screen from the file and the cache before either is asked. */
    refreshBoard(curOpen());
    refreshPicks(curOpen(), false);
  }

  window.LeagueParlay = {
    paint,
    /* For the repo's own checks — nothing in the app reads these.
       ⚠️ `_html` is the whole page for a given set of weeks, and it is here
       because the rule in this repo is ASSERT WHAT RENDERS (v7): a law that
       agrees with `seasonOf` would go on passing over a view that had stopped
       reading it. This is the exact markup `paint` writes, minus the fetch. */
    take,
    _dec: dec, _amer: amer, _ticket: ticketOf, _season: seasonOf,
    _enc64: b64enc, _dec64: b64dec, _check: checkPick, _odds: parseOdds,
    _open: openWeekOf, _takeOne: takeOne, _takeMany: takeMany,
    _html: (weeks, cr) => { const s = seasonOf(weeks);
      return ticketHTML(s.ts[0], cr) + tallyHTML(s) + boardHTML(s) + pastHTML(s, cr) + SOURCE; },
    _empty: emptyHTML,
    _pickHTML: (ow) => pickHTML(ow),
    _options: optionsFor,
    _board: boardFrom,
    _note: boardNote,
    _live: (v) => { P.live = v; },
    _sel: (v) => { P.sel = v; },
    _collectHTML: (ow) => collectHTML(ow),
    _syncBase: syncBase, _rows: rowsToLegs, _takeLeg: takeLeg, _takeAll: takeAll,
    _same: sameRows, _prime: (ow) => primePicks(ow), _owns: ownsHost,
    _host: (el) => { P.host = el; }, _render: () => render(),
    _delPath: (base, k, m) => pickPath(base, k, m),
    _whoHTML: (ow) => whoHTML(ow), _howto: () => howtoHTML(),
    _file: (v) => { P.file = v; }, _picks: (v) => { P.picks = v; P.syncErr = false; },
    _reset: () => { P.picks = null; P.syncErr = false; P.file = null;
      P.note = ''; P.where = ''; P.sel = null; P.live = null; },
  };
})();
