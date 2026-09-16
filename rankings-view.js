/* Published ranking visuals. No live model or season fetch: every number is
   derived from the selected snapshot and earlier publications in its season. */
(function (root) {
  'use strict';
  const finite = n => typeof n === 'number' && Number.isFinite(n);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const identity = row => row[7] || row[0];
  const year = p => p.y || Number(String(p.d).slice(0, 4));
  const ordinal = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({1:'st',2:'nd',3:'rd'}[n % 10] || 'th'));
  const fmt = n => finite(n) ? n.toFixed(1) : '—';
  const label = row => row[6] || row[0];
  const record = row => /^\d+-\d+(?:-\d+)?$/.test(row[1] || '') ? row[1].split('-').map(Number) : null;
  const result = value => /^[WLT]$/.test(String(value || '').toUpperCase()) ? String(value).toUpperCase() : null;

  // Capture extra facts at publication, preserving week positions. Zero points
  // count when an outcome confirms a played game; padded future zeroes do not.
  function capture(season, teamId, week) {
    const teams = season.teams || [], team = teams.find(t => t.teamId === teamId);
    if (!team || !Number.isInteger(week) || week < 1) return null;
    const score = (t, i) => {
      const n = t.scores && t.scores[i];
      return finite(n) && (n > 0 || result((t.outcomes || [])[i])) ? n : null;
    };
    const scores = Array.from({length:week}, (_, i) => score(team, i));
    const outcomes = scores.map((n, i) => n === null ? null : result((team.outcomes || [])[i]));
    let w = 0, l = 0, ties = 0, complete = teams.length === 12;
    scores.forEach((n, i) => {
      teams.forEach(t => {
        if (t === team) return;
        const other = score(t, i);
        if (n === null || other === null) { complete = false; return; }
        if (n > other) w++; else if (n < other) l++; else ties++;
      });
    });
    // Firebase removes null fields and empty arrays. Store only complete facts
    // so reading the saved snapshot preserves the exact publication payload.
    const saved = {};
    if (scores.every(finite)) saved.scores = scores;
    if (outcomes.every(Boolean)) saved.outcomes = outcomes;
    if (complete) saved.allPlay = [w, l, ties];
    return Object.keys(saved).length ? saved : null;
  }

  function facts(p, history = []) {
    const publications = new Map();
    history.concat(p).forEach(s => {
      if (s && year(s) === year(p) && Number.isInteger(s.k) && s.k <= p.k && Array.isArray(s.o)) publications.set(s.k, s);
    });
    const snapshots = [...publications.values()].sort((a, b) => a.k - b.k);
    const previous = snapshots.length > 1 ? snapshots[snapshots.length - 2] : null;
    const points = p.o.map(r => p.r && finite(r[2]) ? r[2] : null);
    const completePoints = points.every(finite);
    const avg = completePoints ? points.reduce((sum, n) => sum + n, 0) / points.length : null;
    // A legacy Week 1 PPG is that week's score. Unequal rounded scores preserve
    // order exactly; tied rounded scores cannot prove a real all-play tie.
    const firstWeek = p.k === 1 && completePoints && p.o.every(r => {
      const rec = record(r); return rec && rec.reduce((a,b) => a+b,0) === 1;
    });
    const legacyAP = firstWeek && new Set(points).size === points.length;
    const rows = p.o.map((row, i) => {
      const extra = row[8] && typeof row[8] === 'object' ? row[8] : {};
      const trail = snapshots.map(s => ({week:s.k, rank:s.o.findIndex(r => identity(r) === identity(row)) + 1})).filter(s => s.rank > 0);
      const old = previous ? previous.o.findIndex(r => identity(r) === identity(row)) : -1;
      const movement = old >= 0 ? old - i : null;
      let allPlay = Array.isArray(extra.allPlay) && extra.allPlay.length === 3 && extra.allPlay.every(n => Number.isInteger(n) && n >= 0) ? extra.allPlay : null;
      if (!allPlay && legacyAP) allPlay = [points.filter(n => n < row[2]).length, points.filter(n => n > row[2]).length, 0];
      let form = Array.from({length:p.k}, (_, w) => ({week:w+1, result:result((extra.outcomes || [])[w])}));
      // Older publications still prove the result when consecutive cumulative
      // records differ by exactly one game. Never guess across a missing week.
      form = form.map(f => {
        if (f.result) return f;
        const current = snapshots.find(s => s.k === f.week);
        const prior = snapshots.find(s => s.k === f.week - 1);
        const r = current && current.o.find(r => identity(r) === identity(row));
        const before = prior && prior.o.find(r => identity(r) === identity(row));
        const a = r && record(r), b = f.week === 1 ? [0,0,0] : before && record(before);
        if (!a || !b) return f;
        const delta = [0,1,2].map(j => (a[j] || 0) - (b[j] || 0));
        return delta.filter(n => n === 1).length === 1 && delta.every(n => n === 0 || n === 1) ? {...f, result:['W','L','T'][delta.indexOf(1)]} : f;
      }).slice(-4);
      const latest = (extra.scores || [])[p.k-1];
      const lastScore = finite(latest) ? latest : firstWeek ? row[2] : null;
      const scoringRank = completePoints ? 1 + points.filter(n => n > row[2]).length : null;
      const tied = scoringRank !== null && points.filter(n => n === row[2]).length > 1;
      return {row, rank:i+1, movement, trail, allPlay, form, lastScore, scoringRank, tied};
    });
    let closest = null;
    if (completePoints) rows.slice(1).forEach((r, i) => {
      const gap = Math.round(Math.abs(r.row[2] - rows[i].row[2]) * 10) / 10;
      if (!closest || gap < closest.gap) closest = {a:i+1, b:i+2, gap};
    });
    return {p, rows, avg, previous, closest};
  }

  const ICONS = {
    trophy:'<path d="M8 3h8v7a4 4 0 0 1-8 0V3Zm0 2H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4M12 14v6m-4 1h8"/>',
    rise:'<path d="m3 17 6-6 4 4 8-11m-6 0h6v6"/>',
    race:'<circle cx="8" cy="7" r="3"/><circle cx="17" cy="8" r="2"/><path d="M2 20v-3a6 6 0 0 1 12 0v3m1-7a5 5 0 0 1 7 4v3"/>',
    quote:'<path d="M4 4h16v12H9l-5 4V4Zm4 5h8m-8 3h5"/>'
  };
  const icon = name => `<svg class="rk-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
  const tile = (symbol, title, who, value, tone = '') => `<div class="rk-highlight">${icon(symbol)}<span>${title}</span><b>${esc(who)}</b><strong class="${tone}">${esc(value)}</strong></div>`;

  function highlights(data) {
    const {rows, previous, closest} = data;
    const weekly = rows.every(r => finite(r.lastScore));
    const values = rows.map(r => weekly ? r.lastScore : data.p.r && finite(r.row[2]) ? r.row[2] : null);
    const high = values.every(finite) ? Math.max(...values) : null;
    const leaders = rows.filter((r,i) => high !== null && values[i] === high);
    const climb = Math.max(0, ...rows.map(r => r.movement || 0));
    const climbers = rows.filter(r => climb > 0 && r.movement === climb);
    return `<div class="rk-highlights">
      ${tile('trophy', weekly ? 'Top scorer' : 'Scoring leader', leaders.length === 1 ? label(leaders[0].row) : leaders.length ? leaders.length + ' teams tied' : 'No games yet', high === null ? '—' : fmt(high) + (weekly ? '' : ' PPG'))}
      ${tile('rise', 'Biggest climb', !previous ? 'First edition' : climbers.length === 1 ? label(climbers[0].row) : climbers.length ? climbers.length + ' teams tied' : 'No change', climb ? '↑ ' + climb : '—', climb ? 'rk-up' : '')}
      ${tile('race', 'Closest scoring', closest ? '#' + closest.a + '–#' + closest.b : 'No games yet', closest ? fmt(closest.gap) + ' PPG' : '—')}
    </div>`;
  }

  function chart(r, p) {
    const trail = r.trail;
    const first = trail[0].week, last = p.k, maxRank = p.o.length;
    const width = Math.max(300, (last-first+1)*43+46), height = 170;
    const x = week => last === first ? width/2 : 34 + (week-first)/(last-first)*(width-50);
    const y = rank => 15 + (rank-1)/Math.max(1,maxRank-1)*122;
    const axis = [1,4,8,maxRank].filter((n,i,a) => n <= maxRank && a.indexOf(n) === i);
    const grid = axis.map(n => `<line x1="34" y1="${y(n)}" x2="${width-16}" y2="${y(n)}"/><text x="2" y="${y(n)+4}">#${n}</text>`).join('');
    const weeks = Array.from({length:last-first+1}, (_,i) => first+i).map(w => `<text x="${x(w)}" y="160" text-anchor="middle">${w === 0 ? 'Pre' : 'W'+w}</text>`).join('');
    const lines = trail.slice(1).map((s,i) => s.week === trail[i].week+1 ? `<line class="rk-trend" x1="${x(trail[i].week)}" y1="${y(trail[i].rank)}" x2="${x(s.week)}" y2="${y(s.rank)}"/>` : '').join('');
    const dots = trail.map(s => `<circle cx="${x(s.week)}" cy="${y(s.rank)}" r="4.5"><title>${s.week === 0 ? 'Preseason' : 'Week '+s.week}: rank ${s.rank}</title></circle>`).join('');
    const change = trail[0].rank-r.rank;
    const summary = trail.length === 1 ? 'First published ranking. Trends build with each week.' : (change ? `${change>0?'↑':'↓'} ${Math.abs(change)} ${Math.abs(change)===1?'place':'places'}` : 'Same rank') + ` since ${first === 0 ? 'preseason' : 'Week '+first}.`;
    const description = trail.map(s => `${s.week === 0 ? 'Preseason' : 'Week '+s.week}, rank ${s.rank}`).join('; ');
    return `<section class="rk-chart"><h4>Power rank by week</h4><div class="rk-chart-scroll" tabindex="0" role="region" aria-label="Ranking history for ${esc(r.row[0])}"><svg viewBox="0 0 ${width} ${height}" style="min-width:${last-first > 5 ? width : 0}px" role="img" aria-label="${esc(description)}">${grid}${weeks}${lines}${dots}</svg></div><p class="rk-trend-note${change>0?' rk-up':change<0?' rk-down':''}">${summary}</p></section>`;
  }

  function breakdown(r, data) {
    const max = Math.max(1, ...data.rows.map(s => finite(s.row[2]) ? s.row[2] : 0));
    const bar = (name, value, league) => `<div class="rk-bar"><span>${esc(name)}</span><div class="rk-track"><i class="${league?'rk-league-bar':''}" style="width:${Math.max(0,value)/max*100}%"></i></div><b>${fmt(value)}</b></div>`;
    const comparisons = data.avg !== null ? bar(label(r.row),r.row[2],false) + bar('League',data.avg,true) : '<p class="rk-empty">Scoring begins after the first game.</p>';
    const ap = r.allPlay;
    return `${chart(r,data.p)}<section class="rk-comparison"><h4>Scoring comparison <span>(points per game)</span></h4>${comparisons}</section>
      <div class="rk-form-grid"><section><h4>All-play</h4><strong class="rk-ap">${ap ? ap[0]+'–'+ap[1]+(ap[2]?'–'+ap[2]:'') : '—'}</strong><p>${ap ? 'Your score against every team each week.' : 'Not saved with this week.'}</p>${ap && ap[2] ? '<p>Wins–losses–ties</p>' : ''}</section>
      <section><h4>Recent form</h4><div class="rk-form">${r.form.length ? r.form.map(f => `<span class="rk-result"><b class="rk-${f.result || 'unknown'}" aria-label="Week ${f.week}: ${f.result === 'W'?'win':f.result === 'L'?'loss':f.result === 'T'?'tie':'result unavailable'}">${f.result || '—'}</b><small>W${f.week}</small></span>`).join('') : '<p>No games yet.</p>'}</div></section></div>`;
  }

  function rowsHTML(data, {crest, me}) {
    return data.rows.map(r => {
      const [name, rec, ppg, note, modelRank, , own, code] = r.row;
      const mine = !!me && code === me;
      const move = r.movement;
      const movement = move === null ? 'NEW' : move > 0 ? '↑ '+move : move < 0 ? '↓ '+(-move) : '— SAME';
      const baseline = move === null ? 'first ranking' : data.previous.k === data.p.k-1 ? 'vs last week' : 'vs '+(data.previous.k === 0 ? 'preseason' : 'Week '+data.previous.k);
      return `<li class="pr-row ro rk-card${r.rank < 4?' podium p'+r.rank:''}${mine?' lg-mine':''}">
        <div class="rk-team-head"><span class="pr-n big">${r.rank}</span>${code?crest(code,40):''}<div class="rk-team-name"><h3 class="pr-tn">${esc(name)}</h3><span class="pr-mgr">${esc(own || '')}</span>${mine?' <span class="lg-you">YOU</span>':''}</div><div class="rk-movement"><b class="${move>0?'rk-up':move<0?'rk-down':''}">${movement}</b><small>${baseline}</small></div></div>
        <div class="rk-stats"><div><b>${esc(rec || '—')}</b><span>Record</span></div><div><b>${data.p.r?fmt(ppg):'—'}</b><span>PPG</span></div><div><b>${r.scoringRank?(r.tied?'T-':'')+ordinal(r.scoringRank):'—'}</b><span>Scoring</span></div></div>
        ${note?`<div class="rk-writeup">${icon('quote')}<div><h4>The write-up</h4><div class="pr-take-ro">${esc(note)}</div>${modelRank && modelRank !== r.rank?`<p class="pr-moved">The numbers had them ${ordinal(modelRank)}.</p>`:''}</div></div>`:''}
        <details class="rk-details" data-rank-detail="${esc(identity(r.row))}"${r.rank===1?' open':''}><summary><span class="rk-closed-label">View trends &amp; stats</span><span class="rk-open-label">Season breakdown</span><i aria-hidden="true"></i></summary><div class="rk-detail-body">${breakdown(r,data)}<button type="button" class="rk-hide">Hide details <span aria-hidden="true">⌃</span></button></div></details>
      </li>`;
    }).join('');
  }

  const api = {capture, facts, highlights, rowsHTML};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RankingVisuals = api;
})(typeof window !== 'undefined' ? window : globalThis);
