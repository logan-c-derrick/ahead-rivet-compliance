"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPermissionErrorMessage, requireProfile, requireRole } from "@/lib/profile";

export type RegulationRow = {
  id: string;
  code: string;
  name: string;
  is_default: boolean;
};

export type ProductRegulationStatusRow = {
  regulation_code: string;
  regulation_name: string;
  is_default: boolean;
  status: string;
  compliance_date: string | null;
  notes: string | null;
  /** BOM components on this product */
  bom_component_count: number;
  /** Components marked compliant for this regulation */
  compliant_component_count: number;
  /** Share of BOM components compliant for this regulation (0–100) */
  verification_percent: number;
};

export type ProductReleaseStatusRow = {
  id: string;
  release_key: string;
  release_title: string | null;
  regulation_code: string;
  regulation_name: string;
  status: string;
  evaluated_at: string | null;
  notes: string | null;
};

function toDateOnly(isoString: string): string {
  // isoString example: 2026-03-20T12:34:56.789Z
  return isoString.slice(0, 10);
}

export async function getAllRegulations(): Promise<RegulationRow[]> {
  await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("regulations")
    .select("id, code, name, is_default")
    .order("is_default", { ascending: false })
    .order("code");
  return (data ?? []) as RegulationRow[];
}

export async function getProductComplianceTable(
  productId: string
): Promise<ProductRegulationStatusRow[]> {
  await requireProfile();
  const supabase = await createClient();

  // Only show: (1) default regulations always, (2) non-default regs that have an explicit row
  const { data: statusRows, error: statusError } = await supabase
    .from("product_regulation_status")
    .select("regulation_id, status, compliance_date, notes")
    .eq("product_id", productId);

  if (statusError) console.error("Error fetching product_regulation_status:", statusError);

  const explicitRegIds = new Set((statusRows ?? []).map((r: any) => r.regulation_id));

  const { data: regulations, error: regsError } = await supabase
    .from("regulations")
    .select("id, code, name, is_default")
    .order("is_default", { ascending: false })
    .order("code");

  if (regsError) {
    console.error("Error fetching regulations:", regsError);
    return [];
  }

  // Filter: default regs always included; non-default only if explicitly added
  const applicableRegs = (regulations ?? []).filter(
    (r: any) => r.is_default || explicitRegIds.has(r.id)
  );

  const { data: linkedRows } = await supabase
    .from("product_components")
    .select("component_id, components(compliance_exempt)")
    .eq("product_id", productId);

  const componentIds = (linkedRows ?? [])
    .filter((x: any) => !x.components?.compliance_exempt)
    .map((x: any) => x.component_id)
    .filter(Boolean);

  let componentRegRows: Array<{ component_id: string; regulation_id: string; status: string }> = [];
  if (componentIds.length > 0) {
    const { data: cr } = await supabase
      .from("component_regulations")
      .select("component_id, regulation_id, status")
      .in("component_id", componentIds);
    componentRegRows = (cr ?? []) as typeof componentRegRows;
  }

  const statusByComponentAndReg = new Map<string, Map<string, string>>();
  for (const row of componentRegRows) {
    if (!statusByComponentAndReg.has(row.component_id)) {
      statusByComponentAndReg.set(row.component_id, new Map());
    }
    statusByComponentAndReg.get(row.component_id)!.set(row.regulation_id, row.status);
  }

  const statusByReg = new Map<string, { status: string; compliance_date: string | null; notes: string | null }>();
  (statusRows ?? []).forEach((row: any) => {
    statusByReg.set(row.regulation_id, {
      status: row.status,
      compliance_date: row.compliance_date ?? null,
      notes: row.notes ?? null,
    });
  });

  const bomCount = componentIds.length;

  return applicableRegs.map((r: any) => {
    const s = statusByReg.get(r.id);
    let compliant = 0;
    if (bomCount > 0) {
      for (const cid of componentIds) {
        const st = statusByComponentAndReg.get(cid)?.get(r.id);
        if (st === "compliant") compliant += 1;
      }
    }
    return {
      regulation_code: r.code,
      regulation_name: r.name,
      is_default: r.is_default,
      status: s?.status ?? "pending",
      compliance_date: s?.compliance_date ?? null,
      notes: s?.notes ?? null,
      bom_component_count: bomCount,
      compliant_component_count: compliant,
      verification_percent: bomCount === 0 ? 0 : Math.round((100 * compliant) / bomCount),
    };
  });
}

export type ProductRegulationActionResult = { ok: true } | { ok: false; error: string };

export async function addProductRegulation(
  productId: string,
  regulationId: string
): Promise<ProductRegulationActionResult> {
  try {
    await requireRole(["admin", "compliance_manager"]);
  } catch (error) {
    return { ok: false, error: getPermissionErrorMessage(error) ?? "Insufficient permissions." };
  }
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase
    .from("product_regulation_status")
    .upsert(
      { product_id: productId, regulation_id: regulationId, status: "pending", compliance_date: today, notes: null },
      { onConflict: "product_id,regulation_id", ignoreDuplicates: true }
    );
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/products/${productId}`);
  return { ok: true };
}

export async function removeProductRegulation(
  productId: string,
  regulationId: string
): Promise<ProductRegulationActionResult> {
  try {
    await requireRole(["admin", "compliance_manager"]);
  } catch (error) {
    return { ok: false, error: getPermissionErrorMessage(error) ?? "Insufficient permissions." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("product_regulation_status")
    .delete()
    .eq("product_id", productId)
    .eq("regulation_id", regulationId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/products/${productId}`);
  return { ok: true };
}

