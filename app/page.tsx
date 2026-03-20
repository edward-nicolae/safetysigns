import Link from "next/link";

const features = [
  {
    title: "Fast Production",
    description: "Custom signs prepared quickly for active construction projects.",
  },
  {
    title: "Logo Integration",
    description: "Upload your company logo and keep all site signs branded consistently.",
  },
  {
    title: "Reliable Delivery",
    description: "Orders are packed and dispatched with predictable lead times.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <p className="mb-4 inline-flex rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
          Built for construction safety teams
        </p>
        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Custom Safety Signs for Construction Sites
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-slate-600">
          Upload your logo, choose your signs, and we handle production and delivery.
        </p>
        <Link
          href="/catalog"
          className="mt-8 inline-flex rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Browse Catalog
        </Link>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">Why teams choose SafetySigns</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
