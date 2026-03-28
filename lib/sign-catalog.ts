import { readFileSync, writeFileSync } from "fs";
import baseSigns from "@/data/signs.json";
import { getDataFilePath } from "@/lib/persistent-storage";
import { applyOverrides } from "@/lib/sign-overrides";
import type { SignProduct } from "@/types/sign";

const CUSTOM_SIGNS_PATH = getDataFilePath("custom-signs.json", "[]\n");

export function getCustomSigns(): SignProduct[] {
  try {
    return JSON.parse(readFileSync(CUSTOM_SIGNS_PATH, "utf-8")) as SignProduct[];
  } catch {
    return [];
  }
}

export function writeCustomSigns(signs: SignProduct[]): void {
  writeFileSync(CUSTOM_SIGNS_PATH, JSON.stringify(signs, null, 2), "utf-8");
}

export function getBaseSigns(): SignProduct[] {
  return baseSigns as SignProduct[];
}

export function getAllSigns(): SignProduct[] {
  return applyOverrides([...getBaseSigns(), ...getCustomSigns()]);
}

export function getBaseAndCustomSigns(): SignProduct[] {
  return [...getBaseSigns(), ...getCustomSigns()];
}
