import Link from "next/link";
import { notFound } from "next/navigation";
import MaterialIcon from "@/components/ui/MaterialIcon";
import { SupplierDocumentsList } from "@/components/supplier-documents-list";
import {
  addSignedDownloadUrls,
  getOutreachRequestDetail,
  getSupplierDocumentsForOutreachRequest,
} from "@/lib/supplier-documents";
import { CampaignOutreachReviewForm } from "./campaign-outreach-review-form";
import { FollowUpUploadForm } from "./follow-up-upload-form";

function statusPillClass(status: string | null) {
  switch (status) {
    case "approved":
      return "bg-tertiary-fixed-dim/25 text-tertiary-container";
    case "received":
      return "bg-tertiary-fixed-dim/20 text-tertiary-container";
    case "rejected":
      return "bg-error-container/60 text-error";
    case "in_review":
    case "in review":
      return "bg-secondary-fixed-dim/20 text-on-secondary-container";
    case "sent":
      return "bg-secondary-fixed/40 text-on-surface-variant";
    case "pending_documentation":
      return "bg-amber-100/90 text-amber-950 border border-amber-200/80";
    case "pending":
    default:
      return "bg-secondary-fixed-dim/20 text-on-secondary-container";
  }
}

function campaignPartStatusLabel(status: string | null): string {
  if (status === "pending_documentation") return "Pending documentation";
  if (!status) return "—";
  return status.replace(/_/g, " ");
}

type Props = { params: Promise<{ id: string }> };

