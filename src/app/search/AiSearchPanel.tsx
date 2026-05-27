"use client";

import { useState } from "react";
import Link from "next/link";
import MaterialIcon from "@/components/ui/MaterialIcon";
import { aiNaturalLanguageSearch, type SearchResultItem } from "./actions";

const EXAMPLES = [
  "Components missing manufacturer SKU",
  "Active products with OEM vendor",
  "Capacitors from unknown manufacturers",
  "Components in the Storage category",
];

export default function AiSearchPanel() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    results: SearchResultItem[];
    explanation: string;
    query: string;
  } | null>(null);

  async function runSearch(q?: string) {
    const searchQuery = (q ?? query).trim();
    if (!searchQuery) return;
    setLoading(true);
    setError(null);
    if (q) setQuery(q);
    const res = await aiNaturalLanguageSearch(searchQuery);
    setLoading(false);
    if (!res.ok) { setError(res.error); return; }
    setResult({ results: res.results, explanation: res.explanation, query: res.query });
  }

  const components = result?.results.filter((r) => r.type === "component") ?? [];
  const products = result?.results.filter((r) => r.type === "product") ?? [];

  return (
    <div className="space-y-6">
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MaterialIcon name="manage_search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }}
              placeholder='e.g. "components missing manufacturer SKU" or "active products with OEM vendor"'
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            type="button"
            onClick={() => runSearch()}
            disabled={loading || !query.trim()}
            className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-on-primary rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-40 shrink-0"
          >
            {loading ? (
              <><div className="w-4 h-4 rounded-full border-2 border-on-primary border-t-transparent animate-spin" />Searching…</>
            ) : (
              <><MaterialIcon name="auto_awesome" className="text-sm" />Search</>
            )}
          </button>
        </div>

        {!result && !loading && (
          <div className="space-y-2">
            <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">Try asking</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => runSearch(ex)}
                  className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-300 bg-error-container/20 p-3 text-sm text-error">{error}</div>
      )}

      {result && (
        <div className="space-y-5">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-container-low border border-outline-variant/10">
            <MaterialIcon name="info" className="text-primary text-lg shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-on-surface">{result.explanation}</p>
              <p className="text-xs text-on-surface-variant mt-1">
                Found <strong>{result.results.length}</strong> result{result.results.length !== 1 ? "s" : ""} for <em>&ldquo;{result.query}&rdquo;</em>
              </p>
            </div>
          </div>

          {result.results.length === 0 && (
            <div className="rounded-xl border border-outline-variant/15 p-8 text-center text-sm text-on-surface-variant">
              No matching items found. Try a different query.
            </div>
          )}

          {components.length > 0 && (
            <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
              <div className="px-6 py-3 bg-surface-container-low border-b border-outline-variant/10 flex items-center gap-2">
                <MaterialIcon name="settings_input_component" className="text-sm text-primary" />
                <h3 className="text-sm font-bold text-primary">Components ({components.length})</h3>
              </div>
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-[11px] font-extrabold uppercase tracking-widest text-on-secondary-fixed-variant border-b border-outline-variant/10">
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Part #</th>
                    <th className="px-6 py-3">Manufacturer</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3">Match reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {components.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-container-low align-top">
                      <td className="px-6 py-3 font-medium">
                        <Link href={`/components/${c.id}`} className="text-primary hover:underline">{c.name}</Link>
                      </td>
                      <td className="px-6 py-3 text-on-surface-variant font-mono text-xs">{c.part_number ?? "—"}</td>
                      <td className="px-6 py-3 text-on-surface-variant">{c.manufacturer ?? "—"}</td>
                      <td className="px-6 py-3 text-on-surface-variant">{c.category ?? "—"}</td>
                      <td className="px-6 py-3 text-on-surface-variant text-xs italic">{c.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {products.length > 0 && (
            <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
              <div className="px-6 py-3 bg-surface-container-low border-b border-outline-variant/10 flex items-center gap-2">
                <MaterialIcon name="inventory_2" className="text-sm text-primary" />
                <h3 className="text-sm font-bold text-primary">Products ({products.length})</h3>
              </div>
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-[11px] font-extrabold uppercase tracking-widest text-on-secondary-fixed-variant border-b border-outline-variant/10">
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">SKU</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3">Match reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-surface-container-low align-top">
                      <td className="px-6 py-3 font-medium">
                        <Link href={`/products/${p.id}`} className="text-primary hover:underline">{p.name}</Link>
                      </td>
                      <td className="px-6 py-3 text-on-surface-variant font-mono text-xs">{p.sku ?? "—"}</td>
                      <td className="px-6 py-3 text-on-surface-variant">{p.category ?? "—"}</td>
                      <td className="px-6 py-3 text-on-surface-variant text-xs italic">{p.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
