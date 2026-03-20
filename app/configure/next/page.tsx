import Link from "next/link";

export default function ConfigureNextStepPage() {
  return (
    <section className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Configuration Saved</h1>
      <p className="mt-3 text-slate-600">
        Your sign configuration has been saved. This is a placeholder for the next checkout step.
      </p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <Link
          href="/catalog"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Back to Catalog
        </Link>
        <Link
          href="/cart"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Go to Cart
        </Link>
      </div>
    </section>
  );
}
