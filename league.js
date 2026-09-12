/* ══════════════════════════════════════════════════════════════════════════
   🏈 NECTARS BOLONGA — the league's own app.

   Sports-Hub is one person's app. This one has TWELVE readers, and that single
   difference is what every decision in this file comes back to:

   🚨 "You" IS A ROLE, NOT A NAME. The reader picks who they are, and from that
   moment the whole archive is written to them — their row highlighted, their
   verbs in second person, their thirteen seasons on the You tab. `history.js`
   does all of that off ONE call (`setMe`); this file only decides who to pass.

   🚨 AND A STRANGER MUST STILL GET A WHOLE APP. The link goes out to a group
   chat; it will be opened by someone's brother, and it will be opened before
   anyone taps a name. Nothing here may render blank, or nag, or gate content
   behind picking. Picking makes the app personal; it is not a login.

   No backend, no build step, no framework — the same constraints Sports-Hub
   runs under, for the same reason: this has to still work in five years with
   nobody maintaining it.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const APP_VERSION = 'v49';
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ── who is reading ────────────────────────────────────────────────────
     One key, on the device. There is no account and there must never be one:
     twelve relatives are not going to sign in to read a fantasy archive. */
  const ME_KEY = 'lh:me';
  const SKIP_KEY = 'lh:skipped';
  const readMe = () => { try { return localStorage.getItem(ME_KEY) || ''; } catch (_) { return ''; } };
  const writeMe = (m) => { try { m ? localStorage.setItem(ME_KEY, m) : localStorage.removeItem(ME_KEY); } catch (_) {} };
  const skipped = () => { try { return localStorage.getItem(SKIP_KEY) === '1'; } catch (_) { return false; } };
  const markSkipped = () => { try { localStorage.setItem(SKIP_KEY, '1'); } catch (_) {} };

  /* ── 🔒 whose phone is this ────────────────────────────────────────────
     `owner.js` holds the whole gate; this file only asks. Two things change
     on the commissioner's own device and nothing else in the app differs:
     his name is on offer in the picker, and the Lab is linked in the footer.
     ⚠️ They are the SAME condition (v23). Gating the link on the unlock alone
     made the app's only route to the Lab appear after you had already got in
     — and the way in is the Lab. The owner opened the app on his own phone,
     reading as himself, with no way to reach his own tool.

     ⚠️ It is deliberately NOT the same question as `LH.me()`. Identity here
     is an invitation — you tap a name and the archive re-voices itself — and
     wiring a lock to it would turn the friendliest thing in the app into a
     credential. Tapping a name must never be able to open a door. */
  const OWNER = 'McD';
  const isOwner = () => !!(window.LeagueOwner && window.LeagueOwner.is());
  /* 🚨 "IS THIS HIS PHONE" IS ONE QUESTION, ASKED IN TWO PLACES (v23) — the
     picker and the footer link — so it is written once. Two ways to be true,
     both of them only reachable by him:
       · the device is unlocked, or
       · the device is already reading as him, which needs a name the picker
         does not offer to anybody else.
     ⚠️ AND IT IS NOT A LOCK. It decides what is on OFFER; `power.html` still
     asks for the passphrase, every time, on every device. Keeping those two
     separate is the whole v21 design — a door you can see is not a door you
     can open, and tapping a name must never be able to open one. */
  const ownerHere = () => isOwner() || LH.me() === OWNER;

  /* 🚨 A DIFFERENT QUESTION, AND KEEPING IT SEPARATE IS THE POINT (v33).
     `ownerHere()` is "is this HIS phone" and it still governs the picker —
     lending somebody the rankings tool for a week is not lending them his
     voice, and `LeagueOwner.is()` stays false on a guest's device precisely
     so this cannot leak. `labHere()` is the weaker question the FOOTER asks:
     is there any reason to put the Lab on offer here? Wiring the picker to
     this instead would have handed every guest McD's name, which is the one
     thing v21 exists to prevent. */
  const guestPass = () => (window.LeagueOwner && window.LeagueOwner.guest && window.LeagueOwner.guest()) || null;
  const labHere = () => ownerHere() || !!guestPass();

  const LH = window.LeagueHistory;
  /* Opens on the archive, not the rankings — the history is the thing that is
     always there, and a week is only published during the season. */
  const S = { view: 'hist', sub: 'hon', prof: null, weeks: null, week: null, wkErr: null };

  /* ── crests ────────────────────────────────────────────────────────────
     Real logos, keyed by MANAGER — the same rule the archive follows, and for
     the same reason: team names change every year, the twelve people do not.
     A missing or dead file degrades to an initial, never to a broken image. */
  const LOGO = { McD: 'mcd', CC: 'cc', Hurd: 'hurd', Hyman: 'hyman', Christel: 'christel',
    Woods: 'woods', Zach: 'zach', Buley: 'buley', Wolff: 'wolff', Riz: 'riz',
    Slemp: 'slemp', Gotch: 'gotch' };
  function crest(m, size) {
    const nm = LH.name(m) || '?';
    const fb = `<span class="fh-crest fh-crest-x" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.42)}px">${esc(nm.slice(0, 1))}</span>`;
    if (!LOGO[m]) return fb;
    return `<img class="fh-crest" style="width:${size}px;height:${size}px" src="logos/${LOGO[m]}.png" alt=""
      onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'fh-crest fh-crest-x',textContent:${JSON.stringify(nm.slice(0, 1))}}))">`;
  }

  /* ══ 📤 THE LINK ═══════════════════════════════════════════════════════
     The app has ONE address and no routing — no hash, no query — so the link
     to send is simply where you already are, minus whatever a browser may
     have hung off the end of it.

     🚨 DERIVED, NEVER TYPED IN. A hard-coded URL in here would be a second
     source of truth for the address of the file it is written in, and the day
     the repo or the account is renamed is the day it starts handing out a
     dead link with total confidence. Same rule as every other fact in this
     app: work it out, don't store it. */
  const appURL = () => {
    try {
      const u = new URL(location.href);
      u.hash = ''; u.search = '';
      u.pathname = u.pathname.replace(/index\.html?$/i, '');
      return u.href;
    } catch (_) { return location.href; }
  };

  /* Clipboard, with the same three-step ladder the Lab uses. `navigator.share`
     is the one that matters on the owner's phone: it opens the iOS share sheet
     straight into the group chat, which is the actual job. */
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

  /* ⚠️ THE URL IS ON SCREEN AS TEXT WHETHER OR NOT ANY OF THIS WORKS. A copy
     button that fails silently — and on an unknown browser it can — leaves a
     reader holding nothing at all, which is the one outcome this section
     exists to prevent. The button is a convenience over the link, never the
     only way to it. */
  async function shareApp() {
    const url = appURL();
    const note = $('#lg-share-n');
    const say = (m) => { if (note) note.textContent = m; };
    if (navigator.share) {
      try { await navigator.share({ title: 'Nectars Bolonga — League History', url }); say('Link shared.'); return; }
      /* A cancelled share sheet is a decision, not a failure — don't fall
         through and quietly copy something they backed out of sending. */
      catch (e) { if (e && (e.name === 'AbortError' || e.name === 'NotAllowedError')) { say(''); return; } }
    }
    if (await copyText(url)) say('Copied — paste it into the chat.');
    else {
      const i = $('.lg-share-u');
      if (i) { i.focus(); i.select(); }
      say('Press and hold the link above to copy it.');
    }
  }

  /* ══ THE NAME PICKER ═══════════════════════════════════════════════════
     Eleven faces, tapped once. It is also reachable forever from the header,
     because a phone gets handed around and the first tap is often wrong.

     🚨 THE COMMISSIONER IS NOT ONE OF THE ELEVEN. Anyone else in the league
     can be anyone else in the league — that is the point of the thing — but
     nobody gets to put the app into his voice, and no amount of tapping here
     gets near his tools.

     ⚠️ Two escapes, and both are for HIM rather than for a member. An unlocked
     device offers him his own name; so does a device already reading as him,
     which is what stops the lock arriving as "your phone has forgotten who
     you are" on the one phone that was already right. Neither can be reached
     from a member's device: the second needs a name that is not on offer, and
     the first needs the passphrase. */
  function pickList() {
    return LH.roster().filter((r) => r.m !== OWNER || ownerHere());
  }

  function pickerHTML(canDismiss) {
    const me = LH.me();
    return `<div class="lg-pick-in">
      <div class="lg-pick-h">
        <div class="lg-pick-k">Nectars Bolonga</div>
        <h2>${me ? 'Not you?' : 'Who are you?'}</h2>
        <p>Tap your name and the whole app starts talking to <i>you</i> — your seasons, your medals, your Cum Bowls, your row highlighted everywhere it appears.</p>
      </div>
      <div class="lg-grid">${pickList().map((r) => `
        <button type="button" class="lg-who${r.m === me ? ' on' : ''}" data-me="${esc(r.m)}">
          ${crest(r.m, 54)}
          <b>${esc(r.name)}</b>
          <i>${r.seasons} season${r.seasons === 1 ? '' : 's'}${r.t1 ? ` · ${r.t1}🏆` : ''}</i>
        </button>`).join('')}</div>
      <button type="button" class="lg-skip" data-skip="1">${canDismiss ? 'Never mind' : "I'm just looking →"}</button>
      <p class="lg-pick-f">Stored on this phone only. Nothing is sent anywhere, there is no account, and you can change it any time from the header.</p>
    </div>`;
  }

  function showPicker(canDismiss) {
    /* 🚨 The header runs on its own here. paintHead lives inside paint(),
       which does not run while the picker is up — so the "who are you" chip
       rendered as an EMPTY WHITE PILL on the one screen where it matters
       most, which is the first thing anybody ever sees. */
    paintHead();
    const box = $('#lg-pick');
    box.innerHTML = pickerHTML(canDismiss);
    box.hidden = false;
    $('#lg-app').hidden = true;
    window.scrollTo({ top: 0 });
  }

  function choose(m) {
    writeMe(m);
    LH.setMe(m);
    $('#lg-pick').hidden = true;
    $('#lg-app').hidden = false;
    S.prof = null;
    /* 🚨 Landing on YOU after picking, not back where they were. Picking a
       name is a question about yourself, so the answer should be the page
       about you — anything else makes the tap look like it did nothing. */
    if (m) { S.view = 'hist'; S.sub = 'you'; }
    paint();
    window.scrollTo({ top: 0 });
  }

  /* ══ HEADER ════════════════════════════════════════════════════════════ */
  function paintHead() {
    const me = LH.me();
    $('#lg-me').innerHTML = me
      ? `${crest(me, 32)}<span>${esc(LH.name(me))}</span>`
      : '<span>👤 Who are you?</span>';
    $('#lg-me').setAttribute('title', me ? `Reading as ${LH.name(me)} — tap to change` : 'Tap to pick your name');
  }

  /* ══ ❓ HOW THIS APP WORKS ══════════════════════════════════════════════
     One sheet behind the ? in the header, reachable from every page. It holds
     what the app previously said in the wrong place or not at all: what each
     tab is for, how to get around, and what the three provenance badges mean.

     🚨 That badge key was a card at the top of Honors (v13 moved it), which
     meant a ⚑ badge on the Cum Bowl table sat four taps from its own
     explanation. A reference is needed wherever the thing it explains appears,
     so it belongs behind a control that is always on screen — not above the
     champions, where it also cost the best card in the app its slot.

     🚨 THE TAB LIST IS BUILT FROM THE TABS. `L1` and `LH.SUBS` are the app's
     own source of truth for what exists and what it is called; a second list
     typed out here would drift the first time a tab is renamed or reordered —
     the same reason the jump nav reads the rendered DOM instead of a manifest.
     `HELP` adds ONLY the sentence a tab cannot know about itself, and a tab
     with no sentence still lists itself rather than disappearing. */
  const HELP = {
    hist: 'Thirteen seasons, 2013–2025. Five pages:',
    season: 'This year as it stands — the standings, ESPN\'s playoff odds, who you play next, and your season measured against your other thirteen.',
    rank: "The commissioner's weekly power rankings — every team in order, with a take on each. Only during the season, and only once he publishes a set.",
    hon: 'The trophy case, the champions, who is still waiting, and every final four.',
    you: 'Your thirteen seasons — medals, Cum Bowls, your best and worst years.',
    rec: 'Opens with the storylines the archive throws up, then every leaderboard: the record book, the luck index, rivalries, playoff appearances, the champion\'s curse.',
    cb: "The other bracket. The two worst seeds play on the first weekend of the playoffs, and the loser is the league's worst.",
    sea: 'All thirteen final standings, newest first.',
  };

  function helpTabHTML(label, desc, subs) {
    return `<div class="lg-sh-t">
      <b>${esc(label)}</b>${desc ? `<i>${esc(desc)}</i>` : ''}
      ${subs ? `<div class="lg-sh-s">${subs.map(([k, l]) =>
        `<div><b>${esc(l)}</b>${HELP[k] ? `<i>${esc(HELP[k])}</i>` : ''}</div>`).join('')}</div>` : ''}
    </div>`;
  }

  function helpHTML() {
    const me = LH.me();
    return `<button type="button" class="lg-sheet-bg" data-close="1" aria-label="Close"></button>
    <div class="lg-sheet-in" role="dialog" aria-modal="true" aria-labelledby="lg-sheet-t">
      <div class="lg-sheet-h">
        <h2 id="lg-sheet-t">How this app works</h2>
        <button type="button" class="lg-sheet-x" data-close="1" aria-label="Close">✕</button>
      </div>
      <div class="lg-sheet-b">
        <section class="lg-sh">
          <p>Every final standing of the <b>Nectars Bolonga</b> from <b>2013 to 2025</b>, with all 156 team-seasons mapped to a person and cross-checked against ESPN's own owner column.</p>
          <p><b>Nothing here is typed in.</b> Every record, rate and storyline is worked out from the archive when the page loads, so none of it can go stale when a season lands.</p>
        </section>

        <section class="lg-sh">
          <h3>Tap your name</h3>
          <p>The whole archive then talks to <b>you</b> — your row highlighted in every table, your seasons on the You page, the sentences written in second person. It is not a login: there is no account, nothing is sent anywhere, and the name lives on this phone only.</p>
          <button type="button" class="lg-sheet-go" data-pickme="1">${me
            ? `👤 Reading as ${esc(LH.name(me))} — change`
            : '👤 Pick your name'}</button>
        </section>

        <section class="lg-sh">
          <h3>Send it to someone</h3>
          <p>The whole thing lives at one address, and it never changes. Send it once — every week that gets published, and every fix, arrives on their phone by itself.</p>
          <div class="lg-share">
            <input class="lg-share-u" type="text" readonly spellcheck="false" aria-label="Link to this app" value="${esc(appURL())}" />
            <button type="button" class="lg-sheet-go" data-share="1">${navigator.share ? '📤 Share the link' : '📋 Copy the link'}</button>
          </div>
          <p class="lg-share-n" id="lg-share-n" role="status"></p>
        </section>

        <section class="lg-sh">
          <h3>The tabs</h3>
          <div class="lg-sh-l">
            ${L1.map(([k, l]) => helpTabHTML(l, HELP[k], k === 'hist' ? LH.SUBS : null)).join('')}
          </div>
        </section>

        <section class="lg-sh">
          <h3>Getting around</h3>
          <p>The chips under the tabs <b>jump to a card</b> on the page you are on, and flag the one you are in.</p>
          <p><b>Every name is a door.</b> Tap anyone, anywhere, for their whole career — then ‹ Back to the league.</p>
        </section>

        <section class="lg-sh">
          <h3>How to read this</h3>
          <p>The archive holds three different kinds of fact, and every number in it carries a badge saying which it is.</p>
          <div class="lg-sh-key">${LH.key()}</div>
        </section>

        <section class="lg-sh">
          <h3>Small print</h3>
          <p>Two managers are deliberately untracked, so a podium place held by one of them reads <b>not tracked</b> rather than a team name — the standings still show all twelve teams, because a 12-team league that renders 10 rows is lying.</p>
          <p>The app works with no connection at all once it has loaded. You are on <b>${esc(APP_VERSION)}</b>.</p>
        </section>
      </div>
    </div>`;
  }

  function openHelp() {
    const box = $('#lg-sheet');
    /* Built on open, never at load: it quotes counts out of the archive and
       names the reader, and both answer differently after `setMe`. The v1
       fault — a value derived at init cannot answer a question asked later. */
    box.innerHTML = helpHTML();
    box.hidden = false;
    document.body.style.overflow = 'hidden';
    const x = box.querySelector('.lg-sheet-x');
    if (x) x.focus();
  }

  function closeHelp() {
    const box = $('#lg-sheet');
    if (!box || box.hidden) return false;
    box.hidden = true;
    box.innerHTML = '';
    document.body.style.overflow = '';
    const b = $('#lg-help');
    if (b) b.focus();
    return true;
  }

  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeHelp(); });

  /* ══ 🏆 RANKINGS ═══════════════════════════════════════════════════════
     Published by the commissioner, read by everyone. It is a FILE in this
     repo, not a live model run: members have no ESPN cookies and no backend,
     and a ranking is an opinion column that should not silently re-derive
     itself into a different answer a week after it was written. */
  const ord = (n) => (n % 100 >= 11 && n % 100 <= 13) ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th');
  const hasMove = (mv) => mv !== null && mv !== undefined && mv !== '';
  const moveStr = (mv) => (mv > 0 ? `▲${mv}` : mv < 0 ? `▼${-mv}` : '—');
  const moveCls = (mv) => (mv > 0 ? 'up' : mv < 0 ? 'dn' : 'hold');

  async function loadWeeks() {
    if (S.weeks) return S.weeks;
    try {
      const r = await fetch('rankings/index.json', { cache: 'no-store' });
      if (!r.ok) throw new Error('http ' + r.status);
      const j = await r.json();
      S.weeks = Array.isArray(j.weeks) ? j.weeks : [];
    } catch (e) {
      /* ⚠️ THREE OPPOSITE FACTS, THREE SENTENCES (v29). An empty archive, an
         unreachable one and a MISSING one are not the same thing, and the
         page has to say which — "nothing published yet" when the truth is
         "you are offline" is the v220 lie in miniature, and it is the same
         lie when the truth is "the index file 404s".
         🚨 `missing` can only ever be a fault: `rankings/index.json` ships in
         the repo with an empty `weeks` array, so an EMPTY season still
         answers 200. A 404 here means the deploy is broken — and folding that
         into the friendly copy would hide a broken publish behind the exact
         sentence that says everything is fine. */
      S.weeks = [];
      S.wkErr = e && /http/.test(String(e.message)) ? 'missing' : 'offline';
    }
    return S.weeks;
  }

  async function loadWeek(f) {
    const r = await fetch('rankings/' + f, { cache: 'no-store' });
    if (!r.ok) throw new Error('http ' + r.status);
    return r.json();
  }

  function rankRowsHTML(p) {
    const me = LH.me();
    return (p.o || []).map((row, i) => {
      const [name, rec, ppg, note, modelRank, mv, own, code] = row;
      const mine = !!me && code === me;
      const stats = [];
      if (rec) stats.push(rec);
      if (ppg != null) stats.push(`${ppg} ppg`);
      const moved = modelRank && modelRank !== i + 1;
      return `<li class="pr-row ro${i < 3 ? ' podium p' + (i + 1) : ''}${mine ? ' lg-mine' : ''}">
        <div class="pr-rank">
          <span class="pr-n big">${i + 1}</span>
          ${hasMove(mv) ? `<span class="pr-mv ${moveCls(mv)}">${moveStr(mv)}</span><span class="pr-lw">LW ${i + 1 + mv}</span>` : ''}
        </div>
        <div class="pr-body">
          <div class="pr-team">${code ? crest(code, 40) : ''}<span class="pr-tn">${esc(name)}</span>${own ? ` <span class="pr-mgr">${esc(own)}</span>` : ''}${mine ? ' <span class="lg-you">YOU</span>' : ''}</div>
          ${stats.length ? `<div class="pr-stats">${esc(stats.join(' · '))}</div>` : ''}
          ${note ? `<div class="pr-take-ro">${esc(note)}</div>` : ''}
          ${moved ? `<div class="pr-moved">The numbers had them ${modelRank}${ord(modelRank)}.</div>` : ''}
        </div>
      </li>`;
    }).join('');
  }

  /* Pulled out of `rankHTML` (v31) so the "that week didn't load" card can
     render it too. That card's own copy says "or pick another week", and it
     was saying it over a screen with no picker on it — a control named in a
     sentence and absent from the page is the v30 fault written out in prose.
     Reachable now that RETRACTING a week is a supported move: a half-done
     unpublish (file deleted, index line still there) lands exactly here. */
  const wkPick = (weeks) => (weeks.length > 1
    ? `<div class="lg-wk"><label for="lg-wksel">Week</label><select id="lg-wksel">${weeks.map((w) =>
        `<option value="${esc(w.f)}"${w.f === S.week ? ' selected' : ''}>${esc(w.l)}</option>`).join('')}</select></div>`
    : '');

  function rankHTML(p, weeks) {
    const pick = wkPick(weeks);
    return `<div class="pr-card pr-head lg-rank-head">
        <div class="pr-week">${esc(p.l || '')}${p.d ? ` · ${esc(niceDate(p.d))}` : ''}</div>
        <h2>Power Rankings</h2>
        <p class="pr-sub">${p.b ? `${esc(p.b)}'s` : "The commissioner's"} rankings for the league. ${p.r
          ? 'Built from all-play record, scoring and recent form, then argued with by hand.'
          : 'Preseason — pure opinion, no games played yet.'}</p>
      </div>
      ${pick}
      <ol class="pr-list">${rankRowsHTML(p)}</ol>
      <div class="ffp-card"><p class="ffp-cap">⚠️ <b>The order is one person's opinion.</b> The model that pre-builds it weights all-play win%, points per game and the last three weeks — but a power ranking has no graded outcome, so nothing here is validated the way a betting model would be. Rows the commissioner moved say where the numbers had them.</p></div>`;
  }

  function niceDate(d) {
    const t = new Date(d + 'T12:00:00');
    return isNaN(t) ? d : t.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  /* Keyed by `S.wkErr`, so adding a state without writing its sentence is a
     visible hole rather than a silent fall-through to the friendly one. */
  const WK_EMPTY = {
    offline: "<b>Can't reach the rankings right now.</b>You are offline, or the page didn't load properly. The league's history below works with no connection at all, so it is still all there.",
    missing: "<b>The rankings list didn't load.</b>The file that lists the published weeks is not there — which is a fault at our end, not yours. The league's thirteen seasons below are unaffected.",
    none: "<b>No rankings published yet.</b>The commissioner publishes a set each week during the season. When one lands it shows up here — every team, in order, with a take on each.",
  };

  const wkBad = () => `<h2 class="section-title">🏆 Power Rankings</h2>
      <div class="ffp-card"><div class="ffp-empty"><b>That week's data doesn't look right.</b>The file is there but the rankings inside it could not be read, so nothing is shown rather than a half of one. The league's history below is unaffected.</div></div>`;

  async function paintRankings(host) {
    host.innerHTML = '<div class="ffp-card"><div class="ffp-empty">Loading this week…</div></div>';
    const weeks = await loadWeeks();
    if (!weeks.length) {
      host.innerHTML = `<h2 class="section-title">🏆 Power Rankings</h2>
      <div class="ffp-card"><div class="ffp-empty">${WK_EMPTY[S.wkErr] || WK_EMPTY.none}</div></div>`;
      return;
    }
    if (!S.week || !weeks.some((w) => w.f === S.week)) S.week = weeks[0].f;
    let p;
    try { p = await loadWeek(S.week); } catch (e) {
      /* ⚠️ The offer and the control have to agree. With other weeks on file
         the picker is rendered right under the sentence that points at it;
         with only one, the sentence does not make an offer it cannot keep. */
      console.error('[rankings] that week is listed but did not load', S.week, e);
      const more = weeks.length > 1;
      host.innerHTML = `<h2 class="section-title">🏆 Power Rankings</h2>
      <div class="ffp-card"><div class="ffp-empty"><b>That week didn't load.</b>The file is listed but could not be read.${more ? ' Try again, or pick another week below.' : ' Try again in a moment.'}</div></div>
      ${more ? wkPick(weeks) : ''}`;
      const s2 = $('#lg-wksel');
      if (s2) s2.onchange = () => { S.week = s2.value; paint(); };
      return;
    }
    /* 🚨 A FILE THAT PARSES IS NOT THE SAME AS A WEEK THAT RENDERS (v29).
       `rankHTML` walks `p.o`, and a payload where that is a string — a paste
       that went wrong, a hand-edited file — threw straight out of an async
       function whose only rejection handler was `buildJump`. The throw was
       SWALLOWED: no console error, no page error, the tab simply sat on
       "Loading this week…" for ever. And the near miss is worse than the
       throw: `(p.o || [])` catches a MISSING array, so that variant rendered
       a confident, complete, empty ranking with nobody in it.
       Both are the same fault — the file is readable and its contents are not
       a week — so both get the same honest sentence. */
    if (!p || !Array.isArray(p.o) || !p.o.length) { host.innerHTML = wkBad(); return; }
    try {
      host.innerHTML = rankHTML(p, weeks);
    } catch (e) {
      console.error('[rankings] that week would not render', e);
      host.innerHTML = wkBad();
      return;
    }
    const sel = $('#lg-wksel');
    if (sel) sel.onchange = () => { S.week = sel.value; paint(); };
  }

  /* ══ JUMP NAV ══════════════════════════════════════════════════════════
     One chip per card on the page, tapping straight to it.

     🚨 Built from the RENDERED DOM, never from a list of what each view is
     supposed to contain. A hand-kept list is a second description of the same
     thing and drifts the first time a section is added — this cannot list a
     card that is not there or miss one that is.

     Two kinds of landmark, because the views are two shapes: most pages are a
     run of `.section-title` headings, but Seasons is thirteen `<details>` under
     ONE heading, and there the useful chip is the year. */
  const JUMP_PAD = 68;   // the sticky header, so a target does not land under it

  function buildJump() {
    const nav = $('#lg-jump'), body = $('#lg-body');
    if (!nav || !body) return;
    let items = [...body.querySelectorAll('.section-title')].map((h) => ({ el: h, label: labelOf(h) }));
    if (items.length < 2) {
      items = [...body.querySelectorAll('details.fh-det > summary')].map((sm) => ({
        el: sm.parentElement, label: (sm.querySelector('b') || sm).textContent.trim() }));
    }
    items = items.filter((x) => x.label);
    /* One chip is a button that goes where you already are. */
    if (items.length < 2) { nav.hidden = true; nav.innerHTML = ''; return; }
    items.forEach((x, i) => { if (!x.el.id) x.el.id = 'lg-sec-' + i; });
    nav.hidden = false;
    nav.innerHTML = items.map((x) => `<button type="button" class="chip" data-jump="${esc(x.el.id)}">${esc(x.label)}</button>`).join('');
    spy();
  }

  /* The badge and any control inside a heading are real content there and
     noise in a one-word chip — the same strip Sports-Hub's rail needs. */
  function labelOf(h) {
    const c = h.cloneNode(true);
    c.querySelectorAll('.fh-src, button, .chips').forEach((n) => n.remove());
    return c.textContent.trim().replace(/\s+/g, ' ');
  }

  /* Flag the card you are actually in, not just the ones you can reach. */
  function spy() {
    const nav = $('#lg-jump');
    if (!nav || nav.hidden) return;
    const chips = [...nav.querySelectorAll('[data-jump]')];
    let here = null;
    chips.forEach((c) => { const t = document.getElementById(c.dataset.jump);
      if (t && t.getBoundingClientRect().top - JUMP_PAD <= 1) here = c; });
    chips.forEach((c) => c.classList.toggle('here', c === here));
  }
  addEventListener('scroll', spy, { passive: true });
  addEventListener('resize', spy, { passive: true });

  /* ══ ROUTER ════════════════════════════════════════════════════════════ */
  /* ⚠️ THREE TABS SHARE ONE ROW, AND THAT ROW CLIPS SILENTLY. `.ai-sub button`
     is `flex: 1; white-space: nowrap; overflow: hidden`, so a label too wide
     for its third is simply cut off with nothing to show it happened — the
     fault styles.css already records once. "📜 League History" measured too
     wide at 390px once the season tab took a third of the bar, so the archive
     is "History" here — and "This Season" was MEASURED clipping at 320px and
     is "Season". Both were found by rendering and comparing each button's
     scrollWidth to its clientWidth, which is the only thing that can see this.
     The ? sheet builds its tab list FROM this array, so it follows a rename
     with no second edit. */
  const L1 = [['hist', '📜 History'], ['season', '📊 Season'], ['rank', '🏆 Rankings']];

  function paint() {
    paintHead();
    const bar = $('#lg-sub');
    bar.innerHTML = L1.map(([k, l]) =>
      `<button type="button" role="tab" class="${k === S.view ? 'on' : ''}" aria-selected="${k === S.view}" data-l1="${k}">${l}</button>`).join('');
    const host = $('#lg-body');
    $('#lg-sub2').hidden = true;
    /* ⚠️ The second argument is the REJECTION handler, and passing `buildJump`
       to both is what made the v29 hang invisible — the view failed and the
       console stayed empty. Anything that gets this far is a bug; say so. */
    if (S.view === 'rank') {
      S.prof = null;
      paintRankings(host).then(buildJump, (e) => { console.error('[rankings] paint failed', e); buildJump(); });
      return;
    }
    /* ⚠️ `crest` is handed IN rather than duplicated in `season.js`: the logo
       map is one fact and a second copy of it would be a second source of
       truth for which manager owns which file. Same rejection handler as the
       rankings — passing one function to both arguments of `.then` is what
       made the v29 hang invisible. */
    if (S.view === 'season') {
      S.prof = null;
      window.LeagueSeason.paint(host, crest)
        .then(buildJump, (e) => { console.error('[season] paint failed', e); buildJump(); });
      return;
    }
    /* A profile is a drill-down out of the sub-tabs, not one of them — showing
       the bar there would highlight a page you are no longer on. */
    if (S.prof) {
      host.innerHTML = '<button type="button" class="fh-back" data-back="1">‹ Back to the league</button>' + LH.profile(S.prof);
      buildJump();
      return;
    }
    const s2 = $('#lg-sub2');
    s2.hidden = false;
    s2.innerHTML = LH.SUBS.map(([k, l]) =>
      `<button type="button" role="tab" class="${k === S.sub ? 'on' : ''}" aria-selected="${k === S.sub}" data-l2="${k}">${l}</button>`).join('');
    host.innerHTML = LH.view(S.sub);
    buildJump();
  }

  /* One delegated listener for the whole app — the views are re-rendered
     wholesale, so per-element handlers would be re-bound on every paint. */
  document.addEventListener('click', (e) => {
    /* The sheet sits over everything, so it gets first refusal on a tap. */
    if (e.target.closest('#lg-help')) { openHelp(); return; }
    if (e.target.closest('[data-close]')) { closeHelp(); return; }
    const who = e.target.closest('[data-me]');
    if (who) { choose(who.dataset.me); return; }
    if (e.target.closest('[data-skip]')) {
      markSkipped();
      $('#lg-pick').hidden = true; $('#lg-app').hidden = false;
      paint(); return;
    }
    /* The sheet's own "pick your name" button lands here too, so it has to
       close behind itself — otherwise the picker opens UNDER the sheet. */
    if (e.target.closest('#lg-me') || e.target.closest('[data-pickme]')) { closeHelp(); showPicker(!!LH.me() || skipped()); return; }
    if (e.target.closest('[data-share]')) { shareApp(); return; }
    /* Tapping the link itself selects the whole thing, so a long-press menu
       lands on the URL rather than on one word of it. */
    const uu = e.target.closest('.lg-share-u');
    if (uu) { uu.focus(); uu.select(); return; }
    const jump = e.target.closest('[data-jump]');
    if (jump) {
      const t = document.getElementById(jump.dataset.jump);
      /* Open a collapsed card before jumping to it, or the tap scrolls to a
         closed summary and looks like it did nothing. */
      if (t && t.tagName === 'DETAILS') t.open = true;
      if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - JUMP_PAD, behavior: 'smooth' });
      return;
    }
    const l1 = e.target.closest('[data-l1]');
    if (l1) {
      /* ⚠️ TAPPING THE TAB YOU ARE ALREADY ON IS NOT ALWAYS A NO-OP (v30).
         A profile is rendered UNDER its section's tab, so from Christel's
         career page the "League History" pill is the lit one — and tapping a
         lit tab to get back out of a drill-down is the first thing anybody
         tries. The guard only reset `S.prof` when the tab CHANGED, so that
         tap did nothing at all: no repaint, no error, no movement. The way
         out was there ("‹ Back to the league") but a control that is on
         screen, highlighted, and silent when tapped reads as a broken app
         rather than as the wrong control. */
      if (l1.dataset.l1 !== S.view || S.prof) {
        S.view = l1.dataset.l1; S.prof = null; paint(); window.scrollTo({ top: 0 });
      }
      return;
    }
    const l2 = e.target.closest('[data-l2]');
    if (l2) { if (l2.dataset.l2 !== S.sub) { S.sub = l2.dataset.l2; paint(); window.scrollTo({ top: 0 }); } return; }
    const mgr = e.target.closest('button[data-mgr]');
    if (mgr) { S.prof = mgr.dataset.mgr; paint(); window.scrollTo({ top: 0 }); return; }
    if (e.target.closest('[data-back]')) { S.prof = null; paint(); window.scrollTo({ top: 0 }); }
  });

  /* 🚨 The Lab is not in `index.html` at all — it is APPENDED here. A link
     sitting in the markup behind `hidden` is still there in view-source, and
     "closed off" that announces its own door to eleven people is most of the
     way to not being closed off.

     🚨 AND IT RUNS **AFTER** `setMe`, WHICH IS THE WHOLE BUG THIS FIXES.
     `ownerHere()` asks `LH.me()`, and at the top of boot nobody has been set
     yet — so on the owner's own phone, reading as himself, it answered "not
     him" and his tool had no link anywhere in the app. **A value derived at
     init cannot answer a question asked later** — the v1 lesson, in the file
     that documents it twice, hit again by putting the call four lines too
     early. Three of the four cases passed, because the unlocked one does not
     depend on `setMe`; only a render of the exact case caught it. */
  function labLink() {
    if (!labHere()) return;
    const foot = document.querySelector('.lg-foot');
    if (!foot || foot.querySelector('[href="power.html"]')) return;
    const g = guestPass();
    const p = document.createElement('p');
    /* ⚠️ A guest is told WHEN IT RUNS OUT, here and in the Lab. A pass that
       simply stops working one morning reads as the app breaking; a date
       turns the same event into something that was always going to happen. */
    p.innerHTML = g
      /* ⚠️ An open-ended pass is stored as a date so far out it never arrives
         (v34), which keeps ONE expiry rule in `owner.js` with no branch for
         "forever" — but it must never be printed: "until Dec 31, 9999" reads
         as a glitch, not as standing access. */
      ? `<a href="power.html">🏆 Power Rankings Lab</a> — yours to build this week's set${g.until && g.until < '9999-12-31' ? `, until ${esc(niceDate(g.until))}` : ''}.`
      : '<a href="power.html">🏆 Power Rankings Lab</a> — your tool for building the weekly set.';
    foot.appendChild(p);
  }

  /* ══ BOOT ══════════════════════════════════════════════════════════════ */
  const ver = $('#lg-ver'); if (ver) ver.textContent = APP_VERSION;

  if (!LH) {
    $('#lg-app').hidden = false;
    $('#lg-body').innerHTML = '<div class="ffp-card"><div class="ffp-empty"><b>The archive didn\'t load.</b>Reload the page — history.js ships as its own file and the browser didn\'t get it.</div></div>';
  } else {
    const me = readMe();
    /* 🚨 THE LANDING TAB IS NOT THE FIRST TAB, AND THAT IS DELIBERATE (v45).
       `SUBS` puts You first, which is right for the twelve people this app is
       for — but `youHTML()` with nobody picked is an invitation card and a
       "Choose my name" button, so landing a stranger there would open the app
       on a nag with no archive behind it. The hard rule is that picking is an
       invitation and never a gate, so: a reader who has picked lands on their
       own thirteen seasons (the v1 rule, which already lands `choose()` there),
       and everybody else lands on Honors. */
    if (me) { LH.setMe(me); S.sub = 'you'; }
    /* First ever open with nobody picked → the picker IS the front door.
       After that it never asks again, even with no name chosen, because a
       prompt that returns every visit is a nag rather than an invitation. */
    if (!me && !skipped()) showPicker(false);
    else { $('#lg-app').hidden = false; paint(); }
    paintHead();
    labLink();
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
