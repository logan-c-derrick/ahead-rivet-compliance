import Link from "next/link";
import { requireProfile } from "@/lib/profile";
import MaterialIcon from "@/components/ui/MaterialIcon";
import SidebarNav from "./sidebar-nav";
import TopNavBar from "./top-nav-bar";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export default async function SidebarLayout({ children }: SidebarLayoutProps) {
  await requireProfile();

  return (
    <div className="min-h-screen bg-surface">
      {/* Sidebar (fixed left rail) */}
      <aside className="h-screen w-64 fixed left-0 top-0 border-r border-slate-200/20 bg-white/60 backdrop-blur-xl flex flex-col py-6 z-50 shadow-[20px_0_40px_rgba(11,28,48,0.03)]">
        <div className="px-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <MaterialIcon name="shield" className="text-white text-sm" />
            </div>
            <div>
              <h1 className="text-lg font-black text-[#004A7C] tracking-tighter">
                EcoStratum
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold font-body">
                Enterprise Compliance
              </p>
            </div>
          </div>
        </div>

        <SidebarNav />

        <div className="px-4 mt-auto space-y-1">
          <Link
            href="/products"
            className="w-full bg-gradient-to-br from-[#003358] to-[#004a7c] text-white py-3 rounded-xl text-sm font-semibold mb-6 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 font-body"
          >
            <MaterialIcon name="add" className="text-sm" />
            New Assessment
          </Link>

          <Link
            href="/settings"
            className="flex items-center px-4 py-2 text-slate-600 hover:bg-[#f8f9ff] transition-all rounded-lg text-sm font-medium font-body"
          >
            <MaterialIcon name="settings" className="mr-3 text-lg" />
            Settings
          </Link>

          <Link
            href="/support"
            className="flex items-center px-4 py-2 text-slate-600 hover:bg-[#f8f9ff] transition-all rounded-lg text-sm font-medium font-body"
          >
            <MaterialIcon name="contact_support" className="mr-3 text-lg" />
            Support
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 min-h-screen min-w-0 max-w-full flex-1 overflow-auto bg-surface">
        <TopNavBar />
        {children}
      </main>
    </div>
  );
}
