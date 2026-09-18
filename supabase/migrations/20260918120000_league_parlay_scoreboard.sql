-- 🏈 The live score ticker's feed (v113) — PREPARED AND OFF.
--
-- One nullable column with NO default. Applying this migration changes nothing:
-- `scoreboard_url` is null, `collect()` skips its scoreboard step entirely, and
-- no request is made to anything. The feature starts when somebody sets a url
-- here on purpose, and not before.
--
-- It is the FULL url of something serving the scoreboard shape — today that is
-- the Sports-Hub backend's /api/fantasy/football/scoreboard, which is where the
-- ESPN cookies live. The collector polls it (60s while a game is live, 15 min
-- otherwise) and stores the board in the parlay state, so a member's phone
-- reads a row from here instead of waking a sleeping free-tier box.
--
-- ⚠️ The existing `config` rpc is `to_jsonb(c)` over the whole row, so this
-- column reaches the edge function with no change to that function.
alter table league_parlay.config
  add column if not exists scoreboard_url text;

comment on column league_parlay.config.scoreboard_url is
  'Full url of the league scoreboard feed for the ticker. NULL disables collection entirely (the default).';
