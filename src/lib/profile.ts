import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface Profile {
  id: string;
  organization_id: string;
  email: string | null;
  full_name: string | null;
  role: string;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, organization_id, email, full_name, role")
    .eq("id", user.id)
    .single();

  if (error || !profile) return null;
  return profile;
}

export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) {
    redirect("/profile-missing");
  }
  return profile;
}

/** Returns the current user's organization_id from their profile, or null if not logged in or no profile. */
export async function getOrganizationId(): Promise<string | null> {
  const profile = await getProfile();
  return profile?.organization_id ?? null;
}
