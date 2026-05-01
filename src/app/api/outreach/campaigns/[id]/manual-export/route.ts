import { NextResponse } from "next/server";
import { requireRole } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { buildManualOutreachPreviewRows } from "@/lib/outreach-manual-preview";

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
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
    const lines = [
      [
        "campaign_id",
        "campaign_name",
        "request_id",
        "supplier_name",
        "to_email",
        "subject",
        "portal_link",
        "body_html",
        "component_names",
        "regulation_names",
      ].join(","),
    ];

    for (const row of rows) {
      lines.push(
        [
          csvCell(row.campaign_id),
          csvCell(row.campaign_name),
          csvCell(row.request_id),
          csvCell(row.supplier_name),
          csvCell(row.to_email),
          csvCell(row.subject),
          csvCell(row.portal_link),
          csvCell(row.body_html),
          csvCell(row.component_names),
          csvCell(row.regulation_names),
        ].join(",")
      );
    }

    const filename = `manual-outreach-${slugify(campaign.name)}-${Date.now()}.csv`;
    return new NextResponse(lines.join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to export manual outreach CSV.";
    const status = message.includes("permission") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
