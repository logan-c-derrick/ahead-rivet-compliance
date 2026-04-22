import Link from "next/link";
import MaterialIcon from "@/components/ui/MaterialIcon";

export default function ProfileCredentialsPage() {
  return (
    <main className="flex-1 min-w-0">
      <div className="mb-10">
        <nav className="flex items-center gap-2 text-sm text-on-surface-variant mb-4 font-body">
          <Link href="/profile" className="hover:text-primary transition-colors">
            Profile
          </Link>
          <MaterialIcon name="chevron_right" className="text-xs" />
          <span className="text-primary font-semibold">Credentials</span>
        </nav>
        <h1 className="text-4xl font-extrabold font-headline tracking-tight mb-2 text-on-surface">
          Credentials
        </h1>
        <p className="text-on-surface-variant max-w-2xl leading-relaxed font-body">
          Credential upload and verification workflows are not implemented yet.
        </p>
      </div>

      <section className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/20">
        <div className="flex items-start gap-3">
          <MaterialIcon name="info" className="text-primary mt-0.5" />
          <div>
            <h2 className="font-headline font-bold text-lg text-on-surface">
              Credentials Module Pending
            </h2>
            <p className="text-sm text-on-surface-variant mt-2 font-body max-w-2xl">
              This page was previously showing prototype certification data and upload actions.
              Those placeholders have been removed until the real credentials module is implemented.
            </p>
            <div className="mt-5">
              <Link
                href="/support"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                Request credential feature support
                <MaterialIcon name="arrow_forward" className="text-base" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
