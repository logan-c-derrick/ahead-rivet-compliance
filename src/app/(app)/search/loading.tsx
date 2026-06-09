export default function Loading() {
  return (
    <div className="p-8 md:p-12 animate-pulse">
      <div className="h-8 bg-slate-100 rounded-lg w-40 mb-4" />
      <div className="h-12 bg-slate-100 rounded-xl w-full mb-6" />
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 p-4 space-y-2">
            <div className="h-5 bg-slate-100 rounded w-48" />
            <div className="h-4 bg-slate-100 rounded w-full" />
            <div className="h-4 bg-slate-100 rounded w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
