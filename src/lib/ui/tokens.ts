/**
 * Design tokens for the Advanced Systems UI.
 * Single source of truth for colors, spacing, and semantic values.
 */
export const tokens = {
  color: {
    primary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
  },
  radius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.25rem',
  },
  shadow: {
    soft: '0 2px 8px rgba(0, 0, 0, 0.06)',
    card: '0 4px 12px rgba(0, 0, 0, 0.08)',
    'card-hover': '0 12px 32px rgba(0, 0, 0, 0.12)',
    primary: '0 2px 8px rgba(34, 197, 94, 0.25)',
    'primary-hover': '0 4px 16px rgba(34, 197, 94, 0.3)',
  },
  transition: {
    fast: '150ms ease',
    normal: '200ms ease',
    slow: '250ms ease',
  },
  spacing: {
    page: { maxWidth: '80rem', paddingX: { sm: '1rem', md: '1.5rem', lg: '2rem' } },
    section: { gap: '1.5rem', header: '2rem' },
  },
} as const
