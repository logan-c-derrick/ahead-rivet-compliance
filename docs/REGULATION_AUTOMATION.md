# Regulation Automation and Versioned Compliance

## What is implemented

- Automated release sync endpoint: `GET /api/regulations/sync`
- Scheduled automation via `vercel.json` cron every 6 hours.
- Release version model:
  - `regulation_releases`
  - `release_substance_changes`
  - `component_regulation_release_status`
  - `product_regulation_release_status`
  - `regulation_update_events`
- Impact evaluator that creates `needs_review` release-status rows for components/products.
- Update notifications:
  - In-app feed via `regulation_update_events`
  - Email notifications to `admin` + `compliance_manager`

## Required environment

- `CRON_SECRET` (required for `/api/regulations/sync`)
- `SUPABASE_SERVICE_ROLE_KEY` (required by sync + impact engine)
- `RESEND_API_KEY`
- `RESEND_FROM`

Optional source overrides:
- `REACH_RELEASES_FEED_URL`
- `ROHS_RELEASES_FEED_URL`

## Security and access

- All new tables have RLS enabled.
- Global release metadata is readable by authenticated users.
- Release/status/event writes are restricted to elevated roles and/or scoped by org.

## Verification

Run:

- `supabase/verification/regulation_release_rls.sql`

Then validate runtime:

1. Hit `/api/regulations/sync` with `Authorization: Bearer $CRON_SECRET`.
2. Confirm rows appear in `regulation_releases`.
3. Confirm `component_regulation_release_status` and `product_regulation_release_status` get `needs_review` rows.
4. Confirm `regulation_update_events` and admin email notifications are produced.
