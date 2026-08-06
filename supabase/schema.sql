-- ============================================================================
-- Investor Deal Portal — Supabase schema
-- ============================================================================
-- Run this once in your Supabase project's SQL Editor (Project -> SQL Editor
-- -> New query -> paste this whole file -> Run). Safe to re-run: it drops and
-- recreates policies but will error on "already exists" for tables — if you
-- need to re-run from scratch, drop the tables first.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- profiles — one row per auth.users row, holds role (admin vs investor)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'investor' check (role in ('admin', 'investor')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- helper: is the current user an admin? (security definer avoids RLS recursion)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- auto-create a profile row whenever someone signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles: update own (not role)" on public.profiles;
create policy "profiles: update own (not role)" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()));

-- To promote your own account to admin, run this once after you sign up:
--   update public.profiles set role = 'admin' where email = 'you@example.com';

-- ----------------------------------------------------------------------------
-- deals
-- ----------------------------------------------------------------------------
create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),

  -- Deal Information template fields
  property_address text,
  year_built text,
  exterior_type text,
  arv numeric,
  lien_amount numeric,
  rehab_budget numeric,
  rehab_spent numeric,
  budget_variance_note text,

  -- cover image shown on dashboard cards + top of deal page
  cover_image_path text,

  -- what's being worked on right now (shows live on cards + deal page)
  current_focus text,

  -- property specs
  bedrooms integer,
  bathrooms text,
  square_feet integer,
  garage text,

  -- partnered deals ("Partnered Projects" section; partner = owning entity)
  is_partnered boolean not null default false,
  partner_name text,

  -- private deals are only visible to admins and emails granted access
  is_public boolean not null default false,

  -- optional Google Drive album link, opens in a new tab
  drive_url text,

  -- open funding raise shown as a progress bar (null target = no raise)
  raise_target numeric,
  raise_committed numeric not null default 0,

  -- sale results for the track-record page (set when status = completed)
  purchase_price numeric,
  sold_price numeric,
  sold_date date,
  lender_outcome text,

  -- before/after comparison images (storage paths in deal-media)
  before_image_path text,
  after_image_path text,

  -- red alert / illiquid popup
  is_illiquid boolean not null default false,
  alert_reason text,

  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.deals enable row level security;

drop policy if exists "deals: admin write" on public.deals;
create policy "deals: admin write" on public.deals
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop trigger if exists set_deals_updated_at on public.deals;
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger set_deals_updated_at
  before update on public.deals
  for each row execute procedure public.set_updated_at();

