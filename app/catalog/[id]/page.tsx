import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getAllSigns } from "@/lib/sign-catalog";
import type { SignProduct } from "@/types/sign";
import { AddToCartButton } from "@/components/catalog/add-to-cart-button";

export const revalidate = 0;

type PageProps = {
  params: { id: string };
};

// Reserved fields that are rendered explicitly — everything else goes in "More details"
const RESERVED = new Set(["id", "title", "category", "price", "image", "description"]);

const CATEGORY_COLOR: Record<string, string> = {
  Mandatory: "bg-blue-100 text-blue-800",
  Warning: "bg-amber-100 text-amber-800",
  Prohibition: "bg-red-100 text-red-800",
  "Fire Safety": "bg-orange-100 text-orange-800",
  Information: "bg-green-100 text-green-800",
};

export async function generateStaticParams() {
  return (getAllSigns() as SignProduct[]).map((s) => ({ id: s.id }));
}

export default function ProductPage({ params }: PageProps) {
  const allSigns = getAllSigns() as SignProduct[];
  const sign = allSigns.find((s) => s.id === params.id);

  if (!sign) notFound();

  // Collect extra custom fields (anything not in the reserved set)
  const extraFields = Object.entries(sign).filter(
    ([key]) => !RESERVED.has(key) && sign[key] !== undefined && sign[key] !== "",
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/catalog" className="hover:text-slate-800 hover:underline">
          Catalog
        </Link>
        <span>/</span>
        <span className="text-slate-800">{sign.title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        {/* ── Image ─────────────────────────────────────────────────────── */}
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-100">
          <Image
            src={sign.image}
            alt={sign.title}
            fill
            className="object-contain p-6"
            priority
            unoptimized
          />
        </div>

        {/* ── Details ───────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">
          <div>
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                CATEGORY_COLOR[sign.category] ?? "bg-slate-100 text-slate-700"
              }`}
            >
              {sign.category}
            </span>
            <h1 className="mt-3 text-3xl font-bold leading-snug text-slate-900">{sign.title}</h1>
            <p className="mt-1 text-xs text-slate-400">{sign.id}</p>
          </div>

          <p className="text-3xl font-bold text-slate-900">GBP {sign.price.toFixed(2)}</p>

          {sign.description && (
            <p className="text-base leading-relaxed text-slate-600">{sign.description}</p>
          )}

          {/* Extra custom fields table */}
          {extraFields.length > 0 && (
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {extraFields.map(([key, value]) => (
                    <tr key={key} className="border-b border-slate-100 last:border-0">
                      <td className="w-2/5 bg-slate-50 px-4 py-2.5 font-medium text-slate-600 capitalize">
                        {key}
                      </td>
                      <td className="px-4 py-2.5 text-slate-800">{String(value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* CTA buttons */}
          <div className="mt-auto flex flex-col gap-3 pt-2">
            <AddToCartButton sign={sign} />
            <Link
              href={`/configurator/${sign.id}`}
              className="rounded-xl border border-slate-300 px-6 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Configure this sign
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
