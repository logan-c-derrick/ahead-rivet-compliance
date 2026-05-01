import { htmlMergeFieldList, messageTemplatedToEmailHtml } from "@/lib/outreach-email-html";

type CampaignRow = {
  id: string;
  name: string;
  subject_template: string | null;
  message_template: string | null;
};

export type ManualOutreachEmailRow = {
  campaign_id: string;
  campaign_name: string;
  request_id: string;
  supplier_name: string;
  to_email: string;
  subject: string;
  portal_link: string;
  body_html: string;
  body_text: string;
  component_names: string;
  regulation_names: string;
};

function applyTemplate(template: string, vars: Record<string, string>): string {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(v);
  }
  return out;
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*\/p\s*>/gi, "\n\n")
    .replace(/<\s*\/li\s*>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function buildManualOutreachPreviewRows(opts: {
  supabase: any;
  organizationId: string;
  campaignId: string;
  appUrl: string;
}): Promise<{
  campaign: CampaignRow | null;
  rows: ManualOutreachEmailRow[];
}> {
  const { supabase, organizationId, campaignId, appUrl } = opts;
  const { data: campaign } = await supabase
    .from("outreach_campaigns")
    .select("id, name, subject_template, message_template")
    .eq("id", campaignId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!campaign) return { campaign: null, rows: [] };
  const c = campaign as CampaignRow;

  const { data: requestRows } = await supabase
    .from("outreach_requests")
    .select("id, supplier_id, due_date")
    .eq("campaign_id", campaignId)
    .eq("organization_id", organizationId)
    .order("requested_at", { ascending: true });
  const requests = (requestRows ?? []) as Array<{
    id: string;
    supplier_id: string | null;
    due_date: string | null;
  }>;
  if (requests.length === 0) return { campaign: c, rows: [] };

  const requestIds = requests.map((r) => r.id);
  const supplierIds = [
    ...new Set(requests.map((r) => r.supplier_id).filter(Boolean) as string[]),
  ];

  const [{ data: tokenRows }, { data: supplierRows }, { data: regulationRows }, { data: componentRows }] =
    await Promise.all([
      supabase
        .from("outreach_response_tokens")
        .select("outreach_request_id, token, created_at")
        .in("outreach_request_id", requestIds)
        .order("created_at", { ascending: false }),
      supplierIds.length
        ? supabase.from("suppliers").select("id, name, contact_email").in("id", supplierIds)
        : Promise.resolve({ data: [] as unknown[] }),
      supabase
        .from("outreach_request_regulations")
        .select("outreach_request_id, regulations(code, name)")
        .in("outreach_request_id", requestIds),
      supabase
        .from("outreach_request_regulations")
        .select("outreach_request_id, components(name, part_number)")
        .in("outreach_request_id", requestIds)
        .not("component_id", "is", null),
    ]);

  const tokenByRequest = new Map<string, string>();
  for (const row of tokenRows ?? []) {
    const rr = row as { outreach_request_id: string; token: string };
    if (!tokenByRequest.has(rr.outreach_request_id)) {
      tokenByRequest.set(rr.outreach_request_id, rr.token);
    }
  }

  const supplierById = new Map<string, { name: string; contact_email: string | null }>();
  for (const row of supplierRows ?? []) {
    const s = row as { id: string; name: string; contact_email: string | null };
    supplierById.set(s.id, { name: s.name, contact_email: s.contact_email });
  }

  const regulationsByRequest = new Map<string, string[]>();
  for (const row of regulationRows ?? []) {
    const rr = row as {
      outreach_request_id: string;
      regulations: { code: string | null; name: string } | null;
    };
    if (!rr.regulations) continue;
    const line = rr.regulations.code?.trim()
      ? `${rr.regulations.code} — ${rr.regulations.name}`
      : rr.regulations.name;
    const list = regulationsByRequest.get(rr.outreach_request_id) ?? [];
    if (!list.includes(line)) list.push(line);
    regulationsByRequest.set(rr.outreach_request_id, list);
  }

  const componentsByRequest = new Map<string, string[]>();
  for (const row of componentRows ?? []) {
    const cr = row as {
      outreach_request_id: string;
      components: { name: string; part_number: string | null } | null;
    };
    if (!cr.components) continue;
    const display = [cr.components.name, cr.components.part_number]
      .filter(Boolean)
      .join(" · ");
    const list = componentsByRequest.get(cr.outreach_request_id) ?? [];
    if (!list.includes(display)) list.push(display);
    componentsByRequest.set(cr.outreach_request_id, list);
  }

  const subjectTemplate = c.subject_template?.trim() || "Compliance request";
  const messageTemplate = c.message_template?.trim() || "";
  const base = appUrl.replace(/\/$/, "");
  const rows: ManualOutreachEmailRow[] = [];

  for (const req of requests) {
    const token = tokenByRequest.get(req.id);
    if (!token) continue;
    const supplier = req.supplier_id ? supplierById.get(req.supplier_id) : null;
    const portalLink = `${base}/outreach/respond/${token}`;
    const componentLines = componentsByRequest.get(req.id) ?? [];
    const regulationLines = regulationsByRequest.get(req.id) ?? [];
    const componentNames = componentLines.length > 0 ? componentLines.join(", ") : "—";
    const regulationNames = regulationLines.length > 0 ? regulationLines.join(", ") : "—";
    const vars = {
      supplier_contact: supplier?.name ?? "Supplier",
      component_name: componentLines[0] ?? "—",
      component_names: componentNames,
      component_list: componentLines.length > 0 ? htmlMergeFieldList(componentLines) : "<p>—</p>",
      regulation_name: regulationLines[0] ?? "—",
      regulation_names: regulationNames,
      regulation_list: regulationLines.length > 0 ? htmlMergeFieldList(regulationLines) : "<p>—</p>",
      deadline_date: req.due_date || "TBD",
      portal_unique_link: portalLink,
    };
    const subject = applyTemplate(subjectTemplate, vars);
    const bodyHtml = messageTemplatedToEmailHtml(applyTemplate(messageTemplate, vars));
    rows.push({
      campaign_id: c.id,
      campaign_name: c.name,
      request_id: req.id,
      supplier_name: supplier?.name ?? "",
      to_email: supplier?.contact_email ?? "",
      subject,
      portal_link: portalLink,
      body_html: bodyHtml,
      body_text: htmlToPlainText(bodyHtml),
      component_names: componentNames,
      regulation_names: regulationNames,
    });
  }

  return { campaign: c, rows };
}

