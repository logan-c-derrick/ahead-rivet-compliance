"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import MaterialIcon from "@/components/ui/MaterialIcon";
import {
  previewComponentCsv,
  importComponentsFromCsv,
  type ComponentCsvPreviewRow,
} from "../actions";

const RESOLUTION_NONE = "__none__";

export default function ComponentsBulkUpload({
  supplierOptions,
}: {
  supplierOptions: { id: string; name: string }[];
}) {
  const [previewLoading, setPreviewLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<ComponentCsvPreviewRow[] | null>(null);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [resolutions, setResolutions] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{
    upserted: number;
    unresolvedSkipped: number;
    duplicateSkipped: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function setResolution(rowIndex: number, value: string) {
    setResolutions((prev) => {
      const next = { ...prev };
      if (!value) delete next[String(rowIndex)];
      else next[String(rowIndex)] = value;
      return next;
    });
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResult(null);
    setPreviewRows(null);
    setResolutions({});
    setPreviewLoading(true);

    const fd = new FormData();
    fd.set("file", file);
    const res = await previewComponentCsv(fd);
    setPreviewLoading(false);
    e.target.value = "";

    if (!res.success) {
      setError(res.error);
      return;
    }

    setPreviewRows(res.rows);
    setParseWarnings(res.parseWarnings);
    setPendingFile(file);
  }

  async function runImport() {
    if (!pendingFile) return;
    setError(null);
    setImportLoading(true);

    const fd = new FormData();
    fd.set("file", pendingFile);
    fd.set("resolutions", JSON.stringify(resolutions));

    const res = await importComponentsFromCsv(fd);
    setImportLoading(false);

    if (!res.success) {
      setError(res.error);
      return;
    }

    setResult({
      upserted: res.upserted,
      unresolvedSkipped: res.unresolvedSkipped,
      duplicateSkipped: res.duplicateSkipped,
    });
    setPreviewRows(null);
    setPendingFile(null);
    setResolutions({});
  }

  const needsResolution = (r: ComponentCsvPreviewRow) =>
    r.supplierMatch === "unresolved" || r.supplierMatch === "ambiguous";

  return (
    <div className="pt-6 pb-16 px-6 md:px-12 max-w-6xl mx-auto">
      <header className="mb-8">
        <nav className="flex gap-2 text-xs text-on-surface-variant mb-3">
          <Link href="/components" className="hover:text-primary font-medium">
            Components
          </Link>
          <span className="opacity-50">/</span>
          <span className="font-semibold text-primary">Bulk CSV</span>
        </nav>
        <h1 className="text-4xl font-headline font-extrabold tracking-tight text-primary mb-2">
          Import Components (CSV)
        </h1>
        <p className="text-on-surface-variant font-body max-w-3xl">
          Required columns include <span className="font-bold">name</span>. Include{" "}
          <span className="font-bold">part_number</span> and{" "}
          <span className="font-bold">manufacturer_sku</span> (aliases: mfr_sku, sku). Link suppliers with{" "}
          <span className="font-bold">supplier_id</span> or <span className="font-bold">supplier_name</span>. Rows
          that do not match a supplier can be resolved below or imported without a supplier link.
        </p>
      </header>

      <div
        className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-surface-container-low/50 transition-all mb-8"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={onFileChange}
        />
        <MaterialIcon name="upload_file" className="text-4xl text-primary mb-3" />
        <h3 className="font-headline font-bold text-lg text-on-surface mb-1">
          {previewLoading ? "Parsing…" : "Select CSV"}
        </h3>
        <p className="text-sm text-on-surface-variant">
          {pendingFile ? (
            <>
              Loaded: <span className="font-mono font-bold">{pendingFile.name}</span>
            </>
          ) : (
            "Upload to preview and resolve suppliers."
          )}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-error-container/20 border border-error/30 text-error text-sm">{error}</div>
      )}

      {parseWarnings.length > 0 && (
        <ul className="mb-6 text-sm text-amber-800 dark:text-amber-200 list-disc pl-5 space-y-1">
          {parseWarnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}

      {previewRows && (
        <div className="space-y-6">
          <div className="overflow-x-auto border border-outline-variant/15 rounded-xl bg-surface-container-lowest shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-high/40 text-[11px] uppercase tracking-widest text-on-secondary-fixed-variant">
                <tr>
                  <th className="px-3 py-3">#</th>
                  <th className="px-3 py-3">Name</th>
                  <th className="px-3 py-3">Part #</th>
                  <th className="px-3 py-3">Mfr SKU</th>
                  <th className="px-3 py-3">Supplier match</th>
                  <th className="px-3 py-3 min-w-[200px]">Resolve</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((r) => (
                  <tr key={r.rowIndex} className="border-t border-outline-variant/10 align-top">
                    <td className="px-3 py-3 text-on-surface-variant font-mono text-xs">{r.rowIndex}</td>
                    <td className="px-3 py-3 font-bold text-primary">{r.name}</td>
                    <td className="px-3 py-3 text-on-surface-variant">{r.part_number}</td>
                    <td className="px-3 py-3 font-mono text-xs">{r.manufacturer_sku}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`text-xs font-bold uppercase ${
                          r.supplierMatch === "resolved"
                            ? "text-tertiary-fixed-dim"
                            : r.supplierMatch === "none"
                              ? "text-on-surface-variant"
                              : "text-amber-800 dark:text-amber-200"
                        }`}
                      >
                        {r.supplierMatch}
                      </span>
                      {r.supplierHint && (
                        <div className="text-xs text-on-surface-variant mt-1">{r.supplierHint}</div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {needsResolution(r) ? (
                        <select
                          value={resolutions[String(r.rowIndex)] ?? ""}
                          onChange={(e) => setResolution(r.rowIndex, e.target.value)}
                          className="w-full max-w-xs px-2 py-2 rounded-lg bg-surface-container-low border border-outline-variant/20 text-sm"
                        >
                          <option value="">— Skip row —</option>
                          <option value={RESOLUTION_NONE}>Import without supplier</option>
                          {supplierOptions.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-on-surface-variant">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => runImport()}
              disabled={importLoading || !pendingFile}
              className="px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50"
            >
              {importLoading ? "Importing…" : "Import components"}
            </button>
            <button
              type="button"
              onClick={() => {
                setPreviewRows(null);
                setPendingFile(null);
                setResolutions({});
              }}
              className="px-5 py-2.5 border border-outline-variant/20 rounded-xl text-sm font-bold hover:bg-surface-container-low"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-8 bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/10">
          <h3 className="text-lg font-bold text-primary font-headline mb-2">Import complete</h3>
          <p className="text-sm text-on-surface-variant">
            Upserted <span className="font-bold text-on-surface">{result.upserted}</span> row(s).
            {result.unresolvedSkipped > 0 ? (
              <>
                {" "}
                Skipped <span className="font-bold">{result.unresolvedSkipped}</span> row(s) that still needed a
                supplier assignment.
              </>
            ) : null}
            {result.duplicateSkipped > 0 ? (
              <>
                {" "}
                Ignored <span className="font-bold">{result.duplicateSkipped}</span> duplicate row(s) from the
                upload.
              </>
            ) : null}
          </p>
          <Link href="/components" className="inline-block mt-4 text-sm font-bold text-primary hover:underline">
            Back to components
          </Link>
        </div>
      )}
    </div>
  );
}
