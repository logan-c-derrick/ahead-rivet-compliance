import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/profile";
import MaterialIcon from "@/components/ui/MaterialIcon";
import {
  STOCK_OUTREACH_SUBJECT,
  stockMessageAsHtml,
} from "@/lib/outreach-stock-templates";
import OutreachCampaignForm from "./campaign-form";

const LIST_LIMIT = 2000;

async function getAllSuppliersForOutreach(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string
): Promise<{ id: string; name: string }[]> {
  const chunk = 1000;
  const all: { id: string; name: string }[] = [];

  for (let offset = 0; ; offset += chunk) {
    const { data, error } = await supabase
      .from("suppliers")
      .select("id, name")
      .eq("organization_id", organizationId)
      .order("name")
      .range(offset, offset + chunk - 1);

    if (error) return all;
    const batch = (data ?? []) as { id: string; name: string }[];
    all.push(...batch);
    if (batch.length < chunk) break;
  }

  return all;
}

export default async function OutreachCampaignBuilderPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const orgId = profile.organization_id;

  const { data: regulations } = await supabase
    .from("regulations")
    .select("id, code, name")
    .order("code");

  const { data: countryRows } = await supabase
    .from("suppliers")
    .select("country")
    .eq("organization_id", orgId)
    .not("country", "is", null);

  const countrySet = new Set<string>();
  for (const row of countryRows ?? []) {
    const c = (row as { country: string | null }).country?.trim();
    if (c) countrySet.add(c);
  }
  const countries = Array.from(countrySet).sort((a, b) => a.localeCompare(b));

  const supplierRows = await getAllSuppliersForOutreach(supabase, orgId);

  const { data: productRows } = await supabase
    .from("products")
    .select("id, name")
    .eq("organization_id", orgId)
    .order("name")
    .limit(LIST_LIMIT);

  const { data: componentRows } = await supabase
    .from("components")
    .select("id, name, part_number, supplier_id, suppliers(name)")
    .eq("organization_id", orgId)
    .order("name")
    .limit(LIST_LIMIT);

  const suppliers = supplierRows;
  const products = (productRows ?? []) as { id: string; name: string }[];
  const components = (componentRows ?? []) as unknown as {
    id: string;
    name: string;
    part_number: string | null;
    supplier_id: string | null;
    suppliers: { name: string } | null;
  }[];

  const { data: emailDefaults } = await supabase
    .from("outreach_email_defaults")
    .select("subject_template, message_template")
    .eq("organization_id", orgId)
    .maybeSingle();

  const defaultSubjectTemplate =
    (emailDefaults?.subject_template as string | null)?.trim() ||
    STOCK_OUTREACH_SUBJECT;
  const rawDefaultMessage = (
    emailDefaults?.message_template as string | null
  )?.trim();
  const defaultMessageTemplate =
    rawDefaultMessage && rawDefaultMessage.length > 0
      ? rawDefaultMessage
      : stockMessageAsHtml();

  return (
    <div className="pt-6 pb-12 px-6 md:px-12 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <nav className="flex items-center gap-2 text-slate-500 text-sm mb-2 font-body">
            <Link href="/outreach" className="hover:text-primary">
              Campaigns
            </Link>
            <MaterialIcon name="chevron_right" className="text-xs" />
            <span className="text-primary font-medium">New Outreach Builder</span>
          </nav>
          <h2 className="text-4xl font-extrabold font-headline tracking-tight text-primary">
            Launch Data Request
          </h2>
          <p className="text-slate-500 mt-2 font-body max-w-2xl">
            Choose who to target: all suppliers (with optional region filters), hand-picked suppliers, a
            product&apos;s BOM, or specific components. Each target row creates its own request and secure
            link.
          </p>
        </header>

        <OutreachCampaignForm
          regulations={(regulations ?? []) as { id: string; code: string; name: string }[]}
          countries={countries}
          suppliers={suppliers}
          products={products}
          components={components}
          defaultSubjectTemplate={defaultSubjectTemplate}
          defaultMessageTemplate={defaultMessageTemplate}
        />
      </div>
    </div>
  );
}
