import { requireProfile } from "@/lib/profile";
import MaterialIcon from "@/components/ui/MaterialIcon";

export default async function SettingsPage() {
  await requireProfile();

  return (
    <div className="p-10 space-y-8">
      <section className="mb-12">
        <div className="flex items-end justify-between">
          <div className="max-w-2xl">
            <h2 className="text-5xl font-headline font-extrabold text-on-surface tracking-tighter mb-4">
              System Ledger
            </h2>
            <p className="text-on-surface-variant font-body text-lg leading-relaxed">
              Manage global environmental compliance parameters, secure
              third-party ERP integrations, and define regulatory enforcement
              priorities across all active operational regions.
            </p>
          </div>
          <div className="hidden lg:block pb-2">
            <span className="text-xs font-body uppercase tracking-widest text-outline">
              Last configuration audit: 12m ago
            </span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-12 gap-8 items-start">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <section className="bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/20">
            <div className="flex items-center gap-3 mb-8">
              <MaterialIcon
                name="notifications_active"
                className="text-primary p-2 bg-surface-container-low rounded-lg"
              />
              <h3 className="text-xl font-headline font-bold text-on-surface">
                Compliance Alert Matrix
              </h3>
            </div>
            <div className="space-y-6">
              <div className="flex items-start justify-between p-4 hover:bg-surface-container-low rounded-xl transition-colors">
                <div className="flex-1">
                  <h4 className="font-headline font-semibold text-on-surface">
                    Immediate Regulatory Breaches
                  </h4>
                  <p className="text-sm text-on-surface-variant max-w-md">
                    Real-time critical alerts for substance limit violations in
                    the active ledger.
                  </p>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      defaultChecked
                      className="rounded border-outline-variant text-primary focus:ring-primary/20"
                      type="checkbox"
                    />
                    <span className="text-xs font-body text-on-surface-variant uppercase tracking-tighter">
                      Email
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      defaultChecked
                      className="rounded border-outline-variant text-primary focus:ring-primary/20"
                      type="checkbox"
                    />
                    <span className="text-xs font-body text-on-surface-variant uppercase tracking-tighter">
                      Push
                    </span>
                  </label>
                </div>
              </div>
              <div className="flex items-start justify-between p-4 hover:bg-surface-container-low rounded-xl transition-colors">
                <div className="flex-1">
                  <h4 className="font-headline font-semibold text-on-surface">
                    Data Integrity Syncs
                  </h4>
                  <p className="text-sm text-on-surface-variant max-w-md">
                    Notification of completed batch imports from ERP connectors
                    and manual uploads.
                  </p>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      className="rounded border-outline-variant text-primary focus:ring-primary/20"
                      type="checkbox"
                    />
                    <span className="text-xs font-body text-on-surface-variant uppercase tracking-tighter">
                      Email
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      defaultChecked
                      className="rounded border-outline-variant text-primary focus:ring-primary/20"
                      type="checkbox"
                    />
                    <span className="text-xs font-body text-on-surface-variant uppercase tracking-tighter">
                      Push
                    </span>
                  </label>
                </div>
              </div>
              <div className="flex items-start justify-between p-4 hover:bg-surface-container-low rounded-xl transition-colors">
                <div className="flex-1">
                  <h4 className="font-headline font-semibold text-on-surface">
                    Annual Report Reminders
                  </h4>
                  <p className="text-sm text-on-surface-variant max-w-md">
                    Scheduled notifications for RoHS/REACH filing deadlines and
                    tax audit cycles.
                  </p>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      defaultChecked
                      className="rounded border-outline-variant text-primary focus:ring-primary/20"
                      type="checkbox"
                    />
                    <span className="text-xs font-body text-on-surface-variant uppercase tracking-tighter">
                      Email
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      className="rounded border-outline-variant text-primary focus:ring-primary/20"
                      type="checkbox"
                    />
                    <span className="text-xs font-body text-on-surface-variant uppercase tracking-tighter">
                      Push
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white/60 backdrop-blur-xl p-8 rounded-xl border border-outline-variant/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
              <MaterialIcon
                name="integration_instructions"
                className="text-[120px]"
              />
            </div>
            <div className="flex items-center gap-3 mb-8">
              <MaterialIcon
                name="api"
                className="text-primary p-2 bg-primary-fixed-dim/20 rounded-lg"
              />
              <h3 className="text-xl font-headline font-bold text-on-surface">
                ERP Gateway Protocols
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-surface-container-lowest p-6 rounded-lg border border-outline-variant/20">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-body font-bold text-primary uppercase">
                    Production Token
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-tertiary px-2 py-0.5 bg-tertiary-fixed rounded-full">
                    ACTIVE
                  </span>
                </div>
                <div className="bg-surface-container-low px-4 py-3 rounded font-mono text-sm text-on-surface flex items-center justify-between group cursor-pointer">
                  <span>sk_live_9422...x882</span>
                  <MaterialIcon
                    name="content_copy"
                    className="text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
                <p className="mt-4 text-xs text-on-surface-variant font-body">
                  Last accessed 4 hours ago by ERP_System_Node_04
                </p>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-lg border border-outline-variant/20 flex flex-col justify-center items-center gap-4 text-center border-dashed">
                <MaterialIcon
                  name="add_circle"
                  className="text-outline-variant"
                />
                <div>
                  <p className="font-headline font-semibold text-on-surface text-sm">
                    Generate Integration Key
                  </p>
                  <p className="text-[11px] text-on-surface-variant mt-1 font-body">
                    Add a new secure endpoint for sandbox testing
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-8 flex gap-4">
              <button
                type="button"
                className="px-6 py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline font-bold rounded-lg text-sm shadow-sm active:scale-95 transition-transform"
              >
                Save Integration Map
              </button>
              <button
                type="button"
                className="px-6 py-2.5 bg-surface-container-high text-on-secondary-container font-headline font-semibold rounded-lg text-sm active:scale-95 transition-transform"
              >
                Revoke All Keys
              </button>
            </div>
          </section>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-8">
          <section className="bg-surface-container-low p-8 rounded-xl">
            <div className="flex items-center gap-3 mb-6">
              <MaterialIcon
                name="policy"
                className="text-on-tertiary-fixed-variant"
              />
              <h3 className="text-lg font-headline font-bold text-on-surface">
                Regulatory Filters
              </h3>
            </div>
            <p className="text-sm text-on-surface-variant mb-8 font-body leading-relaxed">
              Define the default governing bodies and directives for automated
              report generation and risk assessment.
            </p>
            <div className="space-y-4">
              {[
                { name: "RoHS (EU)", desc: "Directive 2011/65/EU", on: true },
                {
                  name: "REACH",
                  desc: "Substances of Very High Concern",
                  on: true,
                },
                {
                  name: "WEEE Directive",
                  desc: "Waste Electrical & Electronic Equipment",
                  on: false,
                },
                {
                  name: "California Prop 65",
                  desc: "Drinking Water & Toxic Enforcement",
                  on: false,
                },
              ].map((r) => (
                <div
                  key={r.name}
                  className="bg-surface-container-lowest p-5 rounded-lg border border-outline-variant/20 flex items-center justify-between"
                >
                  <div>
                    <h5 className="font-headline font-bold text-sm text-on-surface">
                      {r.name}
                    </h5>
                    <p className="text-[11px] text-on-surface-variant font-body">
                      {r.desc}
                    </p>
                  </div>
                  <div
                    className={`w-10 h-6 rounded-full relative flex items-center px-1 ${
                      r.on ? "bg-primary justify-end" : "bg-outline-variant/50 justify-start"
                    }`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="w-full mt-8 py-3 text-primary font-headline font-bold text-sm hover:bg-surface-container-high rounded-lg transition-colors border border-primary/10"
            >
              Manage Custom Regulation Sets
            </button>
          </section>

          <section className="p-8 border border-outline-variant/20 rounded-xl bg-surface-container-lowest">
            <h3 className="text-sm font-headline font-extrabold text-on-surface uppercase tracking-widest mb-6">
              Recent Log Activity
            </h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-[2px] bg-secondary-fixed-dim rounded-full" />
                <div>
                  <p className="text-xs font-bold text-on-surface font-body">
                    API KEY ROTATED
                  </p>
                  <p className="text-[11px] text-on-surface-variant font-body">
                    By System Admin • Yesterday 14:02
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-[2px] bg-secondary-fixed-dim rounded-full" />
                <div>
                  <p className="text-xs font-bold text-on-surface font-body">
                    NOTIFICATION UPDATED
                  </p>
                  <p className="text-[11px] text-on-surface-variant font-body">
                    User: mark_compliance • Jul 24, 09:15
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-[2px] bg-tertiary-fixed-dim rounded-full" />
                <div>
                  <p className="text-xs font-bold text-on-surface font-body">
                    NEW FILTER ACTIVE: RoHS v3
                  </p>
                  <p className="text-[11px] text-on-surface-variant font-body">
                    Auto-update • Jul 22, 11:30
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <footer className="mt-20 border-t border-outline-variant/10 pt-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2 text-xs font-body text-on-secondary-container">
            <span className="w-2 h-2 bg-tertiary-fixed-dim rounded-full" />
            System Online (V 4.2.0)
          </span>
          <span className="text-xs font-body text-outline">
            Encryption: AES-256-GCM
          </span>
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            className="px-8 py-3 bg-surface-container-high text-on-secondary-container font-headline font-bold rounded-lg text-sm active:scale-95 transition-transform"
          >
            Reset Defaults
          </button>
          <button
            type="button"
            className="px-12 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline font-bold rounded-lg text-sm shadow-md active:scale-95 transition-transform"
          >
            Commit All Changes
          </button>
        </div>
      </footer>
    </div>
  );
}
