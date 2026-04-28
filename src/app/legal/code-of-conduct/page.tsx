export default function CodeOfConductPage() {
  return (
    <main className="space-y-6">
      <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface">
        Code of Conduct
      </h1>
      <p className="text-on-surface-variant">
        Rivet users are expected to follow professional, ethical, and lawful behavior standards
        aligned to AHEAD corporate conduct expectations.
      </p>

      <section>
        <h2 className="text-xl font-bold text-on-surface mb-2">Expected behavior</h2>
        <p className="text-on-surface-variant">
          Be accurate with compliance records, respectful in communications, and transparent about
          risks, exceptions, and unresolved findings.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-on-surface mb-2">Prohibited behavior</h2>
        <p className="text-on-surface-variant">
          Do not falsify records, circumvent controls, misuse credentials, or harass/intimidate other
          users or partners.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-on-surface mb-2">Reporting concerns</h2>
        <p className="text-on-surface-variant">
          Suspected misconduct, policy violations, or security issues must be reported through internal
          leadership, support channels, or official corporate reporting paths.
        </p>
      </section>

      <p className="text-sm text-on-surface-variant">
        For official corporate conduct policy language, see{" "}
        <a className="text-primary font-semibold hover:underline" href="https://www.ahead.com/">
          AHEAD Code of Conduct
        </a>
        .
      </p>
    </main>
  );
}

