export default function PrivacyPolicyPage() {
  return (
    <main className="space-y-6">
      <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface">
        Privacy Policy
      </h1>
      <p className="text-on-surface-variant">
        Effective date: 2026-04-28. This policy describes how Rivet handles data in line with AHEAD
        privacy practices.
      </p>

      <section>
        <h2 className="text-xl font-bold text-on-surface mb-2">Information we process</h2>
        <p className="text-on-surface-variant">
          Rivet processes account profile data, organization records, product/supplier compliance
          data, uploaded supplier documents, and operational logs needed to deliver compliance
          workflows.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-on-surface mb-2">Purpose of processing</h2>
        <p className="text-on-surface-variant">
          Data is processed to provide compliance tracking, outreach, document review, audit support,
          and secure platform operations.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-on-surface mb-2">Retention and access</h2>
        <p className="text-on-surface-variant">
          Data retention is based on contractual, regulatory, and operational requirements. Access is
          role-scoped with organization-level data isolation and least-privilege controls.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-on-surface mb-2">Data subject and customer rights</h2>
        <p className="text-on-surface-variant">
          Requests for access, correction, deletion, or policy clarification should be routed through
          your AHEAD account team and privacy channels on the corporate site.
        </p>
      </section>

      <p className="text-sm text-on-surface-variant">
        For official corporate privacy disclosures, see{" "}
        <a className="text-primary font-semibold hover:underline" href="https://www.ahead.com/">
          AHEAD Privacy Policy
        </a>
        .
      </p>
    </main>
  );
}

