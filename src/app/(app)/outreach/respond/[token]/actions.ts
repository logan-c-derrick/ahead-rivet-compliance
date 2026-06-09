"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleClient, hasServiceRoleConfig } from "@/lib/supabase/service-role";
import { notifySupplierDocumentsReceived } from "@/lib/outreach-notifications";
import {
  getTestEmailOverrideFromCohortFilters,
  resolveOutreachNotificationEmail,
} from "@/lib/outreach-test-email";

export type PublicOutreachRegulationItem = {
  regulationId: string;
  name: string;
  code: string | null;
};

export type PublicOutreachComponentItem = {
  /** Stable id for form checkboxes (components.id). */
  componentId: string;
  manufacturer: string | null;
  itemName: string;
  manufacturerSku: string | null;
};

export type PublicOutreachContext = {
  supplierName: string;
  /** Comma-separated fallback for thank-you / legacy */
  regulationName: string;
  regulations: PublicOutreachRegulationItem[];
  components: PublicOutreachComponentItem[];
  dueDate: string | null;
  organizationName: string;
  /** Token was already consumed; page should show confirmation, not 404 after RSC refresh. */
  alreadySubmitted: boolean;
  /** Follow-up link scoped to a subset of parts (allowed_component_ids on token). */
  isFollowUpScoped: boolean;
};

export async function getPublicOutreachContext(
  token: string
): Promise<PublicOutreachContext | null> {
  if (!hasServiceRoleConfig() || !token?.trim()) return null;

  const supabase = createServiceRoleClient();

  const { data: tok, error: te } = await supabase
    .from("outreach_response_tokens")
    .select("id, expires_at, used_at, outreach_request_id, allowed_component_ids")
    .eq("token", token.trim())
    .maybeSingle();

  if (te || !tok) return null;
  if (new Date(tok.expires_at) < new Date()) return null;

  const alreadySubmitted = Boolean(tok.used_at);

  const { data: req, error: re } = await supabase
    .from("outreach_requests")
    .select(
      "id, due_date, organization_id, supplier_id, regulation_id, campaign_id"
    )
    .eq("id", tok.outreach_request_id)
    .maybeSingle();

  if (re || !req) return null;

  const { data: junctionRegs } = await supabase
    .from("outreach_request_regulations")
    .select("regulation_id, regulations(name, code)")
    .eq("outreach_request_id", req.id);

  const regulations: PublicOutreachRegulationItem[] = [];
  const seenRegulationIds = new Set<string>();
  for (const row of junctionRegs ?? []) {
    const regId = row.regulation_id as string;
    if (seenRegulationIds.has(regId)) continue;
    seenRegulationIds.add(regId);
    const r = row.regulations as { name: string; code: string | null } | { name: string; code: string | null }[] | null | undefined;
    const one = Array.isArray(r) ? r[0] : r;
    if (one?.name) {
      regulations.push({
        regulationId: regId,
        name: one.name,
        code: one.code ?? null,
      });
    }
  }
  if (regulations.length === 0 && req.regulation_id) {
    const { data: regulation } = await supabase
      .from("regulations")
      .select("name, code")
      .eq("id", req.regulation_id)
      .maybeSingle();
    const lr = regulation as { name: string; code: string | null } | null;
    if (lr?.name) {
      regulations.push({
        regulationId: req.regulation_id as string,
        name: lr.name,
        code: lr.code,
      });
    }
  }
  regulations.sort((a, b) => a.name.localeCompare(b.name));

  const regulationLabel =
    regulations.length > 0 ? regulations.map((x) => x.name).join(", ") : "Regulation";

  const components: PublicOutreachComponentItem[] = [];
  const campaignId = req.campaign_id as string | null;

  const { data: juncComponents } = await supabase
    .from("outreach_request_regulations")
    .select("component_id, components(manufacturer, name, manufacturer_sku)")
    .eq("outreach_request_id", req.id)
    .not("component_id", "is", null);

  const seenComp = new Set<string>();
  for (const orow of juncComponents ?? []) {
    const rawC = orow.components as unknown;
    const c = (
      Array.isArray(rawC) ? rawC[0] : rawC
    ) as {
      manufacturer: string | null;
      name: string | null;
      manufacturer_sku: string | null;
    } | null;
    if (!c?.name && !c?.manufacturer_sku && !c?.manufacturer) continue;
    const cid = (orow.component_id as string | null) ?? "";
    const dedupeKey = cid || `${c?.name}-${c?.manufacturer_sku}`;
    if (seenComp.has(dedupeKey)) continue;
    seenComp.add(dedupeKey);
    components.push({
      componentId: cid,
      manufacturer: c.manufacturer ?? null,
      itemName: c.name?.trim() || "—",
      manufacturerSku: c.manufacturer_sku ?? null,
    });
  }

  if (components.length === 0) {
    let scopeQuery = supabase
    .from("outreach_requests")
    .select("component_id, components(manufacturer, name, manufacturer_sku)")
    .order("requested_at", { ascending: true });
  scopeQuery = campaignId
    ? scopeQuery.eq("campaign_id", campaignId)
    : scopeQuery.eq("id", req.id as string);
  const { data: scopeRows } = await scopeQuery;

  for (const orow of scopeRows ?? []) {
    const rawC = orow.components as unknown;
    const c = (
      Array.isArray(rawC) ? rawC[0] : rawC
    ) as {
      manufacturer: string | null;
      name: string | null;
      manufacturer_sku: string | null;
    } | null;
    if (!c?.name && !c?.manufacturer_sku && !c?.manufacturer) continue;
    const cid = (orow.component_id as string | null) ?? "";
    const dedupeKey = cid || `${c.name}-${c.manufacturer_sku}`;
    if (seenComp.has(dedupeKey)) continue;
    seenComp.add(dedupeKey);
    components.push({
      componentId: cid,
      manufacturer: c.manufacturer ?? null,
      itemName: c.name?.trim() || "—",
      manufacturerSku: c.manufacturer_sku ?? null,
    });
  }
  }

  components.sort((a, b) => a.itemName.localeCompare(b.itemName));

  const allowed = tok.allowed_component_ids as string[] | null | undefined;
  const allowSet =
    allowed && allowed.length > 0 ? new Set(allowed) : null;
  const scopedComponents = allowSet
    ? components.filter((c) => allowSet.has(c.componentId))
    : components;
  const isFollowUpScoped = Boolean(allowSet && allowSet.size > 0);
  if (allowSet && scopedComponents.length === 0) return null;

  const [{ data: supplier }, { data: org }] = await Promise.all([
    supabase.from("suppliers").select("name").eq("id", req.supplier_id).maybeSingle(),
    supabase.from("organizations").select("name").eq("id", req.organization_id).maybeSingle(),
  ]);

  return {
    supplierName: (supplier as { name: string } | null)?.name ?? "Supplier",
    regulationName: regulationLabel,
    regulations,
    components: scopedComponents,
    dueDate: req.due_date ?? null,
    organizationName: (org as { name: string } | null)?.name ?? "Organization",
    alreadySubmitted,
    isFollowUpScoped,
  };
}

