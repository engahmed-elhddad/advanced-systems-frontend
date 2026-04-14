'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import {
  Settings2,
  FileDown,
  Send,
  Loader2,
  Wrench,
  ChevronRight,
} from 'lucide-react'
import { generatePanelBom, getPanelBuilderOptions, submitBomRfq } from '@/lib/api'
import { API_BASE_URL } from '@/lib/constants'
import { Select } from '@/components/ui/Select'

const API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL

interface BOMItem {
  part_number: string
  quantity: number
  role: string
  category: string
  brand: string
  notes?: string
}

interface PanelBomResult {
  application: string
  control_type: string
  motor_power_kw: number
  voltage: string
  items: BOMItem[]
  total_parts: number
}

const DEFAULT_APPLICATIONS = [
  { id: 'motor_control', label: 'Motor Control' },
  { id: 'pump_control', label: 'Pump Control' },
  { id: 'hvac', label: 'HVAC Control' },
]
const DEFAULT_CONTROL_TYPES = [
  { id: 'direct_on_line', label: 'Direct-on-Line (DOL)' },
  { id: 'star_delta', label: 'Star-Delta' },
  { id: 'soft_starter', label: 'Soft Starter' },
  { id: 'vfd', label: 'VFD / Inverter' },
]
const DEFAULT_VOLTAGES = ['24V DC', '24V AC', '230V AC', '400V AC', '480V AC']

