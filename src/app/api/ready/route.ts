import { createServiceRoleClient, hasServiceRoleConfig } from "@/lib/supabase/service-role";
import { runReadinessChecks } from "@/lib/monitoring";

export async function GET() {
  const result = await runReadinessChecks(async () => {
    if (!hasServiceRoleConfig()) {
      return { ok: false as const, error: "SUPABASE_SERVICE_ROLE_KEY is not configured" };
    }
    try {
      const supabase = createServiceRoleClient();
      const { error } = await supabase.from("profiles").select("id").limit(1);
      if (error) throw error;
      return { ok: true as const };
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : "Unknown readiness error",
      };
    }
  });

  if (!result.ok) {
    return Response.json(
      {
        ok: false,
        reason: result.reason,
        error: result.error,
        env: result.env,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }

  return Response.json(
    {
      ok: true,
      env: result.env,
      checks: {
        runtime_env: "pass",
        supabase_service_role_query: "pass",
      },
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}

