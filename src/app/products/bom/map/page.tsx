import { requireProfile } from "@/lib/profile";
import { getProducts } from "@/app/products/actions";
import BomMapWorkflow from "./BomMapWorkflow";

type Props = {
  searchParams: Promise<{ productId?: string }>;
};

export default async function BomMappingPage({ searchParams }: Props) {
  await requireProfile();
  const products = await getProducts();
  const { productId: initialProductId } = await searchParams;

  return (
    <BomMapWorkflow
      products={products}
      initialProductId={initialProductId ?? null}
    />
  );
}
