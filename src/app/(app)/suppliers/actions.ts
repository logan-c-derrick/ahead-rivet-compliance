"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPermissionErrorMessage, requireProfile, requireRole, type Profile } from "@/lib/profile";
import Papa from "papaparse";
import type { SupplierListFilter } from "./supplier-filters";

export interface Supplier {
  id: string;
  organization_id?: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  country: string | null;
  created_at: string;
  updated_at: string;
}

/** Rows from `supplier_contacts` (bulk import / future CRUD). */
export interface SupplierContact {
  id: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  contact_href: string | null;
  list_page: string | null;
  external_supplier_id: string | null;
}

export interface SupplierWithCount extends Supplier {
  component_count: number;
  contacts: SupplierContact[];
}

type ContactInputRow = {
  contact_name: string | null;
  email: string | null;
  phone: string | null;
};

function parseContactInputs(formData: FormData): ContactInputRow[] {
  const names = formData.getAll("contact_name").map((v) => String(v ?? "").trim());
  const emails = formData.getAll("contact_email").map((v) => String(v ?? "").trim());
  const phones = formData.getAll("contact_phone").map((v) => String(v ?? "").trim());
  const max = Math.max(names.length, emails.length, phones.length);
  const out: ContactInputRow[] = [];
  for (let i = 0; i < max; i++) {
    const contact_name = names[i] || null;
    const email = emails[i] || null;
    const phone = phones[i] || null;
    if (!contact_name && !email && !phone) continue;
    out.push({ contact_name, email, phone });
  }
  return out;
}

async function fetchContactsBySupplierIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  supplierIds: string[]
): Promise<Map<string, SupplierContact[]>> {
  const map = new Map<string, SupplierContact[]>();
  if (supplierIds.length === 0) return map;

  const { data, error } = await supabase
    .from("supplier_contacts")
    .select("id, supplier_id, contact_name, email, phone, contact_href, list_page, external_supplier_id")
    .eq("organization_id", organizationId)
    .in("supplier_id", supplierIds)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching supplier_contacts:", error);
    return map;
  }

  for (const row of data ?? []) {
    const r = row as SupplierContact & { supplier_id: string };
    const sid = r.supplier_id;
    if (!map.has(sid)) map.set(sid, []);
    map.get(sid)!.push({
      id: r.id,
      contact_name: r.contact_name,
      email: r.email,
      phone: r.phone,
      contact_href: r.contact_href,
      list_page: r.list_page,
      external_supplier_id: r.external_supplier_id,
    });
  }
  return map;
}

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

export type SuppliersPageResult = {
  suppliers: SupplierWithCount[];
  total: number;
  page: number;
  pageSize: number;
};

export type { SupplierListFilter } from "./supplier-filters";

async function fetchSupplierIdsWithLinkedComponents(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("components")
    .select("supplier_id")
    .eq("organization_id", organizationId)
    .not("supplier_id", "is", null);

  if (error) {
    console.error("fetchSupplierIdsWithLinkedComponents:", error);
    return [];
  }
  const set = new Set<string>();
  for (const row of data ?? []) {
    const sid = (row as { supplier_id: string | null }).supplier_id;
    if (sid) set.add(sid);
  }
  return [...set];
}

/**
 * Paginated suppliers list with per-row component counts (for current page only).
 */
