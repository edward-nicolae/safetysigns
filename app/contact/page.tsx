export default function ContactPage() {
  return (
    <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Contact</h1>
      <p className="mb-8 text-slate-600">Have a question? Send us a message.</p>

      <form className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium text-slate-700">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none ring-0 transition placeholder:text-slate-400 focus:border-slate-900"
            placeholder="Your full name"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none ring-0 transition placeholder:text-slate-400 focus:border-slate-900"
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="message" className="block text-sm font-medium text-slate-700">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none ring-0 transition placeholder:text-slate-400 focus:border-slate-900"
            placeholder="Write your message here..."
          />
        </div>

        <button
          type="submit"
          className="inline-flex items-center rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Send Message
        </button>
      </form>
    </section>
  );
}
