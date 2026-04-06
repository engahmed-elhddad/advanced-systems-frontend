"use client"

import { apiFetch } from '@/lib/api'

import Link from "next/link"
import { useState, useEffect } from "react"
import { Network, Zap, RefreshCw, Search } from "lucide-react"

const API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
const ADMIN_KEY = "ADVANCED_SYSTEMS_ADMIN"

export default function KnowledgeGraphPage() {
  const [building, setBuilding] = useState(false)
  const [result, setResult] = useState<{ added?: number; status?: string } | null>(null)
  const [schema, setSchema] = useState<{ entity_types?: string[]; relationship_types?: string[]; relationships_count?: number } | null>(null)

  useEffect(() => {
    apiFetch(`${API}/knowledge-graph/schema`)
      .then((r) => r.json())
      .then(setSchema)
      .catch(() => {})
  }, [])

  const buildGraph = () => {
    setBuilding(true)
    setResult(null)
    apiFetch(`${API}/admin/knowledge-graph/build?limit=500`, {
      method: "POST",
      headers: { "api-key": ADMIN_KEY },
    })
      .then((r) => r.json())
      .then(setResult)
      .catch(() => setResult({ status: "error" }))
      .finally(() => setBuilding(false))
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Knowledge Graph</h1>
            <p className="text-gray-500 mt-1">
              Relationship-based model: Product → Brand, Category, Series, Alternatives, Similar
            </p>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
          >
            ← Dashboard
          </Link>
        </div>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Network className="w-5 h-5" />
            Entity Types & Relationships
          </h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li><strong>Entities:</strong> {schema?.entity_types?.join(", ") || "Product, Brand, Category, Series, Specification, Application"}</li>
            <li><strong>Product</strong> → Brand, Category, Series, Specification, Application</li>
            <li><strong>Product</strong> → Product (alternative, similar)</li>
            <li>Table: <code className="bg-gray-100 px-1 rounded">kg_relationships</code> – {schema?.relationships_count ?? "—"} relationships</li>
          </ul>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Search className="w-5 h-5" />
            Query System
          </h2>
          <p className="text-sm text-gray-600 mb-2">
            <code className="bg-gray-100 px-1 rounded">GET /knowledge-graph/query?kind=...&amp;...</code>
          </p>
          <ul className="space-y-1 text-sm text-gray-600">
            <li>• <code>kind=alternatives</code> + part_number – find alternatives</li>
            <li>• <code>kind=similar</code> + part_number – find similar</li>
            <li>• <code>kind=by_brand</code> + brand – find products by brand</li>
            <li>• <code>kind=by_category</code> + category – find products by category</li>
            <li>• <code>kind=by_specification</code> + spec_key, spec_value – find by spec</li>
          </ul>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Build Graph
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Creates alternative/similar links from same brand+category and same series. Run after adding products.
          </p>
          <button
            onClick={buildGraph}
            disabled={building}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {building ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Build Knowledge Graph
          </button>
          {result && (
            <div className="mt-4 p-3 rounded-lg bg-gray-50 text-sm">
              {result.added !== undefined && <p>Relationships added: {result.added}</p>}
              {result.status && <p>Status: {result.status}</p>}
            </div>
          )}
        </section>

        <p className="text-sm text-gray-500">
          Related products are shown automatically on product pages. Run &quot;Knowledge Graph Build&quot; from System Tools for batch processing.
        </p>
      </div>
    </div>
  )
}
