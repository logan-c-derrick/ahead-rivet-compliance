import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/profile";
import {
  STOCK_OUTREACH_SUBJECT,
  stockMessageAsHtml,
} from "@/lib/outreach-stock-templates";
import TemplateSettingsForm from "./template-settings-form";

export default async function OutreachTemplatesPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("outreach_email_defaults")
    .select("subject_template, message_template")
    .eq("organization_id", profile.organization_id)
    .maybeSingle();

  const initialSubject =
    (row?.subject_template as string | null)?.trim() || STOCK_OUTREACH_SUBJECT;
  const rawMessage = (row?.message_template as string | null)?.trim();
  const initialMessageHtml =
    rawMessage && rawMessage.length > 0 ? rawMessage : stockMessageAsHtml();

  return (
    <div className="pt-6 pb-16 px-6 md:px-12 min-h-screen">
      <TemplateSettingsForm
        initialSubject={initialSubject}
        initialMessageHtml={initialMessageHtml}
      />
    </div>
  );
}
