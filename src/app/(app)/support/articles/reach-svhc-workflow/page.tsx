import Link from "next/link";
import MaterialIcon from "@/components/ui/MaterialIcon";

export default function ReachSvhcWorkflowArticlePage() {
  return (
    <div className="min-h-screen px-6 pb-12">
      <div className="max-w-4xl mx-auto">
        <nav className="flex items-center gap-2 text-sm text-on-surface-variant mb-6 font-body pt-8">
          <Link href="/support" className="hover:text-primary transition-colors">
            Support
          </Link>
          <MaterialIcon name="chevron_right" className="text-xs" />
          <span className="text-primary font-semibold">REACH and SVHC Workflow</span>
        </nav>

        <article className="bg-surface-container-lowest rounded-2xl p-8 md:p-10 border border-outline-variant/20">
          <header className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-fixed text-primary text-xs font-semibold mb-4">
              <MaterialIcon name="science" className="text-sm" />
              Regulation Guide
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold font-headline text-on-surface tracking-tight mb-3">
              REACH and SVHC Workflow
            </h1>
            <p className="text-on-surface-variant text-base leading-relaxed font-body">
              A hands-on workflow for handling REACH obligations and Substances of Very High
              Concern (SVHC) updates in product compliance operations.
            </p>
          </header>

          <section className="space-y-6 text-sm md:text-base font-body text-on-surface">
            <div>
              <h2 className="text-xl font-bold font-headline mb-2">1) REACH Scope at a Glance</h2>
              <p className="text-on-surface-variant leading-relaxed">
                REACH is a broad chemical regulation framework covering registration, evaluation,
                authorization, and restriction. Product teams most commonly focus on article-level
                substance communication duties and evidence retention across the supply chain.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold font-headline mb-2">2) SVHC Trigger Points</h2>
              <p className="text-on-surface-variant leading-relaxed mb-3">
                When a new SVHC candidate list update is published, perform immediate screening:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-on-surface-variant">
                <li>Compare updated SVHC entries against existing part declarations.</li>
                <li>Identify affected components and impacted product/BOM revisions.</li>
                <li>Apply 0.1% w/w article-level threshold logic where applicable.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold font-headline mb-2">
                3) Supplier Outreach Process
              </h2>
              <ol className="list-decimal pl-5 space-y-2 text-on-surface-variant">
                <li>Issue targeted requests to suppliers for flagged parts.</li>
                <li>Set clear deadlines and escalation paths for missing responses.</li>
                <li>Capture declaration version/date and legal entity metadata.</li>
                <li>Document uncertainty and follow with test plans for high-risk cases.</li>
              </ol>
            </div>

            <div>
              <h2 className="text-xl font-bold font-headline mb-2">
                4) Internal Decisioning and Release Gates
              </h2>
              <p className="text-on-surface-variant leading-relaxed mb-3">
                Define consistent outcomes for flagged items:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-on-surface-variant">
                <li><strong>Approved:</strong> Complete declaration package, no blocking risk.</li>
                <li><strong>Conditional:</strong> Temporary acceptance with deadline-based remediation.</li>
                <li><strong>Blocked:</strong> Missing/invalid evidence or unacceptable concentration risk.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold font-headline mb-2">
                5) Evidence Required for Audit Readiness
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-on-surface-variant">
                <li>Supplier declarations and any test reports used for decisions</li>
                <li>Screening logic and impacted part/product lists</li>
                <li>Communication records for downstream obligations</li>
                <li>Change logs for risk status, approvals, and exceptions</li>
              </ul>
            </div>

            <div className="rounded-xl bg-surface-container-low p-5 border border-outline-variant/20">
              <h3 className="font-bold font-headline text-on-surface mb-2">Implementation Tip</h3>
              <p className="text-on-surface-variant leading-relaxed">
                Treat each SVHC update like a mini-release cycle: screen quickly, triage by
                business impact, launch supplier outreach in parallel, and close with a documented
                risk decision for each affected part.
              </p>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
