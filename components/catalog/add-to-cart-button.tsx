"use client";

import { useEffect, useState } from "react";
import type { SignProduct } from "@/types/sign";
import { useCart } from "@/components/providers/cart-provider";

export function AddToCartButton({ sign }: { sign: SignProduct }) {
  const { items, increaseQty, decreaseQty, setUnconfiguredQuantity, getConfiguration } = useCart();

  // Find the single unconfigured line for this product (if any)
  const unconfiguredLine = items.find(
    (i) => i.signId === sign.id && !getConfiguration(i.lineId),
  );
  const lineId = unconfiguredLine?.lineId;
  const currentQuantity = unconfiguredLine?.quantity ?? 0;

  const [inputQuantity, setInputQuantity] = useState(String(currentQuantity));

  useEffect(() => {
    setInputQuantity(String(currentQuantity));
  }, [currentQuantity]);

  const cartItem = {
    signId: sign.id,
    title: sign.title,
    price: sign.price,
    image: sign.image,
  };

  const applyQuantity = () => {
    const parsedQuantity = Number.parseInt(inputQuantity, 10);

    if (Number.isNaN(parsedQuantity)) {
      setInputQuantity(String(currentQuantity));
      return;
    }

    setUnconfiguredQuantity(cartItem, parsedQuantity);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">Quantity in cart</p>
          <p className="text-sm text-slate-500">
            {currentQuantity === 0 ? "This product is not in the cart yet." : `${currentQuantity} buc. in cos`}
          </p>
        </div>
        <p className="text-lg font-bold text-slate-900">GBP {sign.price.toFixed(2)}</p>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center overflow-hidden rounded-xl border border-slate-300">
          <button
            type="button"
            onClick={() => lineId && decreaseQty(lineId)}
            disabled={currentQuantity === 0}
            className="px-4 py-3 text-lg font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            -
          </button>
          <span className="min-w-16 border-x border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-900">
            {currentQuantity}
          </span>
          <button
            type="button"
            onClick={() =>
              lineId ? increaseQty(lineId) : setUnconfiguredQuantity(cartItem, 1)
            }
            className="px-4 py-3 text-lg font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            +
          </button>
        </div>

        <div className="flex flex-1 items-center gap-2">
          <input
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={inputQuantity}
            onChange={(event) => setInputQuantity(event.target.value)}
            onBlur={applyQuantity}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                applyQuantity();
              }
            }}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-200"
            placeholder="Introdu cantitatea"
          />
          <button
            type="button"
            onClick={applyQuantity}
            className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Seteaza
          </button>
        </div>
      </div>
    </div>
  );
}
