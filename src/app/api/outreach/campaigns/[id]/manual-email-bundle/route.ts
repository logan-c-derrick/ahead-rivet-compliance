import JSZip from "jszip";
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
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await requireRole(["admin", "compliance_manager"]);
    const params = await context.params;
    const campaignId = params.id;
    if (!campaignId) {
      return NextResponse.json({ error: "Missing campaign id" }, { status: 400 });
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
    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No outreach requests found for this campaign." },
        { status: 404 }
      );
    }

    const zip = new JSZip();
    const names = new Map<string, number>();
    for (const row of rows) {
      if (!row.to_email) continue;
      const eml = buildEml({
        to: row.to_email,
        subject: row.subject,
        textBody: row.body_text,
        htmlBody: row.body_html,
      });
      const baseName = toAttachmentFilename(
        `${row.supplier_name || "supplier"}-${row.request_id}`
      );
      const seen = names.get(baseName) ?? 0;
      names.set(baseName, seen + 1);
      const filename = seen > 0 ? `${baseName}-${seen + 1}.eml` : `${baseName}.eml`;
      zip.file(filename, eml);
    }
    if (Object.keys(zip.files).length === 0) {
      return NextResponse.json(
        { error: "No rows with recipient email available for bundle export." },
        { status: 400 }
      );
    }

    const zipBytes = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
    const zipName = `${toAttachmentFilename(campaign.name)}-manual-outreach-emails.zip`;
    const out = new Uint8Array(zipBytes.length);
    out.set(zipBytes);
    return new NextResponse(out.buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to export manual outreach email bundle.";
    const status = message.includes("permission") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

