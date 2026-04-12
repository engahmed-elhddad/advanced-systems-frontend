/**
 * AdvancedSystems design system — mirrors `app/globals.css` :root tokens.
 * Use for programmatic access; prefer CSS variables in styles.
 */
export const tokens = {
  color: {
    primary: '#0B1F3A',
    accent: '#FF7A00',
    bg: '#F5F7FA',
    surface: '#FFFFFF',
    adminSidebar: '#0B1F3A',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    status: {
      new: '#2563EB',
      contacted: '#CA8A04',
      quoted: '#9333EA',
      closed: '#16A34A',
    },
  },
  radius: {
    md: '10px',
    lg: '14px',
    xl: '0.75rem',
  },
  shadow: {
    soft: '0 10px 30px rgba(0, 0, 0, 0.15)',
    glowOrange: '0 0 32px rgba(255, 122, 0, 0.22), 0 0 64px rgba(255, 122, 0, 0.08)',
    glowSubtle: '0 0 24px rgba(255, 255, 255, 0.06)',
  },
  spacing: {
    /** 8pt grid: 8 / 16 / 24 / 32 / 48 / 64 px */
    grid: [8, 16, 24, 32, 48, 64] as const,
    contentMaxPx: 1400,
    contentPaddingPx: { sm: 24, lg: 32 },
  },
  transition: {
    standard: '300ms ease',
  },
} as const

export type DesignTokens = typeof tokens
