import { sendEmail } from "@/lib/email";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function testSubjectPrefix(isTest: boolean | undefined): string {
  return isTest ? "[TEST] " : "";
}

/** Non-blocking: logs on failure; never throws. */
export async function notifySupplierDocumentsReceived(opts: {
  to: string;
  organizationName: string;
  /** One or more uploaded filenames (same order as submitted). */
  filenames: string[];
  portalWasFollowUp: boolean;
  /** When the campaign used launch "test email override" (or same routing). */
  isTestNotification?: boolean;
}): Promise<void> {
  const names = opts.filenames.map((n) => escapeHtml(n)).filter(Boolean);
  const filePhrase =
    names.length === 0
      ? "your submission"
      : names.length === 1
        ? `your file <strong>${names[0]}</strong>`
        : `your files: ${names.map((n) => `<strong>${n}</strong>`).join(", ")}`;
  const subject = `${testSubjectPrefix(opts.isTestNotification)}${
    opts.portalWasFollowUp
      ? `[${opts.organizationName}] Follow-up documents received`
      : `[${opts.organizationName}] Documents received`
  }`;
  const html = `
    <p>Hello,</p>
    <p>We received ${filePhrase}${
      opts.portalWasFollowUp ? " (follow-up upload)." : "."
    }</p>
    <p>— ${escapeHtml(opts.organizationName)}</p>
  `;
  const result = await sendEmail({ to: opts.to, subject, html });
  if (!result.ok) {
    console.warn("notifySupplierDocumentsReceived:", result.error);
  }
}

export async function notifySupplierReviewDecisions(opts: {
  to: string;
  organizationName: string;
  campaignName: string | null;
  lines: Array<{
    decision: "approve" | "reject";
    regulationName: string;
    componentLabel: string;
  }>;
  isTestNotification?: boolean;
}): Promise<void> {
  if (opts.lines.length === 0) return;
  const subject = `${testSubjectPrefix(opts.isTestNotification)}[${
    opts.organizationName
  }] Documentation review update${opts.campaignName ? `: ${opts.campaignName}` : ""}`;
  const rows = opts.lines
    .map(
      (l) =>
        `<tr><td>${escapeHtml(l.componentLabel)}</td><td>${escapeHtml(
          l.regulationName
        )}</td><td><strong>${
          l.decision === "approve" ? "Verified" : "Not verified"
        }</strong></td></tr>`
    )
    .join("");
  const html = `
    <p>Hello,</p>
    <p>Your submission was reviewed. Summary:</p>
    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse">
      <thead><tr><th>Part</th><th>Regulation</th><th>Outcome</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p>If any item is <strong>Not verified</strong>, you may receive a new upload link to submit revised documentation.</p>
    <p>— ${escapeHtml(opts.organizationName)}</p>
  `;
  const result = await sendEmail({ to: opts.to, subject, html });
  if (!result.ok) {
    console.warn("notifySupplierReviewDecisions:", result.error);
  }
}

export async function notifySupplierFollowUpLink(opts: {
  to: string;
  organizationName: string;
  uploadUrl: string;
  partSummary: string;
  regulationSummary?: string;
  isTestNotification?: boolean;
}): Promise<void> {
  const subject = `${testSubjectPrefix(opts.isTestNotification)}[${
    opts.organizationName
  }] Additional documentation requested`;
  const html = `
    <p>Hello,</p>
    ${
      opts.regulationSummary
        ? `<p>Regulations for this follow-up: <strong>${escapeHtml(opts.regulationSummary)}</strong></p>`
        : ""
    }
    <p>Please upload documentation for the following parts:</p>
    <p><strong>${escapeHtml(opts.partSummary)}</strong></p>
    <p><a href="${escapeHtml(opts.uploadUrl)}">Open upload page</a></p>
    <p>This link is for follow-up only and can be used once.</p>
    <p>— ${escapeHtml(opts.organizationName)}</p>
  `;
  const result = await sendEmail({ to: opts.to, subject, html });
  if (!result.ok) {
    console.warn("notifySupplierFollowUpLink:", result.error);
  }
}
