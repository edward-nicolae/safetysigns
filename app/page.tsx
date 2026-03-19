import Link from "next/link";

export default function Home() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 shadow-sm sm:px-10">
      <div className="mx-auto flex max-w-3xl flex-col items-start gap-6 text-left">
        <h1 className="text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
          SafetySigns
        </h1>
        <p className="text-lg leading-relaxed text-slate-600 sm:text-xl">
          Your platform for safety and compliance
        </p>
        <Link
          href="/signs"
          className="inline-flex items-center rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Explore Safety Signs
        </Link>
      </div>
    </section>
  );
}
