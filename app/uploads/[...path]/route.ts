import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getUploadsDir } from "@/lib/persistent-storage";

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

function isSafePathSegment(segment: string): boolean {
  return segment.length > 0 && !segment.includes("..") && !segment.includes("/") && !segment.includes("\\");
}

function resolveMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { path: string[] } },
) {
  const segments = params.path;

  if (!Array.isArray(segments) || segments.length === 0 || segments.some((segment) => !isSafePathSegment(segment))) {
    return NextResponse.json({ error: "Invalid upload path" }, { status: 400 });
  }

  const uploadsDir = getUploadsDir();
  const absolutePath = path.join(uploadsDir, ...segments);
  const normalizedUploads = path.resolve(uploadsDir);
  const normalizedTarget = path.resolve(absolutePath);

  if (!normalizedTarget.startsWith(normalizedUploads + path.sep) && normalizedTarget !== normalizedUploads) {
    return NextResponse.json({ error: "Invalid upload path" }, { status: 400 });
  }

  try {
    const body = await readFile(normalizedTarget);
    const bytes = new Uint8Array(body);
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": resolveMimeType(normalizedTarget),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
