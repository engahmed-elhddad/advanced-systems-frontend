'use client'

import { useEffect, useRef, useState } from 'react'

/** Chromium BarcodeDetector — typings partial/missing in some TS DOM libs. */
declare global {
  interface BarcodeDetectorOptions {
    formats?: string[]
  }

  interface DetectedBarcode {
    format: string
    rawValue: string
  }

  class BarcodeDetector {
    constructor(barcodeDetectorOptions?: BarcodeDetectorOptions)
    detect(image: ImageBitmapSource): Promise<DetectedBarcode[]>
    static getSupportedFormats(): Promise<string[]>
  }
}
import { Button, Modal } from '@/components/ui'

/** Industrial cartons: Code 128 / Data Matrix common; QR/EAN for broader coverage. */
const BARCODE_FORMATS = ['code_128', 'code_39', 'ean_13', 'qr_code', 'data_matrix'] as const

export type BarcodeScannerProps = {
  open: boolean
  onClose: () => void
  onDetect: (mpn: string) => void
}

function isBarcodeDetectorApiMissing(): boolean {
  if (typeof window === 'undefined') return false
  return typeof BarcodeDetector !== 'function'
}

export function BarcodeScanner({ open, onClose, onDetect }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef(0)
  const stoppedRef = useRef(false)
  const onDetectRef = useRef(onDetect)
  const onCloseRef = useRef(onClose)
  const [constructorFailed, setConstructorFailed] = useState(false)

  onDetectRef.current = onDetect
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) {
      stoppedRef.current = false
      setConstructorFailed(false)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = 0
      }
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      const v = videoRef.current
      if (v) v.srcObject = null
      return
    }

    if (isBarcodeDetectorApiMissing()) {
      return
    }

    let detector: BarcodeDetector
    try {
      detector = new BarcodeDetector({ formats: [...BARCODE_FORMATS] })
    } catch {
      setConstructorFailed(true)
      return
    }

    const video = videoRef.current
    if (!video) return

    let alive = true

    const stopTracksAndVideo = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = 0
      }
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }

    void (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        })
        if (!alive) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        video.srcObject = stream
        await video.play()
      } catch {
        if (alive) onCloseRef.current()
        return
      }

      const scanFrame = async () => {
        if (!alive || stoppedRef.current) return
        try {
          const results = await detector.detect(video)
          for (const r of results) {
            const mpn = r.rawValue?.trim()
            if (mpn) {
              stoppedRef.current = true
              stopTracksAndVideo()
              onDetectRef.current(mpn)
              onCloseRef.current()
              return
            }
          }
        } catch {
          /* transient detect failures */
        }
        if (alive && !stoppedRef.current) {
          rafRef.current = requestAnimationFrame(() => {
            void scanFrame()
          })
        }
      }

      rafRef.current = requestAnimationFrame(() => {
        void scanFrame()
      })
    })()

    return () => {
      alive = false
      stopTracksAndVideo()
      stoppedRef.current = false
    }
  }, [open])

  const showUnsupported =
    open && (isBarcodeDetectorApiMissing() || constructorFailed)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="مسح الباركود"
      description="وجّه الكاميرا نحو الباركود (MPN)."
      size="md"
    >
      {showUnsupported ? (
        <div className="space-y-4 py-1">
          <p className="text-sm leading-relaxed text-[var(--color-foreground-muted)]">
            Camera scanning غير مدعوم في هذا المتصفح أو الجهاز (مثلاً Safari على iOS). جرّب Chrome أو Edge
            على Android حيث يكون BarcodeDetector مدعوماً عادةً.
          </p>
          <div className="flex justify-end">
            <Button type="button" variant="secondary" surface="dark" onClick={onClose}>
              إغلاق
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 py-1">
          <video
            ref={videoRef}
            className="aspect-video w-full rounded-xl border border-[var(--color-border)] bg-black object-cover"
            playsInline
            muted
            autoPlay
          />
          <p className="text-xs text-[var(--color-foreground-muted)]">
            أول باركود صالح يُملأ تلقائياً في حقل Part number ويُغلق الماسح.
          </p>
        </div>
      )}
    </Modal>
  )
}
