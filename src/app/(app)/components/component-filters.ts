/** URL `match=`: components with / without a supplier assigned */
export type ComponentLinkMatchFilter = "all" | "with_supplier" | "without_supplier";

export function parseComponentMatch(v: string | undefined): ComponentLinkMatchFilter {
  if (v === "with_supplier" || v === "without_supplier") return v;
  return "all";
}
