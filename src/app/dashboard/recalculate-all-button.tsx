"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MaterialIcon from "@/components/ui/MaterialIcon";
import { recalculateAllProductsCompliance } from "./actions";

export default function RecalculateAllButton({ productCount }: { productCount: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setMessage(null);
    const res = await recalculateAllProductsCompliance();
    setLoading(false);
    if (res.ok) {
      setMessage(`Updated ${res.updated} product${res.updated !== 1 ? "s" : ""}`);
      router.refresh();
    } else {
      setMessage(`Error: ${res.error}`);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="bg-surface-container-lowest text-primary px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:bg-surface-container-low transition-colors flex items-center gap-2 disabled:opacity-50"
        title={`Recalculate compliance status for all ${productCount} products`}
      >
        {loading ? (
          <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        ) : (
          <MaterialIcon name="refresh" className="text-lg" />
        )}
        {loading ? "Recalculating…" : "Recalculate All"}
      </button>
      {message && (
        <span className="text-xs text-on-surface-variant">{message}</span>
      )}
    </div>
  );
}
