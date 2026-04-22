import MaterialIcon from "@/components/ui/MaterialIcon";
import Link from "next/link";

export default function ProfilePreferencesPage() {
  return (
    <main className="flex-1 min-w-0">
      <div className="mb-10">
        <h2 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight mb-2">
          Preferences
        </h2>
        <p className="text-on-surface-variant font-body max-w-2xl">
          Notification and preference settings are managed from the main settings page.
        </p>
      </div>

      <section className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/20">
        <div className="flex items-start gap-3">
          <MaterialIcon name="info" className="text-primary mt-0.5" />
          <div>
            <h3 className="font-headline font-bold text-lg text-on-surface">
              Preferences Consolidated
            </h3>
            <p className="text-sm text-on-surface-variant mt-2 font-body max-w-2xl">
              This page previously showed prototype localization and notification controls.
              To avoid duplicate and non-functional settings, those controls have been removed.
              Use Settings for live notification and regulatory preferences.
            </p>
            <div className="mt-5">
              <Link
                href="/settings"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                Go to Settings
                <MaterialIcon name="arrow_forward" className="text-base" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
