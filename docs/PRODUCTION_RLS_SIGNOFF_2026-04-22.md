# Production RLS Sign-off (2026-04-22)

This report summarizes live validation run against Supabase project `gosrhcckblsnelsdlefn` via MCP.

## Scope

- Verified role helper functions introduced for DB-layer role gating.
- Verified manager-restrictive write policies on sensitive tables.
- Verified RLS enabled state across key tables.
- Identified and remediated one RLS gap (`component_substances`).

## Live Validation Results

### 1) Role helper functions

Confirmed present in `public` schema:

- `get_user_app_role`
- `can_manage_sensitive_actions`

Status: **PASS**

### 2) Restrictive manager write policies

Confirmed manager-restrictive (`AS RESTRICTIVE`) policies now exist for sensitive writes, including:

- Core: `products`, `components`, `suppliers`, `product_components`, `component_regulations`, `product_regulation_status`
- Regulations write controls: `regulations` (insert/update)
- Outreach: `outreach_requests`, `outreach_campaigns`, `outreach_request_regulations`, `outreach_response_tokens`, `outreach_email_defaults`
- BOM/ingestion: `bom_imports`, `bom_column_mappings`, `component_substances`
- Certificates/docs: `compliance_certificates`, `supplier_documents`, `supplier_document_components`, `supplier_contacts`
- Audit write path: `audit_logs` (insert)
- Org operational settings: `organization_settings`

Status: **PASS**

### 3) RLS enabled state

Verified RLS enabled on key tables.

Initial check found one issue:

- `component_substances`: `rls_enabled = false`

Remediation applied:

- Migration `025_enable_rls_component_substances.sql`
- Applied live via MCP `apply_migration`
- Re-verified `component_substances.rls_enabled = true`

Status: **PASS after remediation**

### 4) Tables with write policies but intentionally no manager-restrictive policy

Remaining list:

- `organizations`
- `profiles`
- `support_tickets`

These are intentionally broader for onboarding/profile/support workflows.

Status: **ACCEPTED (by design)**

## Migrations Applied in this hardening pass

- `023_role_based_write_rls.sql`
- `024_rls_finalize_sensitive_writes.sql`
- `025_enable_rls_component_substances.sql`

### 5) Runtime role-context verification

Completed via MCP `execute_sql` in an authenticated role-emulation transaction:

- Session set to `role authenticated`
- JWT subject injected with `set_config('request.jwt.claim.sub', <profile_id>, true)`
- Profile role toggled within transaction for test contexts:
  - `viewer`
  - `compliance_manager`
- All test writes executed inside `BEGIN ... ROLLBACK` (no persistent data changes)

Validated outcomes:

- `viewer`
  - `products` insert: denied
  - `products` update: denied (0 rows affected under RLS)
  - `organization_settings` upsert: denied
  - `support_tickets` insert: allowed
- `compliance_manager`
  - `products` insert/update: allowed
  - `organization_settings` upsert: allowed
  - `support_tickets` insert: allowed

Status: **PASS**

## Residual Risk

No open RLS launch blockers identified in current scope.

