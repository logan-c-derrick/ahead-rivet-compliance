import Link from "next/link";
import { requireProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import MaterialIcon from "@/components/ui/MaterialIcon";

type Props = {
  searchParams: Promise<{ q?: string; jurisdiction?: string }>;
};

export default async function RegulationsPage({ searchParams }: Props) {
  await requireProfile();
  const { q, jurisdiction } = await searchParams;
  const query = (q ?? "").trim().toLowerCase();
  const jurisdictionFilter = (jurisdiction ?? "").trim().toLowerCase();
  const supabase = await createClient();

  const { data: regulations, error } = await supabase
    .from("regulations")
    .select(
      "id, code, name, jurisdiction, effective_date, created_at, updated_at, source_first_published_at, source_last_updated_at"
    )
    .order("code");

  const { data: releaseRows } = await supabase
    .from("regulation_releases")
    .select("id, regulation_id, release_key, title, published_at, source_url")
    .order("published_at", { ascending: false })
    .limit(100);

  const releasesByRegulation = new Map<string, any[]>();
  for (const row of releaseRows ?? []) {
    const release = row as any;
    const key = String(release.regulation_id);
    if (!releasesByRegulation.has(key)) releasesByRegulation.set(key, []);
    releasesByRegulation.get(key)!.push(release);
  }

  const filteredRegulations = (regulations ?? []).filter((reg: any) => {
    if (jurisdictionFilter && String(reg.jurisdiction ?? "").toLowerCase() !== jurisdictionFilter) return false;
    if (!query) return true;
    return (
      String(reg.code ?? "").toLowerCase().includes(query) ||
      String(reg.name ?? "").toLowerCase().includes(query) ||
      String(reg.jurisdiction ?? "").toLowerCase().includes(query)
    );
  });

  const jurisdictions = Array.from(
    new Set((regulations ?? []).map((reg: any) => String(reg.jurisdiction ?? "").trim()).filter(Boolean))
  );

  return (
    <div className="p-8 space-y-8">
      <header className="space-y-4">
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <span className="font-medium">Compliance Portal</span>
          <span className="opacity-60">/</span>
          <span className="font-semibold text-primary">Regulations</span>
        </div>

        <div className="flex items-end justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary">
              <MaterialIcon name="policy" className="text-sm" />
            </div>
            <div>
              <h1 className="text-3xl font-headline font-extrabold tracking-tight text-primary">Regulations</h1>
              <p className="text-on-surface-variant mt-2 text-sm">
                Reference directives, laws, and standards used for component and product compliance roll-ups.
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <Link
              href="/regulations/import"
              className="px-4 py-2 border border-outline-variant/30 text-primary rounded-xl text-sm font-bold hover:bg-surface-container-low transition-colors inline-flex items-center gap-2"
            >
              <MaterialIcon name="upload_file" className="text-sm" />
              Import CSV
            </Link>
            <Link
              href="/regulations/new"
              className="px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-bold hover:opacity-90 transition-opacity inline-flex items-center gap-2"
            >
              <MaterialIcon name="add" className="text-sm" />
              Create Regulation
            </Link>
            <button className="px-4 py-2 bg-surface-container-lowest text-primary rounded-xl text-sm font-bold hover:bg-surface-container-low transition-colors inline-flex items-center gap-2">
              <MaterialIcon name="filter_list" className="text-sm" />
              Filter
            </button>
            <form className="flex gap-2 items-center" method="GET" action="/regulations">
              <input
                type="search"
                name="q"
                defaultValue={q ?? ""}
                placeholder="Search code, name, jurisdiction..."
                className="px-3 py-2 rounded-xl text-sm bg-surface-container-low border border-outline-variant/30 min-w-64"
              />
              <select
                name="jurisdiction"
                defaultValue={jurisdictionFilter}
                className="px-3 py-2 rounded-xl text-sm bg-surface-container-low border border-outline-variant/30"
              >
                <option value="">All jurisdictions</option>
                {jurisdictions.map((value) => (
                  <option key={value} value={value.toLowerCase()}>
                    {value}
                  </option>
                ))}
              </select>
              <button className="px-4 py-2 bg-surface-container-lowest text-primary rounded-xl text-sm font-bold hover:bg-surface-container-low transition-colors inline-flex items-center gap-2">
                <MaterialIcon name="filter_list" className="text-sm" />
                Filter
              </button>
            </form>
            <Link
              href={`/regulations/export${query ? `?q=${encodeURIComponent(query)}` : ""}${
                jurisdictionFilter ? `${query ? "&" : "?"}jurisdiction=${encodeURIComponent(jurisdictionFilter)}` : ""
              }`}
              className="px-4 py-2 bg-surface-container-lowest text-primary rounded-xl text-sm font-bold hover:bg-surface-container-low transition-colors inline-flex items-center gap-2"
            >
              <MaterialIcon name="download" className="text-sm" />
              Export
            </Link>
          </div>
        </div>
      </header>

      {error ? (
        <div className="bg-error-container/20 rounded-2xl p-6 shadow-sm">
          <p className="font-bold text-error">Error loading regulations.</p>
          <p className="text-sm text-error mt-2">{error.message}</p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between bg-surface-container-low">
            <h2 className="font-headline font-bold text-primary">Regulation Library</h2>
            <span className="text-xs text-on-surface-variant">
              {filteredRegulations.length} record(s)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-high/40">
                <tr className="text-on-secondary-fixed-variant font-bold text-[11px] uppercase tracking-widest">
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Jurisdiction</th>
                  <th className="px-6 py-4">First published</th>
                  <th className="px-6 py-4">Last updated (source)</th>
                  <th className="px-6 py-4">Latest release</th>
                  <th className="px-6 py-4 text-right">Effective</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegulations.map((reg: any) => (
                  (() => {
                    const regReleases = releasesByRegulation.get(String(reg.id)) ?? [];
                    const latestRelease = regReleases[0];
                    return (
                  <tr
                    key={reg.id}
                    className="group hover:bg-surface-container-low transition-colors"
                  >
                    <td className="px-6 py-5 font-mono text-xs text-on-surface-variant">
                      {reg.code}
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-primary">
                      {reg.name}
                    </td>
                    <td className="px-6 py-5 text-sm text-on-surface-variant">
                      {reg.jurisdiction || "—"}
                    </td>
                    <td className="px-6 py-5 text-sm text-on-surface-variant">
                      {reg.source_first_published_at
                        ? new Date(reg.source_first_published_at).toLocaleDateString()
                        : reg.created_at
                          ? new Date(reg.created_at).toLocaleDateString()
                          : "—"}
                    </td>
                    <td className="px-6 py-5 text-sm text-on-surface-variant">
                      {reg.source_last_updated_at
                        ? new Date(reg.source_last_updated_at).toLocaleString()
                        : reg.updated_at
                          ? new Date(reg.updated_at).toLocaleString()
                          : "—"}
                    </td>
                    <td className="px-6 py-5 text-sm text-on-surface-variant">
                      {latestRelease ? (
                        <div className="space-y-1">
                          <div className="font-mono text-xs text-primary">{latestRelease.release_key}</div>
                          <div className="text-xs truncate max-w-[16rem]">{latestRelease.title ?? "—"}</div>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-5 text-sm text-right text-on-surface-variant">
                      {reg.effective_date
                        ? new Date(reg.effective_date).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                    );
                  })()
                ))}
                {filteredRegulations.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-on-surface-variant">
                      No regulations found for the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-outline-variant/20 px-6 py-4">
            <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-widest mb-3">
              Recent release timeline
            </p>
            <div className="space-y-2">
              {(releaseRows ?? []).slice(0, 8).map((row: any) => (
                <div key={row.id} className="flex items-center justify-between gap-4 text-xs">
                  <div className="text-on-surface-variant">
                    <span className="font-mono text-primary mr-2">{row.release_key}</span>
                    {row.title ?? "Release detected"}
                  </div>
                  <div className="text-on-surface-variant/80 shrink-0">
                    {row.published_at ? new Date(row.published_at).toLocaleDateString() : "—"}
                  </div>
                </div>
              ))}
              {(releaseRows ?? []).length === 0 ? (
                <p className="text-xs text-on-surface-variant">No release versions detected yet.</p>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
