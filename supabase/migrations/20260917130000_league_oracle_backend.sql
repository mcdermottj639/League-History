-- Isolated Hurdstradamus data. No Parlay table, role, or policy is reused.
create table if not exists public.oracle_capabilities (
 id uuid primary key default gen_random_uuid(), capability_hash text not null unique check (capability_hash ~ '^[a-f0-9]{64}$'), active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.oracle_editor_sessions (
 id uuid primary key default gen_random_uuid(), capability_id uuid not null references public.oracle_capabilities(id) on delete cascade,
 token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'), expires_at timestamptz not null, created_at timestamptz not null default now()
);
create index if not exists oracle_editor_sessions_capability_id_idx on public.oracle_editor_sessions (capability_id);
create table if not exists public.oracle_weeks (
 week integer primary key check (week between 1 and 18), draft_predictions jsonb not null default '[]'::jsonb, predictions jsonb not null default '[]'::jsonb,
 published boolean not null default false, published_at timestamptz, updated_at timestamptz not null default now()
);
insert into public.oracle_weeks (week)
select week from generate_series(1, 14) as week
on conflict (week) do nothing;
alter table public.oracle_capabilities enable row level security;
alter table public.oracle_editor_sessions enable row level security;
alter table public.oracle_weeks enable row level security;
revoke all on public.oracle_capabilities, public.oracle_editor_sessions, public.oracle_weeks from anon, authenticated;
