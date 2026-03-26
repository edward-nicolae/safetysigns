"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/components/providers/cart-provider";
import type { ConfiguratorSettings } from "@/lib/configurator-config";
import type { SignProduct } from "@/types/sign";

type Orientation = "portrait" | "landscape" | "square";

const STEPS = ["Material", "Orientation", "Size", "Symbol", "Custom Text"];

function calcUnitPrice(base: number, matMul: number, areaMul: number): number {
  return Math.round(base * matMul * areaMul * 100) / 100;
}

function getActiveTier(qty: number, tiers: ConfiguratorSettings["qtyTiers"]) {
  return tiers.find((tier) => qty >= tier.min && (tier.max === null || qty <= tier.max)) ?? tiers[0];
}

function applyDiscount(price: number, pct: number): number {
  return Math.round(price * ((100 - pct) / 100) * 100) / 100;
}

function parseHash(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const out: Record<string, string> = {};
  for (const [key, value] of new URLSearchParams(window.location.hash.slice(1))) {
    out[key] = value;
  }
  return out;
}

function StepIndicator({ current }: { current: number }) {
  return (
    <nav aria-label="Progress" className="mb-6">
      <ol className="flex items-start">
        {STEPS.map((label, index) => {
          const number = index + 1;
          const done = number < current;
          const active = number === current;
          const isLast = index === STEPS.length - 1;

          return (
            <li key={label} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {index > 0 && (
                  <div className={`h-0.5 flex-1 ${done || active ? "bg-brand-500" : "bg-slate-200"}`} />
                )}
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                    done
                      ? "border-brand-600 bg-brand-600 text-white"
                      : active
                        ? "border-brand-600 bg-white text-brand-600"
                        : "border-slate-200 bg-white text-slate-400"
                  }`}
                >
                  {done ? "✓" : number}
                </span>
                {!isLast && (
                  <div className={`h-0.5 flex-1 ${done ? "bg-brand-500" : "bg-slate-200"}`} />
                )}
              </div>
              <span
                className={`mt-1 hidden text-[11px] font-medium sm:block ${
                  active ? "text-brand-600" : done ? "text-slate-500" : "text-slate-400"
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function OrientationCard({
  value,
  selected,
  onClick,
}: {
  value: Orientation;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-28 flex-col items-center gap-2 rounded-xl border-2 p-4 transition ${
        selected
          ? "border-brand-600 bg-brand-50 text-brand-700"
          : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      {value === "portrait" && <div className="h-10 w-7 rounded border-2 border-current bg-current/10" />}
      {value === "landscape" && <div className="h-7 w-10 rounded border-2 border-current bg-current/10" />}
      {value === "square" && <div className="h-9 w-9 rounded border-2 border-current bg-current/10" />}
      <span className="text-sm font-semibold capitalize">{value}</span>
    </button>
  );
}

type Props = {
  sign: SignProduct;
  lineId?: string;
  settings: ConfiguratorSettings;
};

export function SignConfigurator({ sign, lineId, settings }: Props) {
  const router = useRouter();
  const { getConfiguration, addConfiguredLine, updateConfiguredLine, removeConfiguration } = useCart();

  const existing = useMemo(() => (lineId ? getConfiguration(lineId) : null), [getConfiguration, lineId]);

  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [materialId, setMaterialId] = useState("");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [sizeId, setSizeId] = useState("");
  const [text, setText] = useState("SAFETY NOTICE");
  const [schemeId, setSchemeId] = useState(settings.colorSchemes[0]?.id ?? "white");
  const [logoUrl, setLogoUrl] = useState("");
  const [positionX, setPositionX] = useState(50);
  const [positionY, setPositionY] = useState(50);
  const [logoSize, setLogoSize] = useState(26);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showText, setShowText] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const material = settings.materials.find((item) => item.id === materialId) ?? null;
  const signSize = settings.sizes.find((item) => item.id === sizeId) ?? null;
  const scheme = settings.colorSchemes.find((item) => item.id === schemeId) ?? settings.colorSchemes[0];
  const sizesForOrientation = useMemo(
    () => settings.sizes.filter((item) => item.orientation === orientation),
    [orientation, settings.sizes],
  );

  const unitPrice = useMemo(() => {
    if (!material || !signSize) return null;
    return calcUnitPrice(sign.price, material.priceMultiplier, signSize.areaMultiplier);
  }, [material, sign.price, signSize]);

  const activeTier = getActiveTier(quantity, settings.qtyTiers);
  const tierUnitPrice = unitPrice !== null ? applyDiscount(unitPrice, activeTier.discountPct) : null;
  const previewTotal = tierUnitPrice !== null ? Math.round(tierUnitPrice * quantity * 100) / 100 : null;

  const previewAspect =
    orientation === "landscape"
      ? "aspect-[4/3]"
      : orientation === "square"
        ? "aspect-square"
        : "aspect-[3/4]";

  useEffect(() => {
    if (!existing) return;
    const ext = existing as Record<string, unknown>;
    if (typeof ext.materialId === "string") setMaterialId(ext.materialId);
    if (ext.orientation === "portrait" || ext.orientation === "landscape" || ext.orientation === "square") {
      setOrientation(ext.orientation);
    }
    if (typeof ext.sizeId === "string") setSizeId(ext.sizeId);
    setText(existing.text || "SAFETY NOTICE");
    setShowText(!!existing.text);
    if (typeof ext.schemeId === "string") setSchemeId(ext.schemeId);
    setLogoUrl(existing.logoPath || "");
    setPositionX(existing.positionX);
    setPositionY(existing.positionY);
    setLogoSize(existing.size);
    if (typeof ext.materialId === "string" && typeof ext.sizeId === "string") {
      setStep(5);
    }
  }, [existing]);

  useEffect(() => {
    const hash = parseHash();
    if (hash.material) setMaterialId(hash.material);
    if (hash.orientation === "portrait" || hash.orientation === "landscape" || hash.orientation === "square") {
      setOrientation(hash.orientation);
    }
    if (hash.sizeId) setSizeId(hash.sizeId);
    if (hash.text) {
      setText(hash.text);
      setShowText(true);
    }
    if (hash.scheme) setSchemeId(hash.scheme);
    if (hash.qty) setQuantity(Math.max(1, Number(hash.qty)));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (materialId) params.set("material", materialId);
    if (orientation) params.set("orientation", orientation);
    if (sizeId) params.set("sizeId", sizeId);
    if (showText && text && text !== "SAFETY NOTICE") params.set("text", text);
    if (schemeId !== (settings.colorSchemes[0]?.id ?? "white")) params.set("scheme", schemeId);
    if (quantity !== 1) params.set("qty", String(quantity));
    const nextHash = params.toString();
    window.history.replaceState(null, "", nextHash ? `#${nextHash}` : window.location.pathname);
  }, [materialId, orientation, quantity, schemeId, settings.colorSchemes, showText, sizeId, text]);

  const updatePositionFromPointer = useCallback((clientX: number, clientY: number) => {
    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect) return;
    const nextX = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const nextY = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    setPositionX(Number(nextX.toFixed(2)));
    setPositionY(Number(nextY.toFixed(2)));
  }, []);

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const isValidType = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"].includes(file.type);
    if (!isValidType) {
      setUploadError("Only PNG, JPG, SVG, and WEBP files are allowed.");
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append("logo", file);

    try {
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      if (!response.ok) {
        setUploadError("Upload failed. Please try again.");
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

  const onReset = () => {
    const confirmed = window.confirm("Reset this product to the standard sign? This will remove all configuration.");
    if (!confirmed) return;
    if (lineId) removeConfiguration(lineId);
    router.push("/cart");
  };

  const canAddToCart = !!materialId && !!sizeId;

  const onAddToCart = () => {
    if (!canAddToCart || !material || !signSize || unitPrice === null || !scheme) return;

    const configData = {
      logoPath: logoUrl,
      positionX,
      positionY,
      size: logoSize,
      text: showText ? text : "",
      color: scheme.fg,
      materialId,
      materialLabel: material.label,
      orientation,
      sizeId,
      width: signSize.width,
      height: signSize.height,
      schemeId,
      schemeColor: scheme.bg,
    };

    if (lineId) {
      updateConfiguredLine(lineId, sign.id, configData);
    } else {
      addConfiguredLine(
        {
          signId: sign.id,
          title: sign.title,
          price: tierUnitPrice ?? unitPrice,
          image: sign.image,
        },
        configData,
        quantity,
      );
    }

    router.push("/cart");
  };

  const goNext = () => setStep((current) => Math.min(5, current + 1));
  const goPrev = () => setStep((current) => Math.max(1, current - 1));

  const canProceed: Record<number, boolean> = {
    1: !!materialId,
    2: !!orientation,
    3: !!sizeId,
    4: true,
    5: true,
  };

  const minPriceFrom = (multiplier: number) =>
    (sign.price * multiplier * Math.min(...settings.sizes.map((item) => item.areaMultiplier))).toFixed(2);

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Configure Your Sign</h1>
        <p className="mt-1 text-slate-500">{sign.title}</p>
      </div>

      <StepIndicator current={step} />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-h-80 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">1. Select Material</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {settings.materials.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMaterialId(item.id)}
                    className={`relative rounded-xl border-2 p-4 text-left transition ${
                      materialId === item.id
                        ? "border-brand-600 bg-brand-50 ring-1 ring-brand-400"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {item.popular && (
                      <span className="absolute right-3 top-3 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        Popular
                      </span>
                    )}
                    <p className="pr-14 font-semibold text-slate-900">{item.label}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                    <p className="mt-2 text-xs font-bold text-slate-700">from £{minPriceFrom(item.priceMultiplier)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">2. Choose Orientation</h2>
              <div className="flex flex-wrap gap-4">
                {(["portrait", "landscape", "square"] as Orientation[]).map((item) => (
                  <OrientationCard
                    key={item}
                    value={item}
                    selected={orientation === item}
                    onClick={() => {
                      setOrientation(item);
                      setSizeId("");
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">3. Select Size</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {sizesForOrientation.map((item) => {
                  const price = material
                    ? calcUnitPrice(sign.price, material.priceMultiplier, item.areaMultiplier)
                    : null;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSizeId(item.id)}
                      className={`rounded-xl border-2 p-3 text-center transition ${
                        sizeId === item.id ? "border-brand-600 bg-brand-50" : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-900">{item.width} × {item.height} mm</p>
                      {price !== null && <p className="mt-1 text-xs font-bold text-slate-700">£{price.toFixed(2)}</p>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">4. Symbol</h2>
              <div className="flex items-start gap-4">
                <div className={`relative w-28 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 ${previewAspect}`}>
                  <Image src={sign.image} alt={sign.title} fill className="object-cover" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-slate-900">{sign.title}</p>
                  <p className="text-sm capitalize text-slate-500">{sign.category}</p>
                  {material && <p className="text-sm text-slate-600"><span className="font-medium">Material:</span> {material.label}</p>}
                  {signSize && <p className="text-sm text-slate-600"><span className="font-medium">Size:</span> {signSize.width} × {signSize.height} mm</p>}
                </div>
              </div>
              <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                Your symbol comes from the selected catalog sign. Continue to add custom text or a company logo.
              </p>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-900">5. Edit Custom Text</h2>

              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Custom text on sign</p>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showText}
                  onClick={() => setShowText((value) => !value)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${showText ? "bg-brand-600" : "bg-slate-300"}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${showText ? "translate-x-5" : "translate-x-0"}`}
                  />
                </button>
              </div>

              {showText && (
                <>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-700">Color Scheme</p>
                    <div className="flex flex-wrap gap-2">
                      {settings.colorSchemes.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          title={item.label}
                          onClick={() => setSchemeId(item.id)}
                          className={`h-9 w-9 rounded-full border-2 transition ${
                            schemeId === item.id ? "scale-110 border-brand-600 shadow-md" : "border-slate-300 hover:scale-105"
                          }`}
                          style={{ backgroundColor: item.bg }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="cfg-text" className="block text-sm font-semibold text-slate-700">
                      Sign Text
                    </label>
                    <input
                      id="cfg-text"
                      type="text"
                      value={text}
                      onChange={(event) => setText(event.target.value)}
                      placeholder="e.g. SAFETY NOTICE"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-700">Company Logo <span className="font-normal text-slate-400">(optional)</span></p>
                  {logoUrl ? (
                    <button
                      type="button"
                      onClick={() => setLogoUrl("")}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      No custom logo
                    </button>
                  ) : (
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Standard sign only
                    </span>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.svg,.webp"
                  onChange={onFileChange}
                  className="hidden"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                  >
                    {logoUrl ? "Replace Logo" : "Upload Logo"}
                  </button>
                </div>

                {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
                {isUploading && <p className="text-xs text-slate-500">Uploading...</p>}

                {logoUrl && (
                  <div className="mt-2 space-y-2 border-t border-slate-200 pt-3">
                    <p className="text-xs font-medium text-slate-600">Logo position &amp; size</p>
                    {[
                      { id: "x", label: "X Position", value: positionX, min: 0, max: 100, set: setPositionX },
                      { id: "y", label: "Y Position", value: positionY, min: 0, max: 100, set: setPositionY },
                      { id: "size", label: "Logo Size", value: logoSize, min: 10, max: 60, set: setLogoSize },
                    ].map((slider) => (
                      <div key={slider.id} className="flex items-center gap-2">
                        <span className="w-20 shrink-0 text-xs text-slate-500">{slider.label}</span>
                        <input
                          type="range"
                          min={slider.min}
                          max={slider.max}
                          value={slider.value}
                          onChange={(event) => slider.set(Number(event.target.value))}
                          className="flex-1"
                        />
                        <span className="w-8 text-right text-xs text-slate-500">{slider.value}%</span>
                      </div>
                    ))}
                    <div className="flex gap-2 pt-1">
                      {[
                        { label: "Left", x: 15 },
                        { label: "Centre", x: 50 },
                        { label: "Right", x: 85 },
                      ].map((action) => (
                        <button
                          key={action.label}
                          type="button"
                          onClick={() => setPositionX(action.x)}
                          className="flex-1 rounded border border-slate-300 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={goPrev}
                className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                ← Back
              </button>
            ) : (
              <div />
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={!canProceed[step]}
                className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Continue →
              </button>
            ) : (
              <button
                type="button"
                onClick={onAddToCart}
                disabled={!canAddToCart}
                className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {lineId ? "Update Cart" : "Add to Basket"}
              </button>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Live Preview</p>
            <div
              ref={previewRef}
              onPointerMove={(event) => {
                if (isDragging) updatePositionFromPointer(event.clientX, event.clientY);
              }}
              onPointerUp={() => setIsDragging(false)}
              onPointerLeave={() => setIsDragging(false)}
              className={`relative mx-auto max-w-[180px] overflow-hidden rounded-lg border border-slate-200 bg-slate-100 ${previewAspect}`}
            >
              <Image src={sign.image} alt={sign.title} fill className="object-cover" priority />

              {logoUrl && (
                <div
                  onPointerDown={(event) => {
                    setIsDragging(true);
                    updatePositionFromPointer(event.clientX, event.clientY);
                  }}
                  className="absolute"
                  style={{
                    left: `${positionX}%`,
                    top: `${positionY}%`,
                    width: `${logoSize}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <Image
                    src={logoUrl}
                    alt="Logo"
                    width={400}
                    height={400}
                    unoptimized
                    className="h-auto w-full cursor-move touch-none object-contain drop-shadow-md"
                  />
                </div>
              )}

              {showText && text && scheme && (
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 px-2 py-1" style={{ backgroundColor: `${scheme.bg}ee` }}>
                  <p className="text-center text-[9px] font-bold leading-tight" style={{ color: scheme.fg }}>
                    {text}
                  </p>
                </div>
              )}
            </div>

            {signSize && (
              <p className="mt-2 text-center text-xs text-slate-500">{signSize.width} mm × {signSize.height} mm</p>
            )}
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-700">Quantity</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setQuantity((current) => Math.max(1, current - 10))}
                  className="h-8 w-10 rounded border border-slate-300 text-xs font-medium hover:bg-slate-100"
                >
                  −10
                </button>
                <span className="min-w-[2.5rem] rounded border border-slate-200 bg-slate-50 py-1 text-center text-sm font-bold text-slate-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((current) => current + 10)}
                  className="h-8 w-10 rounded border border-slate-300 text-xs font-medium hover:bg-slate-100"
                >
                  +10
                </button>
              </div>
            </div>

            {tierUnitPrice !== null && previewTotal !== null ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Unit price</span>
                  <span className="font-semibold text-slate-900">£{tierUnitPrice.toFixed(2)}</span>
                </div>
                {activeTier.discountPct > 0 && (
                  <div className="flex items-center justify-between text-green-700">
                    <span className="text-xs">Volume discount</span>
                    <span className="text-xs font-semibold">−{activeTier.discountPct}%</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                  <span className="text-sm font-semibold text-slate-700">Preview Total</span>
                  <span className="text-xl font-bold text-slate-900">£{previewTotal.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-slate-400">Prices exclude VAT at 20%</p>
              </>
            ) : (
              <p className="text-center text-xs text-slate-400">Select material &amp; size to see pricing</p>
            )}

            {unitPrice !== null && (
              <table className="w-full border-t border-slate-100 text-xs">
                <tbody>
                  {settings.qtyTiers.map((tier) => {
                    const discountedPrice = applyDiscount(unitPrice, tier.discountPct);
                    const tierIsActive = quantity >= tier.min && (tier.max === null || quantity <= tier.max);
                    const label =
                      tier.max === null
                        ? `${tier.min}+`
                        : tier.min === tier.max
                          ? `${tier.min}`
                          : `${tier.min} – ${tier.max}`;

                    return (
                      <tr key={`${tier.min}-${tier.max ?? "plus"}`} className={tierIsActive ? "font-semibold text-brand-700" : "text-slate-600"}>
                        <td className="py-0.5 pl-1">{label}</td>
                        <td className="py-0.5 pr-1 text-right">£{discountedPrice.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {(material || signSize) && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Summary</p>
              <dl className="space-y-1 text-sm">
                {material && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Material</dt>
                    <dd className="text-right font-medium text-slate-800">{material.label}</dd>
                  </div>
                )}
                {signSize && (
                  <>
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500">Orientation</dt>
                      <dd className="font-medium capitalize text-slate-800">{orientation}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500">Size</dt>
                      <dd className="font-medium text-slate-800">{signSize.width} × {signSize.height} mm</dd>
                    </div>
                  </>
                )}
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Compliance</dt>
                  <dd className="font-medium text-slate-800">ISO 7010:2012</dd>
                </div>
              </dl>
            </div>
          )}

          {step === 5 && (
            <button
              type="button"
              onClick={onAddToCart}
              disabled={!canAddToCart}
              className="w-full rounded-xl bg-brand-600 py-3 text-sm font-bold text-white shadow hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {lineId ? "Update Cart" : previewTotal !== null ? `Add to Basket — £${previewTotal.toFixed(2)}` : "Add to Basket"}
            </button>
          )}

          {lineId && (
            <button
              type="button"
              onClick={onReset}
              className="w-full rounded-xl border border-red-200 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              Reset to Standard Sign
            </button>
          )}

          <Link href="/cart" className="block text-center text-xs text-slate-400 hover:text-slate-600">
            Back to Cart
          </Link>
        </aside>
      </div>
    </section>
  );
}
