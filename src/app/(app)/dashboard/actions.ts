"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPermissionErrorMessage, requireProfile, requireRole } from "@/lib/profile";
import { recalculateProductRegulationStatusCore } from "@/app/(app)/products/compliance";

export type RecalculateAllResult =
  | { ok: true; updated: number }
  | { ok: false; error: string };

export async function recalculateAllProductsCompliance(): Promise<RecalculateAllResult> {
  try {
    await requireRole(["admin", "compliance_manager"]);
  } catch (error) {
    return { ok: false, error: getPermissionErrorMessage(error) ?? "Insufficient permissions." };
  }

  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: products, error } = await supabase
    .from("products")
    .select("id")
    .eq("organization_id", profile.organization_id);

  if (error) return { ok: false, error: error.message };
  if (!products?.length) return { ok: true, updated: 0 };

  let updated = 0;
  for (const product of products) {
    try {
      await recalculateProductRegulationStatusCore(product.id, supabase);
      updated++;
    } catch (err) {
      console.error(`recalculate failed for product ${product.id}:`, err);
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/products");
  return { ok: true, updated };
}
