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
  products?: any[]
  alternatives?: any[]
  specsTable?: any[]
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
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: 'Sorry, I could not connect. Please try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-lg flex items-center justify-center transition-all"
        aria-label="Open AI Assistant"
      >
        <MessageCircle className="w-7 h-7" />
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Industrial Assistant</h3>
                <p className="text-xs text-slate-500">Search parts in natural language</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setEngineerMode(!engineerMode)}
                className={`p-2 rounded-lg transition-colors ${engineerMode ? 'bg-primary-100 text-primary-700' : 'text-slate-500 hover:bg-slate-100'}`}
                title="Engineer Mode"
              >
                <Settings2 className="w-4 h-4" />
              </button>
              <button onClick={() => setOpen(false)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">
                <p className="font-medium text-slate-700 mb-2">Try asking:</p>
                <ul className="space-y-1 text-left max-w-xs mx-auto">
                  <li>• Siemens contactor 9A 24V</li>
                  <li>• PLC module for S7 system</li>
                  <li>• Omron proximity sensor 24V</li>
                </ul>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-2.5 ${
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap" style={{ wordBreak: 'break-word' }}>
                    {msg.content.replace(/\*\*(.+?)\*\*/g, '$1')}
                  </p>
                  {msg.role === 'assistant' && msg.products && msg.products.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-medium text-slate-600">Matching products</p>
                      <div className="grid gap-2 max-h-64 overflow-y-auto">
                        {msg.products.slice(0, 4).map((p: any) => (
                          <ProductCard key={p.part_number} {...productToCardProps(p)} variant="compact" />
                        ))}
                      </div>
                    </div>
                  )}
                  {msg.role === 'assistant' && msg.alternatives && msg.alternatives.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-slate-600 mb-2">Alternatives</p>
                      <div className="space-y-2">
                        {msg.alternatives.slice(0, 3).map((p: any) => (
                          <Link
                            key={p.part_number}
                            href={`/product/${encodeURIComponent(p.part_number)}`}
                            className="block text-sm font-mono text-primary-600 hover:underline"
                          >
                            {p.part_number}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  {msg.role === 'assistant' && msg.specsTable && msg.specsTable.length > 0 && engineerMode && (
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-1">Part</th>
                            <th className="text-left py-1">Brand</th>
                            <th className="text-left py-1">Category</th>
                          </tr>
                        </thead>
                        <tbody>
                          {msg.specsTable.map((r: any) => (
                            <tr key={r.part_number} className="border-b border-slate-100">
                              <td className="font-mono py-1">{r.part_number}</td>
                              <td>{r.brand}</td>
                              <td>{r.category}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {msg.role === 'assistant' && msg.datasheetHint && (
                    <Link
                      href={`/product/${encodeURIComponent(msg.datasheetHint)}`}
                      className="inline-flex items-center gap-1 mt-2 text-xs text-primary-600 hover:underline"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View datasheet
                    </Link>
                  )}
                  {msg.role === 'assistant' && msg.rfqParts && msg.rfqParts.length > 0 && (
                    <Link
                      href={`/rfq?part_number=${encodeURIComponent(msg.rfqParts[0])}`}
                      className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-medium hover:bg-primary-700"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Request Quote
                    </Link>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-xl px-4 py-2">
                  <span className="animate-pulse text-sm text-slate-500">Searching…</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-slate-200">
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
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
