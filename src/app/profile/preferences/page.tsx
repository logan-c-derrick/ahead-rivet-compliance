import MaterialIcon from "@/components/ui/MaterialIcon";

export default function ProfilePreferencesPage() {
  const notifications = [
    {
      type: "Regulatory Breaches",
      desc: "Immediate alerts for threshold violations",
      icon: "gavel",
      iconBg: "bg-error-container/20",
      iconColor: "text-error",
      emailOn: true,
      pushOn: true,
    },
    {
      type: "Data Syncs",
      desc: "Successful telemetry integration logs",
      icon: "sync",
      iconBg: "bg-surface-container-high",
      iconColor: "text-primary",
      emailOn: false,
      pushOn: true,
    },
    {
      type: "Report Reminders",
      desc: "Quarterly ESG filing deadlines",
      icon: "description",
      iconBg: "bg-surface-container-high",
      iconColor: "text-primary",
      emailOn: true,
      pushOn: false,
    },
  ];

  return (
    <main className="flex-1 min-w-0">
      <div className="mb-12">
        <h2 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight mb-2">
          User Preferences
        </h2>
        <p className="text-on-surface-variant font-body">
          Manage your notification triggers, environmental report alerts, and regional settings.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-8 items-start">
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <MaterialIcon name="language" className="text-primary" />
              <h3 className="font-headline font-bold text-lg text-on-surface">
                Localization
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2 font-body">
                  Display Language
                </label>
                <select className="w-full bg-surface-container-low border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/10 font-body text-on-surface">
                  <option>English (United States)</option>
                  <option>German (Deutsch)</option>
                  <option>French (Français)</option>
                  <option>Mandarin (简体中文)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2 font-body">
                  Timezone
                </label>
                <select className="w-full bg-surface-container-low border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/10 font-body text-on-surface">
                  <option>(GMT-08:00) Pacific Time</option>
                  <option>(GMT+00:00) London</option>
                  <option>(GMT+01:00) Berlin</option>
                  <option>(GMT+08:00) Singapore</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-primary-container text-on-primary p-8 rounded-xl shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-headline font-bold text-xl mb-2">
                Compliance Focus
              </h3>
              <p className="text-primary-fixed-dim/90 text-sm mb-6 font-body">
                Your current profile is optimized for Global ESG reporting standards.
              </p>
              <button
                type="button"
                className="bg-surface-container-lowest text-primary px-4 py-2 rounded-md text-xs font-bold uppercase tracking-tighter hover:bg-surface-bright transition-colors font-body"
              >
                Review Standards
              </button>
            </div>
            <MaterialIcon
              name="verified_user"
              className="absolute -bottom-4 -right-4 text-9xl opacity-10 rotate-12"
            />
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 bg-surface-container-low rounded-xl overflow-hidden">
          <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h3 className="font-headline font-bold text-xl text-on-surface">
                  Notification Ledger
                </h3>
                <p className="text-on-surface-variant text-sm font-body mt-1">
                  Configure automated regulatory alerts
                </p>
              </div>
              <div className="flex bg-surface-container-low rounded-lg p-1 w-fit">
                <button className="px-4 py-1.5 text-xs font-bold rounded-md bg-white shadow-sm text-primary font-body">
                  Grid View
                </button>
                <button className="px-4 py-1.5 text-xs font-bold rounded-md text-on-surface-variant/60 font-body">
                  Audit Log
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <div className="grid grid-cols-12 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-on-surface-variant/40 font-body">
                <div className="col-span-6">Trigger Type</div>
                <div className="col-span-3 text-center">Email</div>
                <div className="col-span-3 text-center">Push</div>
              </div>
              {notifications.map((item) => (
                <div
                  key={item.type}
                  className="grid grid-cols-12 items-center px-4 py-6 rounded-lg hover:bg-surface-container-low transition-colors"
                >
                  <div className="col-span-6 flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${item.iconBg} ${item.iconColor}`}
                    >
                      <MaterialIcon name={item.icon} />
                    </div>
                    <div>
                      <h4 className="font-bold text-on-surface font-body">{item.type}</h4>
                      <p className="text-xs text-on-surface-variant font-body">{item.desc}</p>
                    </div>
                  </div>
                  <div className="col-span-3 flex justify-center">
                    <div
                      className={`w-12 h-6 rounded-full relative flex items-center px-1 ${
                        item.emailOn ? "bg-tertiary-fixed-dim" : "bg-secondary-fixed-dim"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                          item.emailOn ? "translate-x-6" : ""
                        }`}
                      />
                    </div>
                  </div>
                  <div className="col-span-3 flex justify-center">
                    <div
                      className={`w-12 h-6 rounded-full relative flex items-center px-1 ${
                        item.pushOn ? "bg-tertiary-fixed-dim" : "bg-secondary-fixed-dim"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                          item.pushOn ? "translate-x-6" : ""
                        }`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 flex items-center justify-end gap-4 pt-8 border-t border-surface-container-low">
              <button
                type="button"
                className="px-6 py-2.5 rounded-md font-bold text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors font-body"
              >
                Reset to Default
              </button>
              <button
                type="button"
                className="px-8 py-2.5 rounded-md font-bold text-sm bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-lg active:scale-95 transition-all font-body"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 p-8 bg-surface-container rounded-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <span className="block font-headline text-2xl font-extrabold text-primary">
              99.8%
            </span>
            <span className="text-[10px] font-bold uppercase text-on-surface-variant/60 tracking-widest font-body">
              Notification Reliability
            </span>
          </div>
          <div className="h-10 w-px bg-on-surface-variant/10 hidden sm:block" />
          <div>
            <p className="text-sm font-medium font-body">Auto-Archiving is active</p>
            <p className="text-xs text-on-surface-variant font-body">
              All breaches older than 365 days are moved to secure storage.
            </p>
          </div>
        </div>
        <div className="flex -space-x-3">
          <div className="w-8 h-8 rounded-full border-2 border-surface bg-slate-200" />
          <div className="w-8 h-8 rounded-full border-2 border-surface bg-slate-300" />
          <div className="w-8 h-8 rounded-full border-2 border-surface bg-slate-400" />
        </div>
      </div>
    </main>
  );
}