-- ----------------------------------------------------------------------------
-- deal_tasks — the To Do / Complete / Red Alert status board per deal
-- ----------------------------------------------------------------------------
create table if not exists public.deal_tasks (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals (id) on delete cascade,
  title text not null,
  status text not null default 'todo' check (status in ('todo', 'complete', 'red_alert')),
  alert_reason text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.deal_tasks enable row level security;

drop policy if exists "deal_tasks: admin write" on public.deal_tasks;
create policy "deal_tasks: admin write" on public.deal_tasks
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop trigger if exists set_deal_tasks_updated_at on public.deal_tasks;
create trigger set_deal_tasks_updated_at
  before update on public.deal_tasks
  for each row execute procedure public.set_updated_at();

-- ----------------------------------------------------------------------------
-- deal_media — photos & videos (storage bucket: deal-media, public read)
-- ----------------------------------------------------------------------------
create table if not exists public.deal_media (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals (id) on delete cascade,
  media_type text not null check (media_type in ('photo', 'video')),
  storage_path text not null,
  caption text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.deal_media enable row level security;

drop policy if exists "deal_media: admin write" on public.deal_media;
create policy "deal_media: admin write" on public.deal_media
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- deal_documents — PDFs & invoices (storage bucket: deal-documents, private)
-- ----------------------------------------------------------------------------
create table if not exists public.deal_documents (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals (id) on delete cascade,
  doc_type text not null check (doc_type in ('pdf', 'invoice', 'sheet')),
  name text not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);

alter table public.deal_documents enable row level security;

drop policy if exists "deal_documents: admin write" on public.deal_documents;
create policy "deal_documents: admin write" on public.deal_documents
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- deal_access — per-deal grants keyed by email (applies once they sign in)
-- ----------------------------------------------------------------------------
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

-- visibility helper used by the read policies above
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

-- read policies for deal data, gated on visibility (defined here because they
-- depend on deal_is_visible above)
drop policy if exists "deals: visible read" on public.deals;
create policy "deals: visible read" on public.deals
  for select using (public.deal_is_visible(id));

drop policy if exists "deal_tasks: visible read" on public.deal_tasks;
create policy "deal_tasks: visible read" on public.deal_tasks
  for select using (public.deal_is_visible(deal_id));

drop policy if exists "deal_media: visible read" on public.deal_media;
create policy "deal_media: visible read" on public.deal_media
  for select using (public.deal_is_visible(deal_id));

drop policy if exists "deal_documents: visible read" on public.deal_documents;
create policy "deal_documents: visible read" on public.deal_documents
  for select to authenticated using (public.deal_is_visible(deal_id));

-- ----------------------------------------------------------------------------
-- site_settings — single row holding the portfolio-wide capital raise
-- ----------------------------------------------------------------------------
create table if not exists public.site_settings (
  id boolean primary key default true,
  raise_committed numeric not null default 0,
  updated_at timestamptz not null default now(),
  constraint site_settings_single_row check (id)
);

insert into public.site_settings (id, raise_committed)
values (true, 0)
on conflict (id) do nothing;

alter table public.site_settings enable row level security;

drop policy if exists "site_settings: public read" on public.site_settings;
create policy "site_settings: public read" on public.site_settings
  for select using (true);

drop policy if exists "site_settings: admin write" on public.site_settings;
create policy "site_settings: admin write" on public.site_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- subscribers — email-capture popup list
-- ----------------------------------------------------------------------------
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

-- admins can list all profiles (audience page)
drop policy if exists "profiles: admin read all" on public.profiles;
create policy "profiles: admin read all" on public.profiles
  for select to authenticated using (public.is_admin());

-- ----------------------------------------------------------------------------
-- deal_inquiries — investor "I'm interested" submissions, one per deal
-- ----------------------------------------------------------------------------
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

drop policy if exists "deal_inquiries: public insert" on public.deal_inquiries;
create policy "deal_inquiries: public insert" on public.deal_inquiries
  for insert with check (true);

drop policy if exists "deal_inquiries: admin read" on public.deal_inquiries;
create policy "deal_inquiries: admin read" on public.deal_inquiries
  for select to authenticated using (public.is_admin());

drop policy if exists "deal_inquiries: admin delete" on public.deal_inquiries;
create policy "deal_inquiries: admin delete" on public.deal_inquiries
  for delete to authenticated using (public.is_admin());

-- ----------------------------------------------------------------------------
-- Storage buckets
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('deal-media', 'deal-media', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('deal-documents', 'deal-documents', false)
on conflict (id) do nothing;

drop policy if exists "deal-media: public read" on storage.objects;
create policy "deal-media: public read" on storage.objects
  for select using (bucket_id = 'deal-media');

drop policy if exists "deal-media: admin write" on storage.objects;
create policy "deal-media: admin write" on storage.objects
  for insert to authenticated with check (bucket_id = 'deal-media' and public.is_admin());

drop policy if exists "deal-media: admin update" on storage.objects;
create policy "deal-media: admin update" on storage.objects
  for update to authenticated using (bucket_id = 'deal-media' and public.is_admin());

drop policy if exists "deal-media: admin delete" on storage.objects;
create policy "deal-media: admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'deal-media' and public.is_admin());

drop policy if exists "deal-documents: authenticated read" on storage.objects;
create policy "deal-documents: authenticated read" on storage.objects
  for select to authenticated using (bucket_id = 'deal-documents');

drop policy if exists "deal-documents: admin write" on storage.objects;
create policy "deal-documents: admin write" on storage.objects
  for insert to authenticated with check (bucket_id = 'deal-documents' and public.is_admin());

drop policy if exists "deal-documents: admin update" on storage.objects;
create policy "deal-documents: admin update" on storage.objects
  for update to authenticated using (bucket_id = 'deal-documents' and public.is_admin());

drop policy if exists "deal-documents: admin delete" on storage.objects;
create policy "deal-documents: admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'deal-documents' and public.is_admin());

-- ----------------------------------------------------------------------------
-- Helpful indexes
-- ----------------------------------------------------------------------------
create index if not exists deal_tasks_deal_id_idx on public.deal_tasks (deal_id, position);
create index if not exists deal_media_deal_id_idx on public.deal_media (deal_id, position);
create index if not exists deal_documents_deal_id_idx on public.deal_documents (deal_id);
create index if not exists deals_status_idx on public.deals (status);
create index if not exists deal_inquiries_deal_id_idx on public.deal_inquiries (deal_id, created_at desc);
