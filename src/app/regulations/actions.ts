"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/profile";

function parseThresholdsFromForm(
  formData: FormData
): Record<string, { warning: number; critical: number }> | null {
  const rows: { key: string; warn: string; crit: string }[] = [
    {
      key: (formData.get("threshold_key_1") as string)?.trim() || "carbon_emission",
      warn: formData.get("threshold_warn_1") as string,
      crit: formData.get("threshold_crit_1") as string,
    },
    {
      key: (formData.get("threshold_key_2") as string)?.trim() || "ph",
      warn: formData.get("threshold_warn_2") as string,
      crit: formData.get("threshold_crit_2") as string,
    },
  ];

  const out: Record<string, { warning: number; critical: number }> = {};
  for (const r of rows) {
    const w = parseFloat(String(r.warn ?? "").trim());
    const c = parseFloat(String(r.crit ?? "").trim());
    if (!Number.isFinite(w) || !Number.isFinite(c)) continue;
    out[r.key] = { warning: w, critical: c };
  }
  return Object.keys(out).length > 0 ? out : null;
}

/** Generate a unique code from regulation name (e.g. "Carbon-Zero Framework 2024" -> "CZF-2024") */
function slugToCode(name: string): string {
  const trimmed = name.trim();
  const abbrev = trimmed
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 6);
  const year = new Date().getFullYear();
  return `${abbrev}-${year}`;
}

async function createCustomRegulationImpl(
  formData: FormData
): Promise<{ error?: string }> {
  await requireProfile();
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  const jurisdiction = (formData.get("jurisdiction") as string)?.trim() || null;
  const effectiveDate = (formData.get("effective_date") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim() || null;

  if (!name) {
    return { error: "Regulation name is required" };
  }

  const code = slugToCode(name);
  const thresholds = parseThresholdsFromForm(formData);

  const { error } = await supabase.from("regulations").insert({
    code,
    name,
    description: description || null,
    jurisdiction: jurisdiction || null,
    effective_date: effectiveDate || null,
    thresholds: thresholds ?? null,
  });

  if (error) {
    console.error("Error creating regulation:", error);
    return { error: error.message };
  }

  revalidatePath("/regulations");
  redirect("/regulations");
}

export async function createCustomRegulation(formData: FormData): Promise<void> {
  const result = await createCustomRegulationImpl(formData);
  if (result?.error) {
    throw new Error(result.error);
  }
}

const MAX_REG_CSV_BYTES = 2 * 1024 * 1024;

export type RegulationsCsvImportResult =
  | { success: true; inserted: number; updated: number }
  | { success: false; error: string };

/**
 * CSV columns: code (required), name (required), jurisdiction, effective_date,
 * source_first_published_at, source_last_updated_at (ISO date), description
 */
export async function importRegulationsFromCsv(
  formData: FormData
): Promise<RegulationsCsvImportResult> {
  await requireProfile();
  const supabase = await createClient();
  const file = formData.get("file") as File | null;
  if (!file?.name) return { success: false, error: "Please select a CSV file." };
  if (!file.name.toLowerCase().endsWith(".csv")) return { success: false, error: "File must be a CSV." };
  if (file.size > MAX_REG_CSV_BYTES) {
    return { success: false, error: "File is too large (max 2 MB)." };
  }

  const text = await file.text();
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  const fields = (parsed.meta.fields ?? []) as string[];
  const rows = (parsed.data ?? []) as Record<string, string>[];

  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const fieldMap = new Map(fields.map((f) => [norm(f), f] as const));
  const col = (aliases: string[]) => {
    for (const a of aliases) {
      const k = norm(a);
      if (fieldMap.has(k)) return fieldMap.get(k)!;
    }
    return null;
  };

  const cCode = col(["code", "regulation_code"]);
  const cName = col(["name", "regulation_name"]);
  if (!cCode || !cName) {
    return { success: false, error: 'CSV must include "code" and "name" columns.' };
  }

  const cJur = col(["jurisdiction"]);
  const cEff = col(["effective_date"]);
  const cPub = col(["source_first_published_at", "first_published", "initial_publication"]);
  const cUpd = col(["source_last_updated_at", "last_updated", "most_recent_update"]);
  const cDesc = col(["description"]);

  let inserted = 0;
  let updated = 0;

  for (const raw of rows) {
    const code = String(raw[cCode] ?? "").trim();
    const name = String(raw[cName] ?? "").trim();
    if (!code || !name) continue;

    const jurisdiction = cJur ? String(raw[cJur] ?? "").trim() || null : null;
    const rawEff = cEff ? String(raw[cEff] ?? "").trim() : "";
    const effective_date = rawEff ? rawEff.slice(0, 10) : null;
    const rawPub = cPub ? String(raw[cPub] ?? "").trim() : "";
    const rawUpd = cUpd ? String(raw[cUpd] ?? "").trim() : "";
    const source_first_published_at = rawPub ? rawPub.slice(0, 10) : null;
    const source_last_updated_at = rawUpd ? new Date(rawUpd).toISOString() : null;
    const description = cDesc ? String(raw[cDesc] ?? "").trim() || null : null;

    const { data: existing } = await supabase
      .from("regulations")
      .select("id")
      .eq("code", code)
      .maybeSingle();

    const payload = {
      code,
      name,
      description,
      jurisdiction,
      effective_date,
      source_first_published_at: source_first_published_at || null,
      source_last_updated_at: source_last_updated_at || null,
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      const { error } = await supabase.from("regulations").update(payload).eq("id", existing.id);
      if (error) return { success: false, error: error.message };
      updated += 1;
    } else {
      const { error } = await supabase.from("regulations").insert(payload);
      if (error) return { success: false, error: error.message };
      inserted += 1;
    }
  }

  revalidatePath("/regulations");
  return { success: true, inserted, updated };
}
