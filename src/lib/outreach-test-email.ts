/** Stored on `outreach_campaigns.cohort_filters` when launch uses "Test email override". */
export const TEST_EMAIL_COHORT_KEY = "test_email_override";

export function getTestEmailOverrideFromCohortFilters(
  cohortFilters: unknown
): string | null {
  if (!cohortFilters || typeof cohortFilters !== "object") return null;
  const raw = (cohortFilters as Record<string, unknown>)[TEST_EMAIL_COHORT_KEY];
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  return t.length > 0 ? t : null;
}

/** Prefer test override (same inbox as initial launch test email), then supplier contact. */
export function resolveOutreachNotificationEmail(
  supplierContactEmail: string | null | undefined,
  cohortFilters: unknown
): string | null {
  const test = getTestEmailOverrideFromCohortFilters(cohortFilters);
  if (test) return test;
  const s = supplierContactEmail?.trim();
  return s && s.length > 0 ? s : null;
}
