"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/components/providers/cart-provider";

export default function CheckoutSuccessPage() {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
    try {
      localStorage.removeItem("safetysigns-order-configuration");
    } catch {
      // Ignore storage cleanup failures.
    }
  }, [clearCart]);

  return (
    <section className="mx-auto max-w-2xl space-y-6 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">
        ✓
      </div>

      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Thank you for your order
        </h1>
        <p className="text-slate-600">
          Your order has been recorded successfully. For now, this page acts as the payment success step.
        </p>
        <p className="text-sm text-slate-500">
          We assume the payment was completed and the cart has been cleared.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/catalog"
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Continue Shopping
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Back to Home
        </Link>
      </div>
    </section>
  );
}