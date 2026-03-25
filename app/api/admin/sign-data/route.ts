import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  getSignDataOverrides,
  writeSignDataOverrides,
  type SignDataOverride,
} from "@/lib/sign-overrides";

/** GET /api/admin/sign-data — returns all data overrides */
export async function GET() {
  return NextResponse.json(getSignDataOverrides());
}

/** PUT /api/admin/sign-data — saves data override for one product
 *  Body: { signId: string, data: SignDataOverride }
 */
export async function PUT(req: NextRequest) {
  let body: { signId?: unknown; data?: unknown };
  try {
    body = (await req.json()) as { signId?: unknown; data?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { signId, data } = body;

  if (typeof signId !== "string" || !signId.trim()) {
    return NextResponse.json({ error: "Missing signId" }, { status: 400 });
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return NextResponse.json({ error: "Missing or invalid data object" }, { status: 400 });
  }

  // Sanitise: strip 'id' and 'image' from data (those are handled separately)
  const safeData = { ...(data as Record<string, unknown>) };
  delete safeData["id"];
  delete safeData["image"];

  // Validate price if provided
  if ("price" in safeData) {
    const p = Number(safeData["price"]);
    if (isNaN(p) || p < 0) {
      return NextResponse.json({ error: "price must be a non-negative number" }, { status: 400 });
    }
    safeData["price"] = p;
  }

  const overrides = getSignDataOverrides();
  overrides[signId] = safeData as SignDataOverride;
  writeSignDataOverrides(overrides);

  revalidatePath("/catalog");
  revalidatePath("/configurator", "layout");

  return NextResponse.json({ ok: true, signId, data: safeData });
}

/** DELETE /api/admin/sign-data — removes data override for one product
 *  Body: { signId: string }
 */
export async function DELETE(req: NextRequest) {
  let body: { signId?: unknown };
  try {
    body = (await req.json()) as { signId?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { signId } = body;
  if (typeof signId !== "string" || !signId.trim()) {
    return NextResponse.json({ error: "Missing signId" }, { status: 400 });
  }

  const overrides = getSignDataOverrides();
  delete overrides[signId];
  writeSignDataOverrides(overrides);

  revalidatePath("/catalog");
  revalidatePath("/configurator", "layout");

  return NextResponse.json({ ok: true });
}
