"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type {
  ConfiguratorColorScheme,
  ConfiguratorMaterial,
  ConfiguratorQtyTier,
  ConfiguratorSettings,
  ConfiguratorSize,
} from "@/lib/configurator-config";

// ── Types ─────────────────────────────────────────────────────────────────────

type SaveStatus = "idle" | "saving" | "saved" | "error";
type Tab = "materials" | "sizes" | "discounts" | "colors";
type OrientationFilter = "all" | "portrait" | "landscape" | "square";

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(s: string) {
  return s
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function autoSizeId(
  width: number,
  height: number,
  orientation: ConfiguratorSize["orientation"],
): string {
  const prefix = orientation[0]; // p / l / s
  return `${prefix}-${width}x${height}`;
}

function contiguousTierWarning(tiers: ConfiguratorQtyTier[]): string | null {
  for (let i = 0; i < tiers.length - 1; i++) {
    const curr = tiers[i];
    const next = tiers[i + 1];
    if (curr.max === null) return `Tier ${i + 1} has no upper bound but is not the last tier.`;
    if (curr.max + 1 !== next.min)
      return `Gap between tier ${i + 1} (max ${curr.max}) and tier ${i + 2} (min ${next.min}).`;
  }
  return null;
}

// ── Empty row factories ────────────────────────────────────────────────────────

function emptyMaterial(): ConfiguratorMaterial {
  return { id: "", label: "", description: "", priceMultiplier: 1.0, popular: false };
}

function emptySize(): ConfiguratorSize {
  return { id: "", width: 100, height: 150, orientation: "portrait", areaMultiplier: 1.0 };
}

function emptyTier(prevMax: number | null): ConfiguratorQtyTier {
  const min = prevMax !== null ? prevMax + 1 : 1;
  return { min, max: null, discountPct: 0 };
}

function emptyScheme(): ConfiguratorColorScheme {
  return { id: "", label: "", bg: "#cccccc", fg: "#000000" };
}

// ── Section components ────────────────────────────────────────────────────────

// ─ Materials ─

function MaterialsSection({
  materials,
  onChange,
}: {
  materials: ConfiguratorMaterial[];
  onChange: (m: ConfiguratorMaterial[]) => void;
}) {
  function update(i: number, patch: Partial<ConfiguratorMaterial>) {
    const updated = materials.map((m, idx) => {
      if (idx !== i) return m;
      const merged = { ...m, ...patch };
      // auto-derive id from label if id hasn't been manually set or is still auto
      if ("label" in patch && merged.id === slugify(m.label)) {
        merged.id = slugify(merged.label);
      }
      return merged;
    });
    onChange(updated);
  }

  function add() {
    onChange([...materials, emptyMaterial()]);
  }

  function remove(i: number) {
    onChange(materials.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Price multiplier is relative to the base sign price. 1.0 = no markup.
      </p>

      {/* Header row */}
      <div className="hidden grid-cols-[1fr_1.5fr_80px_70px_32px] gap-3 text-xs font-semibold uppercase tracking-wide text-slate-400 sm:grid">
        <span>Label</span>
        <span>Description</span>
        <span>Multiplier</span>
        <span className="text-center">Popular</span>
        <span />
      </div>

      <div className="space-y-2">
        {materials.map((mat, i) => (
          <div
            key={i}
            className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-[1fr_1.5fr_80px_70px_32px] sm:items-center"
          >
            {/* Label */}
            <input
              value={mat.label}
              onChange={(e) => update(i, { label: e.target.value, id: slugify(e.target.value) })}
              placeholder="e.g. Self Adhesive Vinyl"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            {/* Description */}
            <input
              value={mat.description}
              onChange={(e) => update(i, { description: e.target.value })}
              placeholder="Short description"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            {/* Price multiplier */}
            <input
              type="number"
              min={0.1}
              step={0.01}
              value={mat.priceMultiplier}
              onChange={(e) => update(i, { priceMultiplier: Number(e.target.value) })}
              className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            {/* Popular */}
            <label className="flex items-center justify-center gap-1.5 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={mat.popular}
                onChange={(e) => update(i, { popular: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 accent-brand-600"
              />
              <span className="sm:hidden">Popular</span>
            </label>
            {/* Delete */}
            <button
              type="button"
              onClick={() => remove(i)}
              title="Remove material"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
            >
              ×
            </button>
            {/* ID preview */}
            <div className="col-span-full text-[10px] text-slate-400 sm:col-span-full">
              ID: <code className="font-mono">{mat.id || slugify(mat.label) || "—"}</code>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={add}
        className="rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-500 hover:border-slate-400 hover:bg-slate-50"
      >
        + Add Material
      </button>
    </div>
  );
}

// ─ Sizes ─

function SizesSection({
  sizes,
  onChange,
}: {
  sizes: ConfiguratorSize[];
  onChange: (s: ConfiguratorSize[]) => void;
}) {
  const [filter, setFilter] = useState<OrientationFilter>("all");

  function update(i: number, patch: Partial<ConfiguratorSize>) {
    const updated = sizes.map((s, idx) => {
      if (idx !== i) return s;
      const merged = { ...s, ...patch };
      merged.id = autoSizeId(merged.width, merged.height, merged.orientation);
      return merged;
    });
    onChange(updated);
  }

  function add() {
    const newSize = emptySize();
    newSize.id = autoSizeId(newSize.width, newSize.height, newSize.orientation);
    onChange([...sizes, newSize]);
  }

  function remove(i: number) {
    onChange(sizes.filter((_, idx) => idx !== i));
  }

  const visible = sizes
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => filter === "all" || s.orientation === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <p className="text-sm text-slate-500">
          Area multiplier scales base price. 1.0 = reference size (150 × 200 mm).
        </p>
      </div>

      {/* Orientation filter */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
        {(["all", "portrait", "landscape", "square"] as OrientationFilter[]).map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => setFilter(o)}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold capitalize transition
              ${
                filter === o
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
          >
            {o}
          </button>
        ))}
      </div>

      {/* Header */}
      <div className="hidden grid-cols-[80px_80px_120px_90px_32px] gap-3 text-xs font-semibold uppercase tracking-wide text-slate-400 sm:grid">
        <span>Width (mm)</span>
        <span>Height (mm)</span>
        <span>Orientation</span>
        <span>Area mult.</span>
        <span />
      </div>

      <div className="space-y-2">
        {visible.map(({ s, i }) => (
          <div
            key={i}
            className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-[80px_80px_120px_90px_32px] sm:items-center"
          >
            <input
              type="number"
              min={1}
              value={s.width}
              onChange={(e) => update(i, { width: Number(e.target.value) })}
              className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <input
              type="number"
              min={1}
              value={s.height}
              onChange={(e) => update(i, { height: Number(e.target.value) })}
              className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <select
              value={s.orientation}
              onChange={(e) =>
                update(i, { orientation: e.target.value as ConfiguratorSize["orientation"] })
              }
              className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
              <option value="square">Square</option>
            </select>
            <input
              type="number"
              min={0.1}
              step={0.01}
              value={s.areaMultiplier}
              onChange={(e) => update(i, { areaMultiplier: Number(e.target.value) })}
              className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              title="Remove size"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
            >
              ×
            </button>
            <div className="col-span-full text-[10px] text-slate-400 sm:col-span-full">
              ID: <code className="font-mono">{s.id}</code>
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400">
            No sizes for this orientation. Add one below.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={add}
        className="rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-500 hover:border-slate-400 hover:bg-slate-50"
      >
        + Add Size
      </button>
    </div>
  );
}

// ─ Volume Discounts ─

function DiscountsSection({
  tiers,
  onChange,
}: {
  tiers: ConfiguratorQtyTier[];
  onChange: (t: ConfiguratorQtyTier[]) => void;
}) {
  const warning = contiguousTierWarning(tiers);

  function update(i: number, patch: Partial<ConfiguratorQtyTier>) {
    onChange(tiers.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  }

  function add() {
    const last = tiers[tiers.length - 1] ?? null;
    onChange([...tiers, emptyTier(last?.max ?? null)]);
  }

  function remove(i: number) {
    onChange(tiers.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Discounts are applied by best-matching tier. Set max to blank for an open-ended "X and
        above" tier. Tiers should be contiguous (no gaps) for predictable behaviour.
      </p>

      {warning && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          ⚠ {warning}
        </div>
      )}

      {/* Header */}
      <div className="hidden grid-cols-[1fr_1fr_100px_32px] gap-3 text-xs font-semibold uppercase tracking-wide text-slate-400 sm:grid">
        <span>Min qty</span>
        <span>Max qty (blank = no limit)</span>
        <span>Discount %</span>
        <span />
      </div>

      <div className="space-y-2">
        {tiers.map((tier, i) => {
          const isLast = i === tiers.length - 1;
          const label =
            tier.max === null
              ? `${tier.min}+ units`
              : tier.min === tier.max
              ? `${tier.min} unit`
              : `${tier.min}–${tier.max} units`;

          return (
            <div
              key={i}
              className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-[1fr_1fr_100px_32px] sm:items-center"
            >
              <div className="space-y-1">
                <p className="text-[10px] font-medium text-slate-400 sm:hidden">Min qty</p>
                <input
                  type="number"
                  min={1}
                  value={tier.min}
                  onChange={(e) => update(i, { min: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-medium text-slate-400 sm:hidden">Max qty</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={tier.min}
                    value={tier.max ?? ""}
                    placeholder="no limit"
                    onChange={(e) =>
                      update(i, { max: e.target.value === "" ? null : Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  {!isLast && tier.max === null && (
                    <span className="shrink-0 text-xs font-medium text-amber-600">∞</span>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-medium text-slate-400 sm:hidden">Discount %</p>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={99}
                    step={0.5}
                    value={tier.discountPct}
                    onChange={(e) => update(i, { discountPct: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <span className="shrink-0 text-sm text-slate-400">%</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                title="Remove tier"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
              >
                ×
              </button>
              <div className="col-span-full text-[10px] text-slate-400">
                → {label} get{" "}
                {tier.discountPct === 0 ? (
                  <span className="font-semibold text-slate-600">full price</span>
                ) : (
                  <span className="font-semibold text-green-700">−{tier.discountPct}% off</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={add}
        className="rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-500 hover:border-slate-400 hover:bg-slate-50"
      >
        + Add Tier
      </button>
    </div>
  );
}

// ─ Color Schemes ─

function ColorsSection({
  schemes,
  onChange,
}: {
  schemes: ConfiguratorColorScheme[];
  onChange: (c: ConfiguratorColorScheme[]) => void;
}) {
  function update(i: number, patch: Partial<ConfiguratorColorScheme>) {
    onChange(
      schemes.map((s, idx) => {
        if (idx !== i) return s;
        const merged = { ...s, ...patch };
        if ("label" in patch && merged.id === slugify(s.label)) {
          merged.id = slugify(merged.label);
        }
        return merged;
      }),
    );
  }

  function add() {
    onChange([...schemes, emptyScheme()]);
  }

  function remove(i: number) {
    onChange(schemes.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Background and foreground colors for the text banner shown on configured signs.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {schemes.map((cs, i) => (
          <div
            key={i}
            className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
          >
            {/* Preview swatch */}
            <div
              className="flex h-10 items-center justify-center rounded-lg px-3 text-sm font-bold"
              style={{ backgroundColor: cs.bg, color: cs.fg }}
            >
              {cs.label || "Preview"}
            </div>

            <div className="space-y-2">
              <input
                value={cs.label}
                onChange={(e) => update(i, { label: e.target.value, id: slugify(e.target.value) })}
                placeholder="Label (e.g. Yellow)"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Background
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={cs.bg}
                      onChange={(e) => update(i, { bg: e.target.value })}
                      className="h-8 w-10 cursor-pointer rounded border border-slate-300"
                    />
                    <code className="text-xs text-slate-600">{cs.bg}</code>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Text
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={cs.fg}
                      onChange={(e) => update(i, { fg: e.target.value })}
                      className="h-8 w-10 cursor-pointer rounded border border-slate-300"
                    />
                    <code className="text-xs text-slate-600">{cs.fg}</code>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-400">
                ID: <code className="font-mono">{cs.id || slugify(cs.label) || "—"}</code>
              </div>
            </div>

            <button
              type="button"
              onClick={() => remove(i)}
              className="w-full rounded-lg border border-red-200 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50"
            >
              Remove
            </button>
          </div>
        ))}

        {/* Add card */}
        <button
          type="button"
          onClick={add}
          className="flex min-h-[160px] items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-sm font-semibold text-slate-400 hover:border-slate-300 hover:bg-slate-50"
        >
          + Add Color Scheme
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const TAB_LABELS: Record<Tab, string> = {
  materials: "Materials",
  sizes: "Sign Sizes",
  discounts: "Volume Discounts",
  colors: "Color Schemes",
};

const TAB_DESCRIPTIONS: Record<Tab, string> = {
  materials: "Control which materials are available in the configurator and their price multipliers.",
  sizes: "Define available sign dimensions per orientation.",
  discounts: "Set quantity-based pricing tiers visible in the configurator.",
  colors: "Define text banner color options for custom signs.",
};

export default function ConfiguratorAdminPage() {
  const [tab, setTab] = useState<Tab>("materials");
  const [draft, setDraft] = useState<ConfiguratorSettings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/configurator-settings")
      .then((r) => r.json())
      .then((data) => setDraft(data as ConfiguratorSettings))
      .catch(() => setLoadError("Failed to load settings."));
  }, []);

  async function handleSave() {
    if (!draft) return;
    setSaveStatus("saving");
    setSaveMessage("");
    try {
      const res = await fetch("/api/admin/configurator-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaveStatus("saved");
      setSaveMessage("Settings saved successfully.");
    } catch {
      setSaveStatus("error");
      setSaveMessage("Save failed. Please try again.");
    }
    setTimeout(() => setSaveStatus("idle"), 3000);
  }

  if (loadError) {
    return (
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            ← Back to Admin
          </Link>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
          {loadError}
        </div>
      </section>
    );
  }

  if (!draft) {
    return (
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            ← Back to Admin
          </Link>
        </div>
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-brand-600" />
          <span className="ml-3 text-sm text-slate-500">Loading settings…</span>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Configurator Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage materials, sign sizes, volume discounts, and color schemes used in the sign
            configurator.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            ← Back to Admin
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={saveStatus === "saving"}
            className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {saveStatus === "saving" ? "Saving…" : "Save All Changes"}
          </button>
        </div>
      </div>

      {/* Save status message */}
      {saveStatus !== "idle" && saveMessage && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium
          ${
            saveStatus === "saved"
              ? "border-green-200 bg-green-50 text-green-700"
              : saveStatus === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-slate-200 bg-slate-50 text-slate-600"
          }`}
        >
          {saveStatus === "saved" ? "✓ " : saveStatus === "error" ? "✗ " : ""}
          {saveMessage}
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Materials",       value: draft.materials.length },
          { label: "Sign Sizes",      value: draft.sizes.length },
          { label: "Discount Tiers",  value: draft.qtyTiers.length },
          { label: "Color Schemes",   value: draft.colorSchemes.length },
        ].map(({ label, value }) => (
          <article key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          </article>
        ))}
      </div>

      {/* Tabs */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Tab bar */}
        <div className="flex border-b border-slate-200">
          {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition
                ${
                  tab === t
                    ? "border-b-2 border-brand-600 text-brand-600"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
            >
              {TAB_LABELS[t]}
              <span
                className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold
                  ${tab === t ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-500"}`}
              >
                {tab === t
                  ? t === "materials"
                    ? draft.materials.length
                    : t === "sizes"
                    ? draft.sizes.length
                    : t === "discounts"
                    ? draft.qtyTiers.length
                    : draft.colorSchemes.length
                  : t === "materials"
                  ? draft.materials.length
                  : t === "sizes"
                  ? draft.sizes.length
                  : t === "discounts"
                  ? draft.qtyTiers.length
                  : draft.colorSchemes.length}
              </span>
            </button>
          ))}
        </div>

        {/* Tab description */}
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-2">
          <p className="text-xs text-slate-500">{TAB_DESCRIPTIONS[tab]}</p>
        </div>

        {/* Tab content */}
        <div className="p-6">
          {tab === "materials" && (
            <MaterialsSection
              materials={draft.materials}
              onChange={(m) => setDraft({ ...draft, materials: m })}
            />
          )}
          {tab === "sizes" && (
            <SizesSection
              sizes={draft.sizes}
              onChange={(s) => setDraft({ ...draft, sizes: s })}
            />
          )}
          {tab === "discounts" && (
            <DiscountsSection
              tiers={draft.qtyTiers}
              onChange={(t) => setDraft({ ...draft, qtyTiers: t })}
            />
          )}
          {tab === "colors" && (
            <ColorsSection
              schemes={draft.colorSchemes}
              onChange={(c) => setDraft({ ...draft, colorSchemes: c })}
            />
          )}
        </div>
      </div>

      {/* Sticky save in footer */}
      <div className="flex justify-end gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="self-center text-sm text-slate-500">
          Changes are applied immediately to the configurator after saving.
        </p>
        <button
          type="button"
          onClick={handleSave}
          disabled={saveStatus === "saving"}
          className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {saveStatus === "saving" ? "Saving…" : "Save All Changes"}
        </button>
      </div>
    </section>
  );
}
