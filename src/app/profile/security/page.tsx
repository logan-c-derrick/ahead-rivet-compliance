import MaterialIcon from "@/components/ui/MaterialIcon";

export default function ProfileSecurityPage() {
  const sessions = [
    {
      device: "MacBook Pro 16\"",
      current: true,
      icon: "laptop_mac",
      details: "Chrome v119 • San Francisco, CA • IP: 192.168.1.104",
      status: "Active now",
    },
    {
      device: "iPhone 15 Pro",
      current: false,
      icon: "smartphone",
      details: "Mobile App v2.4.1 • San Francisco, CA • IP: 172.56.21.9",
      status: "Last active: 22m ago",
    },
    {
      device: "Workstation-EC3",
      current: false,
      icon: "desktop_windows",
      details: "Edge v118 • New York, NY • IP: 10.0.4.52",
      status: "Last active: 4 days ago",
    },
  ];

  return (
    <main className="flex-1 min-w-0">
      <section className="mb-12">
        <h1 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight mb-2">
          Security & Access
        </h1>
        <p className="text-on-surface-variant max-w-2xl leading-relaxed font-body">
          Manage your authentication methods and monitor active connections to maintain the
          architectural integrity of your compliance data.
        </p>
      </section>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-7 bg-surface-container-lowest p-10 rounded-xl shadow-[0_20px_40px_rgba(11,28,48,0.03)] flex flex-col justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <MaterialIcon name="key" className="text-primary" />
              <h3 className="font-headline text-2xl font-bold text-on-surface">
                Authentication Credentials
              </h3>
            </div>
            <p className="text-on-surface-variant mb-8 text-sm font-body">
              Last updated 42 days ago. We recommend a refresh every 90 days for high-compliance
              environments.
            </p>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-body">
                  Current Password
                </label>
                <input
                  type="password"
                  value="••••••••••••"
                  readOnly
                  className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-on-surface outline-none font-body"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-8 py-3 rounded-md font-bold text-sm tracking-wide hover:opacity-90 transition-opacity font-body"
            >
              Update Password
            </button>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 bg-surface-container-low p-10 rounded-xl space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MaterialIcon
                name="verified_user"
                className="text-tertiary-fixed-dim"
                filled
              />
              <h3 className="font-headline text-2xl font-bold text-on-surface">
                Multi-Factor Auth
              </h3>
            </div>
            <span className="bg-tertiary-fixed-dim text-on-tertiary-fixed px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
              Active
            </span>
          </div>
          <div className="space-y-4">
            <div className="bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <MaterialIcon name="phonelink_setup" className="text-primary" />
                <div>
                  <p className="font-bold text-sm font-body">Authenticator App</p>
                  <p className="text-xs text-on-surface-variant font-body">
                    Google Authenticator linked
                  </p>
                </div>
              </div>
              <MaterialIcon name="check_circle" className="text-tertiary-fixed-dim" />
            </div>
            <div className="bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <MaterialIcon name="sms" className="text-primary" />
                <div>
                  <p className="font-bold text-sm font-body">SMS Recovery</p>
                  <p className="text-xs text-on-surface-variant font-body">+1 ••• ••• 4492</p>
                </div>
              </div>
              <button className="text-primary text-xs font-bold hover:underline font-body">
                Edit
              </button>
            </div>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed font-body">
            MFA is mandatory for users with &apos;Architect&apos; level permissions to ensure data
            non-repudiation.
          </p>
        </div>

        <div className="col-span-12 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-2">
            <div>
              <h3 className="font-headline text-2xl font-bold tracking-tight text-on-surface">
                Active Sessions
              </h3>
              <p className="text-on-surface-variant text-sm font-body mt-1">
                Real-time ledger of devices authorized to access this compliance profile.
              </p>
            </div>
            <button
              type="button"
              className="text-error text-xs font-bold hover:bg-error-container/20 px-4 py-2 rounded-lg transition-colors font-body"
            >
              Terminate All Other Sessions
            </button>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm">
            {sessions.map((session, i) => (
              <div
                key={session.device}
                className={`flex items-center justify-between p-6 transition-colors ${
                  i > 0 ? "border-t border-outline-variant/10" : ""
                } hover:bg-surface-container-low`}
              >
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-surface-container-high rounded-xl flex items-center justify-center shrink-0">
                    <MaterialIcon
                      name={session.icon}
                      className="text-primary text-3xl"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-on-surface font-body">
                        {session.device}
                      </p>
                      {session.current && (
                        <span className="bg-surface-container-highest text-primary text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                          Current Session
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant font-body mt-0.5">
                      {session.details}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-xs font-medium text-on-surface-variant font-body">
                    {session.status}
                  </span>
                  {!session.current && (
                    <button
                      type="button"
                      className="text-on-surface-variant hover:text-error transition-colors"
                      aria-label={`Sign out from ${session.device}`}
                    >
                      <MaterialIcon name="logout" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="pt-12 mt-12 border-t border-outline-variant/20">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="max-w-md">
            <h4 className="font-headline font-bold text-primary mb-2">
              Architectural Security Standards
            </h4>
            <p className="text-xs text-on-surface-variant leading-relaxed font-body">
              Our security protocols exceed ISO 27001 requirements for environmental data
              management. Every login and session termination is recorded in the immutable audit
              ledger.
            </p>
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              className="bg-surface-container-high text-on-secondary-container px-6 py-2 rounded-md font-bold text-xs hover:bg-surface-container-highest transition-colors font-body"
            >
              Security Audit Log
            </button>
            <button
              type="button"
              className="bg-surface-container-high text-on-secondary-container px-6 py-2 rounded-md font-bold text-xs hover:bg-surface-container-highest transition-colors font-body"
            >
              Download Key Recovery
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
}
