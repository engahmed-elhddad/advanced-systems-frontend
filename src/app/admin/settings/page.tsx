import { SlidersHorizontal } from "lucide-react"
import { Card } from "@/components/ui"

export default function AdminSettingsPage() {
  return (
    <Card hover={false} className="p-0" padding="none">
      <div className="p-6">
        <h1 className="flex items-center gap-2 text-xl font-semibold text-white">
          <SlidersHorizontal className="h-5 w-5 text-orange-300" />
          Settings
        </h1>
        <p className="mt-2 text-sm text-white/55">Placeholder for admin settings.</p>
      </div>
    </Card>
  )
}
