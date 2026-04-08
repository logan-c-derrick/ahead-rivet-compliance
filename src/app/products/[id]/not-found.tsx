import Link from "next/link";

export default function NotFound() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Product Not Found</h1>
      <p className="text-slate-600">The product you're looking for doesn't exist or you don't have access to it.</p>
      <Link
        href="/products"
        className="inline-block px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm"
      >
        Back to Products
      </Link>
    </div>
  );
}
