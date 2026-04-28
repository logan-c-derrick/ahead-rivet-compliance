# Production Environment Readiness

Use this checklist before enabling public access.

## Required variables

Set these in your hosting platform (and locally for parity):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM`
- `NEXT_PUBLIC_APP_URL` (must be your production URL; used in outbound links)

Optional (only if needed for privileged backend scripts):

- `SUPABASE_SERVICE_ROLE_KEY`

Reference template:

- `.env.example`

## Validation checks

1. Authentication works in production domain.
2. Settings save works and persists after refresh.
3. Support ticket submission succeeds.
4. Outreach email send path succeeds (with `RESEND_API_KEY` configured).
5. Links inside outbound emails point to `NEXT_PUBLIC_APP_URL` (not localhost).

## Current known risk to close

- If `NEXT_PUBLIC_APP_URL` is missing, outreach links fall back to `http://localhost:3000`.
  - Confirm this variable is set in production hosting before launch.

## Gate status snapshot (2026-04-22)

- RLS policy validation: `PASS`
- Build + lint preflight: `PASS`
- Monitoring + alerting baseline: `PASS` (Teams/Workflow integration optional for launch)
- Production env + secrets configured: `IN PROGRESS`

## Vercel production checklist

Set these in Vercel project Environment Variables (Production):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM`
- `NEXT_PUBLIC_APP_URL`

Monitoring env vars (recommended, can be completed in a follow-up):

- `CRON_SECRET`
- `MONITOR_ALERT_EMAIL_TO`
- `MONITOR_TEAMS_WEBHOOK_URL` (or Teams Workflow URL when available)

## Exit criteria for this gate

Mark `Production env + secrets configured` as `PASS` once:

1. Vercel Production has all required vars set.
2. `GET /api/ready` returns `200` on the production domain.
3. Outbound links in support/outreach emails use `NEXT_PUBLIC_APP_URL` (not localhost).
