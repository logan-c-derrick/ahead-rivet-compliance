import Link from "next/link";
import MaterialIcon from "@/components/ui/MaterialIcon";
import { createCustomRegulation } from "../actions";

export default function CreateCustomRegulationPage() {
  return (
    <div className="pt-6 px-8 pb-12 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div className="space-y-2">
            <nav className="flex items-center gap-2 text-on-secondary-container mb-4 font-body">
              <Link href="/regulations" className="hover:text-primary cursor-pointer">
                Regulations
              </Link>
              <MaterialIcon name="chevron_right" className="text-sm" />
              <span className="text-on-surface">New Requirement</span>
            </nav>
            <h1 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight text-on-surface">
              Create Custom <span className="text-primary-container">Regulation</span>
            </h1>
            <p className="text-on-surface-variant max-w-xl text-lg leading-relaxed font-body">
              Define architectural compliance parameters and environmental thresholds for regional site operations.
            </p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/regulations"
              className="px-6 py-3 rounded-xl bg-surface-container-high text-on-secondary-container font-semibold hover:bg-surface-container-highest transition-colors font-body"
            >
              Discard Draft
            </Link>
            <button
              type="submit"
              form="regulation-form"
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold shadow-xl hover:shadow-2xl transition-all font-body"
            >
              Publish Requirement
            </button>
          </div>
        </header>

        <form id="regulation-form" action={createCustomRegulation}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-primary-fixed rounded-lg text-on-primary-fixed-variant">
                    <MaterialIcon name="description" />
                  </div>
                  <h3 className="text-xl font-headline font-bold text-on-surface">Regulation Identification</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-label font-semibold text-on-surface-variant ml-1 font-body">
                      Regulation Name
                    </label>
                    <input
                      name="name"
                      required
                      className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-primary/20 transition-all text-on-surface placeholder:text-outline font-body"
                      placeholder="e.g. Carbon-Zero Framework 2024"
                      type="text"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-label font-semibold text-on-surface-variant ml-1 font-body">
                      Authority / Region
                    </label>
                    <div className="relative">
                      <input
                        name="jurisdiction"
                        className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-primary/20 transition-all text-on-surface placeholder:text-outline font-body pr-12"
                        placeholder="European Environment Agency"
                        type="text"
                      />
                      <MaterialIcon name="public" className="absolute right-4 top-4 text-outline" />
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-label font-semibold text-on-surface-variant ml-1 font-body">
                      Effective Date
                    </label>
                    <input
                      name="effective_date"
                      className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-primary/20 transition-all text-on-surface font-body"
                      type="date"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-low p-8 rounded-2xl">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-tertiary-fixed rounded-lg text-on-tertiary-fixed-variant">
                      <MaterialIcon name="analytics" />
                    </div>
                    <h3 className="text-xl font-headline font-bold text-on-surface">Threshold Matrix</h3>
                  </div>
                </div>
                <input type="hidden" name="threshold_key_1" value="carbon_emission" />
                <input type="hidden" name="threshold_key_2" value="ph" />
                <p className="text-sm text-on-surface-variant mb-4 font-body">
                  Define initial warning and critical bounds for the default metrics below. Additional
                  metric management is handled from the regulation detail workflow after creation.
                </p>
                <div className="space-y-4">
                  <div className="bg-surface-container-lowest p-6 rounded-xl flex flex-wrap md:flex-nowrap items-center gap-6 group hover:shadow-md transition-shadow">
                    <div className="flex-1 min-w-[200px]">
                      <p className="text-xs font-bold text-outline uppercase tracking-widest mb-1 font-body">Metric Description</p>
                      <p className="font-bold text-on-surface font-body">Carbon Emission Cap (tCO2e)</p>
                    </div>
                    <div className="w-32">
                      <p className="text-xs font-bold text-outline uppercase tracking-widest mb-1 font-body">Warning</p>
                      <input name="threshold_warn_1" className="w-full bg-surface-container-low border-none rounded-lg p-2 text-center font-bold text-secondary font-body" type="number" defaultValue={1200} />
                    </div>
                    <div className="w-32">
                      <p className="text-xs font-bold text-outline uppercase tracking-widest mb-1 font-body">Critical</p>
                      <input name="threshold_crit_1" className="w-full bg-surface-container-low border-none rounded-lg p-2 text-center font-bold text-error font-body" type="number" defaultValue={1500} />
                    </div>
                  </div>
                  <div className="bg-surface-container-lowest p-6 rounded-xl flex flex-wrap md:flex-nowrap items-center gap-6 group hover:shadow-md transition-shadow">
                    <div className="flex-1 min-w-[200px]">
                      <p className="text-xs font-bold text-outline uppercase tracking-widest mb-1 font-body">Metric Description</p>
                      <p className="font-bold text-on-surface font-body">Water Discharge Quality (pH)</p>
                    </div>
                    <div className="w-32">
                      <p className="text-xs font-bold text-outline uppercase tracking-widest mb-1 font-body">Warning</p>
                      <input name="threshold_warn_2" className="w-full bg-surface-container-low border-none rounded-lg p-2 text-center font-bold text-secondary font-body" step={0.1} type="number" defaultValue={6.5} />
                    </div>
                    <div className="w-32">
                      <p className="text-xs font-bold text-outline uppercase tracking-widest mb-1 font-body">Critical</p>
                      <input name="threshold_crit_2" className="w-full bg-surface-container-low border-none rounded-lg p-2 text-center font-bold text-error font-body" step={0.1} type="number" defaultValue={8.5} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-secondary-fixed rounded-lg text-on-secondary-fixed-variant">
                    <MaterialIcon name="edit_note" />
                  </div>
                  <h3 className="text-xl font-headline font-bold text-on-surface">Internal Guidelines</h3>
                </div>
                <div className="border-none rounded-xl bg-surface-container-low overflow-hidden">
                  <textarea
                    name="description"
                    className="w-full bg-transparent border-none p-6 focus:ring-0 text-on-surface leading-relaxed font-body resize-none"
                    placeholder="Outline specific auditing steps and mitigation protocols for internal compliance teams..."
                    rows={8}
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-8">
              <div className="bg-primary p-8 rounded-2xl text-on-primary relative overflow-hidden">
                <div className="relative z-10">
                  <h4 className="font-headline font-bold text-xl mb-4">Compliance Check</h4>
                  <p className="text-primary-fixed/80 text-sm leading-relaxed mb-6 font-body">
                    Based on European directives, custom thresholds for carbon should typically align with the 2030 Climate Target Plan.
                  </p>
                  <div className="flex items-center gap-3 p-4 bg-primary-container rounded-xl">
                    <MaterialIcon name="auto_awesome" className="text-tertiary-fixed-dim" />
                    <span className="text-xs font-semibold font-body">AI Assistant: Thresholds look within valid safety ranges for region EEA-4.</span>
                  </div>
                </div>
                <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-primary-fixed/10 rounded-full blur-3xl" />
              </div>

              <div className="bg-surface-container-highest p-8 rounded-2xl">
                <h4 className="font-headline font-bold text-lg mb-6 text-on-surface">Requirement Tips</h4>
                <ul className="space-y-6">
                  <li className="flex gap-4">
                    <MaterialIcon name="verified" className="text-primary shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-on-surface font-body">Data Sovereignty</p>
                      <p className="text-xs text-on-surface-variant font-body">Ensure threshold metrics match the unit of measure used in site sensors.</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <MaterialIcon name="history" className="text-primary shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-on-surface font-body">Version Control</p>
                      <p className="text-xs text-on-surface-variant font-body">Changes will be logged in the Compliance Audit Trail once published.</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <MaterialIcon name="group" className="text-primary shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-on-surface font-body">Stakeholder Alert</p>
                      <p className="text-xs text-on-surface-variant font-body">Site Managers in &apos;European Region&apos; will receive instant notifications.</p>
                    </div>
                  </li>
                </ul>
              </div>

              <Link
                href="/support"
                className="block w-full py-3 rounded-lg border-2 border-primary text-primary font-bold hover:bg-primary hover:text-on-primary transition-all text-center font-body"
              >
                View Standards Manual
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
