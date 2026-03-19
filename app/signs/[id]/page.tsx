import Image from "next/image";
import { notFound } from "next/navigation";
import { readFile } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import path from "node:path";
import type { SafetySign } from "@/types/SafetySign";

type SignPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  const signsDir = path.join(process.cwd(), "data", "signs");
  const files = await readdir(signsDir);
  return files
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({ id: f.replace(/\.json$/, "") }));
}

async function getSafetySignById(id: string): Promise<SafetySign | null> {
  const filePath = path.join(process.cwd(), "data", "signs", `${id}.json`);

  try {
    const fileContents = await readFile(filePath, "utf-8");
    return JSON.parse(fileContents) as SafetySign;
  } catch {
    return null;
  }
}

export default async function SignDetailsPage({ params }: SignPageProps) {
  const { id } = await params;
  const sign = await getSafetySignById(id);

  if (!sign) {
    notFound();
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:grid-cols-[1.2fr_1fr]">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        <Image
          src={sign.image}
          alt={sign.name}
          width={1200}
          height={900}
          className="h-auto w-full object-cover"
          priority
        />
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{sign.name}</h1>
          <p className="mt-2 text-sm font-medium text-slate-600">
            {sign.category} / {sign.subcategory}
          </p>
          <p className="mt-1 text-sm text-slate-500">Code: {sign.code}</p>
        </div>

        <p className="text-base leading-7 text-slate-700">{sign.description}</p>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">Standards</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
            {sign.standards.map((standard) => (
              <li key={standard}>{standard}</li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Sizes and Materials</h2>
          {sign.sizes.map((sizeOption) => (
            <div key={sizeOption.size} className="rounded-lg border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900">{sizeOption.size}</h3>
              <div className="mt-3 space-y-3">
                {sizeOption.materials.map((materialOption) => (
                  <div key={materialOption.material}>
                    <p className="text-sm font-medium text-slate-700">{materialOption.material}</p>
                    <div className="mt-2 overflow-hidden rounded-md border border-slate-200">
                      <table className="w-full border-collapse text-left text-sm">
                        <thead className="bg-slate-100 text-slate-700">
                          <tr>
                            <th className="px-3 py-2 font-medium">Min Qty</th>
                            <th className="px-3 py-2 font-medium">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {materialOption.priceBreaks.map((priceBreak) => (
                            <tr key={priceBreak.minQty} className="border-t border-slate-200">
                              <td className="px-3 py-2">{priceBreak.minQty}</td>
                              <td className="px-3 py-2">GBP {priceBreak.price.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
