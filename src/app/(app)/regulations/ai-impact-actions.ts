"use server";

import { createClient } from "@/lib/supabase/server";
import { getPermissionErrorMessage, requireProfile, requireRole } from "@/lib/profile";
import { callCompanyAI } from "@/lib/company-ai";

export type ImpactedComponent = {
  component_id: string;
  component_name: string;
  part_number: string | null;
  category: string | null;
  manufacturer: string | null;
  priority: "high" | "medium" | "low";
  reason: string;
  action_needed: string;
};

export type ImpactedProduct = {
  product_id: string;
  product_name: string;
  affected_component_count: number;
  reason: string;
};

export type RegulationImpactAssessment = {
  summary: string;
  impacted_components: ImpactedComponent[];
  impacted_products: ImpactedProduct[];
  recommended_actions: string[];
  assessed_at: string;
};

export type RegulationImpactResult =
  | { ok: true; assessment: RegulationImpactAssessment; regulationCode: string }
  | { ok: false; error: string };

export async function aiAnalyzeRegulationImpact(
  regulationId: string
): Promise<RegulationImpactResult> {
  try {
    await requireRole(["admin", "compliance_manager"]);
  } catch (error) {
    return { ok: false, error: getPermissionErrorMessage(error) ?? "Insufficient permissions." };
  }

  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: reg } = await supabase
    .from("regulations")
    .select("id, code, name, description, jurisdiction, effective_date")
    .eq("id", regulationId)
    .single();

  if (!reg) return { ok: false, error: "Regulation not found." };

  const { data: releases } = await supabase
    .from("regulation_releases")
    .select("release_key, title, published_at")
    .eq("regulation_id", regulationId)
    .order("published_at", { ascending: false })
    .limit(5);

  const { data: components } = await supabase
    .from("components")
    .select("id, name, part_number, category, manufacturer, manufacturer_sku, description")
    .eq("organization_id", profile.organization_id)
    .order("name")
    .limit(300);

  const { data: productLinks } = await supabase
    .from("product_components")
    .select("product_id, component_id, products(name)");

  const productNameById = new Map<string, string>();
  const componentIdsByProduct = new Map<string, string[]>();
  for (const link of productLinks ?? []) {
    const l = link as any;
    productNameById.set(l.product_id, l.products?.name ?? "—");
    if (!componentIdsByProduct.has(l.product_id)) componentIdsByProduct.set(l.product_id, []);
    componentIdsByProduct.get(l.product_id)!.push(l.component_id);
  }

  const productSummary = Array.from(componentIdsByProduct.entries()).map(([pid, cids]) => ({
    product_id: pid,
    product_name: productNameById.get(pid) ?? "—",
    component_ids: cids,
  }));

  const r = reg as any;
  const prompt = `You are an environmental compliance expert. Analyze the impact of the following regulation on a company's component and product catalog.

REGULATION:
- Code: ${r.code}
- Name: ${r.name}
- Jurisdiction: ${r.jurisdiction ?? "unknown"}
- Effective Date: ${r.effective_date ?? "unknown"}
- Description: ${r.description ?? "No description provided"}

RECENT REGULATORY RELEASES (most recent first):
${(releases ?? []).map((rel: any) => `- ${rel.release_key}: ${rel.title ?? "No title"} (${rel.published_at ? new Date(rel.published_at).toLocaleDateString() : "date unknown"})`).join("\n") || "No recent releases on file"}

COMPONENT CATALOG (${(components ?? []).length} components):
${JSON.stringify((components ?? []).map((c: any) => ({ id: c.id, name: c.name, part_number: c.part_number, category: c.category, manufacturer: c.manufacturer, description: c.description })), null, 2)}

PRODUCTS AND THEIR COMPONENT IDs:
${JSON.stringify(productSummary, null, 2)}

Based on the regulation's requirements and the catalog above, identify which components are most likely to be affected (e.g., need re-evaluation, new declarations, substance testing, or supplier outreach).

Respond with a JSON object ONLY (no markdown, no text outside the JSON):
{
  "summary": "2-3 sentence executive summary of the regulatory change and its overall impact on this catalog",
  "impacted_components": [
    {
      "component_id": "exact id from input",
      "component_name": "exact name from input",
      "part_number": "exact part_number or null",
      "category": "exact category or null",
      "manufacturer": "exact manufacturer or null",
      "priority": "high|medium|low",
      "reason": "1-2 sentences explaining why this component is affected by the regulation",
      "action_needed": "specific action required (e.g., 'Request updated RoHS declaration', 'Verify SVHC substance list', 'Check material composition')"
    }
  ],
  "impacted_products": [
    {
      "product_id": "exact product_id from input",
      "product_name": "exact product_name from input",
      "affected_component_count": 0,
      "reason": "why this product needs attention"
    }
  ],
  "recommended_actions": [
    "Prioritized list of 3-5 concrete next steps for the compliance team"
  ],
  "assessed_at": "${new Date().toISOString()}"
}

Only include components and products that are genuinely affected. Sort impacted_components by priority (high first). For impacted_products, calculate affected_component_count by cross-referencing with the component ids array for that product.`;

  try {
    const text = await callCompanyAI([{ role: "user", content: prompt }]);
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    let assessment: RegulationImpactAssessment;
    try {
      assessment = JSON.parse(cleaned) as RegulationImpactAssessment;
    } catch {
      return { ok: false, error: "AI returned an unexpected format. Please try again." };
    }
    if (!assessment.assessed_at) assessment.assessed_at = new Date().toISOString();
    return { ok: true, assessment, regulationCode: r.code };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `AI request failed: ${msg}` };
  }
}
