'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { detectProductFromImage } from '@/lib/api'
import { Camera, Loader2, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react'

export default function ScanComponentPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [result, setResult] = useState<{
    success: boolean
    product_found: boolean
    product: Record<string, unknown>
    vision_result: { part_number?: string; brand?: string; category?: string; product_type?: string; series?: string }
    part_number?: string
    error?: string
  } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!types.includes(f.type)) {
      setFile(null)
      setPreview(null)
      return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
    setStatus('idle')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    setStatus('uploading')
    setResult(null)
    try {
      const res = await detectProductFromImage(file)
      setResult(res)
      setStatus('success')
    } catch (err: unknown) {
      setStatus('error')
      setResult({
        success: false,
        product_found: false,
        product: {},
        vision_result: {},
        error: err instanceof Error ? err.message : 'Detection failed',
      })
    }
  }

  const vision = result?.vision_result
  const pn = result?.part_number || vision?.part_number || ''

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Vision AI Component Scanner</h1>
        <p className="text-slate-600">
          Upload a product image. OCR and Vision AI detect part numbers and match with our database.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-8"
      >
        <label className="block text-sm font-medium text-slate-700 mb-2">Product image</label>
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-700"
          />
          <button
            type="submit"
            disabled={!file || status === 'uploading'}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary-500 hover:bg-primary-600 disabled:bg-slate-300 text-white font-semibold"
          >
            {status === 'uploading' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Scanning…
              </>
            ) : (
              <>
                <Camera className="w-5 h-5" />
                Scan
              </>
            )}
          </button>
        </div>
      </form>

      {preview && (
        <div className="mb-8 rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="relative aspect-video bg-slate-100">
            <Image src={preview} alt="Upload preview" fill className="object-contain" />
          </div>
        </div>
      )}

      {result && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          {!result.success ? (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 text-red-800">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{result.error || 'Detection failed. Please try another image.'}</p>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-primary-50">
                <CheckCircle className="w-5 h-5 shrink-0 text-primary-600 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">Detection complete</p>
                  <p className="text-sm text-slate-600">
                    {result.product_found ? 'Product found in database.' : 'Part number detected. No exact match in database.'}
                  </p>
                </div>
              </div>

              {vision && (vision.part_number || vision.brand || vision.category) && (
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      {vision.part_number && (
                        <tr className="border-b border-slate-100">
                          <td className="px-4 py-3 text-slate-500 w-32">Part Number</td>
                          <td className="px-4 py-3 font-mono font-semibold">
                            {pn}
                            {pn && (
                              <Link
                                href={`/product/${encodeURIComponent(pn)}`}
                                className="ml-3 inline-flex items-center gap-1 text-primary-600 hover:underline"
                              >
                                View product <ExternalLink className="w-4 h-4" />
                              </Link>
                            )}
                          </td>
                        </tr>
                      )}
                      {vision.brand && (
                        <tr className="border-b border-slate-100">
                          <td className="px-4 py-3 text-slate-500">Brand</td>
                          <td className="px-4 py-3">{vision.brand}</td>
                        </tr>
                      )}
                      {vision.category && (
                        <tr className="border-b border-slate-100">
                          <td className="px-4 py-3 text-slate-500">Category</td>
                          <td className="px-4 py-3">{vision.category}</td>
                        </tr>
                      )}
                      {vision.product_type && (
                        <tr className="border-b border-slate-100">
                          <td className="px-4 py-3 text-slate-500">Type</td>
                          <td className="px-4 py-3">{vision.product_type}</td>
                        </tr>
                      )}
                      {vision.series && (
                        <tr>
                          <td className="px-4 py-3 text-slate-500">Series</td>
                          <td className="px-4 py-3">{vision.series}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {result.product_found && result.product && Object.keys(result.product).length > 0 && (
                <Link
                  href={`/product/${encodeURIComponent(String(result.product.part_number || pn))}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600"
                >
                  View full product page <ExternalLink className="w-4 h-4" />
                </Link>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
