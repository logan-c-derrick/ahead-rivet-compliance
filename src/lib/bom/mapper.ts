/**
 * Target fields for BOM column mapping.
 * Unique key on components: organization_id + part_number + manufacturer_sku.
 * Manufacturer (brand) is optional in CSV and can be inferred from the item name.
 */
export const BOM_TARGET_FIELDS = [
  { id: "part_number", label: "Item Number (internal part #)", required: true },
  { id: "component_name", label: "Item (item name)", required: true },
  { id: "description", label: "Description", required: false },
  { id: "manufacturer_sku", label: "Manufacturer SKU (mfr part #)", required: true },
  { id: "manufacturer", label: "Manufacturer (company name)", required: false },
  { id: "category", label: "Item category", required: false },
  { id: "inventory_role", label: "Inventory role", required: false },
  { id: "quantity", label: "Quantity", required: false },
  { id: "unit_msrp", label: "Unit MSRP (supplier MSRP)", required: false },
  { id: "unit_price", label: "Unit price (what we pay)", required: false },
] as const;

export type BomTargetFieldId = (typeof BOM_TARGET_FIELDS)[number]["id"];

export type BomTargetOrUnmapped = BomTargetFieldId | "_unmapped" | "_skip";

export interface MappingSuggestion {
  sourceColumn: string;
  targetFieldId: BomTargetOrUnmapped;
  confidence: "high" | "medium" | "low";
  sample?: string;
  conflict?: string; // e.g. "Multiple units detected (g vs mg)"
}

/**
 * Header patterns for auto-matching (case-insensitive).
 * Order matters: first match wins.
 */
const HEADER_PATTERNS: Array<{
  target: BomTargetFieldId;
  patterns: (string | RegExp)[];
}> = [
  { target: "part_number", patterns: ["item number", "item_number", "part_number", "part number", "part_no", "partno", "pn", "internal part", "part id", "part#"] },
  { target: "component_name", patterns: ["item", "item name", "item_name", "component", "name", "component_name", "component name", "material name"] },
  { target: "description", patterns: ["description", "desc", "item description", "item_description", "notes", "remarks"] },
  { target: "manufacturer_sku", patterns: ["manufacturer sku", "manufacturer_sku", "mfr sku", "mfr_sku", "manufacturer part", "manufacturer part number", "mfr part number"] },
  { target: "manufacturer", patterns: ["manufacturer", "mfr", "mfg", "maker", "brand", "vendor mfr"] },
  { target: "category", patterns: ["item category", "item_category", "category", "type"] },
  { target: "inventory_role", patterns: ["inventory role", "inventory_role", "role"] },
  { target: "quantity", patterns: ["quantity", "qty", "amount", "count"] },
  { target: "unit_msrp", patterns: ["unit msrp", "unit_msrp", "msrp", "supplier msrp", "supplier_msrp"] },
  { target: "unit_price", patterns: ["unit price", "unit_price", "price", "item price", "item_price", "cost"] },
];

function normalizeForMatch(s: string): string {
  return s.toLowerCase().replace(/[\s_-]/g, "").trim();
}

function matchesPattern(header: string, pattern: string | RegExp): boolean {
  const norm = normalizeForMatch(header);
  if (pattern instanceof RegExp) {
    return pattern.test(header) || pattern.test(norm);
  }
  return norm.includes(normalizeForMatch(pattern)) || normalizeForMatch(pattern).includes(norm);
}

/**
 * Suggest column mappings from CSV headers.
 * Returns one suggestion per source column (best match).
 */
export function suggestMappings(
  headers: string[],
  sampleByHeader: Record<string, string>
): MappingSuggestion[] {
  const suggestions: MappingSuggestion[] = [];
  const usedTargets = new Set<BomTargetFieldId>();

  for (const header of headers) {
    if (!header.trim()) continue;

    let best: { target: BomTargetFieldId; confidence: "high" | "medium" | "low" } | null = null;

    for (const { target, patterns } of HEADER_PATTERNS) {
      if (usedTargets.has(target)) continue;

      for (const pat of patterns) {
        if (matchesPattern(header, pat)) {
          const confidence: "high" | "medium" | "low" =
            pat === header || normalizeForMatch(String(pat)) === normalizeForMatch(header)
              ? "high"
              : String(pat).length <= 4
                ? "medium"
                : "low";
          if (!best || (confidence === "high" && best.confidence !== "high")) {
            best = { target, confidence };
          }
          break;
        }
      }
    }

    const sample = sampleByHeader[header];
    suggestions.push({
      sourceColumn: header,
      targetFieldId: best?.target ?? ("_unmapped" as BomTargetFieldId),
      confidence: best?.confidence ?? "low",
      sample,
      conflict: detectConflict(header, sample),
    });

    if (best) usedTargets.add(best.target);
  }

  return suggestions;
}

function detectConflict(header: string, sample?: string): string | undefined {
  if (!sample) return undefined;
  const lower = sample.toLowerCase();
  const lowerHeader = header.toLowerCase();

  // Mass/weight unit ambiguity
  if (
    lowerHeader.includes("wt") ||
    lowerHeader.includes("weight") ||
    lowerHeader.includes("mass") ||
    lowerHeader.includes("percent")
  ) {
    if (lower.includes("mg") || lower.includes("milligram")) {
      return "Multiple units detected (grams vs milligrams). Select normalization target.";
    }
  }

  return undefined;
}
