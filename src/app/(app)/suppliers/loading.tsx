export default function Loading() {
  return (
    <div className="p-8 md:p-12 animate-pulse">
      <div className="h-8 bg-slate-100 rounded-lg w-40 mb-6" />
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="h-10 bg-slate-50 border-b border-slate-200" />
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-slate-100 last:border-0">
            <div className="h-4 bg-slate-100 rounded flex-1" />
            <div className="h-4 bg-slate-100 rounded w-32" />
            <div className="h-4 bg-slate-100 rounded w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
