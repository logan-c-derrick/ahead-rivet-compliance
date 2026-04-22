"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import {
  htmlMergeFieldList,
  messageTemplatedToEmailHtml,
} from "@/lib/outreach-email-html";
import { getPermissionErrorMessage, requireRole, type Profile } from "@/lib/profile";

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function applyTemplate(
  template: string,
  vars: Record<string, string>
): string {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(v);
  }
  return out;
}

export type OutreachActionState =
  | { error: string }
  | { success: true; redirectTo: string }
  | null;

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function isAheadDomainEmail(s: string): boolean {
  const normalized = s.trim().toLowerCase();
  return normalized.endsWith("@ahead.com");
}

export type OutreachTargetRow = {
  supplier_id: string | null;
  component_id: string | null;
  supplier_name: string;
  contact_email: string | null;
  component_display: string | null;
};

type ResolveResult =
  | { ok: true; targets: OutreachTargetRow[]; cohortFilters: Record<string, unknown> }
  | { ok: false; error: string };

async function resolveOutreachTargets(
  profile: Profile,
  supabase: Awaited<ReturnType<typeof createClient>>,
  formData: FormData
): Promise<ResolveResult> {
  const mode = ((formData.get("targeting_mode") as string) || "all").trim();
  const countries = formData.getAll("cohort_country").map(String).filter(Boolean);

  if (mode === "all") {
    let q = supabase
      .from("suppliers")
      .select("id, name, contact_email, country")
      .eq("organization_id", profile.organization_id);
    if (countries.length > 0) {
      q = q.in("country", countries);
    }
    const { data, error } = await q.order("name");
    if (error) return { ok: false, error: error.message };
    const rows = (data ?? []) as {
      id: string;
      name: string;
      contact_email: string | null;
    }[];
    if (rows.length === 0) {
      return {
        ok: false,
        error:
          "No suppliers match the cohort filters. Add suppliers, clear region filters, or choose a different targeting mode.",
      };
    }
    return {
      ok: true,
      targets: rows.map((s) => ({
        supplier_id: s.id,
        component_id: null,
        supplier_name: s.name,
        contact_email: s.contact_email,
        component_display: null,
      })),
      cohortFilters: { targeting_mode: "all", countries },
    };
  }

  if (mode === "suppliers") {
    const csv = (formData.get("target_supplier_ids") as string)?.trim() ?? "";
    const fromCsv = csv ? [...new Set(csv.split(",").map((s) => s.trim()).filter(Boolean))] : [];
    const legacy = formData.getAll("target_supplier_id").map(String).filter(Boolean);
    const ids = fromCsv.length > 0 ? fromCsv : legacy;
    if (ids.length === 0) {
      return { ok: false, error: "Select at least one supplier." };
    }
    const { data, error } = await supabase
      .from("suppliers")
      .select("id, name, contact_email")
      .eq("organization_id", profile.organization_id)
      .in("id", ids);
    if (error) return { ok: false, error: error.message };
    const rows = (data ?? []) as {
      id: string;
      name: string;
      contact_email: string | null;
    }[];
    if (rows.length === 0) {
      return { ok: false, error: "No matching suppliers found for your selection." };
    }
    return {
      ok: true,
      targets: rows.map((s) => ({
        supplier_id: s.id,
        component_id: null,
        supplier_name: s.name,
        contact_email: s.contact_email,
        component_display: null,
      })),
      cohortFilters: { targeting_mode: "suppliers", supplier_ids: ids },
    };
  }

  if (mode === "product") {
    const productId = (formData.get("target_product_id") as string)?.trim();
    if (!productId) {
      return { ok: false, error: "Select a product to target its BOM components." };
    }
    const { data: links, error: le } = await supabase
      .from("product_components")
      .select("component_id")
      .eq("product_id", productId);
    if (le) return { ok: false, error: le.message };
    const cids = [...new Set((links ?? []).map((l: { component_id: string }) => l.component_id))];
    if (cids.length === 0) {
      return {
        ok: false,
        error: "This product has no components on its BOM. Add components first.",
      };
    }
    const { data: comps, error: ce } = await supabase
      .from("components")
      .select("id, name, part_number, supplier_id, suppliers(name, contact_email)")
      .eq("organization_id", profile.organization_id)
      .in("id", cids);
    if (ce) return { ok: false, error: ce.message };
    const list = (comps ?? []) as unknown as Array<{
      id: string;
      name: string;
      part_number: string | null;
      supplier_id: string | null;
      suppliers: { name: string; contact_email: string | null } | null;
    }>;
    if (list.length === 0) {
      return { ok: false, error: "Could not load components for this product." };
    }
    list.sort((a, b) => a.name.localeCompare(b.name));
    return {
      ok: true,
      targets: list.map((c) => {
        const sn = c.suppliers?.name ?? "Unknown supplier";
        const display =
          [c.name, c.part_number].filter(Boolean).join(" · ") || c.name;
        return {
          supplier_id: c.supplier_id,
          component_id: c.id,
          supplier_name: sn,
          contact_email: c.suppliers?.contact_email ?? null,
          component_display: display,
        };
      }),
      cohortFilters: { targeting_mode: "product", product_id: productId },
    };
  }

  if (mode === "components") {
    const csv = (formData.get("target_component_ids") as string)?.trim() ?? "";
    const fromCsv = csv ? [...new Set(csv.split(",").map((s) => s.trim()).filter(Boolean))] : [];
    const legacy = formData.getAll("target_component_id").map(String).filter(Boolean);
    const ids = fromCsv.length > 0 ? fromCsv : legacy;
    if (ids.length === 0) {
      return { ok: false, error: "Select at least one component (use search to narrow the list)." };
    }
    const { data: comps, error: ce } = await supabase
      .from("components")
      .select("id, name, part_number, supplier_id, suppliers(name, contact_email)")
      .eq("organization_id", profile.organization_id)
      .in("id", ids);
    if (ce) return { ok: false, error: ce.message };
    const list = (comps ?? []) as unknown as Array<{
      id: string;
      name: string;
      part_number: string | null;
      supplier_id: string | null;
      suppliers: { name: string; contact_email: string | null } | null;
    }>;
    if (list.length === 0) {
      return { ok: false, error: "No matching components found." };
    }
    const idOrder = new Map(ids.map((id, idx) => [id, idx]));
    list.sort(
      (a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0)
    );
    return {
      ok: true,
      targets: list.map((c) => {
        const sn = c.suppliers?.name ?? "Unknown supplier";
        const display =
          [c.name, c.part_number].filter(Boolean).join(" · ") || c.name;
        return {
          supplier_id: c.supplier_id,
          component_id: c.id,
          supplier_name: sn,
          contact_email: c.suppliers?.contact_email ?? null,
          component_display: display,
        };
      }),
      cohortFilters: { targeting_mode: "components", component_ids: ids },
    };
  }

  return { ok: false, error: "Invalid targeting mode." };
}

