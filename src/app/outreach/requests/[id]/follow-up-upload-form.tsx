"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  sendFollowUpUploadLink,
  type FollowUpSendResult,
} from "./actions";

function SubmitFollowUp() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-on-primary hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Sending…" : "Send follow-up upload link"}
    </button>
  );
}

export function FollowUpUploadForm({ requestId }: { requestId: string }) {
  async function action(
    _prev: FollowUpSendResult | null,
    _formData: FormData
  ): Promise<FollowUpSendResult> {
    return sendFollowUpUploadLink(requestId);
  }

  const [state, formAction] = useFormState(action, null);

  return (
    <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/40 p-6 space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">
        Supplier follow-up
      </h2>
      <p className="text-sm text-on-surface-variant">
        Resend the same portal link, refreshed for parts that still need files or had documentation
        rejected. The supplier receives an email with the upload URL.
      </p>
      <form action={formAction} className="flex flex-wrap items-center gap-3">
        <SubmitFollowUp />
        {state && !state.ok ? (
          <span className="text-sm text-error">{state.error}</span>
        ) : null}
        {state?.ok ? (
          <span className="text-sm font-medium text-tertiary-container">Follow-up link sent.</span>
        ) : null}
      </form>
    </div>
  );
}
