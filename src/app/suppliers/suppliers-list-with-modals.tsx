"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormState } from "react-dom";
import MaterialIcon from "@/components/ui/MaterialIcon";
import {
  createSupplierFormState,
  updateSupplier,
  deleteSupplier,
  type SupplierContact,
  type SupplierWithCount,
} from "./actions";
import type { SupplierListFilter } from "./supplier-filters";

function formatLegacyContact(s: SupplierWithCount): string {
  return [s.contact_email, s.contact_phone].filter(Boolean).join(" · ");
}

function formatImportedContactLine(c: SupplierContact): string {
  const parts = [c.contact_name, c.email, c.phone].filter(Boolean);
  if (parts.length) return parts.join(" · ");
  if (c.contact_href) return c.contact_href;
  return "—";
}

function SupplierContactCell({ s }: { s: SupplierWithCount }) {
  const legacy = formatLegacyContact(s);
  const contacts = s.contacts ?? [];
  const first = contacts[0];
  const importedLine = first ? formatImportedContactLine(first) : "";
  const line1 = legacy || importedLine || "—";
  const moreCount = contacts.length > 1 ? contacts.length - 1 : 0;

  return (
    <div className="flex flex-col gap-0.5 max-w-[20rem]">
      <span className="text-on-surface-variant text-sm break-words">{line1}</span>
      {moreCount > 0 && (
        <span className="text-[11px] font-semibold text-on-surface-variant/70">
          +{moreCount} more contact{moreCount !== 1 ? "s" : ""}
        </span>
      )}
      {legacy && contacts.length > 0 && (
        <span className="text-[11px] text-on-surface-variant/60">
          {contacts.length} contact{contacts.length !== 1 ? "s" : ""} in address book
        </span>
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

function SupplierFormFields({
  defaultName = "",
  defaultContacts = [],
  defaultAddress = "",
  defaultCountry = "",
}: {
  defaultName?: string;
  defaultContacts?: Array<{ contact_name?: string | null; email?: string | null; phone?: string | null }>;
  defaultAddress?: string;
  defaultCountry?: string;
}) {
  const initialContacts =
    defaultContacts.length > 0
      ? defaultContacts.map((c) => ({
          contact_name: c.contact_name ?? "",
          email: c.email ?? "",
          phone: c.phone ?? "",
        }))
      : [{ contact_name: "", email: "", phone: "" }];
  const [contacts, setContacts] = useState(initialContacts);

  function updateContact(
    index: number,
    key: "contact_name" | "email" | "phone",
    value: string
  ) {
    setContacts((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  }

  function addContactRow() {
    setContacts((prev) => [...prev, { contact_name: "", email: "", phone: "" }]);
  }

  function removeContactRow(index: number) {
    setContacts((prev) => {
      if (prev.length <= 1) return [{ contact_name: "", email: "", phone: "" }];
      return prev.filter((_, i) => i !== index);
    });
  }

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
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium">Contacts</label>
          <button
            type="button"
            onClick={addContactRow}
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            <MaterialIcon name="add" className="text-sm" />
            Add contact
          </button>
        </div>
        {contacts.map((c, i) => (
          <div
            key={`contact-row-${i}`}
            className="rounded-xl border border-outline-variant/20 p-3 space-y-2 bg-surface-container-low/40"
          >
            <div>
              <label className="block text-xs font-medium mb-1 text-on-surface-variant">Name</label>
              <input
                type="text"
                name="contact_name"
                value={c.contact_name}
                onChange={(e) => updateContact(i, "contact_name", e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-lowest border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-on-surface-variant">Email</label>
              <input
                type="email"
                name="contact_email"
                value={c.email}
                onChange={(e) => updateContact(i, "email", e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-lowest border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-on-surface-variant">Phone</label>
              <input
                type="text"
                name="contact_phone"
                value={c.phone}
                onChange={(e) => updateContact(i, "phone", e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-lowest border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => removeContactRow(i)}
                className="inline-flex items-center gap-1 text-xs font-bold text-error hover:underline"
              >
                <MaterialIcon name="delete" className="text-sm" />
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <div>
        <label htmlFor="address" className="block text-sm font-medium mb-1">
          Address
        </label>
        <textarea
          id="address"
          name="address"
          rows={2}
          defaultValue={defaultAddress}
          className="w-full px-3 py-2 bg-surface-container-lowest border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
        />
      </div>
      <div>
        <label htmlFor="country" className="block text-sm font-medium mb-1">
          Country
        </label>
        <input
          type="text"
          id="country"
          name="country"
          defaultValue={defaultCountry}
          className="w-full px-3 py-2 bg-surface-container-lowest border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
        />
      </div>
    </>
  );
}

function suppliersPageHref(page: number, editId: string | null, match: SupplierListFilter) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (editId) params.set("edit", editId);
  if (match !== "all") params.set("match", match);
  const q = params.toString();
  return q ? `/suppliers?${q}` : "/suppliers";
}

export default function SuppliersListWithModals({
  suppliers,
  editId,
  editPrefetch,
  total,
  page,
  pageSize,
  match,
}: {
  suppliers: SupplierWithCount[];
  editId: string | null;
  editPrefetch: SupplierWithCount | null;
  total: number;
  page: number;
  pageSize: number;
  match: SupplierListFilter;
}) {
  const router = useRouter();
  const [createState, createAction] = useFormState(createSupplierFormState, null);
  const [updateState, updateAction] = useFormState(updateSupplier, null);
  const [deleteState, deleteAction] = useFormState(deleteSupplier, null);
  const [showCreate, setShowCreate] = useState(false);
  const [editSupplier, setEditSupplier] = useState<SupplierWithCount | null>(null);
  const [deleteRow, setDeleteRow] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!editId) {
      setEditSupplier(null);
      return;
    }
    const fromPage = suppliers.find((x) => x.id === editId);
    if (fromPage) {
      setEditSupplier(fromPage);
      return;
    }
    if (editPrefetch?.id === editId) {
      setEditSupplier(editPrefetch);
      return;
    }
    setEditSupplier(null);
  }, [editId, suppliers, editPrefetch]);

  function navigateWithMatch(next: SupplierListFilter) {
    const params = new URLSearchParams();
    if (next !== "all") params.set("match", next);
    if (editId) params.set("edit", editId);
    const q = params.toString();
    router.push(q ? `/suppliers?${q}` : "/suppliers");
  }

  return (
    <div className="p-8 space-y-8">
      <header className="space-y-4">
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <span className="font-medium">Compliance Portal</span>
          <span className="opacity-60">/</span>
          <span className="font-semibold text-primary">Suppliers</span>
        </div>
        <div className="flex items-end justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary">
              <MaterialIcon name="handshake" className="text-sm" />
            </div>
            <div>
              <h1 className="text-3xl font-headline font-extrabold tracking-tight text-primary">Suppliers</h1>
              <p className="text-on-surface-variant mt-2 text-sm">
                Manage supplier records and link components to keep compliance data accurate.
              </p>
            </div>
          </div>

          <Link
            href="/suppliers/new"
            className="bg-primary text-on-primary px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity inline-flex items-center gap-2"
          >
            <MaterialIcon name="add" className="text-sm" />
            Add Supplier
          </Link>
          <Link
            href="/suppliers/bulk"
            className="bg-surface-container-lowest text-primary px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-surface-container transition-colors inline-flex items-center gap-2"
          >
            <MaterialIcon name="upload" className="text-sm" />
            Bulk Upload
          </Link>
        </div>
      </header>

      <div className="flex flex-col sm:flex-row sm:items-end gap-3 max-w-xl">
        <div className="flex-1 min-w-[12rem]">
          <label
            htmlFor="supplier-component-filter"
            className="block text-[11px] font-extrabold uppercase tracking-widest text-on-secondary-fixed-variant mb-1.5"
          >
            Components
          </label>
          <select
            id="supplier-component-filter"
            value={match}
            onChange={(e) => navigateWithMatch(e.target.value as SupplierListFilter)}
            className="w-full px-3 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All suppliers</option>
            <option value="with_components">With linked components</option>
            <option value="without_components">Without linked components</option>
          </select>
        </div>
      </div>

      {suppliers.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl p-8 text-center shadow-sm">
          <p className="text-on-surface-variant">
            {match === "all"
              ? "No suppliers yet."
              : "No suppliers match this filter."}
          </p>
          <Link
            href="/suppliers/new"
            className="mt-4 inline-block text-sm text-primary font-bold hover:underline"
          >
            Create your first supplier
          </Link>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-container-high/40">
              <tr>
                <th className="text-left px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-on-secondary-fixed-variant">Name</th>
                <th className="text-left px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-on-secondary-fixed-variant">Contact</th>
                <th className="text-left px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-on-secondary-fixed-variant">Country</th>
                <th className="text-right px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-on-secondary-fixed-variant">Components</th>
                <th className="text-right px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-on-secondary-fixed-variant">Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id} className="group hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary">
                        <MaterialIcon name="handshake" className="text-sm" />
                      </div>
                      <span className="font-bold text-primary">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-on-surface-variant text-sm align-top">
                    <SupplierContactCell s={s} />
                  </td>
                  <td className="px-6 py-5 text-on-surface-variant text-sm">{s.country ?? "—"}</td>
                  <td className="px-6 py-5 text-right">
                    {s.component_count > 0 ? (
                      <Link
                        href={`/components?supplier=${s.id}`}
                        className="text-primary font-bold text-xs hover:underline"
                      >
                        {s.component_count}
                      </Link>
                    ) : (
                      <span className="text-on-surface-variant/50 font-bold text-xs">0</span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditSupplier(s)}
                        className="text-on-surface-variant hover:text-primary text-xs font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <MaterialIcon name="edit" className="text-sm" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteRow({ id: s.id, name: s.name })}
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
          {total > pageSize && (
            <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-t border-outline-variant/15 bg-surface-container-high/20">
              <p className="text-xs text-on-surface-variant">
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                {page > 1 ? (
                  <Link
                    href={suppliersPageHref(page - 1, editId, match)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-primary hover:bg-primary/10"
                  >
                    <MaterialIcon name="chevron_left" className="text-base" />
                    Previous
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-on-surface-variant/40 cursor-not-allowed">
                    <MaterialIcon name="chevron_left" className="text-base" />
                    Previous
                  </span>
                )}
                <span className="text-xs text-on-surface-variant tabular-nums px-2">
                  Page {page} of {Math.max(1, Math.ceil(total / pageSize))}
                </span>
                {page < Math.ceil(total / pageSize) ? (
                  <Link
                    href={suppliersPageHref(page + 1, editId, match)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-primary hover:bg-primary/10"
                  >
                    Next
                    <MaterialIcon name="chevron_right" className="text-base" />
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-on-surface-variant/40 cursor-not-allowed">
                    Next
                    <MaterialIcon name="chevron_right" className="text-base" />
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <Modal title="Create Supplier" onClose={() => setShowCreate(false)}>
          {createState?.error && (
            <div className="rounded-xl border border-red-300 bg-error-container/20 p-2 text-sm text-error mb-4">
              {createState.error}
            </div>
          )}
          <form action={createAction} className="space-y-4">
            <SupplierFormFields />
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

      {editSupplier && (
        <Modal title="Edit Supplier" onClose={() => setEditSupplier(null)}>
          {updateState?.error && (
            <div className="rounded-xl border border-red-300 bg-error-container/20 p-2 text-sm text-error mb-4">
              {updateState.error}
            </div>
          )}
          <form action={updateAction} className="space-y-4">
            <input type="hidden" name="id" value={editSupplier.id} />
            <SupplierFormFields
              key={editSupplier.id}
              defaultName={editSupplier.name}
              defaultContacts={[
                ...(editSupplier.contact_email || editSupplier.contact_phone
                  ? [
                      {
                        contact_name: null,
                        email: editSupplier.contact_email,
                        phone: editSupplier.contact_phone,
                      },
                    ]
                  : []),
                ...((editSupplier.contacts ?? []).map((c) => ({
                  contact_name: c.contact_name,
                  email: c.email,
                  phone: c.phone,
                })) || []),
              ]}
              defaultAddress={editSupplier.address ?? ""}
              defaultCountry={editSupplier.country ?? ""}
            />
            {(editSupplier.contacts?.length ?? 0) > 0 && (
              <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/50 p-4 space-y-2">
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-on-secondary-fixed-variant">
                  Imported contacts
                </p>
                <ul className="space-y-2 text-sm text-on-surface-variant max-h-48 overflow-y-auto">
                  {editSupplier.contacts!.map((c) => (
                    <li
                      key={c.id}
                      className="border-b border-outline-variant/10 last:border-0 pb-2 last:pb-0"
                    >
                      <div className="font-medium text-on-surface text-sm">
                        {c.contact_name || "—"}
                      </div>
                      <div className="text-xs mt-1 space-y-0.5 text-on-surface-variant">
                        {c.email && (
                          <div>
                            <a href={`mailto:${c.email}`} className="text-primary hover:underline">
                              {c.email}
                            </a>
                          </div>
                        )}
                        {c.phone && <div>{c.phone}</div>}
                        {c.contact_href && (
                          <div>
                            <a
                              href={c.contact_href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline break-all"
                            >
                              {c.contact_href}
                            </a>
                          </div>
                        )}
                        {c.list_page != null && c.list_page !== "" && (
                          <div className="text-on-surface-variant/70">List page: {c.list_page}</div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-on-primary rounded-xl hover:opacity-90 text-sm font-bold"
              >
                Update
              </button>
              <button
                type="button"
                onClick={() => setEditSupplier(null)}
                className="px-4 py-2 border border-outline-variant/20 rounded-xl hover:bg-surface-container-lowest text-sm font-bold"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteRow && (
        <Modal title="Delete Supplier" onClose={() => setDeleteRow(null)}>
          {deleteState?.error && (
            <div className="rounded-xl border border-red-300 bg-error-container/20 p-2 text-sm text-error mb-4">
              {deleteState.error}
            </div>
          )}
          <p className="text-sm text-slate-700">
            Are you sure you want to delete <strong>{deleteRow.name}</strong>? Components
            linked to this supplier will have their supplier reference cleared.
          </p>
          <form action={deleteAction} className="flex gap-2 pt-4">
            <input type="hidden" name="id" value={deleteRow.id} />
            <button
              type="submit"
              className="px-4 py-2 bg-error text-on-error rounded-xl hover:opacity-90 text-sm font-bold"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => setDeleteRow(null)}
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