export type SubmitOutreachResult =
  | { success: true }
  | { success: false; error: string };

/** Component ids the supplier is allowed to tag for this request (same rules as the portal list). */
async function loadAllowedComponentIdsForRequest(
  supabase: ReturnType<typeof createServiceRoleClient>,
  requestId: string,
  campaignId: string | null
): Promise<string[]> {
  const seen = new Set<string>();
  const { data: juncComponents } = await supabase
    .from("outreach_request_regulations")
    .select("component_id")
    .eq("outreach_request_id", requestId)
    .not("component_id", "is", null);

  for (const row of juncComponents ?? []) {
    const cid = row.component_id as string | null;
    if (cid) seen.add(cid);
  }
  if (seen.size > 0) return [...seen];

  let scopeQuery = supabase
    .from("outreach_requests")
    .select("component_id")
    .order("requested_at", { ascending: true });
  scopeQuery = campaignId
    ? scopeQuery.eq("campaign_id", campaignId)
    : scopeQuery.eq("id", requestId);
  const { data: scopeRows } = await scopeQuery;

  for (const orow of scopeRows ?? []) {
    const cid = orow.component_id as string | null;
    if (cid) seen.add(cid);
  }
  return [...seen];
}

async function loadAllowedRegulationIdsForRequest(
  supabase: ReturnType<typeof createServiceRoleClient>,
  requestId: string,
  fallbackRegulationId: string | null
): Promise<string[]> {
  const seen = new Set<string>();
  const { data: rows } = await supabase
    .from("outreach_request_regulations")
    .select("regulation_id")
    .eq("outreach_request_id", requestId);
  for (const row of rows ?? []) {
    const rid = row.regulation_id as string | null;
    if (rid) seen.add(rid);
  }
  if (seen.size === 0 && fallbackRegulationId) {
    seen.add(fallbackRegulationId);
  }
  return [...seen];
}

