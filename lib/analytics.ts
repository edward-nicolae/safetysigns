"use client";

type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function trackEvent(event: string, payload: AnalyticsPayload = {}): void {
  if (typeof window === "undefined") {
    return;
  }

  const entry = {
    event,
    ts: new Date().toISOString(),
    ...payload,
  };

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push(entry);
  }

  try {
    void fetch("/api/analytics/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ event, ts: entry.ts, payload }),
      keepalive: true,
    });
  } catch {
    // Avoid disrupting UX if analytics transport fails.
  }

  // Useful fallback while no analytics provider is connected.
  console.log("[analytics]", entry);
}
