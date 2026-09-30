-- InvestED+ chat history: one row per conversation and per message, owner-only via RLS.
create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  title text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  role text not null check (role in ('user','copilot')),
  text text not null check (char_length(text) <= 8000),
  created_at timestamptz not null default now()
);
create index if not exists chat_conversations_user_updated on public.chat_conversations (user_id, updated_at desc);
create index if not exists chat_messages_conversation_created on public.chat_messages (conversation_id, created_at);

alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "own conversations" on public.chat_conversations;
create policy "own conversations" on public.chat_conversations for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "own messages" on public.chat_messages;
create policy "own messages" on public.chat_messages for all to authenticated
  using (user_id = auth.uid()) with check (
    user_id = auth.uid() and exists (select 1 from public.chat_conversations c where c.id = conversation_id and c.user_id = auth.uid()));

revoke all on public.chat_conversations, public.chat_messages from anon;
grant select, insert, update, delete on public.chat_conversations, public.chat_messages to authenticated;
