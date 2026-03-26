import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getComplianceOverrides, writeComplianceOverrides } from "@/lib/compliance-config";
import type { ComplianceRuleOverride } from "@/types/compliance";

type Payload = {
  standardId?: unknown;
  overrides?: unknown;
};

export async function GET() {
  return NextResponse.json({ overrides: getComplianceOverrides() });
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Payload;
    if (typeof body.standardId !== "string" || !body.standardId.trim()) {
      return NextResponse.json({ error: "standardId is required" }, { status: 400 });
    }

    if (!body.overrides || typeof body.overrides !== "object") {
      return NextResponse.json({ error: "overrides must be an object" }, { status: 400 });
    }

    const sanitized: Record<string, ComplianceRuleOverride> = {};
    for (const [ruleId, value] of Object.entries(body.overrides as Record<string, unknown>)) {
      if (!value || typeof value !== "object") continue;

      const raw = value as Record<string, unknown>;
      sanitized[ruleId] = {
        enabled: typeof raw.enabled === "boolean" ? raw.enabled : undefined,
        level:
          raw.level === "must-have" || raw.level === "recommended"
            ? raw.level
            : undefined,
        signId: typeof raw.signId === "string" ? raw.signId : undefined,
        quantity: raw.quantity as ComplianceRuleOverride["quantity"],
        rationale: typeof raw.rationale === "string" ? raw.rationale : undefined,
        sourceRef: typeof raw.sourceRef === "string" ? raw.sourceRef : undefined,
      };
    }

    const all = getComplianceOverrides();
    all[body.standardId] = sanitized;
    writeComplianceOverrides(all);

    revalidatePath("/compliance");
    revalidatePath("/compliance/assessment");
    revalidatePath("/admin/compliance");

    return NextResponse.json({ ok: true, overrides: all });
  } catch {
    return NextResponse.json({ error: "Unable to save overrides" }, { status: 500 });
  }
}
