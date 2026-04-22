import Link from "next/link";
import { requireProfile } from "@/lib/profile";
import MaterialIcon from "@/components/ui/MaterialIcon";
import { SupportTicketForm } from "./support-ticket-form";
import { createClient } from "@/lib/supabase/server";

export default async function SupportPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: ticketRows } = await supabase
    .from("support_tickets")
    .select("id, inquiry_type, subject, status, created_at")
    .eq("organization_id", profile.organization_id)
    .eq("requester_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(8);

  const knowledgeBaseArticles = [
    {
      icon: "eco",
      title: "RoHS Compliance Basics",
      summary:
        "Understand scope, restricted substance thresholds, and what evidence to collect from suppliers for RoHS declarations.",
      href: "/support/articles/rohs-compliance-basics",
      points: [
        "Restricted substances include lead, mercury, cadmium, hexavalent chromium, PBB, and PBDE (plus phthalates in RoHS 3).",
        "Material concentration limits are typically 0.1% by weight in homogeneous material (0.01% for cadmium).",
        "Capture supplier declarations, test reports where needed, and maintain traceability by part number and BOM revision.",
      ],
    },
    {
      icon: "science",
      title: "REACH and SVHC Workflow",
      summary:
        "Track SVHC list updates, identify affected parts, and manage supplier outreach for Article 33 and SCIP-related obligations.",
      href: "/support/articles/reach-svhc-workflow",
      points: [
        "Review ECHA SVHC candidate list updates and compare against current component declarations.",
        "If SVHC exceeds 0.1% w/w at article level, ensure downstream communication obligations are met.",
        "Create supplier requests quickly for missing declarations and retain document history for audit evidence.",
      ],
    },
    {
      icon: "fact_check",
      title: "Supplier Documentation Checklist",
      summary:
        "A practical checklist for requesting and validating supplier compliance data before approvals or shipments.",
      points: [
        "Request latest declaration with legal entity name, part number, revision/date, and regulation version.",
        "Verify declaration currency and whether test data is required for high-risk categories.",
        "Record exceptions, approved alternatives, and expiration/revalidation cadence.",
      ],
    },
    {
      icon: "history_edu",
      title: "Audit Readiness and Evidence Retention",
      summary:
        "Prepare for customer and regulatory audits with a clean evidence trail and consistent data retention practices.",
      points: [
        "Store declarations and supporting artifacts per part, supplier, and effective date.",
        "Keep change logs for status updates, approvals, and risk decisions.",
        "Use periodic internal checks to identify missing docs before external audits.",
      ],
    },
  ];

  const faqs = [
    {
      question: "What is the difference between RoHS and REACH?",
      answer:
        "RoHS restricts specific hazardous substances in electrical and electronic equipment. REACH is broader and governs chemical substance registration, evaluation, authorization, and restriction across the EU supply chain.",
    },
    {
      question: "How often should we refresh supplier declarations?",
      answer:
        "At minimum, refresh annually and whenever a regulation changes, a BOM revision is released, or a supplier notifies material/process changes. High-risk parts often need a tighter cadence.",
    },
    {
      question: "When should we request lab testing instead of relying only on declarations?",
      answer:
        "Use testing for high-risk suppliers, incomplete declarations, inconsistent historical data, or when customer/regulatory requirements explicitly call for analytical verification.",
    },
    {
      question: "What is the fastest way to handle a new SVHC update?",
      answer:
        "Identify affected components, prioritize high-volume and customer-critical products, send targeted supplier requests immediately, and track remediation actions with clear due dates.",
    },
    {
      question: "What evidence is typically needed for an environmental compliance audit?",
      answer:
        "Auditors usually expect current declarations, test evidence where applicable, supplier communications, risk decisions, and change history linking each product and BOM revision to supporting records.",
    },
  ];

  return (
    <div className="min-h-screen px-6 pb-12">
      <div className="max-w-6xl mx-auto">
        <section className="mb-12 text-center py-16 bg-gradient-to-br from-primary to-primary-container rounded-xl shadow-xl overflow-hidden relative">
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_70%_50%,_white_0%,_transparent_50%)]" />
          <div className="relative z-10 px-6">
            <h1 className="text-4xl md:text-5xl font-extrabold text-on-primary font-headline mb-4 tracking-tight">
              How can we assist your compliance journey?
            </h1>
            <p className="text-primary-fixed-dim text-lg mb-8 max-w-2xl mx-auto">
              Access the Rivet knowledge base, regulatory updates, and
              expert support channels.
            </p>
            <form action="/search" method="GET" className="max-w-xl mx-auto relative">
              <input type="hidden" name="section" value="regulations" />
              <input
                className="w-full py-4 pl-14 pr-28 rounded-xl border-none shadow-2xl focus:ring-2 focus:ring-tertiary-fixed-dim text-on-surface font-body"
                placeholder="Search for REACH updates, SVHC logs, or ticket status..."
                type="search"
                name="q"
              />
              <MaterialIcon
                name="search"
                className="absolute left-5 top-1/2 -translate-y-1/2 text-primary text-2xl"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Search
              </button>
            </form>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-8">
            <div>
              <h2 className="text-2xl font-bold font-headline text-primary mb-6 flex items-center gap-2">
                <MaterialIcon name="library_books" />
                Compliance Knowledge Base
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {knowledgeBaseArticles.map((item) => (
                  <div
                    key={item.title}
                    className="bg-surface-container-lowest p-6 rounded-xl hover:shadow-md transition-all border-b-4 border-transparent hover:border-primary-fixed"
                  >
                    <div className="w-12 h-12 rounded-lg bg-surface-container-low flex items-center justify-center text-primary mb-4">
                      <MaterialIcon name={item.icon} className="text-3xl" />
                    </div>
                    <h3 className="text-lg font-bold text-on-surface mb-2 font-headline">
                      {item.title}
                    </h3>
                    <p className="text-on-secondary-container text-sm leading-relaxed mb-4 font-body">
                      {item.summary}
                    </p>
                    <ul className="space-y-2 text-xs text-on-surface-variant font-body list-disc pl-4">
                      {item.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                    <div className="mt-4">
                      {item.href ? (
                        <Link
                          href={item.href}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                        >
                          Read full article
                          <MaterialIcon name="arrow_forward" className="text-sm" />
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface-container-low rounded-2xl p-8">
              <h2 className="text-2xl font-bold font-headline text-primary mb-8">
                Common Compliance FAQs
              </h2>
              <div className="space-y-4">
                {faqs.map((item) => (
                  <div key={item.question} className="bg-surface-container-lowest rounded-lg p-5">
                    <div className="flex justify-between items-start gap-3">
                      <h4 className="font-semibold text-on-background text-base font-headline">
                        {item.question}
                      </h4>
                      <MaterialIcon name="help" className="text-primary" />
                    </div>
                    <div className="mt-3 text-sm text-on-surface-variant leading-relaxed font-body">
                      {item.answer}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface-container-low rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold font-headline text-primary">
                  My Recent Tickets
                </h2>
                <span className="text-xs text-on-surface-variant font-body">
                  {(ticketRows ?? []).length} shown
                </span>
              </div>
              {(ticketRows ?? []).length === 0 ? (
                <div className="rounded-xl bg-surface-container-lowest p-5 text-sm text-on-surface-variant font-body">
                  No tickets yet. Submit one from the support panel to start tracking requests.
                </div>
              ) : (
                <div className="space-y-3">
                  {(ticketRows ?? []).map((ticket: any) => (
                    <div
                      key={ticket.id}
                      className="rounded-xl bg-surface-container-lowest p-4 border border-outline-variant/10"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold text-on-surface font-headline">
                            {ticket.subject}
                          </p>
                          <p className="text-xs text-on-surface-variant font-body mt-1">
                            {ticket.inquiry_type} •{" "}
                            {ticket.created_at
                              ? new Date(ticket.created_at).toLocaleString()
                              : "Unknown date"}
                          </p>
                        </div>
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-secondary-fixed-dim/20 text-on-secondary-container">
                          {ticket.status ?? "open"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 sticky top-24">
            <div className="bg-surface-container-highest/30 backdrop-blur-md rounded-2xl p-8 border border-outline-variant/10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                  <MaterialIcon
                    name="support_agent"
                    className="text-2xl"
                    filled
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-headline text-primary">
                    Direct Support
                  </h3>
                  <p className="text-sm text-on-surface-variant font-body">
                    24/7 Regulatory Expert Access
                  </p>
                </div>
              </div>
              <SupportTicketForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
