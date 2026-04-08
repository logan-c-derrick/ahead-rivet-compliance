import { requireProfile } from "@/lib/profile";
import SuppliersBulkUpload from "./SuppliersBulkUpload";

export default async function SuppliersBulkUploadPage() {
  await requireProfile();
  return <SuppliersBulkUpload />;
}

