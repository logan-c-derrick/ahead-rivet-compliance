"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import MaterialIcon from "@/components/ui/MaterialIcon";
import { RichMessageEditor } from "@/components/outreach/rich-message-editor";
import { submitCampaignIntent, type OutreachActionState } from "../actions";

type Regulation = { id: string; code: string; name: string };

type SupplierOpt = { id: string; name: string };
type ProductOpt = { id: string; name: string };
type ComponentOpt = {
  id: string;
  name: string;
  part_number: string | null;
  supplier_id: string | null;
  suppliers: { name: string } | null;
};

export type TargetingMode = "all" | "suppliers" | "product" | "components";

export default function OutreachCampaignForm({
  regulations,
  countries,
  suppliers,
  products,
  components,
  defaultSubjectTemplate,
  defaultMessageTemplate,
}: {
  regulations: Regulation[];
  countries: string[];
  suppliers: SupplierOpt[];
  products: ProductOpt[];
  components: ComponentOpt[];
  defaultSubjectTemplate: string;
  defaultMessageTemplate: string;
}) {
  const router = useRouter();
  const intentRef = useRef<HTMLInputElement>(null);
  const [targetingMode, setTargetingMode] = useState<TargetingMode>("all");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [componentFilter, setComponentFilter] = useState("");
  const [regulationFilter, setRegulationFilter] = useState("");
  /** Controlled selection so all IDs survive server-action FormData (multi-checkbox name can collapse). */
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<Set<string>>(() => new Set());
  const [selectedComponentIds, setSelectedComponentIds] = useState<Set<string>>(() => new Set());
  const [selectedRegulationIds, setSelectedRegulationIds] = useState<Set<string>>(() => new Set());
  const [subjectTemplate, setSubjectTemplate] = useState(defaultSubjectTemplate);
  const [messageTemplate, setMessageTemplate] = useState(defaultMessageTemplate);

  const [state, formAction] = useFormState(
    async (_prev: OutreachActionState, formData: FormData) => {
      return submitCampaignIntent(_prev, formData);
    },
    null
  );

  useEffect(() => {
    if (state && "success" in state && state.success) {
      router.push(state.redirectTo);
    }
  }, [state, router]);

  const err = state && "error" in state ? state.error : null;

  const filteredSuppliers = useMemo(() => {
    const q = supplierFilter.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter((s) => s.name.toLowerCase().includes(q));
  }, [suppliers, supplierFilter]);

  const filteredComponents = useMemo(() => {
    const q = componentFilter.trim().toLowerCase();
    if (!q) return components;
    return components.filter((c) => {
      const mfr = c.suppliers?.name ?? "";
      const hay = `${c.name} ${c.part_number ?? ""} ${mfr}`.toLowerCase();
      return hay.includes(q);
    });
  }, [components, componentFilter]);

  const filteredRegulations = useMemo(() => {
    const q = regulationFilter.trim().toLowerCase();
    if (!q) return regulations;
    return regulations.filter((r) =>
      `${r.code} ${r.name}`.toLowerCase().includes(q)
    );
  }, [regulations, regulationFilter]);

  useEffect(() => {
    if (targetingMode !== "suppliers") setSelectedSupplierIds(new Set());
    if (targetingMode !== "components") setSelectedComponentIds(new Set());
  }, [targetingMode]);

  return (
    <form action={formAction} className="grid grid-cols-12 gap-8 items-start">
      <input ref={intentRef} type="hidden" name="intent" defaultValue="launch" />
      <input type="hidden" name="targeting_mode" value={targetingMode} />

      {err && (
        <div className="col-span-12 rounded-xl border border-error/40 bg-error-container/20 p-4 text-sm text-error font-body">
          {err}
        </div>
      )}

      {regulations.length === 0 && (
        <div className="col-span-12 rounded-xl border border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm text-amber-900 dark:text-amber-100 font-body">
          Add at least one regulation under <strong>Regulations</strong> before you can launch a
          campaign.
        </div>
      )}

      <div className="col-span-12 lg:col-span-8 space-y-8">
        <section className="bg-surface-container-lowest rounded-xl p-8 shadow-sm">
          <h3 className="text-lg font-bold text-primary mb-6 flex items-center gap-2 font-headline">
            <MaterialIcon name="settings_input_component" className="text-primary-container" />
            Campaign Context
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-body">
                Campaign Name *
              </label>
              <input
                name="campaign_name"
                required
                disabled={regulations.length === 0}
                className="w-full bg-surface-container-low border-none rounded-lg py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all font-body disabled:opacity-50"
                placeholder="e.g. Q4 Chemical Inventory Refresh"
                type="text"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-body">
                Target regulations *
              </label>
              <input
                type="search"
                value={regulationFilter}
                onChange={(e) => setRegulationFilter(e.target.value)}
                placeholder="Search by code or name…"
                disabled={regulations.length === 0}
                className="w-full bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm font-body mb-2 disabled:opacity-50"
              />
              <input
                type="hidden"
                name="regulation_ids"
                value={Array.from(selectedRegulationIds).join(",")}
                readOnly
              />
              <div className="max-h-56 overflow-y-auto space-y-1 border border-outline-variant/10 rounded-lg p-2 bg-white">
                {filteredRegulations.length === 0 ? (
                  <p className="text-xs text-slate-500 p-2">No regulations match.</p>
                ) : (
                  filteredRegulations.map((r) => (
                    <label
                      key={r.id}
                      className="flex items-start gap-2 cursor-pointer text-sm font-body py-1 px-1 rounded hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRegulationIds.has(r.id)}
                        onChange={(e) => {
                          setSelectedRegulationIds((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(r.id);
                            else next.delete(r.id);
                            return next;
                          });
                        }}
                        className="rounded text-primary focus:ring-primary border-slate-300 mt-0.5"
                      />
                      <span>
                        <span className="font-mono text-xs text-slate-500">{r.code}</span>
                        <span className="font-medium"> — {r.name}</span>
                      </span>
                    </label>
                  ))
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-body">
                Selected regulations apply to each target row (one outreach request per supplier or
                component). Use <code className="text-xs">{"{{regulation_names}}"}</code> or{" "}
                <code className="text-xs">{"{{regulation_list}}"}</code> in the message;{" "}
                <code className="text-xs">{"{{regulation_name}}"}</code> is the first selected for
                merge fallbacks.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-body">
                Response due date
              </label>
              <input
                name="due_date"
                type="date"
                disabled={regulations.length === 0}
                className="w-full bg-surface-container-low border-none rounded-lg py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all font-body disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-body">
                Follow-up interval (days)
              </label>
              <input
                name="follow_up_days"
                type="number"
                min={1}
                defaultValue={7}
                disabled={regulations.length === 0}
                className="w-full bg-surface-container-low border-none rounded-lg py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all font-body disabled:opacity-50"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-body">
                Test email override (optional)
              </label>
              <input
                name="test_email_override"
                type="email"
                autoComplete="off"
                placeholder="you@company.com — one test email with all targets"
                disabled={regulations.length === 0}
                className="w-full bg-surface-container-low border-none rounded-lg py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all font-body disabled:opacity-50"
              />
              <p className="text-[11px] text-slate-500 font-body">
                When set, the campaign still creates one outreach request per target (same as a
                normal launch), but <strong>only one message is sent</strong>, to this address, with
                all components in <code className="text-xs">{"{{component_names}}"}</code> /{" "}
                <code className="text-xs">{"{{component_list}}"}</code> and a single portal link
                that opens the full campaign. Subject is prefixed with{" "}
                <code className="text-xs">[TEST]</code>. Leave blank to email each supplier contact.
                Test email override currently supports <strong>@ahead.com</strong> addresses only.
                Sending requires <code className="text-xs">RESEND_API_KEY</code> in{" "}
                <code className="text-xs">.env.local</code> and a server restart.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-surface-container-lowest rounded-xl p-8 shadow-sm">
          <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2 font-headline">
            <MaterialIcon name="target" className="text-primary-container" />
            Targeting
          </h3>
          <p className="text-sm text-slate-500 font-body mb-4">
            Choose how to build the recipient list. Component-scoped requests store a
            <code className="text-xs mx-1">component_id</code> on each outreach request.
          </p>
          <div className="flex flex-wrap gap-2 mb-6">
            {(
              [
                ["all", "All suppliers"],
                ["suppliers", "Selected suppliers"],
                ["product", "Product (BOM)"],
                ["components", "Components"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTargetingMode(value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-body transition-colors ${
                  targetingMode === value
                    ? "bg-primary text-white"
                    : "bg-surface-container-high text-slate-600 hover:bg-surface-container-highest"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {targetingMode === "all" && (
            <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/40 p-4 space-y-3">
              <p className="text-xs text-slate-600 font-body">
                Include every supplier in your organization, optionally filtered by
                <span className="font-bold"> country</span> (supplier record).
              </p>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                {countries.length === 0 ? (
                  <p className="text-xs text-slate-500">No countries on file — all suppliers will be included.</p>
                ) : (
                  countries.map((c) => (
                    <label key={c} className="flex items-center gap-2 cursor-pointer text-sm font-body">
                      <input
                        type="checkbox"
                        name="cohort_country"
                        value={c}
                        disabled={regulations.length === 0}
                        className="rounded text-primary focus:ring-primary border-slate-300"
                      />
                      <span>{c}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {targetingMode === "suppliers" && (
            <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/40 p-4 space-y-3">
              <input
                type="hidden"
                name="target_supplier_ids"
                value={Array.from(selectedSupplierIds).join(",")}
                readOnly
              />
              <input
                type="search"
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                placeholder="Search suppliers…"
                className="w-full bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm font-body"
              />
              <div className="max-h-56 overflow-y-auto space-y-1 border border-outline-variant/10 rounded-lg p-2 bg-white">
                {filteredSuppliers.length === 0 ? (
                  <p className="text-xs text-slate-500 p-2">No suppliers match.</p>
                ) : (
                  filteredSuppliers.map((s) => (
                    <label
                      key={s.id}
                      className="flex items-center gap-2 cursor-pointer text-sm font-body py-1 px-1 rounded hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSupplierIds.has(s.id)}
                        onChange={(e) => {
                          setSelectedSupplierIds((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(s.id);
                            else next.delete(s.id);
                            return next;
                          });
                        }}
                        className="rounded text-primary focus:ring-primary border-slate-300"
                      />
                      <span>{s.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {targetingMode === "product" && (
            <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/40 p-4 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-body">
                Product *
              </label>
              <select
                name="target_product_id"
                required={targetingMode === "product"}
                className="w-full bg-surface-container-low border-none rounded-lg py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 font-body"
              >
                <option value="">Select product…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 font-body">
                One outreach request per component on this product&apos;s BOM (linked via product
                components).
              </p>
            </div>
          )}

          {targetingMode === "components" && (
            <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/40 p-4 space-y-3">
              <input
                type="hidden"
                name="target_component_ids"
                value={Array.from(selectedComponentIds).join(",")}
                readOnly
              />
              <input
                type="search"
                value={componentFilter}
                onChange={(e) => setComponentFilter(e.target.value)}
                placeholder="Search by name, part #, supplier…"
                className="w-full bg-surface-container-low border-none rounded-lg py-2 px-3 text-sm font-body"
              />
              <div className="max-h-64 overflow-y-auto space-y-1 border border-outline-variant/10 rounded-lg p-2 bg-white">
                {filteredComponents.length === 0 ? (
                  <p className="text-xs text-slate-500 p-2">No components match.</p>
                ) : (
                  filteredComponents.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-start gap-2 cursor-pointer text-sm font-body py-1 px-1 rounded hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedComponentIds.has(c.id)}
                        onChange={(e) => {
                          setSelectedComponentIds((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(c.id);
                            else next.delete(c.id);
                            return next;
                          });
                        }}
                        className="rounded text-primary focus:ring-primary border-slate-300 mt-0.5"
                      />
                      <span>
                        <span className="font-medium">{c.name}</span>
                        {c.part_number && (
                          <span className="text-slate-500 text-xs"> · {c.part_number}</span>
                        )}
                        {c.suppliers?.name && (
                          <span className="block text-xs text-slate-500">{c.suppliers.name}</span>
                        )}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}
        </section>

        <section className="bg-surface-container-lowest rounded-xl p-8 shadow-sm">
          <h3 className="text-lg font-bold text-primary mb-6 flex items-center gap-2 font-headline">
            <MaterialIcon name="edit_note" className="text-primary-container" />
            Communication Template
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-body">
                Subject
              </label>
              <input
                name="subject_template"
                className="w-full bg-surface-container-low border-none rounded-lg py-3 px-4 text-sm font-bold text-slate-700 font-body"
                type="text"
                value={subjectTemplate}
                onChange={(e) => setSubjectTemplate(e.target.value)}
                disabled={regulations.length === 0}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-body">
                Message — rich text (supports {"{{supplier_contact}}"} (supplier name),{" "}
                {"{{component_name}}"}, {"{{component_names}}"}, {"{{component_list}}"},{" "}
                {"{{regulation_name}}"}, {"{{regulation_names}}"}, {"{{regulation_list}}"},{" "}
                {"{{deadline_date}}"}, {"{{portal_unique_link}}"})
              </label>
              <RichMessageEditor
                name="message_template"
                value={messageTemplate}
                onChange={setMessageTemplate}
                disabled={regulations.length === 0}
              />
              <p className="text-[11px] text-slate-500 font-body">
                Defaults come from{" "}
                <a href="/outreach/templates" className="text-primary font-semibold hover:underline">
                  Outreach → Edit template
                </a>
                .{" "}
                <code className="text-[10px]">{"{{regulation_list}}"}</code> /{" "}
                <code className="text-[10px]">{"{{component_list}}"}</code> render as HTML lists—place
                them on their own lines and don&apos;t add editor bullets around them.
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="col-span-12 lg:col-span-4 space-y-8">
        <section className="bg-surface-container-low rounded-xl p-6 border-l-4 border-primary/20">
          <h3 className="text-sm font-extrabold text-primary mb-4 flex items-center justify-between font-headline">
            SUMMARY
            <MaterialIcon name="info" className="text-blue-400" />
          </h3>
          <ul className="text-xs text-slate-600 font-body space-y-2 list-disc pl-4">
            <li>
              <strong>All suppliers:</strong> optional country filters; one request per supplier (no
              component link).
            </li>
            <li>
              <strong>Selected suppliers:</strong> check one or many; one request per supplier.
            </li>
            <li>
              <strong>Product:</strong> one request per BOM line component.
            </li>
            <li>
              <strong>Components:</strong> one request per selected component.
            </li>
            <li>
              <strong>Regulations:</strong> check one or many; each target gets one request covering
              all selected regulations.
            </li>
          </ul>
          <p className="text-[10px] text-slate-400 mt-4 font-body">
            Lists up to {suppliers.length} suppliers / {products.length} products / {components.length}{" "}
            components (loaded for this page).
          </p>
        </section>

        <section className="bg-primary p-8 rounded-xl text-white shadow-xl shadow-blue-900/20 space-y-4">
          <button
            type="submit"
            onClick={() => {
              if (intentRef.current) intentRef.current.value = "launch";
            }}
            className="w-full bg-white text-primary py-4 rounded-lg font-black tracking-tight flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors font-body"
          >
            <MaterialIcon name="rocket_launch" filled />
            ACTIVATE CAMPAIGN
          </button>
          <button
            type="submit"
            onClick={() => {
              if (intentRef.current) intentRef.current.value = "draft";
            }}
            className="w-full bg-primary-container/40 text-white/90 py-3 rounded-lg text-sm font-bold hover:bg-primary-container transition-colors font-body"
          >
            Save as Draft
          </button>
          <Link
            href="/outreach"
            className="block w-full text-center text-xs text-white/70 hover:text-white font-body"
          >
            Cancel
          </Link>
        </section>
      </div>
    </form>
  );
}