export default async function OutreachRequestDetailPage({ params }: Props) {
  const { id } = await params;
  const detail = await getOutreachRequestDetail(id);
  if (!detail) {
    notFound();
  }

  const rawDocs = await getSupplierDocumentsForOutreachRequest(id);
  const withUrls = await addSignedDownloadUrls(rawDocs);
  const missingUrl = withUrls.some((d) => d.downloadUrl === null);

  const docItems = withUrls.map((d) => ({
    id: d.id,
    filename: d.filename,
    document_type: d.document_type,
    created_at: d.created_at,
    downloadUrl: d.downloadUrl,
    subtitle:
      d.coverage.length > 0
        ? `Supplier selected: ${d.coverage.map((c) => c.label).join(" · ")}`
        : "Scope: not specified (legacy upload before part selection)",
  }));

  return (
    <div className="p-8 space-y-8 max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-2">
            <Link href="/outreach" className="hover:text-primary font-medium">
              Outreach
            </Link>
            <span className="opacity-60">/</span>
            <span className="font-semibold text-primary">Request</span>
          </div>
          <h1 className="text-3xl font-headline font-extrabold text-primary tracking-tight">
            Supplier request
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            <span className="text-on-surface font-medium">{detail.supplierName}</span>
            {detail.campaignName ? (
              <>
                {" · "}
                <span className="italic">Campaign: {detail.campaignName}</span>
              </>
            ) : null}
          </p>
          <p className="text-on-surface text-sm mt-2 space-y-1">
            <span className="text-on-surface-variant font-bold uppercase text-[10px] tracking-wider mr-2">
              This record
            </span>
            {detail.componentName || detail.componentPartNumber || detail.componentManufacturer ? (
              <span className="block">
                {detail.componentManufacturer ? (
                  <span className="block text-sm">
                    <span className="text-on-surface-variant">Manufacturer: </span>
                    <span className="font-semibold">{detail.componentManufacturer}</span>
                  </span>
                ) : null}
                {detail.componentName ? (
                  <span className="block text-sm">
                    <span className="text-on-surface-variant">Item: </span>
                    <span className="font-semibold">{detail.componentName}</span>
                  </span>
                ) : null}
                {detail.componentManufacturerSku ? (
                  <span className="block text-sm font-mono">
                    <span className="text-on-surface-variant font-sans text-xs">Mfr SKU: </span>
                    {detail.componentManufacturerSku}
                  </span>
                ) : null}
                {detail.componentPartNumber ? (
                  <span className="block text-xs text-on-surface-variant font-mono mt-1">
                    Internal part #: {detail.componentPartNumber}
                  </span>
                ) : null}
              </span>
            ) : (
              <span className="text-on-surface-variant">No component on this request (supplier-level)</span>
            )}
          </p>
        </div>
        <Link
          href="/outreach"
          className="inline-flex items-center gap-2 rounded-xl bg-surface-container-lowest px-4 py-2.5 text-sm font-bold text-primary hover:bg-surface-container-low transition-colors"
        >
          <MaterialIcon name="arrow_back" className="text-sm" />
          Back to outreach
        </Link>
      </div>

      {detail.campaignId && detail.campaignRequests.length > 0 && (
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm overflow-hidden">
          <h2 className="text-lg font-bold text-primary font-headline mb-1">
            {detail.campaignName ?? "Campaign"} — all request records
          </h2>
          <p className="text-sm text-on-surface-variant mb-4">
            Each row is a part in this campaign (one supplier link covers the whole campaign). This
            campaign has <strong>{detail.campaignRequests.length}</strong> part
            {detail.campaignRequests.length === 1 ? "" : "s"}. Status reflects supplier upload scope:
            only parts they included in their file show as received for review.
          </p>
          <div className="overflow-x-auto rounded-xl border border-outline-variant/15">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-high/50 text-[10px] font-extrabold uppercase tracking-widest text-on-secondary-fixed-variant">
                <tr>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">Manufacturer</th>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Mfr SKU</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Requested</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {detail.campaignRequests.map((cr) => (
                  <tr
                    key={cr.listKey}
                    className="hover:bg-surface-container-low/80"
                  >
                    <td className="px-4 py-3 font-medium text-primary">{cr.supplierName}</td>
                    <td className="px-4 py-3 text-on-surface-variant text-xs">
                      {cr.manufacturer ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-on-surface">{cr.componentName ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{cr.manufacturerSku ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${statusPillClass(cr.status)}`}
                      >
                        {campaignPartStatusLabel(cr.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant text-xs">
                      {cr.requestedAt ? new Date(cr.requestedAt).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">
          Details
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-[10px] uppercase font-bold text-slate-400">Status</dt>
            <dd className="mt-1">
              <span
                className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${statusPillClass(detail.status)}`}
              >
                {detail.status ?? "—"}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase font-bold text-slate-400">Request type</dt>
            <dd className="mt-1 text-on-surface">{detail.request_type}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[10px] uppercase font-bold text-slate-400">Regulations</dt>
            <dd className="mt-2 flex flex-wrap gap-2">
              {detail.regulations.length > 0 ? (
                detail.regulations.map((r) => (
                  <span
                    key={r.regulationId}
                    className="inline-flex items-center gap-1 rounded-lg bg-surface-container-high/60 px-2 py-1 text-xs text-on-surface"
                  >
                    <span className="font-semibold">{r.name}</span>
                    {r.code ? (
                      <span className="font-mono text-on-surface-variant">({r.code})</span>
                    ) : null}
                  </span>
                ))
              ) : (
                <span className="text-on-surface">
                  {detail.regulationName}
                  {detail.regulationCode ? (
                    <span className="text-on-surface-variant font-mono text-xs ml-2">
                      ({detail.regulationCode})
                    </span>
                  ) : null}
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase font-bold text-slate-400">Requested</dt>
            <dd className="mt-1 text-on-surface-variant">
              {detail.requested_at ? new Date(detail.requested_at).toLocaleString() : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase font-bold text-slate-400">Due</dt>
            <dd className="mt-1 text-on-surface-variant">
              {detail.due_date ? new Date(detail.due_date).toLocaleDateString() : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase font-bold text-slate-400">Updated</dt>
            <dd className="mt-1 text-on-surface-variant">
              {detail.updated_at ? new Date(detail.updated_at).toLocaleString() : "—"}
            </dd>
          </div>
          {detail.componentId && (
            <div className="sm:col-span-2">
              <dt className="text-[10px] uppercase font-bold text-slate-400">Component</dt>
              <dd className="mt-1">
                <Link
                  href={`/components/${detail.componentId}`}
                  className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
                >
                  {detail.componentName ?? detail.componentPartNumber ?? "View component"}
                  <MaterialIcon name="open_in_new" className="text-xs" />
                </Link>
              </dd>
            </div>
          )}
          {detail.notes && (
            <div className="sm:col-span-2">
              <dt className="text-[10px] uppercase font-bold text-slate-400">Notes</dt>
              <dd className="mt-1 text-on-surface whitespace-pre-wrap">{detail.notes}</dd>
            </div>
          )}
        </dl>
      </div>

      <SupplierDocumentsList
        title="Uploaded documents"
        emptyMessage="No files uploaded for this request yet."
        items={docItems}
        showServiceRoleHint={missingUrl && rawDocs.length > 0}
      />

      {detail.followUpEligibleComponentIds.length > 0 && detail.supplierContactEmail ? (
        <FollowUpUploadForm requestId={detail.id} />
      ) : null}

      {detail.status === "sent" && rawDocs.length === 0 ? (
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-6 text-sm text-on-surface-variant">
          Waiting for the supplier to upload documentation. Review opens once a file is received or if the
          request moves past &quot;sent&quot;.
        </div>
      ) : (
        <CampaignOutreachReviewForm
          anchorRequestId={detail.id}
          blocks={detail.campaignReviewBlocks}
        />
      )}
    </div>
  );
}
