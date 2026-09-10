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

  const APP_VERSION = 'v4';
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

  /* ══ THE NAME PICKER ═══════════════════════════════════════════════════
     Twelve faces, tapped once. It is also reachable forever from the header,
     because a phone gets handed around and the first tap is often wrong. */
  function pickerHTML(canDismiss) {
    const me = LH.me();
    return `<div class="lg-pick-in">
      <div class="lg-pick-h">
        <div class="lg-pick-k">Nectars Bolonga</div>
        <h2>${me ? 'Not you?' : 'Who are you?'}</h2>
        <p>Tap your name and the whole app starts talking to <i>you</i> — your seasons, your medals, your Cum Bowls, your row highlighted everywhere it appears.</p>
      </div>
      <div class="lg-grid">${LH.roster().map((r) => `
        <button type="button" class="lg-who${r.m === me ? ' on' : ''}" data-me="${esc(r.m)}">
          ${crest(r.m, 46)}
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
      ? `${crest(me, 26)}<span>${esc(LH.name(me))}</span>`
      : '<span>👤 Who are you?</span>';
    $('#lg-me').setAttribute('title', me ? `Reading as ${LH.name(me)} — tap to change` : 'Tap to pick your name');
  }

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
      /* ⚠️ An empty archive and an unreachable one are OPPOSITE facts and the
         page says which. "Nothing published yet" when the truth is "you are
         offline" is the v220 lie in miniature. */
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
          <div class="pr-team">${code ? crest(code, 34) : ''}<span class="pr-tn">${esc(name)}</span>${own ? ` <span class="pr-mgr">${esc(own)}</span>` : ''}${mine ? ' <span class="lg-you">YOU</span>' : ''}</div>
          ${stats.length ? `<div class="pr-stats">${esc(stats.join(' · '))}</div>` : ''}
          ${note ? `<div class="pr-take-ro">${esc(note)}</div>` : ''}
          ${moved ? `<div class="pr-moved">The numbers had them ${modelRank}${ord(modelRank)}.</div>` : ''}
        </div>
      </li>`;
    }).join('');
  }

  function rankHTML(p, weeks) {
    const pick = weeks.length > 1
      ? `<div class="lg-wk"><label for="lg-wksel">Week</label><select id="lg-wksel">${weeks.map((w) =>
          `<option value="${esc(w.f)}"${w.f === S.week ? ' selected' : ''}>${esc(w.l)}</option>`).join('')}</select></div>`
      : '';
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

  async function paintRankings(host) {
    host.innerHTML = '<div class="ffp-card"><div class="ffp-empty">Loading this week…</div></div>';
    const weeks = await loadWeeks();
    if (!weeks.length) {
      host.innerHTML = `<h2 class="section-title">🏆 Power Rankings</h2>
      <div class="ffp-card"><div class="ffp-empty">${S.wkErr === 'offline'
        ? "<b>Can't reach the rankings right now.</b>You are offline, or the page didn't load properly. The league's history below works with no connection at all, so it is still all there."
        : "<b>No rankings published yet.</b>The commissioner publishes a set each week during the season. When one lands it shows up here — every team, in order, with a take on each."}</div></div>`;
      return;
    }
    if (!S.week || !weeks.some((w) => w.f === S.week)) S.week = weeks[0].f;
    let p;
    try { p = await loadWeek(S.week); } catch (_) {
      host.innerHTML = `<h2 class="section-title">🏆 Power Rankings</h2>
      <div class="ffp-card"><div class="ffp-empty"><b>That week didn't load.</b>The file is listed but could not be read. Try again, or pick another week.</div></div>`;
      return;
    }
    host.innerHTML = rankHTML(p, weeks);
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
  const L1 = [['hist', '📜 League History'], ['rank', '🏆 Rankings']];

  function paint() {
    paintHead();
    const bar = $('#lg-sub');
    bar.innerHTML = L1.map(([k, l]) =>
      `<button type="button" role="tab" class="${k === S.view ? 'on' : ''}" aria-selected="${k === S.view}" data-l1="${k}">${l}</button>`).join('');
    const host = $('#lg-body');
    $('#lg-sub2').hidden = true;
    if (S.view === 'rank') { S.prof = null; paintRankings(host).then(buildJump, buildJump); return; }
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
    const who = e.target.closest('[data-me]');
    if (who) { choose(who.dataset.me); return; }
    if (e.target.closest('[data-skip]')) {
      markSkipped();
      $('#lg-pick').hidden = true; $('#lg-app').hidden = false;
      paint(); return;
    }
    if (e.target.closest('#lg-me') || e.target.closest('[data-pickme]')) { showPicker(!!LH.me() || skipped()); return; }
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
    if (l1) { if (l1.dataset.l1 !== S.view) { S.view = l1.dataset.l1; S.prof = null; paint(); window.scrollTo({ top: 0 }); } return; }
    const l2 = e.target.closest('[data-l2]');
    if (l2) { if (l2.dataset.l2 !== S.sub) { S.sub = l2.dataset.l2; paint(); window.scrollTo({ top: 0 }); } return; }
    const mgr = e.target.closest('button[data-mgr]');
    if (mgr) { S.prof = mgr.dataset.mgr; paint(); window.scrollTo({ top: 0 }); return; }
    if (e.target.closest('[data-back]')) { S.prof = null; paint(); window.scrollTo({ top: 0 }); }
  });

  /* ══ BOOT ══════════════════════════════════════════════════════════════ */
  const ver = $('#lg-ver'); if (ver) ver.textContent = APP_VERSION;
  if (!LH) {
    $('#lg-app').hidden = false;
    $('#lg-body').innerHTML = '<div class="ffp-card"><div class="ffp-empty"><b>The archive didn\'t load.</b>Reload the page — history.js ships as its own file and the browser didn\'t get it.</div></div>';
  } else {
    const me = readMe();
    if (me) LH.setMe(me);
    /* First ever open with nobody picked → the picker IS the front door.
       After that it never asks again, even with no name chosen, because a
       prompt that returns every visit is a nag rather than an invitation. */
    if (!me && !skipped()) showPicker(false);
    else { $('#lg-app').hidden = false; paint(); }
    paintHead();
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
