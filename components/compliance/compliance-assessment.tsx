"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/providers/cart-provider";
import { trackEvent } from "@/lib/analytics";
import { buildComplianceRecommendations } from "@/lib/compliance-engine";
import type {
  ComplianceAnswers,
  ComplianceOverridesByStandard,
  ComplianceStandard,
  ComplianceZone,
  SiteType,
} from "@/types/compliance";
import type { SignProduct } from "@/types/sign";

type Props = {
  signs: SignProduct[];
  standards: ComplianceStandard[];
  overrides: ComplianceOverridesByStandard;
};

const INITIAL_ANSWERS: ComplianceAnswers = {
  jurisdiction: "uk",
  siteType: "construction",
  hasPublicVisitors: false,
  hasForklifts: true,
  hasElectricalHazards: true,
  hasFlammables: true,
  requiresHardHats: true,
  requiresHighVis: true,
  hasRestrictedAreas: true,
  floorCount: 1,
  exitCount: 2,
};

const SITE_TYPES: Array<{ value: SiteType; label: string }> = [
  { value: "construction", label: "Construction Site" },
  { value: "warehouse", label: "Warehouse" },
  { value: "office", label: "Office" },
  { value: "retail", label: "Retail" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "mixed", label: "Mixed Use" },
];

const ZONE_LABELS: Record<ComplianceZone, string> = {
  "site-entry": "Site Entry",
  "ppe-entry": "PPE Entry Points",
  "traffic-routes": "Traffic Routes",
  "electrical-areas": "Electrical Areas",
  "flammable-storage": "Flammable Storage",
  "restricted-areas": "Restricted Areas",
  "fire-points": "Fire Points",
  "first-aid": "First Aid",
  assembly: "Assembly Area",
};

