import type { LucideIcon } from 'lucide-react'
import { Cpu, Zap, Activity, Gauge, Wifi, Settings } from 'lucide-react'

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  PLC: Cpu,
  Drive: Zap,
  Drives: Zap,
  Sensor: Activity,
  Sensors: Activity,
  HMI: Gauge,
  Communication: Wifi,
  default: Settings,
}

export function getCategoryIcon(categoryName: string): LucideIcon {
  const key = Object.keys(CATEGORY_ICONS).find((k) =>
    (categoryName || '').toLowerCase().includes(k.toLowerCase())
  )
  return CATEGORY_ICONS[key || 'default'] ?? CATEGORY_ICONS.default
}
