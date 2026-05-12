import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Bot,
  FileText,
  FolderTree,
  Image,
  Package,
  Tag,
} from 'lucide-react'

export type AdminNavLink = { href: string; label: string; desc: string }

export type AdminNavSection = { title: string; icon: LucideIcon; links: AdminNavLink[] }

export const adminNavSections: AdminNavSection[] = [
  {
    title: 'Catalog',
    icon: Package,
    links: [
      { href: '/admin/products', label: 'Products', desc: 'Manage product records, inventory, and publishing' },
      { href: '/admin/products/new', label: 'New Product', desc: 'Create a product manually' },
      { href: '/admin/import', label: 'Import', desc: 'Upload and process catalog files' },
      { href: '/admin/warehouses', label: 'Warehouses', desc: 'Manage fulfillment warehouses and statuses' },
    ],
  },
  {
    title: 'Taxonomy',
    icon: Tag,
    links: [
      { href: '/admin/brands', label: 'Brands', desc: 'Brand profiles and aliases' },
      { href: '/admin/categories', label: 'Categories', desc: 'Category structure and schema links' },
      { href: '/admin/suppliers', label: 'Suppliers', desc: 'Supplier records and sourcing info' },
      { href: '/admin/attributes', label: 'Attributes', desc: 'Attribute dictionaries and value rules' },
    ],
  },
  {
    title: 'Content & Media',
    icon: Image,
    links: [
      { href: '/admin/image-manager', label: 'Image Manager', desc: 'Upload and manage product media' },
      { href: '/admin/crawl-images', label: 'Crawl Images', desc: 'Fetch from distributors' },
      { href: '/admin/seo-engine', label: 'SEO Engine', desc: 'Generate SEO pages and metadata at scale' },
    ],
  },
  {
    title: 'Sales & RFQ',
    icon: FileText,
    links: [
      { href: '/admin/rfq', label: 'RFQs', desc: 'Review and update RFQ lifecycle' },
      { href: '/admin/quotations', label: 'Quotations', desc: 'Build and send customer quotations' },
      { href: '/admin/orders', label: 'Orders', desc: 'Track approved and submitted orders' },
      { href: '/admin/leads', label: 'Leads', desc: 'CRM pipeline linked to RFQ activity' },
      { href: '/admin/rfq-instant', label: 'Instant RFQ', desc: 'Monitor instant RFQ channel traffic' },
      { href: '/admin/payments', label: 'Payments', desc: 'SLO metrics, stuck payments, drift inbox, and manual cron triggers' },
    ],
  },
  {
    title: 'Automation',
    icon: Bot,
    links: [
      { href: '/admin/enrich', label: 'Enrichment', desc: 'Run assisted product enrichment workflows' },
      { href: '/admin/intelligence', label: 'Part Intelligence', desc: 'Parse and classify part numbers' },
      { href: '/admin/pattern-rules', label: 'Pattern Rules', desc: 'Tune detection and matching rules' },
      { href: '/admin/data-engine', label: 'Data Engine', desc: 'Background discovery and enrichment jobs' },
      { href: '/admin/knowledge-graph', label: 'Knowledge Graph', desc: 'Explore part relationships' },
    ],
  },
  {
    title: 'Analytics',
    icon: BarChart3,
    links: [
      { href: '/admin/analytics', label: 'Analytics', desc: 'Search demand and RFQ trend insights' },
      { href: '/admin/stock', label: 'Stock Dashboard', desc: 'Inventory overview' },
      { href: '/admin/dashboard', label: 'Dashboard', desc: 'Operational KPIs and system health' },
    ],
  },
  {
    title: 'Platform',
    icon: FolderTree,
    links: [
      { href: '/admin/system', label: 'System Settings', desc: 'Environment and operational configuration' },
      { href: '/admin/system-tools', label: 'System Tools', desc: 'Run backend maintenance scripts' },
      { href: '/admin/users', label: 'Users', desc: 'Admin user access and role controls' },
      { href: '/admin/settings', label: 'App Settings', desc: 'UI and panel behavior settings' },
      { href: '/admin/ui-kit', label: 'UI Kit', desc: 'Design primitives and component reference' },
      { href: '/admin/dev', label: 'Developer Tools', desc: 'Diagnostics and development utilities' },
      { href: '/admin/ai', label: 'AI Workspace', desc: 'Admin AI copilots and assistants' },
    ],
  },
]
