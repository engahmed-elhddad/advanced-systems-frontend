'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TrendingUp, AlertTriangle, ShieldCheck, Package, ChevronRight } from 'lucide-react'
import { BrandLogo } from '@/components/ui/BrandLogo'

interface ComponentIntelligenceData {
  demand_score: number
  demand_level: 'low' | 'medium' | 'high'
  search_count: number
  rfq_count: number
  supply_risk_score: number
  supply_risk_level: 'low' | 'medium' | 'medium_high' | 'high'
  supplier_count: number
  safer_alternatives: Array<{
    part_number?: string
    manufacturer?: string
    category?: string
    description?: string
    match_type?: string
  }>
}

interface ComponentIntelligenceProps {
  partNumber: string
  apiBase: string
  productBasePath?: string
}

const demandLabel: Record<string, string> = {
  low: 'Low demand',
  medium: 'Moderate demand',
  high: 'High demand',
}

const riskLabel: Record<string, string> = {
  low: 'Low supply risk',
  medium: 'Moderate supply risk',
  medium_high: 'Limited suppliers',
  high: 'High supply risk',
}

const riskColor: Record<string, string> = {
  low: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  medium: 'text-amber-600 bg-amber-50 border-amber-200',
  medium_high: 'text-orange-600 bg-orange-50 border-orange-200',
  high: 'text-red-600 bg-red-50 border-red-200',
}

export function ComponentIntelligence({
  partNumber,
  apiBase,
  productBasePath = '/part-number',
}: ComponentIntelligenceProps) {
  const [data, setData] = useState<ComponentIntelligenceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!partNumber) return
    fetch(`${apiBase}/product/${encodeURIComponent(partNumber)}/component-intelligence?days=90`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [partNumber, apiBase])

  if (loading || !data) return null

  const showAlternatives =
    (data.supply_risk_level === 'high' || data.supply_risk_level === 'medium_high') &&
    (data.safer_alternatives?.length ?? 0) > 0

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-600" />
          Component Intelligence
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Demand and supply risk based on search logs, RFQ activity, and supplier data
        </p>
      </div>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-slate-200 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Demand
            </h3>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium border ${
                  data.demand_level === 'high'
                    ? 'text-primary-600 bg-primary-50 border-primary-200'
                    : data.demand_level === 'medium'
                      ? 'text-amber-600 bg-amber-50 border-amber-200'
                      : 'text-slate-600 bg-slate-50 border-slate-200'
                }`}
              >
                {data.demand_level === 'high' && <TrendingUp className="w-4 h-4" />}
                {demandLabel[data.demand_level] ?? data.demand_level}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {data.search_count} search{data.search_count !== 1 ? 'es' : ''},{' '}
              {data.rfq_count} RFQ{data.rfq_count !== 1 ? 's' : ''} (90 days)
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Supply Risk
            </h3>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium border ${
                  riskColor[data.supply_risk_level] ?? 'text-slate-600 bg-slate-50 border-slate-200'
                }`}
              >
                {data.supply_risk_level === 'low' ? (
                  <ShieldCheck className="w-4 h-4" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
                {riskLabel[data.supply_risk_level] ?? data.supply_risk_level}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {data.supplier_count} supplier{data.supplier_count !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>

        {showAlternatives && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
            <h3 className="text-sm font-semibold text-amber-800 flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4" />
              Consider these alternatives for better supply security
            </h3>
            <div className="flex flex-wrap gap-2 mt-3">
              {data.safer_alternatives.slice(0, 6).map((alt) => (
                <Link
                  key={alt.part_number}
                  href={`${productBasePath}/${encodeURIComponent(alt.part_number ?? '')}`}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-amber-200 hover:border-amber-400 hover:shadow-sm transition-all group"
                >
                  {alt.manufacturer && (
                    <BrandLogo brand={alt.manufacturer} variant="square" logoClassName="h-5 max-w-[60px] object-contain" badgeClassName="hidden" />
                  )}
                  <span className="font-mono font-medium text-slate-900 group-hover:text-primary-600">
                    {alt.part_number}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary-600" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
