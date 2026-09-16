-- Additive only: no Sports-Hub tables, functions, jobs or auth settings change.
create schema league_parlay;
revoke all on schema league_parlay from public, anon, authenticated;
grant usage on schema league_parlay to service_role;

create table league_parlay.state (
 id boolean primary key default true check(id),
 revision bigint not null default 0,
 state jsonb not null default '{"v":2,"seasons":{}}'::jsonb,
 updated_at timestamptz not null default now()
);
insert into league_parlay.state(id) values(true);
create table league_parlay.config (
 id boolean primary key default true check(id),
 year integer not null default 2026,
 launch_week integer not null default 1 check(launch_week between 1 and 18),
 organizer_hash text check(organizer_hash ~ '^[a-f0-9]{64}$'),
 collection_enabled boolean not null default false,
 collector_secret text not null default (gen_random_uuid()::text || gen_random_uuid()::text),
 last_dispatch timestamptz,
 lease_owner text,
 lease_until timestamptz
);
insert into league_parlay.config(id) values(true);
create table league_parlay.sessions (
 hash text primary key check(hash ~ '^[a-f0-9]{64}$'),
 role text not null check(role in ('member','organizer')),
 member text not null,
 expires bigint not null,
 version text not null
);
create table league_parlay.attempts (
 hash text primary key,
 bucket bigint not null,
 attempts integer not null
);
create table league_parlay.backups (
 name text primary key,
 revision bigint not null,
 state jsonb not null,
 created_at timestamptz not null default now()
);
alter table league_parlay.state enable row level security;
alter table league_parlay.config enable row level security;
alter table league_parlay.sessions enable row level security;
alter table league_parlay.attempts enable row level security;
alter table league_parlay.backups enable row level security;
revoke all on all tables in schema league_parlay from public, anon, authenticated;
grant select,insert,update,delete on league_parlay.state,league_parlay.config,league_parlay.sessions,league_parlay.attempts to service_role;
grant select,insert on league_parlay.backups to service_role;

-- Invoker, not definer. Only service_role can execute or access the private
-- tables. Browser sessions are verified in the Edge handler, never passed here.
create function public.league_parlay_rpc(op text,args jsonb default '{}'::jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare out jsonb; n integer; minute bigint:=floor(extract(epoch from clock_timestamp())/60); ms bigint:=floor(extract(epoch from clock_timestamp())*1000);
begin
 case op
 when 'config' then select to_jsonb(c) into out from league_parlay.config c where id;
 when 'read' then select jsonb_build_object('revision',revision,'state',state) into out from league_parlay.state where id;
 when 'commit' then
  if args ? 'lease' and not exists(select 1 from league_parlay.config where id and lease_owner=args->>'lease' and lease_until>clock_timestamp()) then return 'false'::jsonb; end if;
  if jsonb_typeof(args->'state'->'seasons') is distinct from 'object' or octet_length((args->'state')::text)>10000000 then raise exception 'Invalid state'; end if;
  update league_parlay.state set state=args->'state',revision=revision+1,updated_at=now() where id and revision=(args->>'revision')::bigint;
  get diagnostics n=row_count;return to_jsonb(n=1);
 when 'session' then select to_jsonb(s) into out from league_parlay.sessions s where hash=args->>'hash' and expires>ms;
 when 'add_session' then
  delete from league_parlay.sessions where expires<ms;
  insert into league_parlay.sessions(hash,role,member,expires,version) values(args->>'hash',args->>'role',args->>'member',(args->>'expires')::bigint,args->>'version');out:='true';
 when 'limit' then
  delete from league_parlay.attempts where bucket<minute-2;
  insert into league_parlay.attempts(hash,bucket,attempts) values(args->>'hash',minute,1)
  on conflict(hash) do update set attempts=case when league_parlay.attempts.bucket=excluded.bucket then league_parlay.attempts.attempts+1 else 1 end,bucket=excluded.bucket
  returning attempts into n;return to_jsonb(n<=40);
 when 'lease' then
  update league_parlay.config set lease_owner=args->>'owner',lease_until=clock_timestamp()+interval '120 seconds' where id and (lease_until is null or lease_until<clock_timestamp());
  get diagnostics n=row_count;return to_jsonb(n=1);
 when 'release_lease' then
  update league_parlay.config set lease_owner=null,lease_until=null where id and lease_owner=args->>'owner';out:='true';
 when 'backup' then
  insert into league_parlay.backups(name,revision,state) select args->>'name',revision,state from league_parlay.state where id;
  select to_jsonb(b) into out from league_parlay.backups b where name=args->>'name';
 when 'get_backup' then select to_jsonb(b) into out from league_parlay.backups b where name=args->>'name';
 else raise exception 'Unsupported operation';
 end case;
 return out;
end $$;
revoke all on function public.league_parlay_rpc(text,jsonb) from public,anon,authenticated;
grant execute on function public.league_parlay_rpc(text,jsonb) to service_role;

-- Cron stays inactive until the prepared function has been verified.
create function league_parlay.dispatch() returns void language plpgsql security invoker set search_path = '' as $$
declare cfg league_parlay.config%rowtype; doc jsonb; busy boolean; request_id bigint;
begin
 select * into cfg from league_parlay.config where id for update;
 if not cfg.collection_enabled then return; end if;
 select state into doc from league_parlay.state where id;
 select exists(
  select 1 from jsonb_each(coalesce(doc->'seasons'->(cfg.year::text)->'weeks','{}')) w,
   jsonb_array_elements(coalesce(w.value->'games','[]')) g
  where g->>'state'='in' or ((g->>'kick')::numeric/1000 between extract(epoch from now())-3600 and extract(epoch from now())+1800)
 ) into busy;
 if cfg.last_dispatch is not null and cfg.last_dispatch>now()-(case when busy then interval '25 seconds' else interval '295 seconds' end) then return; end if;
 select net.http_post(
  url:='https://oqrfdhoyyogjmiqmjhnp.supabase.co/functions/v1/league-parlay/collect',
  headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||cfg.collector_secret),
  body:='{}'::jsonb,timeout_milliseconds:=60000
 ) into request_id;
 update league_parlay.config set last_dispatch=now() where id;
end $$;
revoke all on function league_parlay.dispatch() from public,anon,authenticated;
select cron.schedule('league-parlay-collect','30 seconds','select league_parlay.dispatch();');
select cron.alter_job(jobid,active:=false) from cron.job where jobname='league-parlay-collect';
