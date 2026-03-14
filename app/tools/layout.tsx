import Link from 'next/link'
import { Wrench, Camera, FileSpreadsheet } from 'lucide-react'

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-6">
            <Link href="/tools" className="text-sm font-medium text-slate-600 hover:text-primary-600">
              Tools
            </Link>
            <Link href="/tools/scan-component" className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-primary-600">
              <Camera className="w-4 h-4" />
              Scan Component
            </Link>
            <Link href="/tools/bom-upload" className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-primary-600">
              <FileSpreadsheet className="w-4 h-4" />
              BOM Upload
            </Link>
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}
