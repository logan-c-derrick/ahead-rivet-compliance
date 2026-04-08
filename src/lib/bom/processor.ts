import type { BomTargetOrUnmapped } from "./mapper";
import {
  guessManufacturerFromItemName,
  isLikelyManufacturerPartNumber,
} from "./guessManufacturerFromItemName";

export interface ColumnMapping {
  sourceColumn: string;
  targetFieldId: BomTargetOrUnmapped;
  normalization?: "grams" | "milligrams" | "percent" | "none";
}

export interface BomRowContext {
  organizationId: string;
  productId: string | null;
  createdBy: string | null;
}

export interface ProcessedComponent {
  part_number: string;
  /** Company / brand name when known; may be inferred from item name. */
  manufacturer: string | null;
  name: string;
  description: string | null;
  supplier_id: string | null;
  supplier_name: string | null;
  /** Manufacturer part number (MFR SKU); used as the natural key with part_number. */
  manufacturer_sku: string;
  category: string | null;
  unit_msrp: number | null;
  unit_price: number | null;
}

export interface ProcessedSubstance {
  substance_name: string;
  cas_number: string | null;
  mass_percent: number | null;
}

export interface ProcessedBomRow {
  component: ProcessedComponent;
  substances: ProcessedSubstance[];
  quantity: number | null;
}

/**
 * Apply column mappings to a CSV row and produce component + substances.
 */
export function applyMappingsToRow(
  row: string[],
  headerIndexMap: Record<string, number>,
  mappings: ColumnMapping[],
  conflictResolutions: Record<string, string>
): ProcessedBomRow | null {
  const getVal = (sourceCol: string): string => {
    const idx = headerIndexMap[sourceCol];
    if (idx == null) return "";
    return String(row[idx] ?? "").trim();
  };

  const fieldByName: Record<string, string> = {};
  for (const m of mappings) {
    if (m.targetFieldId === "_unmapped" || m.targetFieldId === "_skip") continue;
    const val = getVal(m.sourceColumn);
    if (val) fieldByName[m.targetFieldId] = val;
  }

  const part_number = (fieldByName.part_number ?? fieldByName.component_name ?? "").trim();
  const name = (fieldByName.component_name ?? part_number).trim() || part_number;

  let manufacturer_sku = (fieldByName.manufacturer_sku ?? "").trim();
  let manufacturerName = (fieldByName.manufacturer ?? "").trim() || null;

  // Single "Manufacturer" column in source data often holds the MFR part #, not the brand.
  if (!manufacturer_sku && manufacturerName && isLikelyManufacturerPartNumber(manufacturerName)) {
    manufacturer_sku = manufacturerName;
    manufacturerName = null;
  }

  if (!manufacturer_sku) {
    manufacturer_sku = part_number;
  }

  if (!part_number || !manufacturer_sku) {
    return null;
  }

  const manufacturer =
    manufacturerName ||
    guessManufacturerFromItemName(name) ||
    null;

  const supplier_name = fieldByName.supplier_name ?? null;
  const description = fieldByName.description ?? null;
  const category = fieldByName.category ?? null;

  let unit_msrp: number | null = null;
  const rawMsrp = fieldByName.unit_msrp;
  if (rawMsrp) {
    const num = parseFloat(String(rawMsrp).replace(/[^0-9.-]/g, ""));
    if (!isNaN(num)) unit_msrp = num;
  }

  let unit_price: number | null = null;
  const rawPrice = fieldByName.unit_price;
  if (rawPrice) {
    const num = parseFloat(String(rawPrice).replace(/[^0-9.-]/g, ""));
    if (!isNaN(num)) unit_price = num;
  }

  let quantity: number | null = null;
  const qtyStr = fieldByName.quantity;
  if (qtyStr) {
    const q = parseFloat(String(qtyStr).replace(/[^0-9.-]/g, ""));
    if (!isNaN(q)) quantity = q;
  }

  return {
    component: {
      part_number,
      manufacturer,
      name,
      description,
      supplier_id: null,
      supplier_name: supplier_name,
      manufacturer_sku,
      category,
      unit_msrp,
      unit_price,
    },
    substances: [],
    quantity,
  };
}
