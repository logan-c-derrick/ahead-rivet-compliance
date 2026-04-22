import { NextRequest } from "next/server";
import { getPermissionErrorMessage, requireRole } from "@/lib/profile";

type SearchRow = {
  section: "products" | "suppliers" | "regulations";
  title: string;
  subtitle: string;
};

export async function GET(request: NextRequest) {
  try {
    await requireRole(["admin", "compliance_manager"]);
  } catch (error) {
    return new Response(getPermissionErrorMessage(error) ?? "Forbidden", { status: 403 });
  }
  const query = request.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const rawSection = request.nextUrl.searchParams.get("section")?.trim().toLowerCase() ?? "";
  const section: SearchRow["section"] | "" =
    rawSection === "products" || rawSection === "suppliers" || rawSection === "regulations"
      ? rawSection
      : "";

  const baseRows: SearchRow[] = [
    {
      section: "products",
      title: "EP-BATT-092 - Ultra-Density Lithium Polymer Cell",
      subtitle: "Industrial Grade 5000mAh",
    },
    {
      section: "products",
      title: "EP-MOB-V2 - EV-Chassis with Lithium Polymer",
      subtitle: "Generation 2 Modular System",
    },
    {
      section: "suppliers",
      title: "VoltSystems Global",
      subtitle: "Tier 1 component supplier",
    },
    {
      section: "suppliers",
      title: "ChemPoly Materials",
      subtitle: "Tier 2 component supplier",
    },
    {
      section: "suppliers",
      title: "Lithix Electronics",
      subtitle: "Tier 3 component supplier",
    },
    {
      section: "regulations",
      title: "EU Directive 2023/1542: Batteries & Waste",
      subtitle: "Compliance mandatory by Q4 2024",
    },
  ];

  const rows = baseRows.filter((row) => {
    if (section && row.section !== section) return false;
    if (!query) return true;
    return row.title.toLowerCase().includes(query) || row.subtitle.toLowerCase().includes(query);
  });

  const csvRows = [
    ["section", "title", "subtitle"].join(","),
    ...rows.map((row) =>
      [row.section, row.title, row.subtitle]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(",")
    ),
  ];

  return new Response(csvRows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="search-export.csv"',
    },
  });
}
