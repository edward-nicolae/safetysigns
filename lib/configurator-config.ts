import { readFileSync, writeFileSync } from "fs";
import { getDataFilePath } from "@/lib/persistent-storage";

export type ConfiguratorMaterial = {
  id: string;
  label: string;
  description: string;
  priceMultiplier: number;
  popular: boolean;
};

export type ConfiguratorSize = {
  id: string;
  width: number;
  height: number;
  orientation: "portrait" | "landscape" | "square";
  areaMultiplier: number;
};

export type ConfiguratorQtyTier = {
  min: number;
  /** null = no upper limit ("X and above") */
  max: number | null;
  discountPct: number;
};

export type ConfiguratorColorScheme = {
  id: string;
  label: string;
  bg: string;
  fg: string;
};

export type ConfiguratorSettings = {
  materials: ConfiguratorMaterial[];
  sizes: ConfiguratorSize[];
  qtyTiers: ConfiguratorQtyTier[];
  colorSchemes: ConfiguratorColorScheme[];
};

const DATA_PATH = getDataFilePath("configurator-settings.json", "{}\n");

export function getConfiguratorSettings(): ConfiguratorSettings {
  const raw = readFileSync(DATA_PATH, "utf-8");
  return JSON.parse(raw) as ConfiguratorSettings;
}

export function writeConfiguratorSettings(settings: ConfiguratorSettings): void {
  writeFileSync(DATA_PATH, JSON.stringify(settings, null, 2), "utf-8");
}