export default function PanelBuilderPage() {
  const [params, setParams] = useState({
    application: 'motor_control',
    motor_power_kw: 5.5,
    voltage: '400V AC',
    control_type: 'direct_on_line',
  })
  const [options, setOptions] = useState<{
    applications: { id: string; label: string }[]
    control_types: { id: string; label: string }[]
    voltages: string[]
  }>({
    applications: DEFAULT_APPLICATIONS,
    control_types: DEFAULT_CONTROL_TYPES,
    voltages: DEFAULT_VOLTAGES,
  })
  const [result, setResult] = useState<PanelBomResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [rfqOpen, setRfqOpen] = useState(false)
  const [rfqSubmitting, setRfqSubmitting] = useState(false)
  const [rfqForm, setRfqForm] = useState({ email: '', company: '', contact_name: '', message: '' })
  const [rfqSuccess, setRfqSuccess] = useState(false)

  useEffect(() => {
    getPanelBuilderOptions()
      .then((data: any) => {
        if (data?.applications?.length) setOptions(o => ({ ...o, applications: data.applications }))
        if (data?.control_types?.length) setOptions(o => ({ ...o, control_types: data.control_types }))
        if (data?.voltages?.length) setOptions(o => ({ ...o, voltages: data.voltages }))
      })
      .catch(() => {})
  }, [])

  const generateBom = useCallback(async () => {
    setLoading(true)
    setResult(null)
    try {
      const data = await generatePanelBom(params)
      setResult(data)
    } catch {
      setResult(null)
    } finally {
      setLoading(false)
    }
  }, [params])

  const exportCsv = useCallback(() => {
    if (!result?.items?.length) return
    const headers = ['Part Number', 'Qty', 'Role', 'Category', 'Brand', 'Notes']
    const rows = result.items.map(i =>
      [i.part_number, i.quantity, i.role, i.category, i.brand, i.notes || ''].map(v =>
        `"${String(v).replace(/"/g, '""')}"`
      ).join(',')
    )
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `panel-bom-${result.application}-${result.motor_power_kw}kW.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [result])

  const submitRfq = useCallback(async () => {
    if (!result?.items?.length || !rfqForm.email?.trim()) return
    setRfqSubmitting(true)
    setRfqSuccess(false)
    try {
      await submitBomRfq({
        items: result.items.map(i => ({ part_number: i.part_number, quantity: i.quantity })),
        email: rfqForm.email.trim(),
        company: rfqForm.company.trim() || undefined,
        contact_name: rfqForm.contact_name.trim() || undefined,
        message: rfqForm.message.trim() || undefined,
      })
      setRfqSuccess(true)
      setTimeout(() => { setRfqOpen(false); setRfqSuccess(false) }, 2000)
    } catch {
      // show error
    } finally {
      setRfqSubmitting(false)
    }
  }, [result, rfqForm])

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-14 px-4 text-white">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 flex items-center gap-3">
            <Wrench className="w-10 h-10 text-primary-400" />
            Panel Builder
          </h1>
          <p className="text-slate-300 text-lg">
            Configure industrial control panels and generate a complete BOM automatically.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Configuration */}
          <aside className="lg:w-72 shrink-0">
            <div className="sticky top-24 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-5">
                <Settings2 className="w-5 h-5" />
                Configuration
              </h2>
              <div className="space-y-5">
                <Select
                  variant="light"
                  label="Application"
                  value={params.application}
                  onChange={(v) => setParams((p) => ({ ...p, application: v }))}
                  options={options.applications.map((a) => ({ value: a.id, label: a.label }))}
                />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Motor Power (kW)</label>
                  <input
                    type="number"
                    min={0.18}
                    max={110}
                    step={0.1}
                    value={params.motor_power_kw}
                    onChange={e => setParams(p => ({ ...p, motor_power_kw: parseFloat(e.target.value) || 5.5 }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="text-xs text-slate-500 mt-0.5">0.18 – 110 kW</p>
                </div>
                <Select
                  variant="light"
                  label="Voltage"
                  value={params.voltage}
                  onChange={(v) => setParams((p) => ({ ...p, voltage: v }))}
                  options={options.voltages.map((v) => ({ value: v, label: v }))}
                />
                <Select
                  variant="light"
                  label="Control Type"
                  value={params.control_type}
                  onChange={(v) => setParams((p) => ({ ...p, control_type: v }))}
                  options={options.control_types.map((c) => ({ value: c.id, label: c.label }))}
                />
                <button
                  onClick={generateBom}
                  disabled={loading}
                  className="w-full py-3 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      Generate BOM
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {!result ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center">
                <Wrench className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No BOM generated yet</h3>
                <p className="text-slate-600 max-w-md mx-auto mb-6">
                  Configure your panel (application, motor power, voltage, control type) and click Generate BOM.
                </p>
                <button
                  onClick={generateBom}
                  disabled={loading}
                  className="px-6 py-3 rounded-lg bg-primary-500 hover:bg-primary-600 disabled:opacity-70 text-white font-medium"
                >
                  Generate BOM
                </button>
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm mb-4">
                  <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="font-semibold text-slate-900">Bill of Materials</h2>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {params.motor_power_kw} kW · {params.voltage} · {options.control_types.find(c => c.id === result.control_type)?.label} · {result.total_parts} line items
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={exportCsv}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <FileDown className="w-4 h-4" />
                        Export CSV
                      </button>
                      <button
                        onClick={() => setRfqOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium"
                      >
                        <Send className="w-4 h-4" />
                        Request RFQ
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="text-left px-4 py-3 font-medium text-slate-700">Part Number</th>
                          <th className="text-left px-4 py-3 font-medium text-slate-700">Qty</th>
                          <th className="text-left px-4 py-3 font-medium text-slate-700">Role</th>
                          <th className="text-left px-4 py-3 font-medium text-slate-700">Category</th>
                          <th className="text-left px-4 py-3 font-medium text-slate-700">Brand</th>
                          <th className="text-left px-4 py-3 font-medium text-slate-700 hidden sm:table-cell">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.items.map((item, idx) => (
                          <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="px-4 py-3">
                              <Link
                                href={`/search?q=${encodeURIComponent(item.part_number)}`}
                                className="font-mono font-medium text-primary-600 hover:underline"
                              >
                                {item.part_number}
                              </Link>
                            </td>
                            <td className="px-4 py-3">{item.quantity}</td>
                            <td className="px-4 py-3 text-slate-700">{item.role}</td>
                            <td className="px-4 py-3 text-slate-600">{item.category}</td>
                            <td className="px-4 py-3 text-slate-600">{item.brand}</td>
                            <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{item.notes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <p className="text-sm text-slate-500">
                  Recommendations are based on typical industrial configurations. Always verify suitability for your application.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* RFQ modal */}
      {rfqOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !rfqSubmitting && setRfqOpen(false)}>
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Request Quote for BOM</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={rfqForm.email}
                  onChange={e => setRfqForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                <input
                  type="text"
                  value={rfqForm.company}
                  onChange={e => setRfqForm(f => ({ ...f, company: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name</label>
                <input
                  type="text"
                  value={rfqForm.contact_name}
                  onChange={e => setRfqForm(f => ({ ...f, contact_name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                <textarea
                  rows={3}
                  value={rfqForm.message}
                  onChange={e => setRfqForm(f => ({ ...f, message: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setRfqOpen(false)}
                disabled={rfqSubmitting}
                className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={submitRfq}
                disabled={rfqSubmitting || !rfqForm.email?.trim()}
                className="flex-1 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium flex items-center justify-center gap-2"
              >
                {rfqSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {rfqSuccess ? 'Sent!' : 'Submit RFQ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
