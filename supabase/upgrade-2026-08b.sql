-- ============================================================================
-- Portal upgrade 2 — run ONCE in the Supabase SQL Editor (safe to re-run).
-- Adds: property specs, partnered deals, per-deal visibility + email access
-- grants, email subscribers, spreadsheet documents, reserves need no schema.
-- Also seeds six deal templates.
-- ============================================================================

-- New deal fields ------------------------------------------------------------
alter table public.deals add column if not exists bedrooms integer;
alter table public.deals add column if not exists bathrooms text;
alter table public.deals add column if not exists square_feet integer;
alter table public.deals add column if not exists garage text;
alter table public.deals add column if not exists is_partnered boolean not null default false;
alter table public.deals add column if not exists partner_name text;
alter table public.deals add column if not exists is_public boolean not null default false;

-- Anything that existed before this upgrade stays visible (status quo);
-- deals created after this default to private until you tick "public".
update public.deals set is_public = true where is_public = false;

-- Spreadsheet documents ------------------------------------------------------
alter table public.deal_documents drop constraint if exists deal_documents_doc_type_check;
alter table public.deal_documents
  add constraint deal_documents_doc_type_check check (doc_type in ('pdf', 'invoice', 'sheet'));

-- Email subscribers (the email-capture popup) --------------------------------
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  wants_deal_emails boolean not null default true,
  wants_live_updates boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.subscribers enable row level security;

drop policy if exists "subscribers: public insert" on public.subscribers;
create policy "subscribers: public insert" on public.subscribers
  for insert with check (true);

drop policy if exists "subscribers: admin read" on public.subscribers;
create policy "subscribers: admin read" on public.subscribers
  for select to authenticated using (public.is_admin());

drop policy if exists "subscribers: admin update" on public.subscribers;
create policy "subscribers: admin update" on public.subscribers
  for update to authenticated using (public.is_admin());

drop policy if exists "subscribers: admin delete" on public.subscribers;
create policy "subscribers: admin delete" on public.subscribers
  for delete to authenticated using (public.is_admin());

-- Per-deal access grants, keyed by email -------------------------------------
-- A grant applies the moment someone signs in with that email address.
create table if not exists public.deal_access (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  unique (deal_id, email)
);

alter table public.deal_access enable row level security;

drop policy if exists "deal_access: admin all" on public.deal_access;
create policy "deal_access: admin all" on public.deal_access
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Visibility helper ----------------------------------------------------------
create or replace function public.deal_is_visible(d uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_admin()
      or exists (select 1 from public.deals where id = d and is_public)
      or exists (
        select 1 from public.deal_access a
        where a.deal_id = d
          and lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      );
$$;

-- Replace read policies with visibility-aware ones ---------------------------
drop policy if exists "deals: public read" on public.deals;
drop policy if exists "deals read" on public.deals;
drop policy if exists "deals: visible read" on public.deals;
create policy "deals: visible read" on public.deals
  for select using (public.deal_is_visible(id));

drop policy if exists "deal_tasks: public read" on public.deal_tasks;
drop policy if exists "tasks read" on public.deal_tasks;
drop policy if exists "deal_tasks: visible read" on public.deal_tasks;
create policy "deal_tasks: visible read" on public.deal_tasks
  for select using (public.deal_is_visible(deal_id));

drop policy if exists "deal_media: public read" on public.deal_media;
drop policy if exists "media read" on public.deal_media;
drop policy if exists "deal_media: visible read" on public.deal_media;
create policy "deal_media: visible read" on public.deal_media
  for select using (public.deal_is_visible(deal_id));

drop policy if exists "deal_documents: read all authenticated" on public.deal_documents;
drop policy if exists "deal_documents: visible read" on public.deal_documents;
create policy "deal_documents: visible read" on public.deal_documents
  for select to authenticated using (public.deal_is_visible(deal_id));

-- Admin can list all profiles (for the access grid) --------------------------
drop policy if exists "profiles: admin read all" on public.profiles;
create policy "profiles: admin read all" on public.profiles
  for select to authenticated using (public.is_admin());

-- ----------------------------------------------------------------------------
-- Seed the six deal templates. Re-running updates these fields on the same
-- slugs. Public: Zanesville, Columbus IN, Lima OH, Newport News.
-- ----------------------------------------------------------------------------
insert into public.deals
  (slug, title, status, property_address, lien_amount, rehab_budget, is_public)
values
  ('zanesville-flip', 'Zanesville, OH Flip', 'active', '81 Williams St, Zanesville, OH', 144000, 44000, true)
on conflict (slug) do update set
  property_address = excluded.property_address,
  lien_amount = excluded.lien_amount,
  rehab_budget = excluded.rehab_budget,
  is_public = true;

insert into public.deals
  (slug, title, status, property_address, bedrooms, bathrooms, year_built,
   arv, lien_amount, rehab_budget, rehab_spent, is_public)
values
  ('columbus-in-flip', 'Columbus, IN Flip', 'active', '6314 E Highland Ct, Columbus, IN',
   3, '1.5', '1967', 245000, 165000, 65000, 17000, true)
on conflict (slug) do update set
  property_address = excluded.property_address,
  bedrooms = excluded.bedrooms,
  bathrooms = excluded.bathrooms,
  year_built = excluded.year_built,
  arv = excluded.arv,
  lien_amount = excluded.lien_amount,
  rehab_budget = excluded.rehab_budget,
  rehab_spent = excluded.rehab_spent,
  is_public = true;

insert into public.deals (slug, title, status, property_address, is_public)
values
  ('lima-oh-flip', 'Lima, OH Flip', 'active', '620 W Northern Ave, Lima, OH', true)
on conflict (slug) do update set
  property_address = excluded.property_address,
  is_public = true;

insert into public.deals
  (slug, title, status, property_address, year_built, bedrooms, bathrooms, square_feet, is_public)
values
  ('newport-news-flip', 'Newport News, VA Flip', 'active', '4604 Warwick Blvd, Newport News, VA',
   '1930', 5, '1.5', 1413, true)
on conflict (slug) do update set
  property_address = excluded.property_address,
  year_built = excluded.year_built,
  bedrooms = excluded.bedrooms,
  bathrooms = excluded.bathrooms,
  square_feet = excluded.square_feet,
  is_public = true;

insert into public.deals
  (slug, title, status, property_address, year_built, bedrooms, bathrooms, garage, is_public)
values
  ('san-antonio-flip', 'San Antonio, TX Flip', 'active', '6202 Trail Valley, San Antonio, TX',
   '1970', 3, '1', '1-car garage', false)
on conflict (slug) do update set
  property_address = excluded.property_address,
  year_built = excluded.year_built,
  bedrooms = excluded.bedrooms,
  bathrooms = excluded.bathrooms,
  garage = excluded.garage;

insert into public.deals
  (slug, title, status, property_address, year_built, bedrooms, bathrooms, square_feet,
   is_partnered, partner_name, is_public)
values
  ('peru-in-flip', 'Peru, IN Flip', 'active', '123 W 6th St, Peru, IN',
   '1900', 4, '1.5', 2100, true, 'Isaiah Rodriguez', false)
on conflict (slug) do update set
  property_address = excluded.property_address,
  year_built = excluded.year_built,
  bedrooms = excluded.bedrooms,
  bathrooms = excluded.bathrooms,
  square_feet = excluded.square_feet,
  is_partnered = excluded.is_partnered,
  partner_name = excluded.partner_name;

create index if not exists deal_access_deal_id_idx on public.deal_access (deal_id);
create index if not exists deal_access_email_idx on public.deal_access (lower(email));
