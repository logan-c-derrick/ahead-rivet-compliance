import Link from "next/link";
import MaterialIcon from "@/components/ui/MaterialIcon";
import { createProduct } from "../actions";

export default function RegisterNewProductPage() {
  return (
    <div className="pt-6 pb-16 px-8 max-w-7xl mx-auto">
      <header className="mb-12">
        <Link
          href="/products"
          className="flex items-center gap-2 text-on-secondary-container mb-2 font-body hover:text-primary transition-colors w-fit"
        >
          <MaterialIcon name="arrow_back" className="text-sm" />
          <span className="text-xs font-medium uppercase tracking-widest">Inventory Management</span>
        </Link>
        <h1 className="text-4xl font-extrabold tracking-tighter font-headline text-on-surface mb-2">
          Register New Product
        </h1>
        <p className="text-on-surface-variant max-w-2xl font-body">
          Define a new SKU within the compliance ledger. Link your Bill of Materials and assign regulatory targets for regional integrity.
        </p>
      </header>

      <form action={createProduct}>
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
            <section className="bg-surface-container-lowest p-8 rounded-xl">
              <h2 className="text-xl font-bold font-headline mb-6 flex items-center gap-2 text-on-surface">
                <MaterialIcon name="inventory" className="text-primary" />
                Product Definition
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-semibold text-on-surface-variant mb-2 font-body">
                    Product Name
                  </label>
                  <input
                    name="name"
                    required
                    className="w-full bg-surface-container-low border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline font-body"
                    placeholder="e.g. Stratum-X Series Solar Core"
                    type="text"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-semibold text-on-surface-variant mb-2 font-body">
                    SKU Number
                  </label>
                  <input
                    name="sku"
                    className="w-full bg-surface-container-low border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline font-body"
                    placeholder="STR-772-LITH"
                    type="text"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-semibold text-on-surface-variant mb-2 font-body">
                    Category
                  </label>
                  <select
                    name="category"
                    className="w-full bg-surface-container-low border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all font-body"
                  >
                    <option value="">Select category</option>
                    <option value="Server">Server</option>
                    <option value="Network Equipment">Network Equipment</option>
                    <option value="PC">PC</option>
                  </select>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-semibold text-on-surface-variant mb-2 font-body">
                    Manufacturing Region
                  </label>
                  <select className="w-full bg-surface-container-low border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all font-body">
                    <option>European Union (EEA)</option>
                    <option>North America (USMCA)</option>
                    <option>Asia Pacific</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="bg-surface-container-low p-8 rounded-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold font-headline flex items-center gap-2 text-on-surface">
                  <MaterialIcon name="account_tree" className="text-primary" />
                  BOM Linkage
                </h2>
                <button
                  type="button"
                  className="text-primary text-xs font-bold uppercase tracking-widest flex items-center gap-1 hover:opacity-70 transition-opacity font-body"
                >
                  <MaterialIcon name="cloud_upload" className="text-sm" />
                  Bulk Upload CSV
                </button>
              </div>
              <div className="relative mb-4">
                <MaterialIcon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm" />
                <input
                  className="w-full bg-surface-container-lowest border-none rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all font-body"
                  placeholder="Search materials or component IDs..."
                  type="text"
                />
              </div>
              <div className="space-y-3">
                <div className="bg-surface-container-lowest p-4 rounded-lg flex items-center justify-between group hover:bg-surface-bright transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded bg-surface-container-low flex items-center justify-center">
                      <MaterialIcon name="settings_input_component" className="text-on-secondary-container" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-on-surface font-body">Lithium-Ion Cell (Grade A)</p>
                      <p className="text-xs text-on-surface-variant font-body">ID: MAT-0492 • Supplier: VoltSource</p>
                    </div>
                  </div>
                  <MaterialIcon name="add_circle" className="text-outline group-hover:text-primary transition-colors" />
                </div>
                <div className="bg-surface-container-lowest p-4 rounded-lg flex items-center justify-between group hover:bg-surface-bright transition-colors cursor-pointer opacity-70">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded bg-surface-container-low flex items-center justify-center">
                      <MaterialIcon name="layers" className="text-on-secondary-container" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-on-surface font-body">Recycled Copper Foil</p>
                      <p className="text-xs text-on-surface-variant font-body">ID: MAT-1102 • Supplier: EcoRefine</p>
                    </div>
                  </div>
                  <MaterialIcon name="add_circle" className="text-outline group-hover:text-primary transition-colors" />
                </div>
              </div>
            </section>
          </div>

          <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
            <section className="bg-surface-container-highest/30 p-8 rounded-xl backdrop-blur-sm">
              <h2 className="text-lg font-bold font-headline mb-6 text-on-surface">Compliance Standards</h2>
              <div className="space-y-4">
                <label className="flex items-start gap-4 p-4 rounded-lg bg-surface-container-lowest cursor-pointer hover:bg-white transition-colors">
                  <input defaultChecked className="mt-1 rounded border-outline text-primary focus:ring-primary" name="std_eu_battery" type="checkbox" />
                  <div>
                    <p className="text-sm font-bold text-primary font-body">EU Battery Regulation 2023</p>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed font-body">
                      Mandatory lifecycle reporting and recycled content quotas for EEA distribution.
                    </p>
                  </div>
                </label>
                <label className="flex items-start gap-4 p-4 rounded-lg bg-surface-container-lowest cursor-pointer hover:bg-white transition-colors">
                  <input className="mt-1 rounded border-outline text-primary focus:ring-primary" name="std_iso" type="checkbox" />
                  <div>
                    <p className="text-sm font-bold text-on-surface font-body">ISO 14044 (LCA)</p>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed font-body">
                      Standard framework for Life Cycle Assessment and environmental impact reporting.
                    </p>
                  </div>
                </label>
                <label className="flex items-start gap-4 p-4 rounded-lg bg-surface-container-lowest cursor-pointer hover:bg-white transition-colors">
                  <input className="mt-1 rounded border-outline text-primary focus:ring-primary" name="std_conflict" type="checkbox" />
                  <div>
                    <p className="text-sm font-bold text-on-surface font-body">Conflict Minerals Traceability</p>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed font-body">
                      Required for Tier 1 component sourcing validation and humanitarian audit.
                    </p>
                  </div>
                </label>
              </div>
            </section>

            <section className="bg-surface-container-lowest p-8 rounded-xl">
              <h2 className="text-lg font-bold font-headline mb-6 text-on-surface">Product Owner</h2>
              <div className="flex items-center gap-4 mb-6 p-4 rounded-lg bg-surface-container-low">
                <div className="h-12 w-12 rounded-full bg-surface-container-high shrink-0" />
                <div className="flex-grow">
                  <p className="text-sm font-bold text-on-surface font-body">Sarah J. Miller</p>
                  <p className="text-xs text-on-surface-variant font-body">Senior Compliance Lead</p>
                </div>
                <button type="button" className="text-outline hover:text-primary transition-colors">
                  <MaterialIcon name="swap_horiz" className="text-sm" />
                </button>
              </div>
              <button
                type="button"
                className="w-full py-2 px-4 bg-surface-container-low text-on-secondary-container text-xs font-bold rounded-md hover:bg-surface-container-high transition-colors font-body"
              >
                Add Stakeholders
              </button>
            </section>

            <div className="flex flex-col gap-3 mt-4">
              <button
                type="submit"
                className="bg-gradient-to-br from-primary to-primary-container text-on-primary py-4 rounded-lg font-headline font-bold shadow-lg active:scale-95 transition-all font-body"
              >
                Finalize Product Entry
              </button>
              <Link
                href="/products"
                className="text-on-surface-variant text-sm font-semibold py-2 hover:text-on-surface transition-colors text-center font-body"
              >
                Save as Draft
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-16 flex items-center justify-between border-t border-outline-variant/20 pt-8">
          <div className="flex gap-12 flex-wrap">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-tighter font-bold text-tertiary-fixed-dim mb-1 font-body">Status</span>
              <span className="text-sm font-semibold text-on-surface font-body">Drafting Metadata</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-tighter font-bold text-on-surface-variant mb-1 font-body">Integrity Score</span>
              <span className="text-sm font-semibold text-on-surface font-body">64% Validated</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-tighter font-bold text-on-surface-variant mb-1 font-body">Security</span>
              <div className="flex items-center gap-1 text-sm font-semibold text-on-surface font-body">
                <MaterialIcon name="verified_user" className="text-sm text-tertiary-fixed-dim" />
                Encrypted
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1 w-32 bg-surface-container rounded-full overflow-hidden">
              <div className="h-full w-2/3 bg-tertiary-fixed-dim" style={{ width: "66%" }} />
            </div>
            <span className="text-xs font-bold text-on-surface-variant font-body">Step 2 of 3</span>
          </div>
        </div>
      </form>
    </div>
  );
}
