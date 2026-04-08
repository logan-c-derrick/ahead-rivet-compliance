import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/profile";
import SignOutButton from "@/app/dashboard/signout-button";
import MaterialIcon from "@/components/ui/MaterialIcon";

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
          <header className="mb-12" id="personal">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-background mb-2">
                  User Profile
                </h1>
                <p className="text-on-surface-variant max-w-xl text-lg font-body">
                  Manage your professional identity, environmental certifications,
                  and security protocols across the EcoStratum ecosystem.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="px-6 py-2.5 bg-surface-container-high text-on-secondary-container rounded-md font-semibold text-sm font-body"
                >
                  Discard Changes
                </button>
                <button
                  type="button"
                  className="px-6 py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-md font-semibold text-sm shadow-md font-body"
                >
                  Save Profile
                </button>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-12 gap-6">
            <section
              id="personal-info"
              className="col-span-12 md:col-span-8 bg-surface-container-lowest rounded-xl p-8 shadow-sm"
            >
              <div className="flex items-center gap-6 mb-10">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-surface-container-high flex items-center justify-center border-4 border-surface-container-low">
                    <MaterialIcon
                      name="account_circle"
                      className="text-6xl text-primary"
                    />
                  </div>
                  <button
                    type="button"
                    className="absolute bottom-0 right-0 p-2 bg-primary text-on-primary rounded-full shadow-lg"
                  >
                    <MaterialIcon name="edit" className="text-sm" />
                  </button>
                </div>
                <div>
                  <h3 className="text-2xl font-bold font-headline text-on-background">
                    {profile.full_name ?? "User"}
                  </h3>
                  <p className="text-on-surface-variant font-medium font-body">
                    {profile.role}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <span className="px-3 py-1 bg-tertiary-fixed-dim text-on-tertiary-fixed rounded-full text-xs font-bold uppercase tracking-wider">
                      Active Status
                    </span>
                    <span className="px-3 py-1 bg-secondary-fixed text-on-secondary-fixed rounded-full text-xs font-bold uppercase tracking-wider">
                      Level 4 Access
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1 font-body">
                    Full Legal Name
                  </label>
                  <input
                    defaultValue={profile.full_name ?? ""}
                    className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/20 font-body"
                    type="text"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1 font-body">
                    Email Address
                  </label>
                  <input
                    defaultValue={profile.email ?? ""}
                    className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/20 font-body"
                    type="email"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1 font-body">
                    Primary Phone
                  </label>
                  <input
                    className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/20 font-body"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1 font-body">
                    Timezone
                  </label>
                  <select className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/20 font-body appearance-none">
                    <option>Pacific Standard Time (PST)</option>
                    <option>Eastern Standard Time (EST)</option>
                    <option>Greenwich Mean Time (GMT)</option>
                  </select>
                </div>
              </div>
              <div className="mt-8 flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1 font-body">
                  Professional Bio
                </label>
                <textarea
                  className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/20 font-body resize-none"
                  rows={4}
                  placeholder="Brief professional summary..."
                />
              </div>
            </section>

            <section className="col-span-12 md:col-span-4 flex flex-col gap-6">
              <a
                href="/profile/credentials"
                className="bg-surface-container-highest rounded-xl p-6 overflow-hidden relative block hover:bg-surface-container-highest/80 transition-colors"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <MaterialIcon name="verified_user" className="text-8xl" />
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="font-headline font-bold text-primary flex items-center gap-2">
                      <MaterialIcon name="verified" className="text-xl" />
                      Professional Credentials
                    </h4>
                    <MaterialIcon name="arrow_forward" className="text-primary text-sm" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 bg-surface-container-lowest p-3 rounded-lg shadow-sm">
                      <MaterialIcon name="check_circle" className="text-tertiary-fixed-dim" filled />
                      <div>
                        <p className="text-sm font-bold text-on-background leading-tight font-body">
                          ISO 14001:2015 Lead Auditor
                        </p>
                        <p className="text-xs text-on-surface-variant font-body">Expires: Dec 2025</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 bg-surface-container-lowest p-3 rounded-lg shadow-sm">
                      <MaterialIcon name="check_circle" className="text-tertiary-fixed-dim" filled />
                      <div>
                        <p className="text-sm font-bold text-on-background leading-tight font-body">
                          Hazmat Operations (OSHA)
                        </p>
                        <p className="text-xs text-on-surface-variant font-body">Expires: Aug 2024</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-primary font-medium mt-4 font-body">View all credentials →</p>
                </div>
              </a>

              <a
                href="/profile/organization"
                className="bg-primary text-on-primary rounded-xl p-6 shadow-xl block hover:opacity-95 transition-opacity"
              >
                <h4 className="font-headline font-bold mb-4 flex items-center gap-2">
                  <MaterialIcon name="domain" className="text-xl" />
                  Organization
                </h4>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center font-bold text-lg">
                    {(org?.name ?? "Org").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold leading-tight">{org?.name ?? "Organization"}</p>
                    <p className="text-xs text-primary-fixed-dim font-body">Corporate HQ</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm font-body">
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="opacity-70">Department</span>
                    <span className="font-medium">Compliance & Risk</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="opacity-70">Access Group</span>
                    <span className="font-medium text-tertiary-fixed">{profile.role}</span>
                  </div>
                </div>
                <p className="text-xs text-primary-fixed-dim font-medium mt-4">View organization details →</p>
              </a>
            </section>

            <section className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-surface-container-low rounded-xl p-6 flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-tertiary-fixed/30 rounded-lg flex items-center justify-center">
                    <MaterialIcon
                      name="shield_lock"
                      className="text-tertiary-container"
                    />
                  </div>
                  <h4 className="font-headline font-bold text-on-background">
                    Two-Factor Auth
                  </h4>
                </div>
                <p className="text-xs text-on-surface-variant mb-6 leading-relaxed font-body">
                  Add an extra layer of security. Authenticator app or hardware
                  keys supported.
                </p>
                <div className="mt-auto">
                  <div className="flex items-center justify-between p-3 bg-surface-container-lowest rounded-lg mb-3">
                    <span className="text-sm font-semibold font-body">Enabled</span>
                    <div className="w-10 h-5 bg-tertiary-fixed-dim rounded-full relative">
                      <div className="absolute right-1 top-1 w-3 h-3 bg-tertiary-container rounded-full" />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="w-full py-2 text-xs font-bold text-primary hover:bg-primary/5 rounded font-body uppercase tracking-widest"
                  >
                    Update 2FA Method
                  </button>
                </div>
              </div>
              <div className="bg-surface-container-low rounded-xl p-6 flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-secondary-fixed/30 rounded-lg flex items-center justify-center">
                    <MaterialIcon name="key" className="text-on-secondary-container" />
                  </div>
                  <h4 className="font-headline font-bold text-on-background">
                    Password Control
                  </h4>
                </div>
                <p className="text-xs text-on-surface-variant mb-6 leading-relaxed font-body">
                  Keep your ledger access secure by rotating your password
                  regularly.
                </p>
                <div className="mt-auto">
                  <button
                    type="button"
                    className="w-full py-2.5 bg-surface-container-highest text-on-secondary-container rounded-md font-bold text-xs font-body uppercase tracking-widest"
                  >
                    Change Password
                  </button>
                </div>
              </div>
              <div className="bg-surface-container-low rounded-xl p-6 flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-error-container/30 rounded-lg flex items-center justify-center">
                    <MaterialIcon name="devices" className="text-error" />
                  </div>
                  <h4 className="font-headline font-bold text-on-background">
                    Active Sessions
                  </h4>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MaterialIcon name="laptop" className="text-sm opacity-40" />
                      <span className="text-xs font-medium font-body">Current Device</span>
                    </div>
                    <span className="text-[10px] text-tertiary-container font-bold uppercase font-body">
                      Current
                    </span>
                  </div>
                </div>
                <div className="mt-auto flex flex-col gap-2">
                  <SignOutButton
                    className="w-full py-2 text-xs font-bold text-error hover:bg-error/5 rounded font-body uppercase tracking-widest flex items-center justify-center gap-2"
                    label="Sign Out"
                  />
                  <a
                    href="/profile/security"
                    className="text-xs text-primary font-medium text-center font-body hover:underline"
                  >
                    Manage security & sessions →
                  </a>
                </div>
              </div>
            </section>

            <div className="col-span-12 mt-12 flex justify-between items-center px-4 py-8 bg-error-container/10 rounded-xl border border-error/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-error-container/30">
                  <MaterialIcon name="warning" className="text-error" />
                </div>
                <div>
                  <h5 className="font-headline font-bold text-error">
                    Deactivate Auditor Profile
                  </h5>
                  <p className="text-xs text-on-surface-variant font-medium font-body">
                    All historical logs and signatures will be archived in the
                    cold ledger for 7 years.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="px-6 py-2 bg-error text-on-error rounded-md text-sm font-bold font-body"
              >
                Request Deactivation
              </button>
            </div>
          </div>
    </main>
  );
}
