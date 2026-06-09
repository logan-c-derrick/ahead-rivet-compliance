"use client";

import { useState } from "react";
import MaterialIcon from "@/components/ui/MaterialIcon";

export default function CopyEmailBlock({
  to,
  subject,
  bodyText,
  portalLink,
}: {
  to: string;
  subject: string;
  bodyText: string;
  portalLink: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyAll() {
    const payload = [
      `To: ${to}`,
      `Subject: ${subject}`,
      "",
      bodyText,
      "",
      `Portal link: ${portalLink}`,
    ].join("\n");
    await navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={copyAll}
      className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white hover:opacity-90"
    >
      <MaterialIcon name={copied ? "check" : "content_copy"} className="text-sm" />
      {copied ? "Copied" : "Copy Email for Outlook"}
    </button>
  );
}

