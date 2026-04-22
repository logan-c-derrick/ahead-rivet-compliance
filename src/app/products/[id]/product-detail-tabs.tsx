import Link from "next/link";
import type { Product, ProductBomComponent } from "../actions";
import type { ProductRegulationStatusRow } from "../compliance";
import { recalculateProductRegulationStatus } from "../compliance";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "bom", label: "BOM" },
  { id: "regulations", label: "Regulations" },
  { id: "compliance", label: "Compliance" },
  { id: "outreach", label: "Outreach" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function statusPillClass(status: string) {
  switch (status) {
    case "compliant":
      return "bg-tertiary-fixed-dim/20 text-tertiary-container";
    case "non_compliant":
      return "bg-error-container/60 text-error";
    case "at_risk":
      return "bg-secondary-fixed-dim/20 text-on-secondary-container";
    case "pending":
    default:
      return "bg-secondary-fixed/40 text-on-surface-variant";
  }
}

function ComplianceRing({ percent }: { percent: number }) {
  const safe = Math.max(0, Math.min(100, percent));
  const r = 58;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - safe / 100);

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="w-full h-full" viewBox="0 0 140 140">
        <circle
          className="text-surface-container-highest"
          cx="70"
          cy="70"
          fill="transparent"
          r={r}
          stroke="currentColor"
          strokeWidth="8"
        />
        <circle
          className="text-tertiary-fixed-dim"
          cx="70"
          cy="70"
          fill="transparent"
          r={r}
          stroke="currentColor"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-primary">{Math.round(safe)}%</span>
        <span className="text-[10px] font-bold text-tertiary-container uppercase">Pass</span>
      </div>
    </div>
  );
}

