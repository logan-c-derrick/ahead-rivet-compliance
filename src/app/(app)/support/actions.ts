"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/profile";

export async function createSupportTicket(input: {
  inquiryType: string;
  subject: string;
  description: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await requireProfile();
  const subject = input.subject.trim();
  const description = input.description.trim();
  const inquiryType = input.inquiryType.trim();

  if (!subject) return { ok: false, error: "Subject is required." };
  if (!description) return { ok: false, error: "Description is required." };
  if (!inquiryType) return { ok: false, error: "Inquiry type is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("support_tickets").insert({
    organization_id: profile.organization_id,
    requester_id: profile.id,
    inquiry_type: inquiryType,
    subject,
    description,
    status: "open",
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/support");
  return { ok: true };
}
