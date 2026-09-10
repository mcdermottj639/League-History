/* ============================================================================
   🏆 POWER RANKINGS LAB — power.js
   ----------------------------------------------------------------------------
   A weekly power ranking for the owner's ESPN fantasy football league
   ("Nectars Bologna", league 993612).

   THE SHAPE OF IT, because it drives every decision below:
     1. The MODEL pre-builds a ranking each week from real league data.
     2. The OWNER overrides it — reorder anyone, write a take on anyone.
     3. The result SHIPS to the league as a link or as plain text.

   The model is the starting point, never the answer. A power ranking is an
   opinion column; the numbers exist so the opinion has something to argue with,
   which is why a row the owner moved says where the model had it.

   ⚠️ THE MODEL IS A HEURISTIC, NOT A FITTED ONE. The weights below are a
   judgment call, not a measurement — there is no graded outcome to fit a power
   ranking against the way app.js fits the betting model (see CLAUDE.md,
   "⏳ Open measurements"). It is labelled as such in the UI. Do not present it
   as validated, and do not "tune" it as though there were a sample.

   Standalone page: no shared code with app.js, its own tiny helpers. It reads
   the same Render backend the Fantasy tab does — one endpoint, /season, which
   the backend serves off its already-cached League snapshot.
   ========================================================================== */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const el = (t, c, txt) => { const n = document.createElement(t); if (c) n.className = c; if (txt != null) n.textContent = txt; return n; };
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* Same resolution the app uses, including the localStorage override — so
   pointing the app at a different backend points this page at it too. */
const API = (() => {
  try { return localStorage.getItem('sportshub:api'); } catch (_) { return null; }
})() || 'https://sports-hub-fantasy-api.onrender.com';

/* Render's free tier sleeps after ~15 min idle and takes 30-60s to wake, so the
   leash matches the app's (app.js gives any FANTASY_API call 45s). */
const API_TIMEOUT = 45000;

const K_DRAFT = 'powerlab:draft';   // the week being edited (autosaved)
const K_PUB = 'powerlab:pub';       // published weeks, keyed by rank key — drives ▲▼ movement
const K_SEASON = 'powerlab:season'; // last good /season payload, so the page paints offline

const MAX_COMMENT = 420;  // 45 words ≈ 260 chars; 240 truncated the spec's own default entry
const RECENT_N = 3;                 // weeks in the "recent form" window

/* ⚠️ Judgment calls, not fitted numbers — see the header note.
   allPlay is the heaviest because it is the one input immune to schedule luck:
   it scores every team against the WHOLE league each week, so a 1-3 team that
   outscored nine opponents reads as good, which is the entire point of a power
   ranking as opposed to just printing the standings. record is the lightest for
   the mirror-image reason — it is the most luck-contaminated number on the page
   — but it is not zero, because a league argues about records. */
const W = { allPlay: 0.40, ppg: 0.25, recent: 0.25, record: 0.10 };

/* Manager names, mirroring LEAGUE_ORDER in app.js. Display-only garnish: a row
   renders fine with no match, so a renamed team degrades to just its name. */
const MANAGERS = {
  'thurgood marshall': 'Gotch', samrizz: 'Riz', cummish: 'Hurd', 'cheeky clapz': 'Hyman',
  christel: 'Christel', 'slob on my cobb': 'Slemp', 'morning woods': 'Woods',
  'goff hits women': 'Zach', cc: 'CC', 'current champ': 'McD', gmdd: 'Buley', 'future champ': 'Wolff',
};
const mgrFor = (name) => MANAGERS[String(name || '').toLowerCase().trim()] || '';
/* A manager label that just repeats the team name is noise ("CC CC"). */
const mgrLabel = (name) => {
  const m = mgrFor(name);
  return m && m.toLowerCase() !== String(name || '').toLowerCase().trim() ? m : '';
};

/* "2026-09-07" reads like a database field. */
function niceDate(iso) {
  const d = iso ? new Date(iso + 'T12:00:00') : new Date();
  if (isNaN(d)) return iso || '';
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

const S = {
  season: null,      // /season payload
  byline: '',        // whose rankings these are — carried into the share
  key: null,         // rank key = weeks played (0 = preseason)
  order: [],         // [teamId] — the owner's order
  comments: {},      // teamId -> take
  model: {},         // teamId -> the rank the MODEL gave, so a moved row can say so
  scores: {},        // teamId -> model score
  ready: false,      // did the model have anything to work with?
  stale: false,      // painted from cache rather than a live pull
  fresh: '',         // '' | 'checking' | 'live' | 'stale' | 'newweek' — see freshLine()
  pending: null,     // a newer week fetched in the background, waiting to be accepted
  shared: null,      // decoded payload when opened via #r=
};

/* ---------------------------------------------------------------- storage -- */
const load = (k, d) => { try { const r = JSON.parse(localStorage.getItem(k) || 'null'); return r == null ? d : r; } catch (_) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} };

/* ------------------------------------------------------------------ data -- */
async function fetchJSON(url, ms = API_TIMEOUT) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

const cachedSeason = () => { const c = load(K_SEASON, null); return c && c.data ? c : null; };

async function fetchSeason() {
  const d = await fetchJSON(`${API}/api/fantasy/football/season`);
  if (!d || !Array.isArray(d.teams) || !d.teams.length) throw new Error('empty');
  save(K_SEASON, { at: Date.now(), data: d });
  return d;
}

async function loadSeason() {
  try { return { data: await fetchSeason(), stale: false }; }
  catch (_) {
    const c = cachedSeason();
    if (c) return { data: c.data, stale: true, at: c.at };
    return null;
  }
}

/* ----------------------------------------------------------------- model -- */
/* A week counts as PLAYED for a team when it posted a score. This deliberately
   matches the backend's own all-play rule (`if not mine: continue`), so the
   two never disagree about how many weeks are in the sample. ESPN pads `scores`
   with 0 for every unplayed week, so a length check would count the whole
   17-week season from day one. */
const played = (scores) => (scores || []).filter((s) => Number(s) > 0);

function weeksPlayed(teams) {
  return teams.reduce((m, t) => Math.max(m, played(t.scores).length), 0);
}

const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

/* Map a z-score onto 0..1 so the four inputs are commensurable before they are
   weighted. ±3 SD is the clamp; with a 12-team league nothing realistic gets
   near it, so in practice this is a linear spread around the league average. */
function zNorm(vals) {
  const m = mean(vals);
  const sd = Math.sqrt(mean(vals.map((v) => (v - m) * (v - m)))) || 1;
  return vals.map((v) => Math.max(0, Math.min(1, 0.5 + (v - m) / sd / 6)));
}

/* Builds the week's ranking. Returns { ready, order, model, scores, rows }.
   `ready:false` means the model genuinely has nothing (no games played) — the
   page then hands over an unranked league rather than inventing an order. */
function buildModel(season) {
  const teams = season.teams || [];
  const wp = weeksPlayed(teams);
  if (!wp) {
    return { ready: false, weeks: 0, order: teams.map((t) => t.teamId), model: {}, scores: {}, rows: {} };
  }
  const ap = season.allPlay || {};
  const base = teams.map((t) => {
    const ps = played(t.scores);
    const a = ap[t.teamId] || { w: 0, l: 0 };
    const apGames = (a.w || 0) + (a.l || 0);
    const w = Number(t.wins) || 0, l = Number(t.losses) || 0, ti = Number(t.ties) || 0;
    const games = w + l + ti;
    return {
      teamId: t.teamId,
      ppg: mean(ps),
      recent: mean(ps.slice(-Math.min(RECENT_N, ps.length))),
      allPlayPct: apGames ? a.w / apGames : 0.5,
      winPct: games ? (w + 0.5 * ti) / games : 0.5,
      apW: a.w || 0, apL: a.l || 0,
    };
  });
  const ppgN = zNorm(base.map((b) => b.ppg));
  const recN = zNorm(base.map((b) => b.recent));
  const scores = {}, rows = {};
  base.forEach((b, i) => {
    scores[b.teamId] = 100 * (
      W.allPlay * b.allPlayPct + W.ppg * ppgN[i] + W.recent * recN[i] + W.record * b.winPct
    );
    rows[b.teamId] = b;
  });
  const order = base.slice()
    .sort((x, y) => scores[y.teamId] - scores[x.teamId])
    .map((b) => b.teamId);
  const model = {};
  order.forEach((id, i) => { model[id] = i + 1; });
  return { ready: true, weeks: wp, order, model, scores, rows };
}

/* --------------------------------------------------------------- labels -- */
const keyLabel = (k) => (k === 0 ? 'Preseason' : `After Week ${k}`);
/* 🚨 COMPARED AS STRINGS, AND THAT IS NOT DEFENSIVENESS (v25). `S.model` and
   `S.comments` are objects keyed by team id, so `Object.keys()` hands back
   "7", never 7 — and a `===` against a numeric `teamId` never matches. The
   "Model's own top 3 this week" line has been rendering "? · ? · ?" for its
   whole life because of it. Bracket access coerces and `find` does not, which
   is exactly why the bug could sit next to working code. */
const teamById = (id) => (S.season.teams || []).find((t) => String(t.teamId) === String(id)) || { team: '?', teamId: id };

function recordOf(t) {
  const w = Number(t.wins) || 0, l = Number(t.losses) || 0, ti = Number(t.ties) || 0;
  return ti ? `${w}-${l}-${ti}` : `${w}-${l}`;
}

const one1 = (v) => (Math.round(Number(v) * 10) / 10).toFixed(1);

/* What a row needs to be JUDGED on rather than just labelled with (v25).
   ⚠️ `outcomes` is padded the same way `scores` is, so it is sliced to the
   PLAYED length before the last one is read — otherwise "last week" is
   whatever ESPN left in an unplayed slot.
   ⚠️ And the last-3 average is here because the model weights it 25% and the
   row never showed it: the owner was being asked to argue with a number he
   could not see. */
function formOf(t) {
  const ps = played(t.scores);
  if (!ps.length) return null;
  const outs = (t.outcomes || []).slice(0, ps.length);
  const l3 = ps.slice(-Math.min(RECENT_N, ps.length));
  const res = outs.length ? String(outs[outs.length - 1] || '').toUpperCase().slice(0, 1) : '';
  return {
    last: ps[ps.length - 1],
    res: 'WLT'.includes(res) && res ? res : '',
    l3: l3.reduce((a, b) => a + b, 0) / l3.length,
    n3: l3.length,
    hi: Math.max(...ps), lo: Math.min(...ps),
  };
}

/* Movement vs the last week the owner actually PUBLISHED. No published prior
   week means no arrows at all — inventing movement against the model's own
   previous guess would be movement the league never saw. */
function prevOrder() {
  const pub = load(K_PUB, {});
  for (let k = S.key - 1; k >= 0; k--) {
    if (pub[k] && Array.isArray(pub[k].order) && pub[k].order.length) return pub[k];
  }
  return null;
}
function moveFor(prev, id, idx) {
  if (!prev) return null;
  const was = prev.order.indexOf(id);
  if (was < 0) return null;
  return was - idx; // positive = climbed
}
/* The owner's own published table (Week 12, 2023) prints a "—" for a team
   that held AND a "Last week: N" beside every mark — and the second is what
   makes the first legible. v208 shipped a bare dash with no last-week line,
   which is the v196 stray-dash problem; the fix is the context, not the
   silence. `null` (no published prior at all) still renders nothing. */
const moveStr = (m) => (m == null ? '' : m === 0 ? '—' : m > 0 ? `▲${m}` : `▼${-m}`);
const moveCls = (m) => (m == null ? '' : m === 0 ? 'flat' : m > 0 ? 'up' : 'down');
const hasMove = (m) => m != null;
const lastWk = (m, i) => (m == null ? '' : `LW ${i + 1 + m}`);

/* ---------------------------------------------------------------- state --- */
function restoreOrBuild() {
  const built = buildModel(S.season);
  S.key = built.weeks;
  S.ready = built.ready;
  S.model = built.model;
  S.scores = built.scores;
  S.rows = built.rows;

  const d = load(K_DRAFT, null);
  /* An in-progress draft is only restored for the SAME week. When a new week's
     results land, the key moves and the model builds a fresh ranking — that is
     the "pre-built each week" behaviour, and it can't silently overwrite edits,
     because last week's edits belong to a week that is already published. */
  if (d && d.key === S.key && Array.isArray(d.order) && d.order.length) {
    const live = new Set(S.season.teams.map((t) => t.teamId));
    // Drop anyone who left the league, append anyone who joined, so a roster
    // change can never make a team vanish from the rankings.
    S.order = d.order.filter((id) => live.has(id));
    S.season.teams.forEach((t) => { if (!S.order.includes(t.teamId)) S.order.push(t.teamId); });
    S.comments = d.comments || {};
    S.byline = d.byline || defaultByline();
  } else {
    S.order = built.order.slice();
    // Pre-write the whole week. Opening the lab to twelve blank boxes is the
    // thing that makes a weekly column not happen; opening it to twelve drafts
    // with the numbers already right is a ten-minute edit.
    S.comments = S.ready ? writeWeek(takeFacts(S.season, S.order, S.key, prevOrder()), { spicy: spiceOn() }) : {};
    S.byline = S.byline || defaultByline();
    persist();
  }
}

/* The spec rations profanity to ~2-3 lines a week. This turns even that off —
   some weeks a line lands wrong and it is easier to flip a switch than to edit
   three takes. */
function spiceOn() { try { return localStorage.getItem('powerlab:spice') !== '0'; } catch (_) { return true; } }
function setSpice(v) { try { localStorage.setItem('powerlab:spice', v ? '1' : '0'); } catch (_) {} }

