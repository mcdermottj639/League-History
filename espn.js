/* ══════════════════════════════════════════════════════════════════════════
   🏈 ESPN → THIS APP. One file, loaded by BOTH pages.

   🚨 IT EXISTS BECAUSE THE ALTERNATIVE WAS TWO COPIES OF THE SAME FACTS.
   When the Season tab started reading live data it needed exactly what the
   Lab already had: which team belongs to which manager, and how to turn an
   ESPN payload into this app's shape. Writing that twice would have given the
   league two maps that drift apart every September — and the crest bug of v36
   is what one stale map already costs.

   So both live here and both pages call them:
     · `MANAGERS` + `mgrFor` — team name → manager code, rename-proof
     · `toSnapshot`          — the ESPN payload → the app's season shape

   ⚠️ `power.js` and `season.js` must BOTH keep delegating. The moment one of
   them re-implements either, this file stops being the source of truth and
   starts being a copy. `checks.js` asserts there is only one `MANAGERS`.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const K_TEAMS = 'powerlab:teams';   // learned teamId -> code (v37)
  const load = (k, d) => { try { const r = JSON.parse(localStorage.getItem(k) || 'null'); return r == null ? d : r; } catch (_) { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} };

  /* ⚠️ Normalised with lowercase + trim only. One real 2026 team name ships
     with a trailing space, and iOS capitalises the first letter of anything
     typed into a field — neither is a different team. */
  const nrm = (x) => String(x == null ? '' : x).toLowerCase().trim();

  const MANAGERS = {
    // ── 2026 names (ESPN season, owner column verified) ──────────────────────
    'aarogant fraudgers': 'Hurd',        'mortal wombats': 'Christel',
    'slob on my cobb': 'Slemp',          'morning woods': 'Woods',
    'gregs morning dew dew': 'Buley',    'jared goff hits women': 'Zach',
    'death dont hurts very long': 'McD', 'joe sleepin on dee teetees': 'CC',
    'puka atta adonai': 'Wolff',         'thurgood marshall': 'Gotch',
    'jefferson airplane': 'Riz',         'pepperoni tds': 'Hyman',
    // ── legacy aliases from prior seasons — kept so an old name still resolves ─
    samrizz: 'Riz', cummish: 'Hurd', 'cheeky clapz': 'Hyman', christel: 'Christel',
    'goff hits women': 'Zach', cc: 'CC', 'current champ': 'McD', gmdd: 'Buley',
    'future champ': 'Wolff',
  };

  /* ⚠️ Lazy, never at module scope — the v37 temporal-dead-zone throw that
     made the whole Lab blank was exactly this read happening too early. */
  let LEARNED = null;
  const learnedMap = () => (LEARNED || (LEARNED = load(K_TEAMS, {}) || {}));

  /* Record `teamId -> code` for every team whose CURRENT name still resolves.
     ESPN's teamId is the franchise id and survives a rename, so once a device
     has seen a season while the names were known, it keeps every crest and
     every YOU row through any future rename. Writes only; `mgrFor` reads. */
  function learnTeams(payload) {
    const L = learnedMap();
    let changed = false;
    ((payload && payload.teams) || []).forEach((t) => {
      const code = MANAGERS[nrm(t.team)];
      if (code && L[String(t.teamId)] !== code) { L[String(t.teamId)] = code; changed = true; }
    });
    if (changed) save(K_TEAMS, L);
  }

  /* 🚨 The teams are passed IN, never read off a module-level cache. The Lab
     swaps its season in place on a refresh, so any index captured at adoption
     goes stale the moment corrected data lands — and a rename-proof resolver
     reading a stale index is not rename-proof (v37). */
  function mgrFor(name, teams) {
    const k = nrm(name);
    const byName = MANAGERS[k];
    if (byName) return byName;
    const t = (teams || []).find((x) => nrm(x.team) === k);
    return (t && learnedMap()[String(t.teamId)]) || '';
  }

  /* ══ THE ONE TRANSFORM ═════════════════════════════════════════════════
     ESPN's payload → the shape every view in this app reads. Used by the Lab
     when it publishes a snapshot AND by the Season tab when it fetches live,
     so a published week and a live refresh can never disagree about what the
     data means.

     🚨 `isMe` IS DELIBERATELY NOT READ. It flags the team belonging to the
     account the BACKEND authenticates as — the commissioner's, on every
     device that ever asks. Reading it in the members' app would badge his
     team as theirs on eleven phones. Manager CODES are the answer, and this
     is the only place they are worked out. */
  function toSnapshot(payload, opts) {
    const d = payload || {};
    const teams = Array.isArray(d.teams) ? d.teams : [];
    const ap = d.allPlay || {};
    const o = opts || {};
    const played = (sc) => (sc || []).filter((x) => Number(x) > 0);
    const weeks = teams.reduce((m, t) => Math.max(m, played(t.scores).length), 0);
    return {
      v: 1,
      k: weeks,
      l: weeks === 0 ? 'Preseason' : `After Week ${weeks}`,
      d: o.date || new Date().toISOString().slice(0, 10),
      y: new Date().getFullYear(),
      rw: Number(d.regularSeasonWeeks) || 14,
      pt: Number(d.playoffTeams) || 6,
      t: teams.map((t) => {
        const a = ap[String(t.teamId)] || {};
        return {
          id: String(t.teamId == null ? '' : t.teamId),
          /* Trimmed: a trailing space survives `nrm` but not a heading. */
          n: String(t.team == null ? '' : t.team).trim(),
          m: mgrFor(t.team, teams) || '',
          w: Number(t.wins) || 0,
          l: Number(t.losses) || 0,
          ti: Number(t.ties) || 0,
          pf: Math.round((Number(t.pointsFor) || 0) * 10) / 10,
          pa: Math.round((Number(t.pointsAgainst) || 0) * 10) / 10,
          apw: Number(a.w) || 0,
          apl: Number(a.l) || 0,
          /* ESPN's own playoff percentage, passed through untouched. */
          pct: t.playoffPct == null ? null : Math.round(Number(t.playoffPct) * 10) / 10,
          /* Only the weeks actually played — ESPN pads the rest with 0. */
          s: played(t.scores).map((x) => Math.round(Number(x) * 10) / 10),
          sch: Array.isArray(t.schedule) ? t.schedule.map(String) : [],
        };
      }),
    };
  }

  /* The backend, resolved the same way in both pages — including the
     localStorage override, so pointing one at a different API points both.
     A second copy of this string is a second thing to change on a move. */
  const API = (() => {
    try { return localStorage.getItem('sportshub:api'); } catch (_) { return null; }
  })() || 'https://sports-hub-fantasy-api.onrender.com';
  const SEASON_URL = `${API}/api/fantasy/football/season`;

  window.LeagueESPN = { MANAGERS, nrm, mgrFor, learnTeams, toSnapshot, API, SEASON_URL };
})();
