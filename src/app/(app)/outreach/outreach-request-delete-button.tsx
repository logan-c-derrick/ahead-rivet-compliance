"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteOutreachRequest } from "./actions";
import MaterialIcon from "@/components/ui/MaterialIcon";
import { PERMISSION_DENIED_MESSAGE } from "@/lib/permissions";

export function OutreachRequestDeleteButton({
  requestId,
  canManage,
}: {
  requestId: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!canManage) {
      alert(PERMISSION_DENIED_MESSAGE);
      return;
    }
    if (
      !confirm(
        "Delete this supplier request? Response links and tokens for it will be removed. This cannot be undone."
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deleteOutreachRequest(requestId);
      if (!result.ok) {
        alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending || !canManage}
      title={!canManage ? PERMISSION_DENIED_MESSAGE : undefined}
      className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-error hover:bg-error-container/20 transition-colors font-body disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="Delete request"
    >
      <MaterialIcon name="delete" className="text-sm" />
      {pending ? "…" : "Delete"}
    </button>
  );
}
