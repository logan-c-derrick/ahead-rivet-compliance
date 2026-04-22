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
                  <select
                    name="manufacturing_region"
                    className="w-full bg-surface-container-low border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all font-body"
                  >
                    <option value="European Union (EEA)">European Union (EEA)</option>
                    <option value="North America (USMCA)">North America (USMCA)</option>
                    <option value="Asia Pacific">Asia Pacific</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="bg-surface-container-low p-8 rounded-xl">
              <h2 className="text-xl font-bold font-headline flex items-center gap-2 text-on-surface mb-3">
                <MaterialIcon name="account_tree" className="text-primary" />
                BOM Linkage
              </h2>
              <p className="text-sm text-on-surface-variant leading-relaxed font-body">
                Product creation here stores core metadata only. To upload BOM files and map component
                columns, continue in the dedicated BOM mapping workflow.
              </p>
              <div className="mt-5">
                <Link
                  href="/products/bom/map"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                >
                  Open BOM Mapping Workflow
                  <MaterialIcon name="arrow_forward" className="text-base" />
                </Link>
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
              <h2 className="text-lg font-bold font-headline mb-3 text-on-surface">Product Ownership</h2>
              <p className="text-sm text-on-surface-variant font-body leading-relaxed">
                Ownership assignment and stakeholder routing are managed from organization workflows.
                Finish product creation, then assign follow-up tasks in your internal process.
              </p>
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
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
