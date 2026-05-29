-- ============================================
-- Hala's Choices — Supabase Migration
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ============================================
-- Table: items
-- ============================================
create table if not exists public.items (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  price        numeric(10, 2) not null default 0,
  category     text not null default 'Other',
  healthy      boolean not null default false,
  image_urls   text[] not null default '{}',
  created_at   timestamptz not null default now()
);

-- ============================================
-- Table: choices
-- ============================================
create table if not exists public.choices (
  id             uuid primary key default gen_random_uuid(),
  item_id        uuid not null references public.items(id) on delete cascade,
  hala_approved  boolean not null,
  chosen_at      timestamptz not null default now()
);

-- Only one choice per item (upsert pattern)
create unique index if not exists choices_item_id_unique on public.choices(item_id);

-- ============================================
-- Row Level Security
-- ============================================
alter table public.items enable row level security;
alter table public.choices enable row level security;

-- Allow public read on items (Hala can see them)
create policy "Public can read items"
  on public.items for select
  using (true);

-- Allow public read on choices
create policy "Public can read choices"
  on public.choices for select
  using (true);

-- Allow public insert/update on choices (Hala approves/disapproves)
create policy "Public can insert choices"
  on public.choices for insert
  with check (true);

create policy "Public can update choices"
  on public.choices for update
  using (true);

-- Admin writes to items use service role key (bypasses RLS)
-- so no additional policy needed for INSERT/UPDATE/DELETE on items

-- ============================================
-- Storage bucket for item images
-- ============================================
insert into storage.buckets (id, name, public)
values ('item-images', 'item-images', true)
on conflict (id) do nothing;

-- Allow public read on item-images bucket
create policy "Public can read item images"
  on storage.objects for select
  using (bucket_id = 'item-images');

-- Allow service role full access (admin uploads)
create policy "Service role can manage item images"
  on storage.objects for all
  using (bucket_id = 'item-images');

-- ============================================
-- Realtime
-- ============================================
-- Enable realtime for choices table so admin sees live updates
alter publication supabase_realtime add table public.choices;
alter publication supabase_realtime add table public.items;

-- ============================================
-- Seed data (optional — remove if not needed)
-- ============================================
-- insert into public.items (name, description, price, category, healthy, image_urls) values
--   ('Example Item', 'A lovely example gift', 99.99, 'Jewelry', false, '{}');

-- Allow public DELETE on choices (needed for undo / re-choice)
-- Without this, the anon key cannot delete rows and undo silently fails.
create policy if not exists "Public can delete choices"
  on public.choices for delete
  using (true);
