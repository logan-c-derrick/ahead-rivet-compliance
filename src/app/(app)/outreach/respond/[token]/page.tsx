import { notFound } from "next/navigation";
import { hasServiceRoleConfig } from "@/lib/supabase/service-role";
import { getPublicOutreachContext } from "./actions";
import RespondForm from "./respond-form";

export default async function OutreachRespondPage({
  params,
}: {
  params: { token: string };
}) {
  if (!hasServiceRoleConfig()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-surface">
        <div className="max-w-md rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-8 text-center">
          <h1 className="text-lg font-bold text-primary font-headline mb-2">Configuration required</h1>
          <p className="text-sm text-on-surface-variant">
            Set <code className="text-xs bg-surface-container-high px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
            in the server environment so secure supplier links can be validated.
          </p>
        </div>
      </div>
    );
  }

  const ctx = await getPublicOutreachContext(params.token);
  if (!ctx) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-surface">
      <RespondForm token={params.token} context={ctx} />
    </div>
  );
}
