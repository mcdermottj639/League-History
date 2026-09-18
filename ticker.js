/* ══════════════════════════════════════════════════════════════════════════
   🏈 THE LIVE SCORE TICKER — v113, PREPARED AND OFF.

   `ticker-config.json` ships `enabled: false`, so on every device today this
   file loads, reads one same-origin JSON, finds the feature off and stops.
   Nothing renders and no external request is made. Same shape as the parlay's
   `"sync": ""` (v73) and Parlay v2's disabled config (v91/v92).

   ── WHAT IT SHOWS ──────────────────────────────────────────────────────────
   Placement C of the three mocked, the owner's pick: a fixed bar above the
   footer carrying the reader's own game, which opens a sheet with all six.

   🚨 THE FEED IS THE SCOREBOARD ENDPOINT, NOT `/season`, AND THAT IS THE
   WHOLE REASON THIS FILE EXISTS RATHER THAN A FEW LINES IN `season.js`.
   `season.js` reads `/api/fantasy/football/season`, whose `scores[]` comes
   from espn-api's `Team.scores` — built from ESPN's `totalPoints`. During a
   live week ESPN puts the in-flight number in a DIFFERENT field,
   `totalPointsLive`, and only the box score reads it. So the season endpoint
   is a settled-week feed and a ticker built on it would show a stale number
   with nothing on screen saying so — the v3 fault, on every screen at once.

   🚨 IT NEVER TOUCHES `#lg-body`. It owns `#lg-tick`, a sibling of `<main>`,
   so the v76 view-ownership stamp does not apply to it and a late answer can
   never paint over the tab somebody is reading. That is not incidental — it
   is the reason a FIXED BAR is the safe placement for something that repaints
   itself behind the reader. A card inside the body would have needed the
   stamp and would have been the third file to get it wrong.

   ⚠️ THE THURSDAY RULE IS DATA-DRIVEN, NOT A CLOCK. The owner's ask was that
   it stays dark until the first kickoff, "since before then it's always 00
   for every matchup". This does not guess at a schedule: the feed says
   `anyLive: false` while every matchup is still `pre`, and the bar is simply
   not rendered. A hard-coded Thursday would be a second copy of the NFL
   calendar, and it would be wrong the first time a game moves.
   ══════════════════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const CFG = 'ticker-config.json';
  const CACHE = 'lh:ticker:v1';
  /* Poll fast only while something is actually being played. ⚠️ Deliberately
     NOT a copy of `season.js`'s day-and-hour table: that table is a guess at
     when football happens, and this file is handed the answer by the feed.
     A second copy of a clock is a second thing to be wrong in January. */
  const LIVE_MS = 60 * 1000;
  const IDLE_MS = 15 * 60 * 1000;
  const STALE_MS = 6 * 60 * 60 * 1000;   // older than this is not worth showing

  const esc = (s) => String(s == null ? '' : s)
    .replace(/[&<>"']/g, (x) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[x]));
  const read = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (_) { return null; } };
  const put = (k, v) => { try { v ? localStorage.setItem(k, JSON.stringify(v)) : localStorage.removeItem(k); } catch (_) {} };

  const S = { cfg: undefined, board: null, at: 0, fresh: false, open: false, timer: 0, flight: null, crest: null };

  const host = () => document.getElementById('lg-tick');
  const LH = () => window.LeagueHistory;

  /* ── config ────────────────────────────────────────────────────────────
     Read once. `undefined` means "not asked yet", `null` means "asked, and
     the feature is off" — two different facts, and folding them together is
     what would make a disabled ticker re-fetch its own config forever. */
  async function config() {
    if (S.cfg !== undefined) return S.cfg;
    S.cfg = null;
    try {
      const r = await fetch(CFG, { cache: 'no-store' });
      if (r.ok) {
        const c = await r.json();
        if (c && c.enabled && typeof c.feed === 'string' && c.feed) S.cfg = c;
      }
    } catch (_) { /* a missing config is the feature being off, not an error */ }
    return S.cfg;
  }

  /* ── the feed ──────────────────────────────────────────────────────────
     🚨 A BOARD THAT DOES NOT VALIDATE IS NOT A BOARD. The one thing this
     must never do is render zeros because a proxy handed back an error page:
     "nothing has kicked off" and "the feed broke" look identical at 0-0 and
     are opposite facts (the v29 four-sentences rule). */
  function valid(b) {
    return !!b && Array.isArray(b.games) && b.games.every((g) =>
      g && g.home && g.away
      && typeof g.home.teamId === 'string' && typeof g.away.teamId === 'string'
      && ['pre', 'live', 'final'].includes(g.state));
  }

  /* 🚨 `feed` IS THE WHOLE URL, NOT A BASE WITH A PATH BOLTED ON. The first
     cut took a base and appended `/api/fantasy/football/scoreboard`, which is
     the Sports-Hub backend's path shape — so the config could only ever point
     at one kind of server, in a file whose entire job is to decide which
     server this is. It can now be the Sports-Hub endpoint directly or the
     Supabase route in front of it, and moving between them is a config edit
     rather than a code change. */
  async function fetchBoard(url) {
    const r = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(12000) });
    if (!r.ok) throw new Error('http ' + r.status);
    const b = await r.json();
    if (!valid(b)) throw new Error('unrecognised board');
    return b;
  }

  /* ── naming ────────────────────────────────────────────────────────────
     🚨 MANAGER NAMES, NOT TEAM NAMES, AND THAT IS A MEASUREMENT NOT A TASTE.
     "Death Dont Hurts Very Long" already clips on the Season tab at 320 and
     390px (it is in CLAUDE.md's open list); in a 52px bar it has no chance.
     ⚠️ The team name → manager map is NOT duplicated here: `espn.js` owns it
     and is rename-proof. A second copy is the v36 crest bug waiting to
     happen. A team that will not resolve keeps its own name, trimmed. */
  function who(side) {
    const E = window.LeagueESPN;
    const code = (E && E.mgrFor) ? E.mgrFor(side.team) : '';
    const nm = code && LH() ? LH().voice.nm(code) : '';
    return { code, label: nm || String(side.team || '').trim() || '—' };
  }

  const face = (code, size) => (S.crest && code ? S.crest(code, size) : '');

  /* 🚨 A SIDE ALWAYS CARRIES SOMETHING THAT IDENTIFIES IT. `face` is empty
     whenever the manager code will not resolve — which is exactly what every
     September looks like, before `MANAGERS` learns the new team names — and on
     the bar, which shows crests and scores with no room for a name, that left
     the reader two bare numbers and no idea whose. Falls back to ESPN's own
     abbreviation, then to the first few letters of the name it does have. */
  function mark(w, side, size) {
    const c = face(w.code, size);
    if (c) return c;
    const ab = String(side.abbrev || w.label || '?').trim().slice(0, 4).toUpperCase();
    return `<span class="lt-ab" style="width:${size}px;height:${size}px">${esc(ab)}</span>`;
  }

  /* ── shaping ───────────────────────────────────────────────────────────
     The reader's own game goes first. ⚠️ `ME === null` is a first-class case,
     not a fallback: this link gets opened by somebody's brother before anyone
     taps a name, and every view has to work for them. A stranger gets the
     closest live game, which is the most interesting one on the board. */
  function mine(games) {
    const me = LH() ? LH().me() : null;
    if (!me) return null;
    return games.find((g) => who(g.home).code === me || who(g.away).code === me) || null;
  }

  function closest(games) {
    const live = games.filter((g) => g.state !== 'pre');
    if (!live.length) return null;
    const gap = (g) => Math.abs(Number(g.home.score || 0) - Number(g.away.score || 0));
    return live.slice().sort((a, b) => gap(a) - gap(b))[0];
  }

  function order(games) {
    const first = mine(games);
    return first ? [first].concat(games.filter((g) => g !== first)) : games.slice();
  }

  const ago = (ms) => {
    const m = Math.round(ms / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return m + ' min ago';
    const h = Math.round(m / 60);
    return h + (h === 1 ? ' hour ago' : ' hours ago');
  };

  const num = (v) => (v == null || !isFinite(Number(v)) ? null : Number(v).toFixed(1));

  /* ── a side of one row in the sheet ───────────────────────────────────── */
  function sideHTML(side, other, state) {
    const w = who(side);
    const a = Number(side.score), b = Number(other.score);
    const cls = state === 'pre' ? '' : (a > b ? 'win' : (a < b ? 'lose' : ''));
    const sc = num(side.score);
    /* ⚠️ A matchup that has not kicked off shows a dash, NEVER 0.0 — that is
       the owner's whole point about Thursday, one row down. */
    const left = (state === 'live' && side.yetToPlay > 0)
      ? `<span class="lt-left">${side.yetToPlay} left</span>` : '';
    return `<span class="lt-side ${cls}">${mark(w, side, 17)}`
      + `<span class="lt-nm">${esc(w.label)}</span>${left}`
      + `<span class="lt-sc">${state === 'pre' || sc == null ? '&ndash;' : esc(sc)}</span></span>`;
  }

  function rowHTML(g) {
    const me = LH() ? LH().me() : null;
    const isMine = !!me && (who(g.home).code === me || who(g.away).code === me);
    const left = Number(g.home.yetToPlay || 0) + Number(g.away.yetToPlay || 0);
    const meta = g.state === 'live'
      ? `<b>● Live</b> · ${left} yet to play`
      : (g.state === 'final' ? 'Final' : 'Not started');
    return `<div class="lt-row${isMine ? ' you' : ''}">`
      + sideHTML(g.away, g.home, g.state) + sideHTML(g.home, g.away, g.state)
      + `<span class="lt-meta">${meta}</span></div>`;
  }

  /* ── the bar ───────────────────────────────────────────────────────────── */
  function barHTML(b) {
    const games = b.games;
    const g = mine(games) || closest(games) || games[0];
    if (!g) return '';
    const liveN = games.filter((x) => x.state === 'live').length;
    const me = LH() ? LH().me() : null;
    /* Put the reader on the LEFT of their own game — it is the one row in the
       app that is about them, and reading your own score second is wrong. */
    const meIsHome = !!me && who(g.home).code === me;
    const A = meIsHome ? g.home : g.away, B = meIsHome ? g.away : g.home;
    const wa = who(A), wb = who(B);
    const as = num(A.score), bs = num(B.score);
    const down = Number(A.score) < Number(B.score) ? ' dn' : '';
    const dn2 = Number(B.score) < Number(A.score) ? ' dn' : '';

    /* 🚨 THE FRESHNESS LINE IS NOT DECORATION. If the refresh failed we are
       showing a remembered board, and a stale score presented as live is
       worse than no ticker at all. */
    const head = S.fresh
      ? (g.state === 'live'
        ? `<b>● Live${A.yetToPlay > 0 ? ' · ' + A.yetToPlay + ' left' : ''}</b>`
        : `<b style="color:var(--gy)">${g.state === 'final' ? 'Final' : 'Not started'}</b>`)
      : `<b style="color:var(--gy)">Saved copy</b>`;
    const sub = S.fresh
      ? `${liveN} of ${games.length} live`
      : `Updated ${ago(Date.now() - S.at)}`;

    return `<div class="lt-bar">`
      + `<button type="button" class="lt-bar-b" data-lt-open="1" aria-haspopup="dialog"`
      + ` aria-label="This week's scores — open all ${games.length} games">`
      + `<span class="lt-bar-l">${mark(wa, A, 22)}<span class="lt-sc${down}">${as == null || g.state === 'pre' ? '&ndash;' : esc(as)}</span>`
      + `<span class="lt-v">vs</span>${mark(wb, B, 22)}<span class="lt-sc${dn2}">${bs == null || g.state === 'pre' ? '&ndash;' : esc(bs)}</span></span>`
      + `<span class="lt-bar-t">${head}<i>${esc(sub)}</i></span>`
      + `<span class="lt-bar-x">All ${games.length} &#9650;</span>`
      + `</button></div>`;
  }

  function sheetHTML(b) {
    const games = order(b.games);
    const liveN = b.games.filter((x) => x.state === 'live').length;
    const wk = b.week == null ? 'This week' : 'Week ' + esc(b.week);
    return `<div class="lt-sheet" data-lt-close="1">`
      + `<div class="lt-sheet-in" role="dialog" aria-modal="true" aria-label="${esc(wk)} scores">`
      + `<div class="lt-grab"></div>`
      + `<div class="lt-sheet-h"><b>${esc(wk)}</b>`
      + (liveN ? `<span>● ${liveN} LIVE</span>` : '')
      + `<i>${S.fresh ? 'Updated just now' : 'Saved copy · ' + esc(ago(Date.now() - S.at))}</i></div>`
      + `<div class="lt-list">${games.map(rowHTML).join('')}</div>`
      + `<p class="lt-foot">Scores come from ESPN through the league's own backend and refresh about once a minute while games are on. Nothing is live before the first kickoff.</p>`
      + `<button type="button" class="lt-close" data-lt-close="1">Close</button>`
      + `</div></div>`;
  }

  /* ── painting ──────────────────────────────────────────────────────────── */
  function hide() {
    const h = host();
    if (h) { h.hidden = true; h.innerHTML = ''; }
    document.body.classList.remove('lt-on');
  }

  function render() {
    const h = host();
    if (!h) return;
    const b = S.board;
    /* THE THURSDAY GATE. Every matchup still `pre` means every score is 0-0,
       so there is nothing to say and the bar does not exist. Not a greyed-out
       bar, not a countdown — no chrome at all until football happens. */
    if (!b || !b.games.length || !b.games.some((g) => g.state !== 'pre')) { hide(); return; }
    if (Date.now() - S.at > STALE_MS) { hide(); return; }
    h.hidden = false;
    h.innerHTML = barHTML(b) + (S.open ? sheetHTML(b) : '');
    document.body.classList.add('lt-on');
  }

  /* ── the loop ──────────────────────────────────────────────────────────── */
  function cadence() {
    return (S.board && S.board.games.some((g) => g.state === 'live')) ? LIVE_MS : IDLE_MS;
  }

  function schedule() {
    clearTimeout(S.timer);
    S.timer = setTimeout(tick, cadence());
  }

  async function tick() {
    const c = await config();
    if (!c) return;                               // off: no timer, no request
    if (document.hidden) { schedule(); return; }  // a background tab asks nothing
    if (S.flight) return;
    S.flight = fetchBoard(c.feed)
      .then((b) => { S.board = b; S.at = Date.now(); S.fresh = true; put(CACHE, { at: S.at, board: b }); })
      .catch(() => { S.fresh = false; })          // keep the remembered board, relabelled
      .finally(() => { S.flight = null; render(); schedule(); });
  }

  /* ── boot ──────────────────────────────────────────────────────────────
     ⚠️ Called AFTER `setMe`, and that is load-bearing: `who()` asks
     `LH.me()`, which at the top of boot is still null, so a ticker built
     before the reader is known puts nobody's game first and says nothing in
     second person. Exactly the v23 `labLink` fault, in a new file. */
  function boot(crest) {
    S.crest = crest || null;
    return config().then((c) => {
      if (!c) return false;
      const cached = read(CACHE);
      if (cached && valid(cached.board) && Date.now() - cached.at < STALE_MS) {
        S.board = cached.board; S.at = cached.at; S.fresh = false; render();
      }
      document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
      document.addEventListener('click', (e) => {
        if (e.target.closest('[data-lt-close]')) {
          /* The sheet's own panel must not close it — only the backdrop and
             the button carry the attribute, and a tap inside the panel lands
             on the panel. */
          if (e.target.closest('.lt-sheet-in') && !e.target.closest('.lt-close')) return;
          S.open = false; render(); return;
        }
        if (e.target.closest('[data-lt-open]')) { S.open = true; render(); }
      });
      /* Three ways out, the same as the ? sheet (v13). */
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && S.open) { S.open = false; render(); }
      });
      tick();
      return true;
    });
  }

  window.LeagueTicker = {
    boot,
    /* Exposed for the repo's own checks — nothing in the app reads these. */
    _t: { valid, order, mine, closest, mark, barHTML, sheetHTML, render, S, ago },
  };
})();
