"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";

export async function createProfile(
  prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  const user = await getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const supabase = await createClient();

  // Check if profile already exists
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (existingProfile) {
    redirect("/dashboard");
  }

  const fullName = formData.get("full_name") as string;
  const organizationId = formData.get("organization_id") as string;
  const newOrganizationName = formData.get("new_organization_name") as string;

  let finalOrganizationId = organizationId || null;

  // Create new organization if name provided (takes precedence over selection)
  if (newOrganizationName && newOrganizationName.trim()) {
    const { data: newOrg, error: orgError } = await supabase
      .from("organizations")
      .insert({ name: newOrganizationName.trim() })
      .select("id")
      .single();

    if (orgError || !newOrg) {
      return { error: "Failed to create organization: " + (orgError?.message || "Unknown error") };
    }

    finalOrganizationId = newOrg.id;
  }

  if (!finalOrganizationId) {
    return { error: "Please select an organization or create a new one" };
  }

  // Verify organization exists
  const { data: org, error: orgCheckError } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", finalOrganizationId)
    .single();

  if (orgCheckError || !org) {
    return { error: "Selected organization does not exist" };
  }

  // Create profile
  const { error: profileError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      organization_id: finalOrganizationId,
      email: user.email || "",
      full_name: fullName || null,
      role: "user",
    });

  if (profileError) {
    console.error("Error creating profile:", profileError);
    return { error: profileError.message };
  }

  redirect("/dashboard");
}
