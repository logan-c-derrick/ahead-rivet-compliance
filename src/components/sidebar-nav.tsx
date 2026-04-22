"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import MaterialIcon from "@/components/ui/MaterialIcon";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/products", label: "Products", icon: "inventory_2" },
  { href: "/components", label: "Components", icon: "settings_input_component" },
  { href: "/suppliers", label: "Suppliers", icon: "factory" },
  { href: "/regulations", label: "Regulations", icon: "gavel" },
  { href: "/certificates", label: "Certificates", icon: "description" },
  { href: "/outreach", label: "Outreach", icon: "campaign" },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center px-4 py-2.5 mx-2 rounded-lg text-sm transition-all font-body ${
              isActive
                ? "bg-[#eff4ff] text-[#004A7C] font-bold"
                : "text-slate-600 hover:bg-[#f8f9ff] font-medium"
            }`}
          >
            <MaterialIcon name={item.icon} className="mr-3 text-lg" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
