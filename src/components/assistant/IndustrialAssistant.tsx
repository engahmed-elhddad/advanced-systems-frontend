'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { MessageCircle, X, Send, Package, FileText, Settings2 } from 'lucide-react'
import { ProductCard } from '@/components/products/ProductCard'
import { productToCardProps } from '@/lib/productMappers'

const API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

interface Message {
  role: 'user' | 'assistant'
  content: string
  products?: unknown[]
  alternatives?: unknown[]
  specsTable?: unknown[]
  datasheetHint?: string
  rfqParts?: string[]
}

export function IndustrialAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [engineerMode, setEngineerMode] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    const userMsg: Message = { role: 'user', content: text }
    setMessages((m) => [...m, userMsg])
    setLoading(true)

    const history = messages.map((m) => ({ role: m.role, content: m.content }))
    history.push({ role: 'user', content: text })

    try {
      const res = await fetch(`${API}/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: history.slice(-6),
          engineer_mode: engineerMode,
        }),
      })
      const data = await res.json()

      const assistantMsg: Message = {
        role: 'assistant',
        content: data.text || 'No response.',
        products: data.products || [],
        alternatives: data.alternatives || [],
        specsTable: data.specs_table,
        datasheetHint: data.datasheet_hint,
        rfqParts: data.rfq_parts || [],
      }
      setMessages((m) => [...m, assistantMsg])
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Sorry, I could not connect. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FF5500] text-white shadow-lg shadow-orange-500/40 transition-all duration-300 hover:scale-[1.05] hover:brightness-110"
        aria-label="Open AI Assistant"
      >
        <MessageCircle className="h-7 w-7" />
      </button>

      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[min(560px,calc(100vh-6rem))] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d1f38]/95 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.04] px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF7A00] to-[#FF5500] shadow-md shadow-orange-500/30">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Industrial Assistant</h3>
                <p className="text-xs text-white/50">Natural language part search</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setEngineerMode(!engineerMode)}
                className={`rounded-xl p-2 transition-all duration-300 ${
                  engineerMode
                    ? 'bg-orange-500/20 text-orange-200 shadow-[0_0_16px_rgba(255,122,0,0.2)]'
                    : 'text-white/50 hover:bg-white/10 hover:text-white'
                }`}
                title="Engineer mode"
              >
                <Settings2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="py-8 text-center text-sm text-white/55">
                <p className="mb-2 font-medium text-white/80">Try asking:</p>
                <ul className="mx-auto max-w-xs space-y-1 text-left">
                  <li>• Siemens contactor 9A 24V</li>
                  <li>• PLC module for S7 system</li>
                  <li>• Omron proximity sensor 24V</li>
                </ul>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-2.5 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-[#FF7A00] to-[#FF5500] text-white shadow-md shadow-orange-500/25'
                      : 'border border-white/10 bg-white/5 text-white/90 backdrop-blur-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm" style={{ wordBreak: 'break-word' }}>
                    {msg.content.replace(/\*\*(.+?)\*\*/g, '$1')}
                  </p>
                  {msg.role === 'assistant' && msg.products && msg.products.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-semibold text-white/50">Matching products</p>
                      <div className="grid max-h-64 gap-2 overflow-y-auto">
                        {msg.products.slice(0, 4).map((p: unknown) => {
                          const part = p as Record<string, unknown>
                          const pn = String(part.part_number ?? '')
                          return (
                            <ProductCard key={pn} {...productToCardProps(p as never)} variant="compact" />
                          )
                        })}
                      </div>
                    </div>
                  )}
                  {msg.role === 'assistant' && msg.alternatives && msg.alternatives.length > 0 && (
                    <div className="mt-3">
                      <p className="mb-2 text-xs font-semibold text-white/50">Alternatives</p>
                      <div className="space-y-2">
                        {msg.alternatives.slice(0, 3).map((p: unknown) => {
                          const part = p as { part_number?: string }
                          const pn = part.part_number ?? ''
                          return (
                            <Link
                              key={pn}
                              href={`/products/${encodeURIComponent(pn)}`}
                              className="block font-mono text-sm text-orange-300 transition-colors hover:text-orange-200"
                            >
                              {pn}
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  {msg.role === 'assistant' && msg.specsTable && Array.isArray(msg.specsTable) && msg.specsTable.length > 0 && engineerMode && (
                    <div className="mt-3 overflow-x-auto rounded-lg border border-white/10">
                      <table className="w-full text-xs text-white/85">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/[0.04]">
                            <th className="py-2 pl-2 text-left font-semibold text-white/60">Part</th>
                            <th className="py-2 text-left font-semibold text-white/60">Brand</th>
                            <th className="py-2 pr-2 text-left font-semibold text-white/60">Category</th>
                          </tr>
                        </thead>
                        <tbody>
                          {msg.specsTable.map((r: unknown) => {
                            const row = r as { part_number?: string; brand?: string; category?: string }
                            return (
                              <tr key={row.part_number} className="border-b border-white/[0.06]">
                                <td className="py-1.5 pl-2 font-mono">{row.part_number}</td>
                                <td className="py-1.5">{row.brand}</td>
                                <td className="py-1.5 pr-2">{row.category}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {msg.role === 'assistant' && msg.datasheetHint && (
                    <Link
                      href={`/products/${encodeURIComponent(msg.datasheetHint)}`}
                      className="mt-2 inline-flex items-center gap-1 text-xs text-orange-300 transition-colors hover:text-orange-200"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      View product
                    </Link>
                  )}
                  {msg.role === 'assistant' && msg.rfqParts && msg.rfqParts.length > 0 && (
                    <Link
                      href={`/rfq?part_number=${encodeURIComponent(msg.rfqParts[0])}`}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#FF5500] px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-orange-500/25 transition-all hover:brightness-110"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Request quote
                    </Link>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-md">
                  <span className="animate-pulse text-sm text-white/50">Searching…</span>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-white/10 p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                send()
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe what you need…"
                className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 backdrop-blur-md transition-all duration-300 focus:border-orange-400/40 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#FF5500] p-2.5 text-white shadow-md shadow-orange-500/25 transition-all hover:brightness-110 disabled:opacity-45"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
