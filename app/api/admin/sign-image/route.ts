import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
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
  const blob = await put(`sign-images/${signId}.${ext}`, file, {
    access: "public",
  });

  const overrides = getSignImageOverrides();
  overrides[signId] = blob.url;
  writeSignImageOverrides(overrides);

  revalidatePath("/catalog");
  revalidatePath("/configurator", "layout");

  return NextResponse.json({ url: blob.url, signId });
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