/* Rewrite every take for this week. Discards edits, so it asks first. */
function rewriteAll() {
  S.comments = writeWeek(takeFacts(S.season, S.order, S.key, prevOrder()), { spicy: spiceOn(), salt: String(Date.now()) });
  persist();
}
/* Reroll ONE line — the common case is that eleven are fine and one is flat. */
function rewriteOne(id) {
  const facts = takeFacts(S.season, S.order, S.key, prevOrder());
  const one = facts.filter((f) => f.id === id);
  const w = writeWeek(one, { spicy: spiceOn(), salt: String(Math.random()) });
  S.comments[id] = w[id];
  persist();
}

/* Default the byline to whoever is building — it is the name the league knows
   them by, and it means sharing works without filling anything in first.

   🚨 A GUEST IS NOT THE OWNER, AND THIS IS WHERE THAT WOULD HAVE LEAKED
   (v33). `isMe` is ESPN's flag for the account the backend authenticates as,
   which is the owner's, always — so a guest's rankings would have gone to the
   group chat bylined with HIS team name. The shared view carries a byline for
   exactly one reason: *"someone shared their power rankings"* is useless in a
   twelve-person league and the first thing a recipient needs is whose take it
   is. Getting that wrong is worse than omitting it. */
function defaultByline() {
  const g = window.LeagueOwner && window.LeagueOwner.guest && window.LeagueOwner.guest();
  if (g && g.who) {
    const t = teamForMgr(g.who);
    if (t) return t;
  }
  const me = (S.season.teams || []).find((t) => t.isMe);
  return me ? me.team : '';
}

/* Manager code → their team name THIS season. `MANAGERS` is keyed the other
   way (team name → manager) because team names change every year and the
   twelve people do not, so this walks it rather than keeping a second map
   that would drift the first time somebody renames. */
function teamForMgr(code) {
  const want = String(code || '').toLowerCase();
  const hit = (S.season && S.season.teams || []).find((t) => mgrFor(t.team).toLowerCase() === want);
  return hit ? hit.team : '';
}

function persist() {
  save(K_DRAFT, { key: S.key, order: S.order, comments: S.comments, byline: S.byline, at: Date.now() });
}

function move(id, to) {
  const from = S.order.indexOf(id);
  if (from < 0) return;
  to = Math.max(0, Math.min(S.order.length - 1, to));
  if (to === from) return;
  S.order.splice(from, 1);
  S.order.splice(to, 0, id);
  persist();
  paintRank();
}

/* ------------------------------------------------------------ share I/O --- */
/* base64url over UTF-8. btoa is Latin-1 only, so an emoji in a take (and there
   will be emoji in the takes) throws unless the string is encoded first. The
   byte array is walked in chunks because String.fromCharCode(...bytes) blows
   the call stack on a payload this size. */
function b64u(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function unb64u(s) {
  const b = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b + '='.repeat((4 - (b.length % 4)) % 4));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/* The payload is SELF-CONTAINED — names, records, takes and all. A recipient
   opens it cold with no backend call: the rankings are the owner's editorial
   content, and a link that re-derives them from a live feed would show a
   different ranking a week later than the one that was sent. */
function payload() {
  const prev = prevOrder();
  return {
    v: 1,
    k: S.key,
    l: keyLabel(S.key),
    b: (S.byline || '').slice(0, 40),
    d: new Date().toISOString().slice(0, 10),
    r: S.ready ? 1 : 0,
    o: S.order.map((id, i) => {
      const t = teamById(id);
      const row = (S.rows || {})[id];
      return [
        t.team || '',
        recordOf(t),
        row ? Math.round(row.ppg * 10) / 10 : null,
        (S.comments[id] || '').slice(0, MAX_COMMENT),
        S.model[id] || null,
        moveFor(prev, id, i),
        mgrLabel(t.team) || '',
        /* 🚨 index 7, the MANAGER CODE — added for the league app, which has
           to find "your" row among twelve. It cannot use index 6: `mgrLabel`
           deliberately returns '' when the label would just repeat the team
           name (the "CC CC" rule), so keying off it would silently deny CC —
           and only CC — their own row. Same trap the crests hit in v208. */
        mgrFor(t.team) || '',
      ];
    }),
  };
}
const shareURL = () => location.href.split('#')[0] + '#r=' + b64u(JSON.stringify(payload()));

/* ── 📤 PUBLISH TO THE LEAGUE APP ─────────────────────────────────────────
   The share LINK is a message; publishing is a RELEASE. Same payload either
   way — one object, so the link and the app can never disagree about what was
   published — but this form is written to a file in the repo, which is what
   makes it show up on everyone's app without anybody being sent anything.

   🚨 It also PUBLISHES the week in the movement sense (`markPublished`), for
   the same reason sharing does: ▲▼ is measured against the last set the
   league actually saw, never against the model's own previous guess. If this
   did not mark it, next week's arrows would be silently wrong. */
function publishJSON() {
  return JSON.stringify(payload(), null, 2);
}
function publishFilename() {
  const p = payload();
  const slug = String(p.l || 'week').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${p.d}-${slug || 'week'}.json`;
}

/* The line that goes at the top of `rankings/index.json`, newest first.
   🚨 EVERY FIELD OF IT IS ALREADY IN THE PAYLOAD, so handing over the week
   file and leaving somebody to work this out by hand was asking them to
   re-derive data we are holding. `k` must be unique (it is the week key) and
   an index entry that disagrees with its file is a week nobody can see. */
function publishIndexEntry() {
  const p = payload();
  return JSON.stringify({ k: p.k, l: p.l, d: p.d, f: publishFilename() });
}

/* The mirror of the two publish steps: the file to delete and the line to pull
   out of the index. Written as a sentence rather than a blob because a
   retraction has no payload to paste — it is an instruction, and the whole
   point of handing it over is that nobody has to remember which two files a
   published week touched. */
function unpublishInstruction(rec, key) {
  const label = (rec && rec.label) || keyLabel(key);
  if (!rec || !rec.file) return '';
  return `Unpublish ${label} from the league app: delete rankings/${rec.file}, `
    + `and remove the entry with "k": ${key} from the weeks list in rankings/index.json. `
    + `Then commit and push to main.`;
}

/* The owner's own output format: rank, team, owner, record, PPG, last week,
   then the entry on its own line. This is the copy that gets pasted into the
   league chat, so it matches the layout they already publish in. */
function shareText() {
  const p = payload();
  const L = [`${String(p.l || '').toUpperCase()}${p.b ? ` — ${p.b}` : ''}`, ''];
  p.o.forEach((row, i) => {
    const [name, rec, ppg, note, , mv, own] = row;
    const bits = [rec];
    if (ppg != null) bits.push(`${ppg} PPG`);
    const last = hasMove(mv) ? ` — Last week: ${i + 1 + mv}` : '';  // 0 = held, still worth printing
    L.push(`${i + 1}. ${name}${own ? ` — ${own}` : ''} (${bits.join(', ')})${last}`);
    if (note) L.push(note);
    L.push('');
  });
  L.push('Full rankings:', shareURL());
  return L.join('\n');
}

async function copyText(txt) {
  try {
    if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(txt); return true; }
  } catch (_) {}
  try {
    const ta = document.createElement('textarea');
    ta.value = txt;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0';
    document.body.appendChild(ta);
    ta.select(); ta.setSelectionRange(0, txt.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (_) { return false; }
}

let TOAST_T = null;
function toast(msg) {
  let n = $('#pr-toast');
  if (!n) { n = el('div', 'pr-toast'); n.id = 'pr-toast'; n.setAttribute('role', 'status'); document.body.appendChild(n); }
  n.textContent = msg;
  n.classList.add('on');
  clearTimeout(TOAST_T);
  TOAST_T = setTimeout(() => n.classList.remove('on'), 2800);
}

/* Neither the share sheet nor the clipboard worked — put it on screen,
   pre-selected. 16px, per the iOS focus-zoom rule. */
function shareFallback(label, txt) {
  const host = $('#pr-share-out');
  if (!host) return;
  host.innerHTML = `<div class="pr-share-out"><div class="t">${esc(label)} — select and copy:</div><textarea readonly rows="8"></textarea></div>`;
  const ta = host.querySelector('textarea');
  ta.value = txt; // set as a value, never interpolated into markup
  ta.focus(); ta.select();
}

/* Sharing IS publishing — it snapshots the week into the archive so next week's
   ▲▼ movement is measured against what the league actually saw. Stated on the
   button's helper line, because a hidden side effect is a bad side effect.

   ⚠️ `file` is passed ONLY by 🚀 Publish, and the distinction is the whole of
   what unpublishing can offer. A link, a text copy and a one-pager are all
   messages: the league saw the table, so the week is marked, but there is
   nothing in the repo to take back. Publishing writes a FILE, and a file can
   be retracted — so only that path records which one, and `unpublish()` can
   only name a file it was told about rather than re-deriving one. */
function publish(file) {
  const pub = load(K_PUB, {});
  const was = pub[S.key] || {};
  pub[S.key] = {
    order: S.order.slice(),
    comments: Object.assign({}, S.comments),
    at: Date.now(),
    label: keyLabel(S.key),
    /* 🚨 A REPUBLISH ON A DIFFERENT DAY IS A DIFFERENT FILENAME. `publishFilename()`
       is built from `payload().d`, which is TODAY — so publishing Week 3 on
       Sunday and correcting it on Tuesday produces two names, and "overwrite
       the file" quietly becomes "add a second and orphan the first". The
       previous name is kept so the publish output can say to delete it. */
    file: file || was.file || null,
    prevFile: file && was.file && was.file !== file ? was.file : null,
  };
  save(K_PUB, pub);
}

/* What this device thinks the league has seen for this week, or null. */
const pubRec = () => (load(K_PUB, {}) || {})[S.key] || null;

/* ↩️ UNPUBLISHING is the movement mark coming off, and nothing else — the
   file itself lives in the repo and only a commit can take it out of there.
   Those are two halves of one retraction and the button hands over both, the
   same way 🚀 hands over the file AND its index line (v24).

   🚨 The half that CANNOT be skipped is this one. A week the owner published
   and then pulled is a table the league never saw, and `prevOrder()` walks
   back from `S.key - 1` to find what next week's ▲▼ are measured against —
   so leaving the mark in place would measure next week's movement against a
   retracted ranking, silently, with every arrow on the page wrong and nothing
   on screen admitting it. "Movement the league never saw is not movement" is
   the rule publishing exists to keep; unpublishing is how it survives a
   mistake. */
function unpublish() {
  const pub = load(K_PUB, {});
  const was = pub[S.key] || null;
  delete pub[S.key];
  save(K_PUB, pub);
  return was;
}

/* ── ↩️ THE PUBLISHED STATE, ON SCREEN ────────────────────────────────────
   Publishing has always had a side effect the page never showed: the week gets
   marked, and next week's ▲▼ are measured against the mark. So "have I already
   sent this one?" was a question only localStorage could answer, and the answer
   mattered most in exactly the situation where you are least sure — you have
   just published something wrong.

   ⚠️ Rendered as innerHTML rather than a `hidden` toggle, deliberately. A
   `[hidden]` element under this repo's palette layer is (0,1,0) against
   (0,2,1) and stays on screen — the trap that has bitten the app three times
   (.lg-jump, .lg-sheet, .ai-sub). An empty container cannot have that bug. */
function pubStateHTML() {
  const rec = pubRec();
  if (!rec) return '';
  const when = rec.at ? new Date(rec.at).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }) : '';
  const what = rec.file
    ? `published to the app${when ? ` on ${esc(when)}` : ''} as <b>rankings/${esc(rec.file)}</b>`
    : `sent as a link or a text copy${when ? ` on ${esc(when)}` : ''}, never published to the app`;
  return `<div class="pr-pubstate">
    <p class="pr-note">✅ <b>${esc(rec.label || keyLabel(S.key))}</b> is ${what}. Next week's ▲▼ movement is measured against this order.</p>
    <button type="button" class="pr-btn ghost" id="pr-unpublish">↩️ Unpublish this week</button>
    <p class="pr-note">Take it back if it went out wrong. That clears the mark here — so next week's arrows go back to measuring against the last week the league actually kept — and hands you the two lines to remove from the repo.</p>
  </div>`;
}

function paintPubState() {
  const host = $('#pr-pubstate');
  if (!host) return;
  host.innerHTML = pubStateHTML();
  const btn = $('#pr-unpublish');
  if (!btn) return;
  btn.onclick = async () => {
    const rec = pubRec();
    const label = (rec && rec.label) || keyLabel(S.key);
    if (!confirm(`Unpublish ${label}?\n\nThis un-marks it here, so next week's ▲▼ stop being measured against it. The file in the repo comes out with the two steps shown next.`)) return;
    const was = unpublish();
    paintPubState();
    const out = $('#pr-share-out');
    const instr = unpublishInstruction(was, S.key);
    if (out) {
      out.innerHTML = instr
        ? `<div class="pr-share-out">
            <div class="t">Unmarked here. Now take it out of the repo — ① delete <b>rankings/${esc(was.file)}</b>, ② remove the <b>"k": ${S.key}</b> entry from <b>rankings/index.json</b>:</div>
            <textarea readonly rows="6"></textarea>
            <p class="pr-note">Or just paste that line to a Claude session — it is the whole instruction. Until it reaches <b>main</b>, the league still sees the old week.</p>
          </div>`
        : `<div class="pr-share-out">
            <div class="t">Unmarked here.</div>
            <p class="pr-note">There is nothing to take out of the repo — ${esc(label)} was only ever sent as a link or a text copy, so it was never on anyone's app. Next week's ▲▼ now measure against the last week you actually published.</p>
          </div>`;
    }
    const ta = out && out.querySelector('textarea');
    if (ta) { ta.value = instr; ta.focus(); ta.select(); }
    if (instr && await copyText(instr)) toast('Copied — paste it to a Claude session');
    else toast(`${label} unpublished`);
  };
}

