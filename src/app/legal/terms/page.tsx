export default function TermsOfUsePage() {
  return (
    <main className="space-y-6">
      <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface">
        Terms of Use
      </h1>
      <p className="text-on-surface-variant">
        Effective date: 2026-04-28. These terms govern authorized use of Rivet for internal
        compliance operations.
      </p>

      <section>
        <h2 className="text-xl font-bold text-on-surface mb-2">Authorized access</h2>
        <p className="text-on-surface-variant">
          Access is limited to approved users. Credentials and access tokens must not be shared.
          Users are responsible for activity under their account.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-on-surface mb-2">Acceptable use</h2>
        <p className="text-on-surface-variant">
          Users must not misuse the platform, bypass security controls, upload prohibited content, or
          perform unauthorized data extraction.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-on-surface mb-2">Service changes and availability</h2>
        <p className="text-on-surface-variant">
          Features may evolve over time to improve security, reliability, and regulatory support.
          Planned maintenance and urgent remediation may temporarily affect availability.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-on-surface mb-2">Compliance and legal obligations</h2>
        <p className="text-on-surface-variant">
          Users remain responsible for their organization’s legal obligations and accuracy of submitted
          compliance data.
        </p>
      </section>

      <p className="text-sm text-on-surface-variant">
        For official corporate legal terms, see{" "}
        <a className="text-primary font-semibold hover:underline" href="https://www.ahead.com/">
          AHEAD Terms of Use
        </a>
        .
      </p>
    </main>
  );
}