export async function getSuppliersPage(
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE,
  filter: SupplierListFilter = "all",
  query: string = ""
): Promise<SuppliersPageResult> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const safePage = Math.max(1, Math.floor(page));
  const safeSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(pageSize)));
  const offset = (safePage - 1) * safeSize;

  const linkedSupplierIds = await fetchSupplierIdsWithLinkedComponents(
    supabase,
    profile.organization_id
  );

  let countQuery = supabase
    .from("suppliers")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", profile.organization_id);

  let listQuery = supabase
    .from("suppliers")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("name");

  const trimmedQuery = query.trim();
  if (trimmedQuery) {
    const sanitized = trimmedQuery.replaceAll(",", " ").trim();
    const pattern = `%${sanitized}%`;
    const orFilter = `name.ilike.${pattern},contact_email.ilike.${pattern},contact_phone.ilike.${pattern},country.ilike.${pattern},address.ilike.${pattern}`;
    countQuery = countQuery.or(orFilter);
    listQuery = listQuery.or(orFilter);
  }

  if (filter === "with_components") {
    if (linkedSupplierIds.length === 0) {
      return { suppliers: [], total: 0, page: safePage, pageSize: safeSize };
    }
    countQuery = countQuery.in("id", linkedSupplierIds);
    listQuery = listQuery.in("id", linkedSupplierIds);
  } else if (filter === "without_components") {
    if (linkedSupplierIds.length > 0) {
      countQuery = countQuery.notIn("id", linkedSupplierIds);
      listQuery = listQuery.notIn("id", linkedSupplierIds);
    }
  }

  const { count, error: countError } = await countQuery;

  if (countError) {
    console.error("Error counting suppliers:", countError);
    return { suppliers: [], total: 0, page: safePage, pageSize: safeSize };
  }

  const total = count ?? 0;

  const { data: suppliers, error } = await listQuery.range(offset, offset + safeSize - 1);

  if (error) {
    console.error("Error fetching suppliers:", error);
    return { suppliers: [], total, page: safePage, pageSize: safeSize };
  }

  const rows = (suppliers ?? []) as Supplier[];
  const ids = rows.map((s) => s.id);
  const countBySupplier: Record<string, number> = {};

  if (ids.length > 0) {
    const { data: compRows } = await supabase
      .from("components")
      .select("supplier_id")
      .eq("organization_id", profile.organization_id)
      .in("supplier_id", ids)
      .not("supplier_id", "is", null);

    (compRows ?? []).forEach((row: { supplier_id: string | null }) => {
      if (row.supplier_id) {
        countBySupplier[row.supplier_id] = (countBySupplier[row.supplier_id] ?? 0) + 1;
      }
    });
  }

  const contactMap = await fetchContactsBySupplierIds(
    supabase,
    profile.organization_id,
    ids
  );

  const withCounts = rows.map((s) => ({
    ...s,
    component_count: countBySupplier[s.id] ?? 0,
    contacts: contactMap.get(s.id) ?? [],
  })) as SupplierWithCount[];

  return {
    suppliers: withCounts,
    total,
    page: safePage,
    pageSize: safeSize,
  };
}

/**
 * Full supplier list with component counts (fetches in pages; use getSuppliersPage for UI lists).
 */
export async function getSuppliers(): Promise<SupplierWithCount[]> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const chunk = 1000;
  const all: Supplier[] = [];
  for (let offset = 0; ; offset += chunk) {
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("name")
      .range(offset, offset + chunk - 1);

    if (error) {
      console.error("Error fetching suppliers:", error);
      return [];
    }
    const batch = (data ?? []) as Supplier[];
    all.push(...batch);
    if (batch.length < chunk) break;
  }

  const { data: counts } = await supabase
    .from("components")
    .select("supplier_id")
    .eq("organization_id", profile.organization_id)
    .not("supplier_id", "is", null);

  const countBySupplier: Record<string, number> = {};
  (counts ?? []).forEach((row: { supplier_id: string | null }) => {
    if (row.supplier_id) {
      countBySupplier[row.supplier_id] = (countBySupplier[row.supplier_id] ?? 0) + 1;
    }
  });

  const allIds = all.map((s) => s.id);
  const contactMap = await fetchContactsBySupplierIds(
    supabase,
    profile.organization_id,
    allIds
  );

  return all.map((s) => ({
    ...s,
    component_count: countBySupplier[s.id] ?? 0,
    contacts: contactMap.get(s.id) ?? [],
  })) as SupplierWithCount[];
}

/** Returns id and name for dropdowns (e.g. component form). */
export async function getSupplierOptions(): Promise<{ id: string; name: string }[]> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const chunk = 1000;
  const all: { id: string; name: string }[] = [];

  for (let offset = 0; ; offset += chunk) {
    const { data, error } = await supabase
      .from("suppliers")
      .select("id, name")
      .eq("organization_id", profile.organization_id)
      .order("name")
      .range(offset, offset + chunk - 1);

    if (error) return [];
    const batch = (data ?? []) as { id: string; name: string }[];
    all.push(...batch);
    if (batch.length < chunk) break;
  }

  return all;
}

export async function getSupplier(id: string): Promise<Supplier | null> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .single();

  if (error || !data) return null;
  return data as Supplier;
}

/** Single supplier with component count (e.g. deep link to edit when not on current list page). */
export async function getSupplierWithCount(id: string): Promise<SupplierWithCount | null> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: row, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .single();

  if (error || !row) return null;

  const { count } = await supabase
    .from("components")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", profile.organization_id)
    .eq("supplier_id", id);

  const contactMap = await fetchContactsBySupplierIds(supabase, profile.organization_id, [id]);
  const contacts = contactMap.get(id) ?? [];

  return {
    ...(row as Supplier),
    component_count: count ?? 0,
    contacts,
  } as SupplierWithCount;
}

