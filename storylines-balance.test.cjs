/* Balanced narrative policy: factual highlights, memorable droughts, every voice.
   Uses the shipped archive and independent game/season assertions, not snapshots
   of the prose generator. No network or account access. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('history.js', 'utf8');
const load = (mutation = '') => {
  const ctx = { window: {} };
  vm.runInNewContext(source.replace('  const ST = (() => {', mutation + '\n  const ST = (() => {'), ctx);
  return ctx.window.LeagueHistory;
};
const H = load();
const { ALL, SEASON, PLAYOFF_GAMES, CUMBOWL, MONEY } = H._stats;
const key = (g) => `${g.yr}|${g.rd}|${[g.a, g.b].sort().join('|')}`;
const owner = (yr, team) => SEASON.find(s => s.yr === yr).rows.find(r => r.t === team).mgr;
const stat = (m) => ALL.find(a => a.m === m);
const row = (yr, m) => SEASON.find(s => s.yr === yr).rows.find(r => r.mgr === m);
const esc = (s) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ids = (stories) => JSON.stringify(stories.map(s => s.m + '/' + s.id).sort());
const neutral = ids(H._stories()), overview = ids(H._cardStories());
let renderChecks = 0;
for (const reader of [null, ...ALL.map(a => a.m)]) {
  H.setMe(reader);
  assert.equal(ids(H._stories()), neutral, 'selection cannot depend on who holds the phone');
  assert.equal(ids(H._cardStories()), overview, 'overview is reader-independent');
  assert.equal(H._cardStories().length, ALL.length);
  for (const a of ALL) {
    const stories = H._stories().filter(s => s.m === a.m);
    const good = stories.filter(s => s.tone === 'positive');
    assert.ok(good.length >= 2, `${a.m}: two earned highlights, not just two cards`);
    const claims = new Set();
    for (const s of good) for (const claim of s.claims) {
      assert.ok(!claims.has(claim), `${a.m}: the same event cannot count twice (${claim})`);
      claims.add(claim);
    }
    for (const s of stories) {
      assert.ok(s.evidence && s.claims.length, 'every story retains its evidence');
      assert.ok(s.head.length <= 62, s.head);
      assert.ok(!/undefined|NaN|losss|\[object Object\]/.test(s.head + s.body));
      assert.ok(s.body.length <= 360, `${s.m}/${s.id}: keep cards scannable`);
    }
    for (const html of [H.profile(a.m), ...(reader === a.m ? [H.view('you')] : [])]) {
      const order = stories.map(s => ({s, at:html.indexOf(`data-story-id="${esc(s.m + "/" + s.id)}"`)})).sort((x,y) => x.at-y.at);
      assert.ok(order.every(x => x.at >= 0), 'detected cards must actually render');
      assert.ok(order.slice(0, 2).every(x => x.s.tone === 'positive'), 'highlights lead; roasts remain visible after them');
      renderChecks++;
    }
  }
}
H.setMe(null);
const stories = H._stories();
const get = (m, id) => stories.find(s => s.m === m && s.id === id);
assert.ok(get('Wolff', 'ringless').tone === 'roast');
assert.match(get('Wolff', 'ringless').head, /99 wins.*no parade/);
assert.match(get('Christel', 'nopod').head, /podium/);
assert.match(get('Buley', 'cbking').body, /6 appearances and 4 losses/);
assert.match(get('Zach', 'collapse').head, /December/);
assert.ok(!get('CC', 'collapse'), 'money-playoff scope changes the scoring-drop leader');
assert.ok(!get('Wolff', 'nofinal'), 'one title drought, not a stack of the same joke');
assert.ok(!get('Buley', 'stuck'), 'Cum Bowl losses and last-place finishes are one roast');
assert.equal(stories.filter(s => s.tone === 'roast').length, 4, 'keep notable negatives alongside the highlights');
assert.ok(!stories.some(s => /^sig/.test(s.id)), 'no worst-ranking filler');
assert.match(get('Buley', 'six-seed-title').body, /Christel, Hurd and CC/);
assert.deepEqual(Array.from(get('Buley', 'statement-season').evidence.years), [2013], 'second highlight must be a separate chapter');
assert.match(get('McD', 'title-escape').head, /0.30/);
assert.match(get('Christel', 'playoff-explosion').head, /183.3/);
assert.equal(get('Christel', 'playoff-explosion').evidence.rank, 3);
assert.match(get('Riz', 'playoff-explosion').body, /3rd-place game.*2nd-highest/);
assert.match(get('Hyman', 'poscore').body, /Next highest: 184.7/);
assert.equal(MONEY.length, 77);
assert.equal(H._stats.MEET.length, 77);
assert.match(get('Christel', 'playoff-streak').body, /2018–2021/);
assert.match(get('Slemp', 'final-fireworks').body, /Ebzery/);
assert.ok(!/3 championships/.test(get('Slemp', 'deep').body), 'do not repeat the finals card');
H.setMe('Zach');
assert.match(H._stories().find(s => s.m === 'Hyman' && s.id === 'poscore').head, /You were also there/);
H.setMe(null);

// Check the evidence against original games, rather than trusting generated copy.
for (const s of stories.filter(s => s.tone === 'positive')) {
  const e = s.evidence, a = stat(s.m);
  if (e.game) {
    const g = MONEY.find(g => key(g) === e.game);
    assert.ok(g && (g.br === 'W' || g.rd === '3RD'), 'only title-bracket or third-place games qualify');
    const left = owner(g.yr, g.a) === s.m;
    const score = left ? g.as : g.bs, against = left ? g.bs : g.as;
    assert.ok(score > against);
    if (e.score !== undefined) assert.equal(score, e.score);
    if (e.margin !== undefined) assert.ok(Math.abs(score-against-e.margin) < 1e-8);
  }
  if (e.kind === 'statement-season') {
    const r = row(e.years[0], s.m);
    assert.equal(r.w, e.wins); assert.equal(r.l, e.losses);
    assert.ok(r.w/(r.w+r.l) >= 0.7);
  }
  if (e.kind === 'playoff-streak') {
    assert.ok(e.years.length >= 4);
    e.years.forEach((year, i) => {
      assert.ok(row(year, s.m).place <= 6);
      if (i) assert.equal(year, e.years[i-1]+1);
    });
  }
  if (e.kind === 'scorer') for (const year of e.years) {
    const r = row(year, s.m), season = SEASON.find(s => s.yr === year);
    assert.equal(r.pf/(r.w+r.l), Math.max(...season.rows.map(x => x.pf/(x.w+x.l))));
  }
  if (e.kind === 'six-seed-title' || e.kind === 'six-seed-final') {
    const r = row(e.years[0], s.m);
    assert.equal(r.seed, 6);
    assert.equal(r.place, e.kind === 'six-seed-title' ? 1 : 2);
    assert.equal(e.wins.length, e.kind === 'six-seed-title' ? 3 : 2);
    e.wins.forEach(k => {
      const g = PLAYOFF_GAMES.find(x => key(x) === k);
      assert.equal(g.br, 'W');
      assert.equal(owner(g.yr, g.as > g.bs ? g.a : g.b), s.m);
    });
  }
  if (e.kind === 'bowl-to-final') {
    assert.equal(e.years[1], e.years[0]+1);
    const c = CUMBOWL.find(c => c.yr === e.years[0]);
    assert.ok([c.s11,c.s12].some(t => owner(c.yr,t) === s.m));
    assert.equal(row(e.years[1], s.m).place, 2);
  }
  if (e.kind === 'deep') assert.ok(a.po >= 4 && a.f4/a.po >= 0.8);
  if (e.kind === 'perfectfinals') assert.ok(a.fin >= 2 && a.t1 === a.fin);
  if (e.kind === 'floor') assert.equal(a.cbA, 0);
}

// Changed facts must change the story, not preserve a hard-coded punchline.
const seedChange = load("SEASON.find(s=>s.yr===2023).rows.find(r=>r.mgr==='Buley').seed=5;");
assert.ok(!seedChange._stories().some(s => s.m === 'Buley' && s.id === 'six-seed-title'));
const marginChange = load("PLAYOFF_GAMES.find(g=>g.yr===2025&&g.rd==='R2'&&g.a==='JMcD6').as=110;");
assert.ok(!marginChange._stories().some(s => s.m === 'McD' && s.id === 'title-escape'));
const gap = load("MGRS.Christel.yrs=MGRS.Christel.yrs.filter(r=>r.yr!==2019);");
assert.ok(!gap._stories().some(s => s.m === 'Christel' && s.id === 'playoff-streak'));
const title = load('MGRS.Wolff.t1=1;');
assert.ok(!title._stories().some(s => s.m === 'Wolff' && s.id === 'ringless'));
const tiedScoring = load('MGRS.Wolff.t1=1;');
assert.match(tiedScoring._stories().find(s => s.m === 'Hurd' && s.id === 'scorer').body, /Joint-most/,
  'a title-winning scoring co-leader still counts as a tie');
console.log(`Narrative balance verified: ${stories.length} stories, ${stories.filter(s=>s.tone==='positive').length} highlights, 4 notable roasts, ${renderChecks} profile/You renders, all 13 reader identities and changed-fact scenarios.`);
