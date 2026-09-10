/* ══════════════════════════════════════════════════════════════════════════
   🎯 PLAYOFF ODDS — the app's own number, and why it is allowed to have one.

   🚨 THIS IS THE ONE MODEL IN THE APP THAT CAN BE GRADED. The power rankings
   are an opinion column with no outcome to score against, which is why that
   file says in as many words that its weights are a judgment call and must
   never be presented as validated. Playoff odds are different: a team either
   makes the bracket or does not, so a forecast can be scored with a Brier
   score and two forecasters can be compared. **So nothing here claims to beat
   ESPN. It keeps score and lets the season answer.**

   ── WHAT THE ARCHIVE SAYS, MEASURED ──────────────────────────────────────
   Three tests over the thirteen seasons, and the third is the important one:

     last season's scoring    -> this season's   r = +0.14
     career average (ex-year) -> this season's   r = +0.17
     win rate above .500      -> next season's   r = -0.02   ← ZERO

   **A manager's win-loss record carries no predictive information at all.**
   Scoring carries a little. That is why every input here is points, never
   record — the same instinct the luck index was built on, now with a number
   under it.

   Variance decomposition of season scoring against that year's league:

     season-to-season swing within one manager :  7.74 ppg
     true between-manager skill                :  2.16 ppg   (3.6x smaller)
     reliability of a SINGLE season            :  0.07

   So a manager's own history is real and weak. Thirteen seasons of it earns
   50% weight; one season earns 7%. Hurd's +4.65 career average is worth
   +2.34 ppg as a forecast, Slemp's -4.49 is worth -2.26. A ~4.6 ppg spread
   between the best and worst manager in the league — about one win over
   fourteen games, which in a six-of-twelve race is a lot.

   ⚠️ SEASON_K = 12.8 is the only number here carried in from that analysis
   rather than measured live, because it needs many seasons and the archive
   has them. Everything else self-calibrates from the season in progress.

   ── WHERE THE EDGE IS SUPPOSED TO COME FROM ──────────────────────────────
   1. 🚨 **SHRINKAGE, WHICH IS THE BIG ONE.** Weekly fantasy scores swing far
      wider than true team strength, so a team's observed points-per-game is
      mostly noise for the first month. The weight on what a team has actually
      done is `n / (n + sigma_week^2 / sigma_between^2)` — measured live, and
      early in a season that lands near 0.15. **A model that reads a 3-0 team
      scoring 130 a week as a 130-a-week team is fitting noise**, and that is
      the largest single source of error in weeks 1-8.
   2. **The distribution, not the average.** Playoff odds are a question about
      variance: a bubble team that swings wildly has BETTER odds than a steady
      team with the same mean, because it needs a hot streak. So weekly scores
      are drawn, never compared as point estimates.
   3. **Manager history as the prior** — the one input ESPN structurally
      cannot have. It sees rosters; it has no idea Slemp has scored below the
      league for thirteen straight years.

   ⚠️ **AND THE HONEST EXPECTATION IS THAT ESPN WINS EARLY.** Before a ball is
   thrown they can see twelve rosters and we can see thirteen years of
   history worth ±2.3 ppg. Our edge only grows as real scoring accumulates and
   their preseason projection decays. Even, maybe, by week 4; ahead, maybe, by
   week 7. The scoreboard decides, not this comment.

   ── DETERMINISM ──────────────────────────────────────────────────────────
   🚨 **SEEDED, BECAUSE TWELVE PEOPLE COMPARE PHONES.** A Monte Carlo with an
   unseeded RNG gives every reader a slightly different percentage for the
   same published week, and two people holding their screens side by side
   would see the app disagree with itself. That reads as broken, and it is the
   kind of broken nobody can debug from a group chat. The seed is the week key,
   so a week's numbers are fixed the moment it is published.
   ⚠️ And the result is rounded to a WHOLE percent, because that is roughly
   the resolution the simulation actually has. ESPN publishes 61.425%, which
   is three digits of false precision on a number that is itself a simulation.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* From the archive: season-to-season noise / true skill. A manager's own
     history gets weight seasons/(seasons + SEASON_K). See the header. */
  const SEASON_K = 12.8;
  /* 🚨 AN ARCHIVE-GROUNDED PRIOR ON HOW FAR APART THE TEAMS REALLY ARE, and
     the reason it exists is a measured bias rather than a hunch. The live
     estimate of between-team spread is `spread of observed means MINUS the
     sampling noise in them`, and with twelve teams and three weeks that
     subtraction is so noisy it often goes negative — where it gets clipped at
     zero. Clipping only one tail biases the average UP, so early in a season
     the model reads its own noise as talent and over-trusts three weeks of
     scoring. Measured against a known truth of 5.5: it recovered 6.68 at week
     2 and 5.65 at week 3, which put lambda at roughly double where it should
     be, and that is what left the week-3 forecast overconfident.

     So the early weeks lean on the archive instead. Both numbers come from
     the thirteen-season decomposition in the header, and the third input is
     measured live, so this is a formula rather than a constant somebody
     tuned:
       true between-manager skill      2.16 ppg
       season-to-season swing          7.74 ppg  (roster change + sampling)
       sampling in a full season       sigma_week / sqrt(weeks)   <- live
     Take the sampling out of the season-to-season swing and what is left is
     how much a roster changes a manager's level year to year; add the skill
     back and that is the spread you expect between twelve teams in one
     season. */
  const SKILL_SD = 2.16;
  const SEASON_SD = 7.74;
  /* Weight of that prior, in weeks. The live estimate overtakes it around
     week 6, which is about where the diagnostic shows it becoming reliable. */
  const TAU_WEEKS = 6;

  /* Only used before any game is played, when nothing can be measured. */
  const DEFAULT_SIGMA = 22;
  const DEFAULT_MEAN = 110;
  /* 10k keeps a whole percent stable and stays well inside a phone's budget. */
  const SIMS = 10000;

  /* Deterministic RNG (mulberry32) — same seed, same numbers, every device. */
  function rngOf(seed) {
    let a = (seed >>> 0) || 1;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  /* Box-Muller, one draw at a time — the pair-caching version would make the
     stream depend on call order, which is a determinism bug waiting to be
     written. */
  function gaussOf(rng) {
    return function () {
      let u = 0, v = 0;
      while (u === 0) u = rng();
      while (v === 0) v = rng();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
  }

  const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

  /* ══ STRENGTH ══════════════════════════════════════════════════════════
     Everything below self-calibrates from the season in progress: the weekly
     spread and the between-team spread are both measured, so the shrinkage
     weight is not a constant somebody guessed — it follows the data as the
     weeks accumulate. */
  function tauPrior(sigma, rw) {
    const sampling = (sigma * sigma) / Math.max(1, rw);
    const roster = Math.max(0, SEASON_SD * SEASON_SD - sampling);
    return SKILL_SD * SKILL_SD + roster;
  }

  function estimate(teams, priors, rw) {
    const played = teams.map((t) => (t.scores || []).filter((s) => s > 0));
    const n = Math.min.apply(null, played.map((p) => p.length).concat([99]));
    const allScores = [].concat.apply([], played);
    const lgMean = allScores.length ? mean(allScores) : DEFAULT_MEAN;

    /* Pooled within-team weekly SD: how much a team's own week bounces. */
    let ss = 0, df = 0;
    played.forEach((p) => {
      if (p.length < 2) return;
      const m = mean(p);
      p.forEach((v) => { ss += (v - m) * (v - m); });
      df += p.length - 1;
    });
    const sigma = df > 0 ? Math.sqrt(ss / df) : DEFAULT_SIGMA;

    /* Between-team TRUE spread = spread of observed means, less the sampling
       noise that a short season puts into every one of them. Without that
       subtraction the model would read its own noise as talent — which is the
       fault the whole shrinkage step exists to prevent. */
    const obsMeans = played.map((p) => (p.length ? mean(p) : lgMean));
    const varMeans = obsMeans.length > 1
      ? obsMeans.reduce((a, v) => a + (v - mean(obsMeans)) * (v - mean(obsMeans)), 0) / (obsMeans.length - 1)
      : 0;
    /* ⚠️ The live figure is deliberately NOT clipped before blending — a
       negative value is real information ("the teams look no further apart
       than noise would make them"), and clipping it is what caused the bias
       in the first place. The prior keeps the blend positive. */
    const varLive = varMeans - (n > 0 ? (sigma * sigma) / n : 0);
    const prior = tauPrior(sigma, rw || 14);
    const varBetween = Math.max(1, (varLive * n + prior * TAU_WEEKS) / (n + TAU_WEEKS));

    /* The shrinkage weight, straight out of the decomposition. n = 0 gives 0,
       which is correct: with no games played, everything is the prior. */
    const lambda = n > 0 ? n / (n + (sigma * sigma) / varBetween) : 0;

    /* 🚨 HOW WRONG THE ESTIMATE ITSELF MIGHT BE, WHICH THE FIRST CUT IGNORED
       AND THE CALIBRATION TEST CAUGHT. Drawing weekly scores around `mu` as
       if `mu` were the true team mean treats a three-week estimate as a known
       fact. It is not — it is a guess with its own error bar — and leaving
       that out makes the spread of simulated seasons too NARROW, which pushes
       every probability toward 0 and 100.

       Measured, before the fix: at week 3 the model said 95% for teams that
       made it 83% of the time, and 4% for teams that made it 15% of the time.
       Both tails overconfident, which is the signature of exactly this.

       For a normal prior and normal likelihood the posterior variance of the
       mean is `tau^2 * (1 - lambda)` — it falls to zero as the season makes
       lambda approach 1, so this correction is large in September and gone by
       December, which is precisely when it is needed. */
    const muSd = Math.sqrt(Math.max(0, varBetween * (1 - lambda)));

    const mu = {};
    teams.forEach((t, i) => {
      const prior = lgMean + (priors[t.id] || 0);
      const obs = played[i].length ? mean(played[i]) : prior;
      mu[t.id] = lambda * obs + (1 - lambda) * prior;
    });
    return { mu, sigma, lambda, lgMean, n, varBetween, muSd };
  }

  /* A manager's career scoring, shrunk by how many seasons it rests on. */
  function priorFor(relPpg, seasons) {
    if (relPpg == null || !seasons) return 0;
    return relPpg * (seasons / (seasons + SEASON_K));
  }

  /* ══ THE SEASON, PLAYED OUT ════════════════════════════════════════════ */
  function build(spec) {
    const teams = spec.teams;
    const N = teams.length;
    const rw = spec.rw;
    const pt = spec.pt;
    const idx = {}; teams.forEach((t, i) => { idx[t.id] = i; });
    const est = estimate(teams, spec.priors || {}, spec.rw);

    /* Weeks already played, resolved from the real scores — and the same walk
       builds the head-to-head matrix the tiebreak needs. */
    const wp = Math.min.apply(null, teams.map((t) => (t.scores || []).filter((s) => s > 0).length).concat([99]));
    const baseW = new Float64Array(N);
    const basePF = new Float64Array(N);
    const baseH2H = new Int16Array(N * N);
    const fixtures = [];               // [week][ [i, j], … ]
    for (let w = 0; w < rw; w++) {
      const seen = {}; const wk = [];
      for (let i = 0; i < N; i++) {
        const oid = (teams[i].sch || [])[w];
        const j = oid == null ? -1 : idx[oid];
        if (j == null || j === -1 || j === i || seen[i] || seen[j]) continue;
        seen[i] = seen[j] = 1;
        wk.push([i, j]);
      }
      fixtures.push(wk);
      if (w < wp) {
        wk.forEach(([i, j]) => {
          const a = teams[i].scores[w], b = teams[j].scores[w];
          basePF[i] += a; basePF[j] += b;
          if (a > b) { baseW[i]++; baseH2H[i * N + j]++; }
          else if (b > a) { baseW[j]++; baseH2H[j * N + i]++; }
          else { baseW[i] += 0.5; baseW[j] += 0.5; }
        });
      }
    }

    /* Which remaining games belong to the reader — for the what-ifs. */
    const meIdx = spec.me != null && idx[spec.me] != null ? idx[spec.me] : -1;
    const myGames = [];
    for (let w = wp; w < rw; w++) {
      fixtures[w].forEach(([i, j]) => {
        if (i === meIdx || j === meIdx) myGames.push({ w, opp: teams[i === meIdx ? j : i].id });
      });
    }

    const rng = rngOf(spec.seed == null ? 1 : spec.seed);
    const gauss = gaussOf(rng);
    const made = new Float64Array(N);
    /* Conditionals, taken off the SAME sim set rather than by re-running:
       one pass gives every "if you win this one" answer, and they stay
       mutually consistent because they are the same ten thousand seasons. */
    const winCnt = new Float64Array(myGames.length);
    const winMade = new Float64Array(myGames.length);
    const byWins = new Float64Array(myGames.length + 1);
    const byWinsMade = new Float64Array(myGames.length + 1);

    const W = new Float64Array(N), PF = new Float64Array(N);
    const H = new Int16Array(N * N);
    const score = new Float64Array(N);
    const trueMu = new Float64Array(N);
    const order = new Int32Array(N);
    const sims = spec.sims || SIMS;

    for (let s = 0; s < sims; s++) {
      W.set(baseW); PF.set(basePF); H.set(baseH2H);
      let myWins = 0;
      const myWon = [];
      let g = 0;
      /* Each simulated season gets its own draw of what the teams REALLY are,
         then plays weeks out around that. Two sources of uncertainty, kept
         separate: how good a team is, and how it does on a given Sunday. */
      for (let k = 0; k < N; k++) trueMu[k] = est.mu[teams[k].id] + gauss() * est.muSd;
      for (let w = wp; w < rw; w++) {
        for (let k = 0; k < N; k++) score[k] = trueMu[k] + gauss() * est.sigma;
        const wk = fixtures[w];
        for (let f = 0; f < wk.length; f++) {
          const i = wk[f][0], j = wk[f][1];
          const a = score[i], b = score[j];
          PF[i] += a; PF[j] += b;
          if (a > b) { W[i]++; H[i * N + j]++; } else { W[j]++; H[j * N + i]++; }
          if (i === meIdx || j === meIdx) {
            const won = (i === meIdx ? a > b : b > a);
            myWon.push(won); if (won) myWins++;
          }
        }
        g++;
      }
      /* Rank: wins, then head-to-head WITHIN the tied group, then points. */
      for (let k = 0; k < N; k++) order[k] = k;
      const arr = Array.prototype.slice.call(order);
      arr.sort((x, y) => W[y] - W[x] || PF[y] - PF[x]);
      let p = 0;
      while (p < N) {
        let q = p + 1;
        while (q < N && W[arr[q]] === W[arr[p]]) q++;
        if (q - p > 1) {
          const grp = arr.slice(p, q);
          const inGrp = {};
          grp.forEach((t) => {
            let v = 0;
            grp.forEach((u) => { if (u !== t) v += H[t * N + u]; });
            inGrp[t] = v;
          });
          grp.sort((x, y) => inGrp[y] - inGrp[x] || PF[y] - PF[x]);
          for (let z = 0; z < grp.length; z++) arr[p + z] = grp[z];
        }
        p = q;
      }
      for (let k = 0; k < pt; k++) made[arr[k]]++;
      if (meIdx >= 0) {
        const iMade = arr.indexOf(meIdx) < pt ? 1 : 0;
        byWins[myWins]++; byWinsMade[myWins] += iMade;
        for (let k = 0; k < myWon.length; k++) {
          if (myWon[k]) { winCnt[k]++; winMade[k] += iMade; }
        }
      }
    }

    const odds = {};
    teams.forEach((t, i) => { odds[t.id] = (made[i] / sims) * 100; });

    /* What each remaining game is worth: the same ten thousand seasons, split
       by whether the reader won that week. */
    const swings = myGames.map((g, k) => {
      const wN = winCnt[k], lN = sims - winCnt[k];
      return {
        week: g.w + 1, opp: g.opp,
        pWin: (wN / sims) * 100,
        ifWin: wN ? (winMade[k] / wN) * 100 : null,
        ifLose: lN ? ((made[meIdx] - winMade[k]) / lN) * 100 : null,
      };
    });

    /* "You need N of your last M" — the fewest remaining wins that puts the
       reader over even money, read off the same sims. */
    let need = null;
    for (let w = 0; w <= myGames.length; w++) {
      if (byWins[w] >= 25 && byWinsMade[w] / byWins[w] >= 0.5) { need = w; break; }
    }

    /* Remaining strength of schedule, in the model's own units. */
    let sos = null;
    if (meIdx >= 0 && myGames.length) {
      sos = mean(myGames.map((g) => est.mu[g.opp])) - est.lgMean;
    }

    return { odds, est, wp, myGames, swings, need, sos, meIdx, sims };
  }

  window.LeagueOdds = {
    build, priorFor, SEASON_K,
    _estimate: estimate,
    _rng: rngOf,
  };
})();
