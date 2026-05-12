"use server";

import { revalidatePath } from "next/cache";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase/server";
import { getPermissionErrorMessage, requireProfile, requireRole } from "@/lib/profile";
import {
  buildComponentCsvColMap,
  isLikelyUuid,
  MAX_COMPONENT_CSV_BYTES,
  parseComponentCsvRows,
} from "@/lib/csv/component-import";

export interface Component {
  id: string;
  organization_id?: string;
  name: string;
  part_number: string | null;
  description: string | null;
  /** Brand / company name (not the MFR part number). */
  manufacturer: string | null;
  manufacturer_sku: string | null;
  category: string | null;
  supplier_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ComponentWithSupplier extends Component {
  supplier_name?: string | null;
}

export type { ComponentLinkMatchFilter } from "./component-filters";

export async function getComponents(): Promise<ComponentWithSupplier[]> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("components")
    .select(`
      *,
      suppliers(name)
    `)
    .eq("organization_id", profile.organization_id)
    .order("name");

  if (error) {
    console.error("Error fetching components:", error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    ...row,
    supplier_name: row.suppliers?.name ?? null,
    suppliers: undefined,
  })) as ComponentWithSupplier[];
}

export async function getComponent(id: string): Promise<ComponentWithSupplier | null> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("components")
    .select(`
      *,
      suppliers(name)
    `)
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .single();

  if (error || !data) return null;

  return {
    ...data,
    supplier_name: (data as any).suppliers?.name ?? null,
    suppliers: undefined,
  } as ComponentWithSupplier;
}

export interface ComponentRegulationRow {
  id: string;
  regulation_id: string;
  regulation_code: string;
  regulation_name: string;
  status: string;
  notes: string | null;
}

export interface ComponentReleaseStatusRow {
  id: string;
  release_key: string;
  release_title: string | null;
  regulation_code: string;
  regulation_name: string;
  status: string;
  evaluated_at: string | null;
  notes: string | null;
}

export async function getComponentRegulationStatuses(
  componentId: string
): Promise<ComponentRegulationRow[]> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: component } = await supabase
    .from("components")
    .select("id")
    .eq("id", componentId)
    .eq("organization_id", profile.organization_id)
    .single();

  if (!component) return [];

  const { data, error } = await supabase
    .from("component_regulations")
    .select(`
      id,
      regulation_id,
      status,
      notes,
      regulations(code, name)
    `)
    .eq("component_id", componentId)
    .order("regulation_id");

  if (error) return [];

  return (data ?? []).map((row: any) => ({
    id: row.id,
    regulation_id: row.regulation_id,
    regulation_code: row.regulations?.code ?? "",
    regulation_name: row.regulations?.name ?? "",
    status: row.status,
    notes: row.notes,
  })) as ComponentRegulationRow[];
}

export async function getComponentReleaseStatuses(
  componentId: string
): Promise<ComponentReleaseStatusRow[]> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: component } = await supabase
    .from("components")
    .select("id")
    .eq("id", componentId)
    .eq("organization_id", profile.organization_id)
    .single();

  if (!component) return [];

  const { data, error } = await supabase
    .from("component_regulation_release_status")
    .select(`
      id,
      status,
      evaluated_at,
      notes,
      regulation_releases(
        release_key,
        title,
        regulations(code, name)
      )
    `)
    .eq("component_id", componentId)
    .order("evaluated_at", { ascending: false, nullsFirst: false })
    .limit(20);

  if (error) return [];

  return (data ?? []).map((row: any) => ({
    id: row.id,
    release_key: row.regulation_releases?.release_key ?? "—",
    release_title: row.regulation_releases?.title ?? null,
    regulation_code: row.regulation_releases?.regulations?.code ?? "—",
    regulation_name: row.regulation_releases?.regulations?.name ?? "—",
    status: row.status,
    evaluated_at: row.evaluated_at ?? null,
    notes: row.notes ?? null,
  })) as ComponentReleaseStatusRow[];
}

type CreateComponentState = { error?: string; success?: true };

