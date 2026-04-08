import { requireProfile } from "@/lib/profile";
import { getProducts } from "./actions";
import BomManagement from "./bom-management";

type Props = {
  searchParams: Promise<{ edit?: string }>;
};

export default async function ProductsPage({ searchParams }: Props) {
  await requireProfile();
  const products = await getProducts();
  const { edit: editId } = await searchParams;

  return (
    <BomManagement
      products={products}
      editId={editId ?? null}
    />
  );
}
