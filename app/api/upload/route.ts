import { writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getUploadsDir, uploadSegmentsToUrl } from "@/lib/persistent-storage";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/svg+xml"]);

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("logo");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large" }, { status: 500 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${Date.now()}-${safeName}`;

  try {
    const uploadsDir = getUploadsDir();
    const absolutePath = path.join(uploadsDir, fileName);
    const fileBytes = new Uint8Array(await file.arrayBuffer());

    await writeFile(absolutePath, fileBytes);

    return NextResponse.json({ url: uploadSegmentsToUrl(fileName) }, { status: 200 });
  } catch (error) {
    console.error("Logo upload failed:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
