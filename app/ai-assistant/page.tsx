'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MessageCircle, Send, Package, FileText, ChevronDown } from 'lucide-react'
import { API_BASE_URL } from '@/app/lib/constants'
import { resolveProductImage, PRODUCT_PLACEHOLDER_IMAGE } from '@/lib/imageResolver'

const API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL

interface Message {
  role: 'user' | 'assistant'
  content: string
  products?: any[]
  alternatives?: any[]
  productAlternatives?: Record<string, any[]>
  datasheetHint?: string
  rfqParts?: string[]
}

const EXAMPLE_QUERIES = [
  'I need a contactor for a 7.5kW motor',
  'Siemens PLC for S7-1200 system',
  '24V proximity sensor for metal detection',
  'Power supply 24V DC 5A',
]

function ProductResultCard({ p, alternatives = [] }: { p: any; alternatives?: any[] }) {
  const [showSpecs, setShowSpecs] = useState(false)
  const [imgSrc, setImgSrc] = useState(() => resolveProductImage(p?.part_number, p?.image_url ?? p?.image))
  const specs = p.specifications || {}
  const hasSpecs = specs && typeof specs === 'object' && Object.keys(specs).length > 0

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden hover:border-primary-200 transition-colors">
      <div className="flex flex-col sm:flex-row">
        <Link href={`/part-number/${encodeURIComponent(p.part_number)}`} className="block relative w-full sm:w-28 h-36 sm:h-28 bg-slate-50 shrink-0">
          <Image
            src={imgSrc}
            alt={p.part_number}
            fill
            className="object-contain p-2"
            sizes="112px"
            unoptimized={imgSrc.startsWith(API)}
            onError={() => setImgSrc(PRODUCT_PLACEHOLDER_IMAGE)}
          />
        </Link>
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link href={`/part-number/${encodeURIComponent(p.part_number)}`} className="font-mono font-semibold text-primary-600 hover:underline">
                {p.part_number}
              </Link>
              {(p.brand || p.manufacturer) && (
                <p className="text-sm text-slate-600 mt-0.5">{p.brand || p.manufacturer}</p>
              )}
              {p.category && <p className="text-xs text-slate-500">{p.category}</p>}
            </div>
            <div className="flex gap-2 shrink-0">
              {p.datasheet_url && (
                <a
                  href={p.datasheet_url.startsWith('http') ? p.datasheet_url : `${API}${p.datasheet_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-primary-600 border border-primary-200 hover:bg-primary-50"
                >
                  <FileText className="w-3.5 h-3.5" /> Datasheet
                </a>
              )}
              <Link
                href={`/rfq?part_number=${encodeURIComponent(p.part_number)}`}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-primary-600 border border-primary-500 hover:bg-primary-50"
              >
                RFQ
              </Link>
            </div>
          </div>
          {(p.voltage || p.current || hasSpecs) && (
            <div className="mt-2">
              <button
                onClick={() => setShowSpecs(!showSpecs)}
                className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
              >
                Specifications <ChevronDown className={`w-3 h-3 transition-transform ${showSpecs ? 'rotate-180' : ''}`} />
              </button>
              {showSpecs && (
                <div className="mt-1.5 text-xs text-slate-600 space-y-0.5">
                  {p.voltage && <p>Voltage: {p.voltage}</p>}
                  {p.current && <p>Current: {p.current}</p>}
                  {hasSpecs && Object.entries(specs).map(([k, v]) => (
                    <p key={k}>{k}: {String(v)}</p>
                  ))}
                </div>
              )}
            </div>
          )}
          {alternatives.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-100">
              <p className="text-xs font-medium text-slate-500 mb-1">Alternatives</p>
              <div className="flex flex-wrap gap-1">
                {alternatives.slice(0, 4).map((alt: any) => (
                  <Link
                    key={alt.part_number}
                    href={`/part-number/${encodeURIComponent(alt.part_number)}`}
                    className="text-xs font-mono text-primary-600 hover:underline"
                  >
                    {alt.part_number}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function send(query?: string) {
    const text = (query || input).trim()
    if (!text || loading) return

    setInput('')
    setMessages((m) => [...m, { role: 'user', content: text }])
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
          engineer_mode: false,
        }),
      })
      let data: any = {}
      try {
        data = await res.json()
      } catch {
        data = { text: 'Invalid response from server.' }
      }
      if (!res.ok) {
        data = { ...data, text: data?.detail || 'Backend error. Please try again.' }
      }

      const assistantMsg: Message = {
        role: 'assistant',
        content: data.text || 'No response.',
        products: data.products || [],
        alternatives: data.alternatives || [],
        productAlternatives: data.product_alternatives || {},
        datasheetHint: data.datasheet_hint,
        rfqParts: data.rfq_parts || [],
      }
      setMessages((m) => [...m, assistantMsg])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error'
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: `Sorry, I could not connect. (${msg}) Please ensure the API is reachable and try again.` },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="border-b border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4 text-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 flex items-center gap-3">
            <MessageCircle className="w-10 h-10 text-primary-400" />
            AI Engineering Assistant
          </h1>
          <p className="text-slate-300 text-lg">
            Ask about industrial automation components in natural language. Get product recommendations with specifications and datasheets.
          </p>
        </div>
      </div>

      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 flex flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-6 pb-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-600 mb-6">Try asking:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {EXAMPLE_QUERIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 hover:border-primary-300 hover:bg-primary-50/50 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[90%] rounded-2xl px-5 py-4 ${
                  msg.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white border border-slate-200 shadow-sm'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap" style={{ wordBreak: 'break-word' }}>
                  {msg.content.replace(/\*\*(.+?)\*\*/g, '$1')}
                </p>

                {msg.role === 'assistant' && msg.products && msg.products.length > 0 && (
                  <div className="mt-5 space-y-4">
                    <p className="text-sm font-semibold text-slate-700">Recommended products</p>
                    <div className="space-y-3">
                      {msg.products.map((p: any) => (
                        <ProductResultCard
                          key={p.part_number}
                          p={p}
                          alternatives={(msg.productAlternatives || {})[p.part_number] || []}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {msg.role === 'assistant' && msg.alternatives && msg.alternatives.length > 0 && !msg.products?.length && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-slate-700 mb-2">Alternatives</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {msg.alternatives.map((p: any) => (
                        <ProductResultCard key={p.part_number} p={p} />
                      ))}
                    </div>
                  </div>
                )}

                {msg.role === 'assistant' && msg.datasheetHint && (
                  <Link
                    href={`/part-number/${encodeURIComponent(msg.datasheetHint)}`}
                    className="inline-flex items-center gap-1.5 mt-4 text-sm text-primary-600 hover:underline"
                  >
                    <FileText className="w-4 h-4" />
                    View datasheet for {msg.datasheetHint}
                  </Link>
                )}

                {msg.role === 'assistant' && msg.rfqParts && msg.rfqParts.length > 0 && (
                  <Link
                    href={`/rfq?part_number=${encodeURIComponent(msg.rfqParts[0])}`}
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
                  >
                    <FileText className="w-4 h-4" />
                    Request Quote
                  </Link>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm">
                <span className="animate-pulse text-sm text-slate-500">Searching products…</span>
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            send()
          }}
          className="sticky bottom-0 bg-slate-50 pt-4 pb-2"
        >
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. I need a contactor for a 7.5kW motor"
              className="flex-1 px-5 py-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6 py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              Ask
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
