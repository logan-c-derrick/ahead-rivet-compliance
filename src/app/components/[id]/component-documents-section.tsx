import {
  addSignedDownloadUrls,
  getSupplierDocumentsForComponent,
} from "@/lib/supplier-documents";
import { SupplierDocumentsList } from "@/components/supplier-documents-list";

export async function ComponentDocumentsSection({ componentId }: { componentId: string }) {
  const raw = await getSupplierDocumentsForComponent(componentId);
  const withUrls = await addSignedDownloadUrls(raw);
  const missingUrl = withUrls.some((d) => d.downloadUrl === null);

  const items = withUrls.map((d) => ({
    id: d.id,
    filename: d.filename,
    document_type: d.document_type,
    created_at: d.created_at,
    downloadUrl: d.downloadUrl,
    subtitle: d.regulationName,
    outreachRequestHref: `/outreach/requests/${d.outreach_request_id}`,
  }));

  return (
    <SupplierDocumentsList
      title="Supplier documents (outreach)"
      emptyMessage="No supplier uploads yet. Files appear here after a supplier submits through an outreach link."
      items={items}
      showServiceRoleHint={missingUrl && raw.length > 0}
    />
  );
}
