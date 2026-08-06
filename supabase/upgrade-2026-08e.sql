-- ============================================================================
-- Portal upgrade 5 — run ONCE in the Supabase SQL Editor (safe to re-run).
-- Lead capture: one row per email, plus an activity trail (deals viewed,
-- funding requests, notes). Adds age range to inquiries.
-- ============================================================================

-- One row per email address. Upserted, so no duplicates ever.
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  phone text,
  age_range text,
  wants_partnership boolean not null default false,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

alter table public.leads enable row level security;

drop policy if exists "leads: public insert" on public.leads;
create policy "leads: public insert" on public.leads
  for insert with check (true);

-- Anyone can refresh their own row (last seen, name/phone/age they submit).
drop policy if exists "leads: public update" on public.leads;
create policy "leads: public update" on public.leads
  for update using (true) with check (true);

drop policy if exists "leads: admin read" on public.leads;
create policy "leads: admin read" on public.leads
  for select to authenticated using (public.is_admin());

drop policy if exists "leads: admin delete" on public.leads;
create policy "leads: admin delete" on public.leads
  for delete to authenticated using (public.is_admin());

-- Activity trail for each lead.
create table if not exists public.lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_email text not null,
  event_type text not null check (
    event_type in ('signup', 'deal_view', 'funding_request', 'note')
  ),
  deal_id uuid references public.deals (id) on delete set null,
  detail text,
  amount numeric,
  created_at timestamptz not null default now()
);

alter table public.lead_events enable row level security;

drop policy if exists "lead_events: public insert" on public.lead_events;
create policy "lead_events: public insert" on public.lead_events
  for insert with check (true);

drop policy if exists "lead_events: admin read" on public.lead_events;
create policy "lead_events: admin read" on public.lead_events
  for select to authenticated using (public.is_admin());

drop policy if exists "lead_events: admin delete" on public.lead_events;
create policy "lead_events: admin delete" on public.lead_events
  for delete to authenticated using (public.is_admin());

create index if not exists lead_events_email_idx
  on public.lead_events (lower(lead_email), created_at desc);
create index if not exists leads_email_idx on public.leads (lower(email));

-- Age range on the full inquiry form.
alter table public.deal_inquiries add column if not exists age_range text;

-- Grant private-deal access by lead email exactly like account emails:
-- deal_access already keys off email, so nothing further is needed here.
