/* Narrative regressions: independent archive facts and deliberately different
   readers/results. Run with node storylines.test.cjs; no network required. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
global.window = {};
require('./history.js');
require('./season.js');
const H = window.LeagueHistory, S = window.LeagueSeason;
const { ALL, SEASON, PLAYOFF_GAMES } = H._stats;
const snapshot = JSON.parse(fs.readFileSync('season/current.json', 'utf8'));
const plain = (s) => s.replace(/<[^>]+>/g, '');

// All readers get the same findings, voiced to them, and real data denominators.
for (const member of ALL) {
  H.setMe(member.m);
  const stories = H._stories().filter(s => s.m === member.m);
  assert.ok(stories.length >= 2, member.m);
  assert.ok(stories.every(s => H.view('you').includes(s.head)));
  assert.equal(H._cardStories().length, 12);
  assert.ok(!/pure luck|unluckiest team|won nothing|then disappear/.test(stories.map(s => s.head+s.body).join(' ')));
}
H.setMe(null);
const stories = H._stories();
const story = (m, id) => stories.find(s => s.m === m && s.id === id);
assert.match(story('Riz', 'deep').head, /4 final fours from 4 playoff trips/);
assert.match(story('Slemp', 'perfectfinals').head, /3 finals, 3 championships/);
assert.match(story('Hurd', 'scorer').body, /2 finals, 5 final fours/);
assert.ok(!story('Hurd', 'collapse'));
assert.match(story('Christel', 'nopod').body, /2nd-highest championship-bracket score \(183.3\)/);
assert.match(story('Hyman', 'poscore').body, /Next highest: 183.3/);
assert.ok(!stories.some(s => s.id === 'dynasty'));

// Recalculate each displayed playoff row from original game/season records.
const playoffHTML = H.view('rec').split('Playoff scoring lift')[1];
for (const member of ALL) {
  const samples = PLAYOFF_GAMES.filter(g => g.br === 'W').flatMap(g => {
    const season = SEASON.find(s => s.yr === g.yr);
    return [[g.a,g.as],[g.b,g.bs]].flatMap(([name,score]) => {
      const team = season.rows.find(r => r.t === name);
      return team.mgr === member.m ? [{score, baseline:team.pf/(team.w+team.l)}] : [];
    });
  });
  const reg = samples.reduce((sum,s) => sum+s.baseline, 0)/samples.length;
  const po = samples.reduce((sum,s) => sum+s.score, 0)/samples.length;
  const display = n => (Math.round(n*10)/10).toFixed(1);
  assert.ok(playoffHTML.includes(`${display(reg)} → ${display(po)} ppg · ${samples.length} games`), member.m);
  assert.ok(Math.abs(po-member.bPpg) < 1e-8, 'must agree with all-time playoff PPG');
}

// Complete synthetic Week 1, then independent head-to-head and all-play facts.
function weekOne(scores) {
  return { ...snapshot, d:'test', t:snapshot.t.map((t,i) => {
    const opponent = i ^ 1;
    return {...t, w:+(scores[i]>scores[opponent]), l:+(scores[i]<scores[opponent]), ti:+(scores[i]===scores[opponent]),
      s:[scores[i]], pf:scores[i], sch:Array(14).fill(snapshot.t[opponent].id),
      apw:scores.filter(x => x<scores[i]).length, apl:scores.filter(x => x>scores[i]).length};
  })};
}
const scores = [113.9,140,90,80,95,100,105,110,120,125,130,135];
let data = S._derive(weekOne(scores));
for (const member of data.teams) {
  H.setMe(member.m);
  const text = plain(S._careerLines(data,member).join(' '));
  const beaten = scores.filter(x => x<member.scores[0]).length;
  assert.match(text, new RegExp(`${beaten} of 11 opponents`));
  assert.ok(!/At this rate|0-14|14-0/.test(text));
  assert.match(text,/through one game/);
  assert.match(plain(S._meHTML(data,()=>'',member.m)),/ESPN playoff odds/);
}
assert.match(S._performanceLine(data,data.teams[0]),/6 of 11 opponents/);
assert.match(S._performanceLine(data,data.teams[0]),/scoring was better/);
// A tied score is not a loss, and equal-to-median scoring is not below median.
data = S._derive(weekOne(Array(12).fill(100)));
H.setMe(data.teams[0].m);
assert.match(S._performanceLine(data,data.teams[0]),/tied eleven/);
assert.match(S._schedHTML(data,()=>'',data.teams[0].m),/T 100.0-100.0/);
assert.ok(!/below-median/.test(S._performanceLine(data,data.teams[0])));
assert.equal(data.teams[0].luck,null, 'do not assert a gap from tie-incomplete all-play');
assert.match(S._comparisonTxt(3.04,[3,1,2],'your'),/ahead of two and level with one/);
assert.match(S._comparisonTxt(3,[3,3,3],'your'),/level with three/);
const missing = structuredClone(data); missing.teams[1].scores=[];
assert.ok(!/Week 1 score would/.test(S._performanceLine(missing,missing.teams[0])));
const preseason = S._derive(snapshot);
assert.ok(!/through|would have beaten/.test(S._careerLines(preseason,preseason.teams[0]).join(' ')));
const multi = {...data, wp:5};
const mid = {...multi.teams[0], g:5,w:1,l:4,ti:0,apw:35,apl:20,allPct:35/55,winPct:1/5};
assert.match(S._performanceLine(multi,mid),/35-20 weekly all-play/);
assert.match(S._performanceLine(multi,mid),/Scoring has outpaced/);
const complete = {...mid,g:14,w:7,l:7,allPct:null};
assert.match(S._performanceLine({...multi,rw:14},complete),/regular season is complete/);

// Same-date refreshes and identity changes must not leak another user's hinges.
let builds = 0;
window.LeagueOdds = {priorFor:()=>0, build:spec=>{builds++;return {reader:spec.me,source:spec.teams[0].scores[0]};}};
H.setMe(data.teams[0].m);
const first = S._ourOdds(data);
assert.equal(S._ourOdds(data),first); assert.equal(builds,1);
H.setMe(data.teams[1].m);
assert.equal(S._ourOdds(data).reader,data.teams[1].id); assert.equal(builds,2);
const refresh = weekOne(scores); refresh.d=data.p.d;
assert.equal(S._ourOdds(S._derive(refresh)).source,scores[0]); assert.equal(builds,3);
const hinge = need => plain(S._hingeHTML(data,{meIdx:0,myGames:[{w:1}],swings:[],need,sos:0,sims:10000},data.teams[0].m));
assert.match(hinge(null),/does not establish elimination/);
assert.match(hinge(0),/Even with no more wins/);
assert.match(hinge(1),/at least half/);
assert.ok(!/Nothing left to play for|better than even money/.test(hinge(null)+hinge(1)));

// Future archive scenarios exercise uniqueness and scope without changing data.
const source = fs.readFileSync('history.js','utf8');
function changedArchive(mutation) {
  const context = {window:{}};
  vm.runInNewContext(source.replace('  const ST = (() => {', mutation+'\n  const ST = (() => {'),context);
  return context.window.LeagueHistory._stories();
}
const tiedPods = changedArchive("MGRS.Hurd.yrs.forEach(r=>{r.place=4;});");
assert.match(tiedPods.find(s=>s.m==='Christel'&&s.id==='nopod').body,/One of 2 managers/);
const ring = changedArchive('MGRS.McD.pct=0.9;');
assert.ok(!/best in the league/.test(ring.find(s=>s.id==='ringless').body));
const tiedRecord = changedArchive("PLAYOFF_GAMES.find(g=>g.yr===2018&&g.as===183.3).as=193.48;");
assert.match(tiedRecord.find(s=>s.m==='Hyman'&&s.id==='poscore').head,/a share of/);
console.log('✅ Narrative accuracy: all 12 readers, championship-only samples, Week 1/ties/missing data, cache identity, simulation language and future shared records.');
