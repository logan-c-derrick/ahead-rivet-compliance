import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/profile";
import SignOutButton from "@/app/dashboard/signout-button";
import MaterialIcon from "@/components/ui/MaterialIcon";
import Link from "next/link";

export default async function ProfilePage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", profile.organization_id)
    .single();

  return (
    <main className="flex-1 min-w-0">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-background mb-2">
          User Settings
        </h1>
        <p className="text-on-surface-variant max-w-2xl text-lg font-body">
          Account details and organization context currently available in Rivet.
        </p>
      </header>

      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-12 md:col-span-8 bg-surface-container-lowest rounded-xl p-8 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center">
              <MaterialIcon name="account_circle" className="text-5xl text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-headline text-on-background">
                {profile.full_name ?? "User"}
              </h2>
              <p className="text-on-surface-variant font-body capitalize">
                {profile.role.replaceAll("_", " ")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-container-low rounded-lg p-4">
              <p className="text-[11px] uppercase tracking-widest text-on-surface-variant font-body">Full name</p>
              <p className="text-sm font-semibold text-on-surface mt-1">{profile.full_name ?? "Not set"}</p>
            </div>
            <div className="bg-surface-container-low rounded-lg p-4">
              <p className="text-[11px] uppercase tracking-widest text-on-surface-variant font-body">Email</p>
              <p className="text-sm font-semibold text-on-surface mt-1 break-all">
                {profile.email ?? "Not set"}
              </p>
            </div>
            <div className="bg-surface-container-low rounded-lg p-4">
              <p className="text-[11px] uppercase tracking-widest text-on-surface-variant font-body">Organization</p>
              <p className="text-sm font-semibold text-on-surface mt-1">{org?.name ?? "Organization"}</p>
            </div>
            <div className="bg-surface-container-low rounded-lg p-4">
              <p className="text-[11px] uppercase tracking-widest text-on-surface-variant font-body">Access role</p>
              <p className="text-sm font-semibold text-on-surface mt-1 capitalize">
                {profile.role.replaceAll("_", " ")}
              </p>
            </div>
          </div>
        </section>

        <section className="col-span-12 md:col-span-4 bg-surface-container-low rounded-xl p-6 space-y-4">
          <h3 className="font-headline font-bold text-lg text-on-background">Account Actions</h3>
          <Link
            href="/profile/organization"
            className="w-full inline-flex items-center justify-between rounded-lg bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-primary hover:bg-surface-container-high transition-colors"
          >
            Organization details
            <MaterialIcon name="chevron_right" className="text-base" />
          </Link>
          <SignOutButton
            className="w-full py-2.5 text-sm font-bold text-error hover:bg-error/5 rounded-lg font-body flex items-center justify-center gap-2"
            label="Sign Out"
          />
        </section>
      </div>
    </main>
  );
}
