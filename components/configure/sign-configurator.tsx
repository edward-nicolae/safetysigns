"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/components/providers/cart-provider";
import type { SignProduct } from "@/types/sign";

type Props = {
  sign: SignProduct;
  lineId?: string;
};

export function SignConfigurator({ sign, lineId }: Props) {
  const router = useRouter();
  const { getConfiguration, addConfiguredLine, updateConfiguredLine, removeConfiguration } = useCart();

  const existing = useMemo(
    () => (lineId ? getConfiguration(lineId) : null),
    [getConfiguration, lineId],
  );
  const previewRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [positionX, setPositionX] = useState(existing?.positionX ?? 50);
  const [positionY, setPositionY] = useState(existing?.positionY ?? 50);
  const [size, setSize] = useState(existing?.size ?? 26);
  const [text, setText] = useState(existing?.text ?? "SITE SAFETY");
  const [color, setColor] = useState(existing?.color ?? "#0f172a");
  const [logoUrl, setLogoUrl] = useState(existing?.logoPath ?? "");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!existing) {
      setPositionX(50);
      setPositionY(50);
      setSize(26);
      setText("SITE SAFETY");
      setColor("#0f172a");
      setLogoUrl("");
    } else {
      setPositionX(existing.positionX);
      setPositionY(existing.positionY);
      setSize(existing.size);
      setText(existing.text || "SITE SAFETY");
      setColor(existing.color || "#0f172a");
      setLogoUrl(existing.logoPath || "");
    }
  }, [existing, sign.id]);

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isValidType = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"].includes(
      file.type,
    );

    if (!isValidType) {
      setUploadError("Only PNG, JPG, SVG, and WEBP files are allowed.");
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append("logo", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        setUploadError("Upload failed. Please try again.");
        setIsUploading(false);
        return;
      }

      const payload = (await response.json()) as { url: string };
      setLogoUrl(payload.url);
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const updatePositionFromPointer = (clientX: number, clientY: number) => {
    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect) return;

    const nextX = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const nextY = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));

    setPositionX(Number(nextX.toFixed(2)));
    setPositionY(Number(nextY.toFixed(2)));
  };

  const onPreviewPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    updatePositionFromPointer(event.clientX, event.clientY);
  };

  const onPreviewPointerUp = () => {
    setIsDragging(false);
  };

  const onSaveAndContinue = () => {
    if (!logoUrl) return;

    const configData = {
      logoPath: logoUrl,
      positionX,
      positionY,
      size,
      text,
      color,
    };

    if (lineId) {
      // Editing an existing configured line — update config only, no new cart item
      updateConfiguredLine(lineId, sign.id, configData);
    } else {
      // Creating a new configured line
      addConfiguredLine(
        { signId: sign.id, title: sign.title, price: sign.price, image: sign.image },
        configData,
      );
    }

    router.push("/cart");
  };

  const onResetToStandard = () => {
    const confirmed = window.confirm(
      "Reset this product to the standard sign? This will remove the saved logo and configuration.",
    );

    if (!confirmed) {
      return;
    }

    if (lineId) {
      removeConfiguration(lineId);
    }

    setLogoUrl("");
    setText("SITE SAFETY");
    setColor("#0f172a");
    setPositionX(50);
    setPositionY(50);
    setSize(26);

    router.push("/cart");
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Configure Sign
        </h1>
        <p className="mt-2 text-slate-600">{sign.title}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div
            ref={previewRef}
            onPointerMove={onPreviewPointerMove}
            onPointerUp={onPreviewPointerUp}
            onPointerLeave={onPreviewPointerUp}
            className="relative mx-auto aspect-[4/3] w-full max-w-2xl overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
          >
            <Image src={sign.image} alt={sign.title} fill className="object-cover" priority />

            {logoUrl ? (
              <div
                onPointerDown={(event) => {
                  setIsDragging(true);
                  updatePositionFromPointer(event.clientX, event.clientY);
                }}
                className="absolute"
                style={{
                  left: `${positionX}%`,
                  top: `${positionY}%`,
                  width: `${size}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <Image
                  src={logoUrl}
                  alt="Uploaded logo"
                  width={400}
                  height={400}
                  unoptimized
                  className="h-auto w-full cursor-move touch-none object-contain drop-shadow-md"
                />
              </div>
            ) : null}

            <p
              className="pointer-events-none absolute bottom-4 left-1/2 w-[85%] -translate-x-1/2 text-center text-base font-semibold"
              style={{ color }}
            >
              {text || "SITE SAFETY"}
            </p>
          </div>
        </div>

        <aside className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">Product logo</p>
                <p className="mt-1 text-sm text-slate-500">
                  Upload a logo specifically for this product configuration.
                </p>
              </div>
              {logoUrl ? (
                <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                  Uploaded
                </span>
              ) : null}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.svg,.webp"
              onChange={onFileChange}
              className="hidden"
            />

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                {logoUrl ? "Replace Logo" : "Upload Logo"}
              </button>

              {logoUrl ? (
                <button
                  type="button"
                  onClick={() => setLogoUrl("")}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Remove Logo
                </button>
              ) : null}

              <button
                type="button"
                onClick={onResetToStandard}
                className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
              >
                Reset to Standard Sign
              </button>
            </div>

            {uploadError ? <p className="text-sm text-red-600">{uploadError}</p> : null}
            {isUploading ? <p className="text-sm text-slate-500">Uploading logo...</p> : null}
          </div>

          <div className="space-y-3">
            <label htmlFor="config-text" className="block text-sm font-semibold text-slate-800">
              Sign Text
            </label>
            <input
              id="config-text"
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter custom text"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800"
            />
          </div>

          <div className="space-y-3">
            <label htmlFor="config-color" className="block text-sm font-semibold text-slate-800">
              Text Color
            </label>
            <div className="flex items-center gap-3">
              <input
                id="config-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-12 rounded border border-slate-300"
              />
              <span className="text-sm text-slate-600">{color}</span>
            </div>
          </div>

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
            disabled={!logoUrl || isUploading}
            className="w-full rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Save Configuration and Go to Cart
          </button>

          <Link
            href="/cart"
            className="block text-center text-sm font-semibold text-slate-500 hover:text-slate-700"
          >
            Back to Cart
          </Link>
        </aside>
      </div>
    </section>
  );
}
