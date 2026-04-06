import Link from 'next/link'
import { Calculator } from 'lucide-react'

const CALCULATORS = [
  {
    slug: 'motor-current',
    title: 'Motor current calculator',
    description: 'Estimate full-load current for 3-phase and single-phase motors from power (kW) and voltage.',
    icon: '⚡',
  },
  {
    slug: 'wire-gauge',
    title: 'Wire gauge calculator',
    description: 'Select conductor size for given current and cable length. Voltage drop and ampacity.',
    icon: '📏',
  },
  {
    slug: 'power-supply',
    title: 'Power supply sizing',
    description: 'Size 24V DC power supply for sensors, PLC I/O, and control circuits.',
    icon: '🔌',
  },
  {
    slug: 'contactor-sizing',
    title: 'Contactor sizing',
    description: 'Select contactor current rating from motor power and voltage.',
    icon: '🔧',
  },
]

export default function CalculatorsListPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/knowledge" className="text-sm text-slate-500 hover:text-primary-600 mb-4 inline-block">
            ← Knowledge Hub
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calculator className="w-7 h-7 text-primary-600" />
            Engineering Calculators
          </h1>
          <p className="text-slate-600 mt-2">
            Motor current, wire gauge, power supply sizing, and contactor selection tools.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid sm:grid-cols-2 gap-4">
          {CALCULATORS.map((c) => (
            <Link
              key={c.slug}
              href={`/knowledge/calculators/${c.slug}`}
              className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 hover:border-primary-200 hover:shadow-sm transition-all"
            >
              <span className="text-3xl">{c.icon}</span>
              <div>
                <h2 className="font-semibold text-slate-900">{c.title}</h2>
                <p className="text-sm text-slate-600 mt-1">{c.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
