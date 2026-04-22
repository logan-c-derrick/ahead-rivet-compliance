# Production Monitoring and Alerting

This baseline gives Rivet the minimum operational visibility needed for launch.

## 1) Health and readiness endpoints

- Liveness: `GET /api/health`
  - Returns `200` with `{ ok: true }` when the app process is serving requests.
- Readiness: `GET /api/ready`
  - Returns `200` only when:
    - required runtime env vars are present
    - service-role Supabase query succeeds
  - Returns `503` with structured failure details if checks fail.

## 2) Required external monitors

Create monitors in your hosting/monitoring provider for:

1. **Uptime monitor (high priority)**
   - URL: `/api/health`
   - Interval: 1 minute
   - Alert when:
     - 2 consecutive failures OR
     - response time > 3s for 5+ minutes

2. **Readiness monitor (high priority)**
   - URL: `/api/ready`
   - Interval: 2 minutes
   - Alert on any non-200 response.

3. **Auth flow smoke monitor (medium priority)**
   - Synthetic check of `/login` page availability and successful load.

4. **Outbound email failure monitor (high priority)**
   - Track failed support/outreach send attempts in logs.
   - Alert threshold: 5+ failures in 10 minutes.

## 2.1) Vercel + Teams/email implementation

Implemented in code:

- Vercel cron job (`vercel.json`) runs every 2 minutes:
  - `GET /api/monitor/check`
- Check route:
  - validates readiness conditions
  - sends alert notifications on failure to:
    - Teams webhook (`MONITOR_TEAMS_WEBHOOK_URL`)
    - Email recipients (`MONITOR_ALERT_EMAIL_TO`)

Required environment variables for this implementation:

- `CRON_SECRET` (recommended; protects cron endpoint)
- `MONITOR_TEAMS_WEBHOOK_URL` (optional if using Teams)
- `MONITOR_ALERT_EMAIL_TO` (optional if using email; comma-separated list)

Note:

- If both Teams and email env vars are omitted, the monitor still reports unhealthy status but has no outbound alert channel.
- Current behavior alerts on each failing cron run; dedup/suppression can be added in a follow-up if needed.

## 3) Alert routing

- **P1 (app down / readiness failing):** page immediately (Slack/PagerDuty/SMS).
- **P2 (degraded performance / elevated email failures):** Slack alert.
- **P3 (low-risk anomalies):** ticket or daily digest.

Suggested recipients:

- Primary on-call: compliance platform owner
- Secondary on-call: engineering backup

## 4) Operational runbook

When `/api/ready` fails:

1. Read `reason` from response payload.
2. If `missing_runtime_env`:
   - set missing env vars in hosting
   - redeploy
3. If `missing_service_role`:
   - add `SUPABASE_SERVICE_ROLE_KEY` in hosting
   - redeploy
4. If `supabase_check_failed`:
   - verify Supabase project status
   - verify network/connectivity and key validity
5. Re-test `/api/ready` until `200`.

## 5) Launch gate criteria

Monitoring + alerting gate is **PASS** when all are true:

- `/api/health` monitor is active and alerting configured.
- `/api/ready` monitor is active and alerting configured.
- Alert route/escalation targets are defined.
- Team has reviewed this runbook.

