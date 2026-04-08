export function normalizeHeaderKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Find CSV column header (raw key) by normalized aliases. */
export function findColumnRaw(fields: string[], ...aliases: string[]): string | null {
  const map = new Map(fields.map((f) => [normalizeHeaderKey(f), f] as const));
  for (const alias of aliases) {
    const k = normalizeHeaderKey(alias);
    if (map.has(k)) return map.get(k)!;
  }
  return null;
}
