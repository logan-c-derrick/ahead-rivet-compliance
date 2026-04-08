import { requireProfile } from "@/lib/profile";
import MaterialIcon from "@/components/ui/MaterialIcon";

export default async function SupportPage() {
  await requireProfile();

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
              Access the EcoStratum knowledge base, regulatory updates, and
              expert support channels.
            </p>
            <div className="max-w-xl mx-auto relative">
              <input
                className="w-full py-4 pl-14 pr-6 rounded-xl border-none shadow-2xl focus:ring-2 focus:ring-tertiary-fixed-dim text-on-surface font-body"
                placeholder="Search for REACH updates, SVHC logs, or ticket status..."
                type="text"
              />
              <MaterialIcon
                name="search"
                className="absolute left-5 top-1/2 -translate-y-1/2 text-primary text-2xl"
              />
            </div>
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
                {[
                  {
                    icon: "science",
                    title: "REACH & SVHC Compliance",
                    desc: "Latest guidelines on handling Annex XIV updates and reporting protocols for high-risk substances.",
                    border: "hover:border-tertiary-fixed-dim",
                  },
                  {
                    icon: "eco",
                    title: "Environmental ESG Reporting",
                    desc: "A step-by-step guide to generating investor-ready sustainability reports using integrated audit logs.",
                    border: "hover:border-primary-fixed",
                  },
                  {
                    icon: "history_edu",
                    title: "Audit Trail Management",
                    desc: "Understanding the immutable ledger system and how to export logs for regulatory inspections.",
                    border: "hover:border-secondary-fixed-dim",
                  },
                  {
                    icon: "shield",
                    title: "Security & Data Privacy",
                    desc: "How EcoStratum protects your intellectual property and maintains encryption at rest and in transit.",
                    border: "hover:border-surface-dim",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className={`bg-surface-container-lowest p-6 rounded-xl hover:shadow-md transition-all group cursor-pointer border-b-4 border-transparent ${item.border}`}
                  >
                    <div className="w-12 h-12 rounded-lg bg-surface-container-low flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                      <MaterialIcon name={item.icon} className="text-3xl" />
                    </div>
                    <h3 className="text-lg font-bold text-on-surface mb-2 font-headline">
                      {item.title}
                    </h3>
                    <p className="text-on-secondary-container text-sm leading-relaxed mb-4 font-body">
                      {item.desc}
                    </p>
                    <span className="text-primary text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all font-body">
                      Read Documentation{" "}
                      <MaterialIcon name="arrow_forward" className="text-xs" />
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface-container-low rounded-2xl p-8">
              <h2 className="text-2xl font-bold font-headline text-primary mb-8">
                Common Compliance FAQs
              </h2>
              <div className="space-y-4">
                <div className="bg-surface-container-lowest rounded-lg p-5 cursor-pointer">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-on-background text-base font-headline">
                      How to handle REACH SVHC updates effectively?
                    </h4>
                    <MaterialIcon name="expand_more" className="text-primary" />
                  </div>
                  <div className="mt-4 text-sm text-on-surface-variant leading-relaxed font-body">
                    When a new substance is added to the SVHC list, EcoStratum
                    automatically flags matching components in your BOM. You
                    should proceed to the &apos;Compliance Center&apos; and
                    initiate a &apos;Supplier Data Request&apos; for the flagged
                    items immediately.
                  </div>
                </div>
                <div className="bg-surface-container-lowest rounded-lg p-5 cursor-pointer">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-on-background text-base font-headline">
                      What is the turnaround time for expert regulatory
                      reviews?
                    </h4>
                    <MaterialIcon name="expand_more" className="text-outline" />
                  </div>
                </div>
                <div className="bg-surface-container-lowest rounded-lg p-5 cursor-pointer">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-on-background text-base font-headline">
                      Can I integrate EcoStratum logs with my existing ERP?
                    </h4>
                    <MaterialIcon name="expand_more" className="text-outline" />
                  </div>
                </div>
              </div>
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
              <form className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 font-body">
                    Inquiry Type
                  </label>
                  <select className="w-full bg-surface-container-lowest border-none rounded-lg text-sm p-3 focus:ring-2 focus:ring-primary font-body">
                    <option>Technical Issue</option>
                    <option>Regulatory Consultation</option>
                    <option>Audit Preparation</option>
                    <option>Account & Billing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 font-body">
                    Subject
                  </label>
                  <input
                    className="w-full bg-surface-container-lowest border-none rounded-lg text-sm p-3 focus:ring-2 focus:ring-primary font-body"
                    placeholder="Brief summary of your request"
                    type="text"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 font-body">
                    Description
                  </label>
                  <textarea
                    className="w-full bg-surface-container-lowest border-none rounded-lg text-sm p-3 focus:ring-2 focus:ring-primary font-body"
                    placeholder="How can we help you today?"
                    rows={4}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl font-bold shadow-lg active:scale-[0.98] transition-all"
                >
                  Open Support Ticket
                </button>
              </form>
              <div className="mt-8 pt-8 border-t border-outline-variant/20 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim animate-pulse" />
                  <span className="text-sm font-medium text-on-surface font-body">
                    Average Response:{" "}
                    <span className="text-primary">14 Minutes</span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <MaterialIcon name="chat" className="text-outline text-xl" />
                  <span className="text-sm font-medium text-on-surface font-body">
                    Live Chat:{" "}
                    <span className="text-primary underline cursor-pointer">
                      Start Now
                    </span>
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-6 bg-tertiary-container rounded-2xl p-6 text-on-tertiary relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <MaterialIcon
                  name="verified_user"
                  className="text-9xl"
                />
              </div>
              <h4 className="font-bold font-headline mb-2">
                Priority Helpline
              </h4>
              <p className="text-xs text-on-tertiary-container mb-4 leading-relaxed font-body">
                Exclusive for Enterprise users. Connect directly with our Senior
                Compliance Officers.
              </p>
              <p className="text-lg font-bold font-mono tracking-tighter text-tertiary-fixed">
                +1 (800) ECO-STRAT
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
