export type SendEmailResult = { ok: true } | { ok: false; error: string };

type EmailProvider = "resend" | "m365" | "smtp" | "manual";

export function getEmailProvider(): EmailProvider {
  const raw = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  if (raw === "m365") return "m365";
  if (raw === "smtp") return "smtp";
  if (raw === "manual") return "manual";
  return "resend";
}

export function getEmailProviderReadiness(): { ok: true } | { ok: false; error: string } {
  const provider = getEmailProvider();
  if (provider === "manual") return { ok: true };

  if (provider === "resend") {
    const key = process.env.RESEND_API_KEY?.trim();
    if (!key) {
      return {
        ok: false,
        error:
          "EMAIL_PROVIDER is resend but RESEND_API_KEY is not set. Set RESEND_API_KEY or switch EMAIL_PROVIDER.",
      };
    }
    return { ok: true };
  }

  if (provider === "smtp") {
    const host = process.env.SMTP_HOST?.trim();
    const port = process.env.SMTP_PORT?.trim();
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim();
    if (!host || !port || !user || !pass) {
      return {
        ok: false,
        error:
          "EMAIL_PROVIDER is smtp but one or more required vars are missing: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.",
      };
    }
    return { ok: true };
  }

  const tenant = process.env.M365_TENANT_ID?.trim();
  const clientId = process.env.M365_CLIENT_ID?.trim();
  const clientSecret = process.env.M365_CLIENT_SECRET?.trim();
  const sender = process.env.M365_SENDER_UPN?.trim();
  if (!tenant || !clientId || !clientSecret || !sender) {
    return {
      ok: false,
      error:
        "EMAIL_PROVIDER is m365 but one or more required vars are missing: M365_TENANT_ID, M365_CLIENT_ID, M365_CLIENT_SECRET, M365_SENDER_UPN.",
    };
  }
  return { ok: true };
}

function splitRecipients(to: string): string[] {
  return to
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function sendViaResend(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendEmailResult> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    return {
      ok: false,
      error:
        "RESEND_API_KEY is not set. Add it to .env.local and restart the dev server.",
    };
  }
  const from = process.env.RESEND_FROM ?? "Rivet <onboarding@resend.dev>";
  const recipients = splitRecipients(opts.to);
  if (recipients.length === 0) {
    return { ok: false, error: "No recipient email provided." };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: recipients,
      subject: opts.subject,
      html: opts.html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, error: text || res.statusText };
  }
  return { ok: true };
}

async function getM365AccessToken(): Promise<{ ok: true; accessToken: string } | { ok: false; error: string }> {
  const tenant = process.env.M365_TENANT_ID?.trim();
  const clientId = process.env.M365_CLIENT_ID?.trim();
  const clientSecret = process.env.M365_CLIENT_SECRET?.trim();
  if (!tenant || !clientId || !clientSecret) {
    return {
      ok: false,
      error:
        "M365 auth is not configured. Missing M365_TENANT_ID, M365_CLIENT_ID, or M365_CLIENT_SECRET.",
    };
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
    scope: "https://graph.microsoft.com/.default",
  });

  const res = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    return { ok: false, error: `M365 token request failed: ${text || res.statusText}` };
  }

  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) {
    return { ok: false, error: "M365 token response missing access_token." };
  }
  return { ok: true, accessToken: json.access_token };
}

async function sendViaM365(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendEmailResult> {
  const sender = process.env.M365_SENDER_UPN?.trim();
  if (!sender) {
    return {
      ok: false,
      error: "M365_SENDER_UPN is not set.",
    };
  }

  const tokenResult = await getM365AccessToken();
  if (!tokenResult.ok) return tokenResult;

  const recipients = splitRecipients(opts.to);
  if (recipients.length === 0) {
    return { ok: false, error: "No recipient email provided." };
  }

  const res = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenResult.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        subject: opts.subject,
        body: {
          contentType: "HTML",
          content: opts.html,
        },
        toRecipients: recipients.map((email) => ({
          emailAddress: { address: email },
        })),
      },
      saveToSentItems: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, error: `M365 send failed: ${text || res.statusText}` };
  }

  return { ok: true };
}

function envBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) return fallback;
  return raw === "1" || raw === "true" || raw === "yes";
}

async function sendViaSmtp(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendEmailResult> {
  const host = process.env.SMTP_HOST?.trim();
  const portRaw = process.env.SMTP_PORT?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!host || !portRaw || !user || !pass) {
    return {
      ok: false,
      error:
        "SMTP is not configured. Missing SMTP_HOST, SMTP_PORT, SMTP_USER, or SMTP_PASS.",
    };
  }
  const port = Number.parseInt(portRaw, 10);
  if (!Number.isFinite(port)) {
    return { ok: false, error: "SMTP_PORT must be a valid number." };
  }
  const secureDefault = port === 465;
  const secure = envBool("SMTP_SECURE", secureDefault);
  const from = process.env.SMTP_FROM?.trim() || user;
  const recipients = splitRecipients(opts.to);
  if (recipients.length === 0) {
    return { ok: false, error: "No recipient email provided." };
  }

  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  try {
    await transporter.sendMail({
      from,
      to: recipients,
      subject: opts.subject,
      html: opts.html,
    });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: `SMTP send failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function sendViaManual(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendEmailResult> {
  console.info("EMAIL_PROVIDER=manual; email dispatch skipped.", {
    to: opts.to,
    subject: opts.subject,
    htmlPreview: opts.html.slice(0, 500),
  });
  return { ok: true };
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendEmailResult> {
  const provider = getEmailProvider();
  if (provider === "m365") return sendViaM365(opts);
  if (provider === "smtp") return sendViaSmtp(opts);
  if (provider === "manual") return sendViaManual(opts);
  return sendViaResend(opts);
}
