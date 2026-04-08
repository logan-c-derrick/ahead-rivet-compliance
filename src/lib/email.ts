/**
 * Send transactional email via Resend HTTP API (no extra package required).
 * Set RESEND_API_KEY and optionally RESEND_FROM ("Name <email@domain>").
 */

export type SendEmailResult = { ok: true } | { ok: false; error: string };

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendEmailResult> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    console.warn("RESEND_API_KEY is not set; email not sent.");
    return {
      ok: false,
      error:
        "RESEND_API_KEY is not set. Add it to .env.local and restart the dev server. See SETUP.md.",
    };
  }

  const from =
    process.env.RESEND_FROM ?? "ComplianceHub <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: opts.to,
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
