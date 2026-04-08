import { requireProfile } from "@/lib/profile";
import { getSupplierOptions } from "@/app/suppliers/actions";
import ComponentsBulkUpload from "./ComponentsBulkUpload";

export default async function ComponentsBulkPage() {
  await requireProfile();
  const supplierOptions = await getSupplierOptions();

  return <ComponentsBulkUpload supplierOptions={supplierOptions} />;
}
