import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/profile";
import MaterialIcon from "@/components/ui/MaterialIcon";

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

type Props = {
  searchParams: Promise<{ q?: string; status?: string }>;
};

export default async function DashboardPage({ searchParams }: Props) {
  await requireProfile();
  const { q, status } = await searchParams;
  const query = (q ?? "").trim().toLowerCase();
  const statusFilter = (status ?? "").trim().toLowerCase();
  const supabase = await createClient();

  const { data: regStatuses, error: statusError } = await supabase
    .from("product_regulation_status")
    .select(
      "status, compliance_date, notes, regulation_id, regulations(code, name), product_id, products(name, sku)"
    )
    .order("compliance_date", { ascending: false })
    .limit(250);

  if (statusError) {
    console.error("Error loading product_regulation_status:", statusError);
  }

  const statuses = (regStatuses ?? []) as any[];
  const total = statuses.length;
  const compliantCount = statuses.filter((r) => r.status === "compliant").length;
  const nonCompliantCount = statuses.filter((r) => r.status === "non_compliant").length;
  const atRiskCount = statuses.filter((r) => r.status === "at_risk").length;
  const pendingCount = statuses.filter((r) => r.status === "pending").length;

  const compliancePercent = total === 0 ? 0 : (compliantCount / total) * 100;

  const urgentRows = statuses
    .filter((r) => r.status === "non_compliant" || r.status === "at_risk" || r.status === "pending")
    .filter((r) => (statusFilter ? r.status === statusFilter : true))
    .filter((r) => {
      if (!query) return true;
      const productName = String(r.products?.name ?? "").toLowerCase();
      const sku = String(r.products?.sku ?? "").toLowerCase();
      const regCode = String(r.regulations?.code ?? "").toLowerCase();
      const regName = String(r.regulations?.name ?? "").toLowerCase();
      return (
        productName.includes(query) ||
        sku.includes(query) ||
        regCode.includes(query) ||
        regName.includes(query)
      );
    })
    .slice(0, 6);

  const { data: outreachRows } = await supabase
    .from("outreach_requests")
    .select("id, status")
    .order("requested_at", { ascending: false })
    .limit(50);

  const pendingOutreachCount = (outreachRows ?? []).filter((r: any) => r.status === "pending")
    .length;

  const { data: latestRegs } = await supabase
    .from("regulations")
    .select("code, name")
    .order("effective_date", { ascending: false })
    .limit(2);

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end mb-2">
        <div>
          <p className="text-on-surface-variant font-medium text-sm mb-1 font-body">
            Corporate Environmental Ledger
          </p>
          <h2 className="text-4xl font-extrabold tracking-tight text-primary font-headline">Compliance Summary</h2>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/dashboard/export${query ? `?q=${encodeURIComponent(query)}` : ""}${
              statusFilter ? `${query ? "&" : "?"}status=${encodeURIComponent(statusFilter)}` : ""
            }`}
            className="bg-surface-container-lowest text-primary px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:bg-surface-container-low transition-colors flex items-center gap-2 font-body"
          >
            <MaterialIcon name="file_download" className="text-lg" />
            Export CSV
          </Link>
          <Link
            href="/products"
            className="bg-primary text-on-primary px-5 py-2.5 rounded-lg text-sm font-semibold shadow-lg shadow-primary/20 flex items-center gap-2 hover:opacity-90 transition-opacity font-body"
          >
            <MaterialIcon name="upload_file" className="text-lg" />
            Upload New BOM
          </Link>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest p-8 rounded-xl shadow-[0_20px_40px_rgba(11,28,48,0.03)] flex flex-col justify-between">
          <div>
            <p className="text-on-surface-variant font-semibold text-xs uppercase tracking-widest mb-4 font-body">
              Total Compliance
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-extrabold text-primary tracking-tighter">
                {compliancePercent.toFixed(1)}
              </span>
              <span className="text-2xl font-bold text-primary-container">%</span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-tertiary-fixed-dim to-primary-container"
                style={{ width: `${Math.min(100, Math.max(0, compliancePercent))}%` }}
              />
            </div>
            <p className="text-sm text-on-surface-variant font-body flex items-center gap-1">
              <MaterialIcon name="trending_up" className="text-tertiary-fixed-dim text-base" />
              +1.4% from previous month
            </p>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 grid grid-cols-2 gap-6">
          <div className="bg-surface-container-low p-6 rounded-xl flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-primary">Status by Regulation</h3>
              <MaterialIcon name="more_horiz" className="text-on-surface-variant" />
            </div>
            <div className="flex-1 flex items-end justify-between gap-4 px-2">
              {["RoHS", "REACH", "Prop 65", "TAA"].map((code) => (
                <div key={code} className="w-full flex flex-col items-center gap-2">
                  <div className="w-full bg-primary/20 rounded-t-md h-28 relative group">
                    <div className="absolute bottom-0 w-full bg-primary rounded-t-md h-10 group-hover:opacity-80 transition-opacity" />
                  </div>
                  <span className="text-[10px] font-bold text-on-surface-variant">{code}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-container-low p-6 rounded-xl flex flex-col">
            <h3 className="font-bold text-primary mb-4">Pending Actions</h3>
            <div className="flex gap-4">
              <div className="flex-1 bg-surface-container-lowest p-5 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider mb-1">
                  Pending SVHC
                </p>
                <p className="text-3xl font-extrabold text-primary">{pendingCount + atRiskCount}</p>
              </div>
              <div className="flex-1 bg-error-container/30 p-5 rounded-xl border-l-4 border-error">
                <p className="text-[10px] uppercase font-bold text-error tracking-wider mb-1">Non-Compliant</p>
                <p className="text-3xl font-extrabold text-error">{nonCompliantCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Asymmetric table */}
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 xl:col-span-9">
          <div className="bg-surface-container-lowest rounded-2xl p-1 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <div className="p-6 flex justify-between items-center">
              <h3 className="text-xl font-bold text-primary flex items-center gap-3">
                Urgent Compliance Risks
                <span className="bg-error-container text-error text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {nonCompliantCount} HIGH RISK
                </span>
              </h3>
              <form className="flex gap-2" method="GET" action="/dashboard">
                <input
                  type="search"
                  name="q"
                  defaultValue={q ?? ""}
                  placeholder="Search product, SKU, regulation..."
                  className="px-3 py-2 text-xs rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface-variant min-w-60"
                />
                <select
                  name="status"
                  defaultValue={statusFilter}
                  className="px-2 py-2 text-xs rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface-variant"
                >
                  <option value="">All statuses</option>
                  <option value="non_compliant">Non-compliant</option>
                  <option value="at_risk">At risk</option>
                  <option value="pending">Pending</option>
                </select>
                <button
                  type="submit"
                  className="p-2 hover:bg-surface-container rounded-lg transition-colors text-on-surface-variant"
                  aria-label="Filter"
                >
                  <MaterialIcon name="filter_list" />
                </button>
                <Link
                  href={query ? `/search?q=${encodeURIComponent(query)}` : "/search"}
                  className="p-2 hover:bg-surface-container rounded-lg transition-colors text-on-surface-variant inline-flex"
                  aria-label="Search"
                >
                  <MaterialIcon name="search" />
                </Link>
              </form>
            </div>

            <div className="px-6 pb-6 overflow-x-auto">
              {urgentRows.length === 0 ? (
                <div className="py-10 text-center text-on-surface-variant text-sm font-body">
                  No compliance data yet. Open a product and click{" "}
                  <span className="font-bold text-primary">Recalculate Compliance</span> to populate regulation statuses.
                </div>
              ) : (
                <table className="w-full text-left border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-on-surface-variant font-bold text-[11px] uppercase tracking-wider">
                      <th className="pb-4 pl-4">Product / Component</th>
                      <th className="pb-4">Regulation</th>
                      <th className="pb-4">Status</th>
                      <th className="pb-4">Risk Level</th>
                      <th className="pb-4">Expiry</th>
                      <th className="pb-4 pr-4" />
                    </tr>
                  </thead>
                  <tbody>
                    {urgentRows.map((row: any) => {
                      const status = row.status as string;
                      const riskLevel =
                        status === "non_compliant"
                          ? "CRITICAL"
                          : status === "at_risk"
                            ? "MEDIUM"
                            : status === "pending"
                              ? "LOW"
                              : "LOW";

                      return (
                        <tr
                          key={`${row.product_id}:${row.regulation_id}`}
                          className="group hover:bg-surface-container-low transition-colors rounded-xl overflow-hidden"
                        >
                          <td className="py-4 pl-4 rounded-l-xl">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded bg-surface-container flex items-center justify-center text-primary-container">
                                <span className="text-sm">P</span>
                              </div>
                              <div>
                                <p className="text-sm font-bold text-primary">{row.products?.name ?? "—"}</p>
                                <p className="text-[10px] text-on-surface-variant">SKU: {row.products?.sku ?? "—"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className="bg-surface-container-high text-primary text-[10px] px-2 py-0.5 rounded-md font-bold">
                              {row.regulations?.code ?? "—"}
                            </span>
                          </td>
                          <td className="py-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${statusPillClass(status)}`}>
                              {status === "non_compliant" ? "Non-Compliant" : status === "at_risk" ? "Pending Review" : "Pending"}
                            </span>
                          </td>
                          <td className="py-4">
                            <span
                              className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                                status === "non_compliant"
                                  ? "bg-error-container text-error"
                                  : status === "at_risk"
                                    ? "bg-secondary-container text-on-secondary-container"
                                    : "bg-surface-container text-on-surface-variant"
                              }`}
                            >
                              {riskLevel}
                            </span>
                          </td>
                          <td className="py-4">
                            <p className="text-xs text-on-surface-variant">
                              {row.compliance_date
                                ? `Verified: ${new Date(row.compliance_date).toLocaleDateString()}`
                                : "—"}
                            </p>
                          </td>
                          <td className="py-4 pr-4 rounded-r-xl text-right">
                            <Link
                              href={status === "non_compliant" ? "/outreach" : "/products"}
                              className="text-primary font-bold text-xs hover:underline"
                            >
                              {status === "non_compliant" ? "Remediate" : "Request Data"}
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-3 space-y-6">
          <div className="bg-primary p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <MaterialIcon name="mail" className="text-6xl text-white" />
            </div>
            <div className="relative z-10">
              <h4 className="text-white font-bold mb-2">Supplier Outreach</h4>
              <p className="text-primary-fixed-dim text-xs mb-6">
                {pendingOutreachCount} Suppliers have outstanding declarations.
              </p>
              <Link
                href="/outreach"
                className="w-full bg-white text-primary py-3 rounded-xl text-xs font-bold hover:bg-surface-container-low transition-colors text-center inline-block"
              >
                Initiate Outreach
              </Link>
            </div>
          </div>

          <div className="bg-surface-container-low p-6 rounded-2xl">
            <h4 className="text-primary font-bold text-sm mb-4">Latest Regulations</h4>
            <div className="space-y-4">
              {(latestRegs ?? []).map((r: any, idx: number) => (
                <div
                  key={r.code}
                  className={`bg-white p-3 rounded-lg shadow-sm border-l-2 ${
                    idx % 2 === 0 ? "border-primary-container" : "border-tertiary-fixed-dim"
                  }`}
                >
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-1">Update: {r.code}</p>
                  <p className="text-xs text-on-surface font-medium">{r.name ?? "—"}</p>
                </div>
              ))}
              {(latestRegs ?? []).length === 0 ? (
                <div className="text-sm text-on-surface-variant">No regulation data.</div>
              ) : null}
            </div>
            <Link
              href="/regulations"
              className="mt-4 text-primary text-xs font-bold flex items-center gap-1 group font-body"
            >
              Compliance Library{" "}
              <MaterialIcon
                name="arrow_forward"
                className="text-sm group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-primary/5">
            <h4 className="text-primary font-bold text-sm mb-6 text-center">Product Portfolio</h4>
            <div className="relative w-32 h-32 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full bg-surface-container-low" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-extrabold text-primary leading-none">{Math.round(compliancePercent)}%</span>
                <span className="text-[8px] font-bold text-on-surface-variant uppercase">Full</span>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center text-[10px]">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim" /> Compliant
                </span>
                <span className="font-bold">{compliantCount}</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-error" /> Non-Compliant
                </span>
                <span className="font-bold">{nonCompliantCount}</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary-fixed-dim" /> Pending
                </span>
                <span className="font-bold">{pendingCount + atRiskCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
