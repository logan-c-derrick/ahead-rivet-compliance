import Link from "next/link";

const legalLinks = [
  {
    href: "/legal/privacy",
    title: "Privacy Policy",
    description: "How Rivet and AHEAD handle personal and operational data.",
  },
  {
    href: "/legal/terms",
    title: "Terms of Use",
    description: "Conditions for access and permitted use of Rivet.",
  },
  {
    href: "/legal/code-of-conduct",
    title: "Code of Conduct",
    description: "Expected behavior, reporting channels, and enforcement approach.",
  },
  {
    href: "/legal/trust",
    title: "Trust and Security",
    description: "Security, operational controls, and compliance commitments.",
  },
];

export default function LegalIndexPage() {
  return (
    <main>
      <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">
        Rivet Legal Center
      </h1>
      <p className="text-on-surface-variant mb-8 max-w-3xl">
        These pages summarize legal and trust topics aligned to AHEAD policy areas. For official
        corporate legal statements, refer to{" "}
        <a className="text-primary font-semibold hover:underline" href="https://www.ahead.com/">
          ahead.com
        </a>
        .
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {legalLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-5 hover:border-primary/30 transition-colors"
          >
            <h2 className="font-bold text-on-surface text-lg">{link.title}</h2>
            <p className="text-sm text-on-surface-variant mt-2">{link.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}

