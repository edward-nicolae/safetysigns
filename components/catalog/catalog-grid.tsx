"use client";

import Image from "next/image";
import Link from "next/link";
import type { SignProduct } from "@/types/sign";
import { useCart } from "@/components/providers/cart-provider";

type Props = {
  signs: SignProduct[];
};

export function CatalogGrid({ signs }: Props) {
  const { items, setUnconfiguredQuantity, increaseQty, getConfiguration } = useCart();

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {signs.map((sign) => (
        <article
          key={sign.id}
          className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          <Link href={`/catalog/${sign.id}`} className="block">
            <div className="relative h-44 w-full bg-slate-100">
              <Image src={sign.image} alt={sign.title} fill className="object-cover transition hover:opacity-90" />
            </div>
          </Link>

          <div className="space-y-3 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
              {sign.category}
            </p>
            <Link href={`/catalog/${sign.id}`}>
              <h3 className="line-clamp-2 min-h-[3rem] text-base font-semibold text-slate-900 hover:text-brand-600">
                {sign.title}
              </h3>
            </Link>
            {typeof sign.description === "string" && sign.description && (
              <p className="line-clamp-3 text-sm text-slate-500">{sign.description}</p>
            )}
            <p className="text-lg font-bold text-slate-900">GBP {sign.price.toFixed(2)}</p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  const cartItem = { signId: sign.id, title: sign.title, price: sign.price, image: sign.image };
                  const unconfiguredLine = items.find(
                    (i) => i.signId === sign.id && !getConfiguration(i.lineId),
                  );
                  if (unconfiguredLine) {
                    increaseQty(unconfiguredLine.lineId);
                  } else {
                    setUnconfiguredQuantity(cartItem, 1);
                  }
                }}
                className="rounded-md bg-brand-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Add to Cart
              </button>
              <Link
                href={`/configurator/${sign.id}`}
                className="rounded-md border border-slate-300 px-3 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Configure
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
