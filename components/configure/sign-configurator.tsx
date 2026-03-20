"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/providers/cart-provider";
import type { SignProduct } from "@/types/sign";

type Props = {
  sign: SignProduct;
};

export function SignConfigurator({ sign }: Props) {
  const router = useRouter();
  const {
    uploadedLogoPath,
    getConfiguration,
    saveConfiguration,
    addItem,
  } = useCart();

  const existing = useMemo(() => getConfiguration(sign.id), [getConfiguration, sign.id]);

  const [positionX, setPositionX] = useState(existing?.positionX ?? 50);
  const [positionY, setPositionY] = useState(existing?.positionY ?? 50);
  const [size, setSize] = useState(existing?.size ?? 26);

  useEffect(() => {
    if (!existing) {
      setPositionX(50);
      setPositionY(50);
      setSize(26);
      return;
    }

    setPositionX(existing.positionX);
    setPositionY(existing.positionY);
    setSize(existing.size);
  }, [existing]);

  const onSaveAndContinue = () => {
    if (!uploadedLogoPath) return;

    saveConfiguration({
      signId: sign.id,
      logoPath: uploadedLogoPath,
      positionX,
      positionY,
      size,
    });

    addItem({
      id: sign.id,
      title: sign.title,
      price: sign.price,
      image: sign.image,
    });

    router.push("/configure/next");
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Configure Sign
        </h1>
        <p className="mt-2 text-slate-600">{sign.title}</p>
      </div>

      {!uploadedLogoPath ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <p className="font-semibold">Upload a logo before configuring this sign.</p>
          <Link
            href="/upload"
            className="mt-3 inline-flex rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Go to Logo Upload
          </Link>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="relative mx-auto aspect-[4/3] w-full max-w-2xl overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            <Image src={sign.image} alt={sign.title} fill className="object-cover" priority />

            {uploadedLogoPath ? (
              <div
                className="absolute"
                style={{
                  left: `${positionX}%`,
                  top: `${positionY}%`,
                  width: `${size}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <Image
                  src={uploadedLogoPath}
                  alt="Uploaded logo"
                  width={400}
                  height={400}
                  unoptimized
                  className="h-auto w-full object-contain drop-shadow-md"
                />
              </div>
            ) : null}
          </div>
        </div>

        <aside className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="space-y-3">
            <label htmlFor="slider-x" className="block text-sm font-semibold text-slate-800">
              X Position: {positionX}%
            </label>
            <input
              id="slider-x"
              type="range"
              min={0}
              max={100}
              value={positionX}
              onChange={(e) => setPositionX(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <label htmlFor="slider-y" className="block text-sm font-semibold text-slate-800">
              Y Position: {positionY}%
            </label>
            <input
              id="slider-y"
              type="range"
              min={0}
              max={100}
              value={positionY}
              onChange={(e) => setPositionY(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <label htmlFor="slider-size" className="block text-sm font-semibold text-slate-800">
              Logo Size: {size}%
            </label>
            <input
              id="slider-size"
              type="range"
              min={10}
              max={60}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-800">Quick Alignment</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setPositionX(15)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Left
              </button>
              <button
                onClick={() => setPositionX(50)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Center
              </button>
              <button
                onClick={() => setPositionX(85)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Right
              </button>
            </div>
          </div>

          <button
            onClick={onSaveAndContinue}
            disabled={!uploadedLogoPath}
            className="w-full rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Save Configuration & Continue
          </button>
        </aside>
      </div>
    </section>
  );
}
