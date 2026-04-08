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

  const orgName = org?.name ?? "EcoStratum Global";

  return (
    <main className="flex-1 min-w-0">
      <section className="mb-12">
        <h2 className="text-4xl font-headline font-extrabold tracking-tight text-primary mb-2">
          Organization & Role
        </h2>
        <p className="text-on-surface-variant font-body max-w-2xl">
          Manage your institutional identity and access levels across the EcoStratum ecosystem.
        </p>
      </section>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <div className="bg-surface-container-lowest p-10 rounded-xl shadow-[0_20px_40px_rgba(11,28,48,0.03)] space-y-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 font-body mb-1">
                  Entity Identity
                </p>
                <h3 className="text-3xl font-headline font-bold text-on-surface">{orgName}</h3>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="bg-tertiary-fixed-dim text-tertiary px-3 py-0.5 rounded-full text-xs font-bold">
                    Active Status
                  </span>
                  <span className="text-on-surface-variant text-xs flex items-center gap-1 font-body">
                    <MaterialIcon name="verified" className="text-sm" />
                    Verified ESG Partner
                  </span>
                </div>
              </div>
              <div className="w-16 h-16 bg-surface-container-low rounded-lg flex items-center justify-center shrink-0">
                <MaterialIcon name="corporate_fare" className="text-3xl text-primary" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
              <div>
                <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider font-body block mb-1">
                  Functional Department
                </label>
                <div className="flex items-center gap-3 p-4 bg-surface-container-low rounded-lg">
                  <MaterialIcon name="account_tree" className="text-primary-container" />
                  <p className="font-headline font-semibold text-primary">Compliance & Risk</p>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider font-body block mb-1">
                  Access Tier
                </label>
                <div className="flex items-center gap-3 p-4 bg-surface-container-low rounded-lg">
                  <MaterialIcon name="admin_panel_settings" className="text-primary-container" />
                  <p className="font-headline font-semibold text-primary">{profile.role ?? "Administrator"}</p>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider font-body block mb-1">
                  Reporting Line
                </label>
                <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-surface-container-high shrink-0" />
                  <div>
                    <p className="font-headline font-semibold text-primary text-sm">Elena Rodriguez</p>
                    <p className="text-[10px] text-on-surface-variant font-body">VP of Global Governance</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider font-body block mb-1">
                  Tenure Status
                </label>
                <div className="flex items-center gap-3 p-4 bg-surface-container-low rounded-lg">
                  <MaterialIcon name="calendar_today" className="text-primary-container" />
                  <p className="font-headline font-semibold text-primary">Since Jan 2021</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low p-8 rounded-xl space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h4 className="font-headline font-bold text-xl text-primary flex items-center gap-2">
                <MaterialIcon name="hub" />
                Resource Permissions
              </h4>
              <button type="button" className="text-xs font-bold text-primary px-4 py-2 hover:bg-white rounded-md transition-colors font-body">
                Audit History
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg flex flex-col gap-2">
                <MaterialIcon name="check_circle" className="text-tertiary-fixed-dim" filled />
                <p className="text-xs font-bold font-body">Ledger Edit</p>
                <p className="text-[10px] text-on-surface-variant font-body">Full authority over compliance data entry.</p>
              </div>
              <div className="bg-white p-4 rounded-lg flex flex-col gap-2">
                <MaterialIcon name="check_circle" className="text-tertiary-fixed-dim" filled />
                <p className="text-xs font-bold font-body">Risk Approval</p>
                <p className="text-[10px] text-on-surface-variant font-body">Authorized to sign off on mitigation plans.</p>
              </div>
              <div className="bg-white p-4 rounded-lg flex flex-col gap-2 opacity-50">
                <MaterialIcon name="lock" className="text-outline" />
                <p className="text-xs font-bold font-body">Entity Deletion</p>
                <p className="text-[10px] text-on-surface-variant font-body">Global admin rights required for removal.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-8">
          <div className="bg-surface-container-highest p-8 rounded-xl space-y-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-primary-fixed-variant opacity-70 font-body">
                Primary Workspace
              </p>
              <h4 className="text-2xl font-headline font-bold text-primary mt-1">Corporate Location</h4>
            </div>
            <div className="relative h-48 w-full rounded-lg overflow-hidden bg-surface-dim">
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />
              <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white px-3 py-1.5 rounded shadow-sm">
                <MaterialIcon name="location_on" className="text-primary text-sm" filled />
                <span className="text-xs font-bold text-primary font-body">London Headquarters</span>
              </div>
            </div>
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <MaterialIcon name="map" className="text-primary-container mt-1 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-primary font-body">Regional Hub: EMEA</p>
                  <p className="text-[11px] leading-relaxed text-on-surface-variant font-body mt-0.5">
                    15 Canary Wharf, Level 42<br />London, E14 5AB<br />United Kingdom
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MaterialIcon name="schedule" className="text-primary-container shrink-0" />
                <p className="text-xs font-bold text-primary font-body">Timezone: GMT+1 (BST)</p>
              </div>
            </div>
          </div>

          <div className="p-8 border border-outline-variant/20 rounded-xl space-y-4">
            <h5 className="text-sm font-bold text-on-surface font-body">Compliance Insight</h5>
            <p className="text-xs text-on-surface-variant leading-relaxed italic font-body">
              Administrator access provides oversight of all sub-regional reports within the EcoStratum ecosystem.
            </p>
            <div className="pt-2">
              <div className="h-1 w-full bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-primary-container rounded-full" style={{ width: "80%" }} />
              </div>
              <p className="text-[9px] text-on-surface-variant mt-2 text-right font-body">80% System Training Completed</p>
            </div>
          </div>

          <button
            type="button"
            className="w-full py-4 bg-gradient-to-br from-primary to-primary-container text-white rounded-md font-headline font-bold flex items-center justify-center gap-2 shadow-lg"
          >
            <MaterialIcon name="edit" className="text-sm" />
            Request Role Adjustment
          </button>
        </div>
      </div>
    </main>
  );
}
