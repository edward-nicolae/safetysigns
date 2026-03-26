"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { SignCategory, SignProduct } from "@/types/sign";

const CATEGORIES: SignCategory[] = [
  "Mandatory",
  "Warning",
  "Prohibition",
  "Fire Safety",
  "Information",
];

type ImageOverrides = Record<string, string>;
type DataOverrides = Record<string, Record<string, unknown>>;
type UploadState = "idle" | "uploading" | "success" | "error";
type SaveState = "idle" | "saving" | "saved" | "error";

interface CustomField {
  key: string;
  value: string;
}

interface EditState {
  title: string;
  category: SignCategory;
  price: string;
  description: string;
  customFields: CustomField[];
  saveStatus: SaveState;
  saveMessage: string;
}

interface CreateState extends EditState {
  image: string;
}

const CATEGORY_COLOR: Record<string, string> = {
  Mandatory: "bg-blue-100 text-blue-800",
  Warning: "bg-amber-100 text-amber-800",
  Prohibition: "bg-red-100 text-red-800",
  "Fire Safety": "bg-orange-100 text-orange-800",
  Information: "bg-green-100 text-green-800",
};

function buildCreateState(): CreateState {
  return {
    title: "",
    category: "Mandatory",
    price: "0",
    description: "",
    image: "/images/sign-01.svg",
    customFields: [],
    saveStatus: "idle",
    saveMessage: "",
  };
}

