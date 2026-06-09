"use server";

import { createClient } from "@/lib/supabase/server";
import { getPermissionErrorMessage, requireProfile, requireRole } from "@/lib/profile";
import { callCompanyAI } from "@/lib/company-ai";

export type SearchResultItem = {
  type: "component" | "product";
  id: string;
  name: string;
  part_number?: string | null;
  sku?: string | null;
  category?: string | null;
  manufacturer?: string | null;
  supplier_name?: string | null;
  reason: string;
};

export type NaturalLanguageSearchResult =
  | { ok: true; results: SearchResultItem[]; explanation: string; query: string }
  | { ok: false; error: string };

export async function aiNaturalLanguageSearch(
  query: string
): Promise<NaturalLanguageSearchResult> {
  try {
    await requireRole(["admin", "compliance_manager", "viewer"]);
  } catch (error) {
    return { ok: false, error: getPermissionErrorMessage(error) ?? "Insufficient permissions." };
  }

  const trimmed = query.trim();
  if (!trimmed) return { ok: false, error: "Please enter a search query." };

  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: components }, { data: products }] = await Promise.all([
    supabase
      .from("components")
      .select("id, name, part_number, category, manufacturer, manufacturer_sku, description, supplier_id, suppliers(name)")
      .eq("organization_id", profile.organization_id)
      .order("name")
      .limit(500),
    supabase
      .from("products")
      .select("id, name, sku, category, lifecycle_status, oem_vendor_id, oem_vendors(name)")
      .eq("organization_id", profile.organization_id)
      .order("name")
      .limit(200),
  ]);

  const componentList = (components ?? []).map((c: any) => ({
    type: "component",
    id: c.id,
    name: c.name,
    part_number: c.part_number ?? null,
    category: c.category ?? null,
    manufacturer: c.manufacturer ?? null,
    manufacturer_sku: c.manufacturer_sku ?? null,
    description: c.description ?? null,
    supplier_name: c.suppliers?.name ?? null,
  }));

  const productList = (products ?? []).map((p: any) => ({
    type: "product",
    id: p.id,
    name: p.name,
    sku: p.sku ?? null,
    category: p.category ?? null,
    lifecycle_status: p.lifecycle_status,
    oem_vendor: p.oem_vendors?.name ?? null,
  }));

  const prompt = `You are a data analyst for a compliance management system. A user has entered a natural language search query. Your job is to find matching items from the provided catalog and return them with a brief explanation for each match.

USER QUERY: "${trimmed}"

CATALOG — COMPONENTS (${componentList.length} items):
${JSON.stringify(componentList, null, 2)}

CATALOG — PRODUCTS (${productList.length} items):
${JSON.stringify(productList, null, 2)}

Find all items that match the user's intent. Interpret the query broadly and helpfully. Examples:
- "components without manufacturer SKU" → components where manufacturer_sku is null or equals part_number
- "products with no BOM" → not detectable from this data, so explain that
- "Seagate drives" → components with manufacturer "Seagate"
- "PCB components" → components with category containing "PCB"
- "suppliers without compliance email" → not detectable from this data alone
- "active products" → products with lifecycle_status = "active"

Respond with a JSON object ONLY (no markdown, no text outside the JSON):
{
  "explanation": "1-2 sentence explanation of how you interpreted the query and what you found",
  "results": [
    {
      "type": "component|product",
      "id": "exact id from catalog",
      "name": "exact name from catalog",
      "part_number": "if component, part_number or null",
      "sku": "if product, sku or null",
      "category": "category or null",
      "manufacturer": "if component, manufacturer or null",
      "supplier_name": "if component, supplier_name or null",
      "reason": "1 sentence explaining why this item matches the query"
    }
  ]
}

Return an empty results array if nothing matches. Do not fabricate items — only return items from the provided catalogs.`;

  try {
    const text = await callCompanyAI([{ role: "user", content: prompt }]);
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    let parsed: { explanation: string; results: SearchResultItem[] };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return { ok: false, error: "AI returned an unexpected format. Try rephrasing your query." };
    }
    return { ok: true, results: parsed.results ?? [], explanation: parsed.explanation ?? "", query: trimmed };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `AI request failed: ${msg}` };
  }
}
