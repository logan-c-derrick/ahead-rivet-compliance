"use client";

import { useState, useTransition } from "react";
import MaterialIcon from "@/components/ui/MaterialIcon";
import {
  updateOemVendor,
  aiVerifyOemVendor,
  applyAiSuggestion,
  type OemVendorRow,
  type AiSuggestion,
} from "./actions";

type AiState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; suggestion: AiSuggestion; vendorId: string }
  | { status: "error"; message: string };

function ConfidenceBadge({ level }: { level: string }) {
  const cls =
    level === "high"
      ? "bg-green-100 text-green-700"
      : level === "medium"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700";
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${cls}`}>
      {level}
    </span>
  );
}

function EditRow({
  vendor,
  onCancel,
  onSaved,
}: {
  vendor: OemVendorRow;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateOemVendor(null, fd);
      if (result.error) {
        setError(result.error);
      } else {
        onSaved();
      }
    });
  }

  return (
    <tr className="bg-blue-50/40">
      <td colSpan={5} className="px-6 py-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="hidden" name="id" value={vendor.id} />
          {error && (
            <p className="text-xs text-red-600 font-body">{error}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                Compliance Team / Contact
              </label>
              <input
                name="compliance_team_name"
                defaultValue={vendor.compliance_team_name ?? ""}
                placeholder="e.g. Environmental Compliance Team"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                Compliance Email
              </label>
              <input
                name="compliance_email"
                type="email"
                defaultValue={vendor.compliance_email ?? ""}
                placeholder="supplier-compliance@oem.com"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                Supplier Portal URL
              </label>
              <input
                name="compliance_portal_url"
                type="url"
                defaultValue={vendor.compliance_portal_url ?? ""}
                placeholder="https://supplier.oem.com/compliance"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                Notes
              </label>
              <input
                name="notes"
                defaultValue={vendor.notes ?? ""}
                placeholder="Additional context"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </td>
    </tr>
  );
}

function AiSuggestionPanel({
  state,
  onApply,
  onDismiss,
}: {
  state: Extract<AiState, { status: "done" }>;
  onApply: (suggestion: AiSuggestion, vendorId: string) => void;
  onDismiss: () => void;
}) {
  const { suggestion, vendorId } = state;
  return (
    <tr className="bg-amber-50/60">
      <td colSpan={5} className="px-6 py-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MaterialIcon name="auto_awesome" className="text-amber-600" />
            <span className="text-sm font-bold text-amber-800">AI Suggestion</span>
            <ConfidenceBadge level={suggestion.confidence} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="block text-[11px] font-bold uppercase text-slate-500 mb-0.5">Team</span>
              <span className="text-slate-800">{suggestion.compliance_team_name ?? "—"}</span>
            </div>
            <div>
              <span className="block text-[11px] font-bold uppercase text-slate-500 mb-0.5">Email</span>
              <span className="text-slate-800 break-all">{suggestion.compliance_email ?? "—"}</span>
            </div>
            <div>
              <span className="block text-[11px] font-bold uppercase text-slate-500 mb-0.5">Portal</span>
              <span className="text-slate-800 break-all">{suggestion.compliance_portal_url ?? "—"}</span>
            </div>
          </div>
          {suggestion.notes && (
            <p className="text-xs text-slate-600 italic">{suggestion.notes}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onApply(suggestion, vendorId)}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:opacity-90"
            >
              Apply suggestion
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
            >
              Dismiss
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function OemVendorsClient({
  initialVendors,
}: {
  initialVendors: OemVendorRow[];
}) {
  const [vendors, setVendors] = useState(initialVendors);
  const [editId, setEditId] = useState<string | null>(null);
  const [aiStates, setAiStates] = useState<Record<string, AiState>>({});
  const [, startTransition] = useTransition();

  function setAiState(vendorId: string, state: AiState) {
    setAiStates((prev) => ({ ...prev, [vendorId]: state }));
  }

  function handleVerify(vendor: OemVendorRow) {
    setAiState(vendor.id, { status: "loading" });
    startTransition(async () => {
      const result = await aiVerifyOemVendor(vendor.id);
      if (result.ok) {
        // Mark verified in local state immediately — ai_verified_at is already written to DB.
        setVendors((prev) =>
          prev.map((v) =>
            v.id === vendor.id
              ? { ...v, ai_verified_at: new Date().toISOString(), ai_verified_notes: result.suggestion.notes }
              : v
          )
        );
        setAiState(vendor.id, { status: "done", suggestion: result.suggestion, vendorId: vendor.id });
      } else {
        setAiState(vendor.id, { status: "error", message: result.error });
      }
    });
  }

  function handleApply(suggestion: AiSuggestion, vendorId: string) {
    startTransition(async () => {
      const result = await applyAiSuggestion(vendorId, suggestion);
      if (result.ok) {
        setVendors((prev) =>
          prev.map((v) =>
            v.id === vendorId
              ? {
                  ...v,
                  compliance_team_name: suggestion.compliance_team_name,
                  compliance_email: suggestion.compliance_email,
                  compliance_portal_url: suggestion.compliance_portal_url,
                  notes: suggestion.notes,
                  ai_verified_at: new Date().toISOString(),
                  ai_verified_notes: suggestion.notes,
                }
              : v
          )
        );
        setAiState(vendorId, { status: "idle" });
      }
    });
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-sm">
      <table className="w-full text-left">
        <thead className="bg-surface-container-high/40">
          <tr>
            <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant">
              Vendor
            </th>
            <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant">
              Compliance Contact
            </th>
            <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant">
              Email
            </th>
            <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant">
              AI Verified
            </th>
            <th className="px-6 py-4 text-right" />
          </tr>
        </thead>
        <tbody>
          {vendors.map((vendor) => {
            const aiState: AiState = aiStates[vendor.id] ?? { status: "idle" };
            const isEditing = editId === vendor.id;

            return (
              <>
                <tr
                  key={vendor.id}
                  className="border-t border-outline-variant/10 hover:bg-surface-container-low/40 transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-primary">{vendor.name}</p>
                    <p className="text-[10px] font-mono text-on-surface-variant">{vendor.code}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">
                    {vendor.compliance_team_name ?? (
                      <span className="text-amber-600 text-xs">Not configured</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {vendor.compliance_email ? (
                      <a
                        href={`mailto:${vendor.compliance_email}`}
                        className="text-sm text-primary hover:underline break-all"
                      >
                        {vendor.compliance_email}
                      </a>
                    ) : (
                      <span className="text-amber-600 text-xs">Not configured</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {vendor.ai_verified_at ? (
                      <div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">
                          <MaterialIcon name="auto_awesome" className="text-xs" />
                          Verified
                        </span>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">
                          {new Date(vendor.ai_verified_at).toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <span className="text-[10px] text-on-surface-variant">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleVerify(vendor)}
                        disabled={aiState.status === "loading"}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold hover:bg-amber-200 disabled:opacity-50 transition-colors"
                        title="Use AI to suggest correct compliance contact"
                      >
                        <MaterialIcon name="auto_awesome" className="text-xs" />
                        {aiState.status === "loading" ? "Checking…" : "AI Verify"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditId(isEditing ? null : vendor.id)}
                        className="text-primary text-xs font-bold hover:underline"
                      >
                        {isEditing ? "Close" : "Edit"}
                      </button>
                    </div>
                    {aiState.status === "error" && (
                      <p className="text-[10px] text-red-600 mt-1 text-right">{aiState.message}</p>
                    )}
                  </td>
                </tr>
                {isEditing && (
                  <EditRow
                    key={`edit-${vendor.id}`}
                    vendor={vendor}
                    onCancel={() => setEditId(null)}
                    onSaved={() => {
                      setEditId(null);
                      window.location.reload();
                    }}
                  />
                )}
                {aiState.status === "done" && (
                  <AiSuggestionPanel
                    key={`ai-${vendor.id}`}
                    state={aiState}
                    onApply={handleApply}
                    onDismiss={() => setAiState(vendor.id, { status: "idle" })}
                  />
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
