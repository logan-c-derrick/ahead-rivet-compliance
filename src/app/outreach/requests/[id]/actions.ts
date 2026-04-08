"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  notifySupplierFollowUpLink,
  notifySupplierReviewDecisions,
} from "@/lib/outreach-notifications";
import { requireProfile } from "@/lib/profile";
import {
  fetchUploadCoverageComponentIds,
  getFollowUpEligibleComponentIds,
} from "@/lib/supplier-documents";
import {
  getTestEmailOverrideFromCohortFilters,
  resolveOutreachNotificationEmail,
} from "@/lib/outreach-test-email";

export type ReviewSubmitResult = { ok: true } | { ok: false; error: string };

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export type FollowUpSendResult =
  | { ok: true }
  | { ok: false; error: string };

export async function sendFollowUpUploadLink(
  requestId: string
): Promise<FollowUpSendResult> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const rid = requestId?.trim();
  if (!rid) return { ok: false, error: "Invalid request." };

  const { data: row, error: re } = await supabase
    .from("outreach_requests")
    .select(
      "id, organization_id, supplier_id, suppliers(contact_email), outreach_campaigns(cohort_filters)"
    )
    .eq("id", rid)
    .eq("organization_id", profile.organization_id)
    .maybeSingle();

  if (re || !row) return { ok: false, error: "Request not found." };

  const eligible = await getFollowUpEligibleComponentIds(supabase, rid);
  if (eligible.length === 0) {
    return {
      ok: false,
      error: "No parts need a follow-up upload right now.",
    };
  }

  const rawS = row.suppliers as
    | { contact_email: string | null }
    | { contact_email: string | null }[]
    | null
    | undefined;
  const srow = Array.isArray(rawS) ? rawS[0] : rawS;
  const rawCamp = row.outreach_campaigns as
    | { cohort_filters: unknown }
    | { cohort_filters: unknown }[]
    | null
    | undefined;
  const campRow = Array.isArray(rawCamp) ? rawCamp[0] : rawCamp;
  const cohortFilters = campRow?.cohort_filters;

  const email = resolveOutreachNotificationEmail(srow?.contact_email, cohortFilters);
  if (!email) {
    return {
      ok: false,
      error:
        "No recipient email: add a supplier contact email or launch with a test email override.",
    };
  }
  const isTestNotification = getTestEmailOverrideFromCohortFilters(cohortFilters) !== null;

  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", row.organization_id as string)
    .maybeSingle();
  const organizationName = (org as { name: string } | null)?.name ?? "Organization";

  const { data: comps } = await supabase
    .from("components")
    .select("id, name, part_number")
    .in("id", eligible);
  const partSummary =
    (comps ?? [])
      .map((c) => {
        const name = (c.name as string | null)?.trim() || "";
        const pn = (c.part_number as string | null)?.trim() || "";
        if (name && pn) return `${name} (${pn})`;
        return name || pn || (c.id as string);
      })
      .join(", ") || eligible.join(", ");

  const { data: regs } = await supabase
    .from("outreach_request_regulations")
    .select("regulation_id, regulations(name, code)")
    .eq("outreach_request_id", rid);
  const seenReg = new Set<string>();
  const regulationSummary =
    (regs ?? [])
      .flatMap((row) => {
        const regId = row.regulation_id as string | null;
        if (!regId || seenReg.has(regId)) return [];
        seenReg.add(regId);
        const raw = row.regulations as
          | { name: string | null; code: string | null }
          | { name: string | null; code: string | null }[]
          | null
          | undefined;
        const r = Array.isArray(raw) ? raw[0] : raw;
        if (!r?.name) return [];
        return [r.code ? `${r.name} (${r.code})` : r.name];
      })
      .join(", ") || undefined;

  const rawToken = randomBytes(24).toString("hex");
  const expiresAt = addDays(new Date(), 30).toISOString();

  const { error: tokErr } = await supabase.from("outreach_response_tokens").insert({
    token: rawToken,
    outreach_request_id: rid,
    expires_at: expiresAt,
    allowed_component_ids: eligible,
  });

  if (tokErr) {
    console.error("sendFollowUpUploadLink token:", tokErr);
    return { ok: false, error: tokErr.message };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const uploadUrl = `${baseUrl}/outreach/respond/${rawToken}`;

  await notifySupplierFollowUpLink({
    to: email,
    organizationName,
    uploadUrl,
    partSummary,
    regulationSummary,
    isTestNotification,
  });

  revalidatePath(`/outreach/requests/${rid}`);
  revalidatePath("/outreach");
  return { ok: true };
}

