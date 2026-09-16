# 🏈 Nectars Bolonga — League History

Thirteen seasons of the league (2013–2025), plus the weekly power rankings.

**→ https://mcdermottj639.github.io/League-History/**

Open it, tap your name, and the whole thing starts talking to you: your
seasons, your medals, your final fours, your Cum Bowls, your row highlighted
wherever it appears. The name you pick is stored on your own phone. Shared parlay picks and
published rankings use Firebase; reading the app needs no account.

### What's in it

- **🏆 Rankings** — the commissioner's set for the week, with a take on every team
- **You** — your thirteen seasons, medals, storylines, and franchises
- **Trophy Case** — champions, title counts, who's still waiting, seeds and upsets, and the champion's curse
- **Record Book** — career standings, league records, playoff PPG, playoff appearances, final fours, and postseason scoring
- **League Lore** — generated storylines, the luck index, and playoff rivalries
- **Cum Bowl** — the last-place game from every season, and who the league's worst really was
  with every final table from 2013 to 2025 underneath

Every finish is mapped to a person and cross-checked against ESPN's own owner
column. Where a number comes from playoff games only, it says so.

Static site — HTML, CSS and vanilla JavaScript, with Firebase for shared data.

Publisher setup: [PUBLISHING_SETUP.md](PUBLISHING_SETUP.md).
Validation: `node checks.js`; install `jsdom` in a separate test directory and
run `NODE_PATH=<test-directory>/node_modules node publishing.test.cjs`. No build step.
