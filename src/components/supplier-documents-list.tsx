import Link from "next/link";
import MaterialIcon from "@/components/ui/MaterialIcon";

export type SupplierDocumentListItem = {
  id: string;
  filename: string | null;
  document_type: string | null;
  created_at: string;
  downloadUrl: string | null;
  /** Extra context line (e.g. regulation) */
  subtitle?: string | null;
  /** Link to outreach request detail */
  outreachRequestHref?: string | null;
};

export function SupplierDocumentsList({
  title,
  emptyMessage,
  items,
  showServiceRoleHint,
}: {
  title: string;
  emptyMessage: string;
  items: SupplierDocumentListItem[];
  /** Show when signed URLs could not be created */
  showServiceRoleHint?: boolean;
}) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-primary font-headline flex items-center gap-2">
          <MaterialIcon name="folder_open" className="text-sm" />
          {title}
        </h2>
      </div>

      {showServiceRoleHint && items.length > 0 && (
        <p className="text-xs text-on-surface-variant mb-4 rounded-lg bg-secondary-fixed-dim/10 px-3 py-2">
          Downloads need{" "}
          <code className="text-[10px] bg-surface-container-high px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
          on the server to sign file URLs.
        </p>
      )}

      {items.length === 0 ? (
        <div className="p-8 text-center text-on-surface-variant text-sm">{emptyMessage}</div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-outline-variant/15 bg-surface-container-low/40 px-4 py-3 hover:bg-surface-container-low transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-error-container/30 flex items-center justify-center text-error shrink-0">
                <MaterialIcon name="description" className="text-lg" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-primary truncate">
                  {item.filename ?? "Document"}
                </p>
                <p className="text-[11px] text-on-surface-variant">
                  {item.document_type ?? "file"}
                  {" · "}
                  {new Date(item.created_at).toLocaleString()}
                  {item.subtitle ? ` · ${item.subtitle}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {item.outreachRequestHref && (
                  <Link
                    href={item.outreachRequestHref}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Request
                  </Link>
                )}
                {item.downloadUrl ? (
                  <a
                    href={item.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-on-primary hover:opacity-90"
                  >
                    <MaterialIcon name="download" className="text-sm" />
                    Download
                  </a>
                ) : (
                  <span className="text-[10px] text-on-surface-variant">Download unavailable</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
