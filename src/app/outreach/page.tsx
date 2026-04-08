import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/profile";
import MaterialIcon from "@/components/ui/MaterialIcon";
import { CampaignDeleteButton } from "./campaign-delete-button";
import { OutreachRequestsTable } from "./outreach-requests-table";

export default async function OutreachPage() {
  await requireProfile();
  const supabase = await createClient();

  const { data: campaigns } = await supabase
    .from("outreach_campaigns")
    .select("id, name, status, created_at, activated_at, regulation_id")
    .order("created_at", { ascending: false })
    .limit(100);

  const campaignRows = (campaigns ?? []) as {
    id: string;
    name: string;
    status: string | null;
    created_at: string | null;
    activated_at: string | null;
    regulation_id: string | null;
  }[];

  const { data: requests } = await supabase
    .from("outreach_requests")
    .select(
      "id, status, request_type, requested_at, due_date, campaign_id, suppliers(name), components(part_number, name), regulations(code)"
    )
    .order("requested_at", { ascending: false })
    .limit(80);

  const rows = (requests ?? []) as any[];

  function componentLabel(
    c: { part_number?: string | null; name?: string | null } | null | undefined
  ): string | null {
    if (!c) return null;
    const name = c.name?.trim() || "";
    const pn = c.part_number?.trim() || "";
    if (name && pn) return `${name} · ${pn}`;
    return name || pn || null;
  }

  const campaignIds = [
    ...new Set(
      rows.map((r) => r.campaign_id as string | null | undefined).filter(Boolean) as string[]
    ),
  ];
  const multiComponentCampaignIds = new Set<string>();
  for (const cid of campaignIds) {
    const { data: subs } = await supabase
      .from("outreach_requests")
      .select("id, component_id")
      .eq("campaign_id", cid);
    const distinct = new Set<string>();
    for (const s of subs ?? []) {
      const c = s.component_id as string | null;
      if (c) distinct.add(c);
    }
    const reqIds = (subs ?? []).map((s) => s.id as string);
    if (reqIds.length > 0) {
      const { data: junc } = await supabase
        .from("outreach_request_regulations")
        .select("component_id")
        .in("outreach_request_id", reqIds)
        .not("component_id", "is", null);
      for (const j of junc ?? []) {
        const c = j.component_id as string | null;
        if (c) distinct.add(c);
      }
    }
    if (distinct.size > 1) {
      multiComponentCampaignIds.add(cid);
    }
  }

  const requestTableRows = rows.map((r) => {
    const cid = r.campaign_id as string | null | undefined;
    const showMultiple = cid && multiComponentCampaignIds.has(cid);
    const label = componentLabel(
      r.components as { part_number?: string | null; name?: string | null }
    );
    return {
      id: r.id as string,
      supplierName: (r.suppliers?.name as string | undefined) ?? "—",
      partNumber: (r.components?.part_number as string | null | undefined) ?? null,
      componentLabel: label,
      componentPartDisplay: showMultiple ? "Multiple" : label ?? "—",
      requestedAt: (r.requested_at as string | null | undefined) ?? null,
      status: (r.status as string | null | undefined) ?? null,
      dueDate: (r.due_date as string | null | undefined) ?? null,
    };
  });

  const totalPending = rows.filter((r) => r.status === "pending").length;
  const totalSent = rows.filter((r) => r.status === "sent").length;

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-4xl font-extrabold text-primary tracking-tight font-headline mb-2">
            Supplier Outreach Portal
          </h1>
          <p className="text-on-surface-variant font-body max-w-2xl">
            Coordinate and monitor regulatory documentation requests across your global supply chain.
          </p>
        </div>

        <Link
          href="/outreach/new"
          className="bg-gradient-to-br from-primary to-primary-container text-white px-6 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2 hover:scale-[1.02] transition-transform font-body"
        >
          <MaterialIcon name="campaign" className="text-lg" />
          Create New Outreach Campaign
        </Link>
      </div>

      {/* Active campaign bento */}
      <section className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 inline-block">
                    High Priority
                  </span>
                  <h3 className="text-2xl font-bold text-primary mb-1">
                    Annual RoHS & REACH Compliance Campaign
                  </h3>
                  <p className="text-on-surface-variant text-sm">
                    Targeting critical suppliers for updated declarations.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-extrabold text-primary">{totalSent > 0 ? 65 : 0}%</span>
                  <p className="text-xs text-on-surface-variant font-medium">Responses Received</p>
                </div>
              </div>

              <div className="w-full bg-surface-container-high h-3 rounded-full overflow-hidden mb-6">
                <div
                  className="bg-gradient-to-r from-primary to-tertiary-fixed-dim h-full rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, totalSent ? 65 : 0))}%` }}
                />
              </div>

              <div className="flex gap-4">
                <div className="bg-surface-container-low px-4 py-3 rounded-lg flex-1">
                  <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-tighter">
                    Sent
                  </p>
                  <p className="text-lg font-bold text-primary">{totalSent}</p>
                </div>
                <div className="bg-surface-container-low px-4 py-3 rounded-lg flex-1">
                  <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-tighter">
                    Pending
                  </p>
                  <p className="text-lg font-bold text-primary">{totalPending}</p>
                </div>
                <div className="bg-surface-container-low px-4 py-3 rounded-lg flex-1 border-l-4 border-tertiary-fixed-dim">
                  <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-tighter">
                    Approved
                  </p>
                  <p className="text-lg font-bold text-primary">—</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-primary text-white p-8 rounded-xl shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold mb-4 opacity-90">Template Preview</h3>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <MaterialIcon name="mail" className="text-tertiary-fixed-dim text-xl" />
                <span className="text-xs font-medium">Standard Request v2.4</span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-80 italic">
                “Dear [Supplier Name], please provide updated RoHS & REACH declarations for the following components by [Due Date]...”
              </p>
            </div>
          </div>
          <div className="mt-6">
            <Link
              href="/outreach/templates"
              className="text-tertiary-fixed-dim text-sm font-bold flex items-center gap-2 hover:underline font-body"
            >
              Edit template <MaterialIcon name="north_east" className="text-sm" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-surface-container-low rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-outline-variant/10 flex flex-wrap items-center justify-between gap-4">
          <h4 className="text-sm font-bold text-primary uppercase tracking-widest">
            Campaigns
          </h4>
          <Link
            href="/outreach/new"
            className="text-xs font-semibold text-primary hover:underline font-body"
          >
            New campaign
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-high/50">
              <tr>
                <th className="px-6 py-3 text-[10px] font-extrabold text-on-secondary-fixed-variant uppercase tracking-widest">
                  Name
                </th>
                <th className="px-6 py-3 text-[10px] font-extrabold text-on-secondary-fixed-variant uppercase tracking-widest">
                  Status
                </th>
                <th className="px-6 py-3 text-[10px] font-extrabold text-on-secondary-fixed-variant uppercase tracking-widest">
                  Created
                </th>
                <th className="px-6 py-3 text-[10px] font-extrabold text-on-secondary-fixed-variant uppercase tracking-widest text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface-container-lowest">
              {campaignRows.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-sm text-on-surface-variant" colSpan={4}>
                    No campaigns yet. Create one to send supplier documentation requests.
                  </td>
                </tr>
              ) : (
                campaignRows.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t border-outline-variant/10 hover:bg-surface-container-low/80 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-primary">{c.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-surface-container-high text-on-surface-variant">
                        {c.status ?? "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      {c.created_at
                        ? new Date(c.created_at).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <CampaignDeleteButton campaignId={c.id} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Filters & Table */}
      <section className="bg-surface-container-low rounded-2xl overflow-hidden">
        <div className="p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h4 className="text-sm font-bold text-primary uppercase tracking-widest mr-4">
              Supplier Requests
            </h4>
            <div className="flex bg-surface-container-lowest p-1 rounded-lg">
              <button className="px-4 py-1.5 text-xs font-bold rounded-md bg-primary text-white">
                All
              </button>
              <button className="px-4 py-1.5 text-xs font-medium text-slate-500 hover:text-primary">
                Sent
              </button>
              <button className="px-4 py-1.5 text-xs font-medium text-slate-500 hover:text-primary">
                In Review
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <select className="bg-surface-container-lowest border-none text-xs font-medium rounded-lg px-4 py-2 text-on-surface ring-0 focus:ring-1 focus:ring-primary/20">
              <option>Status: All</option>
              <option>Status: Received</option>
              <option>Status: Rejected</option>
            </select>
            <select className="bg-surface-container-lowest border-none text-xs font-medium rounded-lg px-4 py-2 text-on-surface ring-0 focus:ring-1 focus:ring-primary/20">
              <option>Component: All Types</option>
              <option>Active Components</option>
              <option>Passives</option>
            </select>
          </div>
        </div>

        <OutreachRequestsTable rows={requestTableRows} />

        <div className="p-6 bg-surface-container-high/30 flex justify-between items-center">
          <p className="text-xs text-on-surface-variant">
            Showing {rows.length} request(s)
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="w-8 h-8 rounded flex items-center justify-center text-slate-400 hover:bg-white"
              aria-label="Previous page"
            >
              <MaterialIcon name="chevron_left" />
            </button>
            <button className="w-8 h-8 rounded flex items-center justify-center bg-primary text-white text-xs font-bold">
              1
            </button>
            <button className="w-8 h-8 rounded flex items-center justify-center text-slate-600 hover:bg-white text-xs">
              2
            </button>
            <button
              type="button"
              className="w-8 h-8 rounded flex items-center justify-center text-slate-400 hover:bg-white"
              aria-label="Next page"
            >
              <MaterialIcon name="chevron_right" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
