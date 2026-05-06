import { requireProfile } from "@/lib/profile";
import { getProduct, getProductBomComponents, type ProductBomComponent } from "../actions";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductDetailTabs from "./product-detail-tabs";
import {
  getProductComplianceTable,
  getProductReleaseStatuses,
  type ProductRegulationStatusRow,
  type ProductReleaseStatusRow,
} from "../compliance";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

function isTabId(tab: string | undefined): tab is "overview" | "bom" | "regulations" | "compliance" | "outreach" {
  return tab === "overview" || tab === "bom" || tab === "regulations" || tab === "compliance" || tab === "outreach";
}

export default async function ProductDetailPage({ params, searchParams }: Props) {
  await requireProfile();
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const { tab } = await searchParams;
  const activeTab = isTabId(tab) ? tab : "overview";

  const [complianceRows, releaseRows, bomRows]: [
    ProductRegulationStatusRow[],
    ProductReleaseStatusRow[],
    ProductBomComponent[],
  ] = await Promise.all([
    getProductComplianceTable(product.id),
    getProductReleaseStatuses(product.id),
    getProductBomComponents(product.id),
  ]);

  return (
    <div className="p-8 space-y-8">
      <header className="flex justify-between items-start gap-8">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-2 text-xs text-on-surface-variant font-body">
            <span className="font-medium">Compliance Portal</span>
            <span className="opacity-60">/</span>
            <span className="font-semibold text-primary">Product Detail</span>
          </div>
          <div>
            <h1 className="text-4xl font-headline font-extrabold tracking-tight text-primary">
              {product.name}
            </h1>
            <p className="text-lg text-on-surface-variant mt-2 max-w-2xl leading-relaxed font-body">
              {product.description ?? "—"}
            </p>
          </div>

          <div className="flex flex-wrap gap-8 pt-2">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                SKU
              </span>
              <span className="text-primary font-semibold">{product.sku ?? "—"}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                Category
              </span>
              <span className="text-primary font-semibold">{product.category ?? "—"}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                Lifecycle
              </span>
              <span className="text-primary font-semibold">{product.lifecycle_status}</span>
            </div>
            {product.oem_vendor && (
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                  OEM Vendor
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700">
                    OEM
                  </span>
                  <span className="text-primary font-semibold">{product.oem_vendor.name}</span>
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 min-w-[220px]">
          <Link
            href={`/products?edit=${product.id}`}
            className="w-full text-center bg-primary text-on-primary px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
          >
            Edit Product
          </Link>
          <Link
            href="/products"
            className="w-full text-center bg-surface-container-lowest text-primary px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-surface-container-low transition-colors"
          >
            Back to Products
          </Link>
        </div>
      </header>

      <ProductDetailTabs
        product={product}
        complianceRows={complianceRows}
        releaseRows={releaseRows}
        bomRows={bomRows}
        activeTab={activeTab}
      />
    </div>
  );
}
