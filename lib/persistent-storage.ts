import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";

const REPO_DATA_DIR = path.join(process.cwd(), "data");

function resolveDataRoot(): string {
  const envDataDir = process.env.DATA_DIR?.trim();
  if (envDataDir) {
    return envDataDir;
  }

  // On Fly we default to the mounted volume path; locally we keep using repo data.
  if (process.env.FLY_APP_NAME) {
    return "/data";
  }

  return REPO_DATA_DIR;
}

export function getDataRoot(): string {
  const root = resolveDataRoot();
  if (!existsSync(root)) {
    mkdirSync(root, { recursive: true });
  }
  return root;
}

export function getDataFilePath(fileName: string, fallbackContent = "{}\n"): string {
  const dataRoot = getDataRoot();
  const targetPath = path.join(dataRoot, fileName);

  if (!existsSync(targetPath)) {
    const seedPath = path.join(REPO_DATA_DIR, fileName);
    if (existsSync(seedPath)) {
      copyFileSync(seedPath, targetPath);
    } else {
      writeFileSync(targetPath, fallbackContent, "utf-8");
    }
  }

  return targetPath;
}

export function getUploadsDir(): string {
  const envUploadsDir = process.env.UPLOADS_DIR?.trim();
  const uploadsDir = envUploadsDir || path.join(getDataRoot(), "uploads");

  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }

  return uploadsDir;
}

export function uploadSegmentsToUrl(...segments: string[]): string {
  const safeSegments = segments
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment));
  return `/uploads/${safeSegments.join("/")}`;
}
