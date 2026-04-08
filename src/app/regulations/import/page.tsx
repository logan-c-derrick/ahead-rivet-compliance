"use client";

import { useState } from "react";
import Link from "next/link";
import MaterialIcon from "@/components/ui/MaterialIcon";
import { importRegulationsFromCsv } from "../actions";

export default function RegulationsImportPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ inserted: number; updated: number } | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResult(null);
    setLoading(true);
    const fd = new FormData();
    fd.set("file", file);
    const res = await importRegulationsFromCsv(fd);
    setLoading(false);
    e.target.value = "";
    if (!res.success) {
      setError(res.error);
      return;
    }
    setResult({ inserted: res.inserted, updated: res.updated });
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <nav className="flex gap-2 text-xs text-on-surface-variant">
        <Link href="/regulations" className="hover:text-primary font-medium">
          Regulations
        </Link>
        <span className="opacity-50">/</span>
        <span className="font-semibold text-primary">Import CSV</span>
      </nav>

      <header>
        <h1 className="text-3xl font-headline font-extrabold text-primary">Import regulations (CSV)</h1>
        <p className="text-on-surface-variant mt-2 text-sm">
          Upsert by <span className="font-bold">code</span>. Include optional source dates for library display.
        </p>
      </header>

      <div
        className="border-2 border-dashed border-primary/30 rounded-xl p-10 text-center cursor-pointer hover:bg-surface-container-low/50"
        onClick={() => document.getElementById("reg-csv")?.click()}
      >
        <input id="reg-csv" type="file" accept=".csv" className="hidden" onChange={onFile} />
        <MaterialIcon name="cloud_upload" className="text-4xl text-primary mb-3" />
        <p className="font-bold text-on-surface">{loading ? "Importing…" : "Choose CSV"}</p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-error-container/20 text-error text-sm">{error}</div>
      )}

      {result && (
        <div className="p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/10 text-sm">
          Inserted <span className="font-bold">{result.inserted}</span>, updated{" "}
          <span className="font-bold">{result.updated}</span>.
          <Link href="/regulations" className="block mt-4 font-bold text-primary hover:underline">
            Back to library
          </Link>
        </div>
      )}

      <div className="text-xs font-mono bg-surface-container-low p-4 rounded-lg overflow-auto">
        code,name,jurisdiction,effective_date,source_first_published_at,source_last_updated_at,description
        <br />
        RoHS,Restriction of Hazardous Substances,EU,2011-07-21,2011-01-03,2023-06-15,Example row
      </div>
    </div>
  );
}
