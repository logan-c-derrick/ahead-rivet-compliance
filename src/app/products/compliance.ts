"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/profile";

export type RegulationRow = {
  id: string;
  code: string;
  name: string;
};

export type ProductRegulationStatusRow = {
  regulation_code: string;
  regulation_name: string;
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

export async function getProductComplianceTable(
  productId: string
): Promise<ProductRegulationStatusRow[]> {
  // Ensures auth + profile row exists; RLS also enforces the org boundary.
  await requireProfile();
  const supabase = await createClient();

  const { data: regulations, error: regsError } = await supabase
    .from("regulations")
    .select("id, code, name")
    .order("code");

  if (regsError) {
    console.error("Error fetching regulations:", regsError);
    return [];
  }

  const { data: linkedRows, error: linkedError } = await supabase
    .from("product_components")
    .select("component_id")
    .eq("product_id", productId);

  if (linkedError) {
    console.error("Error fetching product_components:", linkedError);
  }

  const componentIds = (linkedRows ?? [])
    .map((x: { component_id: string }) => x.component_id)
    .filter(Boolean);

  let componentRegRows: Array<{ component_id: string; regulation_id: string; status: string }> = [];
  if (componentIds.length > 0) {
    const { data: cr, error: crErr } = await supabase
      .from("component_regulations")
      .select("component_id, regulation_id, status")
      .in("component_id", componentIds);

    if (crErr) {
      console.error("Error fetching component_regulations:", crErr);
    } else {
      componentRegRows = (cr ?? []) as typeof componentRegRows;
    }
  }

  const statusByComponentAndReg = new Map<string, Map<string, string>>();
  for (const row of componentRegRows) {
    if (!statusByComponentAndReg.has(row.component_id)) {
      statusByComponentAndReg.set(row.component_id, new Map());
    }
    statusByComponentAndReg.get(row.component_id)!.set(row.regulation_id, row.status);
  }

  const { data: statusRows, error: statusError } = await supabase
    .from("product_regulation_status")
    .select("regulation_id, status, compliance_date, notes")
    .eq("product_id", productId);

  if (statusError) {
    console.error("Error fetching product_regulation_status:", statusError);
  }

  const statusByReg = new Map<
    string,
    { status: string; compliance_date: string | null; notes: string | null }
  >();
  (statusRows ?? []).forEach((row: any) => {
    statusByReg.set(row.regulation_id, {
      status: row.status,
      compliance_date: row.compliance_date ?? null,
      notes: row.notes ?? null,
    });
  });

  const bomCount = componentIds.length;

  return (regulations ?? []).map((r: any) => {
    const s = statusByReg.get(r.id);
    let compliant = 0;
    if (bomCount > 0) {
      for (const cid of componentIds) {
        const st = statusByComponentAndReg.get(cid)?.get(r.id);
        if (st === "compliant") compliant += 1;
      }
    }
    const verification_percent =
      bomCount === 0 ? 0 : Math.round((100 * compliant) / bomCount);

    return {
      regulation_code: r.code,
      regulation_name: r.name,
      status: s?.status ?? "pending",
      compliance_date: s?.compliance_date ?? null,
      notes: s?.notes ?? null,
      bom_component_count: bomCount,
      compliant_component_count: compliant,
      verification_percent,
    };
  });
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

export async function recalculateProductRegulationStatus(productId: string) {
  await requireProfile();
  const supabase = await createClient();

  // Components linked to product
  const { data: linked, error: linkedError } = await supabase
    .from("product_components")
    .select("component_id")
    .eq("product_id", productId);

  if (linkedError) {
    throw linkedError;
  }

  const componentIds = (linked ?? []).map((x: any) => x.component_id).filter(Boolean);

  // All regulations (seed includes 8)
  const { data: regulations, error: regsError } = await supabase
    .from("regulations")
    .select("id")
    .order("code");

  if (regsError) {
    throw regsError;
  }

  // Component regulation statuses for linked components
  let componentRegRows: Array<{
    component_id: string;
    regulation_id: string;
    status: string;
  }> = [];

  if (componentIds.length > 0) {
    const { data: compRegs, error: compRegsError } = await supabase
      .from("component_regulations")
      .select("component_id, regulation_id, status")
      .in("component_id", componentIds);

    if (compRegsError) {
      throw compRegsError;
    }

    componentRegRows = (compRegs ?? []) as any;
  }

  // Build quick lookup: component_id -> regulation_id -> status
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

    if (componentIds.length === 0) {
      // No components linked: treat as not-ready.
      computedStatus = "pending";
    } else {
      const statusesForReg: string[] = componentIds.map((componentId) => {
        const regMap = statusByComponentAndReg.get(componentId);
        return regMap?.get(reg.id) ?? "missing_data";
      });

      if (statusesForReg.some((s) => s === "non_compliant")) {
        computedStatus = "non_compliant";
      } else if (statusesForReg.some((s) => s === "pending")) {
        computedStatus = "pending";
      } else if (statusesForReg.some((s) => s === "missing_data")) {
        computedStatus = "at_risk";
      } else if (statusesForReg.every((s) => s === "compliant")) {
        computedStatus = "compliant";
      } else {
        computedStatus = "pending";
      }
    }

    return {
      product_id: productId,
      regulation_id: reg.id,
      status: computedStatus,
      compliance_date: today,
      notes: null,
    };
  });

  const { error: upsertError } = await supabase
    .from("product_regulation_status")
    .upsert(upsertRows, { onConflict: "product_id,regulation_id" });

  if (upsertError) {
    throw upsertError;
  }

  revalidatePath(`/products/${productId}?tab=compliance`);
  redirect(`/products/${productId}?tab=compliance`);
}

