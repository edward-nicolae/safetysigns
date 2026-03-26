"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type {
  ComplianceOverridesByStandard,
  ComplianceRuleOverride,
  ComplianceStandard,
  QuantityStrategy,
} from "@/types/compliance";
import type { SignProduct } from "@/types/sign";

type Props = {
  standards: ComplianceStandard[];
  overrides: ComplianceOverridesByStandard;
  signs: SignProduct[];
};

type SaveState = "idle" | "saving" | "saved" | "error";

const NUMERIC_FIELDS = ["floorCount", "exitCount"] as const;
const BOOLEAN_FIELDS = [
  "hasPublicVisitors",
  "hasForklifts",
  "hasElectricalHazards",
  "hasFlammables",
  "requiresHardHats",
  "requiresHighVis",
  "hasRestrictedAreas",
] as const;

function strategyLabel(strategy: QuantityStrategy): string {
  switch (strategy.mode) {
    case "fixed":
      return `Fixed: ${strategy.value}`;
    case "per-exit":
      return `Per exit (min ${strategy.min ?? 1})`;
    case "per-floor":
      return `Per floor (min ${strategy.min ?? 1})`;
    case "floors-plus-exits":
      return `Floors + exits (min ${strategy.min ?? 1})`;
    case "if-field-gte":
      return `${strategy.field} >= ${strategy.threshold} ? ${strategy.whenTrue} : ${strategy.whenFalse}`;
    case "if-boolean-field":
      return `${strategy.field} ? ${strategy.whenTrue} : ${strategy.whenFalse}`;
    default:
      return "Custom";
  }
}

function sanitizeOverride(rule: ComplianceStandard["rules"][number], override?: ComplianceRuleOverride): ComplianceRuleOverride {
  return {
    enabled: override?.enabled ?? true,
    level: override?.level ?? rule.level,
    signId: override?.signId ?? rule.signId,
    quantity: override?.quantity ?? rule.quantity,
    rationale: override?.rationale ?? rule.rationale,
    sourceRef: override?.sourceRef ?? rule.sourceRef,
  };
}

