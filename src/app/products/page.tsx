import { canManageSensitiveActions } from "@/lib/permissions";
import { requireProfile } from "@/lib/profile";
import { getProducts, getOemVendors } from "./actions";
import BomManagement from "./bom-management";

type Props = {
  searchParams: Promise<{ edit?: string }>;
};

export default async function ProductsPage({ searchParams }: Props) {
  const profile = await requireProfile();
  const [products, oemVendors] = await Promise.all([getProducts(), getOemVendors()]);
  const { edit: editId } = await searchParams;

  return (
    <BomManagement
      products={products}
      editId={editId ?? null}
      canManage={canManageSensitiveActions(profile.role)}
      oemVendors={oemVendors}
    />
  );
}
