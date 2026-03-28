import { readFileSync, writeFileSync } from "fs";
import type {
  ComplianceOverridesByStandard,
  ComplianceRuleOverride,
  ComplianceStandard,
} from "@/types/compliance";
import { getDataFilePath } from "@/lib/persistent-storage";

const STANDARDS_PATH = getDataFilePath("compliance-standards.json", "[]\n");
const OVERRIDES_PATH = getDataFilePath("compliance-overrides.json", "{}\n");

export function getComplianceStandards(): ComplianceStandard[] {
  try {
    const raw = readFileSync(STANDARDS_PATH, "utf-8");
    const parsed = JSON.parse(raw) as ComplianceStandard[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getComplianceOverrides(): ComplianceOverridesByStandard {
  try {
    const raw = readFileSync(OVERRIDES_PATH, "utf-8");
    const parsed = JSON.parse(raw) as ComplianceOverridesByStandard;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function writeComplianceOverrides(overrides: ComplianceOverridesByStandard): void {
  writeFileSync(OVERRIDES_PATH, JSON.stringify(overrides, null, 2), "utf-8");
}

export function getPublishedStandards(): ComplianceStandard[] {
  return getComplianceStandards().filter((standard) => standard.status === "published");
}

export function getStandardById(standardId: string): ComplianceStandard | null {
  return getComplianceStandards().find((standard) => standard.id === standardId) ?? null;
}

export function getOverridesForStandard(
  standardId: string,
): Record<string, ComplianceRuleOverride> {
  const all = getComplianceOverrides();
  return all[standardId] ?? {};
}
