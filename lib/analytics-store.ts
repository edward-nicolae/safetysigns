import { existsSync, readFileSync, writeFileSync } from "fs";
import { getDataFilePath } from "@/lib/persistent-storage";

export type AnalyticsEvent = {
  event: string;
  ts: string;
  payload: Record<string, unknown>;
};

const ANALYTICS_PATH = getDataFilePath("analytics-events.json", "[]\n");

export type AnalyticsSummary = {
  totalEvents: number;
  uniqueEventTypes: number;
  eventsByType: Array<{ event: string; count: number }>;
  funnel: {
    started: number;
    completed: number;
    addedMustHave: number;
    addedFullPack: number;
    wentToCart: number;
    checkoutStarted: number;
    checkoutCompleted: number;
    completionRate: number;
    mustHaveRateFromCompleted: number;
    fullPackRateFromCompleted: number;
    cartRateFromCompleted: number;
    checkoutStartRateFromCompleted: number;
    purchaseRateFromCompleted: number;
    purchaseRateFromCheckout: number;
  };
  attributedRevenue: number;
  completedBySiteType: Array<{ siteType: string; count: number }>;
  recentEvents: AnalyticsEvent[];
};

export function readAnalyticsEvents(): AnalyticsEvent[] {
  try {
    if (!existsSync(ANALYTICS_PATH)) {
      writeFileSync(ANALYTICS_PATH, "[]\n", "utf-8");
      return [];
    }

    const raw = readFileSync(ANALYTICS_PATH, "utf-8");
    const parsed = JSON.parse(raw) as AnalyticsEvent[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((entry) => typeof entry?.event === "string" && typeof entry?.ts === "string")
      .map((entry) => ({
        event: entry.event,
        ts: entry.ts,
        payload: entry.payload ?? {},
      }));
  } catch {
    return [];
  }
}

export function appendAnalyticsEvent(event: AnalyticsEvent): void {
  const existing = readAnalyticsEvents();
  const next = [...existing, event];

  // Keep file bounded so dashboard stays responsive.
  const bounded = next.slice(-5000);
  writeFileSync(ANALYTICS_PATH, JSON.stringify(bounded, null, 2), "utf-8");
}

export function buildAnalyticsSummary(events: AnalyticsEvent[]): AnalyticsSummary {
  const eventsByTypeMap = new Map<string, number>();

  for (const event of events) {
    eventsByTypeMap.set(event.event, (eventsByTypeMap.get(event.event) ?? 0) + 1);
  }

  const started = eventsByTypeMap.get("compliance_assessment_started") ?? 0;
  const completed = eventsByTypeMap.get("compliance_assessment_completed") ?? 0;
  const addedMustHave = eventsByTypeMap.get("compliance_add_must_have_pack") ?? 0;
  const addedFullPack = eventsByTypeMap.get("compliance_add_full_pack") ?? 0;
  const wentToCart = eventsByTypeMap.get("compliance_go_to_cart") ?? 0;
  const checkoutStarted = eventsByTypeMap.get("compliance_checkout_started") ?? 0;
  const checkoutCompleted = eventsByTypeMap.get("compliance_checkout_completed") ?? 0;

  const completionRate = started > 0 ? completed / started : 0;
  const mustHaveRateFromCompleted = completed > 0 ? addedMustHave / completed : 0;
  const fullPackRateFromCompleted = completed > 0 ? addedFullPack / completed : 0;
  const cartRateFromCompleted = completed > 0 ? wentToCart / completed : 0;
  const checkoutStartRateFromCompleted = completed > 0 ? checkoutStarted / completed : 0;
  const purchaseRateFromCompleted = completed > 0 ? checkoutCompleted / completed : 0;
  const purchaseRateFromCheckout = checkoutStarted > 0 ? checkoutCompleted / checkoutStarted : 0;
  const attributedRevenue = Number(
    events
      .filter((event) => event.event === "compliance_checkout_completed")
      .reduce((sum, event) => {
        const subtotal =
          typeof event.payload.subtotal === "number" ? event.payload.subtotal : Number(event.payload.subtotal ?? 0);
        return sum + (Number.isFinite(subtotal) ? subtotal : 0);
      }, 0)
      .toFixed(2),
  );

  const completedBySiteTypeMap = new Map<string, number>();
  for (const event of events) {
    if (event.event !== "compliance_assessment_completed") continue;
    const siteType =
      typeof event.payload.siteType === "string" ? event.payload.siteType : "unknown";
    completedBySiteTypeMap.set(siteType, (completedBySiteTypeMap.get(siteType) ?? 0) + 1);
  }

  const eventsByType = Array.from(eventsByTypeMap.entries())
    .map(([event, count]) => ({ event, count }))
    .sort((a, b) => b.count - a.count);

  const completedBySiteType = Array.from(completedBySiteTypeMap.entries())
    .map(([siteType, count]) => ({ siteType, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalEvents: events.length,
    uniqueEventTypes: eventsByType.length,
    eventsByType,
    funnel: {
      started,
      completed,
      addedMustHave,
      addedFullPack,
      wentToCart,
      checkoutStarted,
      checkoutCompleted,
      completionRate,
      mustHaveRateFromCompleted,
      fullPackRateFromCompleted,
      cartRateFromCompleted,
      checkoutStartRateFromCompleted,
      purchaseRateFromCompleted,
      purchaseRateFromCheckout,
    },
    attributedRevenue,
    completedBySiteType,
    recentEvents: events.slice(-30).reverse(),
  };
}
