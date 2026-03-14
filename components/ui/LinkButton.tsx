import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type LinkButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'

export interface LinkButtonProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string
  variant?: LinkButtonVariant
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<LinkButtonVariant, string> = {
  primary:
    'inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-semibold shadow-[0_4px_14px_rgba(34,197,94,0.3)] hover:shadow-[0_6px_20px_rgba(34,197,94,0.4)] transition-all',
  secondary:
    'inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-gray-200 bg-white hover:border-primary-500 hover:bg-primary-50 text-gray-700 font-medium transition-colors',
  outline:
    'inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary-500 text-primary-600 hover:bg-primary-50 font-medium transition-colors',
  ghost:
    'inline-flex items-center gap-2 text-gray-700 hover:text-primary-600 font-medium transition-colors',
}

export function LinkButton({
  href,
  variant = 'secondary',
  children,
  className,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn(variantClasses[variant], className)}
      {...props}
    >
      {children}
    </Link>
  )
}
