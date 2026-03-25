import Link from "next/link";

const benefits = [
  {
    title: "Reduce Compliance Risk",
    description: "Get a structured list of must-have signs based on your operational profile.",
  },
  {
    title: "Order Faster",
    description: "Add complete recommended packs to cart in one click instead of searching sign by sign.",
  },
  {
    title: "Improve Site Readiness",
    description: "Cover mandatory, warning, prohibition, fire, and first-aid signage in one workflow.",
  },
];

export default function CompliancePage() {
  return (
    <div className="space-y-12">
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <p className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
          New Section
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Compliance Assistant for Safety Sign Planning
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-slate-600">
          Build a recommended safety signage plan in minutes using operational criteria and UK-oriented guidance.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/compliance/assessment"
            className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Start Assessment
          </Link>
          <Link
            href="/catalog"
            className="rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Browse Catalog
          </Link>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {benefits.map((item) => (
          <article key={item.title} className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-slate-900">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
