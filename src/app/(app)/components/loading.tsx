export default function Loading() {
  return (
    <div className="p-8 md:p-12 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 bg-slate-100 rounded-lg w-48" />
        <div className="h-9 bg-slate-100 rounded-lg w-32" />
      </div>
      <div className="flex gap-3 mb-4">
        <div className="h-9 bg-slate-100 rounded-lg w-56" />
        <div className="h-9 bg-slate-100 rounded-lg w-40" />
        <div className="h-9 bg-slate-100 rounded-lg w-40" />
      </div>
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="h-10 bg-slate-50 border-b border-slate-200" />
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-slate-100 last:border-0">
            <div className="h-4 w-4 bg-slate-100 rounded" />
            <div className="h-4 bg-slate-100 rounded flex-1" />
            <div className="h-4 bg-slate-100 rounded w-24" />
            <div className="h-4 bg-slate-100 rounded w-32" />
            <div className="h-4 bg-slate-100 rounded w-20" />
            <div className="h-6 bg-slate-100 rounded-full w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
