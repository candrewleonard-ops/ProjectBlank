-- ============================================================================
-- Portal upgrade 3 — run ONCE in the Supabase SQL Editor (safe to re-run).
-- Adds: per-deal funding raise, sale/track-record fields, before/after photos.
-- ============================================================================

alter table public.deals add column if not exists raise_target numeric;
alter table public.deals add column if not exists raise_committed numeric not null default 0;

alter table public.deals add column if not exists purchase_price numeric;
alter table public.deals add column if not exists sold_price numeric;
alter table public.deals add column if not exists sold_date date;
alter table public.deals add column if not exists lender_outcome text;

alter table public.deals add column if not exists before_image_path text;
alter table public.deals add column if not exists after_image_path text;

-- Current raise: $25,000 open on the Zanesville flip (move it to any deal
-- later with the sliders in the admin editor).
update public.deals
set raise_target = 25000, raise_committed = 0
where slug = 'zanesville-flip';
