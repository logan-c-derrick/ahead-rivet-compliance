import Link from "next/link";
import MaterialIcon from "@/components/ui/MaterialIcon";

export default function ProfileCredentialsPage() {
  const certifications = [
    {
      id: "ISO-14001",
      name: "ISO 14001:2015 Lead Auditor",
      certId: "#ENV-99201-B",
      issued: "Mar 12, 2023",
      expires: "Mar 12, 2026",
      status: "COMPLIANT",
      statusClass: "bg-tertiary-fixed-dim text-on-tertiary-fixed-variant",
      icon: "workspace_premium",
    },
    {
      id: "HAZMAT",
      name: "HAZMAT Operations Specialist",
      certId: "#HZ-8812-OP",
      issued: "Nov 01, 2022",
      expires: "Nov 01, 2025",
      status: "PENDING REVIEW",
      statusClass: "bg-secondary-fixed-dim text-on-secondary-fixed-variant",
      icon: "warning",
    },
    {
      id: "NEBOSH",
      name: "NEBOSH International Diploma",
      certId: "#NEB-2019-D",
      issued: "Jan 15, 2021",
      expires: "Jan 15, 2025",
      status: "EXPIRING SOON",
      statusClass: "bg-error/10 text-error",
      icon: "gavel",
    },
  ];

  const verificationHistory = [
    { name: "ISO_Renewal_Report_2023.pdf", date: "Mar 10, 2023", registrar: "Intertek Systems" },
    { name: "HAZMAT_Safety_Module_C.zip", date: "Oct 28, 2022", registrar: "OSHA Training Institute" },
  ];

  return (
    <main className="flex-1 min-w-0">
      <div className="mb-12 flex justify-between items-end flex-col sm:flex-row gap-6">
        <div>
          <nav className="flex items-center gap-2 text-sm text-on-surface-variant mb-4 font-body">
            <Link href="/profile" className="hover:text-primary transition-colors">
              Profile
            </Link>
            <MaterialIcon name="chevron_right" className="text-xs" />
            <span className="text-primary font-semibold">Credentials & Certifications</span>
          </nav>
          <h1 className="text-4xl font-extrabold font-headline tracking-tight mb-2 text-on-surface">
            Architectural Ledger
          </h1>
          <p className="text-on-surface-variant max-w-2xl leading-relaxed font-body">
            Verified professional environmental certifications and compliance history.
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 bg-gradient-to-br from-primary to-primary-container text-white px-6 py-3 rounded-md shadow-lg font-body font-semibold"
        >
          <MaterialIcon name="add_circle" className="text-lg" />
          Upload New Credential
        </button>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <section className="bg-surface-container-low rounded-xl p-8">
            <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
              <h3 className="text-xl font-bold font-headline text-on-surface">
                Active Certifications
              </h3>
              <div className="flex gap-2">
                <span className="text-xs font-medium px-3 py-1 bg-surface-container-highest rounded-full text-primary">
                  All (3)
                </span>
                <span className="text-xs font-medium px-3 py-1 text-on-surface-variant">
                  Expiring Soon (1)
                </span>
              </div>
            </div>
            <div className="space-y-4">
              {certifications.map((cert) => (
                <div
                  key={cert.id}
                  className="bg-surface-container-lowest p-6 rounded-lg transition-all hover:translate-x-0.5 group"
                >
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-surface-container-low rounded-lg flex items-center justify-center text-primary">
                        <MaterialIcon
                          name={cert.icon}
                          className="text-3xl"
                          filled={cert.icon === "workspace_premium"}
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-1 font-headline text-on-surface">
                          {cert.name}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-on-surface-variant font-body flex-wrap">
                          <span>ID: {cert.certId}</span>
                          <span className="w-1 h-1 bg-outline-variant rounded-full" />
                          <span>Issued: {cert.issued}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full mb-2 inline-block ${cert.statusClass}`}>
                        {cert.status}
                      </span>
                      <div className={`text-sm font-medium font-body ${cert.status === "EXPIRING SOON" ? "text-error" : "text-on-surface-variant"}`}>
                        Expires: {cert.expires}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-surface-container-lowest p-8 rounded-xl">
            <h3 className="text-xl font-bold mb-6 font-headline text-on-surface">
              Verification History
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 border-b border-outline-variant font-body">
                  <tr>
                    <th className="pb-4">Document Name</th>
                    <th className="pb-4">Audit Date</th>
                    <th className="pb-4">Registrar</th>
                    <th className="pb-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-body">
                  {verificationHistory.map((row, i) => (
                    <tr key={i} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-4 font-medium flex items-center gap-2">
                        <MaterialIcon name="description" className="text-primary-container" />
                        {row.name}
                      </td>
                      <td className="py-4 text-on-surface-variant">{row.date}</td>
                      <td className="py-4 text-on-surface-variant">{row.registrar}</td>
                      <td className="py-4 text-right">
                        <button className="text-primary hover:underline font-medium">Download</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-8">
          <div className="bg-gradient-to-br from-primary to-primary-container text-white p-8 rounded-xl relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-2 font-headline">Compliance Score</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-headline font-extrabold">94</span>
                <span className="text-xl opacity-60">/ 100</span>
              </div>
              <div className="w-full bg-white/20 h-1.5 rounded-full mb-4">
                <div className="bg-tertiary-fixed-dim h-full rounded-full" style={{ width: "94%" }} />
              </div>
              <p className="text-sm opacity-80 leading-relaxed font-body">
                Your profile is currently high-trust. Renew your NEBOSH diploma within 30 days.
              </p>
            </div>
            <div className="absolute -bottom-10 -right-10 opacity-10">
              <MaterialIcon name="shield" className="text-[160px]" />
            </div>
          </div>

          <div className="bg-surface-container-highest/60 backdrop-blur-sm p-8 rounded-xl">
            <h3 className="text-sm font-extrabold tracking-widest text-primary mb-6 uppercase font-body">
              Submission Protocol
            </h3>
            <ul className="space-y-6">
              <li className="flex gap-4">
                <div className="mt-1 w-6 h-6 rounded-full bg-primary-container flex items-center justify-center text-white text-[10px] font-bold shrink-0">1</div>
                <div>
                  <p className="text-sm font-bold mb-1 font-body">Original Scans Only</p>
                  <p className="text-xs text-on-surface-variant leading-relaxed font-body">
                    Upload high-resolution PDF or JPEG files.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="mt-1 w-6 h-6 rounded-full bg-primary-container flex items-center justify-center text-white text-[10px] font-bold shrink-0">2</div>
                <div>
                  <p className="text-sm font-bold mb-1 font-body">Verification Window</p>
                  <p className="text-xs text-on-surface-variant leading-relaxed font-body">
                    Manual verification can take up to 48 business hours.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="mt-1 w-6 h-6 rounded-full bg-primary-container flex items-center justify-center text-white text-[10px] font-bold shrink-0">3</div>
                <div>
                  <p className="text-sm font-bold mb-1 font-body">ID Authenticity</p>
                  <p className="text-xs text-on-surface-variant leading-relaxed font-body">
                    Certification IDs must match the global registry.
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <Link
            href="/support"
            className="block p-6 bg-surface-container-low rounded-xl border border-outline-variant/20 hover:bg-surface-container-high transition-colors text-center"
          >
            <p className="text-primary font-bold text-sm font-body">Request External Audit Assistance</p>
            <p className="text-xs text-on-surface-variant mt-1 font-body">Connect with a compliance officer</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
