'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calculator } from 'lucide-react'

/** Motor current: I = P / (√3 × U × η × cosφ) ≈ P × 1.8 for 400V 3ph */
function MotorCurrentCalc() {
  const [power, setPower] = useState(7.5)
  const [voltage, setVoltage] = useState(400)
  const [phase, setPhase] = useState<'3ph' | '1ph'>('3ph')
  const current = phase === '3ph'
    ? (power * 1000) / (Math.sqrt(3) * voltage * 0.85 * 0.8)
    : (power * 1000) / (voltage * 0.85 * 0.8)
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Power (kW)</label>
        <input
          type="number"
          value={power}
          onChange={(e) => setPower(parseFloat(e.target.value) || 0)}
          step={0.1}
          min={0.1}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Voltage (V)</label>
        <input
          type="number"
          value={voltage}
          onChange={(e) => setVoltage(parseFloat(e.target.value) || 230)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Phase</label>
        <select
          value={phase}
          onChange={(e) => setPhase(e.target.value as '3ph' | '1ph')}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        >
          <option value="3ph">3-phase</option>
          <option value="1ph">1-phase</option>
        </select>
      </div>
      <div className="p-4 rounded-lg bg-primary-50 border border-primary-100">
        <p className="text-sm text-slate-600">Estimated full-load current</p>
        <p className="text-2xl font-bold text-primary-700">{current.toFixed(1)} A</p>
        <p className="text-xs text-slate-500 mt-1">Assumes η≈0.85, cosφ≈0.8</p>
      </div>
      <Link href="/search?q=contactor" className="text-sm text-primary-600 hover:underline">Find contactors →</Link>
    </div>
  )
}

/** Wire gauge: simplified ampacity / voltage drop */
function WireGaugeCalc() {
  const [current, setCurrent] = useState(10)
  const [length, setLength] = useState(20)
  const sizes = [
    { awg: '18', ampacity: 7, dropPerMeter: 0.05 },
    { awg: '16', ampacity: 10, dropPerMeter: 0.03 },
    { awg: '14', ampacity: 15, dropPerMeter: 0.02 },
    { awg: '12', ampacity: 20, dropPerMeter: 0.015 },
    { awg: '10', ampacity: 30, dropPerMeter: 0.01 },
    { awg: '6', ampacity: 55, dropPerMeter: 0.006 },
  ]
  const suggested = sizes.find((s) => s.ampacity >= current) || sizes[sizes.length - 1]
  const drop = (suggested.dropPerMeter * length * current / 1000).toFixed(2)
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Current (A)</label>
        <input
          type="number"
          value={current}
          onChange={(e) => setCurrent(parseFloat(e.target.value) || 0)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Cable length (m)</label>
        <input
          type="number"
          value={length}
          onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </div>
      <div className="p-4 rounded-lg bg-primary-50 border border-primary-100">
        <p className="text-sm text-slate-600">Recommended minimum</p>
        <p className="text-2xl font-bold text-primary-700">AWG {suggested.awg}</p>
        <p className="text-xs text-slate-500 mt-1">~{drop}V drop at {length}m, {current}A</p>
      </div>
      <Link href="/search?q=cable" className="text-sm text-primary-600 hover:underline">Find cables & terminals →</Link>
    </div>
  )
}

/** Power supply: 24V DC for control */
function PowerSupplyCalc() {
  const [sensors, setSensors] = useState(10)
  const [io, setIo] = useState(20)
  const sensorCurrent = sensors * 0.1
  const ioCurrent = io * 0.02
  const total = sensorCurrent + ioCurrent
  const recommended = Math.ceil(total * 1.5 / 0.5) * 0.5
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Sensors (24V, ~0.1A each)</label>
        <input
          type="number"
          value={sensors}
          onChange={(e) => setSensors(parseInt(e.target.value) || 0)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">PLC I/O points (est. 20mA each)</label>
        <input
          type="number"
          value={io}
          onChange={(e) => setIo(parseInt(e.target.value) || 0)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </div>
      <div className="p-4 rounded-lg bg-primary-50 border border-primary-100">
        <p className="text-sm text-slate-600">Total load ~{total.toFixed(2)} A</p>
        <p className="text-2xl font-bold text-primary-700">Use ≥ {recommended} A PSU</p>
        <p className="text-xs text-slate-500 mt-1">1.5× margin recommended</p>
      </div>
      <Link href="/search?q=power+supply+24V" className="text-sm text-primary-600 hover:underline">Find power supplies →</Link>
    </div>
  )
}

/** Contactor sizing from motor power */
function ContactorSizingCalc() {
  const [power, setPower] = useState(7.5)
  const current = (power * 1000) / (Math.sqrt(3) * 400 * 0.85 * 0.8)
  const sizes = [9, 12, 18, 25, 32, 40, 50, 65, 80]
  const suggested = sizes.find((s) => s >= current * 1.1) || 80
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Motor power (kW) @ 400V 3ph</label>
        <input
          type="number"
          value={power}
          onChange={(e) => setPower(parseFloat(e.target.value) || 0)}
          step={0.1}
          min={0.1}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </div>
      <div className="p-4 rounded-lg bg-primary-50 border border-primary-100">
        <p className="text-sm text-slate-600">Motor FLC ~{current.toFixed(1)} A</p>
        <p className="text-2xl font-bold text-primary-700">Contactor: {suggested}A</p>
        <p className="text-xs text-slate-500 mt-1">AC-3 duty, e.g. LC1D{suggested}</p>
      </div>
      <Link href={`/search?q=LC1D${suggested}`} className="text-sm text-primary-600 hover:underline">Find contactors →</Link>
    </div>
  )
}

const CALC_MAP: Record<string, { title: string; Component: React.FC }> = {
  'motor-current': { title: 'Motor current calculator', Component: MotorCurrentCalc },
  'wire-gauge': { title: 'Wire gauge calculator', Component: WireGaugeCalc },
  'power-supply': { title: 'Power supply sizing', Component: PowerSupplyCalc },
  'contactor-sizing': { title: 'Contactor sizing', Component: ContactorSizingCalc },
}

export default function CalculatorPage({ params }: { params: { slug: string } }) {
  const slug = params?.slug ?? ''
  const calc = CALC_MAP[slug]
  if (!slug || !calc) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Link href="/knowledge/calculators" className="text-primary-600">← Back to calculators</Link>
      </div>
    )
  }
  const { title, Component } = calc
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-xl mx-auto px-4 py-12">
        <Link href="/knowledge" className="text-sm text-slate-500 hover:text-primary-600 mb-4 inline-block">← Knowledge Hub</Link>
        <Link href="/knowledge/calculators" className="text-sm text-slate-500 hover:text-primary-600 mb-2 inline-block">← Calculators</Link>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-6">
          <Calculator className="w-7 h-7 text-primary-600" />
          {title}
        </h1>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <Component />
        </div>
      </div>
    </div>
  )
}
