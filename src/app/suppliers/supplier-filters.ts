/** URL/query param: `match=with_components` | `without_components` | omit for all */
export type SupplierListFilter = "all" | "with_components" | "without_components";

export function parseSupplierListFilter(v: string | undefined): SupplierListFilter {
  if (v === "with_components" || v === "without_components") return v;
  return "all";
}