/** One outreach_request per campaign; multi-supplier / all-suppliers is not supported. */
function validateConsolidatedCampaignTargets(
  targetingMode: string,
  targets: OutreachTargetRow[]
): string | null {
  if (targets.length === 0) {
    return "No targets resolved for this campaign.";
  }
  if (targetingMode === "all") {
    return (
      "A single consolidated request cannot target all suppliers at once. " +
      "Use component, product, or specific supplier targeting."
    );
  }
  const supplierIds = new Set(
    targets.map((t) => t.supplier_id).filter(Boolean) as string[]
  );
  if (targetingMode === "suppliers" && targets.length > 1) {
    return "Select only one supplier for a consolidated request, or launch separate campaigns.";
  }
  if (
    (targetingMode === "components" || targetingMode === "product") &&
    supplierIds.size > 1
  ) {
    return (
      "A consolidated campaign can only include parts from one supplier. " +
      "Narrow your selection or use separate campaigns."
    );
  }
  return null;
}

function buildCampaignRegulationJunctionRows(
  outreachRequestId: string,
  regulationIds: string[],
  targets: OutreachTargetRow[]
): Array<{
  outreach_request_id: string;
  regulation_id: string;
  component_id: string | null;
  review_status: string;
}> {
  const rows: Array<{
    outreach_request_id: string;
    regulation_id: string;
    component_id: string | null;
    review_status: string;
  }> = [];
  const seen = new Set<string>();
  const withComponents = targets.filter((t) => t.component_id);
  if (withComponents.length > 0) {
    for (const regId of regulationIds) {
      for (const t of withComponents) {
        const cid = t.component_id as string;
        const k = `${regId}:${cid}`;
        if (seen.has(k)) continue;
        seen.add(k);
        rows.push({
          outreach_request_id: outreachRequestId,
          regulation_id: regId,
          component_id: cid,
          review_status: "pending",
        });
      }
    }
    return rows;
  }
  for (const regId of regulationIds) {
    rows.push({
      outreach_request_id: outreachRequestId,
      regulation_id: regId,
      component_id: null,
      review_status: "pending",
    });
  }
  return rows;
}

