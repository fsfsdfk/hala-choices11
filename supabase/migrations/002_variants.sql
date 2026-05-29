-- ============================================
-- Migration 002: Item Variants
-- Run this AFTER 001_initial.sql
-- ============================================

-- Table: item_variants
-- Each variant is a selectable option for an item (e.g. "Black / Size M")
create table if not exists public.item_variants (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references public.items(id) on delete cascade,
  label       text not null,           -- e.g. "Black / Size M"
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- Allow public read on variants (Hala can see them)
alter table public.item_variants enable row level security;

create policy "Public can read item_variants"
  on public.item_variants for select
  using (true);

-- Admin writes use service role (bypasses RLS)

-- Add optional variant_id to choices
-- A choice without a variant_id = the item itself (no variants defined)
-- A choice with a variant_id = one specific variant was chosen
alter table public.choices
  add column if not exists variant_id uuid references public.item_variants(id) on delete cascade;

-- Drop the old unique constraint (one choice per item) — now it's one choice per variant
drop index if exists choices_item_id_unique;

-- New constraint: one choice per (item_id, variant_id) pair
-- variant_id can be NULL (for items without variants), so we use a partial unique index
create unique index if not exists choices_item_variant_unique
  on public.choices(item_id, variant_id)
  where variant_id is not null;

create unique index if not exists choices_item_no_variant_unique
  on public.choices(item_id)
  where variant_id is null;

-- Realtime for variants
alter publication supabase_realtime add table public.item_variants;
