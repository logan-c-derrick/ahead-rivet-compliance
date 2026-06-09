import Link from "next/link";
import { notFound } from "next/navigation";
import MaterialIcon from "@/components/ui/MaterialIcon";
import { requireRole } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { buildManualOutreachPreviewRows } from "@/lib/outreach-manual-preview";
import CopyEmailBlock from "./copy-email-block";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    launched?: string;
    requests?: string;
    emails?: string;
    failed?: string;
    delivery?: string;
  }>;
};

export default async function ManualPreviewPage({ params, searchParams }: Props) {
  const profile = await requireRole(["admin", "compliance_manager"]);
  const { id } = await params;
  const qs = await searchParams;
  const supabase = await createClient();

  const { campaign, rows } = await buildManualOutreachPreviewRows({
    supabase,
    organizationId: profile.organization_id,
    campaignId: id,
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  });

  if (!campaign) notFound();

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">
            Manual Outreach Copy Pack
          </h1>
          <p className="text-sm text-on-surface-variant mt-2">
            Campaign: <span className="font-semibold text-primary">{campaign.name}</span>
          </p>
          {qs.launched === "1" && (
            <p className="mt-2 text-sm text-tertiary-container bg-tertiary-fixed/30 inline-flex items-center gap-2 px-3 py-1 rounded-lg">
              <MaterialIcon name="check_circle" className="text-sm" />
              Campaign launched. Copy or download each email below for Outlook.
            </p>
          )}
          {qs.delivery === "partial" && (
            <p className="mt-2 text-sm text-error bg-error-container/30 inline-flex items-center gap-2 px-3 py-1 rounded-lg">
              <MaterialIcon name="warning" className="text-sm" />
              Automatic delivery failed for {qs.failed ?? "some"} email(s). Use this page to send manually.
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/api/outreach/campaigns/${campaign.id}/manual-email-bundle`}
            className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/40 px-3 py-2 text-xs font-bold text-primary hover:bg-surface-container-low"
          >
            <MaterialIcon name="folder_zip" className="text-sm" />
            Download All Emails (.zip)
          </Link>
          <Link
            href={`/api/outreach/campaigns/${campaign.id}/manual-export`}
            className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/40 px-3 py-2 text-xs font-bold text-primary hover:bg-surface-container-low"
          >
            <MaterialIcon name="download" className="text-sm" />
            Download CSV
          </Link>
          <Link
            href="/outreach"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white hover:opacity-90"
          >
            Back to Outreach
          </Link>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-6 text-sm text-on-surface-variant">
          No outreach request rows were found for this campaign.
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <section
              key={row.request_id}
              className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-5 space-y-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-primary">
                    {row.supplier_name || "Unknown supplier"}
                  </p>
                  <p className="text-xs text-on-surface-variant">Request ID: {row.request_id}</p>
                </div>
                <CopyEmailBlock
                  to={row.to_email}
                  subject={row.subject}
                  bodyText={row.body_text}
                  portalLink={row.portal_link}
                />
              </div>
              <div className="flex items-center justify-end">
                <Link
                  href={`/api/outreach/campaigns/${campaign.id}/manual-email?request_id=${encodeURIComponent(
                    row.request_id
                  )}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/40 px-3 py-2 text-xs font-bold text-primary hover:bg-surface-container-low"
                >
                  <MaterialIcon name="attach_email" className="text-sm" />
                  Download Outlook Email (.eml)
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-surface-container-low rounded-lg p-3">
                  <p className="font-bold text-on-surface-variant uppercase tracking-wider mb-1">To</p>
                  <p className="font-mono break-all">{row.to_email || "—"}</p>
                </div>
                <div className="bg-surface-container-low rounded-lg p-3">
                  <p className="font-bold text-on-surface-variant uppercase tracking-wider mb-1">Subject</p>
                  <p>{row.subject}</p>
                </div>
              </div>

              <div className="bg-surface-container-low rounded-lg p-3">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  Email Text (Copy/Paste Ready)
                </p>
                <textarea
                  readOnly
                  value={row.body_text}
                  className="w-full min-h-40 bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-3 text-xs font-mono"
                />
              </div>

              <div className="bg-surface-container-low rounded-lg p-3">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Portal Link
                </p>
                <a href={row.portal_link} className="text-xs text-primary underline break-all">
                  {row.portal_link}
                </a>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

