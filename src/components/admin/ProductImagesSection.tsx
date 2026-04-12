"use client"

import { useMemo, useRef, useState } from "react"
import {
  deleteAdminProductImage,
  reorderAdminProductImages,
  setAdminProductPrimaryImage,
  uploadAdminProductImages,
} from "@/lib/admin-api"
import { ImagePlus, Star, Trash2, GripVertical, Save } from "lucide-react"
import { Button, Card } from "@/components/ui"

type ProductImage = {
  id: string
  url: string
  thumbnail_url?: string | null
  medium_url?: string | null
  is_primary: boolean
  sort_order?: number | null
}

export default function ProductImagesSection({
  partNumber,
  images,
  onChanged,
}: {
  partNumber: string
  images: ProductImage[]
  onChanged: () => Promise<void> | void
}) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)
  const [sortMap, setSortMap] = useState<Record<string, number>>(
    Object.fromEntries(images.map((img, idx) => [img.id, img.sort_order ?? idx]))
  )

  const sortedImages = useMemo(
    () =>
      [...images].sort((a, b) => {
        const av = sortMap[a.id] ?? a.sort_order ?? 0
        const bv = sortMap[b.id] ?? b.sort_order ?? 0
        return av - bv
      }),
    [images, sortMap]
  )

  async function refreshAndMessage(okMessage: string) {
    await onChanged()
    setMessage(okMessage)
    setError("")
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setBusy(true)
    setMessage("")
    setError("")
    try {
      const res = await uploadAdminProductImages(partNumber, Array.from(files))
      if (!res.ok) {
        setError(res?.data?.message || "Upload failed")
        return
      }
      const successCount = Array.isArray(res.data?.success) ? res.data.success.length : 0
      const failedCount = Array.isArray(res.data?.failed) ? res.data.failed.length : 0
      await onChanged()
      setMessage(`Uploaded ${successCount} image(s). Failed: ${failedCount}.`)
    } finally {
      setBusy(false)
    }
  }

  async function handleSetPrimary(imageId: string) {
    setBusy(true)
    const res = await setAdminProductPrimaryImage(partNumber, imageId)
    if (!res.ok) {
      setError(res.message || "Failed to set primary image")
      setBusy(false)
      return
    }
    await refreshAndMessage("Primary image updated.")
    setBusy(false)
  }

  async function handleDelete(imageId: string) {
    if (!window.confirm("Delete this image?")) return
    setBusy(true)
    const res = await deleteAdminProductImage(partNumber, imageId)
    if (!res.ok) {
      setError(res.message || "Failed to delete image")
      setBusy(false)
      return
    }
    await refreshAndMessage("Image deleted.")
    setBusy(false)
  }

  async function handleReorder() {
    setBusy(true)
    const order = sortedImages.map((img, idx) => ({
      image_id: img.id,
      sort_order: Number.isFinite(sortMap[img.id]) ? Number(sortMap[img.id]) : idx,
    }))
    const res = await reorderAdminProductImages(partNumber, order)
    if (!res.ok) {
      setError(res.message || "Failed to reorder images")
      setBusy(false)
      return
    }
    await refreshAndMessage("Image order saved.")
    setBusy(false)
  }

  return (
    <Card hover={false} className="p-0" padding="none">
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-white">Images</h2>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
            disabled={busy}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<ImagePlus className="h-3.5 w-3.5" />}
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            Upload
          </Button>
        </div>

        {!!message && <p className="mt-3 text-sm text-emerald-200/90">{message}</p>}
        {!!error && <p className="mt-3 text-sm text-red-200/90">{error}</p>}

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sortedImages.map((img, idx) => (
            <div
              key={img.id}
              className="rounded-xl bg-white/[0.04] p-3 backdrop-blur-xl transition-all duration-300 hover:bg-white/[0.07]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.thumbnail_url || img.url}
                alt={img.id}
                loading="lazy"
                className="h-28 w-full rounded-lg border border-white/10 object-cover"
              />
              <div className="mt-2 flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1 text-xs ${
                    img.is_primary ? "font-semibold text-emerald-200" : "text-white/45"
                  }`}
                >
                  {img.is_primary ? <Star className="h-3 w-3" /> : <GripVertical className="h-3 w-3" />}
                  {img.is_primary ? "Primary" : "Secondary"}
                </span>
                <input
                  type="number"
                  min={0}
                  value={sortMap[img.id] ?? img.sort_order ?? idx}
                  onChange={(e) => setSortMap((prev) => ({ ...prev, [img.id]: Number(e.target.value) }))}
                  className="w-16 rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-xs text-white"
                  disabled={busy}
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={busy || img.is_primary}
                  onClick={() => handleSetPrimary(img.id)}
                  leftIcon={<Star className="h-3 w-3" />}
                >
                  Set primary
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={busy}
                  onClick={() => handleDelete(img.id)}
                  leftIcon={<Trash2 className="h-3 w-3" />}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
          {images.length === 0 && <p className="text-sm text-white/45">No images uploaded yet.</p>}
        </div>

        {images.length > 1 && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="mt-4"
            disabled={busy}
            onClick={handleReorder}
            leftIcon={<Save className="h-3.5 w-3.5" />}
          >
            Save Order
          </Button>
        )}
      </div>
    </Card>
  )
}
