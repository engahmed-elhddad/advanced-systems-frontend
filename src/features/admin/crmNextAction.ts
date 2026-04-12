/** CRM next-action display helpers (matches backend rule engine). */

export function nextActionBadge(action: string | null | undefined): { emoji: string; text: string } {
  const key = (action || '').toLowerCase()
  const map: Record<string, { emoji: string; text: string }> = {
    call_now: { emoji: '🔥', text: 'Call now' },
    send_whatsapp: { emoji: '📲', text: 'WhatsApp' },
    send_quote: { emoji: '📩', text: 'Send quote' },
    follow_up_later: { emoji: '📌', text: 'Follow up' },
  }
  return map[key] ?? { emoji: '•', text: key ? key.replace(/_/g, ' ') : '—' }
}

export function urgencyChipClass(u: string | null | undefined): string {
  const x = (u || 'low').toLowerCase()
  if (x === 'high') return 'bg-red-500/15 text-red-100 ring-red-400/40'
  if (x === 'medium') return 'bg-amber-500/15 text-amber-50 ring-amber-400/35'
  return 'bg-white/10 text-white/55 ring-white/10'
}
