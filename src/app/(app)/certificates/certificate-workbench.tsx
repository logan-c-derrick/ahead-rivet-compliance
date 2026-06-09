"use client";

import { useState } from "react";
import Link from "next/link";
import MaterialIcon from "@/components/ui/MaterialIcon";
import {
  generateCertificatePdfAction,
  submitCertificateSignatureForm,
  submitCertificateTemplateForm,
  type OrgCertificateSettings,
} from "./actions";

type ProductOpt = { id: string; name: string };
type RegOpt = { id: string; code: string; name: string };

export default function CertificateWorkbench({
  products,
  regulations,
  settings,
}: {
  products: ProductOpt[];
  regulations: RegOpt[];
  settings: OrgCertificateSettings | null;
}) {
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [batch, setBatch] = useState("");
  const [selectedRegs, setSelectedRegs] = useState<Record<string, boolean>>(() => {
    const o: Record<string, boolean> = {};
    regulations.slice(0, 4).forEach((r) => {
      o[r.id] = true;
    });
    return o;
  });
  const [pdfLoading, setPdfLoading] = useState(false);

  function toggleReg(id: string) {
    setSelectedRegs((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function onDownloadPdf() {
    setPdfLoading(true);
    const ids = Object.entries(selectedRegs)
      .filter(([, v]) => v)
      .map(([k]) => k);
    const fd = new FormData();
    fd.set("product_id", productId);
    fd.set("batch_serial", batch);
    fd.set("regulation_ids", JSON.stringify(ids));
    const res = await generateCertificatePdfAction(fd);
    setPdfLoading(false);
    if (!res.success) {
      alert(res.error);
      return;
    }
    const bin = atob(res.base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = res.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid grid-cols-12 gap-8 items-start">
      <section className="col-span-12 lg:col-span-5 space-y-6">
        <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm space-y-6">
          <h3 className="font-headline font-bold text-lg text-on-surface border-b border-surface-container-low pb-3">
            Template & signature
          </h3>
          <form action={submitCertificateTemplateForm} className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Signer title (printed under signature)
            </label>
            <input
              name="certificate_signer_title"
              defaultValue={settings?.certificate_signer_title ?? ""}
              placeholder="Chief Compliance Officer"
              className="w-full bg-surface-container-low border-none rounded-lg p-3 text-sm"
            />
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Body text (optional). Placeholders: {"{{product_name}}"}, {"{{batch_serial}}"},{" "}
              {"{{organization}}"}
            </label>
            <textarea
              name="certificate_template_body"
              defaultValue={settings?.certificate_template_body ?? ""}
              rows={6}
              className="w-full bg-surface-container-low border-none rounded-lg p-3 text-sm font-mono"
              placeholder="Leave blank for a simple default layout."
            />
            <button
              type="submit"
              className="text-sm font-bold text-primary hover:underline"
            >
              Save template
            </button>
          </form>

          <form action={submitCertificateSignatureForm} className="space-y-2 border-t border-surface-container-low pt-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Signature image (PNG)
            </label>
            <input name="signature" type="file" accept="image/png" className="text-sm" />
            <button type="submit" className="text-sm font-bold text-primary hover:underline">
              Upload signature
            </button>
            {settings?.certificate_signature_storage_path && (
              <p className="text-xs text-tertiary-fixed-dim">Signature on file.</p>
            )}
          </form>
        </div>

        <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-surface-container-low pb-4">
            <span className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-sm">
              1
            </span>
            <h3 className="font-headline font-bold text-lg text-on-surface">Product & batch</h3>
          </div>
          <div className="space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Product
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-lg p-3 text-sm"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Batch / serial
            </label>
            <input
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-lg p-3 text-sm"
              placeholder="BATCH-2026-001"
            />
          </div>
        </div>

        <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-surface-container-low pb-4">
            <span className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-sm">
              2
            </span>
            <h3 className="font-headline font-bold text-lg text-on-surface">Regulations</h3>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {regulations.map((r) => (
              <label
                key={r.id}
                className="flex items-start gap-3 p-3 bg-surface-container-low rounded-lg cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={!!selectedRegs[r.id]}
                  onChange={() => toggleReg(r.id)}
                  className="mt-1"
                />
                <div>
                  <div className="text-sm font-bold font-body">{r.code}</div>
                  <div className="text-xs text-on-surface-variant">{r.name}</div>
                </div>
              </label>
            ))}
            {regulations.length === 0 && (
              <p className="text-sm text-on-surface-variant">No regulations in the library.</p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onDownloadPdf()}
          disabled={pdfLoading || !productId}
          className="w-full bg-gradient-to-br from-primary to-primary-container text-white py-4 px-6 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
        >
          <MaterialIcon name="download" />
          {pdfLoading ? "Building PDF…" : "Download PDF"}
        </button>
      </section>

      <section className="col-span-12 lg:col-span-7">
        <div className="bg-white border border-outline-variant/15 shadow-xl rounded-xl overflow-hidden p-8 aspect-[1/1.414] flex flex-col text-slate-700">
          <p className="text-xs font-bold uppercase text-slate-400 mb-4">Preview</p>
          <p className="text-sm leading-relaxed flex-1">
            Configure the template and signature on the left, select a product and regulations, then
            download a PDF. The preview panel here stays static; the downloaded file reflects your
            settings.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary"
          >
            <MaterialIcon name="inventory_2" className="text-base" />
            Product catalog
          </Link>
        </div>
      </section>
    </div>
  );
}