async function doShare(kind) {
  publish();
  paintPubState();
  const url = shareURL();
  const txt = kind === 'text' ? shareText() : url;
  if (url.length > 8000) toast('Heads up — long takes make a long link. The text copy always works.');
  if (navigator.share) {
    try {
      await navigator.share(kind === 'text'
        ? { title: `Power Rankings — ${keyLabel(S.key)}`, text: txt }
        : { title: `Power Rankings — ${keyLabel(S.key)}`, url });
      paintRank();
      return;
    } catch (e) {
      // A cancelled share sheet is not a failure — don't fall through to a copy.
      if (e && (e.name === 'AbortError' || e.name === 'NotAllowedError')) { paintRank(); return; }
    }
  }
  if (await copyText(txt)) toast(kind === 'text' ? 'Rankings copied' : 'Link copied');
  else shareFallback(kind === 'text' ? 'Rankings' : 'Link', txt);
  paintRank();
}




/* ============================================================================
   ✍️ THE WRITE-UP GENERATOR — "Nectars Bologna Power Rankings", Jack's voice
   ----------------------------------------------------------------------------
   Pre-writes a full entry for every team, every week, so the owner opens the
   lab to twelve drafts with the numbers already right and EDITS rather than
   starting from twelve blank boxes.

   Built from the owner's own analysed style spec. The shape that matters:

     · **25-45 words, 3-4 sentences** is the default entry. Assembled from
       parts (opener → evidence → optional meta → closer) rather than written
       as whole templates, because four slots multiply into far more variety
       than a flat list of finished lines, and because the word budget can
       then be hit by adding or dropping a part.
     · **Exactly ONE entry a week is a short line** (6-12 words), for contrast.
       Allocated deliberately, mid-table by preference.
     · **Meta-commentary is the signature move** — Jack is a character in his
       own rankings, takes credit for outcomes, and cites his own past weeks.
       2-3 a week.
     · **Owner cards, keyed by MANAGER**, because team names change every year
       and the people don't. Real name when describing a matchup, team name
       when describing the team.
     · **Jack's own slot never uses the same register as the others** — at #1
       the praise is put in the league's mouth, never his own; losing, it is
       first-person-plural with a ring reference. Never self-insult, never
       grovel.

   ⚠️ STILL A TEMPLATE ENGINE, NOT A LANGUAGE MODEL. There is no LLM in this
   app and no backend to host one, so the voice lives in these tables.
   **Rewriting a fragment is how you change the writing; there is no prompt to
   tune.** It cannot be witty about anything it has no input for — the spec's
   *blame one decision* shape wants a benching/injury/trade, and `/season`
   carries none, so it only generates the generic form.

   🚫 THE CARVE-OUT, implemented and asserted, not merely documented: no
   slurs, no racial, ethnic or religious material, nothing about rape or the
   Holocaust. The owner's own spec is explicit that the historical rankings
   contain these and that they must NOT be reproduced, while the crudeness,
   meanness and profanity stay. Nothing in these tables can assemble one, and
   a suite check sweeps thousands of generated lines against a banned list.
   Wolff's card in particular carries a NO-religious-material flag.
   ========================================================================== */

/* Seeded so a week's drafts are stable — writing that reshuffled on every
   repaint would be unusable. Salt bumps to reroll one line on demand. */
function rng(seed) {
  let x = hashName(seed) || 1;
  return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
}
const pick = (r, a) => a[Math.floor(r() * a.length) % a.length];
const words = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;

/* ---- OWNER CARDS ---------------------------------------------------------
   Keyed by MANAGER. `real` is what Jack calls them when describing a matchup;
   the team name is used when describing the team. `bits` are the running
   references. Anything absent just degrades to the generic register. */
const OWNERS = {
  McD:      { real: 'me', you: true },
  Hurd:     { real: 'the cummish', cummish: true, bits: ['Vermont is buzzing', 'still on Phish tour', 'a Pats fan, which explains a lot'] },
  CC:       { real: 'CC', rival: true, bits: ['writes his own rankings and they are worse', 'never met a trade he didnt like'] },
  Wolff:    { real: 'Wolffffyyyyy', bits: ['still cannot beat me', 'the Giants are not helping'] },
  Christel: { real: 'Christel', bits: ['the Bats are stirring', 'check ur lineup, old sailor'] },
  Woods:    { real: 'Woods', bits: ['a former champ playing the village jester', 'follows 8 teams so he never actually loses'] },
  Zach:     { real: 'Zachariah', bits: ['our southern brother', 'the Carolina king is restless'] },
  Riz:      { real: 'the rizzard', sincere: true, bits: ['the most underrated gm in this league'] },
  Buley:    { real: 'Buley', warm: true, bits: ['my man', 'buddy'] },
  Hyman:    { real: 'Hyman', bits: ['blue collar, hard nosed, grind it out fantasy'] },
  Gotch:    { real: 'Gotch', bits: ['the Bears and the Cubs have prepared him for this'] },
  Slemp:    { real: 'Slemp', bits: ['3 rings and the league still wont say it out loud'] },
};
const ownerCard = (team) => OWNERS[mgrLabel(team) || ''] || {};
const bitFor = (r, d) => { const c = ownerCard(d.team); return c.bits && c.bits.length ? pick(r, c.bits) : ''; };
const realName = (d) => (ownerCard(d.team).real || d.team);

/* Persistent nicknames. ⚠️ The historical set carried an ethnic bit; it is
   deliberately absent and must not come back. */
const NICKS = {
  'current champ': 'the champ', gmdd: 'buley', 'thurgood marshall': 'gotch',
  'morning woods': 'woods', 'slob on my cobb': 'slemp', 'cheeky clapz': 'the noob',
  'future champ': 'king fraud', 'goff hits women': 'jam boy', cummish: 'the cummish',
};
const nickFor = (name) => NICKS[String(name || '').toLowerCase().trim()] || '';
const ADDRESS = ['bud', 'buddy', 'my man', 'my friend', 'kid'];
const pickA = (r) => pick(r, ADDRESS);

/* ---- THE CUM BOWL --------------------------------------------------------
   The consolation bracket, with its own lexicon. Escalates from ~week 8,
   2-4 a week, concentrated in the bottom third and on Hurd. */
const CUMBOWL = [
  (d) => `Cum city is calling and ur picking up on the first ring`,
  (d) => `Its championship or cum for this franchise and we all know which one is coming`,
  (d) => `Casper the cummy ghost has been haunting this roster since September`,
  (d) => `Keep cumming like this and the big cummy game is urs to lose`,
  (d) => `The crooked cummish has u exactly where he wants u`,
  (d) => `Cum free at ${d.rec}? not a chance ${pickA(rng(d.team + 'cb'))}`,
];

/* ---- META-COMMENTARY -----------------------------------------------------
   Jack as a character in his own rankings — the signature move. Injected as
   an extra SENTENCE into 2-3 entries a week, never as a whole entry. */
const META = [
  (d) => `I change my tune every week, its how this whole thing works`,
  (d) => `Check my week ${Math.max(1, d.week - 2)} rankings, I knew where this team was ending up`,
  (d) => `Safe to say my jinx worked`,
  (d) => `I anoint u top 2 and thats the dud u give me??`,
  (d) => `Consider urself lucky u live in a world where I hand out weekly jewels`,
  (d) => `I put u up at the top spot and look what happens, well im back to motivate this sorry sack`,
  (d) => `I had u ${d.prevRank ? `at ${d.prevRank}` : 'buried'} last week and I regret nothing`,
];

/* ---- SENTENCE PARTS ------------------------------------------------------
   opener → evidence → (meta) → closer. Every part is written IN VOICE:
   shorthand baked in, not applied as a find-and-replace pass over clean prose,
   which reads like a robot doing an impression. */
const OPEN = {
  kingOther: [
    (d) => `All he does is win.`,
    (d) => `${d.rec} and ${d.ppg} PPG, theres no argument to make here.`,
    (d) => `Best team in the league on paper and it isnt close.`,
    (d) => `Nobody wants this matchup and everybody knows it.`,
  ],
  kingMine: [
    (d) => `"We cant keep letting him get away with this" - all 11 of u losers.`,
    (d) => `Ur commish at the top again.`,
    (d) => `${d.rec}, ${d.ppg} PPG. I dont need to say a word here.`,
  ],
  mine: [
    (d) => `We're in a bad place right now.`,
    (d) => `Not the week we wanted.`,
    (d) => `${d.rec} is not where this roster should be.`,
  ],
  contender: [
    (d) => `This is a real team.`,
    (d) => `${d.ppg} PPG and quietly hanging around the top.`,
    (d) => `Everything is set up here.`,
    (d) => `Quietly ${d.streakN >= 3 ? `winners of ${d.streakN} straight` : d.streakN === 2 ? 'back to back' : 'lurking'}.`,
  ],
  bubble: [
    (d) => `One game out and playing like it.`,
    (d) => `Team hasnt played great in a long time.`,
    (d) => `This is the gut check week.`,
    (d) => `${d.rec} and every week from here is a must win.`,
  ],
  low: [
    (d) => `Idk what to say ${pickA(rng(d.team + 'lo'))}.`,
    (d) => `Absolute shalacking again.`,
    (d) => `${d.ppg} PPG. ${d.ppg}.`,
    (d) => `This roster is a fucking crime scene.`,
  ],
  last: [
    (d) => `So what is the punishment this year?`,
    (d) => `Dead last in PF and its not even close.`,
    (d) => `We have reached the resignation stage.`,
  ],
};

const MID = {
  kingOther: [
    (d) => `${d.apW}-${d.apL} against the whole league says its not luck either.`,
    (d) => `${d.streakN >= 2 ? `${d.streakN} straight and ` : ''}the roster still has room to get better, which is the scary part.`,
    (d) => `The rest of us are filling out the schedule at this point.`,
  ],
  kingMine: [
    (d) => `${d.ppg} PPG and I didnt even feel like setting a lineup.`,
    (d) => `${d.apW}-${d.apL} against the field, so save the schedule talk.`,
  ],
  mine: [
    (d) => `The lineup calls cost us and I'll wear that one.`,
    (d) => `${d.apW}-${d.apL} against the field, so the roster isnt the problem.`,
  ],
  contender: [
    (d) => `${d.rec} with ${d.ppg} PPG and the schedule softens up from here.`,
    (d) => `${d.ppgRank}${ord(d.ppgRank)} in scoring and nobody is talking about u, which is probably how u like it.`,
    (d) => `Just needs one signature win to make everybody take it seriously.`,
    (d) => `Sitting ${d.apW}-${d.apL} against the field, so this is real and not a hot streak.`,
  ],
  bubble: [
    (d) => `${d.apW}-${d.apL} against the whole league but only ${d.rec}, thats a schedule problem not a roster problem.`,
    (d) => `${d.ppg} PPG isnt gonna cut it but theres still a path here.`,
    (d) => `Youve got the pieces, ur just not starting the right ones.`,
    (d) => `Still in the thick of the playoff hunt whether u believe it or not.`,
  ],
  low: [
    (d) => `${d.rec} with ${d.ppg} PPG and no sign of a plan.`,
    (d) => `${d.streakC === 'L' && d.streakN >= 2 ? `Losers of ${d.streakN} straight and ` : ''}this gm has lost the room.`,
    (d) => `Havent broke a hundo in weeks and the waiver wire is untouched.`,
  ],
  last: [
    (d) => `${d.rec}, ${d.ppg} PPG, and somehow still logging in every Sunday.`,
    (d) => `${d.apW}-${d.apL} against the field, so this is exactly where u belong.`,
  ],
};

const CLOSE = {
  kingOther: [
    (d) => `But the best team never wins this god damn league.`,
    (d) => `Now we find out if u can actually finish. PROVE IT`,
    (d) => `Is anyone in this league gonna challenge ${nickFor(d.team) || realName(d)}???`,
  ],
  kingMine: [
    (d) => `Line forms to the left.`,
    (d) => `Ring number 4 is the only thing on the board.`,
  ],
  mine: [
    (d) => `But I sleep happy knowing I've won rings 3 times from the wild card game. Here's to 4`,
    (d) => `We've been dead before. It never took.`,
  ],
  contender: [
    (d) => `Could this be the year?!`,
    (d) => `Huge matchup this week to separate the real from the spuds.`,
    (d) => `Prime time spot this week with the nations eyes fixed in.....`,
  ],
  bubble: [
    (d) => `Are u man enough to go from bye to glory?!?! PROVE IT`,
    (d) => `Can u actually string 3 together???`,
    (d) => `You know whats crazy, ur right in it. go get it`,
  ],
  low: [
    (d) => `At what point do we check if ur still logging in?`,
    (d) => `Is there a floor here???`,
    (d) => `U stink. I mean u really do stink.`,
  ],
  last: [
    (d) => `Can he go winless???`,
    (d) => `Take solace in nothing.`,
    (d) => `See u in the consolation bracket ${pickA(rng(d.team + 'cl'))}.`,
  ],
};

/* The ONE short entry a week — 6-12 words, for contrast. */
const SHORTS = [
  (d) => `Ur the tallest midget right now. Take solace in that.`,
  (d) => `${d.ppg} PPG. Thats the whole review.`,
  (d) => `Nothing to say here. Genuinely nothing.`,
  (d) => `${d.rec}. Ive run out of angles on u.`,
  (d) => `Still here. Still ${d.rec}. Still fine.`,
];

/* ---- FACTS ---------------------------------------------------------------
   Everything a part can reach for. Anything not here cannot be written about,
   which is the honest limit of a template engine. */
