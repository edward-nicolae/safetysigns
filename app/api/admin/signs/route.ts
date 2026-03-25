import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAllSigns, getCustomSigns, writeCustomSigns } from "@/lib/sign-catalog";
import type { SignCategory, SignProduct } from "@/types/sign";

const VALID_CATEGORIES: SignCategory[] = [
  "Mandatory",
  "Warning",
  "Prohibition",
  "Fire Safety",
  "Information",
];

export async function GET() {
  return NextResponse.json(getAllSigns());
}

export async function POST(req: NextRequest) {
  let body: Partial<SignProduct> & Record<string, unknown>;
  try {
    body = (await req.json()) as Partial<SignProduct> & Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const category = body.category;
  const price = Number(body.price);
  const image = typeof body.image === "string" && body.image.trim() ? body.image.trim() : "/images/sign-01.svg";
  const description = typeof body.description === "string" ? body.description.trim() : "";

  if (!id || !/^[a-z0-9-]+$/.test(id)) {
    return NextResponse.json({ error: "id is required and must contain only lowercase letters, digits, and dashes" }, { status: 400 });
  }
  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (!VALID_CATEGORIES.includes(category as SignCategory)) {
    return NextResponse.json({ error: "category is invalid" }, { status: 400 });
  }
  if (Number.isNaN(price) || price < 0) {
    return NextResponse.json({ error: "price must be a non-negative number" }, { status: 400 });
  }

  const allSigns = getAllSigns();
  if (allSigns.some((sign) => sign.id === id)) {
    return NextResponse.json({ error: "A product with this id already exists" }, { status: 400 });
  }

  const newSign: SignProduct = {
    id,
    title,
    category: category as SignCategory,
    price,
    image,
    ...(description ? { description } : {}),
  };

  const reserved = new Set(["id", "title", "category", "price", "image", "description"]);
  for (const [key, value] of Object.entries(body)) {
    if (!reserved.has(key) && value !== undefined && value !== "") {
      newSign[key] = value;
    }
  }

  const existingCustomSigns = getCustomSigns();
  existingCustomSigns.push(newSign);
  writeCustomSigns(existingCustomSigns);

  revalidatePath("/catalog");
  revalidatePath(`/catalog/${id}`);
  revalidatePath("/configurator", "layout");
  revalidatePath("/configure", "layout");
  revalidatePath("/admin");

  return NextResponse.json({ ok: true, sign: newSign });
}
