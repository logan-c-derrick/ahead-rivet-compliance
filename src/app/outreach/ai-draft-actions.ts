"use server";

import { createClient } from "@/lib/supabase/server";
import { getPermissionErrorMessage, requireRole } from "@/lib/profile";
import { callCompanyAI } from "@/lib/company-ai";

export type AiOutreachDraftParams = {
  regulationIds: string[];
  targetingMode: string;
  productId?: string | null;
  supplierIds?: string[];
  componentIds?: string[];
  campaignContext?: string;
};

export type AiOutreachDraftResult =
  | { ok: true; subject: string; message: string }
  | { ok: false; error: string };

export async function aiDraftOutreachEmail(
  params: AiOutreachDraftParams
): Promise<AiOutreachDraftResult> {
  try {
    await requireRole(["admin", "compliance_manager"]);
  } catch (error) {
    return { ok: false, error: getPermissionErrorMessage(error) ?? "Insufficient permissions." };
  }

  const supabase = await createClient();

  let regulationNames: string[] = [];
  if (params.regulationIds.length > 0) {
    const { data: regs } = await supabase
      .from("regulations")
      .select("code, name")
      .in("id", params.regulationIds);
    regulationNames = (regs ?? []).map((r: any) => `${r.code} — ${r.name}`);
  }

  let productContext = "";
  if (params.productId) {
    const { data: product } = await supabase
      .from("products")
      .select("name, sku, category")
      .eq("id", params.productId)
      .single();
    if (product) {
      const p = product as any;
      productContext = `Product: ${p.name}${p.sku ? ` (SKU: ${p.sku})` : ""}${p.category ? `, Category: ${p.category}` : ""}`;

      const { data: bomRows } = await supabase
        .from("product_components")
        .select("components(name, category, manufacturer)")
        .eq("product_id", params.productId)
        .limit(20);

      if (bomRows?.length) {
        const compNames = (bomRows as any[])
          .map((r) => r.components?.name)
          .filter(Boolean)
          .slice(0, 10);
        productContext += `\nKey components: ${compNames.join(", ")}`;
      }
    }
  }

  let componentContext = "";
  if (params.componentIds && params.componentIds.length > 0) {
    const { data: comps } = await supabase
      .from("components")
      .select("name, part_number, category, manufacturer")
      .in("id", params.componentIds.slice(0, 15));
    if (comps?.length) {
      componentContext = (comps as any[])
        .map((c) => `${c.name}${c.part_number ? ` (${c.part_number})` : ""}${c.manufacturer ? ` by ${c.manufacturer}` : ""}`)
        .join("; ");
    }
  }

  const targetingDescription =
    params.targetingMode === "all" ? "all suppliers in the network" :
    params.targetingMode === "suppliers" ? `${params.supplierIds?.length ?? "selected"} specific suppliers` :
    params.targetingMode === "product" ? `suppliers linked to a specific product BOM` :
    params.targetingMode === "components" ? `${params.componentIds?.length ?? "selected"} specific components` :
    params.targetingMode === "oem" ? "OEM vendors directly" : params.targetingMode;

  const prompt = `You are a professional compliance email writer. Draft an outreach email to suppliers requesting environmental compliance documentation.

CONTEXT:
- Campaign targets: ${targetingDescription}
- Regulations being assessed: ${regulationNames.length > 0 ? regulationNames.join(", ") : "environmental compliance regulations (general)"}
${productContext ? `- ${productContext}` : ""}
${componentContext ? `- Components in scope: ${componentContext}` : ""}
${params.campaignContext ? `- Additional context: ${params.campaignContext}` : ""}

TEMPLATE VARIABLES AVAILABLE (use these exact tokens where appropriate):
- {{supplier_contact}} — supplier name
- {{component_name}} — primary component name
- {{component_names}} — all component names
- {{component_list}} — HTML bulleted list of components
- {{regulation_name}} — primary regulation name
- {{regulation_names}} — all regulation names
- {{regulation_list}} — HTML bulleted list of regulations
- {{deadline_date}} — response due date
- {{portal_unique_link}} — unique supplier response portal link

REQUIREMENTS:
- Professional but approachable tone
- Clearly state WHY you're reaching out (regulation update, new requirement, or periodic review)
- Be specific about what documentation is needed (SDS, RoHS Declaration of Conformity, material composition data, SVHC substance declarations, etc.)
- Include a clear call to action using {{portal_unique_link}}
- Subject line should reference the regulation(s) and be attention-grabbing but not alarmist
- Message body 3-5 paragraphs
- Sign off as "The Compliance Team at AHEAD"

Respond with a JSON object ONLY (no markdown, no text outside the JSON):
{
  "subject": "email subject line",
  "message": "full email body in HTML (using <p>, <strong>, <ul>/<li> tags as appropriate). Use the template variables where they fit naturally."
}`;

  try {
    const text = await callCompanyAI([{ role: "user", content: prompt }]);
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    let parsed: { subject: string; message: string };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return { ok: false, error: "AI returned an unexpected format. Please try again." };
    }
    return { ok: true, subject: parsed.subject ?? "", message: parsed.message ?? "" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `AI request failed: ${msg}` };
  }
}
