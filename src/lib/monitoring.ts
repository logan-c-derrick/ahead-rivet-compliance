const REQUIRED_RUNTIME_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "RESEND_API_KEY",
  "RESEND_FROM",
  "NEXT_PUBLIC_APP_URL",
] as const;

export type RuntimeEnvStatus = {
  name: (typeof REQUIRED_RUNTIME_ENV_VARS)[number];
  present: boolean;
};

export function getRuntimeEnvStatuses(): RuntimeEnvStatus[] {
  return REQUIRED_RUNTIME_ENV_VARS.map((name) => ({
    name,
    present: Boolean(process.env[name]?.trim()),
  }));
}

export function getMissingRuntimeEnvVars(): string[] {
  return getRuntimeEnvStatuses()
    .filter((entry) => !entry.present)
    .map((entry) => entry.name);
}

export type ReadinessResult = {
  ok: boolean;
  reason?: "missing_runtime_env" | "missing_service_role" | "supabase_check_failed";
  error?: string;
  env: RuntimeEnvStatus[];
};

export async function runReadinessChecks(
  checkSupabase: () => Promise<{ ok: true } | { ok: false; error: string }>
): Promise<ReadinessResult> {
  const env = getRuntimeEnvStatuses();
  const missing = env.filter((entry) => !entry.present).map((entry) => entry.name);

  if (missing.length > 0) {
    return { ok: false, reason: "missing_runtime_env", env };
  }

  const supabaseResult = await checkSupabase();
  if (!supabaseResult.ok) {
    if (supabaseResult.error.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return { ok: false, reason: "missing_service_role", error: supabaseResult.error, env };
    }
    return { ok: false, reason: "supabase_check_failed", error: supabaseResult.error, env };
  }

  return { ok: true, env };
}

