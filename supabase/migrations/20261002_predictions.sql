-- InvestED+ prediction ledger. Owner-only via RLS. No anon access. Educational simulation, not advice.
create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  symbol text not null check (symbol ~ '^[A-Z0-9^][A-Z0-9.\-^=]{0,9}$'),
  direction text not null check (direction in ('up','down')),
  confidence int not null check (confidence between 50 and 99),
  horizon_days int not null check (horizon_days between 7 and 365),
  thesis text not null check (char_length(thesis) between 3 and 500),
  created_at timestamptz not null default now(),
  due_date date not null,
  entry_date date not null,
  entry_close numeric not null check (entry_close > 0),
  entry_spy_close numeric not null check (entry_spy_close > 0),
  status text not null default 'open' check (status in ('open','settled')),
  settled_date date,
  exit_close numeric,
  exit_spy_close numeric,
  hit boolean,
  return_pct numeric,
  spy_return_pct numeric
);
create index if not exists predictions_user_created on public.predictions (user_id, created_at desc);
alter table public.predictions enable row level security;
drop policy if exists "own predictions" on public.predictions;
create policy "own predictions" on public.predictions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.predictions from anon;
