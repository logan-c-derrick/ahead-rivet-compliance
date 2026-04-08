import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient, hasServiceRoleConfig } from "@/lib/supabase/service-role";
import { resolveOutreachNotificationEmail } from "@/lib/outreach-test-email";
import { requireProfile } from "@/lib/profile";

/** PostgREST may return embedded rows as object or single-element array. */
function one<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

const BUCKET = "outreach-uploads";
const SIGNED_TTL = 3600;

export type SupplierDocumentRow = {
  id: string;
  filename: string | null;
  document_type: string | null;
  storage_path: string;
  created_at: string;
  outreach_request_id: string;
};

/** Includes supplier-selected component coverage when available (migration 017+). */
export type SupplierDocumentWithCoverage = SupplierDocumentRow & {
  coverage: { id: string; label: string }[];
};

export type ComponentSupplierDocument = SupplierDocumentRow & {
  regulationName: string;
  regulationCode: string | null;
};

/** Supplier uploads tied to outreach for this component (via outreach_requests). */
export async function getSupplierDocumentsForComponent(
  componentId: string
): Promise<ComponentSupplierDocument[]> {
  await requireProfile();
  const supabase = await createClient();

  const { data: viaJunction } = await supabase
    .from("outreach_request_regulations")
    .select("outreach_request_id")
    .eq("component_id", componentId);

  const idSet = new Set<string>();
  for (const r of viaJunction ?? []) {
    idSet.add(r.outreach_request_id as string);
  }

  const { data: directRows } = await supabase
    .from("outreach_requests")
    .select("id")
    .eq("component_id", componentId);

  for (const r of directRows ?? []) {
    idSet.add(r.id as string);
  }

  if (idSet.size === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("outreach_requests")
    .select(
      `
      id,
      regulations (name, code),
      supplier_documents (
        id,
        filename,
        document_type,
        storage_path,
        created_at
      ),
      outreach_request_regulations (
        regulations (name, code)
      )
    `
    )
    .in("id", [...idSet]);

  if (error) {
    console.error("getSupplierDocumentsForComponent:", error);
    return [];
  }

  const out: ComponentSupplierDocument[] = [];
  for (const row of data ?? []) {
    const junc = (row.outreach_request_regulations ?? []) as Array<{
      regulations?: unknown;
    }>;
    const names: string[] = [];
    const codes: string[] = [];
    for (const jr of junc) {
      const r = one(jr.regulations as { name: string; code: string | null } | null);
      if (r?.name) names.push(r.name);
      if (r?.code) codes.push(r.code);
    }
    const parentReg = one(row.regulations as unknown as { name: string; code: string | null } | null);
    const regulationName = names.length > 0 ? names.join(", ") : parentReg?.name ?? "—";
    const regulationCode = codes[0] ?? parentReg?.code ?? null;

    const docs = (row.supplier_documents ?? []) as Omit<SupplierDocumentRow, "outreach_request_id">[];
    for (const d of docs) {
      out.push({
        ...d,
        outreach_request_id: row.id as string,
        regulationName,
        regulationCode,
      });
    }
  }

  return out.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/** Component IDs the supplier tagged on uploads for this request (empty if none or legacy). */
export async function fetchUploadCoverageComponentIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  outreachRequestId: string
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("supplier_documents")
    .select("supplier_document_components (component_id)")
    .eq("outreach_request_id", outreachRequestId);
  if (error) {
    console.warn("fetchUploadCoverageComponentIds:", error);
    return new Set();
  }
  const ids = new Set<string>();
  for (const d of data ?? []) {
    const links = d.supplier_document_components as
      | { component_id: string }[]
      | null
      | undefined;
    for (const l of links ?? []) {
      if (l.component_id) ids.add(l.component_id);
    }
  }
  return ids;
}

export async function getUploadCoveredComponentIdsForOutreachRequest(
  outreachRequestId: string
): Promise<Set<string>> {
  await requireProfile();
  const supabase = await createClient();
  return fetchUploadCoverageComponentIds(supabase, outreachRequestId);
}

/** Parts that still need a file: never uploaded for, or has a rejected regulation row. */
export async function getFollowUpEligibleComponentIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  outreachRequestId: string
): Promise<string[]> {
  const covered = await fetchUploadCoverageComponentIds(supabase, outreachRequestId);
  const { data: junc } = await supabase
    .from("outreach_request_regulations")
    .select("component_id, review_status")
    .eq("outreach_request_id", outreachRequestId)
    .not("component_id", "is", null);

  const byComp = new Map<string, string[]>();
  for (const row of junc ?? []) {
    const cid = row.component_id as string;
    const list = byComp.get(cid) ?? [];
    list.push(row.review_status as string);
    byComp.set(cid, list);
  }

  const eligible: string[] = [];
  for (const [cid, statuses] of byComp) {
    const notUploaded = !covered.has(cid);
    const hasRejected = statuses.some((s) => s === "rejected");
    const allApproved =
      statuses.length > 0 && statuses.every((s) => s === "approved");
    if (notUploaded) {
      eligible.push(cid);
      continue;
    }
    if (hasRejected) {
      eligible.push(cid);
      continue;
    }
    if (allApproved) {
      continue;
    }
  }
  return [...new Set(eligible)];
}

