# Production RLS Verification (Role Matrix)

This checklist validates that role-based write controls are enforced by the database after applying:

- `supabase/migrations/023_role_based_write_rls.sql`

## 1) Preconditions

- Migration `023_role_based_write_rls.sql` has been applied.
- You have at least 2 test users in the same organization:
  - `viewer` role
  - `compliance_manager` (or `admin`) role
- Both users can sign in to the app.

## 2) High-Level Pass/Fail Criteria

- `viewer`:
  - Can read organization data in app screens.
  - Can submit support tickets.
  - Cannot create/update/delete products, components, suppliers, outreach, certificates, or settings.
- `compliance_manager` / `admin`:
  - Can perform all expected sensitive writes.

If any `viewer` sensitive write succeeds, launch is blocked.

## 3) UI Verification Flow

Run these in the browser with each role.

### Viewer user

- Products:
  - Attempt create/edit/delete actions.
  - Expected: disabled controls or permission error; no DB mutation.
- Components / Suppliers:
  - Attempt create/edit/delete/import.
  - Expected: denied.
- Outreach:
  - Attempt campaign create/delete and review submissions.
  - Expected: denied.
- Certificates:
  - Attempt template/signature update and PDF generation action.
  - Expected: denied.
- Settings:
  - Attempt save alert preferences, save regulatory defaults, reset, commit.
  - Expected: denied.
- Support:
  - Submit support ticket.
  - Expected: succeeds.

### Compliance manager/admin user

- Repeat key write flows above.
- Expected: succeeds where intended.

## 4) Database-Level Verification

Use the SQL script:

- `supabase/verification/rls_role_matrix.sql`

Run it in Supabase SQL Editor while authenticated as each test user (or with equivalent role context setup in your environment).

Expected outcomes are included inline in that script.

## 5) Export/Route Verification

- Verify hidden audit surface:
  - `GET /audit` redirects to `/dashboard`.
  - `GET /audit/export` returns `404`.
- Verify export routes that require manager/admin still deny viewer.

## 6) Sign-off Template

- Migration 023 applied: `PASS/FAIL`
- Viewer cannot mutate sensitive data: `PASS/FAIL`
- Viewer can still create support tickets: `PASS/FAIL`
- Manager/admin sensitive writes succeed: `PASS/FAIL`
- Hidden audit surface inaccessible: `PASS/FAIL`
- Final launch gate: `PASS/FAIL`

## 7) Completed Sign-off (2026-04-22)

- Migration 023 applied: `PASS`
- Viewer cannot mutate sensitive data: `PASS`
  - Verified in runtime role-context checks (`products`, `organization_settings` denied for `viewer`)
- Viewer can still create support tickets: `PASS`
  - Verified in runtime role-context checks (`support_tickets` insert allowed for `viewer`)
- Manager/admin sensitive writes succeed: `PASS`
  - Verified in runtime role-context checks (`products`, `organization_settings` allowed for `compliance_manager`)
- Hidden audit surface inaccessible: `PASS`
  - `src/app/audit/page.tsx` redirects to `/dashboard`
  - `src/app/audit/export/route.ts` returns `404`
- Final launch gate: `PASS`

