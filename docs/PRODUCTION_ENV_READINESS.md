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
- Remaining blockers before public launch:
  - `NEXT_PUBLIC_APP_URL` must be set to production domain
  - `RESEND_FROM` should use final Rivet sender identity/domain
