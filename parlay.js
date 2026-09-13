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

  function ticketHTML(t, cr) {
    const [word, cls] = STAT[t.status] || STAT.empty;
    return `<h2 class="section-title">🎲 This week's ticket</h2>
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

  /* ⚠️ Said once, at the bottom, and it is the honest half of this tab: the
     legs are transcribed and everything with a number in it is not. */
  /* ⚠️ ✍️ RATHER THAN ⚑, AND THE DIFFERENCE MATTERS. ⚑ is the archive's
     "playoffs only" badge — a mark with a specific meaning three taps away in
     the ? sheet's key — and borrowing it for a different kind of caveat would
     teach a reader that one glyph means two things. The v50 rule about an
     icon only being unique relative to its page, applied across pages. */
  const SOURCE = `<div class="ffp-card"><p class="ffp-cap">✍️ <b>The picks and the results are typed in from the slip.</b> They are the only facts in this app that are not worked out from the archive, because a bet has no other source. Everything else on this page is derived from those legs when it loads — the combined price, the payout, every record and every rate — so correcting one leg corrects the whole tab.</p></div>`;

  /* ══ WHAT IS ON SCREEN WHEN THERE IS NO TICKET ═════════════════════════
     Four opposite facts, four sentences, keyed by the state — so adding a
     fifth without writing its sentence is a visible hole rather than a quiet
     fall-through to the friendly one. "Nothing published yet" when the truth
     is "you are offline" is a lie, and it is the same lie when the truth is
     "the file 404s": `parlay/current.json` SHIPS with an empty `weeks` array,
     so an unstarted season still answers 200 and a 404 can only be a broken
     deploy. */
  const EMPTY = {
    none: "<b>No ticket up yet.</b>Each week everybody puts one NFL bet in and the twelve of them ride together as a single parlay. When this week's goes on it lands here — every leg, whose it is, and what the twelve turn into as one price.",
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
    return { weeks: j.weeks };
  }

  async function paint(host, cr) {
    host.innerHTML = '<div class="ffp-card"><div class="ffp-empty">Loading this week\'s ticket…</div></div>';
    const got = await load();
    if (got.why) { host.innerHTML = emptyHTML(got.why); return; }
    if (!got.weeks.length) { host.innerHTML = emptyHTML('none'); return; }
    let s;
    /* A file that parses is not a ticket that renders (the v29 rule). The
       throw and the near-miss are the same fault — the file is readable and
       what is in it is not a week — so both get the one honest sentence. */
    try { s = seasonOf(got.weeks); } catch (e) {
      console.error('[parlay] the file parsed but would not derive', e);
      host.innerHTML = emptyHTML('bad'); return;
    }
    if (!s.ts.length) { host.innerHTML = emptyHTML('bad'); return; }
    try {
      host.innerHTML = ticketHTML(s.ts[0], cr) + tallyHTML(s) + boardHTML(s) + pastHTML(s, cr) + SOURCE;
    } catch (e) {
      console.error('[parlay] that ticket would not render', e);
      host.innerHTML = emptyHTML('bad');
    }
  }

  window.LeagueParlay = {
    paint,
    /* For the repo's own checks — nothing in the app reads these.
       ⚠️ `_html` is the whole page for a given set of weeks, and it is here
       because the rule in this repo is ASSERT WHAT RENDERS (v7): a law that
       agrees with `seasonOf` would go on passing over a view that had stopped
       reading it. This is the exact markup `paint` writes, minus the fetch. */
    _dec: dec, _amer: amer, _ticket: ticketOf, _season: seasonOf,
    _html: (weeks, cr) => { const s = seasonOf(weeks);
      return ticketHTML(s.ts[0], cr) + tallyHTML(s) + boardHTML(s) + pastHTML(s, cr) + SOURCE; },
    _empty: emptyHTML,
  };
})();