function takeFacts(season, order, key, prev) {
  const teams = season.teams || [];
  const ppgOf = (t) => { const ps = played(t.scores); return ps.length ? mean(ps) : 0; };
  const ppgs = teams.map(ppgOf);
  const sortedPpg = ppgs.slice().sort((a, b) => b - a);
  const weekly = teams.map((t) => { const ps = played(t.scores); return ps.length ? ps[ps.length - 1] : null; });
  const live = weekly.filter((x) => x != null);
  const hi = live.length ? Math.max(...live) : null;
  const lo = live.length ? Math.min(...live) : null;
  const ap = season.allPlay || {};

  return order.map((id, i) => {
    const t = teams.find((x) => x.teamId === id) || {};
    const ti = teams.indexOf(t);
    const ps = played(t.scores);
    const outs = (t.outcomes || []).slice(0, ps.length);
    let sk = 0, skc = '';
    for (let j = outs.length - 1; j >= 0; j--) {
      if (!skc) { skc = outs[j]; sk = 1; } else if (outs[j] === skc) sk++; else break;
    }
    const a = ap[id] || { w: 0, l: 0 };
    const apG = (a.w || 0) + (a.l || 0);
    const w = Number(t.wins) || 0, l = Number(t.losses) || 0;
    return {
      id, rank: i + 1, prevRank: prev ? (prev.order.indexOf(id) + 1 || null) : null,
      team: t.team || '', nick: nickFor(t.team), mgr: mgrLabel(t.team), isMe: !!t.isMe,
      rec: `${w}-${l}`, wins: w, losses: l,
      ppg: Math.round(ppgs[ti] * 10) / 10,
      ppgRank: sortedPpg.indexOf(ppgs[ti]) + 1,
      score: weekly[ti] == null ? null : Math.round(weekly[ti] * 10) / 10,
      topScore: weekly[ti] != null && weekly[ti] === hi,
      lowScore: weekly[ti] != null && weekly[ti] === lo,
      hundo: weekly[ti] != null && weekly[ti] >= 100,
      streak: sk >= 2 ? `${skc}${sk}` : '', streakN: sk, streakC: skc,
      apW: a.w || 0, apL: a.l || 0,
      lucky: apG ? (w / Math.max(1, w + l)) - (a.w / apG) : 0,
      priorTake: prev && prev.comments ? (prev.comments[id] || '') : '',
      week: key, n: order.length,
    };
  });
}

/* Which register an entry is written in. Jack's own slot is always its own. */
function bandFor(d) {
  if (d.isMe) return d.rank <= 2 ? 'kingMine' : 'mine';
  const top = Math.max(2, Math.round(d.n / 6));
  if (d.rank <= top) return 'kingOther';
  if (d.rank === d.n) return 'last';
  if (d.rank > d.n - Math.max(2, Math.round(d.n / 4))) return 'low';
  if (d.rank <= Math.ceil(d.n / 2)) return 'contender';
  return 'bubble';
}

/* Facts strong enough to lead an entry — tried FIRST, and they fall through
   when the fact they need isn't there. These are the good openers. */
function specialOpen(d) {
  const out = [];
  if (d.topScore) out.push(() => `High score of the week with ${d.score}.`);
  if (d.lowScore && d.score != null) out.push(() => `Low score of the week. ${d.score}.`);
  if (d.lucky > 0.28) out.push(() => `${d.rec} and only ${d.apW}-${d.apL} against the field.`);
  if (d.lucky < -0.28) out.push(() => `${d.apW}-${d.apL} against the whole league and sat at ${d.rec}. Absolute robbery.`);
  if (d.streakN >= 3) out.push(() => `${d.streakN} straight ${d.streakC}s at ${d.ppg} PPG.`);
  if (d.prevRank && d.prevRank - d.rank >= 4) out.push(() => `Had u down at ${d.prevRank} last week. From garbage to glory.`);
  if (d.prevRank && d.rank - d.prevRank >= 4) out.push(() => `Was ${d.prevRank} last week. Thats a fall, not a dip.`);
  if (d.priorTake) {
    const frag = d.priorTake.split(/[.!?]/)[0].trim().slice(0, 46);
    if (frag.length > 14) out.push(() => `Last week i said "${frag}".`);
  }
  return out;
}
const trail = (r, s) => (r() < 0.34 ? s.replace(/[.!?]*$/, '') + '.'.repeat(3 + Math.floor(r() * 5)) : s);

/* Every part has to close itself. Several fragments carried no terminal mark,
   so they ran straight into the next sentence — "…I hand out weekly jewels
   Prime time spot this week…". Joining is not the place to notice that. */
const endStop = (t) => { const x = String(t || '').trim(); return /[.!?…]$/.test(x) ? x : x + '.'; };

/* 🚨 Two sentences in one entry must not cite the SAME fact. The assembler
   could open on "10 straight Ws at 132.5 PPG" and then evidence with "132.5
   PPG and I didnt even feel like setting a lineup", or state the all-play
   record twice in a row — which reads as a machine, instantly. Tag each
   sentence by the facts it mentions and drop a later repeat. This also trims
   long entries for free, which is why it runs before the word-budget pass. */
const FACT_SIGS = [
  [/\d+-\d+ against/i, 'allplay'],
  [/\bPPG\b/i, 'ppg'],
  [/\bstraight\b/i, 'streak'],
  [/\bhundo\b/i, 'hundo'],
  [/score of the week/i, 'weekscore'],
  [/last week/i, 'lastweek'],
];
function dedupeFacts(parts) {
  const seen = new Set();
  return parts.filter((p, i) => {
    const sigs = FACT_SIGS.filter(([re]) => re.test(p)).map(([, k]) => k);
    // The opener always survives — it is the lead, and something must lead.
    if (i === 0) { sigs.forEach((k) => seen.add(k)); return true; }
    if (sigs.some((k) => seen.has(k))) return false;
    sigs.forEach((k) => seen.add(k));
    return true;
  });
}

/* ---- THE WEEK ------------------------------------------------------------
   Week-level rules need a week-level writer: exactly one short entry, 2-3
   meta lines, 2-4 cum-bowl lines from week 8, no part reused. None of that
   could be enforced from inside a per-team function. */
function writeWeek(facts, opts) {
  const o = opts || {};
  const out = {};
  const used = new Set();
  const spicy = o.spicy !== false;
  const n = facts.length;

  /* The short entry: seeded, mid-table by preference — the spec puts it at a
     team you have run out of things to say about, not at the top or bottom. */
  const mid = facts.filter((d) => !d.isMe && d.rank > 3 && d.rank < n - 1);
  const shortId = mid.length ? mid[Math.floor(rng('short' + (facts[0] ? facts[0].week : 0) + (o.salt || ''))() * mid.length)].id : null;

  /* Budgets. Meta is the signature move, so it is ALLOCATED rather than left
     to chance — the same lesson the profanity budget taught: treated as a
     ceiling it simply never got spent. */
  let metaLeft = 2 + Math.floor(rng('mq' + (o.salt || ''))() * 2);   // 2-3
  let cumLeft = (facts[0] && facts[0].week >= 8 && spicy) ? 2 + Math.floor(rng('cq' + (o.salt || ''))() * 3) : 0; // 2-4

  /* Gate on the RENDERED TEXT, not on a per-part flag. A flag has to be
     remembered on every new fragment; a regex over the output cannot be
     forgotten. `spicy:false` therefore turns the whole crude register off,
     which is what the toggle promises. */
  const PROFANE = /(fuck|shit|cum|butt plundering|stink|crime scene|god damn)/i;
  const take = (r, pool, d) => {
    let cand = pool.filter((f) => !used.has(f));
    if (!spicy && d) {
      const clean = cand.filter((f) => { try { return !PROFANE.test(String(f(d))); } catch (_) { return false; } });
      if (clean.length) cand = clean;
      else {
        const anyClean = pool.filter((f) => { try { return !PROFANE.test(String(f(d))); } catch (_) { return false; } });
        if (anyClean.length) cand = anyClean;
      }
    }
    const c = pick(r, cand.length ? cand : pool);
    used.add(c);
    return c;
  };

  facts.forEach((d) => {
    const r = rng(`${d.team}|${d.week}|${o.salt || ''}`);
    const band = bandFor(d);

    if (d.id === shortId) { out[d.id] = trail(r, endStop(String(take(r, SHORTS, d)(d))).replace(/\s+/g, ' ').trim()); return; }

    const parts = [];
    // Jack's own slot never takes a generic opener — the separate register IS
    // the rule, and its own lines are the strongest ones he has.
    const sp = d.isMe ? [] : specialOpen(d);
    parts.push(String((sp.length && r() < 0.55 ? take(r, sp, d) : take(r, OPEN[band], d))(d)));
    parts.push(String(take(r, MID[band], d)(d)));

    // An owner's running bit, where there is one and there is room.
    const bit = bitFor(r, d);
    if (bit && r() < 0.4) parts.push(`${bit.charAt(0).toUpperCase()}${bit.slice(1)}.`);

    // Cum bowl: bottom third and the cummish, from week 8.
    const isCum = cumLeft > 0 && (ownerCard(d.team).cummish || d.rank > n - Math.max(2, Math.round(n / 3)));
    if (isCum && r() < 0.7) { parts.push(String(take(r, CUMBOWL, d)(d))); cumLeft--; }

    // Meta-commentary, never on Jack's own slot — he IS the meta there.
    if (metaLeft > 0 && !d.isMe && r() < 0.45) { parts.push(String(take(r, META, d)(d))); metaLeft--; }

    parts.push(String(take(r, CLOSE[band], d)(d)));

    // Hit the 25-45 band: drop the middle before the closer, since the closer
    // is the line that lands. Add the evidence back if it came out thin.
    let kept = dedupeFacts(parts.map(endStop));
    const join = (a) => a.join(' ').replace(/\s+/g, ' ').trim();
    let line = join(kept);
    while (words(line) > 45 && kept.length > 2) { kept.splice(1, 1); line = join(kept); }
    if (words(line) < 25) {
      const extra = endStop(String(take(r, MID[band], d)(d)));
      const grown = dedupeFacts([kept[0], extra, ...kept.slice(1)]);
      if (words(join(grown)) <= 45 && grown.length > kept.length) line = join(grown);
    }
    out[d.id] = trail(r, line);
  });

  // Guarantee the meta budget: the spec calls it the signature move, and a
  // probabilistic pass can spend zero. Fold one into a non-Jack entry.
  if (metaLeft > 0) {
    for (const d of facts) {
      if (metaLeft <= 0) break;
      if (d.isMe || d.id === shortId) continue;
      const r = rng(`${d.team}|meta|${o.salt || ''}`);
      const m = String(take(r, META, d)(d));
      if (words(out[d.id]) + words(m) <= 47) { out[d.id] = `${out[d.id].replace(/\.+$/, '.')} ${endStop(m)}`; metaLeft--; }
    }
  }
  return out;
}

/* ============================================================================
   ⛑️ TEAM HELMETS — generated, never fetched
   ----------------------------------------------------------------------------
   Every team gets a helmet with its own colours and monogram, derived
   DETERMINISTICALLY from the team name. Same name → same helmet, forever, on
   every device, with no state to store and no asset to ship.

   ⚠️ WHY THIS IS GENERATED RATHER THAN ESPN'S REAL LOGO, and it is not
   laziness: drawing a remote image onto a canvas TAINTS it unless the host
   sends CORS headers, and a tainted canvas makes `toBlob`/`toDataURL` throw —
   which would break the one-pager export entirely, at save time, on a feed we
   cannot test from here. A generated crest always works, offline included.
   If ESPN's `Team.logo_url` is ever wired up it belongs BESIDE this as an
   enhancement with this as the fallback, never instead of it.

   ONE implementation, used in both places: the web rows draw it to a small
   canvas and use the data URL as an <img>, the one-pager drawImage()s the same
   canvas. Two hand-kept copies (an SVG one and a canvas one) would drift.
   ========================================================================== */

/* FNV-1a. Stable across engines — Math.random or a Date would make a team's
   helmet change between renders, which is the one thing it must never do. */
function hashName(s) {
  let h = 0x811c9dc5;
  const t = String(s || '').toLowerCase().trim();
  for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  // Finalising avalanche. Without it, a dozen similar-length names land on a
  // handful of kits — the first contact sheet had five near-identical greens.
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12; h = Math.imul(h, 0x297a2d39);
  h ^= h >>> 15;
  return h >>> 0;
}

/* Mid-tone shells on purpose: the same helmet has to read on the Champagne
   paper AND the Onyx black, so nothing here is near-white or near-black. */
const KITS = [
  { shell: '#1b3a6b', trim: '#c9d3e0', mask: '#c9d3e0' }, // navy / silver
  { shell: '#0f5136', trim: '#e8c766', mask: '#e8c766' }, // forest / gold
  { shell: '#8f1d24', trim: '#f0e6d8', mask: '#f0e6d8' }, // crimson / bone
  { shell: '#4a2a72', trim: '#e2c14e', mask: '#e2c14e' }, // purple / gold
  { shell: '#0d5c68', trim: '#f08a3c', mask: '#f08a3c' }, // teal / orange
  { shell: '#2b2f33', trim: '#b9c0c7', mask: '#b9c0c7' }, // graphite / silver
  { shell: '#a1471a', trim: '#f2ddb8', mask: '#f2ddb8' }, // rust / cream
  { shell: '#14493f', trim: '#8fd6b0', mask: '#8fd6b0' }, // pine / mint
  { shell: '#6b1540', trim: '#f0c9a0', mask: '#f0c9a0' }, // maroon / peach
  { shell: '#243f7a', trim: '#f2b33c', mask: '#f2b33c' }, // royal / amber
  { shell: '#5a5f16', trim: '#e9edc9', mask: '#e9edc9' }, // olive / chalk
  { shell: '#7a2418', trim: '#d8b26a', mask: '#d8b26a' }, // brick / brass
  { shell: '#1f4d4a', trim: '#e5b7c0', mask: '#e5b7c0' }, // slate teal / rose
  { shell: '#3b2a5a', trim: '#9fd0e8', mask: '#9fd0e8' }, // indigo / sky
];

