import Link from "next/link";

export default function UploadPage() {
  return (
    <section className="mx-auto max-w-2xl space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Logo upload moved
        </h1>
        <p className="text-slate-600">
          Logos are no longer uploaded globally for the entire cart. Each product now has its own
          dedicated configurator and its own logo upload.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm text-slate-700">
          Open any product, then go to its configurator to upload and position the logo only for
          that item.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/catalog"
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-700"
        >
          Browse Catalog
        </Link>
        <Link
          href="/cart"
          className="rounded-lg border border-slate-300 px-5 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Go to Cart
        </Link>
      </div>
    </section>
  );
}
