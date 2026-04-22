"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const SAVE_MESSAGES: Record<string, string> = {
  alerts: "Alert preferences saved.",
  regulatory: "Regulatory defaults saved.",
  integration_save: "Integration map saved.",
  integration_revoke: "Integration keys revoked.",
  reset: "Settings reset to defaults.",
  commit: "All settings committed.",
};

export function SettingsNotice({
  saved,
  error,
}: {
  saved?: string;
  error?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(Boolean(saved || error));

  const message = useMemo(() => {
    if (error) return { type: "error" as const, text: error };
    if (saved) return { type: "success" as const, text: SAVE_MESSAGES[saved] ?? "Settings updated." };
    return null;
  }, [saved, error]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      setVisible(false);
      const next = new URLSearchParams(searchParams.toString());
      next.delete("saved");
      next.delete("error");
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, 4000);
    return () => clearTimeout(timer);
  }, [message, pathname, router, searchParams]);

  if (!message || !visible) return null;

  if (message.type === "error") {
    return (
      <div className="rounded-xl border border-error/40 bg-error-container/20 p-4 text-sm text-error font-body">
        {message.text}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-tertiary-fixed-dim/40 bg-tertiary-fixed/20 p-4 text-sm text-tertiary-container font-body">
      {message.text}
    </div>
  );
}