/** Plain `<form action>` entry point (no useFormState). */
export async function submitComponentForm(formData: FormData): Promise<void> {
  await createComponent(null, formData);
}

export async function createComponent(
  _prevState: CreateComponentState | null,
  formData: FormData
): Promise<CreateComponentState> {
  let profile;
  try {
    profile = await requireRole(["admin", "compliance_manager"]);
  } catch (error) {
    return { error: getPermissionErrorMessage(error) ?? "Unable to create component." };
  }
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  let part_number = (formData.get("part_number") as string)?.trim() || null;
  if (!part_number && name) part_number = name;
  const description = (formData.get("description") as string)?.trim() || null;
  const manufacturer = (formData.get("manufacturer") as string)?.trim() || null;
  let manufacturer_sku = (formData.get("manufacturer_sku") as string)?.trim() || null;
  const category = (formData.get("category") as string)?.trim() || null;
  const supplier_id = (formData.get("supplier_id") as string)?.trim() || null;

  if (!name) return { error: "Name is required" };
  if (!manufacturer_sku) manufacturer_sku = part_number;
  if (!manufacturer_sku) return { error: "Manufacturer SKU (or part number) is required" };

  const { error } = await supabase.from("components").insert({
    organization_id: profile.organization_id,
    name,
    part_number,
    description,
    manufacturer,
    manufacturer_sku,
    category,
    supplier_id: supplier_id || null,
  });

  if (error) {
    console.error("Error creating component:", error);
    return { error: error.message };
  }

  revalidatePath("/components");
  return { success: true };
}

