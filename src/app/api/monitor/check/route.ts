import { createServiceRoleClient, hasServiceRoleConfig } from "@/lib/supabase/service-role";
import { runReadinessChecks } from "@/lib/monitoring";
import { sendEmail } from "@/lib/email";

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) return true;
  const auth = request.headers.get("authorization") ?? "";
  return auth === `Bearer ${cronSecret}`;
}

async function sendTeamsAlert(text: string) {
  const webhook = process.env.MONITOR_TEAMS_WEBHOOK_URL?.trim();
  if (!webhook) return { ok: true as const, skipped: true as const };

  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { ok: false as const, error: body || res.statusText };
  }
  return { ok: true as const, skipped: false as const };
}

async function sendEmailAlert(text: string) {
  const toCsv = process.env.MONITOR_ALERT_EMAIL_TO?.trim();
  if (!toCsv) return { ok: true as const, skipped: true as const };
  const recipients = toCsv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (recipients.length === 0) return { ok: true as const, skipped: true as const };

  const result = await sendEmail({
    to: recipients.join(","),
    subject: "Rivet readiness alert",
    html: `<p>${text}</p>`,
  });

  if (!result.ok) return { ok: false as const, error: result.error };
  return { ok: true as const, skipped: false as const };
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const ready = await runReadinessChecks(async () => {
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

  if (ready.ok) {
    return Response.json({
      ok: true,
      status: "healthy",
      timestamp: new Date().toISOString(),
      env: ready.env,
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
  const message = `Rivet readiness check failed.
Reason: ${ready.reason}
Error: ${ready.error ?? "N/A"}
Timestamp: ${new Date().toISOString()}
Ready endpoint: ${appUrl}/api/ready`;

  const [teamsResult, emailResult] = await Promise.all([
    sendTeamsAlert(message),
    sendEmailAlert(message),
  ]);

  return Response.json(
    {
      ok: false,
      status: "unhealthy",
      reason: ready.reason,
      error: ready.error,
      notifications: {
        teams: teamsResult,
        email: emailResult,
      },
      timestamp: new Date().toISOString(),
      env: ready.env,
    },
    { status: 503 }
  );
}

