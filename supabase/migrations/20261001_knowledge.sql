-- InvestED+ learning loop: owner-fed knowledge, per-answer feedback, anonymous gaps.
-- Postgres full-text search only (no embeddings, nothing leaves the database).

create table if not exists public.app_owners (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.app_owners enable row level security;
revoke all on public.app_owners from anon, authenticated;

create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.app_owners where user_id = auth.uid());
$$;
revoke all on function public.is_owner() from public, anon;
grant execute on function public.is_owner() to authenticated;

create table if not exists public.knowledge_items (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  body text not null check (char_length(body) between 1 and 4000),
  lang text not null check (lang in ('he','en')),
  kind text not null default 'curated' check (kind in ('curated','feed')),
  source_label text not null check (char_length(source_label) between 1 and 200),
  source_url text,
  published_at date,
  created_at timestamptz not null default now(),
  fts tsvector generated always as (to_tsvector('simple', title || ' ' || body)) stored
);
create index if not exists knowledge_items_fts on public.knowledge_items using gin (fts);
alter table public.knowledge_items enable row level security;
revoke all on public.knowledge_items from anon;
grant select on public.knowledge_items to authenticated;
grant insert, update, delete on public.knowledge_items to authenticated;
create policy knowledge_read on public.knowledge_items for select to authenticated using (true);
create policy knowledge_owner_write on public.knowledge_items for all to authenticated using (public.is_owner()) with check (public.is_owner());

create table if not exists public.answer_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  question text not null check (char_length(question) <= 1000),
  rating smallint not null check (rating in (-1, 1)),
  knowledge_ids uuid[] not null default '{}',
  lang text not null default 'en',
  created_at timestamptz not null default now()
);
alter table public.answer_feedback enable row level security;
revoke all on public.answer_feedback from anon;
grant select, insert on public.answer_feedback to authenticated;
create policy feedback_insert_own on public.answer_feedback for insert to authenticated with check (user_id = auth.uid());
create policy feedback_read_own_or_owner on public.answer_feedback for select to authenticated using (user_id = auth.uid() or public.is_owner());

-- No user_id on purpose: gaps are anonymous questions the owner can answer by feeding knowledge.
create table if not exists public.knowledge_gaps (
  id uuid primary key default gen_random_uuid(),
  question text not null check (char_length(question) <= 500),
  lang text not null default 'en',
  reason text not null check (reason in ('no_hit','thumbs_down')),
  created_at timestamptz not null default now()
);
alter table public.knowledge_gaps enable row level security;
revoke all on public.knowledge_gaps from anon;
grant select, insert, delete on public.knowledge_gaps to authenticated;
create policy gaps_insert on public.knowledge_gaps for insert to authenticated with check (true);
create policy gaps_owner_read on public.knowledge_gaps for select to authenticated using (public.is_owner());
create policy gaps_owner_delete on public.knowledge_gaps for delete to authenticated using (public.is_owner());

create or replace function public.search_knowledge(tokens text[], lim int default 3)
returns table (id uuid, title text, body text, lang text, source_label text, source_url text, published_at date, rank real)
language sql stable security invoker set search_path = public as $$
  with q as (
    select to_tsquery('simple', string_agg(quote_literal(t), ' | ')) as tsq
    from unnest(tokens) t where char_length(t) between 2 and 40
  )
  select k.id, k.title, k.body, k.lang, k.source_label, k.source_url, k.published_at, ts_rank(k.fts, q.tsq) as rank
  from public.knowledge_items k, q
  where q.tsq is not null and k.fts @@ q.tsq
  order by rank desc
  limit least(coalesce(lim, 3), 5);
$$;
grant execute on function public.search_knowledge(text[], int) to authenticated;
