import type { SignProduct } from "@/types/sign";
import type {
  ComplianceRuleTemplate,
  ComplianceRuleOverride,
  ComplianceStandard,
  Condition,
  ComplianceAnswers,
  ComplianceZone,
  QuantityStrategy,
  ComplianceRecommendation,
  RecommendationLevel,
} from "@/types/compliance";

export type ZoneSummary = {
  zone: ComplianceZone;
  mustHaveCount: number;
  recommendedCount: number;
  estimatedSubtotal: number;
};

export type ComplianceResult = {
  recommendations: ComplianceRecommendation[];
  mustHave: ComplianceRecommendation[];
  recommended: ComplianceRecommendation[];
  zoneSummary: ZoneSummary[];
  subtotalEstimate: number;
  disclaimer: string;
  standardName: string;
  standardVersion: string;
};

export function buildComplianceRecommendations(
  answers: ComplianceAnswers,
  signs: SignProduct[],
  standard: ComplianceStandard,
  overridesByRule: Record<string, ComplianceRuleOverride> = {},
): ComplianceResult {
  const signMap = new Map(signs.map((sign) => [sign.id, sign]));

  const recommendations: ComplianceRecommendation[] = [];

  for (const rule of standard.rules) {
    const effectiveRule = applyRuleOverride(rule, overridesByRule[rule.id]);

    if (!evaluateCondition(effectiveRule.trigger, answers)) {
      continue;
    }

    const sign = signMap.get(effectiveRule.signId);
    if (!sign) {
      continue;
    }

    recommendations.push({
      ruleId: effectiveRule.id,
      signId: sign.id,
      zone: effectiveRule.zone,
      signTitle: sign.title,
      signPrice: sign.price,
      signImage: sign.image,
      level: effectiveRule.level,
      rationale: effectiveRule.rationale,
      sourceRef: effectiveRule.sourceRef,
      suggestedQty: Math.max(1, Math.floor(evaluateQuantity(effectiveRule.quantity, answers))),
    });
  }

  // Merge duplicates by sign, keeping highest priority level and max quantity.
  const merged = new Map<string, ComplianceRecommendation>();
  for (const rec of recommendations) {
    const existing = merged.get(rec.signId);
    if (!existing) {
      merged.set(rec.signId, rec);
      continue;
    }

    const level = pickHigherLevel(existing.level, rec.level);
    merged.set(rec.signId, {
      ...existing,
      level,
      suggestedQty: Math.max(existing.suggestedQty, rec.suggestedQty),
      rationale:
        level === rec.level
          ? `${existing.rationale} ${rec.rationale}`
          : `${existing.rationale} ${rec.rationale}`,
      sourceRef: `${existing.sourceRef}; ${rec.sourceRef}`,
    });
  }

  const deduped = Array.from(merged.values());
  const mustHave = deduped.filter((r) => r.level === "must-have");
  const recommended = deduped.filter((r) => r.level === "recommended");
  const zoneSummary = buildZoneSummary(deduped);

  const subtotalEstimate = deduped.reduce((sum, rec) => sum + rec.signPrice * rec.suggestedQty, 0);

  const disclaimer =
    answers.jurisdiction === standard.jurisdiction
      ? standard.disclaimer
      : "Selected standard uses a different jurisdiction profile. Validate recommendations before ordering.";

  return {
    recommendations: deduped,
    mustHave,
    recommended,
    zoneSummary,
    subtotalEstimate,
    disclaimer,
    standardName: standard.name,
    standardVersion: standard.version,
  };
}

function applyRuleOverride(
  rule: ComplianceRuleTemplate,
  override?: ComplianceRuleOverride,
): ComplianceRuleTemplate {
  if (!override) return rule;
  if (override.enabled === false) {
    return {
      ...rule,
      trigger: { type: "all", conditions: [] },
      quantity: { mode: "fixed", value: 0 },
    };
  }

  return {
    ...rule,
    level: override.level ?? rule.level,
    signId: override.signId ?? rule.signId,
    quantity: override.quantity ?? rule.quantity,
    rationale: override.rationale ?? rule.rationale,
    sourceRef: override.sourceRef ?? rule.sourceRef,
  };
}

function evaluateCondition(condition: Condition, answers: ComplianceAnswers): boolean {
  switch (condition.type) {
    case "always":
      return true;
    case "field-true":
      return Boolean(answers[condition.field]);
    case "field-equals":
      return answers[condition.field] === condition.value;
    case "field-in":
      return condition.values.includes(answers[condition.field] as string | number | boolean);
    case "all":
      if (condition.conditions.length === 0) return false;
      return condition.conditions.every((child) => evaluateCondition(child, answers));
    case "any":
      return condition.conditions.some((child) => evaluateCondition(child, answers));
    default:
      return false;
  }
}

function evaluateQuantity(strategy: QuantityStrategy, answers: ComplianceAnswers): number {
  switch (strategy.mode) {
    case "fixed":
      return strategy.value;
    case "per-exit":
      return Math.max(strategy.min ?? 1, answers.exitCount);
    case "per-floor":
      return Math.max(strategy.min ?? 1, answers.floorCount);
    case "floors-plus-exits":
      return Math.max(strategy.min ?? 1, answers.floorCount + answers.exitCount);
    case "if-field-gte": {
      const currentValue = Number(answers[strategy.field] ?? 0);
      return currentValue >= strategy.threshold ? strategy.whenTrue : strategy.whenFalse;
    }
    case "if-boolean-field":
      return Boolean(answers[strategy.field]) ? strategy.whenTrue : strategy.whenFalse;
    default:
      return 1;
  }
}

function pickHigherLevel(a: RecommendationLevel, b: RecommendationLevel): RecommendationLevel {
  if (a === "must-have" || b === "must-have") {
    return "must-have";
  }
  return "recommended";
}

function buildZoneSummary(recommendations: ComplianceRecommendation[]): ZoneSummary[] {
  const byZone = new Map<ComplianceZone, ZoneSummary>();

  for (const rec of recommendations) {
    const current = byZone.get(rec.zone) ?? {
      zone: rec.zone,
      mustHaveCount: 0,
      recommendedCount: 0,
      estimatedSubtotal: 0,
    };

    if (rec.level === "must-have") {
      current.mustHaveCount += 1;
    } else {
      current.recommendedCount += 1;
    }

    current.estimatedSubtotal += rec.signPrice * rec.suggestedQty;
    byZone.set(rec.zone, current);
  }

  return Array.from(byZone.values()).sort((a, b) => b.estimatedSubtotal - a.estimatedSubtotal);
}