function slugifyProductTitle(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function generateUniqueIdFromTitle(title: string, existingIds: Set<string>): string {
  const base = slugifyProductTitle(title) || "product";
  let candidate = base;
  let index = 2;

  while (existingIds.has(candidate)) {
    candidate = `${base}-${index}`;
    index += 1;
  }

  return candidate;
}

function buildEditState(sign: SignProduct, dataOverrides: DataOverrides): EditState {
  const merged = {
    ...sign,
    ...(dataOverrides[sign.id] ?? {}),
  } as Record<string, unknown>;
  const reserved = new Set(["id", "title", "category", "price", "image", "description"]);

  return {
    title: typeof merged.title === "string" ? merged.title : sign.title,
    category: (merged.category as SignCategory | undefined) ?? sign.category,
    price: typeof merged.price === "number" ? String(merged.price) : String(sign.price),
    description:
      typeof merged.description === "string"
        ? merged.description
        : typeof sign.description === "string"
          ? sign.description
          : "",
    customFields: Object.entries(merged)
      .filter(([key, value]) => !reserved.has(key) && value !== undefined && value !== "")
      .map(([key, value]) => ({ key, value: String(value) })),
    saveStatus: "idle",
    saveMessage: "",
  };
}

function buildPayloadFromState(state: EditState | CreateState, fallbackPrice = 0) {
  const payload: Record<string, unknown> = {
    title: state.title.trim(),
    category: state.category,
    price: parseFloat(state.price) || fallbackPrice,
    description: state.description.trim(),
  };

  if ("image" in state) {
    payload.image = state.image.trim() || "/images/sign-01.svg";
  }

  for (const { key, value } of state.customFields) {
    if (key.trim()) {
      payload[key.trim()] = value;
    }
  }

  return payload;
}

export default function AdminPage() {
  const [signs, setSigns] = useState<SignProduct[]>([]);
  const [imgOverrides, setImgOverrides] = useState<ImageOverrides>({});
  const [dataOverrides, setDataOverrides] = useState<DataOverrides>({});
  const [imgRowState, setImgRowState] = useState<
    Record<string, { status: UploadState; message: string; previewUrl: string | null }>
  >({});
  const [editStates, setEditStates] = useState<Record<string, EditState>>({});
  const [createState, setCreateState] = useState<CreateState>(buildCreateState());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [openDrawer, setOpenDrawer] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});
  const createFileInputRef = useRef<HTMLInputElement | null>(null);
  const [createImageFile, setCreateImageFile] = useState<File | null>(null);
  const [createImagePreviewUrl, setCreateImagePreviewUrl] = useState<string | null>(null);

  async function loadAdminData() {
    try {
      const [signsRes, imageRes, dataRes] = await Promise.all([
        fetch("/api/admin/signs"),
        fetch("/api/admin/sign-image"),
        fetch("/api/admin/sign-data"),
      ]);

      const [nextSigns, nextImageOverrides, nextDataOverrides] = (await Promise.all([
        signsRes.json(),
        imageRes.json(),
        dataRes.json(),
      ])) as [SignProduct[], ImageOverrides, DataOverrides];

      setSigns(nextSigns);
      setImgOverrides(nextImageOverrides);
      setDataOverrides(nextDataOverrides);
      setImgRowState(
        Object.fromEntries(
          nextSigns.map((sign) => [sign.id, { status: "idle", message: "", previewUrl: null }]),
        ),
      );
      setEditStates(
        Object.fromEntries(nextSigns.map((sign) => [sign.id, buildEditState(sign, nextDataOverrides)])),
      );
    } catch {
      setSigns([]);
      setImgOverrides({});
      setDataOverrides({});
      setImgRowState({});
      setEditStates({});
    }
  }

  useEffect(() => {
    void loadAdminData();
  }, []);

  function currentImage(sign: SignProduct): string {
    return imgRowState[sign.id]?.previewUrl ?? imgOverrides[sign.id] ?? sign.image;
  }

  function setField<K extends keyof EditState>(signId: string, key: K, value: EditState[K]) {
    setEditStates((prev) => ({
      ...prev,
      [signId]: { ...prev[signId], [key]: value },
    }));
  }

  function setCreateField<K extends keyof CreateState>(key: K, value: CreateState[K]) {
    setCreateState((prev) => ({ ...prev, [key]: value }));
  }

  function addCustomField(signId: string) {
    setEditStates((prev) => ({
      ...prev,
      [signId]: {
        ...prev[signId],
        customFields: [...prev[signId].customFields, { key: "", value: "" }],
      },
    }));
  }

  function addCreateCustomField() {
    setCreateState((prev) => ({
      ...prev,
      customFields: [...prev.customFields, { key: "", value: "" }],
    }));
  }

  function updateCustomField(signId: string, index: number, patch: Partial<CustomField>) {
    setEditStates((prev) => ({
      ...prev,
      [signId]: {
        ...prev[signId],
        customFields: prev[signId].customFields.map((field, idx) =>
          idx === index ? { ...field, ...patch } : field,
        ),
      },
    }));
  }

  function updateCreateCustomField(index: number, patch: Partial<CustomField>) {
    setCreateState((prev) => ({
      ...prev,
      customFields: prev.customFields.map((field, idx) =>
        idx === index ? { ...field, ...patch } : field,
      ),
    }));
  }

  function removeCustomField(signId: string, index: number) {
    setEditStates((prev) => ({
      ...prev,
      [signId]: {
        ...prev[signId],
        customFields: prev[signId].customFields.filter((_, idx) => idx !== index),
      },
    }));
  }

  function removeCreateCustomField(index: number) {
    setCreateState((prev) => ({
      ...prev,
      customFields: prev.customFields.filter((_, idx) => idx !== index),
    }));
  }

  function handleFileChange(signId: string, file: File | null) {
    setSelectedFiles((prev) => ({ ...prev, [signId]: file }));
    if (!file) {
      return;
    }

    const url = URL.createObjectURL(file);
    setImgRowState((prev) => ({
      ...prev,
      [signId]: { ...prev[signId], previewUrl: url, status: "idle", message: "" },
    }));
  }

  async function handleUpload(sign: SignProduct) {
    const file = selectedFiles[sign.id];
    if (!file) {
      return;
    }

    setImgRowState((prev) => ({
      ...prev,
      [sign.id]: { ...prev[sign.id], status: "uploading", message: "Uploading..." },
    }));

    const body = new FormData();
    body.append("signId", sign.id);
    body.append("file", file);

    try {
      const res = await fetch("/api/admin/sign-image", { method: "POST", body });
      const data = (await res.json()) as { url?: string; error?: string };

      if (!res.ok) {
        setImgRowState((prev) => ({
          ...prev,
          [sign.id]: {
            ...prev[sign.id],
            status: "error",
            message: data.error ?? "Upload failed",
          },
        }));
        return;
      }

      setImgOverrides((prev) => ({ ...prev, [sign.id]: data.url ?? sign.image }));
      setSelectedFiles((prev) => ({ ...prev, [sign.id]: null }));
      setImgRowState((prev) => ({
        ...prev,
        [sign.id]: {
          status: "success",
          message: "Image saved",
          previewUrl: data.url ?? sign.image,
        },
      }));
    } catch {
      setImgRowState((prev) => ({
        ...prev,
        [sign.id]: { ...prev[sign.id], status: "error", message: "Network error" },
      }));
    }
  }

  async function handleImageReset(sign: SignProduct) {
    try {
      await fetch("/api/admin/sign-image", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signId: sign.id }),
      });
      setImgOverrides((prev) => {
        const next = { ...prev };
        delete next[sign.id];
        return next;
      });
      setSelectedFiles((prev) => ({ ...prev, [sign.id]: null }));
      setImgRowState((prev) => ({
        ...prev,
        [sign.id]: { status: "idle", message: "Reset to default", previewUrl: null },
      }));
    } catch {
      setImgRowState((prev) => ({
        ...prev,
        [sign.id]: { ...prev[sign.id], message: "Reset failed" },
      }));
    }
  }

  async function handleDataSave(sign: SignProduct) {
    const state = editStates[sign.id];
    if (!state) {
      return;
    }

    setField(sign.id, "saveStatus", "saving");
    setField(sign.id, "saveMessage", "Saving...");

    const payload = buildPayloadFromState(state, sign.price);

    try {
      const res = await fetch("/api/admin/sign-data", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signId: sign.id, data: payload }),
      });
      const result = (await res.json()) as { error?: string };

      if (!res.ok) {
        setField(sign.id, "saveStatus", "error");
        setField(sign.id, "saveMessage", result.error ?? "Save failed");
        return;
      }

      setDataOverrides((prev) => ({ ...prev, [sign.id]: payload }));
      setEditStates((prev) => ({
        ...prev,
        [sign.id]: { ...prev[sign.id], saveStatus: "saved", saveMessage: "Saved" },
      }));
      void loadAdminData();
    } catch {
      setField(sign.id, "saveStatus", "error");
      setField(sign.id, "saveMessage", "Network error");
    }
  }

  async function handleDataReset(sign: SignProduct) {
    try {
      await fetch("/api/admin/sign-data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signId: sign.id }),
      });
      await loadAdminData();
    } catch {
      setField(sign.id, "saveStatus", "error");
      setField(sign.id, "saveMessage", "Reset failed");
    }
  }

  async function handleCreateProduct() {
    setCreateField("saveStatus", "saving");
    setCreateField("saveMessage", "Creating product...");

    const existingIds = new Set(signs.map((sign) => sign.id));
    const generatedId = generateUniqueIdFromTitle(createState.title, existingIds);

    let imageUrl = createState.image.trim() || "/images/sign-01.svg";

    if (createImageFile) {
      const uploadBody = new FormData();
      uploadBody.append("logo", createImageFile);

      try {
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadBody,
        });
        const uploadResult = (await uploadRes.json()) as { url?: string; error?: string };

        if (!uploadRes.ok || !uploadResult.url) {
          setCreateField("saveStatus", "error");
          setCreateField("saveMessage", uploadResult.error ?? "Image upload failed");
          return;
        }

        imageUrl = uploadResult.url;
      } catch {
        setCreateField("saveStatus", "error");
        setCreateField("saveMessage", "Image upload failed");
        return;
      }
    }

    const payload = {
      id: generatedId,
      ...buildPayloadFromState({ ...createState, image: imageUrl }),
    };

    try {
      const res = await fetch("/api/admin/signs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await res.json()) as { error?: string; sign?: SignProduct };

      if (!res.ok) {
        setCreateField("saveStatus", "error");
        setCreateField("saveMessage", result.error ?? "Create failed");
        return;
      }

      const createdId = result.sign?.id ?? generatedId;
      setCreateState(buildCreateState());
      setCreateImageFile(null);
      setCreateImagePreviewUrl(null);
      setIsCreateOpen(false);
      await loadAdminData();
      setOpenDrawer(createdId);
    } catch {
      setCreateField("saveStatus", "error");
      setCreateField("saveMessage", "Network error");
    }
  }

  const openSign = openDrawer ? signs.find((sign) => sign.id === openDrawer) ?? null : null;
  const generatedCreateId = generateUniqueIdFromTitle(
    createState.title,
    new Set(signs.map((sign) => sign.id)),
  );

  return (
    <>
      {openSign && editStates[openSign.id] ? (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setOpenDrawer(null)} />
          <aside className="flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <p className="text-xs text-slate-400">{openSign.id}</p>
                <h2 className="text-lg font-bold text-slate-900">Edit product</h2>
              </div>
              <button
                onClick={() => setOpenDrawer(null)}
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 space-y-8 px-6 py-6">
              <section className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Image</h3>
                <div className="relative h-36 w-full overflow-hidden rounded-lg bg-slate-100">
                  <Image
                    src={currentImage(openSign)}
                    alt={openSign.title}
                    fill
                    className="object-contain p-2"
                    unoptimized
                  />
                  {imgOverrides[openSign.id] ? (
                    <span className="absolute right-2 top-2 rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                      Custom
                    </span>
                  ) : null}
                </div>

                <input
                  ref={(element) => {
                    fileInputRefs.current[openSign.id] = element;
                  }}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                  onChange={(event) => handleFileChange(openSign.id, event.target.files?.[0] ?? null)}
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRefs.current[openSign.id]?.click()}
                    className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    {selectedFiles[openSign.id] ? "Change file..." : "Choose image..."}
                  </button>
                  {selectedFiles[openSign.id] ? (
                    <button
                      onClick={() => handleUpload(openSign)}
                      disabled={imgRowState[openSign.id]?.status === "uploading"}
                      className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
                    >
                      {imgRowState[openSign.id]?.status === "uploading" ? "Uploading..." : "Upload"}
                    </button>
                  ) : null}
                  {imgOverrides[openSign.id] ? (
                    <button
                      onClick={() => handleImageReset(openSign)}
                      className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                    >
                      Reset
                    </button>
                  ) : null}
                </div>

                {imgRowState[openSign.id]?.message ? (
                  <p
                    className={`text-xs font-medium ${
                      imgRowState[openSign.id]?.status === "success"
                        ? "text-green-600"
                        : imgRowState[openSign.id]?.status === "error"
                          ? "text-red-600"
                          : "text-slate-500"
                    }`}
                  >
                    {imgRowState[openSign.id]?.message}
                  </p>
                ) : null}
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Product data</h3>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-600">Title</label>
                  <input
                    type="text"
                    value={editStates[openSign.id].title}
                    onChange={(event) => setField(openSign.id, "title", event.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-600">Category</label>
                  <select
                    value={editStates[openSign.id].category}
                    onChange={(event) =>
                      setField(openSign.id, "category", event.target.value as SignCategory)
                    }
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-600">Price (GBP)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={editStates[openSign.id].price}
                    onChange={(event) => setField(openSign.id, "price", event.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-600">Description</label>
                  <textarea
                    rows={3}
                    value={editStates[openSign.id].description}
                    onChange={(event) => setField(openSign.id, "description", event.target.value)}
                    className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Custom fields</h3>
                  <button
                    onClick={() => addCustomField(openSign.id)}
                    className="rounded-md border border-dashed border-brand-400 px-3 py-1 text-xs font-semibold text-brand-600 transition hover:bg-brand-50"
                  >
                    + Add field
                  </button>
                </div>

                {editStates[openSign.id].customFields.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-200 px-4 py-3 text-xs text-slate-400">
                    No custom fields yet. Click &ldquo;+ Add field&rdquo; to add any extra attribute.
                  </p>
                ) : null}

                {editStates[openSign.id].customFields.map((field, index) => (
                  <div key={`${openSign.id}-field-${index}`} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Field name"
                      value={field.key}
                      onChange={(event) => updateCustomField(openSign.id, index, { key: event.target.value })}
                      className="w-2/5 rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={field.value}
                      onChange={(event) => updateCustomField(openSign.id, index, { value: event.target.value })}
                      className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                    <button
                      onClick={() => removeCustomField(openSign.id, index)}
                      className="shrink-0 rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </section>
            </div>

            <div className="space-y-2 border-t bg-slate-50 px-6 py-4">
              {editStates[openSign.id].saveMessage ? (
                <p
                  className={`text-xs font-medium ${
                    editStates[openSign.id].saveStatus === "saved"
                      ? "text-green-600"
                      : editStates[openSign.id].saveStatus === "error"
                        ? "text-red-600"
                        : "text-slate-500"
                  }`}
                >
                  {editStates[openSign.id].saveMessage}
                </p>
              ) : null}
              <div className="flex gap-2">
                {dataOverrides[openSign.id] ? (
                  <button
                    onClick={() => handleDataReset(openSign)}
                    className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    Reset data
                  </button>
                ) : null}
                <button
                  onClick={() => handleDataSave(openSign)}
                  disabled={editStates[openSign.id].saveStatus === "saving"}
                  className="flex-1 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
                >
                  {editStates[openSign.id].saveStatus === "saving" ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          </aside>
        </div>
      ) : null}

      <section className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin — Products</h1>
            <p className="mt-2 text-sm text-slate-500">
              Add new products or edit existing ones, including image, title, price, description,
              category, and custom fields.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/analytics"
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Analytics Dashboard
            </Link>
            <Link
              href="/admin/compliance"
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Compliance Rules
            </Link>
            <Link
              href="/admin/configurator"
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Configurator Settings
            </Link>
            <button
              onClick={() => setIsCreateOpen((prev) => !prev)}
              className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              {isCreateOpen ? "Close New Product" : "Add New Product"}
            </button>
          </div>
        </div>

        {isCreateOpen ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-600">Generated ID</label>
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {generatedCreateId}
                </div>
                <p className="text-xs text-slate-400">
                  ID is generated automatically from title.
                </p>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-600">Title</label>
                <input
                  type="text"
                  value={createState.title}
                  onChange={(event) => setCreateField("title", event.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-600">Category</label>
                <select
                  value={createState.category}
                  onChange={(event) => setCreateField("category", event.target.value as SignCategory)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-600">Price (GBP)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={createState.price}
                  onChange={(event) => setCreateField("price", event.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="block text-xs font-medium text-slate-600">Image upload</label>
                <input
                  ref={createFileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setCreateImageFile(file);
                    if (file) {
                      setCreateImagePreviewUrl(URL.createObjectURL(file));
                    } else {
                      setCreateImagePreviewUrl(null);
                    }
                  }}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => createFileInputRef.current?.click()}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    {createImageFile ? "Change image..." : "Browse image..."}
                  </button>
                  {createImageFile ? (
                    <span className="text-xs text-slate-500">{createImageFile.name}</span>
                  ) : (
                    <span className="text-xs text-slate-400">No file selected</span>
                  )}
                </div>
                {createImagePreviewUrl ? (
                  <div className="relative mt-3 h-36 w-full overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                    <Image
                      src={createImagePreviewUrl}
                      alt="New product image preview"
                      fill
                      className="object-contain p-2"
                      unoptimized
                    />
                  </div>
                ) : null}
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="block text-xs font-medium text-slate-600">Or image path/URL (optional)</label>
                <input
                  type="text"
                  value={createState.image}
                  onChange={(event) => setCreateField("image", event.target.value)}
                  placeholder="/images/sign-01.svg or https://..."
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="block text-xs font-medium text-slate-600">Description</label>
                <textarea
                  rows={3}
                  value={createState.description}
                  onChange={(event) => setCreateField("description", event.target.value)}
                  className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Custom fields</h3>
                <button
                  onClick={addCreateCustomField}
                  className="rounded-md border border-dashed border-brand-400 px-3 py-1 text-xs font-semibold text-brand-600 transition hover:bg-brand-50"
                >
                  + Add field
                </button>
              </div>

              {createState.customFields.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 px-4 py-3 text-xs text-slate-400">
                  Add optional custom fields for the new product.
                </p>
              ) : null}

              {createState.customFields.map((field, index) => (
                <div key={`create-field-${index}`} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Field name"
                    value={field.key}
                    onChange={(event) => updateCreateCustomField(index, { key: event.target.value })}
                    className="w-2/5 rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={field.value}
                    onChange={(event) => updateCreateCustomField(index, { value: event.target.value })}
                    className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <button
                    onClick={() => removeCreateCustomField(index)}
                    className="shrink-0 rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between gap-4">
              <p
                className={`text-sm ${
                  createState.saveStatus === "error"
                    ? "text-red-600"
                    : createState.saveStatus === "saved"
                      ? "text-green-600"
                      : "text-slate-500"
                }`}
              >
                {createState.saveMessage || "Create a new product; ID is generated automatically from title."}
              </p>
              <button
                onClick={() => void handleCreateProduct()}
                disabled={createState.saveStatus === "saving"}
                className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
              >
                {createState.saveStatus === "saving" ? "Creating..." : "Create Product"}
              </button>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {signs.map((sign) => {
            const editState = editStates[sign.id];
            const displayTitle = editState?.title ?? sign.title;
            const displayCategory = editState?.category ?? sign.category;
            const displayPrice =
              editState && editState.price !== "" ? parseFloat(editState.price) || sign.price : sign.price;

            return (
              <div
                key={sign.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="relative h-36 w-full bg-slate-100">
                  <Image
                    src={currentImage(sign)}
                    alt={sign.title}
                    fill
                    className="object-contain p-2"
                    unoptimized
                  />
                  <div className="absolute left-2 top-2 flex gap-1">
                    {imgOverrides[sign.id] ? (
                      <span className="rounded-full bg-green-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                        Img
                      </span>
                    ) : null}
                    {dataOverrides[sign.id] ? (
                      <span className="rounded-full bg-violet-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                        Data
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-2 p-4">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      CATEGORY_COLOR[displayCategory] ?? "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {displayCategory}
                  </span>
                  <p className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-tight text-slate-900">
                    {displayTitle}
                  </p>
                  <p className="text-xs text-slate-400">{sign.id}</p>
                  <p className="text-base font-bold text-slate-900">GBP {displayPrice.toFixed(2)}</p>
                  <button
                    onClick={() => setOpenDrawer(sign.id)}
                    className="mt-1 w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                  >
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
