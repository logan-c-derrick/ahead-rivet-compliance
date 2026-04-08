import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "./profile";

export async function getUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) redirect("/login");
  
  // Check if profile exists
  const profile = await getProfile();
  if (!profile) {
    redirect("/profile-missing");
  }
  
  return user;
}
