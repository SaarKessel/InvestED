-- InvestED+ Phase 4 memory (docs/architecture/PHASE4_DB_PROPOSAL.md). Owner-only via RLS. No anon access.
create table if not exists public.memory_consent (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
create table if not exists public.user_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  kind text not null check (char_length(kind) <= 40),
  key text not null check (char_length(key) <= 80),
  value jsonb not null,
  source text not null default 'user' check (char_length(source) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, kind, key)
);
create table if not exists public.saved_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  question text not null check (char_length(question) <= 300),
  answer text not null check (char_length(answer) <= 4000),
  created_at timestamptz not null default now()
);
create index if not exists user_memory_user on public.user_memory (user_id, kind);
create index if not exists saved_answers_user_created on public.saved_answers (user_id, created_at desc);

alter table public.memory_consent enable row level security;
alter table public.user_memory enable row level security;
alter table public.saved_answers enable row level security;

drop policy if exists "own consent" on public.memory_consent;
create policy "own consent" on public.memory_consent for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
-- memory rows may only be written while the user's consent switch is on
drop policy if exists "own memory read" on public.user_memory;
create policy "own memory read" on public.user_memory for select to authenticated using (user_id = auth.uid());
drop policy if exists "own memory write" on public.user_memory;
create policy "own memory write" on public.user_memory for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.memory_consent c where c.user_id = auth.uid() and c.enabled));
drop policy if exists "own memory update" on public.user_memory;
create policy "own memory update" on public.user_memory for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and exists (select 1 from public.memory_consent c where c.user_id = auth.uid() and c.enabled));
drop policy if exists "own memory delete" on public.user_memory;
create policy "own memory delete" on public.user_memory for delete to authenticated using (user_id = auth.uid());
drop policy if exists "own saved answers" on public.saved_answers;
create policy "own saved answers" on public.saved_answers for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on public.memory_consent, public.user_memory, public.saved_answers from anon;
grant select, insert, update, delete on public.memory_consent, public.user_memory, public.saved_answers to authenticated;
