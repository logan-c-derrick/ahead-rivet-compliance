"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import MaterialIcon from "@/components/ui/MaterialIcon";

const PATH_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/products": "Products",
  "/components": "Components",
  "/suppliers": "Suppliers",
  "/regulations": "Regulations",
  "/certificates": "Certificates",
  "/outreach": "Outreach",
  "/audit": "Audit Logs",
  "/profile": "User Profile",
  "/settings": "Settings",
  "/support": "Help Center",
  "/search": "Search",
};

function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname.startsWith("/products/")) return "Product Detail";
  if (pathname.startsWith("/components/")) return "Component Detail";
  if (pathname.startsWith("/suppliers/")) return "Supplier Detail";
  for (const [path, title] of Object.entries(PATH_TITLES)) {
    if (pathname === path || pathname.startsWith(path + "/")) return title;
  }
  return "Rivet";
}

export default function TopNavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const title = getPageTitle(pathname);

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const q = (form.elements.namedItem("q") as HTMLInputElement)?.value?.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <header className="h-16 sticky top-0 z-40 bg-[#f8f9ff] flex justify-between items-center px-8 w-full border-b border-slate-200/40">
      <div className="flex items-center gap-8">
        <h2 className="text-xl font-bold text-[#004A7C] font-headline">
          {title}
        </h2>
        <form onSubmit={handleSearch} className="relative w-80 hidden sm:block">
          <MaterialIcon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"
          />
          <input
            name="q"
            type="text"
            placeholder="Search products, suppliers, regs..."
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/10 font-body placeholder:text-slate-400"
            aria-label="Search"
          />
        </form>
      </div>
      <div className="flex items-center gap-4">
        <Link
          href="/support"
          className="p-2 text-slate-500 hover:bg-surface-container-low hover:text-primary rounded-full transition-colors"
          aria-label="Help"
        >
          <MaterialIcon name="help_outline" />
        </Link>
        <button
          type="button"
          className="p-2 text-slate-500 hover:bg-surface-container-low hover:text-primary rounded-full transition-colors relative"
          aria-label="Notifications"
        >
          <MaterialIcon name="notifications" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full" />
        </button>
        <Link
          href="/profile"
          className="h-8 w-8 rounded-full bg-surface-container-highest overflow-hidden flex items-center justify-center border-2 border-white shadow-sm hover:ring-2 hover:ring-primary/20 transition-all"
          aria-label="Profile & settings"
        >
          <MaterialIcon name="account_circle" className="text-2xl text-primary" />
        </Link>
      </div>
    </header>
  );
}
