import { NextResponse } from "next/server";
import {
  getConfiguratorSettings,
  writeConfiguratorSettings,
  type ConfiguratorSettings,
} from "@/lib/configurator-config";

export const dynamic = "force-dynamic";

export function GET() {
  try {
    const settings = getConfiguratorSettings();
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as ConfiguratorSettings;

    if (
      !Array.isArray(body.materials) ||
      !Array.isArray(body.sizes) ||
      !Array.isArray(body.qtyTiers) ||
      !Array.isArray(body.colorSchemes)
    ) {
      return NextResponse.json({ error: "Invalid settings structure" }, { status: 400 });
    }

    writeConfiguratorSettings(body);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
