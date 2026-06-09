import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/profile";
import MaterialIcon from "@/components/ui/MaterialIcon";

export default async function ProfileOrganizationPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", profile.organization_id)
    .single();

  const orgName = org?.name ?? "Rivet Global";

  return (
    <main className="flex-1 min-w-0">
      <section className="mb-10">
        <h2 className="text-4xl font-headline font-extrabold tracking-tight text-primary mb-2">
          Organization
        </h2>
        <p className="text-on-surface-variant font-body max-w-2xl">
          Current organization assignment and your access role.
        </p>
      </section>

      <section className="bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/20">
        <div className="flex items-center gap-3 mb-6">
          <MaterialIcon name="domain" className="text-primary" />
          <h3 className="text-xl font-headline font-bold text-on-surface">
            Membership Details
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface-container-low p-4 rounded-lg">
            <p className="text-[11px] uppercase tracking-widest text-on-surface-variant font-body">Organization</p>
            <p className="text-sm font-semibold text-on-surface mt-1">{orgName}</p>
          </div>
          <div className="bg-surface-container-low p-4 rounded-lg">
            <p className="text-[11px] uppercase tracking-widest text-on-surface-variant font-body">Role</p>
            <p className="text-sm font-semibold text-on-surface mt-1 capitalize">
              {profile.role.replaceAll("_", " ")}
            </p>
          </div>
          <div className="bg-surface-container-low p-4 rounded-lg md:col-span-2">
            <p className="text-[11px] uppercase tracking-widest text-on-surface-variant font-body">Organization ID</p>
            <p className="text-sm font-mono text-on-surface mt-1 break-all">{profile.organization_id}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
