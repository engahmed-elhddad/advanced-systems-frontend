'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { analyzeBom, submitBomRfq } from '@/lib/api'
import { API_BASE_URL } from '@/app/lib/constants'
import { FileSpreadsheet, Upload, Loader2, ExternalLink, Package, ChevronRight, MessageCircle, X } from 'lucide-react'

interface BomItem {
  part_number: string
  quantity: number
  product: { part_number?: string; manufacturer?: string; category?: string; description?: string } | null
  brand: string | null
  category: string | null
  availability?: string
  datasheet_url: string | null
  specifications: unknown
  alternatives: Array<{ part_number?: string; manufacturer?: string; category?: string; description?: string; match_type?: string }>
}

export default function BomAnalyzerPage() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [items, setItems] = useState<BomItem[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [totalParts, setTotalParts] = useState(0)
  const [rfqModal, setRfqModal] = useState(false)
  const [rfqStatus, setRfqStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [rfqRef, setRfqRef] = useState('')
  const [rfqEmail, setRfqEmail] = useState('')
  const [rfqCompany, setRfqCompany] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const ext = f.name.toLowerCase()
    if (!['.xlsx', '.xls', '.csv'].some(e => ext.endsWith(e))) {
      setErrorMsg('Please upload Excel (.xlsx, .xls) or CSV file')
      setFile(null)
      return
    }
    setFile(f)
    setErrorMsg('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    setStatus('uploading')
    setErrorMsg('')
    try {
      const res = await analyzeBom(file)
      setItems(res.items || [])
      setTotalParts(res.total_parts ?? res.items?.length ?? 0)
      setStatus('success')
    } catch (err: unknown) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Analysis failed. Please try again.')
    }
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL

  const handleBomRfq = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rfqEmail || items.length === 0) return
    setRfqStatus('submitting')
    try {
      const res = await submitBomRfq({
        items: items.map((r) => ({ part_number: r.part_number, quantity: r.quantity })),
        email: rfqEmail,
        company: rfqCompany || undefined,
      })
      setRfqRef(res.reference || '')
      setRfqStatus('success')
    } catch {
      setRfqStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 text-primary-600 text-sm font-semibold uppercase tracking-widest mb-4">
            <FileSpreadsheet className="w-5 h-5" />
            BOM Analyzer
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 tracking-tight">
            Bill of Materials Analyzer
          </h1>
          <p className="text-slate-600 max-w-xl mx-auto">
            Upload your Excel or CSV BOM to match part numbers with our database, get datasheets, specifications, and alternative components.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm mb-10"
        >
          <label className="block text-sm font-medium text-slate-700 mb-2">Upload file</label>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            <button
              type="submit"
              disabled={!file || status === 'uploading'}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary-500 hover:bg-primary-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold transition-colors"
            >
              {status === 'uploading' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Analyze BOM
                </>
              )}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Supports .xlsx, .xls, .csv. Expected columns: Part Number, Quantity (or similar).
          </p>
          {errorMsg && (
            <p className="mt-3 text-sm text-red-600">{errorMsg}</p>
          )}
        </form>

        {status === 'success' && items.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-900">Analysis Report</h2>
              <p className="text-sm text-slate-500 mt-0.5">{totalParts} parts analyzed</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Part Number</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Qty</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Brand</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Category</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Availability</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Datasheet</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Specs</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Alternatives</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row, i) => (
                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono font-medium text-slate-900">
                        {row.part_number}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{row.quantity}</td>
                      <td className="px-4 py-3 text-slate-600">{row.brand || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{row.category || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${row.availability === 'in_stock' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                          {row.availability === 'in_stock' ? 'In Stock' : 'On Request'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {row.datasheet_url ? (
                          <a
                            href={row.datasheet_url.startsWith('http') ? row.datasheet_url : `${apiBase}${row.datasheet_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary-600 hover:underline"
                          >
                            <ExternalLink className="w-4 h-4" />
                            PDF
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {row.specifications ? (
                          <span className="text-xs text-slate-600 max-w-[120px] truncate block" title={
                            Array.isArray(row.specifications)
                              ? (row.specifications as Array<{ key?: string; value?: string }>).map(s => `${s.key}: ${s.value}`).join(', ')
                              : typeof row.specifications === 'object'
                                ? Object.entries(row.specifications as Record<string, unknown>).map(([k, v]) => `${k}: ${v}`).join(', ')
                                : String(row.specifications)
                          }>
                            {Array.isArray(row.specifications)
                              ? (row.specifications as Array<{ key?: string; value?: string }>).slice(0, 2).map(s => `${s.key}: ${s.value}`).join('; ')
                              : typeof row.specifications === 'object'
                                ? Object.entries(row.specifications as Record<string, unknown>).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join('; ')
                                : String(row.specifications).slice(0, 40)}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {row.alternatives?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {row.alternatives.slice(0, 3).map((alt, j) => (
                              <Link
                                key={j}
                                href={`/part-number/${encodeURIComponent(alt.part_number || '')}`}
                                className="text-xs px-2 py-1 rounded bg-primary-50 text-primary-700 hover:bg-primary-100"
                              >
                                {alt.part_number}
                              </Link>
                            ))}
                            {row.alternatives.length > 3 && (
                              <span className="text-xs text-slate-500">+{row.alternatives.length - 3}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/part-number/${encodeURIComponent(row.part_number)}`}
                          className="inline-flex items-center gap-1 text-primary-600 hover:underline font-medium"
                        >
                          View <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setRfqModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-medium"
              >
                <MessageCircle className="w-5 h-5" />
                Request RFQ for Entire BOM
              </button>
              <button
                onClick={() => { setFile(null); setItems([]); setStatus('idle'); if (inputRef.current) { inputRef.current.value = ''; inputRef.current.click() } }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium"
              >
                <Package className="w-4 h-4" />
                Analyze Another BOM
              </button>
            </div>

            {rfqModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">Request Quote for BOM</h3>
                    <button onClick={() => { setRfqModal(false); setRfqStatus('idle'); setRfqRef(''); }} className="p-2 hover:bg-slate-100 rounded-lg">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  {rfqStatus === 'success' ? (
                    <div className="text-center py-4">
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <p className="font-medium text-slate-900">RFQ Submitted</p>
                      <p className="text-sm text-slate-600 mt-1">Reference: {rfqRef}</p>
                      <p className="text-sm text-slate-500 mt-2">We will respond within 24 hours.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleBomRfq} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                        <input type="email" required value={rfqEmail} onChange={(e) => setRfqEmail(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="your@email.com" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                        <input type="text" value={rfqCompany} onChange={(e) => setRfqCompany(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="Your company" />
                      </div>
                      <p className="text-xs text-slate-500">{items.length} parts will be included in this quote request.</p>
                      {rfqStatus === 'error' && <p className="text-sm text-red-600">Submission failed. Please try again or email us directly.</p>}
                      <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={rfqStatus === 'submitting'} className="flex-1 px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white font-medium">
                          {rfqStatus === 'submitting' ? 'Submitting…' : 'Submit RFQ'}
                        </button>
                        <button type="button" onClick={() => setRfqModal(false)} className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700">
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {status === 'success' && items.length === 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
            <Package className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <h3 className="font-semibold text-amber-800 mb-1">No part numbers found</h3>
            <p className="text-amber-700 text-sm mb-4">
              Ensure your file has a column for part numbers (e.g. Part Number, Part No, Item).
            </p>
            <button
              onClick={() => setStatus('idle')}
              className="text-amber-800 font-medium hover:underline"
            >
              Try another file
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
