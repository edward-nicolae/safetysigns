import { complianceRules, UK_BASELINE_DISCLAIMER } from "@/data/compliance-rules";
import type { SignProduct } from "@/types/sign";
import type {
  ComplianceAnswers,
  ComplianceZone,
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
};

export function buildComplianceRecommendations(
  answers: ComplianceAnswers,
  signs: SignProduct[],
): ComplianceResult {
  const signMap = new Map(signs.map((sign) => [sign.id, sign]));

  const recommendations: ComplianceRecommendation[] = [];

  for (const rule of complianceRules) {
    if (!rule.match(answers)) {
      continue;
    }

    const sign = signMap.get(rule.signId);
    if (!sign) {
      continue;
    }

    recommendations.push({
      ruleId: rule.id,
      signId: sign.id,
      zone: rule.zone,
      signTitle: sign.title,
      signPrice: sign.price,
      signImage: sign.image,
      level: rule.level,
      rationale: rule.rationale,
      sourceRef: rule.sourceRef,
      suggestedQty: Math.max(1, Math.floor(rule.quantity(answers))),
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
    answers.jurisdiction === "uk"
      ? UK_BASELINE_DISCLAIMER
      : "This ruleset is UK-oriented and should be adapted to local regulations before ordering.";

  return {
    recommendations: deduped,
    mustHave,
    recommended,
    zoneSummary,
    subtotalEstimate,
    disclaimer,
  };
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
