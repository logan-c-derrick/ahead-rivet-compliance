import Link from "next/link";
import { requireProfile } from "@/lib/profile";
import MaterialIcon from "@/components/ui/MaterialIcon";
import { getOemVendorsList } from "./actions";
import OemVendorsClient from "./oem-vendors-client";

export default async function OemVendorsSettingsPage() {
  await requireProfile();
  const vendors = await getOemVendorsList();

  const missingEmail = vendors.filter((v) => !v.compliance_email).length;

  return (
    <div className="p-10 space-y-8">
      <section>
        <nav className="flex items-center gap-2 text-xs text-on-surface-variant mb-4 font-body">
          <Link href="/settings" className="hover:text-primary">Settings</Link>
          <span className="opacity-60">/</span>
          <span className="font-semibold text-primary">OEM Vendors</span>
        </nav>
        <div className="flex items-start justify-between gap-8">
          <div className="max-w-2xl">
            <h2 className="text-4xl font-headline font-extrabold text-on-surface tracking-tighter mb-3">
              OEM Vendors
            </h2>
            <p className="text-on-surface-variant font-body leading-relaxed">
              Manage pre-configured compliance contacts for OEM systems (HPE, Dell, Lenovo, etc.).
              Tag products as OEM-based and use <strong>OEM Direct</strong> outreach to route
              compliance requests straight to the manufacturer.
            </p>
          </div>
          <Link
            href="/outreach/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <MaterialIcon name="campaign" className="text-base" />
            OEM Direct Outreach
          </Link>
        </div>
      </section>

      {missingEmail > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
          <MaterialIcon name="warning" className="text-amber-600 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">
              {missingEmail} vendor{missingEmail > 1 ? "s" : ""} missing compliance email
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Use <strong>Edit</strong> to add contact details manually, or click{" "}
              <strong>AI Verify</strong> to get an AI-assisted suggestion.
            </p>
          </div>
        </div>
      )}

      <section className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/20">
        <div className="flex items-center gap-3 mb-6">
          <MaterialIcon name="auto_awesome" className="text-amber-600" />
          <div>
            <h3 className="text-sm font-bold text-on-surface">AI-Assisted Verification</h3>
            <p className="text-xs text-on-surface-variant font-body">
              Click <strong>AI Verify</strong> on any row to have Claude suggest the correct
              environmental compliance contact for that OEM. Review the suggestion before applying.
              Requires <code className="text-[11px]">ANTHROPIC_API_KEY</code> in{" "}
              <code className="text-[11px]">.env.local</code>.
            </p>
          </div>
        </div>
        <OemVendorsClient initialVendors={vendors} />
      </section>
    </div>
  );
}