export async function updateProductOptionalRegulationStatus(
  productId: string,
  regulationId: string,
  status: string,
  notes: string | null
): Promise<ProductRegulationActionResult> {
  try {
    await requireRole(["admin", "compliance_manager"]);
  } catch (error) {
    return { ok: false, error: getPermissionErrorMessage(error) ?? "Insufficient permissions." };
  }
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase
    .from("product_regulation_status")
    .upsert(
      { product_id: productId, regulation_id: regulationId, status, compliance_date: today, notes },
      { onConflict: "product_id,regulation_id" }
    );
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/products/${productId}`);
  return { ok: true };
}

export async function getProductReleaseStatuses(
  productId: string
): Promise<ProductReleaseStatusRow[]> {
  await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("product_regulation_release_status")
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
    .eq("product_id", productId)
    .order("evaluated_at", { ascending: false, nullsFirst: false })
    .limit(30);

  if (error) {
    console.error("Error loading product release statuses:", error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    release_key: row.regulation_releases?.release_key ?? "—",
    release_title: row.regulation_releases?.title ?? null,
    regulation_code: row.regulation_releases?.regulations?.code ?? "—",
    regulation_name: row.regulation_releases?.regulations?.name ?? "—",
    status: row.status,
    evaluated_at: row.evaluated_at ?? null,
    notes: row.notes ?? null,
  })) as ProductReleaseStatusRow[];
}

/** Core upsert logic shared by the single-product and bulk recalculate paths.
 *  Only processes regulations marked is_default=true (RoHS + REACH).
 *  Skips components flagged compliance_exempt=true. */
export async function recalculateProductRegulationStatusCore(
  productId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<void> {
  const { data: linked, error: linkedError } = await supabase
    .from("product_components")
    .select("component_id, components(compliance_exempt)")
    .eq("product_id", productId);

  if (linkedError) throw linkedError;

  // Only include non-exempt components in compliance calculations
  const componentIds = (linked ?? [])
    .filter((x: any) => !x.components?.compliance_exempt)
    .map((x: any) => x.component_id)
    .filter(Boolean);

  const exemptCount = (linked ?? []).filter((x: any) => x.components?.compliance_exempt).length;

  // Only auto-calculate for default regulations (RoHS + REACH)
  const { data: regulations, error: regsError } = await supabase
    .from("regulations")
    .select("id")
    .eq("is_default", true)
    .order("code");

  if (regsError) throw regsError;

  let componentRegRows: Array<{ component_id: string; regulation_id: string; status: string }> = [];
  if (componentIds.length > 0) {
    const { data: compRegs, error: compRegsError } = await supabase
      .from("component_regulations")
      .select("component_id, regulation_id, status")
      .in("component_id", componentIds);
    if (compRegsError) throw compRegsError;
    componentRegRows = (compRegs ?? []) as any;
  }

  const statusByComponentAndReg = new Map<string, Map<string, string>>();
  for (const row of componentRegRows) {
    if (!statusByComponentAndReg.has(row.component_id)) {
      statusByComponentAndReg.set(row.component_id, new Map());
    }
    statusByComponentAndReg.get(row.component_id)!.set(row.regulation_id, row.status);
  }

  const today = toDateOnly(new Date().toISOString());

  const upsertRows = (regulations ?? []).map((reg: any) => {
    let computedStatus = "pending";
    const effectiveComponentCount = componentIds.length;

    if (effectiveComponentCount === 0 && exemptCount > 0) {
      // All components are exempt — product is compliant by exemption
      computedStatus = "compliant";
    } else if (effectiveComponentCount === 0) {
      computedStatus = "pending";
    } else {
      const statusesForReg = componentIds.map((cid) => {
        return statusByComponentAndReg.get(cid)?.get(reg.id) ?? "missing_data";
      });
      if (statusesForReg.some((s) => s === "non_compliant")) computedStatus = "non_compliant";
      else if (statusesForReg.some((s) => s === "pending")) computedStatus = "pending";
      else if (statusesForReg.some((s) => s === "missing_data")) computedStatus = "at_risk";
      else if (statusesForReg.every((s) => s === "compliant")) computedStatus = "compliant";
      else computedStatus = "pending";
    }
    return { product_id: productId, regulation_id: reg.id, status: computedStatus, compliance_date: today, notes: null };
  });

  if (upsertRows.length > 0) {
    const { error: upsertError } = await supabase
      .from("product_regulation_status")
      .upsert(upsertRows, { onConflict: "product_id,regulation_id" });
    if (upsertError) throw upsertError;
  }
}

export async function recalculateProductRegulationStatus(productId: string) {
  await requireProfile();
  const supabase = await createClient();

  await recalculateProductRegulationStatusCore(productId, supabase);

  revalidatePath(`/products/${productId}?tab=compliance`);
  redirect(`/products/${productId}?tab=compliance`);
}

