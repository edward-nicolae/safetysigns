import { readFileSync, writeFileSync } from "fs";
import path from "path";
import type { SignProduct } from "@/types/sign";

// ── Image overrides ────────────────────────────────────────────────────────────

const IMAGE_OVERRIDES_PATH = path.join(process.cwd(), "data", "sign-image-overrides.json");

export function getSignImageOverrides(): Record<string, string> {
  try {
    return JSON.parse(readFileSync(IMAGE_OVERRIDES_PATH, "utf-8")) as Record<string, string>;
  } catch {
    return {};
  }
}

export function writeSignImageOverrides(data: Record<string, string>): void {
  writeFileSync(IMAGE_OVERRIDES_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// ── Data overrides (title, price, category, description + custom fields) ───────

export type SignDataOverride = Partial<Omit<SignProduct, "id" | "image">> &
  Record<string, unknown>;

const DATA_OVERRIDES_PATH = path.join(process.cwd(), "data", "sign-data-overrides.json");

export function getSignDataOverrides(): Record<string, SignDataOverride> {
  try {
    return JSON.parse(readFileSync(DATA_OVERRIDES_PATH, "utf-8")) as Record<
      string,
      SignDataOverride
    >;
  } catch {
    return {};
  }
}

export function writeSignDataOverrides(data: Record<string, SignDataOverride>): void {
  writeFileSync(DATA_OVERRIDES_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// ── Apply both override layers ─────────────────────────────────────────────────

export function applyOverrides(signs: SignProduct[]): SignProduct[] {
  const imageOverrides = getSignImageOverrides();
  const dataOverrides = getSignDataOverrides();

  return signs.map((sign) => ({
    ...sign,
    ...(dataOverrides[sign.id] ?? {}),
    image: imageOverrides[sign.id] ?? sign.image,
  }));
}
