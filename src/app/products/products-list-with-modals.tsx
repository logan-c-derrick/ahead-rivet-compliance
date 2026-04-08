"use client";

import { useState, useEffect } from "react";
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

export default function ProductsListWithModals({
  products,
  editId,
}: {
  products: Product[];
  editId: string | null;
}) {
  const [createState, createAction] = useFormState(createProductFormState, null);
  const [updateState, updateAction] = useFormState(updateProduct, null);
  const [showCreate, setShowCreate] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProductState, setDeleteProductState] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleteState, deleteAction] = useFormState(deleteProduct, null);

  useEffect(() => {
    if (editId && products.length > 0) {
      const p = products.find((x) => x.id === editId) ?? null;
      setEditProduct(p);
    } else {
      setEditProduct(null);
    }
  }, [editId, products]);

  const openEdit = (product: Product) => setEditProduct(product);
  const closeEdit = () => setEditProduct(null);
  const openDelete = (product: Product) => setDeleteProductState({ id: product.id, name: product.name });
  const closeDelete = () => setDeleteProductState(null);

  return (
    <div className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm"
        >
          Add Product
        </button>
      </header>

      {products.length === 0 ? (
        <div className="rounded-xl border p-8 text-center">
          <p className="text-slate-600">No products yet.</p>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="mt-4 inline-block text-sm text-slate-900 underline"
          >
            Create your first product
          </button>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">SKU</th>
                <th className="text-left p-3 font-medium">Category</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-t hover:bg-slate-50">
                  <td className="p-3">
                    <Link
                      href={`/products/${product.id}`}
                      className="font-medium hover:underline"
                    >
                      {product.name}
                    </Link>
                  </td>
                  <td className="p-3 text-slate-600">{product.sku ?? "—"}</td>
                  <td className="p-3 text-slate-600">{product.category ?? "—"}</td>
                  <td className="p-3">
                    <span className="px-2 py-1 rounded text-xs bg-slate-100">
                      {product.lifecycle_status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(product)}
                        className="text-slate-600 hover:text-slate-900 text-xs underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => openDelete(product)}
                        className="text-red-600 hover:text-red-800 text-xs underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <Modal title="Create Product" onClose={() => setShowCreate(false)}>
          {createState?.error && (
            <div className="rounded-md border border-red-300 bg-red-50 p-2 text-sm text-red-700 mb-4">
              {createState.error}
            </div>
          )}
          <form action={createAction} className="space-y-4">
            <ProductFormFields />
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 border rounded-lg hover:bg-slate-50 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit modal */}
      {editProduct && (
        <Modal title="Edit Product" onClose={closeEdit}>
          {updateState?.error && (
            <div className="rounded-md border border-red-300 bg-red-50 p-2 text-sm text-red-700 mb-4">
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
                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm"
              >
                Update
              </button>
              <button
                type="button"
                onClick={closeEdit}
                className="px-4 py-2 border rounded-lg hover:bg-slate-50 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirmation modal */}
      {deleteProductState && (
        <Modal title="Delete Product" onClose={closeDelete}>
          {deleteState?.error && (
            <div className="rounded-md border border-red-300 bg-red-50 p-2 text-sm text-red-700 mb-4">
              {deleteState.error}
            </div>
          )}
          <p className="text-sm text-slate-700">
            Are you sure you want to delete <strong>{deleteProductState.name}</strong>? This action cannot be undone.
          </p>
          <form action={deleteAction} className="flex gap-2 pt-4">
            <input type="hidden" name="id" value={deleteProductState.id} />
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={closeDelete}
              className="px-4 py-2 border rounded-lg hover:bg-slate-50 text-sm"
            >
              Cancel
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
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
      <div className="relative w-full max-w-lg rounded-xl border bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
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
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          defaultValue={defaultName}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
        />
      </div>
      <div>
        <label htmlFor="sku" className="block text-sm font-medium mb-1">
          SKU
        </label>
        <input
          type="text"
          id="sku"
          name="sku"
          defaultValue={defaultSku}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
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
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
        />
      </div>
      <div>
        <label htmlFor="category" className="block text-sm font-medium mb-1">
          Category
        </label>
        <select
          id="category"
          name="category"
          defaultValue={defaultCategory}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
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
        <label htmlFor="lifecycle_status" className="block text-sm font-medium mb-1">
          Lifecycle Status
        </label>
        <select
          id="lifecycle_status"
          name="lifecycle_status"
          defaultValue={defaultLifecycle}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
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
