"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { submitOutreachRegulationReview, type ReviewSubmitResult } from "./actions";
import type { OutreachRequestRegulationRow } from "@/lib/supplier-documents";

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

export function OutreachReviewForm({
  requestId,
  regulations,
}: {
  requestId: string;
  regulations: OutreachRequestRegulationRow[];
}) {
  const router = useRouter();
  const actionable = regulations.filter(
    (r) => r.reviewStatus === "pending" || r.reviewStatus === "rejected"
  );

  async function reviewAction(
    _prev: ReviewSubmitResult | null,
    formData: FormData
  ): Promise<ReviewSubmitResult> {
    return submitOutreachRegulationReview(requestId, formData);
  }

  const [state, formAction] = useFormState(reviewAction, null);

  useEffect(() => {
    if (state?.ok === true) {
      router.refresh();
    }
  }, [state, router]);

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm space-y-4">
      <h2 className="text-lg font-bold text-primary font-headline flex items-center gap-2">
        Regulatory review
      </h2>
      <p className="text-sm text-on-surface-variant">
        Approve to mark the component compliant for that regulation. Reject clears the supplier link so
        they can upload again (same URL). You can approve some regulations and reject others in one
        submission.
      </p>

      {regulations.length > 0 && (
        <ul className="space-y-2 text-sm mb-4">
          {regulations.map((r) => (
            <li
              key={r.regulationId}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-outline-variant/15 px-3 py-2 bg-surface-container-low/30"
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
      )}

      {actionable.length === 0 ? (
        <p className="text-sm text-on-surface-variant">
          {regulations.length === 0
            ? "No regulations are linked to this request yet."
            : "Every regulation on this request has a final approval or rejection."}
        </p>
      ) : (
        <form action={formAction} className="space-y-6">
          {state?.ok === false && (
            <div className="rounded-xl border border-error/40 bg-error-container/20 p-3 text-sm text-error">
              {state.error}
            </div>
          )}

          {actionable.map((r) => (
            <div
              key={r.regulationId}
              className="rounded-xl border border-outline-variant/20 bg-surface-container-low/40 p-4 space-y-3"
            >
              <div className="font-semibold text-primary">{r.name}</div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Decision
                </label>
                <select
                  name={`decision_${r.regulationId}`}
                  required
                  defaultValue=""
                  className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm flex-1 max-w-xs"
                >
                  <option value="" disabled>
                    Select…
                  </option>
                  <option value="approve">Approve — mark component compliant</option>
                  <option value="reject">Reject — allow supplier to re-upload (same link)</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor={`notes-${r.regulationId}`}
                  className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1"
                >
                  Notes (optional)
                </label>
                <textarea
                  id={`notes-${r.regulationId}`}
                  name={`notes_${r.regulationId}`}
                  rows={2}
                  className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm"
                  placeholder="Internal notes or feedback to reference later"
                />
              </div>
            </div>
          ))}

          <SubmitReviewButton />
        </form>
      )}
    </div>
  );
}
