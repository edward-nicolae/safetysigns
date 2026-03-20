"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/providers/cart-provider";

export default function CartPage() {
  const { items, increaseQty, decreaseQty, removeItem, subtotal } = useCart();

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Cart</h1>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-slate-600">Your cart is empty.</p>
          <Link
            href="/catalog"
            className="mt-4 inline-flex rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Go to Catalog
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {items.map((item) => (
              <article
                key={item.id}
                className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center"
              >
                <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-md bg-slate-100 sm:w-32">
                  <Image src={item.image} alt={item.title} fill className="object-cover" />
                </div>

                <div className="flex-1">
                  <h2 className="font-semibold text-slate-900">{item.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">GBP {item.price.toFixed(2)} each</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => decreaseQty(item.id)}
                    className="rounded-md border border-slate-300 px-3 py-1 text-sm"
                  >
                    -
                  </button>
                  <span className="min-w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button
                    onClick={() => increaseQty(item.id)}
                    className="rounded-md border border-slate-300 px-3 py-1 text-sm"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </article>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <p className="text-lg font-semibold text-slate-900">Subtotal: GBP {subtotal.toFixed(2)}</p>
            <Link
              href="/upload"
              className="mt-4 inline-flex rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Continue to Logo Upload
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
