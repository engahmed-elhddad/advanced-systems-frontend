"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Upload, Trash2, Star, RefreshCw, ImagePlus, Package } from "lucide-react"

const API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
const ADMIN_KEY = "ADVANCED_SYSTEMS_ADMIN"

type ProductImage = { filename: string; url: string; is_primary: boolean }

export default function ImageManagerPage() {
  const [partNumber, setPartNumber] = useState("")
  const [images, setImages] = useState<ProductImage[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [replaceTarget, setReplaceTarget] = useState<string | null>(null)

  const headers = { "api-key": ADMIN_KEY }

  async function loadImages() {
    if (!partNumber.trim()) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch(
        `${API}/admin/products/${encodeURIComponent(partNumber.trim())}/images`,
        { headers }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Failed to load")
      setImages(data.images || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load images")
      setImages([])
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(file: File, replaceFilename?: string) {
    if (!partNumber.trim() || !file) return
    setUploading(true)
    setError("")
    const form = new FormData()
    form.append("file", file)
    try {
      const url = replaceFilename
        ? `${API}/admin/products/${encodeURIComponent(partNumber.trim())}/images/${encodeURIComponent(replaceFilename)}`
        : `${API}/admin/products/${encodeURIComponent(partNumber.trim())}/images`
      const res = await fetch(url, {
        method: replaceFilename ? "PUT" : "POST",
        headers: { "api-key": ADMIN_KEY },
        body: form,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Upload failed")
      setReplaceTarget(null)
      loadImages()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(filename: string) {
    if (!partNumber.trim() || !confirm("Delete this image?")) return
    setError("")
    try {
      const res = await fetch(
        `${API}/admin/products/${encodeURIComponent(partNumber.trim())}/images/${encodeURIComponent(filename)}`,
        { method: "DELETE", headers }
      )
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.detail || "Delete failed")
      }
      loadImages()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed")
    }
  }

  async function handleSetPrimary(filename: string) {
    if (!partNumber.trim()) return
    setError("")
    try {
      const res = await fetch(
        `${API}/admin/products/${encodeURIComponent(partNumber.trim())}/images/${encodeURIComponent(filename)}/primary`,
        { method: "POST", headers }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Failed")
      loadImages()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed")
    }
  }

  const imageBase = API.replace(/\/$/, "")

  return (
    <div className="min-h-screen bg-industrial-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-industrial-gray-900">Product Image Manager</h1>
            <p className="text-industrial-gray-500 mt-1">
              Upload, replace, delete, and set primary images for products
            </p>
          </div>
          <Link
            href="/admin"
            className="text-sm font-medium text-industrial-green-600 hover:text-industrial-green-700"
          >
            ← Back to Admin
          </Link>
        </div>

        <div className="rounded-xl border border-industrial-gray-200 bg-white p-6 shadow-sm mb-6">
          <label className="block text-sm font-medium text-industrial-gray-700 mb-2">
            Part Number
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={partNumber}
              onChange={(e) => setPartNumber(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadImages()}
              placeholder="e.g. 3RT1015-1BB41"
              className="flex-1 px-4 py-2.5 rounded-lg border border-industrial-gray-200 text-industrial-gray-900 placeholder-industrial-gray-400 focus:outline-none focus:border-industrial-green-500 focus:ring-1 focus:ring-industrial-green-500"
            />
            <button
              onClick={loadImages}
              disabled={loading || !partNumber.trim()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-industrial-green-600 hover:bg-industrial-green-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Load
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-industrial-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-industrial-gray-900">Images</h2>
            {partNumber.trim() && (
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-industrial-gray-200 hover:border-industrial-green-500 hover:bg-industrial-green-50 cursor-pointer text-sm font-medium text-industrial-gray-700">
                <ImagePlus className="w-4 h-4" />
                Upload
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleUpload(f)
                    e.target.value = ""
                  }}
                />
              </label>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-square rounded-lg bg-industrial-gray-100 skeleton" />
              ))}
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-12 text-industrial-gray-500">
              {partNumber.trim() ? (
                <>
                  <Package className="w-12 h-12 mx-auto mb-3 text-industrial-gray-300" />
                  <p>No images for this product</p>
                  <p className="text-sm mt-1">Upload an image to get started (template applied automatically)</p>
                </>
              ) : (
                <p>Enter a part number and click Load</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((img) => (
                <div
                  key={img.filename}
                  className="relative group rounded-xl border-2 border-industrial-gray-200 overflow-hidden bg-industrial-gray-50"
                >
                  <div className="aspect-square relative">
                    <Image
                      src={`${imageBase}${img.url}`}
                      alt={img.filename}
                      fill
                      className="object-contain"
                      sizes="200px"
                      unoptimized
                    />
                    {img.is_primary && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-industrial-green-600 text-white text-xs font-medium">
                        Primary
                      </div>
                    )}
                  </div>
                  <div className="p-2 flex items-center justify-between bg-white border-t border-industrial-gray-100">
                    <span className="text-xs text-industrial-gray-600 truncate">{img.filename}</span>
                    <div className="flex gap-1 shrink-0">
                      {!img.is_primary && (
                        <button
                          onClick={() => handleSetPrimary(img.filename)}
                          className="p-1.5 rounded hover:bg-industrial-green-50 text-industrial-green-600"
                          title="Set as primary"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                      )}
                      <label className="p-1.5 rounded hover:bg-industrial-gray-100 cursor-pointer" title="Replace">
                        <RefreshCw className="w-4 h-4 text-industrial-gray-600" />
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f) handleUpload(f, img.filename)
                            e.target.value = ""
                          }}
                        />
                      </label>
                      <button
                        onClick={() => handleDelete(img.filename)}
                        className="p-1.5 rounded hover:bg-red-50 text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="mt-6 text-xs text-industrial-gray-500">
          Images are stored in uploads/products/&#123;part_number&#125;/ (main.jpg, image2.jpg, …). Template applied on upload.
        </p>
      </div>
    </div>
  )
}
