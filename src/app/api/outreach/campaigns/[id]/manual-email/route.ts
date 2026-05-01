import { NextResponse } from "next/server";
import { requireRole } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { buildManualOutreachPreviewRows } from "@/lib/outreach-manual-preview";

function sanitizeHeader(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function toAttachmentFilename(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

function buildEml(opts: {
  to: string;
  subject: string;
  textBody: string;
  htmlBody: string;
}): string {
  const boundary = `manual-email-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return [
    "MIME-Version: 1.0",
    `To: ${sanitizeHeader(opts.to)}`,
    `Subject: ${sanitizeHeader(opts.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    "Content-Transfer-Encoding: 8bit",
    "",
    opts.textBody,
    "",
    `--${boundary}`,
    `Content-Type: text/html; charset="UTF-8"`,
    "Content-Transfer-Encoding: 8bit",
    "",
    opts.htmlBody,
    "",
    `--${boundary}--`,
    "",
  ].join("\r\n");
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await requireRole(["admin", "compliance_manager"]);
    const params = await context.params;
    const campaignId = params.id;
    const requestId = new URL(request.url).searchParams.get("request_id")?.trim();
    if (!campaignId || !requestId) {
      return NextResponse.json({ error: "Missing campaign id or request_id" }, { status: 400 });
    }

    const supabase = await createClient();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const { campaign, rows } = await buildManualOutreachPreviewRows({
      supabase,
      organizationId: profile.organization_id,
      campaignId,
      appUrl: baseUrl,
    });
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const row = rows.find((r) => r.request_id === requestId);
    if (!row) {
      return NextResponse.json({ error: "Manual email row not found for request" }, { status: 404 });
    }
    if (!row.to_email) {
      return NextResponse.json({ error: "Recipient email missing for this request" }, { status: 400 });
    }

    const eml = buildEml({
      to: row.to_email,
      subject: row.subject,
      textBody: row.body_text,
      htmlBody: row.body_html,
    });
    const filename = `${toAttachmentFilename(
      `${campaign.name}-${row.supplier_name || row.request_id}`
    )}.eml`;
    return new NextResponse(eml, {
      status: 200,
      headers: {
        "Content-Type": "message/rfc822; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to export manual outreach email.";
    const status = message.includes("permission") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

