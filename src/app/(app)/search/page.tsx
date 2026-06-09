import { requireProfile } from "@/lib/profile";
import MaterialIcon from "@/components/ui/MaterialIcon";
import AiSearchPanel from "./AiSearchPanel";

export default async function SearchPage() {
  await requireProfile();

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
      <header className="space-y-4">
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <span className="font-medium">Compliance Portal</span>
          <span className="opacity-60">/</span>
          <span className="font-semibold text-primary">AI Search</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary">
            <MaterialIcon name="manage_search" className="text-sm" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-headline font-extrabold tracking-tight text-primary">AI Search</h1>
            <p className="text-on-surface-variant mt-1 text-sm">
              Ask natural language questions across your components and products catalog.
            </p>
          </div>
        </div>
      </header>

      <AiSearchPanel />
    </div>
  );
}