export function ComplianceRulesAdmin({ standards, overrides, signs }: Props) {
  const [selectedStandardId, setSelectedStandardId] = useState(standards[0]?.id ?? "");
  const [overridesState, setOverridesState] = useState<ComplianceOverridesByStandard>(overrides);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const selectedStandard = useMemo(
    () => standards.find((standard) => standard.id === selectedStandardId) ?? null,
    [standards, selectedStandardId],
  );

  const activeOverrides = overridesState[selectedStandardId] ?? {};

  const updateRuleOverride = (ruleId: string, next: ComplianceRuleOverride) => {
    setOverridesState((prev) => ({
      ...prev,
      [selectedStandardId]: {
        ...(prev[selectedStandardId] ?? {}),
        [ruleId]: next,
      },
    }));
  };

  const updateRuleQuantity = (ruleId: string, nextQuantity: QuantityStrategy) => {
    if (!selectedStandard) return;

    const targetRule = selectedStandard.rules.find((rule) => rule.id === ruleId);
    if (!targetRule) return;

    const current = sanitizeOverride(
      targetRule,
      activeOverrides[ruleId],
    );
    updateRuleOverride(ruleId, { ...current, quantity: nextQuantity });
  };

  const resetRuleOverride = (ruleId: string) => {
    setOverridesState((prev) => {
      const standardOverrides = { ...(prev[selectedStandardId] ?? {}) };
      delete standardOverrides[ruleId];
      return {
        ...prev,
        [selectedStandardId]: standardOverrides,
      };
    });
  };

  const onSave = async () => {
    if (!selectedStandard) return;

    setSaveState("saving");
    try {
      const response = await fetch("/api/admin/compliance-overrides", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          standardId: selectedStandard.id,
          overrides: overridesState[selectedStandard.id] ?? {},
        }),
      });

      if (!response.ok) {
        setSaveState("error");
        return;
      }

      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1500);
    } catch {
      setSaveState("error");
    }
  };

  if (!selectedStandard) {
    return (
      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Compliance Rules</h1>
        <p className="text-sm text-slate-600">No standards available yet.</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Compliance Rules Configurator</h1>
          <p className="mt-1 text-sm text-slate-600">
            Use published standards as baseline and apply safe overrides without editing code.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Back to Admin
          </Link>
          <button
            onClick={onSave}
            disabled={saveState === "saving"}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {saveState === "saving" ? "Saving..." : "Save Overrides"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <label className="block text-sm font-semibold text-slate-800">Standard</label>
        <select
          value={selectedStandardId}
          onChange={(event) => setSelectedStandardId(event.target.value)}
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {standards.map((standard) => (
            <option key={standard.id} value={standard.id}>
              {standard.name} ({standard.version})
            </option>
          ))}
        </select>
        <p className="mt-2 text-sm text-slate-600">{selectedStandard.description}</p>
        <p className="text-xs text-slate-500">Status: {selectedStandard.status}</p>
      </div>

      <div className="space-y-4">
        {selectedStandard.rules.map((rule) => {
          const override = sanitizeOverride(rule, activeOverrides[rule.id]);
          return (
            <article key={rule.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">{rule.title}</h2>
                  <p className="text-xs text-slate-500">{rule.id} | Zone: {rule.zone}</p>
                </div>
                <button
                  onClick={() => resetRuleOverride(rule.id)}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Reset to Standard
                </button>
              </div>

              <div className="mt-3 grid gap-4 lg:grid-cols-2">
                <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Standard Logic</p>
                  <p className="text-sm text-slate-700">Trigger: {rule.triggerDescription}</p>
                  <p className="text-sm text-slate-700">Quantity: {rule.quantityDescription}</p>
                  <p className="text-sm text-slate-700">Reference: {rule.sourceRef}</p>
                </div>

                <div className="space-y-3 rounded-lg border border-slate-200 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Safe Overrides</p>

                  <label className="flex items-center justify-between text-sm text-slate-700">
                    Enabled
                    <input
                      type="checkbox"
                      checked={override.enabled !== false}
                      onChange={(event) =>
                        updateRuleOverride(rule.id, { ...override, enabled: event.target.checked })
                      }
                    />
                  </label>

                  <label className="block text-sm text-slate-700">
                    Level
                    <select
                      value={override.level}
                      onChange={(event) =>
                        updateRuleOverride(rule.id, {
                          ...override,
                          level: event.target.value as "must-have" | "recommended",
                        })
                      }
                      className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    >
                      <option value="must-have">must-have</option>
                      <option value="recommended">recommended</option>
                    </select>
                  </label>

                  <label className="block text-sm text-slate-700">
                    Sign Mapping
                    <select
                      value={override.signId}
                      onChange={(event) =>
                        updateRuleOverride(rule.id, { ...override, signId: event.target.value })
                      }
                      className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    >
                      {signs.map((sign) => (
                        <option key={sign.id} value={sign.id}>
                          {sign.title}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm text-slate-700">
                    Quantity Strategy
                    <select
                      value={override.quantity?.mode ?? "fixed"}
                      onChange={(event) => {
                        const mode = event.target.value as QuantityStrategy["mode"];
                        const defaults: Record<QuantityStrategy["mode"], QuantityStrategy> = {
                          fixed: { mode: "fixed", value: 1 },
                          "per-exit": { mode: "per-exit", min: 1 },
                          "per-floor": { mode: "per-floor", min: 1 },
                          "floors-plus-exits": { mode: "floors-plus-exits", min: 1 },
                          "if-field-gte": {
                            mode: "if-field-gte",
                            field: "floorCount",
                            threshold: 2,
                            whenTrue: 2,
                            whenFalse: 1,
                          },
                          "if-boolean-field": {
                            mode: "if-boolean-field",
                            field: "hasPublicVisitors",
                            whenTrue: 2,
                            whenFalse: 1,
                          },
                        };

                        updateRuleOverride(rule.id, { ...override, quantity: defaults[mode] });
                      }}
                      className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    >
                      <option value="fixed">Fixed</option>
                      <option value="per-exit">Per exit</option>
                      <option value="per-floor">Per floor</option>
                      <option value="floors-plus-exits">Floors + exits</option>
                      <option value="if-field-gte">If numeric field {">="} threshold</option>
                      <option value="if-boolean-field">If boolean field true/false</option>
                    </select>
                  </label>

                  {(override.quantity?.mode ?? rule.quantity.mode) === "fixed" ? (
                    <label className="block text-sm text-slate-700">
                      Fixed Quantity
                      <input
                        type="number"
                        min={1}
                        value={(override.quantity?.mode === "fixed" ? override.quantity.value : 1) ?? 1}
                        onChange={(event) =>
                          updateRuleQuantity(rule.id, {
                            mode: "fixed",
                            value: Math.max(1, Number(event.target.value) || 1),
                          })
                        }
                        className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                      />
                    </label>
                  ) : null}

                  {(override.quantity?.mode ?? rule.quantity.mode) === "per-exit" ? (
                    <label className="block text-sm text-slate-700">
                      Minimum Quantity
                      <input
                        type="number"
                        min={1}
                        value={(override.quantity?.mode === "per-exit" ? override.quantity.min ?? 1 : 1) ?? 1}
                        onChange={(event) =>
                          updateRuleQuantity(rule.id, {
                            mode: "per-exit",
                            min: Math.max(1, Number(event.target.value) || 1),
                          })
                        }
                        className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                      />
                    </label>
                  ) : null}

                  {(override.quantity?.mode ?? rule.quantity.mode) === "per-floor" ? (
                    <label className="block text-sm text-slate-700">
                      Minimum Quantity
                      <input
                        type="number"
                        min={1}
                        value={(override.quantity?.mode === "per-floor" ? override.quantity.min ?? 1 : 1) ?? 1}
                        onChange={(event) =>
                          updateRuleQuantity(rule.id, {
                            mode: "per-floor",
                            min: Math.max(1, Number(event.target.value) || 1),
                          })
                        }
                        className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                      />
                    </label>
                  ) : null}

                  {(override.quantity?.mode ?? rule.quantity.mode) === "floors-plus-exits" ? (
                    <label className="block text-sm text-slate-700">
                      Minimum Quantity
                      <input
                        type="number"
                        min={1}
                        value={
                          (override.quantity?.mode === "floors-plus-exits"
                            ? override.quantity.min ?? 1
                            : 1) ?? 1
                        }
                        onChange={(event) =>
                          updateRuleQuantity(rule.id, {
                            mode: "floors-plus-exits",
                            min: Math.max(1, Number(event.target.value) || 1),
                          })
                        }
                        className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                      />
                    </label>
                  ) : null}

                  {(override.quantity?.mode ?? rule.quantity.mode) === "if-field-gte" ? (
                    <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-2">
                      <label className="block text-sm text-slate-700">
                        Numeric Field
                        <select
                          value={
                            override.quantity?.mode === "if-field-gte"
                              ? String(override.quantity.field)
                              : "floorCount"
                          }
                          onChange={(event) => {
                            const current =
                              override.quantity?.mode === "if-field-gte"
                                ? override.quantity
                                : {
                                    mode: "if-field-gte" as const,
                                    field: "floorCount" as const,
                                    threshold: 2,
                                    whenTrue: 2,
                                    whenFalse: 1,
                                  };

                            updateRuleQuantity(rule.id, {
                              ...current,
                              field: event.target.value as (typeof NUMERIC_FIELDS)[number],
                            });
                          }}
                          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                        >
                          {NUMERIC_FIELDS.map((field) => (
                            <option key={field} value={field}>
                              {field}
                            </option>
                          ))}
                        </select>
                      </label>

                      <div className="grid gap-2 sm:grid-cols-3">
                        <label className="block text-sm text-slate-700">
                          Threshold
                          <input
                            type="number"
                            min={0}
                            value={
                              override.quantity?.mode === "if-field-gte"
                                ? override.quantity.threshold
                                : 2
                            }
                            onChange={(event) => {
                              const current =
                                override.quantity?.mode === "if-field-gte"
                                  ? override.quantity
                                  : {
                                      mode: "if-field-gte" as const,
                                      field: "floorCount" as const,
                                      threshold: 2,
                                      whenTrue: 2,
                                      whenFalse: 1,
                                    };

                              updateRuleQuantity(rule.id, {
                                ...current,
                                threshold: Math.max(0, Number(event.target.value) || 0),
                              });
                            }}
                            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          />
                        </label>

                        <label className="block text-sm text-slate-700">
                          When True
                          <input
                            type="number"
                            min={1}
                            value={override.quantity?.mode === "if-field-gte" ? override.quantity.whenTrue : 2}
                            onChange={(event) => {
                              const current =
                                override.quantity?.mode === "if-field-gte"
                                  ? override.quantity
                                  : {
                                      mode: "if-field-gte" as const,
                                      field: "floorCount" as const,
                                      threshold: 2,
                                      whenTrue: 2,
                                      whenFalse: 1,
                                    };

                              updateRuleQuantity(rule.id, {
                                ...current,
                                whenTrue: Math.max(1, Number(event.target.value) || 1),
                              });
                            }}
                            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          />
                        </label>

                        <label className="block text-sm text-slate-700">
                          When False
                          <input
                            type="number"
                            min={1}
                            value={override.quantity?.mode === "if-field-gte" ? override.quantity.whenFalse : 1}
                            onChange={(event) => {
                              const current =
                                override.quantity?.mode === "if-field-gte"
                                  ? override.quantity
                                  : {
                                      mode: "if-field-gte" as const,
                                      field: "floorCount" as const,
                                      threshold: 2,
                                      whenTrue: 2,
                                      whenFalse: 1,
                                    };

                              updateRuleQuantity(rule.id, {
                                ...current,
                                whenFalse: Math.max(1, Number(event.target.value) || 1),
                              });
                            }}
                            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          />
                        </label>
                      </div>
                    </div>
                  ) : null}

                  {(override.quantity?.mode ?? rule.quantity.mode) === "if-boolean-field" ? (
                    <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-2">
                      <label className="block text-sm text-slate-700">
                        Boolean Field
                        <select
                          value={
                            override.quantity?.mode === "if-boolean-field"
                              ? String(override.quantity.field)
                              : "hasPublicVisitors"
                          }
                          onChange={(event) => {
                            const current =
                              override.quantity?.mode === "if-boolean-field"
                                ? override.quantity
                                : {
                                    mode: "if-boolean-field" as const,
                                    field: "hasPublicVisitors" as const,
                                    whenTrue: 2,
                                    whenFalse: 1,
                                  };

                            updateRuleQuantity(rule.id, {
                              ...current,
                              field: event.target.value as (typeof BOOLEAN_FIELDS)[number],
                            });
                          }}
                          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                        >
                          {BOOLEAN_FIELDS.map((field) => (
                            <option key={field} value={field}>
                              {field}
                            </option>
                          ))}
                        </select>
                      </label>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <label className="block text-sm text-slate-700">
                          When True
                          <input
                            type="number"
                            min={1}
                            value={
                              override.quantity?.mode === "if-boolean-field"
                                ? override.quantity.whenTrue
                                : 2
                            }
                            onChange={(event) => {
                              const current =
                                override.quantity?.mode === "if-boolean-field"
                                  ? override.quantity
                                  : {
                                      mode: "if-boolean-field" as const,
                                      field: "hasPublicVisitors" as const,
                                      whenTrue: 2,
                                      whenFalse: 1,
                                    };

                              updateRuleQuantity(rule.id, {
                                ...current,
                                whenTrue: Math.max(1, Number(event.target.value) || 1),
                              });
                            }}
                            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          />
                        </label>

                        <label className="block text-sm text-slate-700">
                          When False
                          <input
                            type="number"
                            min={1}
                            value={
                              override.quantity?.mode === "if-boolean-field"
                                ? override.quantity.whenFalse
                                : 1
                            }
                            onChange={(event) => {
                              const current =
                                override.quantity?.mode === "if-boolean-field"
                                  ? override.quantity
                                  : {
                                      mode: "if-boolean-field" as const,
                                      field: "hasPublicVisitors" as const,
                                      whenTrue: 2,
                                      whenFalse: 1,
                                    };

                              updateRuleQuantity(rule.id, {
                                ...current,
                                whenFalse: Math.max(1, Number(event.target.value) || 1),
                              });
                            }}
                            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          />
                        </label>
                      </div>
                    </div>
                  ) : null}

                  <p className="text-xs text-slate-500">
                    Current strategy: {strategyLabel(override.quantity ?? rule.quantity)}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {saveState === "saved" ? <p className="text-sm font-semibold text-green-700">Overrides saved.</p> : null}
      {saveState === "error" ? <p className="text-sm font-semibold text-red-700">Save failed.</p> : null}
    </section>
  );
}
