"use client";

import { useState, useRef } from "react";
import MaterialIcon from "@/components/ui/MaterialIcon";
import {
  bulkUpsertSuppliersFromCsv,
  previewSupplierCsv,
  type SupplierCsvPreviewResult,
} from "../actions";

export default function SuppliersBulkUpload() {
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<SupplierCsvPreviewResult | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [result, setResult] = useState<{
    importedSupplierNames: number;
    createdSuppliers: number;
    matchedComponents: number;
    createdContacts?: number;
    skippedRows?: number;
  } | null>(null);

  const [matchComponents, setMatchComponents] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function runPreview(file: File) {
    setError(null);
    setResult(null);
    setPreview(null);
    setPendingFile(null);
    setPreviewLoading(true);

    const formData = new FormData();
    formData.set("file", file);
    const res = await previewSupplierCsv(formData);
    setPreviewLoading(false);

    if (!res.success) {
      setError(res.error);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setPreview(res);
    setPendingFile(file);
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await runPreview(file);
    e.target.value = "";
  }

  async function runImport() {
    const file = pendingFile;
    if (!file) return;

    setError(null);
    setResult(null);
    setLoading(true);

    const formData = new FormData();
    formData.set("file", file);
    formData.set("match_components", String(matchComponents));

    const res = await bulkUpsertSuppliersFromCsv(formData);
    setLoading(false);

    if (!res.success) {
      setError(res.error);
      return;
    }

    setResult({
      importedSupplierNames: res.importedSupplierNames,
      createdSuppliers: res.createdSuppliers,
      matchedComponents: res.matchedComponents,
      createdContacts: res.createdContacts,
      skippedRows: res.skippedRows,
    });
    setPreview(null);
    setPendingFile(null);
  }

  return (
    <div className="pt-6 pb-16 px-6 md:px-12 max-w-5xl mx-auto">
      <header className="mb-8">
        <div className="flex items-end justify-between gap-6 flex-col sm:flex-row">
          <div>
            <h1 className="text-4xl font-headline font-extrabold tracking-tight text-primary mb-2">
              Bulk Upload Suppliers
            </h1>
            <p className="text-on-surface-variant font-body">
              Upload a simple CSV with <span className="font-bold">page</span> and{" "}
              <span className="font-bold">supplier_name</span>, or a contact export with{" "}
              <span className="font-bold">supplier_id</span>, <span className="font-bold">supplier_name</span>,{" "}
              contact fields, and optional <span className="font-bold">list_page</span> /{" "}
              <span className="font-bold">contact_href</span>. Preview runs automatically; confirm with{" "}
              <span className="font-bold">Import</span>.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-on-surface-variant">
              <input
                type="checkbox"
                checked={matchComponents}
                onChange={(e) => setMatchComponents(e.target.checked)}
              />
              Match to components
            </label>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8">
          <div
            className="border-2 border-dashed border-primary/30 rounded-xl p-10 text-center cursor-pointer hover:border-primary/50 hover:bg-surface-container-low/50 transition-all"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              id="supplier-bulk-file"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={onFileChange}
            />
            <MaterialIcon name="cloud_upload" className="text-4xl text-primary mb-4" />
            <h3 className="font-headline font-bold text-lg text-on-surface mb-2">
              {previewLoading ? "Previewing…" : loading ? "Importing…" : "Choose CSV"}
            </h3>
            <p className="text-sm text-on-surface-variant font-body">
              {pendingFile ? (
                <>
                  Ready: <span className="font-mono font-bold">{pendingFile.name}</span>
                </>
              ) : (
                "Select a file to preview rows before import."
              )}
            </p>
          </div>

          {error && (
            <div className="mt-6 p-4 rounded-lg bg-error-container/20 border border-error/30 text-error">
              {error}
            </div>
          )}

          {preview && preview.success && (
            <div className="mt-6 bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/10">
              <h3 className="text-lg font-bold text-primary font-headline mb-4">Preview</h3>
              <div className="space-y-2 text-sm text-on-surface-variant font-body mb-4">
                <div>
                  Format: <span className="font-bold text-on-surface">{preview.format}</span>
                </div>
                <div>
                  Rows in file: <span className="font-bold text-on-surface">{preview.rowCount}</span>
                </div>
                <div>
                  {preview.format === "simple" ? (
                    <>
                      Unique supplier names:{" "}
                      <span className="font-bold text-on-surface">{preview.uniqueCount}</span>
                    </>
                  ) : (
                    <>
                      Contact rows:{" "}
                      <span className="font-bold text-on-surface">{preview.uniqueCount}</span>
                    </>
                  )}
                </div>
              </div>
              {preview.warnings.length > 0 && (
                <ul className="mb-4 text-sm text-amber-800 dark:text-amber-200 list-disc pl-5 space-y-1">
                  {preview.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              )}
              <div className="overflow-x-auto border border-outline-variant/10 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-high/40">
                    <tr>
                      {Object.keys(preview.sample[0] ?? {}).map((k) => (
                        <th key={k} className="px-3 py-2 font-bold text-on-surface-variant">
                          {k}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.sample.map((row, i) => (
                      <tr key={i} className="border-t border-outline-variant/10">
                        {Object.values(row).map((cell, j) => (
                          <td key={j} className="px-3 py-2 text-on-surface max-w-[240px] truncate">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => runImport()}
                  disabled={loading || !pendingFile}
                  className="px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? "Importing…" : "Import"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreview(null);
                    setPendingFile(null);
                  }}
                  className="px-5 py-2.5 border border-outline-variant/20 rounded-xl text-sm font-bold hover:bg-surface-container-low"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {result && (
            <div className="mt-6 bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/10">
              <h3 className="text-lg font-bold text-primary font-headline mb-4">Import Summary</h3>
              <div className="space-y-2 text-sm text-on-surface-variant font-body">
                <div>
                  Rows in CSV:{" "}
                  <span className="font-bold text-on-surface">{result.importedSupplierNames}</span>
                </div>
                <div>
                  New suppliers created:{" "}
                  <span className="font-bold text-on-surface">{result.createdSuppliers}</span>
                </div>
                {result.createdContacts != null && (
                  <div>
                    Contacts added:{" "}
                    <span className="font-bold text-on-surface">{result.createdContacts}</span>
                  </div>
                )}
                {result.skippedRows != null && result.skippedRows > 0 && (
                  <div className="text-amber-800 dark:text-amber-200">
                    Rows skipped (no matching supplier):{" "}
                    <span className="font-bold">{result.skippedRows}</span>
                  </div>
                )}
                <div>
                  Components matched (name/description):{" "}
                  <span className="font-bold text-on-surface">{result.matchedComponents}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="col-span-12 lg:col-span-4">
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/10">
            <h3 className="text-lg font-bold text-primary font-headline mb-3">CSV formats</h3>
            <p className="text-sm text-on-surface-variant font-body mb-3">
              <span className="font-bold">Simple list:</span>{" "}
              <span className="font-bold">page</span>, <span className="font-bold">supplier_name</span> (or no
              headers: column 2 = supplier name).
            </p>
            <div className="mb-4 bg-white/60 border border-outline-variant/10 rounded-lg p-3 text-xs font-mono text-on-surface-variant overflow-auto">
              page,supplier_name
              <br />
              1,Acme Components Inc.
              <br />
              2,Texas Instruments
            </div>
            <p className="text-sm text-on-surface-variant font-body mb-2">
              <span className="font-bold">With contacts:</span> include{" "}
              <span className="font-bold">supplier_id</span> (your Rivet UUID when known),{" "}
              <span className="font-bold">supplier_name</span>, and at least one of{" "}
              <span className="font-bold">contact_name</span>, <span className="font-bold">email</span>,{" "}
              <span className="font-bold">phone</span>. Optional: <span className="font-bold">list_page</span>,{" "}
              <span className="font-bold">contact_href</span>.
            </p>
            <div className="bg-white/60 border border-outline-variant/10 rounded-lg p-3 text-xs font-mono text-on-surface-variant overflow-auto whitespace-pre-wrap break-all">
              supplier_id,supplier_name,list_page,contact_name,email,phone,contact_href
              <br />
              ,Acme Inc.,1,Jane Doe,jane@acme.com,555-0100,https://...
            </div>
            <p className="text-xs text-on-surface-variant mt-3 font-body">
              Matching components updates only components where <span className="font-bold">supplier_id</span>{" "}
              is currently empty. Max file size {Math.round(5)} MB.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
