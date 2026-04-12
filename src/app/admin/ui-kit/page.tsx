'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  Container,
  Input,
  Section,
  SortableTable,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type BadgeVariant,
  type TableColumn,
} from '@/components/ui'

type DemoRow = { id: string; sku: string; status: BadgeVariant }

const DEMO_ROWS: DemoRow[] = [
  { id: '1', sku: 'AS-240-MCB', status: 'new' },
  { id: '2', sku: 'AS-415-DRV', status: 'contacted' },
  { id: '3', sku: 'AS-110-PLC', status: 'quoted' },
  { id: '4', sku: 'AS-630-SW', status: 'closed' },
]

function makeSortableColumns(): TableColumn<DemoRow>[] {
  return [
    { key: 'sku', header: 'SKU', sortable: true },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => (
        <Badge variant={row.status} size="sm">
          {row.status}
        </Badge>
      ),
    },
  ]
}

export default function UiKitPage() {
  const [sortKey, setSortKey] = useState('sku')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const sorted = useMemo(() => sortDemo(DEMO_ROWS, sortKey, sortDir), [sortKey, sortDir])
  const cols = useMemo(() => makeSortableColumns(), [])

  return (
    <div className="relative min-h-screen pb-16">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-[#0B1F3A] via-[#1a2a4a] to-[#2a1f3a]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed -bottom-40 -right-32 -z-10 h-[min(100vw,560px)] w-[min(100vw,560px)] rounded-full bg-orange-500/[0.14] blur-[120px]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed -left-24 top-0 -z-10 h-[min(90vw,440px)] w-[min(90vw,440px)] rounded-full bg-purple-600/[0.14] blur-[120px]"
        aria-hidden
      />

      <Container>
        <div className="mb-12 flex flex-wrap items-end justify-between gap-4 pt-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-300/90">AdvancedSystems</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Design system</h1>
            <p className="mt-3 max-w-2xl text-base text-white/60">
              Single glassmorphism language: gradient accents, orange–violet glow, backdrop blur, and bold hierarchy.
              Used across marketplace and admin.
            </p>
          </div>
          <Button variant="ghost" asChild>
            <Link href="/admin">← Dashboard</Link>
          </Button>
        </div>

        <div className="space-y-16">
          <Section
            spacing="comfortable"
            tone="dark"
            title="Buttons"
            description="Primary gradient, glass secondary, ghost, outline, and destructive — hover scale and glow."
          >
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
              <Button loading>Loading</Button>
            </div>
          </Section>

          <Section
            spacing="comfortable"
            tone="dark"
            title="Cards"
            description="bg-white/5, backdrop-blur-xl, border-white/10, rounded-xl — hover lift and orange edge glow."
          >
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Card header="Stat tile">
                <p className="text-sm text-white/55">KPIs and summaries on the same glass shell.</p>
              </Card>
              <Card header="Navigation">
                <p className="text-sm text-white/55">Section headers use a subtle top tint strip.</p>
              </Card>
              <Card header="Detail panel">
                <p className="text-sm text-white/55">Variant prop is kept for API compatibility; visuals are unified.</p>
              </Card>
            </div>
          </Section>

          <Section spacing="comfortable" tone="dark" title="Badges" description="RFQ and status chips with soft colored glow.">
            <div className="flex flex-wrap gap-2">
              <Badge variant="new">new</Badge>
              <Badge variant="contacted">contacted</Badge>
              <Badge variant="quoted">quoted</Badge>
              <Badge variant="closed">closed</Badge>
              <Badge variant="pending" dot>
                pending
              </Badge>
              <Badge variant="success">success</Badge>
              <Badge variant="error">error</Badge>
            </div>
          </Section>

          <Section spacing="comfortable" tone="dark" title="Inputs" description="Glass fields with inner highlight and orange focus ring.">
            <div className="grid max-w-lg gap-6">
              <Input label="Search" placeholder="Part number or keyword…" leftIcon={<Search className="h-4 w-4" />} />
              <Input label="With helper" helperText="Shown when there is no validation error." placeholder="Optional" />
              <Input label="Error state" error="This field is required." placeholder="Invalid" defaultValue="x" />
            </div>
          </Section>

          <Section spacing="comfortable" tone="dark" title="Table" description="Composable glass table — same shell as data-heavy admin views.">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Column</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Row alpha</TableCell>
                  <TableCell className="text-right text-white/50">100</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Row beta</TableCell>
                  <TableCell className="text-right text-white/50">250</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Section>

          <Section spacing="comfortable" tone="dark" title="Sortable table" description="Column-driven grid with glass header and row hover.">
            <SortableTable<DemoRow>
              columns={cols}
              data={sorted}
              rowKey={(row) => row.id}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={(key, dir) => {
                setSortKey(key)
                setSortDir(dir)
              }}
            />
          </Section>
        </div>
      </Container>
    </div>
  )
}

function sortDemo(rows: DemoRow[], sortKey: string, sortDir: 'asc' | 'desc') {
  const copy = [...rows]
  copy.sort((a, b) => {
    const av = String(a[sortKey as keyof DemoRow] ?? '')
    const bv = String(b[sortKey as keyof DemoRow] ?? '')
    const cmp = av.localeCompare(bv)
    return sortDir === 'asc' ? cmp : -cmp
  })
  return copy
}