export async function submitOutreachRegulationReview(
  requestId: string,
  formData: FormData
): Promise<ReviewSubmitResult> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const rid = requestId?.trim();
  if (!rid) return { ok: false, error: "Invalid request." };

  const { data: req, error: re } = await supabase
    .from("outreach_requests")
    .select("id, component_id, organization_id")
    .eq("id", rid)
    .eq("organization_id", profile.organization_id)
    .maybeSingle();

  if (re || !req) return { ok: false, error: "Request not found." };
  if (!req.component_id) {
    return {
      ok: false,
      error: "This request has no component; compliance cannot be updated.",
    };
  }

  const componentId = req.component_id as string;

  const { data: rows, error: je } = await supabase
    .from("outreach_request_regulations")
    .select("id, regulation_id, review_status")
    .eq("outreach_request_id", rid);

  if (je) return { ok: false, error: je.message };

  const junction = rows ?? [];
  if (junction.length === 0) {
    return {
      ok: false,
      error:
        "No regulation rows found. Apply migration 015 (outreach_request_regulations) and ensure this request was created after the update.",
    };
  }

  const actionable = junction.filter(
    (r) => r.review_status === "pending" || r.review_status === "rejected"
  );

  if (actionable.length === 0) {
    return { ok: false, error: "There are no regulations waiting for a decision." };
  }

  for (const row of actionable) {
    const raw = ((formData.get(`decision_${row.regulation_id}`) as string) ?? "").trim();
    if (raw !== "approve" && raw !== "reject") {
      return {
        ok: false,
        error: "Please choose Approve or Reject for each open regulation.",
      };
    }
  }

  const now = new Date().toISOString();
  let anyRejected = false;

  for (const row of actionable) {
    const raw = (formData.get(`decision_${row.regulation_id}`) as string).trim();
    const notesRaw = (formData.get(`notes_${row.regulation_id}`) as string) ?? "";
    const notes = notesRaw.trim() || null;
    const regId = row.regulation_id as string;

    if (raw === "approve") {
      let uq1 = supabase
        .from("outreach_request_regulations")
        .update({
          review_status: "approved",
          reviewed_at: now,
          reviewed_by: profile.id,
          review_notes: notes,
        })
        .eq("outreach_request_id", rid)
        .eq("regulation_id", regId);
      uq1 = componentId ? uq1.eq("component_id", componentId) : uq1.is("component_id", null);
      const { error: u1 } = await uq1;

      if (u1) {
        console.error(u1);
        return { ok: false, error: u1.message };
      }

      const { error: u2 } = await supabase.from("component_regulations").upsert(
        {
          component_id: componentId,
          regulation_id: regId,
          status: "compliant",
          notes,
          updated_at: now,
        },
        { onConflict: "component_id,regulation_id" }
      );

      if (u2) {
        console.error(u2);
        return { ok: false, error: u2.message };
      }
    } else {
      anyRejected = true;
      let uq3 = supabase
        .from("outreach_request_regulations")
        .update({
          review_status: "rejected",
          reviewed_at: now,
          reviewed_by: profile.id,
          review_notes: notes,
        })
        .eq("outreach_request_id", rid)
        .eq("regulation_id", regId);
      uq3 = componentId ? uq3.eq("component_id", componentId) : uq3.is("component_id", null);
      const { error: u3 } = await uq3;

      if (u3) {
        console.error(u3);
        return { ok: false, error: u3.message };
      }
    }
  }

  if (anyRejected) {
    await supabase
      .from("outreach_response_tokens")
      .update({ used_at: null })
      .eq("outreach_request_id", rid);
  }

  const { data: finalRows } = await supabase
    .from("outreach_request_regulations")
    .select("review_status")
    .eq("outreach_request_id", rid);

  const statuses = (finalRows ?? []).map((r) => r.review_status as string);
  const allApproved = statuses.length > 0 && statuses.every((s) => s === "approved");
  const anyRej = statuses.some((s) => s === "rejected");

  const nextStatus = allApproved ? "approved" : anyRej ? "received" : "in_review";

  await supabase
    .from("outreach_requests")
    .update({ status: nextStatus, updated_at: now })
    .eq("id", rid);

  const { data: singleCtx } = await supabase
    .from("outreach_requests")
    .select(
      `
      suppliers (contact_email),
      organizations (name),
      outreach_campaigns (name, cohort_filters)
    `
    )
    .eq("id", rid)
    .maybeSingle();

  const rawSC = singleCtx?.suppliers as
    | { contact_email: string | null }
    | { contact_email: string | null }[]
    | null
    | undefined;
  const rawSCamp = singleCtx?.outreach_campaigns as
    | { name: string; cohort_filters: unknown }
    | { name: string; cohort_filters: unknown }[]
    | null
    | undefined;
  const campRow = Array.isArray(rawSCamp) ? rawSCamp[0] : rawSCamp;
  const sEmail = resolveOutreachNotificationEmail(
    (Array.isArray(rawSC) ? rawSC[0] : rawSC)?.contact_email,
    campRow?.cohort_filters
  );
  const reviewIsTestSingle = getTestEmailOverrideFromCohortFilters(campRow?.cohort_filters) !== null;
  const rawSO = singleCtx?.organizations as
    | { name: string }
    | { name: string }[]
    | null
    | undefined;
  const orgNm = (Array.isArray(rawSO) ? rawSO[0] : rawSO)?.name ?? "Organization";
  const campNm = campRow?.name ?? null;

  if (sEmail) {
    const regIds = actionable.map((r) => r.regulation_id as string);
    const { data: regRows } = await supabase
      .from("regulations")
      .select("id, name")
      .in("id", regIds);
    const regMap = new Map(
      (regRows ?? []).map((r) => [r.id as string, ((r.name as string) ?? "—") as string])
    );
    const { data: compRow } = await supabase
      .from("components")
      .select("name, part_number")
      .eq("id", componentId)
      .maybeSingle();
    const cn = ((compRow?.name as string | null) ?? "").trim();
    const pn = ((compRow?.part_number as string | null) ?? "").trim();
    const componentLabel =
      cn && pn ? `${cn} (${pn})` : cn || pn || componentId;

    const lines: Array<{
      decision: "approve" | "reject";
      regulationName: string;
      componentLabel: string;
    }> = [];
    for (const row of actionable) {
      const raw = (formData.get(`decision_${row.regulation_id}`) as string).trim();
      lines.push({
        decision: raw === "approve" ? "approve" : "reject",
        regulationName: regMap.get(row.regulation_id as string) ?? "—",
        componentLabel,
      });
    }
    void notifySupplierReviewDecisions({
      to: sEmail,
      organizationName: orgNm,
      campaignName: campNm,
      lines,
      isTestNotification: reviewIsTestSingle,
    });
  }

  revalidatePath("/outreach");
  revalidatePath(`/outreach/requests/${rid}`);
  revalidatePath(`/components/${componentId}`);

  return { ok: true };
}

