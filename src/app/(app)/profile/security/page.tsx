import MaterialIcon from "@/components/ui/MaterialIcon";

export default function ProfileSecurityPage() {
  return (
    <main className="flex-1 min-w-0">
      <section className="mb-10">
        <h1 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight mb-2">
          Security
        </h1>
        <p className="text-on-surface-variant max-w-2xl leading-relaxed font-body">
          Password management, MFA setup, and session controls are not implemented yet.
        </p>
      </section>

      <section className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/20">
        <div className="flex items-start gap-3">
          <MaterialIcon name="info" className="text-primary mt-0.5" />
          <div>
            <h2 className="font-headline font-bold text-lg text-on-surface">
              Security Controls Pending
            </h2>
            <p className="text-sm text-on-surface-variant mt-2 font-body max-w-2xl">
              This page previously displayed prototype session and authentication controls.
              Placeholder controls have been removed to avoid implying live security features.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
