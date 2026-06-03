"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MaterialIcon from "@/components/ui/MaterialIcon";
import {
  recalculateProductRegulationStatus,
  addProductRegulation,
  removeProductRegulation,
  updateProductOptionalRegulationStatus,
  type ProductRegulationStatusRow,
  type RegulationRow,
} from "../compliance";

function statusPillClass(status: string) {
  switch (status) {
    case "compliant": return "bg-tertiary-fixed-dim/20 text-tertiary-container";
    case "non_compliant": return "bg-error-container/60 text-error";
    case "at_risk": return "bg-secondary-fixed-dim/20 text-on-secondary-container";
    default: return "bg-secondary-fixed/40 text-on-surface-variant";
  }
}

const STATUS_OPTIONS = [
  { value: "compliant", label: "Compliant" },
  { value: "non_compliant", label: "Non-Compliant" },
  { value: "at_risk", label: "At Risk" },
  { value: "pending", label: "Pending" },
];

export default function ProductRegulationManager({
  productId,
  complianceRows,
  allRegulations,
}: {
  productId: string;
  complianceRows: ProductRegulationStatusRow[];
  allRegulations: RegulationRow[];
}) {
  const router = useRouter();
  const [recalcLoading, setRecalcLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [removingCode, setRemovingCode] = useState<string | null>(null);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [savingCode, setSavingCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const defaultRows = complianceRows.filter((r) => r.is_default);
  const optionalRows = complianceRows.filter((r) => !r.is_default);

  // Regulations not yet added to this product
  const addedCodes = new Set(complianceRows.map((r) => r.regulation_code));
  const availableToAdd = allRegulations.filter(
    (r) => !r.is_default && !addedCodes.has(r.code)
  );

  async function handleRecalculate() {
    setRecalcLoading(true);
    setError(null);
    try {
      await recalculateProductRegulationStatus(productId);
    } catch {
      // recalculateProductRegulationStatus calls redirect() on success — if we reach here it errored
      setError("Recalculate failed. Please try again.");
    }
    setRecalcLoading(false);
  }

  async function handleAdd(reg: RegulationRow) {
    setAddingId(reg.id);
    setError(null);
    const res = await addProductRegulation(productId, reg.id);
    setAddingId(null);
    if (!res.ok) { setError(res.error); return; }
    router.refresh();
  }

  async function handleRemove(row: ProductRegulationStatusRow, regulationId: string) {
    setRemovingCode(row.regulation_code);
    setError(null);
    const res = await removeProductRegulation(productId, regulationId);
    setRemovingCode(null);
    if (!res.ok) { setError(res.error); return; }
    router.refresh();
  }

  function startEdit(row: ProductRegulationStatusRow) {
    setEditingCode(row.regulation_code);
    setEditStatus(row.status);
    setEditNotes(row.notes ?? "");
  }

  async function handleSave(row: ProductRegulationStatusRow, regulationId: string) {
    setSavingCode(row.regulation_code);
    setError(null);
    const res = await updateProductOptionalRegulationStatus(
      productId, regulationId, editStatus, editNotes.trim() || null
    );
    setSavingCode(null);
    if (!res.ok) { setError(res.error); return; }
    setEditingCode(null);
    router.refresh();
  }

  // Build a lookup from code → regulation id for removal/save
  const regIdByCode = new Map(
    allRegulations.map((r) => [r.code, r.id])
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-300 bg-error-container/20 p-3 text-sm text-error">{error}</div>
      )}

      {/* Default regulations — RoHS + REACH, auto-calculated */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-outline-variant/10">
          <div>
            <h3 className="text-sm font-bold text-primary font-headline">Default Regulations</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              RoHS &amp; REACH — auto-calculated from component-level compliance data
            </p>
          </div>
          <button
            type="button"
            onClick={handleRecalculate}
            disabled={recalcLoading}
            className="inline-flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 shrink-0"
          >
            {recalcLoading ? (
              <div className="w-4 h-4 rounded-full border-2 border-on-primary border-t-transparent animate-spin" />
            ) : (
              <MaterialIcon name="refresh" className="text-sm" />
            )}
            Recalculate
          </button>
        </div>
        {defaultRows.length === 0 ? (
          <p className="px-6 py-6 text-sm text-on-surface-variant">
            No compliance data yet. Click <strong>Recalculate</strong> to calculate RoHS &amp; REACH status from BOM components.
          </p>
        ) : (
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-[11px] font-extrabold uppercase tracking-widest text-on-secondary-fixed-variant border-b border-outline-variant/10">
                <th className="px-6 py-3">Regulation</th>
                <th className="px-6 py-3">BOM Verified</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Last Calculated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {defaultRows.map((row) => (
                <tr key={row.regulation_code} className="hover:bg-surface-container-low">
                  <td className="px-6 py-4">
                    <div className="font-bold text-primary">{row.regulation_code}</div>
                    <div className="text-xs text-on-surface-variant">{row.regulation_name}</div>
                  </td>
                  <td className="px-6 py-4 text-on-surface-variant">
                    {row.bom_component_count === 0 ? "—" : `${row.compliant_component_count}/${row.bom_component_count} (${row.verification_percent}%)`}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusPillClass(row.status)}`}>
                      {row.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-on-surface-variant text-xs">
                    {row.compliance_date ? new Date(row.compliance_date).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Optional / additional regulations */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-outline-variant/10">
          <div>
            <h3 className="text-sm font-bold text-primary font-headline">Additional Regulations</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Opt-in regulations manually tracked per-product (PROP65, TAA, TSCA, etc.)
            </p>
          </div>
          {availableToAdd.length > 0 && (
            <div className="flex flex-wrap gap-2 shrink-0">
              {availableToAdd.map((reg) => (
                <button
                  key={reg.id}
                  type="button"
                  onClick={() => handleAdd(reg)}
                  disabled={addingId === reg.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-bold text-primary hover:bg-primary/5 disabled:opacity-40 transition-colors"
                >
                  {addingId === reg.id ? (
                    <div className="w-3 h-3 rounded-full border border-primary border-t-transparent animate-spin" />
                  ) : (
                    <MaterialIcon name="add" className="text-sm" />
                  )}
                  {reg.code}
                </button>
              ))}
            </div>
          )}
        </div>

        {optionalRows.length === 0 ? (
          <div className="px-6 py-6 text-sm text-on-surface-variant">
            {availableToAdd.length > 0 ? (
              <>No additional regulations added yet. Click a regulation button above to track it for this product.</>
            ) : (
              <>All available additional regulations are already being tracked.</>
            )}
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-[11px] font-extrabold uppercase tracking-widest text-on-secondary-fixed-variant border-b border-outline-variant/10">
                <th className="px-6 py-3">Regulation</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Last Updated</th>
                <th className="px-6 py-3">Notes</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {optionalRows.map((row) => {
                const regId = regIdByCode.get(row.regulation_code);
                const isEditing = editingCode === row.regulation_code;
                return (
                  <tr key={row.regulation_code} className="hover:bg-surface-container-low align-top">
                    <td className="px-6 py-4">
                      <div className="font-bold text-primary">{row.regulation_code}</div>
                      <div className="text-xs text-on-surface-variant">{row.regulation_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          className="px-2 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/20 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          {STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusPillClass(row.status)}`}>
                          {row.status.replace("_", " ")}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant text-xs">
                      {row.compliance_date ? new Date(row.compliance_date).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant text-xs max-w-[200px]">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="Optional notes…"
                          className="w-full px-2 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/20 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      ) : (
                        row.notes ?? "—"
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => regId && handleSave(row, regId)}
                              disabled={savingCode === row.regulation_code}
                              className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 disabled:opacity-40"
                            >
                              {savingCode === row.regulation_code ? (
                                <div className="w-3 h-3 rounded-full border border-primary border-t-transparent animate-spin" />
                              ) : (
                                <MaterialIcon name="check" className="text-sm" />
                              )}
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCode(null)}
                              className="text-xs font-bold text-on-surface-variant hover:underline"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEdit(row)}
                              className="text-xs font-bold text-on-surface-variant hover:text-primary inline-flex items-center gap-1"
                            >
                              <MaterialIcon name="edit" className="text-sm" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => regId && handleRemove(row, regId)}
                              disabled={removingCode === row.regulation_code}
                              className="text-xs font-bold text-error hover:underline inline-flex items-center gap-1 disabled:opacity-40"
                            >
                              <MaterialIcon name="remove_circle" className="text-sm" />
                              Remove
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