/**
 * Form keys:
 * - `decision__<requestId>__<regulationId>` (legacy) and `notes__...`
 * - `decision__<requestId>__<componentKey>__<regulationId>` where componentKey is a UUID or `_` for null
 */
export async function submitCampaignOutreachReview(
  anchorRequestId: string,
  formData: FormData
): Promise<ReviewSubmitResult> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const anchor = anchorRequestId?.trim();
  if (!anchor) return { ok: false, error: "Invalid request." };

  const { data: anchorRow, error: ae } = await supabase
    .from("outreach_requests")
    .select("id, campaign_id, organization_id")
    .eq("id", anchor)
    .eq("organization_id", profile.organization_id)
    .maybeSingle();

  if (ae || !anchorRow) return { ok: false, error: "Request not found." };

  const campaignId = anchorRow.campaign_id as string | null;
  let requestIds: string[];
  if (campaignId) {
    const { data: cr } = await supabase
      .from("outreach_requests")
      .select("id")
      .eq("campaign_id", campaignId)
      .eq("organization_id", profile.organization_id as string);
    requestIds = (cr ?? []).map((r) => r.id as string);
  } else {
    requestIds = [anchor];
  }

  type Scoped = {
    reqId: string;
    /** From form (4-part) or request row (2-part legacy). */
    junctionComponentId: string | null;
    regId: string;
  };

  const decisions = new Map<string, "approve" | "reject">();
  const notes = new Map<string, string>();

  function scopedKey(s: Scoped): string {
    return `${s.reqId}::${s.junctionComponentId ?? ""}::${s.regId}`;
  }

  const rowComponentByRequest = new Map<string, string | null>();

  async function getRowComponentId(reqId: string): Promise<string | null> {
    if (rowComponentByRequest.has(reqId)) {
      return rowComponentByRequest.get(reqId) ?? null;
    }
    const { data: reqRow } = await supabase
      .from("outreach_requests")
      .select("component_id")
      .eq("id", reqId)
      .maybeSingle();
    const v = (reqRow?.component_id as string | null) ?? null;
    rowComponentByRequest.set(reqId, v);
    return v;
  }

  for (const [key, val] of formData.entries()) {
    if (typeof val !== "string") continue;
    const parts = key.split("__");
    if (parts.length < 3) continue;
    const kind = parts[0];
    if (kind !== "decision" && kind !== "notes") continue;

    let reqId: string;
    let regId: string;
    let compSegment: string | undefined;

    if (parts.length === 3) {
      reqId = parts[1];
      regId = parts[2];
    } else if (parts.length === 4) {
      reqId = parts[1];
      compSegment = parts[2];
      regId = parts[3];
    } else {
      continue;
    }

    if (!requestIds.includes(reqId)) continue;

    const rowComponentId = await getRowComponentId(reqId);

    let junctionComponentId: string | null;
    if (compSegment === undefined) {
      junctionComponentId = rowComponentId;
    } else if (compSegment === "_") {
      junctionComponentId = null;
    } else {
      junctionComponentId = compSegment;
    }

    const scoped: Scoped = { reqId, junctionComponentId, regId };
    const sk = scopedKey(scoped);

    if (kind === "decision") {
      const v = val.trim();
      if (v !== "approve" && v !== "reject") continue;
      decisions.set(sk, v);
    } else {
      notes.set(sk, val.trim());
    }
  }

  if (decisions.size === 0) {
    return { ok: false, error: "No decisions submitted." };
  }

  const now = new Date().toISOString();
  const revalidatedComponents = new Set<string>();
  const touchedRequestIds = new Set<string>();

  for (const [sk, raw] of decisions.entries()) {
    const [reqId, compPart, regId] = sk.split("::");
    const junctionComponentId = compPart === "" ? null : compPart;
    touchedRequestIds.add(reqId);

    const { data: jRows } = await supabase
      .from("outreach_request_regulations")
      .select("regulation_id, review_status, component_id")
      .eq("outreach_request_id", reqId)
      .eq("regulation_id", regId);

    const candidates = (jRows ?? []).filter((r) => {
      const jc = r.component_id as string | null;
      if (junctionComponentId === null) return jc === null;
      return jc === junctionComponentId;
    });
    const row = candidates[0];
    if (!row) continue;

    const status = row.review_status as string;
    if (status !== "pending" && status !== "rejected") continue;

    const notesVal = (notes.get(sk) ?? "").trim() || null;
    const rollUpComponentId = junctionComponentId;

    if (raw === "approve") {
      let uq = supabase
        .from("outreach_request_regulations")
        .update({
          review_status: "approved",
          reviewed_at: now,
          reviewed_by: profile.id,
          review_notes: notesVal,
        })
        .eq("outreach_request_id", reqId)
        .eq("regulation_id", regId);
      uq = junctionComponentId
        ? uq.eq("component_id", junctionComponentId)
        : uq.is("component_id", null);
      const { error: u1 } = await uq;
      if (u1) return { ok: false, error: u1.message };

      if (rollUpComponentId) {
        const { error: u2 } = await supabase.from("component_regulations").upsert(
          {
            component_id: rollUpComponentId,
            regulation_id: regId,
            status: "compliant",
            notes: notesVal,
            updated_at: now,
          },
          { onConflict: "component_id,regulation_id" }
        );
        if (u2) return { ok: false, error: u2.message };
        revalidatedComponents.add(rollUpComponentId);
      }
    } else {
      let uq = supabase
        .from("outreach_request_regulations")
        .update({
          review_status: "rejected",
          reviewed_at: now,
          reviewed_by: profile.id,
          review_notes: notesVal,
        })
        .eq("outreach_request_id", reqId)
        .eq("regulation_id", regId);
      uq = junctionComponentId
        ? uq.eq("component_id", junctionComponentId)
        : uq.is("component_id", null);
      const { error: u3 } = await uq;
      if (u3) return { ok: false, error: u3.message };

      await supabase
        .from("outreach_response_tokens")
        .update({ used_at: null })
        .eq("outreach_request_id", reqId);
    }
  }

  for (const reqId of touchedRequestIds) {
    const uploadCovered = await fetchUploadCoverageComponentIds(supabase, reqId);

    const { data: finalRows } = await supabase
      .from("outreach_request_regulations")
      .select("review_status, component_id")
      .eq("outreach_request_id", reqId);

    let rowsForGate = (finalRows ?? []).filter((r) => {
      if (uploadCovered.size === 0) return true;
      const cid = r.component_id as string | null;
      return cid !== null && uploadCovered.has(cid);
    });
    if (uploadCovered.size > 0 && rowsForGate.length === 0) {
      rowsForGate = finalRows ?? [];
    }

    const statuses = rowsForGate.map((r) => r.review_status as string);
    const allApproved = statuses.length > 0 && statuses.every((s) => s === "approved");
    const anyRej = statuses.some((s) => s === "rejected");
    const nextStatus = allApproved ? "approved" : anyRej ? "received" : "in_review";

    await supabase
      .from("outreach_requests")
      .update({ status: nextStatus, updated_at: now })
      .eq("id", reqId);
  }

  const { data: notifyCtx } = await supabase
    .from("outreach_requests")
    .select(
      `
      suppliers (contact_email),
      organizations (name),
      outreach_campaigns (name, cohort_filters)
    `
    )
    .eq("id", anchor)
    .maybeSingle();

  const rawNotifyS = notifyCtx?.suppliers as
    | { contact_email: string | null }
    | { contact_email: string | null }[]
    | null
    | undefined;
  const notifySup = Array.isArray(rawNotifyS) ? rawNotifyS[0] : rawNotifyS;

  const rawNotifyC = notifyCtx?.outreach_campaigns as
    | { name: string; cohort_filters: unknown }
    | { name: string; cohort_filters: unknown }[]
    | null
    | undefined;
  const notifyCamp = Array.isArray(rawNotifyC) ? rawNotifyC[0] : rawNotifyC;
  const reviewNotifyEmail = resolveOutreachNotificationEmail(
    notifySup?.contact_email,
    notifyCamp?.cohort_filters
  );
  const reviewIsTestCampaign = getTestEmailOverrideFromCohortFilters(notifyCamp?.cohort_filters) !== null;

  const rawNotifyO = notifyCtx?.organizations as
    | { name: string }
    | { name: string }[]
    | null
    | undefined;
  const notifyOrg = Array.isArray(rawNotifyO) ? rawNotifyO[0] : rawNotifyO;
  const reviewOrgName = notifyOrg?.name ?? "Organization";

  if (reviewNotifyEmail) {
    const regIds = new Set<string>();
    const compIds = new Set<string>();
    for (const sk of decisions.keys()) {
      const parts = sk.split("::");
      if (parts.length < 3) continue;
      const regId = parts[2];
      const compPart = parts[1];
      regIds.add(regId);
      if (compPart) compIds.add(compPart);
    }

    const { data: regRows } = await supabase
      .from("regulations")
      .select("id, name")
      .in("id", [...regIds]);
    const { data: compRows } = await supabase
      .from("components")
      .select("id, name, part_number")
      .in("id", [...compIds]);

    const regMap = new Map(
      (regRows ?? []).map((r) => [r.id as string, ((r.name as string) ?? "—") as string])
    );
    const compMap = new Map<string, string>();
    for (const c of compRows ?? []) {
      const name = ((c.name as string | null) ?? "").trim();
      const pn = ((c.part_number as string | null) ?? "").trim();
      compMap.set(
        c.id as string,
        name && pn ? `${name} (${pn})` : name || pn || (c.id as string)
      );
    }

    const lines: Array<{
      decision: "approve" | "reject";
      regulationName: string;
      componentLabel: string;
    }> = [];
    for (const [sk, raw] of decisions.entries()) {
      const parts = sk.split("::");
      if (parts.length < 3) continue;
      const regId = parts[2];
      const compPart = parts[1];
      lines.push({
        decision: raw,
        regulationName: regMap.get(regId) ?? "—",
        componentLabel: compPart ? (compMap.get(compPart) ?? compPart) : "—",
      });
    }

    if (lines.length > 0) {
      void notifySupplierReviewDecisions({
        to: reviewNotifyEmail,
        organizationName: reviewOrgName,
        campaignName: notifyCamp?.name ?? null,
        lines,
        isTestNotification: reviewIsTestCampaign,
      });
    }
  }

  revalidatePath("/outreach");
  for (const rid of requestIds) {
    revalidatePath(`/outreach/requests/${rid}`);
  }
  for (const cid of revalidatedComponents) {
    revalidatePath(`/components/${cid}`);
  }

  return { ok: true };
}