/** Dispatches save vs launch from one form using `intent` submit button. */
export async function submitCampaignIntent(
  prev: OutreachActionState,
  formData: FormData
): Promise<OutreachActionState> {
  const intent = (formData.get("intent") as string) || "launch";
  if (intent === "draft") {
    return (await saveOutreachCampaignDraft(prev, formData)) ?? null;
  }
  return (await launchOutreachCampaign(prev, formData)) ?? null;
}

function regulationIdsFromForm(formData: FormData): string[] {
  const csv = (formData.get("regulation_ids") as string)?.trim() ?? "";
  const fromCsv = csv
    ? [...new Set(csv.split(",").map((s) => s.trim()).filter(Boolean))]
    : [];
  const legacy = [
    ...new Set(formData.getAll("regulation_id").map(String).map((s) => s.trim()).filter(Boolean)),
  ];
  return fromCsv.length > 0 ? fromCsv : legacy;
}

function cohortFiltersFromForm(formData: FormData): Record<string, unknown> {
  const mode = ((formData.get("targeting_mode") as string) || "all").trim();
  const countries = formData.getAll("cohort_country").map(String).filter(Boolean);
  const base: Record<string, unknown> = {
    targeting_mode: mode,
    countries,
    regulation_ids: regulationIdsFromForm(formData),
  };
  if (mode === "suppliers") {
    const csv = (formData.get("target_supplier_ids") as string)?.trim() ?? "";
    const fromCsv = csv ? [...new Set(csv.split(",").map((s) => s.trim()).filter(Boolean))] : [];
    const legacy = formData.getAll("target_supplier_id").map(String).filter(Boolean);
    base.supplier_ids = fromCsv.length > 0 ? fromCsv : legacy;
  }
  if (mode === "product") {
    base.product_id = (formData.get("target_product_id") as string)?.trim() || null;
  }
  if (mode === "components") {
    const csv = (formData.get("target_component_ids") as string)?.trim() ?? "";
    const fromCsv = csv ? [...new Set(csv.split(",").map((s) => s.trim()).filter(Boolean))] : [];
    const legacy = formData.getAll("target_component_id").map(String).filter(Boolean);
    base.component_ids = fromCsv.length > 0 ? fromCsv : legacy;
  }
  return base;
}

export async function saveOutreachCampaignDraft(
  _prev: OutreachActionState,
  formData: FormData
): Promise<OutreachActionState> {
  let profile: Profile;
  try {
    profile = await requireRole(["admin", "compliance_manager"]);
  } catch (error) {
    return { error: getPermissionErrorMessage(error) ?? "Unable to save campaign draft." };
  }
  const supabase = await createClient();

  const name = (formData.get("campaign_name") as string)?.trim();
  const regulationIds = regulationIdsFromForm(formData);
  const primaryRegulationId = regulationIds[0] ?? null;
  const subjectTemplate =
    (formData.get("subject_template") as string)?.trim() || null;
  const messageTemplate =
    (formData.get("message_template") as string)?.trim() || null;
  const followUpDays = Math.max(
    1,
    parseInt(String(formData.get("follow_up_days") ?? "7"), 10) || 7
  );

  if (!name) {
    return { error: "Campaign name is required" };
  }

  const { error } = await supabase.from("outreach_campaigns").insert({
    organization_id: profile.organization_id,
    name,
    regulation_id: primaryRegulationId,
    subject_template: subjectTemplate,
    message_template: messageTemplate,
    status: "draft",
    follow_up_days: followUpDays,
    cohort_filters: cohortFiltersFromForm(formData),
    created_by: profile.id,
  });

  if (error) {
    console.error("saveOutreachCampaignDraft:", error);
    return { error: error.message };
  }

  revalidatePath("/outreach");
  return { success: true, redirectTo: "/outreach" };
}

