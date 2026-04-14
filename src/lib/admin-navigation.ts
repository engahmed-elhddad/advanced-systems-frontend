import type { LucideIcon } from 'lucide-react'
import {
  Package,
  FileText,
  Image,
  Tag,
  FolderTree,
  BarChart3,
  Zap,
  Settings,
} from 'lucide-react'

export type AdminNavLink = { href: string; label: string; desc: string }

export type AdminNavSection = { title: string; icon: LucideIcon; links: AdminNavLink[] }

export const adminNavSections: AdminNavSection[] = [
  {
    title: 'Product Manager',
    icon: Package,
    links: [
      { href: '/admin/add-product', label: 'Add Product', desc: 'Create a new product' },
      { href: '/admin/import', label: 'Import CSV', desc: 'Bulk import from CSV' },
      { href: '/admin/bulk-import', label: 'Bulk Import', desc: 'Bulk data import' },
    ],
  },
  {
    title: 'Image Manager',
    icon: Image,
    links: [
      { href: '/admin/image-manager', label: 'Product Image Manager', desc: 'Upload, replace, delete, set primary' },
      { href: '/admin/upload-images', label: 'Upload Images', desc: 'Legacy upload' },
      { href: '/admin/crawl-images', label: 'Crawl Images', desc: 'Fetch from distributors' },
    ],
  },
  {
    title: 'Data Enrichment',
    icon: Zap,
    links: [
      { href: '/admin/enrich', label: 'Enrich Products', desc: 'Auto-fill missing data' },
      { href: '/admin/intelligence', label: 'Part Intelligence', desc: 'Analyze part numbers' },
      { href: '/admin/pattern-rules', label: 'Pattern Rules', desc: 'Manage brand & category detection rules' },
      { href: '/admin/seo-engine', label: 'SEO Mass Generator', desc: 'Generate product pages from series' },
    ],
  },
  {
    title: 'RFQ Manager',
    icon: FileText,
    links: [
      { href: '/admin/rfq', label: 'RFQ Management', desc: 'View and respond to RFQs' },
      { href: '/admin/leads', label: 'CRM Leads', desc: 'Pipeline, notes, link to RFQs' },
    ],
  },
  {
    title: 'Brands & Categories',
    icon: Tag,
    links: [
      { href: '/admin/brands', label: 'Brands', desc: 'Add, edit, delete brands' },
      { href: '/admin/categories', label: 'Categories', desc: 'Add, edit, delete categories' },
      { href: '/admin/suppliers', label: 'Suppliers', desc: 'Manage supplier list' },
    ],
  },
  {
    title: 'Analytics',
    icon: BarChart3,
    links: [
      { href: '/admin/analytics', label: 'Industrial Analytics', desc: 'Search, RFQ trends & demand' },
      { href: '/admin/stock', label: 'Stock Dashboard', desc: 'Inventory overview' },
      { href: '/admin/ai', label: 'AI Assistant', desc: 'AI tools' },
      { href: '/admin/ui-kit', label: 'UI kit', desc: 'Design system (glass / industrial)' },
      { href: '/admin/dev', label: 'Dev Tools', desc: 'Developer utilities' },
    ],
  },
  {
    title: 'System Tools',
    icon: FolderTree,
    links: [
      { href: '/admin/system-tools', label: 'Scripts Manager', desc: 'Run enrichment, image, datasheet scripts' },
      { href: '/admin/data-engine', label: 'Data Engine', desc: 'Autonomous discovery & enrichment' },
      { href: '/admin/knowledge-graph', label: 'Knowledge Graph', desc: 'Build & explore product relationships' },
    ],
  },
  {
    title: 'Control Center',
    icon: Settings,
    links: [
      { href: '/admin/users', label: 'User Management', desc: 'Manage admin users & roles' },
      { href: '/admin/system', label: 'System Parameters', desc: 'Configure search, SEO, crawler, RFQ' },
    ],
  },
]
