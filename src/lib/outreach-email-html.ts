/** Escape text merged into HTML email bodies. */
export function escapeHtmlForEmail(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Renders merge fields {{regulation_list}} / {{component_list}} as real HTML lists
 * (no literal • characters — bullets come from the client).
 */
export function htmlMergeFieldList(lines: string[]): string {
  if (lines.length === 0) return "";
  return (
    '<ul style="margin:0.5em 0 1em;padding-left:1.35em;">' +
    lines.map((line) => `<li>${escapeHtmlForEmail(line)}</li>`).join("") +
    "</ul>"
  );
}

/**
 * Turn a fully-templated message body into HTML for email.
 * Rich-editor templates are already HTML; plain-text templates become wrapped paragraphs.
 */
export function messageTemplatedToEmailHtml(templated: string): string {
  const s = templated.trim();
  if (!s) return "<p></p>";
  if (
    /^<[a-z!]/i.test(s) ||
    /<(p|div|ul|ol|li|br|strong|em|b|i|h[1-6]|span|a|blockquote)\b/i.test(
      templated
    )
  ) {
    return templated;
  }
  return templated
    .split("\n")
    .map((line) =>
      line.startsWith("http://") || line.startsWith("https://")
        ? `<p><a href="${line.replace(/"/g, "&quot;")}">${line.replace(/</g, "&lt;")}</a></p>`
        : `<p>${line.replace(/</g, "&lt;")}</p>`
    )
    .join("");
}