function labelForComponentRow(c: {
  name: string | null;
  part_number: string | null;
} | null): string {
  if (!c) return "—";
  const name = c.name?.trim() || "";
  const pn = c.part_number?.trim() || "";
  if (name && pn) return `${name} · ${pn}`;
  return name || pn || "—";
}

/** Documents uploaded in response to a single outreach request (includes per-component coverage). */
export async function getSupplierDocumentsForOutreachRequest(
  outreachRequestId: string
): Promise<SupplierDocumentWithCoverage[]> {
  await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("supplier_documents")
    .select(
      `
      id,
      filename,
      document_type,
      storage_path,
      created_at,
      outreach_request_id,
      supplier_document_components (
        component_id,
        components (id, name, part_number)
      )
    `
    )
    .eq("outreach_request_id", outreachRequestId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getSupplierDocumentsForOutreachRequest:", error);
    return [];
  }

  const rows = (data ?? []) as unknown as Array<
    SupplierDocumentRow & {
      supplier_document_components?: Array<{
        component_id: string;
        components: unknown;
      }>;
    }
  >;

  return rows.map((row) => {
    const junc = row.supplier_document_components ?? [];
    const coverage: { id: string; label: string }[] = [];
    const seen = new Set<string>();
    for (const j of junc) {
      const cid = j.component_id as string;
      if (seen.has(cid)) continue;
      seen.add(cid);
      const comp = one(
        j.components as {
          id: string;
          name: string | null;
          part_number: string | null;
        } | null
      );
      coverage.push({
        id: cid,
        label: labelForComponentRow(comp),
      });
    }
    coverage.sort((a, b) => a.label.localeCompare(b.label));
    const { supplier_document_components: _, ...rest } = row;
    return { ...rest, coverage };
  });
}

export type OutreachRequestRegulationRow = {
  junctionId: string;
  regulationId: string;
  /** Set when regulations are scoped per component on a consolidated request. */
  componentId?: string | null;
  name: string;
  code: string | null;
  reviewStatus: string;
  reviewedAt: string | null;
  reviewNotes: string | null;
};

/** Rows for the campaign table: one per component (consolidated or legacy per-request). */
export type CampaignRequestListItem = {
  id: string;
  /** Stable key for React lists (request id may repeat for consolidated campaigns). */
  listKey: string;
  componentId: string | null;
  supplierName: string;
  componentName: string | null;
  partNumber: string | null;
  manufacturer: string | null;
  manufacturerSku: string | null;
  /**
   * Row-level status. When uploads tag specific parts (`supplier_document_components`),
   * parts with no selected upload show `pending_documentation` even if the request is received.
   */
  status: string | null;
  requestedAt: string | null;
  isCurrent: boolean;
};

/** Per component (request) × regulations for reviewer verification matrix. */
export type CampaignReviewBlock = {
  requestId: string;
  componentId: string | null;
  supplierName: string;
  manufacturer: string | null;
  itemName: string | null;
  manufacturerSku: string | null;
  regulations: OutreachRequestRegulationRow[];
};

export type OutreachRequestDetail = {
  id: string;
  status: string | null;
  request_type: string;
  requested_at: string | null;
  due_date: string | null;
  notes: string | null;
  updated_at: string | null;
  supplierName: string;
  componentId: string | null;
  componentPartNumber: string | null;
  componentName: string | null;
  componentManufacturer: string | null;
  componentManufacturerSku: string | null;
  campaignId: string | null;
  campaignName: string | null;
  /** Same campaign: one row per component (or legacy one row per request). */
  campaignRequests: CampaignRequestListItem[];
  /** Review matrix: one block per component. */
  campaignReviewBlocks: CampaignReviewBlock[];
  /** Legacy single-regulation summary (first reg or joined names). */
  regulationName: string;
  regulationCode: string | null;
  /** Unique regulations for summary display (deduped when scoped per component). */
  regulations: OutreachRequestRegulationRow[];
  /** Parts eligible for a follow-up upload link (uncovered or rejected). */
  followUpEligibleComponentIds: string[];
  /** Resolved recipient for supplier notifications (supplier contact or campaign test-email override). */
  supplierContactEmail: string | null;
};

