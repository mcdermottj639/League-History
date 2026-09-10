/* ══════════════════════════════════════════════════════════════════════════
   📊 THIS SEASON — the league as it stands right now (v39).

   The archive is thirteen finished seasons. This is the one that is still
   being played, and it is the only tab whose numbers change between visits.

   🚨 IT READS A FILE, NOT A BACKEND — the same doctrine the rankings run on,
   for stronger reasons. The Lab writes `season/current.json` when the
   commissioner publishes; every member reads it as a static file. Four things
   that buys, in order of weight:

     1. A fantasy standings table changes ONCE A WEEK. A weekly snapshot is
        not a stale copy of the live table, it IS the live table — so the
        freshness cost of a file is close to zero, and the cost of a live
        fetch is not.
     2. The backend is on Render's free tier and sleeps after 15 minutes. Live
        would make whichever of the twelve opens the app first each day wait
        30-60s on a cold start before this tab painted anything.
     3. 🚨 `isMe` IS A TRAP. The season payload flags the team belonging to the
        account the backend authenticates as — the COMMISSIONER's, always. A
        member's phone reading it would badge HIS team as THEIRS. That is the
        v33 byline bug exactly. The snapshot carries real manager CODES,
        written by `mgrFor` on his device, which is the mechanism the rankings
        payload already proved.
     4. A file still works when the backend does not, and in five years when
        nobody is maintaining either.

   ⚠️ EVERY COMPARISON WITH THE ARCHIVE IS ERA-RELATIVE. Scoring has climbed
   across thirteen years, so "your 118.4 ppg is the best of your career" is a
   sentence that ranks seasons by WHEN they happened. `LH.career()` hands over
   `rel` — points a game against the league that same year — and this file
   compares `rel` to `rel`, never a raw ppg to a raw ppg.

   ⚠️ AND IT INVENTS NOTHING IN PRESEASON. Zero games played means every team
   is 0-0 with 0.0 points, and a standings table of twelve zeros is not a
   standings table. The Lab has held this rule since v1 ("a fabricated 0-0
   beside a name is a lie") and this tab holds it too: what has real data
   before week 1 is the odds, the schedule and who you play — so that is what
   it opens on, and the rest says plainly that it is waiting.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const LH = window.LeagueHistory;
  const FILE = 'season/current.json';

  const one = (n) => (n == null || isNaN(n) ? '—' : (Math.round(n * 10) / 10).toFixed(1));
  const sgn = (n) => (n == null || isNaN(n) ? '—' : (n > 0 ? '+' : n < 0 ? '−' : '') + one(Math.abs(n)));
  const ord = (n) => (n % 100 >= 11 && n % 100 <= 13) ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th');
  /* ⚠️ `ord` is the SUFFIX only, and reading it as a whole ordinal printed
     "a best finish of st." on every card that had one. Anything that wants
     "1st" wants this. */
  const ordN = (n) => (n == null || isNaN(n) ? '—' : `${n}${ord(n)}`);
  /* A spelled-out number opening a sentence still has to be capitalised —
     "…the best shot in the league. six of twelve teams make it" reads as a
     typo, which is what the render showed. */
  const Cap = (t) => String(t).charAt(0).toUpperCase() + String(t).slice(1);
  const pc = (n) => (n == null || isNaN(n) ? '—' : (Math.round(n * 10) / 10).toFixed(1) + '%');
  const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  const nWord = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
    'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen'];
  /* Two numerals must not touch (v17) — "11th 7 times" reads as one number. */
  const spell = (n) => (n >= 0 && n < nWord.length ? nWord[n] : String(n));

  function niceDate(d) {
    const t = new Date(d + 'T12:00:00');
    return isNaN(t) ? d : t.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  /* ── the snapshot ──────────────────────────────────────────────────────
     ⚠️ FOUR OUTCOMES, FOUR SENTENCES — the app's own rule (v29), which exists
     because "nothing published yet" when the truth is "you are offline" is a
     lie, and so is saying it when the truth is "the file 404s".
     🚨 `missing` can only ever be a fault: `season/current.json` ships in the
     repo with an empty `t`, so a season nobody has published still answers
     200. A 404 means the deploy is broken, and folding that into the friendly
     copy would hide it behind the one sentence that says all is well. */
  const S = { snap: null, err: null, done: false };

  async function load() {
    if (S.done) return S.snap;
    S.done = true;
    let j;
    try {
      const r = await fetch(FILE, { cache: 'no-store' });
      if (!r.ok) throw new Error('http ' + r.status);
      j = await r.json();
    } catch (e) {
      S.err = /http/.test(String(e && e.message)) ? 'missing' : 'offline';
      return null;
    }
    /* A file that parses is not a season that renders (v29). An empty `t` is
       the honest "nothing published"; a `t` that is not an array at all is a
       broken file, and the two get different sentences. */
    if (!j || !Array.isArray(j.t)) { S.err = 'bad'; return null; }
    if (!j.t.length) { S.err = 'none'; return null; }
    S.snap = j;
    return j;
  }

  const EMPTY = {
    none: "<b>The season hasn't been published yet.</b>The commissioner publishes the standings, the odds and the schedule alongside each week's rankings. When the first one lands it shows up here. The league's thirteen finished seasons are on the History tab and need no connection at all.",
    missing: "<b>The season file didn't load.</b>The file that holds this year's standings is not there — a fault at our end, not yours. The League History tab is unaffected.",
    offline: "<b>Can't reach this season's numbers.</b>You are offline, or the page didn't load properly. The League History tab works with no connection at all, so all thirteen seasons are still there.",
    bad: "<b>This season's data doesn't look right.</b>The file is there but what's inside it could not be read, so nothing is shown rather than half of it. The League History tab is unaffected.",
  };

  /* ══ DERIVE ════════════════════════════════════════════════════════════
     🚨 THE WEEK IS DERIVED FROM THE SCORES, NOT READ OFF A FIELD. The payload
     carries ESPN's `wk`, but that pointer advances on ESPN's own clock and a
     snapshot can be taken either side of it. What is never ambiguous is how
     many weeks have a score in them — so "the next week" is one past that,
     and it agrees with the standings on the same page by construction.
     Same rule as the rest of the app: work it out, don't store it. */
  function derive(p) {
    const rw = +p.rw || 14;
    const pt = +p.pt || 6;
    const teams = p.t.map((t) => {
      const s = (t.s || []).map(Number).map((x) => (isNaN(x) ? 0 : x));
      const pl = s.filter((x) => x > 0);
      const w = +t.w || 0, l = +t.l || 0, ti = +t.ti || 0;
      const g = (w + l + ti) || pl.length;
      const apw = +t.apw || 0, apl = +t.apl || 0;
      return {
        id: String(t.id == null ? '' : t.id),
        /* ⚠️ Trimmed on the way in. One of the real 2026 team names ships with
           a trailing space; the Lab's `nrm` copes, a heading does not. */
        n: String(t.n == null ? '' : t.n).trim(),
        m: t.m || '', w, l, ti, g,
        pf: +t.pf || 0, pa: +t.pa || 0,
        scores: s, played: pl,
        ppg: g ? (+t.pf || 0) / g : null,
        l3: pl.length ? mean(pl.slice(-3)) : null,
        hi: pl.length ? Math.max(...pl) : null,
        lo: pl.length ? Math.min(...pl) : null,
        apw, apl,
        allPct: (apw + apl) ? apw / (apw + apl) : null,
        winPct: g ? (w + ti / 2) / g : null,
        pct: t.pct == null ? null : +t.pct,
        sch: Array.isArray(t.sch) ? t.sch.map(String) : [],
      };
    });

    const wp = teams.reduce((m, t) => Math.max(m, t.played.length), 0);
    const pre = wp === 0;
    const lgPpg = pre ? null : mean(teams.filter((t) => t.ppg != null).map((t) => t.ppg));
    teams.forEach((t) => {
      t.rel = (t.ppg == null || lgPpg == null) ? null : t.ppg - lgPpg;
      /* The archive's own luck index, on the season in progress: the gap
         between the win rate the scoring deserved and the one that happened.
         Both sides are RATES, never two records with different denominators
         printed side by side — that is the v3 fault this stat was born from. */
      t.luck = (t.winPct == null || t.allPct == null) ? null : (t.winPct - t.allPct) * 100;
    });

    /* 🚨 Never rely on array order for a tie (the v202 lesson, inherited).
       Wins first, then points — ESPN's own tiebreak and the archive's. */
    const table = [...teams].sort((a, b) =>
      (b.w + b.ti / 2) - (a.w + a.ti / 2) || b.pf - a.pf || a.n.localeCompare(b.n));
    table.forEach((t, i) => { t.seed = i + 1; });

    const odds = [...teams].sort((a, b) => (b.pct || 0) - (a.pct || 0) || b.pf - a.pf);

    const byId = {};
    teams.forEach((t) => { byId[t.id] = t; });

    /* The next week to be played. Past the end of the regular season there is
       no next week, and the section says so rather than inventing week 15. */
    const nextWk = wp >= rw ? null : wp + 1;
    const games = [];
    if (nextWk) {
      const seen = {};
      teams.forEach((t) => {
        const oid = t.sch[nextWk - 1];
        const o = oid ? byId[oid] : null;
        if (!o || o.id === t.id || seen[t.id] || seen[o.id]) return;
        seen[t.id] = seen[o.id] = 1;
        games.push([t, o]);
      });
    }

    return { p, rw, pt, teams, table, odds, byId, wp, pre, lgPpg, nextWk, games };
  }

  /* ══ WHO IS FAVOURED ═══════════════════════════════════════════════════
     🚨 TWO BASES, TWO SENTENCES, AND THE SENTENCE ALWAYS NAMES ITS BASIS.
     Before a ball is thrown there is nothing to project from but ESPN's own
     preseason number; once there is scoring on file, the scoring is the
     better answer and ESPN's season-long odds are the wrong tool for one
     game. Rather than blend them into a single figure whose meaning changes
     silently halfway through September, each says which one it is.

     ⚠️ And the counter-evidence is on the row. The favourite is taken on
     season scoring; the last-three average sits beside it, so a reader who
     thinks form matters more can see that it disagrees — and when it does,
     the line says so instead of quietly picking a side. */
  function favourite(a, b, pre) {
    if (pre) {
      if (a.pct == null || b.pct == null || a.pct === b.pct) return null;
      const w = a.pct > b.pct ? a : b;
      return { w, why: `ESPN's preseason projection favours <b>${esc(w.n)}</b>.` };
    }
    if (a.ppg == null || b.ppg == null) return null;
    if (Math.abs(a.ppg - b.ppg) < 0.05) {
      return { w: null, why: `Nothing between them on scoring — ${one(a.ppg)} against ${one(b.ppg)}.` };
    }
    const w = a.ppg > b.ppg ? a : b, o = w === a ? b : a;
    let why = `Favoured on scoring: <b>${esc(w.n)}</b>, ${one(w.ppg)} a game against ${one(o.ppg)}.`;
    if (w.l3 != null && o.l3 != null && o.l3 > w.l3) {
      why += ` Recent form disagrees — ${esc(o.n)} ${one(o.l3)} to ${one(w.l3)} over the last three.`;
    }
    return { w, why };
  }

  /* 🚨 THE RANK AND THE DENOMINATOR HAVE TO COUNT THE SAME THING, and the
     first cut did not: the rank places this season among the finished ones
     PLUS itself, so it runs 1 to seasons+1, and printing that against the
     finished count rendered "your 14th-best win rate in thirteen seasons" —
     which is not a sentence about anything. Only finished seasons can be
     ranked against, so the comparison is stated as how many of THEM this one
     beats. One population, one denominator, true at both ends.

     ⚠️ Module-level and exported so `checks.js` can walk every rank from 1 to
     seasons+1 and assert no phrasing ever quotes a position larger than the
     seasons it is counting against. That fault was invisible until a manager
     actually had the worst season of their career, which is exactly the case
     nobody builds a fixture for. */
  function placeTxt(r, seasons, what, poss) {
    if (r <= 1) return `better than any of ${poss} ${spell(seasons)} ${what}`;
    if (r > seasons) return `below all ${spell(seasons)} of ${poss} finished ${what}`;
    return `ahead of ${spell(seasons + 1 - r)} of ${poss} ${spell(seasons)} ${what}`;
  }

  /* ══ THE READER'S OWN SEASON, AGAINST THEIR OTHER THIRTEEN ═════════════
     The reason this tab lives in this app rather than being a link to ESPN.
     ⚠️ Every sentence goes through `vb()` — second person changes the verb,
     and a sentence that agrees with the wrong person is the first thing a
     reader notices. There are no pronouns in these strings at all. */
  function careerLines(d, mine) {
    const c = LH.career(mine.m);
    if (!c) return [];
    const vb = LH.voice.vb, m = mine.m;
    const out = [];
    const rank = (v, arr) => 1 + arr.filter((x) => x > v).length;

    const place = (r, what) => placeTxt(r, c.seasons, what, vb(m, 'your', 'their'));

    if (!d.pre && mine.rel != null) {
      const rels = c.yrs.map((y) => y.rel);
      const r = rank(mine.rel, rels);
      const best = Math.max(...rels);
      const bestYr = c.yrs.find((y) => y.rel === best);
      out.push(`<b>${sgn(mine.rel)} a game on the league</b> — ${place(r, 'seasons')}. The best was ${sgn(best)} in ${bestYr.yr}.`);
    }

    if (!d.pre && mine.winPct != null) {
      const projW = Math.round(mine.winPct * d.rw);
      const rates = c.yrs.map((y) => (y.games ? y.w / y.games : 0));
      const r = rank(mine.winPct, rates);
      out.push(`At this rate that is <b>${projW}-${d.rw - projW}</b> — a win rate ${place(r, 'seasons')}.`);
    }

    /* Always true, always worth saying — and in preseason it is the only
       career fact there is anything to say. Finishes are era-neutral. */
    const po = `${vb(m, 'You have', `${esc(c.real)} has`)} made the playoffs in <b>${c.po} of ${c.seasons}</b> seasons`;
    /* ⚠️ A clause must not re-argue the one beside it (v22). "with four titles
       and a best finish of 1st" states the same fact twice — the best finish
       is only worth saying for somebody who has never won. */
    out.push(c.t1
      ? `${po}, with <b>${spell(c.t1)} title${c.t1 === 1 ? '' : 's'}</b>.`
      : `${po}, and ${vb(m, 'have', 'has')} <b>never won it</b>${c.best ? ` — best finish ${ordN(c.best.place)}, in ${c.best.yr}` : ''}.`);
    return out;
  }

  /* ══ OUR OWN ODDS ══════════════════════════════════════════════════════
     `odds.js` does the work; this hands it the archive's priors and keeps the
     answer, because the simulation is deterministic for a published week and
     re-running it on every tab switch would be ten thousand seasons of work
     for a number that cannot have changed. */
  let OURS = null, OURS_KEY = null;
  function ourOdds(d) {
    const key = `${d.p.d}|${d.wp}`;
    if (OURS_KEY === key) return OURS;
    if (!window.LeagueOdds) return null;
    const priors = {};
    d.teams.forEach((t) => {
      const c = t.m ? LH.career(t.m) : null;
      if (!c || !c.yrs.length) { priors[t.id] = 0; return; }
      const rel = c.yrs.reduce((a, y) => a + y.rel, 0) / c.yrs.length;
      priors[t.id] = window.LeagueOdds.priorFor(rel, c.seasons);
    });
    try {
      OURS = window.LeagueOdds.build({
        teams: d.teams.map((t) => ({ id: t.id, scores: t.scores, sch: t.sch })),
        rw: d.rw, pt: d.pt, priors,
        me: (d.teams.find((t) => t.m === LH.me()) || {}).id,
        /* 🚨 Seeded on the WEEK, so every one of the twelve sees the same
           number. Two people holding phones side by side is the test this
           has to pass, and an unseeded Monte Carlo fails it silently. */
        seed: (d.wp + 1) * 7919,
      });
    } catch (e) { console.error('[odds] simulation failed', e); OURS = null; }
    OURS_KEY = key;
    return OURS;
  }

  /* ══ RENDER ════════════════════════════════════════════════════════════ */
  function crestOf(cr, t, size) {
    return t.m ? cr(t.m, size) : `<span class="fh-crest fh-crest-x" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.42)}px">${esc((t.n || '?').slice(0, 1))}</span>`;
  }
  const youTag = (t, me) => (me && t.m === me ? ' <span class="lg-you">YOU</span>' : '');
  const mineCls = (t, me) => (me && t.m === me ? ' lg-mine' : '');

  function headHTML(d) {
    const p = d.p;
    return `<div class="pr-card pr-head lg-rank-head">
      <div class="pr-week">${esc(p.y || '')} season · ${esc(p.l || (d.pre ? 'Preseason' : `After week ${d.wp}`))}</div>
      <h2>This Season</h2>
      <p class="pr-sub">${d.pre
        ? 'No games played yet, so nothing here is a result. What is real before week 1 is the schedule and the projection.'
        : `Standings, odds and form after ${spell(d.wp)} week${d.wp === 1 ? '' : 's'}.`}${p.d ? ` Updated ${esc(niceDate(p.d))}.` : ''}</p>
    </div>`;
  }

  function meHTML(d, cr, me) {
    const mine = d.teams.find((t) => t.m === me);
    if (!mine) return '';
    const tiles = d.pre
      ? [['Playoff odds', pc(mine.pct)], ['Odds rank', `${ordN(d.odds.indexOf(mine) + 1)}`]]
      : [['Record', `${mine.w}-${mine.l}${mine.ti ? `-${mine.ti}` : ''}`], ['Place', `${ordN(mine.seed)}`],
        ['Points/gm', one(mine.ppg)], ['vs league', sgn(mine.rel)],
        ['All-play', `${mine.apw}-${mine.apl}`], ['Luck', sgn(mine.luck)]];
    const lines = careerLines(d, mine);
    return `<h2 class="section-title">🙋 Your season</h2>
      <div class="ffp-card ls-me">
        <div class="ls-me-h">${crestOf(cr, mine, 54)}<div><h3>${esc(mine.n)}</h3>
          <p>${d.pre ? `${pc(mine.pct)} to make the playoffs` : `${mine.w}-${mine.l}${mine.ti ? `-${mine.ti}` : ''} · ${ordN(mine.seed)} of ${spell(d.teams.length)} · ${pc(mine.pct)} to make the playoffs`}</p></div></div>
        <div class="fh-you-g">${tiles.map(([k, v]) =>
          `<div class="fh-you-t"><b>${v}</b><i>${k}</i></div>`).join('')}</div>
        ${lines.length ? `<div class="ls-lines">${lines.map((x) => `<p>${x}</p>`).join('')}</div>` : ''}
        ${d.pre ? '' : '<p class="ffp-cap"><b>vs league</b> is points a game against this season\'s league average, which is what makes it comparable with the thirteen seasons on the History tab — raw scoring has climbed over the years, so raw numbers would rank seasons by when they happened. <b>Luck</b> is the same gap the archive\'s luck index measures: the win rate the scoring deserved against the one that happened.</p>'}
      </div>`;
  }

  function weekHTML(d, cr, me) {
    if (!d.nextWk) {
      return `<h2 class="section-title">⚔️ Matchups</h2>
        <div class="ffp-card"><div class="ffp-empty"><b>The regular season is over.</b>All ${spell(d.rw)} weeks are played. What happens next is the bracket, and the archive keeps every one of those.</div></div>`;
    }
    const mineGame = me ? d.games.find(([a, b]) => a.m === me || b.m === me) : null;
    const rows = d.games.map(([a, b]) => {
      const f = favourite(a, b, d.pre);
      const side = (t) => `<div class="ls-side${mineCls(t, me)}">${crestOf(cr, t, 34)}
        <div class="ls-side-b"><span class="ls-side-n">${esc(t.n)}${youTag(t, me)}</span>
        <span class="ls-side-s">${d.pre ? pc(t.pct) + ' playoffs' : `${t.w}-${t.l}${t.ti ? `-${t.ti}` : ''} · ${one(t.ppg)} ppg${t.l3 != null ? ` · L3 ${one(t.l3)}` : ''}`}</span></div></div>`;
      return `<div class="ffp-card ls-mu${(me && (a.m === me || b.m === me)) ? ' ls-mu-me' : ''}">
        ${side(a)}<div class="ls-v">v</div>${side(b)}
        ${f ? `<p class="ls-why">${f.why}</p>` : ''}
      </div>`;
    }).join('');
    return `<h2 class="section-title">⚔️ Week ${d.nextWk}</h2>
      <p class="fh-lead">${mineGame
        ? `<b>${esc(mineGame[0].m === me ? mineGame[1].n : mineGame[0].n)}</b> is next for you.`
        : `The ${spell(d.games.length)} games of week ${d.nextWk}.`} ${d.pre
        ? 'Nothing has been played, so the favourite is ESPN\'s preseason projection and nothing else.'
        : 'The favourite is taken on season scoring, with recent form beside it — they disagree often, and where they do the line says so.'}</p>
      ${rows || '<div class="ffp-card"><div class="ffp-empty"><b>No matchups on file for this week.</b>The schedule that came with this snapshot doesn\'t cover it.</div></div>'}`;
  }

  function oddsHTML(d, cr, me) {
    if (!d.teams.some((t) => t.pct != null)) return '';
    const o = ourOdds(d);
    const ours = o ? o.odds : null;
    const rows = [...d.teams].sort((a, b) =>
      (ours ? ours[b.id] - ours[a.id] : 0) || (b.pct || 0) - (a.pct || 0) || b.pf - a.pf);
    const top = rows[0];
    const pct0 = (v) => (v == null ? '—' : Math.round(v) + '%');
    /* A gap worth pointing at. Below this the two are agreeing within the
       noise of two different simulations and a marker would be reading
       tea leaves. */
    const BIG = 12;
    const gaps = ours ? rows.filter((t) => Math.abs(ours[t.id] - t.pct) >= BIG) : [];

    return `<h2 class="section-title">🎯 Playoff odds</h2>
      <p class="fh-lead">${ours
        ? `<b>${esc(top.n)} ${pct0(ours[top.id])}</b> — the best shot in the league by our numbers. ${Cap(spell(d.pt))} of ${spell(d.teams.length)} make it, so the twelve add up to ${d.pt * 100}%.${d.pre
          ? ' <b>Before a ball is thrown, ESPN should be better than us</b> — they can see twelve rosters and all we have is thirteen years of history. Our edge, if we have one, arrives with real scoring.'
          : ''}`
        : `<b>${esc(top.n)} ${pct0(top.pct)}</b> — the best shot in the league. ${Cap(spell(d.pt))} of ${spell(d.teams.length)} make it.`}</p>
      <div class="ffp-card">
        <div class="ls-odd ls-oh"><span></span><span></span><span>Team</span><span>Ours</span><span>ESPN</span></div>
        ${rows.map((t, i) => {
          const mine = ours ? ours[t.id] : null;
          const gap = mine == null || t.pct == null ? 0 : mine - t.pct;
          return `<div class="ls-odd${mineCls(t, me)}${i === d.pt - 1 ? ' ls-cut' : ''}">
            <span class="ls-odd-n">${i + 1}</span>
            ${crestOf(cr, t, 28)}
            <span class="ls-odd-t">${esc(t.n)}${youTag(t, me)}</span>
            <span class="ls-odd-v mono">${pct0(mine == null ? t.pct : mine)}</span>
            <span class="ls-odd-e mono${Math.abs(gap) >= BIG ? ' ls-gap' : ''}">${pct0(t.pct)}</span>
          </div>`;
        }).join('')}
      </div>
      ${ours ? `<p class="ffp-cap"><b>Ours</b> plays the rest of the schedule out ${o.sims.toLocaleString()} times. It uses points and never records — measured across the thirteen seasons, a manager's win rate carries <b>no</b> predictive signal at all (r = −0.02) while their scoring carries a little (r = +0.17), so a record is the one number here that is pure luck. ${o.est.lambda > 0
        ? `After ${spell(d.wp)} week${d.wp === 1 ? '' : 's'} it trusts what teams have actually scored <b>${Math.round(o.est.lambda * 100)}%</b> and their thirteen-year history the rest — weekly scores swing ${one(o.est.sigma)} points, which is far wider than the teams truly are, so early scoring is mostly noise.`
        : 'With no games played it is thirteen years of scoring history and nothing else.'}<br><br>⚠️ <b>These are two different forecasts of the same thing, and one of them is wrong.</b> ESPN\'s comes with the league data and is the number their app shows. Neither has been proven better here — that takes seasons of keeping score, not one page.${gaps.length
        ? (gaps.length > 3
          ? ` Right now they are more than ${BIG} points apart on <b>${spell(gaps.length)} of the ${spell(d.teams.length)}</b>.`
          : ` Right now they are more than ${BIG} points apart on <b>${gaps.map((t) => esc(t.n)).join(', ')}</b>.`)
        : ''}</p>`
        : `<p class="ffp-cap">⚑ <b>ESPN\'s numbers, not this app\'s.</b> They come through with the league data and are the same percentages the ESPN app shows.</p>`}
      ${hingeHTML(d, o, me)}`;
  }

  /* ══ WHAT THE READER'S OWN NUMBER RESTS ON ═════════════════════════════
     🚨 THE PART ESPN DOES NOT DO. A percentage on its own is unarguable and
     therefore uninteresting: it cannot be checked, and it does not tell you
     what to want on Sunday. The same ten thousand seasons already know which
     of the reader's remaining games move it and by how much, so saying so
     costs nothing and is the whole reason to have built our own. */
  function hingeHTML(d, o, me) {
    if (!o || o.meIdx < 0 || !o.myGames.length) return '';
    const mine = d.teams.find((t) => t.m === me);
    if (!mine) return '';
    const pct0 = (v) => (v == null ? '—' : Math.round(v) + '%');
    const sw = o.swings.slice().sort((a, b) =>
      ((b.ifWin || 0) - (b.ifLose || 0)) - ((a.ifWin || 0) - (a.ifLose || 0)));
    const biggest = sw[0];
    const oppName = (id) => { const t = d.teams.find((x) => x.id === id); return t ? t.n : '?'; };
    return `<h2 class="section-title">🔑 What yours hinges on</h2>
      <p class="fh-lead">${o.need != null
        ? `<b>Win ${spell(o.need)} of your last ${spell(o.myGames.length)}</b> and you are better than even money to make it.`
        : `<b>Nothing left to play for on paper</b> — the remaining games barely move your number either way.`} ${o.sos != null
        ? `Your remaining opponents are <b>${sgn(o.sos)} points a game</b> against the league — ${o.sos > 1 ? 'a hard run' : o.sos < -1 ? 'a kind one' : 'about average'}.`
        : ''}</p>
      <div class="ffp-card">
        ${biggest && biggest.ifWin != null ? `<p class="ls-hinge-h">Your biggest week is <b>${esc(oppName(biggest.opp))}</b> in week ${biggest.week} — <b>${pct0(biggest.ifWin)}</b> if you win it, <b>${pct0(biggest.ifLose)}</b> if you don't.</p>` : ''}
        ${o.swings.map((g) => `<div class="ls-sw">
          <span class="ls-sw-w">wk ${g.week}</span>
          <span class="ls-sw-n">${esc(oppName(g.opp))}</span>
          <span class="ls-sw-v mono pos">${pct0(g.ifWin)}</span>
          <span class="ls-sw-v mono neg">${pct0(g.ifLose)}</span>
        </div>`).join('')}
        <p class="ffp-cap">Each row is the same ${o.sims.toLocaleString()} simulated seasons split by whether you won that week — win on the left, lose on the right. They are read off one set of seasons rather than re-run per game, so they cannot disagree with each other or with the number above.</p>
      </div>`;
  }

  function tableHTML(d, cr, me) {
    if (d.pre) {
      return `<h2 class="section-title">📊 Standings</h2>
        <div class="ffp-card"><div class="ffp-empty"><b>Nobody has played a game.</b>Every team is 0-0 with nothing scored, and twelve identical rows of zeros would not be a standings table. It fills in from week 1. The thirteen finished seasons are on the History tab.</div></div>`;
    }
    return `<h2 class="section-title">📊 Standings</h2>
      <p class="fh-lead">After ${spell(d.wp)} week${d.wp === 1 ? '' : 's'}. <b>All-play</b> is every team against the whole league each week, so it is the one number here a kind schedule cannot flatter.</p>
      <div class="ffp-card">
        ${d.table.map((t) => `<div class="ls-tr${mineCls(t, me)}${t.seed === d.pt ? ' ls-cut' : ''}">
          <span class="ls-tr-n">${t.seed}</span>
          ${crestOf(cr, t, 32)}
          <div class="ls-tr-b">
            <span class="ls-tr-t">${esc(t.n)}${youTag(t, me)}</span>
            <span class="ls-tr-s">${t.w}-${t.l}${t.ti ? `-${t.ti}` : ''} · ${Math.round(t.pf)} PF · ${t.apw}-${t.apl} all-play</span>
          </div>
        </div>`).join('')}
      </div>
      <p class="ffp-cap">The line falls after ${ordN(d.pt)} — ${spell(d.pt)} teams make the bracket. Ties are broken on points, the same way the archive breaks them.</p>`;
  }

  function schedHTML(d, cr, me) {
    if (!me) return '';
    const mine = d.teams.find((t) => t.m === me);
    if (!mine || !mine.sch.length) return '';
    const cells = mine.sch.slice(0, d.rw).map((oid, i) => {
      const o = d.byId[oid];
      const done = i < d.wp;
      const mySc = mine.scores[i], oSc = o ? o.scores[i] : 0;
      const won = done && mySc > oSc;
      return `<div class="ls-sc${done ? (won ? ' won' : ' lost') : ''}">
        <span class="ls-sc-w">${i + 1}</span>
        ${o ? crestOf(cr, o, 26) : ''}
        <span class="ls-sc-n">${esc(o ? o.n : '?')}</span>
        <span class="ls-sc-r mono">${done ? `${won ? 'W' : 'L'} ${one(mySc)}-${one(oSc)}` : ''}</span>
      </div>`;
    }).join('');
    return `<h2 class="section-title">🗓️ Your schedule</h2>
      <p class="fh-lead">All ${spell(d.rw)} weeks. ${d.pre ? 'None of it played yet.' : `${Cap(spell(d.wp))} played, ${spell(d.rw - d.wp)} to come.`}</p>
      <div class="ffp-card ls-sched">${cells}</div>`;
  }

  async function paint(host, cr) {
    host.innerHTML = '<div class="ffp-card"><div class="ffp-empty">Loading this season…</div></div>';
    const p = await load();
    if (!p) {
      host.innerHTML = `<h2 class="section-title">📊 This Season</h2>
        <div class="ffp-card"><div class="ffp-empty">${EMPTY[S.err] || EMPTY.none}</div></div>`;
      return;
    }
    const d = derive(p);
    const me = LH.me();
    host.innerHTML = headHTML(d) + meHTML(d, cr, me) + oddsHTML(d, cr, me)
      + weekHTML(d, cr, me) + tableHTML(d, cr, me) + schedHTML(d, cr, me);
  }

  window.LeagueSeason = {
    paint,
    /* For the repo's own checks — nothing in the app reads these. */
    _derive: derive,
    _favourite: favourite,
    _placeTxt: placeTxt,
  };
})();
