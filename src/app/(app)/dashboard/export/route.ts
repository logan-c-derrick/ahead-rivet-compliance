import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPermissionErrorMessage, requireRole } from "@/lib/profile";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["admin", "compliance_manager"]);
  } catch (error) {
    return new Response(getPermissionErrorMessage(error) ?? "Forbidden", { status: 403 });
  }
  const supabase = await createClient();
  const query = request.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const status = request.nextUrl.searchParams.get("status")?.trim().toLowerCase() ?? "";

  const { data } = await supabase
    .from("product_regulation_status")
    .select(
      "status, compliance_date, notes, regulation_id, regulations(code, name), product_id, products(name, sku)"
    )
    .order("compliance_date", { ascending: false })
    .limit(500);

  const rows = (data ?? [])
    .filter((r: any) => (status ? r.status === status : true))
    .filter((r: any) => {
      if (!query) return true;
      const productName = String(r.products?.name ?? "").toLowerCase();
      const sku = String(r.products?.sku ?? "").toLowerCase();
      const regCode = String(r.regulations?.code ?? "").toLowerCase();
      const regName = String(r.regulations?.name ?? "").toLowerCase();
      return (
        productName.includes(query) ||
        sku.includes(query) ||
        regCode.includes(query) ||
        regName.includes(query)
      );
    });

  const csvRows = [
    ["product_name", "sku", "regulation_code", "regulation_name", "status", "compliance_date", "notes"].join(","),
    ...rows.map((r: any) =>
      [
        r.products?.name ?? "",
        r.products?.sku ?? "",
        r.regulations?.code ?? "",
        r.regulations?.name ?? "",
        r.status ?? "",
        r.compliance_date ?? "",
        String(r.notes ?? "").replaceAll('"', '""'),
      ]
        .map((value) => `"${String(value)}"`)
        .join(",")
    ),
  ];

  return new Response(csvRows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="dashboard-compliance-export.csv"',
    },
  });
}
