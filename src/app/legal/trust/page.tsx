export default function TrustPage() {
  return (
    <main className="space-y-6">
      <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface">
        Trust and Security
      </h1>
      <p className="text-on-surface-variant">
        Rivet is operated with layered controls across identity, data access, monitoring, and incident
        response to protect compliance operations.
      </p>

      <section>
        <h2 className="text-xl font-bold text-on-surface mb-2">Security controls</h2>
        <p className="text-on-surface-variant">
          Platform protections include authenticated access, role-based permissions, database row-level
          security, environment-scoped secrets, and production health/readiness monitoring.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-on-surface mb-2">Operational reliability</h2>
        <p className="text-on-surface-variant">
          Rivet maintains runbooks for monitoring, backup/rollback, and incident handling to reduce
          downtime and support rapid recovery.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-on-surface mb-2">Incident response</h2>
        <p className="text-on-surface-variant">
          Suspected security incidents are triaged with priority routing, containment, recovery, and
          post-incident documentation.
        </p>
      </section>

      <p className="text-sm text-on-surface-variant">
        For official corporate trust and security disclosures, see{" "}
        <a className="text-primary font-semibold hover:underline" href="https://www.ahead.com/">
          AHEAD Trust
        </a>
        .
      </p>
    </main>
  );
}

