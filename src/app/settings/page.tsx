import {
  PERMISSION_DENIED_MESSAGE,
  canManageSensitiveActions,
} from "@/lib/permissions";
import { requireProfile } from "@/lib/profile";
import MaterialIcon from "@/components/ui/MaterialIcon";
import {
  commitAllSettings,
  getSettingsForCurrentOrg,
  resetSettingsToDefaults,
  saveAlertPreferences,
  saveRegulatoryFilters,
} from "./actions";
import { SettingsNotice } from "./settings-notice";

type Props = {
  searchParams: Promise<{ saved?: string; error?: string }>;
};

export default async function SettingsPage({ searchParams }: Props) {
  const profile = await requireProfile();
  const canManage = canManageSensitiveActions(profile.role);
  const { saved, error } = await searchParams;
  const settings = await getSettingsForCurrentOrg();

  return (
    <div className="p-10 space-y-8">
      <section className="mb-12">
        <div className="max-w-2xl">
          <h2 className="text-5xl font-headline font-extrabold text-on-surface tracking-tighter mb-4">
            Settings
          </h2>
          <p className="text-on-surface-variant font-body text-lg leading-relaxed">
            Manage notification preferences and default regulatory scope for your organization.
          </p>
        </div>
      </section>

      <SettingsNotice saved={saved} error={error} />

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
            <form className="space-y-6" action={saveAlertPreferences}>
              {!canManage && (
                <p className="text-xs text-on-surface-variant" role="status">
                  {PERMISSION_DENIED_MESSAGE}
                </p>
              )}
              <fieldset
                disabled={!canManage}
                title={!canManage ? PERMISSION_DENIED_MESSAGE : undefined}
                className={!canManage ? "opacity-60" : undefined}
              >
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
                      defaultChecked={settings.alert_preferences.regulatory_breaches.email}
                      name="regulatory_breaches_email"
                      className="rounded border-outline-variant text-primary focus:ring-primary/20"
                      type="checkbox"
                    />
                    <span className="text-xs font-body text-on-surface-variant uppercase tracking-tighter">
                      Email
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      defaultChecked={settings.alert_preferences.regulatory_breaches.push}
                      name="regulatory_breaches_push"
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
                      defaultChecked={settings.alert_preferences.data_integrity_syncs.email}
                      name="data_integrity_syncs_email"
                      className="rounded border-outline-variant text-primary focus:ring-primary/20"
                      type="checkbox"
                    />
                    <span className="text-xs font-body text-on-surface-variant uppercase tracking-tighter">
                      Email
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      defaultChecked={settings.alert_preferences.data_integrity_syncs.push}
                      name="data_integrity_syncs_push"
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
                      defaultChecked={settings.alert_preferences.annual_report_reminders.email}
                      name="annual_report_reminders_email"
                      className="rounded border-outline-variant text-primary focus:ring-primary/20"
                      type="checkbox"
                    />
                    <span className="text-xs font-body text-on-surface-variant uppercase tracking-tighter">
                      Email
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      defaultChecked={settings.alert_preferences.annual_report_reminders.push}
                      name="annual_report_reminders_push"
                      className="rounded border-outline-variant text-primary focus:ring-primary/20"
                      type="checkbox"
                    />
                    <span className="text-xs font-body text-on-surface-variant uppercase tracking-tighter">
                      Push
                    </span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!canManage}
                  title={!canManage ? PERMISSION_DENIED_MESSAGE : undefined}
                  className="px-5 py-2.5 bg-primary text-on-primary font-headline font-bold rounded-lg text-sm hover:opacity-90 transition-opacity"
                >
                  Save Alert Preferences
                </button>
              </div>
              </fieldset>
            </form>
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
            <form className="space-y-4" action={saveRegulatoryFilters}>
              <fieldset
                disabled={!canManage}
                title={!canManage ? PERMISSION_DENIED_MESSAGE : undefined}
                className={!canManage ? "opacity-60" : undefined}
              >
              {[
                {
                  name: "RoHS (EU)",
                  desc: "Directive 2011/65/EU",
                  on: settings.regulatory_filters.rohs_eu,
                  key: "rohs_eu",
                },
                {
                  name: "REACH",
                  desc: "Substances of Very High Concern",
                  on: settings.regulatory_filters.reach,
                  key: "reach",
                },
                {
                  name: "WEEE Directive",
                  desc: "Waste Electrical & Electronic Equipment",
                  on: settings.regulatory_filters.weee_directive,
                  key: "weee_directive",
                },
                {
                  name: "California Prop 65",
                  desc: "Drinking Water & Toxic Enforcement",
                  on: settings.regulatory_filters.prop65,
                  key: "prop65",
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
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name={r.key}
                      defaultChecked={r.on}
                      className="rounded border-outline-variant text-primary focus:ring-primary/20"
                    />
                  </label>
                </div>
              ))}
              <button
                type="submit"
                disabled={!canManage}
                title={!canManage ? PERMISSION_DENIED_MESSAGE : undefined}
                className="w-full mt-8 py-3 text-primary font-headline font-bold text-sm hover:bg-surface-container-high rounded-lg transition-colors border border-primary/10"
              >
                Save Regulatory Defaults
              </button>
              </fieldset>
            </form>
          </section>

        </div>
      </div>

      <footer className="mt-20 border-t border-outline-variant/10 pt-8 flex items-center justify-end">
        <div className="flex gap-4">
          <form action={resetSettingsToDefaults}>
            <button
              type="submit"
              disabled={!canManage}
              title={!canManage ? PERMISSION_DENIED_MESSAGE : undefined}
              className="px-8 py-3 bg-surface-container-high text-on-secondary-container font-headline font-bold rounded-lg text-sm active:scale-95 transition-transform"
            >
              Reset Defaults
            </button>
          </form>
          <form action={commitAllSettings}>
            <button
              type="submit"
              disabled={!canManage}
              title={!canManage ? PERMISSION_DENIED_MESSAGE : undefined}
              className="px-12 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline font-bold rounded-lg text-sm shadow-md active:scale-95 transition-transform"
            >
              Commit All Changes
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
}
