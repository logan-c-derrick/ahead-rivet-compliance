import Link from "next/link";
import { requireProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import MaterialIcon from "@/components/ui/MaterialIcon";
import { getOrgCertificateSettings } from "./actions";
import CertificateWorkbench from "./certificate-workbench";

export default async function CertificatesPage() {
  await requireProfile();
  const supabase = await createClient();

  const [{ data: products }, { data: regulations }, settings] = await Promise.all([
    supabase.from("products").select("id, name").order("name").limit(100),
    supabase.from("regulations").select("id, code, name").order("code"),
    getOrgCertificateSettings(),
  ]);

  return (
    <div className="pt-6 px-6 md:px-10 pb-16 min-h-screen">
      <header className="mb-12">
        <nav className="flex gap-2 text-[10px] font-bold tracking-widest text-primary/60 uppercase mb-4 font-body">
          <Link href="/products" className="hover:text-primary">
            Documents
          </Link>
          <MaterialIcon name="chevron_right" className="text-[12px]" />
          <span className="text-primary">Certificate Generator</span>
        </nav>
        <h2 className="text-4xl font-extrabold font-headline tracking-tight text-on-background">
          Compliance Certificate Generator
        </h2>
        <p className="mt-2 text-on-surface-variant max-w-2xl font-body leading-relaxed">
          Edit your declaration template, upload a PNG signature, and download a PDF with product and
          regulation context.
        </p>
      </header>

      <CertificateWorkbench
        products={(products ?? []) as { id: string; name: string }[]}
        regulations={(regulations ?? []) as { id: string; code: string; name: string }[]}
        settings={settings}
      />
    </div>
  );
}
