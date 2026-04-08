import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/profile";
import MaterialIcon from "@/components/ui/MaterialIcon";

function formatDetails(details: any) {
  try {
    const str = typeof details === "string" ? details : JSON.stringify(details ?? {});
    return str.length > 140 ? str.slice(0, 140) + "…" : str;
  } catch {
    return "—";
  }
}

export default async function AuditPage() {
  await requireProfile();
  const supabase = await createClient();

  const { data: logs, error } = await supabase
    .from("audit_logs")
    .select("id, action, resource_type, resource_id, details, created_at, user_id, profiles(email, full_name)")
    .order("created_at", { ascending: false })
    .limit(120);

  if (error) {
    console.error("Error fetching audit logs:", error);
  }

  const rows = (logs ?? []) as any[];

  return (
    <div className="p-8 space-y-8">
      <header className="space-y-4">
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <span className="font-medium">Compliance Portal</span>
          <span className="opacity-60">/</span>
          <span className="font-semibold text-primary">Audit Logs</span>
        </div>

        <div className="flex items-end justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary">
              <MaterialIcon name="history" className="text-sm" />
            </div>
            <div>
              <h1 className="text-3xl font-headline font-extrabold tracking-tight text-primary">Audit Logs</h1>
              <p className="text-on-surface-variant mt-2 text-sm">
                Tracking of compliance-related actions for your organization.
              </p>
            </div>
          </div>

          <button className="px-4 py-2 bg-surface-container-lowest text-primary rounded-xl text-sm font-bold hover:bg-surface-container-low transition-colors inline-flex items-center gap-2">
            <MaterialIcon name="download" className="text-sm" />
            Export
          </button>
        </div>
      </header>

      <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between bg-surface-container-low">
          <h2 className="font-headline font-bold text-primary">Activity Stream</h2>
          <span className="text-xs text-on-surface-variant">{rows.length} event(s)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-on-secondary-fixed-variant font-bold text-[11px] uppercase tracking-widest">
                <th className="pb-4 pl-4">When</th>
                <th className="pb-4">Actor</th>
                <th className="pb-4">Action</th>
                <th className="pb-4">Resource</th>
                <th className="pb-4 pr-4">Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-on-surface-variant">
                    No audit events found.
                  </td>
                </tr>
              ) : (
                rows.map((r: any) => (
                  <tr
                    key={r.id}
                    className="group hover:bg-surface-container-low transition-colors rounded-xl"
                  >
                    <td className="py-4 pl-4 text-sm text-on-surface-variant">
                      {r.created_at ? new Date(r.created_at).toLocaleString() : "—"}
                    </td>
                    <td className="py-4 text-sm text-on-surface-variant">
                      {r.profiles?.full_name || r.profiles?.email || r.user_id || "—"}
                    </td>
                    <td className="py-4 text-sm font-bold text-primary">{r.action}</td>
                    <td className="py-4 text-sm text-on-surface-variant">
                      {r.resource_type ?? "—"}
                      {r.resource_id ? `: ${r.resource_id}` : ""}
                    </td>
                    <td className="py-4 pr-4 text-sm text-on-surface-variant">
                      {formatDetails(r.details)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
