-- ============================================
-- Migration 003: Chat messages
-- Run this AFTER 002_variants.sql
-- ============================================

create table if not exists public.chat_messages (
  id           uuid primary key default gen_random_uuid(),
  sender       text not null check (sender in ('admin', 'hala')),
  content      text not null,
  created_at   timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

create policy "Public can read chat_messages"
  on public.chat_messages for select
  using (true);

create policy "Public can insert chat_messages"
  on public.chat_messages for insert
  with check (true);

-- Realtime for chat
alter publication supabase_realtime add table public.chat_messages;