export function ComplianceAssessment({ signs, standards, overrides }: Props) {
  const { items, getConfiguration, setUnconfiguredQuantity } = useCart();
  const [answers, setAnswers] = useState<ComplianceAnswers>(INITIAL_ANSWERS);
  const [hasRunAssessment, setHasRunAssessment] = useState(false);
  const [selectedStandardId, setSelectedStandardId] = useState(standards[0]?.id ?? "");

  const selectedStandard = useMemo(
    () => standards.find((standard) => standard.id === selectedStandardId) ?? null,
    [selectedStandardId, standards],
  );

  const result = useMemo(() => {
    if (!selectedStandard) {
      return null;
    }

    return buildComplianceRecommendations(
      answers,
      signs,
      selectedStandard,
      overrides[selectedStandard.id] ?? {},
    );
  }, [answers, signs, selectedStandard, overrides]);

  const markComplianceSession = () => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem("safetysigns-compliance-session", "1");
  };

  useEffect(() => {
    trackEvent("compliance_assessment_started", { source: "page-load" });
  }, []);

  const addMustHavesToCart = () => {
    if (!result) return;
    markComplianceSession();

    for (const rec of result.mustHave) {
      const existingUnconfigured = items.find(
        (item) => item.signId === rec.signId && !getConfiguration(item.lineId),
      );
      const currentQty = existingUnconfigured?.quantity ?? 0;

      setUnconfiguredQuantity(
        {
          signId: rec.signId,
          title: rec.signTitle,
          price: rec.signPrice,
          image: rec.signImage,
        },
        currentQty + rec.suggestedQty,
      );
    }

    trackEvent("compliance_add_must_have_pack", {
      mustHaveCount: result.mustHave.length,
      suggestedUnits: result.mustHave.reduce((sum, rec) => sum + rec.suggestedQty, 0),
      estimatedSubtotal: Number(result.mustHave.reduce((sum, rec) => sum + rec.signPrice * rec.suggestedQty, 0).toFixed(2)),
    });
  };

  const addFullPackToCart = () => {
    if (!result) return;
    markComplianceSession();

    for (const rec of result.recommendations) {
      const existingUnconfigured = items.find(
        (item) => item.signId === rec.signId && !getConfiguration(item.lineId),
      );
      const currentQty = existingUnconfigured?.quantity ?? 0;

      setUnconfiguredQuantity(
        {
          signId: rec.signId,
          title: rec.signTitle,
          price: rec.signPrice,
          image: rec.signImage,
        },
        currentQty + rec.suggestedQty,
      );
    }

    trackEvent("compliance_add_full_pack", {
      recommendationCount: result.recommendations.length,
      suggestedUnits: result.recommendations.reduce((sum, rec) => sum + rec.suggestedQty, 0),
      estimatedSubtotal: Number(result.subtotalEstimate.toFixed(2)),
    });
  };

  return (
    <section className="space-y-8">
      {!selectedStandard ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          No published compliance standard available. Add at least one standard to run assessment.
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
          UK Compliance Assistant
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Build Your Recommended Safety Sign Plan
        </h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Answer a few operational questions and we will generate a practical signage pack with must-have and
          recommended signs.
        </p>
        {selectedStandard ? (
          <p className="mt-3 text-sm text-slate-500">
            Using standard: <strong>{selectedStandard.name}</strong> (v{selectedStandard.version})
          </p>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!result || !selectedStandard) return;
            setHasRunAssessment(true);
            markComplianceSession();
            trackEvent("compliance_assessment_completed", {
              standardId: selectedStandard.id,
              jurisdiction: answers.jurisdiction,
              siteType: answers.siteType,
              mustHaveCount: result.mustHave.length,
              recommendedCount: result.recommended.length,
              estimatedSubtotal: Number(result.subtotalEstimate.toFixed(2)),
            });
          }}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label className="block text-sm font-semibold text-slate-800">Standard Profile</label>
            <select
              value={selectedStandardId}
              onChange={(e) => setSelectedStandardId(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {standards.map((standard) => (
                <option key={standard.id} value={standard.id}>
                  {standard.name} ({standard.version})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800">Country Profile</label>
            <select
              value={answers.jurisdiction}
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, jurisdiction: e.target.value as ComplianceAnswers["jurisdiction"] }))
              }
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="uk">United Kingdom</option>
              <option value="other">Other Country (UK baseline only)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800">Site Type</label>
            <select
              value={answers.siteType}
              onChange={(e) => setAnswers((prev) => ({ ...prev, siteType: e.target.value as SiteType }))}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {SITE_TYPES.map((site) => (
                <option key={site.value} value={site.value}>
                  {site.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="block text-sm font-semibold text-slate-800">Floors</span>
              <input
                type="number"
                min={1}
                max={30}
                value={answers.floorCount}
                onChange={(e) => setAnswers((prev) => ({ ...prev, floorCount: Number(e.target.value) || 1 }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1">
              <span className="block text-sm font-semibold text-slate-800">Main Exits</span>
              <input
                type="number"
                min={1}
                max={30}
                value={answers.exitCount}
                onChange={(e) => setAnswers((prev) => ({ ...prev, exitCount: Number(e.target.value) || 1 }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["hasPublicVisitors", "Site has visitors/public"],
              ["hasForklifts", "Forklift traffic present"],
              ["hasElectricalHazards", "Electrical hazard zones"],
              ["hasFlammables", "Flammable storage/materials"],
              ["requiresHardHats", "Hard hats required"],
              ["requiresHighVis", "High-visibility PPE required"],
              ["hasRestrictedAreas", "Restricted access areas"],
            ].map(([key, label]) => {
              const typedKey = key as keyof ComplianceAnswers;
              return (
                <label
                  key={key}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <span className="text-sm text-slate-700">{label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(answers[typedKey])}
                    onChange={(e) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [typedKey]: e.target.checked,
                      }))
                    }
                    className="h-4 w-4"
                  />
                </label>
              );
            })}
          </div>

          <button
            type="submit"
            disabled={!selectedStandard}
            className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Generate Recommendation
          </button>
        </form>

        <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Assessment Output</h2>
          <p className="text-sm text-slate-600">
            {hasRunAssessment
              ? "Review the list below and add must-have or full pack directly to cart."
              : "Complete the form and generate your recommended signage plan."}
          </p>

          {hasRunAssessment ? (
            <>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <p>
                  Must-have: <strong>{result?.mustHave.length ?? 0}</strong> signs
                </p>
                <p>
                  Recommended: <strong>{result?.recommended.length ?? 0}</strong> signs
                </p>
                <p>
                  Estimated subtotal: <strong>GBP {(result?.subtotalEstimate ?? 0).toFixed(2)}</strong>
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={addMustHavesToCart}
                  className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  Add Must-Haves to Cart
                </button>
                <button
                  type="button"
                  onClick={addFullPackToCart}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100"
                >
                  Add Full Pack
                </button>
              </div>

              <Link
                href="/cart"
                className="inline-flex rounded-lg border border-brand-300 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
                onClick={() => {
                  if (!result || !selectedStandard) return;
                  markComplianceSession();
                  trackEvent("compliance_go_to_cart", {
                    standardId: selectedStandard.id,
                    mustHaveCount: result.mustHave.length,
                    recommendedCount: result.recommended.length,
                    source: "assessment-button",
                  });
                }}
              >
                Go to Cart
              </Link>
            </>
          ) : null}
        </aside>
      </div>

      {hasRunAssessment ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">Recommended Signs</h2>
          <p className="text-sm text-slate-600">{result?.disclaimer ?? ""}</p>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">Coverage by Zone</h3>
            <p className="mt-1 text-sm text-slate-600">
              Focus first on zones with highest estimated impact.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(result?.zoneSummary ?? []).map((zone) => (
                <article key={zone.zone} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">{ZONE_LABELS[zone.zone]}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    Must-have: {zone.mustHaveCount} | Recommended: {zone.recommendedCount}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    GBP {zone.estimatedSubtotal.toFixed(2)}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {(result?.recommendations ?? []).map((rec) => (
              <article key={rec.signId} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex gap-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-slate-100">
                    <Image src={rec.signImage} alt={rec.signTitle} fill className="object-contain p-2" unoptimized />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{rec.signTitle}</h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          rec.level === "must-have"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {rec.level}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{rec.rationale}</p>
                    <p className="mt-1 text-xs text-slate-500">Reference: {rec.sourceRef}</p>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-800">Qty: {rec.suggestedQty}</span>
                      <span className="font-semibold text-slate-900">GBP {rec.signPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
