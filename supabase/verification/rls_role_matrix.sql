-- RLS Role Matrix Verification Script
-- Purpose: validate database-enforced role write restrictions from migration 023.
--
-- Run this script as each test user context:
--   1) viewer
--   2) compliance_manager (or admin)
--
-- NOTE:
-- - Edit UUIDs in the params CTE before running.
-- - This script intentionally uses BEGIN/ROLLBACK to avoid permanent data changes.

drop table if exists _rls_params;
create temporary table _rls_params (
  org_id uuid not null,
  existing_product_id uuid not null,
  existing_component_id uuid not null,
  existing_supplier_id uuid not null
);

-- Auto-discover one organization that already has at least
-- one product, one component, and one supplier.
insert into _rls_params (org_id, existing_product_id, existing_component_id, existing_supplier_id)
select
  o.id as org_id,
  (
    select p.id from products p
    where p.organization_id = o.id
    order by p.created_at asc nulls last
    limit 1
  ) as existing_product_id,
  (
    select c.id from components c
    where c.organization_id = o.id
    order by c.created_at asc nulls last
    limit 1
  ) as existing_component_id,
  (
    select s.id from suppliers s
    where s.organization_id = o.id
    order by s.created_at asc nulls last
    limit 1
  ) as existing_supplier_id
from organizations o
where exists (
  select 1 from products p where p.organization_id = o.id
)
and exists (
  select 1 from components c where c.organization_id = o.id
)
and exists (
  select 1 from suppliers s where s.organization_id = o.id
)
order by o.created_at asc nulls last
limit 1;

do $$
begin
  if not exists (select 1 from _rls_params) then
    raise exception 'RLS verification setup failed: no organization found with product/component/supplier rows.';
  end if;
end $$;

select * from _rls_params;

-- Sanity: current role view from DB helper
select auth.uid() as current_user_id, get_user_app_role() as current_app_role, can_manage_sensitive_actions() as can_manage;

-- Guardrail: this script must run in an authenticated user context.
-- If run from SQL Editor admin context, auth.uid() is usually NULL and results are invalid.
do $$
begin
  if auth.uid() is null then
    raise exception
      'RLS verification must run with a real authenticated user JWT (auth.uid() is NULL in this session). Use app/API context for viewer and manager/admin tests.';
  end if;
end $$;

begin;

-- 1) Sensitive create on products (viewer should FAIL, manager/admin should PASS)
insert into products (organization_id, name, sku)
select org_id, 'RLS_TEST_PRODUCT', 'RLS-TEST-001' from _rls_params;

-- 2) Sensitive update on products (viewer should FAIL, manager/admin should PASS)
update products
set description = 'RLS update test'
where id = (select existing_product_id from _rls_params)
  and organization_id = (select org_id from _rls_params);

-- 3) Sensitive delete on products (viewer should FAIL, manager/admin should PASS)
delete from products
where id = (select existing_product_id from _rls_params)
  and organization_id = (select org_id from _rls_params);

-- 4) Sensitive create on components (viewer should FAIL, manager/admin should PASS)
insert into components (organization_id, name, part_number, manufacturer)
select org_id, 'RLS_TEST_COMPONENT', 'RLS-COMP-001', 'RLS_TEST_VENDOR' from _rls_params;

-- 5) Sensitive create on suppliers (viewer should FAIL, manager/admin should PASS)
insert into suppliers (organization_id, name, contact_email)
select org_id, 'RLS_TEST_SUPPLIER', 'rls-test@example.com' from _rls_params;

-- 6) Settings write check (viewer should FAIL, manager/admin should PASS)
insert into organization_settings (organization_id)
select org_id from _rls_params
on conflict (organization_id) do update
set updated_at = now();

-- 7) Support ticket insert check (viewer + manager/admin should PASS)
insert into support_tickets (organization_id, requester_id, inquiry_type, subject, description, status)
select
  org_id,
  auth.uid(),
  'Technical Issue',
  'RLS Verification Ticket',
  'Validation insert from role matrix script.',
  'open'
from _rls_params;

-- 8) Support ticket "update own ticket" check (viewer + manager/admin should PASS)
update support_tickets
set status = 'open', updated_at = now()
where requester_id = auth.uid()
  and organization_id = (select org_id from _rls_params)
  and subject = 'RLS Verification Ticket';

rollback;

-- Expected result summary:
-- viewer:
--   - statements 1-6 -> permission denied
--   - statements 7-8 -> success
-- manager/admin:
--   - statements 1-8 -> success (subject to org scoping and valid IDs)

