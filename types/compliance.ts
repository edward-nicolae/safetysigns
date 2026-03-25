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

export type ComplianceRule = {
  id: string;
  title: string;
  level: RecommendationLevel;
  signId: string;
  zone: ComplianceZone;
  rationale: string;
  sourceRef: string;
  match: (answers: ComplianceAnswers) => boolean;
  quantity: (answers: ComplianceAnswers) => number;
};

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
