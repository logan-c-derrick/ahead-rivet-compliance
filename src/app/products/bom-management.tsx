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
} from "./actions";

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
}: {
  defaultName?: string;
  defaultSku?: string;
  defaultDescription?: string;
  defaultCategory?: string;
  defaultLifecycle?: string;
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
    </>
  );
}

export default function BomManagement({ products, editId }: { products: Product[]; editId: string | null }) {
  const [createState, createAction] = useFormState(createProductFormState, null);
  const [updateState, updateAction] = useFormState(updateProduct, null);
  const [deleteState, deleteAction] = useFormState(deleteProduct, null);

  const [showCreate, setShowCreate] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProductState, setDeleteProductState] = useState<{ id: string; name: string } | null>(null);

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

  return (
    <div className="p-8 space-y-8">
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

      <div className="grid grid-cols-12 gap-8">
        {/* Left: Metrics + table */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Metrics Bar */}
          <div className="flex gap-4">
            <div className="flex-1 bg-surface-container-lowest p-6 rounded-xl shadow-sm flex items-center justify-between border-l-4 border-tertiary-fixed-dim">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Ready for Review</p>
                <p className="text-2xl font-headline font-extrabold text-primary">{metrics.ready}</p>
              </div>
              <MaterialIcon name="check_circle" className="text-tertiary-fixed-dim text-2xl" />
            </div>
            <div className="flex-1 bg-surface-container-lowest p-6 rounded-xl shadow-sm flex items-center justify-between border-l-4 border-secondary-fixed-dim">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Processing</p>
                <p className="text-2xl font-headline font-extrabold text-primary">{metrics.processing}</p>
              </div>
              <MaterialIcon name="sync" className="text-secondary-fixed-dim text-2xl" />
            </div>
            <div className="flex-1 bg-surface-container-lowest p-6 rounded-xl shadow-sm flex items-center justify-between border-l-4 border-error">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">With Errors</p>
                <p className="text-2xl font-headline font-extrabold text-primary">{metrics.errors}</p>
              </div>
              <MaterialIcon name="error" className="text-error text-2xl" />
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between border-b border-surface-container/50">
              <h3 className="font-headline font-bold text-primary">Uploaded BOM Records</h3>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors flex items-center gap-1 font-body"
                >
                  <MaterialIcon name="filter_list" className="text-sm" />
                  Filter
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors flex items-center gap-1 font-body"
                >
                  <MaterialIcon name="download" className="text-sm" />
                  Export
                </button>
                <Link
                  href="/products/register"
                  className="bg-primary text-on-primary px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity inline-block"
                >
                  Add Product
                </Link>
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
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-sm text-on-surface-variant">
                        No products yet.{" "}
                        <Link href="/products/register" className="text-primary font-bold hover:underline">
                          Create your first product
                        </Link> to start managing compliance.
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => (
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
                              <p className="text-sm font-bold text-primary">{p.name}</p>
                              <p className="text-[10px] text-on-surface-variant">
                                SKU: {p.sku ?? "—"}
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
                              className="text-on-surface-variant hover:text-primary text-xs font-bold"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteProductState({ id: p.id, name: p.name })}
                              className="text-error hover:text-error/90 text-xs font-bold"
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

        {/* Right: Upload / mapping assistant (placeholder) */}
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
              Browse Files
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
              <span className="block w-full border-2 border-primary/10 text-primary py-3 rounded-lg font-bold text-sm hover:bg-surface-container-low transition-colors text-center">
                Save Mapping Schema
              </span>
            </div>
          </Link>

          <div className="bg-surface-container-lowest rounded-xl shadow-sm p-6">
            <h4 className="font-headline font-bold text-primary mb-4">Ingestion Logs</h4>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-1 h-8 bg-tertiary-fixed-dim rounded-full" />
                <div>
                  <p className="text-xs font-bold text-primary">Latest Mapping Complete</p>
                  <p className="text-[10px] text-on-surface-variant">Success: — rows mapped.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-1 h-8 bg-error rounded-full" />
                <div>
                  <p className="text-xs font-bold text-primary">No Recent Errors</p>
                  <p className="text-[10px] text-on-surface-variant">—</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <Modal title="Create Product" onClose={() => setShowCreate(false)}>
          {createState?.error && (
            <div className="rounded-xl border border-red-300 bg-error-container/20 p-2 text-sm text-error mb-4">
              {createState.error}
            </div>
          )}
          <form action={createAction} className="space-y-4">
            <ProductFormFields />
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
      {editProduct && (
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
      {deleteProductState && (
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

