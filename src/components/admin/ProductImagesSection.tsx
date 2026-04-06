"use client";

import { useMemo, useState } from "react";
import {
  deleteAdminProductImage,
  reorderAdminProductImages,
  setAdminProductPrimaryImage,
  uploadAdminProductImages,
} from "@/lib/admin-api";
import { ImagePlus, Star, Trash2, GripVertical, Save } from "lucide-react";

type ProductImage = {
  id: string;
  url: string;
  thumbnail_url?: string | null;
  medium_url?: string | null;
  is_primary: boolean;
  sort_order?: number | null;
};

export default function ProductImagesSection({
  partNumber,
  images,
  onChanged,
}: {
  partNumber: string;
  images: ProductImage[];
  onChanged: () => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sortMap, setSortMap] = useState<Record<string, number>>(
    Object.fromEntries(images.map((img, idx) => [img.id, img.sort_order ?? idx]))
  );

  const sortedImages = useMemo(
    () =>
      [...images].sort((a, b) => {
        const av = sortMap[a.id] ?? a.sort_order ?? 0;
        const bv = sortMap[b.id] ?? b.sort_order ?? 0;
        return av - bv;
      }),
    [images, sortMap]
  );

  async function refreshAndMessage(okMessage: string) {
    await onChanged();
    setMessage(okMessage);
    setError("");
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const res = await uploadAdminProductImages(partNumber, Array.from(files));
      if (!res.ok) {
        setError(res?.data?.message || "Upload failed");
        return;
      }
      const successCount = Array.isArray(res.data?.success) ? res.data.success.length : 0;
      const failedCount = Array.isArray(res.data?.failed) ? res.data.failed.length : 0;
      await onChanged();
      setMessage(`Uploaded ${successCount} image(s). Failed: ${failedCount}.`);
    } finally {
      setBusy(false);
    }
  }

  async function handleSetPrimary(imageId: string) {
    setBusy(true);
    const res = await setAdminProductPrimaryImage(partNumber, imageId);
    if (!res.ok) {
      setError(res.message || "Failed to set primary image");
      setBusy(false);
      return;
    }
    await refreshAndMessage("Primary image updated.");
    setBusy(false);
  }

  async function handleDelete(imageId: string) {
    if (!window.confirm("Delete this image?")) return;
    setBusy(true);
    const res = await deleteAdminProductImage(partNumber, imageId);
    if (!res.ok) {
      setError(res.message || "Failed to delete image");
      setBusy(false);
      return;
    }
    await refreshAndMessage("Image deleted.");
    setBusy(false);
  }

  async function handleReorder() {
    setBusy(true);
    const order = sortedImages.map((img, idx) => ({
      image_id: img.id,
      sort_order: Number.isFinite(sortMap[img.id]) ? Number(sortMap[img.id]) : idx,
    }));
    const res = await reorderAdminProductImages(partNumber, order);
    if (!res.ok) {
      setError(res.message || "Failed to reorder images");
      setBusy(false);
      return;
    }
    await refreshAndMessage("Image order saved.");
    setBusy(false);
  }

  return (
    <section className="admin-card">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Images</h2>
        <label className="admin-btn-secondary cursor-pointer !px-3 !py-1.5 text-sm">
          <ImagePlus className="admin-icon" />
          Upload
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
            disabled={busy}
          />
        </label>
      </div>

      {!!message && <p className="mt-3 text-sm text-green-700">{message}</p>}
      {!!error && <p className="mt-3 text-sm text-red-700">{error}</p>}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sortedImages.map((img, idx) => (
          <div key={img.id} className="rounded-lg border border-slate-200 p-2 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.thumbnail_url || img.url}
              alt={img.id}
              loading="lazy"
              className="h-28 w-full rounded object-cover"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className={`inline-flex items-center gap-1 text-xs ${img.is_primary ? "font-semibold text-green-700" : "text-slate-500"}`}>
                {img.is_primary ? <Star className="admin-icon h-3 w-3" /> : <GripVertical className="admin-icon h-3 w-3" />}
                {img.is_primary ? "Primary" : "Secondary"}
              </span>
              <input
                type="number"
                min={0}
                value={sortMap[img.id] ?? img.sort_order ?? idx}
                onChange={(e) => setSortMap((prev) => ({ ...prev, [img.id]: Number(e.target.value) }))}
                className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-xs"
                disabled={busy}
              />
            </div>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => handleSetPrimary(img.id)}
                disabled={busy || img.is_primary}
                className="admin-btn-secondary !px-2 !py-1 text-xs"
              >
                <Star className="admin-icon h-3 w-3" />
                Set primary
              </button>
              <button
                onClick={() => handleDelete(img.id)}
                disabled={busy}
                className="admin-btn-secondary !px-2 !py-1 text-xs !border-red-200 !text-red-700 hover:!bg-red-50"
              >
                <Trash2 className="admin-icon h-3 w-3" />
                Delete
              </button>
            </div>
          </div>
        ))}
        {images.length === 0 && <p className="text-sm text-gray-500">No images uploaded yet.</p>}
      </div>

      {images.length > 1 && (
        <button
          onClick={handleReorder}
          disabled={busy}
          className="admin-btn-primary mt-4 !px-3 !py-1.5 text-sm"
        >
          <Save className="admin-icon" />
          Save Order
        </button>
      )}
    </section>
  );
}
