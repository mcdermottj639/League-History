/* ══════════════════════════════════════════════════════════════════════════
   🎯 CALIBRATION — grading the playoff-odds model against a known truth.

   🚨 NOT PART OF `checks.js`, AND THE REASON MATTERS. Everything in the suite
   is a law: a thing that must be true of every run, cheap to assert, and
   false the moment somebody breaks it. Calibration is not that shape. "When
   this model says 70%, does it happen 70% of the time" is a question about a
   DISTRIBUTION of forecasts, it needs hundreds of seasons to answer, and it
   comes back as a judgment rather than a pass or a fail.

   ⚠️ It is also the only thing that caught the two real modelling faults, and
   neither was visible to any assertion:
     · the first cut drew weekly scores around the ESTIMATED team mean as if
       that estimate were exact — at week 3 it said 95% for teams that made it
       83% of the time, both tails overconfident;
     · the between-team spread was clipped at zero before use, and clipping one
       tail of a noisy subtraction biases it upward — measured against a truth
       of 5.5 it recovered 6.68 at week 2, which roughly doubled how far the
       model trusted three weeks of scoring.
   A suite of conservation laws was green through both. **Run this whenever
   you touch `odds.js`.**

   `node calibrate.js` — about 90 seconds (timed, not guessed).
   ══════════════════════════════════════════════════════════════════════ */
global.window = {};
require('./odds.js');
const LO = window.LeagueOdds;

/* A universe where the truth is known, because the whole point is to compare
   a forecast against something. Values chosen to match what the archive and
   a real fantasy league look like, not to flatter the model. */
const N = 12, RW = 14, PT = 6, TRUE_SD = 5.5, SIGMA = 22, LG = 110;
const SEASONS = 300;

let seed = 7;
const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const gauss = () => {
  let u = 0, v = 0;
  while (!u) u = rnd();
  while (!v) v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

function schedule() {
  const ids = Array.from({ length: N }, (_, i) => String(i + 1));
  const rot = ids.slice(1), wks = [];
  for (let r = 0; r < N - 1; r++) {
    const pairs = [[ids[0], rot[r % rot.length]]];
    for (let k = 1; k < N / 2; k++) {
      pairs.push([rot[(r + k) % rot.length], rot[(r - k + rot.length * 2) % rot.length]]);
    }
    wks.push(pairs);
  }
  while (wks.length < RW) wks.push(wks[wks.length - (N - 1)]);
  const sch = {}; ids.forEach((i) => { sch[i] = []; });
  wks.slice(0, RW).forEach((pairs, w) => pairs.forEach(([a, b]) => { sch[a][w] = b; sch[b][w] = a; }));
  return { ids, sch };
}

function oneSeason(atWeek) {
  const { ids, sch } = schedule();
  const truth = {}; ids.forEach((i) => { truth[i] = LG + gauss() * TRUE_SD; });
  const scores = {}; ids.forEach((i) => { scores[i] = []; });
  for (let w = 0; w < RW; w++) ids.forEach((i) => scores[i].push(Math.round((truth[i] + gauss() * SIGMA) * 10) / 10));

  const teams = ids.map((i) => ({ id: i, scores: scores[i].slice(0, atWeek), sch: sch[i] }));
  const spec = { teams, rw: RW, pt: PT, priors: {}, seed: 99, sims: 4000 };
  const shrunk = LO.build(spec).odds;

  /* The baseline this is really arguing with: take a team's observed scoring
     at face value. Built by handing the model priors that equal each team's
     own average, which makes the shrinkage step a no-op. */
  const est = LO._estimate(teams, {}, RW);
  const flatPriors = {};
  teams.forEach((t) => {
    const p = t.scores.filter((x) => x > 0);
    flatPriors[t.id] = (p.length ? p.reduce((a, b) => a + b, 0) / p.length : est.lgMean) - est.lgMean;
  });
  const raw = LO.build(Object.assign({}, spec, { priors: flatPriors })).odds;

  const W = {}, PF = {}; ids.forEach((i) => { W[i] = 0; PF[i] = 0; });
  for (let w = 0; w < RW; w++) {
    ids.forEach((i) => {
      const j = sch[i][w];
      if (i >= j) return;
      const a = scores[i][w], b = scores[j][w];
      PF[i] += a; PF[j] += b;
      if (a > b) W[i]++; else if (b > a) W[j]++; else { W[i] += 0.5; W[j] += 0.5; }
    });
  }
  const top = new Set(ids.slice().sort((x, y) => W[y] - W[x] || PF[y] - PF[x]).slice(0, PT));
  return { ids, shrunk, raw, made: (id) => (top.has(id) ? 1 : 0) };
}

function grade(atWeek) {
  const bins = Array.from({ length: 10 }, () => ({ n: 0, p: 0, y: 0 }));
  let bS = 0, bR = 0, bF = 0, n = 0;
  for (let s = 0; s < SEASONS; s++) {
    const r = oneSeason(atWeek);
    r.ids.forEach((id) => {
      const p = r.shrunk[id] / 100, y = r.made(id);
      const b = bins[Math.min(9, Math.floor(p * 10))];
      b.n++; b.p += p; b.y += y;
      bS += (p - y) * (p - y);
      bR += (r.raw[id] / 100 - y) * (r.raw[id] / 100 - y);
      bF += (0.5 - y) * (0.5 - y);
      n++;
    });
  }
  const pct = (v) => (v * 100).toFixed(0).padStart(3) + '%';
  console.log(`\n══ forecasting at WEEK ${atWeek} — ${SEASONS} seasons, ${n} team-outcomes ══`);
  console.log(`   Brier  this model  : ${(bS / n).toFixed(4)}   (lower is better)`);
  console.log(`   Brier  raw scoring : ${(bR / n).toFixed(4)}`);
  console.log(`   Brier  flat 50%    : ${(bF / n).toFixed(4)}`);
  console.log(`   shrinkage vs raw   : ${(((bR - bS) / bR) * 100).toFixed(1)}%`);
  console.log('   said  ->  happened');
  bins.forEach((b) => {
    if (b.n < 20) return;
    const off = Math.abs(b.p / b.n - b.y / b.n) * 100;
    console.log(`     ${pct(b.p / b.n)}  -> ${pct(b.y / b.n)}   (n=${String(b.n).padStart(4)})${off > 8 ? '   <- off by ' + off.toFixed(0) : ''}`);
  });
}

[3, 6, 10].forEach(grade);
console.log('\nReading it: the middle bins should track closely. Extreme bins at week 3');
console.log('carry few forecasts and run a little overconfident — that is known, stated');
console.log('on the page, and the reason the app does not claim to beat anybody yet.');
