import Papa from "papaparse";

/** Shared max CSV size for component bulk import (bytes). */
export const MAX_COMPONENT_CSV_BYTES = 5 * 1024 * 1024;

function normalizeHeaderKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findColumnRaw(fields: string[], ...aliases: string[]): string | null {
  const map = new Map(fields.map((f) => [normalizeHeaderKey(f), f] as const));
  for (const alias of aliases) {
    const k = normalizeHeaderKey(alias);
    if (map.has(k)) return map.get(k)!;
  }
  return null;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isLikelyUuid(s: string): boolean {
  return UUID_RE.test(s.trim());
}

export type ComponentCsvColMap = {
  name: string | null;
  partNumber: string | null;
  manufacturerSku: string | null;
  manufacturer: string | null;
  description: string | null;
  category: string | null;
  supplierId: string | null;
  supplierName: string | null;
};

export function buildComponentCsvColMap(fields: string[]): ComponentCsvColMap {
  return {
    name: findColumnRaw(fields, "name", "component_name", "componentname", "item"),
    partNumber: findColumnRaw(fields, "part_number", "partnumber", "part_no", "item_number"),
    manufacturerSku: findColumnRaw(
      fields,
      "manufacturer_sku",
      "manufacturersku",
      "mfr_sku",
      "sku",
      "mfr_part"
    ),
    manufacturer: findColumnRaw(fields, "manufacturer", "mfr", "brand"),
    description: findColumnRaw(fields, "description", "desc"),
    category: findColumnRaw(fields, "category", "type"),
    supplierId: findColumnRaw(fields, "supplier_id", "supplierid"),
    supplierName: findColumnRaw(fields, "supplier_name", "suppliername", "supplier", "vendor"),
  };
}

export function csvCell(row: Record<string, string>, key: string | null): string {
  if (!key) return "";
  return String(row[key] ?? "").trim();
}

export type ParsedComponentRow = {
  rowIndex: number;
  name: string;
  part_number: string;
  manufacturer_sku: string;
  manufacturer: string | null;
  description: string | null;
  category: string | null;
  /** Raw supplier_id cell if present */
  supplier_id_cell: string | null;
  /** Raw supplier_name cell if present */
  supplier_name_cell: string | null;
};

export function parseComponentCsvRows(
  text: string,
  col: ComponentCsvColMap
): { rows: ParsedComponentRow[]; errors: string[] } {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  const data = (parsed.data ?? []) as Record<string, string>[];
  const errors: string[] = [];
  if (parsed.errors.length > 0) {
    for (const e of parsed.errors.slice(0, 5)) {
      errors.push(e.message ?? "Parse error");
    }
  }

  if (!col.name) {
    errors.push('CSV must include a "name" column.');
    return { rows: [], errors };
  }

  const rows: ParsedComponentRow[] = [];
  data.forEach((raw, i) => {
    const name = csvCell(raw, col.name);
    if (!name) return;

    let part_number = csvCell(raw, col.partNumber) || name;
    let manufacturer_sku =
      csvCell(raw, col.manufacturerSku) || part_number;

    rows.push({
      rowIndex: i,
      name,
      part_number,
      manufacturer_sku,
      manufacturer: csvCell(raw, col.manufacturer) || null,
      description: csvCell(raw, col.description) || null,
      category: csvCell(raw, col.category) || null,
      supplier_id_cell: csvCell(raw, col.supplierId) || null,
      supplier_name_cell: csvCell(raw, col.supplierName) || null,
    });
  });

  return { rows, errors };
}
