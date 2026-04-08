"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MaterialIcon from "@/components/ui/MaterialIcon";
import { deleteOutreachRequestsBulk } from "./actions";
import { OutreachRequestDeleteButton } from "./outreach-request-delete-button";

export type OutreachRequestRow = {
  id: string;
  supplierName: string;
  partNumber: string | null;
  /** Component name and part number combined when available */
  componentLabel: string | null;
  /** Shown in table: "Multiple" when campaign has multiple components */
  componentPartDisplay: string;
  requestedAt: string | null;
  status: string | null;
  dueDate: string | null;
};

function statusPillClass(status: string) {
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
    case "pending":
    default:
      return "bg-secondary-fixed-dim/20 text-on-secondary-container";
  }
}

export function OutreachRequestsTable({ rows }: { rows: OutreachRequestRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [bulkPending, setBulkPending] = useState(false);

  const rowsIdKey = rows
    .map((r) => r.id)
    .sort()
    .join(",");

  useEffect(() => {
    const ids = new Set(rows.map((r) => r.id));
    setSelected((prev) => {
      const next = new Set<string>();
      for (const id of prev) {
        if (ids.has(id)) next.add(id);
      }
      return next;
    });
  }, [rowsIdKey]);

  const allSelected =
    rows.length > 0 && rows.every((r) => selected.has(r.id));
  const selectedCount = selected.size;

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      if (rows.length === 0) return prev;
      if (prev.size === rows.length) {
        return new Set();
      }
      return new Set(rows.map((r) => r.id));
    });
  }, [rows]);

  const toggleOne = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (selectedCount === 0) return;
    if (
      !confirm(
        `Delete ${selectedCount} supplier request(s)? Response links for them will be removed. This cannot be undone.`
      )
    ) {
      return;
    }
    setBulkPending(true);
    try {
      const result = await deleteOutreachRequestsBulk([...selected]);
      if (!result.ok) {
        alert(result.error);
        return;
      }
      if (result.deleted < selectedCount) {
        alert(
          `Removed ${result.deleted} request(s). Some IDs may have been invalid or already deleted.`
        );
      }
      setSelected(new Set());
      router.refresh();
    } finally {
      setBulkPending(false);
    }
  }, [selected, selectedCount, router]);

  return (
    <>
      {selectedCount > 0 && (
        <div className="px-6 py-3 border-b border-outline-variant/10 bg-error-container/10 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-on-surface font-body">
            <strong>{selectedCount}</strong> selected
          </p>
          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={bulkPending}
            className="inline-flex items-center gap-2 rounded-lg bg-error px-4 py-2 text-xs font-bold text-white hover:bg-error/90 transition-colors font-body disabled:opacity-50"
          >
            <MaterialIcon name="delete_sweep" className="text-base" />
            {bulkPending ? "Deleting…" : `Delete ${selectedCount} selected`}
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-container-high/50">
            <tr>
              <th className="w-10 px-4 py-4">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  disabled={rows.length === 0}
                  className="rounded text-primary focus:ring-primary border-slate-300"
                  aria-label="Select all requests on this page"
                />
              </th>
              <th className="px-4 py-4 text-[10px] font-extrabold text-on-secondary-fixed-variant uppercase tracking-widest">
                Supplier Name
              </th>
              <th className="px-8 py-4 text-[10px] font-extrabold text-on-secondary-fixed-variant uppercase tracking-widest">
                Component / part
              </th>
              <th className="px-8 py-4 text-[10px] font-extrabold text-on-secondary-fixed-variant uppercase tracking-widest">
                Request Date
              </th>
              <th className="px-8 py-4 text-[10px] font-extrabold text-on-secondary-fixed-variant uppercase tracking-widest">
                Status
              </th>
              <th className="px-8 py-4 text-[10px] font-extrabold text-on-secondary-fixed-variant uppercase tracking-widest">
                Due Date
              </th>
              <th className="px-8 py-4 text-[10px] font-extrabold text-on-secondary-fixed-variant uppercase tracking-widest text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-surface-container-lowest">
            {rows.length === 0 ? (
              <tr>
                <td
                  className="px-8 py-10 text-center text-sm text-on-surface-variant"
                  colSpan={7}
                >
                  No outreach requests yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.id}
                  className="group hover:bg-surface-container-low transition-colors duration-150"
                >
                  <td className="px-4 py-5 align-middle">
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={() => toggleOne(r.id)}
                      className="rounded text-primary focus:ring-primary border-slate-300"
                      aria-label={`Select request ${r.supplierName}`}
                    />
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-primary font-bold text-xs">
                        {r.supplierName.trim().length >= 2
                          ? r.supplierName.trim().slice(0, 2).toUpperCase()
                          : "—"}
                      </div>
                      <span className="text-sm font-semibold text-primary">{r.supplierName}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm text-on-surface-variant">
                    <span
                      className="font-mono text-xs block"
                      title={r.componentPartDisplay !== "Multiple" ? r.componentPartDisplay : undefined}
                    >
                      {r.componentPartDisplay}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-sm text-on-surface-variant">
                    {r.requestedAt ? new Date(r.requestedAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-8 py-5">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${statusPillClass(r.status ?? "pending")}`}
                    >
                      {r.status ?? "pending"}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-sm text-on-surface-variant">
                    {r.dueDate ? new Date(r.dueDate).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/outreach/requests/${r.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                      >
                        View
                        <MaterialIcon name="chevron_right" className="text-sm" />
                      </Link>
                      <OutreachRequestDeleteButton requestId={r.id} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