/* Filler words carry no identity, so "Slob On My Cobb" reads SC, not SO. */
const SKIP = new Set(['on', 'my', 'the', 'of', 'a', 'and', 'in', 'to', 'for', 'is', 'it']);
function monogram(name) {
  const words = String(name || '').replace(/[^A-Za-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  const solid = words.filter((w) => !SKIP.has(w.toLowerCase()));
  const use = solid.length ? solid : words;
  if (!use.length) return '?';
  if (use.length === 1) return use[0].slice(0, 2).toUpperCase();
  // First and LAST significant word — the two a person actually says.
  return (use[0][0] + use[use.length - 1][0]).toUpperCase();
}

const kitFor = (name) => KITS[hashName(name) % KITS.length];

/* Draws a profile helmet inside a `size` box. Everything is expressed against
   a 100x100 design grid and scaled, so one geometry serves every size. */
function drawHelmet(ctx, x, y, size, name) {
  const kit = kitFor(name);
  const s = size / 100;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // ---- facemask. Thin, well-separated bars: at 56px a thick curved cage
  // merges into a single blob, which is what the first two cuts produced.
  ctx.strokeStyle = kit.mask;
  ctx.lineCap = 'round';
  ctx.lineWidth = 3.6;
  ctx.beginPath();                        // outer edge of the cage
  ctx.moveTo(74, 44);
  ctx.bezierCurveTo(90, 48, 94, 62, 86, 76);
  ctx.stroke();
  ctx.beginPath();                        // upper bar
  ctx.moveTo(64, 54);
  ctx.bezierCurveTo(76, 53, 85, 55, 90, 59);
  ctx.stroke();
  ctx.beginPath();                        // lower bar
  ctx.moveTo(62, 68);
  ctx.bezierCurveTo(72, 68, 81, 70, 87, 72);
  ctx.stroke();

  // ---- shell. Proportion is what makes this read as a helmet rather than as
  // a bean: the dome must be about as WIDE as it is tall. The first cuts were
  // 54 wide by 77 tall and looked like a shoe.
  ctx.beginPath();
  ctx.moveTo(12, 48);
  ctx.bezierCurveTo(12, 24, 30, 12, 50, 12);      // up over the back and crown
  ctx.bezierCurveTo(68, 12, 78, 26, 78, 43);      // crown down to the front
  ctx.bezierCurveTo(78, 49, 74, 51, 68, 52);      // brow ledge
  ctx.bezierCurveTo(62, 53, 60, 57, 60, 63);      // the face opening
  ctx.bezierCurveTo(60, 75, 50, 83, 38, 83);      // cheek into the earflap
  ctx.bezierCurveTo(24, 83, 12, 70, 12, 48);
  ctx.closePath();
  ctx.fillStyle = kit.shell;
  ctx.fill();
  // A thin trim outline so a dark shell still separates from the Onyx ground.
  ctx.strokeStyle = kit.trim;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ---- crown stripe, clipped to the shell. Inset well away from the outline:
  // hugging the edge read as a fat coloured rim, not as a stripe.
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = kit.trim;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(16, 44);
  ctx.bezierCurveTo(16, 27, 32, 18, 50, 18);
  ctx.bezierCurveTo(64, 18, 71, 25, 73, 34);
  ctx.stroke();
  ctx.restore();

  // ---- ear hole + monogram
  ctx.fillStyle = kit.trim;
  ctx.beginPath();
  ctx.arc(31, 60, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = kit.shell;
  ctx.beginPath();
  ctx.arc(31, 60, 3.2, 0, Math.PI * 2);
  ctx.fill();

  const mono = monogram(name);
  ctx.fillStyle = kit.trim;
  ctx.font = `900 ${mono.length > 1 ? 23 : 28}px Archivo, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(mono, 43, 46);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.restore();
}

/* A standalone helmet canvas — the DOM uses its data URL as an <img>, the
   one-pager drawImage()s it. 2x for retina. */
function helmetCanvas(name, size) {
  const cv = document.createElement('canvas');
  const r = 2;
  cv.width = size * r; cv.height = size * r;
  const ctx = cv.getContext('2d');
  ctx.scale(r, r);
  drawHelmet(ctx, 0, 0, size, name);
  return cv;
}
const HELM_CACHE = new Map();
function helmetURL(name, size) {
  const k = `${size}|${name}`;
  if (!HELM_CACHE.has(k)) HELM_CACHE.set(k, helmetCanvas(name, size).toDataURL('image/png'));
  return HELM_CACHE.get(k);
}

/* ---------------------------------------------------------------- crests ---
   The league's own historical logos, keyed by MANAGER — never by team name,
   because the names change every year (the 2023 sheet these came off says
   "Death Dont Hurts Very Long" where the league now says "Current Champ")
   while the twelve people do not.

   ⚠️ They are an OVERRIDE, not a replacement: any manager without a file
   falls back to the generated helmet, which is why the export can still never
   fail. A generated crest needs no network, cannot 404 and cannot taint the
   canvas; these are same-origin PNGs, so they don't taint it either, but they
   CAN fail to load, and `drawCrest` treats a failure as "use the helmet".

   ⚠️ All twelve are here. An earlier cut shipped nine, holding back three on
   the writing carve-out — but that carve-out governs what the TEMPLATE ENGINE
   generates, not the league's own historical artefacts, which the owner made
   and every manager has had since 2023. The helmet fallback stays for a
   manager with no file and for a file that fails to load, not as a filter. */
const CREST_SRC = {
  McD: 'logos/mcd.png',           CC: 'logos/cc.png',         Hurd: 'logos/hurd.png',
  Hyman: 'logos/hyman.png',       Christel: 'logos/christel.png', Woods: 'logos/woods.png',
  Zach: 'logos/zach.png',         Buley: 'logos/buley.png',   Wolff: 'logos/wolff.png',
  Riz: 'logos/riz.png',           Slemp: 'logos/slemp.png',   Gotch: 'logos/gotch.png',
};
/* ⚠️ mgrFor, NOT mgrLabel: mgrLabel deliberately returns '' when the label
   would just repeat the team name (the "CC CC" rule), so keying off it would
   have silently left CC — and only CC — on a generated helmet forever. */
const crestSrc = (team) => CREST_SRC[mgrFor(team) || ''] || null;
/* What a DOM row points an <img> at. */
const crestURL = (team, size) => crestSrc(team) || helmetURL(team, size);

/* The one-pager draws synchronously, so the files have to already be decoded
   when it runs — hence a preload that resolves on error too (a missing file
   must not hang the save). Kicked off at boot so it is normally warm. */
const CREST_IMG = new Map();   // src -> Promise<Image|null>
const CREST_READY = new Map();  // src -> Image, once decoded
function preloadSrcs(srcs) {
  return Promise.all([...new Set(srcs.filter(Boolean))].map((src) => {
    if (CREST_IMG.has(src)) return CREST_IMG.get(src);
    const pr = new Promise((res) => {
      const im = new Image();
      im.onload = () => { CREST_READY.set(src, im); res(im); };
      im.onerror = () => res(null);
      im.src = src;
    });
    CREST_IMG.set(src, pr);
    return pr;
  }));
}
const preloadCrests = (names) => preloadSrcs((names || []).map(crestSrc));
/* Draw a crest into a square box: the real logo when it loaded, the generated
   helmet otherwise. The logo is clipped to a rounded square so it reads as a
   badge beside the helmets rather than as a pasted screenshot. */
function drawCrest(ctx, name, x, y, size, loaded) {
  const src = crestSrc(name);
  // ⚠️ Fall back to the module-level decoded map. onePager() draws
  // synchronously, and the first cut required the caller to hand it a map —
  // so any caller that forgot silently got helmets and nothing errored.
  const im = src && ((loaded && loaded.get(src)) || CREST_READY.get(src));
  if (!im) { ctx.drawImage(helmetCanvas(name, size), x, y, size, size); return; }
  ctx.save();
  rr(ctx, x, y, size, size, Math.round(size * 0.18));
  ctx.clip();
  ctx.drawImage(im, x, y, size, size);
  ctx.restore();
}

/* ============================================================================
   🖼️ THE ONE-PAGER
   ----------------------------------------------------------------------------
   The scrolling page is the artefact you LINK. This is the one you POST — a
   single image, sized to fit on one page, that a league-mate saves to Photos
   and drops in the group chat without opening anything.

   It is drawn on a <canvas> rather than screenshotted from the DOM because a
   real PNG is the only form of this that survives the trip: it can be saved,
   it renders inline in every messaging app, and it needs no browser, no
   backend and no link. Nothing is loaded to do it — hand-drawn, no library.

   ⚠️ Colours are READ FROM THE LIVE PALETTE (getComputedStyle on :root), not
   hardcoded, so the image matches the app the maker is looking at and the
   token rules still hold — accent fills take --on-ac, movement is --pos/--neg.
   ========================================================================== */

const OP = {
  w: 1080, pad: 56, row: 96, gap: 10,
  head: 200, foot: 112,
};

function paletteInk() {
  const cs = getComputedStyle(document.documentElement);
  const g = (n, f) => (cs.getPropertyValue(n) || '').trim() || f;
  return {
    bg: g('--bg', '#faf7f0'), card: g('--card', '#fff'), card2: g('--card-2', '#efe9dd'),
    text: g('--text', '#1c1a15'), muted: g('--muted', '#7a7466'), line: g('--line', '#e5dece'),
    accent: g('--accent', '#0b7a5c'), pos: g('--pos', '#1d7a52'), neg: g('--neg', '#b0332a'),
    gold: g('--live', '') || g('--accent', '#b8942f'), onAc: g('--on-ac', '#1a1509'),
  };
}

/* Wrap to at most `max` lines, ellipsing only the last one. Truncating a take
   at one line throws away the content the page exists to carry, so a row sizes
   itself to its take rather than the other way round. */
function wrap(ctx, s, width, maxLines) {
  const words = String(s || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (const word of words) {
    const next = cur ? cur + ' ' + word : word;
    if (ctx.measureText(next).width <= width) { cur = next; continue; }
    if (cur) lines.push(cur);
    cur = word;
    if (lines.length === maxLines - 1) break;
  }
  if (lines.length < maxLines && cur) lines.push(cur);
  // Anything left over gets folded into the last line and ellipsed.
  const used = lines.join(' ').split(/\s+/).filter(Boolean).length;
  if (used < words.length) {
    lines[lines.length - 1] = fit(ctx, words.slice(lines.slice(0, -1).join(' ').split(/\s+/).filter(Boolean).length).join(' '), width);
  }
  return lines;
}

/* Trim a string to fit a pixel width, with an ellipsis. Canvas has no
   text-overflow, so this is the manual version of it. */
function fit(ctx, s, max) {
  s = String(s || '');
  if (ctx.measureText(s).width <= max) return s;
  let lo = 0, hi = s.length;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (ctx.measureText(s.slice(0, mid) + '…').width <= max) lo = mid; else hi = mid - 1;
  }
  return s.slice(0, lo).replace(/[\s,;:.\-]+$/, '') + '…';
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* Builds the image. `p` is the same payload the share link carries, so the
   one-pager and the link can never disagree about what was published. */
function onePager(p, loaded) {
  const C = paletteInk();
  const rows = p.o || [];
  const w = OP.w;
  const F = (px, wt = 400) => `${wt} ${px}px Archivo, -apple-system, "Segoe UI", system-ui, sans-serif`;

  // Measure pass: lay every take out first, so the canvas ends up exactly as
  // tall as the content needs and no row is clipped.
  const meas = document.createElement('canvas').getContext('2d');
  meas.font = F(22, 400);
  const takeW = w - OP.pad * 2 - 166 - 30;
  // Entries went from ~15 words to 25-45, so a 2-line wrap truncated most of
  // them — the exact fault the wrap was added to fix in the first place.
  const lines = rows.map((r) => (r[3] ? wrap(meas, r[3], takeW, 4) : []));
  const heights = lines.map((ls) => OP.row + Math.max(0, ls.length - 1) * 28);
  const h = OP.pad + OP.head + heights.reduce((a, b) => a + b + OP.gap, 0) + OP.foot + OP.pad;

  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');

  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);

  const L = OP.pad, R = w - OP.pad, CW = R - L;
  let y = OP.pad;

  // ---- header
  ctx.fillStyle = C.accent;
  ctx.font = F(22, 800);
  ctx.fillText(String(p.l || '').toUpperCase(), L, y + 22);
  if (p.b) {
    ctx.fillStyle = C.muted;
    ctx.textAlign = 'right';
    ctx.fillText(fit(ctx, `${p.b}`.toUpperCase(), CW * 0.5), R, y + 22);
    ctx.textAlign = 'left';
  }
  y += 54;
  ctx.fillStyle = C.text;
  ctx.font = F(64, 900);
  ctx.fillText('Power Rankings', L, y + 50);
  y += 78;
  ctx.fillStyle = C.muted;
  ctx.font = F(24, 500);
  ctx.fillText(p.d ? niceDate(p.d) : '', L, y + 20);
  y += 44;
  ctx.fillStyle = C.accent;
  ctx.fillRect(L, y, CW, 4);
  y += 24;

  // ---- rows
  rows.forEach((row, i) => {
    const [name, rec, ppg, , , mv] = row;
    const top = i === 0;
    const rh = heights[i];

    ctx.fillStyle = C.card;
    rr(ctx, L, y, CW, rh, 16); ctx.fill();
    ctx.strokeStyle = top ? C.accent : C.line;
    ctx.lineWidth = top ? 3 : 1.5;
    rr(ctx, L, y, CW, rh, 16); ctx.stroke();

    // rank
    ctx.fillStyle = i < 3 ? C.accent : C.text;
    ctx.font = F(top ? 48 : 40, 900);
    ctx.textAlign = 'center';
    // A two-digit rank at full size ran into the crest — "10", "11" and "12"
    // were touching it in the first pass. Narrow the numeral instead of moving
    // the whole column, so the ranks still form a straight edge.
    if (i + 1 >= 10) ctx.font = F(top ? 42 : 34, 900);
    const numY = y + rh / 2 + (mv != null ? 2 : 14);
    ctx.fillText(String(i + 1), L + 44, numY);
    // Movement rides under its OWN number, not the bottom of the row — on a
    // two-line row anchoring it to the row bottom pulled it away from the
    // number it belongs to. A held team prints "—" in muted, as the owner's
    // own published table does.
    if (mv != null) {
      ctx.fillStyle = mv === 0 ? C.muted : mv > 0 ? C.pos : C.neg;
      ctx.font = F(18, 800);
      ctx.fillText(moveStr(mv), L + 44, numY + 26);
    }
    ctx.textAlign = 'left';

    // Crest between the rank and the name — the league's own logo where one
    // exists, the generated helmet everywhere else.
    const hs = 74;
    drawCrest(ctx, name, L + 80, y + (rh - hs) / 2, hs, loaded);

    const tx = L + 166;
    const statW = 210;
    // team + manager
    ctx.fillStyle = C.text;
    ctx.font = F(30, 800);
    const mgr = mgrLabel(name);
    const nameW = ctx.measureText(fit(ctx, name, CW - 166 - statW - 20)).width;
    ctx.fillText(fit(ctx, name, CW - 166 - statW - 20), tx, y + 38);
    if (mgr) {
      ctx.fillStyle = C.muted;
      ctx.font = F(20, 700);
      ctx.fillText(mgr, tx + nameW + 12, y + 37);
    }
    // record · ppg, right-aligned so the numbers form a column
    const bits = [rec, ppg != null ? `${ppg} ppg` : ''].filter(Boolean).join('  ·  ');
    ctx.fillStyle = C.muted;
    ctx.font = F(22, 700);
    ctx.textAlign = 'right';
    ctx.fillText(bits, R - 22, y + 36);
    ctx.textAlign = 'left';
    // the take — the editorial voice is the point of the page, so it wraps
    ctx.fillStyle = C.text;
    ctx.font = F(22, 400);
    lines[i].forEach((ln, k) => ctx.fillText(ln, tx, y + 74 + k * 28));
    y += rh + OP.gap;
  });

  // ---- footer
  y += 14;
  ctx.strokeStyle = C.line; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(R, y); ctx.stroke();
  y += 34;
  ctx.fillStyle = C.muted;
  ctx.font = F(20, 500);
  const note = p.r ? 'Ranked on all-play record, scoring and recent form — then argued with by hand.'
                   : 'Preseason — no games played yet.';
  const mark = 'Sports-Hub';
  ctx.fillText(note, L, y);
  // These two ran into each other in the first render. Measure, and drop the
  // mark onto its own line rather than letting it overprint the sentence.
  const fits = ctx.measureText(note).width + ctx.measureText(mark).width + 40 <= CW;
  ctx.textAlign = 'right';
  ctx.fillText(mark, R, fits ? y : y + 28);
  ctx.textAlign = 'left';
  return cv;
}

const canvasBlob = (cv) => new Promise((res) => cv.toBlob(res, 'image/png'));

/* Save it the way each platform actually allows. iOS gives no reliable
   <a download> for a blob, but it does take a File through the share sheet —
   which is also the shortest path to "post it in the league chat". Desktop
   gets the download. If both are refused the image is shown inline, which on
   iOS is long-press → Save to Photos, i.e. still a save. */
async function saveOnePager(p) {
  // The crests must be decoded before the synchronous draw. A file that never
  // answers resolves to null and that row falls back to its helmet, so a dead
  // logo can slow the save but can never break it.
  const names = (p.o || []).map((r) => r[0]);
  await preloadCrests(names);
  const loaded = new Map();
  for (const src of new Set(names.map(crestSrc).filter(Boolean))) {
    loaded.set(src, await CREST_IMG.get(src));
  }
  const cv = onePager(p, loaded);
  const blob = await canvasBlob(cv);
  if (!blob) { toast("Couldn't build the image"); return; }
  const fname = `power-rankings-${(p.l || '').toLowerCase().replace(/\s+/g, '-') || 'week'}.png`;
  const file = new File([blob], fname, { type: 'image/png' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: `Power Rankings — ${p.l || ''}` });
      return;
    } catch (e) {
      if (e && (e.name === 'AbortError' || e.name === 'NotAllowedError')) return;
    }
  }
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fname;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    toast('Image saved');
    return;
  } catch (_) {}
  const host = $('#pr-share-out');
  if (host) {
    host.innerHTML = `<p class="pr-note">Long-press the image to save it.</p>`;
    const img = new Image();
    img.src = cv.toDataURL('image/png');
    img.className = 'pr-op-img';
    host.appendChild(img);
  }
}

/* --------------------------------------------------------------- screens -- */
function show(id) {
  ['#pr-load', '#pr-rank', '#pr-shared'].forEach((s) => { const n = $(s); if (n) n.hidden = s !== id; });
}

function paintLoad(msg, retry) {
  show('#pr-load');
  $('#pr-load').innerHTML = `<div class="pr-card pr-load">${msg}</div>`;
  if (retry) {
    const b = el('button', 'pr-btn', '🔄 Try again');
    b.type = 'button';
    b.onclick = () => boot();
    $('#pr-load').querySelector('.pr-load').appendChild(b);
  }
}

/* 🚨 FOUR STATES, AND THEY ARE FOUR DIFFERENT FACTS (v25). "Showing saved
   data because the backend didn't answer" and "showing saved data while I
   check" are opposite situations, and the old single `S.stale` banner said
   the first when it meant the second. Same rule the app's rankings view
   follows: an empty archive and an unreachable one must never share a
   sentence. */
function freshLine() {
  if (S.fresh === 'checking') return `<p class="pr-note pr-chk">↻ Opened from what this device saved — checking the league for anything newer.</p>`;
  if (S.fresh === 'stale') return `<p class="pr-warn">⚠️ Showing the last league data this device saved — the backend didn't answer just now. Records and points may be a week behind.</p>`;
  if (S.fresh === 'newweek') {
    const k = S.pending ? buildModel(S.pending).weeks : 0;
    return `<p class="pr-warn">🆕 <b>${esc(keyLabel(k))}</b> results are in. Building it starts a fresh ranking — the order and takes on screen belong to ${esc(keyLabel(S.key))} and will be replaced.</p>
      <button type="button" class="pr-btn" id="pr-newweek">Build ${esc(keyLabel(k))}</button>`;
  }
  return '';
}

/* ---- the editor ---------------------------------------------------------- */
/* ══ 👥 HAND THE LAB TO SOMEBODY ELSE ══════════════════════════════════════
   The owner can lend the tool for a week or a season — someone else builds the
   week, writes the takes and sends it to the league.

   🚨 `is()`, NEVER `mayLab()`. A guest holding a pass must not be able to mint
   further passes: that is the difference between lending a key and lending the
   ability to cut keys, and it is one boolean away from being wrong. The card
   is not rendered at all on a guest's device — not hidden, absent — for the
   same reason `index.html` does not carry the Lab link (v21): markup behind an
   attribute is still in view-source.
   ⚠️ What it hands over is a DOOR KEY, not a proof. See the honesty note in
   `owner.js`: anybody who reads that file could craft one, exactly as anybody
   could run a wordlist at the published passphrase hash. The pass expiring on
   its own, and his phrase never leaving his head, are the real wins. */
function inviteRoster() {
  const meTeam = (S.season && S.season.teams || []).find((t) => t.isMe);
  return (S.season && S.season.teams || [])
    .map((t) => ({ code: mgrFor(t.team), team: t.team }))
    .filter((r) => r.code && (!meTeam || r.team !== meTeam.team))
    .sort((a, b) => a.code.localeCompare(b.code));
}

const addDays = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

/* 🚨 STANDING ACCESS IS A DATE, NOT A SPECIAL CASE (v34, the owner: *"Can't
   just grant them access to the lab"*). A pass with no end is stored as a date
   so far out that it never arrives, rather than as a missing `u` or a null —
   which means `owner.js` keeps ONE expiry rule with no branch for "forever",
   and a pass that never ends cannot become a pass that never expires *because
   of a bug*. The only thing that changes is how it is WRITTEN on screen. */
const NO_END = '9999-12-31';
const openEnded = (u) => String(u || '') >= NO_END;
/* ⚠️ And it must never be PRINTED. `niceDate('9999-12-31')` renders "Fri, 31
   Dec 9999", which reads as a glitch rather than as "no end date" — the same
   class of thing as a raw `2026-09-07` reading like a database field. */
const untilTxt = (u) => (openEnded(u) ? 'no end date' : niceDate(u));

function inviteHTML() {
  if (!(window.LeagueOwner && window.LeagueOwner.is())) return '';
  const who = inviteRoster();
  if (!who.length) return '';
  return `<div class="pr-card pr-invite">
    <details>
      <summary>👥 Let someone else build a week</summary>
      <div class="pr-inv-b">
        <p class="pr-note">They get the whole tool — the model's order, the pre-written takes, and 📤 📋 🖼️ to send it to the league. 🚀 Publish hands them the file to pass back to you, because only you can put a week in the app.</p>
        <label class="pr-inv-f"><span>Who</span>
          <select id="pr-inv-who">${who.map((r) => `<option value="${esc(r.code)}">${esc(r.code)} — ${esc(r.team)}</option>`).join('')}</select>
        </label>
        <label class="pr-inv-f"><span>Until</span>
          <select id="pr-inv-len">
            <option value="7">This week (7 days)</option>
            <option value="30">A month</option>
            <option value="120">The rest of the season</option>
            <option value="-1">Until I turn it off — no end date</option>
            <option value="0">A date I pick…</option>
          </select>
        </label>
        <label class="pr-inv-f" id="pr-inv-dw" hidden><span>Date</span>
          <input id="pr-inv-date" type="date" min="${esc(addDays(1))}" value="${esc(addDays(7))}" />
        </label>
        <button type="button" class="pr-btn primary" id="pr-inv-go">Create the invite</button>
        <div id="pr-inv-out"></div>
        <p class="pr-note">⚠️ Be straight with yourself about what this is: it is a key you are handing out, not a password only they know, and your passphrase is never in it. A dated pass stops on its own — on <i>their</i> clock, so treat the date as a courtesy rather than a lock. <b>A no-end-date pass lasts until they sign out or you cancel</b>, and cancelling is all-or-nothing: it takes a one-line change in the repo and it ends <i>every</i> invite at once. Pick a date if you want it to clean up after itself.</p>
      </div>
    </details>
  </div>`;
}

function wireInvite() {
  const go = $('#pr-inv-go');
  if (!go) return;
  const len = $('#pr-inv-len'), dw = $('#pr-inv-dw');
  /* ⚠️ Hidden by PROPERTY and by a `[hidden]` rule in power.css at the same
     specificity, written in the same edit as this markup — the trap that has
     bitten this app three times and is invisible to every assertion. */
  len.onchange = () => { dw.hidden = len.value !== '0'; };
  go.onclick = async () => {
    const code = $('#pr-inv-who').value;
    const days = Number(len.value);
    const until = days < 0 ? NO_END
      : days ? addDays(days)
      : ($('#pr-inv-date').value || addDays(7));
    if (until < addDays(0)) { toast('Pick a date in the future'); return; }
    const url = location.href.split('#')[0] + '#invite=' + window.LeagueOwner.invite(code, until);
    const out = $('#pr-inv-out');
    out.innerHTML = `<div class="pr-share-out">
      <div class="t">Send this to <b>${esc(code)}</b> — it opens the Lab on their phone ${openEnded(until)
        ? 'and <b>stays open</b> until you cancel it'
        : `until <b>${esc(niceDate(until))}</b>`}:</div>
      <textarea readonly rows="3"></textarea>
    </div>`;
    const ta = out.querySelector('textarea');
    ta.value = url; ta.focus(); ta.select();
    /* The share sheet is the actual job — it lands in the message thread with
       the person it is for. Clipboard, then a selected field, same ladder the
       app's own "send it to someone" uses and for the same reason: a copy
       button that fails silently leaves him holding nothing. */
    if (navigator.share) {
      try { await navigator.share({ title: 'Power Rankings Lab', text: `You're on the rankings this week — ${url}` }); return; } catch (_) {}
    }
    if (await copyText(url)) toast(`Copied — send it to ${code}`);
    else toast('Select the link and copy it');
  };
}

function paintRank() {
  show('#pr-rank');
  const host = $('#pr-rank');
  const prev = prevOrder();
  const n = S.order.length;

  const modelTop = S.ready
    ? Object.keys(S.model).sort((a, b) => S.model[a] - S.model[b]).slice(0, 3).map((id) => esc(teamById(id).team)).join(' · ')
    : '';

  const head = `
    <div class="pr-card pr-head">
      <div class="pr-week">${esc(keyLabel(S.key))}</div>
      <h2>Power Rankings</h2>
      <p class="pr-sub">${S.ready
        ? `Pre-built from ${S.key} week${S.key === 1 ? '' : 's'} of results — then it's yours. Reorder anyone, write the take, send it to the league.`
        : `No games have been played yet, so the model has nothing to rank on and has not invented an order. Drag the league into whatever order you like and write the takes — this is the preseason edition.`}</p>
      ${freshLine()}
      ${prev ? `<p class="pr-note">▲▼ is movement since <b>${esc(prev.label || 'last week')}</b>, the last set you shared. A team that held its spot reads <b>—</b>.</p>`
             : `<p class="pr-note">No movement arrows yet — they appear once you've shared a set and a new week lands.</p>`}
      <label class="pr-by">
        <span>Published by</span>
        <input id="pr-byline" type="text" maxlength="40" placeholder="Your name or team" />
      </label>
      <p class="pr-note">The league sees this on the rankings you send, so they know whose take it is.</p>
    </div>`;

  const rows = S.order.map((id, i) => {
    const t = teamById(id);
    const row = (S.rows || {})[id];
    const mgr = mgrLabel(t.team);
    const mv = moveFor(prev, id, i);
    const modelRank = S.model[id];
    const moved = modelRank && modelRank !== i + 1;
    const stats = [];
    const form = S.ready ? formOf(t) : null;
    if (S.ready) {
      stats.push(recordOf(t));
      if (row) {
        stats.push(`${one1(row.ppg)} ppg`);
        stats.push(`all-play ${row.apW}-${row.apL}`);
      }
      if (Number(t.pointsFor)) stats.push(`${one1(t.pointsFor)} PF`);
    }
    /* Season above, recent form below — the two questions a power ranking is
       actually settling ("how good have they been" vs "how good are they
       now"), on separate lines so neither reads as a qualifier on the other. */
    const form2 = [];
    if (form) {
      form2.push(`Last week ${form.res ? form.res + ' ' : ''}${one1(form.last)}`);
      if (form.n3 > 1) form2.push(`last ${form.n3} avg ${one1(form.l3)}`);
      form2.push(`high ${one1(form.hi)}`);
      form2.push(`low ${one1(form.lo)}`);
    }
    const opts = Array.from({ length: n }, (_, k) =>
      `<option value="${k}"${k === i ? ' selected' : ''}>${k + 1}</option>`).join('');
    const c = S.comments[id] || '';
    return `
      <li class="pr-row${t.isMe ? ' me' : ''}" data-id="${esc(id)}">
        <div class="pr-rank">
          <label class="pr-num">
            <span class="pr-n">${i + 1}</span>
            <select class="pr-jump" aria-label="Move ${esc(t.team)} to position">${opts}</select>
          </label>
          ${hasMove(mv) ? `<span class="pr-mv ${moveCls(mv)}">${moveStr(mv)}</span><span class="pr-lw">${lastWk(mv, i)}</span>` : ''}
        </div>
        <div class="pr-body">
          <div class="pr-team"><img class="pr-helm-sm" src="${crestURL(t.team, 30)}" alt="" width="30" height="30" /><span class="pr-tn">${esc(t.team)}</span>${mgr ? ` <span class="pr-mgr">${esc(mgr)}</span>` : ''}${t.isMe ? ' <span class="pr-you">you</span>' : ''}</div>
          ${stats.length ? `<div class="pr-stats">${esc(stats.join(' · '))}</div>` : ''}
          ${form2.length ? `<div class="pr-stats pr-form">${esc(form2.join(' · '))}</div>` : ''}
          ${moved ? `<div class="pr-moved">Model had them <b>${modelRank}${ord(modelRank)}</b> — you moved them ${modelRank > i + 1 ? 'up' : 'down'}.</div>` : ''}
          <textarea class="pr-take" rows="3" maxlength="${MAX_COMMENT}" placeholder="Your take on ${esc(t.team)}…"></textarea>
          <div class="pr-count">${S.ready ? `<button type="button" class="pr-re" data-re aria-label="Rewrite the take for ${esc(t.team)}">🎲 rewrite</button>` : ''}<span class="pr-cn"><b class="pr-cnum">${c.length}</b>/${MAX_COMMENT}</span></div>
        </div>
        <div class="pr-arrows">
          <button type="button" class="pr-ar" data-up aria-label="Move ${esc(t.team)} up"${i === 0 ? ' disabled' : ''}>▲</button>
          <button type="button" class="pr-ar" data-down aria-label="Move ${esc(t.team)} down"${i === n - 1 ? ' disabled' : ''}>▼</button>
        </div>
      </li>`;
  }).join('');

  const foot = `
    <div class="pr-card pr-actions">
      <button type="button" class="pr-btn primary" id="pr-publish">🚀 Publish to the app</button>
      <button type="button" class="pr-btn" id="pr-share">📤 Share as a link</button>
      <button type="button" class="pr-btn" id="pr-copy">📋 Copy as text</button>
      <button type="button" class="pr-btn" id="pr-image">🖼️ Save the one-pager</button>
      <p class="pr-note"><b>Publishing</b> is the one that puts this week on everyone's app — it hands you the file to commit. The other three are messages: the <b>link</b> is the thing you send, the <b>text</b> is what pastes into the group chat, and the <b>one-pager</b> is a single image — save it to Photos and post it.</p>
      <p class="pr-note">Sharing also locks this week in, so next week's ▲▼ movement is measured against what the league actually saw.</p>
      <div id="pr-share-out"></div>
      <!-- ⚠️ BELOW the output, not above it. Publishing produces two lines he
           has to act on immediately; an offer to undo, wedged between the
           button he just pressed and the JSON it made, pushes the thing he
           needs off the screen to make room for the thing he probably does
           not. State and its undo read last. -->
      <div id="pr-pubstate"></div>
      <button type="button" class="pr-btn ghost" id="pr-rewrite">✍️ Rewrite all the takes</button>
      <label class="pr-spice"><input type="checkbox" id="pr-spicy" /> <span>Let the takes get profane (a few a week)</span></label>
      <button type="button" class="pr-btn ghost" id="pr-rebuild">🔄 Rebuild from the model</button>
      <p class="pr-note">Rebuilding throws away your order and takes for ${esc(keyLabel(S.key))} and starts again from the model.</p>
    </div>
    <div class="pr-card pr-how">
      <details>
        <summary>How the model ranks — and what it can't know</summary>
        <div class="pr-how-b">
          ${S.ready ? `
          <p>Each team gets one score, and these are the four things in it:</p>
          <ul>
            <li><b>All-play record — 40%.</b> Every week, each team is scored against <i>every other team</i>, not just the one it was scheduled against. It's the luck detector: a 1-3 team that outscored nine opponents has a good roster and a bad schedule.</li>
            <li><b>Points per game — 25%.</b> Season scoring against the league average.</li>
            <li><b>Last ${Math.min(RECENT_N, S.key)} week${Math.min(RECENT_N, S.key) === 1 ? '' : 's'} — 25%.</b> Who's hot now. With only ${S.key} week${S.key === 1 ? '' : 's'} played this overlaps heavily with points per game${S.key < RECENT_N ? ' — early on it is nearly the same number twice, so treat the whole thing as thin' : ''}.</li>
            <li><b>Actual record — 10%.</b> Deliberately the lightest input: it's the most luck-contaminated number here. Not zero, because a league argues about records.</li>
          </ul>
          <p class="pr-warn">⚠️ <b>These weights are a judgment call, not a measurement.</b> A power ranking has no result to be graded against, so nothing here is fitted or validated the way the app's betting model is. It's a defensible starting point for an argument — which is why you can move anyone.</p>
          <p>What it can't see: injuries, a bye week that flattered someone, a trade, who's starting a backup QB. That's what the takes are for.</p>
          <p><b>The takes are pre-written drafts, not finished lines.</b> They come from templates with your numbers dropped in — there is no AI here — so they get the facts right and the joke only sometimes. Edit them. 🎲 rewrites one, ✍️ rewrites the lot.</p>`
          : `<p>Nothing has been played, so there is nothing to rank on. The model deliberately does not guess an order from draft grades or team names — it hands you the league and lets you make the call.</p>
             <p>From the first week of results onward it pre-builds a ranking each week from all-play record, points per game, recent form and actual record.</p>`}
        </div>
      </details>
    </div>`;

  host.innerHTML = head + `<ol class="pr-list">${rows}</ol>` + foot + inviteHTML();

  // Textareas get their value assigned, never interpolated into markup.
  $$('.pr-row', host).forEach((li) => {
    const id = li.dataset.id;
    const ta = li.querySelector('.pr-take');
    ta.value = S.comments[id] || '';
    // Grow to fit. A pre-written take is ~15 words and the body column on a
    // phone is narrow, so a fixed box clipped most drafts — and you cannot
    // edit what you cannot see.
    const grow = () => { ta.style.height = 'auto'; ta.style.height = (ta.scrollHeight + 2) + 'px'; };
    grow();
    ta.addEventListener('input', () => {
      S.comments[id] = ta.value;
      li.querySelector('.pr-cnum').textContent = String(ta.value.length);
      grow();
      persist();
    });
    li.querySelector('[data-up]').onclick = () => move(id, S.order.indexOf(id) - 1);
    li.querySelector('[data-down]').onclick = () => move(id, S.order.indexOf(id) + 1);
    li.querySelector('.pr-jump').onchange = (e) => move(id, Number(e.target.value));
    const re = li.querySelector('[data-re]');
    if (re) re.onclick = () => { rewriteOne(id); paintRank(); };
  });

  const by = $('#pr-byline');
  by.value = S.byline || '';   // assigned, never interpolated into markup
  by.addEventListener('input', () => { S.byline = by.value; persist(); });

  const nw = $('#pr-newweek');
  if (nw) nw.onclick = () => {
    if (!S.pending) return;
    S.season = S.pending; S.pending = null;
    S.stale = false; S.fresh = 'live';
    /* Straight through `restoreOrBuild`, which is the one place that knows
       the draft rules — a new key means it builds fresh, and a draft for the
       new key (he started it on another tab) is restored rather than lost. */
    restoreOrBuild();
    paintRank();
    window.scrollTo({ top: 0 });
  };

  paintPubState();
  wireInvite();

  const pubBtn = $('#pr-publish');
  if (pubBtn) pubBtn.onclick = async () => {
    /* Filename FIRST, then publish — the mark records which file went out, so
       unpublishing can name it and a republish can spot a stale one. */
    const json = publishJSON(), file = publishFilename();
    const stale = (pubRec() || {}).file;
    publish(file);
    paintPubState();
    const out = $('#pr-share-out');
    /* 🚨 The filename is half the instruction. A session handed only a blob of
       JSON has to guess where it goes and what to call it, and a guess here
       silently produces a week nobody can see. */
    if (out) out.innerHTML = `<div class="pr-share-out">
      <div class="t">① Save as <b>rankings/${esc(file)}</b> — copied to your clipboard:</div>
      <textarea readonly rows="10"></textarea>
      <div class="t">② Add this to the top of the <b>weeks</b> list in <b>rankings/index.json</b>:</div>
      <textarea class="pr-idx" readonly rows="2">${esc(publishIndexEntry())}</textarea>
      ${stale && stale !== file ? `<div class="t">③ You are republishing ${esc(keyLabel(S.key))}, and it went out under a different name last time — delete the old <b>rankings/${esc(stale)}</b>, and REPLACE the "k": ${S.key} line rather than adding a second.</div>` : ''}
      <p class="pr-note">Or just paste the block above to a Claude session and say nothing else — it knows both steps.</p>
    </div>`;
    const ta = out && out.querySelector('textarea');
    if (ta) { ta.value = json; ta.focus(); ta.select(); }
    if (await copyText(json)) toast(`Copied — save as rankings/${file}`);
    else toast('Select the text below and copy it');
  };

  $('#pr-share').onclick = () => doShare('link');
  $('#pr-copy').onclick = () => doShare('text');
  $('#pr-image').onclick = () => { publish(); paintPubState(); saveOnePager(payload()); };
  const rw = $('#pr-rewrite');
  if (rw) rw.onclick = () => {
    if (!confirm('Rewrite all 12 takes? Anything you have written for this week will be replaced.')) return;
    rewriteAll(); paintRank(); toast('Fresh drafts written');
  };
  const sp = $('#pr-spicy');
  if (sp) { sp.checked = spiceOn(); sp.onchange = () => { setSpice(sp.checked); }; }
  $('#pr-rebuild').onclick = () => {
    if (!confirm(`Rebuild ${keyLabel(S.key)} from the model? Your order and takes for this week will be lost.`)) return;
    const built = buildModel(S.season);
    S.order = built.order.slice();
    S.comments = {};
    persist();
    paintRank();
    toast('Rebuilt from the model');
  };

  if (modelTop) {
    const p = el('p', 'pr-note', `Model's own top 3 this week: ${''}`);
    p.innerHTML = `Model's own top 3 this week: <b>${modelTop}</b>`;
    $('.pr-head', host).appendChild(p);
  }
}

const ord = (n) => (n % 100 >= 11 && n % 100 <= 13) ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th');

/* ---- the read-only view a league-mate opens ------------------------------ */
function paintShared(p) {
  show('#pr-shared');
  const rows = (p.o || []).map((row, i) => {
    const [name, rec, ppg, note, modelRank, mv] = row;
    const mgr = mgrLabel(name);
    const stats = [];
    if (rec) stats.push(rec);
    if (ppg != null) stats.push(`${ppg} ppg`);
    const moved = modelRank && modelRank !== i + 1;
    return `
      <li class="pr-row ro${i < 3 ? ' podium p' + (i + 1) : ''}">
        <div class="pr-rank">
          <span class="pr-n big">${i + 1}</span>
          ${hasMove(mv) ? `<span class="pr-mv ${moveCls(mv)}">${moveStr(mv)}</span><span class="pr-lw">${lastWk(mv, i)}</span>` : ''}
        </div>
        <div class="pr-body">
          <div class="pr-team"><img class="pr-helm-sm" src="${crestURL(name, 34)}" alt="" width="34" height="34" /><span class="pr-tn">${esc(name)}</span>${mgr ? ` <span class="pr-mgr">${esc(mgr)}</span>` : ''}</div>
          ${stats.length ? `<div class="pr-stats">${esc(stats.join(' · '))}</div>` : ''}
          ${note ? `<div class="pr-take-ro">${esc(note)}</div>` : ''}
          ${moved ? `<div class="pr-moved">Numbers had them ${modelRank}${ord(modelRank)}.</div>` : ''}
        </div>
      </li>`;
  }).join('');

  $('#pr-shared').innerHTML = `
    <div class="pr-card pr-shared-banner">📬 <b>${esc(p.b || 'Someone')}</b> shared their power rankings with you</div>
    <div class="pr-card pr-head">
      <div class="pr-week">${esc(p.l || '')}${p.d ? ` · ${esc(niceDate(p.d))}` : ''}</div>
      <h2>Power Rankings</h2>
      <p class="pr-sub">${p.b ? `${esc(p.b)}'s` : "One person's"} rankings for the league. ${p.r ? 'Built from all-play record, scoring and form, then argued with by hand.' : 'Preseason — pure opinion, no games played yet.'}</p>
    </div>
    <ol class="pr-list">${rows}</ol>
    <div class="pr-card pr-actions">
      <button type="button" class="pr-btn" id="pr-ro-image">🖼️ Save as a one-page image</button>
      <button type="button" class="pr-btn" id="pr-ro-copy">📋 Copy these rankings</button>
      <div id="pr-share-out"></div>
      <p class="pr-note">This is the league's own archive. <a href="index.html">Open the app</a> for thirteen seasons of history.</p>
    </div>`;

  $('#pr-ro-image').onclick = () => saveOnePager(p);
  $('#pr-ro-copy').onclick = async () => {
    const L = [`🏆 POWER RANKINGS — ${p.l || ''}`, p.b ? `${p.b}'s rankings` : '', ''].filter((x, i) => i !== 1 || x);
    (p.o || []).forEach((row, i) => {
      const [name, rec, ppg, note, , mv] = row;
      const bits = [rec]; if (ppg != null) bits.push(`${ppg} ppg`);
      L.push(`${i + 1}. ${hasMove(mv) ? moveStr(mv) + ' ' : ''}${name} — ${bits.filter(Boolean).join(' · ')}`);
      if (note) L.push(`   ${note}`);
    });
    const txt = L.join('\n');
    if (await copyText(txt)) toast('Copied'); else shareFallback('Rankings', txt);
  };
}

