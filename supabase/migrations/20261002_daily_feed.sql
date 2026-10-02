-- Daily intelligence feed: one row per day and kind, written only by the scheduled job (service role).
-- Anyone may read it; nobody but the service role may write it (no insert/update/delete policies).
create table if not exists public.daily_feed (
  feed_date date not null,
  kind text not null check (kind in ('market_movers', 'headlines')),
  payload jsonb not null,
  source text not null,
  fetched_at timestamptz not null default now(),
  primary key (feed_date, kind)
);
alter table public.daily_feed enable row level security;
drop policy if exists "daily_feed_read" on public.daily_feed;
create policy "daily_feed_read" on public.daily_feed for select to anon, authenticated using (true);
