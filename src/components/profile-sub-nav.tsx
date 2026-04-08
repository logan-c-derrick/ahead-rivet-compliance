"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import MaterialIcon from "@/components/ui/MaterialIcon";

const navItems = [
  { href: "/profile", icon: "person", label: "Personal Info" },
  { href: "/profile/credentials", icon: "verified", label: "Credentials" },
  { href: "/profile/organization", icon: "domain", label: "Organization" },
  { href: "/profile/security", icon: "security", label: "Security" },
  { href: "/profile/preferences", icon: "settings", label: "Preferences" },
] as const;

export default function ProfileSubNav() {
  const pathname = usePathname();

  return (
    <aside className="lg:w-64 flex-shrink-0">
      <div className="px-4 mb-6">
        <h2 className="font-headline font-bold text-[#004A7C] text-lg">
          Account Settings
        </h2>
        <p className="text-xs text-on-secondary-container font-medium font-body">
          Data Integrity Portal
        </p>
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map(({ href, icon, label }) => {
          const isActive =
            href === "/profile"
              ? pathname === "/profile"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 mx-2 px-4 py-3 rounded-lg font-body text-sm font-medium transition-all ${
                isActive
                  ? "bg-surface-container-high text-[#004A7C] font-semibold"
                  : "text-slate-600 hover:bg-surface-container-low"
              }`}
            >
              <MaterialIcon name={icon} className={isActive ? "text-[#004A7C]" : undefined} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-8 pt-6 border-t border-outline-variant/20">
        <Link
          href="/support"
          className="flex items-center gap-3 mx-2 px-4 py-3 text-slate-600 hover:bg-surface-container-low rounded-lg font-body text-sm font-medium"
        >
          <MaterialIcon name="help" />
          Help Center
        </Link>
        <Link
          href="/support"
          className="flex items-center gap-3 mx-2 px-4 py-3 text-slate-600 hover:bg-surface-container-low rounded-lg font-body text-sm font-medium"
        >
          <MaterialIcon name="contact_support" />
          Support
        </Link>
      </div>
    </aside>
  );
}
