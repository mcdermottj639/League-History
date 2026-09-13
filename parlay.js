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
     `open` in the file wins when it is there; otherwise picks are for the
     week after the newest ticket, which is knowable and cannot drift. So the
     first week of a season needs one line in the file and every week after
     it needs nothing — and a week that already HAS a ticket is closed,
     because the bet has been placed and a pick would be a pick at a game
     that has kicked off. */
  function openWeekOf(file, weeks) {
    const ks = (weeks || []).map((w) => Number(w.k)).filter((n) => isFinite(n));
    let k = null, l = null;
    if (file && file.open && isFinite(Number(file.open.k))) {
      k = Number(file.open.k); l = String(file.open.l || `Week ${k}`);
    } else if (ks.length) { k = Math.max.apply(null, ks) + 1; l = `Week ${k}`; }
    if (k == null || ks.indexOf(k) !== -1) return null;
    return { k, l };
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
    /* ⚠️ The rate's denominator is settled, non-push legs — a pending leg is
       not a miss and a push is neither. Every row prints that count beside
       the rate, because a manager who sat a week out has a smaller one and
       two rates over two denominators is this app's oldest fault (v3). */
    const rows = Object.values(by).map((a) => {
      const dcd = a.w + a.l;
      return Object.assign(a, { dcd, rate: dcd ? a.w / dcd : null });
    }).sort((x, y) => (y.rate == null ? -1 : x.rate == null ? 1 : y.rate - x.rate)
      || y.w - x.w || rnm(x.m).localeCompare(rnm(y.m)));
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
      const bits = [];
      if (a.dcd) bits.push(`<b>${pc0(a.rate)}</b> of ${spell(a.dcd)} settled`);
      else bits.push('nothing settled yet');
      if (a.p) bits.push(`${spell(a.p)} push${a.p === 1 ? '' : 'es'}`);
      if (a.open) bits.push(`${spell(a.open)} still running`);
      if (a.solo) bits.push(`<b>killed the ticket on ${vb(a.m, 'your', 'their')} own ${times(a.solo)}</b>`);
      return `<div class="lp-ld${mine ? ' you' : ''}">
        <div class="lp-ld-t">
          <span class="lp-ld-r">${a.rank ? `${a.tied ? '=' : ''}${a.rank}` : '—'}</span>
          <span class="lp-ld-n">${esc(rnm(a.m))}${mine ? ' <span class="lg-you">YOU</span>' : ''}</span>
          <span class="lp-ld-w">${a.w}-${a.l}${a.p ? `-${a.p}` : ''}</span>
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
      <div class="fh-lead"><p>Ranked by how often each leg lands. <b>An = means joint</b>, and every row names how many settled legs that rate is over — somebody who sat a week out has fewer, and two rates over two different denominators is not a comparison. A push counts as neither.${thin}</p></div>
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

  /* ══ 🎯 YOUR PICK ══════════════════════════════════════════════════════ */
  /* 🚨 A STATUS LINE BELONGS TO ONE CARD. `note` was a single string rendered
     into every `.lp-say` on the page, so "Saved. Send it to the chat" printed
     under the pick card AND under the collector — one event, reported twice,
     in a place where the second one is about something the reader did not do.
     Found by looking at the render; no assertion could see it, so there is a
     law for it now. `where` is which card asked. */
  const P = { host: null, cr: null, api: null, file: null, err: null,
    note: '', where: '', det: false, paste: '' };
  const say = (txt, where) => { P.note = txt; P.where = where; };
  const noteFor = (where) => (P.where === where && P.note
    ? `<p class="lp-say" role="status">${esc(P.note)}</p>` : '<p class="lp-say" role="status"></p>');

  const myPick = (k) => { const j = read(PICK_KEY); return (j && Number(j.k) === k) ? j : null; };

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
          <p class="lp-note">Saved on this phone. It is not on the ticket until somebody collects it, so send it to the chat.</p>
          <textarea class="lp-out" data-lp-t="pick" readonly rows="3" aria-label="Your pick, ready to send">${esc(pickText(ow, LH.me(), mine.p, mine.o))}</textarea>
          <div class="lp-btns">
            <button type="button" class="lg-sheet-go" data-lp="send" data-lp-for="pick">${navigator.share ? '📤 Send it to the chat' : '📋 Copy it for the chat'}</button>
            <button type="button" class="lp-alt" data-lp="edit">Change my pick</button>
          </div>
          ${noteFor('pick')}
        </div>`;
    }
    return `${head}
      <div class="ffp-card lp-you">
        <p><b>One NFL bet, any market.</b> Write it the way the book writes it, put the price in, and the app makes the line you drop in the chat.</p>
        <label class="lp-lab" for="lp-bet">The bet</label>
        <input class="lp-in" id="lp-bet" type="text" maxlength="${PICK_MAX}" autocomplete="off"
          placeholder="Eagles -3.5 vs Cowboys" value="${esc(P.draftP || '')}" />
        <label class="lp-lab" for="lp-odds">The price</label>
        <input class="lp-in lp-in-s" id="lp-odds" type="text" inputmode="text" autocomplete="off"
          placeholder="-110" value="${esc(P.draftO || '')}" />
        <div class="lp-btns"><button type="button" class="lg-sheet-go" data-lp="save">Save my pick</button></div>
        ${noteFor('pick')}
      </div>`;
  }

  /* ══ 🧾 COLLECTING THE TICKET ══════════════════════════════════════════ */
  const collected = () => { const j = read(TICK_KEY); return (j && Array.isArray(j.legs)) ? j : { k: null, legs: [] }; };

  /* One payload in. Returns why it did not go on, so the card can say which
     of the four things went wrong rather than "that didn't work". */
  function takeOne(payload, wantK) {
    let p;
    try { p = b64dec(payload); } catch (_) { return 'bad'; }
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
    const tally = { ok: 0, dupe: 0, bad: 0, who: 0, odds: 0, empty: 0, week: 0, none: !codes.length };
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

  const today = () => new Date().toISOString().slice(0, 10);

  function collectHTML(ow) {
    const box = collected();
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
      <p class="lp-note">Paste the picks out of the group chat — all of them at once is fine, it finds every one. Tapping somebody's link adds it too.</p>
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

  /* ⚠️ Said plainly rather than left for somebody to discover: the picks are
     shared through the chat because there is nowhere to write them. */
  const HOWTO = `<div class="ffp-card"><p class="ffp-cap">🔗 <b>Picks travel through the group chat, not through the app.</b> This app is a set of static files with nothing behind it — no account, no server, nowhere for twelve phones to write to. So your pick is saved on your phone and turned into a line you send; whoever is placing the bet collects the twelve and publishes the ticket, and from then on everybody sees it here.</p></div>`;

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

  function render() {
    const host = P.host;
    if (!host) return;
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
      if (ow) out += pickHTML(ow) + collectHTML(ow) + HOWTO;
      if (has) out += ticketHTML(s2.ts[0], P.cr, !!ow) + tallyHTML(s2) + boardHTML(s2) + pastHTML(s2, P.cr);
      host.innerHTML = out + SOURCE;
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
    if (act === 'save') {
      const p = String(val('lp-bet') || '').trim().slice(0, PICK_MAX);
      const o = parseOdds(val('lp-odds'));
      if (!p) { say('Write the bet first — however the book writes it.', 'pick'); return render(); }
      if (!okOdds(o)) { say('The price needs to be a number like -110 or +150.', 'pick'); return render(); }
      if (!ow || !LH.me()) { say('Picks are not open right now.', 'pick'); return render(); }
      write(PICK_KEY, { k: ow.k, p, o, at: Date.now() });
      P.draftP = ''; P.draftO = '';
      say('Saved. Send it to the chat so it makes the ticket.', 'pick');
      return render();
    }
    if (act === 'edit') {
      const mine = ow ? myPick(ow.k) : null;
      if (mine) { P.draftP = mine.p; P.draftO = String(mine.o); }
      write(PICK_KEY, null); say('', 'pick'); return render();
    }
    if (act === 'add') {
      const t = takeMany(val('lp-paste'), ow ? ow.k : null);
      P.det = true;
      say(tallyLine(t).replace(/<[^>]+>/g, ''), 'col');
      return render();
    }
    if (act === 'clear') { write(TICK_KEY, null); say('Cleared.', 'col'); P.det = true; return render(); }
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
    if (el.id === 'lp-bet') P.draftP = el.value;
    if (el.id === 'lp-odds') P.draftO = el.value;
    if (el.id === 'lp-stake') P.stake = el.value;
  });
  document.addEventListener('change', (e) => {
    if (e.target && e.target.id === 'lp-stake') { P.det = true; render(); }
  });
  /* `toggle` does not bubble, so it is caught on the way down. */
  document.addEventListener('toggle', (e) => {
    if (e.target && e.target.matches && e.target.matches('[data-lp-det]')) P.det = !!e.target.open;
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
    render();
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
    _collectHTML: (ow) => collectHTML(ow),
  };
})();
