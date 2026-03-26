import Link from "next/link";
import { buildAnalyticsSummary, readAnalyticsEvents } from "@/lib/analytics-store";

export const dynamic = "force-dynamic";

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export default function AdminAnalyticsPage() {
  const events = readAnalyticsEvents();
  const summary = buildAnalyticsSummary(events);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Compliance Analytics</h1>
          <p className="mt-1 text-sm text-slate-600">Internal dashboard for assessment funnel and conversion signals.</p>
        </div>
        <Link
          href="/admin"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Back to Admin
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Events</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{summary.totalEvents}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Unique Event Types</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{summary.uniqueEventTypes}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assessment Completion</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{percent(summary.funnel.completionRate)}</p>
          <p className="mt-1 text-xs text-slate-500">
            {summary.funnel.completed} completed / {summary.funnel.started} started
          </p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Go To Cart Rate</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{percent(summary.funnel.cartRateFromCompleted)}</p>
          <p className="mt-1 text-xs text-slate-500">from completed assessments</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Purchases Completed</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{summary.funnel.checkoutCompleted}</p>
          <p className="mt-1 text-xs text-slate-500">{percent(summary.funnel.purchaseRateFromCompleted)} from completed assessments</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Attributed Revenue</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">GBP {summary.attributedRevenue.toFixed(2)}</p>
          <p className="mt-1 text-xs text-slate-500">completed compliance-attributed checkouts</p>
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-bold text-slate-900">Compliance Funnel</h2>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <p>Started: <strong>{summary.funnel.started}</strong></p>
            <p>Completed: <strong>{summary.funnel.completed}</strong></p>
            <p>Added Must-Have Pack: <strong>{summary.funnel.addedMustHave}</strong> ({percent(summary.funnel.mustHaveRateFromCompleted)})</p>
            <p>Added Full Pack: <strong>{summary.funnel.addedFullPack}</strong> ({percent(summary.funnel.fullPackRateFromCompleted)})</p>
            <p>Went to Cart: <strong>{summary.funnel.wentToCart}</strong> ({percent(summary.funnel.cartRateFromCompleted)})</p>
            <p>Checkout Started: <strong>{summary.funnel.checkoutStarted}</strong> ({percent(summary.funnel.checkoutStartRateFromCompleted)})</p>
            <p>Checkout Completed: <strong>{summary.funnel.checkoutCompleted}</strong> ({percent(summary.funnel.purchaseRateFromCompleted)})</p>
            <p>Checkout Completion Rate: <strong>{percent(summary.funnel.purchaseRateFromCheckout)}</strong></p>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-bold text-slate-900">Completed Assessments by Site Type</h2>
          {summary.completedBySiteType.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No completed assessments yet.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {summary.completedBySiteType.map((row) => (
                <li key={row.siteType} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                  <span>{row.siteType}</span>
                  <strong>{row.count}</strong>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-bold text-slate-900">Events by Type</h2>
          {summary.eventsByType.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No events recorded.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {summary.eventsByType.map((row) => (
                <li key={row.event} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                  <span>{row.event}</span>
                  <strong>{row.count}</strong>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-bold text-slate-900">Recent Events</h2>
          {summary.recentEvents.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No recent events yet.</p>
          ) : (
            <div className="mt-3 max-h-96 overflow-auto rounded-md border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs sm:text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 font-semibold text-slate-700">Time</th>
                    <th className="px-3 py-2 font-semibold text-slate-700">Event</th>
                    <th className="px-3 py-2 font-semibold text-slate-700">Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {summary.recentEvents.map((event, index) => (
                    <tr key={`${event.ts}-${event.event}-${index}`}>
                      <td className="px-3 py-2 text-slate-600">{new Date(event.ts).toLocaleString()}</td>
                      <td className="px-3 py-2 text-slate-800">{event.event}</td>
                      <td className="px-3 py-2 text-slate-600">{JSON.stringify(event.payload)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
