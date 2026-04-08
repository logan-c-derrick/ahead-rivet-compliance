"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/profile";
import { buildDeclarationPdf } from "@/lib/certificate-pdf";

const BUCKET = "outreach-uploads";

export type OrgCertificateSettings = {
  certificate_template_body: string | null;
  certificate_signer_title: string | null;
  certificate_signature_storage_path: string | null;
};

export async function getOrgCertificateSettings(): Promise<OrgCertificateSettings | null> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select(
      "certificate_template_body, certificate_signer_title, certificate_signature_storage_path"
    )
    .eq("id", profile.organization_id)
    .single();

  if (error || !data) return null;
  return data as OrgCertificateSettings;
}

export type UpdateTemplateState = { error?: string; ok?: boolean };

/** Form action wrapper (single FormData argument) for certificate template fields. */
export async function submitCertificateTemplateForm(formData: FormData): Promise<void> {
  const r = await updateCertificateTemplate(null, formData);
  if (r?.error) throw new Error(r.error);
}

export async function updateCertificateTemplate(
  _prev: UpdateTemplateState | null,
  formData: FormData
): Promise<UpdateTemplateState> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const body = (formData.get("certificate_template_body") as string) ?? "";
  const title = (formData.get("certificate_signer_title") as string)?.trim() || null;

  const { error } = await supabase
    .from("organizations")
    .update({
      certificate_template_body: body.trim() || null,
      certificate_signer_title: title,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.organization_id);

  if (error) return { error: error.message };
  revalidatePath("/certificates");
  return { ok: true };
}

export type UploadSignatureResult = { success: true } | { success: false; error: string };

export async function submitCertificateSignatureForm(formData: FormData): Promise<void> {
  const r = await uploadCertificateSignature(formData);
  if (!r.success) throw new Error(r.error);
}

export async function uploadCertificateSignature(
  formData: FormData
): Promise<UploadSignatureResult> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const file = formData.get("signature") as File | null;
  if (!file?.size) return { success: false, error: "Choose a PNG image." };
  if (!file.type.includes("png") && !file.name.toLowerCase().endsWith(".png")) {
    return { success: false, error: "Signature must be PNG." };
  }
  if (file.size > 2 * 1024 * 1024) {
    return { success: false, error: "Image too large (max 2 MB)." };
  }

  const path = `${profile.organization_id}/certificate/signature.png`;
  const buf = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, buf, {
    contentType: "image/png",
    upsert: true,
  });

  if (upErr) {
    return {
      success: false,
      error:
        upErr.message ||
        "Upload failed. Ensure the outreach-uploads bucket exists and your account can write to it.",
    };
  }

  const { error: dbErr } = await supabase
    .from("organizations")
    .update({
      certificate_signature_storage_path: path,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.organization_id);

  if (dbErr) return { success: false, error: dbErr.message };
  revalidatePath("/certificates");
  return { success: true };
}

export type GeneratePdfResult =
  | { success: true; base64: string; filename: string }
  | { success: false; error: string };

export async function generateCertificatePdfAction(formData: FormData): Promise<GeneratePdfResult> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const productId = (formData.get("product_id") as string)?.trim();
  const batchSerial = (formData.get("batch_serial") as string)?.trim() || "—";
  const regulationIdsRaw = (formData.get("regulation_ids") as string)?.trim() || "[]";

  if (!productId) return { success: false, error: "Select a product." };

  let regulationIds: string[] = [];
  try {
    regulationIds = JSON.parse(regulationIdsRaw) as string[];
  } catch {
    return { success: false, error: "Invalid regulation selection." };
  }

  const { data: org } = await supabase
    .from("organizations")
    .select(
      "certificate_template_body, certificate_signer_title, certificate_signature_storage_path, name"
    )
    .eq("id", profile.organization_id)
    .single();

  const { data: product, error: pErr } = await supabase
    .from("products")
    .select("id, name")
    .eq("id", productId)
    .eq("organization_id", profile.organization_id)
    .single();

  if (pErr || !product) return { success: false, error: "Product not found." };

  let regulations: { id: string; code: string; name: string }[] = [];
  if (regulationIds.length > 0) {
    const { data: regs } = await supabase
      .from("regulations")
      .select("id, code, name")
      .in("id", regulationIds);
    regulations = (regs ?? []) as typeof regulations;
  }

  const regulationLines = regulations.map((r) => `${r.code} — ${r.name}`);

  let signaturePng: Uint8Array | undefined;
  const sigPath = (org as { certificate_signature_storage_path?: string | null })
    ?.certificate_signature_storage_path;
  if (sigPath) {
    const { data: file, error: dlErr } = await supabase.storage.from(BUCKET).download(sigPath);
    if (!dlErr && file) {
      const ab = await file.arrayBuffer();
      signaturePng = new Uint8Array(ab);
    }
  }

  const templateBody = (org as { certificate_template_body?: string | null })?.certificate_template_body;
  const signerTitle =
    (org as { certificate_signer_title?: string | null })?.certificate_signer_title ?? null;

  const filled =
    templateBody
      ?.replace(/\{\{\s*product_name\s*\}\}/gi, product.name)
      .replace(/\{\{\s*batch_serial\s*\}\}/gi, batchSerial)
      .replace(/\{\{\s*organization\s*\}\}/gi, (org as { name?: string }).name ?? "") ?? null;

  const bytes = await buildDeclarationPdf({
    productName: product.name,
    batchSerial,
    regulationLines:
      regulationLines.length > 0
        ? regulationLines
        : ["(no regulations selected — edit checkboxes and try again)"],
    templateBody: filled,
    signerTitle,
    signaturePng: signaturePng ?? null,
  });

  const b64 = Buffer.from(bytes).toString("base64");
  const safeName = product.name.replace(/[^\w\-]+/g, "_").slice(0, 40);
  return {
    success: true,
    base64: b64,
    filename: `certificate-${safeName}.pdf`,
  };
}
