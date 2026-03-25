"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type OrderConfiguration = {
  signId: string;
  signImageUrl: string;
  logoUrl: string;
  text: string;
  size: number;
  color: string;
  signTitle: string;
  positionX: number;
  positionY: number;
};

export default function OrderPage() {
  const router = useRouter();
  const [configuration, setConfiguration] = useState<OrderConfiguration | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("safetysigns-order-configuration");
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as OrderConfiguration;
      setConfiguration(parsed);
    } catch {
      setConfiguration(null);
    }
  }, []);

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Order Review</h1>

      {!configuration ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <p className="font-semibold">No saved configuration was found.</p>
          <p className="mt-2 text-sm">Configure a sign first, then continue to order.</p>
          <div className="mt-4 flex gap-3">
            <Link
              href="/catalog"
              className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
            >
              Browse Catalog
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Configured Sign Preview</h2>
            <div className="relative mt-4 aspect-[4/3] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
              <Image
                src={configuration.signImageUrl}
                alt={configuration.signTitle}
                fill
                className="object-cover"
              />
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
                  src={configuration.logoUrl}
                  alt="Configured logo"
                  width={400}
                  height={400}
                  unoptimized
                  className="h-auto w-full object-contain drop-shadow-md"
                />
              </div>
              <p
                className="pointer-events-none absolute bottom-4 left-1/2 w-[85%] -translate-x-1/2 text-center text-base font-semibold"
                style={{ color: configuration.color }}
              >
                {configuration.text || "SITE SAFETY"}
              </p>
            </div>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Order Details</h2>
            <dl className="mt-4 space-y-3 text-sm text-slate-700">
              <div className="flex justify-between gap-4">
                <dt className="font-medium">Sign</dt>
                <dd className="text-right">{configuration.signTitle}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="font-medium">Text</dt>
                <dd>{configuration.text || "(empty)"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="font-medium">Size</dt>
                <dd>{configuration.size}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="font-medium">Color</dt>
                <dd>{configuration.color}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="font-medium">Position X</dt>
                <dd>{configuration.positionX}%</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="font-medium">Position Y</dt>
                <dd>{configuration.positionY}%</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="font-medium">Logo URL</dt>
                <dd className="truncate text-right">{configuration.logoUrl}</dd>
              </div>
            </dl>

            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              <Link
                href={`/configurator/${configuration.signId}`}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Back to Configurator
              </Link>
              <button
                onClick={() => window.alert("PDF generation will be available in the next step.")}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Generate PDF
              </button>
              <button
                onClick={() => {
                  window.alert("Order placed successfully.");
                  router.push("/");
                }}
                className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Place Order
              </button>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}