export async function getOutreachRequestDetail(
  requestId: string
): Promise<OutreachRequestDetail | null> {
  await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("outreach_requests")
    .select(
      `
      id,
      campaign_id,
      regulation_id,
      status,
      request_type,
      requested_at,
      due_date,
      notes,
      updated_at,
      suppliers (name, contact_email),
      components (id, part_number, name, manufacturer, manufacturer_sku),
      regulations (name, code),
      outreach_campaigns (name, cohort_filters),
      outreach_request_regulations (
        id,
        regulation_id,
        component_id,
        review_status,
        reviewed_at,
        review_notes,
        regulations (name, code)
      )
    `
    )
    .eq("id", requestId)
    .maybeSingle();

  if (error || !data) return null;

  const supplier = one(
    data.suppliers as
      | { name: string | null; contact_email: string | null }
      | { name: string | null; contact_email: string | null }[]
      | null
  );
  const comp = one(
    data.components as {
      id: string;
      part_number: string | null;
      name: string | null;
      manufacturer: string | null;
      manufacturer_sku: string | null;
    } | Array<{
      id: string;
      part_number: string | null;
      name: string | null;
      manufacturer: string | null;
      manufacturer_sku: string | null;
    }> | null
  );
  const parentReg = one(
    data.regulations as { name: string | null; code: string | null } | {
      name: string | null;
      code: string | null;
    }[] | null
  );

  const rawJunction = (data.outreach_request_regulations ?? []) as Array<{
    id: string;
    regulation_id: string;
    component_id: string | null;
    review_status: string;
    reviewed_at: string | null;
    review_notes: string | null;
    regulations: unknown;
  }>;

  let regulationsFull: OutreachRequestRegulationRow[] = rawJunction.map((jr) => {
    const r = one(jr.regulations as { name: string | null; code: string | null } | null);
    return {
      junctionId: jr.id,
      regulationId: jr.regulation_id,
      componentId: jr.component_id ?? null,
      name: r?.name ?? "—",
      code: r?.code ?? null,
      reviewStatus: jr.review_status,
      reviewedAt: jr.reviewed_at,
      reviewNotes: jr.review_notes,
    };
  });

  const rid = data.regulation_id as string | null;
  if (regulationsFull.length === 0 && rid) {
    const { data: lone } = await supabase
      .from("regulations")
      .select("name, code")
      .eq("id", rid)
      .maybeSingle();
    const lr = lone as { name: string; code: string | null } | null;
    regulationsFull = [
      {
        junctionId: "",
        regulationId: rid,
        componentId: comp?.id ?? null,
        name: lr?.name ?? parentReg?.name ?? "—",
        code: lr?.code ?? parentReg?.code ?? null,
        reviewStatus: "pending",
        reviewedAt: null,
        reviewNotes: null,
      },
    ];
  }

  const regulationsDisplay: OutreachRequestRegulationRow[] = [];
  const seenRegId = new Map<string, OutreachRequestRegulationRow>();
  for (const r of regulationsFull) {
    if (!seenRegId.has(r.regulationId)) seenRegId.set(r.regulationId, r);
  }
  for (const r of seenRegId.values()) {
    regulationsDisplay.push(r);
  }
  regulationsDisplay.sort((a, b) => a.name.localeCompare(b.name));

  const nameJoin = regulationsDisplay.map((r) => r.name).filter(Boolean);
  const regulationName =
    nameJoin.length > 0 ? nameJoin.join(", ") : parentReg?.name ?? "—";
  const regulationCode =
    regulationsDisplay[0]?.code ?? parentReg?.code ?? null;

  const campaignId = (data.campaign_id as string | null) ?? null;
  const campaignEmbed = one(
    data.outreach_campaigns as
      | { name: string; cohort_filters: unknown }
      | { name: string; cohort_filters: unknown }[]
      | null
  );
  const campaignName = campaignEmbed?.name ?? null;

  const anchorRequestId = data.id as string;
  const uploadCoveredComponentIds = await fetchUploadCoverageComponentIds(
    supabase,
    anchorRequestId
  );
  const scopeReviewToSupplierUpload = uploadCoveredComponentIds.size > 0;

  let campaignRequests: CampaignRequestListItem[] = [];
  if (campaignId) {
    const { data: crRows, error: crErr } = await supabase
      .from("outreach_requests")
      .select(
        `
        id,
        component_id,
        status,
        requested_at,
        suppliers (name),
        components (part_number, name, manufacturer, manufacturer_sku)
      `
      )
      .eq("campaign_id", campaignId)
      .order("requested_at", { ascending: true });

    if (!crErr && crRows && crRows.length > 0) {
      const currentId = data.id as string;
      type ReqRow = {
        id: string;
        component_id: string | null;
        status: string | null;
        requested_at: string | null;
        suppliers: unknown;
        components: unknown;
      };
      const reqRows = crRows as unknown as ReqRow[];
      const reqIds = reqRows.map((r) => r.id);

      const { data: juncRows } = await supabase
        .from("outreach_request_regulations")
        .select(
          `
          outreach_request_id,
          component_id,
          components (part_number, name, manufacturer, manufacturer_sku)
        `
        )
        .in("outreach_request_id", reqIds)
        .not("component_id", "is", null);

      type CompAgg = {
        requestId: string;
        componentId: string;
        supplierName: string;
        componentName: string | null;
        partNumber: string | null;
        manufacturer: string | null;
        manufacturerSku: string | null;
      };
      const byComp = new Map<string, CompAgg>();

      for (const row of reqRows) {
        const cid = row.component_id;
        if (!cid) continue;
        if (byComp.has(cid)) continue;
        const sup = one(row.suppliers as { name: string | null } | null);
        const c = one(
          row.components as {
            part_number: string | null;
            name: string | null;
            manufacturer: string | null;
            manufacturer_sku: string | null;
          } | null
        );
        byComp.set(cid, {
          requestId: row.id,
          componentId: cid,
          supplierName: sup?.name ?? "—",
          componentName: c?.name ?? null,
          partNumber: c?.part_number ?? null,
          manufacturer: c?.manufacturer ?? null,
          manufacturerSku: c?.manufacturer_sku ?? null,
        });
      }

      for (const row of juncRows ?? []) {
        const jr = row as {
          outreach_request_id: string;
          component_id: string;
          components: unknown;
        };
        const cid = jr.component_id;
        if (byComp.has(cid)) continue;
        const reqRow = reqRows.find((r) => r.id === jr.outreach_request_id);
        const sup = one(reqRow?.suppliers as { name: string | null } | null);
        const c = one(
          jr.components as {
            part_number: string | null;
            name: string | null;
            manufacturer: string | null;
            manufacturer_sku: string | null;
          } | null
        );
        byComp.set(cid, {
          requestId: jr.outreach_request_id,
          componentId: cid,
          supplierName: sup?.name ?? "—",
          componentName: c?.name ?? null,
          partNumber: c?.part_number ?? null,
          manufacturer: c?.manufacturer ?? null,
          manufacturerSku: c?.manufacturer_sku ?? null,
        });
      }

      const primary = reqRows[0];
      const requestStatus = primary.status;
      const requestedAt = primary.requested_at;

      campaignRequests = [...byComp.values()].map((x) => {
        let rowStatus: string | null = requestStatus;
        if (
          scopeReviewToSupplierUpload &&
          x.componentId &&
          !uploadCoveredComponentIds.has(x.componentId)
        ) {
          rowStatus = "pending_documentation";
        }
        return {
          id: x.requestId,
          listKey: `${x.requestId}-${x.componentId}`,
          componentId: x.componentId,
          supplierName: x.supplierName,
          componentName: x.componentName,
          partNumber: x.partNumber,
          manufacturer: x.manufacturer,
          manufacturerSku: x.manufacturerSku,
          status: rowStatus,
          requestedAt,
          isCurrent: x.requestId === currentId,
        };
      });
      campaignRequests.sort((a, b) =>
        (a.componentName ?? "").localeCompare(b.componentName ?? "")
      );
    }
  }

  let campaignReviewBlocks: CampaignReviewBlock[] = [];

  if (campaignId && campaignRequests.length > 0) {
    const reviewRows = scopeReviewToSupplierUpload
      ? campaignRequests.filter(
          (cr) =>
            cr.componentId &&
            uploadCoveredComponentIds.has(cr.componentId as string)
        )
      : campaignRequests;

    const reqIds = [...new Set(campaignRequests.map((c) => c.id))];
    const { data: allJunction, error: jErr } = await supabase
      .from("outreach_request_regulations")
      .select(
        `
        outreach_request_id,
        component_id,
        id,
        regulation_id,
        review_status,
        reviewed_at,
        review_notes,
        regulations (name, code)
      `
      )
      .in("outreach_request_id", reqIds);

    const rcKey = (rid: string, cid: string | null) => `${rid}::${cid ?? ""}`;
    const byRequestComponent = new Map<string, OutreachRequestRegulationRow[]>();

    if (!jErr && allJunction) {
      for (const row of allJunction as unknown as Array<{
        outreach_request_id: string;
        component_id: string | null;
        id: string;
        regulation_id: string;
        review_status: string;
        reviewed_at: string | null;
        review_notes: string | null;
        regulations: unknown;
      }>) {
        const r = one(row.regulations as { name: string | null; code: string | null } | null);
        const rowObj: OutreachRequestRegulationRow = {
          junctionId: row.id,
          regulationId: row.regulation_id,
          componentId: row.component_id ?? null,
          name: r?.name ?? "—",
          code: r?.code ?? null,
          reviewStatus: row.review_status,
          reviewedAt: row.reviewed_at,
          reviewNotes: row.review_notes,
        };
        const k = rcKey(row.outreach_request_id, row.component_id ?? null);
        const list = byRequestComponent.get(k) ?? [];
        list.push(rowObj);
        byRequestComponent.set(k, list);
      }
      for (const [, list] of byRequestComponent) {
        list.sort((a, b) => a.name.localeCompare(b.name));
      }
    }

    campaignReviewBlocks = reviewRows.map((cr) => ({
      requestId: cr.id,
      componentId: cr.componentId,
      supplierName: cr.supplierName,
      manufacturer: cr.manufacturer,
      itemName: cr.componentName,
      manufacturerSku: cr.manufacturerSku,
      regulations: byRequestComponent.get(rcKey(cr.id, cr.componentId)) ?? [],
    }));
  } else if (!campaignId) {
    campaignReviewBlocks = [
      {
        requestId: data.id as string,
        componentId: comp?.id ?? null,
        supplierName: supplier?.name ?? "—",
        manufacturer: comp?.manufacturer ?? null,
        itemName: comp?.name ?? null,
        manufacturerSku: comp?.manufacturer_sku ?? null,
        regulations: regulationsFull,
      },
    ];
  } else {
    campaignReviewBlocks = [
      {
        requestId: data.id as string,
        componentId: null,
        supplierName: supplier?.name ?? "—",
        manufacturer: null,
        itemName: null,
        manufacturerSku: null,
        regulations: regulationsFull,
      },
    ];
  }

  const followUpEligibleComponentIds = await getFollowUpEligibleComponentIds(
    supabase,
    anchorRequestId
  );
  const supplierContactEmail = resolveOutreachNotificationEmail(
    supplier?.contact_email,
    campaignEmbed?.cohort_filters
  );

  return {
    id: data.id as string,
    status: data.status as string | null,
    request_type: data.request_type as string,
    requested_at: data.requested_at as string | null,
    due_date: data.due_date as string | null,
    notes: data.notes as string | null,
    updated_at: data.updated_at as string | null,
    supplierName: supplier?.name ?? "—",
    componentId: comp?.id ?? null,
    componentPartNumber: comp?.part_number ?? null,
    componentName: comp?.name ?? null,
    componentManufacturer: comp?.manufacturer ?? null,
    componentManufacturerSku: comp?.manufacturer_sku ?? null,
    campaignId,
    campaignName,
    campaignRequests,
    campaignReviewBlocks,
    regulationName,
    regulationCode,
    regulations: regulationsDisplay,
    followUpEligibleComponentIds,
    supplierContactEmail,
  };
}

export async function addSignedDownloadUrls<T extends { storage_path: string }>(
  docs: T[]
): Promise<Array<T & { downloadUrl: string | null }>> {
  if (!hasServiceRoleConfig() || docs.length === 0) {
    return docs.map((d) => ({ ...d, downloadUrl: null }));
  }

  const admin = createServiceRoleClient();
  const results = await Promise.all(
    docs.map(async (d) => {
      const { data, error } = await admin.storage
        .from(BUCKET)
        .createSignedUrl(d.storage_path, SIGNED_TTL);
      if (error || !data?.signedUrl) {
        console.error("createSignedUrl:", error);
        return { ...d, downloadUrl: null };
      }
      return { ...d, downloadUrl: data.signedUrl };
    })
  );
  return results;
}
