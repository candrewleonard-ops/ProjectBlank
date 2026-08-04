-- ============================================================================
-- Portal upgrade — run this ONCE in the Supabase SQL Editor of the LIVE project
-- (SQL Editor -> New query -> paste this whole file -> Run). Safe to re-run.
--
-- Adds: current-focus + Google Drive link on deals, per-deal investor
-- inquiries, and fixes public (logged-out) browsing which the frontend
-- already allows but the database rules were still blocking.
-- ============================================================================

-- New deal fields ------------------------------------------------------------
alter table public.deals add column if not exists current_focus text;
alter table public.deals add column if not exists drive_url text;

-- Public read access ---------------------------------------------------------
-- The site lets visitors browse deals without signing in; these policies make
-- the database agree. Documents/invoices stay sign-in-only on purpose.
drop policy if exists "deals: read all authenticated" on public.deals;
drop policy if exists "deals: public read" on public.deals;
create policy "deals: public read" on public.deals
  for select using (true);

drop policy if exists "deal_tasks: read all authenticated" on public.deal_tasks;
drop policy if exists "deal_tasks: public read" on public.deal_tasks;
create policy "deal_tasks: public read" on public.deal_tasks
  for select using (true);

drop policy if exists "deal_media: read all authenticated" on public.deal_media;
drop policy if exists "deal_media: public read" on public.deal_media;
create policy "deal_media: public read" on public.deal_media
  for select using (true);

-- Investor inquiries ---------------------------------------------------------
create table if not exists public.deal_inquiries (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals (id) on delete cascade,
  name text not null,
  email text,
  phone text,
  message text,
  user_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint inquiry_has_contact check (
    coalesce(nullif(trim(email), ''), nullif(trim(phone), '')) is not null
  )
);

alter table public.deal_inquiries enable row level security;

-- Anyone (signed in or not) can submit an inquiry; only admins can read them.
drop policy if exists "deal_inquiries: public insert" on public.deal_inquiries;
create policy "deal_inquiries: public insert" on public.deal_inquiries
  for insert with check (true);

drop policy if exists "deal_inquiries: admin read" on public.deal_inquiries;
create policy "deal_inquiries: admin read" on public.deal_inquiries
  for select to authenticated using (public.is_admin());

drop policy if exists "deal_inquiries: admin delete" on public.deal_inquiries;
create policy "deal_inquiries: admin delete" on public.deal_inquiries
  for delete to authenticated using (public.is_admin());

create index if not exists deal_inquiries_deal_id_idx
  on public.deal_inquiries (deal_id, created_at desc);
