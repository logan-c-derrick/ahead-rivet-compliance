"use client";

import { useState } from "react";
import MaterialIcon from "@/components/ui/MaterialIcon";
import { aiRiskAssessProduct, type ProductRiskAssessment, type ComponentRiskFlag } from "../ai-risk";
import type { ProductBomComponent } from "../actions";

function riskBadgeClass(level: ComponentRiskFlag["risk_level"]) {
  switch (level) {
    case "high":
      return "bg-error-container/60 text-error";
    case "medium":
      return "bg-yellow-100 text-yellow-700";
    case "low":
      return "bg-blue-50 text-blue-600";
    case "none":
    default:
      return "bg-tertiary-fixed-dim/20 text-tertiary-container";
  }
}

function overallRiskClass(level: ProductRiskAssessment["overall_risk"]) {
  switch (level) {
    case "high":
      return "border-error/30 bg-error-container/10";
    case "medium":
      return "border-yellow-200 bg-yellow-50";
    case "low":
      return "border-blue-200 bg-blue-50";
    case "none":
    default:
      return "border-green-200 bg-green-50";
  }
}

function overallRiskIcon(level: ProductRiskAssessment["overall_risk"]) {
  switch (level) {
    case "high":
      return "dangerous";
    case "medium":
      return "warning";
    case "low":
      return "info";
    case "none":
    default:
      return "check_circle";
  }
}

export default function ProductAiRiskPanel({
  productId,
  bomRows,
}: {
  productId: string;
  bomRows: ProductBomComponent[];
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<ProductRiskAssessment | null>(null);

  async function runAssessment() {
    setLoading(true);
    setError(null);
    const result = await aiRiskAssessProduct(productId, bomRows);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
    } else {
      setAssessment(result.assessment);
    }
  }

  const highCount = assessment?.components.filter((c) => c.risk_level === "high").length ?? 0;
  const medCount = assessment?.components.filter((c) => c.risk_level === "medium").length ?? 0;

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-outline-variant/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-tertiary-fixed-dim/20 flex items-center justify-center text-tertiary-container">
            <MaterialIcon name="auto_awesome" className="text-sm" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-primary font-headline">AI Compliance Risk Assessment</h3>
            <p className="text-xs text-on-surface-variant">
              Analyze BOM components for RoHS / REACH substance risk
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={runAssessment}
          disabled={loading || bomRows.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-opacity shrink-0"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-on-primary border-t-transparent animate-spin" />
              Analyzing…
            </>
          ) : (
            <>
              <MaterialIcon name="auto_awesome" className="text-sm" />
              {assessment ? "Re-run Assessment" : "Run Assessment"}
            </>
          )}
        </button>
      </div>

      {bomRows.length === 0 && (
        <div className="px-6 py-8 text-center text-sm text-on-surface-variant">
          Add BOM components to this product before running a risk assessment.
        </div>
      )}

      {error && (
        <div className="mx-6 mt-4 rounded-xl border border-red-300 bg-error-container/20 p-3 text-sm text-error">
          {error}
        </div>
      )}

      {!assessment && !loading && bomRows.length > 0 && !error && (
        <div className="px-6 py-8 text-center text-sm text-on-surface-variant">
          Click <span className="font-bold text-primary">Run Assessment</span> to have AI analyze your {bomRows.length} BOM component{bomRows.length !== 1 ? "s" : ""} for RoHS and REACH substance risks.
        </div>
      )}

      {assessment && (
        <div className="p-6 space-y-5">
          {/* Summary banner */}
          <div className={`rounded-xl border p-4 flex items-start gap-3 ${overallRiskClass(assessment.overall_risk)}`}>
            <MaterialIcon
              name={overallRiskIcon(assessment.overall_risk)}
              className={`text-xl shrink-0 mt-0.5 ${
                assessment.overall_risk === "high" ? "text-error" :
                assessment.overall_risk === "medium" ? "text-yellow-600" :
                assessment.overall_risk === "low" ? "text-blue-600" : "text-green-600"
              }`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`text-xs font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${riskBadgeClass(assessment.overall_risk)}`}>
                  Overall Risk: {assessment.overall_risk}
                </span>
                {highCount > 0 && (
                  <span className="text-xs font-bold text-error">{highCount} high-risk component{highCount !== 1 ? "s" : ""}</span>
                )}
                {medCount > 0 && (
                  <span className="text-xs font-bold text-yellow-600">{medCount} medium-risk</span>
                )}
              </div>
              <p className="text-sm text-on-surface leading-relaxed">{assessment.summary}</p>
              <p className="text-[10px] text-on-surface-variant mt-1">
                Assessed {new Date(assessment.assessed_at).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Per-component table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-[11px] font-extrabold uppercase tracking-widest text-on-secondary-fixed-variant border-b border-outline-variant/10">
                  <th className="pb-3 pr-4">Component</th>
                  <th className="pb-3 pr-4">Part #</th>
                  <th className="pb-3 pr-4">Risk</th>
                  <th className="pb-3 pr-4">Regulations</th>
                  <th className="pb-3 pr-4">Substances of Concern</th>
                  <th className="pb-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {[...assessment.components]
                  .sort((a, b) => {
                    const order = { high: 0, medium: 1, low: 2, none: 3 };
                    return order[a.risk_level] - order[b.risk_level];
                  })
                  .map((c) => (
                    <tr key={c.component_id} className="hover:bg-surface-container-low transition-colors align-top">
                      <td className="py-3 pr-4 font-medium text-on-surface max-w-[160px] break-words">{c.component_name}</td>
                      <td className="py-3 pr-4 text-on-surface-variant text-xs font-mono max-w-[100px] break-all">{c.part_number ?? "—"}</td>
                      <td className="py-3 pr-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${riskBadgeClass(c.risk_level)}`}>
                          {c.risk_level}
                        </span>
                      </td>
                      <td className="py-3 pr-4 max-w-[120px]">
                        {c.regulations.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {c.regulations.map((r) => (
                              <span key={r} className="px-1.5 py-0.5 bg-surface-container-high rounded text-[10px] font-bold text-on-surface-variant">
                                {r}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-on-surface-variant">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 max-w-[160px]">
                        {c.substances.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {c.substances.map((s) => (
                              <span key={s} className="text-[10px] text-on-surface-variant">{s}</span>
                            )).reduce<React.ReactNode[]>((acc, el, i) => i === 0 ? [el] : [...acc, ", ", el], [])}
                          </div>
                        ) : (
                          <span className="text-on-surface-variant">—</span>
                        )}
                      </td>
                      <td className="py-3 text-xs text-on-surface-variant leading-relaxed max-w-[220px]">{c.reasoning}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <p className="text-[10px] text-on-surface-variant italic">
            AI risk assessment is advisory only. Results should be validated with supplier declarations and laboratory testing before making compliance determinations.
          </p>
        </div>
      )}
    </div>
  );
}