export async function submitOutreachResponse(
  token: string,
  formData: FormData
): Promise<SubmitOutreachResult> {
  if (!hasServiceRoleConfig()) {
    return { success: false, error: "Server configuration incomplete." };
  }

  const supabase = createServiceRoleClient();
  const trimmed = token?.trim();
  if (!trimmed) return { success: false, error: "Invalid link." };

  const { data: tok, error: te } = await supabase
    .from("outreach_response_tokens")
    .select("id, expires_at, used_at, outreach_request_id, allowed_component_ids")
    .eq("token", trimmed)
    .maybeSingle();

  if (te || !tok) return { success: false, error: "Invalid or expired link." };
  if (tok.used_at) return { success: false, error: "This link has already been used." };
  if (new Date(tok.expires_at) < new Date()) {
    return { success: false, error: "This link has expired." };
  }

  const fileEntries = formData.getAll("files");
  const files = fileEntries.filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) {
    return { success: false, error: "Please attach at least one file." };
  }

  const { data: req, error: re } = await supabase
    .from("outreach_requests")
    .select(
      "id, regulation_id, organization_id, supplier_id, campaign_id, organizations(name), suppliers(contact_email), outreach_campaigns(cohort_filters)"
    )
    .eq("id", tok.outreach_request_id)
    .maybeSingle();

  if (re || !req) return { success: false, error: "Request not found." };

  const orgId = req.organization_id as string;
  const requestId = req.id as string;
  const supplierId = req.supplier_id as string | null;
  const campaignId = req.campaign_id as string | null;

  const rawEmbed = req.organizations as { name: string } | { name: string }[] | null | undefined;
  const orgRow = Array.isArray(rawEmbed) ? rawEmbed[0] : rawEmbed;
  const organizationName = orgRow?.name ?? "Organization";

  const rawSup = req.suppliers as
    | { contact_email: string | null }
    | { contact_email: string | null }[]
    | null
    | undefined;
  const supRow = Array.isArray(rawSup) ? rawSup[0] : rawSup;
  const rawCamp = req.outreach_campaigns as
    | { cohort_filters: unknown }
    | { cohort_filters: unknown }[]
    | null
    | undefined;
  const campRow = Array.isArray(rawCamp) ? rawCamp[0] : rawCamp;
  const cohortFilters = campRow?.cohort_filters;

  const supplierContactEmail = resolveOutreachNotificationEmail(
    supRow?.contact_email,
    cohortFilters
  );
  const notifyIsTest = getTestEmailOverrideFromCohortFilters(cohortFilters) !== null;

  let allowedComponentIds = await loadAllowedComponentIdsForRequest(
    supabase,
    requestId,
    campaignId
  );

  const tokenAllowed = tok.allowed_component_ids as string[] | null | undefined;
  if (tokenAllowed && tokenAllowed.length > 0) {
    const scope = new Set(tokenAllowed);
    allowedComponentIds = allowedComponentIds.filter((id) => scope.has(id));
  }
  if (tokenAllowed && tokenAllowed.length > 0 && allowedComponentIds.length === 0) {
    return {
      success: false,
      error: "This link is not valid for any parts in this request.",
    };
  }

  const allow = new Set(allowedComponentIds);
  const allowedRegulationIds = new Set(
    await loadAllowedRegulationIdsForRequest(
      supabase,
      requestId,
      (req.regulation_id as string | null) ?? null
    )
  );
  const perFileSelections: string[][] = [];
  const perFileRegulationSelections: string[][] = [];
  for (let i = 0; i < files.length; i++) {
    const raw = formData
      .getAll(`component_id_${i}`)
      .map((v) => String(v).trim())
      .filter(Boolean);
    perFileSelections.push([...new Set(raw)]);
    const rawRegs = formData
      .getAll(`regulation_id_${i}`)
      .map((v) => String(v).trim())
      .filter(Boolean);
    perFileRegulationSelections.push([...new Set(rawRegs)]);
  }

  if (allowedComponentIds.length > 0) {
    for (let i = 0; i < files.length; i++) {
      const sel = perFileSelections[i] ?? [];
      if (sel.length === 0) {
        return {
          success: false,
          error: `Select at least one part for "${files[i].name}".`,
        };
      }
      for (const id of sel) {
        if (!allow.has(id)) {
          return { success: false, error: "Invalid component selection." };
        }
      }
    }
  }

  if (allowedRegulationIds.size > 0) {
    for (let i = 0; i < files.length; i++) {
      const selRegs = perFileRegulationSelections[i] ?? [];
      if (selRegs.length === 0) {
        return {
          success: false,
          error: `Select at least one regulation for "${files[i].name}".`,
        };
      }
      for (const rid of selRegs) {
        if (!allowedRegulationIds.has(rid)) {
          return { success: false, error: "Invalid regulation selection." };
        }
      }
    }
  }

  const unionSelected = new Set<string>();
  for (const sel of perFileSelections) {
    for (const id of sel) unionSelected.add(id);
  }

  const uploadedStoragePaths: string[] = [];
  const insertedDocumentIds: string[] = [];

  async function rollbackPartialUploads(): Promise<void> {
    if (insertedDocumentIds.length > 0) {
      await supabase.from("supplier_documents").delete().in("id", insertedDocumentIds);
    }
    if (uploadedStoragePaths.length > 0) {
      await supabase.storage.from("outreach-uploads").remove(uploadedStoragePaths);
    }
  }

  const batchBase = Date.now();
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const selectedForFile = perFileSelections[i] ?? [];
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
    const storagePath = `${orgId}/${requestId}/${batchBase}-${i}-${safeName}`;
    const buf = Buffer.from(await file.arrayBuffer());

    const { error: upErr } = await supabase.storage
      .from("outreach-uploads")
      .upload(storagePath, buf, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (upErr) {
      console.error("Storage upload:", upErr);
      await rollbackPartialUploads();
      return {
        success: false,
        error:
          "Could not upload one or more files. Ensure the outreach-uploads storage bucket exists in Supabase.",
      };
    }
    uploadedStoragePaths.push(storagePath);

    const { data: docRow, error: docErr } = await supabase
      .from("supplier_documents")
      .insert({
        organization_id: orgId,
        supplier_id: supplierId,
        outreach_request_id: requestId,
        document_type: "declaration",
        filename: file.name,
        storage_path: storagePath,
      })
      .select("id")
      .single();

    if (docErr || !docRow) {
      console.error("supplier_documents insert:", docErr);
      await rollbackPartialUploads();
      return { success: false, error: docErr?.message ?? "Could not save document." };
    }

    const documentId = docRow.id as string;
    insertedDocumentIds.push(documentId);

    if (selectedForFile.length > 0) {
      const { error: linkErr } = await supabase.from("supplier_document_components").insert(
        selectedForFile.map((component_id) => ({
          supplier_document_id: documentId,
          component_id,
        }))
      );
      if (linkErr) {
        console.error("supplier_document_components insert:", linkErr);
        await rollbackPartialUploads();
        return {
          success: false,
          error: linkErr.message,
        };
      }
    }

    const selectedRegulationsForFile = perFileRegulationSelections[i] ?? [];
    if (selectedRegulationsForFile.length > 0) {
      const { error: regLinkErr } = await supabase
        .from("supplier_document_regulations")
        .insert(
          selectedRegulationsForFile.map((regulation_id) => ({
            supplier_document_id: documentId,
            regulation_id,
          }))
        );
      if (regLinkErr) {
        console.error("supplier_document_regulations insert:", regLinkErr);
        await rollbackPartialUploads();
        return {
          success: false,
          error: regLinkErr.message,
        };
      }
    }
  }

  // New upload after a rejection: reset rejected regulations to pending for re-review
  let resetQ = supabase
    .from("outreach_request_regulations")
    .update({
      review_status: "pending",
      reviewed_at: null,
      reviewed_by: null,
      review_notes: null,
    })
    .eq("outreach_request_id", requestId)
    .eq("review_status", "rejected");
  if (unionSelected.size > 0) {
    resetQ = resetQ.in("component_id", [...unionSelected]);
  }
  const { error: resetErr } = await resetQ;

  if (resetErr) {
    console.error("outreach_request_regulations reset after upload:", resetErr);
  }

  const { error: stErr } = await supabase
    .from("outreach_requests")
    .update({ status: "received", updated_at: new Date().toISOString() })
    .eq("id", requestId);

  if (stErr) {
    console.error("outreach_requests update:", stErr);
    return { success: false, error: stErr.message };
  }

  const { error: markErr } = await supabase
    .from("outreach_response_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", tok.id);

  if (markErr) {
    console.error("token used_at:", markErr);
  }

  if (supplierContactEmail) {
    const portalWasFollowUp = Boolean(tokenAllowed && tokenAllowed.length > 0);
    void notifySupplierDocumentsReceived({
      to: supplierContactEmail,
      organizationName,
      filenames: files.map((f) => f.name),
      portalWasFollowUp,
      isTestNotification: notifyIsTest,
    });
  }

  revalidatePath("/outreach");
  revalidatePath(`/outreach/requests/${requestId}`);
  return { success: true };
}
