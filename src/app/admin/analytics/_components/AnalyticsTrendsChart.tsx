'use client'

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type DailyPoint = {
  date: string
  visits: number
  leads: number
  rfqs?: number
  unique_visitors?: number
}

export function AnalyticsTrendsChart({ data }: { data: DailyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="date"
          tickFormatter={(value) => String(value).slice(5)}
          tick={{ fontSize: 12, fill: "#64748b" }}
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="unique_visitors"
          stroke="#38bdf8"
          strokeWidth={2}
          dot={false}
          name="Unique visitors"
        />
        <Line type="monotone" dataKey="visits" stroke="#1d4ed8" strokeWidth={2} dot={false} name="Visit events" />
        <Line type="monotone" dataKey="leads" stroke="#16a34a" strokeWidth={2} dot={false} name="Lead events" />
        <Line type="monotone" dataKey="rfqs" stroke="#ea580c" strokeWidth={2} dot={false} name="RFQs created" />
      </LineChart>
    </ResponsiveContainer>
  )
}
