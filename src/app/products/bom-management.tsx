"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useFormState } from "react-dom";
import MaterialIcon from "@/components/ui/MaterialIcon";
import {
  createProductFormState,
  updateProduct,
  deleteProduct,
  type Product,
  type OemVendor,
} from "./actions";
import { PERMISSION_DENIED_MESSAGE } from "@/lib/permissions";

const LIFECYCLE_OPTIONS = ["active", "inactive", "discontinued", "development"];
const PRODUCT_CATEGORY_OPTIONS = ["Server", "Network Equipment", "PC"];

function lifecyclePill(status: string) {
  switch (status) {
    case "active":
      return "bg-tertiary-fixed-dim/20 text-tertiary-container";
    case "development":
      return "bg-secondary-fixed-dim/20 text-on-secondary-container";
    case "inactive":
    case "discontinued":
    default:
      return "bg-error-container/60 text-error";
  }
}

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
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-[0_20px_40px_rgba(11,28,48,0.06)] border border-outline-variant/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold font-headline">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded p-1"
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

function ProductFormFields({
  defaultName = "",
  defaultSku = "",
  defaultDescription = "",
  defaultCategory = "",
  defaultLifecycle = "active",
  defaultOemVendorId = "",
  oemVendors = [],
}: {
  defaultName?: string;
  defaultSku?: string;
  defaultDescription?: string;
  defaultCategory?: string;
  defaultLifecycle?: string;
  defaultOemVendorId?: string;
  oemVendors?: OemVendor[];
}) {
  return (
    <>
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1 font-body">
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
        <label htmlFor="sku" className="block text-sm font-medium mb-1 font-body">
          SKU
        </label>
        <input
          type="text"
          id="sku"
          name="sku"
          defaultValue={defaultSku}
          className="w-full px-3 py-2 bg-surface-container-lowest border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1 font-body">
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
        <label htmlFor="category" className="block text-sm font-medium mb-1 font-body">
          Category
        </label>
        <select
          id="category"
          name="category"
          defaultValue={defaultCategory}
          className="w-full px-3 py-2 bg-surface-container-lowest border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
        >
          <option value="">Select category</option>
          {PRODUCT_CATEGORY_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="lifecycle_status" className="block text-sm font-medium mb-1 font-body">
          Lifecycle Status
        </label>
        <select
          id="lifecycle_status"
          name="lifecycle_status"
          defaultValue={defaultLifecycle}
          className="w-full px-3 py-2 bg-surface-container-lowest border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
        >
          {LIFECYCLE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      {oemVendors.length > 0 && (
        <div>
          <label htmlFor="oem_vendor_id" className="block text-sm font-medium mb-1 font-body">
            OEM Vendor
          </label>
          <select
            id="oem_vendor_id"
            name="oem_vendor_id"
            defaultValue={defaultOemVendorId}
            className="w-full px-3 py-2 bg-surface-container-lowest border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
          >
            <option value="">None (original design)</option>
            {oemVendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-on-surface-variant mt-1 font-body">
            Tag this product as an OEM-based system to enable direct OEM outreach.
          </p>
        </div>
      )}
    </>
  );
}

export default function BomManagement({
  products,
  editId,
  canManage,
  oemVendors = [],
}: {
  products: Product[];
  editId: string | null;
  canManage: boolean;
  oemVendors?: OemVendor[];
}) {
  const [createState, createAction] = useFormState(createProductFormState, null);
  const [updateState, updateAction] = useFormState(updateProduct, null);
  const [deleteState, deleteAction] = useFormState(deleteProduct, null);

  const [showCreate, setShowCreate] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProductState, setDeleteProductState] = useState<{ id: string; name: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [lifecycleFilter, setLifecycleFilter] = useState("");

  useEffect(() => {
    if (editId && products.length > 0) {
      const p = products.find((x) => x.id === editId) ?? null;
      setEditProduct(p);
    } else {
      setEditProduct(null);
    }
  }, [editId, products]);

  const metrics = {
    ready: products.filter((p) => p.lifecycle_status === "active").length,
    processing: products.filter((p) => p.lifecycle_status === "development").length,
    errors: products.filter((p) => p.lifecycle_status === "inactive" || p.lifecycle_status === "discontinued").length,
  };

  const filteredProducts = products.filter((p) => {
    if (lifecycleFilter && p.lifecycle_status !== lifecycleFilter) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.trim().toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      String(p.sku ?? "").toLowerCase().includes(q) ||
      String(p.category ?? "").toLowerCase().includes(q)
    );
  });

  const exportProducts = () => {
    const csvRows = [
      ["name", "sku", "category", "lifecycle_status", "created_at"].join(","),
      ...filteredProducts.map((p) =>
        [p.name, p.sku ?? "", p.category ?? "", p.lifecycle_status, p.created_at ?? ""]
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "products-export.csv");
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header / Breadcrumb */}
      <div className="mb-2">
        <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-2 font-body">
          <span className="font-medium">Compliance Portal</span>
          <span className="opacity-60">/</span>
          <span className="font-semibold text-primary">BOM Management</span>
        </div>
        <h2 className="text-3xl font-headline font-extrabold tracking-tight text-primary">
          Bill of Materials Ledger
        </h2>
        <p className="text-on-surface-variant mt-2 max-w-2xl leading-relaxed font-body">
          Centralized inventory of your product structures. Upload BOM files and manage product-component compliance.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6 lg:gap-8">
        {/* Left: Metrics + table */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex items-center justify-between border-l-4 border-tertiary-fixed-dim">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Ready for Review</p>
                <p className="text-2xl font-headline font-extrabold text-primary">{metrics.ready}</p>
              </div>
              <MaterialIcon name="check_circle" className="text-tertiary-fixed-dim text-2xl" />
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex items-center justify-between border-l-4 border-secondary-fixed-dim">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Processing</p>
                <p className="text-2xl font-headline font-extrabold text-primary">{metrics.processing}</p>
              </div>
              <MaterialIcon name="sync" className="text-secondary-fixed-dim text-2xl" />
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex items-center justify-between border-l-4 border-error sm:col-span-2 xl:col-span-1">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">With Errors</p>
                <p className="text-2xl font-headline font-extrabold text-primary">{metrics.errors}</p>
              </div>
              <MaterialIcon name="error" className="text-error text-2xl" />
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between border-b border-surface-container/50">
              <h3 className="font-headline font-bold text-primary">Uploaded BOM Records</h3>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search name, SKU, category..."
                  className="px-3 py-1.5 text-xs rounded-lg bg-surface-container-low border border-outline-variant/30 min-w-0 w-full sm:w-64"
                />
                <select
                  value={lifecycleFilter}
                  onChange={(e) => setLifecycleFilter(e.target.value)}
                  className="px-2 py-1.5 text-xs rounded-lg bg-surface-container-low border border-outline-variant/30 w-full sm:w-auto"
                  aria-label="Filter by lifecycle status"
                >
                  <option value="">All statuses</option>
                  {LIFECYCLE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={exportProducts}
                  className="px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors flex items-center gap-1 font-body"
                >
                  <MaterialIcon name="download" className="text-sm" />
                  Export
                </button>
                {canManage ? (
                  <Link
                    href="/products/register"
                    className="bg-primary text-on-primary px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity inline-block"
                  >
                    Add Product
                  </Link>
                ) : (
                  <span
                    className="bg-primary text-on-primary px-4 py-2 rounded-xl text-xs font-bold opacity-60 cursor-not-allowed inline-block"
                    title={PERMISSION_DENIED_MESSAGE}
                  >
                    Add Product
                  </span>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-container-high/40">
                  <tr>
                    <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant">
                      BOM Name
                    </th>
                    <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant">
                      Date Uploaded
                    </th>
                    <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant">
                      Components
                    </th>
                    <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right" />
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-sm text-on-surface-variant">
                        No products match the current filters.{" "}
                        {canManage ? (
                          <Link href="/products/register" className="text-primary font-bold hover:underline">
                            Create a product
                          </Link>
                        ) : (
                          <span className="text-primary font-bold opacity-60" title={PERMISSION_DENIED_MESSAGE}>
                            Create a product
                          </span>
                        )}{" "}
                        or adjust filters.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-surface-container-low transition-colors duration-150"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-container/10 rounded-xl text-primary">
                              <span className="text-xs font-bold">P</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-primary">{p.name}</p>
                                {p.oem_vendor_id && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-blue-100 text-blue-700">
                                    OEM
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-on-surface-variant">
                                SKU: {p.sku ?? "—"}
                                {p.oem_vendor_id && oemVendors.length > 0 && (
                                  <> · {oemVendors.find((v) => v.id === p.oem_vendor_id)?.name ?? ""}</>
                                )}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-sm text-on-surface-variant">
                          {p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-6 py-5 text-sm font-medium text-primary">—</td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-surface-container-lowest ${lifecyclePill(p.lifecycle_status)}`}>
                            {p.lifecycle_status}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <Link
                              href={`/products/${p.id}`}
                              className="text-primary font-bold text-xs hover:underline"
                            >
                              View
                            </Link>
                            <button
                              type="button"
                              onClick={() => setEditProduct(p)}
                              disabled={!canManage}
                              title={!canManage ? PERMISSION_DENIED_MESSAGE : undefined}
                              className="text-on-surface-variant hover:text-primary text-xs font-bold disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteProductState({ id: p.id, name: p.name })}
                              disabled={!canManage}
                              title={!canManage ? PERMISSION_DENIED_MESSAGE : undefined}
                              className="text-error hover:text-error/90 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Upload / mapping assistant */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <Link
            href="/products/bom/map"
            className="bg-surface-container p-8 rounded-2xl border-2 border-dashed border-primary/20 flex flex-col items-center text-center relative overflow-hidden hover:border-primary/40 hover:bg-surface-container-high/50 transition-all"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center mb-6 relative z-10">
              <MaterialIcon name="cloud_upload" className="text-primary text-3xl" />
            </div>
            <h4 className="font-headline font-bold text-primary text-lg mb-2 relative z-10">Upload New BOM</h4>
            <p className="text-sm text-on-surface-variant mb-6 relative z-10 font-body">
              Drag and drop your engineering file or browse your local directory.
            </p>
            <span className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all relative z-10 inline-block text-center">
              Open Mapping Workflow
            </span>
            <p className="text-xs text-on-surface-variant mt-3 relative z-10">BOM CSV import will open mapping workflow.</p>
          </Link>

          <Link
            href="/products/bom/map"
            className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden block hover:bg-surface-container-low transition-colors"
          >
            <div className="p-6 bg-primary text-white">
              <h4 className="font-headline font-bold text-lg mb-1">Mapping Assistant</h4>
              <p className="text-xs text-blue-200 opacity-80">Configure how columns are ingested</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-tertiary-fixed-dim/10 rounded-lg flex items-start gap-3">
                <MaterialIcon name="auto_awesome" className="text-tertiary-container text-xl" />
                <div>
                  <p className="text-[11px] font-bold text-tertiary-container uppercase">Auto-Suggest Active</p>
                  <p className="text-xs text-on-tertiary-fixed-variant leading-relaxed">
                    System will detect high-confidence matches based on headers.
                  </p>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Mapping templates are saved from the BOM mapping page after reviewing detected columns.
              </p>
            </div>
          </Link>

          <div className="bg-surface-container-lowest rounded-xl shadow-sm p-6">
            <h4 className="font-headline font-bold text-primary mb-2">Ingestion Logs</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Detailed ingestion history is available in the BOM mapping workflow after each upload.
            </p>
          </div>
        </div>
      </div>

      {/* Create modal */}
      {showCreate && canManage && (
        <Modal title="Create Product" onClose={() => setShowCreate(false)}>
          {createState?.error && (
            <div className="rounded-xl border border-red-300 bg-error-container/20 p-2 text-sm text-error mb-4">
              {createState.error}
            </div>
          )}
          <form action={createAction} className="space-y-4">
            <ProductFormFields oemVendors={oemVendors} />
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
                className="px-4 py-2 border border-outline-variant/20 rounded-xl hover:bg-surface-container-lowest text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit modal */}
      {editProduct && canManage && (
        <Modal title="Edit Product" onClose={() => setEditProduct(null)}>
          {updateState?.error && (
            <div className="rounded-xl border border-red-300 bg-error-container/20 p-2 text-sm text-error mb-4">
              {updateState.error}
            </div>
          )}
          <form action={updateAction} className="space-y-4">
            <input type="hidden" name="id" value={editProduct.id} />
            <ProductFormFields
              defaultName={editProduct.name}
              defaultSku={editProduct.sku ?? ""}
              defaultDescription={editProduct.description ?? ""}
              defaultCategory={editProduct.category ?? ""}
              defaultLifecycle={editProduct.lifecycle_status}
              defaultOemVendorId={editProduct.oem_vendor_id ?? ""}
              oemVendors={oemVendors}
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
                onClick={() => setEditProduct(null)}
                className="px-4 py-2 border border-outline-variant/20 rounded-xl hover:bg-surface-container-lowest text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirmation modal */}
      {deleteProductState && canManage && (
        <Modal title="Delete Product" onClose={() => setDeleteProductState(null)}>
          {deleteState?.error && (
            <div className="rounded-xl border border-red-300 bg-error-container/20 p-2 text-sm text-error mb-4">
              {deleteState.error}
            </div>
          )}
          <p className="text-sm text-on-surface-variant">
            Are you sure you want to delete <strong>{deleteProductState.name}</strong>? This action cannot be undone.
          </p>

          <form action={deleteAction} className="flex gap-2 pt-4">
            <input type="hidden" name="id" value={deleteProductState.id} />
            <button
              type="submit"
              className="px-4 py-2 bg-error text-on-error rounded-xl hover:opacity-90 text-sm font-bold"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => setDeleteProductState(null)}
              className="px-4 py-2 border border-outline-variant/20 rounded-xl hover:bg-surface-container-lowest text-sm"
            >
              Cancel
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

