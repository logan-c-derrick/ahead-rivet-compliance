import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SignOutButton from "@/app/dashboard/signout-button";
import ProfileSetupFormWrapper from "./form-wrapper";

export default async function ProfileSetupPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  // Check if profile already exists
  const supabase = await createClient();
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (existingProfile) {
    redirect("/dashboard");
  }

  // Get available organizations
  const { data: organizations } = await supabase
    .from("organizations")
    .select("id, name")
    .order("name");

  return (
    <div className="min-h-screen p-6 flex items-center justify-center bg-surface">
      <div className="max-w-2xl w-full space-y-6">
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold font-headline text-primary">Complete Your Profile</h1>
            <SignOutButton />
          </div>

          <div className="space-y-3 text-sm text-on-surface font-body">
            <p>
              To use Rivet, you need to be associated with an organization.
            </p>
            <p>
              Select an existing organization or create a new one.
            </p>
          </div>

          <ProfileSetupFormWrapper 
            organizations={organizations || []}
            defaultName={user.user_metadata?.full_name || ""}
          />
        </div>
      </div>
    </div>
  );
}
