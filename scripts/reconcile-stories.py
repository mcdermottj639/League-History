from pathlib import Path
import sys
main=Path(sys.argv[1]); staged=Path(sys.argv[2])
h=(staged/'history.js').read_text(); s=(main/'history.js').read_text()
a=h.index('  /* v145: choose stories'); b=h.index('  /* 🚨 Built PER READER', a)
fragment=h[a:b].replace('v145:','v146:')
fragment=fragment.replace("const games = PLAYOFF_GAMES.filter((g) => g.br === 'W').flatMap((g) =>", "const games = MONEY.flatMap((g) =>")
fragment=fragment.replace("rd === 'R2' ? 'semifinal' : 'final';", "rd === 'R2' ? 'semifinal' : rd === '3RD' ? '3rd-place game' : 'final';")
fragment=fragment.replace("['R1', 'R2', 'FINAL']", "['R1', 'R2', 'FINAL', '3RD']")
fragment=fragment.replace('if (rank <= 2)', 'if (rank <= 3)').replace('championship-bracket', 'money-playoff')
a=s.index('  /* ── nobody gets an empty page'); b=s.index('  /* 🚨 Built PER READER',a)
s=s[:a]+fragment+s[b:]
a=s.index('    /* 🚨 TWO PHASES, AND THE ORDER');b=s.index('    return _stCache;',a)
s=s[:a]+'''    // Curate after detection, with facts and event identities still attached.
    // No worst-stat fallback: a roast never satisfies achievement coverage.
    _stCache = curateStories(keep(emit(DETECT)));
    _stFor = ME;
'''+s[b:]
s=s.replace('  const storiesFor = (m) => stories().filter((x) => x.m === m);', '''  const storiesFor = (m) => {
    const all = stories().filter((x) => x.m === m);
    const lead = all.filter((x) => x.tone === 'positive').slice(0, WANT);
    return lead.concat(all.filter((x) => !lead.includes(x)));
  };''')
s=s.replace('  /* The floor `signature` tops every manager up to (v22). One card stops a\n     page being blank; two is what makes it worth opening. */','  /* Two distinct positive stories lead each established career (v146).\n     Droughts and roasts remain additional stories, never coverage fillers. */')
s=s.replace('Cheap: eighteen strings.', 'The curated stories keep their evidence in every voice.')
s=s.replace('// bigScores explicitly omits records already carried by noPodium.', '// The curator separates achievements from droughts and joins their evidence.')
s=s.replace("pl(e.n, 'championship-bracket game')", "pl(e.n, 'money-playoff game')")
(main/'history.js').write_text(s)
p=main/'storylines.test.cjs';s=p.read_text()
s=s.replace("assert.match(story('Hurd', 'scorer').body, /2 finals, 5 final fours/);", "assert.match(story('Hurd', 'scorer').body, /2013, 2016 and 2018/);\nassert.equal(ALL.find(a => a.m === 'Hurd').fin, 2);\nassert.equal(ALL.find(a => a.m === 'Hurd').f4, 5);")
s=s.replace("assert.match(story('Christel', 'nopod').body, /3rd-highest money-playoff score \\(183.3\\)/);", "assert.match(story('Christel', 'playoff-explosion').head, /183.3/);\nassert.match(story('Christel', 'playoff-explosion').body, /3rd-highest score in money-playoff history/);\nassert.ok(!/183.3/.test(story('Christel', 'nopod').body), 'the highlight is separate from the drought');")
s=s.replace('championship-only samples', 'money-playoff samples')
p.write_text(s)
s=(staged/'storylines-balance.test.cjs').read_text().replace('ALL, SEASON, PLAYOFF_GAMES, CUMBOWL', 'ALL, SEASON, PLAYOFF_GAMES, CUMBOWL, MONEY')
s=s.replace('const g = PLAYOFF_GAMES.find(g => key(g) === e.game);','const g = MONEY.find(g => key(g) === e.game);')
s=s.replace("assert.equal(g.br, 'W', 'no placement/consolation score passes as a playoff record');", "assert.ok(g && (g.br === 'W' || g.rd === '3RD'), 'only title-bracket or third-place games qualify');")
s=s.replace("assert.match(get('Christel', 'playoff-explosion').head, /183.3/);", "assert.match(get('Christel', 'playoff-explosion').head, /183.3/);\nassert.equal(get('Christel', 'playoff-explosion').evidence.rank, 3);\nassert.match(get('Riz', 'playoff-explosion').body, /3rd-place game.*2nd-highest/);\nassert.match(get('Hyman', 'poscore').body, /Next highest: 184.7/);\nassert.equal(MONEY.length, 77);\nassert.equal(H._stats.MEET.length, 77);")
s=s.replace("get('CC', 'collapse')", "get('Zach', 'collapse')")
s=s.replace("assert.ok(!get('Wolff', 'nofinal')", "assert.ok(!get('CC', 'collapse'), 'money-playoff scope changes the scoring-drop leader');\nassert.ok(!get('Wolff', 'nofinal')")
(main/'storylines-balance.test.cjs').write_text(s)
p=main/'scripts/test-release.mjs';s=p.read_text().replace("['storylines.test.cjs'],", "['storylines.test.cjs'],['storylines-balance.test.cjs'],");p.write_text(s)
for name in ['index.html','power.html','sw.js','league.js']:
    p=main/name;s=p.read_text().replace('v=145','v=146').replace("'v145'", "'v146'").replace("'leaguehistory-v145'", "'leaguehistory-v146'");p.write_text(s)
s=(staged/'CLAUDE.md').read_text();a=s.index('## v145 — Stories worth retelling');b=s.index('## v144 —',a)
entry=s[a:b].replace('v145','v146').replace("v144's COUNTED pool", "v145's MONEY pool and Cum Bowl separation")
entry=entry.replace('No archive facts were edited.', 'No archive facts were edited. Playoff scoring uses MONEY (title bracket plus\nthe third-place game), never fifth-place or consolation. Historic-score stories\nrecognize the top three performances; the third-place round is named explicitly.')
p=main/'CLAUDE.md';s=p.read_text();s=s.replace('## v145 — Playoff stats', entry+'## v145 — Playoff stats',1)
s=s.replace('## v90 — Accurate season narratives and member storylines (current state)', '## v90 — Accurate season narratives and member storylines\n\n⚠️ Member-story selection and prose are superseded by v146; the season-data and scoring-scope accuracy rules still apply.')
s=s.replace('    `signature` closes that, and `checks.js` now fails if it ever reopens.', '    ⚠️ SUPERSEDED in v146: `curateStories` replaces `signature` with earned positive coverage; checks still guard against missing managers.')
p.write_text(s)
