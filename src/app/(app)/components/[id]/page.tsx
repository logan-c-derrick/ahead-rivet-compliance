import { requireProfile } from "@/lib/profile";
import { getComponent, getComponentRegulationStatuses, getComponentReleaseStatuses } from "../actions";
import Link from "next/link";
import { notFound } from "next/navigation";
import MaterialIcon from "@/components/ui/MaterialIcon";
import { ComponentDocumentsSection } from "./component-documents-section";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ComponentDetailPage({ params }: Props) {
  await requireProfile();
  const { id } = await params;
  const [component, regulationStatuses, releaseStatuses] = await Promise.all([
    getComponent(id),
    getComponentRegulationStatuses(id),
    getComponentReleaseStatuses(id),
  ]);

  if (!component) {
    notFound();
  }

  return (
    <div className="p-8 space-y-8">
      <header className="flex justify-between items-start gap-8">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
            <span className="font-medium">Compliance Portal</span>
            <span className="opacity-60">/</span>
            <span className="font-semibold text-primary">Component Detail</span>
          </div>

          <div>
            <h1 className="text-4xl font-headline font-extrabold tracking-tight text-primary">{component.name}</h1>
            <div className="flex gap-12 pt-4 flex-wrap">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Part Number</span>
                <span className="text-primary font-semibold">{component.part_number ?? "—"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Manufacturer</span>
                <span className="text-primary font-semibold">{component.manufacturer ?? "—"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Manufacturer SKU</span>
                <span className="text-primary font-semibold font-mono text-sm">{component.manufacturer_sku ?? "—"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Category</span>
                <span className="text-primary font-semibold">{component.category ?? "—"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Supplier</span>
                <span className="text-primary font-semibold">{component.supplier_name ?? "—"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 min-w-[240px]">
          <Link
            href={`/components?edit=${component.id}`}
            className="w-full text-center bg-primary text-on-primary px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"
          >
            <MaterialIcon name="edit" className="text-sm" />
            Edit Component
          </Link>
          <Link
            href="/components"
            className="w-full text-center bg-surface-container-lowest text-primary px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-surface-container-low transition-colors inline-flex items-center justify-center gap-2"
          >
            <MaterialIcon name="arrow_back" className="text-sm" />
            Back to Components
          </Link>
        </div>
      </header>

      <div className="bg-surface-container-lowest rounded-2xl p-6 space-y-6 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary">
                <MaterialIcon name="settings_input_component" className="text-sm" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-on-surface-variant">
                  {component.description ? component.description : "No description provided."}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="rounded-xl p-4 bg-surface-container-highest/40">
              <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Record timestamps</div>
              <div className="mt-3 space-y-2 text-sm text-on-surface-variant">
                <div>
                  <span className="font-bold text-primary">Created:</span>{" "}
                  {new Date(component.created_at).toLocaleString()}
                </div>
                <div>
                  <span className="font-bold text-primary">Updated:</span>{" "}
                  {new Date(component.updated_at).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-primary font-headline flex items-center gap-2">
            <MaterialIcon name="policy" className="text-sm" />
            Regulation Statuses
          </h2>
        </div>

        {regulationStatuses.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant text-sm">
            No regulation statuses recorded. Add statuses in <span className="font-bold">component_regulations</span> to see them here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-on-surface-variant font-bold text-[11px] uppercase tracking-widest">
                  <th className="pb-4 pl-4">Code</th>
                  <th className="pb-4">Regulation</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4 pr-4">Notes</th>
                </tr>
              </thead>
              <tbody>
                {regulationStatuses.map((row) => (
                  <tr
                    key={row.id}
                    className="group hover:bg-surface-container-low transition-colors rounded-xl"
                  >
                    <td className="py-4 pl-4 rounded-l-xl">
                      <div className="font-mono text-xs text-on-surface-variant">{row.regulation_code}</div>
                    </td>
                    <td className="py-4">
                      <div className="text-sm text-on-surface-variant">{row.regulation_name}</div>
                    </td>
                    <td className="py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          row.status === "compliant"
                            ? "bg-tertiary-fixed-dim/20 text-tertiary-container"
                            : row.status === "non_compliant"
                              ? "bg-error-container/60 text-error"
                              : row.status === "at_risk"
                                ? "bg-secondary-fixed-dim/20 text-on-secondary-container"
                                : "bg-secondary-fixed/40 text-on-surface-variant"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-4 pr-4 rounded-r-xl text-sm text-on-surface-variant">
                      {row.notes ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-primary font-headline flex items-center gap-2">
            <MaterialIcon name="history" className="text-sm" />
            Compliance by Release Version
          </h2>
        </div>
        {releaseStatuses.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant text-sm">
            No release-version statuses yet. New regulation releases will auto-create review entries here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-on-surface-variant font-bold text-[11px] uppercase tracking-widest">
                  <th className="pb-4 pl-4">Release</th>
                  <th className="pb-4">Regulation</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4">Evaluated</th>
                  <th className="pb-4 pr-4">Notes</th>
                </tr>
              </thead>
              <tbody>
                {releaseStatuses.map((row) => (
                  <tr key={row.id} className="group hover:bg-surface-container-low transition-colors rounded-xl">
                    <td className="py-4 pl-4 rounded-l-xl">
                      <div className="font-mono text-xs text-on-surface-variant">{row.release_key}</div>
                      {row.release_title ? (
                        <div className="text-xs text-on-surface-variant">{row.release_title}</div>
                      ) : null}
                    </td>
                    <td className="py-4 text-sm text-on-surface-variant">
                      {row.regulation_code} - {row.regulation_name}
                    </td>
                    <td className="py-4">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-secondary-fixed/40 text-on-surface-variant">
                        {row.status}
                      </span>
                    </td>
                    <td className="py-4 text-sm text-on-surface-variant">
                      {row.evaluated_at ? new Date(row.evaluated_at).toLocaleString() : "—"}
                    </td>
                    <td className="py-4 pr-4 rounded-r-xl text-sm text-on-surface-variant">
                      {row.notes ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ComponentDocumentsSection componentId={id} />
    </div>
  );
}
