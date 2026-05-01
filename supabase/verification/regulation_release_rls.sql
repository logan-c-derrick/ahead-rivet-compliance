-- Regulation release automation RLS verification checklist
-- Run in Supabase SQL editor after applying migration 026.

-- 1) Confirm RLS is enabled on all new tables.
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'regulation_releases',
    'release_substance_changes',
    'component_regulation_release_status',
    'product_regulation_release_status',
    'regulation_update_events'
  )
order by c.relname;

-- 2) Confirm policies exist.
select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in (
    'regulation_releases',
    'release_substance_changes',
    'component_regulation_release_status',
    'product_regulation_release_status',
    'regulation_update_events'
  )
order by tablename, policyname;