type UpdateComponentState = { error?: string; success?: true };
export async function updateComponent(
  _prevState: UpdateComponentState | null,
  formData: FormData
): Promise<UpdateComponentState> {
  let profile;
  try {
    profile = await requireRole(["admin", "compliance_manager"]);
  } catch (error) {
    return { error: getPermissionErrorMessage(error) ?? "Unable to update component." };
  }
  const supabase = await createClient();

  const id = formData.get("id") as string;
  if (!id) return { error: "Component ID is required" };

  const name = (formData.get("name") as string)?.trim();
  const part_number = (formData.get("part_number") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim() || null;
  const manufacturer = (formData.get("manufacturer") as string)?.trim() || null;
  let manufacturer_sku = (formData.get("manufacturer_sku") as string)?.trim() || null;
  const category = (formData.get("category") as string)?.trim() || null;
  const supplier_id = (formData.get("supplier_id") as string)?.trim() || null;

  if (!name) return { error: "Name is required" };
  if (!manufacturer_sku) manufacturer_sku = part_number;
  if (!manufacturer_sku) return { error: "Manufacturer SKU (or part number) is required" };

  const { error } = await supabase
    .from("components")
    .update({
      name,
      part_number,
      description,
      manufacturer,
      manufacturer_sku,
      category,
      supplier_id: supplier_id || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  if (error) {
    console.error("Error updating component:", error);
    return { error: error.message };
  }

  revalidatePath("/components");
  revalidatePath(`/components/${id}`);
  return { success: true };
}

type DeleteComponentState = { error?: string; success?: true };
export async function deleteComponent(
  _prevState: DeleteComponentState | null,
  formData: FormData
): Promise<DeleteComponentState> {
  let profile;
  try {
    profile = await requireRole(["admin", "compliance_manager"]);
  } catch (error) {
    return { error: getPermissionErrorMessage(error) ?? "Unable to delete component." };
  }
  const supabase = await createClient();

  const id = formData.get("id") as string;
  if (!id) return { error: "Component ID is required" };

  const { error } = await supabase
    .from("components")
    .delete()
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  if (error) {
    console.error("Error deleting component:", error);
    return { error: error.message };
  }

  revalidatePath("/components");
  return { success: true };
}

export type ComponentCsvPreviewRow = {
  rowIndex: number;
  name: string;
  part_number: string;
  manufacturer_sku: string;
  manufacturer: string | null;
  description: string | null;
  category: string | null;
  supplierMatch: "none" | "resolved" | "unresolved" | "ambiguous";
  supplierId: string | null;
  supplierHint: string | null;
};

export type ComponentCsvPreviewResult =
  | { success: true; rows: ComponentCsvPreviewRow[]; parseWarnings: string[] }
  | { success: false; error: string };

export async function previewComponentCsv(
  formData: FormData
): Promise<ComponentCsvPreviewResult> {
  const profile = await requireProfile();
  const file = formData.get("file") as File | null;
  if (!file?.name) return { success: false, error: "Please select a CSV file." };
  if (!file.name.toLowerCase().endsWith(".csv")) return { success: false, error: "File must be a CSV." };
  if (file.size > MAX_COMPONENT_CSV_BYTES) {
    return {
      success: false,
      error: `File is too large (max ${Math.round(MAX_COMPONENT_CSV_BYTES / (1024 * 1024))} MB).`,
    };
  }

  const text = await file.text();
  const parsedHeader = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });
  const fields = (parsedHeader.meta.fields ?? []) as string[];
  if (fields.length === 0) {
    return { success: false, error: "CSV has no headers." };
  }

  const col = buildComponentCsvColMap(fields);
  const { rows: parsedRows, errors: parseWarnings } = parseComponentCsvRows(text, col);
  if (parseWarnings.some((w) => w.includes("must include"))) {
    return { success: false, error: parseWarnings[0] ?? "Invalid CSV." };
  }
  if (parsedRows.length === 0) {
    return { success: false, error: "No data rows found." };
  }

  const supabase = await createClient();
  const { data: supRows, error: supErr } = await supabase
    .from("suppliers")
    .select("id, name")
    .eq("organization_id", profile.organization_id);

  if (supErr) {
    return { success: false, error: supErr.message };
  }

  const byLower = new Map<string, string[]>();
  const idSet = new Set<string>();
  for (const s of supRows ?? []) {
    const r = s as { id: string; name: string };
    idSet.add(r.id);
    const k = r.name.toLowerCase();
    if (!byLower.has(k)) byLower.set(k, []);
    byLower.get(k)!.push(r.id);
  }

  const out: ComponentCsvPreviewRow[] = [];

  for (const pr of parsedRows) {
    let supplierMatch: ComponentCsvPreviewRow["supplierMatch"] = "none";
    let supplierId: string | null = null;
    let supplierHint: string | null = null;

    const rawId = pr.supplier_id_cell;
    const rawName = pr.supplier_name_cell;

    if (rawId && isLikelyUuid(rawId)) {
      if (idSet.has(rawId.trim())) {
        supplierMatch = "resolved";
        supplierId = rawId.trim();
      } else {
        supplierMatch = "unresolved";
        supplierHint = `Unknown supplier_id ${rawId}`;
      }
    } else if (rawName) {
      const ids = byLower.get(rawName.toLowerCase()) ?? [];
      if (ids.length === 1) {
        supplierMatch = "resolved";
        supplierId = ids[0]!;
      } else if (ids.length > 1) {
        supplierMatch = "ambiguous";
        supplierHint = `Multiple suppliers match "${rawName}"`;
      } else {
        supplierMatch = "unresolved";
        supplierHint = rawName;
      }
    }

    out.push({
      rowIndex: pr.rowIndex,
      name: pr.name,
      part_number: pr.part_number,
      manufacturer_sku: pr.manufacturer_sku,
      manufacturer: pr.manufacturer,
      description: pr.description,
      category: pr.category,
      supplierMatch,
      supplierId,
      supplierHint,
    });
  }

  return { success: true, rows: out, parseWarnings };
}

export type ComponentCsvImportResult =
  | {
      success: true;
      upserted: number;
      unresolvedSkipped: number;
      duplicateSkipped: number;
    }
  | { success: false; error: string };

/**
 * Import components from CSV. Optional `resolutions` JSON: { "[rowIndex]": "supplier-uuid" } for unresolved or ambiguous rows.
 */
export async function importComponentsFromCsv(
  formData: FormData
): Promise<ComponentCsvImportResult> {
  let profile;
  try {
    profile = await requireRole(["admin", "compliance_manager"]);
  } catch (error) {
    return { success: false, error: getPermissionErrorMessage(error) ?? "Unable to import components." };
  }
  const supabase = await createClient();

  const file = formData.get("file") as File | null;
  const resolutionsRaw = (formData.get("resolutions") as string | null)?.trim() || "{}";

  if (!file?.name) return { success: false, error: "Please select a CSV file." };
  if (!file.name.toLowerCase().endsWith(".csv")) return { success: false, error: "File must be a CSV." };
  if (file.size > MAX_COMPONENT_CSV_BYTES) {
    return {
      success: false,
      error: `File is too large (max ${Math.round(MAX_COMPONENT_CSV_BYTES / (1024 * 1024))} MB).`,
    };
  }

  let resolutions: Record<string, string> = {};
  try {
    resolutions = JSON.parse(resolutionsRaw) as Record<string, string>;
  } catch {
    return { success: false, error: "Invalid resolutions payload." };
  }

  const text = await file.text();
  const parsedHeader = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });
  const fields = (parsedHeader.meta.fields ?? []) as string[];
  const col = buildComponentCsvColMap(fields);
  const { rows: parsedRows, errors: parseWarnings } = parseComponentCsvRows(text, col);
  if (parseWarnings.some((w) => w.includes("must include"))) {
    return { success: false, error: parseWarnings[0] ?? "Invalid CSV." };
  }

  const { data: supRows, error: supErr } = await supabase
    .from("suppliers")
    .select("id, name")
    .eq("organization_id", profile.organization_id);

  if (supErr) {
    return { success: false, error: supErr.message };
  }

  const byLower = new Map<string, string[]>();
  const idSet = new Set<string>();
  for (const s of supRows ?? []) {
    const r = s as { id: string; name: string };
    idSet.add(r.id);
    const k = r.name.toLowerCase();
    if (!byLower.has(k)) byLower.set(k, []);
    byLower.get(k)!.push(r.id);
  }

  let upserted = 0;
  let unresolvedSkipped = 0;
  let duplicateSkipped = 0;
  const seenKeys = new Set<string>();

  for (const pr of parsedRows) {
    const rowKey = `${pr.part_number.trim().toLowerCase()}::${pr.manufacturer_sku
      .trim()
      .toLowerCase()}`;
    if (seenKeys.has(rowKey)) {
      duplicateSkipped += 1;
      continue;
    }
    seenKeys.add(rowKey);

    let supplierId: string | null = null;

    const rawId = pr.supplier_id_cell;
    const rawName = pr.supplier_name_cell;

    if (rawId && isLikelyUuid(rawId) && idSet.has(rawId.trim())) {
      supplierId = rawId.trim();
    } else if (rawName) {
      const ids = byLower.get(rawName.toLowerCase()) ?? [];
      if (ids.length === 1) supplierId = ids[0]!;
    }

    const override = resolutions[String(pr.rowIndex)]?.trim();
    const importWithoutSupplier = override === "__none__";
    if (importWithoutSupplier) {
      supplierId = null;
    } else if (override && idSet.has(override)) {
      supplierId = override;
    }

    const wantedSupplier = Boolean(pr.supplier_id_cell || pr.supplier_name_cell);
    if (wantedSupplier && !supplierId && !importWithoutSupplier) {
      unresolvedSkipped += 1;
      continue;
    }

    const { error } = await supabase.from("components").upsert(
      {
        organization_id: profile.organization_id,
        name: pr.name,
        part_number: pr.part_number,
        manufacturer_sku: pr.manufacturer_sku,
        manufacturer: pr.manufacturer,
        description: pr.description,
        category: pr.category,
        supplier_id: supplierId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "organization_id,part_number,manufacturer_sku" }
    );

    if (error) {
      console.error("component csv upsert", error);
      return { success: false, error: error.message };
    }
    upserted += 1;
  }

  revalidatePath("/components");
  return { success: true, upserted, unresolvedSkipped, duplicateSkipped };
}
