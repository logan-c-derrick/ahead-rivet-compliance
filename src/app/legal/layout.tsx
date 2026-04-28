import Link from "next/link";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <Link href="/login" className="text-sm font-semibold text-primary hover:underline">
            Back to Rivet Login
          </Link>
        </header>
        {children}
      </div>
    </div>
  );
}

