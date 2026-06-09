import Link from "next/link";
import MaterialIcon from "@/components/ui/MaterialIcon";

export default function RohsComplianceBasicsArticlePage() {
  return (
    <div className="min-h-screen px-6 pb-12">
      <div className="max-w-4xl mx-auto">
        <nav className="flex items-center gap-2 text-sm text-on-surface-variant mb-6 font-body pt-8">
          <Link href="/support" className="hover:text-primary transition-colors">
            Support
          </Link>
          <MaterialIcon name="chevron_right" className="text-xs" />
          <span className="text-primary font-semibold">RoHS Compliance Basics</span>
        </nav>

        <article className="bg-surface-container-lowest rounded-2xl p-8 md:p-10 border border-outline-variant/20">
          <header className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-fixed text-primary text-xs font-semibold mb-4">
              <MaterialIcon name="eco" className="text-sm" />
              Regulation Guide
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold font-headline text-on-surface tracking-tight mb-3">
              RoHS Compliance Basics
            </h1>
            <p className="text-on-surface-variant text-base leading-relaxed font-body">
              A practical implementation guide for Restriction of Hazardous Substances (RoHS)
              in electrical and electronic products.
            </p>
          </header>

          <section className="space-y-6 text-sm md:text-base font-body text-on-surface">
            <div>
              <h2 className="text-xl font-bold font-headline mb-2">1) What RoHS Covers</h2>
              <p className="text-on-surface-variant leading-relaxed">
                RoHS applies to many categories of electrical and electronic equipment placed on
                the EU market. The core purpose is to limit hazardous substances in homogeneous
                materials within products and components.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold font-headline mb-2">
                2) Restricted Substances and Thresholds
              </h2>
              <p className="text-on-surface-variant leading-relaxed mb-3">
                Teams typically track these thresholds in supplier declarations and test evidence:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-on-surface-variant">
                <li>Lead (Pb): 0.1%</li>
                <li>Mercury (Hg): 0.1%</li>
                <li>Cadmium (Cd): 0.01%</li>
                <li>Hexavalent Chromium (Cr6+): 0.1%</li>
                <li>PBB: 0.1%</li>
                <li>PBDE: 0.1%</li>
                <li>DEHP, BBP, DBP, DIBP: 0.1% each (RoHS 3 additions)</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold font-headline mb-2">
                3) Required Evidence Package
              </h2>
              <p className="text-on-surface-variant leading-relaxed mb-3">
                For each part or material in scope, maintain:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-on-surface-variant">
                <li>Supplier declaration with legal entity, part number, and revision/date</li>
                <li>Regulation/version reference used for the declaration</li>
                <li>Test reports for high-risk parts or where customer requires analytical proof</li>
                <li>Internal disposition record (approved, conditional, blocked)</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold font-headline mb-2">
                4) Operational Workflow in Practice
              </h2>
              <ol className="list-decimal pl-5 space-y-2 text-on-surface-variant">
                <li>Map BOM lines to current supplier declarations.</li>
                <li>Flag missing, expired, or incomplete declarations.</li>
                <li>Request updates from suppliers with due dates and escalation paths.</li>
                <li>Apply approval rules before shipment or release milestones.</li>
                <li>Store all evidence by product, BOM revision, and effective date.</li>
              </ol>
            </div>

            <div>
              <h2 className="text-xl font-bold font-headline mb-2">
                5) Common Failure Modes to Avoid
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-on-surface-variant">
                <li>Using declarations not tied to exact part numbers/revisions</li>
                <li>Failing to revalidate after supplier process or material changes</li>
                <li>Keeping evidence in email threads instead of controlled records</li>
                <li>Not defining when test data is mandatory versus optional</li>
              </ul>
            </div>

            <div className="rounded-xl bg-surface-container-low p-5 border border-outline-variant/20">
              <h3 className="font-bold font-headline text-on-surface mb-2">Implementation Tip</h3>
              <p className="text-on-surface-variant leading-relaxed">
                Start with your top 20% highest-volume or highest-risk components and enforce
                declaration completeness there first. This usually delivers the fastest risk
                reduction and creates a repeatable process for full rollout.
              </p>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
