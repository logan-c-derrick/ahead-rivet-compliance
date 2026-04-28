import { Suspense } from "react";
import { requireProfile } from "@/lib/profile";
import { getComponents } from "./actions";
import { parseComponentMatch } from "./component-filters";
import { getSupplierOptions } from "../suppliers/actions";
import ComponentsListWithModals from "./components-list-with-modals";

type Props = {
  searchParams: Promise<{ edit?: string; supplier?: string; match?: string; cpage?: string }>;
};

export default async function ComponentsPage({ searchParams }: Props) {
  await requireProfile();
  const [components, supplierOptions, sp] = await Promise.all([
    getComponents(),
    getSupplierOptions(),
    searchParams,
  ]);
  const editId = sp.edit ?? null;
  const supplierFilter = typeof sp.supplier === "string" ? sp.supplier : "";
  const linkMatch = parseComponentMatch(sp.match);
  const initialPage = Math.max(1, parseInt(sp.cpage ?? "1", 10) || 1);

  return (
    <Suspense
      fallback={
        <div className="p-8 text-on-surface-variant text-sm">Loading components…</div>
      }
    >
      <ComponentsListWithModals
        components={components}
        supplierOptions={supplierOptions}
        editId={editId}
        supplierFilter={supplierFilter}
        linkMatch={linkMatch}
        initialPage={initialPage}
      />
    </Suspense>
  );
}
