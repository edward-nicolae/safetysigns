export type Jurisdiction = "uk" | "other";

export type SiteType =
  | "construction"
  | "warehouse"
  | "office"
  | "retail"
  | "manufacturing"
  | "mixed";

export type ComplianceAnswers = {
  jurisdiction: Jurisdiction;
  siteType: SiteType;
  hasPublicVisitors: boolean;
  hasForklifts: boolean;
  hasElectricalHazards: boolean;
  hasFlammables: boolean;
  requiresHardHats: boolean;
  requiresHighVis: boolean;
  hasRestrictedAreas: boolean;
  floorCount: number;
  exitCount: number;
};

export type RecommendationLevel = "must-have" | "recommended";

export type ComplianceZone =
  | "site-entry"
  | "ppe-entry"
  | "traffic-routes"
  | "electrical-areas"
  | "flammable-storage"
  | "restricted-areas"
  | "fire-points"
  | "first-aid"
  | "assembly";

export type AssessmentField = keyof ComplianceAnswers;

export type Condition =
  | { type: "always" }
  | { type: "field-true"; field: AssessmentField }
  | { type: "field-equals"; field: AssessmentField; value: string | number | boolean }
  | { type: "field-in"; field: AssessmentField; values: Array<string | number | boolean> }
  | { type: "all"; conditions: Condition[] }
  | { type: "any"; conditions: Condition[] };

export type QuantityStrategy =
  | { mode: "fixed"; value: number }
  | { mode: "per-exit"; min?: number }
  | { mode: "per-floor"; min?: number }
  | { mode: "floors-plus-exits"; min?: number }
  | {
      mode: "if-field-gte";
      field: AssessmentField;
      threshold: number;
      whenTrue: number;
      whenFalse: number;
    }
  | {
      mode: "if-boolean-field";
      field: AssessmentField;
      whenTrue: number;
      whenFalse: number;
    };

export type ComplianceRuleTemplate = {
  id: string;
  title: string;
  level: RecommendationLevel;
  signId: string;
  zone: ComplianceZone;
  rationale: string;
  sourceRef: string;
  trigger: Condition;
  quantity: QuantityStrategy;
  triggerDescription: string;
  quantityDescription: string;
};

export type ComplianceStandardStatus = "draft" | "reviewed" | "published";

export type ComplianceStandard = {
  id: string;
  name: string;
  jurisdiction: Jurisdiction;
  industry: SiteType | "general";
  version: string;
  status: ComplianceStandardStatus;
  description: string;
  reviewedAt?: string;
  rules: ComplianceRuleTemplate[];
  disclaimer: string;
};

export type ComplianceRuleOverride = {
  enabled?: boolean;
  level?: RecommendationLevel;
  signId?: string;
  quantity?: QuantityStrategy;
  rationale?: string;
  sourceRef?: string;
};

export type ComplianceOverridesByStandard = Record<string, Record<string, ComplianceRuleOverride>>;

export type ComplianceRecommendation = {
  ruleId: string;
  signId: string;
  zone: ComplianceZone;
  signTitle: string;
  signPrice: number;
  signImage: string;
  level: RecommendationLevel;
  rationale: string;
  sourceRef: string;
  suggestedQty: number;
};