export type CreateSupplierState = { error?: string };

async function createSupplierImpl(
  formData: FormData
): Promise<CreateSupplierState> {
  let profile: Profile;
  try {
    profile = await requireRole(["admin", "compliance_manager"]);
  } catch (error) {
    return { error: getPermissionErrorMessage(error) ?? "Unable to create supplier." };
  }
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  const contactRows = parseContactInputs(formData);
  const contact_email = contactRows[0]?.email ?? null;
  const contact_phone = contactRows[0]?.phone ?? null;
  const address = (formData.get("address") as string)?.trim() || null;
  const country = (formData.get("country") as string)?.trim() || null;

  if (!name) return { error: "Supplier name is required" };

  const { data: insertedSupplier, error } = await supabase
    .from("suppliers")
    .insert({
      organization_id: profile.organization_id,
      name,
      contact_email,
      contact_phone,
      address,
      country,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating supplier:", error);
    return { error: error.message };
  }

  if (insertedSupplier?.id && contactRows.length > 0) {
    const { error: contactsErr } = await supabase.from("supplier_contacts").insert(
      contactRows.map((c) => ({
        organization_id: profile.organization_id,
        supplier_id: insertedSupplier.id as string,
        contact_name: c.contact_name,
        email: c.email,
        phone: c.phone,
      }))
    );
    if (contactsErr) {
      console.error("Error creating supplier contacts:", contactsErr);
      return { error: contactsErr.message };
    }
  }

  revalidatePath("/suppliers");
  redirect("/suppliers");
}

export async function createSupplier(formData: FormData): Promise<void> {
  const result = await createSupplierImpl(formData);
  if (result?.error) {
    throw new Error(result.error);
  }
}

export async function createSupplierFormState(
  _prev: CreateSupplierState | null,
  formData: FormData
): Promise<CreateSupplierState> {
  return createSupplierImpl(formData);
}

type UpdateSupplierState = { error?: string };
export async function updateSupplier(
  _prevState: UpdateSupplierState | null,
  formData: FormData
): Promise<UpdateSupplierState> {
  let profile: Profile;
  try {
    profile = await requireRole(["admin", "compliance_manager"]);
  } catch (error) {
    return { error: getPermissionErrorMessage(error) ?? "Unable to update supplier." };
  }
  const supabase = await createClient();

  const id = formData.get("id") as string;
  if (!id) return { error: "Supplier ID is required" };

  const name = (formData.get("name") as string)?.trim();
  const contactRows = parseContactInputs(formData);
  const contact_email = contactRows[0]?.email ?? null;
  const contact_phone = contactRows[0]?.phone ?? null;
  const address = (formData.get("address") as string)?.trim() || null;
  const country = (formData.get("country") as string)?.trim() || null;

  if (!name) return { error: "Supplier name is required" };

  const { error } = await supabase
    .from("suppliers")
    .update({
      name,
      contact_email,
      contact_phone,
      address,
      country,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  if (error) {
    console.error("Error updating supplier:", error);
    return { error: error.message };
  }

  // Sync manually-managed contacts while preserving imported/scraped rows.
  const { error: clearManualContactsError } = await supabase
    .from("supplier_contacts")
    .delete()
    .eq("organization_id", profile.organization_id)
    .eq("supplier_id", id)
    .is("external_supplier_id", null)
    .is("contact_href", null)
    .is("list_page", null);
  if (clearManualContactsError) {
    console.error("Error clearing manual supplier contacts:", clearManualContactsError);
    return { error: clearManualContactsError.message };
  }

  if (contactRows.length > 0) {
    const { error: contactsErr } = await supabase.from("supplier_contacts").insert(
      contactRows.map((c) => ({
        organization_id: profile.organization_id,
        supplier_id: id,
        contact_name: c.contact_name,
        email: c.email,
        phone: c.phone,
      }))
    );
    if (contactsErr) {
      console.error("Error saving supplier contacts:", contactsErr);
      return { error: contactsErr.message };
    }
  }

  revalidatePath("/suppliers");
  redirect("/suppliers");
}

type DeleteSupplierState = { error?: string };
export async function deleteSupplier(
  _prevState: DeleteSupplierState | null,
  formData: FormData
): Promise<DeleteSupplierState> {
  let profile: Profile;
  try {
    profile = await requireRole(["admin", "compliance_manager"]);
  } catch (error) {
    return { error: getPermissionErrorMessage(error) ?? "Unable to delete supplier." };
  }
  const supabase = await createClient();

  const id = formData.get("id") as string;
  if (!id) return { error: "Supplier ID is required" };

  const { error } = await supabase
    .from("suppliers")
    .delete()
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  if (error) {
    console.error("Error deleting supplier:", error);
    return { error: error.message };
  }

  revalidatePath("/suppliers");
  redirect("/suppliers");
}

function normalizeHeaderKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Find CSV column header (raw key) by normalized aliases. */
function findColumnRaw(fields: string[], ...aliases: string[]): string | null {
  const map = new Map(fields.map((f) => [normalizeHeaderKey(f), f] as const));
  for (const alias of aliases) {
    const k = normalizeHeaderKey(alias);
    if (map.has(k)) return map.get(k)!;
  }
  return null;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isLikelyUuid(s: string): boolean {
  return UUID_RE.test(s.trim());
}

function parseSupplierNamesFromCsv(content: string): { supplierNames: string[]; rawRowCount: number } {
  // First attempt: CSV with headers (expected: page,supplier_name)
  const parsedWithHeader = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
  });

  const rows = (parsedWithHeader.data ?? []) as Record<string, string>[];
  const fields = parsedWithHeader.meta.fields ?? [];
  const supplierKey =
    findColumnRaw(fields as string[], "supplier_name", "suppliername") ??
    (fields as string[]).find((f) => normalizeHeaderKey(f).includes("supplier"));

  if (supplierKey) {
    const supplierNames = rows
      .map((r) => (r[supplierKey] ?? "").toString().trim())
      .filter(Boolean);
    return { supplierNames, rawRowCount: rows.length };
  }

  // Fallback: CSV without headers; assume 2 columns and supplier_name is column 2.
  const parsedNoHeader = Papa.parse<string[]>(content, {
    header: false,
    skipEmptyLines: true,
  });

  const data = parsedNoHeader.data ?? [];
  const rawRowCount = data.length;
  const supplierNames = data
    .map((row) => (row[1] ?? "").toString().trim())
    .filter(Boolean);
  return { supplierNames, rawRowCount };
}

/** True when CSV includes supplier columns plus contact fields (new bulk format). */
function isSupplierContactCsvFormat(fields: string[]): boolean {
  const f = fields;
  const hasSupplier =
    !!findColumnRaw(f, "supplier_id", "supplierid") ||
    !!findColumnRaw(f, "supplier_name", "suppliername", "company_name", "companyname");
  const hasContact =
    !!findColumnRaw(f, "contact_name", "contactname") ||
    !!findColumnRaw(f, "email", "e_mail") ||
    !!findColumnRaw(f, "phone", "telephone", "mobile") ||
    !!findColumnRaw(f, "contact_href", "contacthref");
  return hasSupplier && hasContact;
}

type ContactCsvColMap = {
  supplierId: string | null;
  supplierName: string | null;
  listPage: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  contactHref: string | null;
};

function buildContactCsvColMap(fields: string[]): ContactCsvColMap {
  return {
    supplierId: findColumnRaw(fields, "supplier_id", "supplierid"),
    supplierName: findColumnRaw(fields, "supplier_name", "suppliername", "company_name", "companyname"),
    listPage: findColumnRaw(fields, "list_page", "listpage", "page"),
    contactName: findColumnRaw(fields, "contact_name", "contactname"),
    email: findColumnRaw(fields, "email", "e_mail"),
    phone: findColumnRaw(fields, "phone", "telephone", "mobile"),
    contactHref: findColumnRaw(fields, "contact_href", "contacthref", "href"),
  };
}

function csvCell(row: Record<string, string>, key: string | null): string {
  if (!key) return "";
  return String(row[key] ?? "").trim();
}

async function importSupplierContactsFromCsv(
  profile: Profile,
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: Record<string, string>[],
  col: ContactCsvColMap,
  matchComponents: boolean
): Promise<BulkSupplierImportResult | BulkSupplierImportError> {
  if (!col.supplierName && !col.supplierId) {
    return { success: false, error: "CSV must include supplier_id and/or supplier_name column." };
  }

  const existingByLowerName = new Map<string, string>();
  const fetchChunk = 1000;
  for (let offset = 0; ; offset += fetchChunk) {
    const { data: existingRows, error: exErr } = await supabase
      .from("suppliers")
      .select("id, name")
      .eq("organization_id", profile.organization_id)
      .order("name")
      .range(offset, offset + fetchChunk - 1);

    if (exErr) {
      console.error("Error loading existing suppliers:", exErr);
      return { success: false, error: exErr.message };
    }
    const batch = existingRows ?? [];
    for (const row of batch as { id: string; name: string }[]) {
      existingByLowerName.set(row.name.toLowerCase(), row.id);
    }
    if (batch.length < fetchChunk) break;
  }

  const uuidCandidates = new Set<string>();
  for (const row of rows) {
    const raw = csvCell(row, col.supplierId);
    if (raw && isLikelyUuid(raw)) uuidCandidates.add(raw.trim());
  }

  const validUuids = new Set<string>();
  if (uuidCandidates.size > 0) {
    const { data: uuidRows, error: uuidErr } = await supabase
      .from("suppliers")
      .select("id")
      .eq("organization_id", profile.organization_id)
      .in("id", [...uuidCandidates]);

    if (uuidErr) {
      console.error("Error resolving supplier UUIDs:", uuidErr);
      return { success: false, error: uuidErr.message };
    }
    for (const r of uuidRows ?? []) {
      validUuids.add((r as { id: string }).id);
    }
  }

  const namesToCreate = new Set<string>();
  for (const row of rows) {
    const rawSid = csvCell(row, col.supplierId);
    const rawName = csvCell(row, col.supplierName);
    if (rawSid && validUuids.has(rawSid)) continue;
    if (rawName) {
      const key = rawName.toLowerCase();
      if (!existingByLowerName.has(key)) namesToCreate.add(rawName);
    }
  }

  let createdSuppliers = 0;
  const INSERT_BATCH = 500;
  const toInsert = [...namesToCreate];
  for (let i = 0; i < toInsert.length; i += INSERT_BATCH) {
    const slice = toInsert.slice(i, i + INSERT_BATCH);
    const { data: inserted, error: insErr } = await supabase
      .from("suppliers")
      .insert(
        slice.map((name) => ({
          organization_id: profile.organization_id,
          name,
        }))
      )
      .select("id, name");

    if (insErr) {
      console.error("Error batch inserting suppliers:", insErr);
      return { success: false, error: insErr.message };
    }

    createdSuppliers += inserted?.length ?? 0;
    for (const row of inserted ?? []) {
      const r = row as { id: string; name: string };
      existingByLowerName.set(r.name.toLowerCase(), r.id);
    }
  }

  let skippedRows = 0;
  const contactRows: {
    supplier_id: string;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
    list_page: string | null;
    contact_href: string | null;
    external_supplier_id: string | null;
  }[] = [];

  for (const row of rows) {
    const rawSid = csvCell(row, col.supplierId);
    const rawName = csvCell(row, col.supplierName);
    let supplierId: string | null = null;

    if (rawSid && validUuids.has(rawSid)) {
      supplierId = rawSid;
    } else if (rawName) {
      supplierId = existingByLowerName.get(rawName.toLowerCase()) ?? null;
    }

    if (!supplierId) {
      skippedRows += 1;
      continue;
    }

    const cName = csvCell(row, col.contactName) || null;
    const email = csvCell(row, col.email) || null;
    const phone = csvCell(row, col.phone) || null;
    const listPage = csvCell(row, col.listPage) || null;
    const contactHref = csvCell(row, col.contactHref) || null;
    const externalSupplierId = rawSid || null;

    const hasContact = Boolean(cName || email || phone || contactHref);
    if (hasContact) {
      contactRows.push({
        supplier_id: supplierId,
        contact_name: cName,
        email,
        phone,
        list_page: listPage || null,
        contact_href: contactHref || null,
        external_supplier_id: externalSupplierId,
      });
    }
  }

  /** Map supplier display name → id for component text matching (includes resolved names for UUID-only rows). */
  const supplierIdByName = new Map<string, string>();
  const supplierIdsNeedingName = new Set<string>();
  for (const row of rows) {
    const rawSid = csvCell(row, col.supplierId);
    const rawName = csvCell(row, col.supplierName);
    let supplierId: string | null = null;
    if (rawSid && validUuids.has(rawSid)) supplierId = rawSid;
    else if (rawName) supplierId = existingByLowerName.get(rawName.toLowerCase()) ?? null;
    if (!supplierId) continue;
    if (rawName) {
      supplierIdByName.set(rawName, supplierId);
    } else {
      supplierIdsNeedingName.add(supplierId);
    }
  }
  if (supplierIdsNeedingName.size > 0) {
    const { data: nameRows, error: nameErr } = await supabase
      .from("suppliers")
      .select("id, name")
      .in("id", [...supplierIdsNeedingName]);
    if (nameErr) {
      console.error("Error loading supplier names for matching:", nameErr);
    } else {
      for (const r of nameRows ?? []) {
        const x = r as { id: string; name: string };
        supplierIdByName.set(x.name, x.id);
      }
    }
  }

  let createdContacts = 0;
  const CONTACT_BATCH = 500;
  for (let i = 0; i < contactRows.length; i += CONTACT_BATCH) {
    const slice = contactRows.slice(i, i + CONTACT_BATCH);
    const { data: ins, error: cErr } = await supabase
      .from("supplier_contacts")
      .insert(
        slice.map((c) => ({
          organization_id: profile.organization_id,
          supplier_id: c.supplier_id,
          contact_name: c.contact_name,
          email: c.email,
          phone: c.phone,
          list_page: c.list_page,
          contact_href: c.contact_href,
          external_supplier_id: c.external_supplier_id,
        }))
      )
      .select("id");

    if (cErr) {
      console.error("Error inserting supplier contacts:", cErr);
      return { success: false, error: cErr.message };
    }
    createdContacts += ins?.length ?? 0;
  }

  let matchedComponents = 0;
  let matchingSkipped = false;

  if (matchComponents && supplierIdByName.size > 0) {
    const sortedPairs = [...supplierIdByName.entries()].sort((a, b) => b[0].length - a[0].length);
    const componentPage = 1000;
    const UPDATE_CHUNK = 500;

    for (let offset = 0; ; offset += componentPage) {
      const { data: comps, error: compErr } = await supabase
        .from("components")
        .select("id, name, description")
        .eq("organization_id", profile.organization_id)
        .is("supplier_id", null)
        .range(offset, offset + componentPage - 1);

      if (compErr) {
        console.error("Error loading components for matching:", compErr);
        matchingSkipped = true;
        break;
      }

      const batch = comps ?? [];
      if (batch.length === 0) break;

      const bySupplier = new Map<string, string[]>();

      for (const crow of batch as { id: string; name: string; description: string | null }[]) {
        const hay = `${crow.name} ${crow.description ?? ""}`.toLowerCase();
        let matchedId: string | null = null;
        for (const [supName, sid] of sortedPairs) {
          if (hay.includes(supName.toLowerCase())) {
            matchedId = sid;
            break;
          }
        }
        if (!matchedId) continue;
        if (!bySupplier.has(matchedId)) bySupplier.set(matchedId, []);
        bySupplier.get(matchedId)!.push(crow.id);
      }

      for (const [supplierId, ids] of bySupplier) {
        for (let j = 0; j < ids.length; j += UPDATE_CHUNK) {
          const slice = ids.slice(j, j + UPDATE_CHUNK);
          const { data: updated, error: upErr } = await supabase
            .from("components")
            .update({ supplier_id: supplierId })
            .in("id", slice)
            .select("id");

          if (upErr) {
            console.error("Error updating component supplier:", upErr);
            matchingSkipped = true;
          } else {
            matchedComponents += updated?.length ?? 0;
          }
        }
      }

      if (batch.length < componentPage) break;
    }
  }

  revalidatePath("/suppliers");
  revalidatePath("/components");

  return {
    success: true,
    importedSupplierNames: rows.length,
    createdSuppliers,
    createdContacts,
    matchedComponents,
    skippedRows: skippedRows > 0 ? skippedRows : undefined,
    matchingSkipped,
  };
}

export type BulkSupplierImportResult = {
  success: true;
  importedSupplierNames: number;
  createdSuppliers: number;
  matchedComponents: number;
  /** Populated when CSV includes contact columns (supplier_id, contact_name, email, …). */
  createdContacts?: number;
  /** Rows that could not be linked to a supplier (missing name and invalid supplier_id). */
  skippedRows?: number;
  /** When true, component name/description matching was skipped (too many suppliers for one request). */
  matchingSkipped?: boolean;
};

export type BulkSupplierImportError = {
  success: false;
  error: string;
};

/** Max CSV size for supplier bulk import (bytes). */
const MAX_SUPPLIER_CSV_BYTES = 5 * 1024 * 1024;

export type SupplierCsvPreviewResult =
  | {
      success: true;
      format: "simple" | "contacts";
      rowCount: number;
      uniqueCount: number;
      sample: Record<string, string>[];
      warnings: string[];
    }
  | { success: false; error: string };

/**
 * Parse-only preview for supplier CSV (no database writes). Use before running import.
 */
export async function previewSupplierCsv(
  formData: FormData
): Promise<SupplierCsvPreviewResult> {
  await requireProfile();

  const file = formData.get("file") as File | null;
  if (!file?.name) return { success: false, error: "Please select a CSV file." };
  if (!file.name.toLowerCase().endsWith(".csv")) return { success: false, error: "File must be a CSV." };
  if (file.size > MAX_SUPPLIER_CSV_BYTES) {
    return {
      success: false,
      error: `File is too large (max ${Math.round(MAX_SUPPLIER_CSV_BYTES / (1024 * 1024))} MB).`,
    };
  }

  const text = await file.text();
  const parsedForMode = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });
  const headerFields = (parsedForMode.meta.fields ?? []) as string[];
  const headerRows = (parsedForMode.data ?? []) as Record<string, string>[];
  const warnings: string[] = [];

  if (headerFields.length > 0 && isSupplierContactCsvFormat(headerFields)) {
    const col = buildContactCsvColMap(headerFields);
    if (!col.supplierName && !col.supplierId) {
      return { success: false, error: "Contact CSV must include supplier_id and/or supplier_name." };
    }
    const sample = headerRows.slice(0, 8);
    for (const row of sample) {
      const em = csvCell(row, col.email);
      if (em && em.includes("@") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
        warnings.push("At least one email in the sample does not look valid.");
        break;
      }
    }
    return {
      success: true,
      format: "contacts",
      rowCount: headerRows.length,
      uniqueCount: headerRows.length,
      sample,
      warnings,
    };
  }

  const parsed = parseSupplierNamesFromCsv(text);
  const seen = new Set<string>();
  const unique = parsed.supplierNames
    .map((n) => n.trim())
    .filter(Boolean)
    .filter((n) => {
      const key = n.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  if (parsed.supplierNames.filter(Boolean).length > unique.length) {
    warnings.push("Duplicate supplier names will be collapsed on import (case-insensitive).");
  }

  if (unique.length === 0) {
    return { success: false, error: "No supplier_name values found in the CSV." };
  }

  const sample = unique.slice(0, 8).map((name) => ({ supplier_name: name }));
  return {
    success: true,
    format: "simple",
    rowCount: parsed.rawRowCount,
    uniqueCount: unique.length,
    sample,
    warnings,
  };
}

export async function bulkUpsertSuppliersFromCsv(
  formData: FormData
): Promise<BulkSupplierImportResult | BulkSupplierImportError> {
  let profile: Profile;
  try {
    profile = await requireRole(["admin", "compliance_manager"]);
  } catch (error) {
    return { success: false, error: getPermissionErrorMessage(error) ?? "Unable to import suppliers." };
  }
  const supabase = await createClient();

  const file = formData.get("file") as File | null;
  const matchComponents = (formData.get("match_components") as string | null) === "true";

  if (!file || !file.name) return { success: false, error: "Please select a CSV file." };
  if (!file.name.toLowerCase().endsWith(".csv")) return { success: false, error: "File must be a CSV." };
  if (file.size > MAX_SUPPLIER_CSV_BYTES) {
    return {
      success: false,
      error: `File is too large (max ${Math.round(MAX_SUPPLIER_CSV_BYTES / (1024 * 1024))} MB).`,
    };
  }

  const text = await file.text();

  const parsedForMode = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });
  const headerFields = (parsedForMode.meta.fields ?? []) as string[];
  const headerRows = (parsedForMode.data ?? []) as Record<string, string>[];

  if (headerFields.length > 0 && isSupplierContactCsvFormat(headerFields)) {
    const col = buildContactCsvColMap(headerFields);
    return importSupplierContactsFromCsv(profile, supabase, headerRows, col, matchComponents);
  }

  const parsed = parseSupplierNamesFromCsv(text);

  // Deduplicate normalized supplier names.
  const seen = new Set<string>();
  const supplierNames = parsed.supplierNames
    .map((n) => n.trim())
    .filter(Boolean)
    .filter((n) => {
      const key = n.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  if (supplierNames.length === 0) {
    return { success: false, error: "No supplier_name values found in the CSV." };
  }

  let createdSuppliers = 0;
  let matchedComponents = 0;

  // Load existing supplier names (paginated; no row cap).
  const existingByLowerName = new Map<string, string>();
  const fetchChunk = 1000;
  for (let offset = 0; ; offset += fetchChunk) {
    const { data: existingRows, error: exErr } = await supabase
      .from("suppliers")
      .select("id, name")
      .eq("organization_id", profile.organization_id)
      .order("name")
      .range(offset, offset + fetchChunk - 1);

    if (exErr) {
      console.error("Error loading existing suppliers:", exErr);
      return { success: false, error: exErr.message };
    }
    const batch = existingRows ?? [];
    for (const row of batch as { id: string; name: string }[]) {
      existingByLowerName.set(row.name.toLowerCase(), row.id);
    }
    if (batch.length < fetchChunk) break;
  }

  const supplierIdByName = new Map<string, string>();
  const toInsert: { name: string }[] = [];

  for (const supName of supplierNames) {
    const key = supName.toLowerCase();
    const existingId = existingByLowerName.get(key);
    if (existingId && existingId !== "__pending__") {
      supplierIdByName.set(supName, existingId);
      continue;
    }
    toInsert.push({ name: supName });
    existingByLowerName.set(key, "__pending__");
  }

  const INSERT_BATCH = 500;
  for (let i = 0; i < toInsert.length; i += INSERT_BATCH) {
    const slice = toInsert.slice(i, i + INSERT_BATCH);
    const { data: inserted, error: insErr } = await supabase
      .from("suppliers")
      .insert(
        slice.map((row) => ({
          organization_id: profile.organization_id,
          name: row.name,
        }))
      )
      .select("id, name");

    if (insErr) {
      console.error("Error batch inserting suppliers:", insErr);
      return { success: false, error: insErr.message };
    }

    createdSuppliers += inserted?.length ?? 0;
    for (const row of inserted ?? []) {
      const r = row as { id: string; name: string };
      supplierIdByName.set(r.name, r.id);
      existingByLowerName.set(r.name.toLowerCase(), r.id);
    }
  }

  // Re-resolve ids for names that were already in DB (exact case-insensitive match).
  for (const supName of supplierNames) {
    if (!supplierIdByName.has(supName)) {
      const id = existingByLowerName.get(supName.toLowerCase());
      if (id && id !== "__pending__") supplierIdByName.set(supName, id);
    }
  }

  let matchingSkipped = false;

  if (matchComponents && supplierIdByName.size > 0) {
    // Longer supplier names first so more specific matches win (e.g. "ACME Corp" before "ACME").
    const sortedPairs = [...supplierIdByName.entries()].sort((a, b) => b[0].length - a[0].length);
    const componentPage = 1000;
    const UPDATE_CHUNK = 500;

    for (let offset = 0; ; offset += componentPage) {
      const { data: comps, error: compErr } = await supabase
        .from("components")
        .select("id, name, description")
        .eq("organization_id", profile.organization_id)
        .is("supplier_id", null)
        .range(offset, offset + componentPage - 1);

      if (compErr) {
        console.error("Error loading components for matching:", compErr);
        matchingSkipped = true;
        break;
      }

      const batch = comps ?? [];
      if (batch.length === 0) break;

      const bySupplier = new Map<string, string[]>();

      for (const row of batch as { id: string; name: string; description: string | null }[]) {
        const hay = `${row.name} ${row.description ?? ""}`.toLowerCase();
        let matchedId: string | null = null;
        for (const [supName, sid] of sortedPairs) {
          if (hay.includes(supName.toLowerCase())) {
            matchedId = sid;
            break;
          }
        }
        if (!matchedId) continue;
        if (!bySupplier.has(matchedId)) bySupplier.set(matchedId, []);
        bySupplier.get(matchedId)!.push(row.id);
      }

      for (const [supplierId, ids] of bySupplier) {
        for (let j = 0; j < ids.length; j += UPDATE_CHUNK) {
          const slice = ids.slice(j, j + UPDATE_CHUNK);
          const { data: updated, error: upErr } = await supabase
            .from("components")
            .update({ supplier_id: supplierId })
            .in("id", slice)
            .select("id");

          if (upErr) {
            console.error("Error updating component supplier:", upErr);
            matchingSkipped = true;
          } else {
            matchedComponents += updated?.length ?? 0;
          }
        }
      }

      if (batch.length < componentPage) break;
    }
  }

  revalidatePath("/suppliers");
  revalidatePath("/components");

  return {
    success: true,
    importedSupplierNames: supplierNames.length,
    createdSuppliers,
    matchedComponents,
    matchingSkipped,
  };
}
