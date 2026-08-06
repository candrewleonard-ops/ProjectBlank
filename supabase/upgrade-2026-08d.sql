-- ============================================================================
-- Portal upgrade 4 — run ONCE in the Supabase SQL Editor (safe to re-run).
-- Adds a single-row settings table holding the portfolio-wide capital raise.
-- ============================================================================

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

-- Rehab reserves needed per property (15% of rehab budget) line up with the
-- raise milestones: Lima $6.5k, Newport News $11.5k, Zanesville $18k,
-- Columbus $25k cumulative.
