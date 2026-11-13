  /* v145: choose stories, not whichever ranking is furthest from the middle.
     Two independent achievements lead each profile. Notable droughts stay;
     two cards retelling one season, or one recurring failure, do not.
     All criteria are league-wide. No manager-specific overrides or prose. */
  function curateStories(detected) {
    const exact = (v) => Number(v.toFixed(2)).toString();
    const seasonClaim = (yr) => `season:${yr}`;
    const history = [...SEASON].sort((a, b) => a.yr - b.yr);
    const rowAt = (yr, m) => SEASON.find((s) => s.yr === yr)?.rows.find((r) => r.mgr === m);
    const games = PLAYOFF_GAMES.filter((g) => g.br === 'W').flatMap((g) =>
      [[g.a, g.as, g.b, g.bs], [g.b, g.bs, g.a, g.as]].flatMap(([team, score, opponent, against]) => {
        const m = mgrAt(g.yr, team), opp = mgrAt(g.yr, opponent);
        return m && MGRS[m] ? [{ m, opp, opponent, yr: g.yr, rd: g.rd, score, against,
          won: score > against, margin: +(score - against).toFixed(2),
          key: `${g.yr}|${g.rd}|${[g.a, g.b].sort().join('|')}` }] : [];
      }));
    const opponentName = (g) => g.opp ? nm(g.opp) : realNm(mgrRaw(g.opponent) || g.opponent);
    const round = (rd) => rd === 'R1' ? 'opening round' : rd === 'R2' ? 'semifinal' : 'final';
    const chronological = (list) => [...list].sort((a, b) =>
      a.yr - b.yr || ['R1', 'R2', 'FINAL'].indexOf(a.rd) - ['R1', 'R2', 'FINAL'].indexOf(b.rd));
    const positives = new Set(['w2f', 'floor', 'rises', 'deep', 'perfectfinals', 'scorer', 'poscore']);
    const out = [];
    detected.forEach((old) => {
      const a = MGRS[old.m];
      // The Luck Index still owns these diagnostics. They are not a punchline.
      if (['lucky', 'unlucky'].includes(old.id)) return;
      if (old.id === 'stuck' && detected.some((x) => x.m === old.m && x.id === 'cbking')) return;
      if (old.id === 'nofinal' && detected.some((x) => x.m === old.m && x.id === 'ringless')) return;
      const s = { ...old, tone: positives.has(old.id) ? 'positive' : 'roast',
        claims: [`career:${old.t || old.id}:${old.id}`], evidence: { kind: old.id } };
      if (s.id === 'w2f') {
        const years = a.yrs.filter((r) => r.place === 1 && rowAt(r.yr - 1, a.m)?.place >=
          (SEASON.find((x) => x.yr === r.yr - 1)?.rows.length || Infinity) - 3).map((r) => r.yr);
        s.claims = years.map(seasonClaim); s.evidence.years = years;
      }
      if (s.id === 'scorer') {
        const years = history.filter((season) => {
          const mine = season.rows.find((r) => r.mgr === a.m);
          return mine && mine.ppg === Math.max(...season.rows.map((r) => r.ppg));
        }).map((x) => x.yr);
        s.head = `${nm(a.m)}: ${pl(years.length, 'scoring title')}. Plenty of receipts.`;
        s.body = `Led the regular season in points per game in ${listTxt(years.map(String))}. ` +
          (Object.values(ST.scoring).filter((n) => n === years.length).length > 1 ? 'Joint-most in the archive.' : 'The most in the archive.');
        s.w = 74; s.evidence.years = years;
      }
      if (s.id === 'deep' && detected.some((x) => x.m === s.m && x.id === 'perfectfinals')) {
        s.body = `Only ${plWord(a.po - a.f4, 'playoff trip')} ended short of the semifinals.`;
      }
      if (s.id === 'floor') {
        s.body = `Across ${pl(a.seasons, 'season')}. Championship appearances in ${listTxt(a.yrs.filter((r) => r.place <= 2).map((r) => String(r.yr)).sort())}.`;
        if (!a.fin) s.body = `Across ${pl(a.seasons, 'season')}. The basement has never been part of the itinerary.`;
      }
      if (s.id === 'poscore') {
        const peak = ST.poScores.find((x) => x.m === a.m);
        const g = peak && games.find((x) => x.m === a.m && x.yr === peak.yr && x.score === peak.v);
        if (g) {
          s.claims = [seasonClaim(g.yr)]; s.evidence = { kind: 'playoff-score', game: g.key, score: g.score, year: g.yr };
          const shared = ST.poScores.filter((x) => x.v === peak.v).length > 1;
          if (!shared && g.won && g.opp) {
            s.head = `${nm(a.m)}: ${exact(g.score)}. ${nm(g.opp)} ${vb(g.opp, 'were', 'was')} also there.`;
            const next = ST.poScores.find((x) => x.v < g.score);
            s.body = `${g.yr} ${round(g.rd)}: a ${exact(g.margin)}-point win and the championship-bracket scoring record.` +
              (next ? ` Next highest: ${exact(next.v)}.` : '');
          }
          s.w = 94;
        }
      }
      if (s.id === 'cbking') {
        s.head = `${nm(a.m)}: the Cum Bowl has a regular.`;
        const most = leaders(ALL.filter((x) => x.cbA), (x) => x.cbA);
        const losses = leaders(ALL.filter((x) => x.cb), (x) => x.cb);
        s.body = `${pl(a.cbA, 'appearance')} and ${pl(a.cb, 'loss', 'losses')}. ` +
          `${most.length > 1 ? 'Joint-most appearances' : 'The appearance record'}` +
          (losses.some((x) => x.m === a.m) ? `, ${losses.length > 1 ? 'joint-most losses' : 'and the loss record'}.` : '.');
        s.claims = ['roast:basement'];
      }
      if (s.id === 'nopod') {
        s.head = `${nm(a.m)}: the podium is still playing hard to get.`;
        s.body = old.body.split('. ')[0] + (old.body.includes('. ') ? '.' : '');
        s.claims = ['roast:podium'];
      }
      if (s.id === 'ringless') {
        s.head = `${nm(a.m)}: ${a.w} wins. Still no parade.`;
        const top = leaders(ALL, (x) => x.pct);
        s.body = `${(a.pct * 100).toFixed(1)}% regular-season wins` +
          (top.some((x) => x.m === a.m) ? ` — ${top.length > 1 ? 'joint-best' : 'best'} in the league.` : ', leading the titleless managers.') +
          ` ${pl(a.f4, 'final four')}, ${pl(a.fin, 'final')}. The championship is still outstanding.`;
        s.claims = ['roast:title-drought'];
      }
      if (s.id === 'collapse') s.head = `${nm(a.m)}: December keeps changing the password.`;
      out.push(s);
    });

    const moments = [], supporting = [];
    const add = (list, a, id, weight, head, body, years, evidence, claims) => list.push({
      id, m: a.m, t: 'moment', w: weight,
      src: evidence.kind === 'statement-season' ? 'reg' : ['playoff-score', 'title-escape'].includes(evidence.kind) ? 'po' : 'mix',
      tone: 'positive', head, body,
      claims: claims || years.map(seasonClaim), evidence: { ...evidence, years }
    });
    ALL.forEach((a) => {
      const mine = games.filter((g) => g.m === a.m);
      // A historic playoff explosion stands on its own, not inside a drought.
      const peak = [...mine].filter((g) => g.won).sort((x, y) => y.score - x.score || x.yr - y.yr)[0];
      if (peak && !out.some((x) => x.m === a.m && x.id === 'poscore')) {
        const rank = 1 + ST.poScores.filter((x) => x.v > peak.score).length;
        const shared = ST.poScores.filter((x) => x.v === peak.score).length > 1;
        if (rank <= 2) add(moments, a, 'playoff-explosion', 93,
          `${nm(a.m)} dropped ${exact(peak.score)} when it counted.`,
          `${peak.yr} ${round(peak.rd)}: beat ${opponentName(peak)} by ${exact(peak.margin)}. ` +
          `${shared ? 'Joint ' : ''}${ord(rank)}-highest score in championship-bracket history.`,
          [peak.yr], { kind: 'playoff-score', game: peak.key, score: peak.score, rank });
      }
      a.yrs.filter((r) => r.place <= 2).forEach((r) => {
        const run = chronological(mine.filter((g) => g.yr === r.yr));
        const final = run.find((g) => g.rd === 'FINAL');
        if (!final) return; // A finish is not evidence of an unseen game.
        const wins = run.filter((g) => g.won);
        const previous = rowAt(r.yr - 1, a.m);
        const priorCB = CUMBOWL.find((c) => c.yr === r.yr - 1 && [c.s11, c.s12].some((t) => mgrAt(c.yr, t) === a.m));
        if (r.place === 1 && final.won) {
          const narrow = [...wins].filter((g) => g.rd !== 'FINAL' && g.margin > 0 && g.margin <= 1)
            .sort((x, y) => x.margin - y.margin)[0];
          if (narrow) add(moments, a, 'title-escape', 99,
            `${nm(a.m)}: a title run saved by ${narrow.margin.toFixed(2)} points.`,
            `${r.yr}: edged ${opponentName(narrow)} ${exact(narrow.score)}–${exact(narrow.against)} in the ${round(narrow.rd)}, ` +
            `then beat ${opponentName(final)} ${exact(final.score)}–${exact(final.against)} for the title.`,
            [r.yr], { kind: 'title-escape', game: narrow.key, margin: narrow.margin, final: final.key });
          if (r.seed === 6 && wins.length === 3) add(moments, a, 'six-seed-title', 98,
            `${nm(a.m)}: the six-seed heist.`,
            `${r.yr}: entered ${r.w}-${r.l}, then beat ${listTxt(wins.map(opponentName))}. ` +
            `The championship was settled ${exact(final.score)}–${exact(final.against)}.`,
            [r.yr], { kind: 'six-seed-title', wins: wins.map((g) => g.key), seed: r.seed });
          if (final.margin >= 35) add(moments, a, 'final-fireworks', 92,
            `${nm(a.m)} won the final by ${exact(final.margin)}. No suspense.`,
            `${r.yr}: ${exact(final.score)}–${exact(final.against)} against ${opponentName(final)}.` +
            (previous?.place === 1 ? ' Back-to-back championships, signed and sealed.' : ' A championship game without the late drama.'),
            [r.yr], { kind: 'final-fireworks', game: final.key, margin: final.margin });
        }
        if (r.place === 2 && !final.won) {
          if (priorCB) add(moments, a, 'bowl-to-final', 87,
            `${nm(a.m)}: different bowl. Different year.`,
            `${r.yr - 1}: ${priorCB.recon ? 'the reconstructed Cum Bowl' : 'the Cum Bowl'}. ` +
            `${r.yr}: a ${r.w}-${r.l} regular season and a place in the championship game.`,
            [r.yr - 1, r.yr], { kind: 'bowl-to-final', final: final.key });
          if (r.seed === 6 && wins.length === 2) add(moments, a, 'six-seed-final', 89,
            `${nm(a.m)}: the six seed was not a courtesy invite.`,
            `${r.yr}: entered ${r.w}-${r.l}, then knocked out ${listTxt(wins.map(opponentName))} to reach the championship game.`,
            [r.yr], { kind: 'six-seed-final', seed: r.seed, wins: wins.map((g) => g.key), final: final.key });
        }
      });

      // Strong career chapters supply coverage, never a bottom-ranked fallback.
      const best = [...a.yrs].filter((r) => r.w + r.l > 0)
        .sort((x, y) => y.pct - x.pct || y.w - x.w || x.yr - y.yr)[0];
      if (best && best.pct >= 0.7) {
        const whole = SEASON.flatMap((s) => s.rows);
        const highest = Math.max(...whole.map((r) => r.pct));
        const ties = whole.filter((r) => r.pct === highest).length;
        add(supporting, a, 'statement-season', 63 + (best.pct === highest ? 5 : 0),
          `${nm(a.m)} went ${best.w}-${best.l}. This was not a drill.`,
          `${best.yr}` + (best.seed ? `: the No. ${best.seed} seed.` : ': a standout regular season.') +
          (best.pct === highest ? ` ${ties > 1 ? 'Joint-best' : 'Best'} regular-season win rate in the archive.` :
            ` Won ${(best.pct * 100).toFixed(1)}% of the regular-season games.`),
          [best.yr], { kind: 'statement-season', wins: best.w, losses: best.l });
      }
      const runs = []; let current = [];
      [...a.yrs].sort((x, y) => x.yr - y.yr).forEach((r) => {
        if (r.place && r.place <= PO_CUT) {
          if (current.length && r.yr !== current[current.length - 1].yr + 1) { runs.push(current); current = []; }
          current.push(r);
        } else { if (current.length) runs.push(current); current = []; }
      });
      if (current.length) runs.push(current);
      const streak = runs.sort((x, y) => y.length - x.length || x[0].yr - y[0].yr)[0];
      if (streak?.length >= 4) {
        const first = streak[0].yr, last = streak[streak.length - 1].yr;
        add(supporting, a, 'playoff-streak', 69,
          `${nm(a.m)} booked ${WORD[streak.length] || streak.length} straight playoff trips.`,
          `${first}–${last}: a postseason place every year, with a combined ${streak.reduce((n, r) => n + r.w, 0)}–${streak.reduce((n, r) => n + r.l, 0)} regular-season record.`,
          streak.map((r) => r.yr), { kind: 'playoff-streak', count: streak.length }, [`streak:${first}:${last}`]);
      }
    });
    const rank = (x, y) => y.w - x.w || x.id.localeCompare(y.id) || x.m.localeCompare(y.m);
    const overlaps = (s, kept) => kept.some((x) => x.m === s.m && x.claims.some((k) => s.claims.includes(k)));
    // One signature playoff moment per manager, beyond existing distinct finds.
    // This is a topic rule, not a cap on the total number of profile stories.
    ALL.forEach((a) => {
      const moment = moments.filter((x) => x.m === a.m && !overlaps(x, out)).sort(rank)[0];
      if (moment) out.push(moment);
      for (const s of supporting.filter((x) => x.m === a.m).sort(rank)) {
        if (out.filter((x) => x.m === a.m && x.tone === 'positive').length >= WANT) break;
        if (!overlaps(s, out)) out.push(s);
      }
    });
    return out.sort(rank);
  }
