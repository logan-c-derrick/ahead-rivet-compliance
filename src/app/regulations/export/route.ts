import { NextRequest } from "next/server";
import { getPermissionErrorMessage, requireRole } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["admin", "compliance_manager"]);
  } catch (error) {
    return new Response(getPermissionErrorMessage(error) ?? "Forbidden", { status: 403 });
  }
  const supabase = await createClient();
  const query = request.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const jurisdiction = request.nextUrl.searchParams.get("jurisdiction")?.trim().toLowerCase() ?? "";

  const { data } = await supabase
    .from("regulations")
    .select(
      "code, name, jurisdiction, effective_date, created_at, updated_at, source_first_published_at, source_last_updated_at"
    )
    .order("code");

  const filtered = (data ?? []).filter((reg: any) => {
    if (jurisdiction && String(reg.jurisdiction ?? "").toLowerCase() !== jurisdiction) return false;
    if (!query) return true;
    return (
      String(reg.code ?? "").toLowerCase().includes(query) ||
      String(reg.name ?? "").toLowerCase().includes(query) ||
      String(reg.jurisdiction ?? "").toLowerCase().includes(query)
    );
  });

  const csvRows = [
    [
      "code",
      "name",
      "jurisdiction",
      "effective_date",
      "source_first_published_at",
      "source_last_updated_at",
      "created_at",
      "updated_at",
    ].join(","),
    ...filtered.map((reg: any) =>
      [
        reg.code ?? "",
        reg.name ?? "",
        reg.jurisdiction ?? "",
        reg.effective_date ?? "",
        reg.source_first_published_at ?? "",
        reg.source_last_updated_at ?? "",
        reg.created_at ?? "",
        reg.updated_at ?? "",
      ]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(",")
    ),
  ];

  return new Response(csvRows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="regulations-export.csv"',
    },
  });
}
