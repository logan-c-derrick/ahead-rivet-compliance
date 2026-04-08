"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useFormState } from "react-dom";
import MaterialIcon from "@/components/ui/MaterialIcon";
import {
  createComponent,
  updateComponent,
  deleteComponent,
  type ComponentWithSupplier,
} from "./actions";
import type { ComponentLinkMatchFilter } from "./component-filters";

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" aria-hidden onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-surface-container-lowest p-6 shadow-[0_20px_40px_rgba(11,28,48,0.06)] border border-outline-variant/20 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold font-headline text-primary">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant/60 hover:text-primary rounded p-1"
            aria-label="Close"
          >
            <MaterialIcon name="close" className="text-xl" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ComponentFormFields({
  supplierOptions,
  defaultName = "",
  defaultPartNumber = "",
  defaultDescription = "",
  defaultManufacturer = "",
  defaultManufacturerSku = "",
  defaultCategory = "",
  defaultSupplierId = "",
}: {
  supplierOptions: { id: string; name: string }[];
  defaultName?: string;
  defaultPartNumber?: string;
  defaultDescription?: string;
  defaultManufacturer?: string;
  defaultManufacturerSku?: string;
  defaultCategory?: string;
  defaultSupplierId?: string;
}) {
  return (
    <>
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          defaultValue={defaultName}
          className="w-full px-3 py-2 bg-surface-container-lowest border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
        />
      </div>
      <div>
        <label htmlFor="part_number" className="block text-sm font-medium mb-1">
          Part Number
        </label>
        <input
          type="text"
          id="part_number"
          name="part_number"
          defaultValue={defaultPartNumber}
          className="w-full px-3 py-2 bg-surface-container-lowest border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaultDescription}
          className="w-full px-3 py-2 bg-surface-container-lowest border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
        />
      </div>
      <div>
        <label htmlFor="manufacturer" className="block text-sm font-medium mb-1">
          Manufacturer (brand)
        </label>
        <input
          type="text"
          id="manufacturer"
          name="manufacturer"
          defaultValue={defaultManufacturer}
          placeholder="e.g. Seagate"
          className="w-full px-3 py-2 bg-surface-container-lowest border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
        />
      </div>
      <div>
        <label htmlFor="manufacturer_sku" className="block text-sm font-medium mb-1">
          Manufacturer SKU
        </label>
        <input
          type="text"
          id="manufacturer_sku"
          name="manufacturer_sku"
          defaultValue={defaultManufacturerSku}
          placeholder="MFR part number; defaults to part number if empty"
          className="w-full px-3 py-2 bg-surface-container-lowest border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-mono text-xs"
        />
      </div>
      <div>
        <label htmlFor="category" className="block text-sm font-medium mb-1">
          Category
        </label>
        <input
          type="text"
          id="category"
          name="category"
          defaultValue={defaultCategory}
          className="w-full px-3 py-2 bg-surface-container-lowest border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
        />
      </div>
      <div>
        <label htmlFor="supplier_id" className="block text-sm font-medium mb-1">
          Supplier
        </label>
        <select
          id="supplier_id"
          name="supplier_id"
          defaultValue={defaultSupplierId}
          className="w-full px-3 py-2 bg-surface-container-lowest border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
        >
          <option value="">— None —</option>
          {supplierOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}

export default function ComponentsListWithModals({
  components,
  supplierOptions,
  editId,
  supplierFilter,
  linkMatch,
}: {
  components: ComponentWithSupplier[];
  supplierOptions: { id: string; name: string }[];
  editId: string | null;
  supplierFilter: string;
  linkMatch: ComponentLinkMatchFilter;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [createState, createAction] = useFormState(createComponent, null);
  const [updateState, updateAction] = useFormState(updateComponent, null);
  const [deleteState, deleteAction] = useFormState(deleteComponent, null);
  const [showCreate, setShowCreate] = useState(false);
  const [editComponent, setEditComponent] = useState<ComponentWithSupplier | null>(null);
  const [deleteStateRow, setDeleteStateRow] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  function pushQuery(updates: Record<string, string | null | undefined>) {
    const p = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === undefined || v === "") p.delete(k);
      else p.set(k, v);
    }
    const q = p.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  }

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const c of components) {
      const cat = (c.category ?? "").trim();
      if (cat) set.add(cat);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [components]);

  const filteredComponents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return components.filter((c) => {
      if (supplierFilter && c.supplier_id !== supplierFilter) return false;
      if (linkMatch === "with_supplier" && !c.supplier_id) return false;
      if (linkMatch === "without_supplier" && c.supplier_id) return false;
      if (categoryFilter && (c.category ?? "").trim() !== categoryFilter) return false;
      if (!q) return true;
      const hay = [
        c.name,
        c.part_number,
        c.manufacturer,
        c.manufacturer_sku,
        c.category,
        c.supplier_name,
        c.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [components, searchQuery, supplierFilter, linkMatch, categoryFilter]);

  useEffect(() => {
    if (editId && components.length > 0) {
      const c = components.find((x) => x.id === editId) ?? null;
      setEditComponent(c);
    } else {
      setEditComponent(null);
    }
  }, [editId, components]);

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 w-full min-w-0 max-w-[100vw] box-border">
      <header className="space-y-4">
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <span className="font-medium">Compliance Portal</span>
          <span className="opacity-60">/</span>
          <span className="font-semibold text-primary">Components</span>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6 min-w-0">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary">
              <MaterialIcon name="memory" className="text-sm" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-headline font-extrabold tracking-tight text-primary">Components</h1>
              <p className="text-on-surface-variant mt-2 text-sm">
                Maintain your part catalog and track regulation statuses at the component level.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0 self-start sm:self-auto">
            <Link
              href="/components/bulk"
              className="border border-outline-variant/30 text-primary px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-surface-container-low transition-colors inline-flex items-center justify-center gap-2"
            >
              <MaterialIcon name="upload_file" className="text-sm" />
              Bulk CSV
            </Link>
            <Link
              href="/components/new"
              className="bg-primary text-on-primary px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"
            >
              <MaterialIcon name="add" className="text-sm" />
              Add Component
            </Link>
          </div>
        </div>
      </header>

      {components.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl p-8 text-center shadow-sm">
          <p className="text-on-surface-variant">No components yet.</p>
          <Link
            href="/components/new"
            className="mt-4 inline-block text-sm text-primary font-bold hover:underline"
          >
            Create your first component
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 flex-1 min-w-0">
              <div className="flex-1 min-w-[min(100%,16rem)]">
                <label htmlFor="component-search" className="block text-[11px] font-extrabold uppercase tracking-widest text-on-secondary-fixed-variant mb-1.5">
                  Search
                </label>
                <div className="relative">
                  <MaterialIcon
                    name="search"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none"
                  />
                  <input
                    id="component-search"
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Name, part #, MFR, SKU, category…"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div className="w-full sm:w-56 min-w-[200px]">
                <label htmlFor="component-supplier" className="block text-[11px] font-extrabold uppercase tracking-widest text-on-secondary-fixed-variant mb-1.5">
                  Supplier
                </label>
                <select
                  id="component-supplier"
                  value={supplierFilter}
                  onChange={(e) => pushQuery({ supplier: e.target.value || null })}
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">All suppliers</option>
                  {supplierOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-full sm:w-56 min-w-[200px]">
                <label
                  htmlFor="component-supplier-match"
                  className="block text-[11px] font-extrabold uppercase tracking-widest text-on-secondary-fixed-variant mb-1.5"
                >
                  Supplier match
                </label>
                <select
                  id="component-supplier-match"
                  value={linkMatch}
                  onChange={(e) => {
                    const v = e.target.value as ComponentLinkMatchFilter;
                    pushQuery({ match: v === "all" ? null : v });
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">All components</option>
                  <option value="with_supplier">With supplier</option>
                  <option value="without_supplier">Without supplier</option>
                </select>
              </div>
              <div className="w-full sm:w-56 min-w-[200px]">
                <label htmlFor="component-category" className="block text-[11px] font-extrabold uppercase tracking-widest text-on-secondary-fixed-variant mb-1.5">
                  Category
                </label>
                <select
                  id="component-category"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">All categories</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant shrink-0 xl:pb-2.5">
              Showing <span className="font-bold text-primary">{filteredComponents.length}</span> of{" "}
              {components.length}
            </p>
          </div>

          {filteredComponents.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl p-8 text-center border border-outline-variant/15">
              <p className="text-on-surface-variant text-sm">No components match your filters.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("");
                  pushQuery({ supplier: null, match: null });
                }}
                className="mt-3 text-sm font-bold text-primary hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden w-full min-w-0 max-w-full">
              <div className="w-full max-w-full min-w-0 overflow-x-auto overscroll-x-contain [scrollbar-gutter:stable]">
                <table className="w-full max-w-full text-sm text-left table-fixed border-collapse">
                  <colgroup>
                    <col className="w-[20%]" />
                    <col className="w-[11%]" />
                    <col className="w-[12%]" />
                    <col className="w-[12%]" />
                    <col className="w-[10%]" />
                    <col className="w-[17%]" />
                    <col className="w-[18%]" />
                  </colgroup>
                  <thead className="bg-surface-container-high/40">
                    <tr>
                      <th className="text-left px-3 sm:px-6 py-3 sm:py-4 text-[11px] font-extrabold uppercase tracking-widest text-on-secondary-fixed-variant align-bottom min-w-0">Name</th>
                      <th className="text-left px-3 sm:px-6 py-3 sm:py-4 text-[11px] font-extrabold uppercase tracking-widest text-on-secondary-fixed-variant align-bottom min-w-0">Part #</th>
                      <th className="text-left px-3 sm:px-6 py-3 sm:py-4 text-[11px] font-extrabold uppercase tracking-widest text-on-secondary-fixed-variant align-bottom min-w-0">Mfr</th>
                      <th className="text-left px-3 sm:px-6 py-3 sm:py-4 text-[11px] font-extrabold uppercase tracking-widest text-on-secondary-fixed-variant align-bottom min-w-0">Mfr SKU</th>
                      <th className="text-left px-3 sm:px-6 py-3 sm:py-4 text-[11px] font-extrabold uppercase tracking-widest text-on-secondary-fixed-variant align-bottom min-w-0">Category</th>
                      <th className="text-left px-3 sm:px-6 py-3 sm:py-4 text-[11px] font-extrabold uppercase tracking-widest text-on-secondary-fixed-variant align-bottom min-w-0">Supplier</th>
                      <th className="text-right px-3 sm:px-6 py-3 sm:py-4 text-[11px] font-extrabold uppercase tracking-widest text-on-secondary-fixed-variant align-bottom min-w-0">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredComponents.map((c) => (
                <tr key={c.id} className="group hover:bg-surface-container-low transition-colors align-top">
                  <td className="px-3 sm:px-6 py-4 sm:py-5 min-w-0 max-w-0">
                    <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary">
                        <MaterialIcon name="settings_input_component" className="text-sm" />
                      </div>
                      <Link
                        href={`/components/${c.id}`}
                        className="font-bold text-primary hover:underline break-words min-w-0 [overflow-wrap:anywhere]"
                      >
                        {c.name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 sm:py-5 text-on-surface-variant text-sm min-w-0 max-w-0 break-words [overflow-wrap:anywhere]">{c.part_number ?? "—"}</td>
                  <td className="px-3 sm:px-6 py-4 sm:py-5 text-on-surface-variant text-sm min-w-0 max-w-0 break-words [overflow-wrap:anywhere]">{c.manufacturer ?? "—"}</td>
                  <td className="px-3 sm:px-6 py-4 sm:py-5 text-on-surface-variant text-sm font-mono text-xs min-w-0 max-w-0 break-all [overflow-wrap:anywhere]">{c.manufacturer_sku ?? "—"}</td>
                  <td className="px-3 sm:px-6 py-4 sm:py-5 text-on-surface-variant text-sm min-w-0 max-w-0 break-words [overflow-wrap:anywhere]">{c.category ?? "—"}</td>
                  <td className="px-3 sm:px-6 py-4 sm:py-5 text-on-surface-variant text-sm min-w-0 max-w-0 break-words [overflow-wrap:anywhere]">{c.supplier_name ?? "—"}</td>
                  <td className="px-3 sm:px-6 py-4 sm:py-5 text-right min-w-0">
                    <div className="flex flex-col items-end sm:flex-row sm:justify-end gap-1 sm:gap-2">
                      <button
                        type="button"
                        onClick={() => setEditComponent(c)}
                        className="text-on-surface-variant hover:text-primary text-xs font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <MaterialIcon name="edit" className="text-sm" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteStateRow({ id: c.id, name: c.name })}
                        className="text-error hover:text-error/90 text-xs font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <MaterialIcon name="delete" className="text-sm" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <Modal title="Create Component" onClose={() => setShowCreate(false)}>
          {createState?.error && (
            <div className="rounded-xl border border-red-300 bg-error-container/20 p-2 text-sm text-error mb-4">
              {createState.error}
            </div>
          )}
          <form action={createAction} className="space-y-4">
            <ComponentFormFields supplierOptions={supplierOptions} />
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-on-primary rounded-xl hover:opacity-90 text-sm font-bold"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 border border-outline-variant/20 rounded-xl hover:bg-surface-container-lowest text-sm font-bold"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {editComponent && (
        <Modal title="Edit Component" onClose={() => setEditComponent(null)}>
          {updateState?.error && (
            <div className="rounded-xl border border-red-300 bg-error-container/20 p-2 text-sm text-error mb-4">
              {updateState.error}
            </div>
          )}
          <form action={updateAction} className="space-y-4">
            <input type="hidden" name="id" value={editComponent.id} />
            <ComponentFormFields
              supplierOptions={supplierOptions}
              defaultName={editComponent.name}
              defaultPartNumber={editComponent.part_number ?? ""}
              defaultDescription={editComponent.description ?? ""}
              defaultManufacturer={editComponent.manufacturer ?? ""}
              defaultManufacturerSku={editComponent.manufacturer_sku ?? ""}
              defaultCategory={editComponent.category ?? ""}
              defaultSupplierId={editComponent.supplier_id ?? ""}
            />
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-on-primary rounded-xl hover:opacity-90 text-sm font-bold"
              >
                Update
              </button>
              <button
                type="button"
                onClick={() => setEditComponent(null)}
                className="px-4 py-2 border border-outline-variant/20 rounded-xl hover:bg-surface-container-lowest text-sm font-bold"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteStateRow && (
        <Modal title="Delete Component" onClose={() => setDeleteStateRow(null)}>
          {deleteState?.error && (
            <div className="rounded-xl border border-red-300 bg-error-container/20 p-2 text-sm text-error mb-4">
              {deleteState.error}
            </div>
          )}
          <p className="text-sm text-slate-700">
            Are you sure you want to delete <strong>{deleteStateRow.name}</strong>? This
            action cannot be undone.
          </p>
          <form action={deleteAction} className="flex gap-2 pt-4">
            <input type="hidden" name="id" value={deleteStateRow.id} />
            <button
              type="submit"
              className="px-4 py-2 bg-error text-on-error rounded-xl hover:opacity-90 text-sm font-bold"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => setDeleteStateRow(null)}
              className="px-4 py-2 border border-outline-variant/20 rounded-xl hover:bg-surface-container-lowest text-sm font-bold"
            >
              Cancel
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
