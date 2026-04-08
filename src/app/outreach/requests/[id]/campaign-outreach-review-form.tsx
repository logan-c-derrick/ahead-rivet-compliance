"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  submitCampaignOutreachReview,
  type ReviewSubmitResult,
} from "./actions";
import type { CampaignReviewBlock } from "@/lib/supplier-documents";

function SubmitReviewButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Saving…" : "Submit review"}
    </button>
  );
}

function regStatusClass(s: string) {
  switch (s) {
    case "approved":
      return "bg-tertiary-fixed-dim/25 text-tertiary-container";
    case "rejected":
      return "bg-error-container/50 text-error";
    default:
      return "bg-secondary-fixed/40 text-on-surface-variant";
  }
}

export function CampaignOutreachReviewForm({
  anchorRequestId,
  blocks,
}: {
  anchorRequestId: string;
  blocks: CampaignReviewBlock[];
}) {
  const router = useRouter();

  async function reviewAction(
    _prev: ReviewSubmitResult | null,
    formData: FormData
  ): Promise<ReviewSubmitResult> {
    return submitCampaignOutreachReview(anchorRequestId, formData);
  }

  const [state, formAction] = useFormState(reviewAction, null);

  useEffect(() => {
    if (state?.ok === true) {
      router.refresh();
    }
  }, [state, router]);

  const totalActionable = blocks.reduce(
    (acc, b) =>
      acc +
      b.regulations.filter((r) => r.reviewStatus === "pending" || r.reviewStatus === "rejected")
        .length,
    0
  );

  if (totalActionable === 0) {
    return (
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-primary font-headline mb-2">Regulatory review</h2>
        <p className="text-sm text-on-surface-variant">
          Every regulation for each component has been reviewed, or there is nothing pending.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm space-y-6">
      <div>
        <h2 className="text-lg font-bold text-primary font-headline">Regulatory review</h2>
        <p className="text-sm text-on-surface-variant mt-1">
          For each component below, mark each regulation as <strong>Verified</strong> (documentation
          acceptable) or <strong>Not verified</strong> (supplier should re-upload; their link is
          reopened for that request).
        </p>
      </div>

      <form action={formAction} className="space-y-10">
        {state?.ok === false && (
          <div className="rounded-xl border border-error/40 bg-error-container/20 p-3 text-sm text-error">
            {state.error}
          </div>
        )}

        {blocks.map((block) => {
          const compKey = block.componentId ?? "_";
          const actionable = block.regulations.filter(
            (r) => r.reviewStatus === "pending" || r.reviewStatus === "rejected"
          );
          if (actionable.length === 0) {
            return (
              <div
                key={`${block.requestId}-${compKey}`}
                className="rounded-xl border border-outline-variant/15 bg-surface-container-low/20 p-4"
              >
                <ComponentBlockHeader block={block} />
                <p className="text-sm text-on-surface-variant mt-2">All regulations finalized.</p>
              </div>
            );
          }

          return (
            <div
              key={`${block.requestId}-${compKey}`}
              className="rounded-xl border border-outline-variant/20 bg-surface-container-low/30 p-5 space-y-4"
            >
              <ComponentBlockHeader block={block} />

              <ul className="space-y-2 text-sm mb-2">
                {block.regulations.map((r) => (
                  <li
                    key={r.regulationId}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-outline-variant/10 px-3 py-2 bg-surface-container-lowest/80"
                  >
                    <span className="font-semibold text-primary">{r.name}</span>
                    {r.code ? (
                      <span className="text-xs font-mono text-on-surface-variant">({r.code})</span>
                    ) : null}
                    <span
                      className={`ml-auto text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${regStatusClass(r.reviewStatus)}`}
                    >
                      {r.reviewStatus}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="space-y-4 pt-2 border-t border-outline-variant/10">
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Pending decisions
                </p>
                {actionable.map((r) => (
                  <div
                    key={r.regulationId}
                    className="rounded-lg border border-outline-variant/15 p-4 space-y-2 bg-white/60"
                  >
                    <div className="font-medium text-on-surface">{r.name}</div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase">
                        Verification
                      </label>
                      <select
                        name={`decision__${block.requestId}__${compKey}__${r.regulationId}`}
                        required
                        defaultValue=""
                        className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm max-w-md"
                      >
                        <option value="" disabled>
                          Select…
                        </option>
                        <option value="approve">Verified</option>
                        <option value="reject">Not verified</option>
                      </select>
                    </div>
                    <div>
                      <label
                        className="text-xs font-bold text-on-surface-variant uppercase block mb-1"
                        htmlFor={`notes-${block.requestId}-${compKey}-${r.regulationId}`}
                      >
                        Notes (optional)
                      </label>
                      <textarea
                        id={`notes-${block.requestId}-${compKey}-${r.regulationId}`}
                        name={`notes__${block.requestId}__${compKey}__${r.regulationId}`}
                        rows={2}
                        className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm"
                        placeholder="Internal notes"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <SubmitReviewButton />
      </form>
    </div>
  );
}

function ComponentBlockHeader({ block }: { block: CampaignReviewBlock }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
        Supplier: {block.supplierName}
      </p>
      {block.manufacturer ? (
        <p className="text-sm">
          <span className="text-on-surface-variant">Manufacturer: </span>
          <span className="font-semibold text-on-surface">{block.manufacturer}</span>
        </p>
      ) : null}
      {block.itemName ? (
        <p className="text-sm">
          <span className="text-on-surface-variant">Item: </span>
          <span className="font-semibold text-on-surface">{block.itemName}</span>
        </p>
      ) : null}
      {block.manufacturerSku ? (
        <p className="text-sm font-mono">
          <span className="text-on-surface-variant font-sans text-xs uppercase tracking-wide">
            Mfr SKU:{" "}
          </span>
          {block.manufacturerSku}
        </p>
      ) : null}
      {!block.componentId && (
        <p className="text-xs text-amber-800 bg-amber-50/80 rounded px-2 py-1 inline-block">
          No component linked — compliance roll-up applies only when a component is on the request.
        </p>
      )}
    </div>
  );
}
