/* The live score ticker, driven against the REAL ticker.js in a real DOM.
   Fixtures only: no network, no backend, no ESPN. Run: node ticker.test.cjs */
const fs = require('fs');
const { JSDOM } = require('jsdom');

let bad = 0;
const fail = (m) => { bad++; console.log('  ❌ ' + m); };
const ok = (m) => console.log('  ✅ ' + m);
const is = (m, a, b) => (a === b ? ok(m) : fail(`${m} — got ${JSON.stringify(a)}, wanted ${JSON.stringify(b)}`));
const yes = (m, c) => (c ? ok(m) : fail(m));

const TEAMS = {
  1: ['Aarogant Fraudgers', 'Hurd'], 7: ['Death Dont Hurts Very Long', 'McD'],
  2: ['Mortal Wombats', 'Christel'], 5: ['Gregs Morning Dew Dew', 'Buley'],
  3: ['Slob on my Cobb', 'Slemp'], 6: ['Jared Goff Hits Women', 'Zach'],
  4: ['Morning Woods', 'Woods'], 10: ['Joe Sleepin on Dee TeeTees', 'CC'],
  11: ['Puka Atta Adonai', 'Wolff'], 12: ['Thurgood Marshall', 'Gotch'],
  13: ['Jefferson Airplane', 'Riz'], 14: ['Pepperoni TDs', 'Hyman'],
};
const side = (id, score, left, state) => ({
  teamId: String(id), team: TEAMS[id][0], abbrev: '',
  score: state === 'pre' ? 0 : score, projected: 120, starters: 9,
  yetToPlay: state === 'pre' ? 9 : left, onBye: 0,
});
const game = (a, b, as, bs, al, bl, state) =>
  ({ away: side(a, as, al, state), home: side(b, bs, bl, state), state, playoff: false });

/* Week 3: your game live, one final, one not started.
   🚨 THE READER'S GAME SITS FOURTH ON PURPOSE. With it first, every law about
   floating it to the front is true of a board that was never reordered —
   the v74 fault (a check whose failure path cannot run is not a check).
   Verified by reverting `order()` to identity: two laws then fail. */
const BOARD = (over) => ({
  sport: 'football', week: 3, ttl: 45,
  games: [
    game(2, 5, 74.1, 91.8, 3, 6, 'live'),
    game(3, 6, 118.6, 102.3, 0, 0, 'final'),
    game(4, 10, 63.9, 70.5, 7, 5, 'live'),
    game(1, 7, 96.4, 88.2, 4, 3, 'live'),
    game(11, 12, 81.0, 79.7, 2, 6, 'live'),
    game(13, 14, 0, 0, 9, 9, 'pre'),
  ].map((g, i) => (over && over[i] ? { ...g, ...over[i] } : g)),
  anyLive: true,
});
const ALL_PRE = { sport: 'football', week: 3, ttl: 45, anyLive: false,
  games: BOARD().games.map((g) => game(Number(g.away.teamId), Number(g.home.teamId), 0, 0, 9, 9, 'pre')) };

function build({ me = 'McD', cfg = { enabled: true, feed: 'https://x.test/board' }, board = BOARD(), boardFails = false } = {}) {
  const dom = new JSDOM(
    `<!DOCTYPE html><html data-palette="champagne"><body class="lg-body">
       <main class="lg-main"><div id="lg-body">ARCHIVE</div></main>
       <div id="lg-tick" class="lt-host" hidden></div></body></html>`,
    { url: 'https://mcdermottj639.github.io/League-History/', runScripts: 'outside-only' });
  const w = dom.window;
  /* ⚠️ jsdom reports `visibilityState: 'prerender'`, so `document.hidden` is
     TRUE and the ticker's own "a background tab asks nothing" guard skips the
     first fetch. That guard is correct; the harness has to say the page is on
     screen or it tests the wrong branch. */
  Object.defineProperty(w.document, 'visibilityState', { value: 'visible', configurable: true });
  Object.defineProperty(w.document, 'hidden', { value: false, configurable: true });
  const calls = { cfg: 0, api: 0 };
  w.AbortSignal.timeout = w.AbortSignal.timeout || (() => new w.AbortController().signal);
  w.fetch = (url) => {
    if (String(url).includes('ticker-config.json')) {
      calls.cfg++;
      return Promise.resolve({ ok: true, json: async () => cfg });
    }
    calls.api++;
    if (boardFails) return Promise.reject(new Error('down'));
    return Promise.resolve({ ok: true, json: async () => board });
  };
  /* The two real collaborators, stubbed to their real contracts. */
  w.LeagueESPN = { mgrFor: (n) => (Object.values(TEAMS).find((t) => t[0] === n) || ['', ''])[1] };
  w.LeagueHistory = {
    me: () => me,
    voice: { nm: (c) => (c === me ? 'You' : c) },
  };
  w.eval(fs.readFileSync('./ticker.js', 'utf8'));
  const crest = (code, size) => `<img class="fh-crest" data-m="${code}" width="${size}">`;
  return { w, calls, crest, tick: () => w.document.getElementById('lg-tick') };
}
const settle = () => new Promise((r) => setTimeout(r, 30));

