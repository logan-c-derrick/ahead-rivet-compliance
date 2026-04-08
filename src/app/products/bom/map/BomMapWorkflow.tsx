"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import MaterialIcon from "@/components/ui/MaterialIcon";
import {
  createBomImport,
  finalizeBomMapping,
  type ColumnMapping,
} from "@/app/products/bom/actions";
import {
  BOM_TARGET_FIELDS,
  type BomTargetOrUnmapped,
  type MappingSuggestion,
} from "@/lib/bom/mapper";
import { createProductInline, type Product } from "@/app/products/actions";

const ALL_TARGET_OPTIONS: { id: BomTargetOrUnmapped; label: string }[] = [
  { id: "_unmapped", label: "Select Target..." },
  { id: "_skip", label: "— Skip —" },
  ...BOM_TARGET_FIELDS.map((f) => ({ id: f.id, label: f.label })),
];

function statusInfo(s: MappingSuggestion) {
  if (s.targetFieldId === "_unmapped" && s.confidence !== "high")
    return { status: "REQUIRED", cls: "bg-error-container text-on-error-container", icon: "error" };
  if (s.conflict)
    return { status: "AMBIGUOUS", cls: "bg-secondary-fixed-dim text-on-secondary-fixed-variant", icon: "warning" };
  if (s.targetFieldId === "_skip")
    return { status: "SKIPPED", cls: "bg-outline-variant/20 text-on-surface-variant", icon: "remove_circle" };
  return { status: "MATCHED", cls: "bg-tertiary-fixed-dim/20 text-tertiary", icon: "check_circle" };
}

