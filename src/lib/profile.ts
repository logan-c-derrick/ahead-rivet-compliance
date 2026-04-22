import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  normalizeRole,
  PERMISSION_DENIED_MESSAGE,
  type AppRole,
} from "@/lib/permissions";

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

export { normalizeRole, PERMISSION_DENIED_MESSAGE } from "@/lib/permissions";

export async function requireRole(allowedRoles: AppRole[]): Promise<Profile> {
  const profile = await requireProfile();
  const role = normalizeRole(profile.role);
  if (!allowedRoles.includes(role)) {
    throw new Error(PERMISSION_DENIED_MESSAGE);
  }
  return profile;
}

export function getPermissionErrorMessage(error: unknown): string | null {
  if (error instanceof Error && error.message === PERMISSION_DENIED_MESSAGE) {
    return PERMISSION_DENIED_MESSAGE;
  }
  return null;
}

/** Returns the current user's organization_id from their profile, or null if not logged in or no profile. */
export async function getOrganizationId(): Promise<string | null> {
  const profile = await getProfile();
  return profile?.organization_id ?? null;
}
