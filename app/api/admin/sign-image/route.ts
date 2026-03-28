import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { getUploadsDir, uploadSegmentsToUrl } from "@/lib/persistent-storage";
import { getSignImageOverrides, writeSignImageOverrides } from "@/lib/sign-overrides";

export async function GET() {
  return NextResponse.json(getSignImageOverrides());
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const signId = formData.get("signId");
  const file = formData.get("file");

  if (typeof signId !== "string" || !signId) {
    return NextResponse.json({ error: "Missing signId" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const allowedTypes = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Allowed: PNG, JPG, SVG, WEBP" },
      { status: 400 },
    );
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 400 });
  }

  const ext = file.type === "image/svg+xml" ? "svg" : file.type.split("/")[1];
  const fileName = `${signId}.${ext}`;
  const uploadsDir = getUploadsDir();
  const signImagesDir = path.join(uploadsDir, "sign-images");
  const absolutePath = path.join(signImagesDir, fileName);
  const fileBytes = new Uint8Array(await file.arrayBuffer());
  await mkdir(signImagesDir, { recursive: true });
  await writeFile(absolutePath, fileBytes, { flag: "w" });

  const uploadedUrl = uploadSegmentsToUrl("sign-images", fileName);

  const overrides = getSignImageOverrides();
  overrides[signId] = uploadedUrl;
  writeSignImageOverrides(overrides);

  revalidatePath("/catalog");
  revalidatePath("/configurator", "layout");

  return NextResponse.json({ url: uploadedUrl, signId });
}

export async function DELETE(req: NextRequest) {
  const { signId } = await req.json() as { signId: string };
  if (!signId) {
    return NextResponse.json({ error: "Missing signId" }, { status: 400 });
  }

  const overrides = getSignImageOverrides();
  delete overrides[signId];
  writeSignImageOverrides(overrides);

  revalidatePath("/catalog");
  revalidatePath("/configurator", "layout");

  return NextResponse.json({ ok: true });
}
