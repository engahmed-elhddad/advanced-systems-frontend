import type { LucideIcon } from 'lucide-react'
import {
  Cpu,
  Zap,
  Activity,
  Monitor,
  Battery,
  ShieldCheck,
  RotateCw,
  Cog,
  Wifi,
  Settings,
} from 'lucide-react'

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  PLC: Cpu,
  Drive: Zap,
  Drives: Zap,
  HMI: Monitor,
  Sensor: Activity,
  Sensors: Activity,
  'Power Supply': Battery,
  'Safety Relay': ShieldCheck,
  'Soft Starters': RotateCw,
  'Soft Starter': RotateCw,
  Servo: Cog,
  Communication: Wifi,
  default: Settings,
}

export function getCategoryIcon(categoryName: string): LucideIcon {
  const key = Object.keys(CATEGORY_ICONS).find((k) =>
    (categoryName || '').toLowerCase().includes(k.toLowerCase())
  )
  return CATEGORY_ICONS[key || 'default'] ?? CATEGORY_ICONS.default
}