export async function launchOutreachCampaign(
  _prev: OutreachActionState,
  formData: FormData
): Promise<OutreachActionState> {
  let profile: Profile;
  try {
    profile = await requireRole(["admin", "compliance_manager"]);
  } catch (error) {
    return { error: getPermissionErrorMessage(error) ?? "Unable to launch campaign." };
  }
  const supabase = await createClient();

  const name = (formData.get("campaign_name") as string)?.trim();
  const regulationIds = regulationIdsFromForm(formData);
  const subjectTemplate =
    (formData.get("subject_template") as string)?.trim() ||
    "Compliance data request: {{regulation_names}}";
  const messageTemplate =
    (formData.get("message_template") as string)?.trim() || "";
  const followUpDays = Math.max(
    1,
    parseInt(String(formData.get("follow_up_days") ?? "7"), 10) || 7
  );
  const dueRaw = (formData.get("due_date") as string)?.trim();
  const dueDate = dueRaw || null;
  const testEmailRaw = (formData.get("test_email_override") as string)?.trim() ?? "";
  if (testEmailRaw && !isValidEmail(testEmailRaw)) {
    return { error: "Test email override must be a valid email address (or leave blank)." };
  }
  if (testEmailRaw && !isAheadDomainEmail(testEmailRaw)) {
    return { error: "Test email override must use an @ahead.com email address." };
  }
  const testEmailOverride = testEmailRaw ? testEmailRaw : "";

  if (!name) {
    return { error: "Campaign name is required" };
  }
  if (regulationIds.length === 0) {
    return { error: "Please select at least one regulation" };
  }
  if (!messageTemplate) {
    return { error: "Message body is required" };
  }

  const { data: regulationRows, error: regErr } = await supabase
    .from("regulations")
    .select("id, name, code")
    .in("id", regulationIds);

  if (regErr || !regulationRows?.length) {
    return { error: "Regulation not found" };
  }

  type RegInfo = { name: string; code: string | null };
  const regById = new Map<string, RegInfo>(
    (regulationRows as { id: string; name: string; code: string | null }[]).map(
      (r) => [r.id, { name: r.name, code: r.code }]
    )
  );
  for (const id of regulationIds) {
    if (!regById.has(id)) {
      return { error: "One or more selected regulations were not found." };
    }
  }

  function formatRegulationLine(info: RegInfo): string {
    const c = info.code?.trim();
    return c ? `${c} — ${info.name}` : info.name;
  }

  const regulationLinesOrdered = regulationIds
    .map((id) => {
      const r = regById.get(id);
      return r ? formatRegulationLine(r) : "";
    })
    .filter(Boolean);
  const regulation_names = regulationLinesOrdered.join(", ");
  const regulation_list =
    regulationLinesOrdered.length > 0
      ? htmlMergeFieldList(regulationLinesOrdered)
      : "<p>—</p>";

  const resolved = await resolveOutreachTargets(profile, supabase, formData);
  if (!resolved.ok) {
    return { error: resolved.error };
  }

  const targets = resolved.targets;
  const targetingMode = String(
    (resolved.cohortFilters as { targeting_mode?: string }).targeting_mode ?? "all"
  );
  const consolidatedErr = validateConsolidatedCampaignTargets(targetingMode, targets);
  if (consolidatedErr) {
    return { error: consolidatedErr };
  }

  const componentLinesOrdered: string[] = [];
  const seenComponentIds = new Set<string>();
  for (const t of targets) {
    if (!t.component_id || !t.component_display) continue;
    if (seenComponentIds.has(t.component_id)) continue;
    seenComponentIds.add(t.component_id);
    componentLinesOrdered.push(t.component_display);
  }
  const component_names =
    componentLinesOrdered.length > 0
      ? componentLinesOrdered.join(", ")
      : "—";
  const component_list =
    componentLinesOrdered.length > 0
      ? htmlMergeFieldList(componentLinesOrdered)
      : "<p>—</p>";

  const firstRegName = regById.get(regulationIds[0])?.name ?? "—";

  if (testEmailOverride && !process.env.RESEND_API_KEY?.trim()) {
    return {
      error:
        "Test email requires RESEND_API_KEY in your environment (e.g. .env.local). Restart the dev server after adding it. Without Resend configured, no messages are sent.",
    };
  }

  const cohortFilters: Record<string, unknown> = {
    ...resolved.cohortFilters,
    countries: formData.getAll("cohort_country").map(String).filter(Boolean),
    regulation_ids: regulationIds,
  };
  if (testEmailOverride) {
    cohortFilters.test_email_override = testEmailOverride;
  }

  const { data: campaign, error: campErr } = await supabase
    .from("outreach_campaigns")
    .insert({
      organization_id: profile.organization_id,
      name,
      regulation_id: regulationIds[0] ?? null,
      subject_template: subjectTemplate,
      message_template: messageTemplate,
      status: "active",
      follow_up_days: followUpDays,
      cohort_filters: cohortFilters,
      created_by: profile.id,
      activated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (campErr || !campaign) {
    console.error("launchOutreachCampaign campaign:", campErr);
    return { error: campErr?.message ?? "Failed to create campaign" };
  }

  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");
  let emailsAttempted = 0;
  let emailsFailed = 0;

  const regNote = `Regulations: ${regulation_names}`;
  const scopeParts = targets
    .filter((t) => t.component_id)
    .map((t) => t.component_display ?? t.component_id);
  const scopeNote =
    scopeParts.length > 0
      ? `Campaign: ${name} | Components: ${scopeParts.join("; ")}`
      : `Campaign: ${name}`;

  const sharedSupplierId =
    targets.length > 0 &&
    targets.every((t) => t.supplier_id === targets[0].supplier_id)
      ? targets[0].supplier_id
      : null;

  const { data: req, error: reqErr } = await supabase
    .from("outreach_requests")
    .insert({
      organization_id: profile.organization_id,
      supplier_id: sharedSupplierId,
      component_id: null,
      regulation_id: regulationIds[0] ?? null,
      request_type: "campaign_documentation",
      status: "sent",
      requested_by: profile.id,
      due_date: dueDate,
      campaign_id: campaign.id,
      notes: `${scopeNote} | ${regNote}`,
    })
    .select("id")
    .single();

  if (reqErr || !req) {
    console.error("outreach_requests insert:", reqErr);
    return {
      error: `Could not create outreach request: ${reqErr?.message ?? "unknown error"}`,
    };
  }

  const junctionRows = buildCampaignRegulationJunctionRows(
    req.id,
    regulationIds,
    targets
  );

  const { error: jErr } = await supabase
    .from("outreach_request_regulations")
    .insert(junctionRows);

  if (jErr) {
    console.error("outreach_request_regulations insert:", jErr);
    await supabase.from("outreach_requests").delete().eq("id", req.id);
    return {
      error: `Could not attach regulations to request: ${jErr.message}`,
    };
  }

  const rawToken = randomBytes(24).toString("hex");
  const expiresAt = addDays(new Date(), 30).toISOString();

  const { error: tokErr } = await supabase
    .from("outreach_response_tokens")
    .insert({
      token: rawToken,
      outreach_request_id: req.id,
      expires_at: expiresAt,
    });

  if (tokErr) {
    console.error("outreach_response_tokens insert:", tokErr);
    await supabase.from("outreach_requests").delete().eq("id", req.id);
    return {
      error: `Could not create response link: ${tokErr.message}`,
    };
  }

  const portalLink = `${baseUrl}/outreach/respond/${rawToken}`;
  const primary = targets[0];
  const deadline = dueDate || "TBD";
  const consolidatedComponentName =
    componentLinesOrdered.length <= 1
      ? (primary.component_display ?? "—")
      : component_names;

  const emailVars = {
    supplier_contact: primary.supplier_name,
    component_name: consolidatedComponentName,
    component_names,
    component_list,
    regulation_name: firstRegName,
    regulation_names,
    regulation_list,
    deadline_date: deadline,
    portal_unique_link: portalLink,
  };

  const subjectRendered = applyTemplate(subjectTemplate, emailVars);
  const textBody = applyTemplate(messageTemplate, emailVars);
  const htmlBody = messageTemplatedToEmailHtml(textBody);

  if (testEmailOverride) {
    emailsAttempted = 1;
    const result = await sendEmail({
      to: testEmailOverride,
      subject: `[TEST] ${subjectRendered}`,
      html: htmlBody,
    });
    if (!result.ok) {
      return {
        error: `Test email failed: ${result.error}`,
      };
    }
  } else {
    const to = primary.contact_email?.trim();
    if (to) {
      emailsAttempted = 1;
      const result = await sendEmail({
        to,
        subject: subjectRendered,
        html: htmlBody,
      });
      if (!result.ok) {
        emailsFailed = 1;
        console.warn("Outreach email failed:", result.error);
      }
    }
  }

  revalidatePath("/outreach");
  const q = new URLSearchParams({
    launched: "1",
    requests: "1",
    emails: String(emailsAttempted),
    failed: String(emailsFailed),
  });
  if (testEmailOverride) q.set("test", "1");
  return { success: true, redirectTo: `/outreach?${q.toString()}` };
}

export async function deleteOutreachCampaign(campaignId: string): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const id = campaignId?.trim();
  if (!id) {
    return { ok: false, error: "Missing campaign id" };
  }

  let profile: Profile;
  try {
    profile = await requireRole(["admin", "compliance_manager"]);
  } catch (error) {
    return { ok: false, error: getPermissionErrorMessage(error) ?? "Unable to delete campaign." };
  }
  const supabase = await createClient();

  const { data: row, error: fetchErr } = await supabase
    .from("outreach_campaigns")
    .select("id")
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .maybeSingle();

  if (fetchErr || !row) {
    return { ok: false, error: "Campaign not found" };
  }

  const { error: delErr } = await supabase
    .from("outreach_campaigns")
    .delete()
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  if (delErr) {
    console.error("deleteOutreachCampaign:", delErr);
    return { ok: false, error: delErr.message };
  }

  revalidatePath("/outreach");
  return { ok: true };
}

export async function deleteOutreachRequest(requestId: string): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const id = requestId?.trim();
  if (!id) {
    return { ok: false, error: "Missing request id" };
  }

  let profile: Profile;
  try {
    profile = await requireRole(["admin", "compliance_manager"]);
  } catch (error) {
    return { ok: false, error: getPermissionErrorMessage(error) ?? "Unable to delete request." };
  }
  const supabase = await createClient();

  const { data: row, error: fetchErr } = await supabase
    .from("outreach_requests")
    .select("id")
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .maybeSingle();

  if (fetchErr || !row) {
    return { ok: false, error: "Request not found" };
  }

  const { error: delErr } = await supabase
    .from("outreach_requests")
    .delete()
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  if (delErr) {
    console.error("deleteOutreachRequest:", delErr);
    return { ok: false, error: delErr.message };
  }

  revalidatePath("/outreach");
  return { ok: true };
}

const BULK_DELETE_MAX = 500;

export async function deleteOutreachRequestsBulk(
  requestIds: string[]
): Promise<
  { ok: true; deleted: number } | { ok: false; error: string }
> {
  const ids = [...new Set(requestIds.map((x) => x.trim()).filter(Boolean))];
  if (ids.length === 0) {
    return { ok: false, error: "No requests selected" };
  }
  if (ids.length > BULK_DELETE_MAX) {
    return {
      ok: false,
      error: `Too many requests at once (maximum ${BULK_DELETE_MAX})`,
    };
  }

  let profile: Profile;
  try {
    profile = await requireRole(["admin", "compliance_manager"]);
  } catch (error) {
    return { ok: false, error: getPermissionErrorMessage(error) ?? "Unable to delete selected requests." };
  }
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("outreach_requests")
    .delete()
    .eq("organization_id", profile.organization_id)
    .in("id", ids)
    .select("id");

  if (error) {
    console.error("deleteOutreachRequestsBulk:", error);
    return { ok: false, error: error.message };
  }

  revalidatePath("/outreach");
  return { ok: true, deleted: data?.length ?? 0 };
}
