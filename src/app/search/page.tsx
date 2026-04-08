import Link from "next/link";
import { requireProfile } from "@/lib/profile";
import MaterialIcon from "@/components/ui/MaterialIcon";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  await requireProfile();
  const { q } = await searchParams;
  const query = q ?? "";

  return (
    <div className="max-w-screen-2xl mx-auto p-8">
      <div className="flex justify-between items-end mb-12">
        <div>
          <nav className="flex gap-2 mb-4 font-body">
            <span className="text-outline text-sm">Search</span>
            <span className="text-outline">/</span>
            <span className="text-primary font-semibold text-sm">
              &quot;{query || "..."}&quot;
            </span>
          </nav>
          <h1
            className="text-4xl font-headline font-extrabold tracking-tight mb-2"
            style={{
              background: "linear-gradient(135deg, #003358 0%, #004a7c 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Found 12 matches
          </h1>
          <p className="text-on-surface-variant mt-2 max-w-lg font-body">
            Displaying integrated results across all compliance sectors and
            active supply chains for materials matching your query.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            className="bg-surface-container-high text-on-secondary-container px-6 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 hover:bg-surface-container-highest transition-colors font-body"
          >
            <MaterialIcon name="filter_list" className="text-lg" />
            Filter Results
          </button>
          <button
            type="button"
            className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/10 font-body"
          >
            <MaterialIcon name="ios_share" className="text-lg" />
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-12 lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <MaterialIcon name="inventory_2" className="text-primary" />
              <h3 className="font-headline font-bold text-lg">
                Products & Inventory
              </h3>
            </div>
            <Link
              href="/products"
              className="text-primary text-xs font-bold hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-surface-container-lowest p-5 rounded-xl transition-all hover:-translate-y-0.5 group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3">
                <span className="bg-tertiary-fixed-dim text-on-tertiary-fixed text-[10px] font-bold px-2 py-1 rounded-full">
                  COMPLIANT
                </span>
              </div>
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-surface-container-low rounded-lg flex items-center justify-center">
                  <MaterialIcon name="battery_charging_full" className="text-primary text-3xl" />
                </div>
                <div>
                  <p className="text-xs text-outline font-semibold mb-1 font-body">
                    SKU: EP-BATT-092
                  </p>
                  <h4 className="font-headline font-bold text-on-surface">
                    Ultra-Density{" "}
                    <span className="bg-primary-fixed px-1 rounded">
                      Lithium Polymer
                    </span>{" "}
                    Cell
                  </h4>
                  <p className="text-xs text-on-surface-variant mt-1 font-body">
                    Industrial Grade 5000mAh
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-surface flex items-center justify-center text-[10px] font-bold">
                    A
                  </div>
                  <div className="w-6 h-6 rounded-full bg-slate-300 border-2 border-surface flex items-center justify-center text-[10px] font-bold">
                    S
                  </div>
                </div>
                <Link
                  href="/products"
                  className="text-primary text-xs font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Details{" "}
                  <MaterialIcon name="arrow_forward" className="text-xs" />
                </Link>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-5 rounded-xl transition-all hover:-translate-y-0.5 group relative">
              <div className="absolute top-0 right-0 p-3">
                <span className="bg-secondary-fixed-dim text-on-secondary-fixed text-[10px] font-bold px-2 py-1 rounded-full">
                  PENDING REVIEW
                </span>
              </div>
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-surface-container-low rounded-lg flex items-center justify-center">
                  <MaterialIcon name="electric_moped" className="text-primary text-3xl" />
                </div>
                <div>
                  <p className="text-xs text-outline font-semibold mb-1 font-body">
                    SKU: EP-MOB-V2
                  </p>
                  <h4 className="font-headline font-bold text-on-surface">
                    EV-Chassis with{" "}
                    <span className="bg-primary-fixed px-1 rounded">
                      Lithium Polymer
                    </span>
                  </h4>
                  <p className="text-xs text-on-surface-variant mt-1 font-body">
                    Generation 2 Modular System
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex gap-1">
                  <MaterialIcon name="warning" className="text-xs text-error" />
                  <span className="text-[10px] font-medium text-error font-body">
                    Certification expiring in 12 days
                  </span>
                </div>
                <Link
                  href="/products"
                  className="text-primary text-xs font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Details{" "}
                  <MaterialIcon name="arrow_forward" className="text-xs" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="col-span-12 lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <MaterialIcon name="local_shipping" className="text-primary" />
              <h3 className="font-headline font-bold text-lg">Suppliers</h3>
            </div>
          </div>
          <div className="bg-surface-container-low rounded-2xl p-6 space-y-4">
            {["VoltSystems Global", "ChemPoly Materials", "Lithix Electronics"].map(
              (name, i) => (
                <Link
                  key={name}
                  href="/suppliers"
                  className="flex items-center gap-4 group p-2 rounded-lg hover:bg-surface-container-lowest transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary font-bold shadow-sm text-sm">
                    {name.slice(0, 2)}
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-bold text-on-surface">{name}</p>
                    <p className="text-[10px] text-outline font-body">
                      Tier {i + 1} • Component Supplier
                    </p>
                  </div>
                  <MaterialIcon
                    name="chevron_right"
                    className="text-outline group-hover:text-primary transition-colors"
                  />
                </Link>
              )
            )}
            <Link
              href="/suppliers"
              className="w-full mt-4 border border-outline-variant text-on-surface-variant py-2 rounded-lg text-xs font-bold hover:bg-white transition-colors block text-center font-body"
            >
              Browse All Partners
            </Link>
          </div>
        </section>

        <section className="col-span-12 mt-4">
          <div className="flex items-center gap-2 px-2 mb-4">
            <MaterialIcon name="gavel" className="text-primary" />
            <h3 className="font-headline font-bold text-lg">
              Regulatory Compliance
            </h3>
          </div>
          <div className="bg-surface-container-low/60 backdrop-blur-xl p-8 rounded-3xl border border-white/50 relative overflow-hidden">
            <span className="text-xs font-bold text-primary tracking-widest uppercase mb-4 block font-body">
              Primary Match
            </span>
            <h4 className="text-2xl font-headline font-extrabold text-on-surface mb-2">
              EU Directive 2023/1542:{" "}
              <span className="bg-primary-fixed px-1 rounded">Batteries</span> &
              Waste
            </h4>
            <p className="text-on-surface-variant mb-6 text-sm leading-relaxed max-w-xl font-body">
              Updates specific to the sustainability, performance, and labeling
              of rechargeable batteries. Compliance mandatory by Q4 2024.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/80 px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm border border-slate-100">
                <MaterialIcon
                  name="check_circle"
                  className="text-tertiary-fixed-dim"
                  filled
                />
                <span className="text-xs font-bold text-on-surface font-body">
                  Internal Audit Pass
                </span>
              </div>
              <div className="bg-white/80 px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm border border-slate-100">
                <MaterialIcon name="task" className="text-primary text-lg" />
                <span className="text-xs font-bold text-on-surface font-body">
                  3 Active Workflows
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
