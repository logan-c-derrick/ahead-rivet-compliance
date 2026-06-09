export default function Loading() {
  return (
    <div className="p-8 md:p-12 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 bg-slate-100 rounded-lg w-48" />
        <div className="h-9 bg-slate-100 rounded-lg w-32" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 p-5 space-y-3">
            <div className="h-5 bg-slate-100 rounded w-3/4" />
            <div className="h-4 bg-slate-100 rounded w-1/2" />
            <div className="flex gap-2 mt-2">
              <div className="h-6 bg-slate-100 rounded-full w-16" />
              <div className="h-6 bg-slate-100 rounded-full w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
