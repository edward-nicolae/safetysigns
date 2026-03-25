"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/providers/cart-provider";

export default function CartPage() {
  const { items, increaseQty, decreaseQty, removeItem, subtotal, getConfiguration } = useCart();
  const [zoomItemId, setZoomItemId] = useState<string | null>(null);
  const zoomItem = zoomItemId ? items.find((item) => item.lineId === zoomItemId) ?? null : null;
  const zoomConfiguration = zoomItem ? getConfiguration(zoomItem.lineId) : null;

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
            {items.map((item) => {
              const configuration = getConfiguration(item.lineId);

              return (
                <article
                  key={item.lineId}
                  className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center"
                >
                  <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-md bg-slate-100 sm:w-32">
                    <Link href={`/catalog/${item.signId}`} className="block h-full w-full">
                      <Image src={item.image} alt={item.title} fill className="object-cover transition hover:opacity-80" />
                      {configuration ? (
                        <>
                          <div
                            className="absolute"
                            style={{
                              left: `${configuration.positionX}%`,
                              top: `${configuration.positionY}%`,
                              width: `${configuration.size}%`,
                              transform: "translate(-50%, -50%)",
                            }}
                          >
                            <Image
                              src={configuration.logoPath}
                              alt="Configured logo"
                              width={240}
                              height={240}
                              unoptimized
                              className="h-auto w-full object-contain drop-shadow"
                            />
                          </div>
                          <p
                            className="pointer-events-none absolute bottom-1 left-1/2 w-[92%] -translate-x-1/2 text-center text-[9px] font-semibold leading-tight"
                            style={{ color: configuration.color }}
                          >
                            {configuration.text || "SITE SAFETY"}
                          </p>
                        </>
                      ) : null}
                    </Link>
                  </div>

                  <div className="flex-1">
                    <Link href={`/catalog/${item.signId}`} className="hover:text-brand-600">
                      <h2 className="font-semibold text-slate-900">{item.title}</h2>
                    </Link>
                    <p className="mt-1 text-sm text-slate-600">GBP {item.price.toFixed(2)} each</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                      <Link
                        href={`/configurator/${item.signId}?lineId=${item.lineId}`}
                        className="font-medium text-brand-700 hover:text-brand-800 hover:underline"
                      >
                        Configure product
                      </Link>
                      {configuration ? (
                        <>
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                            Configured (preview shown)
                          </span>
                          <button
                            type="button"
                            onClick={() => setZoomItemId(item.lineId)}
                            className="rounded-full border border-slate-300 px-2 py-0.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            Zoom preview
                          </button>
                        </>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                          Not configured yet
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => decreaseQty(item.lineId)}
                      className="rounded-md border border-slate-300 px-3 py-1 text-sm"
                    >
                      -
                    </button>
                    <span className="min-w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => increaseQty(item.lineId)}
                      className="rounded-md border border-slate-300 px-3 py-1 text-sm"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.lineId)}
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </article>
              );
            })}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <p className="text-lg font-semibold text-slate-900">Subtotal: GBP {subtotal.toFixed(2)}</p>
            <p className="mt-2 text-sm text-slate-500">
              Each product can be configured individually from its own page or from the configurator link above.
            </p>
            <Link
              href="/checkout/success"
              className="mt-4 inline-flex rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Finalize Order
            </Link>
          </div>
        </>
      )}

      {zoomItem && zoomConfiguration ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close zoom preview"
            onClick={() => setZoomItemId(null)}
            className="absolute inset-0 bg-black/60"
          />

          <div className="relative z-10 w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Configured preview</p>
                <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{zoomItem.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setZoomItemId(null)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <div className="relative mx-auto aspect-[4/3] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              <Image src={zoomItem.image} alt={zoomItem.title} fill className="object-cover" />

              <div
                className="absolute"
                style={{
                  left: `${zoomConfiguration.positionX}%`,
                  top: `${zoomConfiguration.positionY}%`,
                  width: `${zoomConfiguration.size}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <Image
                  src={zoomConfiguration.logoPath}
                  alt="Configured logo"
                  width={500}
                  height={500}
                  unoptimized
                  className="h-auto w-full object-contain drop-shadow-md"
                />
              </div>

              <p
                className="pointer-events-none absolute bottom-4 left-1/2 w-[88%] -translate-x-1/2 text-center text-base font-semibold sm:text-lg"
                style={{ color: zoomConfiguration.color }}
              >
                {zoomConfiguration.text || "SITE SAFETY"}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
