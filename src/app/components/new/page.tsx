import Link from "next/link";
import MaterialIcon from "@/components/ui/MaterialIcon";
import { submitComponentForm } from "../actions";

export default function AddNewComponentPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-10">
        <nav className="flex items-center gap-2 text-on-surface-variant mb-2 font-body">
          <Link href="/components" className="hover:text-primary transition-colors text-sm">
            Inventory Management
          </Link>
          <MaterialIcon name="chevron_right" className="text-sm" />
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Add New Component
          </span>
        </nav>
        <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface">
          Initialize Component Entry
        </h1>
        <p className="text-on-secondary-container mt-2 max-w-2xl font-body">
          Establish a new digital twin for hardware components with full material traceability and global regulatory alignment.
        </p>
      </div>

      <form action={submitComponentForm}>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <section className="bg-surface-container-lowest rounded-xl p-8 shadow-sm">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 font-headline text-on-surface">
                <MaterialIcon name="info" className="text-primary" />
                Core Specification
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-tighter font-body">
                    Item name *
                  </label>
                  <input
                    name="name"
                    required
                    className="w-full bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 rounded-lg py-3 px-4 text-on-surface placeholder-slate-400 font-body"
                    placeholder="e.g. Seagate Exos 2X14 14TB SAS Dual Actuator"
                    type="text"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-tighter font-body">
                    Part number (internal)
                  </label>
                  <input
                    name="part_number"
                    className="w-full bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 rounded-lg py-3 px-4 text-on-surface placeholder-slate-400 font-body"
                    placeholder="e.g. 230594"
                    type="text"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-tighter font-body">
                    Manufacturer (brand)
                  </label>
                  <input
                    name="manufacturer"
                    className="w-full bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 rounded-lg py-3 px-4 text-on-surface placeholder-slate-400 font-body"
                    placeholder="e.g. Seagate"
                    type="text"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-tighter font-body">
                    Manufacturer SKU
                  </label>
                  <input
                    name="manufacturer_sku"
                    className="w-full bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 rounded-lg py-3 px-4 font-mono text-sm text-on-surface placeholder-slate-400 font-body"
                    placeholder="MFR part #; defaults to part number if empty"
                    type="text"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-tighter font-body">
                    Category
                  </label>
                  <input
                    name="category"
                    className="w-full bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 rounded-lg py-3 px-4 text-on-surface placeholder-slate-400 font-body"
                    placeholder="From BOM CSV when applicable"
                    type="text"
                  />
                </div>
                <div className="col-span-full space-y-2">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-tighter font-body">
                    Component Description
                  </label>
                  <textarea
                    name="description"
                    className="w-full bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 rounded-lg py-3 px-4 text-on-surface placeholder-slate-400 font-body"
                    placeholder="Enter high-level technical description..."
                    rows={3}
                  />
                </div>
              </div>
            </section>

            <section className="bg-surface-container-low rounded-xl p-8">
              <h3 className="text-lg font-bold flex items-center gap-2 font-headline text-on-surface mb-2">
                <MaterialIcon name="texture" className="text-primary" />
                Material Composition
              </h3>
              <p className="text-sm text-on-secondary-container font-body mt-1 mb-4">
                Enter any known composition notes now. Detailed per-substance capture can be added from
                the component detail workflow after creation.
              </p>
              <textarea
                name="composition_notes"
                rows={4}
                className="w-full bg-surface-container-lowest border-none focus:ring-2 focus:ring-primary/20 rounded-lg py-3 px-4 text-on-surface placeholder-slate-400 font-body"
                placeholder="Optional: key substances, concentration notes, or source documentation references."
              />
            </section>
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-6">
            <section className="bg-surface-container-lowest rounded-xl p-8 shadow-sm">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 font-headline text-on-surface">
                <MaterialIcon name="gavel" className="text-primary" />
                Compliance Matrix
              </h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl">
                  <div>
                    <p className="font-bold text-sm font-body">RoHS Compliant</p>
                    <p className="text-xs text-slate-500 font-body">2011/65/EU, 2015/863</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input defaultChecked className="sr-only peer" type="checkbox" name="rohs" />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-tertiary-fixed-dim" />
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl">
                  <div>
                    <p className="font-bold text-sm font-body">REACH Compliance</p>
                    <p className="text-xs text-slate-500 font-body">SVHC Content &lt; 0.1%</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input defaultChecked className="sr-only peer" type="checkbox" name="reach" />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-tertiary-fixed-dim" />
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl">
                  <div>
                    <p className="font-bold text-sm font-body">Conflict Minerals</p>
                    <p className="text-xs text-slate-500 font-body">3TG Traceability</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input className="sr-only peer" type="checkbox" name="conflict_minerals" />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-tertiary-fixed-dim" />
                  </label>
                </div>
              </div>
            </section>

            <section className="bg-surface-container-lowest rounded-xl p-8 shadow-sm">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2 font-headline text-on-surface">
                <MaterialIcon name="upload_file" className="text-primary" />
                Documentation
              </h3>
              <p className="text-sm text-on-surface-variant font-body leading-relaxed">
                File upload is handled on the component detail page after creation. Save the component
                first, then attach technical documents from the detail view.
              </p>
            </section>
          </div>

          <div className="col-span-12 flex justify-end gap-4 mt-8 pb-12">
            <Link
              href="/components"
              className="px-8 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all font-body"
            >
              Cancel Draft
            </Link>
            <button
              type="submit"
              className="px-10 py-3 bg-gradient-to-br from-primary to-primary-container text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all font-body"
            >
              Commit to Ledger
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
