"use client";

import Image from "next/image";
import { useState } from "react";

export default function UploadPage() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isValidType = ["image/png", "image/jpeg", "image/svg+xml"].includes(file.type);
    if (!isValidType) {
      setError("Only PNG, JPG, and SVG files are allowed.");
      return;
    }

    setError(null);
    setPreviewUrl(URL.createObjectURL(file));
    setIsUploading(true);

    const formData = new FormData();
    formData.append("logo", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      setError("Upload failed. Please try again.");
      setIsUploading(false);
      return;
    }

    const payload = (await response.json()) as { url: string };
    setUploadedUrl(payload.url);
    setIsUploading(false);
  };

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Logo Upload</h1>
      <p className="text-slate-600">Upload your company logo in PNG, JPG, or SVG format.</p>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <input
          type="file"
          accept=".png,.jpg,.jpeg,.svg"
          onChange={onFileChange}
          className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-700"
        />

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        {previewUrl ? (
          <div className="mt-6">
            <p className="mb-2 text-sm font-medium text-slate-700">Preview</p>
            <Image
              src={previewUrl}
              alt="Uploaded logo preview"
              width={240}
              height={240}
              unoptimized
              className="max-h-48 w-auto rounded-md border border-slate-200 bg-slate-50 p-2"
            />
          </div>
        ) : null}

        {uploadedUrl ? (
          <p className="mt-4 text-sm text-green-700">Saved to {uploadedUrl}</p>
        ) : null}

        <button
          disabled={!uploadedUrl || isUploading}
          className="mt-6 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Proceed to Order
        </button>
      </div>
    </section>
  );
}
