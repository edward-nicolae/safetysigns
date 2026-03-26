import { ComplianceRulesAdmin } from "@/components/compliance/compliance-rules-admin";
import { getComplianceOverrides, getComplianceStandards } from "@/lib/compliance-config";
import { getAllSigns } from "@/lib/sign-catalog";

export const dynamic = "force-dynamic";

export default function AdminCompliancePage() {
  const standards = getComplianceStandards();
  const overrides = getComplianceOverrides();
  const signs = getAllSigns();

  return <ComplianceRulesAdmin standards={standards} overrides={overrides} signs={signs} />;
}
