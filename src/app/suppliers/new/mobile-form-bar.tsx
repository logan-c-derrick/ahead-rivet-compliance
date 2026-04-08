"use client";

export default function MobileSupplierFormBar() {
  return (
    <div className="fixed bottom-0 left-0 w-full bg-surface-container-lowest md:hidden p-4 flex gap-3 shadow-2xl border-t border-outline-variant/10 z-40">
      <button
        type="button"
        onClick={() => window.history.back()}
        className="flex-1 py-3 bg-surface-container-high text-on-secondary-container font-bold rounded-lg text-xs uppercase tracking-widest font-body"
      >
        Draft
      </button>
      <button
        type="submit"
        form="supplier-form"
        className="flex-[2] py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-lg text-xs uppercase tracking-widest font-body"
      >
        Submit Entry
      </button>
    </div>
  );
}
