'use client'

import { PreviewShell } from '@/preview/PreviewShell'
import { componentRegistry } from '@/preview/registry'

export default function PreviewPage() {
  return <PreviewShell registry={componentRegistry} />
}
