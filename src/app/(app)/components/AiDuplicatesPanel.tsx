"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MaterialIcon from "@/components/ui/MaterialIcon";
import { aiDetectDuplicates, mergeComponents, type DuplicateGroup } from "./ai-duplicate-actions";

function confidenceClass(c: DuplicateGroup["confidence"]) {
  switch (c) {
    case "high": return "bg-error-container/60 text-error";
    case "medium": return "bg-yellow-100 text-yellow-700";
    default: return "bg-blue-50 text-blue-600";
  }
}

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl bg-surface-container-lowest p-6 shadow-xl border border-outline-variant/20 max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

export default function AiDuplicatesPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<DuplicateGroup[] | null>(null);
  const [primarySelections, setPrimarySelections] = useState<Record<number, string>>({});
  const [merging, setMerging] = useState<number | null>(null);
  const [mergeErrors, setMergeErrors] = useState<Record<number, string>>({});
  const [merged, setMerged] = useState<Set<number>>(new Set());

  async function runDetection() {
    setLoading(true);
    setError(null);
    setGroups(null);
    setPrimarySelections({});
    setMerged(new Set());
    const res = await aiDetectDuplicates();
    setLoading(false);
    if (!res.ok) { setError(res.error); return; }
    setGroups(res.groups);
    const defaults: Record<number, string> = {};
    res.groups.forEach((g, i) => { if (g.component_ids[0]) defaults[i] = g.component_ids[0]; });
    setPrimarySelections(defaults);
  }

  async function handleMerge(groupIdx: number, group: DuplicateGroup) {
    const primaryId = primarySelections[groupIdx];
    if (!primaryId) return;
    const duplicateIds = group.component_ids.filter((id) => id !== primaryId);
    setMerging(groupIdx);
    setMergeErrors((prev) => ({ ...prev, [groupIdx]: "" }));
    const res = await mergeComponents(primaryId, duplicateIds);
    setMerging(null);
    if (!res.ok) {
      setMergeErrors((prev) => ({ ...prev, [groupIdx]: res.error }));
    } else {
      setMerged((prev) => new Set([...prev, groupIdx]));
      router.refresh();
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-tertiary-fixed-dim/20 flex items-center justify-center text-tertiary-container">
            <MaterialIcon name="auto_awesome" className="text-sm" />
          </div>
          <h2 className="text-lg font-bold text-primary font-headline">AI Duplicate Detection</h2>
        </div>
        <button type="button" onClick={onClose} className="text-on-surface-variant/60 hover:text-primary rounded p-1">
          <MaterialIcon name="close" className="text-xl" />
        </button>
      </div>

      {!groups && !loading && (
        <div className="text-center py-6 space-y-4">
          <p className="text-sm text-on-surface-variant">
            AI will scan your component catalog for likely duplicate entries — same physical part entered under different names or part number formats.
          </p>
          {error && (
            <div className="rounded-xl border border-red-300 bg-error-container/20 p-3 text-sm text-error">{error}</div>
          )}
          <button
            type="button"
            onClick={runDetection}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold hover:opacity-90"
          >
            <MaterialIcon name="auto_awesome" className="text-sm" />
            Scan for Duplicates
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-on-surface-variant">Analyzing component catalog…</p>
        </div>
      )}

      {groups !== null && !loading && (
        <div className="space-y-4">
          {groups.length === 0 ? (
            <div className="text-center py-6">
              <MaterialIcon name="check_circle" className="text-4xl text-green-500 mb-2" />
              <p className="text-sm font-bold text-on-surface">No duplicates found!</p>
              <p className="text-xs text-on-surface-variant mt-1">Your component catalog looks clean.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-on-surface-variant">
                Found <strong className="text-primary">{groups.length - merged.size}</strong> potential duplicate group{groups.length - merged.size !== 1 ? "s" : ""}. Select which component to keep as the primary record — all product links and regulation data will be merged into it.
              </p>

              {groups.map((group, i) => {
                if (merged.has(i)) {
                  return (
                    <div key={i} className="p-4 rounded-xl border border-green-200 bg-green-50 flex items-center gap-2 text-sm text-green-700">
                      <MaterialIcon name="check_circle" className="text-green-500" />
                      Group merged successfully.
                    </div>
                  );
                }
                return (
                  <div key={i} className="rounded-xl border border-outline-variant/20 overflow-hidden">
                    <div className="px-4 py-3 bg-surface-container-low flex items-center justify-between gap-3">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${confidenceClass(group.confidence)}`}>
                        {group.confidence} confidence
                      </span>
                      <p className="text-xs text-on-surface-variant flex-1">{group.reasoning}</p>
                    </div>
                    <div className="divide-y divide-outline-variant/10">
                      {group.component_ids.map((id, j) => (
                        <label key={id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-container-low cursor-pointer">
                          <input
                            type="radio"
                            name={`primary-${i}`}
                            value={id}
                            checked={primarySelections[i] === id}
                            onChange={() => setPrimarySelections((prev) => ({ ...prev, [i]: id }))}
                            className="text-primary focus:ring-primary/20"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-on-surface">{group.component_names[j] ?? id}</div>
                            {group.part_numbers[j] && (
                              <div className="text-xs font-mono text-on-surface-variant">{group.part_numbers[j]}</div>
                            )}
                          </div>
                          {primarySelections[i] === id && (
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">Keep</span>
                          )}
                        </label>
                      ))}
                    </div>
                    {mergeErrors[i] && (
                      <div className="px-4 py-2 text-xs text-error bg-error-container/10">{mergeErrors[i]}</div>
                    )}
                    <div className="px-4 py-3 border-t border-outline-variant/10 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleMerge(i, group)}
                        disabled={merging === i || !primarySelections[i]}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-error text-on-error rounded-lg text-xs font-bold hover:opacity-90 disabled:opacity-40"
                      >
                        {merging === i ? (
                          <><div className="w-3 h-3 rounded-full border-2 border-on-error border-t-transparent animate-spin" />Merging…</>
                        ) : (
                          <><MaterialIcon name="merge" className="text-sm" />Merge duplicates into selected</>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={runDetection}
              className="text-xs text-on-surface-variant hover:text-primary font-bold inline-flex items-center gap-1"
            >
              <MaterialIcon name="refresh" className="text-sm" />
              Re-scan
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-outline-variant/20 rounded-xl text-sm font-bold hover:bg-surface-container-lowest"
            >
              Close
            </button>
          </div>

          <p className="text-[10px] text-on-surface-variant italic">
            Merging is irreversible. Verify each group carefully before proceeding.
          </p>
        </div>
      )}
    </Modal>
  );
}