(async () => {
  console.log('\n🏈 the live score ticker\n');

  /* 1 ── OFF IS OFF. This is how it ships: one local config read, no api call,
         nothing rendered. If this ever fails, merging is a behaviour change. */
  {
    const t = build({ cfg: { enabled: false, feed: '' } });
    const r = await t.w.LeagueTicker.boot(t.crest);
    await settle();
    is('disabled config: boot returns false', r, false);
    is('disabled config: no call to the feed', t.calls.api, 0);
    yes('disabled config: nothing rendered', t.tick().hidden && t.tick().innerHTML === '');
    yes('disabled config: body class not set', !t.w.document.body.classList.contains('lt-on'));
  }
  /* An empty api with enabled:true is still off — a half-filled config must
     not send the app at `undefined/api/...`. */
  {
    const t = build({ cfg: { enabled: true, feed: '' } });
    is('enabled but no feed url is still off', await t.w.LeagueTicker.boot(t.crest), false);
    is('enabled but no feed url: no call', t.calls.api, 0);
  }

  /* 2 ── THE THURSDAY RULE. A full, valid board where nothing has kicked off
         renders NOTHING — not a bar of dashes, not a countdown. */
  {
    const t = build({ board: ALL_PRE });
    await t.w.LeagueTicker.boot(t.crest); await settle();
    yes('before kickoff: no bar at all', t.tick().hidden);
    yes('before kickoff: no reserved space', !t.w.document.body.classList.contains('lt-on'));
    yes('before kickoff: no 0.0 anywhere', !/0\.0/.test(t.tick().innerHTML));
  }

  /* 3 ── LIVE. The reader's own game, their score first. */
  {
    const t = build();
    await t.w.LeagueTicker.boot(t.crest); await settle();
    const h = t.tick();
    yes('live: the bar is up', !h.hidden && /lt-bar/.test(h.innerHTML));
    yes('live: space is reserved for it', t.w.document.body.classList.contains('lt-on'));
    const scores = [...h.innerHTML.matchAll(/lt-sc[^>]*>([\d.]+)</g)].map((m) => m[1]);
    is("live: the reader's own score is first", scores[0], '88.2');
    is("live: their opponent's is second", scores[1], '96.4');
    yes('live: the losing side is muted', /lt-sc dn">88\.2/.test(h.innerHTML));
    yes('live: counts the live games', /4 of 6 live/.test(h.innerHTML));
    yes('live: names what is left to play', /3 left/.test(h.innerHTML));
    yes('live: never touches the archive', t.w.document.getElementById('lg-body').innerHTML === 'ARCHIVE');
  }

  /* 4 ── A STRANGER GETS A WHOLE APP. Nobody has tapped a name; the bar still
         works and shows the closest game (Wolff 81.0 – Gotch 79.7). */
  {
    const t = build({ me: null });
    await t.w.LeagueTicker.boot(t.crest); await settle();
    const h = t.tick().innerHTML;
    yes('stranger: the bar still renders', /lt-bar/.test(h));
    yes('stranger: gets the closest game', /81\.0/.test(h) && /79\.7/.test(h));
    yes('stranger: no second person anywhere', !/\bYou\b/.test(h));
  }

  /* 5 ── THE SHEET. All six, the reader's first, and the unplayed game shows
         a dash rather than a 0.0 — the owner's whole point, one row down. */
  {
    const t = build();
    await t.w.LeagueTicker.boot(t.crest); await settle();
    t.tick().querySelector('[data-lt-open]').click();
    await settle();
    const h = t.tick().innerHTML;
    yes('sheet: opens', /lt-sheet/.test(h));
    is('sheet: all six games', (h.match(/class="lt-row/g) || []).length, 6);
    const rows = [...t.tick().querySelectorAll('.lt-row')];
    yes("sheet: the reader's game is floated to the front",
      rows[0].classList.contains('you') && rows.filter((r) => r.classList.contains('you')).length === 1);
    yes('sheet: the rest keep the feed order', /Christel/.test(rows[1].textContent));
    yes('sheet: the unplayed game shows a dash', /&ndash;|–/.test(h));
    yes('sheet: the unplayed game shows no 0.0', !/>0\.0</.test(h));
    yes('sheet: says Not started', /Not started/.test(h));
    yes('sheet: says Final for the finished one', /Final/.test(h));
    /* A tap inside the panel must not close it — only the backdrop and the
       button do. Two escapes and both are asserted. */
    t.tick().querySelector('.lt-list').click();
    await settle();
    yes('sheet: a tap inside does not close it', /lt-sheet/.test(t.tick().innerHTML));
    t.tick().querySelector('.lt-close').click();
    await settle();
    yes('sheet: the Close button closes it', !/lt-sheet/.test(t.tick().innerHTML));
  }

  /* 6 ── A FAILED REFRESH KEEPS THE BOARD AND SAYS SO. A remembered score
         presented as live is worse than no ticker (the v29 rule). */
  {
    const t = build();
    await t.w.LeagueTicker.boot(t.crest); await settle();
    yes('fresh board says Live', /● Live/.test(t.tick().innerHTML));
    const saved = t.w.localStorage.getItem('lh:ticker:v1');
    yes('a good board is remembered', !!saved && JSON.parse(saved).board.games.length === 6);

    const t2 = build({ boardFails: true });
    t2.w.localStorage.setItem('lh:ticker:v1', JSON.stringify({ at: Date.now() - 12 * 60000, board: BOARD() }));
    await t2.w.LeagueTicker.boot(t2.crest); await settle();
    const h = t2.tick().innerHTML;
    yes('failed refresh: the remembered board still shows', /88\.2/.test(h));
    yes('failed refresh: it is labelled a saved copy', /Saved copy/.test(h));
    yes('failed refresh: it says how old', /12 min ago/.test(h));
    yes('failed refresh: it does NOT claim to be live', !/● Live/.test(h));
  }

  /* 7a ── the guard itself, asserted directly. ⚠️ Going only through `render`
          lets an empty-board check pass these for the wrong reason — fault
          injection showed three of the four surviving a gutted `valid()`. */
  {
    const t = build();
    const V = t.w.LeagueTicker._t.valid;
    yes('valid(): accepts a real board', V(BOARD()));
    yes('valid(): rejects null', !V(null));
    yes('valid(): rejects a non-array games', !V({ games: 'nope' }));
    yes('valid(): rejects a numeric teamId', !V({ games: [{ ...BOARD().games[0], home: { ...BOARD().games[0].home, teamId: 7 } }] }));
    yes('valid(): rejects an unknown state', !V({ games: [{ ...BOARD().games[0], state: 'halftime' }] }));
    yes('valid(): rejects a missing side', !V({ games: [{ away: BOARD().games[0].away, state: 'live' }] }));
  }

  /* 7 ── A BOARD THAT IS NOT A BOARD IS REFUSED. An error page or a proxy's
         JSON must never render as a 0-0 scoreboard. */
  {
    for (const [name, payload] of [
      ['an html error page', { error: 'gateway' }],
      ['a board with no games key', { week: 3 }],
      ['a game with an unknown state', { week: 3, games: [{ ...BOARD().games[0], state: 'halftime' }] }],
      ['a game missing a side', { week: 3, games: [{ away: BOARD().games[0].away, state: 'live' }] }],
    ]) {
      const t = build({ board: payload });
      await t.w.LeagueTicker.boot(t.crest); await settle();
      yes(`refuses ${name}`, t.tick().hidden);
    }
  }

  /* 7b ── SEPTEMBER RENAMES. Every team name changes each year, and a name
          the map has not learned yet must degrade to that name — never to a
          blank row, and never to somebody else's game badged as yours. */
  {
    const renamed = BOARD();
    renamed.games = renamed.games.map((g) => ({ ...g,
      home: { ...g.home, team: 'Brand New Name ' + g.home.teamId },
      away: { ...g.away, team: 'Brand New Name ' + g.away.teamId } }));
    const t = build({ board: renamed });
    await t.w.LeagueTicker.boot(t.crest); await settle();
    const h = t.tick();
    yes('unresolved names: the bar still renders', !h.hidden);
    yes('unresolved names: the bar still identifies both sides',
      (h.innerHTML.match(/lt-ab/g) || []).length === 2);
    h.querySelector('[data-lt-open]').click(); await settle();
    yes('unresolved names: the sheet shows the name it does have',
      /Brand New Name/.test(t.tick().innerHTML));
    yes('unresolved names: no game is badged as the reader\'s',
      !t.tick().querySelector('.lt-row.you'));
    yes('unresolved names: nothing renders blank',
      ![...t.tick().querySelectorAll('.lt-nm')].some((n) => !n.textContent.trim()));
  }

  /* 8 ── A BOARD OLDER THAN THE STALE CEILING IS NOT SHOWN AT ALL. Last
         Sunday's scores on this Sunday's bar would be the worst failure here. */
  {
    const t = build({ boardFails: true });
    t.w.localStorage.setItem('lh:ticker:v1', JSON.stringify({ at: Date.now() - 30 * 3600 * 1000, board: BOARD() }));
    await t.w.LeagueTicker.boot(t.crest); await settle();
    yes('a day-old board is not shown', t.tick().hidden);
  }

  console.log(bad ? `\n${bad} FAILURES` : '\n✅ the ticker holds');
  process.exit(bad ? 1 : 0);
})();
