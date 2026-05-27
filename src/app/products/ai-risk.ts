"use server";

import { createClient } from "@/lib/supabase/server";
import { getPermissionErrorMessage, requireRole } from "@/lib/profile";
import { callCompanyAI } from "@/lib/company-ai";
import type { ProductBomComponent } from "./actions";

export type ComponentRiskFlag = {
  component_id: string;
  component_name: string;
  part_number: string | null;
  risk_level: "high" | "medium" | "low" | "none";
  regulations: string[];
  substances: string[];
  reasoning: string;
};

export type ProductRiskAssessment = {
  overall_risk: "high" | "medium" | "low" | "none";
  summary: string;
  components: ComponentRiskFlag[];
  assessed_at: string;
};

export type AiRiskResult =
  | { ok: true; assessment: ProductRiskAssessment }
  | { ok: false; error: string };

export async function aiRiskAssessProduct(
  productId: string,
  bomRows: ProductBomComponent[]
): Promise<AiRiskResult> {
  try {
    await requireRole(["admin", "compliance_manager"]);
  } catch (error) {
    return { ok: false, error: getPermissionErrorMessage(error) ?? "Insufficient permissions." };
  }

  if (bomRows.length === 0) {
    return { ok: false, error: "This product has no BOM components to assess." };
  }

  const supabase = await createClient();

  // Verify product belongs to caller org
  const { data: product } = await supabase
    .from("products")
    .select("id, name")
    .eq("id", productId)
    .single();

  if (!product) return { ok: false, error: "Product not found." };

  const componentList = bomRows.map((c) => ({
    id: c.component_id,
    name: c.component_name,
    part_number: c.part_number ?? null,
    manufacturer: c.manufacturer ?? null,
    manufacturer_sku: c.manufacturer_sku ?? null,
    category: c.category ?? null,
    description: c.description ?? null,
  }));

  const prompt = `You are an environmental compliance specialist with deep expertise in RoHS, REACH, and related EU/global regulations for electronic products and components.

You are reviewing the Bill of Materials (BOM) for a product called "${(product as { id: string; name: string }).name}". For each component, assess the likelihood that it contains restricted or regulated substances (e.g., Lead, Mercury, Cadmium, Hexavalent Chromium, PBB, PBDE, SVHC candidates under REACH, etc.) based on the component type, name, manufacturer, and description.

BOM Components (JSON):
${JSON.stringify(componentList, null, 2)}

For EACH component, provide a risk assessment. Consider:
- Component category (e.g. solder, battery, capacitor, cable, PCB) often indicates substance risk
- Older part numbers or unknown manufacturers increase uncertainty
- Surface coatings, plating, and connectors often contain restricted substances

Respond with a JSON object ONLY (no markdown, no text outside the JSON) with this exact structure:
{
  "overall_risk": "high|medium|low|none",
  "summary": "2-3 sentence executive summary of the product's compliance risk profile and top priorities",
  "components": [
    {
      "component_id": "exact id from input",
      "component_name": "exact name from input",
      "part_number": "exact part_number from input or null",
      "risk_level": "high|medium|low|none",
      "regulations": ["RoHS", "REACH SVHC"],
      "substances": ["Lead (Pb)", "Cadmium (Cd)"],
      "reasoning": "1-2 sentence explanation of why this component is at risk and what to verify"
    }
  ],
  "assessed_at": "${new Date().toISOString()}"
}

Risk level definitions:
- "high": Component type/category is very commonly associated with restricted substances (e.g., lead-based solder, lithium batteries, CRT, certain capacitors, mercury switches)
- "medium": Component may contain restricted substances depending on manufacturing process or supplier (e.g., connectors with plating, PCBs, cables with PVC)
- "low": Component type is generally compliant by design but worth verifying (e.g., most modern passives, optical components)
- "none": Component type has minimal or no known substance concerns

Include ALL components from the input in your response, even if risk_level is "none". The components array must have exactly ${bomRows.length} entries.`;

  try {
    const text = await callCompanyAI([{ role: "user", content: prompt }]);
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    let assessment: ProductRiskAssessment;
    try {
      assessment = JSON.parse(cleaned) as ProductRiskAssessment;
    } catch {
      return { ok: false, error: "AI returned an unexpected format. Please try again." };
    }

    // Backfill assessed_at if AI didn't include it
    if (!assessment.assessed_at) {
      assessment.assessed_at = new Date().toISOString();
    }

    return { ok: true, assessment };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `AI request failed: ${msg}` };
  }
}
