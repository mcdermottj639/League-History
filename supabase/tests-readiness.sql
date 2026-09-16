-- Read-only verification of prepared tables/permissions/jobs. No private rows.
select
 has_function_privilege('anon','public.league_parlay_rpc(text,jsonb)','execute') as anon_rpc,
 has_function_privilege('authenticated','public.league_parlay_rpc(text,jsonb)','execute') as member_rpc,
 has_table_privilege('anon','league_parlay.state','select') as anon_state,
 has_table_privilege('authenticated','league_parlay.sessions','select') as member_sessions;
select jobname,schedule,active from cron.job where jobname in ('league-parlay-collect','sports-hub-ai-capture');
select year,launch_week,collection_enabled,organizer_hash is not null as organizer_configured from league_parlay.config;
-- Rollback-only atomicity/lease/backup test. No persistent fixture data.
begin;
set local role service_role;
do $$
declare r bigint; snapshot jsonb; b jsonb;
begin
 snapshot:=public.league_parlay_rpc('read');r:=(snapshot->>'revision')::bigint;
 assert public.league_parlay_rpc('commit',jsonb_build_object('revision',r,'state',snapshot->'state'))='true'::jsonb;
 assert public.league_parlay_rpc('commit',jsonb_build_object('revision',r,'state',snapshot->'state'))='false'::jsonb;
 -- Run with collection disabled, so no existing collector owns a lease.
 assert public.league_parlay_rpc('lease','{"owner":"qa-only-one"}')='true'::jsonb;
 assert public.league_parlay_rpc('lease','{"owner":"qa-only-two"}')='false'::jsonb;
 assert public.league_parlay_rpc('commit',jsonb_build_object('revision',r+1,'lease','qa-only-two','state',snapshot->'state'))='false'::jsonb;
 b:=public.league_parlay_rpc('backup',jsonb_build_object('name','qa-'+gen_random_uuid()::text));
 assert b=public.league_parlay_rpc('get_backup',jsonb_build_object('name',b->>'name'));
end $$;
rollback;
