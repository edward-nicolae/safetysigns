import { ComplianceAssessment } from "@/components/compliance/compliance-assessment";
import { getComplianceOverrides, getPublishedStandards } from "@/lib/compliance-config";
import { getAllSigns } from "@/lib/sign-catalog";
import type { SignProduct } from "@/types/sign";

export const revalidate = 0;

export default function ComplianceAssessmentPage() {
  const signs = getAllSigns() as SignProduct[];
  const standards = getPublishedStandards();
  const overrides = getComplianceOverrides();

  return <ComplianceAssessment signs={signs} standards={standards} overrides={overrides} />;
}
