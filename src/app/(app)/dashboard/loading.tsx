export default function Loading() {
  return (
    <div className="p-8 md:p-12 animate-pulse">
      <div className="h-8 bg-slate-100 rounded-lg w-48 mb-2" />
      <div className="h-4 bg-slate-100 rounded w-80 mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 p-5 space-y-2">
            <div className="h-4 bg-slate-100 rounded w-24" />
            <div className="h-8 bg-slate-100 rounded w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 p-5 h-64 bg-slate-50" />
        <div className="rounded-xl border border-slate-200 p-5 h-64 bg-slate-50" />
      </div>
    </div>
  );
}
