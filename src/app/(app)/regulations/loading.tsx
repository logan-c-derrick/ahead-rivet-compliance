export default function Loading() {
  return (
    <div className="p-8 md:p-12 animate-pulse">
      <div className="h-8 bg-slate-100 rounded-lg w-48 mb-6" />
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 p-4 flex items-center gap-4">
            <div className="h-5 bg-slate-100 rounded w-48" />
            <div className="h-5 bg-slate-100 rounded w-24" />
            <div className="h-6 bg-slate-100 rounded-full w-16 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
