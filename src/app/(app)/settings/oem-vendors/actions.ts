"use server";

import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPermissionErrorMessage, requireRole } from "@/lib/profile";

export type OemVendorRow = {
  id: string;
  code: string;
  name: string;
  compliance_team_name: string | null;
  compliance_email: string | null;
  compliance_portal_url: string | null;
  notes: string | null;
  ai_verified_at: string | null;
  ai_verified_notes: string | null;
  updated_at: string;
};

export async function getOemVendorsList(): Promise<OemVendorRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("oem_vendors")
    .select("id, code, name, compliance_team_name, compliance_email, compliance_portal_url, notes, ai_verified_at, ai_verified_notes, updated_at")
    .order("name");
  if (error) return [];
  return (data as OemVendorRow[]) ?? [];
}

export type UpdateOemVendorState = { error?: string; success?: boolean };

export async function updateOemVendor(
  _prev: UpdateOemVendorState | null,
  formData: FormData
): Promise<UpdateOemVendorState> {
  try {
    await requireRole(["admin", "compliance_manager"]);
  } catch (error) {
    return { error: getPermissionErrorMessage(error) ?? "Insufficient permissions." };
  }

  const id = (formData.get("id") as string)?.trim();
  if (!id) return { error: "Missing vendor ID" };

  const compliance_team_name = (formData.get("compliance_team_name") as string)?.trim() || null;
  const compliance_email = (formData.get("compliance_email") as string)?.trim() || null;
  const compliance_portal_url = (formData.get("compliance_portal_url") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("oem_vendors")
    .update({
      compliance_team_name,
      compliance_email,
      compliance_portal_url,
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/settings/oem-vendors");
  return { success: true };
}

export type AiVerifyResult =
  | { ok: true; suggestion: AiSuggestion; vendorId: string }
  | { ok: false; error: string };

export type AiSuggestion = {
  compliance_team_name: string | null;
  compliance_email: string | null;
  compliance_portal_url: string | null;
  notes: string;
  confidence: "high" | "medium" | "low";
};

export async function aiVerifyOemVendor(vendorId: string): Promise<AiVerifyResult> {
  try {
    await requireRole(["admin", "compliance_manager"]);
  } catch (error) {
    return { ok: false, error: getPermissionErrorMessage(error) ?? "Insufficient permissions." };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "ANTHROPIC_API_KEY is not configured. Add it to your .env.local file." };
  }

  const supabase = await createClient();
  const { data: vendor, error: ve } = await supabase
    .from("oem_vendors")
    .select("id, code, name, compliance_email, compliance_team_name, compliance_portal_url")
    .eq("id", vendorId)
    .single();

  if (ve || !vendor) return { ok: false, error: "Vendor not found." };

  const v = vendor as {
    id: string; code: string; name: string;
    compliance_email: string | null;
    compliance_team_name: string | null;
    compliance_portal_url: string | null;
  };

  const client = new Anthropic({ apiKey });

  const prompt = `You are a compliance data specialist. For the OEM vendor "${v.name}" (code: ${v.code}), provide the best known environmental compliance contact information for their supplier-facing environmental/chemical compliance program (e.g., RoHS, REACH, hazardous substance declarations).

Current data on file:
- Team: ${v.compliance_team_name ?? "unknown"}
- Email: ${v.compliance_email ?? "unknown"}
- Portal: ${v.compliance_portal_url ?? "unknown"}

Respond with a JSON object ONLY (no markdown) with these exact fields:
{
  "compliance_team_name": "name of the team or contact person",
  "compliance_email": "email address or null if unknown",
  "compliance_portal_url": "URL to their supplier compliance portal or null if unknown",
  "notes": "brief explanation of what you found and any caveats",
  "confidence": "high|medium|low"
}

Use "high" confidence only if you are very sure the info is accurate. Use "low" if you are guessing. If you don't know, return null for email/URL but still provide best-effort notes.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const text = (message.content[0] as { type: string; text: string }).text?.trim() ?? "";
    let suggestion: AiSuggestion;
    try {
      suggestion = JSON.parse(text) as AiSuggestion;
    } catch {
      return { ok: false, error: "AI returned an unexpected format. Try again." };
    }

    await supabase
      .from("oem_vendors")
      .update({
        ai_verified_at: new Date().toISOString(),
        ai_verified_notes: suggestion.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", vendorId);

    revalidatePath("/settings/oem-vendors");
    return { ok: true, suggestion, vendorId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `AI request failed: ${msg}` };
  }
}

export async function applyAiSuggestion(
  vendorId: string,
  suggestion: AiSuggestion
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireRole(["admin", "compliance_manager"]);
  } catch (error) {
    return { ok: false, error: getPermissionErrorMessage(error) ?? "Insufficient permissions." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("oem_vendors")
    .update({
      compliance_team_name: suggestion.compliance_team_name,
      compliance_email: suggestion.compliance_email,
      compliance_portal_url: suggestion.compliance_portal_url,
      notes: suggestion.notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", vendorId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings/oem-vendors");
  return { ok: true };
}