/* ------------------------------------------------------------------ gate -- */
/* 🔒 THE LAB IS ONE PERSON'S TOOL AND THE ARCHIVE IS TWELVE PEOPLE'S.
   This page talks to the owner's own backend and holds a half-written week in
   a draft; the league gets the ranking when he publishes it, not while he is
   still arguing with the model about it.

   ⚠️ WHAT IS *NOT* GATED: a shared link. `boot` reads `#r=` before it gets
   here, deliberately — that payload is self-contained, read-only, and is the
   thing he pastes into the group chat. Locking the page he sends people to
   would have locked the league out of the rankings themselves. */
/* ⚠️ THREE WAYS AN INVITE FAILS AND THEY ARE NOT THE SAME SENTENCE — the rule
   this app follows everywhere else (an empty archive, an unreachable one and a
   missing one), applied to the one screen a guest can get stuck on. "That link
   ran out" sends them back to the commissioner; "that link is damaged" sends
   them back to the message it arrived in; and a revoked pass is neither, so it
   says what actually happened rather than inventing a reason. */
const INVITE_BAD = {
  expired: 'That invite has run out. Ask the commissioner for a new one — they can send another in a few taps.',
  bad: "That invite link didn't come through in one piece — messaging apps sometimes cut a long link in half. Ask for it again, and open it straight from the message.",
  revoked: 'That invite is no longer valid — all outstanding invites were cancelled. Ask the commissioner for a fresh one.',
};

