/**
 * Best-effort brand name from a product/item title (e.g. "Seagate Exos 2X14 ..." → "Seagate").
 * Not perfect for multi-word brands (e.g. "Hewlett Packard"); users can edit the field.
 */
export function guessManufacturerFromItemName(name: string): string | null {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  for (const w of parts.slice(0, 4)) {
    const token = w.replace(/[,;:]$/g, "");
    if (token.length < 2) continue;
    if (/^\d/.test(token)) continue;
    if (!/[A-Za-z]/.test(token)) continue;
    if (/^\d+[A-Za-z]?$/.test(token)) continue;
    if (token.length <= 40) return token;
  }
  return null;
}

/** True if the string looks like a manufacturer part / SKU code rather than a company name. */
export function isLikelyManufacturerPartNumber(s: string): boolean {
  const t = s.trim();
  if (t.length < 4) return false;
  if (/^[A-Za-z]+$/.test(t) && t.length <= 24) return false;
  if (/^[A-Z][a-z]+$/.test(t) && t.length <= 32) return false;
  return /[0-9]/.test(t) || /^[A-Z0-9._-]{6,}$/.test(t);
}
