-- ============================================================================
-- Portal upgrade 6 — run ONCE in the Supabase SQL Editor (safe to re-run).
-- Adds an investor-facing note to each scope item, so "Plumbing work?" and
-- "Foundation work?" (and anything else) can carry detail on the deal page.
-- ============================================================================

alter table public.deal_tasks add column if not exists note text;
