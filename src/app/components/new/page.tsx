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
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2 font-headline text-on-surface">
                    <MaterialIcon name="texture" className="text-primary" />
                    Material Composition
                  </h3>
                  <p className="text-sm text-on-secondary-container font-body mt-1">
                    Detailed breakdown of constituent substances by mass.
                  </p>
                </div>
                <button
                  type="button"
                  className="text-primary font-bold text-sm flex items-center gap-1 hover:underline font-body"
                >
                  <MaterialIcon name="add" className="text-sm" />
                  Add Substance
                </button>
              </div>
              <div className="overflow-hidden bg-surface-container-lowest rounded-lg">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-high/50">
                    <tr>
                      <th className="p-4 text-xs font-bold uppercase tracking-widest text-on-secondary-fixed-variant font-body">
                        Substance Name
                      </th>
                      <th className="p-4 text-xs font-bold uppercase tracking-widest text-on-secondary-fixed-variant font-body">
                        CAS Number
                      </th>
                      <th className="p-4 text-xs font-bold uppercase tracking-widest text-on-secondary-fixed-variant font-body">
                        Mass %
                      </th>
                      <th className="p-4 text-xs font-bold uppercase tracking-widest text-on-secondary-fixed-variant text-right font-body">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-low">
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-sm font-medium font-body">Silicon</td>
                      <td className="p-4 text-sm font-body text-slate-500">7440-21-3</td>
                      <td className="p-4 text-sm font-bold text-primary">82.4%</td>
                      <td className="p-4 text-right">
                        <button type="button" className="text-slate-400 hover:text-error transition-colors">
                          <MaterialIcon name="delete" />
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-sm font-medium font-body">Gold (Bonding Wire)</td>
                      <td className="p-4 text-sm font-body text-slate-500">7440-57-5</td>
                      <td className="p-4 text-sm font-bold text-primary">1.2%</td>
                      <td className="p-4 text-right">
                        <button type="button" className="text-slate-400 hover:text-error transition-colors">
                          <MaterialIcon name="delete" />
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-sm font-medium font-body">Epoxy Resin</td>
                      <td className="p-4 text-sm font-body text-slate-500">25068-38-6</td>
                      <td className="p-4 text-sm font-bold text-primary">16.4%</td>
                      <td className="p-4 text-right">
                        <button type="button" className="text-slate-400 hover:text-error transition-colors">
                          <MaterialIcon name="delete" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
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
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 font-headline text-on-surface">
                <MaterialIcon name="upload_file" className="text-primary" />
                Documentation
              </h3>
              <div className="border-2 border-dashed border-outline-variant/30 rounded-xl p-8 text-center bg-surface-container-low/50 hover:bg-surface-container-low transition-colors group cursor-pointer">
                <MaterialIcon name="cloud_upload" className="text-4xl text-slate-400 group-hover:text-primary transition-colors" />
                <p className="mt-4 text-sm font-bold text-on-surface font-body">
                  Drop technical datasheets here
                </p>
                <p className="text-xs text-slate-500 mt-1 font-body">PDF, STEP, or JSON (Max 25MB)</p>
                <button
                  type="button"
                  className="mt-4 px-4 py-2 bg-primary-fixed text-on-primary-fixed-variant rounded-lg text-xs font-bold uppercase tracking-wider font-body"
                >
                  Browse Files
                </button>
              </div>
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg">
                  <MaterialIcon name="picture_as_pdf" className="text-red-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate font-body">ESP-WROOM-32D_Datasheet.pdf</p>
                    <p className="text-[10px] text-slate-500 font-body">1.4 MB • Uploaded</p>
                  </div>
                  <button type="button" className="text-slate-400 hover:text-error">
                    <MaterialIcon name="close" className="text-sm" />
                  </button>
                </div>
              </div>
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
