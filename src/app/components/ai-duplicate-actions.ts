"use server";

import { createClient } from "@/lib/supabase/server";
import { getPermissionErrorMessage, requireProfile, requireRole } from "@/lib/profile";
import { callCompanyAI } from "@/lib/company-ai";

export type DuplicateGroup = {
  component_ids: string[];
  component_names: string[];
  part_numbers: (string | null)[];
  confidence: "high" | "medium" | "low";
  reasoning: string;
};

export type DetectDuplicatesResult =
  | { ok: true; groups: DuplicateGroup[] }
  | { ok: false; error: string };

export async function aiDetectDuplicates(): Promise<DetectDuplicatesResult> {
  try {
    await requireRole(["admin", "compliance_manager"]);
  } catch (error) {
    return { ok: false, error: getPermissionErrorMessage(error) ?? "Insufficient permissions." };
  }

  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: components } = await supabase
    .from("components")
    .select("id, name, part_number, manufacturer, manufacturer_sku, category, description")
    .eq("organization_id", profile.organization_id)
    .order("name")
    .limit(400);

  if (!components?.length) {
    return { ok: false, error: "No components found to analyze." };
  }

  const list = (components).map((c: any) => ({
    id: c.id,
    name: c.name,
    part_number: c.part_number ?? null,
    manufacturer: c.manufacturer ?? null,
    manufacturer_sku: c.manufacturer_sku ?? null,
    category: c.category ?? null,
    description: c.description ?? null,
  }));

  const prompt = `You are a data quality specialist. Analyze the following component catalog for likely duplicate entries — components that represent the same physical part but have been entered under different names or part number formats (e.g., "ST1000LM035" vs "ST1000LM035-1RK172" vs "Seagate Laptop HDD 1TB").

Component catalog (${list.length} entries):
${JSON.stringify(list, null, 2)}

Identify groups of components that are likely duplicates. Consider:
- Same part number with different suffixes (variants vs. duplicates)
- Same product different naming conventions
- Generic name vs. specific manufacturer part number
- Typos or case differences
- Do NOT flag components that are genuinely different parts (different capacities, speeds, form factors are different parts)

Respond with a JSON object ONLY (no markdown, no text outside the JSON):
{
  "groups": [
    {
      "component_ids": ["id1", "id2"],
      "component_names": ["name1", "name2"],
      "part_numbers": ["pn1", "pn2"],
      "confidence": "high|medium|low",
      "reasoning": "1-2 sentences explaining why these are likely duplicates and which fields show the overlap"
    }
  ]
}

Only include groups with 2+ components. Return an empty array if no duplicates are found. Do not include groups where you're not at least somewhat confident they're the same part.`;

  try {
    const text = await callCompanyAI([{ role: "user", content: prompt }]);
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    let parsed: { groups: DuplicateGroup[] };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return { ok: false, error: "AI returned an unexpected format. Please try again." };
    }
    return { ok: true, groups: parsed.groups ?? [] };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `AI request failed: ${msg}` };
  }
}

export type MergeComponentsResult =
  | { ok: true; merged: number }
  | { ok: false; error: string };

export async function mergeComponents(
  primaryId: string,
  duplicateIds: string[]
): Promise<MergeComponentsResult> {
  try {
    await requireRole(["admin", "compliance_manager"]);
  } catch (error) {
    return { ok: false, error: getPermissionErrorMessage(error) ?? "Insufficient permissions." };
  }

  if (!primaryId || !duplicateIds.length) {
    return { ok: false, error: "Primary and at least one duplicate ID are required." };
  }

  const profile = await requireProfile();
  const supabase = await createClient();

  // Verify all components belong to org
  const { data: owned } = await supabase
    .from("components")
    .select("id")
    .in("id", [primaryId, ...duplicateIds])
    .eq("organization_id", profile.organization_id);

  const ownedIds = new Set((owned ?? []).map((r: any) => r.id));
  if (!ownedIds.has(primaryId)) return { ok: false, error: "Primary component not found." };
  const validDuplicates = duplicateIds.filter((id) => ownedIds.has(id));
  if (!validDuplicates.length) return { ok: false, error: "No valid duplicate components found." };

  // Re-point all references from duplicates to primary
  const tables = [
    { table: "product_components", col: "component_id" },
    { table: "component_regulations", col: "component_id" },
    { table: "component_regulation_release_status", col: "component_id" },
    { table: "outreach_requests", col: "component_id" },
  ];

  for (const { table, col } of tables) {
    const { error } = await supabase
      .from(table as any)
      .update({ [col]: primaryId })
      .in(col, validDuplicates);
    if (error && !error.message.includes("does not exist")) {
      console.error(`merge ${table}:`, error);
    }
  }

  // Delete duplicates
  const { error: delError } = await supabase
    .from("components")
    .delete()
    .in("id", validDuplicates)
    .eq("organization_id", profile.organization_id);

  if (delError) return { ok: false, error: delError.message };

  return { ok: true, merged: validDuplicates.length };
}