function paintGate(msg, note) {
  show('#pr-load');
  $('#pr-load').innerHTML = `<div class="pr-card pr-load pr-gate">
    <b>🔒 Commissioner's tool</b>
    ${note ? `<p class="pr-gate-note">${esc(note)}</p>` : ''}
    <p>This is where the week gets built. The finished set goes to the league in the app — and thirteen seasons of history are in there too, open to everyone.</p>
    <form id="pr-gate-f" autocomplete="off">
      <input id="pr-gate-i" type="password" inputmode="text" autocapitalize="none" autocorrect="off"
             spellcheck="false" placeholder="Passphrase" aria-label="Passphrase" />
      <button type="submit" class="pr-btn">Unlock</button>
    </form>
    ${msg ? `<p class="pr-gate-no">${esc(msg)}</p>` : ''}
    <!-- ⚠️ Its own row, not a link inside the sentence above. An inline <a> in
         a paragraph has no height of its own and measured 15px here — the v1
         footer fault, on the one screen a member of the league ever reaches. -->
    <a class="pr-gate-out" href="index.html">📜 Open the league app</a>
  </div>`;
  const f = $('#pr-gate-f'), i = $('#pr-gate-i');
  f.onsubmit = async (e) => {
    e.preventDefault();
    /* owner.js missing means it failed to load, not that the phrase is wrong.
       The page fails CLOSED either way, which is the right direction — but a
       button that throws silently is a dead end for the one person who is
       ever supposed to get past this. */
    if (!window.LeagueOwner) { paintGate('owner.js didn\'t load — reload the page.'); return; }
    const r = await window.LeagueOwner.unlock(i.value);
    /* Three outcomes, three messages. "Wrong passphrase" when the truth is
       "this browser cannot check one" sends him hunting for a typo that is
       not there — the same class of lie as "nothing published yet" over an
       offline archive. */
    if (r === 'ok') { boot(); return; }
    paintGate(r === 'insecure'
      ? 'This browser can\'t check a passphrase here — open the page over https rather than from a file.'
      : 'That is not it. Mind the spelling; capitals and spacing do not matter.');
  };
  i.focus();
}

