import { NextResponse } from "next/server";
import { appendAnalyticsEvent } from "@/lib/analytics-store";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      event?: unknown;
      ts?: unknown;
      payload?: unknown;
    };

    if (typeof body.event !== "string" || body.event.trim() === "") {
      return NextResponse.json({ error: "Invalid event name" }, { status: 400 });
    }

    const event = {
      event: body.event,
      ts: typeof body.ts === "string" ? body.ts : new Date().toISOString(),
      payload: body.payload && typeof body.payload === "object" ? (body.payload as Record<string, unknown>) : {},
    };

    appendAnalyticsEvent(event);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to store analytics event" }, { status: 500 });
  }
}
