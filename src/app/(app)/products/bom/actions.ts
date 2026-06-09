"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPermissionErrorMessage, requireProfile, requireRole } from "@/lib/profile";
import { parseBomCsv } from "@/lib/bom/parser";
import { suggestMappings, type MappingSuggestion } from "@/lib/bom/mapper";
import {
  applyMappingsToRow,
  type ColumnMapping,
  type ProcessedBomRow,
} from "@/lib/bom/processor";

export type { ColumnMapping } from "@/lib/bom/processor";

export interface BomImportRow {
  id: string;
  filename: string;
  row_count: number | null;
  status: string;
  product_id: string | null;
  raw_headers: string[] | null;
  sample_rows: string[][] | null;
}

/**
 * Upload a BOM CSV, parse it, and create a bom_imports row.
 * Returns the import ID and parsed headers/sample for the mapping UI.
 */
export async function createBomImport(formData: FormData): Promise<
  | {
      success: true;
      importId: string;
      headers: string[];
      sampleRows: string[][];
      rowCount: number;
      suggestions: MappingSuggestion[];
    }
  | { success: false; error: string }
> {
  let profile;
  try {
    profile = await requireRole(["admin", "compliance_manager"]);
  } catch (error) {
    return { success: false, error: getPermissionErrorMessage(error) ?? "Insufficient permissions." };
  }
  const file = formData.get("file") as File | null;
  const productId = (formData.get("productId") as string)?.trim() || null;

  if (!file || !file.name) {
    return { success: false, error: "Please select a CSV file" };
  }
  if (!file.name.toLowerCase().endsWith(".csv")) {
    return { success: false, error: "File must be a CSV" };
  }

  const text = await file.text();
  const parsed = parseBomCsv(text);

  if (parsed.headers.length === 0) {
    return { success: false, error: "CSV has no headers" };
  }

  const sampleRows = parsed.rows.slice(0, 10);
  const sampleByHeader: Record<string, string> = {};
  parsed.headers.forEach((h, i) => {
    const val = sampleRows[0]?.[i];
    if (val !== undefined) sampleByHeader[h] = String(val).trim();
  });
  const suggestions = suggestMappings(parsed.headers, sampleByHeader);

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("bom_imports")
    .insert({
      organization_id: profile.organization_id,
      product_id: productId || null,
      filename: file.name,
      row_count: parsed.meta.rowCount,
      status: "mapping",
      raw_headers: parsed.headers,
      sample_rows: sampleRows,
      raw_csv_content: text,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating bom_import:", error);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    importId: row.id,
    headers: parsed.headers,
    sampleRows,
    rowCount: parsed.meta.rowCount,
    suggestions,
  };
}

/**
 * Get mapping suggestions for an import's headers.
 */
export async function getMappingSuggestions(importId: string): Promise<
  | { success: true; suggestions: MappingSuggestion[] }
  | { success: false; error: string }
> {
  await requireProfile();
  const supabase = await createClient();

  const { data: imp, error } = await supabase
    .from("bom_imports")
    .select("raw_headers, sample_rows")
    .eq("id", importId)
    .single();

  if (error || !imp) {
    return { success: false, error: "Import not found" };
  }

  const headers = (imp.raw_headers as string[]) ?? [];
  const sampleRows = (imp.sample_rows as string[][]) ?? [];
  const sampleByHeader: Record<string, string> = {};
  headers.forEach((h, i) => {
    const val = sampleRows[0]?.[i];
    if (val !== undefined) sampleByHeader[h] = String(val).trim();
  });

  const suggestions = suggestMappings(headers, sampleByHeader);
  return { success: true, suggestions };
}

/**
 * Finalize BOM mapping: apply mappings, upsert components, create product_components and component_substances.
 */
export async function finalizeBomMapping(
  importId: string,
  mappings: ColumnMapping[],
  conflictResolutions: Record<string, string>,
  productId?: string | null
): Promise<{ success: true } | { success: false; error: string }> {
  let profile;
  try {
    profile = await requireRole(["admin", "compliance_manager"]);
  } catch (error) {
    return { success: false, error: getPermissionErrorMessage(error) ?? "Insufficient permissions." };
  }
  const supabase = await createClient();

  const { data: imp, error: fetchError } = await supabase
    .from("bom_imports")
    .select("organization_id, raw_headers, raw_csv_content, product_id")
    .eq("id", importId)
    .single();

  if (fetchError || !imp) {
    return { success: false, error: "Import not found" };
  }

  if (imp.organization_id !== profile.organization_id) {
    return { success: false, error: "Access denied" };
  }

  const rawContent = imp.raw_csv_content as string | null;
  if (!rawContent) {
    return { success: false, error: "Import data no longer available" };
  }

  const parsed = parseBomCsv(rawContent);
  const headers = parsed.headers;
  const headerIndexMap: Record<string, number> = {};
  headers.forEach((h, i) => {
    headerIndexMap[h] = i;
  });

  const effectiveProductId = productId ?? imp.product_id;
  const orgId = imp.organization_id as string;

  const processedRows: ProcessedBomRow[] = [];
  for (const row of parsed.rows) {
    const result = applyMappingsToRow(
      row,
      headerIndexMap,
      mappings,
      conflictResolutions
    );
    if (result) processedRows.push(result);
  }

  const componentKey = (c: { part_number: string; manufacturer_sku: string }) =>
    `${c.part_number}::${c.manufacturer_sku}`;
  const merged = new Map<
    string,
    { component: ProcessedBomRow["component"]; substances: ProcessedBomRow["substances"]; quantities: number[] }
  >();

  for (const pr of processedRows) {
    const key = componentKey(pr.component);
    const existing = merged.get(key);
    if (existing) {
      existing.substances.push(...pr.substances);
      if (pr.quantity != null) existing.quantities.push(pr.quantity);
    } else {
      merged.set(key, {
        component: pr.component,
        substances: [...pr.substances],
        quantities: pr.quantity != null ? [pr.quantity] : [],
      });
    }
  }

  await supabase
    .from("bom_imports")
    .update({ status: "processing" })
    .eq("id", importId);

  const supplierCache = new Map<string, string>();
  for (const [, data] of merged) {
    let supplierId: string | null = null;
    const supName = data.component.supplier_name;
    if (supName) {
      if (supplierCache.has(supName)) {
        supplierId = supplierCache.get(supName)!;
      } else {
        const { data: existing } = await supabase
          .from("suppliers")
          .select("id")
          .eq("organization_id", orgId)
          .ilike("name", supName.trim())
          .limit(1)
          .single();
        if (existing?.id) {
          supplierId = existing.id;
          supplierCache.set(supName, existing.id);
        } else {
          const { data: inserted } = await supabase
            .from("suppliers")
            .insert({
              organization_id: orgId,
              name: supName.trim(),
            })
            .select("id")
            .single();
          if (inserted?.id) {
            supplierId = inserted.id;
            supplierCache.set(supName, inserted.id);
          }
        }
      }
    }

    const { data: comp, error: compErr } = await supabase
      .from("components")
      .upsert(
        {
          organization_id: orgId,
          part_number: data.component.part_number,
          manufacturer: data.component.manufacturer,
          name: data.component.name,
          description: data.component.description,
          supplier_id: supplierId,
          manufacturer_sku: data.component.manufacturer_sku,
          category: data.component.category,
          unit_msrp: data.component.unit_msrp,
          unit_price: data.component.unit_price,
        },
        {
          onConflict: "organization_id,part_number,manufacturer_sku",
        }
      )
      .select("id")
      .single();

    if (compErr) {
      const pgCode = (compErr as { code?: string }).code;
      if (pgCode === "23505") {
        // Defensive: if a duplicate slips through, skip it and keep processing.
        continue;
      }
      await supabase
        .from("bom_imports")
        .update({ status: "failed" })
        .eq("id", importId);
      return { success: false, error: `Component upsert failed: ${compErr.message}` };
    }

    const componentId = comp.id;

    for (const sub of data.substances) {
      await supabase.from("component_substances").insert({
        component_id: componentId,
        substance_name: sub.substance_name,
        cas_number: sub.cas_number,
        mass_percent: sub.mass_percent,
      });
    }

    const qty = data.quantities.length > 0 ? data.quantities.reduce((a, b) => a + b, 0) / data.quantities.length : null;
    if (effectiveProductId) {
      await supabase.from("product_components").upsert(
        {
          product_id: effectiveProductId,
          component_id: componentId,
          quantity: qty,
        },
        { onConflict: "product_id,component_id" }
      );
    }
  }

  await supabase
    .from("bom_imports")
    .update({
      status: "complete",
      completed_at: new Date().toISOString(),
      mapping_schema: mappings,
      conflict_resolutions: conflictResolutions,
      product_id: effectiveProductId,
    })
    .eq("id", importId);

  revalidatePath("/products/bom");
  revalidatePath("/products");
  revalidatePath("/components");
  if (effectiveProductId) revalidatePath(`/products/${effectiveProductId}`);
  return { success: true as const };
}
