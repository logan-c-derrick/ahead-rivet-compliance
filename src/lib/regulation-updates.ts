import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { sendEmail } from "@/lib/email";

type SourceName = "reach" | "rohs";

type ReleaseCandidate = {
  source: SourceName;
  regulationCode: string;
  releaseKey: string;
  title: string;
  summary: string | null;
  sourceUrl: string | null;
  publishedAt: string | null;
  sourceHash: string;
  parsedPayload: Record<string, unknown>;
};

type SyncResult = {
  insertedReleases: number;
  updatedReleases: number;
  createdComponentStatuses: number;
  createdProductStatuses: number;
  createdEvents: number;
  notificationEmailsSent: number;
  errors: string[];
};

function cleanText(input: string | null | undefined): string {
  return String(input ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeReleaseKey(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "-")
    .replace(/[^A-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function digestHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return `h${Math.abs(hash)}`;
}

function extractItemsFromRssXml(xml: string): Array<Record<string, string>> {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
  return items.map((m) => {
    const block = m[1] ?? "";
    const get = (tag: string) => {
      const mm = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
      return mm?.[1] ? cleanText(mm[1]) : "";
    };
    return {
      title: get("title"),
      link: get("link"),
      description: get("description"),
      pubDate: get("pubDate"),
      guid: get("guid"),
    };
  });
}

async function fetchSourceText(url: string): Promise<string> {
  const response = await fetch(url, {
    method: "GET",
    headers: { "User-Agent": "RivetComplianceBot/1.0" },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (${response.status})`);
  }
  return response.text();
}

async function fetchReachCandidates(): Promise<ReleaseCandidate[]> {
  const sourceUrl =
    process.env.REACH_RELEASES_FEED_URL?.trim() ||
    "https://echa.europa.eu/rss/-/dislist/rss";
  const text = await fetchSourceText(sourceUrl);
  const items = extractItemsFromRssXml(text);
  const out: ReleaseCandidate[] = [];
  for (const item of items.slice(0, 25)) {
    const title = cleanText(item.title);
    const keyMatch = title.match(/(?:SVHC|Candidate List).*?(\d{2,4})/i);
    const releaseKey = normalizeReleaseKey(`REACH-${keyMatch?.[1] ?? title.slice(0, 24)}`);
    const payload = { source: "reach-rss", item };
    out.push({
      source: "reach",
      regulationCode: "REACH",
      releaseKey,
      title: title || "REACH update",
      summary: cleanText(item.description) || null,
      sourceUrl: item.link || sourceUrl,
      publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : null,
      sourceHash: digestHash(JSON.stringify(payload)),
      parsedPayload: payload,
    });
  }
  return out;
}

async function fetchRohsCandidates(): Promise<ReleaseCandidate[]> {
  const sourceUrl =
    process.env.ROHS_RELEASES_FEED_URL?.trim() ||
    "https://environment.ec.europa.eu/rss_en";
  const text = await fetchSourceText(sourceUrl);
  const items = extractItemsFromRssXml(text).filter((item) =>
    /rohs|restriction of hazardous substances/i.test(`${item.title} ${item.description}`)
  );
  const out: ReleaseCandidate[] = [];
  for (const item of items.slice(0, 25)) {
    const title = cleanText(item.title);
    const keyMatch = title.match(/(?:exemption|delegated|directive).*?(\d{4}\/\d+)/i);
    const releaseKey = normalizeReleaseKey(`ROHS-${keyMatch?.[1] ?? title.slice(0, 24)}`);
    const payload = { source: "rohs-rss", item };
    out.push({
      source: "rohs",
      regulationCode: "ROHS",
      releaseKey,
      title: title || "RoHS update",
      summary: cleanText(item.description) || null,
      sourceUrl: item.link || sourceUrl,
      publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : null,
      sourceHash: digestHash(JSON.stringify(payload)),
      parsedPayload: payload,
    });
  }
  return out;
}

async function upsertReleaseCandidates(candidates: ReleaseCandidate[]): Promise<{
  releaseIds: string[];
  inserted: number;
  updated: number;
}> {
  const supabase = createServiceRoleClient();
  const regulationCodes = [...new Set(candidates.map((c) => c.regulationCode))];
  const { data: regulations, error: regError } = await supabase
    .from("regulations")
    .select("id, code")
    .in("code", regulationCodes);
  if (regError) throw regError;

  const regulationByCode = new Map<string, string>();
  for (const row of regulations ?? []) {
    const r = row as { id: string; code: string };
    regulationByCode.set(r.code.toUpperCase(), r.id);
  }

  let inserted = 0;
  let updated = 0;
  const releaseIds: string[] = [];

  for (const candidate of candidates) {
    const regulationId = regulationByCode.get(candidate.regulationCode.toUpperCase());
    if (!regulationId) continue;
    const releasePayload = {
      regulation_id: regulationId,
      release_key: candidate.releaseKey,
      title: candidate.title,
      summary: candidate.summary,
      source_url: candidate.sourceUrl,
      source_hash: candidate.sourceHash,
      published_at: candidate.publishedAt,
      status: "active",
      parsed_payload: candidate.parsedPayload,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from("regulation_releases")
      .select("id, source_hash")
      .eq("regulation_id", regulationId)
      .eq("release_key", candidate.releaseKey)
      .maybeSingle();

    if (existing?.id) {
      const needsUpdate = (existing as { source_hash: string | null }).source_hash !== candidate.sourceHash;
      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from("regulation_releases")
          .update(releasePayload)
          .eq("id", existing.id);
        if (updateError) throw updateError;
        updated += 1;
      }
      releaseIds.push(existing.id as string);
      continue;
    }

    const { data: insertedRow, error: insertError } = await supabase
      .from("regulation_releases")
      .insert(releasePayload)
      .select("id")
      .single();
    if (insertError) throw insertError;
    inserted += 1;
    releaseIds.push(insertedRow.id as string);
  }

  return { releaseIds, inserted, updated };
}

async function evaluateReleaseImpact(releaseIds: string[]): Promise<{
  componentStatuses: number;
  productStatuses: number;
  events: number;
}> {
  if (releaseIds.length === 0) return { componentStatuses: 0, productStatuses: 0, events: 0 };

  const supabase = createServiceRoleClient();
  const nowIso = new Date().toISOString();

  const { data: releases, error: releaseErr } = await supabase
    .from("regulation_releases")
    .select("id, regulation_id")
    .in("id", releaseIds);
  if (releaseErr) throw releaseErr;

  const { data: components, error: compErr } = await supabase
    .from("components")
    .select("id, organization_id");
  if (compErr) throw compErr;

  const { data: products, error: prodErr } = await supabase
    .from("products")
    .select("id, organization_id");
  if (prodErr) throw prodErr;

  const componentRows: Array<Record<string, unknown>> = [];
  const productRows: Array<Record<string, unknown>> = [];
  const impactByOrg = new Map<string, { components: number; products: number }>();

  for (const release of releases ?? []) {
    const releaseId = (release as { id: string }).id;

    for (const component of components ?? []) {
      const c = component as { id: string; organization_id: string };
      componentRows.push({
        component_id: c.id,
        release_id: releaseId,
        status: "needs_review",
        evaluated_at: nowIso,
        notes: "Auto-flagged for review due to newly detected regulation release.",
        updated_at: nowIso,
      });
      const impact = impactByOrg.get(c.organization_id) ?? { components: 0, products: 0 };
      impact.components += 1;
      impactByOrg.set(c.organization_id, impact);
    }

    for (const product of products ?? []) {
      const p = product as { id: string; organization_id: string };
      productRows.push({
        product_id: p.id,
        release_id: releaseId,
        status: "needs_review",
        evaluated_at: nowIso,
        notes: "Auto-flagged for review due to newly detected regulation release.",
        updated_at: nowIso,
      });
      const impact = impactByOrg.get(p.organization_id) ?? { components: 0, products: 0 };
      impact.products += 1;
      impactByOrg.set(p.organization_id, impact);
    }
  }

  let componentStatuses = 0;
  for (let i = 0; i < componentRows.length; i += 500) {
    const slice = componentRows.slice(i, i + 500);
    const { data, error } = await supabase
      .from("component_regulation_release_status")
      .upsert(slice, { onConflict: "component_id,release_id" })
      .select("id");
    if (error) throw error;
    componentStatuses += data?.length ?? 0;
  }

  let productStatuses = 0;
  for (let i = 0; i < productRows.length; i += 500) {
    const slice = productRows.slice(i, i + 500);
    const { data, error } = await supabase
      .from("product_regulation_release_status")
      .upsert(slice, { onConflict: "product_id,release_id" })
      .select("id");
    if (error) throw error;
    productStatuses += data?.length ?? 0;
  }

  const eventRows = [...impactByOrg.entries()].flatMap(([organizationId, counts]) =>
    releaseIds.map((releaseId) => ({
      organization_id: organizationId,
      release_id: releaseId,
      event_type: "release_detected",
      impacted_components: counts.components,
      impacted_products: counts.products,
      message: "New regulation release detected and review statuses generated automatically.",
      metadata: { autoGenerated: true },
    }))
  );

  let events = 0;
  if (eventRows.length > 0) {
    const { data, error } = await supabase
      .from("regulation_update_events")
      .insert(eventRows)
      .select("id");
    if (error) throw error;
    events = data?.length ?? 0;
  }

  return { componentStatuses, productStatuses, events };
}

async function sendReleaseNotifications(releaseIds: string[]): Promise<number> {
  if (releaseIds.length === 0) return 0;
  const supabase = createServiceRoleClient();

  const { data: releaseRows, error: releaseErr } = await supabase
    .from("regulation_releases")
    .select("id, release_key, title, regulations(code, name)")
    .in("id", releaseIds);
  if (releaseErr) throw releaseErr;

  const { data: recipients, error: recipientErr } = await supabase
    .from("profiles")
    .select("email, role")
    .in("role", ["admin", "compliance_manager"])
    .not("email", "is", null);
  if (recipientErr) throw recipientErr;

  const subject = `[Rivet] New regulation release updates detected (${releaseIds.length})`;
  const listItems = (releaseRows ?? [])
    .map((row: any) => `<li><strong>${row.release_key}</strong> - ${cleanText(row.title)} (${row.regulations?.code ?? "REG"})</li>`)
    .join("");
  const html = `<p>Rivet detected new regulation updates and queued compliance review statuses.</p><ul>${listItems}</ul>`;

  let sent = 0;
  for (const recipient of recipients ?? []) {
    const email = String((recipient as { email: string | null }).email ?? "").trim();
    if (!email) continue;
    const result = await sendEmail({ to: email, subject, html });
    if (result.ok) sent += 1;
  }
  return sent;
}

export async function syncRegulationReleasesFromSources(): Promise<SyncResult> {
  const errors: string[] = [];
  let candidates: ReleaseCandidate[] = [];

  try {
    const [reachCandidates, rohsCandidates] = await Promise.all([
      fetchReachCandidates().catch((error) => {
        errors.push(`REACH fetch failed: ${error instanceof Error ? error.message : String(error)}`);
        return [] as ReleaseCandidate[];
      }),
      fetchRohsCandidates().catch((error) => {
        errors.push(`RoHS fetch failed: ${error instanceof Error ? error.message : String(error)}`);
        return [] as ReleaseCandidate[];
      }),
    ]);
    candidates = [...reachCandidates, ...rohsCandidates];
  } catch (error) {
    errors.push(`Source fetch failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  const deduped = new Map<string, ReleaseCandidate>();
  for (const candidate of candidates) {
    deduped.set(`${candidate.regulationCode}:${candidate.releaseKey}`, candidate);
  }

  let insertedReleases = 0;
  let updatedReleases = 0;
  let releaseIds: string[] = [];
  try {
    const upsertResult = await upsertReleaseCandidates([...deduped.values()]);
    insertedReleases = upsertResult.inserted;
    updatedReleases = upsertResult.updated;
    releaseIds = upsertResult.releaseIds;
  } catch (error) {
    errors.push(`Release upsert failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  let createdComponentStatuses = 0;
  let createdProductStatuses = 0;
  let createdEvents = 0;
  if (releaseIds.length > 0) {
    try {
      const impact = await evaluateReleaseImpact(releaseIds);
      createdComponentStatuses = impact.componentStatuses;
      createdProductStatuses = impact.productStatuses;
      createdEvents = impact.events;
    } catch (error) {
      errors.push(`Impact evaluation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  let notificationEmailsSent = 0;
  if (releaseIds.length > 0) {
    try {
      notificationEmailsSent = await sendReleaseNotifications(releaseIds);
    } catch (error) {
      errors.push(`Notification send failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return {
    insertedReleases,
    updatedReleases,
    createdComponentStatuses,
    createdProductStatuses,
    createdEvents,
    notificationEmailsSent,
    errors,
  };
}