/* A way back out, because "unlock once per device" is only safe if a device
   can be un-unlocked. Injected rather than sitting in `power.html`, for the
   same reason the app's Lab link is: markup that is only ever right for one
   person should not ship to the other eleven. */
function addLock() {
  const top = document.querySelector('.pr-top');
  if (!top || $('#pr-lock')) return;
  const g = window.LeagueOwner.guest && window.LeagueOwner.guest();
  const b = el('button', 'pr-lock', g ? '🔒 Sign out' : '🔒 Lock');
  b.type = 'button';
  b.id = 'pr-lock';
  /* ⚠️ A guest's way out is not the owner's. His restores the passphrase
     prompt; theirs ends a pass they cannot re-enter — so the label and the
     warning have to say which, or one of them taps expecting the other. */
  b.title = g ? 'End your access on this device — you would need a new invite' : 'Lock this device — you will need the passphrase again';
  b.onclick = () => {
    if (g && !confirm('Sign out of the Lab?\n\nYou would need a new invite from the commissioner to get back in.')) return;
    if (g) window.LeagueOwner.endGuest(); else window.LeagueOwner.lock();
    location.reload();
  };
  top.appendChild(b);
}

/* 👥 Who this device is building as, and until when. A guest who does not know
   their pass is time-boxed reads its expiry as the app breaking. */
function guestBanner() {
  const g = window.LeagueOwner.guest && window.LeagueOwner.guest();
  const main = document.querySelector('.pr-main');
  if (!g || !main || $('#pr-guest')) return;
  const d = el('div', 'pr-card pr-guestbar');
  d.id = 'pr-guest';
  d.innerHTML = `<b>👥 You're building this week's rankings.</b>
    <p>The commissioner handed you the tool${g.until && !openEnded(g.until) ? ` until <b>${esc(niceDate(g.until))}</b>` : ''}. Build the order, write the takes, then send it out — 📤 and 📋 go straight to the league chat, and 🚀 hands you the file for the commissioner to put in the app.</p>`;
  main.insertBefore(d, main.firstChild);
}

/* ------------------------------------------------------------------ boot -- */
function sharedFromHash() {
  const m = /[#&]r=([A-Za-z0-9\-_]+)/.exec(location.hash || '');
  if (!m) return null;
  try {
    const p = JSON.parse(unb64u(m[1]));
    return (p && Array.isArray(p.o) && p.o.length) ? p : null;
  } catch (_) { return null; }
}

async function boot() {
  /* A shared link is read-only and needs NO backend call — the payload carries
     everything. That is what makes it survive a sleeping backend, and what
     stops a recipient seeing a different ranking than the one that was sent. */
  const sh = sharedFromHash();
  if (sh) { S.shared = sh; paintShared(sh); return; }
  /* 👥 AN INVITE IS REDEEMED BEFORE THE GATE, for the same structural reason
     a shared link is read before it: it is the thing that gets somebody past
     the gate, so a gate in front of it would be a key locked inside the door
     it opens. That is the v23 fault (a door that only opened from the inside)
     and it is worth naming here, because the shape is identical.
     🚨 AND IT MUST READ THE HASH BEFORE ANYTHING CLEARS IT. The first cut sat
     four lines below the "don't strand the reader on a blank page" branch,
     which calls `replaceState` and empties `location.hash` — so by the time
     this ran there was nothing left to redeem and every invite landed on the
     passphrase gate with no message, looking exactly like a link that had
     never worked. **A value consumed at init cannot answer a question asked
     later**: the v1 lesson wearing yet another costume, and only rendering
     the guest's own case caught it.
     ⚠️ The hash is stripped either way — an invite left in the address bar is
     one bookmark away from being re-redeemed after it was ended on purpose,
     and it is the kind of link that gets forwarded on. */
  const inv = /[#&]invite=([A-Za-z0-9\-_]+)/.exec(location.hash || '');
  if (inv) {
    const r = window.LeagueOwner ? window.LeagueOwner.accept(inv[1]) : 'bad';
    history.replaceState(null, '', location.pathname + location.search);
    if (r !== 'ok') { paintGate('', INVITE_BAD[r] || INVITE_BAD.bad); return; }
  }

  if (location.hash) {
    // A hash that isn't a valid payload: don't strand the reader on a blank page.
    history.replaceState(null, '', location.pathname + location.search);
  }

  /* Everything past here is the authoring tool, so the gate goes here rather
     than at the top of the file: the shared view above must stay open, and
     nothing below should run — no backend call, no draft restored — until the
     device has answered.
     ⚠️ `mayLab()`, not `is()` — an invited manager gets the tool. It is still
     `is()` that decides whose VOICE the app speaks in and who may hand out
     further invites; those are different questions and stay different. */
  if (!window.LeagueOwner || !window.LeagueOwner.mayLab()) { paintGate(''); return; }
  addLock();
  guestBanner();

  /* 🚨 CACHE FIRST, THEN REVALIDATE (v25). The device has held the last good
     payload since v1 (`powerlab:season`) — but only as a FALLBACK for a failed
     fetch, so every visit still sat through a 30-60s cold start with the
     answer already on the phone. Owner: *"Don't make me wait every time."*
     The data is a week of finished results; it does not go stale in the
     seconds it takes to check. So: paint from the cache immediately, ask the
     backend in the background, and reconcile when it answers. */
  const c = cachedSeason();
  if (c) {
    S.season = c.data;
    S.stale = false;
    S.fresh = 'checking';
    restoreOrBuild();
    paintRank();
    revalidate();
    return;
  }

  paintLoad(`<b>Loading your league…</b><p>The free-tier backend takes ~30s to wake up if it has been idle. This only happens once on this device — after that it opens straight from what it saved.</p>`);
  const res = await loadSeason();
  if (!res) {
    paintLoad(`<b>Can't reach the league right now.</b>
      <p>The rankings are built from your ESPN league, so this page needs the backend — and this device has no saved copy to fall back on yet.</p>
      <p class="pr-note">If the app's Fantasy tab is loading fine, try again in a moment; the free host sleeps after ~15 minutes idle.</p>`, true);
    return;
  }
  S.season = res.data;
  S.stale = !!res.stale;
  S.fresh = res.stale ? 'stale' : 'live';
  restoreOrBuild();
  paintRank();
}

/* The background half of the above.
   🚨 IT MUST NOT YANK THE PAGE OUT FROM UNDER HIM. Two cases, and they are
   genuinely different:
     · SAME week key — the numbers can only have been corrected, so refresh
       them in place and keep his order and his takes untouched.
     · A NEW week key — that is a different ranking, and silently rebuilding
       would delete an order he may have spent ten minutes on. It offers.
   ⚠️ And a repaint while he is typing would drop his caret mid-take, so a
   focused textarea defers it: the data is already updated, the next natural
   repaint (any reorder) shows it. */
async function revalidate() {
  let d = null;
  try { d = await fetchSeason(); } catch (_) {}
  if (!d) { S.fresh = 'stale'; S.stale = true; repaintUnlessTyping(); return; }

  const built = buildModel(d);
  if (built.weeks !== S.key) {
    S.pending = d;
    S.fresh = 'newweek';
    repaintUnlessTyping();
    return;
  }
  S.season = d;
  S.stale = false;
  S.fresh = 'live';
  S.model = built.model; S.scores = built.scores; S.rows = built.rows; S.ready = built.ready;
  repaintUnlessTyping();
}

function repaintUnlessTyping() {
  const a = document.activeElement;
  if (a && a.classList && a.classList.contains('pr-take')) {
    a.addEventListener('blur', () => paintRank(), { once: true });
    return;
  }
  paintRank();
}

/* Warm the league's own crests immediately — they are tiny, same-origin and
   cacheable, and having them decoded before the one-pager runs turns its
   await into a no-op. */
preloadSrcs(Object.values(CREST_SRC));

window.addEventListener('hashchange', boot);
boot();
