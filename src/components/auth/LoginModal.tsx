'use client'

import { useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { signInWithGoogleIdToken } from '@/lib/auth'
import { cn } from '@/lib/utils'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (resp: { credential?: string }) => void
            auto_select?: boolean
          }) => void
          renderButton: (
            parent: HTMLElement,
            opts: { theme?: string; size?: string; text?: string; width?: number; locale?: string },
          ) => void
          cancel: () => void
        }
      }
    }
  }
}

type Props = {
  open: boolean
  onClose: () => void
  onSignedIn: () => void
}

export function LoginModal({ open, onClose, onSignedIn }: Props) {
  const buttonHostRef = useRef<HTMLDivElement | null>(null)
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? ''

  const handleCredential = useCallback(
    async (credential?: string) => {
      if (!credential) return
      try {
        await signInWithGoogleIdToken(credential)
        onSignedIn()
      } catch (e) {
        console.error(e)
        alert(e instanceof Error ? e.message : 'Sign-in failed')
      }
    },
    [onSignedIn],
  )

  useEffect(() => {
    if (!open || !clientId || typeof document === 'undefined') return

    const existing = document.querySelector('script[data-as-google-gsi]')
    const mountButton = () => {
      const host = buttonHostRef.current
      const g = window.google
      if (!host || !g?.accounts?.id) return
      host.innerHTML = ''
      g.accounts.id.initialize({
        client_id: clientId,
        callback: (resp) => void handleCredential(resp.credential),
      })
      g.accounts.id.renderButton(host, {
        theme: 'filled_black',
        size: 'large',
        text: 'continue_with',
        width: 280,
        locale: 'en',
      })
    }

    if (existing) {
      const t = window.setTimeout(mountButton, 0)
      return () => window.clearTimeout(t)
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.dataset.asGoogleGsi = '1'
    script.onload = () => mountButton()
    document.body.appendChild(script)

    return () => {
      try {
        window.google?.accounts?.id?.cancel()
      } catch {
        /* ignore */
      }
    }
  }, [open, clientId, handleCredential])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="as-login-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.12]',
          'bg-gradient-to-br from-[#0d1830]/95 via-[#121a32]/90 to-[#1a0f28]/95',
          'shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_24px_80px_rgba(0,0,0,0.55)]',
          'backdrop-blur-2xl',
        )}
      >
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-orange-500/25 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-violet-600/20 blur-[90px]" />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative px-8 pb-8 pt-10 text-center">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.35em] text-orange-300/80">
            Advanced Systems
          </p>
          <h2 id="as-login-title" className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-[1.65rem]">
            Unlock full pricing
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/55">
            Sign in to view exact prices and availability
          </p>

          <div className="mt-8 flex flex-col items-center gap-4">
            {clientId ? (
              <div ref={buttonHostRef} className="flex min-h-[44px] items-center justify-center" />
            ) : (
              <p className="text-sm text-amber-200/90">
                Set <span className="font-mono text-xs">NEXT_PUBLIC_GOOGLE_CLIENT_ID</span> to enable Google sign-in.
              </p>
            )}
            <p className="text-[11px] text-white/35">We never post on your behalf. Pricing unlock only.</p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
