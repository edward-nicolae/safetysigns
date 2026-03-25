import { ComplianceAssessment } from "@/components/compliance/compliance-assessment";
import { getAllSigns } from "@/lib/sign-catalog";
import type { SignProduct } from "@/types/sign";

export const revalidate = 0;

export default function ComplianceAssessmentPage() {
  const signs = getAllSigns() as SignProduct[];
  return <ComplianceAssessment signs={signs} />;
}