function ProductBomLinkPanel({
  productList,
  productId,
  onProductChange,
  newProductName,
  newProductSku,
  onNewProductName,
  onNewProductSku,
  onCreateProduct,
  creatingProduct,
  productCreateError,
}: {
  productList: Product[];
  productId: string | null;
  onProductChange: (id: string | null) => void;
  newProductName: string;
  newProductSku: string;
  onNewProductName: (v: string) => void;
  onNewProductSku: (v: string) => void;
  onCreateProduct: (e: React.FormEvent) => void;
  creatingProduct: boolean;
  productCreateError: string | null;
}) {
  return (
    <div className="bg-surface-container-low rounded-xl p-6 space-y-4">
      <div>
        <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 font-body">
          Link to product (optional)
        </label>
        <p className="text-xs text-on-surface-variant mb-3 font-body">
          Components from this BOM attach to the product you choose. Create a product first if you don&apos;t have one yet.
        </p>
        {productList.length > 0 ? (
          <select
            value={productId ?? ""}
            onChange={(e) => onProductChange(e.target.value || null)}
            className="w-full px-3 py-2 bg-white border border-outline-variant/20 rounded-lg text-sm font-body"
          >
            <option value="">— None —</option>
            {productList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.sku ? ` (${p.sku})` : ""}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-sm text-on-surface-variant font-body mb-2">No products in your catalog yet.</p>
        )}
      </div>
      <div className="border-t border-outline-variant/15 pt-4">
        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 font-body">
          New product
        </p>
        <form onSubmit={onCreateProduct} className="space-y-2">
          <input
            type="text"
            value={newProductName}
            onChange={(e) => onNewProductName(e.target.value)}
            placeholder="Product name *"
            className="w-full px-3 py-2 bg-white border border-outline-variant/20 rounded-lg text-sm"
            disabled={creatingProduct}
          />
          <input
            type="text"
            value={newProductSku}
            onChange={(e) => onNewProductSku(e.target.value)}
            placeholder="SKU (optional)"
            className="w-full px-3 py-2 bg-white border border-outline-variant/20 rounded-lg text-sm"
            disabled={creatingProduct}
          />
          {productCreateError && <p className="text-xs text-error">{productCreateError}</p>}
          <button
            type="submit"
            disabled={creatingProduct || !newProductName.trim()}
            className="w-full px-3 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {creatingProduct ? "Creating…" : "Create product & select"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function BomMapWorkflow({
  products,
  initialProductId,
}: {
  products: Product[];
  initialProductId?: string | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"upload" | "mapping">("upload");
  const [importId, setImportId] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>("");
  const [rowCount, setRowCount] = useState(0);
  const [mappings, setMappings] = useState<MappingSuggestion[]>([]);
  const [conflictResolutions, setConflictResolutions] = useState<Record<string, string>>({});
  const [productList, setProductList] = useState<Product[]>(products);
  const [productId, setProductId] = useState<string | null>(initialProductId ?? null);
  const [newProductName, setNewProductName] = useState("");
  const [newProductSku, setNewProductSku] = useState("");
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [productCreateError, setProductCreateError] = useState<string | null>(null);
  const [resolvingColumn, setResolvingColumn] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    setProductCreateError(null);
    setCreatingProduct(true);
    const result = await createProductInline(newProductName, newProductSku || null);
    setCreatingProduct(false);
    if (result.success) {
      setProductList((prev) => [result.product, ...prev]);
      setProductId(result.product.id);
      setNewProductName("");
      setNewProductSku("");
      router.refresh();
    } else {
      setProductCreateError(result.error);
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.set("file", file);
    if (productId) formData.set("productId", productId);

    const result = await createBomImport(formData);

    setLoading(false);
    if (result.success) {
      setImportId(result.importId);
      setFilename(file.name);
      setRowCount(result.rowCount);
      setMappings(result.suggestions);
      setStep("mapping");
    } else {
      setError(result.error);
    }
    e.target.value = "";
  }

  function updateMapping(sourceColumn: string, targetFieldId: BomTargetOrUnmapped) {
    setMappings((prev) =>
      prev.map((m) => (m.sourceColumn === sourceColumn ? { ...m, targetFieldId } : m))
    );
    if (targetFieldId !== "_unmapped" && targetFieldId !== "_skip") {
      setConflictResolutions((prev) => ({ ...prev, [sourceColumn]: "percent" }));
    }
  }

  function resolveConflict(column: string, resolution: string) {
    const mapping = mappings.find((m) => m.sourceColumn === column);
    const targetField = mapping?.targetFieldId && mapping.targetFieldId !== "_unmapped" && mapping.targetFieldId !== "_skip"
      ? mapping.targetFieldId
      : column;
    setConflictResolutions((prev) => ({ ...prev, [targetField]: resolution }));
    setResolvingColumn(null);
  }

  async function handleFinalize() {
    if (!importId) return;

    const required = BOM_TARGET_FIELDS.filter((f) => f.required);
    const mappedTargets = new Set(mappings.filter((m) => m.targetFieldId && m.targetFieldId !== "_unmapped" && m.targetFieldId !== "_skip").map((m) => m.targetFieldId));
    const missingRequired = required.filter((r) => !mappedTargets.has(r.id));
    if (missingRequired.length > 0) {
      setError(`Required fields must be mapped: ${missingRequired.map((r) => r.label).join(", ")}`);
      return;
    }

    setError(null);
    setLoading(true);

    const columnMappings: ColumnMapping[] = mappings
      .filter((m) => m.targetFieldId !== "_unmapped" && m.targetFieldId !== "_skip")
      .map((m) => ({
        sourceColumn: m.sourceColumn,
        targetFieldId: m.targetFieldId as Exclude<BomTargetOrUnmapped, "_unmapped" | "_skip">,
        normalization:
          String(m.targetFieldId) === "mass_percent"
            ? ((conflictResolutions[m.sourceColumn] as "grams" | "milligrams" | "percent") ?? "percent")
            : undefined,
      }));

    try {
      const result = await finalizeBomMapping(importId, columnMappings, conflictResolutions, productId);
      if (result?.success) {
        router.push("/products");
      } else if (result) {
        setError(result.error);
      } else {
        setError("An unexpected error occurred");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to finalize mapping");
    } finally {
      setLoading(false);
    }
  }

  const matchedCount = mappings.filter((m) => m.targetFieldId !== "_unmapped" && m.targetFieldId !== "_skip").length;
  const ambiguousCount = mappings.filter((m) => m.conflict).length;
  const conflictRow = resolvingColumn ? mappings.find((m) => m.sourceColumn === resolvingColumn) : null;

  if (step === "upload") {
    return (
      <div className="pt-6 px-6 md:px-10 pb-12 max-w-[1600px] mx-auto">
        <div className="flex items-end justify-between mb-10 flex-col sm:flex-row gap-6">
          <div>
            <h2 className="text-4xl font-extrabold font-headline tracking-tight text-primary mb-2">
              BOM Mapping Workflow
            </h2>
            <p className="text-on-surface-variant max-w-xl font-body">
              Upload a CSV file to map columns to the EcoStratum schema. We&apos;ll auto-suggest mappings based on your headers.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-8">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-primary/30 rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-surface-container-low/50 transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <MaterialIcon name="cloud_upload" className="text-4xl text-primary mb-4" />
              <h3 className="font-headline font-bold text-lg text-on-surface mb-2">
                {loading ? "Uploading & parsing..." : "Upload CSV File"}
              </h3>
              <p className="text-sm text-on-surface-variant mb-4 font-body">
                Drag and drop or click to browse. Supports .csv files.
              </p>
              {error && (
                <p className="text-sm text-error mt-2">{error}</p>
              )}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-6">
            <ProductBomLinkPanel
              productList={productList}
              productId={productId}
              onProductChange={setProductId}
              newProductName={newProductName}
              newProductSku={newProductSku}
              onNewProductName={setNewProductName}
              onNewProductSku={setNewProductSku}
              onCreateProduct={handleCreateProduct}
              creatingProduct={creatingProduct}
              productCreateError={productCreateError}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-6 px-6 md:px-10 pb-12 max-w-[1600px] mx-auto">
      <div className="flex items-end justify-between mb-10 flex-col sm:flex-row gap-6">
        <div>
          <h2 className="text-4xl font-extrabold font-headline tracking-tight text-primary mb-2">
            BOM Mapping Workflow
          </h2>
          <p className="text-on-surface-variant max-w-xl font-body">
            Map your imported CSV columns to the EcoStratum data schema. Resolve conflicting identifiers to ensure regulatory integrity.
          </p>
          <p className="text-sm text-on-surface-variant mt-2 font-body">
            File: <strong>{filename}</strong> ({rowCount} rows)
          </p>
          <div className="mt-4 max-w-xl">
            <ProductBomLinkPanel
              productList={productList}
              productId={productId}
              onProductChange={setProductId}
              newProductName={newProductName}
              newProductSku={newProductSku}
              onNewProductName={setNewProductName}
              onNewProductSku={setNewProductSku}
              onCreateProduct={handleCreateProduct}
              creatingProduct={creatingProduct}
              productCreateError={productCreateError}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setStep("upload")}
            className="px-6 py-2.5 bg-surface-container-high text-on-secondary-container font-semibold rounded-md hover:bg-surface-container-highest transition-all flex items-center gap-2 font-body"
          >
            <MaterialIcon name="cloud_upload" className="text-lg" />
            Change Source
          </button>
          <button
            type="button"
            onClick={handleFinalize}
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary font-semibold rounded-md shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all flex items-center gap-2 font-body disabled:opacity-60"
          >
            {loading ? "Processing..." : "Finalize Mapping"}
            <MaterialIcon name="arrow_forward" className="text-lg" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-error-container/20 border border-error/30 text-error">
          {error}
        </div>
      )}

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <section className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-surface-container-low flex justify-between items-center flex-wrap gap-4">
              <h3 className="font-headline font-bold text-lg text-on-surface">
                Column Mapping &amp; Validation
              </h3>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-xs font-medium text-tertiary font-body">
                  <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim" /> {matchedCount} Matched
                </span>
                {ambiguousCount > 0 && (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-secondary font-body">
                    <span className="w-2 h-2 rounded-full bg-secondary-fixed-dim" /> {ambiguousCount} Ambiguous
                  </span>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-on-surface-variant text-xs font-bold uppercase tracking-widest font-body">
                    <th className="py-4 px-4">Source Field (CSV)</th>
                    <th className="py-4 px-4 w-12" />
                    <th className="py-4 px-4">EcoStratum Field</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mappings.map((row) => {
                    const info = statusInfo(row);
                    const hasConflict = !!row.conflict;
                    return (
                      <tr
                        key={row.sourceColumn}
                        className={`group transition-colors duration-150 ${
                          hasConflict ? "bg-secondary-container/20 hover:bg-secondary-container/30" : "hover:bg-surface-container-low"
                        } ${row.targetFieldId === "_unmapped" && row.confidence !== "high" ? "hover:bg-error-container/10" : ""}`}
                      >
                        <td className={`py-4 px-4 ${hasConflict ? "border-l-4 border-secondary" : ""}`}>
                          <p className="text-sm font-semibold font-body">{row.sourceColumn}</p>
                          {row.sample && (
                            <p className="text-[10px] text-outline italic font-body">Sample: &quot;{row.sample}&quot;</p>
                          )}
                        </td>
                        <td className="py-4 px-4 text-outline-variant">
                          <MaterialIcon
                            name={row.targetFieldId === "_unmapped" && row.confidence !== "high" ? "sync_problem" : "trending_flat"}
                            className={row.targetFieldId === "_unmapped" && row.confidence !== "high" ? "text-error" : hasConflict ? "text-secondary" : ""}
                          />
                        </td>
                        <td className="py-4 px-4">
                          <select
                            value={row.targetFieldId}
                            onChange={(e) => updateMapping(row.sourceColumn, e.target.value as BomTargetOrUnmapped)}
                            className={`inline-flex items-center gap-2 p-2 rounded-md border text-xs font-body ${
                              row.targetFieldId === "_unmapped" && row.confidence !== "high"
                                ? "bg-error-container border-error/20"
                                : hasConflict
                                  ? "bg-surface-container-highest border-secondary/20"
                                  : "bg-surface-container border-outline-variant/20"
                            }`}
                          >
                            {ALL_TARGET_OPTIONS.map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 ${info.cls} text-[10px] font-bold rounded-full flex items-center gap-1.5 w-fit font-body`}
                          >
                            <MaterialIcon
                              name={info.icon}
                              className="text-[14px]"
                              filled={info.icon === "check_circle"}
                            />
                            {info.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          {hasConflict ? (
                            <button
                              type="button"
                              onClick={() => setResolvingColumn(row.sourceColumn)}
                              className="px-3 py-1 bg-primary text-on-primary text-[10px] font-bold rounded hover:bg-primary-container transition-all font-body"
                            >
                              RESOLVE
                            </button>
                          ) : row.targetFieldId === "_unmapped" && row.confidence !== "high" ? (
                            <button
                              type="button"
                              className="text-error hover:text-error-container"
                              title="Map this column to proceed"
                            >
                              <MaterialIcon name="help" />
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="col-span-12 lg:col-span-4">
          <section className="bg-surface-container-low border border-outline-variant/10 rounded-xl overflow-hidden shadow-sm flex flex-col sticky top-24">
            <div className="bg-primary p-6 text-on-primary">
              <h3 className="font-headline font-bold text-lg mb-1">Conflict Resolver</h3>
              <p className="text-xs opacity-80 font-body">
                {conflictRow ? `Manual identification for "${resolvingColumn}"` : "Select a column with conflict to resolve"}
              </p>
            </div>
            <div className="p-6 flex-1 space-y-6">
              {conflictRow && conflictRow.conflict ? (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 font-body">
                      Detected Issue
                    </label>
                    <div className="bg-surface-container-lowest p-4 rounded-lg border border-secondary/20">
                      <p className="text-sm text-secondary font-medium leading-relaxed font-body">
                        {conflictRow.conflict}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest font-body">
                      Select Normalization Target
                    </label>
                    <button
                      type="button"
                      onClick={() => resolveConflict(conflictRow.sourceColumn, "grams")}
                      className={`w-full text-left p-4 rounded-lg border-2 flex flex-start gap-4 transition-all font-body ${
                        conflictResolutions[conflictRow.targetFieldId] === "grams" || conflictResolutions[conflictRow.sourceColumn] === "grams"
                          ? "bg-surface-container-highest border-primary"
                          : "bg-white border-outline-variant/30 hover:border-primary/50"
                      }`}
                    >
                      <div className="mt-1">
                        <div
                          className={`w-4 h-4 rounded-full border-4 ${
                            (conflictResolutions[conflictRow.targetFieldId] || conflictResolutions[conflictRow.sourceColumn]) === "grams" ? "border-primary bg-on-primary" : "border-outline-variant bg-white"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-primary">Standard Grams (g)</p>
                        <p className="text-xs text-on-surface-variant">Convert all mg values (x / 1000). Best for SCIP reporting.</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => resolveConflict(conflictRow.sourceColumn, "milligrams")}
                      className={`w-full text-left p-4 rounded-lg border-2 flex flex-start gap-4 transition-all font-body ${
                        conflictResolutions[conflictRow.targetFieldId] === "milligrams" || conflictResolutions[conflictRow.sourceColumn] === "milligrams"
                          ? "bg-surface-container-highest border-primary"
                          : "bg-white border-outline-variant/30 hover:border-primary/50"
                      }`}
                    >
                      <div className="mt-1">
                        <div
                          className={`w-4 h-4 rounded-full border-4 ${
                            (conflictResolutions[conflictRow.targetFieldId] || conflictResolutions[conflictRow.sourceColumn]) === "milligrams" ? "border-primary bg-on-primary" : "border-outline-variant bg-white"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface font-body">Milligrams (mg)</p>
                        <p className="text-xs text-on-surface-variant font-body">Keep values as-is in milligrams.</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => resolveConflict(conflictRow.sourceColumn, "percent")}
                      className={`w-full text-left p-4 rounded-lg border-2 flex flex-start gap-4 transition-all font-body ${
                        conflictResolutions[conflictRow.targetFieldId] === "percent" || conflictResolutions[conflictRow.sourceColumn] === "percent" || (!conflictResolutions[conflictRow.targetFieldId] && !conflictResolutions[conflictRow.sourceColumn])
                          ? "bg-surface-container-highest border-primary"
                          : "bg-white border-outline-variant/30 hover:border-primary/50"
                      }`}
                    >
                      <div className="mt-1">
                        <div
                          className={`w-4 h-4 rounded-full border-4 ${
                            (conflictResolutions[conflictRow.targetFieldId] || conflictResolutions[conflictRow.sourceColumn] || "percent") === "percent"
                              ? "border-primary bg-on-primary"
                              : "border-outline-variant bg-white"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface font-body">Percent (%)</p>
                        <p className="text-xs text-on-surface-variant font-body">Treat as mass percent (0–100).</p>
                      </div>
                    </button>
                  </div>
                  <div className="pt-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setResolvingColumn(null)}
                        className="flex-1 py-2 text-xs font-bold text-on-surface-variant bg-white rounded shadow-sm hover:bg-slate-50 transition-colors font-body"
                      >
                        SKIP
                      </button>
                      <button
                        type="button"
                        onClick={() => resolveConflict(conflictRow.sourceColumn, conflictResolutions[conflictRow.targetFieldId] ?? conflictResolutions[conflictRow.sourceColumn] ?? "percent")}
                        className="flex-[2] py-2 text-xs font-bold text-on-primary bg-primary rounded shadow-md hover:bg-primary-container transition-colors font-body"
                      >
                        RESOLVE CONFLICT
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-on-surface-variant font-body">
                  No conflict selected. Rows with ambiguous mappings show a <strong>RESOLVE</strong> button.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-tertiary-fixed-dim/10 rounded-xl flex items-center gap-5">
          <div className="w-12 h-12 bg-tertiary-fixed-dim/20 rounded-full flex items-center justify-center text-tertiary shrink-0">
            <MaterialIcon name="hub" className="text-2xl" filled />
          </div>
          <div>
            <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest font-body">Automatic Matching</p>
            <p className="text-sm font-medium font-body">Mappings are suggested based on header names and common patterns.</p>
          </div>
        </div>
        <div className="p-6 bg-primary/5 rounded-xl flex items-center gap-5">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
            <MaterialIcon name="science" className="text-2xl" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest font-body">Data Integrity</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden max-w-24">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${Math.round((matchedCount / Math.max(mappings.length, 1)) * 100)}%` }}
                />
              </div>
              <span className="text-xs font-bold font-body">
                {Math.round((matchedCount / Math.max(mappings.length, 1)) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
