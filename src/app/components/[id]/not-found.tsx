import Link from "next/link";

export default function NotFound() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Component Not Found</h1>
      <p className="text-slate-600">
        The component you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
      </p>
      <Link
        href="/components"
        className="inline-block px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm"
      >
        Back to Components
      </Link>
    </div>
  );
}
