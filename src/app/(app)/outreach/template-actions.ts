"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/profile";

export async function saveOutreachEmailDefaults(input: {
  subjectTemplate: string;
  messageTemplate: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase.from("outreach_email_defaults").upsert(
    {
      organization_id: profile.organization_id,
      subject_template: input.subjectTemplate.trim() || null,
      message_template: input.messageTemplate.trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "organization_id" }
  );

  if (error) {
    console.error("saveOutreachEmailDefaults:", error);
    return { ok: false, error: error.message };
  }

  revalidatePath("/outreach");
  revalidatePath("/outreach/templates");
  revalidatePath("/outreach/new");
  return { ok: true };
}
