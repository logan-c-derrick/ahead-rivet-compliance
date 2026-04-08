import Link from "next/link";
import MaterialIcon from "@/components/ui/MaterialIcon";
import { createSupplier } from "../actions";
import MobileSupplierFormBar from "./mobile-form-bar";

export default function AddNewSupplierPage() {
  return (
    <div className="pt-6 pb-20 px-4 md:px-12 lg:px-24 max-w-[1440px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div className="max-w-2xl">
          <nav className="flex items-center gap-2 mb-4 text-on-secondary-container font-body">
            <Link href="/suppliers" className="hover:text-primary transition-colors">
              Registry
            </Link>
            <MaterialIcon name="chevron_right" className="text-sm" />
            <span className="text-xs font-semibold tracking-widest uppercase">Suppliers</span>
          </nav>
          <h1 className="font-headline font-extrabold text-4xl lg:text-5xl text-on-surface tracking-tighter mb-4">
            Add New Supplier
          </h1>
          <p className="text-on-surface-variant text-lg leading-relaxed max-w-xl font-body">
            Register a new entity within the architectural ledger. Ensure all compliance documentation is valid before submission.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/suppliers"
            className="px-6 py-2.5 bg-surface-container-high text-on-secondary-container font-semibold rounded-md hover:bg-surface-container-highest transition-colors font-body"
          >
            Save Draft
          </Link>
          <button
            type="submit"
            form="supplier-form"
            className="px-6 py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary font-semibold rounded-md active:scale-95 transition-all font-body"
          >
            Submit Entry
          </button>
        </div>
      </header>

      <form id="supplier-form" action={createSupplier}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-8">
            <section className="bg-surface-container-lowest p-8 rounded-xl shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
                  <MaterialIcon name="corporate_fare" />
                </div>
                <h2 className="font-headline text-2xl font-bold tracking-tight text-on-surface">
                  General Information
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1 font-body">
                    Legal Entity Name
                  </label>
                  <input
                    name="name"
                    required
                    className="bg-surface-container-low border-none rounded-md p-3 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 font-body"
                    placeholder="e.g. EcoFab Industries Ltd."
                    type="text"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1 font-body">
                    Registration Number
                  </label>
                  <input
                    name="registration_number"
                    className="bg-surface-container-low border-none rounded-md p-3 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 font-body"
                    placeholder="VAT / TAX ID"
                    type="text"
                  />
                </div>
                <div className="md:col-span-2 flex flex-col gap-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1 font-body">
                    Headquarters Address
                  </label>
                  <input
                    name="address"
                    className="bg-surface-container-low border-none rounded-md p-3 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 font-body"
                    placeholder="Full street address, City, Country"
                    type="text"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1 font-body">
                    Primary Contact Name
                  </label>
                  <input
                    name="contact_name"
                    className="bg-surface-container-low border-none rounded-md p-3 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 font-body"
                    placeholder="Full Name"
                    type="text"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1 font-body">
                    Contact Email
                  </label>
                  <input
                    name="contact_email"
                    className="bg-surface-container-low border-none rounded-md p-3 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 font-body"
                    placeholder="compliance@partner.com"
                    type="email"
                  />
                </div>
              </div>
            </section>

            <section className="bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-tertiary-fixed-dim flex items-center justify-center text-on-tertiary-fixed-variant">
                    <MaterialIcon name="verified" />
                  </div>
                  <h2 className="font-headline text-2xl font-bold tracking-tight text-on-surface">
                    Compliance Certifications
                  </h2>
                </div>
                <span className="bg-surface-container-low text-on-surface-variant px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase font-body">
                  Required: 2/4
                </span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl hover:bg-surface-container transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-surface-container-lowest rounded-lg flex items-center justify-center shadow-sm">
                      <MaterialIcon name="description" className="text-outline" />
                    </div>
                    <div>
                      <p className="font-bold text-on-surface font-body">ISO 14001 Certificate</p>
                      <p className="text-xs text-on-surface-variant font-medium font-body">PDF, JPG up to 10MB</p>
                    </div>
                  </div>
                  <button type="button" className="px-4 py-2 bg-surface-container-highest text-primary font-bold rounded-lg text-xs tracking-widest uppercase hover:bg-primary-fixed transition-colors font-body">
                    Upload
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl hover:bg-surface-container transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-surface-container-lowest rounded-lg flex items-center justify-center shadow-sm">
                      <MaterialIcon name="forest" className="text-outline" />
                    </div>
                    <div>
                      <p className="font-bold text-on-surface font-body">FSC Chain of Custody</p>
                      <p className="text-xs text-on-surface-variant font-medium font-body">Upload documentation</p>
                    </div>
                  </div>
                  <button type="button" className="px-4 py-2 bg-surface-container-highest text-primary font-bold rounded-lg text-xs tracking-widest uppercase hover:bg-primary-fixed transition-colors font-body">
                    Upload
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-tertiary-container/5 rounded-xl border border-tertiary-fixed-dim/20">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-tertiary-fixed-dim/20 rounded-lg flex items-center justify-center">
                      <MaterialIcon name="check_circle" className="text-tertiary-fixed-dim" filled />
                    </div>
                    <div>
                      <p className="font-bold text-on-surface font-body">Carbon Footprint Report 2023</p>
                      <p className="text-xs text-tertiary-fixed-dim font-bold font-body">VERIFIED</p>
                    </div>
                  </div>
                  <button type="button" className="p-2 text-outline hover:text-error transition-colors">
                    <MaterialIcon name="delete" />
                  </button>
                </div>
              </div>
            </section>
          </div>

          <aside className="lg:col-span-4 space-y-8">
            <section className="bg-surface-container-low p-8 rounded-xl">
              <h3 className="font-headline font-bold text-xl mb-6 text-on-surface">Supply Category</h3>
              <div className="space-y-3">
                <label className="flex items-center p-4 bg-surface-container-lowest rounded-lg cursor-pointer hover:bg-surface-container-low transition-colors">
                  <input className="text-primary focus:ring-primary w-4 h-4 mr-4" name="category" type="radio" value="raw_materials" />
                  <div className="flex flex-col">
                    <span className="font-bold text-on-surface font-body">Raw Materials</span>
                    <span className="text-xs text-on-surface-variant font-body">Metals, Minerals, Ores</span>
                  </div>
                </label>
                <label className="flex items-center p-4 bg-surface-container-lowest rounded-lg cursor-pointer hover:bg-surface-container-low transition-colors">
                  <input className="text-primary focus:ring-primary w-4 h-4 mr-4" name="category" type="radio" value="chemicals" />
                  <div className="flex flex-col">
                    <span className="font-bold text-on-surface font-body">Chemicals</span>
                    <span className="text-xs text-on-surface-variant font-body">Process agents, Coatings</span>
                  </div>
                </label>
                <label className="flex items-center p-4 bg-surface-container-lowest rounded-lg cursor-pointer hover:bg-surface-container-low transition-colors">
                  <input className="text-primary focus:ring-primary w-4 h-4 mr-4" name="category" type="radio" value="components" defaultChecked />
                  <div className="flex flex-col">
                    <span className="font-bold text-on-surface font-body">Components</span>
                    <span className="text-xs text-on-surface-variant font-body">Mechanical, Electrical</span>
                  </div>
                </label>
              </div>
            </section>

            <section className="bg-surface-container-low p-8 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary to-primary-container opacity-5 rounded-bl-full" />
              <h3 className="font-headline font-bold text-xl mb-6 text-on-surface relative z-10">Risk Profile</h3>
              <div className="space-y-6 relative z-10">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between text-xs font-bold tracking-widest uppercase text-on-surface-variant px-1 font-body">
                    <span>Risk Level</span>
                    <span className="text-primary">Medium Priority</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container-highest rounded-full flex overflow-hidden">
                    <div className="h-full w-1/3 bg-tertiary-fixed-dim" />
                    <div className="h-full w-1/3 bg-secondary-fixed-dim" />
                    <div className="h-full w-1/3 bg-surface-variant/20" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" className="flex flex-col items-center justify-center p-4 rounded-xl bg-surface-container-lowest border-2 border-transparent hover:border-tertiary-fixed-dim transition-all">
                    <MaterialIcon name="shield_moon" className="text-tertiary-fixed-dim mb-2" />
                    <span className="text-xs font-bold uppercase tracking-tight font-body">Low Risk</span>
                  </button>
                  <button type="button" className="flex flex-col items-center justify-center p-4 rounded-xl bg-secondary-container border-2 border-secondary-fixed text-on-secondary-fixed transition-all">
                    <MaterialIcon name="warning" className="mb-2" filled />
                    <span className="text-xs font-bold uppercase tracking-tight font-body">Medium</span>
                  </button>
                  <button type="button" className="flex flex-col items-center justify-center p-4 rounded-xl bg-surface-container-lowest border-2 border-transparent hover:border-error transition-all">
                    <MaterialIcon name="gpp_maybe" className="text-error mb-2" />
                    <span className="text-xs font-bold uppercase tracking-tight font-body">High Risk</span>
                  </button>
                  <button type="button" className="flex flex-col items-center justify-center p-4 rounded-xl bg-surface-container-lowest border-2 border-transparent hover:border-primary transition-all">
                    <MaterialIcon name="help_center" className="text-primary mb-2" />
                    <span className="text-xs font-bold uppercase tracking-tight font-body">Unknown</span>
                  </button>
                </div>
                <div className="p-4 bg-surface-container-highest/30 rounded-lg">
                  <p className="text-xs text-on-secondary-container leading-relaxed font-body">
                    <span className="font-bold">Note:</span> Risk profiling is based on geographic location, supply criticality, and past compliance history.
                  </p>
                </div>
              </div>
            </section>

            <Link
              href="/support"
              className="flex items-center gap-3 p-4 text-on-surface-variant hover:text-primary transition-colors group font-body"
            >
              <MaterialIcon name="lightbulb" className="group-hover:rotate-12 transition-transform" />
              <span className="text-sm font-medium">Compliance Documentation Guide</span>
            </Link>
          </aside>
        </div>
      </form>

      <MobileSupplierFormBar />
    </div>
  );
}
