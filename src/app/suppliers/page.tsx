import { requireProfile } from "@/lib/profile";
import { getSuppliersPage, getSupplierWithCount, type SupplierWithCount } from "./actions";
import { parseSupplierListFilter } from "./supplier-filters";
import SuppliersListWithModals from "./suppliers-list-with-modals";

type Props = {
  searchParams: Promise<{ edit?: string; page?: string; match?: string }>;
};

const PAGE_SIZE = 50;

export default async function SuppliersPage({ searchParams }: Props) {
  await requireProfile();
  const { edit: editId, page: pageParam, match: matchParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const match = parseSupplierListFilter(matchParam);
  const { suppliers, total, page: resolvedPage, pageSize } = await getSuppliersPage(
    page,
    PAGE_SIZE,
    match
  );

  let editPrefetch: SupplierWithCount | null = null;
  if (editId && !suppliers.some((s) => s.id === editId)) {
    editPrefetch = await getSupplierWithCount(editId);
  }

  return (
    <SuppliersListWithModals
      suppliers={suppliers}
      editId={editId ?? null}
      editPrefetch={editPrefetch}
      total={total}
      page={resolvedPage}
      pageSize={pageSize}
      match={match}
    />
  );
}
