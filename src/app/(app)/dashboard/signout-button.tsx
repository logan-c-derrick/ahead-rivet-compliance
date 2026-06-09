"use client";

import { createClient } from "@/lib/supabase/client";
import MaterialIcon from "@/components/ui/MaterialIcon";

export default function SignOutButton({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.assign("/login");
  }

  return (
    <button
      className={
        className ??
        "flex items-center gap-3 px-4 py-2 text-slate-600 hover:bg-[#f8f9ff] transition-all rounded-lg font-['Inter'] text-sm font-medium w-full justify-start"
      }
      onClick={signOut}
      type="button"
    >
      <MaterialIcon name="logout" className="mr-3 text-lg" />
      <span>{label ?? "Sign out"}</span>
    </button>
  );
}
