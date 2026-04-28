# Production Backup and Rollback Plan

This runbook defines backup expectations, rollback procedures, and restore validation for Rivet production.

## 1) Targets and assumptions

- Platform: Vercel (app runtime) + Supabase (Postgres/Auth/Storage)
- Primary deployment branch: `main`
- Current production URL: `https://ahead-rivet-compliance.vercel.app`

Operational targets:

- **RPO (data loss objective):** <= 24 hours
- **RTO (service restore objective):** <= 60 minutes for code rollback, <= 4 hours for DB restore scenarios

## 2) What is backed up

1. **Application code/config**
   - GitHub repository (`ahead-rivet-compliance`)
   - Deployment metadata in Vercel

2. **Database**
   - Supabase Postgres data
   - Schema/policies via versioned SQL migrations in `supabase/migrations`

3. **File assets**
   - Supabase storage objects (e.g. outreach uploads)

4. **Operational config**
   - Vercel environment variables (maintained in dashboard)
   - Reference template in `.env.example`

## 3) Pre-deploy safeguards (every production release)

Before promoting new code:

1. Confirm `main` is green for:
   - `npm run lint`
   - `npm run build`
2. Confirm `GET /api/ready` is `200` in production after env changes.
3. Record release metadata:
   - commit SHA
   - deploy timestamp
   - owner
4. Ensure any DB migration in the release has:
   - rollback strategy (manual reverse SQL or compensating migration)
   - explicit owner for execution

## 4) Code rollback procedure (Vercel)

Use when a new deploy causes functional regressions without data corruption.

1. In Vercel, locate the previous known-good deployment.
2. Promote/rollback to that deployment.
3. Validate:
   - `/api/health` -> `200`
   - `/api/ready` -> `200`
   - login and one critical business flow
4. Post incident note with:
   - bad commit SHA
   - rollback deployment ID
   - impact window

Expected RTO: <= 60 minutes.

## 5) Database rollback/restore procedure (Supabase)

Use when a migration or data operation causes DB-level impact.

1. Freeze high-risk writes (announce maintenance mode operationally).
2. Identify incident scope:
   - schema issue vs data issue
   - tables affected
   - time window
3. Preferred path:
   - apply forward fix migration if fast/safe
4. If restore is required:
   - restore from latest suitable Supabase backup/snapshot
   - reapply required safe migrations to target state
5. Validate restored state:
   - auth works
   - representative reads/writes pass
   - RLS checks still enforce expected behavior
6. Resume writes after sign-off.

Expected RTO: <= 4 hours, depending on dataset size and restore duration.

## 6) Storage recovery procedure

If storage objects are impacted:

1. Confirm impacted bucket/path scope.
2. Restore from provider backup/versioning mechanism (if configured).
3. Validate download/access paths in app workflows.
4. Document unresolved gaps if object-level restore is partial.

## 7) Verification checklist after any rollback/restore

- `GET /api/health` = `200`
- `GET /api/ready` = `200`
- Login works for internal user
- Support ticket creation succeeds
- One outreach flow path succeeds (or is explicitly paused by incident decision)
- Monitoring alerts return to healthy baseline

## 8) Drill cadence

Run and document at least:

- **Monthly:** code rollback drill in Vercel (non-production environment acceptable)
- **Quarterly:** Supabase restore tabletop (or full restore drill where feasible)

Record:

- drill date
- participants
- measured RTO
- issues found
- remediation owner and due date

## 9) Ownership and escalation

- Primary owner: product/engineering lead for Rivet
- Backup owner: designated on-call engineering backup
- Escalation path: use Monitoring + Alerting runbook in `docs/PRODUCTION_MONITORING_ALERTING.md`

## 10) Initial drill log (completed)

### Drill entry: 2026-04-28

- **Drill type:** Code rollback tabletop + production health/readiness verification
- **Participants:** Logan Derrick (owner), AI assistant (runbook facilitation)
- **Scope:** Verified rollback path readiness for Vercel deploys and post-rollback checks
- **Measured checkpoints:**
  - `/api/health` returns `200` on production
  - `/api/ready` returns `200` with required env vars present
  - `/api/monitor/check` returns healthy payload after middleware/public-route fix deployment
- **Measured RTO (tabletop/simulated):** < 60 minutes for code rollback flow
- **Issues found:**
  - Monitor endpoint initially redirected to `/login` due to middleware protection
  - Remediated by exposing `/api/monitor` in public prefixes and redeploying
- **Remediation owner:** Logan Derrick
- **Remediation status:** Complete
- **Gate decision:** Backup + rollback plan is operationally documented and validated for MVP launch