export default async function ProductDetailTabs({
  product,
  complianceRows,
  bomRows,
  activeTab,
}: {
  product: Product;
  complianceRows: ProductRegulationStatusRow[];
  bomRows: ProductBomComponent[];
  activeTab: TabId;
}) {
  const total = complianceRows.length;
  const compliantCount = complianceRows.filter((r) => r.status === "compliant").length;
  const pendingCount = complianceRows.filter(
    (r) => r.status === "pending" || r.status === "at_risk"
  ).length;
  const nonCompliantCount = complianceRows.filter((r) => r.status === "non_compliant").length;
  const atRiskCount = complianceRows.filter((r) => r.status === "at_risk").length;

  const hasBom = complianceRows.some((r) => r.bom_component_count > 0);
  const compliancePercent = hasBom
    ? complianceRows.length === 0
      ? 0
      : complianceRows.reduce((a, r) => a + r.verification_percent, 0) / complianceRows.length
    : total === 0
      ? 0
      : (compliantCount / total) * 100;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-surface-container-lowest shadow-sm overflow-hidden">
        <div className="flex flex-wrap gap-2 p-4 bg-surface-container-low">
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <Link
                key={tab.id}
                href={`/products/${product.id}?tab=${tab.id}`}
                className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
                  isActive
                    ? "bg-white text-primary shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-container-lowest"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-8">
                <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-primary font-headline">
                      Regulation Thresholds
                    </h3>
                    <span className="text-xs font-medium text-on-surface-variant">
                      Showing latest tracked statuses
                    </span>
                  </div>

                  <div className="space-y-2">
                    {complianceRows.slice(0, 8).map((row) => (
                      <div
                        key={row.regulation_code}
                        className="grid grid-cols-12 items-center p-4 rounded-xl hover:bg-surface-container-low transition-colors"
                      >
                        <div className="col-span-6">
                          <div className="font-bold text-primary">{row.regulation_code}</div>
                          <div className="text-xs text-on-surface-variant">{row.regulation_name}</div>
                        </div>
                        <div className="col-span-2">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusPillClass(
                              row.status
                            )}`}
                          >
                            {row.status === "at_risk" ? "Pending Review" : row.status}
                          </span>
                        </div>
                        <div className="col-span-4 text-right text-xs text-on-surface-variant">
                          {row.compliance_date ? (
                            <>Last Verified: {new Date(row.compliance_date).toLocaleDateString()}</>
                          ) : (
                            <>Last Verified: —</>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-primary font-headline mb-4">
                    Audit Trail & Compliance History
                  </h3>
                  {complianceRows.length === 0 ? (
                    <p className="text-sm text-on-surface-variant">
                      No compliance updates logged for this product yet. Use{" "}
                      <span className="font-bold">Recalculate Compliance</span> on the Compliance tab after
                      BOM updates to generate the latest status records.
                    </p>
                  ) : (
                    <ul className="space-y-2 text-sm text-on-surface-variant">
                      {complianceRows.slice(0, 4).map((row) => (
                        <li key={`history-${row.regulation_code}`} className="flex items-center justify-between gap-4">
                          <span className="truncate">
                            <span className="font-semibold text-primary">{row.regulation_code}</span>{" "}
                            {row.regulation_name}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${statusPillClass(row.status)}`}>
                            {row.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white/60 rounded-2xl border border-white/40 shadow-xl shadow-primary/5 p-6 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 block">
                    Overall Compliance
                  </span>
                  <div className="flex items-center justify-center mb-4">
                    <ComplianceRing percent={compliancePercent} />
                  </div>
                  <p className="text-xs text-on-surface-variant mb-4 leading-tight">
                    {hasBom ? (
                      <>
                        Average BOM verification across regulations (components marked compliant).
                      </>
                    ) : (
                      <>
                        {pendingCount} Regulation(s) pending review
                        {nonCompliantCount > 0 ? (
                          <>
                            {" "}
                            • <span className="font-bold text-error">{nonCompliantCount} non-compliant</span>
                          </>
                        ) : null}
                      </>
                    )}
                  </p>
                  <Link
                    href="/outreach"
                    className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"
                  >
                    Request Update
                  </Link>
                </div>

                <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-primary font-headline mb-3">Documentation</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Product-level document downloads are not exposed in this view. Use the Certificates or
                    Outreach workflows to request and manage supplier-backed compliance evidence.
                  </p>
                </div>

                <div className="bg-[#eff4ff] rounded-2xl p-6 shadow-sm border border-primary/5">
                  <h3 className="text-lg font-bold text-primary font-headline mb-2">Application Impact</h3>
                  <p className="text-xs text-on-surface-variant mb-4">
                    This product currently has <span className="font-bold">{bomRows.length} linked BOM component{bomRows.length === 1 ? "" : "s"}</span>.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary-container">
                      <span className="text-sm">X</span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-primary">{product.name}</div>
                      <div className="text-[10px] text-on-surface-variant">Regulations tracked: {complianceRows.length}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "bom" && (
            <ProductBomPanel bomRows={bomRows} />
          )}

          {activeTab === "regulations" && (
            <PlaceholderRegulationsPanel complianceRows={complianceRows} />
          )}

          {activeTab === "compliance" && (
            <CompliancePanel
              productId={product.id}
              complianceRows={complianceRows}
            />
          )}

          {activeTab === "outreach" && (
            <PlaceholderPanel
              title="Outreach"
              description="Manage supplier outreach campaigns, templates, and responses from the Outreach hub."
              linkHref="/outreach"
              linkLabel="Open Outreach"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ProductBomPanel({ bomRows }: { bomRows: ProductBomComponent[] }) {
  if (bomRows.length === 0) {
    return (
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-primary font-headline mb-2">BOM</h3>
        <p className="text-sm text-on-surface-variant leading-relaxed">
          No components linked to this product yet. Upload a BOM and select this product in the BOM mapping flow.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-primary font-headline mb-4">Bill of Materials</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-on-surface-variant font-bold text-[11px] uppercase tracking-widest">
                <th className="pb-3">Part Number</th>
                <th className="pb-3">Component</th>
                <th className="pb-3">Manufacturer SKU</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Quantity</th>
                <th className="pb-3">Unit Price</th>
                <th className="pb-3">Unit MSRP</th>
              </tr>
            </thead>
            <tbody>
              {bomRows.map((row) => (
                <tr key={row.component_id} className="border-t border-surface-container-high hover:bg-surface-container-low">
                  <td className="py-3 text-sm font-semibold text-primary">{row.part_number ?? "—"}</td>
                  <td className="py-3">
                    <div className="text-sm text-on-surface">{row.component_name}</div>
                    <div className="text-xs text-on-surface-variant">{row.description ?? "—"}</div>
                  </td>
                  <td className="py-3 text-sm text-on-surface-variant">{row.manufacturer_sku ?? "—"}</td>
                  <td className="py-3 text-sm text-on-surface-variant">{row.category ?? "—"}</td>
                  <td className="py-3 text-sm text-on-surface-variant">{row.quantity ?? "—"}</td>
                  <td className="py-3 text-sm text-on-surface-variant">{row.unit_price ?? "—"}</td>
                  <td className="py-3 text-sm text-on-surface-variant">{row.unit_msrp ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PlaceholderPanel({
  title,
  description,
  linkHref,
  linkLabel,
}: {
  title: string;
  description: string;
  linkHref?: string;
  linkLabel?: string;
}) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-primary font-headline mb-2">{title}</h3>
      <p className="text-sm text-on-surface-variant leading-relaxed">{description}</p>
      {linkHref && linkLabel ? (
        <Link
          href={linkHref}
          className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
        >
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}

function PlaceholderRegulationsPanel({ complianceRows }: { complianceRows: ProductRegulationStatusRow[] }) {
  return (
    <div className="space-y-4">
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-primary font-headline mb-4">Regulation Statuses</h3>
        <div className="space-y-2">
          {complianceRows.map((row) => (
            <div
              key={row.regulation_code}
              className="grid grid-cols-12 items-center p-4 rounded-xl hover:bg-surface-container-low transition-colors"
            >
              <div className="col-span-6">
                <div className="font-bold text-primary">{row.regulation_code}</div>
                <div className="text-xs text-on-surface-variant">{row.regulation_name}</div>
              </div>
              <div className="col-span-3">
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusPillClass(
                    row.status
                  )}`}
                >
                  {row.status}
                </span>
              </div>
              <div className="col-span-3 text-right text-xs text-on-surface-variant">
                {row.compliance_date ? new Date(row.compliance_date).toLocaleDateString() : "—"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CompliancePanel({
  productId,
  complianceRows,
}: {
  productId: string;
  complianceRows: ProductRegulationStatusRow[];
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-primary font-headline">Product Compliance Roll-up</h3>
          <p className="text-sm text-on-surface-variant mt-1">
            Aggregated from component-level regulation statuses.
          </p>
        </div>

        <form action={recalculateProductRegulationStatus.bind(null, productId)}>
          <button
            type="submit"
            className="bg-primary text-on-primary px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
          >
            Recalculate Compliance
          </button>
        </form>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl p-2 shadow-sm overflow-hidden">
        <table className="w-full text-left border-separate border-spacing-y-2 px-4">
          <thead>
            <tr className="text-on-surface-variant font-bold text-[11px] uppercase tracking-widest">
              <th className="pb-4 pl-4">Regulation Code</th>
              <th className="pb-4">Regulation Name</th>
              <th className="pb-4">BOM verified</th>
              <th className="pb-4">Product Status</th>
              <th className="pb-4">Compliance Date</th>
              <th className="pb-4 pr-4">Notes</th>
            </tr>
          </thead>
          <tbody>
            {complianceRows.map((row) => (
              <tr
                key={row.regulation_code}
                className="group hover:bg-surface-container-low transition-colors"
              >
                <td className="py-4 pl-4 rounded-l-xl">
                  <div className="font-bold text-primary">{row.regulation_code}</div>
                </td>
                <td className="py-4">
                  <div className="text-sm text-on-surface-variant">{row.regulation_name}</div>
                </td>
                <td className="py-4 text-sm text-on-surface-variant">
                  {row.bom_component_count === 0 ? (
                    "—"
                  ) : (
                    <>
                      {row.compliant_component_count}/{row.bom_component_count} ({row.verification_percent}%)
                    </>
                  )}
                </td>
                <td className="py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusPillClass(
                      row.status
                    )}`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="py-4 text-sm text-on-surface-variant">
                  {row.compliance_date ? new Date(row.compliance_date).toLocaleDateString() : "—"}
                </td>
                <td className="py-4 pr-4 rounded-r-xl text-sm text-on-surface-variant">
                  {row.notes ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
