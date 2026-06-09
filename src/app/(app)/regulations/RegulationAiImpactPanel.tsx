"use client";

import { useState } from "react";
import MaterialIcon from "@/components/ui/MaterialIcon";
import { aiAnalyzeRegulationImpact, type RegulationImpactAssessment } from "./ai-impact-actions";

type Regulation = { id: string; code: string; name: string };

function priorityClass(p: string) {
  switch (p) {
    case "high": return "bg-error-container/60 text-error";
    case "medium": return "bg-yellow-100 text-yellow-700";
    default: return "bg-blue-50 text-blue-600";
  }
}

export default function RegulationAiImpactPanel({ regulations }: { regulations: Regulation[] }) {
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ assessment: RegulationImpactAssessment; code: string } | null>(null);

  async function runAnalysis() {
    if (!selectedId) return;
    setLoading(true);
    setError(null);
    const res = await aiAnalyzeRegulationImpact(selectedId);
    setLoading(false);
    if (!res.ok) { setError(res.error); return; }
    setResult({ assessment: res.assessment, code: res.regulationCode });
  }

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-outline-variant/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-tertiary-fixed-dim/20 flex items-center justify-center text-tertiary-container">
            <MaterialIcon name="auto_awesome" className="text-sm" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-primary font-headline">AI Regulation Impact Analysis</h3>
            <p className="text-xs text-on-surface-variant">Select a regulation to see which components and products need attention</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedId}
            onChange={(e) => { setSelectedId(e.target.value); setResult(null); setError(null); }}
            className="flex-1 px-3 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">— Select a regulation —</option>
            {regulations.map((r) => (
              <option key={r.id} value={r.id}>{r.code} — {r.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={runAnalysis}
            disabled={!selectedId || loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-40 shrink-0"
          >
            {loading ? (
              <><div className="w-4 h-4 rounded-full border-2 border-on-primary border-t-transparent animate-spin" />Analyzing…</>
            ) : (
              <><MaterialIcon name="auto_awesome" className="text-sm" />Analyze Impact</>
            )}
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-300 bg-error-container/20 p-3 text-sm text-error">{error}</div>
        )}

        {result && (
          <div className="space-y-5">
            <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-extrabold uppercase tracking-widest text-on-secondary-fixed-variant">
                  {result.code} — Impact Summary
                </span>
                <span className="text-[10px] text-on-surface-variant ml-auto">
                  {new Date(result.assessment.assessed_at).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-on-surface leading-relaxed">{result.assessment.summary}</p>
            </div>

            {result.assessment.recommended_actions.length > 0 && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs font-extrabold uppercase tracking-widest text-primary mb-2">Recommended Actions</p>
                <ol className="space-y-1.5">
                  {result.assessment.recommended_actions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-on-surface">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center text-[10px] font-bold mt-0.5">{i + 1}</span>
                      {action}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {result.assessment.impacted_components.length > 0 ? (
              <div>
                <p className="text-xs font-extrabold uppercase tracking-widest text-on-secondary-fixed-variant mb-3">
                  Affected Components ({result.assessment.impacted_components.length})
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="text-[11px] font-extrabold uppercase tracking-widest text-on-secondary-fixed-variant border-b border-outline-variant/10">
                        <th className="pb-3 pr-4">Component</th>
                        <th className="pb-3 pr-4">Category</th>
                        <th className="pb-3 pr-4">Priority</th>
                        <th className="pb-3 pr-4">Why affected</th>
                        <th className="pb-3">Action needed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {result.assessment.impacted_components.map((c) => (
                        <tr key={c.component_id} className="hover:bg-surface-container-low align-top">
                          <td className="py-3 pr-4 font-medium text-primary max-w-[160px] break-words">
                            <a href={`/components/${c.component_id}`} className="hover:underline">{c.component_name}</a>
                            {c.part_number && <div className="text-[10px] font-mono text-on-surface-variant">{c.part_number}</div>}
                          </td>
                          <td className="py-3 pr-4 text-on-surface-variant text-xs">{c.category ?? "—"}</td>
                          <td className="py-3 pr-4">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${priorityClass(c.priority)}`}>{c.priority}</span>
                          </td>
                          <td className="py-3 pr-4 text-xs text-on-surface-variant max-w-[180px] leading-relaxed">{c.reason}</td>
                          <td className="py-3 text-xs text-primary font-medium max-w-[180px] leading-relaxed">{c.action_needed}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant italic">No components identified as affected by this regulation.</p>
            )}

            {result.assessment.impacted_products.length > 0 && (
              <div>
                <p className="text-xs font-extrabold uppercase tracking-widest text-on-secondary-fixed-variant mb-3">
                  Affected Products ({result.assessment.impacted_products.length})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {result.assessment.impacted_products.map((p) => (
                    <a
                      key={p.product_id}
                      href={`/products/${p.product_id}?tab=bom`}
                      className="block p-4 rounded-xl border border-outline-variant/20 hover:border-primary/30 hover:bg-surface-container-low transition-colors"
                    >
                      <div className="font-bold text-primary text-sm">{p.product_name}</div>
                      <div className="text-xs text-on-surface-variant mt-1">
                        {p.affected_component_count} affected component{p.affected_component_count !== 1 ? "s" : ""}
                      </div>
                      <div className="text-xs text-on-surface-variant mt-1 leading-relaxed">{p.reason}</div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <p className="text-[10px] text-on-surface-variant italic">
              AI impact analysis is advisory. Validate with official regulation text and supplier declarations before making compliance decisions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
