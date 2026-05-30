-- ============================================
-- Migration 003: Chat Reactions & Item Notes/Reactions
-- ============================================

-- Add reactions column to chat_messages
-- Stored as JSONB: { "💕": ["hala"], "😍": ["admin", "hala"] }
alter table public.chat_messages
  add column if not exists reactions jsonb not null default '{}';

-- Table: item_reactions
-- Hala can leave emoji reactions and/or a personal note on any item
create table if not exists public.item_reactions (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references public.items(id) on delete cascade,
  emoji       text,             -- null if only a note
  note        text,             -- null if only an emoji
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- One reaction row per item (upsert)
create unique index if not exists item_reactions_item_id_unique on public.item_reactions(item_id);

alter table public.item_reactions enable row level security;

create policy "Public can read item_reactions"
  on public.item_reactions for select using (true);

create policy "Public can insert item_reactions"
  on public.item_reactions for insert with check (true);

create policy "Public can update item_reactions"
  on public.item_reactions for update using (true);

create policy "Public can delete item_reactions"
  on public.item_reactions for delete using (true);

-- Realtime
alter publication supabase_realtime add table public.item_reactions;
